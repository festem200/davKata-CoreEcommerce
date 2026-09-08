import { useState, type FormEvent } from "react";
import { useCart } from "../state/CartContext.js";

export function CouponInput() {
  const { state, applyCoupon, clearCoupon } = useCart();
  const [draft, setDraft] = useState("");

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (draft.trim().length > 0) {
      applyCoupon(draft);
      setDraft("");
    }
  }

  return (
    <form className="coupon-input" onSubmit={handleSubmit}>
      <label htmlFor="coupon-code">Código de cupón</label>
      <div className="coupon-input__row">
        <input
          id="coupon-code"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="WELCOME2026"
        />
        <button type="submit" className="button-pill button-pill--primary">
          Aplicar
        </button>
      </div>
      {state.couponCode && (
        <p className="coupon-input__applied">
          Cupón aplicado: <strong>{state.couponCode}</strong>{" "}
          <button type="button" className="button-link" onClick={clearCoupon}>
            Quitar
          </button>
        </p>
      )}
    </form>
  );
}
