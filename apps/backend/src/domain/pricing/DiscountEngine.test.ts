import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { CouponExpiredError, CouponNotFoundError, InvalidCartLineError, ProductNotFoundError } from "../model/errors.js";
import { centsFromDecimal } from "../model/Money.js";
import type { Product } from "../model/Product.js";
import type { Coupon } from "./Coupon.js";
import { DiscountEngine } from "./DiscountEngine.js";
import { DiscountRuleFactory } from "./DiscountRuleFactory.js";

const CATALOG: Product[] = [
  { id: 1, name: "Audífonos Bluetooth", category: "Tecnología", unitPriceCents: centsFromDecimal(45.0), stock: 10 },
  { id: 2, name: "Teclado mecánico", category: "Tecnología", unitPriceCents: centsFromDecimal(89.9), stock: 5 },
  { id: 3, name: "Monitor 27\"", category: "Tecnología", unitPriceCents: centsFromDecimal(249.99), stock: 3 },
  { id: 4, name: "Power bank 20.000 mAh", category: "Tecnología", unitPriceCents: centsFromDecimal(32.5), stock: 2 },
  { id: 5, name: "Camiseta de algodón", category: "Ropa", unitPriceCents: centsFromDecimal(19.9), stock: 20 },
  { id: 6, name: "Termo de acero", category: "Hogar", unitPriceCents: centsFromDecimal(24.0), stock: 8 },
  { id: 7, name: "Libro Clean Architecture", category: "Libros", unitPriceCents: centsFromDecimal(38.0), stock: 6 },
];

const COUPONS = new Map<string, Coupon>([
  ["WELCOME2026", { code: "WELCOME2026", rate: 0.15, expiresAt: null }],
  ["BLACKFRIDAY40", { code: "BLACKFRIDAY40", rate: 0.4, expiresAt: null }],
  ["EXPIRED2020", { code: "EXPIRED2020", rate: 0.5, expiresAt: new Date("2020-01-01") }],
]);

function buildEngine(coupons: ReadonlyMap<string, Coupon> = COUPONS): DiscountEngine {
  const rules = DiscountRuleFactory.create({
    ruleOrder: ["category-discount", "volume-discount", "coupon-discount"],
    coupons,
  });

  return new DiscountEngine(rules);
}

describe("DiscountEngine — cascada de reglas oficiales", () => {
  it("carrito vacío: devuelve 0 en todo, nunca NaN", () => {
    const engine = buildEngine();

    const result = engine.calculate([], CATALOG, null);

    expect(result.originalSubtotalCents).toBe(0);
    expect(result.finalTotalCents).toBe(0);
    expect(result.totalDiscountCents).toBe(0);
    expect(result.effectiveDiscountRate).toBe(0);
    expect(Number.isNaN(result.effectiveDiscountRate)).toBe(false);
    expect(result.capApplied).toBe(false);
  });

  it("solo un producto Tecnología que no supera $100: únicamente aplica el descuento de categoría", () => {
    const engine = buildEngine();

    const result = engine.calculate([{ productId: 1, quantity: 1 }], CATALOG, null);

    expect(result.originalSubtotalCents).toBe(4500);
    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0]?.ruleId).toBe("category-discount");
    expect(result.discounts[0]?.amountCents).toBe(450); // 10% de 4500
    expect(result.finalTotalCents).toBe(4050);
    expect(result.capApplied).toBe(false);
  });

  it("p1 + p2 cruzan el umbral de $100 tras el descuento de categoría: activa también el descuento por volumen", () => {
    const engine = buildEngine();

    const result = engine.calculate(
      [
        { productId: 1, quantity: 1 },
        { productId: 2, quantity: 1 },
      ],
      CATALOG,
      null,
    );

    // Subtotal original: 4500 + 8990 = 13490
    // Categoría (10% de todo, ambos son Tecnología): 1349 -> subtotal 12141
    // 12141 > 10000 -> Volumen 5% de 12141 = 607 (floor) -> total 11534
    expect(result.originalSubtotalCents).toBe(13490);
    expect(result.discounts.map((d) => d.ruleId)).toEqual(["category-discount", "volume-discount"]);
    expect(result.discounts[0]?.amountCents).toBe(1349);
    expect(result.discounts[1]?.amountCents).toBe(607);
    expect(result.finalTotalCents).toBe(11534);
  });

  it("el 10% de categoría solo golpea la porción Tecnología cuando el carrito es mixto", () => {
    const engine = buildEngine();

    const result = engine.calculate(
      [
        { productId: 1, quantity: 1 }, // Tecnología 4500
        { productId: 5, quantity: 1 }, // Ropa 1990
      ],
      CATALOG,
      null,
    );

    // Categoría: 10% de 4500 = 450 (nada sobre los 1990 de Ropa)
    expect(result.discounts[0]?.amountCents).toBe(450);
    // Subtotal tras categoría: 6490 - 450 = 6040, no supera 10000 -> sin volumen
    expect(result.discounts).toHaveLength(1);
  });

  it("aplica el cupón WELCOME2026 (15%) sobre el total tras las reglas 1 y 2", () => {
    const engine = buildEngine();

    const result = engine.calculate(
      [
        { productId: 1, quantity: 1 },
        { productId: 2, quantity: 1 },
      ],
      CATALOG,
      "WELCOME2026",
    );

    // Tras categoría (12141) y volumen (11534): cupón 15% de 11534 = 1730 (floor)
    expect(result.discounts.map((d) => d.ruleId)).toEqual(["category-discount", "volume-discount", "coupon-discount"]);
    expect(result.discounts[2]?.amountCents).toBe(1730);
    expect(result.finalTotalCents).toBe(11534 - 1730);
    expect(result.capApplied).toBe(false);
  });

  it("stock insuficiente no es responsabilidad del motor de precios (se valida en el caso de uso de checkout)", () => {
    // El motor de descuentos NO conoce el stock: cotizar no decrementa ni valida disponibilidad.
    const engine = buildEngine();
    const product = CATALOG.find((p) => p.id === 4);

    const result = engine.calculate([{ productId: 4, quantity: 999 }], CATALOG, null);

    expect(result.originalSubtotalCents).toBe((product?.unitPriceCents ?? 0) * 999);
  });
});

