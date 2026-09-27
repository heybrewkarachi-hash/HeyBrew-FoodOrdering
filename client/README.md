# HeyBrew Customer App (`@heybrew/client`)

Next.js 15 App Router storefront for HeyBrew ordering (menu, cart, checkout, tracking).

## Stack

- Next.js 15 + TypeScript + Tailwind CSS
- TanStack Query
- React Hook Form + Zod
- socket.io-client (live order status + HTTP polling fallback)
- `@heybrew/shared` for phone/money/order schemas

## Setup

From the monorepo root:

```bash
npm install
npm run build:shared
cp client/.env.example client/.env.local
npm run dev:client
```

Or from this folder:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

### Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | API base (default `http://localhost:4000`) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for sitemap/OG |
| `NEXT_PUBLIC_SOCKET_URL` | Optional Socket.IO URL (defaults to API) |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Key routes

| Route | Purpose |
|-------|---------|
| `/` | Homepage — hero, categories, search, popular brews |
| `/checkout` | Guest checkout (noindex) |
| `/cart` | Cart landing (drawer is primary UX) |
| `/track/[orderId]?token=` | Order confirmation + live tracking (noindex) |
| `/about-us` | About Us stub |
| `/contact` | Contact placeholders — Configure in admin |
| `/policies/*` | Privacy / terms / refund stubs (noindex) |

## Key components

- `components/layout/header.tsx` — logo, nav, location, cart
- `components/ordering/ordering-setup-modal.tsx` — delivery/pickup setup
- `components/home/*` — hero, category pills, promo strip, product cards
- `components/product/product-detail-modal.tsx` — variants, modifiers, notes
- `components/cart/cart-drawer.tsx` — cart, coupon, upsells, totals
- `components/checkout/checkout-form.tsx` — COD / pay-at-pickup only
- `components/track/order-tracker.tsx` — socket + polling
- `lib/api.ts` — API client with **DEVELOPMENT FALLBACK** demo catalog
- `lib/demo-catalog.ts` — seed menu (demo prices from mockups)

## Design tokens

Defined in `src/app/globals.css` and `tailwind.config.ts`:

- `--color-cream` `#FAF6F0`
- `--color-surface` `#F3ECE3`
- `--color-espresso` `#3C1E18`
- Fonts: Nunito (display) + Source Sans 3 (body)
- Checkerboard utility + SVG decorations in `public/decorations/`

## Offline / demo mode

If the API is unreachable, the client serves `lib/demo-catalog.ts` and shows a clear **DEVELOPMENT FALLBACK** banner. Prefer the live API when `NEXT_PUBLIC_API_URL` is healthy.

Demo coupon in fallback mode: `DEMO10` (10% off).

## Brand assets

- Logo: `public/brand/heybrew-logo.jpg`
- Temp images: Unsplash URLs in demo catalog — replace via admin; see `public/images/temp/README.md`
