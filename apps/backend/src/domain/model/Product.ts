import type { Cents } from "./Money.js";

export const TECHNOLOGY_CATEGORY = "Tecnología";

export interface Product {
  readonly id: number;
  readonly name: string;
  readonly category: string;
  readonly unitPriceCents: Cents;
  readonly stock: number;
  readonly description?: string;
  readonly imageUrl?: string;
  readonly sku?: string;
  readonly brand?: string;
}
