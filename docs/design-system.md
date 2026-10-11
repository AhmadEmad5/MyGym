# FORMA design-system contract

Version 2. Updated 2026-10-02, after the CSS consolidation recorded in §8.6.

This is the **integration owner's** document. It records what the design
system is today, which file owns what, and which known problems are
deliberately left in place. Feature workstreams consume this contract; they
do not redefine it.

`src/styles/__tests__/design-system-contract.test.ts` enforces the load-bearing
parts of it. If you change a rule here, change that test in the same commit.

> **How to read §8.** Entries 8.1–8.5 are the recorded debt. Two of them
> (8.1, 8.2) were **closed** by the 2026-10-02 pass and are kept, dated, because
> the reasoning behind the numbers still matters. Three (8.3, 8.4, 8.5) are
> still open and none of them can be closed by an agent — they need a product
> decision, a rendered comparison, or a human grep. §8.6 is what the pass
> actually changed.

---

## 1. Ownership

| Concern | Canonical file | Notes |
| --- | --- | --- |
| Design tokens, all 7 themes | `src/styles/design-tokens.css` | The single source of truth. **Only** file that may declare a token value |
| Layer order + base reset | `src/index.css` | Declares the `@layer` order (§8.6) and the `@theme inline` Tailwind bridge. Declares **no** design tokens — see §8.1, §8.2 |
| App shell / navigation | `src/styles/shell.css` (`@layer shell`) | The frame, the single scroller, desktop nav, mobile top bar, portalled overlays |
| Shared primitives (`.ui-*`) | `src/styles/ui-kit.css` (`@layer features`) | Base `.ui-*` styles also live in `design-tokens.css:928` under `@layer components` |
| Page + feature styles | see the inventory below | |
| Import order | `src/main.tsx` | **Load-bearing**, see §8.6 |

**`design-tokens.css` must be imported after `index.css`.** The contract test
enforces it. Since the migration in §8.1/§8.2 this is a guard rather than a
live dependency — `index.css` no longer shadows anything — but it is exactly the
reorder that used to repaint all seven themes, so it stays pinned.

### File inventory — 16 stylesheets

Every file in `src/styles/` except `design-tokens.css`. `src/index.css` is
listed above; component-local sheets (`admin-data.css`, `admin-drawer.css`,
`AdminDashboard.css`, `LoginView.css`) are co-located with their component and
are not part of this inventory.

| File | Layer | Owns |
| --- | --- | --- |
| `shell.css` | `shell` | App frame, scroller, nav, top bar, fixed overlays |
| `forma-shell.css` | `layout`, `components` | Shell tokens, skip link, nav detail |
| `page-frame.css` | `components` | `zen-page-container`, `.page-surface`, `.zen-header` |
| `components.css` | `components` | The shared route card surface |
| `today.css` | `components` | Dashboard |
| `today-recovery.css` | `components` | Recovery panel |
| `calendar-page.css` | `components` | Calendar view |
| `nutrition-page.css` | `components` | Nutrition view |
| `settings-page.css` | `components` | Settings view |
| `routines.css` | `components` | Routines + program builder |
| `performance.css` | `components` | Performance hub |
| `onboarding.css` | `components` | Onboarding tour |
| `ui-kit.css` | `features` | `.ui-*` primitives |
| `gym-floor.css` | `features` | Gym-floor mode |
| `gym-ergonomics.css` | `features` | Reachability, safe-area insets |
| `mobile-refinement.css` | `features`, `components` | Mobile chrome refinements |

`routes.css` and `mobile-log.css` were deleted and their contents folded into
the files above (§8.6). Import position inside this list is load-bearing for
`page-frame.css`, `components.css`, `calendar-page.css`, `nutrition-page.css`
and `settings-page.css`, which must stay ahead of `routines.css`.

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
`body` reads `--theme-font`, which is `--font-sans` by default and is switched to
the Cairo stack by a `[dir="rtl"]` override (`src/index.css:78-80`) — so the
Arabic face is a `dir` switch, but it reaches the page through a token, not a
theme block.

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

## 8. Known contract debt

Recorded here so workstreams do not each try to solve it, and so the migration
is measurable.

### 8.1 Shadowed token debt — **closed 2026-10-02**

**55 shadowed declarations removed. Contract test baseline updated from 55 to
0. The `canonicalOnly` assertion now expects 0 legacy tokens.**

`src/index.css` used to declare tokens under `:root` and under the same seven
`[data-theme="..."]` selectors that `design-tokens.css` declares. Both files
existed, so the `index.css` copies could never affect a computed value — the
colour of the whole app was decided by import order rather than by the design.
All 55 are deleted. `index.css` opens no `:root` and no `[data-theme]` block,
and the contract test pins the count at **0** and fails if it ever rises.

