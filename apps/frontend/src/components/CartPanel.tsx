import { useMemo } from "react";
import type { ProductDto } from "@core-ecommerce/contracts";
import { useCart } from "../state/CartContext.js";

export function CartPanel({ products }: { products: readonly ProductDto[] }) {
  const { state, clearCart, setQuantity } = useCart();
  const productsById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  if (state.lines.length === 0) {
    return (
      <section className="cart-panel" aria-label="Carrito de compras">
        <h2>Tu carrito</h2>
        <p className="cart-panel__empty">Tu carrito está vacío. Agrega productos del catálogo.</p>
      </section>
    );
  }

  return (
    <section className="cart-panel" aria-label="Carrito de compras">
      <h2>Tu carrito</h2>
      <ul>
        {state.lines.map((line) => {
          const product = productsById.get(line.productId);

          return (
            <li key={line.productId} className="cart-line">
              <span className="cart-line__name">{product?.name ?? line.productId}</span>
              <input
                type="number"
                min={0}
                value={line.quantity}
                onChange={(event) => setQuantity(line.productId, Number(event.target.value))}
                aria-label={`Cantidad de ${product?.name ?? line.productId}`}
                className="cart-line__quantity"
              />
            </li>
          );
        })}
      </ul>
      <button type="button" className="button-ghost" onClick={clearCart}>
        Vaciar carrito
      </button>
    </section>
  );
}
