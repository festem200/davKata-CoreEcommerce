# syntax=docker/dockerfile:1

# ---- Stage 1: build del frontend (Vite) ----
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci
COPY packages/contracts packages/contracts
COPY apps/frontend apps/frontend
RUN npm run build -w @core-ecommerce/frontend

# ---- Stage 2: build del backend (tsup, bundlea @core-ecommerce/contracts) ----
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm ci
COPY packages/contracts packages/contracts
COPY apps/backend apps/backend
RUN npm run build -w @core-ecommerce/backend

# ---- Stage 3: runtime (una sola imagen sirve API + estáticos del front) ----
FROM node:20-alpine AS runtime
WORKDIR /app

# @core-ecommerce/contracts ya quedó bundleado dentro de dist/main.js
# (tsup --noExternal): el runtime no necesita el paquete del workspace.
COPY apps/backend/package.json ./package.json
RUN node -e "\
  const pkg = require('./package.json'); \
  delete pkg.dependencies['@core-ecommerce/contracts']; \
  delete pkg.devDependencies; \
  require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));" \
  && npm install --omit=dev --no-audit --no-fund

COPY --from=backend-build /app/apps/backend/dist ./dist
COPY --from=frontend-build /app/apps/frontend/dist ./public

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
