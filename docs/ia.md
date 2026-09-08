# Gobernanza de IA — Core E-Commerce Checkout

> Responde la §5 del enunciado (`insumos/`): skills/prompts automatizados, agentes con rol y reglas, y la bitácora de co-creación con al menos dos correcciones reales documentadas en el momento en que ocurrieron.

## Cómo se construyó realmente este repositorio (léase antes que el resto)

Este documento es más útil si es honesto sobre el modelo de trabajo real, en vez de encajar la historia en el molde de "el copiloto sugiere una línea, el humano la corrige", que no es lo que ocurrió aquí.

El candidato escribió, en una sesión previa de planeación, la directiva maestra completa (`directives/plan_maestro_prueba_tecnica.md` en el directorio de trabajo, fuera de este repositorio): la arquitectura, las 12 decisiones técnicas de la tabla de §2, el hallazgo del 35% y cómo demostrarlo, el flujo de ramas, la estrategia de seguridad, el catálogo de demostración diseñado producto por producto, y el orden de corte si el tiempo se agotaba. **Esa directiva es el trabajo de diseño del candidato.**

La ejecución de este repositorio — cada línea de `apps/`, `packages/`, `infra/`, y este mismo documento — la escribió Claude Code operando de forma agéntica sobre esa directiva, en una sesión larga y continua. El candidato no escribió código línea por línea en esta sesión; su rol fue el de **gobernanza y aprobación**, no de coautoría manual:

- Aprobó explícitamente las dos acciones irreversibles/visibles del proceso: crear el repositorio público en GitHub, y autorizar el flujo completo de merges de PR (`feature/* → integration → laboratory → main`) — ambas bloqueadas por defecto por el clasificador de permisos de Claude Code hasta recibir confirmación explícita en el chat.
- No revisó cada diff línea por línea antes de cada merge — confió en la disciplina de verificación externa exigida por la metodología del candidato (DOE Stack, ver `.claude/skills/doe-stack/`): ningún PR se declaró listo sin ejecutar de verdad `tsc`, la suite de tests, o — en los casos de Docker y despliegue — el contenedor real.

Esto es, en sí mismo, una respuesta al §5: la auditoría de IA de este proyecto no es "un humano revisó cada línea", es **un sistema de gates de aprobación + verificación externa obligatoria + un agente con autoridad para rechazar trabajo** (`auditor-calidad`, ver abajo). Es un modelo de gobernanza más parecido a cómo se opera IA agéntica en producción hoy que al modelo de "sugerencia de autocompletado" de hace dos años — y es exactamente el tipo de criterio que un área de Open Banking migrando a multinube necesita evaluar en un candidato.

**Estimado honesto de origen del código:** ~100% generado por el agente en esta sesión de ejecución; 0% escrito a mano línea por línea por el candidato en este repositorio. El aporte humano está en la directiva previa (diseño) y en las aprobaciones de gates (gobernanza) — ambos verificables: la directiva existe como archivo con fecha, y las aprobaciones de merge son visibles en el historial de PRs de GitHub.

---

## 1. Skills / Prompts estructurados

### `doe-stack` (metodología propia)

Ver [`.claude/skills/doe-stack/SKILL.md`](../.claude/skills/doe-stack/SKILL.md). Framework propio del candidato (Directiva → Orquestación → Ejecución) usado para dirigir toda la sesión de desarrollo: la directiva describe el "qué" y el "por qué", el agente orquesta decidiendo en qué fase está el proyecto revisando el estado real del disco (no la memoria de la conversación), y cada unidad de ejecución (cada PR) se verifica externamente antes de declararse terminada.

### `api-security-audit` (skill propia, ya construida antes de esta prueba)

Ejecutada de verdad contra `apps/backend/` — no es una descripción, es una auditoría real con hallazgos reales, dos de ellos corregidos en el mismo commit. Ver el reporte completo en [`docs/auditoria-seguridad.md`](./auditoria-seguridad.md) y el PR correspondiente (`feat/addSecurityAudit`). Cubre OWASP API Security Top 10 (2023, verificado contra la fuente oficial en el momento de ejecutarla) y CWE, con una regla explícita anti-alucinación: ningún CVE o CWE se cita sin haber sido confirmado contra su fuente en la misma sesión.

## 2. Agentes con rol y reglas específicas

Cinco agentes, versionados en [`.claude/agents/`](../.claude/agents/) dentro de este mismo repositorio para que sean auditables — no son una descripción en prosa, son los archivos reales que gobernarían una sesión de Claude Code sobre este proyecto:

