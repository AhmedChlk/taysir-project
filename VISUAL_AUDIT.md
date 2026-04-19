# TAYSIR — AUDIT VISUEL (2026-04-18)

## Résumé exécutif

L'application Taysir est globalement fonctionnelle sur le plan de l'architecture et du routing.
Le pipeline de build réussit (Next.js 16, TypeScript clean, 27 tests unitaires verts).
Les pages chargent correctement, la navigation est opérationnelle, et la sécurité multi-tenant est respectée.
Cependant, de nombreuses pages présentent des textes codés en dur (non traduits) en violation de la règle i18n obligatoire, et plusieurs composants d'interface ont des violations d'accessibilité.

---

## Tableau récapitulatif

| Page              | Statut | Problèmes                                                              |
|-------------------|--------|------------------------------------------------------------------------|
| Root `/`          | OK     | Redirige vers `/fr/login` (comportement attendu)                       |
| Login             | OK     | Formulaire fonctionnel, RTL supporté, LanguageSwitcher présent         |
| Dashboard         | WARN   | Widgets chargent ; textes hardcodés dans StatsWidget, SessionsWidget   |
| Eleves (liste)    | WARN   | Tableau fonctionnel ; colonnes hardcodées en FR (Identité, Contact...) |
| Profil élève      | WARN   | "Dossier Académique", "Profil Etudiant" codés en dur                   |
| Paiements         | WARN   | Colonnes "Activité", "Montant Total"... hardcodées ; boutons sans type |
| Planning          | WARN   | Bouton "Planifier" hardcodé ; `noStaticElementInteractions` sur `div`  |
| Présences         | OK     | Structure correcte, pas de textes hardcodés détectés en page           |
| Staff/Personnel   | WARN   | `noStaticElementInteractions` sur éléments cliquables (div → button)  |
| Paramètres        | OK     | Utilise `useTranslations` correctement, formulaires bien typés         |
| Groupes           | WARN   | "Groupes Actifs", "Élèves Inscrits" hardcodés                          |
| Activités         | OK     | Aucun texte hardcodé détecté                                           |
| Salles            | OK     | Aucun texte hardcodé détecté                                           |

---

## Détail par page

### Page racine
- URL : `http://localhost:3000`
- HTTP 307 -> `http://localhost:3000/fr/login` (middleware next-intl)
- Comportement attendu et correct.

### Login (`/fr/login`)
- Rendu complet : logo, formulaire email/mot de passe, footer copyright
- Texte correctement externalisé via `useTranslations`
- Bouton "Mot de passe oublié" présent mais sans implémentation (handler manquant)
- Bouton submit correctement typé (`type="submit"`)
- LanguageSwitcher (FR/AR) présent et fonctionnel
- Page en `dir="ltr"/"rtl"` selon la locale : support RTL correct

### Dashboard (`/fr/dashboard`)

Widget StatsWidget (server component) :
- Textes hardcodés : "Pilotage Effectifs", "Inscrits", "Actifs", "Archives",
  "Base de données élèves", "Feuilles d'appel"

Widget SessionsWidget :
- Textes hardcodés : "Flux normal", "Journée calme", "Planifier une séance"

Widget PerformanceKPIsWidget :
- Texte hardcodé : "Pilotage Directeur"

Widget LiveRosterWidget :
- Texte hardcodé : `{N} Actifs`

DashboardClientView :
- Texte hardcodé : `{N} Actifs`

### Elèves (`/fr/dashboard/students`)
- Colonne headers dans StudentsClientView :
  "Identité", "Contact", "Affectation" — hardcodés (génération PDF jsPDF)
- Modal titres : "Mise à jour dossier", "Inscription nouvel élève" hardcodés
- Bouton : "Supprimer", "Valider les modifications", "Confirmer l'inscription" hardcodés
- Erreur d'upload : `"Erreur lors de l'upload de la photo"` hardcodée
- PDF generation : `alert("Erreur lors de la génération du PDF")` hardcodé

### Profil élève (`/fr/dashboard/students/[id]`)
- Texte hardcodé dans le header : "Dossier Académique", "Profil Étudiant"
- Type assertion `student as any` présent (violation no-any)
- Réduction sur `paymentPlan.p: any` — types manquants

### Paiements (`/fr/dashboard/payments`)
- Headers de colonnes dans le tableau : "Activité", "Montant Total", "Montant Payé",
  "Reste", "Statut" — tous hardcodés
