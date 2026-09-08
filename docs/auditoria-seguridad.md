# Auditoría de seguridad — Core E-Commerce Checkout API

> Generada con la skill propia `api-security-audit` (§5 de `docs/ia.md`). Ejecutada contra el código real de `apps/backend/`, no es una plantilla genérica — cada hallazgo se ancla a un archivo y una línea concretos.

**Estándares:** OWASP API Security Top 10 2023 (verificado 2026-09-08 contra el snapshot vigente de la skill) · CWE (MITRE)
**Revisado:** los 5 endpoints (`GET /health`, `GET /api/v1/products`, `POST /api/v1/cart/quote`, `POST /api/v1/checkout`, `GET /api/v1/orders/:id`), middlewares (`helmet`, rate limiting, `requireApiKey`, `errorHandler`), los 3 adaptadores de persistencia, `Dockerfile`, `docker-compose.yml`, historial de git, y `npm audit`.
**No revisado:** pruebas de penetración contra un despliegue real en AWS (no existe todavía — F6 es posterior a esta auditoría); análisis de la cadena de suministro de las dependencias transitivas más allá de `npm audit`.
**Severidad máxima encontrada:** medium

---

### [MEDIUM] Comparación de la API key no es de tiempo constante

- **Dónde:** [`apps/backend/src/infrastructure/http/middlewares/requireApiKey.ts:15`](../apps/backend/src/infrastructure/http/middlewares/requireApiKey.ts)
- **Clasificación:** API2:2023 Broken Authentication · CWE-208 (fuga de información por diferencia de tiempo)
- **Ataque:** `providedApiKey !== expectedApiKey` es una comparación de strings estándar de JavaScript, que retorna en cuanto encuentra el primer carácter distinto. Un atacante que mida la latencia de miles de intentos puede inferir la API key carácter por carácter, en vez de tener que probar el espacio completo de combinaciones.
- **Confirmado:** No — análisis estático. El endpoint protegido (`GET /orders/:id`) no maneja pagos ni datos masivamente sensibles y el rate limiting global (100 req/min/IP) encarece bastante el ataque, pero la corrección es barata y elimina la clase de fallo por completo.
- **Corrección:** usar `crypto.timingSafeEqual` con una comprobación de longitud previa (patrón estándar: si las longitudes difieren, ya no son iguales, sin necesidad de comparar el contenido byte a byte).
- **Estado:** ✅ **corregido** en el mismo commit que esta auditoría — ver `requireApiKey.ts`.

### [LOW] `trust proxy` no configurado — el rate limiting puede ser inefectivo detrás de un balanceador

- **Dónde:** [`apps/backend/src/app.ts`](../apps/backend/src/app.ts) (ausente)
- **Clasificación:** API4:2023 Unrestricted Resource Consumption · CWE-770
- **Ataque:** `express-rate-limit` identifica al cliente por `req.ip`. Detrás de un proxy o balanceador (el plan de despliegue en F6 usa ECS Express Mode con un ALB compartido) y sin `app.set("trust proxy", ...)`, Express no confía en `X-Forwarded-For`, y todo el tráfico externo puede verse como si viniera de una sola IP interna — el límite de 100 req/min termina compartido entre TODOS los clientes reales en vez de aplicarse por cliente, lo que en la práctica lo vuelve mucho más permisivo (o, en el caso contrario y peor, un solo cliente ruidoso puede agotar la cuota de todos los demás).
- **Confirmado:** No — no hay todavía un despliegue detrás de un proxy real que probar (F6 es posterior). Es un hallazgo por lectura de código + conocimiento del plan de despliegue.
- **Corrección:** `app.set("trust proxy", 1)` cuando `NODE_ENV === "production"` (en desarrollo y en los tests, sin proxy de por medio, dejarlo en `false` evita que un cliente falsifique su propia IP vía `X-Forwarded-For` sin que haya un proxy real filtrando ese header).
- **Estado:** ✅ **corregido** en el mismo commit — ver `app.ts`.

### [INFO] Dependencia `esbuild` con un aviso de seguridad de severidad baja (dev-only)

