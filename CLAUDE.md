# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Taysir — multi-tenant school-management ERP (SaaS). French/Arabic UI. Built to run on a **resource-constrained Oracle VPS Free Tier (~1 GB RAM) via Docker**, NOT Vercel/serverless. Keep code framework-portable: `output: "standalone"`, classic Node.js runtime, no proprietary serverless APIs.

## Commands

```bash
npm run dev            # dev server (next dev)
npm run build          # prisma generate + next build
npm run build:agent    # clean + prisma generate + tsc --noEmit + next build (full gate)
npm run test:agent     # vitest run --reporter=verbose
npm run e2e:agent      # playwright test
npm run lint           # next lint
npm run db:push        # prisma db push (sync schema, no migration files)
npm run qa:full        # build:agent + test:agent + e2e:agent
```

Single test: `npx vitest run path/to/file.test.ts` or `-t "test name"`.
Formatter/linter is **Biome** (`biome.json`) — tab indent, run `npx biome check --write .`.
Prisma seed: `npx prisma db seed` (ts-node).

## Architecture

**Stack**: Next.js 16 App Router · React 19 · TypeScript · Prisma 6 / PostgreSQL · next-auth v4 (JWT, Credentials) · next-safe-action · next-intl · Tailwind v4.

### Multi-tenant isolation (the core invariant)
Every tenant-owned model carries `etablissementId`. Isolation is enforced at the Prisma layer — **do not hand-write `where: { etablissementId }`**, use the tenant client:

- `src/lib/prisma.ts` → `getTenantPrisma(tenantId)` returns a `$extends`-wrapped client that auto-injects `etablissementId` into every read/write/upsert. Clients cached per-tenant (5 min TTL, probabilistic eviction).
- `Etablissement` is the only global model (skips injection). SuperAdmin uses sentinel `tenantId === "GLOBAL_ACCESS"`, which returns a restricted client that throws on any non-`Etablissement` model.

### Server Actions pattern
All mutations are Server Actions wrapped by `createSafeAction` (`src/lib/actions/safe-action.ts`):
- Pipeline: session check → optional `requiredRole` check → tenant resolution → Zod validation → handler.
- Handler signature: `(data, { tenantId, userId, role }) => Promise<T>`. Returns discriminated `ActionResponse<T>` (`{success, data}` | `{success, error}`).
- Inside handlers always go through `getTenantPrisma(tenantId)`. Use `revalidateTag(\`etab_${tenantId}_<scope>\`)` after mutations.
- Throw `TaysirError(message, ErrorCodes.X, status, details?)` (`src/lib/errors.ts`) for typed failures.
- Actions live in `src/actions/*.actions.ts`; Zod schemas in `src/lib/validations.ts`.

### Auth & routing
- `src/middleware.ts`: chains auth gate + next-intl. Protects `/dashboard` and `/superadmin`; redirects SUPER_ADMIN→`/superadmin`, others→`/dashboard`. Locale is the first path segment.
- Roles (`RoleUser` enum): `SUPER_ADMIN, ADMIN, GERANT, SECRETAIRE, INTERVENANT, PARTICIPANT, RESPONSABLE`. `session.user.{id,role,etablissementId}` populated via JWT callbacks in `src/lib/auth.ts`.
- Routes: `src/app/[locale]/...` (dashboard feature dirs: students, staff, groups, payments, schedule, attendance, activities, rooms, settings; plus `superadmin/`). Locales `fr` (default) / `ar`; messages in `messages/{fr,ar}.json`.

### Layout
- `src/actions` server actions · `src/lib` (auth, prisma, errors, validations, queries, pdf-generators) · `src/services/api.ts` · `src/components` · `src/i18n` · `src/utils`.

## Conventions

- **Tenant filter is mandatory** on every tenant model query — rely on `getTenantPrisma`, never the bare `prisma` singleton for tenant data.
- **Zero `any`** in TypeScript (existing Prisma-extension casts are the documented exception).
- Wrap repeated reads in `React.cache` to spare the 1 GB-RAM DB.
- Security headers + CSP are defined in `next.config.ts` — update there when adding external image/connect sources.
