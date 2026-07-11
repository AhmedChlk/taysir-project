# Design System — Taysir

> Source unique de vérité visuelle : `src/app/[locale]/globals.css` (Tailwind v4
> CSS-first, tokens dans `:root` + exposés à Tailwind via `@theme`). **Aucun
> `tailwind.config` ni `components.json`.** Toute valeur ci-dessous existe dans
> le code — voir `:root` de `globals.css` pour les hex.

## Aesthetic direction
Éditorial algérien : encre **pétrole** profonde sur canvas **os saharien** chaud (jamais blanc clinique), ponctuée de deux accents chauds — **corail kabyle** (action/urgence) et **laiton antique** (premium, surfaces sombres uniquement). Titres en display condensé industriel, corps en serif slab chaleureux, chiffres en face tabulaire ; géométrie zellige, ombres teintées pétrole. Motion « TARTEEB » sobre (chaos → ordre), une pulsation = un cours.

## Color
Palette « Petrol & Brass — Deep Zellige ». Classe Tailwind = `-{token}` (ex. `bg-brand-500`) **uniquement pour les tokens exposés dans `@theme`**.

| Token (Tailwind) | Hex | Rôle | Exposé `@theme` |
|---|---|---|---|
| `brand-900` | `#0b2a30` | Encre/surface sombre (hero, sidebar, footer) | ✅ |
| `brand-800` | `#0e3a42` | Surface sombre (sidebar cards) | ✅ |
| `brand-700` | `#114c57` | Brand dark, hover bouton | ✅ |
| `brand-600` | `#135c68` | Hover bouton sur clair | ✅ |
| `brand-500` | `#157180` | **CORE** — liens, actif, focus rings | ✅ |
| `brand-400` | `#2ba0a6` | Glaçure turquoise zellige (icônes/charts sur sombre) | ✅ |
| `brand-300` | `#79b3bc` | Disabled/subtil | ✅ |
| `brand-50` | `#e2f0f0` | Wash (badges, halo hover) | ✅ |
| `accent` | `#d5573b` | Corail — fill/urgence (texte blanc grand format seul) | ✅ |
| `accent-ink` / `accent-600` | `#b8442a` | Corail TEXTE/lien sur clair (AA 4.79) ; bg bouton | ✅ |
| `accent-50` | `#fbe8e1` | Wash corail | ✅ |
| `brass` / `brass-bright` | `#c6a24a` / `#d4b25e` | Laiton — **fill/surface sombre uniquement**, jamais petit texte sur canvas | ✅ |
| `ink-900` | `#221c18` | Corps (AAA 14.96) | ✅ |
| `ink-800`/`700` | `#3d362e` | Secondaire (AAA 10.57) | ✅ |
| `ink-500` | `#6b6253` | Muté / micro-labels (AA 5.33) | ✅ |
| `ink-400` | `#8a8273` | Placeholder / **disabled uniquement** (3.8:1 — pas pour du texte informatif) | ✅ |
| `surface-0` | `#f6f1e7` | **CANVAS** (bg page par défaut, remplace le blanc) | ✅ |
| `surface-50` | `#fbf7ef` | Card | ✅ |
| `surface-100` | `#efe7d6` | Raised | ✅ |
| `surface-200` | `#e2d6be` | Fill sur chaud | ✅ |
| `surface-white` | `#ffffff` | Chrome produit / tables | ✅ |
| `line` / `line-soft` | `#cbbfa6` / `#e2d6be` | Bordures | ✅ |
| `success` / `success-50` | `#0a7d33` / `#dcefdf` | Vert drapeau | ✅ (`text-success`…) |
| `warning` / `warning-ink` / `warning-50` | `#e1a33a` / `#6b5414` / `#fbefd6` | Safran — fill/icône ; texte foncé sur wash | ✅ |
| `danger` / `danger-50` | `#c8311f` / `#f8e0da` | Rouge drapeau | ✅ |
| `info` | `#157180` | = brand-500 | ✅ |

Gradients (var CSS) : `--grad-hero` (radial pétrole), `--grad-brand` (linéaire 114c57→157180→2ba0a6), `--grad-premium` (135° laiton→corail).

## Typography
next/font (Google), variables déclarées dans `src/app/[locale]/layout.tsx`.

