# CODE_MAP.md — Taysir Codebase Navigation Map

> Multi-tenant school-management ERP (SaaS). Next.js 16 App Router · React 19 · TypeScript (strict) · Prisma 6 / PostgreSQL · next-auth v4 (JWT, Credentials) · next-safe-action pattern · next-intl (fr/ar). Runs in Docker on a ~1 GB Oracle VPS Free Tier (`output: "standalone"`, classic Node runtime — **not** Vercel/serverless). 142 files, ~24.9k LOC.
>
> **Read this before any major refactor.** Paths are absolute. Facts verified against source (`schema.prisma`, `src/lib/prisma.ts`, `src/lib/actions/safe-action.ts`, `src/lib/errors.ts`, `src/middleware.ts`, `src/i18n/routing.ts`, `src/actions/*`). Where the subsystem-audit JSON disagreed with source, **source wins** (noted inline).

---

## 1. System Overview

Taysir is a multi-tenant ERP where every tenant is an `Etablissement` (school). The **core invariant** is tenant isolation: every tenant-owned row carries `etablissementId`, and that filter is injected automatically by a Prisma `$extends` middleware (`getTenantPrisma(tenantId)`) rather than hand-written `where` clauses. Requests flow through a locale-prefixed App Router (`/[locale]/...`), a combined auth+i18n middleware, server pages that read via a cached `services/api.ts` layer, and mutations via Server Actions wrapped in `createSafeAction` (auth → role → tenant → Zod → handler). SuperAdmins operate cross-tenant via a sentinel `tenantId === "GLOBAL_ACCESS"` that restricts the client to the `Etablissement` model only. The marketing landing surface (`src/components/landing/**`, ~5.6k LOC of the codebase) is a fully client-side, DB-free presentation layer. The dominant tech-debt themes a refactor must confront: tenant-isolation leaks via bare `prisma` in a handful of actions/services, ~77 `any` violations (ESLint `no-explicit-any` is disabled), god-files in landing + payments, and a configured-but-never-run SonarQube/CI.

---

## 2. Layered Architecture (request lifecycle)

```
                         HTTP request: /<locale>/<path>
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ src/middleware.ts        matcher: /((?!api|_next|.*\..*).*)               │
│  1. skip _next / api / files-with-dot                                     │
│  2. if path ~ /dashboard|/superadmin:  getToken() (NEXTAUTH_SECRET!)      │
│       └─ no token → redirect /<locale>/login?callbackUrl=<path>           │
│       └─ SUPER_ADMIN on /dashboard → /<locale>/superadmin (and inverse)   │
│  3. createIntlMiddleware(routing)  → locale resolution (fr default)       │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ src/app/[locale]/layout.tsx   dir=rtl|ltr · NextIntlClientProvider ·      │
│                               SessionProviderWrapper · fonts              │
│ → route layout (dashboard/layout.tsx getServerSession gate │ superadmin   │
│   layout.tsx is 'use client', relies on middleware)                       │
└─────────────────────────────────────────────────────────────────────────┘
            │ READ path (RSC page)                 │ WRITE path (form/client)
            ▼                                       ▼
┌──────────────────────────────┐      ┌────────────────────────────────────┐
│ src/services/api.ts          │      │ src/actions/*.actions.ts           │
│  React.cache(getPrisma,      │      │  createSafeAction(schema, handler, │
│   getCurrentUser,            │      │                   {requiredRole})  │
│   getCurrentTenant)          │      │   ① getServerSession (auth)        │
│  getStaff/getSessions/...    │      │   ② requiredRole check             │
└──────────────────────────────┘      │   ③ tenantId = etabId|GLOBAL_ACCESS│
            │                          │   ④ Zod schema.safeParse           │
            │                          │   ⑤ handler(data,{tenantId,...})   │
            │                          │   → ActionResponse<T> union        │
            │                          │   → revalidateTag(etab_<id>_scope) │
            ▼                          └────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│ src/lib/prisma.ts   getTenantPrisma(etablissementId)                      │
│   buildTenantExtension(): $extends.query.$allModels.$allOperations        │
│     • model in ["Etablissement"]  → passthrough (global)                  │
│     • read/update/delete/count/aggregate/groupBy → inject where.etabId    │
│     • create → inject data.etabId   createMany → map each   upsert → all  │
│   "GLOBAL_ACCESS" → restricted client: throws on any non-Etablissement    │
│   per-tenant cache Map (5-min TTL, probabilistic 1/10 eviction)           │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                  PostgreSQL 16  (Docker, POSTGRES_PRISMA_URL)
```

