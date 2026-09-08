import { Router } from "express";
import type { ProductRepository } from "../../../domain/ports/ProductRepository.js";

export function createProductsRouter(productRepository: ProductRepository): Router {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      const products = await productRepository.findAll();
      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
