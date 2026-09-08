import type { Order } from "../../../domain/model/Order.js";
import type { OrderRepository } from "../../../domain/ports/OrderRepository.js";

export class InMemoryOrderRepository implements OrderRepository {
  private readonly ordersById = new Map<string, Order>();
  private readonly ordersByIdempotencyKey = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.ordersById.set(order.id, order);
    this.ordersByIdempotencyKey.set(order.idempotencyKey, order);
  }

  async findById(orderId: string): Promise<Order | null> {
    return this.ordersById.get(orderId) ?? null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Order | null> {
    return this.ordersByIdempotencyKey.get(idempotencyKey) ?? null;
  }
}