---

## 3. Subsystems

### 3.1 Data model (Prisma)
- **Files:** `prisma/schema.prisma` (326 lines, 13 models + 7 enums), `prisma/seed.ts` (SUPER_ADMIN + default tenant + sample data).
- **Responsibilities:** Canonical schema; tenant partitioning via `@@unique([id, etablissementId])` on all 12 tenant models; 18 `onDelete: Cascade` edges to `Etablissement`; 33 indexes (20 on `etablissementId`, plus `startTime`, `dueDate`, `date`, `recurrenceGroupId`, `studentId`, `senderId`, `recipientId`, `activityId`).
- **Connects to:** Consumed by `src/lib/prisma.ts` (tenant injection) and every action/service. See §5 for the full model/enum listing.
- **Refactor flags:** FK edges to non-tenant models (`PaymentPlan.activity`, `Session.activity/room/group/instructor`) lack cascade → orphan risk. `Message.recipient` allows cross-tenant recipients (no same-tenant check). `User.etablissementId` is nullable (SuperAdmin) but most code assumes non-null. Missing indexes on several `Session` FKs (`roomId/instructorId/groupId`) used by conflict detection. Redundant `@@unique([id, etablissementId])` on `AttendanceRecord` alongside the stronger `@@unique([sessionId, studentId, etablissementId])`.

### 3.2 Tenant + Prisma isolation layer
- **Files:** `src/lib/prisma.ts` (186 lines), `src/lib/utils/prisma-helpers.ts` (`stripUndefined`, returns `any` for `exactOptionalPropertyTypes`).
- **Key abstractions:** `prisma` (bare singleton, global scope), `getTenantPrisma(id)` (extended, tenant-scoped), `buildTenantExtension`, `GLOBAL_ACCESS` sentinel, per-tenant cache (`globalThis.tenantClients`).
- **Connects to:** Called by `safe-action` handlers and `services/api.ts`. The bare `prisma` singleton is correct only for `Etablissement` (global) and session-id-keyed lookups; using it for tenant data is the main leak vector.
- **Refactor flags:** `globalModels = ["Etablissement"]` duplicated (lines 39 & 148) — no single source of truth. `args as Record<string, any>` (line 60). Three `as unknown as PrismaClient` casts (lines 158, 170, 182). Cache eviction is probabilistic & non-thread-safe; TTL check uses `<=` (off-by-one). `$queryRaw`/`$executeRaw` **bypass** the extension entirely (raw SQL must hand-filter `etablissementId` — see `finance.actions.ts` `FOR UPDATE` lock).

