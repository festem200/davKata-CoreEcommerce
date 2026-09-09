export class ProductNotFoundError extends Error {
  constructor(public readonly productId: number) {
    super(`El producto '${productId}' no existe en el catálogo`);
    this.name = "ProductNotFoundError";
  }
}

export class InvalidCartLineError extends Error {
  constructor(
    public readonly productId: number,
    public readonly quantity: number,
  ) {
    super(`La cantidad '${quantity}' para el producto '${productId}' no es válida: debe ser un entero mayor a 0`);
    this.name = "InvalidCartLineError";
  }
}

export class CouponNotFoundError extends Error {
  constructor(public readonly couponCode: string) {
    super(`El cupón '${couponCode}' no existe`);
    this.name = "CouponNotFoundError";
  }
}

export class CouponExpiredError extends Error {
  constructor(public readonly couponCode: string) {
    super(`El cupón '${couponCode}' ya expiró`);
    this.name = "CouponExpiredError";
  }
}

export class OrderNotFoundError extends Error {
  constructor(public readonly orderId: number) {
    super(`La orden '${orderId}' no existe`);
    this.name = "OrderNotFoundError";
  }
}
