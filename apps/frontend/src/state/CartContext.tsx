import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { cartReducer, INITIAL_CART_STATE, type CartState } from "./cartReducer.js";

export interface CartContextValue {
  readonly state: CartState;
  readonly addProduct: (productId: number) => void;
  readonly removeProduct: (productId: number) => void;
  readonly setQuantity: (productId: number, quantity: number) => void;
  readonly clearCart: () => void;
  readonly applyCoupon: (couponCode: string) => void;
  readonly clearCoupon: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Observer: el carrito vive en un único reducer y cualquier componente que
 * consuma `useCart()` se vuelve a renderizar cuando el estado cambia — sin
 * prop drilling entre `ProductList`, `CartPanel`, `CouponInput`, etc.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, INITIAL_CART_STATE);

  const value = useMemo<CartContextValue>(
    () => ({
      state,
      addProduct: (productId) => dispatch({ type: "ADD_PRODUCT", productId }),
      removeProduct: (productId) => dispatch({ type: "REMOVE_PRODUCT", productId }),
      setQuantity: (productId, quantity) => dispatch({ type: "SET_QUANTITY", productId, quantity }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),
      applyCoupon: (couponCode) => dispatch({ type: "APPLY_COUPON", couponCode }),
      clearCoupon: () => dispatch({ type: "CLEAR_COUPON" }),
    }),
    [state],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un <CartProvider>");
  }
  return context;
}
