# Gestión del trabajo en GitHub

El repositorio usa Issues para requisitos y tareas, milestones para agrupar una entrega y GitHub Projects para visualizar el flujo. El Project es un recurso de GitHub vinculado al repositorio, no un archivo versionado dentro del código.

Project actual: [Core E-Commerce | Delivery](https://github.com/users/festem200/projects/1).

## Convenciones

- `type:user-story`: requisito funcional expresado desde el usuario.
- `type:technical-task`: trabajo de ingeniería, documentación o infraestructura.
- `area:domain`, `area:backend`, `area:frontend`, `area:data`, `area:devops`, `area:documentation`: área afectada.
- `priority:must`, `priority:should`, `priority:could`: prioridad relativa.

El estado se administra en el campo `Status` del Project: `Todo`, `In Progress` y `Done` (opciones predeterminadas de GitHub). El milestone `v1.0 | Prueba técnica` representa la entrega; no sustituye al estado diario del tablero.

## Flujo de trabajo

1. Abrir o localizar un Issue antes de implementar.
2. Crear una rama `feat/*`, `fix/*` o `docs/*`.
3. Enlazar el Issue desde el PR y describir la verificación ejecutada.
4. Mover el item del Project según su estado.
5. Cerrar el Issue solo cuando la evidencia esté disponible.

Las HU funcionales iniciales están marcadas explícitamente como trazabilidad retrospectiva en `docs/trazabilidad-requisitos.md`.
