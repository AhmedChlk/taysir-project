---
name: taysir-skill
description: >
  Référentiel complet d'ingénierie pour le projet Taysir (ERP Scolaire Multi-Tenant).
  Stack : Next.js 16 App Router · React 19 · TypeScript 5 strict · Prisma 6 · NextAuth 4 · Zod 4 · Tailwind 4 · Vitest 4 · Playwright.
  À appliquer intégralement sur toute nouvelle feature, refactoring ou correction de bug.
---

# Taysir — Référentiel d'Ingénierie Production

> Objectif : **Maintenable · Lisible · Scalable · Sécurisé · Testé · Commercialisable**

---

## 1. Clean Code

### 1.1 Guard Clauses (Early Returns)
Traiter les cas d'erreur en tête de fonction — jamais d'`if/else` imbriqués.

```ts
// ❌ INTERDIT
async function getStudent(id: string, tenantId: string) {
  const session = await getServerSession();
  if (session) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (student) {
      if (student.etablissementId === tenantId) { return student; }
    }
  }
}

// ✅ CORRECT
async function getStudent(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Non autorisé" };

  const tenantId = session.user.etablissementId;
  const student = await tenantPrisma(tenantId).student.findUnique({ where: { id } });
  if (!student) return { error: "Introuvable" };
  if (student.etablissementId !== tenantId) return { error: "Accès refusé" };

  return { data: student };
}
```

### 1.2 Nommage Intentionnel
Zéro abréviation. Le code s'auto-documente.

```ts
// ❌ INTERDIT
const getStdByEtab = (etabId: string) => { ... }

// ✅ CORRECT
const getStudentsByEstablishment = (establishmentId: string) => { ... }
```

### 1.3 Zéro `any` TypeScript
Types exclusivement issus de `@prisma/client` et des inférences Zod.

```ts
// ❌ INTERDIT
const handleData = (data: any) => { ... }
const user = session.user as any;

// ✅ CORRECT
import type { Student, Prisma } from "@prisma/client";
type StudentWithGroups = Prisma.StudentGetPayload<{ include: { groups: true } }>;
```

---

## 2. Architecture Next.js App Router

### 2.1 Séparation UI / Logique

| Couche | Responsabilité | Localisation |
|--------|----------------|-------------|
| **Server Component** | Fetch de données, rendu initial | `app/[locale]/dashboard/**` |
| **Client Component** | État UI, `useOptimistic`, animations | `components/dashboard/**ClientView.tsx` |
| **Server Action** | Mutation, validation, cache | `src/actions/*.actions.ts` |
| **Service / Query** | Logique métier réutilisable | `src/lib/queries/*.ts` |
| **Utilitaire** | Helpers purs (format, transform) | `src/lib/utils/*.ts` |

### 2.2 Server Actions — Template Canonique

```ts
// src/actions/students.actions.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSafeAction } from "@/lib/actions/safe-action";
import { CreateStudentSchema } from "@/lib/validations";
import { revalidateTag } from "next/cache";
import { tenantPrisma } from "@/lib/prisma";

export const createStudentAction = createSafeAction(
  CreateStudentSchema,
  async (data) => {
    // 1. AUTH — Premier bloc, toujours
    const session = await getServerSession(authOptions);
    if (!session?.user) return { error: "Non autorisé" };

    const tenantId = session.user.etablissementId; // JAMAIS depuis le client

    // 2. AUTORISATION — Vérification des droits métier
    if (!["ADMIN", "GERANT"].includes(session.user.role)) {
      return { error: "Droits insuffisants" };
    }

    // 3. OWNERSHIP CHECK — Vérifier que les ressources référencées appartiennent au tenant
    if (data.groupIds?.length) {
      const groups = await tenantPrisma(tenantId).group.findMany({
        where: { id: { in: data.groupIds }, etablissementId: tenantId },
        select: { id: true },
      });
      if (groups.length !== data.groupIds.length) {
        return { error: "Groupe invalide ou accès refusé" };
      }
    }

    // 4. MUTATION
    const student = await tenantPrisma(tenantId).student.create({
      data: { ...data, etablissementId: tenantId },
    });

    // 5. INVALIDATION CHIRURGICALE
    revalidateTag(`etab_${tenantId}_students`);

    return { data: student };
  }
);
```

