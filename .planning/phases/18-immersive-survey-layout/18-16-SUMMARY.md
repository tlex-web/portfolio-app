---
phase: 18-immersive-survey-layout
plan: 16
subsystem: photos
tags: [lightbox, photo-page, end-card, stepping, regions, lbox-09, photo-06, lbox-08, e2e, jest]
status: complete

requires:
  - phase: 18-15
    provides: "regionViewerSet: both photo routes step through the photo's region series"
  - phase: 18-06
    provides: "TrailSign (props only, shared with EndBlock), FactsLine, nextRegion/nextRegionIn (D-11 wrap), P5 yellow tip"
provides:
  - "stepWithEnd(index, dir, n) in lib/photos/stepping.ts: positions 0..n, n is the end card; null past either end"
  - "regionEndCard(id) / regionEndCardIn(list, id) in lib/regions.ts: the card's server-built props (heading, facts parts, next region sign, allHref, announcement)"
  - "components/photos/EndCard.tsx (props only) and its EndCardProps type, re-exported from lib/regions.ts"
  - "PhotoViewer's required endCard prop and its card step, on both surfaces"
  - "e2e/photos-stepping.spec.ts (git mv from photos-carousel.spec.ts): region stepping and the end card"
affects: [18-17, 18-19, 18-20, 18-25, 18-27]

actuals:
  tokens: 22000    # chars/4 over git diff fa34b64..7b5ccc7 (87,922 chars incl. context)
  tasks: 2
  commits: 2       # git rev-list --count fa34b64..7b5ccc7; the metadata commit follows
plan_head_before: fa34b6451a68dd48080cc01e92eea788e5446cab
plan_head_after: 7b5ccc748a3ffd019a35cbfd5cf59434456510a3

tech-stack:
  added: []
  patterns:
    - "A viewer state that is not a page: the card step writes no URL and keeps the lightbox's shown slug, so close, reload and focus return all act on the last photo"
    - "A component owns its props type (EndCardProps in EndCard.tsx). The server module re-exports it with a type-only import, so the client file imports no data module"

key-files:
  created:
    - components/photos/EndCard.tsx
    - e2e/photos-stepping.spec.ts (renamed from e2e/photos-carousel.spec.ts)
  modified:
    - lib/photos/stepping.ts
    - lib/regions.ts
    - components/photos/PhotoViewer.tsx
    - "app/(site)/photos/[slug]/page.tsx"
    - "app/(site)/photos/@modal/(.)[slug]/page.tsx"
    - components/photos/__tests__/photo-viewer.test.tsx
    - components/photos/__tests__/lightbox-dialog.test.tsx
    - lib/__tests__/photos-stepping.test.ts
    - lib/__tests__/regions.test.ts
    - e2e/photos-lightbox.spec.ts
    - e2e/photos-region.spec.ts
    - .planning/phases/18-immersive-survey-layout/deferred-items.md

key-decisions:
  - "18-16: The end card's facts travel as FactsLine parts (readonly string[]), not one string joined at ' · ', so the card's lines wrap like the region page's (nowrap per part)"
  - "18-16: EndCardProps lives in components/photos/EndCard.tsx and lib/regions.ts re-exports it with a type-only import, so neither EndCard nor PhotoViewer imports lib/regions (grep guard 0)"
  - "18-16: A one-photo set keeps its 18-15 rule (no controls, no steps) and has no card; no current region has one photo"
  - "18-16: When a step across the card removes the focused element (focus in the stage, strip or card), focus moves to the step button of the direction taken; a pressed Next or Previous keeps focus by itself"
  - "18-16: The tracer row carries @no-win-webkit: Windows WebKit crashes on any soft navigation out of the lightbox after a step, with or without the card (deferred-items.md)"

requirements-completed: []  # LBOX-09's two halves are now built (18-15 set, 18-16 card), but PHOTO-06 runs through 18-29 and LBOX-09's baselines land in 18-20; left for the phase verifier

