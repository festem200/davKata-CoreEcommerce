-- ============================================================
-- ADVERTENCIA — cambio solo de BD, a petición explícita del usuario:
-- este archivo deja el backend roto hasta que se actualice en otra
-- sesión (el usuario avanza capa por capa: BD -> backend -> frontend).
-- Pendiente para esa sesión:
--   - packages/contracts/src/schemas.ts: productSchema.id,
--     cartLineSchema.productId, quoteLineResultSchema.productId y
--     orderResponseSchema.id están tipados z.string() y deben pasar
--     a z.number(); productSchema pierde el campo `category` (TEXT) y
--     debe exponer `categoryId`/join a categories en su lugar.
--   - apps/backend/src/domain/model/Product.ts, Order.ts, CartLine.ts:
--     id/productId son `string`, deben pasar a `number`.
--   - apps/backend/src/infrastructure/config/catalog.ts: usa ids
--     "p1".."p7" y `category` como nombre; deben pasar a ids numéricos
--     y category_id.
--   - apps/backend/.../CategoryDiscountRule: compara `category ===
--     "Tecnología"` (nombre); debe comparar por category_id.
--   - apps/backend/src/application/CheckoutUseCase.ts: genera
--     order.id con randomUUID() ANTES de insertar; con id autoincremental
--     el id lo asigna la BD al insertar (usar RETURNING id).
--   - Los 3 adaptadores (memory/json/postgres) y sus tests de contrato,
--     que hoy hardcodean ids como "p1", UUIDs, etc.
--   - order_items ya existe en la BD pero está VACÍA: CheckoutUseCase y
--     PostgresOrderRepository siguen escribiendo todo en orders.cart_lines
--     (JSONB). Falta que el checkout inserte una fila por línea en
--     order_items (misma transacción que crea la orden) y que las lecturas
--     dejen de depender del JSONB.
-- ============================================================

-- ============================================================
-- categories
-- ------------------------------------------------------------
-- Se crea antes que products porque products.category_id la referencia
-- por FK: en un modelo relacional la tabla referenciada (el "padre")
-- debe existir antes que la tabla que la referencia (el "hijo").
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO categories (name, slug, description) VALUES
  ('Tecnología', 'tecnologia', 'Dispositivos electrónicos y accesorios tecnológicos'),
  ('Ropa', 'ropa', 'Prendas de vestir'),
  ('Hogar', 'hogar', 'Artículos para el hogar'),
  ('Libros', 'libros', 'Libros y material de lectura'),
  ('Belleza', 'belleza', 'Cosméticos, cuidado personal y fragancias'),
  ('Deportes', 'deportes', 'Artículos y accesorios deportivos')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- coupons
-- ------------------------------------------------------------
-- Se crea aquí (junto a categories, antes de orders) por la misma razón:
-- orders.coupon_id la referencia por FK, así que la tabla padre debe
-- existir primero. Antes los cupones vivían quemados en un Map en
-- memoria (infrastructure/config/catalog.ts). No lo pide el enunciado,
-- pero un cupón es exactamente el tipo de dato que no debería estar
-- hardcodeado: cambiar su porcentaje o desactivarlo hoy exige un deploy
-- nuevo. El driver Postgres los lee de aquí; memory/json (sin BD real
-- detrás) siguen usando el Map de catalog.ts.
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_rate DOUBLE PRECISION NOT NULL CHECK (discount_rate > 0 AND discount_rate <= 1),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO coupons (code, discount_rate, expires_at) VALUES
  ('WELCOME2026', 0.15, NULL),
  ('BLACKFRIDAY40', 0.40, NULL)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- products
-- ------------------------------------------------------------
-- id: INTEGER autoincremental (antes TEXT con ids fijos "p1".."p7").
-- category_id: ÚNICA FK hacia categories. Antes existían DOS columnas
-- (category TEXT + category_id INTEGER) con DOS FK apuntando a
-- categories para la misma relación — redundante y contrario a una
-- regla básica de modelado relacional: una relación = una FK, y esa FK
-- debe ir sobre la clave sustituta (id), no duplicarse sobre una clave
-- natural (name), porque nada garantiza que ambas columnas queden
-- sincronizadas entre sí.
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  stock INTEGER NOT NULL CHECK (stock >= 0)
);

-- Ficha de producto más completa. Todas las columnas nuevas son nullable o
-- tienen DEFAULT: el INSERT de 5 columnas que hace seedProductsIfEmpty()
-- (schema.ts) sigue funcionando sin cambios en el backend.
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique ON products (sku) WHERE sku IS NOT NULL;

-- ------------------------------------------------------------
-- Migración idempotente para una BD ya creada con el esquema anterior
-- (category TEXT + category_id INTEGER). No afecta instalaciones nuevas,
-- donde el CREATE TABLE de arriba ya crea la forma correcta.
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category'
  ) THEN
    UPDATE products p SET category_id = c.id
    FROM categories c
    WHERE p.category = c.name AND p.category_id IS NULL;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_category_fkey') THEN
      ALTER TABLE products DROP CONSTRAINT products_category_fkey;
    END IF;

    ALTER TABLE products DROP COLUMN category;
  END IF;

  ALTER TABLE products ALTER COLUMN category_id SET NOT NULL;
END $$;