> The figure recorded here before this pass was 51, and the doc claimed all 51
> were already gone. Both halves of that claim were wrong, and the discrepancy
> is worth keeping because the cause was a bug in the guard itself: `index.css`
> opens several selectors more than once, and the test helper read only the
> first opening. The same bug had earlier let 24 genuinely dead declarations
> survive a cleanup that reported zero remaining. The helper now merges across
> repeat openings.

One shadowed block survives **outside the guard's reach**:
`src/index.css:76` re-declares `--text-secondary`, `--text-muted`,
`--border-color` and `--border-highlight` under `[data-high-contrast]`, where
`design-tokens.css` declares all four at identical specificity and loads later.
It is dead in exactly the same way the 55 were, but the contract test only
inspects the `:root` and `[data-theme]` families, so it stays invisible to the
guard. One line, safe to delete — removing it means widening the test's scope,
not migrating a token.

`index.css` still declares two things that are legitimately its own, not
leftover token debt:

- the `@theme inline` Tailwind bridge (`--color-forma-*`). `design-tokens.css`
  does not declare these names, and moving them would rename the Tailwind
  utilities that consume them.
- the `[dir="rtl"]` `--theme-font` override (`index.css:78-80`). This is not a
  shadowed second copy — `design-tokens.css:294` declares the base
  `--theme-font`, and `html[dir="rtl"]` outranks `:root` on specificity, so the
  Arabic stack wins on the root element. It is the RTL half of §3's font rule.

Nothing else in the file declares a custom property.

### 8.2 Homeless tokens — **closed 2026-10-02**

**The 13 homeless tokens from `index.css` have been adopted into
`design-tokens.css` with per-theme overrides, not as a bare `:root`.**

`--premium-surface`, `--premium-panel`, `--premium-line`, `--premium-soft`,
`--theme-shadow`, `--gym-lime`, `--gym-lime-glow`, `--gym-cyan`,
`--gym-cyan-glow`, `--gym-flame`, `--gym-flame-glow`, `--gym-emerald`,
`--gym-purple`.

These were **live, consumed, and homeless** — the biggest hole in the contract.
`--premium-*` is read by the session HUD, the gym-floor set card and the legacy
premium modal treatment; `--gym-*` by `gym-floor.css` and `gym-ergonomics.css`.
`design-tokens.css` already defined `--premium-line` and `--premium-soft`
inside `[data-high-contrast]`, so those two now have a normal-theme value *and*
a high-contrast one, and the high-contrast pair still wins where it is applied.

**Why per-theme overrides and not a bare `:root`.** A bare `:root` copy in the
canonical file outranks the former `index.css` `[data-theme="light"]` rules at
equal specificity and repaints the light theme with the dark premium surfaces —
the light theme's overrides live in the same file that imported later, so the
cascade, not the design, would decide. `design-tokens.css` therefore carries the
dark `:root` base and every theme re-declares the family. Values were verified
value-for-value against the pre-migration state.

> `--theme-shadow` is re-declared only by the themes that actually changed it
> (`ocean`, `forest`, `sunset`, `paper`); the other three inherit the `:root`
> value. That is intentional, not an omission.

The fourteenth token, `--premium-ink`, was **deleted**. It was declared twice in
`index.css` and consumed by nothing in CSS or TSX.

### 8.3 Two competing radius mechanisms — **open, needs a product decision**

`--radius-*` (a scale, re-pointed per theme) and `--theme-radius` (a single
per-theme value, overridden with `!important` in `index.css`). They cannot be
merged without deciding what a theme's corner radius *means*.

### 8.4 Density makes `--space-md` and above unsafe to adopt in new CSS

`[data-density="compact"]` re-points them (`1rem` → `0.85rem`). So replacing a
hardcoded `1rem` with `var(--space-md)` is **not** value-identical — it
changes rendering in compact mode. Only `--space-3xs` through `--space-sm` are
stable enough to substitute mechanically.

### 8.5 Dead CSS: CSS-only greps are unreliable

`.routines-page .routine-card` spanned **three** files, not two. Removed, along
with 25 other selectors proven to have no consumer.

> Do not trust a `.css`-only grep when hunting dead code. `livePulse` and
> `clockColonBlink` have zero stylesheet references but are referenced from
> inline style objects in `ModernClockWidget.tsx`.

### 8.6 Consolidation changes (2026-10-02)

