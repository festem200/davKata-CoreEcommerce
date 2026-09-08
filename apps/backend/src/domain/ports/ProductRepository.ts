import type { CartLine } from "../model/CartLine.js";
import type { Product } from "../model/Product.js";

export interface StockShortage {
  readonly productId: string;
  readonly requested: number;
  readonly available: number;
}

/**
 * Puerto (Ports & Adapters): el dominio y la aplicación dependen de esta
 * interfaz, nunca de un adaptador concreto. `memory`, `json` y `postgres`
 * la implementan y comparten la misma suite de tests de contrato.
 */
export interface ProductRepository {
  findAll(): Promise<readonly Product[]>;
  findById(productId: string): Promise<Product | null>;

  /**
   * Decrementa el stock de TODAS las líneas en una sola operación
   * todo-o-nada: si alguna no tiene stock suficiente, no se decrementa
   * ninguna. Devuelve la lista de faltantes (vacía si tuvo éxito).
   */
  decrementStock(lines: readonly CartLine[]): Promise<readonly StockShortage[]>;
}
