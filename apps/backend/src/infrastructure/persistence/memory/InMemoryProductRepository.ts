import type { CartLine } from "../../../domain/model/CartLine.js";
import type { Product } from "../../../domain/model/Product.js";
import type { ProductRepository, StockShortage } from "../../../domain/ports/ProductRepository.js";

export class InMemoryProductRepository implements ProductRepository {
  private readonly productsById: Map<string, Product>;

  constructor(initialProducts: readonly Product[]) {
    this.productsById = new Map(initialProducts.map((product) => [product.id, { ...product }]));
  }

  async findAll(): Promise<readonly Product[]> {
    return [...this.productsById.values()];
  }

  async findById(productId: string): Promise<Product | null> {
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
