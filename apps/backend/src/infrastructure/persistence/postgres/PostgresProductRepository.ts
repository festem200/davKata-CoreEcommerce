import type { Pool } from "pg";
import type { CartLine } from "../../../domain/model/CartLine.js";
import type { Product } from "../../../domain/model/Product.js";
import type { ProductRepository, StockShortage } from "../../../domain/ports/ProductRepository.js";

interface ProductRow {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly unit_price_cents: number;
  readonly stock: number;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unitPriceCents: row.unit_price_cents,
    stock: row.stock,
  };
}

/**
 * SQL explícito con `pg`, sin ORM: con Ports & Adapters el SQL debe vivir
 * DENTRO del adaptador — es justamente el punto del patrón Repository.
 *
 * El decremento de stock usa una guarda atómica (`WHERE stock >= $1`)
 * dentro de una transacción: bajo carga concurrente, Postgres serializa
 * los `UPDATE` sobre la misma fila con un lock de fila, así que nunca
 * queda un stock negativo aunque lleguen N checkouts simultáneos por el
 * último ítem disponible.
 */
export class PostgresProductRepository implements ProductRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<readonly Product[]> {
    const result = await this.pool.query<ProductRow>(
      "SELECT id, name, category, unit_price_cents, stock FROM products ORDER BY id",
    );
    return result.rows.map(rowToProduct);
  }

  async findById(productId: string): Promise<Product | null> {
    const result = await this.pool.query<ProductRow>(
      "SELECT id, name, category, unit_price_cents, stock FROM products WHERE id = $1",
      [productId],
    );
    const row = result.rows[0];
    return row ? rowToProduct(row) : null;
  }

  async decrementStock(lines: readonly CartLine[]): Promise<readonly StockShortage[]> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      const shortages: StockShortage[] = [];

      for (const line of lines) {
        const updateResult = await client.query<{ stock: number }>(
          "UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING stock",
          [line.quantity, line.productId],
        );

        if (updateResult.rowCount === 0) {
          const currentResult = await client.query<{ stock: number }>("SELECT stock FROM products WHERE id = $1", [
            line.productId,
          ]);
          shortages.push({
            productId: line.productId,
            requested: line.quantity,
            available: currentResult.rows[0]?.stock ?? 0,
          });
        }
      }

      await client.query(shortages.length > 0 ? "ROLLBACK" : "COMMIT");
      return shortages;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
