# TAYSIR — AGENT INSTRUCTIONS

## PRIORITÉS ABSOLUES
1. **Tokens** : Réponses ultra-concises. Zéro intro. Zéro politesse. Code ou commande uniquement.
2. **Lecture** : `grep` chirurgical. Interdiction de lire des dossiers entiers.
3. **Autonomie** : Pipeline self-healing obligatoire après chaque modification (voir ci-dessous).
4. **Exécution réelle** : Interdit de déduire qu'un bug est corrigé sans test physique Playwright.

---

## CONTEXTE PROJET
- **Stack** : Next.js 16 (App Router) · React 19 · TypeScript · Prisma · PostgreSQL · next-auth v4 · next-safe-action · next-intl · Tailwind v4
- **Architecture** : Multi-tenant (isolation par `etablissementId`), déploiement Docker sur Oracle VPS Free Tier (1 Go RAM)
- **Contraintes** : Zéro Vercel, zéro serverless propriétaire. Build standalone uniquement.
- **Auth** : Session `next-auth` → `session.user.etablissementId` = clé de tenant isolation

---

## PIPELINE SELF-HEALING (obligatoire après chaque modif)

```
1. npm run security:agent   → Snyk code scan
2. npm run build:agent      → Next.js build (grep errors/warnings)
3. npm run test:agent       → Vitest (coverage > 80%)
4. E2E Playwright           → Test physique UI (voir protocole ci-dessous)
```

Si une étape échoue → corriger immédiatement avant de passer à la suivante. Ne jamais sauter.

---

## PROTOCOLE PLAYWRIGHT (E2E PHYSIQUE)

```
mcp__playwright__navigate   → Aller sur la page cible
mcp__playwright__fill       → Remplir les formulaires
mcp__playwright__click      → Cliquer boutons / liens
mcp__playwright__screenshot → Capturer si doute UI
mcp__playwright__evaluate   → Inspecter DOM / logs réseau
```

**Séquence CRUD obligatoire :**
1. Naviguer sur la liste
2. Créer un élément via formulaire → vérifier apparition dans tableau
3. Modifier → vérifier persistance
4. Supprimer → attendre `state: 'detached'` pour confirmer suppression DOM réelle

---

## PATTERN SERVER ACTION (anti-regression)

```ts
export const myAction = createSafeAction(Schema, async (data) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const tenantId = session.user.etablissementId;
  return await tenantPrisma(tenantId).model.update({
    where: { id: data.id, etablissementId: tenantId }, // isolation tenant OBLIGATOIRE
    data,
  });
});
```

**Règles :**
- Toujours filtrer par `etablissementId` dans chaque requête Prisma
- Utiliser `React.cache` pour les lectures répétées
- Zéro `any` TypeScript

---

## RÈGLES AUDIT
- Corriger **UN bug à la fois** — interdiction de modifier > 3 fichiers simultanément
- Après chaque correction : build + test physique Playwright avant de passer au suivant
- Chaque PR doit satisfaire : zéro `any` · coverage > 80% · Snyk vert · flux UI vérifié

---

## SCRIPTS DISPONIBLES

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build:agent` | Build Next.js filtré erreurs/warnings |
| `npm run test:agent` | Vitest + nettoyage cache |
| `npm run e2e:agent` | Playwright E2E |
| `npm run security:agent` | Snyk code scan |
| `npm run lint` | ESLint |