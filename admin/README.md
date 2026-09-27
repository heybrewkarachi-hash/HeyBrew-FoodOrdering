# HeyBrew Admin

Staff dashboard for HeyBrew ordering (`admin.heybrewkhi.com` in production).

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS (cream / espresso brand theme)
- TanStack Query
- React Hook Form + Zod
- socket.io-client (room `admin:orders`)

## Setup

From the monorepo root:

```bash
npm install
cp admin/.env.example admin/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000

npm run build:shared
npm run dev:server   # :4000
npm run dev:admin    # :3001
```

Or from this package:

```bash
npm run dev -w @heybrew/admin
```

Open http://localhost:3001 and sign in with the seeded owner (`ADMIN_EMAIL` / `ADMIN_PASSWORD` on the server — **DEVELOPMENT SEED**).

## Auth

- Cookie session against the Express API (`credentials: "include"`)
- CSRF: `GET /api/v1/admin/auth/csrf` before mutations; send `X-CSRF-Token`
- Soft UI cookie `heybrew_admin_ui` for Next middleware redirects
- Client `AuthProvider` verifies `GET /api/v1/admin/auth/me`

## Key routes

| Route | Purpose |
|-------|---------|
| `/login` | Email / password |
| `/` | Dashboard (filters Asia/Karachi) |
| `/orders` | Live orders + filters + detail drawer |
| `/orders/[id]/receipt` | Printable customer receipt |
| `/orders/[id]/kitchen` | Printable kitchen ticket |
| `/categories` | Category CRUD + reorder |
| `/products` | Product list |
| `/products/new`, `/products/[id]` | Product CRUD, Cloudinary upload, variants, modifiers, branches |
| `/coupons` | Discount codes |
| `/branches` | Branches + delivery zones |
| `/settings` | Contact, WhatsApp, banners, payment flags, ordering pause |
| `/users` | Admin users (**owner** UI only) |

## API base

All calls go to `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`) under `/api/v1/admin/...`. See repo `docs/api.md`.

## Notes

- Money is displayed as PKR; API uses integer **paisa**.
- Sales cards note: completed (delivered/collected) only; cancelled excluded.
- Card / wallet payment toggles are **not** enabled — no fake providers.
- Seed/demo rows show a **DEVELOPMENT SEED** badge where the API marks them.
