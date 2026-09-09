import type { Order } from "../model/Order.js";

/**
 * Orden sin `id`: con PKs autoincrementales el id lo asigna quien persiste
 * (la BD, o el contador del adaptador in-memory/json), no quien la arma.
 */
export type NewOrder = Omit<Order, "id">;

export interface OrderRepository {
  /** Persiste la orden y devuelve la versión completa, con el id ya asignado. */
  save(order: NewOrder): Promise<Order>;
  findById(orderId: number): Promise<Order | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<Order | null>;
}