| Agente | Rol | Regla más importante que lo gobierna |
|---|---|---|
| [`arquitecto-backend`](../.claude/agents/arquitecto-backend.md) | Dominio, aplicación e infraestructura del backend | El dominio no importa nada de framework; dinero siempre en `Cents` enteros |
| [`desarrollador-frontend`](../.claude/agents/desarrollador-frontend.md) | Componentes React y estado del carrito | El frontend nunca calcula precios; ningún `dispatch` durante el render (ver corrección #1 abajo — es la regla que ese error real generó) |
| [`ingeniero-pruebas-backend`](../.claude/agents/ingeniero-pruebas-backend.md) | Motor de descuentos, casos de uso, adaptadores | Property-based testing para invariantes; el adaptador Postgres se prueba contra una base real, nunca con mocks de `pg` |
| [`ingeniero-pruebas-frontend`](../.claude/agents/ingeniero-pruebas-frontend.md) | Reducer y componentes | La alerta del 35% se verifica por su texto exacto y su `role="alert"` — no se aprueba una paráfrasis |
| [`auditor-calidad`](../.claude/agents/auditor-calidad.md) ★ | **Crítico adversarial. No escribe código.** | Puede rechazar el trabajo de los otros cuatro; exige justificación de cada patrón de diseño usado |

**Por qué `auditor-calidad` es la pieza que vale la pena defender en la sustentación:** convierte la gobernanza de IA en un proceso con autoridad real, no en una lista de buenas intenciones. Sus reglas de rechazo automático (fuga de la capa de dominio, `any` sin justificación, dinero en `number` decimal, divergencia entre código y `docs/arquitectura.md`) son exactamente los errores que, si se hubieran cometido, habrían pasado desapercibidos en una revisión superficial de "¿pasan los tests?".

## 3. Bitácora de co-creación

### Correcciones reales (iguales o más de las 2 exigidas)

Cada una se detectó **por evidencia externa real** (un error de compilación, un test que falló de verdad, un contenedor que no arrancó) — nunca por relectura especulativa del código sin ejecutarlo. Esa es la disciplina que exige la metodología DOE Stack del candidato.

**#1 — Bug real de React: `dispatch` durante el render, no en un efecto.**
Al escribir `apps/frontend/src/components/CartPanel.test.tsx`, la primera versión de un componente auxiliar de prueba (`Seed`) llamaba a `addProduct("p1")` directamente en el cuerpo del render:
```tsx
function Seed() {
  const { addProduct } = useCart();
  addProduct("p1"); // ← dispara un re-render, que vuelve a ejecutar esto, indefinidamente
  return null;
}
```
Esto causa un bucle de renderizado infinito: cada `dispatch` fuerza un re-render de `CartProvider`, que vuelve a renderizar `Seed`, que vuelve a despachar. **Corrección técnica:** mover el `dispatch` a un `useEffect` con dependencias `[]`, para que se ejecute exactamente una vez. Se generalizó como regla explícita en `desarrollador-frontend.md` para que no se repita.

**#2 — Vitest 2.x duplica `vite` internamente y rompe el tipado estricto.**
Con `vitest@^2.x` y `exactOptionalPropertyTypes: true`, `tsc --noEmit` falló con un error de tipos incomprensible a primera vista entre `UserConfig`/`Plugin` de dos copias distintas de `vite` (la del proyecto, `6.x`, y una interna de `vite-node` en `5.x`). **Diagnóstico:** Vitest 2.x no declara soporte nativo para Vite 6, así que npm instala una segunda copia de `vite` para satisfacer el rango de peer dependency interno. **Corrección:** fijar `vitest`/`@vitest/coverage-v8` en `^3.x`, que sí soporta Vite 6 sin duplicar la dependencia — no relajar `exactOptionalPropertyTypes`, que hubiera sido la salida fácil y la equivocada.

**#3 — `tsup --noExternal` no es una bandera de su CLI.**
El primer `package.json` del backend definía `"build": "tsup src/main.ts ... --noExternal @core-ecommerce/contracts"`. Al ejecutar `docker compose build` por primera vez, tsup falló con `CACError: Unknown option --noExternal`. **Corrección:** `noExternal` solo existe como opción de `tsup.config.ts`, no de línea de comandos — se creó el archivo de configuración correspondiente. Se detectó ejecutando el build real dentro de Docker, no asumiendo que la bandera existía porque "sonaba razonable".

**#4 — La ruta de `schema.sql` se rompe al bundlear con tsup.**
`schema.ts` resuelve la ruta de `schema.sql` en tiempo de ejecución con `dirname(fileURLToPath(import.meta.url))`. En desarrollo (`tsx`, sin bundlear) esto apunta correctamente al árbol de fuentes. Al bundlear con tsup en un único `dist/main.js`, `import.meta.url` pasa a apuntar a `dist/`, y el contenedor real falló al arrancar con `ENOENT: no such file or directory, open '/app/dist/schema.sql'` — visible únicamente al levantar `docker compose up` de punta a punta, no al correr `docker compose build` (que sí terminaba "exitosamente" sin ejecutar nunca el código). **Corrección:** un hook `onSuccess` en `tsup.config.ts` copia `schema.sql` junto al bundle.

**#5 — Dos archivos de test golpeando el mismo Postgres real en paralelo producen resultados no deterministas.**
Con Vitest corriendo archivos en paralelo (su comportamiento por defecto), `contract.test.ts` y `PostgresProductRepository.concurrency.test.ts` conectan al mismo Postgres real y cada uno reinicia sus tablas (`TRUNCATE` + reseed). Un `expect(finalProduct?.stock).toBe(0)` falló de forma intermitente porque el `TRUNCATE` de un archivo corría a mitad de la aserción del otro. **Corrección:** `fileParallelism: false` en `vitest.config.ts`, más un `pg_advisory_lock` de sesión (`schema.ts`) para que la creación concurrente del esquema (`CREATE TABLE IF NOT EXISTS`) no choque en los catálogos internos de Postgres — un fallo real de carrera de infraestructura, no un bug de la aplicación, detectado únicamente porque las pruebas corrieron contra una base de datos real en vez de un mock.

**#6 — Comparación de API key no era de tiempo constante (encontrado por auditoría dirigida, no por casualidad).**
Ver el hallazgo [MEDIUM] de `docs/auditoria-seguridad.md`: `providedApiKey !== expectedApiKey` es vulnerable a un ataque de temporización (CWE-208). A diferencia de las correcciones #1-5 (encontradas por un error real al ejecutar algo), esta se encontró ejecutando deliberadamente la skill `api-security-audit` sobre código que "funcionaba" — ilustra que pasar todos los tests no es lo mismo que ser seguro, y que ambas disciplinas de verificación son necesarias.

**#7 — `allocateProportionally` rompía su propia invariante en un caso límite, atrapado por CI con una semilla distinta a la local.**
La función promete que la suma de lo repartido siempre cuadra con el total. El caso `totalWeight === 0` devolvía todo en ceros incondicionalmente — correcto si `totalToAllocate` también es 0, **incorrecto** si no lo es (la suma repartida, 0, deja de cuadrar con un total distinto de cero). El test de property-based `[property] la suma repartida siempre cuadra exactamente con el total...` lo ejecuta en cada corrida contra combinaciones aleatorias de pesos y totales generadas con una semilla distinta; en local nunca se topó con el contraejemplo mínimo (`total=1, weights=[0]`), pero **CI sí, con su propia semilla**, y el pipeline falló en rojo con el contraejemplo exacto en el log. **Corrección:** cuando no hay ninguna línea con peso positivo pero igual hay algo que repartir, se asigna todo a la última línea — preserva la invariante en vez de devolver un resultado matemáticamente inconsistente. Se actualizó también el test unitario que documentaba (incorrectamente) el comportamiento viejo como si fuera el esperado.

### Por qué estas correcciones importan más que "la IA se equivocó y alguien lo notó"

Ninguna de las siete se atrapó por relectura visual del código antes de ejecutarlo. Las correcciones #1-5 y #7 se atraparon porque algo real falló (un test, un build, un contenedor, y en el caso de #7, **el mismo test con una semilla aleatoria distinta en CI**) y la metodología del candidato prohíbe declarar una fase terminada sin haber corrido el comando real y leído su salida — incluyendo, especialmente, después de fusionarse a `integration`. La #6 se atrapó porque la gobernanza incluye una auditoría de seguridad *dirigida*, no solo pruebas funcionales. Esa disciplina — no la inteligencia para prevenir el error de antemano — es la garantía real de calidad de este proceso, y es reproducible en cualquier proyecto futuro que use la misma metodología.
