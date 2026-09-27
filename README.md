# HeyBrew Ordering Platform

Production-oriented MERN + Next.js monorepo for HeyBrew (Karachi coffee ordering).

| Surface | Path | Default local URL | Production host |
|---------|------|-------------------|-----------------|
| Customer | `client/` | http://localhost:3000 | https://heybrewkhi.com |
| Admin | `admin/` | http://localhost:3001 | https://admin.heybrewkhi.com |
| API | `server/` | http://localhost:4000 | https://api.heybrewkhi.com |
| Shared | `packages/shared/` | — | — |

## Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Redis (optional locally; recommended for multi-instance production)
- Cloudinary account (for image uploads in admin)

## Quick start (local)

```bash
# 1. Install
npm install

# 2. Configure env files (copy examples)
cp server/.env.example server/.env
cp client/.env.example client/.env.local
cp admin/.env.example admin/.env.local

# 3. Set MONGODB_URI, COOKIE_SECRET, CSRF_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD in server/.env

# 4. Build shared + seed demo catalog (DEVELOPMENT SEED — replace with real menu)
npm run build:shared
npm run seed

# 5. Run API + apps (separate terminals recommended)
npm run dev:server
npm run dev:client
npm run dev:admin
```

## Documentation

- [Architecture](docs/architecture.md)
- [Local setup](docs/setup.md)
- [API reference](docs/api.md)
- [Deployment](docs/deployment.md)
- [Security](docs/security.md)
- [Testing](docs/testing.md)
- [External setup checklist](docs/external-setup.md)

## Important product rules

- All money is stored as **integer minor units** (paisa; Rs 1.00 = 100).
- Pricing and order rules live on the **server only**.
- Guest order tracking requires a **high-entropy access token** (order number alone is insufficient).
- Phone number is **not** identity; it does not unlock prior orders.
- Seed menu prices from UI mockups are **illustrative development data** until replaced with the real HeyBrew menu.
- Online card/wallet checkout is **not** enabled until a verified payment provider is configured.

## License

UNLICENSED — proprietary for HeyBrew.
