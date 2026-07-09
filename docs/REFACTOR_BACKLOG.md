# REFACTOR_BACKLOG.md

> Working document for the incremental refactor + factorization of **Taysir**.
> Driven by the lint/Sonar baseline (2026-06-22) and the subsystem audit.
> Philosophy: **petit à petit** — every phase is independently shippable and leaves `build:agent` green.
> Baseline: TypeScript **0 errors**, Biome **2 errors / 112 real warnings**, ESLint **47 problems (21 err / 26 warn)**, **142 files / 24 911 lines**.

> **⚠️ Security re-verification (2026-06-22).** The subsystem audit's "critical tenant-isolation leaks" were **source-traced and largely downgraded** — the `$extends` extension (`src/lib/prisma.ts`) does scope every tenant-user read/write. **No cross-tenant data leak is reachable by a regular tenant user.** Any backlog item tagged *security/isolation* below should be read against the corrected analysis in **`CODE_MAP.md` §4.A** (false-positive vs by-design vs superadmin-privilege vs theoretical). The genuine residuals are a **product decision** (per-tenant email uniqueness) and a **DB-verified raw-SQL hardening** (finance `FOR UPDATE` lock) — neither is a quick mechanical fix. One safe fix already landed: `getSessions` `where: any` → `Prisma.SessionWhereInput`.

---

## 1. Executive summary — health verdict

- **TypeScript is clean (0 errors)** under a strict config (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). The type *gate* works; the type *discipline* does not — see next bullet.
- **77 `noExplicitAny`** dominate the Biome warnings (112 real warnings total). ESLint's `@typescript-eslint/no-explicit-any` is set to **`"off"`** in `eslint.config.mjs:10`, so the strict tsconfig is silently undermined. This is the single biggest quality debt.
- **ESLint: 21 errors**, dominated by **~18 `react/no-unescaped-entities`** in landing + superadmin, plus `no-unused-vars` / `no-unused-expressions`. The `lint` script itself is **broken**: `next lint --dir .` — the `--dir` flag was removed in Next.js 16, so `npm run lint` fails at runtime.
- **SonarQube is dead config**: `sonar-project.properties` is fully wired (key `taysir`, org `ahmedchoulak2004`, expects `coverage/lcov.info`) and `npm run sonar:agent` exists, but there is **no `.github/workflows/`, no `sonar-scanner` binary, and it has never run**. Coverage is generated locally only.
- **God-files**: `LandingPage.tsx` (1751), `HeroPaymentsDemo.tsx` (1586), `PaymentsClientView.tsx` (779), `TaysirIcons.tsx` (740) — 4 files hold ~19% of the codebase. The 6+ `*ClientView` components duplicate the same CRUD scaffold and are prime factorization targets.

**Verdict:** structurally sound (tenant isolation, safe-action pipeline, strict TS), but carrying heavy *type-safety* and *duplication* debt plus an unenforced quality gate. All fixable incrementally without architectural rewrites.

---

## 2. SonarQube activation (turn dead config into a live gate)

Today: `sonar-project.properties` exists, `npm run sonar:agent → sonar-scanner`, but no scanner installed and no CI. `vitest.config.ts:31` already emits `reporter: ["text", "lcov", "html"]` so `coverage/lcov.info` **is** produced — Sonar just never reads it. Two paths; do **B** (CI) for a real gate.

### A. Run it locally once (smoke test)

```bash
# 1. Generate coverage (lcov.info → coverage/lcov.info, already configured)
npx vitest run --coverage

# 2. Install the scanner (no global install needed)
npx --yes sonar-scanner -Dsonar.token=$SONAR_TOKEN

# Or pin the npm wrapper:
npm i -D sonarqube-scanner
# package.json already has: "sonar:agent": "sonar-scanner"
SONAR_TOKEN=xxxxx npm run sonar:agent
```

`sonar-project.properties` already declares `sonar.javascript.lcov.reportPaths=coverage/lcov.info` and `sonar.sources=src` — no edits needed for the smoke test. Add `sonar.host.url=https://sonarcloud.io` if using SonarCloud (org `ahmedchoulak2004` implies SonarCloud).

