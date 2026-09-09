import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ProductDto } from "@core-ecommerce/contracts";
import { CartProvider } from "../state/CartContext.js";
import { ProductList } from "./ProductList.js";

const PRODUCTS: ProductDto[] = [
  { id: 1, name: "Audífonos Bluetooth", category: "Tecnología", unitPriceCents: 4500, stock: 1 },
  { id: 2, name: "Camiseta de algodón", category: "Ropa", unitPriceCents: 1990, stock: 10 },
];

describe("ProductList", () => {
  it("agrega un producto al hacer clic en 'Agregar al carrito' y muestra la insignia del carrito", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <ProductList products={PRODUCTS} />
      </CartProvider>,
    );

    await user.click(screen.getByLabelText("Agregar Audífonos Bluetooth al carrito"));

    expect(screen.getByText(/En el carrito \(1\)/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Agregar Audífonos Bluetooth al carrito")).not.toBeInTheDocument();
  });

  it("deshabilita 'Agregar al carrito' cuando no hay stock", () => {
    const outOfStock: ProductDto[] = [{ id: 3, name: "Sin stock", category: "Hogar", unitPriceCents: 100, stock: 0 }];
    render(
      <CartProvider>
        <ProductList products={outOfStock} />
      </CartProvider>,
    );

    expect(screen.getByLabelText("Agregar Sin stock al carrito")).toBeDisabled();
  });

  it("el buscador filtra el catálogo por nombre", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <ProductList products={PRODUCTS} />
      </CartProvider>,
    );

    await user.type(screen.getByLabelText("Buscar producto"), "camiseta");

    expect(screen.getByText("Camiseta de algodón")).toBeInTheDocument();
    expect(screen.queryByText("Audífonos Bluetooth")).not.toBeInTheDocument();
  });

  it("el filtro de categoría muestra solo los productos de esa categoría, y 'Todas' los restaura", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <ProductList products={PRODUCTS} />
      </CartProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Ropa" }));

    expect(screen.getByText("Camiseta de algodón")).toBeInTheDocument();
    expect(screen.queryByText("Audífonos Bluetooth")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Todas" }));

    expect(screen.getByText("Audífonos Bluetooth")).toBeInTheDocument();
    expect(screen.getByText("Camiseta de algodón")).toBeInTheDocument();
  });

  it("muestra un mensaje cuando ningún producto coincide con la búsqueda", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <ProductList products={PRODUCTS} />
      </CartProvider>,
    );

    await user.type(screen.getByLabelText("Buscar producto"), "no-existe");

    expect(screen.getByText("Ningún producto coincide con la búsqueda.")).toBeInTheDocument();
  });
});
