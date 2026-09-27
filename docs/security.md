# Security notes

## Authentication (admin)

- Passwords hashed with bcrypt (cost ≥ 12) or argon2id
- Session via HttpOnly cookies; `Secure` in production; `SameSite` configured for cross-site API needs
- Prefer host-only cookies for admin origin; do not share admin sessions across all `*.heybrewkhi.com` subdomains
- Session rotation / tokenVersion revocation supported on password change
- CSRF protection on cookie-authenticated mutating routes
- Login rate limiting (Redis-backed when available)

## Customer privacy

- Order tracking requires high-entropy `accessToken` (query param or equivalent)
- Order number or phone alone must not reveal an order
- Phone is not proof of identity and does not unlock order history
- Avoid persisting phone in browser unless customer opts in to “remember phone”

## API hardening

- Exact CORS origin allowlist from env
- Helmet security headers + practical CSP for apps
- Zod validation and field allowlists
- Monetary math in integers only
- Idempotency keys on order creation
- Concurrent staff updates use document `version` checks
- Secrets never committed; no production default passwords in code
- Structured logs with redaction of phones, addresses, tokens

## Payments

- COD / pay-at-pickup only until a real provider is configured
- Future online payments: verify webhooks server-side, verify signatures, handle duplicates, never trust browser return URLs alone