### B. Wire CI (the real fix) — `.github/workflows/quality.yml`

```yaml
name: Quality
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  sonar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }          # Sonar needs full history for blame
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npx prisma generate
      - run: npx vitest run --coverage     # writes coverage/lcov.info
      - uses: SonarSource/sonarqube-scan-action@v4
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}   # https://sonarcloud.io for SonarCloud
```

**Setup checklist:**
1. Add repo secret `SONAR_TOKEN` (User > Security > Generate Token in SonarCloud/SonarQube).
2. Add secret `SONAR_HOST_URL` (`https://sonarcloud.io`) — or hardcode for SonarCloud.
3. Add `sonar.host.url` to `sonar-project.properties` **or** pass via `SONAR_HOST_URL` env (action reads it).
4. Set a **Quality Gate** in Sonar: fail PR on new `any`, new bugs, coverage drop. This is what makes the gate real.
5. (Optional) Fold `snyk code test` / `snyk test` (already in `package.json` as `security:sast` / `security:sca`) into the same workflow as separate jobs.

> Once CI runs, the 77 `any`s and 18 unescaped entities become **visible, trending, and gate-able** — which is what unlocks Phase 1 below.

---

## 3. Quick wins (do first — < 1 day total, all auto-fixable or mechanical)

Run these in order; commit after each group so the diff stays reviewable.

