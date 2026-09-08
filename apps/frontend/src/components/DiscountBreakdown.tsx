import type { QuoteResultDto } from "@core-ecommerce/contracts";
import { formatCents } from "../utils/money.js";

export interface DiscountBreakdownProps {
  readonly quote: QuoteResultDto | null;
  readonly loading: boolean;
  readonly error: string | null;
}

export function DiscountBreakdown({ quote, loading, error }: DiscountBreakdownProps) {
  if (error) {
    return (
      <p role="alert" className="discount-breakdown__error">
        {error}
      </p>
    );
  }

  if (loading && !quote) {
    return <p className="discount-breakdown__loading">Calculando descuentos…</p>;
  }

  if (!quote) {
    return null;
  }

  return (
    <section className="discount-breakdown" aria-label="Desglose de descuentos">
      <h2>Desglose</h2>
      <p className="discount-breakdown__subtotal">Subtotal original: {formatCents(quote.originalSubtotalCents)}</p>
      <ul>
        {quote.discounts.map((discount) => (
          <li key={discount.ruleId}>
            {discount.label}: {discount.amountCents < 0 ? "+" : "−"}
            {formatCents(Math.abs(discount.amountCents))}
          </li>
        ))}
      </ul>
      <p className="discount-breakdown__savings">Ahorro total: {formatCents(quote.totalDiscountCents)}</p>
      <p className="discount-breakdown__rate">
        Descuento efectivo: {(quote.effectiveDiscountRate * 100).toFixed(2)}%
      </p>
      <p className="discount-breakdown__total">Total a pagar: {formatCents(quote.finalTotalCents)}</p>
    </section>
  );
}
