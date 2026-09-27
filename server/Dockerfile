# Build from monorepo root:
#   docker build -f server/Dockerfile -t heybrew-api .
FROM node:20-alpine AS build
WORKDIR /app

# bcrypt native build on Alpine
RUN apk add --no-cache python3 make g++

# Workspace manifests (client/admin stubs so npm workspaces resolve)
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
COPY admin/package.json ./admin/

# Skip prepare scripts — shared source is not copied yet
RUN npm install --workspace=@heybrew/shared --workspace=@heybrew/server --ignore-scripts

COPY packages/shared ./packages/shared
COPY server ./server

RUN npm run build -w @heybrew/shared \
  && npm run build -w @heybrew/server \
  && npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S heybrew && adduser -S heybrew -G heybrew \
  && apk add --no-cache wget

# Hoisted workspace install lives at repo root
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/dist ./server/dist

USER heybrew
WORKDIR /app/server
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1
CMD ["node", "dist/index.js"]