describe("DiscountEngine — tope absoluto del 35%", () => {
  it("un cupón agresivo (BLACKFRIDAY40) dispara el tope y lo trunca EXACTO en 35%", () => {
    const engine = buildEngine();

    const result = engine.calculate([{ productId: 3, quantity: 1 }], CATALOG, "BLACKFRIDAY40");

    const capCents = Math.floor(result.originalSubtotalCents * 0.35);
    expect(result.capApplied).toBe(true);
    expect(result.totalDiscountCents).toBe(capCents);
    expect(result.finalTotalCents).toBe(result.originalSubtotalCents - capCents);
    expect(result.effectiveDiscountRate).toBeLessThanOrEqual(0.35);
  });

  it("el desglose de líneas sigue cuadrando exactamente cuando se aplica el tope", () => {
    const engine = buildEngine();

    const result = engine.calculate(
      [
        { productId: 1, quantity: 2 },
        { productId: 3, quantity: 1 },
      ],
      CATALOG,
      "BLACKFRIDAY40",
    );

    const sumFinalLines = result.lines.reduce((total, line) => total + line.finalAmountCents, 0);
    expect(sumFinalLines).toBe(result.finalTotalCents);
  });

  it("frontera exacta: un descuento que cae justo en 35% no dispara el ajuste por tope", () => {
    // Cupón sintético al 35% exacto sin categoría ni volumen (un solo producto no-Tecnología, bajo $100)
    const coupons = new Map<string, Coupon>([["EXACT35", { code: "EXACT35", rate: 0.35, expiresAt: null }]]);
    const engine = buildEngine(coupons);

    const result = engine.calculate([{ productId: 6, quantity: 1 }], CATALOG, "EXACT35");

    expect(result.capApplied).toBe(false);
    expect(result.effectiveDiscountRate).toBeCloseTo(0.35, 5);
  });

  it("[hallazgo] con la configuración oficial (10% + 5% + 15%) el descuento nunca supera 27,325%, así que el tope del 35% jamás se activa", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...CATALOG.map((p) => p.id)), { minLength: 1, maxLength: 7 }),
        fc.boolean(),
        (productIds, useCoupon) => {
          const uniqueIds = [...new Set(productIds)];
          const cartLines = uniqueIds.map((productId) => ({ productId, quantity: 1 }));
          const engine = buildEngine();

          const result = engine.calculate(cartLines, CATALOG, useCoupon ? "WELCOME2026" : null);

          expect(result.effectiveDiscountRate).toBeLessThanOrEqual(0.27325 + 1e-9);
          expect(result.capApplied).toBe(false);
        },
      ),
    );
  });
});

