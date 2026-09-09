# Trazabilidad de requisitos

Este documento conecta las historias del enunciado con Issues, cambios de código, pruebas y documentación. El código del repositorio conserva su historial de PRs; los Issues se usan para hacer explícita la relación requisito → evidencia.

> Los cuatro registros de HU se crean como trazabilidad retrospectiva porque la implementación funcional ya existía antes de formalizar el tablero. No se presentan como evidencia de una planificación que no ocurrió.

## Historias de usuario

| Requisito | Issue | Evidencia principal | Estado |
|---|---|---|---|
| HU 1 - Gestión del Carrito | [#28](https://github.com/festem200/davKata-CoreEcommerce/issues/28) | PR #8; pruebas del frontend; `apps/frontend/src/state/` | Done |
| HU 2 - Cupón y desglose | [#29](https://github.com/festem200/davKata-CoreEcommerce/issues/29) | PR #3 y PR #8; motor de descuentos y UI | Done |
| HU 3 - Procesamiento de la Orden | [#30](https://github.com/festem200/davKata-CoreEcommerce/issues/30) | PRs #4-#7; API, puertos, adaptadores y contrato | Done |
| HU 4 - Alerta del límite del 35% | [#32](https://github.com/festem200/davKata-CoreEcommerce/issues/32) | PR #3 y PR #8; `docs/arquitectura.md` | Done |

## Trabajo abierto

| Trabajo | Issue | Estado |
|---|---|---|
| Evolucionar modelo de categorías, productos y órdenes | [#33](https://github.com/festem200/davKata-CoreEcommerce/issues/33) | In progress |
| Documentar la API REST mediante OpenAPI | [#34](https://github.com/festem200/davKata-CoreEcommerce/issues/34) | Backlog |

## Regla de mantenimiento

Cada cambio nuevo debe enlazar un Issue en el PR. El Issue debe describir el resultado observable y el PR debe registrar cómo se verificó. Las decisiones de arquitectura duraderas permanecen en `docs/`; el Project se usa para estado, filtros y seguimiento.
