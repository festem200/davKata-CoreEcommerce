import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { QuoteResultDto } from "@core-ecommerce/contracts";
import { DiscountBreakdown } from "./DiscountBreakdown.js";

const QUOTE: QuoteResultDto = {
  originalSubtotalCents: 13490,
  finalTotalCents: 11534,
  totalDiscountCents: 1956,
  effectiveDiscountRate: 0.145,
  capApplied: false,
  discounts: [
    { ruleId: "category-discount", label: "Descuento de Categoría (Tecnología 10%)", amountCents: 1349 },
    { ruleId: "volume-discount", label: "Descuento por Volumen (5%)", amountCents: 607 },
  ],
  lines: [],
};

describe("DiscountBreakdown", () => {
  it("muestra el mensaje de error cuando hay un error", () => {
    render(<DiscountBreakdown quote={null} loading={false} error="El cupón no existe" />);

    expect(screen.getByRole("alert")).toHaveTextContent("El cupón no existe");
  });

  it("muestra un estado de carga mientras no hay cotización previa", () => {
    render(<DiscountBreakdown quote={null} loading={true} error={null} />);

    expect(screen.getByText(/Calculando/)).toBeInTheDocument();
  });

  it("no renderiza nada si no hay cotización ni error ni carga", () => {
    const { container } = render(<DiscountBreakdown quote={null} loading={false} error={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("muestra el desglose regla por regla, el ahorro total y el total a pagar", () => {
    render(<DiscountBreakdown quote={QUOTE} loading={false} error={null} />);

    expect(screen.getByText(/Descuento de Categoría/)).toBeInTheDocument();
    expect(screen.getByText(/Descuento por Volumen/)).toBeInTheDocument();
    expect(screen.getByText("Total a pagar: $115.34")).toBeInTheDocument();
    expect(screen.getByText("Ahorro total: $19.56")).toBeInTheDocument();
  });
});
