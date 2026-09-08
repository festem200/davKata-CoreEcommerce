import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ProductDto } from "@core-ecommerce/contracts";
import { CartProvider } from "../state/CartContext.js";
import { ProductList } from "./ProductList.js";

const PRODUCTS: ProductDto[] = [
  { id: "p1", name: "Audífonos Bluetooth", category: "Tecnología", unitPriceCents: 4500, stock: 1 },
];

describe("ProductList", () => {
  it("agrega un producto al hacer clic en +", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <ProductList products={PRODUCTS} />
      </CartProvider>,
    );

    await user.click(screen.getByLabelText("Agregar Audífonos Bluetooth al carrito"));

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("deshabilita '+' al llegar al límite de stock", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <ProductList products={PRODUCTS} />
      </CartProvider>,
    );

    await user.click(screen.getByLabelText("Agregar Audífonos Bluetooth al carrito"));

    expect(screen.getByLabelText("Agregar Audífonos Bluetooth al carrito")).toBeDisabled();
  });

  it("deshabilita '−' cuando la cantidad en el carrito es 0", () => {
    render(
      <CartProvider>
        <ProductList products={PRODUCTS} />
      </CartProvider>,
    );

    expect(screen.getByLabelText("Quitar Audífonos Bluetooth del carrito")).toBeDisabled();
  });
});
