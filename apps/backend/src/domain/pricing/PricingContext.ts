import type { Cents } from "../model/Money.js";
import type { CartLine } from "../model/CartLine.js";
import type { Product } from "../model/Product.js";
import { InvalidCartLineError, ProductNotFoundError } from "../model/errors.js";
import { sumCents } from "../model/Money.js";

export interface PricedLine {
  readonly productId: number;
  readonly category: string;
  readonly quantity: number;
  readonly unitPriceCents: Cents;
  readonly originalSubtotalCents: Cents;
  readonly currentAmountCents: Cents;
}

export interface AppliedDiscount {
  readonly ruleId: string;
  readonly label: string;
  readonly amountCents: Cents;
  readonly perLineAmountsCents: ReadonlyMap<number, Cents>;
}

export interface PricingContext {
  readonly lines: readonly PricedLine[];
  readonly originalSubtotalCents: Cents;
  readonly currentTotalCents: Cents;
  readonly appliedDiscounts: readonly AppliedDiscount[];
  readonly couponCode: string | null;
}

function findProduct(products: readonly Product[], productId: number): Product {
  const product = products.find((candidate) => candidate.id === productId);

  if (!product) {
    throw new ProductNotFoundError(productId);
  }

  return product;
}

/**
 * Construye el contexto inicial de precios a partir del carrito crudo y el
 * catálogo. Valida cantidades y existencia de producto — nunca produce
 * `NaN`, incluso con un carrito vacío.
 */
export function buildInitialContext(
  cartLines: readonly CartLine[],
  products: readonly Product[],
  couponCode: string | null,
): PricingContext {
  const lines: PricedLine[] = cartLines.map((cartLine) => {
    if (!Number.isInteger(cartLine.quantity) || cartLine.quantity <= 0) {
      throw new InvalidCartLineError(cartLine.productId, cartLine.quantity);
    }

    const product = findProduct(products, cartLine.productId);
    const originalSubtotalCents = product.unitPriceCents * cartLine.quantity;

    return {
      productId: product.id,
      category: product.category,
      quantity: cartLine.quantity,
      unitPriceCents: product.unitPriceCents,
      originalSubtotalCents,
      currentAmountCents: originalSubtotalCents,
    };
  });

  const originalSubtotalCents = sumCents(lines.map((line) => line.originalSubtotalCents));

  return {
    lines,
    originalSubtotalCents,
    currentTotalCents: originalSubtotalCents,
    appliedDiscounts: [],
    couponCode: couponCode && couponCode.trim().length > 0 ? couponCode.trim() : null,
  };
}
