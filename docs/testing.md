# Testing

## Automated (backend)

```bash
npm run test:server
```

### Measured results (local, 2026-09-26)

| Suite | Result |
|-------|--------|
| `phone.test.ts` | 5 passed |
| `pricing.test.ts` | 4 passed |
| `orderTransitions.test.ts` | 5 passed |
| `coupon.test.ts` | 4 passed |
| `orderTrack.test.ts` | 4 passed (MongoMemoryServer) |

**22/22 server Vitest tests passed.**
## Build verification (local, 2026-09-26)

| Package | Command | Result |
|---------|---------|--------|
| `@heybrew/shared` | `npm run build -w @heybrew/shared` | Passed |
| `@heybrew/server` | `npm run build -w @heybrew/server` | Passed (`tsc`) |
| `@heybrew/client` | `npm run build -w @heybrew/client` | Passed (Next.js 15) |
| `@heybrew/admin` | `npm run build -w @heybrew/admin` | Passed (Next.js 15) |

Server unit tests: **18 passed** (phone, pricing, transitions, coupon). Integration track tests need MongoMemoryServer binary cached.

1. Seed DB and start server + client + admin.
2. Customer: set Delivery + zone + phone → browse → add Cappuccino → checkout COD.
3. Note order number + tracking URL with token.
4. Admin: see new order (sound optional) → Confirm → Preparing → On the Way → Delivered.
5. Customer tracking page updates via socket or polling.
6. Repeat for Pickup flow ending in Ready for Pickup → Collected.
7. Attempt track with wrong token → expect 404/403.
8. Double-submit place order with same Idempotency-Key → single order.

## Visual comparison

Capture screenshots at 390×844 (mobile), 768×1024 (tablet), 1440×900 (desktop) for:

- Homepage
- Ordering modal
- Product detail
- Cart
- Checkout
- Admin orders

Compare against supplied HeyBrew mockups; fix overflow/spacing.

## Load test (must be measured — do not invent results)

Suggested staging profile (document actual numbers after running):

```bash
# Example only — install k6 or autocannon in staging
npx autocannon -c 20 -d 30 https://api.STAGING/health
npx autocannon -c 10 -d 30 https://api.STAGING/api/v1/catalog/menu
```

Record in this section after a real run:

| Date | Env | Tool | Scenario | Result | Bottleneck |
|------|-----|------|----------|--------|------------|
| _TBD_ | _TBD_ | _TBD_ | _TBD_ | _Not yet run_ | _TBD_ |

## Browser tests

Playwright (optional follow-up) should cover ordering modal → add to cart → checkout happy path and admin login → status update. Not claimed complete until scripts exist and pass in CI.
