import { quoteRequestSchema } from "@core-ecommerce/contracts";
import { Router } from "express";
import type { CalculateQuoteUseCase } from "../../../application/CalculateQuoteUseCase.js";

export function createQuoteRouter(calculateQuoteUseCase: CalculateQuoteUseCase): Router {
  const router = Router();

  router.post("/", async (req, res, next) => {
    try {
      const input = quoteRequestSchema.parse(req.body);
      const quote = await calculateQuoteUseCase.execute(input.cartLines, input.couponCode ?? null);
      res.json(quote);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
