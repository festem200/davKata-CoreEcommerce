import type { ProductDto } from "@core-ecommerce/contracts";
import { useCart } from "../state/CartContext.js";
import { formatCents } from "../utils/money.js";

export function ProductList({ products }: { products: readonly ProductDto[] }) {
  const { state, addProduct, removeProduct } = useCart();

  return (
    <section className="product-list" aria-label="Catálogo de productos">
      <h2>Catálogo</h2>
      <ul>
        {products.map((product) => {
          const quantityInCart = state.lines.find((line) => line.productId === product.id)?.quantity ?? 0;
          const atStockLimit = quantityInCart >= product.stock;

          return (
            <li key={product.id} className="product-card">
              <div className="product-card__info">
                <h3>{product.name}</h3>
                <p className="product-card__category">{product.category}</p>
                <p className="product-card__price">{formatCents(product.unitPriceCents)}</p>
                <p className="product-card__stock">Stock disponible: {product.stock}</p>
              </div>
              <div className="product-card__actions">
                <button
                  type="button"
                  className="button-pill"
                  onClick={() => removeProduct(product.id)}
                  disabled={quantityInCart === 0}
                  aria-label={`Quitar ${product.name} del carrito`}
                >
                  −
                </button>
                <span aria-live="polite" className="product-card__quantity">
                  {quantityInCart}
                </span>
                <button
                  type="button"
                  className="button-pill button-pill--primary"
                  onClick={() => addProduct(product.id)}
                  disabled={atStockLimit}
                  aria-label={`Agregar ${product.name} al carrito`}
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
