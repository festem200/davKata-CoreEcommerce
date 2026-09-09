import { describe, expect, it } from "vitest";
import { loadCoupons } from "./loadCoupons.js";
import { connectToTestDatabase, resetCoupons } from "./testDatabase.js";

const pool = await connectToTestDatabase();
const describeIfPostgres = pool ? describe : describe.skip;

describeIfPostgres("loadCoupons", () => {
  it("arma el Map de cupones desde la tabla coupons, indexado por code", async () => {
    if (!pool) return;

    await resetCoupons(pool, [
      { code: "WELCOME2026", rate: 0.15, expiresAt: null },
      { code: "EXPIRED2020", rate: 0.5, expiresAt: new Date("2020-01-01T00:00:00Z") },
    ]);

    const coupons = await loadCoupons(pool);

    expect(coupons.size).toBe(2);
    expect(coupons.get("WELCOME2026")).toEqual({ code: "WELCOME2026", rate: 0.15, expiresAt: null });
    expect(coupons.get("EXPIRED2020")?.expiresAt).toEqual(new Date("2020-01-01T00:00:00Z"));
    expect(coupons.get("NO-EXISTE")).toBeUndefined();
  });
});
