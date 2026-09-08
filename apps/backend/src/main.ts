import "dotenv/config";
import { createApp, type AppDependencies } from "./app.js";
import { CalculateQuoteUseCase } from "./application/CalculateQuoteUseCase.js";
import { CheckoutUseCase } from "./application/CheckoutUseCase.js";
import { DiscountEngine } from "./domain/pricing/DiscountEngine.js";
import { DiscountRuleFactory } from "./domain/pricing/DiscountRuleFactory.js";
import type { OrderRepository } from "./domain/ports/OrderRepository.js";
import type { ProductRepository } from "./domain/ports/ProductRepository.js";
import { CATALOG, COUPONS } from "./infrastructure/config/catalog.js";
import { loadEnv } from "./infrastructure/config/env.js";
import { JsonOrderRepository } from "./infrastructure/persistence/json/JsonOrderRepository.js";
import { JsonProductRepository } from "./infrastructure/persistence/json/JsonProductRepository.js";
import { InMemoryOrderRepository } from "./infrastructure/persistence/memory/InMemoryOrderRepository.js";
import { InMemoryProductRepository } from "./infrastructure/persistence/memory/InMemoryProductRepository.js";
import { PostgresOrderRepository } from "./infrastructure/persistence/postgres/PostgresOrderRepository.js";
import { PostgresProductRepository } from "./infrastructure/persistence/postgres/PostgresProductRepository.js";
import { applySchema, seedProductsIfEmpty } from "./infrastructure/persistence/postgres/schema.js";

const env = loadEnv();

async function createRepositories(): Promise<{
  productRepository: ProductRepository;
  orderRepository: OrderRepository;
}> {
  switch (env.PERSISTENCE_DRIVER) {
    case "memory":
      return {
        productRepository: new InMemoryProductRepository(CATALOG),
        orderRepository: new InMemoryOrderRepository(),
      };

    case "postgres": {
      if (!env.DATABASE_URL) {
        throw new Error("DATABASE_URL es obligatorio cuando PERSISTENCE_DRIVER=postgres");
      }
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: env.DATABASE_URL });
      await applySchema(pool);
      await seedProductsIfEmpty(pool, CATALOG);
      return {
        productRepository: new PostgresProductRepository(pool),
        orderRepository: new PostgresOrderRepository(pool),
      };
    }

    case "json":
    default:
      return {
        productRepository: await JsonProductRepository.create("./data/products.json", CATALOG),
        orderRepository: await JsonOrderRepository.create("./data/orders.json"),
      };
  }
}

async function main(): Promise<void> {
  const { productRepository, orderRepository } = await createRepositories();
  const discountEngine = new DiscountEngine(
    DiscountRuleFactory.create({
      ruleOrder: ["category-discount", "volume-discount", "coupon-discount"],
      coupons: COUPONS,
    }),
  );

  const dependencies: AppDependencies = {
    productRepository,
    orderRepository,
    calculateQuoteUseCase: new CalculateQuoteUseCase(productRepository, discountEngine),
    checkoutUseCase: new CheckoutUseCase(productRepository, orderRepository, discountEngine),
    ordersApiKey: env.ORDERS_API_KEY,
    frontendDistPath: "./public",
  };

  const app = createApp(dependencies);

  app.listen(env.PORT, () => {
    console.log(`[backend] escuchando en el puerto ${env.PORT} (driver: ${env.PERSISTENCE_DRIVER})`);
  });
}

main().catch((error: unknown) => {
  console.error("[backend] error fatal al iniciar:", error);
  process.exitCode = 1;
});
