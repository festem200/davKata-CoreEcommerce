---
name: doe-stack
description: Metodología propia del candidato (Directive → Orchestration → Execution) para dirigir el desarrollo de este proyecto con IA agéntica. Se usó de punta a punta para construir todo el repositorio.
---

# DOE Stack — Directive → Orchestration → Execution

Skill/metodología propia, usada para construir este repositorio completo desde su commit inicial. No es un prompt de una sola vez: es el marco de trabajo bajo el que operó el agente en cada sesión.

## Las tres capas

1. **Directiva** (`directives/plan_maestro_prueba_tecnica.md`, fuera de este repositorio, en el directorio de trabajo del candidato): el SOP completo de la prueba técnica — arquitectura, decisiones, fases, presupuesto de tiempo, orden de corte si hay que recortar. Escrito en lenguaje natural, como instrucciones a un empleado de nivel medio.
2. **Orquestación**: el agente (Claude Code) lee la directiva, decide en qué fase está el proyecto revisando el estado real en disco (no confía ciegamente en lo que la directiva dice que "ya se hizo"), y ejecuta la fase que corresponde.
3. **Ejecución**: código determinista real — cada PR de este repositorio es una unidad de ejecución verificada externamente (typecheck + tests + cobertura, y en varios casos verificación manual contra un servidor real o un contenedor Docker real) antes de fusionarse.

## Por qué importa para la auditoría de este proyecto

- **Ritual de retoma obligatorio**: cada sesión nueva debe releer el estado real (`git log`, `ls`) antes de asumir en qué fase está — esto evitó, por ejemplo, que una sesión intentara re-crear infraestructura que ya existía, o que asumiera datos de credenciales obsoletos.
- **Registro de aprendizajes acumulativo**: cada hallazgo no trivial (por ejemplo, que Vitest 2.x duplica `vite` internamente y rompe `exactOptionalPropertyTypes`, o que dos tests de Postgres corriendo en paralelo pueden chocar en los catálogos internos de la base) se documenta en el momento en que ocurre, en la sección "Registro de aprendizajes" de la directiva — no se reconstruye de memoria al final.
- **Verificación externa obligatoria como regla de la metodología, no como buena costumbre ocasional**: ningún PR de este repositorio se declaró "listo" sin ejecutar de verdad el comando correspondiente (tests, `docker compose up`, un `curl` contra el servidor real) y leer su salida.

Este archivo es la instancia concreta de la skill aplicada a este proyecto. La versión genérica y reutilizable de la metodología vive en `~/.claude/skills/graphify` y en el `CLAUDE.md` global del candidato, fuera de este repositorio (referenciado, no versionado aquí, porque gobierna todos sus proyectos, no solo este).
