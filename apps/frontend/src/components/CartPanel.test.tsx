import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ProductDto } from "@core-ecommerce/contracts";
import { CartProvider, useCart } from "../state/CartContext.js";
import { CartPanel } from "./CartPanel.js";

const PRODUCTS: ProductDto[] = [{ id: 1, name: "Audífonos Bluetooth", category: "Tecnología", unitPriceCents: 4500, stock: 10 }];

function Seed({ productId = 1 }: { productId?: number }) {
  const { addProduct } = useCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => addProduct(productId), []);
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

  it("no deja pedir más unidades que el stock disponible", () => {
    const lowStockProduct: ProductDto[] = [
      { id: 2, name: "Power bank", category: "Tecnología", unitPriceCents: 3250, stock: 3 },
    ];

    render(
      <CartProvider>
        <Seed productId={2} />
        <CartPanel products={lowStockProduct} />
      </CartProvider>,
    );

    const quantityInput = screen.getByLabelText("Cantidad de Power bank");
    fireEvent.change(quantityInput, { target: { value: "10" } });

    expect(quantityInput).toHaveValue(3);
    expect(screen.getByText("Máximo disponible: 3")).toBeInTheDocument();
  });
});
