# Architecture

## Overview

```
┌─────────────┐     ┌─────────────┐
│  client/    │     │   admin/    │
│  Next.js    │     │  Next.js    │
└──────┬──────┘     └──────┬──────┘
       │ HTTPS             │ HTTPS + cookies
       └────────┬──────────┘
                ▼
         ┌─────────────┐
         │  server/    │  Express + Socket.IO
         │  Node API   │
         └──────┬──────┘
    ┌───────────┼───────────┐
    ▼           ▼           ▼
 MongoDB     Redis*     Cloudinary
  Atlas     (optional     (images)
            locally)
```

\*Redis is used for distributed rate limits, Socket.IO adapter, idempotency keys, and job queues when `REDIS_URL` is set. Local single-process mode falls back to in-memory stores (not for multi-instance production).

## Packages

| Package | Responsibility |
|---------|----------------|
| `@heybrew/shared` | Zod schemas, shared types, phone/money helpers |
| `@heybrew/server` | Auth, catalog, cart validation, orders, payments interface, sockets, seed |
| `@heybrew/client` | Customer menu, cart, checkout, tracking |
| `@heybrew/admin` | Dashboard, orders, catalog, coupons, settings |

## Money

All monetary values are **integers in paisa** (1 PKR = 100 paisa). Formatting to `Rs. X` happens at the presentation layer.

## Order status machines

**Delivery:** `pending` → `confirmed` → `preparing` → `on_the_way` → `delivered`  
**Pickup:** `pending` → `confirmed` → `preparing` → `ready_for_pickup` → `collected`  

Cancellation is allowed only from explicitly configured early states. Transitions are enforced server-side with `statusHistory` and optimistic concurrency via `version`.

## Order snapshots

Orders store immutable snapshots of product names, selections, unit prices, fees, discounts, and customer delivery details so later catalog edits never rewrite history.

## Real-time

- Staff: authenticated Socket.IO room `admin:orders`
- Customer: private room `order:{orderId}` gated by access token
- Clients must fall back to HTTP polling on disconnect

## Timezones

- Persist timestamps in **UTC**
- Business day filters use **Asia/Karachi**

## Stateless API

Session/auth for admins uses signed HttpOnly cookies. Rate-limit counters and Socket.IO pub/sub should use Redis when running multiple API replicas.
