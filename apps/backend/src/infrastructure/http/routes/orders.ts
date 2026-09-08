import { Router } from "express";
import { OrderNotFoundError } from "../../../domain/model/errors.js";
import type { OrderRepository } from "../../../domain/ports/OrderRepository.js";
import { requireApiKey } from "../middlewares/requireApiKey.js";
import { toOrderResponseDto } from "../mappers.js";

export function createOrdersRouter(orderRepository: OrderRepository, ordersApiKey: string | undefined): Router {
  const router = Router();

  router.get("/:id", requireApiKey(ordersApiKey), async (req, res, next) => {
    try {
      const rawId = req.params["id"];
      const orderId = Array.isArray(rawId) ? (rawId[0] ?? "") : (rawId ?? "");
      const order = await orderRepository.findById(orderId);
      if (!order) {
        throw new OrderNotFoundError(orderId);
      }

      res.json(toOrderResponseDto(order));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
