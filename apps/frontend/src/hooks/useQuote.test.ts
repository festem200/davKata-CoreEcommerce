import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { INITIAL_CART_STATE, type CartState } from "../state/cartReducer.js";
import { useQuote } from "./useQuote.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useQuote", () => {
  it("no cotiza cuando el carrito está vacío", () => {
    const { result } = renderHook(() => useQuote(INITIAL_CART_STATE));

    expect(result.current.quote).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("cotiza (con debounce) cuando el carrito tiene líneas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            originalSubtotalCents: 4500,
            finalTotalCents: 4050,
            totalDiscountCents: 450,
            effectiveDiscountRate: 0.1,
            capApplied: false,
            discounts: [],
            lines: [],
          }),
      }),
    );

    const cart: CartState = { lines: [{ productId: 1, quantity: 1 }], couponCode: null };
    const { result } = renderHook(() => useQuote(cart));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.quote).not.toBeNull());

    expect(result.current.quote?.finalTotalCents).toBe(4050);
    expect(result.current.loading).toBe(false);
  });

  it("expone un error legible si la cotización falla (p.ej. cupón inválido)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ type: "t", title: "Cupón inválido", status: 422, detail: "El cupón no existe" }),
      }),
    );

    const cart: CartState = { lines: [{ productId: 1, quantity: 1 }], couponCode: "NO-EXISTE" };
    const { result } = renderHook(() => useQuote(cart));

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error).toBe("El cupón no existe");
    expect(result.current.quote).toBeNull();
  });
});
