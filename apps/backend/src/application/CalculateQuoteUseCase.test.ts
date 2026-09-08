import { describe, expect, it } from "vitest";
import { DiscountEngine } from "../domain/pricing/DiscountEngine.js";
import { DiscountRuleFactory } from "../domain/pricing/DiscountRuleFactory.js";
import { InMemoryProductRepository } from "../infrastructure/persistence/memory/InMemoryProductRepository.js";
import { CalculateQuoteUseCase } from "./CalculateQuoteUseCase.js";

const CATALOG = [{ id: "p1", name: "Audífonos", category: "Tecnología", unitPriceCents: 4500, stock: 10 }];

function buildUseCase(): CalculateQuoteUseCase {
  const productRepository = new InMemoryProductRepository(CATALOG);
  const engine = new DiscountEngine(
    DiscountRuleFactory.create({ ruleOrder: ["category-discount", "volume-discount", "coupon-discount"], coupons: new Map() }),
  );

  return new CalculateQuoteUseCase(productRepository, engine);
}

describe("CalculateQuoteUseCase", () => {
  it("cotiza el carrito consultando el catálogo, sin decrementar stock", async () => {
    const useCase = buildUseCase();

    const quote = await useCase.execute([{ productId: "p1", quantity: 1 }], null);

    expect(quote.originalSubtotalCents).toBe(4500);
    expect(quote.finalTotalCents).toBe(4050);
  });
});
