---
name: taysir-motion
description: Motion rules for Taysir (system "TARTEEB", from globals.css). Use when adding/editing ANY animation or transition in the dashboard — easing choice, duration, entrance/exit, hover, popover, chart. Enforces the 300ms UI ceiling, transform/opacity only, RTL-safe motion, and the mandatory state matrix. Not for the landing hero's decorative choreography (separate system).
---

# Taysir motion — TARTEEB

Motion serves **legibility**, not decoration. Taysir is a dense productivity ERP opened dozens of times/day. Budget: **max 2 animated moments per screen**. Tokens live in `src/app/[locale]/globals.css` — never invent durations/easings.

## Easing decision tree (no ambiguity)
| Situation | Easing | Utility |
|---|---|---|
| Something **arrives / appears / expands / hovers-in / a value settles** (the default, ~90% of cases) | `--ease-order` `cubic-bezier(.16,1,.3,1)` | `ease-order` |
| Something **leaves / dismisses / collapses / hovers-out** | `--ease-swipe` `cubic-bezier(.7,0,.84,0)` | `ease-swipe` |
| **Zellige/tile geometry only** (brand assembly, decorative) — drift-then-snap | `--ease-zellige` `cubic-bezier(.62,.05,0,1)` | `ease-zellige` |

- Default to `ease-order`. Reach for `ease-swipe` **only** on an exit/dismiss.
- `ease-zellige` is for **decorative geometry** (landing hero) — **never** on data UI (a KPI, a list, a form must not "drift then snap").
- **Exit shorter than enter** (~60–70%). Enter 240ms → exit ~160ms.

## Duration — hard ceiling 300ms
| Token | Value | Utility | Use |
|---|---|---|---|
| `--dur-micro` | 120ms | `duration-micro` | Tap/press feedback, state toggle |
| `--dur-small` | 240ms | `duration-small` | Hover, expand/collapse, popover |
| `--dur-med` | 480ms | **none — do NOT use** | Exceeds the 300ms ceiling; currently dead (`globals.css:159`). If you find yourself wanting it, the interaction is too slow — pick `dur-small`. |

**Any UI interaction ≤ 300ms.** 180ms beats 400ms; no dashboard was ever criticised for being too fast. `.ts-pop` (160ms) is the popover open.

## Transform / opacity only
Animate **only `transform` and `opacity`**. Never animate `width`, `height`, `top/left/right/bottom`, `margin`, `padding` (layout thrash → CLS). Expand/collapse via `transform: scaleY` or `grid-template-rows`, not `height`.

## RTL-safe motion
- **Never a hardcoded `translateX` direction.** In `ar` (RTL) a left-slide is wrong. Use logical offsets, `rtl:` variants, or `transform-origin` that flips.
- Directional icons (arrows, chevrons) that move: `rtl:rotate-180` (and mirror the translate).
- `transform-origin` with a side must have an RTL counterpart.

## Reduced-motion
Respected globally (`@media (prefers-reduced-motion: reduce)` in `globals.css` zeroes durations). Do **not** re-enable motion locally. JS-driven motion (count-ups, framer-motion) must check `matchMedia("(prefers-reduced-motion: reduce)")` and snap to the final state (see `AnimatedNumber.tsx`).

## Mandatory state matrix
Any animated component ships **all** of these, each verified in `fr` AND `ar`:
- **loading** — skeleton (never a blank frame or a lone spinner over emptied chrome).
- **empty** — meaningful message + next action, not a blank container.
- **error** — message + recovery path (retry/edit), not a snap to nothing.
- **success / settled** — the resting state.
- **reduced-motion** — the whole thing readable with motion off.
- **RTL** — direction correct.

## Forbidden
- ❌ Animation triggered by a **keyboard action** (focus/typing) — jars keyboard users.
- ❌ `scale(0)` (or `opacity:0` with no fallback) as the **initial** state of content that carries data — if JS/motion fails, the data is invisible.
- ❌ Animating `width/height/top/left/margin/padding`.
- ❌ Keyframe loops (`animate-pulse`/`animate-spin`) on anything other than a genuine loading indicator.
- ❌ Decorative motion with no cause→effect meaning (violates the 2-moments budget).
- ❌ Durations/easings hardcoded as arbitrary values when a token/utility exists.
- ❌ `ease-zellige` on product data UI.
