import type { CartLine } from "../domain/model/CartLine.js";
import type { Product } from "../domain/model/Product.js";
import type { ProductRepository, StockShortage } from "../domain/ports/ProductRepository.js";

/**
 * Test double en memoria del puerto ProductRepository — SOLO para tests
 * unitarios rápidos (app.test.ts, CheckoutUseCase.test.ts, etc.), nunca se
 * usa en producción. El único adaptador real es PostgresProductRepository
 * (ver infrastructure/postgres); no existe una variable de
 * entorno para elegir otro.
 */
export class FakeProductRepository implements ProductRepository {
  private readonly productsById: Map<number, Product>;

  constructor(initialProducts: readonly Product[]) {
    this.productsById = new Map(initialProducts.map((product) => [product.id, { ...product }]));
  }

  async findAll(): Promise<readonly Product[]> {
    return [...this.productsById.values()];
  }

  async findById(productId: number): Promise<Product | null> {
    return this.productsById.get(productId) ?? null;
  }

  async decrementStock(lines: readonly CartLine[]): Promise<readonly StockShortage[]> {
    const shortages: StockShortage[] = [];

    for (const line of lines) {
      const product = this.productsById.get(line.productId);
      const available = product?.stock ?? 0;

      if (!product || available < line.quantity) {
        shortages.push({ productId: line.productId, requested: line.quantity, available });
      }
    }

    if (shortages.length > 0) {
      return shortages;
    }

    for (const line of lines) {
      const product = this.productsById.get(line.productId);
      if (product) {
        this.productsById.set(product.id, { ...product, stock: product.stock - line.quantity });
      }
    }

    return [];
  }
}
