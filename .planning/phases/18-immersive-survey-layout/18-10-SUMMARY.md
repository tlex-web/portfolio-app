---
phase: 18-immersive-survey-layout
plan: 10
subsystem: ui
tags: [region-page, plate, key-list, anchors, has-selector, server-components, a11y]
status: complete

requires:
  - phase: 18-01
    provides: "P2 default: anchor jumps are instant in every mode"
  - phase: 18-08
    provides: "li#photo-{slug} jump targets (tabIndex -1, :target ink neatline), the global scroll-margin-top"
  - phase: 18-09
    provides: "PlateSheet with [data-plate-badge=slug] anchors, plateCss, PlatePin"
provides:
  - "components/photos/region/PlateKey.tsx (server): default PlateKey({ pins: PlateKeyRow[] }), PlateKeyRow = PlatePin & { title, altitudeLabel }; section[aria-labelledby=region-map] > h2 Map + ol[aria-label='Photographs on the map, lowest first'] > a[data-key-row=slug] > span[data-key-badge]"
  - "lib/photos/plate-layout.ts plateCss: per-pin :has() sync rules under [data-plate-root], unconditional, after the segments"
  - "Region page: div[data-plate-root] facts and plate block; one column below 1024 px, 2fr/3fr grid from 1024 px (plate 634 px at 1440); DOM order Facts, plate, key list"
  - "PlateSheet sizes '(min-width: 1024px) 634px, (min-width: 640px) 576px, 100vw'"
affects: [18-11, 18-14, 18-25, 18-29]

actuals:
  tokens: 7250     # chars/4 over the plan's code diff (git diff b413dec..ce5d58d = 29,009 chars incl. context)
  tasks: 2
  commits: 3       # measured: git rev-list --count b413dec..ce5d58d; the metadata commit follows
plan_head_before: b413decb7a6da65cb1beb0f9a8859db6aea6b071
plan_head_after: ce5d58dd2a0b5da692455f79de120f25a1dc7427

tech-stack:
  added: []
  patterns:
    - "List-map sync in CSS: [root]:has([row=slug]:is(:hover,:focus-visible)) target, [root]:has([badge=slug]:hover) target, emitted in the sheet's own server style element (the overviewCss syncRules precedent)"
    - "A grid whose DOM order differs from its column order only across columns: the plate spans both rows of column 2, so the left column's visual order equals the tab order"

key-files:
  created:
    - components/photos/region/PlateKey.tsx
  modified:
    - lib/photos/plate-layout.ts
    - lib/__tests__/plate-layout.test.ts
    - components/photos/region/PlateSheet.tsx
    - "app/(site)/photos/regions/[region]/page.tsx"
    - e2e/photos-region.spec.ts

key-decisions:
  - "18-10: the sync root is a new [data-plate-root] on the facts and plate block, not the sheet's figure: the key list sits outside the figure, so only a common ancestor can hold both sides of the :has() rule"
  - "18-10: P2 as drafted (Tim's 18-01 answer): native anchors only, instant in every mode, no client handler; the sync adds 0 B of client JS"
  - "18-10: the h2 Map heads the key list (PlateKey's own section); below 1024 px the plate therefore sits between the facts list and the Map heading, as the UI-SPEC column order reads"
  - "18-10: the accent state changes fills only (badge background and text, row fill, the ::before bar), so an approximate badge keeps its dashed ink border"
  - "18-10: REGION-02 stays Pending: 18-11, 18-14 and 18-29 also declare it"

patterns-established:
  - "Key row hooks: [data-key-row=slug] (the anchor, relative, carries the ::before bar), [data-key-badge] (the row's 24 px badge), data-approximate on dashed key badges"

requirements-completed: []  # REGION-02 stays Pending (shared with 18-11, 18-14, 18-29)

