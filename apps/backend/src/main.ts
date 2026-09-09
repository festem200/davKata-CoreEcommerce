import "dotenv/config";
import { createApp, type AppDependencies } from "./app.js";
import { CalculateQuoteUseCase } from "./application/CalculateQuoteUseCase.js";
import { CheckoutUseCase } from "./application/CheckoutUseCase.js";
import { DiscountEngine } from "./domain/pricing/DiscountEngine.js";
import { DiscountRuleFactory } from "./domain/pricing/DiscountRuleFactory.js";
import type { OrderRepository } from "./domain/ports/OrderRepository.js";
import type { ProductRepository } from "./domain/ports/ProductRepository.js";
import type { Coupon } from "./domain/pricing/Coupon.js";
import { CATALOG } from "./infrastructure/config/catalog.js";
import { loadEnv } from "./infrastructure/config/env.js";
import { loadCoupons } from "./infrastructure/postgres/loadCoupons.js";
import { PostgresOrderRepository } from "./infrastructure/postgres/PostgresOrderRepository.js";
import { PostgresProductRepository } from "./infrastructure/postgres/PostgresProductRepository.js";
import { applySchema, seedProductsIfEmpty } from "./infrastructure/postgres/schema.js";

const env = loadEnv();

/**
 * Único adaptador de persistencia: Postgres. No hay variable de entorno
 * para elegir otro — DATABASE_URL es obligatorio (ver env.ts) y el
 * dominio/casos de uso solo conocen el puerto (ProductRepository/
 * OrderRepository), nunca esta función.
 */
async function createRepositories(): Promise<{
  productRepository: ProductRepository;
  orderRepository: OrderRepository;
  coupons: ReadonlyMap<string, Coupon>;
}> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  await applySchema(pool);
  await seedProductsIfEmpty(pool, CATALOG);

  return {
    productRepository: new PostgresProductRepository(pool),
    orderRepository: new PostgresOrderRepository(pool),
    coupons: await loadCoupons(pool),
  };
}

async function main(): Promise<void> {
  const { productRepository, orderRepository, coupons } = await createRepositories();
  const discountEngine = new DiscountEngine(
    DiscountRuleFactory.create({
      ruleOrder: ["category-discount", "volume-discount", "coupon-discount"],
      coupons,
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
    // eslint-disable-next-line no-console -- log de arranque, no queda ninguna otra forma de observarlo en este proceso
    console.log(`[backend] escuchando en el puerto ${env.PORT} (persistencia: postgres)`);
  });
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console -- el proceso está por morir (exitCode 1); no hay otro canal para el error fatal
  console.error("[backend] error fatal al iniciar:", error);
  process.exitCode = 1;
});
