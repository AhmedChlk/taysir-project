# Taysir Design System

A design system for **Taysir** — a modern SaaS product whose brand leans calm, confident and medical‑adjacent, built around a deep teal palette and a friendly sans‑serif wordmark.

> The name *Taysir* (from Arabic تَيْسير) broadly means *"facilitation / making things easier"*. The brand promise in the source brief echoes this: a product that simplifies work for a team, with a ROI‑driven pitch ("Vous économisez 1500€/mois").

---

## Sources given

| Source | Location | Notes |
|---|---|---|
| Brand logo | `assets/logo.png` | Full lockup: cross mark + "taysir" wordmark |
| Brand brief | Conversation (FR) | Palette, section structure, references (Dropbox, Zoom, Notion) |

No Figma link or codebase was attached. All visual foundations below are derived from:
1. The logo itself (the only visual asset provided),
2. The palette specified in the brief,
3. The listed inspiration brands (Dropbox / Zoom / Notion) — which point toward a *minimal, generous, trust‑first SaaS* aesthetic.

---

## Index

Root files:
- `README.md` — this file
- `SKILL.md` — entry point for agents using this as a skill
- `colors_and_type.css` — CSS variables for colors, type ramp, spacing, radii, shadow
- `assets/` — logos and brand marks
- `fonts/` — (currently empty; fonts pulled from Google Fonts, see Type section)
- `preview/` — small HTML cards that populate the Design System tab
- `ui_kits/landing/` — high‑fidelity recreation of the Taysir marketing landing page
  - `index.html` — full landing page demo (interactive)
  - `Navbar.jsx`, `Hero.jsx`, `MicroDemo.jsx`, `ROISimulator.jsx`, `Pricing.jsx`, `Footer.jsx`, `Primitives.jsx`

No slide template was attached → no `slides/` folder.

---

## Content fundamentals

The brief is written in **French**; copy for the product surface should be in French too. Tone guidance, derived from the brief + the reference brands:

- **Voice:** calm, confident, outcome‑focused. "Vous économisez 1500€/mois" style — concrete numbers, no hype words.
- **Person:** **vouvoiement** ("vous") — respectful, B2B register. Never "tu".
- **Casing:** sentence case everywhere. *"Commencer"*, *"Le plus populaire"*, *"Créez votre premier espace"* — never ALL CAPS, never Title Case On Every Word.
- **Length:** headlines are short and declarative (≤ 7 words), supported by one calm subtitle (~ 15–20 words). CTA labels are one verb ("Commencer", "Essayer", "Créer un compte").
- **Numbers:** kept literal, unit inline, French formatting — `1 500 €/mois`, `20 %`, `7 j d'essai`. No fake precision ("approximately ~1,487.3€"); round, confident values.
- **Emoji:** **not used** in product surfaces. Keep them out of buttons, headings and body. Small vector icons (check, chevron, cross) carry the same visual beat.
- **Vibe:** the page should *feel like a slow exhale* — lots of whitespace, one clear action per section, zero emoji‑noise, zero growth‑hack urgency. Trust over hustle.

Specific examples to anchor the voice:

| Good | Less good |
|---|---|
| *Économisez 1 500 €/mois dès la première semaine.* | *🚀 Save up to 1500€/month now!!* |
| *Commencer* | *CLICK HERE TO START FREE TRIAL →* |
| *Entrez votre email de travail* | *Pop your best email in 👇* |
| *Le plus populaire* | *🔥 MOST POPULAR PLAN 🔥* |

---

## Visual foundations

### Palette

Taken straight from the brief — a **two‑tone teal** palette on neutral surfaces.

