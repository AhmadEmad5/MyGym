# FORMA design-system contract

Version 1. Frozen on `main` at the start of the design-system overhaul.

This is the **integration owner's** document. It records what the design
system is today, which file owns what, and which known problems are
deliberately left in place. Feature workstreams consume this contract; they
do not redefine it.

`src/styles/__tests__/design-system-contract.test.ts` enforces the load-bearing
parts of it. If you change a rule here, change that test in the same commit.

---

## 1. Ownership

| Concern | Canonical file | Notes |
| --- | --- | --- |
| Design tokens, all 7 themes | `src/styles/design-tokens.css` | The single source of truth |
| Base stylesheet, global resets | `src/index.css` | **Legacy.** Still owns 6 tokens — see §8 |
| Feature styles | `src/styles/{today,routines,calendar,performance,gym-floor,mobile-*}.css` | |
| Component styles | `src/styles/ui-kit.css` | `.ui-*` primitives |
| Shell / navigation | `src/styles/forma-shell.css`, `src/styles/routes.css` | |
| Import order | `src/main.tsx` | **Load-bearing**, see §9 |

**`design-tokens.css` must be imported after `index.css`.** This is the only
thing that makes the canonical tokens win, and nothing but the contract test
prevents it being broken.

---

## 2. Colour

Semantic tokens only. Components never hardcode a hex value.

**Surfaces** — `--surface-canvas`, `--surface-primary`, `--surface-card`,
`--surface-elevated`, `--surface-input`, `--surface-glass`,
`--surface-glass-border`, `--surface-card-hover`

**Text** — `--text-primary`, `--text-secondary`, `--text-muted`,
`--text-inverted`

**Lines** — `--border-subtle`, `--border-card`, `--border-highlight`,
`--border-focus`

**Status** — `--color-{success,warning,danger,info}` each with a `-soft`
(background), `-line` (border) and `-ink` (readable text) variant. The `-ink`
family exists because a status colour tuned for dark mode is unreadable on a
light surface; always use `-ink` for text, never the base colour.

**Accent** — `--accent-{primary,hover,gradient}` plus per-hue
`--accent-{cyan,emerald,amber,purple,rose,yellow}` and matching `-ink`
variants. `--accent-primary` is a **role**, not a hue: it is green in
`:root` and re-pointed per theme.

**Legacy aliases** — `--bg-primary`, `--bg-secondary`, `--bg-tertiary`,
`--bg-input`, `--text-*`, `--border-color`, `--border-highlight`,
`--accent-green`, `--accent-yellow`, `--danger`, `--success`, `--warning`.
These are indirection layers onto the tokens above. They are still consumed
in many places; prefer the canonical name in new work.

**Exercise-specific** — `--color-set-{completed,active,pending}`,
`--color-rest-timer`, `--color-pr-hit`. Added for the session HUD.

### Contrast floors

| Content | Minimum |
| --- | --- |
| Body text | 4.5:1 |
| Large text (≥24px, or ≥18.66px bold) | 3:1 |
| Icons and control boundaries carrying meaning | 3:1 |
| Disabled / decorative | exempt, but must not be the only cue |

`[data-high-contrast]` raises `--premium-line` and `--premium-soft` as well as
the text tokens. Every divider must remain visible in that mode.

---

## 3. Typography

`--font-sans` (Inter) is the body face. `--font-display` (Barlow Condensed) is
for numerals, headings and the session HUD. `--font-mono` is tabular data.
Cairo is the Arabic face and is set by `dir`, not by a token swap.

Scale: `--text-2xs` 0.6875rem → `--text-4xl` `clamp(2.25rem, 5vw, 3.5rem)`.
Leading: `--leading-tight` 1.1 → `--leading-relaxed` 1.7.
Weights: `--weight-regular` 400 → `--weight-black` 850.

Rules:
- **Numerals in data contexts must be tabular.** Use `font-variant-numeric:
  tabular-nums` (or the `.tabular-nums` / `.text-tabular` utilities) on
  weights, reps, timers, percentages and counts, so digits do not reflow as
  they change mid-workout.
- **Nothing in the session HUD below 0.75rem.** That surface is read at arm's
  length, mid-effort.
- `.text-display-*` and `.font-display*` utilities are the supported way to
  apply the display face; do not set `font-family` inline.

---

## 4. Spacing

`--space-3xs` 0.25rem → `--space-3xl` 3rem, on a 4/8dp rhythm.
`--space-gutter` is the page inset; `--space-page-max` caps content at 1240px.

Touch targets are a separate concern from spacing:

| Token | Value | Use |
| --- | --- | --- |
| `--space-touch-min` | 44px | iOS minimum. The floor for any control |
| `--space-touch-comfortable` | 48px | Android minimum, and for gym-floor controls |
| `--space-touch-gap` | 8px | Minimum separation between adjacent targets |

`.touch-target` and `.touch-target-comfortable` apply the floors. They compose
with existing sizing classes rather than replacing them.

**A visual icon smaller than its hit area is fine. A hit area smaller than
44×44px is not** — expand the button, do not enlarge the glyph.

