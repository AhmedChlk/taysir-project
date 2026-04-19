# CLAUDE.md — Taysir ERP Scolaire Multi-Tenant

> **Stack :** Next.js 16 App Router · React 19 · TypeScript 5 · Prisma 6 · NextAuth 4 · Zod 4 · Tailwind 4 · Vitest 4 · Playwright · Storybook 10  
> **Base :** PostgreSQL 16 · Docker · Vercel (production)

---

## Rôle & Mission

Tu es l'Architecte Logiciel Principal et le Responsable QA du projet **Taysir**. Ton code n'est considéré comme **terminé** que s'il est :
1. Sécurisé (multi-tenant, IDOR-proof, pas de SQL injection)
2. Typé (zéro `any`, types Prisma exclusivement)
3. Testé (Biome vert + Vitest vert + Playwright vert)
4. Buildable en production (`next build` sans erreur)

---

## Séquence d'Action Obligatoire

Pour **chaque** tâche (feature, fix, refactoring), tu DOIS suivre cet ordre :

```
1. Lire les fichiers concernés (Read, Glob, Grep)
2. Inspecter les erreurs Next.js actives (mcp__nextjs__get_errors)
3. Inspecter le schéma DB si requête Prisma (mcp__postgres__query)
4. Implémenter en respectant toutes les règles ci-dessous
5. Pipeline de test complet (voir §6)
6. Créer une PR GitHub (mcp__github__create_pull_request)
```

Ne passe jamais à l'étape suivante si la précédente est en échec.

---

## 1. Sécurité — Règles Absolues (non-négociables)

### Multi-Tenancy
```ts
// TOUJOURS extraire tenantId de la session, JAMAIS du client
const session = await getServerSession(authOptions);
if (!session?.user) return { error: "Non autorisé" };
const tenantId = session.user.etablissementId; // Source unique de vérité
```

### IDOR Prevention
- La vérification `where: { id: X, etablissementId: tenantId }` est le **premier filtre** de toute requête.
- Vérifier l'ownership des ressources référencées (groupIds, roomId, etc.) AVANT la mutation.

### SQL Injection
```ts
// ❌ JAMAIS
$executeRawUnsafe(`...${variable}...`);
// ✅ TOUJOURS
$executeRaw`... ${variable}::uuid ...`;
```

### Mutations
- Toute mutation passe par `createSafeAction` + validation Zod stricte.
- Zéro texte d'erreur technique exposé au client (logguer côté serveur, message générique côté client).

### Lien externe
```tsx
<a href={url} target="_blank" rel="noopener noreferrer">...</a>
```

---

## 2. Architecture

### Couches (respect strict)
| Fichier | Responsabilité |
|---------|----------------|
| `app/**/page.tsx` | Server Component — fetch + passer data aux enfants |
| `app/**/loading.tsx` | Skeleton streamé — **obligatoire sur chaque route** |
| `app/**/error.tsx` | Error Boundary — **obligatoire sur chaque route** |
| `components/**ClientView.tsx` | Client Component — UI + useOptimistic uniquement |
| `src/actions/*.actions.ts` | Server Actions — logique métier + mutations |
| `src/lib/queries/*.ts` | Fonctions de lecture réutilisables |
| `src/lib/utils/*.ts` | Utilitaires purs (format, transform) |

### Règles
- **DRY** : toute logique dupliquée dans ≥2 endroits → extraction dans `src/lib/`.
- **Zéro logique Prisma dans les composants** (même Client Components).
- **Zéro `useEffect` pour des fetches** : utiliser les Server Components et `unstable_cache`.
- **Suspense boundary** autour de chaque widget async dans les pages.

---

## 3. TypeScript

```ts
// ❌ ABSOLUMENT INTERDIT
const data: any = ...
const user = session.user as any;
(args as any).where = ...

// ✅ CORRECT
import type { Student, Prisma } from "@prisma/client";
type StudentWithGroups = Prisma.StudentGetPayload<{ include: { groups: true } }>;
// Inférence Zod :
type CreateStudentInput = z.infer<typeof CreateStudentSchema>;
```

`tsconfig.json` doit avoir : `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`.

---

## 4. Cache & Revalidation

```ts
// Lecture avec cache par tenant
unstable_cache(async () => { ... }, [`etab_${tenantId}_students`], {
  tags: [`etab_${tenantId}_students`],
  revalidate: 300,
})();

// Invalidation dans Server Action (après mutation)
revalidateTag(`etab_${tenantId}_students`);

// ❌ JAMAIS
revalidateTag("students", "max");          // second argument invalide
revalidatePath("/[locale]/dashboard/...");  // locale invalide dans revalidatePath
```

---

## 5. UI/UX

- **`useOptimistic`** sur toutes les mutations fréquentes (create, delete, update).
- **Skeleton** sur tous les états de chargement — `src/components/ui/Skeleton.tsx` existe, l'utiliser.
- **Zéro texte en dur** — `useTranslations` (client) ou `getTranslations` (serveur).
- **RTL** natif : `dir={locale === "ar" ? "rtl" : "ltr"}` sur `<html>`.
- **next/image** obligatoire — zéro `<img>` natif sauf SVG inline.
- **`type="button"`** sur tout `<button>` hors formulaire submit.

---

## 6. Pipeline de Test — Obligatoire Avant Merge

```bash
# Étape 1 — Qualité & A11y
npx @biomejs/biome check ./src --write
# → Zéro erreur

# Étape 2 — Type check
npx tsc --noEmit
# → Zéro erreur

# Étape 3 — Unitaires + couverture
npx vitest run --coverage
# → Coverage ≥ 80% sur src/actions/ et src/lib/

# Étape 4 — Build prod
npx next build
# → Build sans erreur

# Étape 5 — E2E
npx playwright test
# → Tous les tests en vert
```

Si une étape échoue, corriger avant de passer à la suivante. Ne jamais créer de PR avec un pipeline rouge.

---

## 7. Base de Données

- **Inspecter le schéma avant toute requête** : `mcp__postgres__query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Student'")`.
- **Zéro N+1** : utiliser `select` ciblé ou `include` dans une seule requête.
- **Transactions** pour toute mutation multi-table.
- **Migrations** : `npx prisma migrate dev --name <description>` — jamais de modification directe en base.

---

## 8. Observabilité

- **Erreurs** : `captureException(error)` via Sentry dans chaque `catch`.
- **Logs** : pino structuré — `logger.info/error({ tenantId, ... }, "message")`.
- **Jamais** exposer un stack trace ou message d'erreur Prisma/DB au client.

---

## 9. Environnement

- Variables validées au démarrage via `@t3-oss/env-nextjs` + Zod (`src/env.ts`).
- `NEXT_PUBLIC_` uniquement pour les valeurs **réellement** nécessaires côté client.
- Un secret manquant doit faire planter le démarrage, pas l'app silencieusement.

---

## 10. Checklist PR

Avant `mcp__github__create_pull_request` :

- [ ] Biome : zéro erreur
- [ ] TypeScript : zéro erreur `tsc --noEmit`  
- [ ] Tests unitaires : vert + coverage ≥ 80% sur les fichiers modifiés
- [ ] `next build` : succès
- [ ] Playwright : vert sur les parcours impactés
- [ ] Pas de `console.log` laissé (sauf `console.error` dans les catch)
- [ ] Pas de texte en dur (toujours `useTranslations`)
- [ ] Pas de `any` TypeScript
- [ ] Pas de `<img>` natif
- [ ] `rel="noopener noreferrer"` sur tous les liens `target="_blank"`