| Token | Hex | Role |
|---|---|---|
| `--brand-900` | `#0F515C` | Dark Teal. Hero & footer backgrounds, headings on light surfaces would *not* use this — headings on light stay near‑black |
| `--brand-500` | `#1A7A89` | Teal Accent. Primary CTAs, active states, slider fill, check icons, subtle gradient stops |
| `--brand-50` | `#E6F2F4` | Light teal wash. Soft badges, hover halos on light surface |
| `--ink-900` | `#0B1220` | Near‑black for text on light |
| `--ink-700` | `#384152` | Secondary text on light |
| `--ink-500` | `#6B7280` | Muted text, captions |
| `--line` | `#E5E7EB` | Hairline borders |
| `--surface-0` | `#FFFFFF` | Pure white sections |
| `--surface-50` | `#F9FAFB` | Alternating section wash — what the brief calls *fonds secondaires* |
| `--success` | `#16A34A` | Success state (validation checks in the micro‑demo) |

Gradient used sparingly: `linear-gradient(180deg, #0F515C 0%, #134E5A 60%, #1A7A89 140%)` for the hero background; avoid rainbow / purple‑blue SaaS gradients.

### Typography

Specified type is *"typographie très large"* (Dropbox‑like). No font file was provided, so we substitute:

- **Display / UI**: `"Inter"` *(Google Fonts, 400/500/600/700)* — clean geometric sans that pairs with the rounded, friendly "taysir" wordmark.
- **Numerics (ROI display):** same Inter, `font-feature-settings: "tnum" 1, "ss01" 1;` to get tabular, humanist digits.

> ⚠️ **Substitution flagged** — Inter is the nearest Google Fonts match to the logo's soft geometric sans. If Taysir actually uses a specific typeface (e.g. DM Sans, Gilroy, Nunito, or a custom wordmark font), please upload the `.ttf`/`.woff2` to `fonts/` and we'll swap the `@import`.

Scale (use the CSS variables in `colors_and_type.css`):

| Token | Size / line‑height | Weight | Use |
|---|---|---|---|
| `--t-display` | 72 / 76 | 700 | Hero headline |
| `--t-h1` | 48 / 54 | 700 | Section titles |
| `--t-h2` | 32 / 40 | 600 | Sub‑section titles |
| `--t-h3` | 22 / 30 | 600 | Card titles |
| `--t-body-lg` | 18 / 28 | 400 | Hero subtitle, marketing body |
| `--t-body` | 16 / 26 | 400 | Default body |
| `--t-small` | 14 / 22 | 500 | Captions, meta |
| `--t-eyebrow` | 12 / 16 | 600, +0.12em tracking, uppercase | Section eyebrows |

Letter‑spacing: `-0.02em` on display, `-0.01em` on h1/h2, `0` on body. Never tighten body text.

### Spacing

8‑pt baseline grid. Variables `--s-1` .. `--s-16` step by 4px→128px. Section vertical rhythm is typically `--s-20` (96px) on desktop, `--s-12` (56px) on mobile.

Max container width: `1200px`, with `24px` horizontal gutter on mobile, `32px` tablet, `48px` desktop.

### Radii

Soft, not pill. Matches the logo's rounded letterforms.

- `--r-sm` 6px — inputs, chips
- `--r-md` 12px — buttons
- `--r-lg` 16px — cards
- `--r-xl` 24px — hero mockup window, ROI card
- `--r-full` 999px — toggles, avatars only

### Shadows & elevation

Three‑step elevation; soft, low‑spread, slightly tinted toward the brand color so shadows feel warm, not grey‑black.

- `--shadow-1`: `0 1px 2px rgba(15, 81, 92, 0.06)` — resting cards
- `--shadow-2`: `0 8px 24px -6px rgba(15, 81, 92, 0.12)` — floating cards (pricing, ROI simulator)
- `--shadow-3`: `0 24px 60px -12px rgba(15, 81, 92, 0.22)` — the hero mockup window, modals

No inner shadows. No neumorphism.

### Borders

Hairline `1px solid var(--line)` on light surfaces. On dark teal surfaces we use `rgba(255,255,255,0.12)`. The "Pro" pricing card gets a `1.5px` `--brand-500` outline — **the outline is the emphasis**, not a background fill. No double borders, no dashed borders anywhere.

