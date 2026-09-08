import type { CartLineDto } from "@core-ecommerce/contracts";

export interface CartState {
  readonly lines: readonly CartLineDto[];
  readonly couponCode: string | null;
}

export type CartAction =
  | { type: "ADD_PRODUCT"; productId: string }
  | { type: "REMOVE_PRODUCT"; productId: string }
  | { type: "SET_QUANTITY"; productId: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "APPLY_COUPON"; couponCode: string }
  | { type: "CLEAR_COUPON" };

export const INITIAL_CART_STATE: CartState = {
  lines: [],
  couponCode: null,
};

function setQuantity(lines: readonly CartLineDto[], productId: string, quantity: number): CartLineDto[] {
  if (quantity <= 0) {
    return lines.filter((line) => line.productId !== productId);
  }

  const existingLine = lines.find((line) => line.productId === productId);
  if (!existingLine) {
    return [...lines, { productId, quantity }];
  }

  return lines.map((line) => (line.productId === productId ? { ...line, quantity } : line));
}

/**
 * Lógica pura del carrito — sin llamadas a red ni efectos secundarios.
 * Aquí vive la cobertura de "manejo de estado del carrito" que exige el
 * §4.3: cada transición se puede probar sin renderizar nada.
 */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_PRODUCT": {
      const currentQuantity = state.lines.find((line) => line.productId === action.productId)?.quantity ?? 0;
      return { ...state, lines: setQuantity(state.lines, action.productId, currentQuantity + 1) };
    }

    case "REMOVE_PRODUCT": {
      const currentQuantity = state.lines.find((line) => line.productId === action.productId)?.quantity ?? 0;
      return { ...state, lines: setQuantity(state.lines, action.productId, currentQuantity - 1) };
    }

    case "SET_QUANTITY":
      return { ...state, lines: setQuantity(state.lines, action.productId, action.quantity) };

    case "CLEAR_CART":
      return { ...state, lines: [] };

    case "APPLY_COUPON":
      return { ...state, couponCode: action.couponCode.trim() || null };

    case "CLEAR_COUPON":
      return { ...state, couponCode: null };

    default:
      return state;
  }
}
