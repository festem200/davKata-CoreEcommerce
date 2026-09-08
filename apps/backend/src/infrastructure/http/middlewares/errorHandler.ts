import type { ErrorRequestHandler } from "express";
import { toProblemDetail } from "../problemDetails.js";

export function errorHandler(): ErrorRequestHandler {
  return (error, req, res, _next) => {
    const problem = toProblemDetail(error, req.originalUrl);

    if (problem.status === 500) {
      // eslint-disable-next-line no-console
      console.error(error);
    }

    res.status(problem.status).type("application/problem+json").json(problem);
  };
}
