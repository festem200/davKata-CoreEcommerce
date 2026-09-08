import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const CORRELATION_ID_HEADER = "X-Correlation-Id";

export function correlationId() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const incoming = req.header(CORRELATION_ID_HEADER);
    const id = incoming && incoming.trim().length > 0 ? incoming : randomUUID();
    res.setHeader(CORRELATION_ID_HEADER, id);
    next();
  };
}
