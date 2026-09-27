# API reference (v1)

Base URL: `API_URL` (local default `http://localhost:4000`)

Errors:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

## Public

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | Liveness |
| GET | `/ready` | Readiness (DB) |
| GET | `/api/v1/settings/public` | WhatsApp, contact, banners, flags |
| GET | `/api/v1/branches` | Active branches |
| GET | `/api/v1/delivery-zones` | Active zones |
| GET | `/api/v1/catalog/menu` | Categories + products |
| GET | `/api/v1/catalog/products/:slug` | Product detail |
| POST | `/api/v1/cart/validate` | Reprice/availability |
| POST | `/api/v1/coupons/validate` | Coupon preview |
| POST | `/api/v1/orders` | Requires `Idempotency-Key` header |
| GET | `/api/v1/orders/track/:orderNumber` | Requires `token` query |

### Place order (summary)

Body includes order type, branch/zone, customer fields, line items (productId, variantId?, modifiers, qty, instructions), optional coupon, payment method, optional notes.

Server recomputes all totals; client-sent totals are ignored.

## Admin auth

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/v1/admin/auth/login` | Sets HttpOnly cookie |
| POST | `/api/v1/admin/auth/logout` | |
| GET | `/api/v1/admin/auth/me` | |
| GET | `/api/v1/admin/auth/csrf` | CSRF token for mutations |

Send `X-CSRF-Token` on mutating admin requests when using cookie auth. `credentials: include`.

## Admin resources

| Area | Base path | Permissions |
|------|-----------|-------------|
| Dashboard | `/api/v1/admin/dashboard` | owner, manager, staff (scoped) |
| Orders | `/api/v1/admin/orders` | status updates need version |
| Products | `/api/v1/admin/products` | catalog roles |
| Categories | `/api/v1/admin/categories` | catalog roles |
| Coupons | `/api/v1/admin/coupons` | manager+ |
| Branches / zones | `/api/v1/admin/branches`, `/delivery-zones` | manager+ |
| Settings | `/api/v1/admin/settings` | owner/manager |
| Users | `/api/v1/admin/users` | owner |
| Uploads | `/api/v1/admin/uploads/sign` | catalog roles |
| Audit | `/api/v1/admin/audit-logs` | owner/manager |

Exact schemas live in `@heybrew/shared` and server route validators. Prefer OpenAPI generation later; this doc tracks the contract used by the apps.

## Socket.IO

- Namespace `/` (default)
- Client → server: `admin:join` (cookie session → room `admin:orders`); `order:join` `{ orderId, accessToken }` → room `order:{id}`
- Server → client: `order:new` (admin room on create); `order:updated` (admin + order rooms on status change)
- Auth: admin cookie session for `admin:orders`; customer access token for `order:{id}`
