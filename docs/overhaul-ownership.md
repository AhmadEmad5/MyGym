# Overhaul workstream ownership

Integration owner: **main**. All cross-cutting decisions, contract changes and
final approval route through this session.

The contract in `docs/design-system.md` is **frozen** as of the commit that
introduced it. Workstreams consume it; they do not redefine it. If a
workstream believes the contract is wrong, it reports the concern and stops
that item — it does not edit `design-tokens.css`.

## Why no browser changes the plan

This environment has no browser, no screen reader and no visual-regression
harness. Two whole categories of the mandate are therefore **not executable
here** and are not claimed anywhere in the repo:

- rendered appearance across viewports and themes
- real focus-ring / contrast / announcement verification

Everything scheduled below is chosen because it is verifiable by **reading code
and running the gates** — semantics, names, keyboard handlers, dead-code
proof, token convergence. Nothing that would require looking at pixels.

## Workstreams

| ID | Area | Files (exclusive) | Verify by |
| --- | --- | --- | --- |
| **E** | Accessibility completion in directories the earlier pass could not touch | `src/components/admin/**`, `src/components/layout/**`, `src/components/mobile/**`, `src/components/routines/ExerciseRow.tsx`, `src/components/routines/SetEditor.tsx`, `src/components/routines/ProgramDetail.tsx`, `src/components/TDEECalculatorModal.tsx` | `npm run typecheck`, static audit for unnamed icon-only buttons |
| **F** | Dead CSS and token-convergence debt | `src/styles/**` and `src/index.css` **except** `design-tokens.css` | grep proof each removed selector has zero consumers; contract test still green |

## Hard boundaries

- **No workstream may edit `src/styles/design-tokens.css`** — frozen.
- **No workstream may edit `src/main.tsx`** — import order is contract-tested.
- **No workstream may add a dependency.** No jsdom, testing-library, axe,
  playwright or prettier may be introduced in this pass. That is a decision
  for the owner, recorded in the handover.
- **No workstream may commit.** Changes land in the working tree and the
  integration owner commits them.
- **No workstream may weaken a test.** The contract test is a gate, not a
  suggestion.

## Dependency order

E and F touch disjoint file sets and can run concurrently. Integration order is
E then F, because F's token-convergence work is easier to review once E's
semantic changes have settled. Both are independent of the backend work already
landed in `2cca30c`.

## Explicitly deferred (not scheduled)

| Item | Why |
| --- | --- |
| Migrating `--premium-*` into `design-tokens.css` | Changes rendering in 7 themes with no way to verify. Needs a browser. |
| Collapsing `--radius-*` and `--theme-radius` | Requires deciding what a theme's corner radius means. Product decision. |
| Removing the 55 shadowed `index.css` declarations | Mechanical, but it is the same change as the migration above; do it once, together, with a rendered comparison. |
| `SegmentedMacroPill` bar always filling 100% | Behavioural. Needs a decision on whether the bar should show absolute progress or normalised progress. |
| `SegmentedMacroPill` 14–18px tap targets | Cannot be fixed with `min-height`; needs the bar made non-interactive or given a separate hit layer. Design decision. |
| 16 remaining stale-snapshot rollbacks in `useData.tsx` | Real robustness debt, but it belongs with the data layer, not the design overhaul. Scheduled separately. |