### 2.3 Cache Strategy

```ts
import { unstable_cache } from "next/cache";

// Lecture intensive avec cache par tenant
export const getStudentsForDashboard = (tenantId: string) =>
  unstable_cache(
    async () => {
      return tenantPrisma(tenantId).student.findMany({
        where: { etablissementId: tenantId },
        select: { id: true, firstName: true, lastName: true, status: true },
        orderBy: { createdAt: "desc" },
      });
    },
    [`etab_${tenantId}_students`],
    {
      tags: [`etab_${tenantId}_students`],
      revalidate: 300, // 5 min
    }
  )();

// Invalidation dans l'action — tag cohérent
revalidateTag(`etab_${tenantId}_students`);
// ❌ NE JAMAIS faire :
revalidateTag(`etab_${tenantId}_students`, "max"); // second arg invalide
revalidatePath("/[locale]/dashboard/students"); // locale invalide
```

---

## 3. Sécurité by Design

### 3.1 IDOR Prevention
`etablissementId` extrait **exclusivement** de `getServerSession()`. Jamais des paramètres, body, ou query string.

```ts
// ❌ CRITIQUE — IDOR
async function getDocuments(studentId: string, tenantId: string) { // tenantId vient du client !
  return prisma.document.findMany({ where: { studentId, tenantId } });
}

// ✅ CORRECT
async function getDocuments(studentId: string) {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.etablissementId; // Toujours depuis la session
  return tenantPrisma(tenantId).document.findMany({ where: { studentId, etablissementId: tenantId } });
}
```

### 3.2 SQL Injection — Prisma Raw
Utiliser exclusivement les tagged templates, jamais `$executeRawUnsafe`.

```ts
// ❌ SQL INJECTION
await tx.$executeRawUnsafe(`SELECT 1 FROM "Tranche" WHERE id = '${data.trancheId}' FOR UPDATE`);

// ✅ CORRECT
await tx.$executeRaw`SELECT 1 FROM "Tranche" WHERE id = ${data.trancheId}::uuid FOR UPDATE`;
```

### 3.3 Middleware Auth (middleware.ts)

```ts
// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const intlMiddleware = createIntlMiddleware({
  locales: ["fr", "ar"],
  defaultLocale: "fr",
});

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Routes publiques — passer à intl directement
  if (pathname.match(/^\/(fr|ar)\/(login|register|about)/)) {
    return intlMiddleware(req);
  }

  // Routes protégées — vérification JWT avant rendu
  if (pathname.includes("/dashboard")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL(`/${req.nextUrl.locale ?? "fr"}/login`, req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/(fr|ar)/:path*"],
};
```

### 3.4 Security Headers (next.config.ts)

```ts
// next.config.ts
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval requis par Next.js dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https:",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig = {
  output: "standalone", // Docker / production
  experimental: {
    typedRoutes: true, // Typage des routes à la compilation
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
      // Ajouter ici uniquement les domaines explicitement autorisés
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```

### 3.5 Variables d'Environnement — Validation au Démarrage

```ts
// src/env.ts — Valider toutes les vars au boot, pas à l'usage
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32),
    NEXTAUTH_URL: z.string().url(),
    BLOB_READ_WRITE_TOKEN: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
// Si une var manque → crash au démarrage, pas en production silencieusement.
```

---

## 4. Rendu & Performance

### 4.1 Streaming avec Suspense (OBLIGATOIRE sur toutes les pages)

```tsx
// app/[locale]/dashboard/students/page.tsx — Server Component
import { Suspense } from "react";
import { StudentsTable } from "@/components/dashboard/students/StudentsTable";
import { StudentsTableSkeleton } from "@/components/ui/skeletons/StudentsTableSkeleton";

export default function StudentsPage() {
  return (
    <div>
      <h1>Élèves</h1>
      <Suspense fallback={<StudentsTableSkeleton />}>
        <StudentsTable /> {/* Fetch dans ce Server Component enfant */}
      </Suspense>
    </div>
  );
}
```

### 4.2 Fichiers Spéciaux Obligatoires par Route

| Fichier | Rôle | Priorité |
|---------|------|---------|
| `loading.tsx` | Skeleton affiché pendant le streaming | Haute |
| `error.tsx` | UI d'erreur récupérable (`"use client"` + `reset()`) | Haute |
| `not-found.tsx` | Page 404 branded | Haute |
| `global-error.tsx` | Erreur root layout (doit remplacer le layout) | Moyenne |

