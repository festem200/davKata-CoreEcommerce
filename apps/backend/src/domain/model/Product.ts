import type { Cents } from "./Money.js";

export const TECHNOLOGY_CATEGORY = "Tecnología";

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly unitPriceCents: Cents;
  readonly stock: number;
}