coverage:
  - id: D1
    description: "Next from a region's last photo shows the end card on both surfaces; Previous returns; no wrap; no history entry"
    requirement: "LBOX-09"
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-stepping.test.ts stepWithEnd rows; components/photos/__tests__/photo-viewer.test.tsx 'the end-of-series card (18-16; LBOX-09, D-12)'"
        status: pass
      - kind: e2e
        ref: "e2e/photos-stepping.spec.ts The end-of-series card (chromium, firefox; webkit local except @no-win-webkit rows)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The card's props are built on the server (heading, facts, next region with D-11 wrap, All regions, sentence)"
    requirement: "LBOX-09"
    verification:
      - kind: unit
        ref: "lib/__tests__/regions.test.ts \"each region's end-of-series card (18-16; LBOX-09, D-12, D-11)\""
        status: pass
    human_judgment: false
  - id: D3
    description: "The ten carousel tests are rewritten one to one as stepping tests, none deleted; the lightbox and region far-end rows rewritten"
    requirement: "PHOTO-06"
    verification:
      - kind: other
        ref: "count gate: jest 2621 -> 2640, e2e 769 -> 773; npm run guard:tests OK (3413 >= 3024)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Escape, Close photo and browser Back on the card return focus to the last figure's link, fully in view below the nav"
    requirement: "LBOX-09"
    verification:
      - kind: e2e
        ref: "e2e/photos-stepping.spec.ts '<close> on the card returns focus to the last figure, fully in view (LBOX-08) @no-win-webkit' x3"
        status: pass
    human_judgment: false

metrics:
  duration: "about 21 min (18:55Z to 19:16Z 2026-11-25)"
  completed: 2026-11-25
---

# Phase 18 Plan 16: End-of-series card (LBOX-09, second half) Summary

**When a visitor presses Next on a region's last photo, the viewer shows one more step: an end-of-series card in place of the stage and the strip. It shows 'End of the Zermatt series', Zermatt's facts line, the yellow-tipped trail sign to 'Ortler, Italy' with Ortler's facts, and 'All regions'. The counter reads 'End', and Next and Zoom are aria-disabled. The URL, the title and the lightbox's focus target stay on the last photo, and following the sign from the lightbox lands on the Ortler page with no dialog. The card's strings come from the server (regionEndCard). The ten carousel e2e tests now live on as stepping tests.**

## Performance

- **Duration:** about 21 min (2026-11-25, 18:55 to 19:16 UTC)
- **Tasks:** 2 (a tracer and a tdd task)
- **Files:** 1 created, 1 renamed, 12 modified

## Accomplishments

- `stepWithEnd(index, dir, n)` sits beside `stepIndex`, which is unchanged. Position n is the card. It returns null before photo 1 and after the card.
- `regionEndCardIn(list, id)` and `regionEndCard(id)` build `{ regionName, heading, facts, next, allHref, announcement }`. The next region comes from `nextRegionIn`, so the wrap follows D-11 (Saalfelden to Zermatt). A one-region list gives `next: null` and the one-sentence announcement.
- `EndCard` imports nothing but Link, MapTrifoldIcon, FactsLine and TrailSign. The heading is `h2#photo-title` in the dialog, so its `aria-labelledby` still resolves, and `h1` on the page.
- **PhotoViewer:**
  - `onCard` state with a ref that `step` reads.
  - The ends come from `stepWithEnd` over the position, not from prevSlug/nextSlug.
  - The card step skips replaceState and `setShown`.
  - Z does nothing on the card. A swipe right on the card's stage returns to the last photo.
  - Hide labels and Close are unchanged.