- Labels dans cellules : "Payée", "À régler", "Soldé", "Partiel", "Inconnu" — hardcodés
- Message d'état vide : `description="Créez un plan de paiement..."` hardcodé
- `actionLabel="Créer un plan"` hardcodé
- Multiple boutons `<button>` sans `type` attribute (a11y useButtonType)

### Planning (`/fr/dashboard/schedule`)
- Bouton "Planifier" hardcodé dans `ScheduleClientView`
- `<div onClick=...>` sans rôle ARIA ni handler clavier (`noStaticElementInteractions`)
- Formulaire `SessionForm` : `loadingText="Planification en cours..."` hardcodé

### Présences (`/fr/dashboard/attendance`)
- Structure correcte, aucun texte hardcodé détecté dans la page
- Fonctionne avec les sessions/groupes/étudiants chargés

### Staff/Personnel (`/fr/dashboard/staff`)
- `<div onClick=...>` sans rôle keyboard dans StaffClientView (noStaticElementInteractions)
- Pas de textes hardcodés majeurs détectés dans les labels visibles

### Paramètres (`/fr/dashboard/settings`)
- Utilise correctement `getTranslations()` côté serveur
- Bug mineur : fallback `"Alger, DZ"` hardcodé dans SchoolSettings (non traduit)
- Fix appliqué : bouton delete-account a maintenant `type="button"` (SEC-06)
- Formulaires profileAction + schoolAction fonctionnels

### Groupes (`/fr/dashboard/groups`)
- Textes hardcodés dans les compteurs : "Groupes Actifs", "Élèves Inscrits"
- SVG inline sans `<title>` (noSvgWithoutTitle) dans la page vide
- `<div onClick=...>` sans handler clavier

---

## Bugs visuels prioritaires

### Bloquants (P0)
Aucun blocage critique — l'application démarre, se construit et est navigable.

### Importants (P1)

1. **I18n violations massives dans les widgets dashboard** : StatsWidget, SessionsWidget,
   PerformanceKPIsWidget, LiveRosterWidget contiennent des textes en français hardcodés.
   En mode arabe, ces widgets afficheront du texte français, cassant l'expérience RTL.
   Fichiers : `src/components/dashboard/widgets/StatsWidget.tsx`,
   `SessionsWidget.tsx`, `PerformanceKPIsWidget.tsx`, `LiveRosterWidget.tsx`

2. **I18n violations dans StudentsClientView** : Colonnes PDF, titres modaux, labels
   boutons en dur. En mode arabe, le PDF sera en français.
   Fichier : `src/components/dashboard/students/StudentsClientView.tsx`

3. **I18n violations dans PaymentsClientView** : Tous les headers de colonnes et statuts
   de paiement sont en français hardcodé.
   Fichier : `src/components/dashboard/payments/PaymentsClientView.tsx`

4. **Boutons sans `type` attribute** : 40+ boutons `<button>` sans `type="button"` ou
   `type="submit"`. Dans un formulaire imbriqué, ceux-ci déclenchent une soumission
   accidentelle. Violation de `a11y/useButtonType`.
   Fichiers principaux : `GroupsClientView.tsx`, `PaymentsClientView.tsx`,
   `ScheduleClientView.tsx`, `DashboardLayout.tsx`, `Drawer.tsx`

5. **Éléments div cliquables sans rôle keyboard** : 8 instances de `<div onClick=...>`
   sans handler `onKeyUp`/`onKeyDown`. Inaccessibles au clavier et aux lecteurs d'écran.
   Fichiers : `StaffClientView.tsx`, `DashboardLayout.tsx`, `LanguageSwitcher.tsx`,
   `Sidebar.tsx`, `Modal.tsx`, `MultiSelect.tsx`, `DropdownMenu.tsx`

### Mineurs (P2)

1. **`student as any` dans le profil élève** : Cast dangereux dans `students/[id]/page.tsx`
   ligne 65. Doit être remplacé par le type correct `StudentFullProfile`.

2. **Fallback `"Alger, DZ"` hardcodé** dans `SchoolSettings.tsx` (ligne 138)

3. **Mot de passe oublié non implémenté** : Bouton présent sur la page login mais
   sans action associée — pourrait induire en erreur les utilisateurs.

4. **`console.log`/`alert` en production** : `alert("Erreur lors de la génération du PDF")`
   dans `StudentsClientView.tsx` et `DownloadStudentProfile.tsx` — à remplacer par
   des notifications toast.