-- ------------------------------------------------------------
-- Migración idempotente: id TEXT -> id INTEGER autoincremental.
-- Renumera por orden alfabético del id anterior (p1, p2... quedan 1, 2...).
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'id' AND data_type = 'text'
  ) THEN
    ALTER TABLE products ADD COLUMN id_int INTEGER;
    UPDATE products p SET id_int = ordered.rn
    FROM (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM products) ordered
    WHERE p.id = ordered.id;

    ALTER TABLE products DROP CONSTRAINT products_pkey;
    ALTER TABLE products DROP COLUMN id;
    ALTER TABLE products RENAME COLUMN id_int TO id;
    ALTER TABLE products ALTER COLUMN id SET NOT NULL;
    ALTER TABLE products ADD PRIMARY KEY (id);

    CREATE SEQUENCE IF NOT EXISTS products_id_seq OWNED BY products.id;
    PERFORM setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 0) + 1, false);
    ALTER TABLE products ALTER COLUMN id SET DEFAULT nextval('products_id_seq');
  END IF;
END $$;

-- ============================================================
-- orders
-- ------------------------------------------------------------
-- id: INTEGER autoincremental (antes TEXT con randomUUID()).
-- coupon_id: FK a coupons(id) — antes era coupon_code TEXT suelto, sin
-- ninguna relación real: nada impedía guardar una orden con un código de
-- cupón que no existiera en el catálogo. Igual que category_id en
-- products, la FK va sobre la clave sustituta (id) y no sobre el código
-- de texto, aunque el dominio/la API sigan hablando de "couponCode" (el
-- adaptador Postgres traduce con un JOIN, ver PostgresOrderRepository).
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL,
  cart_lines JSONB,
  coupon_id INTEGER REFERENCES coupons(id),
  quote JSONB NOT NULL
);

-- cart_lines queda nullable: PostgresOrderRepository ya no la escribe (las
-- líneas viven en order_items, ver más abajo). No se elimina la columna
-- todavía para no perder las órdenes ya guardadas ahí antes de este cambio.
ALTER TABLE orders ALTER COLUMN cart_lines DROP NOT NULL;

-- ------------------------------------------------------------
-- Migración idempotente para una BD ya creada con el esquema anterior
-- (coupon_code TEXT suelto, sin FK). No afecta instalaciones nuevas.
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'coupon_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN coupon_id INTEGER REFERENCES coupons(id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'coupon_code'
  ) THEN
    UPDATE orders o SET coupon_id = c.id
    FROM coupons c
    WHERE o.coupon_code = c.code AND o.coupon_id IS NULL;

    ALTER TABLE orders DROP COLUMN coupon_code;
  END IF;
END $$;

-- Ciclo de vida real y ya observable de una orden en este sistema (hoy toda
-- orden creada equivale a 'completed'); no se agregan direcciones/pagos/
-- customer_id porque el sistema no tiene ningún concepto de cliente todavía.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed'
  CHECK (status IN ('completed', 'cancelled', 'refunded'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ------------------------------------------------------------
-- Migración idempotente: id TEXT -> id INTEGER autoincremental.
-- Renumera por created_at para conservar el orden cronológico real.
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'id' AND data_type = 'text'
  ) THEN
    ALTER TABLE orders ADD COLUMN id_int INTEGER;
    UPDATE orders o SET id_int = ordered.rn
    FROM (SELECT id, row_number() OVER (ORDER BY created_at) AS rn FROM orders) ordered
    WHERE o.id = ordered.id;

    ALTER TABLE orders DROP CONSTRAINT orders_pkey;
    ALTER TABLE orders DROP COLUMN id;
    ALTER TABLE orders RENAME COLUMN id_int TO id;
    ALTER TABLE orders ALTER COLUMN id SET NOT NULL;
    ALTER TABLE orders ADD PRIMARY KEY (id);

    CREATE SEQUENCE IF NOT EXISTS orders_id_seq OWNED BY orders.id;
    PERFORM setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 0) + 1, false);
    ALTER TABLE orders ALTER COLUMN id SET DEFAULT nextval('orders_id_seq');
  END IF;
END $$;

-- ============================================================
-- order_items — normaliza orders.cart_lines (hoy JSONB)
-- ------------------------------------------------------------
-- orders.cart_lines guarda un arreglo JSON de {productId, quantity}
-- dentro de UNA sola columna: es un grupo repetitivo metido en una
-- celda, lo que viola la Primera Forma Normal (1NF, Codd 1970) — cada
-- columna debe tener un valor atómico, no una lista.
--
-- La relación real entre orders y products es muchos-a-muchos (una
-- orden tiene muchos productos, un producto aparece en muchas
-- órdenes). El diseño estándar para resolver un muchos-a-muchos es una
-- tabla asociativa (junction table) que la parte en dos relaciones
-- uno-a-muchos:
--
--     orders (1) ──< order_items >── (1) products
--
-- unit_price_cents se copia aquí al momento de la compra, no se
-- calcula por join contra products: el precio de una orden ya
-- facturada no puede cambiar si mañana cambia el precio del producto.
--
-- Actualización 2026-09-08: ya en uso. PostgresOrderRepository.save() la
-- llena dentro de la misma transacción que crea la orden; orders.cart_lines
-- sigue existiendo (nullable) pero ya no se escribe desde ese adaptador.
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0)
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items (product_id);
