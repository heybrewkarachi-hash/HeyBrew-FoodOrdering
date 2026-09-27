# Local setup

## 1. Install dependencies

From the repo root:

```bash
npm install
```

## 2. Environment files

Copy examples and fill secrets:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
cp admin/.env.example admin/.env.local
```

### Server (`server/.env`) — required for seed & API

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `COOKIE_SECRET` | Long random string for signed cookies |
| `CSRF_SECRET` | Long random string for CSRF tokens |
| `CLIENT_URL` | e.g. `http://localhost:3000` |
| `ADMIN_URL` | e.g. `http://localhost:3001` |
| `CORS_ORIGINS` | Comma-separated exact origins |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used only by seed script to create owner |
| `REDIS_URL` | Optional locally |
| `CLOUDINARY_*` | Required for admin image uploads |

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 3. Build shared package

```bash
npm run build:shared
```

## 4. Seed development data

```bash
npm run seed
```

Seed data is clearly marked as **DEVELOPMENT SEED**. Replace products, prices, branches, zones, WhatsApp number, and contact details with real HeyBrew business data before production.

There is **no default production admin password** committed in the repo. The seed script requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the environment.

## 5. Run services

Recommended: three terminals.

```bash
npm run dev:server   # :4000
npm run dev:client   # :3000
npm run dev:admin    # :3001
```

## 6. Smoke check

1. Open http://localhost:3000 — complete ordering setup modal.
2. Add a product to cart and place a COD/pickup order.
3. Open http://localhost:3001 — log in with seeded owner credentials.
4. Confirm the order appears and update status; verify customer tracking updates.

## MongoDB without Atlas

Local Docker:

```bash
docker run -d --name heybrew-mongo -p 27017:27017 mongo:7
```

Use `MONGODB_URI=mongodb://127.0.0.1:27017/heybrew`.

## Redis (optional local)

```bash
docker run -d --name heybrew-redis -p 6379:6379 redis:7-alpine
```

Set `REDIS_URL=redis://127.0.0.1:6379`.
