# KasiDash & BuildForge

A full-stack Shopify merchant admin dashboard plus a customer-facing e-commerce store (KBT Store) with persistent cart, checkout, and Ozow payment integration.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (use `zod` in api-server, `zod/v4` in lib/db)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React 19, Vite, Tailwind CSS v4, ShadCN UI, wouter, React Query

## Where things live

- `lib/db/src/schema/index.ts` — single source of truth for all DB tables
- `lib/api-spec/openapi.yaml` — OpenAPI contract (generates hooks + Zod schemas)
- `artifacts/api-server/src/routes/` — all API route handlers (16 files)
- `artifacts/api-server/src/middleware/auth.ts` — JWT auth middleware
- `artifacts/kasidash/src/lib/store-api.ts` — store/cart/checkout fetch client
- `artifacts/kasidash/src/contexts/` — AuthContext, CartContext
- `artifacts/kasidash/src/pages/store/` — customer store pages
- `artifacts/kasidash/src/pages/auth/` — login + register pages
- `artifacts/kasidash/src/components/store-layout.tsx` — store top nav header

## Architecture decisions

- JWT in HttpOnly cookie + JSON body (cookie for browser, header for scripts)
- DB-persisted cart per userId (not localStorage) — survives sessions
- Ozow payment: if env vars absent → test mode (auto-confirm); real mode → redirect to Ozow
- Store pages use separate StoreLayout (top nav), admin pages use Layout (sidebar)
- New routes use `zod` directly (not via api-spec codegen); added as direct dep to api-server

## Product

**Admin dashboard** (`/dashboard`, `/orders`, `/products`, `/customers`, `/inventory`, `/analytics`, `/insights`, `/notifications`, `/buildforge`, `/settings`): Full Shopify merchant analytics, order management, inventory, BuildForge system builder.

**KBT Store** (`/store`, `/store/products/:id`, `/store/cart`, `/store/checkout`, `/store/orders`, `/account`): Customer-facing storefront with product listings, category filters, product detail, persistent cart, checkout with Ozow EFT or COD, order history.

**Auth** (`/auth/login`, `/auth/register`): JWT-based auth; admin seeded at `ndlovuhenry73@gmail.com` / `KasiAdmin2024!`.

## User preferences

- Admin email: ndlovuhenry73@gmail.com, password: KasiAdmin2024!
- Store branding: "KasiDash & BuildForge Tech Store" / "KBT Store"
- South African locale: ZAR (R), phone +27, Gauteng etc.
- Production-grade only — no placeholder features

## Gotchas

- Use `req.params.id as string` in Express 5 routes (types it as `string | string[]`)
- Never use `zod/v4` sub-path in api-server — use `import { z } from "zod"` directly
- Run `pnpm run typecheck:libs` after any `lib/db` schema change
- Cart requires auth — 401s in browser console on unauthenticated load are expected
- Admin is seeded on first startup; if users table is empty the seed runs again

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