### 3.3 Auth & middleware
- **Files:** `src/lib/auth.ts` (NextAuth: Credentials, JWT, `authorize` + `jwt`/`session` callbacks, bcrypt), `src/middleware.ts` (auth gate + role redirect + intl chain), `src/app/api/auth/[...nextauth]/route.ts`, `src/types/next-auth.d.ts` (Session/JWT augmentation: `{id, role, etablissementId}`), `src/app/[locale]/login/page.tsx`.
- **Responsibilities:** Login/JWT enrichment; route protection; SUPER_ADMIN↔dashboard redirects; tenant `isActive` check **at login only**.
- **Connects to:** Token feeds `createSafeAction` (`session.user.{id,role,etablissementId}`) and `getTenantPrisma`.
- **Refactor flags:** `secret: process.env.NEXTAUTH_SECRET ?? ""` in `auth.ts` (silent weak-secret) vs `NEXTAUTH_SECRET!` (hard-fail) in middleware — inconsistent. Login page hardcodes `/dashboard` redirect, ignores `callbackUrl`. Tenant/user `status` not re-checked after login (disabled tenant's JWT stays valid until expiry). Locale is `pathname.split("/")[1]` un-validated against `routing.locales`.

### 3.4 Safe-action framework + errors + validations
- **Files:** `src/lib/actions/safe-action.ts` (111 lines, the 5-stage pipeline), `src/lib/errors.ts` (`TaysirError` + **7** `ErrorCodes`), `src/lib/validations.ts` (~20 Zod schemas, 261 lines).
- **Key abstractions:** `createSafeAction<TInput,TOutput>(schema, handler, {requiredRole})`; `ActionResponse<T>` = `{success:true,data}` | `{success:false,error:{code,message,details?}}`. **ErrorCodes (verified):** keys `ERR_UNAUTHORIZED, ERR_FORBIDDEN, ERR_INVALID_DATA, ERR_TENANT_MISMATCH, ERR_NOT_FOUND, ERR_INTERNAL_SERVER, ERR_DATABASE_FAILURE` → string values `AUTH_REQUIRED, FORBIDDEN_ACCESS, INVALID_DATA_FORMAT, TENANT_DATA_ISOLATION_VIOLATION, RESOURCE_NOT_FOUND, INTERNAL_SERVER_ERROR, DATABASE_OPERATION_FAILED`. (The audit JSON's `ERR_CONFLICT`/`ERR_BUSINESS_RULE_VIOLATION` do **not** exist; `ERR_DATABASE_FAILURE` is defined but never thrown.)
- **Connects to:** Wraps all 11 action files. `ctx.role` is typed `string` (not `RoleUser`) → role checks done by string compare inside handlers (`role !== "GERANT"`), bypassing the framework's `requiredRole` option in `settings`/`users` actions.
- **Refactor flags:** Many actions define schemas inline (`z.object`) instead of importing from `validations.ts` (schema drift). `error.details` typed `unknown`. Validation enums are string literals, not Prisma `nativeEnum()` → drift from schema enums. `upload.actions.ts` bypasses the framework entirely.

### 3.5 Server actions (11 files, ~55 exported actions)
- **Files:** `src/actions/{dashboard,documents,finance,logistics,messages,schedule,settings,students,superadmin,upload,users}.actions.ts`.
- **Responsibilities by file:** `dashboard` (read-only KPIs/aggregations) · `finance` (payment plans, `registerPayment` with `$executeRaw … FOR UPDATE` pessimistic lock) · `logistics` (groups/rooms/activities CRUD + `bulkMarkPresence`) · `schedule` (sessions, recurrence, conflict detection, series update/delete) · `students` (CRUD + docs + group assignment, transactional delete) · `superadmin` (tenant CRUD — `requiredRole: SUPER_ADMIN`, bare `prisma` on `Etablissement`) · `messages` · `settings` · `users` · `documents` · `upload`.
- **Connects to:** Invoked from dashboard/superadmin client components; emit `revalidateTag`.
- **Refactor flags (verified leak points):** `messages.getReceived/getSentAction` filter by `recipientId/senderId` only, **no `etablissementId`** (cross-tenant read risk). `schedule.actions.ts` `as any` casts. `superadmin.actions.ts` `updateData: any` + `updateTenant` missing slug-uniqueness check. `settings.updateSchoolAction` / `users.createUserAction` use bare `prisma.user.findUnique({email})` (global email enumeration). `upload.actions.ts` is the lone action outside `createSafeAction`.

### 3.6 lib utilities, services, queries, PDF, hooks
- **Files:** `src/env.ts` (t3-env), `src/services/api.ts` (231 lines, RSC read layer), `src/lib/queries/attendance.ts` (`computeWeeklyAttendanceRatios`), `src/lib/pdf-generators/{student-profile,payment-receipt}.ts` (jsPDF), `src/lib/hooks/useDashboardView.ts`, `src/utils/format.ts` (+ `format.test.ts`).
- **Connects to:** `services/api.ts` is the read counterpart to actions; pages import from it.
- **Refactor flags:** `getAttendance`/`getPayments` rely on `getPrisma()` scope without explicit tenant validation. `getServerSession` called uncached 6+ times (only `getPrisma`/`getCurrentUser`/`getCurrentTenant` wrapped in `React.cache`); `getStaff/getRooms/getActivities/getGroups` uncached. `getSessions` uses `const where: any`. `getTenants`/`getAttendanceForSessions` exported but unused. PDF receipt hardcodes `'DZD'`; format utils hardcode `'fr'` locale.

### 3.7 Dashboard feature components (the ClientView pattern)
- **Files:** `src/components/dashboard/<feature>/<Feature>ClientView.tsx` for students/payments/groups/staff/attendance/schedule/rooms/activities/settings; plus `DashboardSPA.tsx`, `forms/SessionForm.tsx`, `students/StudentFormModal.tsx`, `lib/hooks/useDashboardView.ts`.
- **Pattern:** One monolithic `'use client'` component per feature managing modals, filters, `useOptimistic`/`useTransition`, CRUD. Data is server→optimistic-local; no global store; heavy prop-drilling (`onEdit/onDelete/onStatusChange/t`).
- **God-files:** `PaymentsClientView.tsx` (779), `GroupsClientView.tsx` (587), `StaffClientView.tsx` (505), `AttendanceClientView.tsx` (~441, inline `any`-typed `StudentRow/StudentCard/StatusButtons` + stubbed `onChange`).
- **Refactor flags:** Identical table/modal/confirm scaffold duplicated across Rooms/Activities/Staff/Groups → candidate for a generic `CRUDClientView<T>`. `useDashboardView` exists but is under-adopted (only Students). Optimistic failures use `alert()` with no rollback.

### 3.8 UI primitives, layouts, navigation, calendar
- **Files:** `src/components/ui/{FormInput,Modal,ConfirmModal,Drawer,MultiSelect,DropdownMenu,SubmitButton,Toggle,DataTable,EmptyState,PaymentCard,Skeleton}.tsx`; `src/components/layouts/DashboardLayout.tsx` (drawer routing via `URLSearchParams`); `src/components/navigation/{Sidebar,LanguageSwitcher}.tsx`; `src/components/providers/SessionProviderWrapper.tsx`; `src/components/calendar/TaysirCalendar.tsx` (react-big-calendar, drag-drop, recurrence); `dashboard/forms/{SessionForm,PaymentPlanForm}.tsx`, `dashboard/schedule/SessionDetails.tsx`.
- **Connects to:** Drawer/Modal host the feature forms; `DashboardLayout` opens drawers by URL param and pre-fetches form data via `getDashboardFormDataAction`.
- **Refactor flags:** Three competing theme tokens for the same color — `taysir-teal` (134), `brand-500` (135), `primary-teal` (54). `Drawer.tsx` (359) is a god-container with a `renderContent()` type switch + loose `any[]` `formData`. `createPortal` z-index uncoordinated (DropdownMenu `z-[9999]`, Modal `z-50`, calendar `z-[200]`). Body-scroll-lock has no ref-counting. Click-outside + Escape handling duplicated across components (extract `useClickOutside`/`useDialogKeyHandling`).

### 3.9 Landing pages (marketing — DB-free, client-only)
- **Files (13, ~5.6k LOC):** `src/components/landing/LandingPage.tsx` (**1751**, embeds Hero/CountUp/KPIBand/PlatformTabs/MicroDemo/ROISimulator/Pricing/Footer inline), `sections/HeroPaymentsDemo.tsx` (**1586**, animation state machine), `TaysirIcons.tsx` (740, 28 SVGs), `sections/{Funnel,PowerShowcase,LiveDemo}.tsx`, `lib/{DemoCta,Reveal,SmoothScroll,contact}.tsx/ts`, `components/{LandingNavbar,LandingIcons,LandingLogo}.tsx`.
- **Tech:** Lenis smooth-scroll + GSAP/ScrollTrigger + Framer Motion; respects `prefers-reduced-motion`. WhatsApp lead-capture handoff (`contact.ts` has a **placeholder phone number TODO — blocks production launch**).
- **Refactor flags:** ~308 inline `style={{}}` blocks; `LandingIcons.tsx` `props: any`; `as any` on `next/link` hrefs; the two god-files are the prime decomposition targets. **No tenant/DB concern here.**

### 3.10 Superadmin
- **Files:** `src/components/superadmin/SuperAdminTenantsView.tsx` (563), `src/actions/superadmin.actions.ts` (183), `src/app/[locale]/superadmin/{layout,page,tenants/page,error}.tsx`.
- **Pattern:** Global tenant CRUD on `Etablissement` via bare `prisma` (correct — global model); access gated by `requiredRole: SUPER_ADMIN` and `tenantId === "GLOBAL_ACCESS"`.
- **Refactor flags:** `updateTenantAction` missing slug-uniqueness check (DB constraint error leaks to client) + `updateData: any`; no `contractEndDate` past-date validation; `window.location.reload()` after create (drops state); unchecked `as string` FormData casts; layout `'use client'` with no server-side role re-check; dead search box + notification bell (no handlers).

### 3.11 App routing + i18n
- **Files:** `src/app/layout.tsx` (passthrough), `src/app/page.tsx` (→ default locale), `src/app/[locale]/{layout,page,error,not-found,login}.tsx`, dashboard feature pages + `loading.tsx`/`error.tsx`, `superadmin/**`, `src/i18n/{routing,request}.ts`, `messages/{fr,ar}.json` (~260 keys each).
- **Verified routes:** `/[locale]/dashboard/{activities,attendance,groups,payments,rooms,schedule,settings,staff,students,students/[id]}`, `/[locale]/{login,superadmin,superadmin/tenants}`, `/api/auth/[...nextauth]`.
- **Refactor flags:** `loading.tsx` only on dashboard-root/students/groups/payments — 6 feature pages lack it; only dashboard-root + superadmin have `error.tsx` (no feature-level boundaries). `i18n/request.ts:9` `locale as any`; root `not-found.tsx` hardcodes fr/ar text.

### 3.12 Tests
- **Files:** `src/__tests__/actions/*.test.ts` (13 files, ~3.1k LOC, ~48/55 actions covered), `src/__tests__/lib/*.test.ts(x)` (7 files), `tests/{auth,repro_bug}.spec.ts` (Playwright, ~137 LOC).
- **Coverage gaps:** untested — `bulkMarkPresence`, `createActivity/Room`, `update/deleteSeries`, `updateSession`. Minimal E2E (no payment-flow, tenant-isolation, or role-escalation specs). Hardcoded seed creds in `auth.spec.ts`. Vitest thresholds 85% stmts/lines, 70% branches.

### 3.13 Build / config / deploy
- **Files:** `next.config.ts` (CSP/HSTS, standalone, image remotePatterns), `tsconfig.json` (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), `package.json`, `Dockerfile` (node:24-alpine multi-stage, `prisma db push` at boot), `docker-compose.yml` (web 700 MB / db 256 MB, PostgreSQL 16), `vitest.config.ts`, `playwright.config.ts`, `eslint.config.mjs` (**`no-explicit-any` OFF**), `biome.json`, `sonar-project.properties` (configured, **never run — no CI workflow**).
- **Refactor flags:** CSP allows `unsafe-inline`+`unsafe-eval`; ngrok dev tunnel + dicebear hardcoded in prod CSP/images; `next lint --dir .` flag broken in Next 16; Prisma v6→v7 upgrade available; 700 MB web limit tight; Playwright `reuseExistingServer` locally.

---

## 4. Core Invariants — where they hold / break

### A. Tenant isolation (`getTenantPrisma` injects `etablissementId`)

> **⚠️ VERIFIED 2026-06-22 (source-traced).** The initial audit over-stated this. After tracing every flagged spot against the live `$extends` extension (`src/lib/prisma.ts:34-111`, which injects `etablissementId` into `where` for all reads/updates/deletes and into `data` for all creates/upserts): **there are NO cross-tenant data leaks reachable by a regular tenant user.** The items below are reclassified.

- **HOLDS:** All action handlers that go through `getTenantPrisma(tenantId)`; the `$extends` middleware for read/write/upsert/createMany; the `GLOBAL_ACCESS` restricted client (throws on non-`Etablissement` models); superadmin's bare `prisma` on `Etablissement` (intentional, global model).
- **FALSE POSITIVES (verified scoped):**
  - `src/actions/messages.actions.ts` — `getReceivedMessagesAction`/`getSentMessagesAction` go through `getTenantPrisma`; the extension injects `etablissementId`. Scoped. (The unit test asserts the app-level `where`; the tenant filter is added by the extension at runtime.)
  - `src/services/api.ts` — `getStaff/getRooms/getActivities/getGroups/getSessions/getPayments/getAttendance` use `getPrisma()` → tenant-scoped for tenant users.
- **BY-DESIGN (not bugs — architectural):**
  - `src/actions/users.actions.ts` & `src/actions/settings.actions.ts` bare `prisma.user.findUnique({where:{email}})`, and `src/lib/auth.ts` `authorize()` — `User.email` is **globally `@unique`** and login resolves by email with **no tenant context**, so these lookups *must* be global. Scoping them would break the unique constraint and login. Residual: low-severity cross-tenant email enumeration; eliminating it requires moving to per-tenant email uniqueness (`@@unique([email, etablissementId])`) + tenant-aware login — a **product decision**, not a quick fix.
  - `src/actions/settings.actions.ts` `updateSchoolAction` — `Etablissement` is the global model; `tenantId` is session-derived (not a forgeable target), so a caller can only update their own school.
- **SUPER_ADMIN privilege (not a tenant breach):** `getPrisma()` returns bare `prisma` for `SUPER_ADMIN`, and `getStudents()` has an unpaginated all-tenants branch. Superadmin seeing everything is their privilege; the real concern is **unbounded `findMany` on a 1 GB VPS** (perf), not isolation.
- **THEORETICAL low-sev (deferred — needs DB-verified raw SQL):** `finance.actions.ts:86` `$executeRaw … FOR UPDATE` locks `Tranche` by `id` only (raw SQL bypasses the extension). No data is disclosed (`SELECT 1`) and the next call (`tx.tranche.findUnique` with `id_etablissementId`) rejects cross-tenant `trancheId` → `ERR_NOT_FOUND`. Only residual: a momentary cross-tenant row-lock before rollback. **Not patched** because all `id` columns are `String @default(uuid())` with **no `@db.Uuid`** (Postgres type = `text`), so adding `AND "etablissementId" = …` needs a DB-verified cast on the payments critical path.
- **FIXED 2026-06-22:** `src/services/api.ts` `getSessions` — `const where: any` → `Prisma.SessionWhereInput` (type-safety, zero behavior change; tsc clean, 25/25 action tests green).

### B. Zero-`any`
- **BROKEN globally** — ESLint `@typescript-eslint/no-explicit-any` is `off` (`eslint.config.mjs`); Biome reports **77 `noExplicitAny`** warnings. TypeScript itself compiles clean (0 errors). Documented exceptions: `prisma.ts:60` (`Record<string, any>`), `prisma-helpers.ts:8` (`stripUndefined` return), three `as unknown as PrismaClient` casts. Unjustified: `schedule.actions.ts` (`updateData/whereClause as any`), `superadmin.actions.ts:151` (`updateData: any`), `services/api.ts:136` (`where: any`), `i18n/request.ts:9` (`locale as any`), `AttendanceClientView`/`Drawer`/`SessionDetails`/`TaysirCalendar` component props, `LandingIcons` `props: any`.

### C. Safe-action pipeline (auth → role → tenant → Zod → handler)
- **HOLDS** for all 11 action files routed through `createSafeAction` (auth/role/tenant/validation enforced centrally; errors mapped to `ActionResponse`).
- **WEAK POINTS:** `ctx.role` is `string`, so role gating in `settings`/`users` actions is done by inline string compare inside handlers rather than `requiredRole`. `src/actions/upload.actions.ts` **bypasses** the wrapper entirely (manual `getServerSession`, no Zod, returns ad-hoc shape). `ERR_DATABASE_FAILURE` is dead (defined, never thrown).

---

## 5. Data Model — 13 models + 7 enums

**Root / global model:** `Etablissement` (tenant). Skips tenant injection; owns all others via cascade. Fields: `id, name, slug(@unique), logoUrl?, primaryColor?(#0F515C), address?, isActive(true), contractEndDate?, createdAt, updatedAt`.

**12 tenant-scoped models** (each has `etablissementId`, `@@unique([id, etablissementId])`, `@@index([etablissementId])`, cascade to `Etablissement`):

| Model | Key fields | Outbound relations (non-cascade unless noted) |
|---|---|---|
| `User` | email(@unique), password, firstName, lastName, role(RoleUser), avatarUrl?, salary?, status(UserStatus=ACTIVE); `etablissementId?` **nullable** | `sentMessages`/`receivedMessages` (Message), `sessions` (InstructorSessions), etab cascade |
| `Room` | name, capacity, description? | `sessions` |
| `Activity` | name, description?, duration?, color?(#0F515C) | `paymentPlans`, `sessions` |
| `Groupe` | name, isActive(true) | `sessions`, `students` (M:N `GroupeToStudent`) |
| `Student` | firstName, lastName, email?, phone?, birthDate?, registrationDate, isActive, isMinor, parentName?, parentPhone?, parentEmail?, photoUrl?, address? | `attendance`, `documents`, `paymentPlans`, `groups`(M:N) |
| `PaymentPlan` | totalAmount, paidAmount(0), currency(DZD), status(StatusPaymentPlan=PENDING), studentId, activityId | `activity` (**no cascade**), `student` (cascade), `tranches`; idx `activityId` |
| `Tranche` | amount, dueDate, isPaid(false), paymentPlanId | `paymentPlan` (cascade), `paiements`; idx `dueDate` |
| `Paiement` | amount, date, method(PaymentMethod=CASH), reference?, note?, receiptUrl?, trancheId | `tranche` (cascade); idx `date` |
| `Session` | startTime, endTime, status(StatusSession=SCHEDULED), activityId, roomId, instructorId, groupId, recurrenceGroupId?, recurrenceRule? | `activity`/`room`/`group`/`instructor` (**no cascade**), `attendance`; idx `startTime`, `recurrenceGroupId` |
| `AttendanceRecord` | status(StatutPresence=PRESENT), retardMinutes?(0), note?, sessionId, studentId | `session`/`student` (cascade); extra `@@unique([sessionId, studentId, etablissementId])` |
| `Document` | name, url, type?, status(StatusDocument=PENDING), studentId | `student` (cascade); idx `studentId` |
| `Message` | content, createdAt, senderId, recipientId? | `sender` (User), `recipient?` (User) — **no same-tenant guard**; idx `senderId`, `recipientId` |

**7 enums:** `RoleUser{SUPER_ADMIN, ADMIN, GERANT, SECRETAIRE, INTERVENANT, PARTICIPANT, RESPONSABLE}` · `UserStatus{ACTIVE, ON_LEAVE, SUSPENDED}` · `StatutPresence{PRESENT, ABSENT, RETARD, JUSTIFIE}` · `StatusSession{SCHEDULED, CANCELLED, COMPLETED}` · `StatusPaymentPlan{PENDING, PARTIAL, PAID}` · `PaymentMethod{CASH, CARD, TRANSFER}` · `StatusDocument{PENDING, APPROVED, REJECTED}`.

> Note: the audit JSON listed `RoleUser` as `{SUPER_ADMIN, GERANT, ADMIN, INTERVENANT, MONITEUR}` in one place — that is wrong; the seven members above are verified from `schema.prisma`.

**Financial chain:** `Student → PaymentPlan → Tranche → Paiement`. **Scheduling chain:** `Session → AttendanceRecord` (per Student). `PaymentPlan` also references `Activity`.

---

## 6. Where Things Live — quick reference

| Need | Path |
|---|---|
| Prisma schema / seed | `/home/ahmed/Taysir/prisma/schema.prisma` · `/home/ahmed/Taysir/prisma/seed.ts` |
| Tenant-scoped DB client | `/home/ahmed/Taysir/src/lib/prisma.ts` → `getTenantPrisma(id)` |
| `stripUndefined` helper | `/home/ahmed/Taysir/src/lib/utils/prisma-helpers.ts` |
| Safe-action wrapper | `/home/ahmed/Taysir/src/lib/actions/safe-action.ts` → `createSafeAction` |
| Error codes / class | `/home/ahmed/Taysir/src/lib/errors.ts` → `TaysirError`, `ErrorCodes` (7) |
| Zod schemas | `/home/ahmed/Taysir/src/lib/validations.ts` |
| Auth config | `/home/ahmed/Taysir/src/lib/auth.ts` · route `/home/ahmed/Taysir/src/app/api/auth/[...nextauth]/route.ts` · types `/home/ahmed/Taysir/src/types/next-auth.d.ts` |
| Middleware (auth+i18n) | `/home/ahmed/Taysir/src/middleware.ts` |
| i18n config / messages | `/home/ahmed/Taysir/src/i18n/{routing,request}.ts` · `/home/ahmed/Taysir/messages/{fr,ar}.json` |
| Server actions (11) | `/home/ahmed/Taysir/src/actions/*.actions.ts` |
| RSC read/query layer | `/home/ahmed/Taysir/src/services/api.ts` |
| Shared queries / PDF | `/home/ahmed/Taysir/src/lib/queries/attendance.ts` · `/home/ahmed/Taysir/src/lib/pdf-generators/*` |
| Formatting utils | `/home/ahmed/Taysir/src/utils/format.ts` |
| Dashboard feature UIs | `/home/ahmed/Taysir/src/components/dashboard/<feature>/<Feature>ClientView.tsx` |
| Generic CRUD hook | `/home/ahmed/Taysir/src/lib/hooks/useDashboardView.ts` |
| UI primitives | `/home/ahmed/Taysir/src/components/ui/*` |
| App shell / nav | `/home/ahmed/Taysir/src/components/layouts/DashboardLayout.tsx` · `/home/ahmed/Taysir/src/components/navigation/*` |
| Calendar | `/home/ahmed/Taysir/src/components/calendar/TaysirCalendar.tsx` |
| Landing (god-files) | `/home/ahmed/Taysir/src/components/landing/LandingPage.tsx` (1751) · `/home/ahmed/Taysir/src/components/landing/sections/HeroPaymentsDemo.tsx` (1586) |
| Superadmin UI/actions | `/home/ahmed/Taysir/src/components/superadmin/SuperAdminTenantsView.tsx` · `/home/ahmed/Taysir/src/actions/superadmin.actions.ts` |
| Routes / layouts | `/home/ahmed/Taysir/src/app/[locale]/**` |
| Unit tests | `/home/ahmed/Taysir/src/__tests__/{actions,lib}/*` |
| E2E tests | `/home/ahmed/Taysir/tests/{auth,repro_bug}.spec.ts` |
| Build / deploy | `/home/ahmed/Taysir/{next.config.ts,tsconfig.json,Dockerfile,docker-compose.yml,eslint.config.mjs,biome.json,sonar-project.properties}` |

---

## 7. Lint / Quality Baseline (refactor starting point)

- **TypeScript:** 0 errors (clean). **Biome:** 2 errors, 112 real warnings — `noExplicitAny` 77, `noArrayIndexKey` 14, `noImplicitAnyLet` 7, `noNonNullAssertion` 6, `noImportantStyles` 4, `noImgElement` 1, `noUnusedImports` 1, `noConstructorReturn` 1; a11y `useButtonType` errors in `app/[locale]/error.tsx`, `dashboard/error.tsx`, `superadmin/error.tsx`.
- **ESLint:** 47 problems (21 errors / 26 warnings); dominant `react/no-unescaped-entities` (~18, landing + superadmin), plus `no-unused-vars`, `no-unused-expressions`.
- **SonarQube:** configured (`taysir`, org `ahmedchoulak2004`, expects `coverage/lcov.info`) but **dead** — no local scanner, no CI workflow, never run.
- **God-files (LOC):** LandingPage 1751 · HeroPaymentsDemo 1586 · PaymentsClientView 779 · TaysirIcons 740 · GroupsClientView 587 · SuperAdminTenantsView 563 · StaffClientView 505.
- **Totals:** 142 files / ~24,911 lines.

---

## 8. Refactor Sequencing (suggested, derived from invariant breaks)

1. **Close tenant leaks first** (security): add `etablissementId` to message getters; route all email-uniqueness/profile/school checks through `getTenantPrisma`; assert session-tenant == target in `updateSchoolAction`; paginate/guard `services/api.ts` SUPER_ADMIN reads. (Effort S–M.)
2. **Harden the pipeline:** type `ctx.role` as `RoleUser`; promote `requiredRole` over inline checks; bring `upload.actions.ts` into `createSafeAction`. (M)
3. **Type safety:** flip ESLint `no-explicit-any` to `error`, then burn down the 77 `any`s (start with `schedule.actions.ts`, `services/api.ts`, `superadmin.actions.ts`, attendance components). (M)
4. **Schema integrity:** add cascade to `Session`/`PaymentPlan`/`AttendanceRecord` FKs; add missing indexes; collapse redundant `AttendanceRecord` unique. (S)
5. **Component debt:** extract `CRUDClientView<T>` + adopt `useDashboardView`; decompose landing god-files; unify the 3 color tokens. (L)
6. **Toolchain:** fix `next lint`, wire SonarQube into a real CI, tighten CSP / drop ngrok before launch, replace the `contact.ts` placeholder number. (S–M)
