import { ZodError } from "zod";
import { InsufficientStockException } from "../../application/CheckoutUseCase.js";
import {
  CouponExpiredError,
  CouponNotFoundError,
  InvalidCartLineError,
  OrderNotFoundError,
  ProductNotFoundError,
} from "../../domain/model/errors.js";
import { MissingIdempotencyKeyError, UnauthorizedError } from "./errors.js";

const PROBLEM_BASE_URI = "https://core-ecommerce.soultec.dev/problems";

export interface ProblemDetail {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance: string;
}

/**
 * Traduce excepciones del dominio/aplicación a RFC 9457 Problem Details —
 * el estándar de errores usado en Open Banking (Berlin Group / OBIE). Un
 * error 500 nunca filtra el stack trace ni detalles internos al cliente.
 */
export function toProblemDetail(error: unknown, instance: string): ProblemDetail {
  if (error instanceof ZodError) {
    return {
      type: `${PROBLEM_BASE_URI}/validation-error`,
      title: "La solicitud no cumple el esquema esperado",
      status: 400,
      detail: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      instance,
    };
  }

  if (error instanceof MissingIdempotencyKeyError) {
    return { type: `${PROBLEM_BASE_URI}/missing-idempotency-key`, title: "Falta Idempotency-Key", status: 400, detail: error.message, instance };
  }

  if (error instanceof InvalidCartLineError) {
    return { type: `${PROBLEM_BASE_URI}/invalid-cart-line`, title: "Línea de carrito inválida", status: 400, detail: error.message, instance };
  }

  if (error instanceof ProductNotFoundError || error instanceof OrderNotFoundError) {
    return { type: `${PROBLEM_BASE_URI}/not-found`, title: "Recurso no encontrado", status: 404, detail: error.message, instance };
  }

  if (error instanceof CouponNotFoundError || error instanceof CouponExpiredError) {
    return { type: `${PROBLEM_BASE_URI}/invalid-coupon`, title: "Cupón inválido", status: 422, detail: error.message, instance };
  }

  if (error instanceof InsufficientStockException) {
    return { type: `${PROBLEM_BASE_URI}/insufficient-stock`, title: "Stock insuficiente", status: 409, detail: error.message, instance };
  }

  if (error instanceof UnauthorizedError) {
    return { type: `${PROBLEM_BASE_URI}/unauthorized`, title: "No autorizado", status: 401, detail: error.message, instance };
  }

  return {
    type: `${PROBLEM_BASE_URI}/internal-error`,
    title: "Error interno del servidor",
    status: 500,
    detail: "Ocurrió un error inesperado. Contacte a soporte con el X-Correlation-Id de esta respuesta.",
    instance,
  };
}
