import type { Pool } from "pg";
import type { CartLine } from "../../../domain/model/CartLine.js";
import type { Order } from "../../../domain/model/Order.js";
import type { OrderRepository } from "../../../domain/ports/OrderRepository.js";
import type { QuoteResult } from "../../../domain/pricing/DiscountEngine.js";

interface OrderRow {
  readonly id: string;
  readonly idempotency_key: string;
  readonly created_at: Date;
  readonly cart_lines: CartLine[];
  readonly coupon_code: string | null;
  readonly quote: QuoteResult;
}

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    cartLines: row.cart_lines,
    couponCode: row.coupon_code,
    quote: row.quote,
  };
}

export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async save(order: Order): Promise<void> {
    await this.pool.query(
      `INSERT INTO orders (id, idempotency_key, created_at, cart_lines, coupon_code, quote)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        order.id,
        order.idempotencyKey,
        order.createdAt,
        JSON.stringify(order.cartLines),
        order.couponCode,
        JSON.stringify(order.quote),
      ],
    );
  }

  async findById(orderId: string): Promise<Order | null> {
    const result = await this.pool.query<OrderRow>("SELECT * FROM orders WHERE id = $1", [orderId]);
    const row = result.rows[0];
    return row ? rowToOrder(row) : null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Order | null> {
    const result = await this.pool.query<OrderRow>("SELECT * FROM orders WHERE idempotency_key = $1", [
      idempotencyKey,
    ]);
    const row = result.rows[0];
    return row ? rowToOrder(row) : null;
  }
}
