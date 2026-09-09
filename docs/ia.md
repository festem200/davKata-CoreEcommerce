# Gobernanza de IA — Core E-Commerce Checkout

Uso de la IA dentro dentro del proyecto:

## Cómo se construyó realmente este repositorio (léase antes que el resto)

## Planeación

Antes de escribir una sola línea de código, dedique una sesión completa a planear con IA — no a delegarle el diseño, sino a **resolver por adelantado las dudas de arquitectura y de patrones de software que de otro modo habrían costado varias idas y vueltas durante la ejecución**. La lógica es simple: cada pregunta de diseño resuelta antes de codificar es una iteración menos con el agente después, con el código ya escrito y más caro de revertir. El resultado de esa sesión es la directiva maestra completa, versionada en este mismo repositorio en [`docs/reference/plan-maestro-core-ecommerce.md`](./reference/plan-maestro-core-ecommerce.md). **Esa directiva es el trabajo de diseño del candidato**, y cubre, entre otros puntos:

- La arquitectura elegida (Hexagonal / Ports & Adapters) y por qué, atada al argumento de multinube relacionada a los objetivos que tiene el banco. 
- El hallazgo matemático de que el tope del 35% es inalcanzable con las reglas del enunciado, y la estrategia para demostrarlo igual en vivo sin alterar la especificación.
- El flujo de ramas (`feature/* → integration → laboratory → main`) y la estrategia de seguridad.
- El catálogo de productos de demostración, diseñado producto por producto para que la demo en vivo sea legible.
- Creación de CI/CD en github para despliegue automatico hacia AWS.

## Skills / Prompts estructurados

### `doe-stack` (metodología propia)

Ver [`.claude/skills/doe-stack/SKILL.md`](../.claude/skills/doe-stack/SKILL.md). Framework propio del candidato (Directiva → Orquestación → Ejecución) usado para dirigir toda la sesión de desarrollo: la directiva describe el "qué" y el "por qué", el agente orquesta decidiendo en qué fase está el proyecto revisando el estado real del disco (no la memoria de la conversación), y cada unidad de ejecución (cada PR) se verifica externamente antes de declararse terminada.

## 2. Agentes con rol y reglas específicas

Diseñe y cree estos cinco agentes, versionados en [`.claude/agents/`](../.claude/agents/) dentro de este mismo repositorio para que sean auditables — no son una descripción en prosa, son los archivos reales que gobernarían una sesión de Claude Code sobre este proyecto. Cada agente se validó antes de usarse para que tuviera una única responsabilidad, sin solaparse con la de los demás: si dos agentes podían terminar tocando el mismo archivo por la misma razón, era señal de que sobraba uno.

**¿Por qué cinco, ni más ni menos?** Porque el proyecto tiene exactamente cinco responsabilidades que conviene mantener separadas: escribir el backend, escribir el frontend, probar el backend, probar el frontend, y auditar — con criterio adversarial y capacidad real de rechazo — el trabajo de los otros cuatro. Fusionar "escribe" y "prueba" en un solo agente habría dejado a quien implementa validando su propio trabajo; quitar el auditor habría dejado la gobernanza en una lista de buenas intenciones sin autoridad para hacerlas cumplir (ver más abajo). Un sexto agente no tenía responsabilidad propia que asignarle sin invadir la de otro.

| Agente | Rol | Regla más importante que lo gobierna |
|---|---|---|
| [`desarrollador-backend`](../.claude/agents/desarrollador-backend.md) | Dominio, aplicación e infraestructura del backend | El dominio no importa nada de framework; dinero siempre en `Cents` enteros |
| [`desarrollador-frontend`](../.claude/agents/desarrollador-frontend.md) | Componentes React y estado del carrito | El frontend nunca calcula precios; ningún `dispatch` durante el render (ver corrección #1 abajo — es la regla que ese error real generó) |
| [`tester-backend`](../.claude/agents/tester-backend.md) | Motor de descuentos, casos de uso, adaptadores | Property-based testing para invariantes; el adaptador Postgres se prueba contra una base real, nunca con mocks de `pg` |
| [`tester-frontend`](../.claude/agents/tester-frontend.md) | Reducer y componentes | La alerta del 35% se verifica por su texto exacto y su `role="alert"` — no se aprueba una paráfrasis |
| [`auditor-calidad`](../.claude/agents/auditor-calidad.md) ★ | **Crítico adversarial. No escribe código.** | Puede rechazar el trabajo de los otros cuatro; exige justificación de cada patrón de diseño usado |

**En palabras simples, qué hace cada uno:**

- **`desarrollador-backend`**: se encarga de todo el backend (`apps/backend/src/`) con buenas prácticas, principios SOLID y arquitectura hexagonal estricta. El dominio no puede importar nada de Express ni de la base de datos (cero fugas), el dinero siempre se maneja en centavos enteros (nunca decimales, para no perder precisión), y agregar una regla de descuento nueva no debe tocar el motor existente (principio Open/Closed).
- **`desarrollador-frontend`**: se encarga de toda la parte visible del proyecto (React) — componentes, estado del carrito y consumo de la API. Nunca calcula precios ni descuentos, solo muestra lo que el backend ya calculó. El estado del carrito vive en un patrón Observer (un único punto de verdad que notifica a todos los componentes cuando cambia). Se conecta al backend respetando también un límite hexagonal: todo pasa por un único adaptador (`api/client.ts`), nunca llamadas sueltas dentro de un componente. Exige además accesibilidad real (etiquetas para lectores de pantalla), la identidad visual de la marca ficticia "Soultec", y que la app nunca se quede en blanco silenciosamente si algo falla o está cargando.
- **`tester-backend`**: escribe y mantiene las pruebas del motor de descuentos, los casos de uso y el adaptador de base de datos. Su enfoque es matemático: usa pruebas basadas en propiedades (`fast-check`) para verificar reglas que deben cumplirse siempre — por ejemplo, que el descuento nunca supera el 35%, o que la suma de lo repartido siempre cuadra con el total, sin importar qué carrito le pases. El adaptador de Postgres se prueba contra una base de datos real, nunca simulada.
- **`tester-frontend`**: escribe y mantiene las pruebas del reducer del carrito y de los componentes visuales, con foco en interacción de usuario y accesibilidad (no en matemáticas, eso es del `tester-backend`). Prueba con consultas accesibles (como si fuera un lector de pantalla, no seleccionando por clases CSS), y verifica la alerta del 35% por su texto exacto, no una versión parecida.
- **`auditor-calidad`**: el único que no escribe código — solo revisa el trabajo de los otros cuatro y da un veredicto: aprobado o rechazado con razones concretas. Exige que cada patrón de diseño usado tenga una justificación real, que no haya fugas del dominio hacia el framework, que no exista dinero en decimales, y que el código y la documentación (`arquitectura.md`) nunca digan cosas distintas. Es la pieza que convierte la gobernanza de IA en un proceso con autoridad real, no en una lista de buenas intenciones. 


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

**Estimado honesto de origen del código:** ~100% generado por el agente en esta sesión de ejecución; 0% escrito a mano línea por línea por mi en este repositorio. 
Mi aporte está en la directiva previa (diseño) planeación y revisión de  código, entendimiento del mismo y asi mismo corregirlos.
