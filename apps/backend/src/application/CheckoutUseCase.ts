import type { CartLine } from "../domain/model/CartLine.js";
import type { Order } from "../domain/model/Order.js";
import type { OrderRepository } from "../domain/ports/OrderRepository.js";
import type { ProductRepository, StockShortage } from "../domain/ports/ProductRepository.js";
import type { DiscountEngine } from "../domain/pricing/DiscountEngine.js";

export interface CheckoutInput {
  readonly cartLines: readonly CartLine[];
  readonly couponCode: string | null;
  readonly idempotencyKey: string;
}

export class InsufficientStockException extends Error {
  constructor(public readonly shortages: readonly StockShortage[]) {
    super("Stock insuficiente para uno o más productos del carrito");
    this.name = "InsufficientStockException";
  }
}

/**
 * Procesa el checkout: recalcula el motor de descuentos de forma
 * autoritativa en el servidor (el front nunca decide el precio),
 * decrementa el stock de forma todo-o-nada y persiste la orden.
 *
 * Es idempotente por `Idempotency-Key`: un reintento con la misma clave
 * devuelve la orden ya creada, sin recalcular ni volver a tocar el stock.
 */
export class CheckoutUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepository,
    private readonly discountEngine: DiscountEngine,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: CheckoutInput): Promise<Order> {
    const existingOrder = await this.orderRepository.findByIdempotencyKey(input.idempotencyKey);
    if (existingOrder) {
      return existingOrder;
    }

    const products = await this.productRepository.findAll();
    const quote = this.discountEngine.calculate(input.cartLines, products, input.couponCode);

    const shortages = await this.productRepository.decrementStock(input.cartLines);
    if (shortages.length > 0) {
      throw new InsufficientStockException(shortages);
    }

    const order = await this.orderRepository.save({
      idempotencyKey: input.idempotencyKey,
      createdAt: this.now(),
      cartLines: input.cartLines,
      couponCode: input.couponCode,
      quote,
    });

    return order;
  }
}
