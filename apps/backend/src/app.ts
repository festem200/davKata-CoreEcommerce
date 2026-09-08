import { existsSync } from "node:fs";
import { join } from "node:path";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { CalculateQuoteUseCase } from "./application/CalculateQuoteUseCase.js";
import type { CheckoutUseCase } from "./application/CheckoutUseCase.js";
import type { OrderRepository } from "./domain/ports/OrderRepository.js";
import type { ProductRepository } from "./domain/ports/ProductRepository.js";
import { correlationId } from "./infrastructure/http/middlewares/correlationId.js";
import { errorHandler } from "./infrastructure/http/middlewares/errorHandler.js";
import { createCheckoutRouter } from "./infrastructure/http/routes/checkout.js";
import { createOrdersRouter } from "./infrastructure/http/routes/orders.js";
import { createProductsRouter } from "./infrastructure/http/routes/products.js";
import { createQuoteRouter } from "./infrastructure/http/routes/quote.js";

export interface AppDependencies {
  readonly productRepository: ProductRepository;
  readonly orderRepository: OrderRepository;
  readonly calculateQuoteUseCase: CalculateQuoteUseCase;
  readonly checkoutUseCase: CheckoutUseCase;
  readonly ordersApiKey: string | undefined;
  /**
   * Directorio con el build de producción del frontend (`vite build`).
   * Un único artefacto sirve API + estáticos: una sola imagen, una sola
   * URL, cero CORS. En desarrollo se omite (Vite corre aparte con HMR).
   */
  readonly frontendDistPath?: string;
}

const REQUEST_BODY_SIZE_LIMIT = "100kb";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 100;

export function createApp(deps: AppDependencies): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: REQUEST_BODY_SIZE_LIMIT }));
  app.use(correlationId());
  app.use(rateLimit({ windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX_REQUESTS, standardHeaders: true, legacyHeaders: false }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/v1/products", createProductsRouter(deps.productRepository));
  app.use("/api/v1/cart/quote", createQuoteRouter(deps.calculateQuoteUseCase));
  app.use("/api/v1/checkout", createCheckoutRouter(deps.checkoutUseCase));
  app.use("/api/v1/orders", createOrdersRouter(deps.orderRepository, deps.ordersApiKey));

  if (deps.frontendDistPath && existsSync(deps.frontendDistPath)) {
    const frontendDistPath = deps.frontendDistPath;
    app.use(express.static(frontendDistPath));
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api/")) {
        next();
        return;
      }
      res.sendFile(join(frontendDistPath, "index.html"));
    });
  }

  app.use(errorHandler());

  return app;
}
