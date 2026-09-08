import type { Order } from "../model/Order.js";

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(orderId: string): Promise<Order | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<Order | null>;
}
