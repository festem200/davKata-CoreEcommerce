import { checkoutRequestSchema } from "@core-ecommerce/contracts";
import { Router } from "express";
import type { CheckoutUseCase } from "../../../application/CheckoutUseCase.js";
import { MissingIdempotencyKeyError } from "../errors.js";
import { toOrderResponseDto } from "../mappers.js";

const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";

export function createCheckoutRouter(checkoutUseCase: CheckoutUseCase): Router {
  const router = Router();

  router.post("/", async (req, res, next) => {
    try {
      const idempotencyKey = req.header(IDEMPOTENCY_KEY_HEADER);
      if (!idempotencyKey) {
        throw new MissingIdempotencyKeyError();
      }

      const input = checkoutRequestSchema.parse(req.body);
      const order = await checkoutUseCase.execute({
        cartLines: input.cartLines,
        couponCode: input.couponCode ?? null,
        idempotencyKey,
      });

      res.status(201).json(toOrderResponseDto(order));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
