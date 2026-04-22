# TAYSIR ENGINEERING SKILL

## STACK RÉFÉRENCE RAPIDE
| Couche | Technologie |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19 + Tailwind v4 + Framer Motion |
| Auth | next-auth v4 |
| Actions | next-safe-action + Zod v4 |
| ORM | Prisma v6 + PostgreSQL |
| i18n | next-intl |
| Tests | Vitest + Playwright + Testing Library |
| Lint/Format | Biome v2 |
| Sécurité | Snyk CLI |

---

## PATTERNS OBLIGATOIRES

### Server Action sécurisée
```ts
export const updateAction = createSafeAction(Schema, async (data) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const tenantId = session.user.etablissementId;
  return await tenantPrisma(tenantId).model.update({
    where: { id: data.id, etablissementId: tenantId }, // isolation OBLIGATOIRE
    data,
  });
});
```

### Lecture mémoïsée (React.cache)
```ts
import { cache } from "react";

export const getTenantData = cache(async (tenantId: string) => {
  return prisma.model.findMany({ where: { etablissementId: tenantId } });
});
```

### Composant avec mutation
```tsx
const { execute, isExecuting, result } = useAction(myAction);

return (
  <button onClick={() => execute(data)} disabled={isExecuting}>
    {isExecuting ? <Spinner /> : "Valider"}
  </button>
);
```

---

## PLAYWRIGHT — SÉQUENCES TYPE

### Vérifier un CRUD complet
```ts
// 1. Créer
await page.goto("/dashboard/tenants");
await page.click('[data-testid="add-btn"]');
await page.fill('[name="name"]', "Test Tenant");
await page.click('[type="submit"]');
await page.waitForSelector('text=Test Tenant'); // vérifie apparition

// 2. Supprimer
await page.click('[data-testid="delete-Test Tenant"]');
await page.waitForSelector('text=Test Tenant', { state: 'detached' }); // vérifie disparition
```

### Déboguer un clic silencieux
```ts
// Si onClick ne déclenche rien :
await page.evaluate(() => {
  const btn = document.querySelector('[data-testid="my-btn"]');
  console.log(btn?.getAttribute('disabled'), btn?.className);
});
```

---

## CHECKLIST pour push Github
- [ ] Zéro `any` TypeScript
- [ ] Coverage Vitest > 80%
- [ ] `npm run security:agent` → Snyk vert
- [ ] Flux CRUD testé physiquement via Playwright
- [ ] Toutes les Server Actions filtrent par `etablissementId`
- [ ] Build standalone OK (`npm run build:agent`)