- Both routes pass `endCard={regionEndCard(regionOfPhoto(view.id))}` and throw if a photo has no region (`backFor`'s existing rule).
- Every PhotoViewer render has its card. That is both routes, `renderPage`/`renderModal` in photo-viewer.test (each fixture's own region), and the three renders in lightbox-dialog.test. `npm run type-check` passes on all three configs.
- **Tracer gate:** the tracer row passed end-to-end in Chromium and Firefox (along with the 358-test Task 1 set) before Task 2.

## Task Commits

1. **Task 1 (tracer): the end card end to end.** `bba22c8` feat(18-16): end-of-series card on both photo surfaces (LBOX-09, D-12)
2. **Task 2 (tdd): every card rule under test, the carousel rewrite, focus return.** `7b5ccc7` test(18-16): end-card rules under test; carousel spec rewritten as stepping tests (PHOTO-06)

## Test mapping (PHOTO-06: rewritten, never deleted)

### E2E: photos-carousel.spec → photos-stepping.spec (git mv)

| Old test | New test |
|---|---|
| Carousel stepper › the stepper shows one photo with the controls and never advances by itself | Region stepping › the viewer never advances by itself on a region photo |
| › the stepper keys act only with focus inside the region (Pitfall 7) | › ← and → step only in the viewer and skip the site chrome |
| › the stepper opens the lightbox and Escape returns focus to Open photo | › a sequence figure opens the lightbox and Escape returns focus to its link @no-win-webkit |
| › the stepper front photo follows a step inside the lightbox | › after steps inside the lightbox, closing returns focus to the last shown photo's figure (LBOX-08) @no-win-webkit |
| › the stepper front photo follows a step closed by browser Back at once (10-REVIEW WR-01) | › after a step closed by browser Back at once, focus returns to the shown photo's figure (10-REVIEW WR-01, LBOX-08) @no-win-webkit |
| › the stepper page loads no three.js (D-13) | › a region page loads no three.js chunk |
| 3D carousel › the 3D carousel renders one canvas and never advances by itself @chromium-only | The end-of-series card › swipe left on the last photo shows the card and swipe right returns @chromium-only |
| › 3D textures request only hashed webp derivatives, never legacy files @chromium-only | Region stepping › stepping requests only hashed manifest derivatives |
| › 3D keys step inside the region and the front photo follows the lightbox @chromium-only | The end-of-series card › keys reach the card and Previous returns; on the card the URL and title stay on the last photo, and reload shows the last photo |
| › 3D idle float stops in a hidden tab @chromium-only | › the live region announces the card sentence; the last region west to east wraps to the first |
| (new, tracer) | › tracer: Next from the last Zermatt photo shows the end card, and its sign leads to the next region with no dialog @no-win-webkit |
| (new) | › Escape on the card returns focus to the last figure, fully in view (LBOX-08) @no-win-webkit |
| (new) | › Close photo on the card returns focus to the last figure, fully in view (LBOX-08) @no-win-webkit |
| (new) | › browser Back on the card returns focus to the last figure, fully in view (LBOX-08) @no-win-webkit |

Tags: `@chromium-only` stays only on the swipe row, which uses synthetic touch pointers as photos-region's swipe row does. The derivative, keys and live-region rows need no WebGL, so they now run in every engine. `@no-win-webkit` marks the rows that close by history traversal (Escape, Close and Back all call `router.back()` or are a traversal), following photos-lightbox's convention.

### E2E: the other far-end rows

| Spec › test (title unchanged) | Change |
|---|---|
| photos-lightbox › Moving between photos › Next presses to the last photo: URL, title, counter, focus and no history entry | Far end: `Next aria-disabled` became `Next not aria-disabled`. The step onto the card is asserted in photos-stepping |
| photos-region › New photo pages › `/photos/<slug>`: steps within {region} as photo k of N … (all seven rows) | The k = N branch (`Next aria-disabled`) became `Next not aria-disabled` for every k. The header doc is updated to match |
| photos-region › the lightbox from the Ortler region page steps within Ortler (1 / 2, then 2 / 2) … | On photo 2 of 2, `Next aria-disabled` became `Next not aria-disabled` |

### Jest (added, none removed)

- photos-stepping.test: `stepWithEnd` (four rows, seven cases with it.each). stepIndex's rows are unchanged.
- regions.test: Zermatt's whole card, the Saalfelden to Zermatt wrap, every card against nextRegion, the one-region list, and the unknown id.
- photo-viewer.test: 'n / 7' for a v2.0 photo; Next on photo 7 (page and modal, h1 vs h2#photo-title); Next, Zoom and Z inert while Hide labels toggles; Previous restores photo 7 with one replaceState; ← from a focused card link moves focus to Previous; and a one-photo set has no card.

## Count gate (GUARD-03)

```
jest 2621 -> 2640, e2e 769 -> 773
test-count: jest 2640 + e2e 773 = 3413 (baseline 3024) OK
```

The `.test-count-18-16-*.tmp` files were deleted after the gate passed.

## TDD Gate Compliance (Task 2)

No RED commit exists. That is because Task 1 was the plan's tracer: it already had to implement the behaviour end to end, so the Task 2 rows written first came out green (unexpected_green), and no RED was available to commit. In place of a RED commit, a mutation check showed the rows bind to the behaviour: with `stepWithEnd`'s bound changed from `<= n` to `< n` (no card), **7 tests failed** across photos-stepping.test and photo-viewer.test. The file was restored with `git checkout -- lib/photos/stepping.ts`. The rows didn't reveal any gap, so Task 2 changed no implementation file.

## Verification

- **Jest:** the four plan suites and client-graph passed. The full suite passed: 129 suites, 2640 tests. `npm run type-check` (three configs), `npm run lint` and `check-snapshot-commit --none` (0 changed, after each commit) all passed.
- **Production e2e, Chromium and Firefox:**
  - The Task 1 set (photos-stepping, photos-lightbox, photos-region): **358 passed**.
  - The Task 2 set (the same three plus keyboard and photos-sweep): **426 passed**. 0 failed, 0 flaky.
- **Production e2e, local Windows WebKit (webkit-2388):**
  - photos-stepping: 6 passed. The @no-win-webkit rows are filtered out.
  - photos-lightbox + photos-region: everything passed except the pre-existing Hotspots D-22 row (18-15 deferred item).
- **Acceptance greps:**
  - `grep -cE "^import .*(regions|generated)"` prints 0 for both EndCard.tsx and PhotoViewer.tsx.
  - `endCard=` appears 3 times in lightbox-dialog.test.
  - `export function stepWithEnd` is present.
  - `e2e/photos-carousel.spec.ts` is gone and `e2e/photos-stepping.spec.ts` exists.

## UI (ui-ux-pro-max)

The skill was invoked before the markup, and its Quick Reference and two focused searches were applied:
- `focus content replaced dynamic --domain ux` returned Focus States (High): a visible ring on every control in a modal. Applied: the card's links use the global ring.
- `disabled button aria-disabled --domain ux` returned Disabled States (`opacity-50 cursor-not-allowed`), applied to Zoom on the card. The same search returned Back Button ("preserve history"), and the card writes no history entry, so Back still closes.
- From the Quick Reference:
  - **escape-routes:** the card always offers the next region and All regions.
  - **touch-target-size:** the sign is min-h-14 and All regions is min-h-11.
  - **reduced-motion:** the card swaps in instantly under every preference.
  - **focus-management:** focus is never dropped to the body when the stage swaps.

## Client JS (tracked per plan, decided at 18-25)

`rm -rf .next/static && npm run build` gives **1,870,093 B in 25 files**. That is **+5,914 B** against the running total of 1,864,179 B, and 14,252 B over the 1,855,841 B cap. The per-chunk figures come from a second build of the pre-plan viewer files, which also measured 1,864,179 B:

| Chunk | Before | After | Delta | What |
|---|---:|---:|---:|---|
| viewer (`25r66i_jrg76a.js`) | 39,413 | 42,424 | +3,011 | EndCard, TrailSign, FactsLine, the card step |
| icons (`0y1qj54gvh192.js`) | 8,127 | 10,762 | +2,635 | MapTrifoldIcon: Phosphor ships all six weights' path data |
| four others | | | +58, +58, +58, +94 | Module ids and hashes |

No region, registry or generated-data module reached a client chunk. The card props are built on the server. `public/service-worker.js` was restored after every build.

**One option for 18-25:** most of the icon cost could go. The server routes could pass the 'All regions' icon to the viewer as a pre-rendered element (an RSC prop), or EndCard could drop the icon. Each saves about 2.6 KB, but the first adds a non-data prop and the second departs from the UI-SPEC (MapTrifoldIcon 20). Not done here; it's Tim's call at 18-25.

## Visual baselines this plan changes (for 18-20's attribution)

No PNG was staged or committed, and `--update-snapshots` was never run.

- **None beyond 18-15's.** The card only appears after a step past the last photo, and no baselined shot takes that step. The lightbox shot (Matterhorn from Zermatt, `1 / 7`) and the photo shot (riffelsee-reflection, `4 / 7`, Next already enabled since 18-15) render the same chrome. Zoom gained `aria-disabled:*` variants, and they apply only on the card.
- **The case-study EndBlock (`box`, `coin-flip`)** is unchanged: TrailSign.tsx and EndBlock.tsx were not touched.

## Decisions Made

- **Facts as parts.** The plan said "joined at ' · '". The card uses FactsLine's parts instead, so a narrow card wraps between parts, like the region page's next-region block, and never inside '1,617–2,928 m'.
- **EndCardProps in EndCard.tsx**, re-exported from lib/regions.ts with a type-only import (see key-decisions). The plan's artifact list puts the type in lib/regions.ts, and it is exported from there.
- **One-photo sets keep 18-15's rule** (no controls, no card). A one-photo region would still reach its next region through the region page's own NextRegion block.
- **Focus on a swap.** If the swap would drop focus (for example, ← pressed while the sign has focus), focus moves to the step button of the direction taken. The pressed-button case (UI-SPEC "keeps focus on the pressed Next button") is unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] photos-region.spec's far-end rows rewritten too.**
- **Found during:** Task 1. The orchestrator's forward note from 18-15 predicted this.
- **Issue:** The seven per-photo rows asserted `Next aria-disabled` at k = N, and so did the Ortler lightbox row at 2 / 2. Both are false once the card exists.
- **Fix:** Both now assert Next enabled, with the header doc updated. Titles are unchanged and the back-link assertions are untouched (18-17 owns them).
- **Files modified:** e2e/photos-region.spec.ts. Not in the plan's files_modified list.
- **Commit:** bba22c8

**2. [Rule 2 - Correctness] Focus is kept when the card swaps out the focused element.**
- **Found during:** Task 1.
- **Issue:** ← or → pressed while focus sat in the strip, stage or card would unmount the focused element and drop focus to the body.
- **Fix:** Focus moves to the step button of the direction taken. A Jest row covers it.
- **Commit:** bba22c8 (code), 7b5ccc7 (test)

**3. [Local engine] The tracer row is tagged `@no-win-webkit`.**
- **Found during:** Task 2, local WebKit run.
- **Issue:** Following the sign crashed the WebKit page on every try. A scratch probe isolated the cause: any soft navigation out of the lightbox after any step crashes Windows WebKit under view transitions. Previous from 7 to 6 followed by `router.push` crashes it too. With no step, under reduced motion, or without `startViewTransition`, the navigation works.
- **Fix:** The tag and its comment. The issue is logged in deferred-items.md, along with the CI watch item below.

**4. [Scope] TDD RED was not possible (see TDD Gate Compliance).** The mutation check stands in for it.

## Deferred Issues

Logged in deferred-items.md under "From 18-16":
- **The Windows WebKit crash after a step.** CI's Linux WebKit runs the tracer row. If it crashes there too, this is a real Safari risk, and the fix belongs in the viewer's keyed ViewTransition boundary, not in a tag.
- **The 18-15 Hotspots D-22 row** failed again on Windows WebKit. It is pre-existing and unchanged.

## Known Stubs

None.

## Threat Flags

None.
- **T-18-35 holds:** neither EndCard nor PhotoViewer imports a data module (grep 0), and client-graph.test passes.
- **T-18-63 holds:** the card step calls neither replaceState nor pushState (photo-viewer.test asserts it), and the sign's href is the server-built regionHref.

## Next Phase Readiness

- **18-17** owns the back link and breadcrumb. The photos-region per-photo rows' back-link assertions are untouched.
- **18-19** sizes the stage. The card's stage wrapper is `flex-1` with `py-12`, so it follows the stage area on every tier.
- **18-20** re-baselines photo/\* and lightbox/\* for 18-15's change only.
- **18-25** decides the client JS (+5,914 B here, and the icon option above).

## Self-Check: PASSED

- FOUND: components/photos/EndCard.tsx
- FOUND: e2e/photos-stepping.spec.ts (and e2e/photos-carousel.spec.ts is absent)
- FOUND: lib/photos/stepping.ts (export function stepWithEnd)
- FOUND: bba22c8 (ancestor of HEAD)
- FOUND: 7b5ccc7 (ancestor of HEAD)
