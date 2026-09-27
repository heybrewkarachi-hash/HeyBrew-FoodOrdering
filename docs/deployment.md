# Deployment

Target hosts:

- Customer: `https://heybrewkhi.com` → Vercel (`client/`)
- Admin: `https://admin.heybrewkhi.com` → Vercel (`admin/`)
- API: `https://api.heybrewkhi.com` → Railway (or equivalent) (`server/`)
- MongoDB Atlas, Cloudinary, Redis (Railway Redis or Upstash)

**Do not deploy or attach paid services without credentials and authorization.**

## Backend (Railway-style)

1. Create a service from this repo, root directory `server` (or Docker).
2. Attach managed Redis.
3. Set env vars from `server/.env.example` with production values.
4. Set `TRUST_PROXY=1`.
5. Health checks: `GET /health` (liveness), `GET /ready` (Mongo connectivity).
6. Use the provided `server/Dockerfile`.
7. Run one worker process if/when background jobs are separated; otherwise the API process hosts Socket.IO.
8. For multiple API replicas: enable Redis Socket.IO adapter and sticky sessions / compatible load balancing for WebSockets.

### Dockerfile

Build **from monorepo root** (Dockerfile copies `packages/shared` + `server`):

```bash
docker build -f server/Dockerfile -t heybrew-api .
docker run --env-file server/.env -p 4000:4000 heybrew-api
```

Railway: use repo root as build context, Dockerfile path `server/Dockerfile` (see root `railway.toml`). Health check: `GET /health`.

## Frontend (Vercel)

### Customer

- Root directory: `client`
- Framework: Next.js
- Install/build: use `client/vercel.json` (builds `@heybrew/shared` first — required; `dist/` is not in git)
- Env: `NEXT_PUBLIC_API_URL=https://api.heybrewkhi.com`
- Domain: `heybrewkhi.com` (+ `www` redirect)

### Admin

- Root directory: `admin`
- Install/build: use `admin/vercel.json` (builds `@heybrew/shared` first)
- Env: `NEXT_PUBLIC_API_URL=https://api.heybrewkhi.com`
- Domain: `admin.heybrewkhi.com`
- Ensure API `ADMIN_URL` and cookie settings match this exact origin (host-only admin cookies; do not share admin session cookies across `*.heybrewkhi.com`).

## DNS / TLS

Point DNS A/CNAME records to Vercel and Railway as instructed by each platform. Enable HTTPS everywhere. API CORS allowlist must list exact customer and admin origins.

## MongoDB Atlas

1. Create cluster and database user.
2. Network access: allow Railway egress IPs (or cautiously `0.0.0.0/0` only if required and accepted).
3. Connection string → `MONGODB_URI`.
4. Enable automated backups in Atlas; document restore drills (see `docs/operations.md`).

## Cloudinary

1. Create folder prefix e.g. `heybrew/`.
2. Put cloud name, API key, and **API secret only on the server**.
3. Admin requests signed upload params from the API; browser uploads directly to Cloudinary.

## Post-deploy checklist

- [ ] Seed or create owner admin securely (change any temporary credentials immediately)
- [ ] Replace DEVELOPMENT SEED catalog with real menu
- [ ] Configure branches, zones, hours, WhatsApp, contact
- [ ] Verify CORS and cookies on real domains
- [ ] Confirm `/ready` and order placement E2E
- [ ] Confirm Socket.IO over wss
- [ ] Disable search indexing on admin (`robots.txt` / headers)

## Scaling notes (realistic)

Horizontal API scaling requires Redis for rate limits + Socket.IO. Bottlenecks are typically MongoDB indexes on order queues and image payload sizes. Run a load test in a staging environment and record results in `docs/testing.md` — do not claim unverified capacity.