| Rôle | Famille | Utility (`@theme`) | Graisses | Usage |
|---|---|---|---|---|
| Display / titres | Big Shoulders Display | `font-display` | 700 | `h1..h6`, `.t-display`, `.t-h1` |
| **Corps / UI (SERIF)** | Petrona (serif slab) | `font-body` | 400 / 600 | body (défaut html), labels, boutons |
| Chiffres + Arabe UI | Vazirmatn | `font-numeric` (`--font-arabic` = idem) | tabular (`tnum`,`lnum`) via `.t-num` | DA, %, colonnes ; UI arabe |
| Display arabe | Reem Kufi | `--font-arabic-display` (var) | — | titres en `ar` |
| Mono | JetBrains Mono | `font-mono` | — | code/mono |

> ⚠️ La face de corps est une **SERIF** (Petrona). Le token s'appelle `font-body` (jamais `font-sans`) pour qu'aucun lecteur ne suppose sans-serif. Fallback = serif (Georgia).

**Type scale** (`size / line-height`) : display `72/76` · h1 `48/54` · h2 `32/40` · h3 `22/30` · body-lg `18/28` · body `16/26` · small `14/22` · eyebrow `12/16`.
Tracking : tight `-0.02em` · snug `-0.01em` · wide `0.12em`. Titres `letter-spacing: -0.02em`.

## Spacing / Radius / Elevation
> **Spacing** : `--s-*` en var CSS, **pas** mappé Tailwind → le code utilise l'échelle Tailwind par défaut. **Radius** : le code utilise l'échelle Tailwind par défaut (`rounded-lg`=8, `rounded-xl`=12, `rounded-2xl`=16, `rounded-3xl`=24) ; on **n'écrase pas** `--radius-sm/md/lg/xl` (cela remapperait 177 usages). Seul `--radius-4xl`=32px est ajouté. **Ombres** exposées.

| Groupe | Tokens |
|---|---|
| Spacing (8pt base, 4pt quart) | `--s-1..24` = 4·8·12·16·20·24·32·40·56·80·96·128 px (var CSS) |
| Radius (design intent) | `--r-sm 6` · `--r-md 12` · `--r-lg 16` · `--r-xl 24` · `--r-full 999` (var CSS, utilisés en `@apply`) |
| Radius (utilitaires réels) | `rounded-lg`=8 · `rounded-xl`=12 · `rounded-2xl`=16 · `rounded-3xl`=24 · **`rounded-4xl`=32** (`--radius-4xl`, exposé) |
| Elevation (teinte pétrole) | `shadow-ts-1` (1px subtil) · `shadow-ts-2` (24px -6) · `shadow-ts-3` (60px -12) — **exposés `@theme`** |

## Motion tokens
Système « TARTEEB ». Une pulsation = un cours.

| Token | Valeur | Utility | Usage |
|---|---|---|---|
| `--beat` | `120ms` | — | Unité de base |
| `--dur-micro` | `120ms` | `duration-micro` | Micro-transitions |
| `--dur-small` | `240ms` | `duration-small` | Hover / état (plafond pratique) |
| `--dur-med` | `480ms` | **aucune (volontaire)** | ⚠️ **> plafond 300ms + jamais utilisé** (`globals.css:159`). Non exposé : ne pas l'employer sur une interaction. |
| `--ease-order` | `cubic-bezier(.16,1,.3,1)` | `ease-order` | **ARRIVÉE** (workhorse) |
| `--ease-swipe` | `cubic-bezier(.7,0,.84,0)` | `ease-swipe` | **SORTIE** (décisif) |
| `--ease-zellige` | `cubic-bezier(.62,.05,0,1)` | `ease-zellige` | **GÉOMÉTRIE** (dérive puis snap) |
| `.ts-pop` | `160ms` ease-order | — | Ouverture popover (cloche, menu, langue) |

**Plafond dur** : ≤ 300ms sur toute interaction d'UI (outil de productivité). Reduced-motion : bloc global dans `globals.css` neutralise animations/transitions/scroll. Détail : `@DESIGN.md` + `.claude/skills/taysir-motion/SKILL.md`.

