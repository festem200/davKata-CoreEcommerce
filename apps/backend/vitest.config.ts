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
        "tsup.config.ts",
        "src/main.ts",
        "src/infrastructure/postgres/contract.test.ts",
        // testDatabase.ts es utilería exclusiva de tests (truncar/sembrar
        // tablas para dejar la BD en un estado conocido); no es código de
        // producción. El resto del adaptador Postgres SÍ cuenta para el
        // umbral: es el único adaptador de persistencia y CI ya provisiona
        // un Postgres real (ver `services.postgres` en ci.yml).
        "src/infrastructure/postgres/testDatabase.ts",
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
