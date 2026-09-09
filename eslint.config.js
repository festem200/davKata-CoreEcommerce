import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/coverage/**", "**/node_modules/**", "**/*.d.ts", "infra/aws/lambda/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Los parámetros/variables con prefijo `_` son intencionalmente no usados
      // (p. ej. el `_next` de un error handler de Express: la firma de 4
      // argumentos es lo que le indica a Express que es un manejador de errores).
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["apps/backend/**/*.ts", "packages/*/src/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // Cada `console.*` real queda como una decisión explícita (con su
      // propio comentario de justificación), no una impresión de debug olvidada.
      "no-console": "error",
    },
  },
  {
    files: ["apps/frontend/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      // Solo las 2 reglas clásicas de rules-of-hooks (las que hubieran
      // atrapado el bug real de la corrección #1 en docs/ia.md). El resto
      // del paquete "recommended" de v7 son heurísticas pensadas para el
      // React Compiler (aún no usado en este proyecto) y marcan como error
      // patrones estándar de React 19 sin compilador, como `setLoading(true)`
      // síncrono antes de iniciar un fetch dentro de un efecto.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
