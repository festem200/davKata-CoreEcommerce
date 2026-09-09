import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatorio: el backend persiste solo en Postgres"),
  ORDERS_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Independiente de NODE_ENV: el Dockerfile hornea NODE_ENV=production en
  // la imagen (línea 47), así que cualquier contenedor de esta imagen —
  // incluido el smoke test de deploy-lab.yml contra un Postgres local sin
  // TLS — correría con NODE_ENV=production. Solo RDS exige TLS; se activa
  // con esta variable explícita, que deploy-prod.yml inyecta y nada más.
  DATABASE_SSL: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
