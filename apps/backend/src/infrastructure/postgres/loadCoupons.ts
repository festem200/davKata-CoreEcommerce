import type { Pool } from "pg";
import type { Coupon } from "../../domain/pricing/Coupon.js";

interface CouponRow {
  readonly code: string;
  readonly discount_rate: number;
  readonly expires_at: Date | null;
}

/**
 * Carga el catálogo de cupones desde la tabla `coupons` una sola vez al
 * arrancar el servidor (igual que CATALOG hoy para memory/json): el motor
 * de descuentos los recibe ya armados, no consulta la BD por cada cotización.
 */
export async function loadCoupons(pool: Pool): Promise<ReadonlyMap<string, Coupon>> {
  const result = await pool.query<CouponRow>("SELECT code, discount_rate, expires_at FROM coupons");

  return new Map(
    result.rows.map((row) => [row.code, { code: row.code, rate: row.discount_rate, expiresAt: row.expires_at }]),
  );
}
