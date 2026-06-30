---
name: E-commerce module architecture
description: Key decisions for the KasiDash store module — auth, cart, payments, frontend routing
---

## Auth
- JWT stored in HttpOnly cookie (`auth_token`) AND returned in JSON body (`token`) for Authorization header use
- Secret: `SESSION_SECRET` env var; middleware in `artifacts/api-server/src/middleware/auth.ts`
- Admin seeded on server startup in `auth.ts` route: `ndlovuhenry73@gmail.com`, role=admin
- `requireAuth` middleware attaches `req.user = { userId, email, role }`

**Why:** HttpOnly cookie works for browser, Bearer token fallback works for curl/test scripts.

## Cart
- DB-persisted per `userId` in `cart_items` table — NOT localStorage
- Cart API: `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:id`, `DELETE /api/cart/items/:id`, `DELETE /api/cart`
- All cart endpoints require auth

**Why:** Persistent cart survives browser sessions and works across devices.

## Checkout / Orders
- `POST /api/checkout` atomically: deducts inventory, creates order + order_items + payment record, clears cart
- Order numbers are unique: `KBT-{random}-{counter}` format
- Payment methods: `ozow` | `cod`

## Ozow Integration
- Env vars: `OZOW_SITE_CODE`, `OZOW_PRIVATE_KEY`, `OZOW_API_KEY`, `OZOW_IS_TEST`
- If env vars not set → test-mode response (`mode: "test"` in JSON), frontend auto-confirms
- Real flow: `POST /api/payments/ozow/initiate` → Ozow redirect URL → Ozow posts back to notify URL
- Test confirm: `POST /api/payments/test-confirm/:paymentId`

## Frontend Routing (wouter)
- Store pages (`/store/*`, `/auth/*`, `/account`) have their own `StoreLayout` (top nav, no sidebar)
- Admin dashboard pages (`/dashboard/*` etc.) wrapped in `Layout` (sidebar)
- `AuthProvider` and `CartProvider` wrap the entire router
- Store API client in `artifacts/kasidash/src/lib/store-api.ts` — uses `fetch` with `credentials: "include"`

## New DB tables added
- `users` — customers and admins
- `cart_items` — per-user cart rows
- `order_items` — line items per order
- `payments` — one payment record per order

## Zod in api-server
- New routes (auth, cart, checkout, payments, store) use `import { z } from "zod"` directly
- `zod` added as direct dependency in `artifacts/api-server/package.json`
- Do NOT use `zod/v4` sub-path in api-server — just `zod`

## req.params type assertion
- Express 5 types `req.params` values as `string | string[]`; use `req.params.id as string` for parseInt
