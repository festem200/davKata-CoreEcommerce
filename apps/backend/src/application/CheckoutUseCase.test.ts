import { describe, expect, it } from "vitest";
import { DiscountEngine } from "../domain/pricing/DiscountEngine.js";
import { DiscountRuleFactory } from "../domain/pricing/DiscountRuleFactory.js";
import { FakeOrderRepository } from "../test-support/FakeOrderRepository.js";
import { FakeProductRepository } from "../test-support/FakeProductRepository.js";
import { CheckoutUseCase, InsufficientStockException } from "./CheckoutUseCase.js";

const CATALOG = [{ id: 4, name: "Power bank", category: "Tecnología", unitPriceCents: 3250, stock: 2 }];

function buildUseCase() {
  const productRepository = new FakeProductRepository(CATALOG);
  const orderRepository = new FakeOrderRepository();
  const engine = new DiscountEngine(
    DiscountRuleFactory.create({ ruleOrder: ["category-discount", "volume-discount", "coupon-discount"], coupons: new Map() }),
  );
  const useCase = new CheckoutUseCase(productRepository, orderRepository, engine, () => new Date("2026-01-01T00:00:00Z"));

  return { useCase, productRepository, orderRepository };
}

describe("CheckoutUseCase", () => {
  it("decrementa el stock y persiste la orden", async () => {
    const { useCase, productRepository } = buildUseCase();

    const order = await useCase.execute({
      cartLines: [{ productId: 4, quantity: 1 }],
      couponCode: null,
      idempotencyKey: "key-1",
    });

    expect(order.id).toBe(1);
    expect((await productRepository.findById(4))?.stock).toBe(1);
  });

  it("rechaza el checkout si el stock es insuficiente y no persiste ninguna orden", async () => {
    const { useCase, orderRepository } = buildUseCase();

    await expect(
      useCase.execute({
        cartLines: [{ productId: 4, quantity: 3 }],
        couponCode: null,
        idempotencyKey: "key-2",
      }),
    ).rejects.toThrow(InsufficientStockException);

    expect(await orderRepository.findByIdempotencyKey("key-2")).toBeNull();
  });

  it("es idempotente: un reintento con la misma clave devuelve la orden ya creada sin volver a tocar el stock", async () => {
    const { useCase, productRepository } = buildUseCase();
    const input = { cartLines: [{ productId: 4, quantity: 1 }], couponCode: null, idempotencyKey: "key-3" };

    const firstOrder = await useCase.execute(input);
    const secondOrder = await useCase.execute(input);

    expect(secondOrder).toEqual(firstOrder);
    expect((await productRepository.findById(4))?.stock).toBe(1); // no se decrementó dos veces
  });
});
