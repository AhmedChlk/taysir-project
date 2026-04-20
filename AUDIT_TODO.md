# TAYSIR — AUDIT COMPLET & TODO REFACTORING
> Audit réalisé le 2026-04-18 | 87 fichiers analysés | Biome: 256 erreurs | Vitest: 0 tests

---

## STATISTIQUES

| Sévérité | Problèmes |
|----------|-----------|
| 🔴 CRITIQUE | 7 |
| 🟠 MAJEUR | 22 |
| 🟡 MINEUR | 4 |

---

## PHASE 1 — SÉCURITÉ CRITIQUE (Blocker MVP)

### SEC-01 — SQL Injection potentielle
- [ ] **`src/actions/finance.actions.ts:73`** — Remplacer `$executeRawUnsafe` par `$executeRaw` tagged template
  ```ts
  // AVANT (dangereux)
  await tx.$executeRawUnsafe(`SELECT 1 FROM "Tranche" WHERE id = '${data.trancheId}' FOR UPDATE`);
  // APRÈS (sûr)
  await tx.$executeRaw`SELECT 1 FROM "Tranche" WHERE id = ${data.trancheId}::uuid FOR UPDATE`;
  ```

### SEC-02 — tenantId fourni par le client (IDOR)
- [x] **`src/actions/documents.actions.ts:26-36`** — CORRIGE (2026-04-18) : `getStudentDocuments` converti en `getStudentDocumentsAction` via `createSafeAction`. `tenantId` extrait de `getServerSession()` uniquement. Filtre `etablissementId: tenantId` ajoute dans `findMany` et `update`. `revalidatePath` remplace par `revalidateTag`. 3 tests unitaires ajoutés dans `src/__tests__/actions/documents.test.ts`.

### SEC-03 — Absence de contrainte d'ownership dans updateProfileAction
- [ ] **`src/actions/settings.actions.ts:29`** — Remplacer `where: { id: userId }` par `where: { id_etablissementId: { id: userId, etablissementId: tenantId } }`

### SEC-04 — Conflit de planning cross-tenant
- [x] **`src/actions/schedule.actions.ts:46-101`** — CORRIGÉ (2026-04-19) : `etablissementId: tenantId` ajouté dans les 3 requêtes de détection de conflit (`roomConflict`, `instructorConflict`, `groupConflict`). `revalidatePath` remplacé par `revalidateTag`.

### SEC-05 — Protection des routes au niveau middleware
- [x] **`src/proxy.ts`** — CORRIGÉ (2026-04-19) : `src/middleware.ts` créé avec protection JWT Edge (`getToken`) pour les routes `/dashboard` + i18n via `next-intl`. `src/proxy.ts` supprimé.

### SEC-06 — Protection du compte GERANT unique
- [ ] **`src/actions/settings.actions.ts:70-79`** — `deleteAccountAction` : vérifier qu'un autre GERANT/ADMIN actif existe avant suppression

### SEC-07 — Lien externe sans rel="noopener noreferrer"
- [x] **`src/app/[locale]/dashboard/students/[id]/page.tsx:213`** — CORRIGÉ (2026-04-19) : `rel="noopener noreferrer"` appliqué sur le `<a target="_blank">`.

---

## PHASE 2 — MULTI-TENANCY & TYPE SAFETY

### MT-01 — Filtres etablissementId manquants dans dashboard.actions.ts
- [x] **MT-01** — CORRIGE (2026-04-19) : `etablissementId: tenantId` ajouté explicitement dans toutes les requêtes des 8 actions dashboard (`getDashboardStatsAction`, `getTodaySessionsAction`, `getPendingPaymentsAction`, `getAttendanceStatsAction`, `getRoomOccupancyAction`, `getDailyAttendanceRatioAction`, `getUpcomingStaffAlertsAction`, `getFinancialKPIsAction`) + toutes les 7 requêtes parallèles de `getDashboardFormDataAction`. Tests unitaires ajoutés dans `src/__tests__/actions/dashboard.test.ts`.

