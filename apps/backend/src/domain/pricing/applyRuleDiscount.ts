import { allocateProportionally, floorPercentageOf, sumCents, type Cents } from "../model/Money.js";
import type { AppliedDiscount, PricedLine, PricingContext } from "./PricingContext.js";

/**
 * Aplica un descuento porcentual sobre el subconjunto de líneas elegibles,
 * repartiendo el monto exacto entre ellas (sin perder centavos) y
 * devolviendo un contexto NUEVO — el pipeline nunca muta el contexto previo.
 */
export function applyRuleDiscount(
  context: PricingContext,
  ruleId: string,
  label: string,
  rate: number,
  isLineEligible: (line: PricedLine) => boolean,
): PricingContext {
  const eligibleWeights = context.lines.map((line) => (isLineEligible(line) ? line.currentAmountCents : 0));
  const eligibleTotalCents = sumCents(eligibleWeights);
  const discountTotalCents = floorPercentageOf(eligibleTotalCents, rate);
  const perLineDiscounts = allocateProportionally(discountTotalCents, eligibleWeights);

  const perLineAmountsCents = new Map<string, Cents>();
  const lines: PricedLine[] = context.lines.map((line, index) => {
    const lineDiscountCents = perLineDiscounts[index] ?? 0;

    if (lineDiscountCents > 0) {
      perLineAmountsCents.set(line.productId, lineDiscountCents);
    }

    return {
      ...line,
      currentAmountCents: line.currentAmountCents - lineDiscountCents,
    };
  });

  const appliedDiscount: AppliedDiscount = {
    ruleId,
    label,
    amountCents: discountTotalCents,
    perLineAmountsCents,
  };

  return {
    ...context,
    lines,
    currentTotalCents: context.currentTotalCents - discountTotalCents,
    appliedDiscounts: [...context.appliedDiscounts, appliedDiscount],
  };
}
