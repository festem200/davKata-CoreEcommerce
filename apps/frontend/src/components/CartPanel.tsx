import { useMemo } from "react";
import type { ProductDto } from "@core-ecommerce/contracts";
import { Trash2 } from "lucide-react";
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
          const maxAvailable = product?.stock ?? line.quantity;
          const atStockLimit = line.quantity >= maxAvailable;

          return (
            <li key={line.productId} className="cart-line">
              <div className="cart-line__row">
                <div className="cart-line__product">
                  {product?.imageUrl ? (
                    <img className="cart-line__thumbnail" src={product.imageUrl} alt="" aria-hidden="true" />
                  ) : null}
                  <span className="cart-line__name">{product?.name ?? line.productId}</span>
                </div>
                <input
                  type="number"
                  min={0}
                  max={maxAvailable}
                  value={line.quantity}
                  onChange={(event) => {
                    const requested = Number(event.target.value);
                    const safeQuantity = Number.isNaN(requested) ? 0 : requested;
                    setQuantity(line.productId, Math.min(safeQuantity, maxAvailable));
                  }}
                  aria-label={`Cantidad de ${product?.name ?? line.productId}`}
                  aria-describedby={atStockLimit ? `stock-limit-${line.productId}` : undefined}
                  className="cart-line__quantity"
                />
              </div>
              {atStockLimit ? (
                <p id={`stock-limit-${line.productId}`} className="cart-line__stock-warning">
                  Máximo disponible: {maxAvailable}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <button type="button" className="button-ghost" onClick={clearCart}>
        <Trash2 size={16} aria-hidden="true" /> Vaciar carrito
      </button>
    </section>
  );
}