coverage:
  - deliverable: "Key list of anchors, one row per pin in sequence order, 44 px rows, named by title and altitude label"
    human_judgment: false
    verification:
      - kind: test
        ref: "e2e/photos-region.spec.ts#Region plate key and jumps: the key list has one anchor row per pin"
        status: pass
  - deliverable: "Key row and badge jumps land 16 px under the nav, no dialog, next Tab reaches the photo link, ink neatline"
    human_judgment: false
    verification:
      - kind: test
        ref: "e2e/photos-region.spec.ts#clicking key row 3 / a badge click lands like a key row"
        status: pass
  - deliverable: "Facts and plate grid: key list left of the plate at 1024, DOM order Facts, plate, key list; plate 634 px at 1440"
    human_judgment: false
    verification:
      - kind: test
        ref: "e2e/photos-region.spec.ts#at 1024 the key list lies left of the plate / at 1440 the plate is the 3fr column"
        status: pass
  - deliverable: "List-plate :has() sync (row hover or focus-visible, badge hover), slug-guarded and cssEscaped"
    human_judgment: false
    verification:
      - kind: test
        ref: "lib/__tests__/plate-layout.test.ts#emits the list-plate :has() sync selectors for every pin"
        status: pass
      - kind: test
        ref: "e2e/photos-region.spec.ts#hovering key row 2 marks its badge accent / a focus-visible key row"
        status: pass
  - deliverable: "Keyboard path never stops on a badge; instant jump under reduced motion; jumps work without JavaScript"
    human_judgment: false
    verification:
      - kind: test
        ref: "e2e/photos-region.spec.ts#the Tab path never stops on a badge / under reduced motion / with JavaScript off"
        status: pass
  - deliverable: "Visual quality of the key list and the grid at 375, 768, 1024 and 1440"
    human_judgment: true
    verification:
      - kind: manual
        ref: "region pages join the visual suite at 18-14"
        status: pending

metrics:
  duration: "about 25 min"
  completed: 2026-11-25
---

# Phase 18 Plan 10: Plate Key List and Jumps Summary

**The region plate gets a key list of `#photo-{slug}` anchor rows in a 2fr/3fr facts-and-plate grid, and the rows and the plate badges highlight each other through server-emitted CSS `:has()` rules. Jumps are native, instant, work without JavaScript, and never open the lightbox.**

## Performance

- Duration: about 25 min (reading and the ui-ux-pro-max pass included)
- Tasks: 2 (a tracer, then a TDD task)
- Files: 1 created, 5 modified
- Client JS: unchanged (0 B added)

## Accomplishments

- `PlateKey` (server component, no JS): the h2 **Map** and `<ol aria-label="Photographs on the map, lowest first" class="mt-4">`. Each row is `<a href="#photo-{slug}" data-key-row>` with `min-h-11`, a 24 px aria-hidden badge (solid, or hollow and dashed when the position is approximate), the title and the mono altitude label. Titles wrap. The page builds the rows on the server from `regionPlateSheet` pins plus `regionPhotoViews` titles and altitude labels.
- Region page: a `data-plate-root` block, `mt-12` and one column below 1024 px. From 1024 px it is `mt-16 grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] grid-rows-[auto_1fr] gap-8`, with Facts in row 1 and the key list in row 2 on the left, and the plate spanning both rows on the right (633.6 px at 1440). The DOM order is Facts, plate, key list.
- `PlateSheet`: `sizes` now covers the 634 px column. The figure is `sm:w-full` and `lg:mx-0 lg:max-w-none` in the grid, and badges get the `--duration-fast` colour transition.
- `plateCss` adds `syncRules(slug)` for each pin. A hovered or focus-visible row, or a hovered badge, turns the plate badge accent (with ink-inverse text). It also gives the row the overlay fill, a 2 px accent `::before` bar (inset 8 px top and bottom) and an accent row badge. Only fills change, so dashed badges keep their dashed border. The rules come after every `@container` block, are unconditional, and go through the same SLUG guard and `cssEscape` as the positions (T-18-60).
- Jumps (D-08, P2 as drafted): native anchors only. The global `scroll-margin-top` lands the top collar 16 px under the nav, the li's `tabIndex=-1` moves the focus starting point so the next Tab reaches the photo link, and `:target` turns the neatline ink.

## Task Commits

| # | Task | Commit | Type |
|---|------|--------|------|
| 1 | End-to-end jump: key list, grid, key-row landing (tracer) | 0a11feb | feat |
| 2 | RED: sync selector rows | 3dfc4fb | test |
| 2 | GREEN: sync rules, badge transition, e2e rows | ce5d58d | feat |

## TDD Gate Compliance

- RED (3dfc4fb): two rows failed against the 18-09 `plateCss`. "keeps the dashed look" failed on its count (0 sync rules against 4 × pins). "emits the list-plate :has() sync selectors" also failed, but partly because of a defect in the test: it passed Playwright-style messages to Jest's `expect` ("Expect takes at most one argument"). The count row is the valid RED evidence.
- GREEN (ce5d58d): `syncRules` is added and the messages are dropped from the RED row. The suite passes 41 of 41.
- REFACTOR: none needed.

## Client JS (record-only; enforced at 18-25 and 18-29)

Measured after ce5d58d: `rm -rf .next/static && npm run build`, then the byte sum of `.next/static/chunks/**/*.js` = **1,861,681 B**, then `git restore public/service-worker.js`.

