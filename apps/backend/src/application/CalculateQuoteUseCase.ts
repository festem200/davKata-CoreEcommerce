import type { CartLine } from "../domain/model/CartLine.js";
import type { ProductRepository } from "../domain/ports/ProductRepository.js";
import type { DiscountEngine, QuoteResult } from "../domain/pricing/DiscountEngine.js";

/**
 * Cotiza el carrito sin persistir nada ni tocar stock — el front puede
 * llamarlo tantas veces como quiera mientras el cliente arma su carrito.
 */
export class CalculateQuoteUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly discountEngine: DiscountEngine,
  ) {}

  async execute(cartLines: readonly CartLine[], couponCode: string | null): Promise<QuoteResult> {
    const products = await this.productRepository.findAll();
    return this.discountEngine.calculate(cartLines, products, couponCode);
  }
}
