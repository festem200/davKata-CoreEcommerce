import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useProducts } from "./useProducts.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useProducts", () => {
  it("carga el catálogo y actualiza loading/products", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ id: "p1", name: "Audífonos", category: "Tecnología", unitPriceCents: 4500, stock: 10 }]),
      }),
    );

    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.products).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("expone un error legible si la carga falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ type: "t", title: "Error", status: 500, detail: "El servidor falló" }),
      }),
    );

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("El servidor falló");
  });
});
