import { centsFromDecimal } from "../../domain/model/Money.js";
import type { Product } from "../../domain/model/Product.js";
import type { Coupon } from "../../domain/pricing/Coupon.js";

/**
 * Catálogo de demostración: cada producto habilita un caso concreto de la
 * demo en vivo (ver docs/arquitectura.md para el porqué de cada uno).
 */
export const CATALOG: readonly Product[] = [
  { id: "p1", name: "Audífonos Bluetooth", category: "Tecnología", unitPriceCents: centsFromDecimal(45.0), stock: 10 },
  { id: "p2", name: "Teclado mecánico", category: "Tecnología", unitPriceCents: centsFromDecimal(89.9), stock: 5 },
  { id: "p3", name: 'Monitor 27"', category: "Tecnología", unitPriceCents: centsFromDecimal(249.99), stock: 3 },
  { id: "p4", name: "Power bank 20.000 mAh", category: "Tecnología", unitPriceCents: centsFromDecimal(32.5), stock: 2 },
  { id: "p5", name: "Camiseta de algodón", category: "Ropa", unitPriceCents: centsFromDecimal(19.9), stock: 20 },
  { id: "p6", name: "Termo de acero", category: "Hogar", unitPriceCents: centsFromDecimal(24.0), stock: 8 },
  { id: "p7", name: "Libro Clean Architecture", category: "Libros", unitPriceCents: centsFromDecimal(38.0), stock: 6 },
];

/**
 * Catálogo de cupones, data-driven y con vigencia. `WELCOME2026` es el
 * cupón oficial del enunciado (15%). `BLACKFRIDAY40` se agregó para poder
 * demostrar en vivo la alerta del 35% (HU4) sin alterar el motor — con las
 * reglas oficiales el descuento máximo matemático es 27,325% y el tope
 * nunca se activa (ver docs/arquitectura.md, "Hallazgo del 35%").
 */
export const COUPONS: ReadonlyMap<string, Coupon> = new Map([
  ["WELCOME2026", { code: "WELCOME2026", rate: 0.15, expiresAt: null }],
  ["BLACKFRIDAY40", { code: "BLACKFRIDAY40", rate: 0.4, expiresAt: null }],
]);
