import { copyFileSync } from "node:fs";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  // @core-ecommerce/contracts expone TS fuente directamente (sin build
  // propio): se bundlea dentro de dist/main.js para que el runtime no
  // necesite el paquete del workspace como dependencia.
  noExternal: ["@core-ecommerce/contracts"],
  onSuccess: async () => {
    // schema.ts resuelve su ruta relativa a su propio archivo en tiempo de
    // ejecución; al bundlear todo en dist/main.js esa ruta pasa a apuntar
    // a dist/, así que el .sql se copia junto al bundle.
    copyFileSync("src/infrastructure/persistence/postgres/schema.sql", "dist/schema.sql");
  },
});
