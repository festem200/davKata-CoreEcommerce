import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors.js";

const API_KEY_HEADER = "X-Api-Key";

/**
 * Protege endpoints que exponen datos sensibles (qué se compró y por
 * cuánto) y que consume un sistema, no el navegador de un cliente anónimo.
 * Fail-closed: si no hay una API key configurada en el entorno, se
 * rechaza toda solicitud (nunca "abierto por accidente" en producción).
 */
export function requireApiKey(expectedApiKey: string | undefined) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const providedApiKey = req.header(API_KEY_HEADER);

    if (!expectedApiKey || providedApiKey !== expectedApiKey) {
      next(new UnauthorizedError());
      return;
    }

    next();
  };
}
