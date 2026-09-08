import { describe, expect, it } from "vitest";
import { CATALOG, COUPONS } from "./catalog.js";

describe("catalog", () => {
  it("expone los 7 productos de demostración con ids únicos", () => {
    expect(CATALOG).toHaveLength(7);
    expect(new Set(CATALOG.map((product) => product.id)).size).toBe(7);
  });

  it("incluye WELCOME2026 (15%) y BLACKFRIDAY40 (40%) sin fecha de expiración", () => {
    expect(COUPONS.get("WELCOME2026")).toEqual({ code: "WELCOME2026", rate: 0.15, expiresAt: null });
    expect(COUPONS.get("BLACKFRIDAY40")).toEqual({ code: "BLACKFRIDAY40", rate: 0.4, expiresAt: null });
  });
});
