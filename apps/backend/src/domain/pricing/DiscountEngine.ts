import { allocateProportionally, floorPercentageOf, type Cents } from "../model/Money.js";
import type { CartLine } from "../model/CartLine.js";
import type { Product } from "../model/Product.js";
import type { DiscountRule } from "./DiscountRule.js";
import { buildInitialContext } from "./PricingContext.js";

export const DEFAULT_MAX_DISCOUNT_RATE = 0.35;
export const MAX_DISCOUNT_CAP_RULE_ID = "max-discount-cap";

export interface QuoteDiscountLine {
  readonly ruleId: string;
  readonly label: string;
  readonly amountCents: Cents;
}

export interface QuoteLineResult {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPriceCents: Cents;
  readonly originalSubtotalCents: Cents;
  readonly finalAmountCents: Cents;
}

export interface QuoteResult {
  readonly originalSubtotalCents: Cents;
  readonly finalTotalCents: Cents;
  readonly totalDiscountCents: Cents;
  readonly effectiveDiscountRate: number;
  readonly capApplied: boolean;
  readonly discounts: readonly QuoteDiscountLine[];
  readonly lines: readonly QuoteLineResult[];
}

/**
 * Orquesta el pipeline de reglas (Strategy) sobre el contexto de precios y
 * aplica, al final, el límite absoluto del 35%. El motor no conoce el
 * detalle de ninguna regla: solo pregunta `applies()` y ejecuta `apply()`
 * en el orden que le entregue la Factory.
 */
export class DiscountEngine {
  constructor(
    private readonly rules: readonly DiscountRule[],
    private readonly maxDiscountRate: number = DEFAULT_MAX_DISCOUNT_RATE,
  ) {}

  calculate(cartLines: readonly CartLine[], products: readonly Product[], couponCode: string | null): QuoteResult {
    const initialContext = buildInitialContext(cartLines, products, couponCode);

    const contextAfterRules = this.rules.reduce(
      (context, rule) => (rule.applies(context) ? rule.apply(context) : context),
      initialContext,
    );

    const rawDiscountCents = contextAfterRules.originalSubtotalCents - contextAfterRules.currentTotalCents;
    const capCents = floorPercentageOf(contextAfterRules.originalSubtotalCents, this.maxDiscountRate);
    const capApplied = rawDiscountCents > capCents;

    const finalContext = capApplied
      ? applyMaxDiscountCap(contextAfterRules, rawDiscountCents, capCents)
      : contextAfterRules;

    const totalDiscountCents = finalContext.originalSubtotalCents - finalContext.currentTotalCents;
    const effectiveDiscountRate =
      finalContext.originalSubtotalCents === 0 ? 0 : totalDiscountCents / finalContext.originalSubtotalCents;

    return {
      originalSubtotalCents: finalContext.originalSubtotalCents,
      finalTotalCents: finalContext.currentTotalCents,
      totalDiscountCents,
      effectiveDiscountRate,
      capApplied,
      discounts: finalContext.appliedDiscounts.map((discount) => ({
        ruleId: discount.ruleId,
        label: discount.label,
        amountCents: discount.amountCents,
      })),
      lines: finalContext.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        originalSubtotalCents: line.originalSubtotalCents,
        finalAmountCents: line.currentAmountCents,
      })),
    };
  }
}

function applyMaxDiscountCap(
  context: ReturnType<typeof buildInitialContext>,
  rawDiscountCents: Cents,
  capCents: Cents,
) {
  const giveBackCents = rawDiscountCents - capCents;
  const discountedSoFarPerLine = context.lines.map((line) => line.originalSubtotalCents - line.currentAmountCents);
  const giveBackPerLine = allocateProportionally(giveBackCents, discountedSoFarPerLine);

  const lines = context.lines.map((line, index) => ({
    ...line,
    currentAmountCents: line.currentAmountCents + (giveBackPerLine[index] ?? 0),
  }));

  return {
    ...context,
    lines,
    currentTotalCents: context.currentTotalCents + giveBackCents,
    appliedDiscounts: [
      ...context.appliedDiscounts,
      {
        ruleId: MAX_DISCOUNT_CAP_RULE_ID,
        label: "Ajuste por límite máximo de descuento (35%)",
        amountCents: -giveBackCents,
        perLineAmountsCents: new Map<string, Cents>(),
      },
    ],
  };
}
