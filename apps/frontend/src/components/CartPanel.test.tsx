import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ProductDto } from "@core-ecommerce/contracts";
import { CartProvider, useCart } from "../state/CartContext.js";
import { CartPanel } from "./CartPanel.js";

const PRODUCTS: ProductDto[] = [{ id: 1, name: "Audífonos Bluetooth", category: "Tecnología", unitPriceCents: 4500, stock: 10 }];

function Seed() {
  const { addProduct } = useCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => addProduct(1), []);
  return null;
}

describe("CartPanel", () => {
  it("muestra el mensaje de carrito vacío cuando no hay líneas", () => {
    render(
      <CartProvider>
        <CartPanel products={PRODUCTS} />
      </CartProvider>,
    );

    expect(screen.getByText(/carrito está vacío/)).toBeInTheDocument();
  });

  it("muestra el nombre del producto y permite vaciar el carrito", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <Seed />
        <CartPanel products={PRODUCTS} />
      </CartProvider>,
    );

    expect(screen.getByText("Audífonos Bluetooth")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Vaciar carrito" }));

    expect(screen.getByText(/carrito está vacío/)).toBeInTheDocument();
  });
});
