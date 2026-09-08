import type { PricingContext } from "./PricingContext.js";

/**
 * Strategy: cada regla de descuento decide por sí misma si aplica y cómo
 * transforma el contexto. El motor (`DiscountEngine`) no conoce el detalle
 * de ninguna regla concreta — solo las ejecuta en orden.
 */
export interface DiscountRule {
  readonly id: string;
  applies(context: PricingContext): boolean;
  apply(context: PricingContext): PricingContext;
}
