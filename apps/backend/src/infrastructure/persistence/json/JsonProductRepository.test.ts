import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import type { Product } from "../../../domain/model/Product.js";
import { JsonProductRepository } from "./JsonProductRepository.js";

const SEED: readonly Product[] = [
  { id: "p1", name: "Audífonos", category: "Tecnología", unitPriceCents: 4500, stock: 10 },
];

describe("JsonProductRepository", () => {
  const filesToCleanUp: string[] = [];

  afterEach(async () => {
    await Promise.all(filesToCleanUp.splice(0).map((filePath) => rm(filePath, { force: true })));
  });

  it("no vuelve a sembrar el catálogo si el archivo ya existe", async () => {
    const filePath = join(tmpdir(), `core-ecommerce-json-${randomUUID()}.json`);
    filesToCleanUp.push(filePath);

    await JsonProductRepository.create(filePath, SEED);
    await (await JsonProductRepository.create(filePath, [])).findAll();

    const secondRepository = await JsonProductRepository.create(filePath, []);
    const products = await secondRepository.findAll();

    expect(products).toHaveLength(1);
    expect(products[0]?.id).toBe("p1");
  });
});
