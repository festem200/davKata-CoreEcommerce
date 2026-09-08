import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors.js";
import { requireApiKey } from "./requireApiKey.js";

function buildRequest(headerValue: string | undefined): Request {
  return { header: () => headerValue } as unknown as Request;
}

function buildNext(): NextFunction {
  return vi.fn() as unknown as NextFunction;
}

describe("requireApiKey", () => {
  it("permite el paso cuando la key coincide exactamente", () => {
    const next = buildNext();
    requireApiKey("secreto-123")(buildRequest("secreto-123"), {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("rechaza cuando la key es distinta pero de la misma longitud", () => {
    const next = buildNext();
    requireApiKey("secreto-123")(buildRequest("secreto-456"), {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("rechaza cuando la key tiene distinta longitud (sin comparar byte a byte)", () => {
    const next = buildNext();
    requireApiKey("secreto-123")(buildRequest("corta"), {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("rechaza cuando no se envía ninguna key", () => {
    const next = buildNext();
    requireApiKey("secreto-123")(buildRequest(undefined), {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("rechaza toda solicitud (fail-closed) si no hay key configurada en el entorno", () => {
    const next = buildNext();
    requireApiKey(undefined)(buildRequest("cualquier-cosa"), {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});