describe("DiscountEngine — invariantes (property-based)", () => {
  const arbitraryCartLine = fc.record({
    productId: fc.constantFrom(...CATALOG.map((p) => p.id)),
    quantity: fc.integer({ min: 1, max: 10 }),
  });

  const arbitraryCart = fc
    .uniqueArray(arbitraryCartLine, { selector: (line) => line.productId, minLength: 0, maxLength: 7 });

  it("el total final nunca es negativo", () => {
    fc.assert(
      fc.property(arbitraryCart, fc.constantFrom(null, "WELCOME2026", "BLACKFRIDAY40"), (cart, coupon) => {
        const engine = buildEngine();
        const result = engine.calculate(cart, CATALOG, coupon);

        expect(result.finalTotalCents).toBeGreaterThanOrEqual(0);
      }),
    );
  });

  it("el descuento efectivo nunca supera el 35%", () => {
    fc.assert(
      fc.property(arbitraryCart, fc.constantFrom(null, "WELCOME2026", "BLACKFRIDAY40"), (cart, coupon) => {
        const engine = buildEngine();
        const result = engine.calculate(cart, CATALOG, coupon);

        expect(result.effectiveDiscountRate).toBeLessThanOrEqual(0.35 + 1e-9);
      }),
    );
  });

  it("la suma de los montos finales por línea cuadra exactamente con el total final (cero centavos perdidos)", () => {
    fc.assert(
      fc.property(arbitraryCart, fc.constantFrom(null, "WELCOME2026", "BLACKFRIDAY40"), (cart, coupon) => {
        const engine = buildEngine();
        const result = engine.calculate(cart, CATALOG, coupon);

        const sumLines = result.lines.reduce((total, line) => total + line.finalAmountCents, 0);
        expect(sumLines).toBe(result.finalTotalCents);
      }),
    );
  });

  it("agregar un producto nunca reduce el total a pagar", () => {
    fc.assert(
      fc.property(arbitraryCart, fc.constantFrom(...CATALOG.map((p) => p.id)), (cart, extraProductId) => {
        fc.pre(!cart.some((line) => line.productId === extraProductId));

        const engine = buildEngine();
        const before = engine.calculate(cart, CATALOG, null);
        const after = engine.calculate([...cart, { productId: extraProductId, quantity: 1 }], CATALOG, null);

        expect(after.finalTotalCents).toBeGreaterThanOrEqual(before.finalTotalCents);
      }),
    );
  });
});

describe("DiscountEngine — casos de borde de validación", () => {
  it("cantidad 0 se rechaza como dato corrupto", () => {
    const engine = buildEngine();

    expect(() => engine.calculate([{ productId: 1, quantity: 0 }], CATALOG, null)).toThrow(InvalidCartLineError);
  });

  it("cantidad negativa se rechaza como dato corrupto", () => {
    const engine = buildEngine();

    expect(() => engine.calculate([{ productId: 1, quantity: -3 }], CATALOG, null)).toThrow(InvalidCartLineError);
  });

  it("cantidad no entera se rechaza como dato corrupto", () => {
    const engine = buildEngine();

    expect(() => engine.calculate([{ productId: 1, quantity: 1.5 }], CATALOG, null)).toThrow(InvalidCartLineError);
  });

  it("producto inexistente lanza un error explícito", () => {
    const engine = buildEngine();

    expect(() => engine.calculate([{ productId: 999, quantity: 1 }], CATALOG, null)).toThrow(
      ProductNotFoundError,
    );
  });

  it("cupón vacío o solo espacios se trata como 'sin cupón', no como error", () => {
    const engine = buildEngine();

    const result = engine.calculate([{ productId: 1, quantity: 1 }], CATALOG, "   ");

    expect(result.discounts.some((d) => d.ruleId === "coupon-discount")).toBe(false);
  });

  it("cupón inexistente lanza un error explícito", () => {
    const engine = buildEngine();

    expect(() => engine.calculate([{ productId: 1, quantity: 1 }], CATALOG, "NO-EXISTE")).toThrow(
      CouponNotFoundError,
    );
  });

  it("cupón expirado lanza un error explícito", () => {
    const engine = buildEngine();

    expect(() => engine.calculate([{ productId: 1, quantity: 1 }], CATALOG, "EXPIRED2020")).toThrow(
      CouponExpiredError,
    );
  });
});
