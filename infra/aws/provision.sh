#!/usr/bin/env bash
# Aprovisiona la infraestructura AWS descrita en docs/arquitectura.md y
# infra/aws/README.md — ECS Express Mode + ECR + el rol OIDC de GitHub
# Actions. NO se ejecutó en esta entrega (sin cuenta/credenciales de AWS
# disponibles al momento de construirla): queda documentado y listo para
# correr en cuanto se disponga de una cuenta.
#
# Uso: ACCOUNT_ID=<...> AWS_REGION=<...> ./provision.sh
set -euo pipefail

: "${ACCOUNT_ID:?Exporta ACCOUNT_ID (aws sts get-caller-identity --query Account --output text)}"
: "${AWS_REGION:?Exporta AWS_REGION (ej. us-east-1)}"

REPO="festem200/davKata-CoreEcommerce"
ECR_REPO_NAME="core-ecommerce"

echo "==> 1. Roles de ejecución de ECS Express Mode"
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://ecs-task-execution-trust-policy.json
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam create-role \
  --role-name ecsInfrastructureRoleForExpressServices \
  --assume-role-policy-document file://ecs-infrastructure-trust-policy.json
aws iam attach-role-policy \
  --role-name ecsInfrastructureRoleForExpressServices \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSInfrastructureRoleforExpressGatewayServices

echo "==> 2. Proveedor OIDC de GitHub + rol para las Actions"
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  || echo "(el proveedor OIDC ya existe — se omite)"

sed "s/<ACCOUNT_ID>/${ACCOUNT_ID}/g" trust-policy-github-oidc.json > /tmp/trust-policy-github-oidc.rendered.json
aws iam create-role \
  --role-name github-actions-ecs-role \
  --assume-role-policy-document file:///tmp/trust-policy-github-oidc.rendered.json
aws iam attach-role-policy \
  --role-name github-actions-ecs-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
# Permiso adicional específico de ECS Express Mode para el despliegue en
# deploy-prod.yml (aws-actions/amazon-ecs-deploy-express-service).
aws iam attach-role-policy \
  --role-name github-actions-ecs-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

echo "==> 3. Repositorio ECR"
aws ecr create-repository --repository-name "${ECR_REPO_NAME}" --region "${AWS_REGION}" \
  || echo "(el repositorio ECR ya existe — se omite)"

echo "==> 4. Configurar en GitHub: variables de repositorio (no secretos — OIDC no usa credenciales de larga duración)"
echo "    gh variable set AWS_DEPLOY_ROLE_ARN --body arn:aws:iam::${ACCOUNT_ID}:role/github-actions-ecs-role"
echo "    gh variable set AWS_REGION --body ${AWS_REGION}"
echo "    (una vez configuradas, ci.yml y deploy-prod.yml dejan de saltarse los jobs de AWS automáticamente)"

echo "==> 5. Crear el servicio ECS Express Mode (ejecutar DESPUÉS de que exista al menos una imagen int-<sha> en ECR)"
cat <<EOF
aws ecs create-express-gateway-service \\
  --primary-container '{"image":"${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:prod-<sha>","containerPort":8080}' \\
  --execution-role-arn arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole \\
  --infrastructure-role-arn arn:aws:iam::${ACCOUNT_ID}:role/ecsInfrastructureRoleForExpressServices \\
  --service-name core-ecommerce-prod \\
  --cpu 0.25 --memory 0.5 \\
  --health-check-path "/health" \\
  --scaling-target '{"minTaskCount":1,"maxTaskCount":2}' \\
  --monitor-resources
EOF

echo "==> 6. RDS Postgres db.t4g.micro (opcional — el driver json también corre en el contenedor sin RDS)"
cat <<EOF
aws rds create-db-instance \\
  --db-instance-identifier core-ecommerce-prod \\
  --db-instance-class db.t4g.micro \\
  --engine postgres \\
  --master-username postgres \\
  --master-user-password '<GENERAR_UN_SECRETO_Y_GUARDARLO_EN_SECRETS_MANAGER>' \\
  --allocated-storage 20 \\
  --no-publicly-accessible
EOF

echo "Listo. Nada de lo anterior se ejecutó automáticamente salvo que se haya corrido este script a mano."
