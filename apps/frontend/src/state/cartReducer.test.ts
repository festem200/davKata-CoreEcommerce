import { describe, expect, it } from "vitest";
import { cartReducer, INITIAL_CART_STATE, type CartState } from "./cartReducer.js";

describe("cartReducer", () => {
  it("ADD_PRODUCT agrega un producto nuevo con cantidad 1", () => {
    const state = cartReducer(INITIAL_CART_STATE, { type: "ADD_PRODUCT", productId: "p1" });

    expect(state.lines).toEqual([{ productId: "p1", quantity: 1 }]);
  });

  it("ADD_PRODUCT incrementa la cantidad si el producto ya está en el carrito", () => {
    const initial: CartState = { lines: [{ productId: "p1", quantity: 2 }], couponCode: null };

    const state = cartReducer(initial, { type: "ADD_PRODUCT", productId: "p1" });

    expect(state.lines).toEqual([{ productId: "p1", quantity: 3 }]);
  });

  it("REMOVE_PRODUCT decrementa la cantidad", () => {
    const initial: CartState = { lines: [{ productId: "p1", quantity: 2 }], couponCode: null };

    const state = cartReducer(initial, { type: "REMOVE_PRODUCT", productId: "p1" });

    expect(state.lines).toEqual([{ productId: "p1", quantity: 1 }]);
  });

  it("REMOVE_PRODUCT elimina la línea al llegar a 0 (nunca deja cantidad negativa)", () => {
    const initial: CartState = { lines: [{ productId: "p1", quantity: 1 }], couponCode: null };

    const state = cartReducer(initial, { type: "REMOVE_PRODUCT", productId: "p1" });

    expect(state.lines).toEqual([]);
  });

  it("REMOVE_PRODUCT sobre un producto que no está en el carrito no rompe nada", () => {
    const state = cartReducer(INITIAL_CART_STATE, { type: "REMOVE_PRODUCT", productId: "no-existe" });

    expect(state.lines).toEqual([]);
  });

  it("SET_QUANTITY fija una cantidad exacta", () => {
    const state = cartReducer(INITIAL_CART_STATE, { type: "SET_QUANTITY", productId: "p1", quantity: 5 });

    expect(state.lines).toEqual([{ productId: "p1", quantity: 5 }]);
  });

  it("SET_QUANTITY con 0 elimina la línea", () => {
    const initial: CartState = { lines: [{ productId: "p1", quantity: 5 }], couponCode: null };

    const state = cartReducer(initial, { type: "SET_QUANTITY", productId: "p1", quantity: 0 });

    expect(state.lines).toEqual([]);
  });

  it("SET_QUANTITY con un valor negativo se trata como 0 (dato corrupto)", () => {
    const initial: CartState = { lines: [{ productId: "p1", quantity: 5 }], couponCode: null };

    const state = cartReducer(initial, { type: "SET_QUANTITY", productId: "p1", quantity: -3 });

    expect(state.lines).toEqual([]);
  });

  it("mantiene varias líneas independientes", () => {
    let state = cartReducer(INITIAL_CART_STATE, { type: "ADD_PRODUCT", productId: "p1" });
    state = cartReducer(state, { type: "ADD_PRODUCT", productId: "p2" });
    state = cartReducer(state, { type: "ADD_PRODUCT", productId: "p1" });

    expect(state.lines).toEqual([
      { productId: "p1", quantity: 2 },
      { productId: "p2", quantity: 1 },
    ]);
  });

  it("CLEAR_CART vacía el carrito sin tocar el cupón", () => {
    const initial: CartState = { lines: [{ productId: "p1", quantity: 2 }], couponCode: "WELCOME2026" };

    const state = cartReducer(initial, { type: "CLEAR_CART" });

    expect(state.lines).toEqual([]);
    expect(state.couponCode).toBe("WELCOME2026");
  });

  it("APPLY_COUPON guarda el código", () => {
    const state = cartReducer(INITIAL_CART_STATE, { type: "APPLY_COUPON", couponCode: "WELCOME2026" });

    expect(state.couponCode).toBe("WELCOME2026");
  });

  it("APPLY_COUPON con espacios en blanco se trata como 'sin cupón'", () => {
    const state = cartReducer(INITIAL_CART_STATE, { type: "APPLY_COUPON", couponCode: "   " });

    expect(state.couponCode).toBeNull();
  });

  it("CLEAR_COUPON quita el cupón sin tocar el carrito", () => {
    const initial: CartState = { lines: [{ productId: "p1", quantity: 1 }], couponCode: "WELCOME2026" };

    const state = cartReducer(initial, { type: "CLEAR_COUPON" });

    expect(state.couponCode).toBeNull();
    expect(state.lines).toEqual([{ productId: "p1", quantity: 1 }]);
  });
});