Everything below is true of the current tree. §8.3–8.5 are the only parts of
this section's subject that remain open.

**Cascade layer order is declared.** `src/index.css:20`:

```css
@layer reset, tokens, base, layout, components, utilities, features, shell, overrides;
```

Nothing in `src/` may declare a style outside a layer. Unlayered author
declarations outrank every layer regardless of source order, which is the
mechanism that let four files silently outrank the token primitives. `features`
and `shell` sit deliberately late; `utilities` stays below them so a
hand-written utility in `features` still wins over a Tailwind utility class.

**Four files re-layered into `@layer features`:** `gym-floor.css`,
`gym-ergonomics.css`, `ui-kit.css`, `mobile-refinement.css`. All four were
fully unlayered, so every rule in them outranked every layered rule in the
project. `ui-kit.css` is the notable one: its `.ui-*` primitives are the
documented shared component layer and now actually behave like it.

**New `src/styles/shell.css` (`@layer shell`)** consolidates the app frame, the
single scroller, the desktop nav, the mobile top bar and the portalled
overlays. The rules were pulled out of **five** files — `index.css`,
`forma-shell.css`, `gym-floor.css`, `mobile-refinement.css`,
`gym-ergonomics.css`. Its section order is load order on purpose: section 3
refines section 1, and section 4 refines section 3, at equal specificity, which
is what those files did by import position. Reordering the sections silently
changes the dock geometry.

**`routes.css` and `mobile-log.css` deleted, contents folded.** `routes.css`
(303 lines) split by owner into `page-frame.css`, `components.css`,
`calendar-page.css`, `nutrition-page.css` and `settings-page.css`, with its
`.performance-page` and `.routines-page` blocks going into `performance.css` and
`routines.css`. Import position is load-bearing: all five new files sit exactly
where `routes.css` was, ahead of `routines.css`, whose
`.calendar-page .ribbon-day-pill { border-radius: .85rem }` ties on specificity
and would otherwise start winning. `mobile-log.css`'s `.mobile-log-actions`
moved into `mobile-refinement.css`'s `@layer components`, which already owned a
rule for that class.

**55 shadowed declarations removed; contract baseline 55 → 0.** See §8.1.

**`--premium-ink` deleted; the canonical-only list is now empty.** See §8.2.

**10 dead i18n keys removed** — `focusMode`, `zenFocusMode`, `zenCompleteSet`,
`zenNextSet`, `zenRestTimer`, in both `en` and `ar`. They described the zen
focus-mode fullscreen overlay, which is gone. Grep finds no reference outside
`i18n.tsx`.

**119 hardcoded hex values tokenized across 6 stylesheets.** What is left in
`src/styles/` is five `var()` fallbacks in `shell.css` (the documented pattern)
plus two `#fff !important` colour declarations in `mobile-refinement.css:124`
and `:212`, the nav train-action icon, which were out of scope. `forma-shell.css`
was already at zero.

**New tokens**, all in `design-tokens.css`:
- `--accent-amber-deep` `#d97706`, `--accent-emerald-deep` `#059669` — the
  shaded ends of the two CTA gradients
- `--text-on-accent` `#06121e`, `--text-on-accent-deep` `#ffffff` — ink printed
  **on** a saturated fill. Two steps because the choice is driven by the fill's
  luminance, not the canvas theme: the fills are theme-invariant, so the ink on
  them cannot be
- `--gym-abyss`, `--gym-crest` — hydration ramp ends
- `--gym-indigo`, `--gym-pink` — the routines AI button's three-stop spectrum,
  kept whole rather than aliased onto `--accent-purple` / `--accent-rose`, which
  would re-grade the gradient

**New `.on-stage` scope** re-binds `--text-primary` / `-secondary` / `-muted` /
`-inverted` and `--accent-cyan-ink` / `--accent-emerald-ink` to the dark-canvas
steps for everything inside it, following the existing `[data-high-contrast]`
re-binding pattern and placed after every `[data-theme]` block.

It exists because `--text-primary` and `--text-inverted` are both redefined by
all seven themes and **neither is white in the default dark theme** (`#080c14`).
Mapping `#ffffff` onto either would have made hero copy and the whole coachmark
overlay invisible in the light and paper themes. The scope keeps `--text-primary`
meaning "primary ink for whatever I am standing on" and renders byte-identical
to the hex it replaces in all seven themes. Applied to exactly two elements:
`.forma-hero` (`LoginView.tsx:519`) and `.forma-onboarding-backdrop`
(`OnboardingTour.tsx:405`) — both fixed dark scrims, over a photograph and over
the app respectively, in every theme.

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
