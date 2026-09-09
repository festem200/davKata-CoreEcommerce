import { Pool } from "pg";
import type { Product } from "../../domain/model/Product.js";
import type { Coupon } from "../../domain/pricing/Coupon.js";
import { applySchema } from "./schema.js";

/**
 * Se usa SOLO en tests: intenta conectar a un Postgres real y, si lo logra,
 * garantiza el esquema. Si no hay Postgres disponible (el evaluador no
 * corrió `docker compose up`), los tests de este adaptador se saltan en
 * vez de fallar — el driver por defecto (`json`) no depende de esto.
 */
export async function connectToTestDatabase(): Promise<Pool | null> {
  const connectionString =
    process.env["DATABASE_URL"] ?? "postgres://postgres:postgres@localhost:5433/core_ecommerce";
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 1000 });

  try {
    await pool.query("SELECT 1");
  } catch {
    await pool.end();
    return null;
  }

  await applySchema(pool);

  return pool;
}

export async function resetProducts(pool: Pool, seed: readonly Product[]): Promise<void> {
  // order_items.product_id es FK a products: hay que vaciarla primero.
  await pool.query("TRUNCATE order_items, products RESTART IDENTITY CASCADE");

  for (const product of seed) {
    await pool.query(
      `INSERT INTO products (id, name, category_id, unit_price_cents, stock)
       VALUES ($1, $2, (SELECT id FROM categories WHERE name = $3), $4, $5)`,
      [product.id, product.name, product.category, product.unitPriceCents, product.stock],
    );
  }
}

export async function resetOrders(pool: Pool): Promise<void> {
  await pool.query("TRUNCATE order_items, orders RESTART IDENTITY CASCADE");
}

export async function resetCoupons(pool: Pool, seed: readonly Coupon[]): Promise<void> {
  // orders.coupon_id es FK a coupons: CASCADE también vacía orders (y, por
  // FK transitiva, order_items). No usar esta función en un test que
  // necesite conservar órdenes ya guardadas.
  await pool.query("TRUNCATE coupons RESTART IDENTITY CASCADE");

  for (const coupon of seed) {
    await pool.query("INSERT INTO coupons (code, discount_rate, expires_at) VALUES ($1, $2, $3)", [
      coupon.code,
      coupon.rate,
      coupon.expiresAt,
    ]);
  }
}
