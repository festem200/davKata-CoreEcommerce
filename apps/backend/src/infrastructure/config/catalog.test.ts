import { describe, expect, it } from "vitest";
import { CATALOG } from "./catalog.js";

describe("catalog", () => {
  it("expone los productos de demostración con ids únicos", () => {
    expect(CATALOG).toHaveLength(23);
    expect(new Set(CATALOG.map((product) => product.id)).size).toBe(23);
  });
});
