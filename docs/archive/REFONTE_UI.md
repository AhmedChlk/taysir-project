# Refonte UI/UX — Dashboard Taysir

> Audit du 2026-06-27. Walkthrough visuel (connecté `admin@taysir.dz`, app sur `:3001`)
> + cartographie du code. Objectif : app **plus propre, cohérente, UI/UX pro**, sur le
> design system **Petrol & Brass** déjà posé pour la landing.

## 1. Constat — 3 vocabulaires de couleur coexistent

| Système | Usage | Problème |
|---|---|---|
| Tokens neufs (`brand-*`, `ink-*`, `surface-*`) | Élèves, Planning, Sidebar | ✅ cible, mais sous-exposés dans `@theme` |
| Legacy `taysir-*` (134×) | Topbar, Drawer, DropdownMenu, Skeleton, MultiSelect | ❌ **non définis** dans `@theme`/tailwind → classes no-op |
| Tailwind brut (`gray` 153×, `blue`, `red`, `amber`) | Présences, Settings, Paiements (KPI) | ❌ hors charte, gris omniprésent |

`@theme` (globals.css L175-192) n'expose que `brand-900/700/500/300/50`, `ink-*`, `surface-0/50/100`.
**Manquent en utilitaires** : `accent`, `brass`, `line`, `surface-200`, `brand-400/600/800`.

## 2. Constat — pas de couche primitive

Aucun `Card`, `Button`, `PageHeader`, `StatCard` partagé. Chaque page réinvente
en-têtes, cartes, rayons (`rounded-2xl/3xl/[32px]/[40px]`), ombres → divergence par fichier.
`PaymentCard` et `StudentCard` = **morts** (0 import).

## 3. Constat visuel — incohérences d'en-tête (3 paradigmes)

- **Éditorial** (grand titre bi-ton + eyebrow + sous-titre) : Élèves « Gestion des **Inscriptions** », Planning « Agenda de l'**Établissement** ». ✅ le plus beau.
- **Compact** (icône + petit titre + ligne grise) : Paiements, Présences. ❌ pauvre.
- Padding-top incohérent : Présences collée à la topbar, les autres respirent.

Autres : KPI icônes bleu/vert/rouge bruts (pas tokens) · 2 paradigmes de table
(`DataTable` 6 pages vs tables hand-rolled payments/attendance/schedule) ·
topbar eyebrow figé « BIENVENUE » sur toutes les pages.

## 4. Bugs trouvés pendant l'audit

- 🔴 **i18n manquante** : `schedule_manage_title` → clé brute `SCHEDULE_MANAGE_TITLE` visible sur Planning + 4 erreurs console (`IntlError: MISSING_MESSAGE`).
- 🟠 **Dates incohérentes** : Élèves `4/24/2026` (format US) vs Présences `06/05/2026` — pas de formatage FR centralisé.
- 🟠 **Calendrier** démarre à `00:00` (devrait cadrer heures ouvrées ~8:00).
- 🟠 **Recharts** : warnings `width(-1)/height(-1)` (chart dans conteneur 0px) sur dashboard/payments.

---

## Plan de refonte — par phases (foundation → primitives → pages)

### Phase 0 — Socle tokens (1 passe, débloque tout) ⭐ commencer ici
- Étendre `@theme` : exposer `accent`, `brass`, `line`, `surface-200`, `brand-400/600/800`.
- **Tuer `taysir-*`** : mapper/remplacer les 134 occurrences vers les tokens (topbar, Drawer, DropdownMenu, MultiSelect, Skeleton). Unifie le chrome.
- 1 helper de format date/montant FR-DZ centralisé (`dd/MM/yyyy`, `… DA`).
- Fix `schedule_manage_title` (fr.json + ar.json).

### Phase 1 — Primitives partagées
- `Card`, `Button` (variants primary/secondary/ghost), `PageHeader` (paradigme **éditorial** généralisé), `StatCard` (KPI tokenisé), `SectionEmpty`.
- Réconcilier sur **un seul** `DataTable` ; retirer les tables hand-rolled.
- Supprimer `PaymentCard`/`StudentCard` morts.

### Phase 2 — Refonte chrome (shell)
- Topbar : eyebrow contextuel (nom de page) au lieu de « BIENVENUE », tokens, densité.
- Sidebar : déjà sur tokens — polish espacement/active state.
- Layout : padding-top de page uniforme.

### Phase 3 — Pages, dans l'ordre d'impact
1. **Tableau de Bord** (1ère vue) — grille widgets, hiérarchie, motion d'entrée.
2. **Paiements** (cœur métier DZ) — header éditorial, KPI tokenisés, DataTable, vue recouvrement.
3. **Présences** — du barebones → table propre, statuts colorés tokens.
4. **Settings** — sortir du gris brut.
5. Élèves / Groupes / Salles / Staff / Activités — alignement (déjà proches).
6. **Planning** — thématiser le calendrier, cadrer heures ouvrées.

### Phase 4 — Finitions
- États vides cohérents · skeletons de chargement · micro-motion (TARTEEB) ·
  purge erreurs console · responsive.

---

## Ordre recommandé
**Phase 0 → 1 → 2 → 3.** Le socle (0+1) fait que chaque page suivante hérite du style
automatiquement → « ça ne casse plus tout à chaque modif ». On valide page par page en Phase 3.
