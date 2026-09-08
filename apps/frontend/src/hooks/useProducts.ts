import { useEffect, useState } from "react";
import type { ProductDto } from "@core-ecommerce/contracts";
import { ApiError, fetchProducts } from "../api/client.js";

export interface UseProductsResult {
  readonly products: readonly ProductDto[];
  readonly loading: boolean;
  readonly error: string | null;
}

export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<readonly ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchProducts()
      .then((result) => {
        if (!cancelled) {
          setProducts(result);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.problem.detail : "No se pudo cargar el catálogo");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, error };
}
