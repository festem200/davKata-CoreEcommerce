import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors.js";

const API_KEY_HEADER = "X-Api-Key";

/**
 * Compara dos strings en tiempo constante para evitar un ataque de
 * temporización (CWE-208): `!==` retorna en cuanto encuentra el primer
 * carácter distinto, lo que permite inferir la clave carácter por
 * carácter midiendo la latencia de muchos intentos.
 */
function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Protege endpoints que exponen datos sensibles (qué se compró y por
 * cuánto) y que consume un sistema, no el navegador de un cliente anónimo.
 * Fail-closed: si no hay una API key configurada en el entorno, se
 * rechaza toda solicitud (nunca "abierto por accidente" en producción).
 */
export function requireApiKey(expectedApiKey: string | undefined) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const providedApiKey = req.header(API_KEY_HEADER);

    if (!expectedApiKey || !providedApiKey || !safeEquals(providedApiKey, expectedApiKey)) {
      next(new UnauthorizedError());
      return;
    }

    next();
  };
}