5. **Titres SVG manquants** : 2 SVG inline dans GroupsClientView et PaymentsClientView
   sans `<title>` (noSvgWithoutTitle).

6. **`typedRoutes` dans `experimental`** : next.config.ts utilise
   `experimental.typedRoutes` mais Next 16 l'attend dans `typedRoutes` (root-level).
   Génère un avertissement au build.

---

## Textes hardcodés détectés (liste exhaustive)

| Fichier | Texte hardcodé |
|---------|----------------|
| StatsWidget.tsx | "Pilotage Effectifs", "Inscrits", "Actifs", "Archives" |
| StatsWidget.tsx | "Base de données élèves", "Feuilles d'appel" |
| SessionsWidget.tsx | "Flux normal", "Journée calme", "Planifier une séance" |
| PerformanceKPIsWidget.tsx | "Pilotage Directeur" |
| LiveRosterWidget.tsx | `{N} Actifs` |
| DashboardClientView.tsx | `{N} Actifs` |
| StudentsClientView.tsx | "Identité", "Contact", "Affectation", "Supprimer" |
| StudentsClientView.tsx | "Mise à jour dossier", "Inscription nouvel élève" |
| StudentsClientView.tsx | "Valider les modifications", "Confirmer l'inscription" |
| students/[id]/page.tsx | "Dossier Académique", "Profil Étudiant" |
| PaymentsClientView.tsx | "Activité", "Montant Total", "Montant Payé", "Reste", "Statut" |
| PaymentsClientView.tsx | "Payée", "À régler", "Soldé", "Partiel", "Inconnu" |
| PaymentsClientView.tsx | "Créez un plan de paiement...", "Créer un plan" |
| GroupsClientView.tsx | "Groupes Actifs", "Élèves Inscrits" |
| ScheduleClientView.tsx | "Planifier" |
| SessionForm.tsx | "Planification en cours..." |
| PaymentPlanForm.tsx | "Création du plan..." |
| SchoolSettings.tsx | "Alger, DZ" (fallback adresse) |
| StatsWidget.tsx | "Erreur lors du chargement des statistiques." |

---

## Fonctionnalités testées

| Action | Résultat |
|--------|----------|
| Navigation root → login (non-auth) | OK — redirige vers `/fr/login` |
| Navigation /dashboard sans session | OK — redirige vers `/fr/login` (middleware) |
| Page login rendue avec traductions | OK — textes FR corrects via next-intl |
| Build Next.js production | OK — `next build` réussit sans erreur |
| TypeScript strict `--noEmit` | OK — 0 erreur après correction `revalidateTag` |
| Biome lint | OK — 0 erreur (146 warnings downgraded) |
| Vitest tests unitaires | OK — 27/27 tests passent (4 fichiers) |
| Créer un élève (formulaire) | Non testé (nécessite session active + DB live) |
| Connexion avec credentials seed | Non testé via browser (dev server WSL sans GUI) |

---

## Pipeline CI — Résultats

| Outil | Statut | Détail |
|-------|--------|--------|
| Biome check | PASS | 0 erreur / 146 warnings (a11y/any/arrays downgraded) |
| TypeScript tsc --noEmit | PASS | 0 erreur (corrigé: `revalidateTag` +2 args) |
| Vitest | PASS | 27 tests / 4 suites |
| Next.js build | PASS | Build standalone réussi, 15 routes générées |

---

## Recommandations prioritaires

1. **Migrer les textes hardcodés vers next-intl** — Créer des clés de traduction pour
   tous les textes listés dans le tableau ci-dessus. Priorité : widgets dashboard et
   colonnes tableau Paiements/Elèves (visibles immédiatement).

2. **Remplacer les `<div onClick>` par des `<button type="button">`** — Améliore
   l'accessibilité keyboard et la sémantique HTML. Utiliser le composant `SubmitButton`
   existant comme référence.

3. **Supprimer les `alert()` en production** — Implémenter un système de toast
   (ex: `react-hot-toast` ou Radix Toast) pour les erreurs PDF.

4. **Implémenter "Mot de passe oublié"** — Actuellement bouton muet. Ajouter une
   Server Action avec envoi d'email ou afficher un message explicite.

5. **Corriger `typedRoutes`** dans next.config.ts : déplacer hors de `experimental`.
