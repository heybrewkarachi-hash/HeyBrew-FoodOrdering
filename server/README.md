# HeyBrew API Server

Node.js + Express + TypeScript backend for the HeyBrew ordering platform.

## Stack

- MongoDB (Mongoose)
- Redis (optional via `REDIS_URL`) with **IN_MEMORY_FALLBACK** for rate limits, idempotency, CSRF storage, ordering sessions, and Socket.IO adapter
- Socket.IO (websocket + polling transports)
- Zod validation (`@heybrew/shared`)
- bcrypt (cost 12), HttpOnly admin cookies, CSRF synchronizer token
- Cloudinary **signed upload params** only when `CLOUDINARY_*` env vars are set

## Setup

From monorepo root:

```bash
cp server/.env.example server/.env
# Edit ADMIN_EMAIL / ADMIN_PASSWORD / secrets / MONGODB_URI

npm install
npm run build -w @heybrew/shared
npm run seed -w server
npm run dev -w server
```

Or from `server/`:

```bash
npm run seed
npm run dev
```

API defaults to `http://localhost:4000`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | tsx watch |
| `npm run build` | compile to `dist/` |
| `npm run start` | run compiled server |
| `npm run seed` | DEVELOPMENT_SEED data (requires `ADMIN_EMAIL` + `ADMIN_PASSWORD`) |
| `npm run test` | vitest |

## Health

- `GET /health` — liveness
- `GET /ready` — Mongo required; Redis reported as `connected` / `disabled` / `unavailable` (soft-optional)

## Public API (prefix `/api/v1`)

- Catalog, branches, zones, public settings
- `POST /cart/validate`, `POST /coupons/validate`
- `POST /orders` — requires `Idempotency-Key` header
- `GET /orders/track/:orderNumber?token=` — **token required**; never by phone alone
- `POST /ordering-session`

## Admin API

- Auth: `POST /api/v1/admin/auth/login`, `/logout`, `GET /me`, `GET /csrf`
- Cookie: HttpOnly signed session (`ADMIN_COOKIE_NAME`)
- Mutating routes require `X-CSRF-Token` matching CSRF cookie + server store
- CRUD: orders (optimistic `version`), products, categories, coupons, branches, zones, settings, users, audit logs
- `POST /api/v1/admin/uploads/cloudinary-sign`

## Socket.IO

- Admin: emit `admin:join` → room `admin:orders` (new order alerts)
- Customer: emit `order:join` with `{ orderId, accessToken }` → room `order:{id}`
- **Polling fallback:** use REST track / admin list when websockets fail. Socket.IO also falls back to HTTP long-polling automatically.
- Redis adapter enabled only when `REDIS_URL` connects successfully

## Money

All amounts are **integer paisa** (PKR × 100). Example seed: Cappuccino `50000` = Rs 500.

## Docker

Build from monorepo root (Dockerfile expects workspace layout):

```bash
docker build -f server/Dockerfile -t heybrew-api .
```

Provide `MONGODB_URI` and secrets at runtime. Do not assume Redis/Cloudinary are connected unless env is set.

## Security notes

- CORS exact allowlist from `CORS_ORIGINS` (+ client/admin URLs)
- Login rate limited
- Phones/addresses redacted in logs
- Order tracking requires high-entropy access token
