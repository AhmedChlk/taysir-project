# TAYSIR — AUDIT TODO

> Audit réalisé le 2026-04-20. Chaque ligne = UN problème actionnable.

## ⚠️ RÈGLE DE TRAVAIL
Corriger UN problème à la fois. Max 3 fichiers par itération.
Cycle : coder → build → test → Playwright physique → suivant.

---

## 🔴 CRITIQUE (bloque le fonctionnement ou la sécurité)

- [x] **Middleware auth inactif** — `src/proxy.ts` renommé en `src/middleware.ts` ✓

---

## 🟠 MAJEUR (bug fonctionnel ou risque fort)

- [x] **Fallback tenant "system"** — `src/actions/upload.actions.ts` — corrigé : retourne erreur 403 si `etablissementId` absent ✓

- [x] **Aucun ErrorBoundary** — `error.tsx` ajoutés sur 3 segments : `[locale]/`, `dashboard/`, `superadmin/` ✓

- [x] **Coverage tests** — 193/193 tests passés, coverage 89.32% stmts / 77.4% branches / 88.37% funcs / 89.21% lines — tous seuils franchis ✓

- [x] **Build propre** — `next build` : 0 erreur TypeScript, 0 warning ✓

---

## 🟡 MINEUR (qualité / dette technique)

- [x] **`any` settings** — SchoolSettings, ProfileSettings, SettingsClientView typés avec `Etablissement | null` et `CurrentUser` ✓ (+ bug caché découvert : champ `phone` non fetché dans `getCurrentUser`)
- [x] **`any` SessionForm** — `RoomOption | ActivityOption | StaffOption | GroupOption` + `DrawerFormData` mis à jour ✓
- [x] **`any` PaymentPlanForm** — `StudentOption | ActivityOption` ✓
- [x] **`any` StaffAlertsWidget** — annotation `: any` retirée, type inféré depuis l'action ✓
- [x] **Return `any` sur stripUndefined** — `src/lib/utils/prisma-helpers.ts:8` — intentionnel (biome-ignore documenté) — accepté pour compatibilité Prisma exactOptionalPropertyTypes

- [x] **`dangerouslyAllowSVG: true`** — `next.config.ts` — SVGs distants non restreints côté CSP → risque XSS si un SVG malveillant est servi par un domaine autorisé

- [x] **CSP trop permissive** — `next.config.ts` — `script-src 'unsafe-eval' 'unsafe-inline'` neutralise la protection XSS — affiner pour Next.js (nonce ou hash)

- [x] **TypeScript non vérifié** — `npx tsc` non disponible (TypeScript pas dans PATH global) — ajouter `tsc --noEmit` via `./node_modules/.bin/tsc` dans le pipeline CI

---

## 🔵 SÉCURITÉ

- [x] **Secret hardcodé dans seed** — `prisma/seed.ts:11` — valeur bcrypt hardcodée utilisée dans `bcryptjs.hash` — _source: Snyk HIGH_ — remplacer par `process.env.SEED_PASSWORD`

- [x] **Secret hardcodé dans seed** — `prisma/seed.ts:42` — second hash bcrypt hardcodé — _source: Snyk HIGH_ — même correction

- [x] **Mots de passe en dur dans les tests** — `src/__tests__/actions/superadmin.test.ts:101`, `users.test.ts:70,76,94,107,227,232`, `lib/validations.test.ts:20` — 8 occurrences — _source: Snyk LOW_ — extraire dans une constante de test `TEST_PASSWORD` ou utiliser `process.env.TEST_PASSWORD`

- [x] **Vercel Blob dans remotePatterns** — `next.config.ts` — `**.public.blob.vercel-storage.com` autorisé alors que le projet est déployé sans Vercel — supprimer ou restreindre au domaine réel
