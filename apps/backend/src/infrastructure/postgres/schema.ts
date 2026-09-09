import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool } from "pg";
import type { Product } from "../../domain/model/Product.js";

const SCHEMA_PATH = join(dirname(fileURLToPath(import.meta.url)), "schema.sql");
const SCHEMA_LOCK_ID = 727_001;

/**
 * Aplica `schema.sql` de forma segura ante arranques concurrentes (varios
 * procesos/tests conectando a la vez): un `pg_advisory_lock` de sesión
 * evita que dos `CREATE TABLE IF NOT EXISTS` simultáneos choquen en los
 * catálogos internos de Postgres.
 */
export async function applySchema(pool: Pool): Promise<void> {
  const schema = await readFile(SCHEMA_PATH, "utf-8");
  const client = await pool.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1)", [SCHEMA_LOCK_ID]);
    await client.query(schema);
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [SCHEMA_LOCK_ID]);
    client.release();
  }
}

/**
 * Siembra el catálogo SOLO si la tabla está vacía — para que reiniciar el
 * contenedor no reviva el stock original y pisе órdenes ya procesadas.
 */
export async function seedProductsIfEmpty(pool: Pool, seed: readonly Product[]): Promise<void> {
  const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM products");
  if (Number(rows[0]?.count ?? "0") > 0) {
    return;
  }

  for (const product of seed) {
    await pool.query(
      `INSERT INTO products (name, category_id, unit_price_cents, stock, description, image_url, sku, brand)
       VALUES ($1, (SELECT id FROM categories WHERE name = $2), $3, $4, $5, $6, $7, $8)`,
      [
        product.name,
        product.category,
        product.unitPriceCents,
        product.stock,
        product.description ?? null,
        product.imageUrl ?? null,
        product.sku ?? null,
        product.brand ?? null,
      ],
    );
  }
}
