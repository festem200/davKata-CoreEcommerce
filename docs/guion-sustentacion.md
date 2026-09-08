# Guion de sustentación — Core E-Commerce Checkout

> El enunciado (§6) plantea 20 minutos; este guion se preparó para 30 con margen de recorte, siguiendo el orden exacto de clics de la demo. Los tres bloques y su minutaje son los del enunciado.

## Antes de empezar (checklist de 2 minutos)

- [ ] `docker compose up --build` corriendo (o `npm run dev` si se prefiere la ruta sin Docker) — abrir `http://localhost:8080` (o `:5173`) en el navegador, catálogo visible.
- [ ] Terminal a la vista para proyectar `npm run test:coverage` en vivo.
- [ ] Pestaña abierta en `docs/arquitectura.md`, `docs/ia.md` y `docs/auditoria-seguridad.md` en GitHub (repo público).
- [ ] Pestaña abierta en la lista de PRs del repositorio (14 fusionados, historial incremental).

---

## Bloque 1 — Demostración en vivo (7 min)

Orden exacto de clics:

1. **Agregar `p1` (Audífonos Bluetooth, $45.00)** — el desglose muestra 10% de descuento de categoría ($4.50), único descuento activo. *"Todavía no cruza el umbral de $100, así que solo aplica la regla de categoría."*
2. **Agregar `p2` (Teclado mecánico, $89.90)** — el subtotal tras categoría supera $100 → se activa también el 5% de volumen. *"Aquí se ve la cascada: cada regla actúa sobre el resultado de la anterior, no sobre el subtotal original."*
3. **Intentar agregar 3 unidades de `p4` (Power bank, stock 2)** — el botón "+" se deshabilita al llegar al límite de stock. *"La guarda de stock es reactiva en el frontend, pero la autoridad real está en el backend — lo demuestro en el bloque 2."*
4. **Aplicar el cupón `WELCOME2026`** — desglose completo: categoría + volumen + cupón. Señalar el "Descuento efectivo: 27.32%" en pantalla. *"Este es el hallazgo central de la entrega: con las reglas oficiales, el descuento máximo matemáticamente posible es 27.325% — nunca 35%, sin importar qué se compre."* (Detalle completo en el bloque 2, no aquí — aquí solo se señala el número en pantalla.)
5. **Quitar el cupón, agregar `p3` (Monitor 27", $249.99) solo, y aplicar `BLACKFRIDAY40`** — la alerta persistente aparece: *"¡Enhorabuena! Has alcanzado el límite máximo de ahorro permitido (35%)"*. Señalar la línea "Ajuste por límite máximo de descuento" en el desglose. *"Este cupón no estaba en el enunciado — lo agregué al catálogo precisamente para poder demostrar esta alerta en vivo sin alterar una sola línea del motor de descuentos."*
6. **Confirmar el checkout** (botón, o `curl` con `Idempotency-Key` si el flujo de UI de pago no es el foco) — mostrar el `201` con la orden persistida.
7. **Consultar la orden por `GET /api/v1/orders/:id`** con `X-Api-Key` (Postman/curl) — mostrar que sin la key responde `401`, y que el stock decrementó en `GET /api/v1/products`.

---

## Bloque 2 — Defensa de arquitectura (7 min)

1. **El hallazgo del 35% (2 min).** Abrir `docs/arquitectura.md` §5. Explicar la aritmética (`0.90 × 0.95 × 0.85 = 0.72675`) y mostrar el test de property-based en `DiscountEngine.test.ts` que lo prueba para carritos aleatorios, no solo a mano. *"La mayoría de candidatos va a escribir un `if (descuento > 0.35)` que jamás se ejecuta con las reglas oficiales. Yo lo probé, lo documenté, y diseñé el catálogo de cupones para poder demostrarlo igual."*
2. **Los 4 patrones (2 min).** Abrir en vivo: `DiscountRule.ts` (Strategy), `DiscountRuleFactory.ts` (Factory), `ProductRepository.ts` + los 3 adaptadores (Repository/Ports & Adapters), `CartContext.tsx` (Observer). Enfatizar que el motor no conoce ninguna regla concreta.
3. **Aislamiento del dominio (1 min).** Mostrar que `domain/pricing/DiscountEngine.ts` no importa nada de Express ni de `pg`. *"El motor recibe los productos ya resueltos — no sabe si vinieron de memoria, un archivo JSON o Postgres."*
4. **Los 3 adaptadores + concurrencia (1.5 min).** Mostrar `contract.test.ts` corriendo contra los tres. Mostrar el test dedicado de 10 checkouts simultáneos sobre el último ítem de stock en Postgres — *"esto no se puede demostrar con un archivo JSON; es el argumento real de un core bancario."*
5. **Cobertura en consola (0.5 min).** Proyectar `npm run test:coverage` — mostrar el resumen ≥80% en ambos workspaces.

---

## Bloque 3 — Auditoría de IA y preguntas técnicas (6 min)

1. **El modelo de gobernanza (2 min).** Abrir `docs/ia.md`. Explicar honestamente el flujo: directiva previa (diseño) → ejecución agéntica con Claude Code → gates de aprobación del candidato sobre acciones irreversibles (crear el repo, cada merge) → verificación externa obligatoria antes de declarar cualquier fase terminada.
2. **Los 5 agentes (1.5 min).** Abrir `.claude/agents/auditor-calidad.md` — leer en voz alta 2-3 de sus reglas de rechazo automático. *"Este agente no escribe código: solo puede rechazar el de los otros cuatro. Es lo que convierte la gobernanza en un proceso con autoridad real."*
3. **Las 6 correcciones reales (2 min).** Elegir 2 para contar en detalle (recomendado: #1 — el bug de `dispatch` durante el render, muy visual y fácil de explicar en 30 segundos; y #6 — el hallazgo de seguridad de la comparación no-constante). Enfatizar: *"ninguna se encontró releyendo código — todas vinieron de un build, un test o una auditoría que fallaron de verdad."*
4. **La auditoría de seguridad (0.5 min).** Abrir `docs/auditoria-seguridad.md` — mostrar los 2 hallazgos corregidos y la sección "Verificado y sin hallazgos".

---

## Preguntas probables y respuestas preparadas

**"¿Por qué el tope del 35% nunca se activa? ¿No es eso un error del enunciado?"**
> Es una contradicción matemática real del enunciado (las reglas dan máximo 27.325%), no un error mío. Decidí implementar la especificación al pie de la letra, documentar el hallazgo formalmente y agregar un segundo cupón de catálogo para poder demostrar la HU4 en vivo sin tocar el motor. No se lo consulté al evaluador de antemano porque preguntar antes de la sustentación hubiera arriesgado un cambio de reglas con el tiempo encima — prefiero presentarlo ya resuelto y defenderlo.

**"¿Por qué no usaste un ORM?"**
> Con Ports & Adapters el SQL debe vivir dentro del adaptador — es justamente el punto del patrón. Un ORM diluiría la demostración de que el SQL está encapsulado, no disperso.

**"¿Cómo se garantiza que el stock no queda negativo bajo concurrencia?"**
> `UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1` dentro de una transacción — Postgres serializa los `UPDATE` sobre la misma fila con un lock de fila. Lo probé con un test real de 10 checkouts simultáneos sobre el último ítem disponible, no un mock.

**"¿Por qué no hay autenticación de usuarios?"**
> No hay identidad de usuario en el alcance del enunciado. Documenté en `arquitectura.md` cómo se resolvería en producción (OAuth 2.0 + FAPI, el perfil de Open Banking) y por qué agregarlo aquí sería complejidad sin beneficio demostrable.

**"¿Qué tan involucrado estuviste realmente en el código?"**
> Honestamente, en esta sesión de ejecución escribí la directiva completa de antemano (arquitectura, las 12 decisiones técnicas, el catálogo diseñado producto por producto, el flujo de ramas, la estrategia de seguridad) y gobernué la ejecución agéntica con gates de aprobación explícitos sobre las acciones irreversibles — no escribí cada línea a mano. Eso está documentado sin adornos en `docs/ia.md`, incluidas las 6 correcciones reales que se dieron durante el proceso.

**"¿Por qué Postgres y no incluir el ORM Prisma que está de moda?"**
> Ver la pregunta del ORM arriba — la misma razón aplica.

**"¿Qué pasaría si tuvieras que agregar un quinto descuento?"**
> Implementar `DiscountRule`, registrarlo en `DiscountRuleFactory` con su posición en `ruleOrder`. El `DiscountEngine` no cambia — es la demostración práctica de Open/Closed.