### Backgrounds

- Hero + footer: flat dark teal `#0F515C`, optionally with a single subtle radial gradient from `#1A7A89` at ~30% down‑right. No photos behind the hero.
- In‑between sections: alternate `#FFFFFF` and `#F9FAFB` — *fonds secondaires* per the brief — never any third accent background.
- No grain, no noise, no patterns, no hand‑drawn illustration. The brand imagery is flat, geometric, UI‑forward.

### Imagery vibe

The only recurring image is **"the product itself"** — stylised browser‑window mockups of the Taysir app. They should feel:
- cool (teal + white + soft greys),
- generous whitespace inside,
- no people photography, no stock imagery,
- light drop shadow so the window feels like it floats over its section.

### Animation

- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (OutQuint) — the standard "soft landing".
- Durations: 120 ms micro (hovers), 220 ms small (buttons, toggles), 400 ms medium (slider value change, reveal).
- No bounce, no spring overshoot, no confetti. This brand doesn't celebrate, it reassures.
- Validation moments (micro‑demo success) can use a **single** scale pulse `0.8 → 1.05 → 1` on the check mark over 320 ms.

### Hover / press states

- **Primary button (filled brand):** hover → bg `#145F6C` (darker teal), slight lift `translateY(-1px)` + `--shadow-2`. Press → no lift, bg `#0F515C`.
- **Ghost button (outline):** hover → bg `rgba(26,122,137,0.06)`. Press → bg `rgba(26,122,137,0.12)`.
- **Card hover:** `translateY(-2px)`, shadow steps from `--shadow-1` → `--shadow-2`. Never change border color on hover.
- **Link hover:** underline fades in, color unchanged.
- Transition: `all 220ms var(--ease)`.

### Transparency & blur

Used sparingly.
- Navbar on hero: `background: rgba(15, 81, 92, 0.72); backdrop-filter: blur(10px);` *only after the user scrolls 24 px*; above that, fully transparent.
- No frosted modals, no glassmorphism cards. The rest of the UI is opaque.

### Layout rules

- Fixed navbar at top of landing, 72 px tall.
- All sections are full‑width with an inner 1200 px max container, horizontally centered.
- The hero mockup window deliberately overflows the section below by ~80 px — this is a brand rule (per brief: "dépasse légèrement sur la section suivante pour créer une continuité").
- Footer sits on dark teal, mirrors the hero, closes the page.

---

## Iconography

No custom icon set was provided. We use **[Lucide](https://lucide.dev/)** via CDN — stroke-based, 24×24, 1.75 px stroke — it pairs with the logo's rounded geometry and doesn't fight Inter.

Rules:
- Stroke weight: `1.75` (slightly lighter than Lucide default) for visual lightness at small sizes.
- Standard size inline with body text: `18px`. Standalone UI icons: `20px`. Feature icons: `28px` on a circular brand‑50 swatch.
- Color: inherit current text color. On the pricing check lists specifically, color is `var(--brand-500)`.
- **No emoji** in the product.
- **No Unicode dingbats** (★, ▲, ✓) as icons — always SVG.
- The `+`/cross motif from the logo may be reused as a subtle decorative element on the hero or footer (small, low‑contrast).

> ⚠️ **Substitution flagged** — Lucide stands in for any internal Taysir icon set. If the team has an icon library (SVG sprite / icon font), drop it into `assets/icons/` and we'll swap the CDN references.

---

## Caveats

- Fonts and icons are best‑guess substitutions (Inter + Lucide). Please upload real Taysir brand assets if they exist.
- The landing page recreation follows the brief section‑by‑section; copy is original (French) but stays generic — swap in real product language when ready.
- No codebase/Figma was attached, so the UI kit is based entirely on the brief, the logo, and the cited inspiration brands.
