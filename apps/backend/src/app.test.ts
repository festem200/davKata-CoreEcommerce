import { describe, expect, it } from "vitest";
import request from "supertest";
import { type AppDependencies, createApp } from "./app.js";
import { CalculateQuoteUseCase } from "./application/CalculateQuoteUseCase.js";
import { CheckoutUseCase } from "./application/CheckoutUseCase.js";
import { DiscountEngine } from "./domain/pricing/DiscountEngine.js";
import { DiscountRuleFactory } from "./domain/pricing/DiscountRuleFactory.js";
import { InMemoryOrderRepository } from "./infrastructure/persistence/memory/InMemoryOrderRepository.js";
import { InMemoryProductRepository } from "./infrastructure/persistence/memory/InMemoryProductRepository.js";

const CATALOG = [
  { id: "p1", name: "Audífonos Bluetooth", category: "Tecnología", unitPriceCents: 4500, stock: 10 },
  { id: "p4", name: "Power bank", category: "Tecnología", unitPriceCents: 3250, stock: 2 },
];

const COUPONS = new Map([
  ["WELCOME2026", { code: "WELCOME2026", rate: 0.15, expiresAt: null }],
  ["EXPIRED2020", { code: "EXPIRED2020", rate: 0.5, expiresAt: new Date("2020-01-01") }],
]);

function buildDependencies(overrides: Partial<AppDependencies> = {}): AppDependencies {
  const productRepository = new InMemoryProductRepository(CATALOG);
  const orderRepository = new InMemoryOrderRepository();
  const engine = new DiscountEngine(
    DiscountRuleFactory.create({ ruleOrder: ["category-discount", "volume-discount", "coupon-discount"], coupons: COUPONS }),
  );

  return {
    productRepository,
    orderRepository,
    calculateQuoteUseCase: new CalculateQuoteUseCase(productRepository, engine),
    checkoutUseCase: new CheckoutUseCase(productRepository, orderRepository, engine),
    ordersApiKey: "test-api-key",
    ...overrides,
  };
}

describe("GET /health", () => {
  it("responde 200 con estado ok", async () => {
    const app = createApp(buildDependencies());

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("GET /api/v1/products", () => {
  it("responde 200 con el catálogo", async () => {
    const app = createApp(buildDependencies());

    const response = await request(app).get("/api/v1/products");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it("responde 500 si el repositorio falla inesperadamente", async () => {
    const dependencies = buildDependencies();
    dependencies.productRepository.findAll = async () => {
      throw new Error("conexión perdida");
    };
    const app = createApp(dependencies);

    const response = await request(app).get("/api/v1/products");

    expect(response.status).toBe(500);
  });
});

describe("POST /api/v1/cart/quote", () => {
  it("responde 200 con el desglose de descuentos", async () => {
    const app = createApp(buildDependencies());

    const response = await request(app)
      .post("/api/v1/cart/quote")
      .send({ cartLines: [{ productId: "p1", quantity: 1 }] });

    expect(response.status).toBe(200);
    expect(response.body.finalTotalCents).toBe(4050);
  });

  it("responde 400 (Problem Details) si el body no cumple el esquema", async () => {
    const app = createApp(buildDependencies());

    const response = await request(app)
      .post("/api/v1/cart/quote")
      .send({ cartLines: [{ productId: "p1", quantity: -1 }] });

    expect(response.status).toBe(400);
    expect(response.headers["content-type"]).toContain("application/problem+json");
    expect(response.body.type).toContain("validation-error");
  });

  it("responde 422 si el cupón está expirado", async () => {
    const app = createApp(buildDependencies());

    const response = await request(app)
      .post("/api/v1/cart/quote")
      .send({ cartLines: [{ productId: "p1", quantity: 1 }], couponCode: "EXPIRED2020" });

    expect(response.status).toBe(422);
    expect(response.body.type).toContain("invalid-coupon");
  });

  it("responde 404 si el producto no existe en el catálogo", async () => {
    const app = createApp(buildDependencies());

    const response = await request(app)
      .post("/api/v1/cart/quote")
      .send({ cartLines: [{ productId: "no-existe", quantity: 1 }] });

    expect(response.status).toBe(404);
    expect(response.body.type).toContain("not-found");
  });

  it("responde 500 con Problem Details genérico ante un error inesperado, sin filtrar detalles internos", async () => {
    const dependencies = buildDependencies();
    dependencies.calculateQuoteUseCase.execute = async () => {
      throw new Error("boom: detalle interno que nunca debe llegar al cliente");
    };
    const app = createApp(dependencies);

    const response = await request(app)
      .post("/api/v1/cart/quote")
      .send({ cartLines: [{ productId: "p1", quantity: 1 }] });

    expect(response.status).toBe(500);
    expect(response.body.type).toContain("internal-error");
    expect(JSON.stringify(response.body)).not.toContain("boom");
  });
});

describe("POST /api/v1/checkout", () => {
  it("responde 400 si falta el header Idempotency-Key", async () => {
    const app = createApp(buildDependencies());

    const response = await request(app)
      .post("/api/v1/checkout")
      .send({ cartLines: [{ productId: "p1", quantity: 1 }] });

    expect(response.status).toBe(400);
    expect(response.body.type).toContain("missing-idempotency-key");
  });

  it("responde 201 y persiste la orden", async () => {
    const app = createApp(buildDependencies());

    const response = await request(app)
      .post("/api/v1/checkout")
      .set("Idempotency-Key", "key-1")
      .send({ cartLines: [{ productId: "p1", quantity: 1 }] });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.quote.finalTotalCents).toBe(4050);
  });

  it("responde 409 si el stock es insuficiente", async () => {
    const app = createApp(buildDependencies());

    const response = await request(app)
      .post("/api/v1/checkout")
      .set("Idempotency-Key", "key-2")
      .send({ cartLines: [{ productId: "p4", quantity: 99 }] });

    expect(response.status).toBe(409);
    expect(response.body.type).toContain("insufficient-stock");
  });

  it("es idempotente: reintentar con la misma clave devuelve la misma orden (201)", async () => {
    const app = createApp(buildDependencies());
    const payload = { cartLines: [{ productId: "p1", quantity: 1 }] };

    const first = await request(app).post("/api/v1/checkout").set("Idempotency-Key", "key-3").send(payload);
    const second = await request(app).post("/api/v1/checkout").set("Idempotency-Key", "key-3").send(payload);

    expect(second.body.id).toBe(first.body.id);
  });
});

describe("GET /api/v1/orders/:id", () => {
  it("responde 401 sin API key", async () => {
    const app = createApp(buildDependencies());

    const response = await request(app).get("/api/v1/orders/no-existe");

    expect(response.status).toBe(401);
  });

  it("responde 404 con API key válida pero orden inexistente", async () => {
    const app = createApp(buildDependencies());

    const response = await request(app).get("/api/v1/orders/no-existe").set("X-Api-Key", "test-api-key");

    expect(response.status).toBe(404);
  });

  it("responde 200 con la orden cuando existe y la API key es válida", async () => {
    const app = createApp(buildDependencies());

    const checkoutResponse = await request(app)
      .post("/api/v1/checkout")
      .set("Idempotency-Key", "key-4")
      .send({ cartLines: [{ productId: "p1", quantity: 1 }] });

    const orderResponse = await request(app)
      .get(`/api/v1/orders/${checkoutResponse.body.id}`)
      .set("X-Api-Key", "test-api-key");

    expect(orderResponse.status).toBe(200);
    expect(orderResponse.body.id).toBe(checkoutResponse.body.id);
  });
});
