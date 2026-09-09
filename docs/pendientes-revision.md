# Pendientes de revisión

Checklist de cosas detectadas durante la revisión de código con el agente, para volver a ellas más adelante. No es una directiva del DOE Stack ni parte de la entrega formal — es una lista de trabajo.

- [x] **Swagger / OpenAPI de la API REST** — resuelto: `docs/openapi.yaml` (OpenAPI 3.1), escrito a mano a partir de las rutas de `app.ts` y los schemas de `packages/contracts/src/schemas.ts` (ya migrados a ids numéricos). Cubre los 5 endpoints reales con sus respuestas de error RFC 9457. Verificado renderizando en Swagger UI sin errores de parseo.
