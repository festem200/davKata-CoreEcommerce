# Directiva Maestra — Prueba Técnica "Core E-Commerce con Descuentos Acumulativos"

> **Propósito:** SOP completo (Capa 1 — Directiva del DOE Stack) para construir y entregar la prueba técnica de Especialista I Open Banking (Davivienda). Cualquier sesión nueva debe leer este archivo completo antes de tocar código.

## Estado al momento de escribir esta directiva

- **Fecha/hora de referencia:** 8 de septiembre de 2026, ~11:10 a.m. (COT). Entrega: 9 de septiembre, 2:00 p.m. Sustentación: 9 de septiembre, 4:00 p.m. (30 min).
- **F0 completado y verificado.** Repositorio git en `davKata-CoreEcommerce/`, público en `github.com/festem200/davKata-CoreEcommerce` (creado y con push realizado). Ramas `main`, `integration`, `laboratory` (root commit vacío) + `feat/setupMonorepo` fusionado a `integration` vía PR real (#1, `gh pr merge`). `main` y `laboratory` siguen en el commit raíz vacío a la espera del primer lote de promoción.
- **Nombres reales de paquetes (ajuste sobre el plan original):** se usó el scope `@core-ecommerce/*` en vez de `@examen/*` para los tres workspaces, por coherencia con el nombre público del repo (`davKata-CoreEcommerce`). No afecta ninguna decisión de arquitectura.
- **Monorepo verificado de punta a punta:** `npm install` limpio, `npm run typecheck` sin errores en los 3 paquetes, `npm run test:coverage` en verde con 100% de cobertura (smoke tests: `GET /health` en backend, render de `App` en frontend). Vitest se fijó en `^3.2.4` (no `^2.x` como se había puesto inicialmente) porque la v2 duplica una copia de `vite` internamente y con `exactOptionalPropertyTypes` eso rompe el typecheck — ver aprendizaje correspondiente.
- **`gh` CLI:** cuenta activa `festem200`, scope `workflow` **ya presente** (no hace falta `gh auth refresh`, ya estaba resuelto al retomar esta sesión).
- **AWS:** AWS CLI **ya instalado** (`/opt/homebrew/bin/aws`), pero sin credenciales configuradas (`aws configure list` vacío). Cuenta AWS personal: pendiente de confirmar con el candidato si ya se creó.
- **Google Slides:** sin verificar en esta sesión — revisar antes de F7.
- **Permisos de auto mode:** crear el repo público y hacer merge de PRs vía `gh` están bloqueados por defecto por el clasificador de Claude Code; el usuario ya autorizó explícitamente ambas cosas para todo el flujo `feature/* → integration → laboratory → main` de este proyecto (sin `--force`, sin `--admin`). No volver a preguntar por cada PR.
- **F1 y F2 completados y fusionados** (PRs #2-#7 en `integration`). Motor de descuentos (Strategy + Factory + tope 35%, 33 tests), puertos + 3 adaptadores de persistencia con suite de contrato compartida (memory/json/postgres, verificado con Postgres real: 10 checkouts simultáneos → 1 gana, stock nunca negativo), y la API REST completa (products/quote/checkout/orders, RFC 9457, Idempotency-Key, API key fail-closed). 85 tests, 99.71% de cobertura en backend. Verificado manualmente contra el servidor real con `curl`, no solo con supertest.
- **Nota de disciplina de ramas:** durante F2 se trabajó por error un rato directo sobre `integration` en vez de crear la rama `feat/*` primero (el trabajo se movió a `feat/addProductsQuoteAndCheckoutApi` antes de hacer commit, sin pérdida). Ritual a seguir SIEMPRE antes de escribir código: `git checkout integration -q && git pull -q && git checkout -b feat/nombreDeLaRama -q`.
- **F3 completado y fusionado** (PR #8). Frontend React funcional de punta a punta, verificado en el navegador real (no solo Testing Library): las 4 HU funcionan — catálogo reactivo con guarda de stock, cupón WELCOME2026 (27.32% máx, nunca dispara el tope), BLACKFRIDAY40 disparando la alerta del 35% con el ajuste reconciliado visible, responsivo en móvil. 38 tests, 99.21% cobertura frontend. `npm run dev` (raíz) levanta backend+frontend en paralelo con `concurrently`.
- **Las 4 historias de usuario del enunciado están funcionalmente completas y demostrables** (F0-F3). Falta: F4 (Docker + CI/CD), F5 (documentación — innegociable, 1/3 de la nota), F6 (AWS, opcional) y F7 (guion + slides).
- **F4 completado** (PRs #9-#11): Dockerfile multi-stage verificado con `docker compose up` real (no solo declarado), workflows de GitHub Actions (`ci.yml` corriendo en verde con Postgres real como servicio, `deploy-lab.yml`, `deploy-prod.yml`), y las 3 ramas (`main`, `laboratory`, `integration`) protegidas vía `gh api` (PR obligatorio, check de CI requerido, sin force-push). Los jobs de AWS se saltan con gracia (`vars.AWS_DEPLOY_ROLE_ARN` no existe todavía — se provisiona en F6).
- **F5 completado** (PRs #12-#14): `docs/arquitectura.md`, `docs/ia.md` (bitácora honesta: 6 correcciones reales, todas por evidencia externa), `docs/auditoria-seguridad.md` (auditoría real con la skill `api-security-audit`, 2 hallazgos corregidos: comparación de API key no era de tiempo constante, `trust proxy` faltante), `README.md`, y los 5 agentes + skill `doe-stack` versionados en `.claude/`. Se saltaron las capturas/GIF del flujo (primer ítem del orden de corte) por presupuesto de tiempo — se puede retomar si sobra tiempo antes de la entrega.
- **Estado real de PRs:** 14 fusionados a `integration`. `main` y `laboratory` siguen en el commit raíz vacío — **falta la primera promoción por lotes** (integration → laboratory → main), que a su vez activaría `deploy-lab.yml` (funciona ya, no depende de AWS) y dejaría `main` listo para desplegar en cuanto F6 provisione AWS.
- **Pendiente de decisión con el candidato antes de F6:** no hay cuenta de AWS confirmada ni credenciales configuradas en esta máquina (`aws configure list` vacío). F6 es opcional y con timebox de 1h — si no hay tiempo o acceso a AWS, el plan de contingencia (IaC documentado sin ejecutar) es válido y no incumple el checklist del enunciado.
- **F7 (parcial) completado:** `docs/guion-sustentacion.md` (guion cronometrado de los 3 bloques del §6, con preguntas probables) y `docs/sustentacion.html` (respaldo navegable, 8 diapositivas) — no se conectó Google Slides en esta sesión, se usó el plan de contingencia del propio plan maestro directamente. Durante este PR, CI atrapó un bug real de `allocateProportionally` con una semilla de property-based testing distinta a la local (registrado como corrección #7 en `docs/ia.md`) — quedó corregido y verificado en 5 corridas con semillas distintas antes de continuar.
- **F6 resuelto por decisión del candidato:** sin credenciales de AWS disponibles, se documentó el IaC completo de ECS Express Mode (`infra/aws/`: `provision.sh`, 3 trust policies, README con costeo y fallback a Lambda) sin ejecutarlo — PR #17.
- **Primer lote promovido de punta a punta:** `integration` → `laboratory` (PR #18, disparó `deploy-lab.yml` por primera vez: smoke test real del contenedor + Postgres en el runner, en verde) → `main` (PR #19, `deploy-prod.yml` se saltó el despliegue con gracia por no existir `AWS_DEPLOY_ROLE_ARN`, como estaba diseñado). Las 3 ramas están sincronizadas con el trabajo completo de F0-F7.
- **Entrega funcionalmente completa:** 19 PRs fusionados, checklist del §7 cumplido punto por punto (ver verificación abajo). Todo lo que queda es opcional: pulir capturas/GIF para el README (primer ítem del orden de corte, aún no hecho), ensayar la sustentación cronometrada, y decidir si se ejecuta F6 de verdad si aparecen credenciales de AWS antes de la entrega.
- **Verificación end-to-end final YA ejecutada** (no solo el checklist marcado — se corrió de verdad, en `/tmp/verificacion-final`, clon fresco de GitHub): `npm install` limpio → `npm run typecheck` sin errores → `npm test:coverage` sin Docker (83+38 tests, ambos workspaces ≥80%) → `docker compose up --build` desde cero, `/health` y `/api/v1/products` respondiendo → repositorio confirmado público vía `api.github.com` (`private: false`, `default_branch: main`) sin sesión autenticada de por medio.
- **Siguiente paso concreto (ya no depende del agente):** ensayo cronometrado de la demo por el candidato (`docs/guion-sustentacion.md` o `docs/sustentacion.html`) al menos una vez completa antes de las 4:00 p.m. Todo el checklist del §7 está cumplido y verificado; lo que queda es preparación personal para la sustentación, no trabajo de ingeniería pendiente.

## Ritual de retoma para una sesión nueva

1. Leer este archivo completo (es largo pero es la única fuente de verdad del plan).
2. Revisar el estado real en disco (`ls`, `git log` si ya hay commits) para saber en qué fase se quedó — este encabezado puede quedar desactualizado si no se edita en cada sesión.
3. Actualizar la sección "Estado" de este mismo archivo al terminar cada fase, y registrar cualquier aprendizaje no trivial en `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` (deben quedar idénticos).
4. Continuar por la fase que corresponda según "Fases de ejecución".

---

# Plan — Prueba Técnica Full Stack "Core E-Commerce con Descuentos Acumulativos"

## Context

**Qué es:** prueba técnica para **Especialista I Open Banking (Davivienda)**. Monorepo público en GitHub con checkout e-commerce: motor de descuentos acumulativos en cascada, tope del 35%, frontend reactivo, ≥80% de cobertura y gobernanza documentada del uso de IA.

**Restricción dura:** entrega **mañana 2:00 p.m.**, sustentación **4:00 p.m. (30 min)**. El trabajo estimado es de **~17,75 h** — prácticamente todo el tiempo disponible descontando descanso, **sin holgura**. Por eso el *orden de corte* está decidido de antemano (ver más abajo): cuando haya que recortar, se recorta sin deliberar.

**Qué se evalúa realmente (§1 del enunciado):** *"el criterio de ingeniería sobre la cantidad de código"*. No gana quien escriba más, sino quien justifique mejor. El plan optimiza para los 30 minutos de defensa, no para el conteo de líneas.

**Perfil que hay que capitalizar:** el candidato trabaja hoy en Davivienda, conoce los procesos internos de construcción de APIs de propósito único desplegadas en AWS, y el objetivo declarado del área es migrar a **multinube y multirregión**. La arquitectura hexagonal no es decoración académica aquí: es el argumento de portabilidad que él ya vive en su trabajo.

---

## Estado y prerrequisitos (ya verificados en la máquina)

| Elemento | Estado |
|---|---|
| Node 24.15 · npm 11.12 · Docker 29.1 · git 2.50 | ✅ instalados |
| `gh` CLI 2.92, cuenta activa **`festem200`** | ✅ listo (ya se cambió con `gh auth switch`) |
| Repositorio destino | **`github.com/festem200/davKata-CoreEcommerce`** (público, aún **no creado**) — sigue la convención de su kata previa `davKata-RastreoEnvios` |
| Autoría git | Felix Steven Estrada Montes · festem2000@gmail.com |
| **Scope `workflow` en el token de `gh`** | ❌ **falta** — sin él GitHub rechaza cualquier push que toque `.github/workflows/`. Corregir en F4 con `gh auth refresh -h github.com -s workflow` |
| AWS CLI | ❌ no instalado — instalar en F6 |
| Cuenta AWS personal | 🕒 el candidato la está creando en paralelo. Debe elegir **Free Plan**, **no unirla a ninguna Organization** (los créditos expiran de inmediato) y completar las 5 tareas de onboarding para los US$100 extra |
| `pnpm` | ❌ ausente → por eso se usa **npm workspaces**, que es nativo |

El monorepo vive en `examen-ecommerce/` (subcarpeta que será el repo público). La plantilla **DOE Stack** (`CLAUDE.md`, `directives/`, `execution/`) permanece en la raíz del directorio de trabajo, fuera del entregable; los artefactos de IA que el evaluador debe auditar se copian a `examen-ecommerce/.claude/`.

---

## Hallazgo crítico que define la estrategia

**El tope del 35% es matemáticamente inalcanzable con las reglas del enunciado.**

Los descuentos son multiplicativos en cascada, por lo que el cliente siempre paga al menos:

```
0,90 × 0,95 × 0,85 = 0,72675   →   descuento máximo = 27,325 %
```

El 10 % aplica solo a la porción "Tecnología" (un carrito 100 % Tecnología ya es el máximo; cualquier otro producto lo **baja**), y 5 % y 15 % son constantes. Ni sumándolos linealmente (30 %) se alcanza el 35 %.

Sin embargo la **HU 4** exige la alerta del 35 % y **§6** exige demostrarla en vivo. El enunciado se contradice.

**Cómo lo resolvemos (decisión tomada):**
1. Implementar la especificación **al pie de la letra**, sin alterarla.
2. Probar el hallazgo con **property-based testing** (`fast-check`): *para todo carrito válido, el descuento efectivo ≤ 27,325 %*.
3. Documentarlo como hallazgo formal en `docs/arquitectura.md`.
4. Hacer el **catálogo de cupones data-driven**: `WELCOME2026` se mantiene en 15 % exactamente como pide la spec, y se agrega un segundo cupón de catálogo (`BLACKFRIDAY40`, 40 %) que sí dispara el tope → permite demostrar la HU 4 en vivo **sin tocar una sola línea del motor**.
5. **No se consulta al evaluador** (decisión tomada): el hallazgo se presenta ya resuelto y demostrado en la sustentación. Preguntar antes anularía el efecto y arriesgaría un cambio de reglas con el tiempo encima.

Este hallazgo es la principal ventaja competitiva de la entrega. La mayoría de candidatos escribirá un `if (descuento > 0.35)` que jamás se ejecuta.

---

## Decisiones de arquitectura

| Decisión | Elección | Justificación para la defensa |
|---|---|---|
| Monorepo | **npm workspaces** | Nativo en npm 11 (ya instalado). Cero herramientas extra que instalar o defender. |
| Backend | **Express + TypeScript strict** | Dominado por el candidato. El framework HTTP es un *adaptador*: el dominio no lo conoce. |
| Arquitectura | **Hexagonal (Ports & Adapters)** | Es el argumento de multinube: el core no sabe dónde corre. |
| Frontend | **React + Vite + TypeScript** | Vitest en front y back → un solo runner, un solo comando de cobertura. |
| Dinero | **Enteros en centavos (`Cents`)** | `0.1 + 0.2 !== 0.3`. En core bancario los floats no se usan. Diferenciador natural del perfil. |
| Persistencia | **3 adaptadores** (`memory` / `json` / `postgres`) tras un mismo puerto, seleccionables por `PERSISTENCE_DRIVER` | Demuestra el patrón Repository de verdad, no de palabra: misma suite de tests de contrato pasa en los tres. Default `json` → cero fricción para el evaluador. |
| Concurrencia | **Postgres + `UPDATE ... WHERE stock >= $1` transaccional** | Permite demostrar el decremento de stock seguro bajo carrera — imposible de mostrar con JSON. Es el problema real de un core bancario. |
| Cálculo | **Solo backend** (el front nunca calcula precios) | *"Nunca confíes en el cliente para el precio."* Regla de oro bancaria. |
| Errores | **RFC 9457 Problem Details** | Estándar usado en Open Banking (Berlin Group / OBIE). Conecta directo con el rol. |

### Estructura

```
examen-ecommerce/                  # ← repo git público
├── apps/
│   ├── backend/src/
│   │   ├── domain/                # PURO: cero imports de framework
│   │   │   ├── model/             # Money, Product, Cart, Order
│   │   │   ├── pricing/
│   │   │   │   ├── DiscountRule.ts          # ← Strategy (interfaz)
│   │   │   │   ├── rules/CategoryDiscountRule.ts
│   │   │   │   ├── rules/VolumeDiscountRule.ts
│   │   │   │   ├── rules/CouponDiscountRule.ts
│   │   │   │   ├── DiscountEngine.ts        # ← Pipeline + tope 35%
│   │   │   │   └── DiscountRuleFactory.ts   # ← Factory (data-driven)
│   │   │   └── ports/             # ProductRepository, OrderRepository (interfaces)
│   │   ├── application/           # CalculateQuoteUseCase, CheckoutUseCase
│   │   ├── infrastructure/
│   │   │   ├── http/              # Express: rutas, controladores, middlewares
│   │   │   ├── persistence/       # ← Repository: 3 adaptadores, 1 puerto
│   │   │   │   ├── memory/        #    InMemory{Product,Order}Repository
│   │   │   │   ├── json/          #    Json{Product,Order}Repository  (default)
│   │   │   │   ├── postgres/      #    Postgres{Product,Order}Repository + schema.sql
│   │   │   │   └── contract.test.ts  # ← suite de contrato: los 3 deben pasarla
│   │   │   └── config/            # catálogo, cupones, config de reglas, env
│   │   └── main.ts                # Composition Root
│   └── frontend/src/
│       ├── state/cartReducer.ts   # LÓGICA PURA ← aquí vive la cobertura
│       ├── state/CartContext.tsx  # ← Observer
│       ├── api/client.ts          # Adaptador HTTP
│       └── components/            # ProductList, CartPanel, CouponInput,
│                                  # DiscountBreakdown, MaxDiscountAlert
├── packages/contracts/            # DTOs + esquemas Zod compartidos front↔back
├── docs/
│   ├── arquitectura.md
│   ├── ia.md
│   └── adr/                       # [OPCIONAL] ADR-001..004
├── infra/
│   ├── Dockerfile                 # multi-stage: front → back → runtime no-root
│   └── aws/                       # roles IAM, trust policy OIDC, comandos ECS
├── .github/workflows/             # ci.yml · deploy-lab.yml · deploy-prod.yml
├── .claude/                       # ← skill y agente creados, AUDITABLES por el evaluador
├── docker-compose.yml             # postgres + app
└── README.md
```

### Patrones de diseño (el enunciado pide ≥2; entregamos 4 bien defendidos)

1. **Strategy** — cada regla implementa `DiscountRule`; agregar una regla nueva no toca el motor.
2. **Factory** — `DiscountRuleFactory` arma la cadena desde configuración, no desde `if`s.
3. **Repository / Ports & Adapters** — `ProductRepository` y `OrderRepository` como puertos, con **tres** adaptadores intercambiables (`memory`, `json`, `postgres`) que comparten una misma suite de tests de contrato.
4. **Observer** — el carrito del front notifica a los suscriptores vía Context + reducer.

Los cuatro se muestran en código durante la defensa; el enunciado exige dos.

### El motor, en concreto

```ts
type Cents = number;                      // SIEMPRE entero

interface PricingContext {                // inmutable
  readonly lines: readonly PricedLine[];
  readonly originalSubtotal: Cents;
  readonly currentTotal: Cents;
  readonly appliedDiscounts: readonly AppliedDiscount[];
  readonly couponCode: string | null;
}

interface DiscountRule {
  readonly id: string;
  applies(ctx: PricingContext): boolean;
  apply(ctx: PricingContext): PricingContext;   // devuelve un contexto NUEVO
}
```

`DiscountEngine.calculate()`: contexto inicial → reglas en orden → si el descuento acumulado supera `floor(originalSubtotal × 0,35)` lo trunca exacto y marca `capApplied: true`.

**Política de redondeo documentada:** todo descuento se redondea con `Math.floor` (a favor de la tienda). La suma de descuentos prorrateados por línea debe cuadrar exactamente con el descuento total — el clásico problema del centavo perdido, resuelto asignando el residuo a la última línea y verificado por test.

### Catálogo de demostración (diseñado con intención)

El catálogo no es decorativo: cada producto existe para habilitar un caso concreto de la demo en vivo, de modo que no haya que improvisar frente a la mesa.

| id | Producto | Categoría | Precio | Stock | Para qué sirve en la demo |
|---|---|---|---|---|---|
| `p1` | Audífonos Bluetooth | Tecnología | 45,00 | 10 | Solo: **no** supera $100 → únicamente descuento de categoría |
| `p2` | Teclado mecánico | Tecnología | 89,90 | 5 | Con `p1` cruza el umbral → activa el descuento por volumen |
| `p3` | Monitor 27" | Tecnología | 249,99 | 3 | Carrito alto; céntimos que prueban el prorrateo |
| `p4` | Power bank 20.000 mAh | Tecnología | 32,50 | **2** | **Stock bajo** → demuestra el rechazo por stock insuficiente |
| `p5` | Camiseta de algodón | Ropa | 19,90 | 20 | No-Tecnología → prueba que el 10 % aplica **solo** a su porción |
| `p6` | Termo de acero | Hogar | 24,00 | 8 | Mezcla de categorías |
| `p7` | Libro "Clean Architecture" | Libros | 38,00 | 6 | Guiño temático; refuerza el caso mixto |

Los precios llevan céntimos a propósito: obligan a que el prorrateo y el redondeo se comporten bien, en vez de esconder el problema tras cifras redondas.

---

## Contrato de API y seguridad

### Contrato: OpenAPI 3.1 generado desde Zod

Los mismos esquemas Zod que **validan** las peticiones en tiempo de ejecución **generan** la especificación OpenAPI, servida con Swagger UI en `/api/docs`. Una sola fuente de verdad: el contrato no puede desincronizarse del código porque es el código. Es el argumento *API-first* que se espera en Open Banking.

### Alineación con BIAN

BIAN estructura sus APIs semánticas como **Service Domain → Control Record → Behavior Qualifier**, con *action terms* (`Initiate`, `Evaluate`, `Execute`, `Retrieve`, `Update`…) y las publica en OpenAPI.

**Postura honesta y explícita:** BIAN es un estándar de la industria **bancaria**, y esto es un e-commerce. Forzar nomenclatura bancaria sobre un carrito de compras sería impostura, y cualquier evaluador que conozca BIAN lo detectaría. Lo que se hace en cambio:

- Se adopta su **semántica y disciplina**: recursos como *control records*, versionado explícito en la ruta, verbos alineados a *action terms*, contrato en OpenAPI.
- Se documenta en `arquitectura.md` una **tabla de mapeo** de cada endpoint a su Service Domain / Control Record / Action Term equivalente, señalando de forma expresa **dónde el estándar encaja y dónde no**.

Reconocer los límites de aplicabilidad de un estándar demuestra más criterio que aplicarlo a ciegas.

### Seguridad: defensa en profundidad, con paridad entre local y AWS

**El principio que resuelve la duda local vs. AWS:** la validación vive en la **aplicación**, no en la infraestructura. Así el comportamiento es idéntico en los dos entornos; lo único que cambia es **de dónde sale el secreto**:

| Entorno | Origen del secreto |
|---|---|
| Local | `.env` (en `.gitignore`), con un `.env.example` versionado sin valores reales |
| AWS | **AWS Secrets Manager / SSM Parameter Store**, inyectado al contenedor por la task definition |

El secreto **nunca** vive en el código, en el repositorio ni horneado en la imagen. Y el código no cambia entre entornos: solo el adaptador de configuración.

**Dónde poner API key y dónde no — este es el punto de criterio.** Una API key en un frontend público **es visible en el JavaScript del navegador**: no protege nada frente a una persona, solo filtra bots torpes. Por eso se separan las superficies:

| Endpoints | Protección | Razón |
|---|---|---|
| `GET /products`, `POST /cart/quote`, `POST /checkout` | **Públicos**: rate limiting, validación estricta, recálculo autoritativo en servidor | Los consume el navegador de un cliente anónimo; una API key aquí sería teatro de seguridad |
| `GET /orders/{id}` y consultas de backoffice | **API key obligatoria** | Exponen datos sensibles (qué se compró y por cuánto) y los consume un sistema, no el navegador |

**Controles transversales:** `helmet` (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`), rate limiting, límite de tamaño del cuerpo de la petición, validación Zod en todos los bordes, **SQL siempre parametrizado**, Problem Details que **no filtran stack traces ni detalles internos** en producción, contenedor con usuario **no-root**, `npm audit` en CI y OIDC sin secretos de larga duración en el pipeline.

**Capa adicional en AWS:** AWS WAF delante del balanceador, con rate limiting y reglas gestionadas. Se documenta como recomendación; si ECS Express Mode no permite adjuntarlo al ALB compartido que administra, queda registrado como tal en lugar de afirmarse sin verificar.

**Lo que NO se implementa, y por qué:** no hay autenticación de usuarios porque **no hay identidad de usuario en el alcance** del enunciado. En `arquitectura.md` se documenta cómo se resolvería en producción (OAuth 2.0, y **FAPI** —Financial-grade API— para el perfil de Open Banking) y por qué añadirlo aquí sería complejidad sin beneficio. La skill propia **`api-security-audit`** se ejecuta sobre el resultado y su informe se incorpora a `docs/ia.md`.

---

## Flujo Git y CI/CD

Se replica el **flujo de promoción real de la organización del candidato**. Esto no es decoración: demuestra que entiende gestión de releases, no solo `git push`.

```
feature/*  ──PR──▶  integration  ──PR──▶  laboratory  ──PR──▶  main
                    (CI + build)          (pre-prod)          (producción)
```

Ninguna rama de destino se toca directamente: todo entra por PR con checks verdes.

### Qué hace el pipeline en cada nivel

**Decisión tomada: el despliegue ocurre única y exclusivamente desde `main`.** Las demás ramas ejecutan verificación y construcción de artefacto, pero no despliegan nada.

| Evento | Job | Despliega |
|---|---|---|
| PR → `integration` | lint · typecheck · tests · **cobertura ≥ 80 % (bloqueante)** · `docker build` de validación (sin push) | — |
| push a `integration` | CI completo + **build y push de la imagen a ECR** con tag `int-<sha>` | — |
| PR → `laboratory` | Re-verificación sobre el conjunto integrado + smoke test del contenedor levantado en el runner | — |
| push a `main` | **Promueve el artefacto ya construido** (retag `prod-<sha>` + `latest`) y despliega | **Único entorno desplegado** |

Que solo `main` despliegue simplifica y abarata: **un solo servicio ECS y una sola base de datos**, no dos. Y es coherente con el modelo mental de la organización: `main` es la rama productiva; el resto son etapas de verificación.

### Principio de release: **build once, deploy many**

La imagen se construye **una sola vez** en `integration` y avanza por el flujo **promoviéndose por retag**, nunca reconstruyéndose.

> *"El artefacto que se probó en integración es, bit a bit, el mismo que llega a producción. Si reconstruyera la imagen en cada rama, no estaría promoviendo lo que probé — estaría desplegando algo parecido."*

### Seguridad del pipeline (repositorio público)

- **OIDC federado**, sin `AWS_ACCESS_KEY_ID` ni secretos de larga duración. GitHub obtiene credenciales temporales asumiendo un rol de IAM.
- La **trust policy del rol se restringe por rama** con la condición `sub` (`repo:<owner>/examen-ecommerce:ref:refs/heads/main`), de modo que un PR de un fork no puede desplegar aunque ejecute workflows.
- `permissions:` al mínimo (`id-token: write`, `contents: read`).
- Se usa `pull_request`, **nunca `pull_request_target`** — que es justamente el vector de exfiltración de secretos en repos públicos.
- Los jobs de deploy solo se disparan en `push` a ramas protegidas.

### Reglas de protección de ramas

`main` y `laboratory`: PR obligatorio, checks en verde, sin force-push. `integration`: PR obligatorio desde `feature/*`.

### Entrega incremental: funcionalidades pequeñas, PRs pequeños

El código **se sube progresivamente**, nunca en un volcado final. Cada funcionalidad acotada es una rama `feature/*` con su PR a `integration`. Esto no es solo higiene: §7 exige literalmente *"historial de commits descriptivo e incremental"*, y un repositorio con un único commit gigante lo incumple de forma visible.

Se conserva la **convención de ramas que el candidato ya usa** en `davKata-RastreoEnvios`: prefijo `feat/` con nombre en camelCase. La coherencia con su historial vale más que imponer un estilo nuevo.

Secuencia prevista (~12 PRs):

| # | Rama | Entrega |
|---|---|---|
| 1 | `feat/setupMonorepo` | Workspaces, TS estricto, Vitest con umbral |
| 2 | `feat/addDomainModelAndMoney` | `Cents`, modelos, política de redondeo |
| 3 | `feat/addDiscountEngine` ★ | Reglas Strategy, `DiscountEngine`, tope 35 %, property-based |
| 4 | `feat/addPortsAndMemoryAdapter` | Puertos + adaptador memory + **suite de contrato** |
| 5 | `feat/addJsonAdapter` | Adaptador por defecto |
| 6 | `feat/addPostgresAdapter` | SQL explícito + concurrencia del stock |
| 7 | `feat/addProductsAndQuoteApi` | `GET /api/products`, `POST /api/cart/quote`, Problem Details |
| 8 | `feat/addCheckoutIdempotency` | `POST /api/checkout` + `Idempotency-Key` |
| 9 | `feat/addCartFrontend` | Reducer, Context, listado y panel de carrito |
| 10 | `feat/addCouponAndBreakdown` | Cupón + desglose detallado |
| 11 | `feat/addMaxDiscountAlert` | Alerta persistente de la HU 4 |
| 12 | `feat/addDockerAndCI` · `feat/addAwsDeploy` · `feat/addDocumentation` | Contenedor, workflows y docs |

Las promociones `integration → laboratory → main` se hacen **por lotes de release** (2 o 3 a lo largo del desarrollo), no una por cada feature — que es como opera un flujo de promoción real.

### Idioma y registro

**Identificadores del código en inglés** (`DiscountEngine`, `CategoryDiscountRule`, `calculateQuote`), siguiendo la convención de la industria y evitando híbridos.

**Todo lo demás en español:** mensajes de commit, títulos y descripciones de PR, comentarios del código, documentación (`arquitectura.md`, `ia.md`, `README.md`, ADRs) y textos de la interfaz. Los nombres de rama mantienen el patrón `feat/camelCase` en inglés por coherencia con el historial previo del candidato.

La bitácora de `docs/ia.md` se escribe **durante** el desarrollo, no reconstruida al final.

Commits en imperativo y descriptivos: `feat(motor): aplicar tope del 35% sobre el subtotal original`.

### Coherencia de entornos (paridad dev/prod)

Un **único artefacto**: el backend Express sirve también los estáticos ya compilados del frontend. Una sola imagen, una sola URL, **cero CORS**, y el mismo contenedor corre en Docker Compose y en ECS.

- **Dev local:** `npm run dev` → Vite (HMR) + Express, con proxy de Vite hacia `/api`.
- **Docker Compose:** `postgres` + `app`.
- **AWS:** la misma imagen de `app` + RDS Postgres.

Trade-off documentado: a escala real el frontend iría a CDN (S3 + CloudFront); aquí se priorizó **paridad de entornos y una sola superficie de despliegue**.

---

## Documentación continua (no es una fase: ocurre durante todo el trabajo)

Cuatro registros se mantienen **mientras se construye**, nunca reconstruidos al final:

1. **Directivas DOE** — al ejecutar cada fase se crea o actualiza su directiva en `directives/` y se registra la línea correspondiente en `directives/INDEX.md`. Es la Capa 1 de la arquitectura DOE que gobierna este proyecto.
2. **Registro de aprendizajes** — los hallazgos no triviales se anotan en la sección correspondiente de `CLAUDE.md`, replicada de forma **idéntica** en `AGENTS.md` y `GEMINI.md`, como exige la plantilla.
3. **`docs/ia.md`** — bitácora de co-creación escrita en el momento: qué generó la IA, qué se escribió a mano y, sobre todo, **las correcciones a la IA en el instante en que ocurren**. Una bitácora reconstruida al final se nota y es exactamente lo que §5 quiere auditar.
4. **Commits y PRs en español**, descriptivos e incrementales, como evidencia viva del proceso.

## Presentación de sustentación

Se genera en **F7**, no antes: su contenido depende de lo que efectivamente se haya construido, y escribirla sobre supuestos obligaría a rehacerla.

- **Destino:** Google Slides en la cuenta de Drive del candidato (`soultec.sas@gmail.com`), ya conectada.
- **Pendiente:** autorizar el toolkit `googleslides` (Drive está conectado; Slides no). Es un OAuth de un clic que puede resolverse en paralelo al desarrollo.
- **Respaldo si la autorización falla:** el mismo guion como documento Markdown en el repositorio y/o un artefacto HTML navegable. El contenido no se pierde por un problema de conexión.
- **Contenido:** los tres bloques de §6 —demo, defensa de arquitectura y auditoría de IA— con los puntos clave, el minutaje y las respuestas preparadas a preguntas probables.

---

## Fases de ejecución

Bloques secuenciales; cada uno termina con **verificación externa** (ejecutar, no suponer).

### F0 · Andamiaje — 45 min

Monorepo **npm workspaces** con tres paquetes: `@examen/contracts`, `@examen/backend`, `@examen/frontend`.

- **`tsconfig.base.json` con tipado estricto real.** No basta `"strict": true` — el requisito §4.2 exige eliminar los `any` implícitos, así que se añaden `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns` y `noUnusedLocals`.
- **Resolución del workspace sin fricción de build:** `@examen/contracts` expone directamente su fuente TypeScript (`main`/`types` → `src/index.ts`). Vite, Vitest y `tsx` lo resuelven de forma nativa; el bundle de producción del backend se hace con **tsup** marcando el paquete como `noExternal`, de modo que no hace falta un paso de compilación intermedio ni orquestar el orden de builds.
- **Vitest** en ambas apps con `coverage.thresholds` al 80 % **bloqueante** (falla el comando, no solo advierte).
- Dependencias: backend con Express 5, `pg`, `zod`, y `supertest` + `fast-check` en desarrollo; frontend con React 19 y Testing Library.
- Puerto del backend **8080**, alineado con el `containerPort` de ECS Express Mode.
- `git init`, las tres ramas (`main`, `laboratory`, `integration`) y primer commit.

**Verificación:** `npm install` limpio, `npm run typecheck` sin errores y `npm test` ejecutándose de punta a punta.

### F1 · Dominio y motor — 3,5 h ★ el corazón de la entrega
`Money` (centavos), modelos, las 3 reglas como Strategy, `DiscountEngine`, `DiscountRuleFactory`, catálogo de cupones con vigencia.

Tests exhaustivos, incluidos **todos** los edge cases de §4.3:
- Carrito vacío → `0`, **nunca `NaN`** (división por cero al calcular el % efectivo).
- Subtotal exactamente $100 → la regla dice *"supera"* → `>` estricto, no `>=`.
- Tope exactamente en 35 % → verificar la frontera.
- Cupón inexistente / expirado / vacío.
- Cantidades 0, negativas, producto inexistente.
- Stock insuficiente.

**Property-based con `fast-check`** (invariantes, no ejemplos):
- el total final nunca es negativo;
- el descuento efectivo nunca supera el 35 %;
- **con la config oficial nunca supera 27,325 %** ← la prueba del hallazgo;
- la suma de descuentos por línea cuadra con el total (cero centavos perdidos);
- agregar un producto nunca reduce el total a pagar.

> **Esta capa la escribe el candidato a mano.** Es la lógica que debe poder defender línea por línea, y lo que permite afirmar con honestidad en `docs/ia.md` que la lógica crítica no fue generada.

**Verificación:** `npm run test:coverage -w apps/backend` con dominio > 95 %.

### F2 · Aplicación, API y persistencia — 3 h
Casos de uso `CalculateQuote` y `Checkout`; puertos y **los tres adaptadores** de persistencia; API Express:

```
GET  /api/v1/products           → catálogo con stock
POST /api/v1/cart/quote         → cotiza; no persiste ni toca stock   [BIAN: Evaluate]
POST /api/v1/checkout           → valida stock, recalcula, decrementa, persiste  [BIAN: Execute]
GET  /api/v1/orders/{id}        → consulta la orden  [BIAN: Retrieve] — requiere API key
GET  /api/docs                  → Swagger UI sobre el OpenAPI generado desde Zod
GET  /health                    → sonda para Docker y ECS
```

Validación de entrada con Zod desde `packages/contracts`, errores **RFC 9457**, header `X-Correlation-Id` y **`Idempotency-Key` en checkout** (un reintento por timeout no puede duplicar la orden ni el decremento de stock — estándar en pagos y en Open Banking).

**Persistencia — los tres adaptadores tras el mismo puerto**, elegidos por `PERSISTENCE_DRIVER` (default `json`, para que el evaluador no necesite Docker). Una **suite de tests de contrato** única se ejecuta contra los tres: si un adaptador no la pasa, no es un adaptador válido. El de Postgres usa `pg` con SQL explícito —sin ORM— porque el SQL debe vivir *dentro* del adaptador, que es justamente el punto del patrón.

**Concurrencia (el argumento bancario):** el decremento de stock se hace en transacción con guarda atómica

```sql
UPDATE products SET stock = stock - $1
 WHERE id = $2 AND stock >= $1
RETURNING stock;
```

con un test que dispara **N checkouts simultáneos** sobre el último ítem disponible y verifica que el stock nunca queda negativo y que solo una orden gana la carrera.

**Verificación:** tests de integración con `supertest` cubriendo 200 / 400 / 404 / 409 / 422, más la suite de contrato en verde en los tres adaptadores.

### Identidad visual (extraída del CSS de producción de davivienda.com)

Valores reales medidos sobre el sitio, no aproximados de memoria:

| Rol | Valor | Uso |
|---|---|---|
| **Rojo corporativo** | `#E1111C` | Color primario: acciones, acentos, alerta del tope |
| Rojo tenue | `#FBE7E8` | Fondos de aviso y estados destacados |
| Texto principal | `#212529` | Cuerpo y titulares |
| Texto secundario | `#404040` / `#6E6E6E` | Apoyo y etiquetas |
| Superficie oscura | `#21262E` | Encabezado / pie |
| Fondos neutros | `#F2F3F5` · `#F1F2F8` · `#F4F6F7` | Base de página y tarjetas |
| Borde | `#E0E1E3` | Separadores y contornos |
| Acentos | `#3186F8` · `#FDBB11` · `#7F26FF` | Estados informativo / advertencia / destaque |

**Rasgos de forma característicos:** tarjetas con `border-radius: 16px`, botones tipo **píldora** (`border-radius: 9999px`), superficies claras sobre fondo gris muy suave y jerarquía tipográfica sobria.

**Tipografía:** el sitio usa una fuente propietaria llamada `Davivienda` que no es de uso público, con `Roboto` como secundaria. Se usará **Roboto** (Google Fonts) con fallback de sistema — el parecido visual se logra con la paleta y las formas, no con la fuente.

**Qué se replica exactamente:** el *lenguaje visual* — la distribución del rojo sobre blanco (rojo como acento puntual, no como fondo dominante), la barra de navegación, los encabezados de sección, las tarjetas de producto con esquinas de 16 px, los botones tipo píldora, los bordes suaves y el pie de página. Es la sensación de la marca, construida con CSS propio.

**Qué NO se replica:** logotipos, imágenes, iconografía propietaria ni ningún activo gráfico del banco. Tampoco se usa su nombre como marca de la aplicación.

**Marca de la tienda: `Soultec`** — la marca personal del propio candidato, que ya usa en varios repositorios (`soultec`, `soultec_voice`, `soul_tech_site_web`). Elimina por completo cualquier problema de uso de marca ajena en un repositorio público y aporta coherencia con su portafolio. El `README.md` deja constancia de que la identidad visual está inspirada en la paleta corporativa de la entidad, sin afiliación ni respaldo oficial.

### F3 · Frontend — 3,5 h
`cartReducer` puro (ahí vive la cobertura), `CartContext` (Observer), `useQuote` con debounce contra el backend, y los componentes: `ProductList`, `CartPanel`, `CouponInput`, `DiscountBreakdown` (desglose regla por regla), `MaxDiscountAlert` (HU 4, persistente y distintiva). Responsivo. Estados de carga y error visibles.

**Verificación:** tests del reducer + Testing Library sobre la alerta del 35 % y el desglose; cobertura ≥ 80 %.

### F4 · Docker, flujo de ramas y CI/CD — 2 h
`npm test` en la raíz corre todo y muestra la tabla de cobertura de front y back (se proyecta en vivo en la defensa).

**Docker:** `Dockerfile` multi-stage (build del front → build del back → runtime alpine con usuario **no-root**, `HEALTHCHECK` sobre `/health`). `docker-compose.yml` con `postgres` + `app`, con `depends_on: condition: service_healthy` para que el backend no arranque antes que la base.

**Git:** repositorio público, `git init`, creación de las tres ramas (`main`, `laboratory`, `integration`), reglas de protección, y desarrollo real desde `feature/*` con commits incrementales y descriptivos (§7 lo exige explícitamente).

**CI/CD:** los workflows descritos en la sección *Flujo Git y CI/CD*, con OIDC.

**Verificación:** `docker compose up` desde cero en carpeta limpia; un PR real de prueba `feature/*` → `integration` con los checks en verde.

### F5 · Documentación — 2,5 h ★ tercio de la nota
- **`docs/arquitectura.md`** — responde una por una las 4 preguntas de §4.1, los 4 patrones con enlace al archivo real, los trade-offs asumidos, cómo se aisló el motor de la persistencia y los controladores, y **el hallazgo del 35 % con su demostración**.
- **`docs/ia.md`** — se ha ido escribiendo **durante** el desarrollo, no al final. El §5 exige **al menos** una skill y un agente; se entrega un equipo completo, todo versionado en `.claude/` **dentro del repo** para que el evaluador lo audite (§6 pide demostrarlo en vivo).

  **Skills:** el **DOE Stack** (Directive → Orchestration → Execution) ya en uso, más la skill propia **`api-security-audit`** que el candidato ya tenía construida.

  **Agentes, con rol y reglas explícitas:**

  | Agente | Rol | Reglas que lo gobiernan |
  |---|---|---|
  | `arquitecto-backend` | Diseña e implementa dominio y aplicación | El dominio no importa nada de framework; SOLID; sin `any`; dinero solo en centavos |
  | `desarrollador-frontend` | Componentes React y estado del carrito | El front nunca calcula precios; lógica en reducers puros; accesibilidad; respetar la paleta |
  | `ingeniero-pruebas-backend` | Pruebas del motor, casos de uso y adaptadores | Edge cases del §4.3; invariantes con property-based; suite de contrato en los tres adaptadores |
  | `ingeniero-pruebas-frontend` | Pruebas del reducer y de componentes | Testing Library; verificar la alerta de la HU 4 y el desglose; cobertura ≥ 80 % bloqueante |
  | `auditor-calidad` ★ | **Crítico adversarial. No escribe código.** | Cuestiona las decisiones de los otros cuatro y exige justificación de patrones, SOLID y estructura; puede rechazar una implementación |

  El `auditor-calidad` es la pieza más vendible: monta una **revisión adversarial** entre agentes, en la que uno tiene autoridad para rechazar el trabajo de los demás. Eso convierte la gobernanza de IA en un proceso verificable, no en una declaración de buenas intenciones.

  Los agentes de pruebas van **separados por capa** a propósito: el backend se prueba con invariantes matemáticas y contratos, el frontend con interacción y accesibilidad. Son disciplinas distintas y mezclarlas en un solo rol diluye ambas.

  **Bitácora:** % sugerido por IA vs. escrito a mano, y **≥2 correcciones reales a la IA**, registradas en el momento en que ocurran. Candidatos ya identificados: `NaN` por división por cero con carrito vacío; dinero en `number` decimal corregido a centavos enteros; `>=` vs `>` en el umbral de $100; `Math.round` regalando centavos donde corresponde `Math.floor`.
- **`README.md`** — instalación, variables de entorno, comandos de ejecución y de pruebas, más el aviso sobre la identidad visual inspirada sin afiliación oficial. Incluye **capturas de los momentos clave** (desglose de la cascada, alerta del 35 %, rechazo por stock insuficiente, tabla de cobertura en consola) y un **GIF corto del flujo completo**, para que el trabajo se entienda aunque el evaluador no llegue a ejecutar el proyecto.
- **`insumos/`** — el enunciado original, replicando la convención de `davKata-RastreoEnvios`. Permite que `arquitectura.md` referencie sus secciones (§4.1, §4.3, §7) y evidencie el cumplimiento punto por punto.

### F6 · Despliegue AWS con **ECS Express Mode** — timebox 1 h `[OPCIONAL, se aborta sin culpa]`

**Ruta elegida: Amazon ECS Express Mode** (GA desde noviembre 2025). Se le entregan solo tres cosas — imagen de contenedor + rol de ejecución de tarea + rol de infraestructura — y AWS provisiona el servicio Fargate, una **URL con HTTPS/SSL**, autoescalado, monitoreo y red. **Comparte el ALB entre servicios** para abaratarlo, que era justo el costo que hacía inviable ECS clásico. Sin cargo adicional por Express Mode: se paga solo el Fargate subyacente. Desplegable por AWS CLI, CloudFormation, CDK o Terraform.

**Costeo:** cubierto por los **US$200 en créditos** del Free Plan (US$100 al registrarse + US$100 por las 5 tareas de onboarding). Una tarea mínima ronda US$13-30/mes → alcanza de sobra para los 6 meses.

**Por qué contenedor y no Lambda** — este es el argumento que conecta con el objetivo de multinube del área: **una Lambda Function URL es lock-in de AWS; una imagen de contenedor no.** El mismo artefacto corre en ECS, EKS, Cloud Run o Azure Container Apps. Se elige la opción portable.

**Estado del contexto:** el candidato está creando la cuenta AWS en paralelo. Requisitos que debe cumplir: elegir **Free Plan**, **no unirla a ninguna AWS Organization** (los créditos expiran de inmediato si lo hace) y completar las 5 tareas de onboarding. Pendiente además instalar el **AWS CLI** (no está en la máquina).

⚠️ Advertir en la documentación: al expirar el Free Plan (6 meses o créditos agotados) **AWS cierra la cuenta** y borra los datos a los 90 días. Es un entorno de demostración, no de producción.

**Pasos concretos (ya verificados en la documentación de AWS):**

1. Crear los dos roles: `ecsTaskExecutionRole` y `ecsInfrastructureRoleForExpressServices`, con las políticas gestionadas `AmazonECSTaskExecutionRolePolicy` y `AmazonECSInfrastructureRoleforExpressGatewayServices`. *(Son *eventually consistent*: si el primer `create` falla con "Unable to assume the service linked role", esperar ~1 min y reintentar.)*
2. Registrar el proveedor OIDC de GitHub y crear el rol `github-actions-ecs-role` con la trust policy restringida por rama.
3. Repositorio ECR + push de la imagen.
4. Crear el servicio:

```bash
aws ecs create-express-gateway-service \
  --primary-container '{"image":"<ecr>/examen-ecommerce:prod-<sha>","containerPort":8080}' \
  --execution-role-arn arn:aws:iam::<acct>:role/ecsTaskExecutionRole \
  --infrastructure-role-arn arn:aws:iam::<acct>:role/ecsInfrastructureRoleForExpressServices \
  --service-name examen-ecommerce-prod \
  --cpu 0.25 --memory 0.5 \
  --health-check-path "/health" \
  --scaling-target '{"minTaskCount":1,"maxTaskCount":2}' \
  --monitor-resources
```

5. En los workflows, desplegar con `aws-actions/amazon-ecs-deploy-express-service@v1`.

Requiere una **VPC por defecto** con subredes públicas en la región (existe salvo que se haya borrado). Resultado: `https://examen-ecommerce-prod.ecs.<region>.on.aws/` con SSL, multi-AZ, autoescalado, CloudWatch y **despliegues canary con rollback automático ante alarmas 5XX** — sin escribir infraestructura.

**Base de datos:** una instancia **RDS Postgres `db.t4g.micro`** (~US$13/mes). Como solo se despliega desde `main`, basta **un servicio ECS y una sola base**: total **~US$22/mes** → los US$200 en créditos cubren cerca de **9 meses**.

**Fallback si AWS se complica:** desplegar la misma imagen en Lambda como container image con el AWS Lambda Web Adapter (US$0, *always free*), o entregar el IaC de ECS Express Mode escrito y sin ejecutar. La imagen Docker es idéntica en los tres casos, por lo que esta decisión **no bloquea ninguna fase anterior**.

**Nota de rigor para la sustentación:** ECS Express Mode es GA desde noviembre de 2025 y es el **reemplazo oficial de AWS App Runner**, que dejó de aceptar clientes nuevos en abril de 2026. Mencionarlo demuestra estar al día con la plataforma.

> Frase para la defensa: *"El mismo artefacto Docker corre en ECS Fargate, EKS, Cloud Run o Azure Container Apps. Usé ECS Express Mode porque me da HTTPS y autoescalado sin escribir infraestructura, y porque el contenedor —a diferencia de una Lambda Function URL— no me amarra al proveedor. **Elegí la opción portable, que es exactamente la propiedad que se necesita para ir a multinube.**"*

### F7 · Guion y presentación de sustentación — 1,5 h

Guion cronometrado para 30 min (el enunciado plantea 20; se prepara para 30 con margen de recorte), con el orden exacto de clics de la demo — agregar `p1` → agregar `p2` para cruzar los $100 → intentar 3 unidades de `p4` y provocar el rechazo por stock → aplicar `WELCOME2026` y recorrer la cascada → aplicar el cupón que dispara el tope → alerta del 35 % → confirmar la orden persistida y consultarla por `GET /api/orders/:id`.

Incluye además la ruta de navegación del código para la defensa de arquitectura, el momento exacto de proyectar la tabla de cobertura, y respuestas preparadas a las preguntas probables.

**Activos verificables del perfil que conviene mencionar.** El candidato mantiene repositorios públicos que acreditan el perfil de Open Banking de forma comprobable, no declarativa:

- `marco-apis-bancarias-internas-2030` — marco de referencia para APIs bancarias internas.
- `apigee-knowledge-base` — base de conocimiento sobre el gateway de APIs.
- `quarkus-reactive-docs` — respalda su experiencia en Java reactivo.
- `davKata-RastreoEnvios` — kata previa con **este mismo flujo de ramas**, lo que demuestra que el flujo de promoción es su práctica habitual y no algo montado para esta prueba.

---

## Presupuesto de tiempo y orden de corte

| Fase | Estimado |
|---|---|
| F0 · Andamiaje | 0,75 h |
| F1 · Dominio y motor ★ | 3,5 h |
| F2 · Aplicación, API y persistencia | 3,0 h |
| F2b · OpenAPI desde Zod + capa de seguridad | 1,5 h |
| F3 · Frontend | 3,5 h |
| F4 · Docker, ramas y CI/CD | 2,0 h |
| F5 · Documentación ★ (5 agentes + capturas y GIF) | 4,0 h |
| F6 · AWS | 1,5 h |
| F7 · Guion + presentación en Slides | 1,5 h |
| **Total** | **~21,25 h** |

> Hora de referencia al cerrar el plan: **8 de septiembre, 10:52 a.m. (COT)**. Entrega el 9 a las 2:00 p.m., sustentación a las 4:00 p.m.

**Decisión del candidato: se ejecuta el alcance completo, asumiendo jornada nocturna.** Queda advertido y registrado que ~20,75 h estimadas exceden el tiempo disponible antes de las 2:00 p.m., y que la sustentación es a las 4:00 p.m. el mismo día.

El orden de corte siguiente **no es el plan, sino la contingencia**: se aplica solo si una fase se atasca, y se avisará en el momento exacto en que se active, en lugar de decidirlo en silencio al final.

**Innegociable:** F0 → F1 → F2 → F3 → F5 (código funcional + 80 % de cobertura + documentación).

**Orden de corte (contingencia), de primero a último:**
1. GIF de la demo → se conservan solo las capturas.
2. RDS → el contenedor desplegado corre con `PERSISTENCE_DRIVER=json` (Postgres sigue demostrable en local con Docker Compose), limitación documentada.
3. Despliegue AWS efectivo (F6) → quedan el IaC y los workflows escritos y revisables, sin ejecutar. **El §7 no exige despliegue**, así que este corte no incumple el checklist.
4. ADRs.
5. Pulido visual del frontend (funcionalidad completa, estética mínima).

Lo que **nunca** se corta: el motor, los tests, `docs/arquitectura.md` y `docs/ia.md`. §1 dice explícitamente que se evalúa criterio de ingeniería, no cantidad de código — un entregable impecable sin desplegar puntúa por encima de uno desplegado con documentación floja.

---

## Diferenciadores frente al resto de candidatos

1. **El hallazgo del 35 %** con demostración formal y test que lo prueba.
2. **Aritmética entera en centavos** + prorrateo con residuo — problema real de core bancario.
3. **`Idempotency-Key` en el checkout** — estándar de pagos y de Open Banking; conecta con el rol al que aplica.
4. **Decremento de stock seguro bajo concurrencia** — guarda atómica en SQL + test con N checkouts simultáneos sobre el último ítem, verificando que el stock nunca queda negativo.
5. **Tres adaptadores de persistencia** sobre un mismo puerto, validados por una **suite de tests de contrato** compartida.
6. **RFC 9457 Problem Details** — el estándar de errores que usan Berlin Group y OBIE.
7. **Property-based testing** — va más allá del 80 % exigido: prueba invariantes, no ejemplos.
8. **Portabilidad multinube demostrada**, no afirmada: mismo artefacto, adaptadores intercambiables.
9. **Los artefactos de IA versionados dentro del repo** — el evaluador puede auditar las skills y los agentes, no solo leer sobre ellos.
9b. **Revisión adversarial entre agentes** — un `auditor-calidad` con autoridad para rechazar el trabajo de los agentes que escriben código. El §5 pide un agente; se entrega un equipo con separación de roles y un control de calidad que cuestiona a los demás.
9c. **Identidad visual alineada a la entidad**, con la paleta extraída del CSS real de producción — y con el límite de marca explícitamente razonado en el README.
10. **Flujo de promoción de 4 niveles con "build once, deploy many"** — el mismo artefacto se promueve por retag; no se reconstruye por entorno.
11. **CD con OIDC federado y cero secretos de larga duración** en un repositorio público, con la trust policy restringida por rama. Seguridad de cadena de suministro, no solo del código.

---

## Fuera de alcance (descartes deliberados)

Se documentan en `arquitectura.md`: saber qué **no** construir, y poder justificarlo, es parte del criterio que evalúa el §1.

| Descartado | Razón |
|---|---|
| **Graphify / grafo de conocimiento** | Resuelve la navegación de bases de código grandes y ajenas. Aquí son ~35 archivos propios con arquitectura hexagonal, cuya estructura ya se entiende leyendo las carpetas. Sin problema real que resolver, se leería como sobreingeniería. |
| **Autenticación de usuarios (login, JWT, roles)** | No existe identidad de usuario en el alcance del enunciado. Se documenta cómo se resolvería en producción (OAuth 2.0 + FAPI) en lugar de añadir complejidad sin beneficio. |
| **API key en endpoints públicos** | Sería visible en el JavaScript del navegador: teatro de seguridad. Se aplica solo donde protege algo real (`GET /orders/{id}`). |
| **Segundo entorno desplegado (`laboratory`)** | Solo `main` despliega. Simplifica el pipeline y reduce el costo a un servicio ECS y una base de datos. |
| **ORM (Prisma, Drizzle)** | Con Ports & Adapters el SQL debe vivir *dentro* del adaptador, que es justamente el punto del patrón. `pg` con SQL explícito: menos dependencias y más control. |
| **Nomenclatura BIAN literal en las rutas** | BIAN es un estándar bancario; esto es un e-commerce. Se adopta su semántica y se documenta el mapeo, en vez de forzar nombres bancarios sobre un carrito. |
| **Frontend en CDN separado (S3 + CloudFront)** | Se prioriza paridad de entornos y una sola superficie de despliegue. Es lo que haría a escala real, y queda documentado como tal. |

---

## Verificación end-to-end (antes de entregar)

1. `git clone` en carpeta limpia → `npm install` → `npm test` → cobertura ≥ 80 % en front y back, en verde. **Sin Docker ni base de datos** (default `json`) — es la ruta que seguirá el evaluador.
2. `docker compose up` → Postgres + app funcionando en el navegador; repetir el flujo con `PERSISTENCE_DRIVER=postgres` y confirmar comportamiento idéntico.
3. Recorrer manualmente las 4 historias de usuario, marcándolas una por una — incluida la alerta del 35 % de la HU 4.
4. Recorrer los 7 ítems del **Checklist de Entrega** (§7) del enunciado y marcarlos.
5. Verificar el historial de commits: incremental y descriptivo (lo pide §7 explícitamente), y que el flujo de ramas quedó evidenciado en los PRs.
6. Repositorio público y accesible **desde una ventana de incógnito** (sesión cerrada).
7. Si se desplegó: abrir la URL de ECS y comprobar que responde.
8. Ensayo cronometrado de la demo, mínimo una vez completa.