```tsx
// app/[locale]/dashboard/error.tsx
"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function DashboardError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
    // captureException(error); // Sentry
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p className="text-destructive">Une erreur est survenue</p>
      <Button type="button" onClick={reset}>Réessayer</Button>
    </div>
  );
}
```

### 4.3 Optimistic Updates (useOptimistic)

```tsx
"use client";
import { useOptimistic, useTransition } from "react";

export function StudentsClientView({ initialStudents }: { initialStudents: Student[] }) {
  const [optimisticStudents, addOptimisticStudent] = useOptimistic(
    initialStudents,
    (state, newStudent: Student) => [...state, newStudent]
  );
  const [isPending, startTransition] = useTransition();

  const handleCreate = (formData: CreateStudentInput) => {
    startTransition(async () => {
      addOptimisticStudent({ ...formData, id: "temp-id", createdAt: new Date() } as Student);
      await createStudentAction(formData);
    });
  };

  return (
    <ul aria-busy={isPending}>
      {optimisticStudents.map((s) => <StudentRow key={s.id} student={s} />)}
    </ul>
  );
}
```

### 4.4 Images — next/image (OBLIGATOIRE)

```tsx
import Image from "next/image";

// ✅ Toujours utiliser next/image
// - priority sur les images above-the-fold (LCP)
// - sizes pour le responsive
<Image
  src={student.avatarUrl}
  alt={`Photo de ${student.firstName} ${student.lastName}`}
  width={40}
  height={40}
  priority // Sur les images visibles au premier rendu
  sizes="(max-width: 768px) 40px, 40px"
  className="rounded-full"
/>

// ❌ INTERDIT
<img src={student.avatarUrl} alt="..." />
```

### 4.5 Dynamic Imports (Code Splitting)

```tsx
import dynamic from "next/dynamic";

// Composants lourds (charts, PDF viewer, éditeur riche) — ne pas bundler côté serveur
const RechartsWidget = dynamic(
  () => import("@/components/dashboard/widgets/RechartsWidget"),
  { loading: () => <ChartSkeleton />, ssr: false }
);

const PDFViewer = dynamic(
  () => import("@/components/ui/PDFViewer"),
  { ssr: false }
);
```

---

## 5. Base de Données (Prisma 6)

### 5.1 Requêtes — Règles

```ts
// ❌ N+1 — INTERDIT
const students = await prisma.student.findMany();
for (const s of students) {
  const groups = await prisma.group.findMany({ where: { studentId: s.id } }); // N+1 !
}

// ✅ CORRECT — Include ou select ciblé
const students = await prisma.student.findMany({
  where: { etablissementId: tenantId },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    groups: { select: { id: true, name: true } }, // Include ciblé
  },
});
```

### 5.2 Transactions

```ts
// Grouper les mutations liées dans une transaction
await prisma.$transaction(async (tx) => {
  const payment = await tx.payment.create({ data: paymentData });
  await tx.tranche.update({
    where: { id: data.trancheId },
    data: { status: "PAID", paidAt: new Date() },
  });
  // Si une étape échoue → rollback automatique
  return payment;
});
```

### 5.3 Client Multi-Tenant (tenantPrisma)

```ts
// src/lib/prisma.ts — Client avec middleware de sécurité tenant
import { PrismaClient, Prisma } from "@prisma/client";

function createTenantClient(tenantId: string) {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, model, operation }: {
          args: Prisma.Args<typeof prisma[keyof typeof prisma], string>;
          query: (args: unknown) => Promise<unknown>;
          model: string;
          operation: string;
        }) {
          // Inject automatiquement le filtre tenant sur toutes les lectures
          if (["findMany", "findFirst", "count", "aggregate"].includes(operation)) {
            (args as Record<string, unknown>).where = {
              ...(args as { where?: Record<string, unknown> }).where,
              etablissementId: tenantId,
            };
          }
          return query(args);
        },
      },
    },
  });
}

// Cache avec TTL pour éviter trop de connexions
const clientCache = new Map<string, { client: ReturnType<typeof createTenantClient>; createdAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function tenantPrisma(tenantId: string) {
  const cached = clientCache.get(tenantId);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return cached.client;
  }
  const client = createTenantClient(tenantId);
  clientCache.set(tenantId, { client, createdAt: Date.now() });
  return client;
}
```

