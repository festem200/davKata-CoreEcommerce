import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider } from "../state/CartContext.js";
import { CouponInput } from "./CouponInput.js";

describe("CouponInput", () => {
  it("aplica el cupón al escribir y presionar Aplicar", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CouponInput />
      </CartProvider>,
    );

    await user.type(screen.getByLabelText("Código de cupón"), "WELCOME2026");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByText("WELCOME2026")).toBeInTheDocument();
  });

  it("no aplica un cupón vacío", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CouponInput />
      </CartProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.queryByText(/Cupón aplicado/)).not.toBeInTheDocument();
  });

  it("permite quitar el cupón aplicado", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CouponInput />
      </CartProvider>,
    );

    await user.type(screen.getByLabelText("Código de cupón"), "WELCOME2026");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));
    await user.click(screen.getByRole("button", { name: "Quitar" }));

    expect(screen.queryByText(/Cupón aplicado/)).not.toBeInTheDocument();
  });
});
