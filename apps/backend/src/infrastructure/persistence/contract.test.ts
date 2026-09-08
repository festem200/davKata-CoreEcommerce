import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Order } from "../../domain/model/Order.js";
import type { Product } from "../../domain/model/Product.js";
import type { OrderRepository } from "../../domain/ports/OrderRepository.js";
import type { ProductRepository } from "../../domain/ports/ProductRepository.js";
import { JsonOrderRepository } from "./json/JsonOrderRepository.js";
import { JsonProductRepository } from "./json/JsonProductRepository.js";
import { InMemoryOrderRepository } from "./memory/InMemoryOrderRepository.js";
import { InMemoryProductRepository } from "./memory/InMemoryProductRepository.js";
import { PostgresOrderRepository } from "./postgres/PostgresOrderRepository.js";
import { PostgresProductRepository } from "./postgres/PostgresProductRepository.js";
import { connectToTestDatabase, resetOrders, resetProducts } from "./postgres/testDatabase.js";

function tempFilePath(prefix: string): string {
  return join(tmpdir(), `core-ecommerce-contract-${prefix}-${randomUUID()}.json`);
}

const postgresPool = await connectToTestDatabase();
if (!postgresPool) {
  console.warn(
    "[contract.test.ts] No hay un Postgres disponible en DATABASE_URL — se omite el adaptador 'postgres' de la suite de contrato.",
  );
}

/**
 * Suite de contrato: se ejecuta contra CADA adaptador de persistencia
 * (memory, json, postgres). Si un adaptador no la pasa, no es un
 * adaptador válido — sin importar cómo esté implementado por dentro.
 */

interface ProductRepositoryAdapter {
  readonly name: string;
  create: (seed: readonly Product[]) => ProductRepository | Promise<ProductRepository>;
}

interface OrderRepositoryAdapter {
  readonly name: string;
  create: () => OrderRepository | Promise<OrderRepository>;
}

const SEED_PRODUCTS: readonly Product[] = [
  { id: "p1", name: "Audífonos Bluetooth", category: "Tecnología", unitPriceCents: 4500, stock: 10 },
  { id: "p2", name: "Power bank", category: "Tecnología", unitPriceCents: 3250, stock: 2 },
];

const productRepositoryAdapters: readonly ProductRepositoryAdapter[] = [
  { name: "memory", create: (seed) => new InMemoryProductRepository(seed) },
  { name: "json", create: (seed) => JsonProductRepository.create(tempFilePath("products"), seed) },
  ...(postgresPool
    ? [
        {
          name: "postgres",
          create: async (seed: readonly Product[]) => {
            await resetProducts(postgresPool, seed);
            return new PostgresProductRepository(postgresPool);
          },
        },
      ]
    : []),
];

const orderRepositoryAdapters: readonly OrderRepositoryAdapter[] = [
  { name: "memory", create: () => new InMemoryOrderRepository() },
  { name: "json", create: () => JsonOrderRepository.create(tempFilePath("orders")) },
  ...(postgresPool
    ? [
        {
          name: "postgres",
          create: async () => {
            await resetOrders(postgresPool);
            return new PostgresOrderRepository(postgresPool);
          },
        },
      ]
    : []),
];

describe.each(productRepositoryAdapters)("ProductRepository — contrato ($name)", ({ create }) => {
  it("findAll devuelve el catálogo sembrado", async () => {
    const repository = await create(SEED_PRODUCTS);

    const products = await repository.findAll();

    expect(products).toHaveLength(SEED_PRODUCTS.length);
  });

  it("findById devuelve null si el producto no existe", async () => {
    const repository = await create(SEED_PRODUCTS);

    expect(await repository.findById("no-existe")).toBeNull();
  });

  it("findById devuelve el producto correcto", async () => {
    const repository = await create(SEED_PRODUCTS);

    const product = await repository.findById("p1");

    expect(product?.id).toBe("p1");
    expect(product?.stock).toBe(10);
  });

  it("decrementStock reduce el stock cuando hay suficiente para todas las líneas", async () => {
    const repository = await create(SEED_PRODUCTS);

    const shortages = await repository.decrementStock([{ productId: "p1", quantity: 3 }]);

    expect(shortages).toEqual([]);
    expect((await repository.findById("p1"))?.stock).toBe(7);
  });

  it("decrementStock es todo-o-nada: si una línea no tiene stock suficiente, no decrementa ninguna", async () => {
    const repository = await create(SEED_PRODUCTS);

    const shortages = await repository.decrementStock([
      { productId: "p1", quantity: 1 },
      { productId: "p2", quantity: 100 },
    ]);

    expect(shortages).toHaveLength(1);
    expect(shortages[0]?.productId).toBe("p2");
    expect((await repository.findById("p1"))?.stock).toBe(10);
    expect((await repository.findById("p2"))?.stock).toBe(2);
  });
});

describe.each(orderRepositoryAdapters)("OrderRepository — contrato ($name)", ({ create }) => {
  function buildOrder(overrides: Partial<Order> = {}): Order {
    return {
      id: "order-1",
      idempotencyKey: "key-1",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      cartLines: [{ productId: "p1", quantity: 1 }],
      couponCode: null,
      quote: {
        originalSubtotalCents: 4500,
        finalTotalCents: 4500,
        totalDiscountCents: 0,
        effectiveDiscountRate: 0,
        capApplied: false,
        discounts: [],
        lines: [],
      },
      ...overrides,
    };
  }

  it("save + findById recupera la orden persistida", async () => {
    const repository = await create();
    const order = buildOrder();

    await repository.save(order);

    expect((await repository.findById(order.id))?.id).toBe(order.id);
  });

  it("findById devuelve null si la orden no existe", async () => {
    const repository = await create();

    expect(await repository.findById("no-existe")).toBeNull();
  });

  it("findByIdempotencyKey recupera la orden por su clave de idempotencia", async () => {
    const repository = await create();
    const order = buildOrder();

    await repository.save(order);

    expect((await repository.findByIdempotencyKey(order.idempotencyKey))?.id).toBe(order.id);
  });

  it("findByIdempotencyKey devuelve null si la clave no existe", async () => {
    const repository = await create();

    expect(await repository.findByIdempotencyKey("no-existe")).toBeNull();
  });
});