### MT-02 — Validation des groupes sans etablissementId
- [x] **MT-02** — CORRIGE (2026-04-19) : `etablissementId: tenantId` ajouté dans le `where` de validation des `groupIds` dans `createStudentAction` et `updateStudentAction`.

### MT-03 — deleteStudentAction utilise le client admin pour le premier findUnique
- [x] **MT-03** — CORRIGE (2026-04-19) : `deleteStudentAction` utilise désormais `tenantPrisma.student.findUnique({ where: { id_etablissementId: { id, etablissementId: tenantId } } })` avant la transaction — le check manuel cross-tenant supprimé. `updateStudentAction` utilise également la clé composite `id_etablissementId`. Tous les `revalidatePath('/[locale]/...')` remplacés par `revalidateTag('etab_${tenantId}_*', "max")` dans `students.actions.ts`.

### TS-01 — Types `any` dans prisma.ts (16 occurrences)
- [x] **CORRIGÉ (2026-04-18)** — `ExtendedPrismaClient` type circulaire supprimé. `getTenantPrisma` retourne `PrismaClient` pour la type-safety des call-sites. `$allOperations` middleware utilise `Record<string, any>` avec `biome-ignore` justifié (Prisma extension args ne peuvent pas être statiquement typés sans `any`). `tenantClients: Map<string, any>` avec `biome-ignore`. `src/lib/utils/prisma-helpers.ts` créé avec `stripUndefined()` pour résoudre les conflits `exactOptionalPropertyTypes` dans les actions Prisma.

### TS-02 — Casts `as any` inutiles dans auth.ts
- [x] **CORRIGÉ (2026-04-18)** — `(session.user as any).id/role/etablissementId` → direct assignment. `(session?.user as any)?.role` → `session?.user?.role` dans `api.ts` (2 occurrences). Types augmentés dans `next-auth.d.ts` utilisés directement.

### TS-03 — Types `any` dans les composants
- [x] **CORRIGÉ (2026-04-18)** — `ScheduleClientView.tsx`: `initialSessions: any[]` → `SessionWithRelations[]` (type Prisma inféré). `Drawer.tsx`: `DrawerType` union strict + `DrawerFormData` interface typée + maps `.map((s: any))` → `.map((session))` avec types inférés. `students/[id]/page.tsx`: `StudentFullProfile = Prisma.StudentGetPayload<{...}>` — tous les `any` dans `.map((group: any))`, `.map((doc: any))`, `.map((record: any))`, `p: any` remplacés par types inférés. `services/api.ts`: casts `as any` supprimés.
  - Note: `src/app/[locale]/layout.tsx` n'avait pas de cast `session.user as any` (faux positif dans l'audit).
  - Reste: `any` intentionnels dans `SessionForm.tsx`, `PaymentPlanForm.tsx`, `TaysirCalendar.tsx` (hors scope TS-03).

---

## PHASE 3 — ARCHITECTURE & CLEAN CODE

### ARCH-01 — Duplication de logique (DRY Violation)
- [x] **CORRIGÉ (2026-04-18)** — `src/lib/queries/attendance.ts` créé avec `computeWeeklyAttendanceRatios()`. `dashboard.actions.ts::getAttendanceStatsAction` et `services/api.ts::getAttendanceStats` délèguent tous deux à ce helper partagé. `eachDayOfInterval`/`isSameDay` imports dédupliqués.

### ARCH-02 — revalidateTag avec second argument invalide
- [x] **FERMÉ (2026-04-18)** — `revalidateTag(tag, "max")` est valide en Next.js 16.2.3. `npx tsc --noEmit 2>&1 | grep -i "revalidateTag"` retourne 0 erreur. Second argument confirme le cache profile. Aucune correction nécessaire.

### ARCH-03 — revalidatePath avec patterns [locale] invalides
- [x] **CORRIGÉ (2026-04-18)** — `users.actions.ts`: 3× `revalidatePath("/[locale]/dashboard...")` → `revalidateTag(\`etab_${tenantId}_staff\`, "max")` et `etab_${tenantId}_dashboard`. `messages.actions.ts`: `revalidatePath("/dashboard/messages")` → `revalidateTag(\`etab_${tenantId}_messages\`, "max")`. `revalidatePath` import supprimé dans ces 2 fichiers.