---

## 6. Pipeline de Test (Standard 2026)

### 6.1 Tableau des outils

| Étape | Outil | Ce qu'il vérifie | Commande |
|-------|-------|-----------------|---------|
| **Saisie** | **Zod 4** | Validité, sécurité, injections | intégré aux actions |
| **Qualité** | **Biome** | Syntaxe, formatage, imports | `biome check ./src` |
| **A11y** | **Axe Core / Storybook** | WCAG 2.2 AA | `storybook test` |
| **Unitaire** | **Vitest 4** | Logique pure, schémas Zod | `vitest run` |
| **Intégration** | **Vitest + MSW** | Actions, mocking réseau | `vitest run` |
| **E2E** | **Playwright** | Parcours complets | `playwright test` |
| **Composants** | **Storybook 10** | Rendu isolé, interactions | `storybook dev` |
| **Sécurité** | **Snyk / Socket** | CVE, supply chain | CI/CD |

### 6.2 Template Test Unitaire (Vitest)

```ts
// src/__tests__/actions/students.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createStudentAction } from "@/actions/students.actions";
import { mockSession } from "@/__tests__/helpers/auth.helpers";

describe("createStudentAction", () => {
  beforeEach(() => {
    mockSession({ role: "ADMIN", etablissementId: "etab-123" });
  });

  it("crée un élève avec des données valides", async () => {
    const result = await createStudentAction({
      firstName: "Ahmed",
      lastName: "Benali",
      dateOfBirth: new Date("2010-05-15"),
    });
    expect(result.data).toBeDefined();
    expect(result.data?.etablissementId).toBe("etab-123"); // Multi-tenant vérifié
  });

  it("rejette si non authentifié", async () => {
    mockSession(null);
    const result = await createStudentAction({ firstName: "Ahmed", lastName: "Benali" });
    expect(result.error).toBe("Non autorisé");
  });

  it("rejette les données invalides (Zod)", async () => {
    const result = await createStudentAction({ firstName: "", lastName: "" }); // Invalide
    expect(result.fieldErrors).toBeDefined();
  });
});
```

### 6.3 Template Test E2E (Playwright)

```ts
// tests/students.spec.ts
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth.helpers";

test.describe("Gestion des élèves", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin@taysir.dz");
  });

  test("créer un élève et le voir dans la liste", async ({ page }) => {
    await page.goto("/fr/dashboard/students");
    await page.getByRole("button", { name: "Nouvel élève" }).click();
    await page.getByLabel("Prénom").fill("Ahmed");
    await page.getByLabel("Nom").fill("Benali");
    await page.getByRole("button", { name: "Enregistrer" }).click();

    await expect(page.getByRole("row", { name: /Ahmed Benali/ })).toBeVisible();
  });
});
```

---

## 7. Observabilité & Logging

### 7.1 Erreurs (Sentry)

```ts
// src/lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

export function captureActionError(error: unknown, context: Record<string, unknown>) {
  Sentry.captureException(error, { extra: context });
}

// Dans chaque action :
try {
  // ...
} catch (error) {
  captureActionError(error, { action: "createStudentAction", tenantId });
  return { error: "Erreur interne" }; // Jamais exposer le message d'erreur brut au client
}
```

### 7.2 Logs Structurés (pino)

```ts
// src/lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "taysir-api" },
  formatters: { level: (label) => ({ level: label }) },
  // En production : JSON ; en dev : pretty print
  transport: process.env.NODE_ENV === "development"
    ? { target: "pino-pretty" }
    : undefined,
});

// Usage dans les actions :
logger.info({ tenantId, studentId }, "Student created");
logger.error({ tenantId, error: String(error) }, "Failed to create student");
```

---

## 8. Accessibilité (WCAG 2.2 AA)

