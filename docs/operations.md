# Operations

## Health

- `GET /health` — process up
- `GET /ready` — MongoDB reachable (fail ready probe if not)

## Graceful shutdown

API listens for `SIGTERM`/`SIGINT`, stops accepting connections, closes Socket.IO, Mongo, Redis.

## Backups (MongoDB Atlas)

1. Enable continuous cloud backup in Atlas.
2. Quarterly restore drill to a staging cluster.
3. Document restore time and verification (order count, latest order number).

## Logging & monitoring

- Structured JSON logs from the API
- Redact phones, addresses, tokens, secrets
- Optional Sentry/OpenTelemetry hooks via env when configured (not enabled by default)

## Incident notes

- Prefer pause ordering (`StoreSettings.orderingPaused` / branch pause) over killing the API during incidents
- Notification failure must not roll back a persisted order

## Business timezone

Reporting day boundaries: `Asia/Karachi`. Storage: UTC.
