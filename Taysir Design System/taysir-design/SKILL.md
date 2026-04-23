---
name: taysir-design
description: Use this skill to generate well-branded interfaces and assets for Taysir, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

Key references:

* `README.md` — brand context, content fundamentals, visual foundations, iconography
* `colors\_and\_type.css` — all design tokens as CSS variables (colors, type ramp, spacing, radii, shadows, motion)
* `assets/` — logo lockups and mark (`logo.png`, `logo-cropped.png`, `logo-mark.png`)
* `preview/` — small reference cards for each token group and component
* `ui\_kits/landing/` — production-quality React/JSX recreation of the Taysir marketing landing page (Navbar, Hero, MicroDemo, ROISimulator, Pricing, Footer)

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Always pull `colors\_and\_type.css` in first — it carries the full token system. For dark surfaces use `--brand-900`; for CTAs use `--brand-500`; soft section backgrounds alternate `--surface-0` / `--surface-50`.

If working on production code, read the rules in `README.md` to become an expert in designing with this brand — in particular the *Content fundamentals* (French, vouvoiement, sentence case, no emoji) and the *Visual foundations* (soft shadows, 1.5px brand outline for emphasis, OutQuint easing, Lucide icons at 1.75 stroke).

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions about audience and scope, and act as an expert designer who outputs HTML artifacts *or* production code, depending on the need.

