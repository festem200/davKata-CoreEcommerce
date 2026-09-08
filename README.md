# Core E-Commerce Checkout — Soultec

> Prueba técnica **Especialista I Open Banking** (Davivienda): checkout de e-commerce con un motor de descuentos acumulativos en cascada, tope absoluto del 35%, arquitectura hexagonal, y gobernanza de IA auditable.

**Identidad visual:** la paleta de color y las formas (rojo `#E1111C`, tarjetas de 16px, botones tipo píldora) están inspiradas en el CSS de producción de la entidad, medido directamente sobre su sitio — **sin afiliación, respaldo ni uso de sus logos o nombre**. La marca de la tienda de demostración es **Soultec**, marca personal del autor.

## Instalación rápida (sin Docker — la ruta más simple)

Requisitos: **Node.js ≥ 20** y **npm ≥ 10**.

```bash
git clone https://github.com/festem200/davKata-CoreEcommerce.git
cd davKata-CoreEcommerce
npm install
npm run dev
```

Esto levanta backend (`http://localhost:8080`) y frontend con hot-reload (`http://localhost:5173`) en paralelo. Abre `http://localhost:5173`. El backend usa el driver **`json`** por defecto (archivo en `apps/backend/data/`) — no necesitas Postgres para probar el flujo completo.

## Variables de entorno

Copia `.env.example` a `.env` en `apps/backend/` si quieres personalizarlas (todas tienen un valor por defecto razonable para desarrollo):

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `8080` | Puerto del backend |
| `PERSISTENCE_DRIVER` | `json` | `memory` \| `json` \| `postgres` |
| `DATABASE_URL` | — | Obligatoria solo si `PERSISTENCE_DRIVER=postgres` |
| `ORDERS_API_KEY` | — | Requerida por `GET /api/v1/orders/:id` (header `X-Api-Key`). Sin configurar, ese endpoint rechaza toda solicitud (fail-closed) |
| `NODE_ENV` | `development` | `production` activa `trust proxy` (ver `docs/auditoria-seguridad.md`) |

## Comandos

Desde la raíz del monorepo (npm workspaces):

```bash
npm run dev             # backend + frontend en paralelo, con hot-reload
npm run build           # build de producción de frontend y backend
npm run typecheck       # TypeScript estricto en los 3 paquetes
npm test                # todos los tests (backend + frontend)
npm run test:coverage   # tests + reporte de cobertura (umbral 80% bloqueante)
```

## Correr con Docker (demuestra el adaptador Postgres y la concurrencia real)

```bash
docker compose up --build
```

Levanta `postgres` + `app` (una sola imagen que sirve la API y el frontend ya compilado, sin CORS). La app queda en `http://localhost:8080`, con `PERSISTENCE_DRIVER=postgres`. `depends_on: condition: service_healthy` garantiza que el backend no arranca antes que la base esté lista.

## Despliegue en AWS

El IaC de **ECS Express Mode** está en [`infra/aws/`](./infra/aws/README.md) — roles IAM, trust policies, el comando de creación del servicio y el costeo. Documentado y listo para ejecutar; no se corrió en esta entrega por no contar con una cuenta de AWS con credenciales disponibles al momento de construirla. `deploy-prod.yml` ya está escrito contra ese mismo diseño y se activa solo en cuanto exista la variable de repositorio correspondiente.

## Arquitectura y decisiones de diseño

Ver [`docs/arquitectura.md`](./docs/arquitectura.md): justificación del stack, trade-offs asumidos, cómo se aisló el motor de descuentos de la persistencia y los controladores, los 4 patrones de diseño implementados (Strategy, Factory, Repository/Ports & Adapters, Observer), el mapeo a BIAN, y **el hallazgo matemático de por qué el tope del 35% nunca se activa con el cupón oficial `WELCOME2026`** (máximo real: 27.325%) — junto con el cupón `BLACKFRIDAY40`, agregado al catálogo para poder demostrar la alerta de la HU4 en vivo sin alterar el motor.

## Gobernanza de IA

Ver [`docs/ia.md`](./docs/ia.md): los 2 skills usados (`doe-stack`, `api-security-audit`), los 5 agentes con rol y reglas versionados en [`.claude/agents/`](./.claude/agents/) — incluido un `auditor-calidad` adversarial con autoridad para rechazar trabajo — y la bitácora de co-creación con 6 correcciones reales documentadas en el momento en que ocurrieron.

La auditoría de seguridad completa (ejecutada de verdad contra el código, con 2 hallazgos reales ya corregidos) está en [`docs/auditoria-seguridad.md`](./docs/auditoria-seguridad.md).

## Endpoints

```
GET  /api/v1/products      Catálogo con stock
POST /api/v1/cart/quote    Cotiza el carrito (no persiste ni toca stock)
POST /api/v1/checkout      Procesa la orden (requiere header Idempotency-Key)
GET  /api/v1/orders/:id    Consulta una orden (requiere header X-Api-Key)
GET  /health               Sonda de salud (Docker/ECS)
GET  /                     Frontend (build de producción, solo cuando existe apps/backend/public)
```

Los errores siguen **RFC 9457 Problem Details** (`Content-Type: application/problem+json`).

## Estructura del monorepo

```
apps/
  backend/    Express 5 + TypeScript estricto, arquitectura hexagonal
  frontend/   React 19 + Vite + TypeScript
packages/
  contracts/  Esquemas Zod compartidos front↔back (DTOs + validación)
infra/
  Dockerfile  Multi-stage: build frontend → build backend (tsup) → runtime no-root
  aws/        IaC de ECS Express Mode — documentado y listo, no ejecutado (ver infra/aws/README.md)
docs/
  arquitectura.md         Decisiones de diseño, patrones, el hallazgo del 35%
  ia.md                   Gobernanza de IA (§5 del enunciado)
  auditoria-seguridad.md  Auditoría real ejecutada con la skill api-security-audit
.claude/
  agents/     5 agentes de gobernanza de IA (versionados para auditoría)
  skills/     doe-stack — metodología propia de desarrollo
insumos/
  Prueba Técnica Full Stack - Core E-Commerce.md   Enunciado original
```

## Flujo de ramas

```
feature/*  ──PR──▶  integration  ──PR──▶  laboratory  ──PR──▶  main
                    (CI + build)          (pre-prod)          (producción)
```

`main`, `laboratory` e `integration` están protegidas: PR obligatorio, checks de CI en verde, sin force-push. El CI (`.github/workflows/ci.yml`) corre lint, typecheck, tests con cobertura ≥80% bloqueante (con un Postgres real como servicio del runner) y valida que la imagen Docker construye, en cada PR.
