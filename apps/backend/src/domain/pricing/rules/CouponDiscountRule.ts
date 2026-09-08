import { CouponExpiredError, CouponNotFoundError } from "../../model/errors.js";
import type { Coupon } from "../Coupon.js";
import type { DiscountRule } from "../DiscountRule.js";
import type { PricingContext } from "../PricingContext.js";
import { applyRuleDiscount } from "../applyRuleDiscount.js";

/**
 * Regla de negocio 3: si el cliente ingresó un código de cupón, se aplica
 * su porcentaje sobre el total obtenido tras el Descuento por Volumen.
 * Un cupón inexistente o expirado es un ERROR explícito, no un descuento
 * silenciosamente ignorado — el cliente debe saber que su cupón no aplicó.
 */
export class CouponDiscountRule implements DiscountRule {
  readonly id = "coupon-discount";

  constructor(
    private readonly coupons: ReadonlyMap<string, Coupon>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  applies(context: PricingContext): boolean {
    return context.couponCode !== null;
  }

  apply(context: PricingContext): PricingContext {
    // Invariante del contrato DiscountRule: apply() solo se llama tras un
    // applies() verdadero, que ya garantiza couponCode !== null.
    const couponCode = context.couponCode as string;

    const coupon = this.coupons.get(couponCode);
    if (!coupon) {
      throw new CouponNotFoundError(couponCode);
    }

    if (coupon.expiresAt && coupon.expiresAt.getTime() < this.now().getTime()) {
      throw new CouponExpiredError(couponCode);
    }

    return applyRuleDiscount(context, this.id, `Descuento por Cupón (${couponCode})`, coupon.rate, () => true);
  }
}
