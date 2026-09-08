import type { CartLine } from "../../../domain/model/CartLine.js";
import type { Product } from "../../../domain/model/Product.js";
import type { ProductRepository, StockShortage } from "../../../domain/ports/ProductRepository.js";
import { AsyncMutex } from "./AsyncMutex.js";
import { fileExists, readJsonFile, writeJsonFile } from "./jsonFileStore.js";

/**
 * Adaptador por defecto: persiste el catálogo en un archivo JSON. Cero
 * fricción para el evaluador — no requiere Docker ni una base de datos.
 */
export class JsonProductRepository implements ProductRepository {
  private readonly mutex = new AsyncMutex();

  private constructor(private readonly filePath: string) {}

  static async create(filePath: string, seedProducts: readonly Product[]): Promise<JsonProductRepository> {
    const repository = new JsonProductRepository(filePath);

    if (!(await fileExists(filePath))) {
      await writeJsonFile(filePath, seedProducts);
    }

    return repository;
  }

  async findAll(): Promise<readonly Product[]> {
    return readJsonFile<Product[]>(this.filePath);
  }

  async findById(productId: string): Promise<Product | null> {
    const products = await this.findAll();
    return products.find((product) => product.id === productId) ?? null;
  }

  async decrementStock(lines: readonly CartLine[]): Promise<readonly StockShortage[]> {
    return this.mutex.runExclusive(async () => {
      const productsById = new Map((await this.findAll()).map((product) => [product.id, product]));
      const shortages: StockShortage[] = [];

      for (const line of lines) {
        const product = productsById.get(line.productId);
        const available = product?.stock ?? 0;

        if (!product || available < line.quantity) {
          shortages.push({ productId: line.productId, requested: line.quantity, available });
        }
      }

      if (shortages.length > 0) {
        return shortages;
      }

      for (const line of lines) {
        const product = productsById.get(line.productId);
        if (product) {
          productsById.set(product.id, { ...product, stock: product.stock - line.quantity });
        }
      }

      await writeJsonFile(this.filePath, [...productsById.values()]);
      return [];
    });
  }
}
