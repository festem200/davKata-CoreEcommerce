import { describe, expect, it } from "vitest";
import type { Product } from "../../domain/model/Product.js";
import type { NewOrder, OrderRepository } from "../../domain/ports/OrderRepository.js";
import type { ProductRepository } from "../../domain/ports/ProductRepository.js";
import { PostgresOrderRepository } from "./PostgresOrderRepository.js";
import { PostgresProductRepository } from "./PostgresProductRepository.js";
import { connectToTestDatabase, resetOrders, resetProducts } from "./testDatabase.js";

const postgresPool = await connectToTestDatabase();
if (!postgresPool) {
  console.warn(
    "[contract.test.ts] No hay un Postgres disponible en DATABASE_URL — se omite la suite de contrato (requiere Docker/Postgres corriendo).",
  );
}

/**
 * Suite de contrato del único adaptador de persistencia (Postgres): valida
 * que cumple el puerto (`ProductRepository`/`OrderRepository`) tal como lo
 * espera el dominio, sin acoplar los tests al detalle de implementación SQL.
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
  { id: 1, name: "Audífonos Bluetooth", category: "Tecnología", unitPriceCents: 4500, stock: 10 },
  { id: 2, name: "Power bank", category: "Tecnología", unitPriceCents: 3250, stock: 2 },
];

const productRepositoryAdapters: readonly ProductRepositoryAdapter[] = postgresPool
  ? [
      {
        name: "postgres",
        create: async (seed: readonly Product[]) => {
          await resetProducts(postgresPool, seed);
          return new PostgresProductRepository(postgresPool);
        },
      },
    ]
  : [];

const orderRepositoryAdapters: readonly OrderRepositoryAdapter[] = postgresPool
  ? [
      {
        name: "postgres",
        create: async () => {
          // order_items.product_id es FK a products: hay que sembrar el
          // catálogo antes de poder insertar una orden con esas líneas.
          await resetProducts(postgresPool, SEED_PRODUCTS);
          await resetOrders(postgresPool);
          return new PostgresOrderRepository(postgresPool);
        },
      },
    ]
  : [];

describe.each(productRepositoryAdapters)("ProductRepository — contrato ($name)", ({ create }) => {
  it("findAll devuelve el catálogo sembrado", async () => {
    const repository = await create(SEED_PRODUCTS);

    const products = await repository.findAll();

    expect(products).toHaveLength(SEED_PRODUCTS.length);
  });

  it("findById devuelve null si el producto no existe", async () => {
    const repository = await create(SEED_PRODUCTS);

    expect(await repository.findById(999)).toBeNull();
  });

  it("findById devuelve el producto correcto", async () => {
    const repository = await create(SEED_PRODUCTS);

    const product = await repository.findById(1);

    expect(product?.id).toBe(1);
    expect(product?.stock).toBe(10);
  });

  it("decrementStock reduce el stock cuando hay suficiente para todas las líneas", async () => {
    const repository = await create(SEED_PRODUCTS);

    const shortages = await repository.decrementStock([{ productId: 1, quantity: 3 }]);

    expect(shortages).toEqual([]);
    expect((await repository.findById(1))?.stock).toBe(7);
  });

  it("decrementStock es todo-o-nada: si una línea no tiene stock suficiente, no decrementa ninguna", async () => {
    const repository = await create(SEED_PRODUCTS);

    const shortages = await repository.decrementStock([
      { productId: 1, quantity: 1 },
      { productId: 2, quantity: 100 },
    ]);

    expect(shortages).toHaveLength(1);
    expect(shortages[0]?.productId).toBe(2);
    expect((await repository.findById(1))?.stock).toBe(10);
    expect((await repository.findById(2))?.stock).toBe(2);
  });
});

describe.each(orderRepositoryAdapters)("OrderRepository — contrato ($name)", ({ create }) => {
  function buildOrder(overrides: Partial<NewOrder> = {}): NewOrder {
    return {
      idempotencyKey: "key-1",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      cartLines: [{ productId: 1, quantity: 1 }],
      couponCode: null,
      quote: {
        originalSubtotalCents: 4500,
        finalTotalCents: 4500,
        totalDiscountCents: 0,
        effectiveDiscountRate: 0,
        capApplied: false,
        discounts: [],
        lines: [{ productId: 1, quantity: 1, unitPriceCents: 4500, originalSubtotalCents: 4500, finalAmountCents: 4500 }],
      },
      ...overrides,
    };
  }

  it("save + findById recupera la orden persistida", async () => {
    const repository = await create();
    const savedOrder = await repository.save(buildOrder());

    expect((await repository.findById(savedOrder.id))?.id).toBe(savedOrder.id);
  });

  it("findById devuelve null si la orden no existe", async () => {
    const repository = await create();

    expect(await repository.findById(999999)).toBeNull();
  });

  it("findByIdempotencyKey recupera la orden por su clave de idempotencia", async () => {
    const repository = await create();
    const savedOrder = await repository.save(buildOrder());

    expect((await repository.findByIdempotencyKey(savedOrder.idempotencyKey))?.id).toBe(savedOrder.id);
  });

  it("findByIdempotencyKey devuelve null si la clave no existe", async () => {
    const repository = await create();

    expect(await repository.findByIdempotencyKey("no-existe")).toBeNull();
  });
});
