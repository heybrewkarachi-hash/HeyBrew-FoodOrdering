# Build from monorepo root:
#   docker build -f server/Dockerfile -t heybrew-api .
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY server ./server
RUN npm install --workspace=@heybrew/shared --workspace=server || npm install
RUN npm run build -w @heybrew/shared && npm run build -w server

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S heybrew && adduser -S heybrew -G heybrew
COPY --from=build /app/server/package.json ./package.json
COPY --from=build /app/server/node_modules ./node_modules
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/packages/shared ./node_modules/@heybrew/shared
USER heybrew
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1
CMD ["node", "dist/index.js"]
