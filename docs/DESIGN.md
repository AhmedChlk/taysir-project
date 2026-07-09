# DESIGN.md — Taysir design system

> The brand's visual language. Synthesised from four expert workflows (typography,
> color, layout, motion), each of which researched the web and adversarially rejected
> generic "AI-slop" defaults. Inject this before generating any new UI. Every choice is
> deliberate and Algerian-rooted — **do not** drift back to Inter / teal-on-white / pill
> badges / four-card grids / fade-up.

Taysir is a multi-tenant school-management ERP for **Algerian** private schools, **FR + AR**
(Arabic is RTL). Audience: school directors/gérants and secretaries. Register: trustworthy,
editorial, confidently non-generic, grounded in Maghrebi craft (zellige geometry, petrol
glaze, brass, Saharan earth).

## 1. Typography — "Condensed Power"

Tokens (set in `src/app/[locale]/layout.tsx` via `next/font/google`):

| Token | Font | Role |
|---|---|---|
| `--font-display` | **Big Shoulders** | condensed industrial caps — headlines, labels, eyebrows. Display-only, never < ~16px. |
| `--font-body` | **Petrona** | warm slab-transitional serif — body, UI, forms, tables. |
| `--font-numeric` | **Vazirmatn** | tabular figures for DA / % / data **and** the Arabic UI workhorse (identical glyphs FR↔AR from one file). Drives the GSAP `wght` stat animation. |
| `--font-arabic-display` | **Reem Kufi** | squared Kufic for AR headlines — rhymes with zellige. |
| `--font-arabic` | = `--font-numeric` (Vazirmatn) | AR body/UI. |

Banned (overused / AI reflex): Inter, Roboto, Arial, system, Space Grotesk, Bricolage
Grotesque, Fraunces, Hanken, Poppins, Montserrat, DM Sans, Cairo/Tajawal (AR).
Numbers use `.t-num` (`font-feature-settings: "tnum" 1, "lnum" 1`).

## 2. Color — "Petrol & Brass — Deep Zellige"

Defined as CSS custom properties in `globals.css :root`. Deep **petrol** is the dominant
ink/surface; canvas is warm **Saharan bone** (`#f6f1e7`, never white); exactly **two sharp
warm accents** fire. WCAG-checked.

- **Petrol (dominant):** `--brand-900 #0b2a30` … `--brand-700 #114c57` … `--brand-500 #157180` (core), `--brand-400 #2ba0a6` (turquoise glaze).
- **Kabyle Coral (action):** `--accent #d5573b` (fill), `--accent-ink #b8442a` (text/links on light).
- **Antique Brass (premium, dark/fill only — never small brass text on light):** `--brass #c6a24a`, `--brass-bright #d4b25e`.
- **Bone surfaces:** `--surface-0 #f6f1e7`, `--surface-50 #fbf7ef`, `--surface-100 #efe7d6`.
- **Ink (warm manganese):** `--ink-900 #221c18`, `--ink-500 #6b6253`.
- **Semantic (national legitimacy):** success flag-emerald `#0a7d33`, danger flag-red `#c8311f`, warning Kabyle-saffron `#e1a33a`.
- **Gradients:** `--grad-hero` (petrol glow→ink), `--grad-brand` (teal sweep), `--grad-premium` (brass→coral, small focal only).

Rule: dominant petrol + bone canvas + two sharp accents. No purple, no white-haze, no timid pastels.

## 3. Layout — "Le Panneau Zellige"

The hero **is** a single Maghrebi tile panel (`HeroZelligePanel.tsx` + `.hz-*` in globals):
a gutterless girih tessellation where **every tile is one live module** (Élèves, Présences,
Emploi du temps, Paiements, Inscriptions, Salles, Activités, Staff) and an **octagonal star
tile** seats the headline + CTA *into* the mosaic. **Terracotta grout** traces every seam
(grid `gap` over a coral background); octagon `clip-path` chamfers reveal coral residual
squares = real girih. Tones rotate (petrol / bone / wash) for tile rhythm. RTL mirrors via
`grid-template-areas` reversal (no transforms). One viewport shows the whole school.

Principle for other sections: authored asymmetric grids over equal-span card rows; the
zellige diamond/star is a load-bearing structural device, not pasted ornament.

## 4. Motion — "TARTEEB" (نظام/ordre)

One beat = a class period: `--beat: 120ms`. **Exactly three** named easings, nothing else:

- `--ease-order` `cubic-bezier(.16,1,.3,1)` — ARRIVING (the workhorse, ~85%).
- `--ease-swipe` `cubic-bezier(.7,0,.84,0)` — LEAVING.
- `--ease-zellige` `cubic-bezier(.62,.05,0,1)` — GEOMETRY ONLY (drift then snap).

Signature gesture: **chaos → order**. Things arrive **scattered + rotated** and settle into
the grid (the hero tiles assemble outward from the star). It performs "sans le chaos."
Discipline > flash: one hero gesture, few signature interactions, no scattered micro-motions.
Always gate behind `prefers-reduced-motion` (then: opacity only, no scatter).

## Provenance

Workflow transcripts: typography `wxkv6jpmz`, color `w6ahfhadh`, layout `wq1r85uy4`,
motion `wx0hkw4jz` (session 2026-06-23). See also `CODE_MAP.md`, `REFACTOR_BACKLOG.md`.
