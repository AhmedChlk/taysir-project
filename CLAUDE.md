# CLAUDE.md

Guidance for Claude Code working in this repo. These instructions override default behavior.

## Working agreement
- **Plan before coding.** For any non-trivial change, state the plan first; ask 2–3 targeted questions when an axis is genuinely open. Then build.
- **Exception** (no plan needed): bugfix, typo, mechanical refactor.
- **Document the existing** — when writing docs, describe what IS, never invent. Unknown → write `UNKNOWN` and ask.
- Verify in the running app (`fr` AND `ar`), not just types/tests.

## Project
Taysir — multi-tenant school-management ERP (SaaS) for Algerian private schools. French (default) / Arabic (RTL) UI. Built to run on a resource-constrained **Oracle VPS Free Tier (~1 GB RAM) via Docker**, NOT Vercel/serverless. Keep framework-portable: `output: "standalone"`, classic Node.js runtime, no proprietary serverless APIs.

## Commands
```bash
npm run dev            # next dev
npm run build          # prisma generate + next build
npm run build:agent    # clean:agent + prisma generate + tsc --noEmit + next build (full gate)
npm run test:agent     # vitest run --reporter=verbose
npm run e2e:agent      # playwright test --reporter=list
npm run lint           # eslint .   (NOT `next lint` — removed in Next 16)
npm run db:push        # prisma db push (sync schema, no migration files)
npm run db:seed:massive # ts-node seed-massive.ts — the real dataset (50 schools)
npm run security:scenarios # ts-node — tenant-isolation attack scenarios
npm run qa:full        # build:agent + test:agent + e2e:agent
```
Single test: `npx vitest run path/to/file.test.ts` or `-t "test name"`.
**Formatter/linter = Biome** (`biome.json`, tab indent): `npx biome check --write .`. ESLint (`eslint-config-next`) runs separately via `npm run lint`.
Prisma seed (`prisma db seed`): `prisma/seed.ts` (single gérant). Bulk data: `db:seed:massive`.

## Architecture
**Stack**: Next.js 16 App Router · React 19 · TypeScript · Prisma 6 / PostgreSQL · next-auth v4 (JWT, Credentials) · next-intl · Tailwind v4 (CSS-first, `@theme` in `globals.css`, no `tailwind.config`). `next-safe-action` is installed but the server-action pattern is a **custom** `createSafeAction` wrapper (below); the library is used only for the `useAction` client hook (attendance).

### Multi-tenant isolation (the core invariant)
Every tenant-owned model carries `etablissementId`. Isolation is enforced at the Prisma layer — **never hand-write `where: { etablissementId }`**, use the tenant client:
- `src/lib/prisma.ts` → `getTenantPrisma(tenantId)` returns a `$extends`-wrapped client that auto-injects `etablissementId` into every read/write/upsert. Clients cached per-tenant (5 min TTL, probabilistic eviction).
- `Etablissement` is the only global model (skips injection). SuperAdmin uses sentinel `tenantId === "GLOBAL_ACCESS"` → restricted client that throws on any non-`Etablissement` model.

### Server Actions pattern
All mutations are Server Actions wrapped by `createSafeAction` (`src/lib/actions/safe-action.ts`):
- Pipeline: session check → optional `requiredRole` check → tenant resolution → Zod validation → handler.
- Handler signature: `(data, { tenantId, userId, role }) => Promise<T>`. Returns discriminated `ActionResponse<T>` (`{success:true,data}` | `{success:false,error}`).
- Inside handlers always go through `getTenantPrisma(tenantId)`.
- After mutations call `revalidateTag(tag, "max")`. **Two tag conventions live in the tree**: `etab_${tenantId}_<scope>` (preferred) and legacy `<scope>-${tenantId}` (e.g. `finance-`, `rooms-`); superadmin uses literal tags (`superadmin_tenants`). Prefer the `etab_` form for new code.
- Throw `TaysirError(message, ErrorCodes.X, status = 400, details?)` (`src/lib/errors.ts`) for typed failures.
- Actions live in `src/actions/*.actions.ts`; Zod schemas in `src/lib/validations.ts`.

### Money
Money is **`Decimal`** in Prisma (`@db.Decimal`), never `Float`. Convert at the boundary with `money()` / `moneyOrNull()` (`src/lib/money.ts`) → plain numbers for compute; format with `formatCurrency` (`src/utils/format.ts`). Never do arithmetic on raw Prisma `Decimal`.

### Auth & routing
- `src/middleware.ts`: chains auth gate + next-intl. Protects `/dashboard` and `/superadmin`; redirects SUPER_ADMIN→`/superadmin`, others→`/dashboard`. Locale = first path segment. (Next 16 deprecates the `middleware` convention → `proxy`; still `middleware.ts` today.)
- Roles (`RoleUser` enum): `SUPER_ADMIN, ADMIN, GERANT, SECRETAIRE, INTERVENANT, PARTICIPANT, RESPONSABLE`. `session.user.{id,role,etablissementId}` via JWT callbacks in `src/lib/auth.ts`. Role groups (`MANAGEMENT/FRONTDESK/ATTENDANCE`) in `safe-action.ts`.
- Routes: `src/app/[locale]/…`. Dashboard feature dirs: `students, staff, groups, payments, schedule, attendance, activities, rooms, settings` (+ `superadmin/`). Locales `fr` (default) / `ar`; messages in `messages/{fr,ar}.json`.

### Layout
`src/actions` (server actions) · `src/lib` (auth, prisma, errors, validations, money, queries/, pdf-generators/, hooks/) · `src/services/api.ts` (tenant-scoped reads, `React.cache`) · `src/components` · `src/i18n` · `src/utils`.

## Conventions
- **Tenant filter is mandatory** on every tenant model query — rely on `getTenantPrisma`, never the bare `prisma` singleton for tenant data.
- **`any`**: target zero. ~44 legacy `any` remain (debt); the Prisma-extension casts are the documented exception. Introduce no new `any`.
- Wrap repeated reads in `React.cache` (see `services/api.ts`) to spare the 1 GB-RAM DB.
- **Design tokens**: no raw hex / default Tailwind palettes (`gray/slate/blue`) in components — use `@theme` tokens. Semantic status (`--success/--warning/--danger`) are CSS vars **not yet in `@theme`** (known gap — `emerald/rose/amber` used as a stopgap).
- **RTL**: logical properties only (`ms-/me-/ps-/pe-/start-/end-`, `text-start/end`); never a hardcoded direction inside a `transform`; mirror directional icons with `rtl:rotate-180`.
- Security headers + CSP live in `next.config.ts` — update there when adding external image/connect sources.
- **@DESIGN.md** — full design system (color, type, motion, component shapes, forbidden list). Read it before touching UI.

## Definition of done
- `npm run qa:full` green (build:agent + test:agent + e2e:agent).
- UI verified in the running app in **both `fr` and `ar`**.
- Full state matrix handled: loading (skeleton), empty, error (with recovery), and RTL.
- **Zero raw values introduced** (no new hardcoded hex / arbitrary Tailwind / physical RTL props).
- **Zero query outside `getTenantPrisma`** for tenant data.
