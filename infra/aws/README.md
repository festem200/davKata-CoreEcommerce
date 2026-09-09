# Despliegue en AWS — ECS Express Mode (documentado, no ejecutado)

> **Estado de esta entrega:** el IaC de esta carpeta está escrito y listo para ejecutarse, pero **no se corrió** — no había una cuenta de AWS con credenciales disponibles al momento de construir esta entrega. El §7 del enunciado no exige un despliegue real; esto queda como evidencia de diseño de infraestructura, revisable línea por línea. `deploy-prod.yml` y el job `build-and-push` de `ci.yml` ya están escritos contra este mismo diseño y se activan solos en cuanto exista la variable de repositorio `AWS_DEPLOY_ROLE_ARN` (ver paso 4 de `provision.sh`) — no requieren ningún cambio de código el día que se ejecuten.

## Por qué contenedor y no Lambda

**Una Lambda Function URL es lock-in de AWS; una imagen de contenedor no.** El mismo artefacto de este repositorio corre sin cambios en ECS Fargate, EKS, Cloud Run o Azure Container Apps. El área de Open Banking de destino está migrando a multinube — se elige la opción portable, no la más rápida de conectar.

## Por qué ECS Express Mode

GA desde noviembre de 2025, **reemplazo oficial de AWS App Runner** (que dejó de aceptar clientes nuevos en abril de 2026). Con solo tres insumos — imagen de contenedor + rol de ejecución de tarea + rol de infraestructura — AWS provisiona Fargate, una URL con HTTPS/SSL, autoescalado, monitoreo, red, y despliegues canary con rollback automático ante alarmas 5XX. Comparte el ALB entre servicios, que es justo el costo que hacía inviable ECS clásico para un proyecto de este tamaño. Sin cargo adicional por Express Mode: se paga solo el Fargate subyacente.

## Qué hace cada archivo de esta carpeta

| Archivo | Para qué |
|---|---|
| `provision.sh` | Todos los comandos de aprovisionamiento, en orden, parametrizados por `ACCOUNT_ID`/`AWS_REGION`. No se auto-ejecuta al clonar el repo. |
| `trust-policy-github-oidc.json` | Trust policy del rol que asumen los workflows de GitHub Actions — **restringida por rama** (`sub` limita a `refs/heads/main` y `refs/heads/integration`, así un PR de un fork no puede desplegar aunque ejecute el workflow). El `sub` usa comodines (`festem200*/davKata-CoreEcommerce*`) en vez del formato exacto `owner/repo`: GitHub califica el claim con los IDs numéricos inmutables de cuenta/repositorio (`repo:festem200@<id>/davKata-CoreEcommerce@<id>:ref:...`) cuando la cuenta tuvo un cambio de nombre en su historia — se confirmó vía CloudTrail (`errorCode: AccessDenied` en `AssumeRoleWithWebIdentity`) al ejecutar el pipeline real. |
| `ecs-task-execution-trust-policy.json` | Trust policy de `ecsTaskExecutionRole` (el rol que ECS usa para arrancar la tarea: pull de ECR, logs). |
| `ecs-infrastructure-trust-policy.json` | Trust policy de `ecsInfrastructureRoleForExpressServices` (el rol que Express Mode usa para crear el ALB, el servicio, el autoescalado). |

## Pasos para ejecutar cuando haya una cuenta de AWS lista

1. `export ACCOUNT_ID=... AWS_REGION=...` (Free Plan, **sin unirla a ninguna AWS Organization** — los créditos expiran de inmediato si se une a una).
2. `cd infra/aws && ./provision.sh` — crea los roles, el proveedor OIDC, y el repositorio ECR.
3. Configurar las variables de repositorio en GitHub (comando exacto impreso por el script, paso 4) — a partir de ahí, `ci.yml` empieza a construir y publicar `int-<sha>` en cada push a `integration` automáticamente, sin tocar el workflow.
4. Promover `integration → laboratory → main` por PR (el flujo normal del repositorio) — el push a `main` dispara `deploy-prod.yml`, que retaggea la imagen ya construida (nunca la reconstruye) y crea el servicio Express Mode la primera vez, o lo actualiza las siguientes.
5. `aws rds create-db-instance` (comando impreso por el script, paso 6) — **obligatorio**: el backend ya no tiene un driver de persistencia alternativo, así que `deploy-prod.yml` necesita el secreto `DATABASE_URL` de GitHub apuntando a esta instancia antes de desplegar (si no existe, el contenedor arranca y se cae de inmediato — `env.ts` rechaza el arranque sin `DATABASE_URL`).

## Costos y advertencia sobre el Free Plan

| Recurso | Costo aproximado |
|---|---|
| Fargate (0.25 vCPU / 0.5 GB, 1-2 tareas) | ~US$9-18/mes |
| RDS `db.t4g.micro` (obligatorio) | ~US$13/mes |
| **Total** | **~US$22/mes** |

Cubierto por los ~US$200 en créditos del Free Plan (post-julio 2025): US$100 al registrarse + US$100 por completar las 5 tareas de onboarding. Alcanza para ~9 meses.

⚠️ **El Free Plan no es un entorno permanente.** Al agotarse los créditos o cumplirse el plazo (6 meses), AWS cierra la cuenta y borra los datos a los 90 días. Esto es un entorno de demostración para la sustentación, no de producción real — se documenta así explícitamente para no sobre-prometer.

## Fallback si el despliegue real no llega a hacerse

Desplegar la misma imagen en **Lambda como container image con el AWS Lambda Web Adapter** (US$0, *always free*) es la alternativa de menor fricción si Express Mode no resulta viable a tiempo — la imagen Docker es idéntica en ambos casos, así que esta decisión no afecta ninguna fase anterior de la entrega.
