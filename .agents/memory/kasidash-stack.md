---
name: KasiDash stack and structure
description: Core tech decisions, gotchas, and conventions for the KasiDash & BuildForge project
---

## Stack
- Frontend: React Vite at `artifacts/kasidash` — preview path `/`, port 24381
- Backend: Express 5 at `artifacts/api-server` — paths `/api`, port 8080
- DB: Drizzle ORM + PostgreSQL, schema in `lib/db/src/schema/`
- API contract: OpenAPI spec in `lib/api-spec/openapi.yaml`, codegen via Orval
- Generated Zod schemas: `lib/api-zod`, React Query hooks: `lib/api-client-react`

## Key conventions
- Run `pnpm run typecheck:libs` after any schema/lib change before typechecking artifacts
- Never use `return res.status(404).json(...)` in async handlers — TypeScript TS7030. Use `{ res.status(404).json(...); return; }` instead
- Never import Node.js built-ins (`path`, `fs`, etc.) in frontend code
- DB push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`

**Why:** These were discovered as build-time failures; documenting to avoid repeating.
