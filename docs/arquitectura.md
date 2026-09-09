# Arquitectura — Core E-Commerce Checkout

## Diagramas

**Despliegue en AWS** (fuente editable: [`diagrams/diagrama-arquitectura-aws.drawio`](./diagrams/diagrama-arquitectura-aws.drawio))

![Arquitectura de despliegue en AWS](./diagrams/diagrama-arquitectura-aws.png)

**Modelo de datos** (fuente editable: [`diagrams/diagrama-bd.drawio`](./diagrams/diagrama-bd.drawio))

![Modelo de datos](./diagrams/diagrama-bd.png)

## 1. ¿Por qué este stack y este diseño de carpetas?

| Decisión | Elección | Por qué |
|---|---|---|
| Backend | **Express 5 + TypeScript estricto** | Manejo del framwork ya lo habia implementado para el proyecto de Agregación Bancaria entonces por tema de tiempo y precision;  |
| Arquitectura | **Hexagonal (Ports & Adapters)** | Elegi esta arquitectura porque me permite tener separada la logica de las conexions a BD, otras apis o servicios, para el banco y para uno como desarrollador es muy importante que este separada la logica del backend que se quiera usar en un futuro, dado que el banco le esta apuntando al conecpto de multinube. Esta arquitectura se ajustaria muy bien para este y futuros proyectos dentro de la organización.
| Frontend | **React 19 + Vite + TypeScript** | Use React por velocidad bajo la restricción de tiempo real del proyecto y porque solo se iba a diseñar una pagina de ordenes|



## 2. Trade-offs asumidos

| Trade-off | Decisión | Costo aceptado |
|---|---|---|
| Portabilidad vs. superficie de mantenimiento | Un único adaptador de persistencia (Postgres), no varios intercambiables por variable de entorno | Se probaron 3 (`memory`/`json`/`postgres`) para demostrar el patrón Repository; se eliminaron los dos primeros porque mantener implementaciones paralelas que nadie usa en producción costaba más de lo que aportaban. El puerto (`ProductRepository`/`OrderRepository`) sigue demostrando el desacople — el dominio no conoce `pg` — sin necesitar una segunda implementación real. |
| Velocidad de entrega vs. rendimiento de cálculo | El motor recalcula todo el carrito en cada cotización, sin memoización | El carrito tiene ≤7 productos; optimizar sería resolver un problema que no existe a esta escala. |
| Un solo artefacto vs. despliegue independiente de frontend | El backend sirve los estáticos del frontend ya compilados ([`app.ts`](../apps/backend/src/app.ts)); un único contenedor se despliega en AWS | No separé frontend y backend en componentes/contenedores independientes porque el objetivo del ejercicio también incluía simular un despliegue continuo real hacia AWS, y separar en dos servicios hubiera significado el doble de pipelines, recursos y tiempo para poder probarlo de verdad en la nube — priorizando eso, que es un conocimiento tan importante para el banco como el código mismo, por encima de la independencia entre módulos. El costo: pierdo algo de esa independencia (no puedo escalar ni desplegar uno sin el otro) y algo de aislamiento de seguridad a nivel de infraestructura entre los dos componentes. Al ser un servicio público sin autenticación de usuarios, ese costo es bajo — no hay una razón fuerte para blindar la comunicación interna entre dos servicios que hoy comparten el mismo proceso. A escala real, con datos sensibles de por medio, sí separaría frontend (CDN, S3 + CloudFront) y backend en servicios independientes. |
| ORM vs. SQL explícito | `pg` sin ORM en el adaptador Postgres | Más SQL escrito a mano — pero con Ports & Adapters el SQL **debe** vivir dentro del adaptador; un ORM diluiría exactamente el patrón que se quiere demostrar. |
| Cobertura del adaptador Postgres | Cuenta para el umbral bloqueante del 80% ([`vitest.config.ts`](../apps/backend/vitest.config.ts)) | Es el único adaptador de persistencia y CI ya provisiona un Postgres real (`services.postgres` en `ci.yml`), así que excluirlo escondería justo el código que más importa medir. Solo se excluye `testDatabase.ts` (utilería exclusiva de tests). |


## 3. Cómo se aisló el motor de descuentos de la persistencia y los controladores

El motor vive enteramente en `domain/pricing/` y **no importa nada** de Express, `pg`, ni de los repositorios:

```ts
// DiscountEngine.calculate() — firma completa
calculate(
  cartLines: readonly CartLine[],
  products: readonly Product[],      // ← datos ya resueltos, no un repositorio
  couponCode: string | null,
): QuoteResult
```

`products` llega como un arreglo ya resuelto, no como una dependencia inyectada de un repositorio. Esto significa que el motor se puede probar con **datos de prueba en memoria**, sin mocks de red ni de base de datos — así se escribieron las 33 pruebas de [`DiscountEngine.test.ts`](../apps/backend/src/domain/pricing/DiscountEngine.test.ts), incluidas las de property-based testing.

Quién sí conoce los repositorios es la capa de **aplicación** ([`CalculateQuoteUseCase`](../apps/backend/src/application/CalculateQuoteUseCase.ts), [`CheckoutUseCase`](../apps/backend/src/application/CheckoutUseCase.ts)): llaman a `productRepository.findAll()` y le pasan el resultado al motor. El motor nunca decide *de dónde* vienen los productos ni *a dónde* va la orden — esa es la responsabilidad de la capa de aplicación, orquestando puertos.

