import type { DiscountRule } from "../DiscountRule.js";
import type { PricingContext } from "../PricingContext.js";
import { applyRuleDiscount } from "../applyRuleDiscount.js";

const VOLUME_DISCOUNT_RATE = 0.05;
const VOLUME_THRESHOLD_CENTS = 10_000; // $100.00

/**
 * Regla de negocio 2: si el subtotal (ya con el Descuento de Categoría
 * aplicado) SUPERA los $100, se aplica un 5% adicional sobre todo el
 * carrito. El umbral es estrictamente "mayor que" ($100 exactos no
 * activan la regla).
 */
export class VolumeDiscountRule implements DiscountRule {
  readonly id = "volume-discount";

  applies(context: PricingContext): boolean {
    return context.currentTotalCents > VOLUME_THRESHOLD_CENTS;
  }

  apply(context: PricingContext): PricingContext {
    return applyRuleDiscount(context, this.id, "Descuento por Volumen (5%)", VOLUME_DISCOUNT_RATE, () => true);
  }
}