- **Dónde:** `node_modules/esbuild` (transitiva de `vite`/`vitest`, `npm audit --json`)
- **Clasificación:** [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) — lectura arbitraria de archivos al correr el servidor de desarrollo de esbuild **en Windows**
- **Verificado contra la fuente:** sí, `npm audit` reporta el aviso real (no inventado), severidad `low`, con corrección disponible.
- **Por qué no se actúa:** es una `devDependency` transitiva (parte de la cadena de build de Vite/Vitest) que **no viaja al contenedor de producción** — el `Dockerfile` corre `npm install --omit=dev` en el stage de runtime (ver `infra/Dockerfile`). Solo sería explotable si un desarrollador corriera `npm run dev` en Windows en una red no confiable, escenario fuera del alcance de esta auditoría.

---

## Hardening recomendado (no son vulnerabilidades, suben el piso de seguridad)

- **Credencial única para `ORDERS_API_KEY`.** Hoy el sistema acepta un solo valor estático; rotarla exige reiniciar el proceso y, en el intervalo, cualquier sistema de backoffice legítimo pierde acceso. Un diseño con una lista de claves válidas (separadas por coma, cada una comparada con `timingSafeEqual`) permitiría publicar la nueva, migrar al consumidor y retirar la vieja sin ventana de caída. Se documenta como mejora futura, no se implementa ahora — agregaría complejidad de configuración que el alcance de la prueba técnica no exige.
- **Límite de tamaño por archivo en el adaptador `json`.** `data/orders.json` crece indefinidamente con cada checkout, sin rotación ni archivado. Aceptable para una demo/prueba técnica; en producción real este driver no se usaría de todas formas (el plan usa `postgres` en AWS).
- **Rate limiting diferenciado por endpoint.** Hoy es uniforme (100 req/min/IP) en las cuatro rutas. `POST /api/v1/checkout` (que decrementa stock real) podría beneficiarse de un límite más estricto que `GET /api/v1/products` (solo lectura, cacheable).

## Verificado y sin hallazgos

- **Mass assignment (API3:2023):** los esquemas Zod (`packages/contracts/src/schemas.ts`) son *allow-list* explícitas — un body con campos extra (`{"isAdmin": true}`) se descarta silenciosamente por el parser antes de llegar a cualquier caso de uso. Ningún handler hace `Object.assign` ni pasa `req.body` completo a una entidad.
- **BOLA / IDOR (API1:2023) en `GET /orders/:id`:** no aplica en el sentido clásico — el proyecto no tiene modelo de identidad de usuario (decisión de alcance documentada en `docs/arquitectura.md` §7-8). La API key representa un sistema de backoffice autorizado a consultar cualquier orden de la tienda, no a un cliente individual con órdenes propias que proteger de otros clientes.
- **Inyección SQL (CWE-89):** el adaptador Postgres usa exclusivamente consultas parametrizadas (`$1`, `$2`…) vía `pg`; no hay concatenación de strings en ningún SQL (`PostgresProductRepository.ts`, `PostgresOrderRepository.ts`).
- **Secretos en el repositorio o su historial:** `git log --all --full-history` sobre patrones de `.env`/`credentials`/`secret` no encontró nada; `git grep` sobre posibles API keys hardcodeadas solo encontró los placeholders esperados de desarrollo/tests (`test-api-key`, `local-dev-key`, `change-me`).
- **Errores que filtran detalles internos (CWE-200):** verificado con un test dedicado (`app.test.ts`) que un error interno real (`Error: boom: detalle interno...`) nunca aparece en el cuerpo de la respuesta 500 — el Problem Detail siempre es el mensaje genérico.
- **CORS:** no hay configuración de CORS porque no hace falta — el backend sirve los estáticos del frontend desde el mismo origen (`app.ts`); no hay `Access-Control-Allow-Origin: *` en ninguna respuesta.
- **Contenedor como root:** verificado — `infra/Dockerfile` crea un usuario `app` sin privilegios y lo activa con `USER app` antes del `CMD`.
- **Puerto de base de datos expuesto al host:** verificado — `docker-compose.yml` no publica el puerto de `postgres` al host; solo es alcanzable dentro de la red interna de Compose.
- **SSRF (API7:2023):** no aplica — ningún endpoint acepta una URL para que el servidor la consulte.
