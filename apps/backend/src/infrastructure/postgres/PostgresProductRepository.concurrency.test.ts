import { describe, expect, it } from "vitest";
import { PostgresProductRepository } from "./PostgresProductRepository.js";
import { connectToTestDatabase, resetProducts } from "./testDatabase.js";

const pool = await connectToTestDatabase();
const describeIfPostgres = pool ? describe : describe.skip;

/**
 * El argumento bancario del adaptador Postgres: N checkouts simultáneos
 * disparados sobre el ÚLTIMO ítem disponible. La guarda atómica
 * `WHERE stock >= $1` dentro de una transacción garantiza que solo UNA
 * gana la carrera y que el stock nunca queda negativo — algo que el
 * adaptador `memory`/`json` no puede demostrar bajo concurrencia real
 * entre procesos.
 */
describeIfPostgres("PostgresProductRepository — concurrencia", () => {
  it("de 10 checkouts simultáneos sobre 1 unidad de stock, exactamente 1 gana y el stock nunca es negativo", async () => {
    if (!pool) return;

    await resetProducts(pool, [
      { id: 4, name: "Power bank", category: "Tecnología", unitPriceCents: 3250, stock: 1 },
    ]);
    const repository = new PostgresProductRepository(pool);

    const attempts = Array.from({ length: 10 }, () => repository.decrementStock([{ productId: 4, quantity: 1 }]));
    const results = await Promise.all(attempts);

    const successes = results.filter((shortages) => shortages.length === 0);
    const failures = results.filter((shortages) => shortages.length > 0);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(9);

    const finalProduct = await repository.findById(4);
    expect(finalProduct?.stock).toBe(0);
  });
});
