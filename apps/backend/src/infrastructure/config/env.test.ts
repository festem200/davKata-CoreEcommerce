import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.js";

describe("loadEnv", () => {
  it("aplica valores por defecto cuando el entorno está vacío", () => {
    const env = loadEnv({});

    expect(env.PORT).toBe(8080);
    expect(env.PERSISTENCE_DRIVER).toBe("json");
    expect(env.NODE_ENV).toBe("development");
  });

  it("lee y convierte las variables provistas", () => {
    const env = loadEnv({ PORT: "3000", PERSISTENCE_DRIVER: "postgres", DATABASE_URL: "postgres://x", ORDERS_API_KEY: "secreto" });

    expect(env.PORT).toBe(3000);
    expect(env.PERSISTENCE_DRIVER).toBe("postgres");
    expect(env.DATABASE_URL).toBe("postgres://x");
    expect(env.ORDERS_API_KEY).toBe("secreto");
  });

  it("rechaza un PERSISTENCE_DRIVER desconocido", () => {
    expect(() => loadEnv({ PERSISTENCE_DRIVER: "xml" })).toThrow();
  });
});
