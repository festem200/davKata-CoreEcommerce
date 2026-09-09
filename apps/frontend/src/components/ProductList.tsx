import { useMemo, useState } from "react";
import type { ProductDto } from "@core-ecommerce/contracts";
import {
  BookOpen,
  Check,
  Dumbbell,
  Home,
  ImageOff,
  Search,
  Shirt,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { useCart } from "../state/CartContext.js";
import { formatCents } from "../utils/money.js";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Tecnología: Smartphone,
  Ropa: Shirt,
  Hogar: Home,
  Belleza: Sparkles,
  Deportes: Dumbbell,
  Libros: BookOpen,
};

function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? Tag;
}

function ProductImage({ product }: { product: ProductDto }) {
  const [failed, setFailed] = useState(false);

  if (!product.imageUrl || failed) {
    return (
      <div className="product-card__image product-card__image--placeholder" aria-hidden="true">
        <ImageOff size={28} />
      </div>
    );
  }

  return (
    <img
      className="product-card__image"
      src={product.imageUrl}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function ProductList({ products }: { products: readonly ProductDto[] }) {
  const { state, addProduct } = useCart();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === null || product.category === category;
      const matchesSearch = normalizedSearch.length === 0 || product.name.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  return (
    <section className="product-list" aria-label="Catálogo de productos">
      <h2>Catálogo</h2>

      <div className="product-filters">
        <div className="product-filters__search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar producto…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar producto"
          />
        </div>
        <div className="product-filters__categories">
          <button
            type="button"
            className={`category-chip${category === null ? " category-chip--active" : ""}`}
            onClick={() => setCategory(null)}
          >
            Todas
          </button>
          {categories.map((productCategory) => {
            const Icon = categoryIcon(productCategory);
            return (
              <button
                key={productCategory}
                type="button"
                className={`category-chip${category === productCategory ? " category-chip--active" : ""}`}
                onClick={() => setCategory(productCategory)}
              >
                <Icon size={14} aria-hidden="true" />
                {productCategory}
              </button>
            );
          })}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <p className="product-list__empty">Ningún producto coincide con la búsqueda.</p>
      ) : (
        <ul>
          {filteredProducts.map((product) => {
            const quantityInCart = state.lines.find((line) => line.productId === product.id)?.quantity ?? 0;
            const outOfStock = product.stock === 0;

            return (
              <li key={product.id} className="product-card">
                <ProductImage product={product} />
                <div className="product-card__info">
                  <h3>{product.name}</h3>
                  <p className="product-card__category">{product.category}</p>
                  {product.description ? (
                    <p className="product-card__description" title={product.description}>
                      {product.description}
                    </p>
                  ) : null}
                  <p className="product-card__price">{formatCents(product.unitPriceCents)}</p>
                  <p className="product-card__stock">Stock disponible: {product.stock}</p>
                </div>
                <div className="product-card__actions">
                  {quantityInCart > 0 ? (
                    <span className="product-card__badge">
                      <Check size={16} aria-hidden="true" /> En el carrito ({quantityInCart})
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="button-pill button-pill--primary button-pill--wide"
                      onClick={() => addProduct(product.id)}
                      disabled={outOfStock}
                      aria-label={`Agregar ${product.name} al carrito`}
                    >
                      <ShoppingCart size={16} aria-hidden="true" /> Agregar al carrito
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
