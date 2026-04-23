# Taysir — Landing page UI kit

High-fidelity recreation of the Taysir marketing landing page, following the brief provided.

## Sections (top → bottom)

| # | Component | File | Notes |
|---|---|---|---|
| 1 | Transparent navbar over the hero, blurs on scroll | `Navbar.jsx` | 72px tall, fixed |
| 2 | Hero (dark teal) + floating mockup window | `Hero.jsx` | Mockup overflows into the next section (-120px) |
| 3 | Interactive micro-demo — email → success state | `MicroDemo.jsx` | Validates state with a scale‑pulse on the check |
| 4 | ROI simulator — 3 sliders, animated number | `ROISimulator.jsx` | Savings animate on each slider change |
| 5 | Pricing — 3 cards, monthly/annual toggle | `Pricing.jsx` | Middle card is `1.5px` brand‑500 outlined |
| 6 | Dark teal footer | `Footer.jsx` | Mirrors the hero, closes the page |

Shared primitives (Logo, icon set, button/field CSS) are in `Primitives.jsx` + `index.html`'s `<style>` block.

## Running

Open `index.html` directly — all deps load from CDN. It expects `../../colors_and_type.css` and `../../assets/logo-mark.png` at their repo paths.

## Caveats

- No real Taysir product screenshots exist yet — the mockup window is a generic "workspace" recreation using brand colors only.
- Copy is original French placeholder; swap when real product copy is available.
- Inter + Lucide-like SVGs stand in for unknown brand-specific assets (see root README.md).