### ARCH-04 — DashboardLayout Client Component avec 7 requêtes Prisma dans useEffect
- [x] **CORRIGÉ (2026-04-19)** — `DashboardFormData` type fort inféré depuis le retour de `getDashboardFormDataAction` (plus de `any`). Cache `formData` à travers les ouvertures de drawer : `isLoadingFormData` guard évite les rechargements redondants.

### ARCH-05 — DashboardClientView.tsx (composant mort avec logique métier)
- [x] **CORRIGÉ (2026-04-19)** — `src/components/dashboard/DashboardClientView.tsx` supprimé (dead code, non importé nulle part).

### ARCH-06 — PDF côté client dans StudentsClientView.tsx
- [x] **ARCH-06 — CORRIGÉ (2026-04-19)**: logique PDF extraite dans `src/lib/pdf-generators/student-profile.ts`. `alert()` remplacé par état d'erreur React (`useState<string | null>`). Import `jsPDF` supprimé du composant.

### ARCH-07 — Génération PDF dans une transaction Prisma (finance.actions.ts)
- [x] **ARCH-07 — CORRIGÉ (2026-04-19)**: génération PDF retirée de `registerPaymentAction`. `getPaymentReceiptDataAction` créée pour permettre la génération côté client. `jsPDF` + `@vercel/blob` supprimés de la Server Action. `src/lib/pdf-generators/payment-receipt.ts` créé.

### ARCH-08 — Cache Prisma multi-tenant sans TTL ni invalidation
- [x] **CORRIGÉ (2026-04-19)** — `CachedTenantClient { client, createdAt }` structure introduite dans `tenantClients` Map. TTL 5 min (`TENANT_CLIENT_TTL_MS`). Nettoyage probabiliste (1 sur 10) via `evictExpiredTenantClients()`. Les clients expirés sont recréés transparentement.

