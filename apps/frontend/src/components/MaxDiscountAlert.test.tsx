import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MaxDiscountAlert } from "./MaxDiscountAlert.js";

describe("MaxDiscountAlert (HU4)", () => {
  it("muestra el texto exacto del enunciado cuando visible=true", () => {
    render(<MaxDiscountAlert visible={true} />);

    expect(
      screen.getByText("¡Enhorabuena! Has alcanzado el límite máximo de ahorro permitido (35%)"),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("no renderiza nada cuando visible=false", () => {
    const { container } = render(<MaxDiscountAlert visible={false} />);

    expect(container).toBeEmptyDOMElement();
  });
});
