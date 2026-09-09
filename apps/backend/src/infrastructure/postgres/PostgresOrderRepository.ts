import type { Pool, PoolClient } from "pg";
import type { CartLine } from "../../domain/model/CartLine.js";
import type { Order } from "../../domain/model/Order.js";
import type { NewOrder, OrderRepository } from "../../domain/ports/OrderRepository.js";
import type { QuoteResult } from "../../domain/pricing/DiscountEngine.js";

interface OrderRow {
  readonly id: number;
  readonly idempotency_key: string;
  readonly created_at: Date;
  readonly coupon_code: string | null;
  readonly quote: QuoteResult;
}

interface OrderItemRow {
  readonly product_id: number;
  readonly quantity: number;
}

const SELECT_ORDER = `
  SELECT o.id, o.idempotency_key, o.created_at, c.code AS coupon_code, o.quote
  FROM orders o
  LEFT JOIN coupons c ON c.id = o.coupon_id
`;

function rowToOrder(row: OrderRow, cartLines: readonly CartLine[]): Order {
  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    cartLines,
    couponCode: row.coupon_code,
    quote: row.quote,
  };
}

/**
 * `order_items` es la tabla asociativa que normaliza las líneas de la orden
 * (ver schema.sql): una fila por producto comprado, con el precio unitario
 * ya congelado al momento de la compra. `orders.cart_lines` (JSONB) dejó de
 * escribirse desde este adaptador.
 */
export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async save(order: NewOrder): Promise<Order> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const insertResult = await client.query<{ id: number }>(
        `INSERT INTO orders (idempotency_key, created_at, coupon_id, quote)
         VALUES ($1, $2, (SELECT id FROM coupons WHERE code = $3), $4) RETURNING id`,
        [order.idempotencyKey, order.createdAt, order.couponCode, JSON.stringify(order.quote)],
      );
      const orderId = insertResult.rows[0]!.id;

      for (const line of order.cartLines) {
        const quoteLine = order.quote.lines.find((candidate) => candidate.productId === line.productId);
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents)
           VALUES ($1, $2, $3, $4)`,
          [orderId, line.productId, line.quantity, quoteLine?.unitPriceCents ?? 0],
        );
      }

      await client.query("COMMIT");
      return { ...order, id: orderId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(orderId: number): Promise<Order | null> {
    const result = await this.pool.query<OrderRow>(
      `${SELECT_ORDER} WHERE o.id = $1`,
      [orderId],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return rowToOrder(row, await this.findCartLines(this.pool, row.id));
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Order | null> {
    const result = await this.pool.query<OrderRow>(
      `${SELECT_ORDER} WHERE o.idempotency_key = $1`,
      [idempotencyKey],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return rowToOrder(row, await this.findCartLines(this.pool, row.id));
  }

  private async findCartLines(client: Pool | PoolClient, orderId: number): Promise<readonly CartLine[]> {
    const result = await client.query<OrderItemRow>(
      "SELECT product_id, quantity FROM order_items WHERE order_id = $1 ORDER BY id",
      [orderId],
    );
    return result.rows.map((row) => ({ productId: row.product_id, quantity: row.quantity }));
  }
}
