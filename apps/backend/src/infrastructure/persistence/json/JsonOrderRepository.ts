import type { Order } from "../../../domain/model/Order.js";
import type { OrderRepository } from "../../../domain/ports/OrderRepository.js";
import { AsyncMutex } from "./AsyncMutex.js";
import { fileExists, readJsonFile, writeJsonFile } from "./jsonFileStore.js";

type StoredOrder = Omit<Order, "createdAt"> & { createdAt: string };

export class JsonOrderRepository implements OrderRepository {
  private readonly mutex = new AsyncMutex();

  private constructor(private readonly filePath: string) {}

  static async create(filePath: string): Promise<JsonOrderRepository> {
    const repository = new JsonOrderRepository(filePath);

    if (!(await fileExists(filePath))) {
      await writeJsonFile(filePath, []);
    }

    return repository;
  }

  private async readAll(): Promise<Order[]> {
    const storedOrders = await readJsonFile<StoredOrder[]>(this.filePath);
    return storedOrders.map((order) => ({ ...order, createdAt: new Date(order.createdAt) }));
  }

  async save(order: Order): Promise<void> {
    await this.mutex.runExclusive(async () => {
      const orders = await this.readAll();
      orders.push(order);
      await writeJsonFile(this.filePath, orders);
    });
  }

  async findById(orderId: string): Promise<Order | null> {
    const orders = await this.readAll();
    return orders.find((order) => order.id === orderId) ?? null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Order | null> {
    const orders = await this.readAll();
    return orders.find((order) => order.idempotencyKey === idempotencyKey) ?? null;
  }
}
