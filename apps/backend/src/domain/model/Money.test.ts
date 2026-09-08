import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { allocateProportionally, centsFromDecimal, floorPercentageOf, sumCents } from "./Money.js";

describe("centsFromDecimal", () => {
  it("convierte un valor decimal a centavos enteros", () => {
    expect(centsFromDecimal(45.0)).toBe(4500);
    expect(centsFromDecimal(89.9)).toBe(8990);
    expect(centsFromDecimal(249.99)).toBe(24999);
  });
});

describe("sumCents", () => {
  it("suma una lista de centavos", () => {
    expect(sumCents([100, 200, 300])).toBe(600);
  });

  it("devuelve 0 para una lista vacía", () => {
    expect(sumCents([])).toBe(0);
  });
});

describe("floorPercentageOf", () => {
  it("redondea siempre hacia abajo, a favor de la tienda", () => {
    expect(floorPercentageOf(1000, 0.1)).toBe(100);
    expect(floorPercentageOf(999, 0.1)).toBe(99);
    expect(floorPercentageOf(1, 0.5)).toBe(0);
  });

  it("nunca devuelve un valor negativo para tasas y montos no negativos", () => {
    fc.assert(
      fc.property(fc.nat({ max: 1_000_000 }), fc.double({ min: 0, max: 1, noNaN: true }), (amount, rate) => {
        expect(floorPercentageOf(amount, rate)).toBeGreaterThanOrEqual(0);
      }),
    );
  });
});

describe("allocateProportionally", () => {
  it("reparte proporcionalmente y asigna el residuo a la última línea con peso", () => {
    const result = allocateProportionally(100, [1, 1, 1]);

    expect(result).toEqual([33, 33, 34]);
    expect(sumCents(result)).toBe(100);
  });

  it("devuelve ceros cuando el total a repartir es 0", () => {
    expect(allocateProportionally(0, [10, 20, 30])).toEqual([0, 0, 0]);
  });

  it("si todos los pesos son 0 pero hay algo que repartir, lo asigna todo a la última línea (nunca deja de cuadrar)", () => {
    expect(allocateProportionally(500, [0, 0])).toEqual([0, 500]);
  });

  it("devuelve un arreglo vacío para pesos vacíos", () => {
    expect(allocateProportionally(500, [])).toEqual([]);
  });

  it("ignora las líneas de peso 0 al asignar el residuo", () => {
    const result = allocateProportionally(10, [0, 3, 0]);

    expect(sumCents(result)).toBe(10);
    expect(result[0]).toBe(0);
    expect(result[2]).toBe(0);
  });

  it("[property] la suma repartida siempre cuadra exactamente con el total, para cualquier combinación de pesos no negativos", () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1_000_000 }),
        fc.array(fc.nat({ max: 100_000 }), { minLength: 1, maxLength: 20 }),
        (total, weights) => {
          const result = allocateProportionally(total, weights);

          expect(sumCents(result)).toBe(total);
          expect(result.every((value) => value >= 0)).toBe(true);
        },
      ),
    );
  });
});
