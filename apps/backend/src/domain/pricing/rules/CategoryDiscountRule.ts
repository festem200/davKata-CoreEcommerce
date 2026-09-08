import { TECHNOLOGY_CATEGORY } from "../../model/Product.js";
import type { DiscountRule } from "../DiscountRule.js";
import type { PricingContext } from "../PricingContext.js";
import { applyRuleDiscount } from "../applyRuleDiscount.js";

const CATEGORY_DISCOUNT_RATE = 0.1;

/**
 * Regla de negocio 1: si el carrito contiene al menos un producto de la
 * categoría "Tecnología", se aplica un 10% de descuento sobre el precio de
 * ESOS productos específicos (no sobre el resto del carrito).
 */
export class CategoryDiscountRule implements DiscountRule {
  readonly id = "category-discount";

  applies(context: PricingContext): boolean {
    return context.lines.some((line) => line.category === TECHNOLOGY_CATEGORY);
  }

  apply(context: PricingContext): PricingContext {
    return applyRuleDiscount(
      context,
      this.id,
      "Descuento de Categoría (Tecnología 10%)",
      CATEGORY_DISCOUNT_RATE,
      (line) => line.category === TECHNOLOGY_CATEGORY,
    );
  }
}
