import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.js";

describe("loadEnv", () => {
  it("aplica valores por defecto cuando solo se provee DATABASE_URL", () => {
    const env = loadEnv({ DATABASE_URL: "postgres://x" });

    expect(env.PORT).toBe(8080);
    expect(env.NODE_ENV).toBe("development");
  });

  it("lee y convierte las variables provistas", () => {
    const env = loadEnv({ PORT: "3000", DATABASE_URL: "postgres://x", ORDERS_API_KEY: "secreto" });

    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_URL).toBe("postgres://x");
    expect(env.ORDERS_API_KEY).toBe("secreto");
  });

  it("rechaza si falta DATABASE_URL: el backend persiste solo en Postgres", () => {
    expect(() => loadEnv({})).toThrow();
  });
});
