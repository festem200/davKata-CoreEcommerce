import type { Coupon } from "./Coupon.js";
import type { DiscountRule } from "./DiscountRule.js";
import { CategoryDiscountRule } from "./rules/CategoryDiscountRule.js";
import { CouponDiscountRule } from "./rules/CouponDiscountRule.js";
import { VolumeDiscountRule } from "./rules/VolumeDiscountRule.js";

export type DiscountRuleId = "category-discount" | "volume-discount" | "coupon-discount";

export interface DiscountRuleFactoryConfig {
  readonly ruleOrder: readonly DiscountRuleId[];
  readonly coupons: ReadonlyMap<string, Coupon>;
}

/**
 * Factory: arma la cadena de reglas a partir de configuración (`ruleOrder`),
 * no de una secuencia de `if`s en el motor. Agregar una regla nueva implica
 * registrarla aquí una vez — el `DiscountEngine` no cambia.
 */
export class DiscountRuleFactory {
  static create(config: DiscountRuleFactoryConfig): DiscountRule[] {
    const registry: Record<DiscountRuleId, () => DiscountRule> = {
      "category-discount": () => new CategoryDiscountRule(),
      "volume-discount": () => new VolumeDiscountRule(),
      "coupon-discount": () => new CouponDiscountRule(config.coupons),
    };

    return config.ruleOrder.map((ruleId) => registry[ruleId]());
  }
}
