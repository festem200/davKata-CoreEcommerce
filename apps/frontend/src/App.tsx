import { CartPanel } from "./components/CartPanel.js";
import { CouponInput } from "./components/CouponInput.js";
import { DiscountBreakdown } from "./components/DiscountBreakdown.js";
import { MaxDiscountAlert } from "./components/MaxDiscountAlert.js";
import { ProductList } from "./components/ProductList.js";
import { useProducts } from "./hooks/useProducts.js";
import { useQuote } from "./hooks/useQuote.js";
import { CartProvider, useCart } from "./state/CartContext.js";

function Checkout() {
  const { state } = useCart();
  const { products, loading: loadingProducts, error: productsError } = useProducts();
  const { quote, loading: loadingQuote, error: quoteError } = useQuote(state);

  return (
    <>
      <header className="app-header">
        <h1>Soultec</h1>
      </header>
      <main className="app-layout">
        {productsError ? (
          <p role="alert">{productsError}</p>
        ) : loadingProducts ? (
          <p>Cargando catálogo…</p>
        ) : (
          <ProductList products={products} />
        )}
        <div className="app-layout__sidebar">
          <CartPanel products={products} />
          <CouponInput />
          <DiscountBreakdown quote={quote} loading={loadingQuote} error={quoteError} />
          <MaxDiscountAlert visible={quote?.capApplied ?? false} />
        </div>
      </main>
    </>
  );
}

export function App() {
  return (
    <CartProvider>
      <Checkout />
    </CartProvider>
  );
}
