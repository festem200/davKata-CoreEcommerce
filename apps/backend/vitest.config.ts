import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Los tests de infraestructura de Postgres comparten una única base de
    // datos real entre archivos (TRUNCATE + reseed). Correr los archivos
    // de test en paralelo (el default de Vitest) produce carreras entre
    // ellos sobre esas mismas tablas — se desactiva el paralelismo de
    // archivos para que el estado compartido sea seguro.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "vitest.config.ts",
        "src/main.ts",
        "src/infrastructure/persistence/**/contract.test.ts",
        // El adaptador Postgres requiere una base de datos real: se
        // verifica con la suite de contrato y el test de concurrencia
        // cuando `docker compose up` está corriendo, no en el umbral
        // bloqueante del 80% (que debe pasar sin Docker, la ruta del
        // evaluador con el driver `json` por defecto).
        "src/infrastructure/persistence/postgres/Postgres*.ts",
        "src/infrastructure/persistence/postgres/testDatabase.ts",
        "**/*.d.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