### ARCH-09 — DashboardLayout importé dans les pages (doit être dans layout.tsx)
- [x] **CORRIGÉ (2026-04-19)** — `DashboardLayout` (rebaptisé `DashboardShell` à l'import) déplacé dans `src/app/[locale]/dashboard/layout.tsx`. Import `DashboardLayout` + wrapper `<DashboardLayout>` retirés des 11 pages dashboard.

### ARCH-10 — upload.actions.ts : fallback base64 en base de données
- [x] **CORRIGÉ (2026-04-19)** — Bloc base64 fallback supprimé dans `uploadFileAction`. Retourne `{ success: false, error: "Service d'upload non configuré. Contactez l'administrateur système." }` si `BLOB_READ_WRITE_TOKEN` est absent.

---

## PHASE 4 — FRONTEND & UX

### UI-01 — Zéro useOptimistic (UX bloquante)
- [x] **CORRIGÉ (2026-04-20)** — `useOptimistic` implémenté dans `StudentsClientView.tsx` (delete/create/update), `PaymentsClientView.tsx` (register tranche optimiste), `GroupsClientView.tsx` (delete/update). Les mutations sont instantanées côté UI avec rollback automatique en cas d'erreur.

### UI-02 — Zéro Suspense boundaries / Skeletons sur les pages
- [x] **CORRIGÉ (2026-04-20)** — `loading.tsx` créés pour dashboard, students, students/[id], payments, groups. Dashboard page via `DashboardSPA` wrappait déjà chaque widget en `<Suspense fallback={<WidgetSkeleton />}>`. `WidgetSkeleton` et `Skeleton` utilisés correctement.

### UI-03 — Textes hardcodés (violation I18n massive)
- [x] **CORRIGÉ (2026-04-20)** — 100+ clés ajoutées dans `fr.json` et `ar.json`. Tous les composants utilisent `useTranslations`/`getTranslations` :
  - `StatsWidget.tsx`, `SessionsWidget.tsx`, `PerformanceKPIsWidget.tsx`, `LiveRosterWidget.tsx` — tous externalisés
  - `StudentsClientView.tsx` — colonnes, modals, labels externalisés
  - `PaymentsClientView.tsx` — headers, statuts, modals externalisés
  - `GroupsClientView.tsx` — compteurs, modals externalisés
  - `students/[id]/page.tsx` — `getTranslations()` ajouté, tous textes externalisés
  - Note: `Sidebar.tsx:72` (`Taysir.`) non corrigé (texte de marque, intentionnel)

### UI-04 — Accessibilité (violations Biome a11y)
- [ ] **Boutons sans `type="button"`** — Ajouter `type="button"` sur tous les `<button>` non-submit dans: `DashboardClientView.tsx`, `DashboardSPA.tsx`, `DataTable.tsx`, `Drawer.tsx`, `EmptyState.tsx`, `Modal.tsx`, `PaymentCard.tsx` (17+ occurrences)
- [ ] **Labels sans contrôle associé** — Corriger dans `FormInput.tsx:42,128,155`, `MultiSelect.tsx:52`, `AttendanceClientView.tsx:97`
- [ ] **Divs clickables sans keyboard handler** — Ajouter `onKeyDown`/`role="button"` sur `Sidebar.tsx:60`, `DropdownMenu.tsx:84`, `Modal.tsx:48`, `MultiSelect.tsx:54,91`
- [ ] **`<img>` natif** — Remplacer `<img>` par `next/image` dans `Sidebar.tsx:71`

### UI-05 — Variables inutilisées dans DashboardSPA.tsx
- [ ] **`src/components/dashboard/DashboardSPA.tsx:3,4,6,8,31,34`** — Supprimer imports et variables `session`, `isPending` non utilisés

---

## PHASE 5 — TESTS (Pipeline obligatoire)

### TEST-01 — Créer vitest.setup.ts
- [ ] Créer `vitest.setup.ts` à la racine (référencé mais manquant dans `vitest.config.ts:9`)
  ```ts
  import '@testing-library/jest-dom';
  ```

### TEST-02 — Tests unitaires Vitest (priorité haute)
- [ ] **`src/__tests__/lib/validations.test.ts`** — Tester tous les schémas Zod (cas valides + invalides)
- [ ] **`src/__tests__/lib/safe-action.test.ts`** — Tester `createSafeAction` (succès, échec auth, échec validation)
- [ ] **`src/__tests__/utils/format.test.ts`** — Tester `formatFullName`, `formatCurrency`, `formatDate`
- [ ] **`src/__tests__/actions/students.test.ts`** — Tester `createStudentAction`, `deleteStudentAction` avec MSW

### TEST-03 — Configurer MSW
- [ ] Créer `src/mocks/handlers.ts` avec les handlers pour les Server Actions
- [ ] Créer `src/mocks/server.ts` pour l'environnement Node (Vitest)

### TEST-04 — Tests E2E Playwright (parcours vitaux)
- [ ] Créer le répertoire `tests/`
- [ ] **`tests/auth.spec.ts`** — Login, logout, redirection si non authentifié
- [ ] **`tests/students.spec.ts`** — Création, modification, suppression d'un élève
- [ ] **`tests/payments.spec.ts`** — Enregistrement d'un paiement, génération du reçu
- [ ] **`tests/attendance.spec.ts`** — Marquage des présences

---

## PHASE 6 — QUALITÉ (Biome — 256 erreurs à corriger)

### QUAL-01 — Lancer Biome et corriger les erreurs restantes
- [ ] `npx @biomejs/biome check ./src --write` (auto-fix)
- [ ] Corriger manuellement les erreurs non-fixables automatiquement
- [ ] Cibler zéro erreur Biome avant merge

### QUAL-02 — Zod : améliorer les validations de devise
- [ ] **`src/lib/validations.ts:35`** — Remplacer `z.string().length(3)` par `z.enum(["DZD", "EUR", "USD"])`

### QUAL-03 — Biome security rules
- [ ] **`biome.json`** — Activer `security/noDangerouslySetInnerHtml` et règles de sécurité supplémentaires

---

## PROBLEMES DECOUVERTS LORS DE SEC-02 (2026-04-18)

### DOC-01 — Codes d'erreur trompeurs dans ErrorCodes
- [ ] **`src/lib/errors.ts:2-8`** — Les cles de `ErrorCodes` (ex: `ERR_UNAUTHORIZED`) ne correspondent pas aux valeurs string retournees (`"AUTH_REQUIRED"`). Tout code qui compare via la cle au lieu de la valeur produit une assertion silencieusement fausse. Renommer les valeurs pour qu'elles correspondent aux cles (`ERR_UNAUTHORIZED`, `ERR_INVALID_DATA`, etc.) ou documenter explicitement la convention.
  **Severite** : MAJEUR | **Type** : Qualite / Maintenabilite

### DOC-02 — Fallback SUPERADMIN_ACCESS non garde dans safe-action.ts
- [ ] **`src/lib/actions/safe-action.ts:65`** — `tenantId: tenantId || "SUPERADMIN_ACCESS"` passe la chaine litterale `"SUPERADMIN_ACCESS"` a `getTenantPrisma` quand l'utilisateur est SUPER_ADMIN sans etablissementId. Si `getTenantPrisma` utilise cet identifiant comme filtre Prisma, toutes les requetes SUPER_ADMIN retournent un resultat vide (tenant inexistant). Ajouter un guard explicite avant d'appeler le handler : si le role est SUPER_ADMIN, passer `null` ou utiliser le client Prisma global.
  **Severite** : MAJEUR | **Type** : Architecture / Securite

### DOC-03 — revalidateTag second argument non standard
- [x] **DOC-03** — FERMÉ (2026-04-19) : `revalidateTag(tag, "max")` est valide en Next.js 16.2.3 (profil de cache documenté). TypeScript confirme la signature à 2 arguments. Aucune correction nécessaire.
  **Severite** : MINEUR | **Type** : Architecture

### DOC-04 — Dead code vulnerable non detecte avant audit (getStudentDocuments)
- [x] **DOC-04** — RÉSOLU PAR CONVENTION (2026-04-19) : Toute fonction async exportée dans `src/actions/` doit passer par `createSafeAction` (enforcement par code review + règle documentée dans CLAUDE.md). L'ancienne `getStudentDocuments` non protégée est supprimée depuis SEC-02.
  **Severite** : MINEUR | **Type** : Securite / Qualite

---

## RÉCAPITULATIF ORDONNÉ PAR PRIORITÉ

```
🔴 BLOCKERS (avant tout déploiement)
├── SEC-01  SQL Injection finance.actions.ts
├── SEC-02  IDOR documents.actions.ts
├── SEC-03  Ownership bypass settings.actions.ts
├── SEC-04  Cross-tenant conflict schedule.actions.ts
├── SEC-05  Middleware auth manquant
├── MT-01   Filtres tenantId manquants dashboard.actions.ts (8 actions)
└── TEST-01 Zéro tests dans le projet

🟠 IMPORTANTS (stabilisation MVP)
├── MT-02/03  Multi-tenancy students.actions.ts
├── TS-01/02/03  Éradication des `any`
├── ARCH-01/02/03  DRY + revalidation correcte
├── ARCH-04   DashboardLayout refactoring
├── UI-01     useOptimistic
├── UI-02     Suspense + Skeletons
├── UI-03     I18n (textes hardcodés)
└── TEST-02/03/04  Pipeline de tests

🟡 QUALITÉ (maintenabilité long terme)
├── UI-04     Accessibilité (a11y)
├── QUAL-01   Biome zéro erreur
├── ARCH-05/06/07/08/09/10  Refactoring architecture
└── QUAL-02/03  Zod + Biome config
```

---

*Document généré automatiquement par l'agent taysir-clean-qa-architect*
*À mettre à jour après chaque tâche complétée*