- Delta against the running total 1,861,681 B: **0 B**. The sync is pure CSS and PlateKey is a server component.
- Against the cap 1,855,841 B: still 5,840 B over, an excess that predates this plan (Tim: "Track it, decide at 18-25").

## Verification

- `npx jest lib/__tests__/plate-layout.test.ts`: 41/41. Full Jest: 127 suites, 2,566 tests passed.
- `PW_PROD=1 npx playwright test e2e/photos-region.spec.ts --project=chromium --project=firefox`: 151/151 after Task 1 and 163/163 after Task 2, with no flaky or retried tests. `public/service-worker.js` was restored after each run.
- `npm run type-check` and `npm run lint` (eslint and every guard) pass.
- `node scripts/ci/check-snapshot-commit.mjs --sha <sha> --none`: OK (0 changed) on 0a11feb, 3dfc4fb and ce5d58d. No PNG was touched.
- Acceptance greps: "Photographs on the map, lowest first" appears 1 time in PlateKey.tsx; `:has(` appears 3 times in plate-layout.ts; `scroll-behavior: smooth` appears 0 times in globals.css.
- Tracer gate: auto mode re-ran the full spec end to end after Task 1 (151 passed) before Task 2 expanded on it.

## ui-ux-pro-max

The skill was invoked before the markup. Focused searches (`--domain ux`):
- "keyboard tab order visual order" returned Keyboard Navigation (High): keep the tab order aligned with the visual order. This is met: pins are `tabIndex=-1` and the left column's order (Facts, key list) is the tab order. Hover States (Medium) asks for a cursor and a subtle change: rows have `cursor-pointer` and the overlay fill.
- "hover state transition color" returned Color Only (High): the active row shows the 2 px bar as well as the fill, so the state is not colour alone. Cancellable State Transitions (High): the CSS transitions are colour-only and interruptible.
- Quick Reference checks applied: `touch-target-size` (44 px rows), `cursor-pointer` and `tap-delay` (touch-manipulation) on rows, `reduced-motion` (no motion; the jump is instant), and `focus-states` (the global ring on rows). No "Smooth Scroll" was applied, as P2 and the UI-SPEC require.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added a `[data-plate-root]` wrapper as the sync root**
- **Found during:** Task 2 (design, before code)
- **Issue:** The plan placed the sync selectors "under the sheet's figure root", but the key list is outside the plate figure, so a `:has()` rule rooted at the figure could never see a row.
- **Fix:** The facts and plate block carries `data-plate-root`, and the rules are rooted there (the same shape as the overview's `[data-overview]`).
- **Files modified:** app/(site)/photos/regions/[region]/page.tsx, lib/photos/plate-layout.ts
- **Commits:** 0a11feb, ce5d58d

**2. [Rule 1 - Bug] Jest `expect` with a message argument in the RED row**
- **Found during:** Task 2 GREEN
- **Issue:** Jest's `expect` takes one argument; the RED row used Playwright's two-argument form.
- **Fix:** Dropped the messages. The rule lookups still name the target in the selector.
- **Files modified:** lib/__tests__/plate-layout.test.ts
- **Commit:** ce5d58d

**3. [Rule 1 - Bug] Prettier formatting of the Task 1 e2e rows**
- **Found during:** Task 2 RED (prettier --check)
- **Issue:** The Task 1 commit left Prettier-unformatted lines in e2e/photos-region.spec.ts. ESLint passed, so the lint gate did not catch it.
- **Fix:** Ran prettier --write. The fix landed in the Task 2 GREEN commit.
- **Commit:** ce5d58d

**4. [Scope] PlateSheet changed in Task 1, not only Task 2**
- The grid needed the figure's width classes and the 634 px `sizes` (18-09's forward note) for the Task 1 layout rows, so those PlateSheet edits went in 0a11feb. The badge transition went in ce5d58d.

## Known Stubs

None.

## Threat Flags

None. The only new surface is the `:has()` rules in the existing server style element. They are covered by T-18-60: the slug guard and `cssEscape`, the Jest row, and the existing "built only from numbers, the slugs and fixed selectors" row, which still passes. No client handler was added, so T-18-61 does not arise.

## Next Phase Readiness

- 18-11: the plate figure has no `<figcaption>` yet. SheetMargin goes in the PlateSheet figure, which in the grid is the right column's only child.
- 18-14: region pages join the visual suite. The facts and plate grid, the key list and the sync states are new pixels to baseline. No PNG changed here.
- The Firefox `/offline` flake in deferred-items.md did not occur: the audit spec was not part of this plan's runs.

## Self-Check: PASSED

- FOUND: components/photos/region/PlateKey.tsx
- FOUND: 0a11feb, 3dfc4fb, ce5d58d (ancestors of HEAD)