---

## 5. Elevation, radius, motion

**Radius** — `--radius-xs` 6px, `-sm` 10px, `-md` 14px, `-lg` 18px, `-xl` 24px,
`-full` 9999px. Note that individual themes re-point `--radius-*`, so a
component must never assume the base value; always read the token.

**Elevation** — `--shadow-xs` … `--shadow-xl`, plus semantic
`--shadow-card`, `--shadow-card-hover`, `--shadow-modal`, `--shadow-glow-cyan`,
`--shadow-glow-emerald`.

**Motion** — `--motion-fast` 140ms, `--motion-base` 200ms,
`--motion-slow` 320ms. Easing: `--ease-standard` (default UI),
`--ease-out`, `--ease-in`, `--ease-ambient` (long ambient drift only).

### Reduced motion is a hard requirement

There are **two** mechanisms and both must be honoured:

1. `[data-motion="reduced"]` on the document root — the in-app preference
2. `@media (prefers-reduced-motion: reduce)` — the OS preference

Setting `transition-duration: 0.01ms` is **not sufficient**: it stops the
animation but leaves the end state, so a hover lift still jumps. Any
reduced-motion rule must neutralise the `transform` as well as the
`transition`.

In React, use `useReducedMotion()` from
`src/components/performance/useReducedMotion.tsx` for Framer Motion, and
`useFormaReducedMotion()` from `src/components/TodayBentoGrid.tsx` where the
existing pattern already uses it. Do not reimplement detection.

**Performance rule:** animate `transform` and `opacity` only. Animating
`top`/`left`/`width`/`height`/SVG `d` forces layout or defeats compositing,
and this app targets mid-range Android.

---

## 6. Focus

`--focus-ring-width` 3px, `--focus-ring-offset` 2px, `--focus-ring-color`
(`--border-focus`), `--focus-ring-halo`.

A global `:focus-visible` outline exists in `src/index.css`. It is defeated by
any inline `style={{ outline: 'none' }}` — that pattern has appeared in five
places and was removed from all of them. **Never set `outline: none` inline.**
Use a token or a class.

Every interactive element needs a visible focus indicator and a non-colour
state cue. Focus order must match visual order. Modals must trap focus,
close on Escape, and return focus to their trigger.

---

## 7. Theming

Seven themes, all declared in `design-tokens.css`:
`light`, `midnight`, `neon`, `ocean`, `forest`, `sunset`, `paper`
(default is the dark `:root`).

A theme is a `[data-theme="..."]` block that re-points tokens. It must not
redefine selectors or component rules. If a theme needs a component-level
tweak, that is a contract violation — add a token instead.

Two further root attributes are in use: `data-density` (`comfortable` /
`compact`) and `data-high-contrast`. Both must keep working in all themes.

**RTL.** Layout must use logical properties (`margin-inline`,
`padding-block`, `inset-inline-start`, `border-inline-start`). Physical
`left`/`right` in a stylesheet is a bug: it silently breaks Arabic. Both
`prefers-reduced-motion` and `[data-motion]` are also required because the app
ships its own toggle.

---

## 8. Known contract debt (frozen, not fixed)

Recorded here so workstreams do not each try to solve it, and so the migration
is measurable.

**1. `src/index.css` shadows 55 token declarations.**
Both files declare `:root` and the same 7 themes. `design-tokens.css` wins by
import order, so the `index.css` copies are dead. The contract test pins the
count at 55 — it may only go down.

**2. Six tokens still live only in `src/index.css`:**
`--premium-surface`, `--premium-panel`, `--premium-line`, `--premium-soft`,
`--theme-shadow`, `--gym-lime`.

The `--premium-*` family is the important one: the session HUD and the
gym-floor set card read `--premium-surface` / `--premium-line` /
`--premium-soft`, and the canonical file never defined them. These are **live,
consumed, and homeless** — the biggest hole in the contract. Migrating them is
the next contract change, and it needs a rendered comparison because
`--theme-radius` is read with `!important` by the per-theme card rules.

**3. Two competing radius mechanisms.** `--radius-*` (a scale, re-pointed per
theme) and `--theme-radius` (a single per-theme value, overridden with
`!important` in `index.css`). They cannot be merged without deciding what a
theme's corner radius *means*.

**4. Dead CSS.** `.routines-page .routine-card` — eight rules across two
files, superseded by `.routine-ledger-card`. This is why routine-card hover
appeared to be missing.

---

## 9. What is not in this contract

Not because they are unimportant, but because **this environment has no
browser, no screen reader and no visual-regression harness**. None of the
following could be executed or verified here, so none of it is claimed:

- rendered appearance across viewports (320 / 375 / 414 / 768 / 1024 / 1440)
- rendered appearance in all 7 themes
- computed contrast against the *composed* background
- real focus-ring rendering
- screen-reader announcement order
- visual regression

Adding Playwright + axe-core + a screenshot baseline would close this gap and
is a decision for the owner, not an inference for this pass. See the handover
report for the exact packages and the file set.