| # | Fix | Command / action | Files |
|---|-----|------------------|-------|
| QW-1 | **Fix the broken lint script** | Change `"lint": "next lint --dir ."` → `"lint": "next lint"` (the `--dir` flag was removed in Next 16) | `package.json:13` |
| QW-2 | **Biome autofix pass** | `npx biome check --write .` — clears the 2 Biome errors + `noUnusedImports` (1), `noImportantStyles` (4), safe formatting | repo-wide |
| QW-3 | **`useButtonType` a11y error** | Add `type="button"` to the `<button onClick={reset}>` (line 24 in each) | `src/app/[locale]/error.tsx`, `src/app/[locale]/dashboard/error.tsx`, `src/app/[locale]/superadmin/error.tsx` |
| QW-4 | **`react/no-unescaped-entities` (~18 errors)** | Replace raw `'`/`"`/`&nbsp;` in JSX text with `&apos;`/`&rsquo;`/`{' '}`. Start with `LandingPage.tsx:50` (`sans&nbsp;le&nbsp;chaos`) and `superadmin/tenants/page.tsx:18`. ESLint `--fix` does **not** auto-fix these — do manually or add a codemod | `src/components/landing/**`, `src/components/superadmin/**`, `src/app/[locale]/superadmin/tenants/page.tsx` |
| QW-5 | **`noConstructorReturn` (1)** | Remove the `return` statement from the class constructor (likely `TaysirError` or a cache class). Find via `npx biome check . \| grep -A2 noConstructorReturn` | (locate via Biome) |
| QW-6 | **`noUnusedImports` (1) + ESLint `no-unused-vars`** | `npx biome check --write .` handles the import; for `no-unused-vars` remove dead vars or prefix `_` | (locate via lint) |
| QW-7 | **`no-unused-expressions` (ESLint)** | Locate via `npm run lint`, convert stray expressions to statements or delete | (locate via lint) |
| QW-8 | **`noImgElement` (1)** | Swap the single raw `<img>` for `next/image` (or add a documented Biome-ignore if it's intentional, e.g. PDF/SVG export) | (locate via Biome) |

> After QW-1..QW-8: Biome errors → 0, ESLint errors → near-0 (only the deliberate-`any` family remains, which is Phase 1). The **77 `any`s**, **14 `noArrayIndexKey`**, **7 `noImplicitAnyLet`**, **6 `noNonNullAssertion`** are **not** quick wins — they need real typing work (Phase 1).

---

## 4. Refactor backlog (prioritized)

Categories: `type-safety` · `factorization` · `god-file-split` · `architecture` · `tests` · `a11y` · `perf` · `security`.
Severity from subsystem audit. Effort: **S** ≤ ½ day · **M** ½–2 days · **L** > 2 days.

> **Headline items** (do these and the codebase changes character): **R-01** (77 `any`), **R-02** (`*ClientView` factorization), **R-03 / R-04** (LandingPage / HeroPaymentsDemo splits).

### 4.1 Headline items

| ID | Title | Category | Sev | Effort | Files | Concrete fix |
|----|-------|----------|-----|--------|-------|-------------|
| **R-01** | **Eliminate the 77 `noExplicitAny`** + flip the ESLint rule to `error` | type-safety | major | L | `schedule.actions.ts` (5: lines 207, 250, 281, 288, 306), `superadmin.actions.ts:151`, `services/api.ts:136`, `i18n/request.ts:9`, `prisma.ts:60`, `prisma-helpers.ts:8`, `components/landing/components/LandingIcons.tsx` (Check/ArrowR), `Drawer.tsx` (63, 80, 240), `SessionDetails.tsx:25`, `TaysirCalendar.tsx` (244–245), `AttendanceClientView.tsx` (45, 284, 327, 370, 406) | Replace `as any`/`: any` with: `Prisma.SessionUpdateInput` / `Prisma.SessionWhereInput` in schedule + api; `Partial<typeof data>` in superadmin; `React.SVGProps<SVGSVGElement>` in icons; discriminated unions for `Drawer.formData`; typed props interfaces for the inline attendance subcomponents; type predicate for `i18n/request.ts` locale check. Keep the **2 documented exceptions** (`prisma.ts:60` extension args, `prisma-helpers.ts:8`) with `biome-ignore`. **Then** set `@typescript-eslint/no-explicit-any: "error"` in `eslint.config.mjs:10` to lock the win. |
| **R-02** | **Generic `<ResourceCRUD<T>>` for the 6+ ClientViews** | factorization | major | L | `StudentsClientView.tsx` (421), `StaffClientView.tsx` (505), `GroupsClientView.tsx` (588), `RoomsClientView.tsx` (226), `ActivitiesClientView.tsx` (246), `PaymentsClientView.tsx` (780) | Extract the repeated scaffold (DataTable + search + filter + create/edit `Modal` + delete `ConfirmModal` + `useTransition` + `useOptimistic`) into one composition-based component accepting `{ initialData, columns, actions: {create,update,delete}, renderExtra? }`. Rooms/Activities collapse to ~80 LOC each; Staff/Groups to ~150. Extend the **existing but underused** `useDashboardView` hook (`src/lib/hooks/useDashboardView.ts`) to back it. |
| **R-03** | **Split `LandingPage.tsx` god-file** | god-file-split | major | M | `src/components/landing/LandingPage.tsx` (1751) | Move the 6 inline sub-components — `Hero` (22-127), `PlatformTabs` (234-626), `MicroDemo`, `ROISimulator` (959-1388), `Pricing` (1390-1596), `Footer` — into `src/components/landing/sections/*.tsx`. Leaves `LandingPage` as ~200 LOC of imports + composition. Pure mechanical extraction, no logic change. |
| **R-04** | **Decompose `HeroPaymentsDemo.tsx` state-machine god-file** | god-file-split | major | L | `src/components/landing/sections/HeroPaymentsDemo.tsx` (1586) | Split into `HeroPaymentsDemoContainer`, `PaymentsTable` (rows 1382-1586), `ConfirmModal`, `WhatsAppSimulator` (1206-1234), and a `useDemoScript` hook owning `TIMELINE`/`CURSOR`/phase state (105-132). Extract `WaBubble`/`Chip`/`Row` to their own files. Each piece ≤ ~400 LOC and independently testable. |

### 4.2 Security & tenant-isolation (high-priority, from audit invariants)

| ID | Title | Category | Sev | Effort | Files | Concrete fix |
|----|-------|----------|-----|--------|-------|-------------|
| R-05 | **Scope email-uniqueness checks to tenant** (cross-tenant email enumeration) | security | critical | S | `users.actions.ts:19`, `settings.actions.ts:19`, `lib/auth.ts:20` | Replace bare `prisma.user.findUnique({where:{email}})` with a tenant-scoped check via `getTenantPrisma(tenantId)`, or accept global-uniqueness explicitly and stop the leak. Extract one shared `assertEmailAvailable(tenantId, email)` helper (DRYs all 3). |
| R-06 | **Add `etablissementId` filter to message getters** (cross-tenant message read) | security | critical | S | `messages.actions.ts:38,64` | Add `where: { etablissementId: tenantId, ... }` to `getReceivedMessagesAction` / `getSentMessagesAction`; they currently filter only by `userId`. Covered by audit but no test — add one. |
| R-07 | **Validate `tenantId` ownership in `updateSchoolAction`** | security | critical | S | `settings.actions.ts:68` | A `GERANT` from tenant A can update tenant B's `Etablissement` since the role check doesn't assert `session.etablissementId === target`. Add the assertion or route through `getTenantPrisma`. |
| R-08 | **Cascade-delete on tenant-scoped FKs** (orphan prevention) | architecture | critical | S | `prisma/schema.prisma` (147, 214-218) | Add `onDelete: Cascade` to `PaymentPlan.activity`, `Session.activity/room/group/instructor`, `AttendanceRecord.session/student`. `prisma db push` after. |
| R-09 | **`NEXTAUTH_SECRET` empty-string fallback** | security | major | S | `lib/auth.ts:94` | Replace `?? ''` with a startup throw; `middleware.ts:25` already non-null-asserts, so the posture is inconsistent and forgeable. |
| R-10 | **SuperAdmin layout has no server-side auth check** | security | major | S | `src/app/[locale]/superadmin/layout.tsx` | Add `getServerSession` + role redirect like `dashboard/layout.tsx:14-17`; currently relies solely on middleware. |
| R-11 | **`upload.actions.ts` bypasses the safe-action framework** | architecture | major | S | `src/actions/upload.actions.ts` | Wrap `uploadFileAction` in `createSafeAction` with a Zod schema; today it does manual `getServerSession` + no validation, the only action off-pattern. |
| R-12 | **Externalize hardcoded super-admin seed email** | security | minor | S | `prisma/seed.ts:10` | Read `SUPER_ADMIN_EMAIL` from env instead of the literal `...@superadmin.taysir.dz`. |

### 4.3 Type-safety & framework consistency

| ID | Title | Category | Sev | Effort | Files | Concrete fix |
|----|-------|----------|-----|--------|-------|-------------|
| R-13 | **Type-safe `stripUndefined`** (remove `any` return) | type-safety | major | M | `src/lib/utils/prisma-helpers.ts:8` | Return `Omit`-based typed subset instead of `any`; used across all action files so this removes a broad `any` taint. (One of the documented exceptions today — re-evaluate.) |
| R-14 | **Replace `as unknown as PrismaClient` casts** | type-safety | major | M | `prisma.ts:158,170,182` | Introduce a branded `TenantPrismaClient` type extending `PrismaClient`; removes 3 unsafe casts that hide interface mismatches. |
| R-15 | **Centralize role checks as a safe-action pipeline stage; type `ctx.role` as `RoleUser`** | architecture | major | M | `lib/actions/safe-action.ts:27`, `users.actions.ts:80`, `settings.actions.ts:60` | Make `requiredRole` the single enforcement point; type the context role as the `RoleUser` enum to kill string typos (`"GERNAT"`). Migrate inline `if (role !== "GERANT")` checks. |
| R-16 | **Add `ERR_CONFLICT` + `ERR_BUSINESS_RULE_VIOLATION` error codes** | architecture | major | S | `lib/errors.ts`, `schedule.actions.ts` (81,99,117), `finance.actions.ts:123` | Stop overloading `ERR_INVALID_DATA` for 409 conflicts / business-rule failures so clients can distinguish recoverable from permanent. Also wire the unused `ERR_DATABASE_FAILURE` code. |
| R-17 | **Use Prisma `nativeEnum()` in validation schemas** | type-safety | major | M | `lib/validations.ts` (191, 219, 227) | Replace string-literal `z.enum([...])` for `StatusSession`/`PaymentStatus`/`StatutPresence` with `z.nativeEnum(Prisma.X)` so schemas auto-sync with the DB enums. |
| R-18 | **Consolidate inline `z.object()` schemas into `validations.ts`** | factorization | major | M | `schedule.actions.ts`, `logistics.actions.ts`, `messages.actions.ts`, `dashboard.actions.ts`, `settings.actions.ts`, `superadmin.actions.ts` | Move ad-hoc inline schemas to the central registry with re-exports; eliminates schema drift. |
| R-19 | **Single source of truth for types via `z.infer`** | factorization | major | M | `lib/validations.ts`, `src/types/schema.ts` | Derive TS types from Zod (`z.infer<typeof CreateStudentSchema>`); delete the duplicated hand-written interfaces in `schema.ts` (~150 redundant LOC). |
| R-20 | **Extract `GLOBAL_ACCESS` + `globalModels` constants** | factorization | minor | S | `lib/prisma.ts` (39,148), `lib/actions/safe-action.ts:77` | Module-level `GLOBAL_TENANT_ID` constant and a single `GLOBAL_MODELS` array; the string + array are currently duplicated, risking silent tenant bypass on typo. |

### 4.4 Data model & performance

| ID | Title | Category | Sev | Effort | Files | Concrete fix |
|----|-------|----------|-----|--------|-------|-------------|
| R-21 | **Add missing FK indexes** | perf | major | S | `prisma/schema.prisma` | `@@index([studentId])` on `PaymentPlan`; `@@index([roomId])`, `@@index([instructorId])`, `@@index([groupId])` on `Session`; `@@index([sessionId])` on `AttendanceRecord`. Speeds conflict-detection + attendance joins. |
| R-22 | **Field-select on dashboard aggregation queries (N+1 / over-fetch)** | perf | major | M | `dashboard.actions.ts` (35-51, 225-310) | Add `select` to `getTodaySessionsAction` / `getDashboardFormDataAction` to stop loading full nested `instructor`/`room`/`activity` objects — matters on the 1 GB VPS. |
| R-23 | **Cache `getStaff`/`getRooms`/`getActivities`/`getGroups` + dedupe `getServerSession`** | perf | major | M | `src/services/api.ts` (45,57,87,132,163,223) | Wrap in `React.cache`; 6+ uncached `getServerSession` calls per request. Mirror the existing `getStudents` `unstable_cache` pattern. |
| R-24 | **Explicit tenant validation in `getAttendance` / `getPayments`** | security | critical | S | `services/api.ts` (191-204, 207-210) | These rely solely on `getPrisma()` scope with no explicit tenant assertion; add a guard so a scope regression can't leak data. |
| R-25 | **Remove unused `getTenants` / `getAttendanceForSessions` exports** | factorization | major | S | `services/api.ts` (80, 212) | 0 references outside their export; delete to shrink API surface. |
| R-26 | **Deterministic tenant-client cache eviction** + fix TTL off-by-one | architecture | major | M | `lib/prisma.ts` (162-164, 169) | Replace probabilistic `Math.random() < 0.1` cleanup with a scheduled/interval sweep; change `<=` to `<` in the TTL check. |
| R-27 | **Tenant/user status re-check after login** | security | major | M | `lib/auth.ts` (30-36), `lib/actions/safe-action.ts` | A tenant/user disabled *after* login keeps a valid JWT; cache status in token or re-check per action with short TTL. |

### 4.5 UI factorization & a11y

| ID | Title | Category | Sev | Effort | Files | Concrete fix |
|----|-------|----------|-----|--------|-------|-------------|
| R-28 | **Unify theme color tokens** (`taysir-teal` 134 / `brand-500` 135 / `primary-teal` 54) | factorization | major | M | `src/components/**` (47 files) | Collapse the 3 names for the same primary into one canonical token via CSS custom properties / Tailwind theme; mechanical search-replace + token map. |
| R-29 | **Refactor `Drawer.tsx` God-form-container** | god-file-split | major | L | `src/components/ui/Drawer.tsx` (359) | Replace the hardcoded `renderContent()` switch with a discriminated-union `DrawerType` + a `useDrawer(type)` router returning the right form; lazy-load drawer forms. Tighten the permissive `(string & Record<never,never>)` union. |
| R-30 | **Extract `useClickOutside` / `useDialogKeyHandling` hooks** | factorization | minor | S | `Modal.tsx`, `ConfirmModal.tsx`, `MultiSelect.tsx`, `DropdownMenu.tsx` | Dedupe the 2 independent click-outside + Escape implementations into shared hooks. |
| R-31 | **Centralize z-index + scroll-lock for portals** | a11y | critical | S | `DropdownMenu.tsx:90`, `Modal.tsx:57`, `TaysirCalendar.tsx:267` | A `SafePortal`/z-index enum + ref-counted body-scroll lock; today stacking is ambiguous when 2 portals open and the first to close resets `overflow`. |
| R-32 | **Fix `noArrayIndexKey` (14) + `noImplicitAnyLet` (7) + `noNonNullAssertion` (6)** | type-safety | major | M | repo-wide (locate via Biome `byRule`) | Replace index keys with stable ids; give `let`s explicit types; replace `!` with guards. Mechanical but spread across files — batch by rule. |
| R-33 | **Optimistic-update error rollback** | architecture | major | S | `PaymentsClientView.tsx` (56-85, 198-200) | On server-action failure, roll back `useOptimistic` state + re-fetch instead of only `alert()`; payment can appear registered when it isn't. |
| R-34 | **`useActionHandler(action)` hook + kill `alert()`** | factorization | medium | M | `students.actions.ts`, `logistics.actions.ts`, `finance.actions.ts`, `users.actions.ts`, ~23 call-sites | Centralize the repeated `if (result.success) { router.refresh() } else { alert(...) }` into one hook returning `{execute, isPending, error, success}`; route errors to a shared `ErrorToast`. |
| R-35 | **`<FormModal>` / `useFormHandler` for create/edit boilerplate** | factorization | major | M | `StudentFormModal.tsx`, `StaffClientView.tsx`, `GroupsClientView.tsx`, `RoomsClientView.tsx` | Promote the well-structured `StudentFormModal` as the pattern; collapse the FormData-read + create/update branch + error handling to ~10-15 declarative LOC per form. |
| R-36 | **`<StatCard>` / `<StatsGrid>` + currency/date format utils** | factorization | minor | S | `StaffClientView.tsx`, `GroupsClientView.tsx`, `PaymentsClientView.tsx`, `utils/format.ts` | Extract the duplicated bento stat cards; consolidate the 11+ inline `.toLocaleString()` currency/date calls into `formatCurrencyDZD` / `formatDate*` in `utils/format.ts` (also fixes hardcoded `'DZD'` in `payment-receipt.ts:36`). |
| R-37 | **Externalize landing inline styles + content** | factorization | major | L | `src/components/landing/**` (308 inline `style={{}}`) | Move to CSS modules / Tailwind + a `content.ts` constants module (`PAINS`, `PLANS`, `FAQS`, `STATS`, `STEPS`). Enables design-system consistency + future i18n of landing copy. |
| R-38 | **Replace placeholder WhatsApp credentials** | a11y/release | minor | S | `src/components/landing/lib/contact.ts:2` | Swap the `213000000000` placeholder for the real number — **blocks production launch** of the landing page. |

### 4.6 Tests & CI

| ID | Title | Category | Sev | Effort | Files | Concrete fix |
|----|-------|----------|-----|--------|-------|-------------|
| R-39 | **Test the 8 untested actions** | tests | critical | M | `logistics.actions.ts` (activity/room CRUD, `bulkMarkPresenceAction`), `schedule.actions.ts` (`updateSessionAction`, `updateSeriesAction`, `deleteSeriesAction`) | Add unit tests covering recurrence edits, conflict detection, cascading deletes. Action coverage 86% → ~100%. |
| R-40 | **E2E for payment workflow + tenant/role isolation** | tests | major | L | `tests/payment-workflow.spec.ts`, `tests/tenant-isolation.spec.ts`, `tests/role-isolation.spec.ts` (new) | Only 2 thin e2e specs exist. Add real-browser flows for plan→tranche→receipt and cross-tenant IDOR / role-escalation. |
| R-41 | **Type-safe test mock factory** | tests | minor | S | `src/__tests__/lib/test-factories.ts` (new) | Replace the 7 `let mockPrisma: any` declarations with one typed factory. |
| R-42 | **Consolidate `finance.test.ts` into `finance-actions.test.ts`** | tests | minor | S | `src/__tests__/actions/finance*.test.ts` | `finance.test.ts` is schema-only (64 LOC) and confusingly named; merge. |

---

## 5. Incremental sequencing — "petit à petit"

Each phase is independently shippable and ends with `npm run build:agent` green. Ship a PR per phase (or per sub-bullet).

### Phase 0 — Quick wins (½–1 day) — *unblocks the gate*
- **QW-1..QW-8** from §3: fix the lint script, `biome check --write`, `type="button"` ×3, unescaped entities, constructor return, unused imports/vars, the lone `<img>`.
- **Exit criteria:** Biome errors = 0; ESLint errors reduced to the `any`-family only; `npm run lint` actually runs.

### Phase 1 — Type-safety + lint-zero + live Sonar (3–5 days) — *lock quality*
- §2 **SonarQube CI** (`quality.yml` + `SONAR_TOKEN`) so the gate is live **before** the cleanup, to trend it.
- **R-01** (77 `any`) → then flip `no-explicit-any: "error"`.
- **R-32** (`noArrayIndexKey` / `noImplicitAnyLet` / `noNonNullAssertion`).
- **R-13, R-14** (`stripUndefined`, Prisma casts), **R-20** (constants).
- Fold in the cheap security fixes that are also type-safety: **R-05, R-06, R-07, R-09, R-12**.
- **Exit criteria:** Biome real-warnings → near-0; ESLint `no-explicit-any` enforced; Sonar Quality Gate green on PRs.

### Phase 2 — Shared CRUD + framework factorization (4–6 days) — *kill duplication*
- **R-15** (role-check pipeline stage), **R-16** (error codes), **R-17/R-18/R-19** (Zod nativeEnum / central schemas / `z.infer` types).
- **R-34** (`useActionHandler`), **R-35** (`<FormModal>`), **R-36** (`<StatCard>` + format utils), **R-30** (shared hooks).
- **R-02** headline (`<ResourceCRUD<T>>`) backed by the extended `useDashboardView`.
- **R-11** (wrap upload in safe-action), **R-25** (drop dead exports).
- **Exit criteria:** Rooms/Activities/Staff/Groups ClientViews each shrink 40–60%; no `alert()`; single schema source of truth.

### Phase 3 — God-file splits + UI architecture (4–7 days) — *tame the giants*
- **R-03** (LandingPage split), **R-04** (HeroPaymentsDemo split), **R-29** (Drawer router).
- **R-28** (theme tokens), **R-31** (portal z-index/scroll-lock), **R-33** (optimistic rollback).
- **R-37** (landing inline styles → CSS modules + content module), **R-38** (real WhatsApp number — gate landing launch).
- **Exit criteria:** No file > ~600 LOC; one canonical color token; landing production-ready.

### Phase 4 — Data model, perf & test coverage (3–5 days) — *harden*
- Schema: **R-08** (cascades), **R-21** (indexes) — one `prisma db push`.
- Perf: **R-22** (select), **R-23** (caching), **R-26** (deterministic eviction), **R-24** (explicit tenant guards), **R-27** (status re-check).
- Tests: **R-39** (8 untested actions), **R-40** (e2e payment/isolation), **R-41/R-42** (mock factory, consolidate finance tests).
- **Exit criteria:** action coverage ~100%; e2e covers payments + isolation; Sonar coverage trend up; indexes in place.

---

### Cross-reference: headline items → phase
| Headline | Phase |
|----------|-------|
| R-01 — 77 `any` elimination + rule flip | **1** |
| R-02 — `<ResourceCRUD<T>>` ClientView factorization | **2** |
| R-03 — LandingPage split | **3** |
| R-04 — HeroPaymentsDemo split | **3** |
| SonarQube activation (§2) | **1** (CI wired first) |

> Effort total ≈ 18–28 working days across 5 phases. Nothing here requires an architectural rewrite — the tenant-isolation core and safe-action pipeline stay intact; this is debt paydown, not redesign.
