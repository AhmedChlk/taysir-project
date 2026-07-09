# Recherche UI/UX — « pourquoi ça paraît lourd » + checklist Taysir

> Deep-research 2026-06-27 : 5 angles, 23 sources vérifiées, 102 claims extraits →
> **22 confirmés (vote 3-0)**, **3 réfutés (1-2)** par vérification adversariale.
> Tout est mappé sur NOTRE contexte (ERP scolaire DZ, FR/AR RTL, gérants/secrétaires,
> recouvrement). Sources clés : Nielsen Norman Group, UXPin, Pencil&Paper (data tables),
> SetProduct, Aufait (color tokens), WCAG 2.5.8, NetSuite AR dashboard, Eleken (fintech UX).

## A. Pourquoi NOS écrans paraissent lourds (diagnostic cité)

1. **Poids visuel uniforme = pas de hiérarchie.** La lourdeur naît quand taille, contraste
   et poids sont identiques partout → rien ne ressort. C'est la cause n°1, pas le « trop d'infos ».
   *(NN/g visual-hierarchy + signal-noise)* → nos 3 styles d'en-tête + KPI tous au même poids = bruit.
2. **Trop de chrome** : bordures marquées, ombres, dividers, rayons incohérents ajoutent du
   « signal parasite ». Réduire bordures et baisser le poids des séparateurs **allège** sans rien retirer.
   *(NN/g signal-noise ratio ; clusterdesign)* → nos `border-2`, ombres lourdes, rayons mélangés (`2xl/3xl/[32px]/[40px]`).
3. **Couleur sur-utilisée** : icônes KPI bleu/vert/rouge bruts = 4+ teintes qui se concurrencent.
   Un ERP doit limiter les accents et réserver la couleur au **statut sémantique**. *(Aufait color-tokens ; SetProduct)*.
4. **Surcharge** : entasser l'info nuit à la compréhension et à la décision *(UXPin ; bricxlabs)*.
   Mais ⚠️ voir réfutés — la solution n'est PAS de tout compresser.

## B. Ce qui marche (confirmé 3-0) → appliqué à Taysir

- **Hiérarchie d'abord** : un seul point focal par écran, le reste en retrait (taille/contraste/couleur).
  → Dashboard : le focal = **« Reste à recouvrer »**, pas 6 cartes égales.
- **Divulgation progressive** (progressive disclosure) : différer les champs/actions avancés, ne montrer
  que le primaire, révéler à la demande. Réduit charge cognitive. *(NN/g ; IxDF ; Lollypop)*
  → formulaires inscription/paiement : champs avancés repliés ; lignes table → détail au clic, pas tout étalé.
- **Tables > cartes pour données structurées/comparables** *(Pencil&Paper ; SetProduct)*.
  → garder DataTable pour Élèves/Paiements/Présences ; **ne pas tout transformer en cartes** (notre Paiements card-ish à revoir).
- **3 modes de densité, contrôlables par l'utilisateur** (confortable / standard / compact)
  *(Pencil&Paper data-tables)*. → secrétaire en saisie répétitive choisit « compact ».
- **Dashboards par rôle/permission** réduisent l'encombrement *(NetSuite)*.
  → gérant (vue pilotage/argent) ≠ secrétaire (saisie) ≠ intervenant (présences).
- **Focal d'un dashboard de recouvrement = créances en retard / aging** *(NetSuite AR)*.
  → Paiements : mener avec impayés + ancienneté, pas « total prévu » d'abord.

## C. Spécifique RTL / Arabe (confirmé) — important pour notre locale AR

- 🔑 **Maghreb/Algérie : chiffres arabes OCCIDENTAUX (0-9), PAS les chiffres arabes orientaux (٠١٢٣).**
  *(Wikipedia Eastern-Arabic-numerals ; vérifié 3-0)*. → en locale `ar`, garder `0-9`, NE PAS basculer en ٠١٢٣.
- **Les nombres restent LTR même en RTL** (chiffre de plus faible valeur à droite). → montants DA, dates,
  numéros de tél. ne se miroir pas ; seul le **layout** se miroir.
- Layout AR : miroir des marges/icônes directionnelles/alignements, mais pas des nombres ni des logos.

## D. Accessibilité (utilisateurs non-techniques) — confirmé

- **Cibles tactiles/clic ≥ 24×24 px** (WCAG 2.5.8 AA) ; viser **44-48 px** pour le confort *(allaccessible ; medium WCAG)*.
  → nos boutons d'action table (22 px relance) sont **sous le minimum** → agrandir.
- Contraste AA partout ; langage clair (déjà FR simple — bien).

## E. À NE PAS faire (réfutés par l'adversaire — garde-fous)

- ❌ « Réduire à ~20 % de l'info affichée » — **réfuté (1-2)**. Trop agressif ; un ERP doit garder la
  donnée dense utile au métier. Alléger le **poids visuel**, pas supprimer la donnée.
- ❌ « Resserrer les paddings sur grille 4/8/12 px au lieu de 16-24 » — **réfuté (1-2)**. Ne pas compresser
  aveuglément ; l'espace blanc structuré porte la hiérarchie. Garder de l'air.
- ❌ « Z-pattern : important en haut-gauche, importance décroissante LTR » — **réfuté (1-2)** ET inadapté :
  on est **bilingue RTL**. Ne pas câbler l'ordre de lecture en dur LTR.

## F. Checklist applicable — Phase 2-3 Taysir

**Chrome / tokens (Phase 2)**
- [ ] Baisser le poids des bordures (`border` fin, `border-line/60`), retirer ombres lourdes, **un seul rayon** (`rounded-2xl` partout via `Card`).
- [ ] Réserver la couleur au **statut** : vert=à jour, ambre=impayé, coral=urgent/retard, teal=marque/action. Supprimer bleu/indigo bruts.
- [ ] Topbar : eyebrow = nom de page contextuel (pas « BIENVENUE »).
- [ ] Boutons d'action ≥ 36-44 px (cibles).

**Hiérarchie / contenu (Phase 3, par page)**
- [ ] 1 point focal par page (Dashboard → « Reste à recouvrer » ; Paiements → impayés + aging).
- [ ] `PageHeader` éditorial unique partout (déjà fait Élèves).
- [ ] Divulgation progressive : champs avancés repliés, détail ligne au clic.
- [ ] Tables : garder DataTable ; ajouter **toggle densité** (confortable/compact) ; actions claires.
- [ ] Dashboards par rôle.

**RTL / AR**
- [ ] Locale `ar` = chiffres **0-9** (occidentaux), jamais ٠١٢٣.
- [ ] Nombres/dates/tél. en LTR dans layout miroir.
- [ ] Vérifier miroir marges + icônes directionnelles.

## Sources (vérifiées, top qualité)
NN/g : signal-noise-ratio, progressive-disclosure, visual-hierarchy · UXPin dashboard-design ·
clusterdesign information-hierarchy · Pencil&Paper enterprise-data-tables · SetProduct data-table-ui ·
Aufait color-tokens · Stephanie Walter data-tables · WCAG 2.5.8 target-size (allaccessible) ·
Eastern-Arabic-numerals (Wikipedia) · NetSuite AR dashboard · Eleken fintech-ux · Creatrix fee-management.
