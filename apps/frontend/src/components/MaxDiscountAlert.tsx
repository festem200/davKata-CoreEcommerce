/**
 * HU4: notificación visual persistente y distintiva cuando el carrito
 * alcanza el límite máximo de descuento del 35%. El texto es literal al
 * enunciado — no se parafrasea.
 */
export function MaxDiscountAlert({ visible }: { visible: boolean }) {
  if (!visible) {
    return null;
  }

  return (
    <div role="alert" className="max-discount-alert">
      ¡Enhorabuena! Has alcanzado el límite máximo de ahorro permitido (35%)
    </div>
  );
}
