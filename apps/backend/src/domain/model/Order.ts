import type { QuoteResult } from "../pricing/DiscountEngine.js";
import type { CartLine } from "./CartLine.js";

export interface Order {
  readonly id: string;
  readonly idempotencyKey: string;
  readonly createdAt: Date;
  readonly cartLines: readonly CartLine[];
  readonly couponCode: string | null;
  readonly quote: QuoteResult;
}
