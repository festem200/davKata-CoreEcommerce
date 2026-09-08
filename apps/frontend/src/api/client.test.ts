import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, fetchProducts, fetchQuote, submitCheckout } from "./client.js";

function mockFetchOnce(status: number, body: unknown): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchProducts", () => {
  it("devuelve el catálogo cuando la respuesta es exitosa", async () => {
    mockFetchOnce(200, [{ id: "p1", name: "Audífonos", category: "Tecnología", unitPriceCents: 4500, stock: 10 }]);

    const products = await fetchProducts();

    expect(products).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith("/api/v1/products");
  });

  it("lanza ApiError con el Problem Detail cuando la respuesta falla", async () => {
    mockFetchOnce(500, { type: "t", title: "Error", status: 500, detail: "falló" });

    await expect(fetchProducts()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("fetchQuote", () => {
  it("envía cartLines y couponCode al backend", async () => {
    mockFetchOnce(200, { originalSubtotalCents: 0, finalTotalCents: 0, totalDiscountCents: 0, effectiveDiscountRate: 0, capApplied: false, discounts: [], lines: [] });

    await fetchQuote([{ productId: "p1", quantity: 1 }], "WELCOME2026");

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/cart/quote",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ cartLines: [{ productId: "p1", quantity: 1 }], couponCode: "WELCOME2026" }),
      }),
    );
  });
});

describe("submitCheckout", () => {
  it("envía el header Idempotency-Key", async () => {
    mockFetchOnce(201, { id: "order-1" });

    await submitCheckout([{ productId: "p1", quantity: 1 }], null, "key-1");

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/checkout",
      expect.objectContaining({
        headers: expect.objectContaining({ "Idempotency-Key": "key-1" }),
      }),
    );
  });
});