## Component shapes
| Composant | Fichier | Radius | Bordure | Ombre | Padding | États |
|---|---|---|---|---|---|---|
| Card | `ui/Card.tsx` | `rounded-2xl` (16px) | `border-line/70` | ts-1 (default) / ts-2 (raised) / ghost=`surface-50` | `p-5` (`pad`) | tone default/raised/ghost |
| Button (primitive) | `ui/Button.tsx` | sm `rounded-lg` · md/lg `rounded-xl` | secondary `border-line` | primary/danger `shadow-sm` | sm h-8 / md h-10 / lg h-12 | primary(brand-500)·secondary(surface-white)·ghost·danger(accent-600) ; `focus-visible:ring-2 ring-brand-500/50` ; `disabled:opacity-50` |
| Button (CSS) | `globals.css` `.btn` | `--r-sm`/`--r-md` | — | ts-1 | `.btn--md` px-6 py-2.5 | primary(brand-500)·secondary(brand-50)·ghost — **système parallèle** (cf. incohérences) |
| StatCard | `ui/StatCard.tsx` | hérite Card | hérite | ts-1→ts-2 au hover | — | `href`→lift + `ArrowUpRight` + `focus-visible:ring-2` ; sinon plat |
| Badge / statut | inline | `rounded-full` | wash + border sémantique | — | `px-2.5 py-1` | `text-[10px] uppercase tracking-widest` |
| Sidebar item | `navigation/Sidebar.tsx` | `rounded-xl` | — | actif `shadow-lg shadow-brand-900/20` | `px-4 py-3` | actif=`bg-brand-500 text-white` + point `end-2` (motion layoutId) ; inactif=`text-white/60 hover:bg-white/5` ; icône strokeWidth 1.75 |
| Input / Select / TextArea | `ui/FormInput.tsx` | `rounded-xl` | défaut `border-gray-200` → focus `border-brand-500 ring-4 ring-brand-500/10` | — | `px-4 py-3` | error(rose)·success(emerald) ; label `group-focus-within:text-brand-500` |

## Constraints
- **RTL** : `fr` (LTR défaut) + `ar` (RTL). Propriétés **logiques uniquement** (`ms-/me-/ps-/pe-/start-/end-`, `text-start/end`) ; jamais de direction en dur dans un `transform` ; icônes directionnelles → `rtl:rotate-180`.
- **Outil de productivité** : budget motion = **2 moments par écran max** ; le mouvement sert la lisibilité, pas la déco.
- **VPS 1 Go RAM** : Server Components par défaut ; `React.cache` sur les lectures répétées ; pas de dépendance lourde superflue.
- **Contraste** : micro-labels informatifs ≥ `ink-500` (AA) ; `ink-400` réservé au disabled/placeholder.

## Forbidden
- ❌ Blanc pur `#fff` comme fond de page (canvas = `surface-0`).
- ❌ Petit texte laiton (`brass`) sur canvas clair.
- ❌ Hex/rgb en dur dans un composant (utiliser un token ; si absent de `@theme`, le signaler).
- ❌ Palettes Tailwind par défaut (`gray-*`, `slate-*`, `blue-*`) pour du sémantique.
- ❌ Emoji comme icônes (SVG lucide uniquement).
- ❌ Propriétés physiques `ml-/mr-/pl-/pr-/left-/right-` quand une logique existe.
- ❌ Animation décorative sans `prefers-reduced-motion`.

## Known inconsistencies
*État réel. Les **causes racines** (tokens manquants) sont désormais corrigées dans `@theme` ; les **usages bruts** restent à migrer par codemod (non fait) :*
- **Sémantique** : tokens `success/warning/danger/info` **maintenant exposés** (`text-danger`…). Restent ~261 usages bruts à migrer (`rose` ×86, `emerald` ×63, `amber` ×47, `gray` ×42, `red` ×21).
- **Type sizes** : `text-nano` (10px) / `text-micro` (11px) **maintenant exposés**. Restent ~130 `text-[9/10/11px]` à migrer.
- **Easings / durées** : `ease-order/swipe/zellige` + `duration-micro/small` **maintenant exposés**. Restent ~59 `duration-200/300/…` à migrer.
- **Deux systèmes de boutons** : `.btn/.btn--*` (CSS) vs `<Button>` primitive — **à unifier sur un seul** (choix non tranché).
- **~224 hex en dur** dans des composants (surtout **landing** : `LiveDemo`, `MicroDemo`, `Pricing` ; aussi `AttendanceSparkline #006A67`, `SessionDetails #0F515C`) — cf. décision landing ci-dessous.
- **RTL** : ~34 propriétés physiques résiduelles (`ml-/mr-/pl-/pr-/left-/right-`) vs 29 logiques ; icônes directionnelles pas toutes miroitées.
- **Inputs** (`ui/FormInput.tsx`) : bordures `border-gray-200`/`rose`/`emerald` au lieu de `line`/`danger`/`success`.
- **Landing** : statut non tranché (drift accidentel vs identité parallèle assumée) — à décider, cf. note en fin.