```tsx
// Règles obligatoires :

// 1. Tous les <button> hors-formulaire ont type="button"
<button type="button" onClick={handleClick}>Action</button>

// 2. Tous les inputs ont un label associé
<label htmlFor="firstName">Prénom</label>
<input id="firstName" name="firstName" type="text" />

// 3. Les divs cliquables ont role + keyboard handler
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === "Enter" && handleClick()}
>
  Cliquer
</div>

// 4. Liens externes — rel sécurisé
<a href={externalUrl} target="_blank" rel="noopener noreferrer">
  Lien externe
</a>

// 5. Images — alt descriptif
<Image alt={`Photo de ${student.firstName}`} ... />
// Image décorative :
<Image alt="" aria-hidden="true" ... />

// 6. Textes screen-reader only
<span className="sr-only">Supprimer l'élève {student.firstName}</span>
```

---

## 9. Internationalisation (next-intl)

```tsx
// ❌ INTERDIT — texte en dur
<p>Bienvenue sur Taysir</p>
<button>Supprimer</button>
<span>Erreur de connexion</span>

// ✅ OBLIGATOIRE — Server Component
import { getTranslations } from "next-intl/server";
const t = await getTranslations("Dashboard");
<p>{t("welcome")}</p>

// ✅ OBLIGATOIRE — Client Component
"use client";
import { useTranslations } from "next-intl";
const t = useTranslations("Students");
<button type="button">{t("delete")}</button>

// Support RTL (Arabe) — dans le layout
<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
```

---

## 10. UI/UX (Organic IT Design System)

```tsx
// Composants avec la classe bento-card
<div className="bento-card rounded-2xl p-6">...</div>

// Palette Organic IT
// Cloud Dancer  → Surface (fond)       : bg-cloud-dancer
// Deep Emerald  → Accent (CTA)         : bg-deep-emerald text-white
// Neural Cyan   → Active (état sélec.) : text-neural-cyan border-neural-cyan

// Skeletons TOUJOURS présents pour les états de chargement
import { Skeleton } from "@/components/ui/Skeleton";
// loading.tsx par route OU <Suspense fallback={<Skeleton />}>

// Framer Motion — animations légères uniquement
import { motion } from "framer-motion";
// Toujours respecter prefers-reduced-motion
const shouldReduceMotion = useReducedMotion();
```

---

## 11. TypeScript — Configuration Stricte

```jsonc
// tsconfig.json — options obligatoires
{
  "compilerOptions": {
    "strict": true,                       // active strictNullChecks, noImplicitAny, etc.
    "noUncheckedIndexedAccess": true,     // arr[0] est T | undefined
    "exactOptionalPropertyTypes": true,   // pas de undefined sur les props optionnelles
    "noImplicitOverride": true,           // méthodes override explicites
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 12. Checklist Pré-Merge (PR obligatoire)

```bash
# 1. Qualité & linting
npx @biomejs/biome check ./src --write
# → Zéro erreur attendu

# 2. Type checking
npx tsc --noEmit
# → Zéro erreur TypeScript

# 3. Tests unitaires
npx vitest run --coverage
# → 80%+ coverage sur src/actions/ et src/lib/

# 4. Build production
npx next build
# → Build sans erreur ni warning

# 5. Tests E2E
npx playwright test
# → Tous les parcours vitaux en vert
```

---

## 13. MCPs Claude Code — Configuration Recommandée

```jsonc
{
  "mcpServers": {
    "nextjs":    { "command": "npx", "args": ["-y", "next-devtools-mcp@latest"] },
    "browser":   { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] },
    "biome":     { "command": "npx", "args": ["@biomejs/biome", "lsp-proxy"] },
    "github":    { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"], "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "..." } },
    // À AJOUTER :
    "postgres":  { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-postgres", "${DATABASE_URL}"] },
    "sentry":    { "command": "npx", "args": ["-y", "@sentry/mcp-server@latest"], "env": { "SENTRY_AUTH_TOKEN": "..." } },
    "vercel":    { "command": "npx", "args": ["-y", "@vercel/mcp-adapter"], "env": { "VERCEL_TOKEN": "..." } }
  }
}
```

### Rôle des MCPs additionnels :

| MCP | Utilité concrète |
|-----|----------------|
| **server-postgres** | Inspecter le schéma réel avant d'écrire une requête Prisma. Indispensable pour éviter les erreurs de migration. |
| **sentry** | Lire les erreurs en production depuis Claude Code. Diagnostiquer sans se connecter au dashboard. |
| **vercel** | Déclencher des déploiements, inspecter les logs de build, gérer les env vars depuis Claude Code. |