Los controladores HTTP (`infrastructure/http/routes/`) son la capa más externa: validan con Zod, llaman al caso de uso correspondiente y traducen el resultado (o la excepción) a una respuesta HTTP. No contienen ninguna regla de negocio.

## 4. Patrones de diseño (el enunciado exige ≥2; se implementan 4)

### Strategy — [`DiscountRule.ts`](../apps/backend/src/domain/pricing/DiscountRule.ts)

Cada regla de descuento implementa la misma interfaz (`applies` / `apply`) y decide por sí misma si aplica:

- [`CategoryDiscountRule.ts`](../apps/backend/src/domain/pricing/rules/CategoryDiscountRule.ts) — 10% sobre productos "Tecnología"
- [`VolumeDiscountRule.ts`](../apps/backend/src/domain/pricing/rules/VolumeDiscountRule.ts) — 5% si el subtotal supera $100
- [`CouponDiscountRule.ts`](../apps/backend/src/domain/pricing/rules/CouponDiscountRule.ts) — % del cupón activo

El motor ([`DiscountEngine.ts`](../apps/backend/src/domain/pricing/DiscountEngine.ts)) no conoce ninguna regla concreta: solo pregunta `applies()` y ejecuta `apply()` en el orden que le entregue la Factory. Agregar una cuarta regla (p. ej. "descuento por primera compra") no toca ni una línea del motor.

### Factory — [`DiscountRuleFactory.ts`](../apps/backend/src/domain/pricing/DiscountRuleFactory.ts)

Arma la cadena de reglas **desde configuración** (`ruleOrder: DiscountRuleId[]`), no desde una secuencia de `if`s hardcodeada en el motor:

```ts
DiscountRuleFactory.create({
  ruleOrder: ["category-discount", "volume-discount", "coupon-discount"],
  coupons: await loadCoupons(pool), // tabla `coupons`, no un Map hardcodeado
});
```

### Repository / Ports & Adapters — [`ProductRepository.ts`](../apps/backend/src/domain/ports/ProductRepository.ts), [`OrderRepository.ts`](../apps/backend/src/domain/ports/OrderRepository.ts)

Dos puertos, **un adaptador de producción** ([`PostgresProductRepository.ts`](../apps/backend/src/infrastructure/postgres/PostgresProductRepository.ts) / [`PostgresOrderRepository.ts`](../apps/backend/src/infrastructure/postgres/PostgresOrderRepository.ts)), validado por una [suite de tests de contrato](../apps/backend/src/infrastructure/postgres/contract.test.ts) — el dominio y los casos de uso solo dependen del puerto, nunca de `pg` directamente.

El proyecto tuvo en algún momento adaptadores adicionales (`memory`, `json`) seleccionables por una variable de entorno, pensados para que el evaluador no necesitara Docker. Se eliminaron: mantener tres implementaciones paralelas del mismo repository era más superficie de código que valor real, y la HU3 del enunciado solo pedía persistir en memoria, SQLite o JSON — Postgres ya era una mejora voluntaria sobre eso. Los tests unitarios que necesitan una implementación rápida sin BD usan `test-support/FakeProductRepository.ts` / `FakeOrderRepository.ts` — nunca se instancian en `main.ts`.

### Observer — [`CartContext.tsx`](../apps/frontend/src/state/CartContext.tsx)

El carrito del frontend vive en un único `useReducer` ([`cartReducer.ts`](../apps/frontend/src/state/cartReducer.ts)) expuesto vía Context. Cualquier componente que consuma `useCart()` (`ProductList`, `CartPanel`, `CouponInput`, `DiscountBreakdown`) se re-renderiza automáticamente cuando el estado cambia, sin *prop drilling* entre componentes hermanos.

## 5. El hallazgo del 35% (por qué el tope, tal como está especificado, nunca se activa con el cupón oficial)

Los tres descuentos son **multiplicativos en cascada**, no sumados. Con las reglas oficiales (10% categoría + 5% volumen + 15% cupón `WELCOME2026`), el cliente paga como mínimo:

```
0.90 × 0.95 × 0.85 = 0.72675   →   descuento máximo = 27.325%
```

El 10% solo aplica a la porción "Tecnología" (un carrito 100% Tecnología ya es el caso óptimo; cualquier otro producto lo *baja*), y 5%/15% son constantes. Ni sumando linealmente los tres porcentajes (30%) se alcanza el 35% que exige la HU4.

**Esto está probado, no solo calculado a mano.** El test de property-based [`DiscountEngine.test.ts`](../apps/backend/src/domain/pricing/DiscountEngine.test.ts) genera carritos aleatorios con y sin `WELCOME2026` y verifica, para cada uno:

```ts
expect(result.effectiveDiscountRate).toBeLessThanOrEqual(0.27325 + 1e-9);
expect(result.capApplied).toBe(false);
```

**Decisión tomada:** implementar la especificación al pie de la letra (no se alteró ninguna regla), documentar el hallazgo aquí, y agregar un segundo cupón de catálogo — `BLACKFRIDAY40` (40%) — que sí dispara el tope, para poder demostrar la alerta de la HU4 en vivo durante la sustentación sin tocar una sola línea del motor. Ver el catálogo de cupones en [`catalog.ts`](../apps/backend/src/infrastructure/config/catalog.ts).

Cuando el tope se activa, el motor no solo trunca el total: **reconcilia el desglose por línea** (`DiscountEngine.ts`, función `applyMaxDiscountCap`), devolviendo proporcionalmente el excedente a cada línea para que la suma siga cuadrando centavo a centavo — verificado por test y visible en pantalla como "Ajuste por límite máximo de descuento (35%)".

