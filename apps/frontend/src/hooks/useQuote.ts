import { useEffect, useState } from "react";
import type { QuoteResultDto } from "@core-ecommerce/contracts";
import { ApiError, fetchQuote } from "../api/client.js";
import type { CartState } from "../state/cartReducer.js";

const DEBOUNCE_MS = 300;

export interface UseQuoteResult {
  readonly quote: QuoteResultDto | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * Cotiza el carrito contra el backend con debounce — el front NUNCA
 * calcula el precio; solo muestra lo que el motor del servidor devuelve.
 */
export function useQuote(cart: CartState): UseQuoteResult {
  const [quote, setQuote] = useState<QuoteResultDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cart.lines.length === 0) {
      setQuote(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timeoutId = setTimeout(() => {
      fetchQuote(cart.lines, cart.couponCode)
        .then((result) => {
          if (!cancelled) {
            setQuote(result);
            setError(null);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setQuote(null);
            setError(err instanceof ApiError ? err.problem.detail : "No se pudo calcular la cotización");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [cart.lines, cart.couponCode]);

  return { quote, loading, error };
}
