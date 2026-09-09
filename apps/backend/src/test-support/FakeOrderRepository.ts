import type { Order } from "../domain/model/Order.js";
import type { NewOrder, OrderRepository } from "../domain/ports/OrderRepository.js";

/**
 * Test double en memoria del puerto OrderRepository — SOLO para tests
 * unitarios rápidos, nunca se usa en producción (ver FakeProductRepository).
 */
export class FakeOrderRepository implements OrderRepository {
  private readonly ordersById = new Map<number, Order>();
  private readonly ordersByIdempotencyKey = new Map<string, Order>();
  private nextId = 1;

  async save(order: NewOrder): Promise<Order> {
    const savedOrder: Order = { ...order, id: this.nextId++ };
    this.ordersById.set(savedOrder.id, savedOrder);
    this.ordersByIdempotencyKey.set(savedOrder.idempotencyKey, savedOrder);
    return savedOrder;
  }

  async findById(orderId: number): Promise<Order | null> {
    return this.ordersById.get(orderId) ?? null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Order | null> {
    return this.ordersByIdempotencyKey.get(idempotencyKey) ?? null;
  }
}
