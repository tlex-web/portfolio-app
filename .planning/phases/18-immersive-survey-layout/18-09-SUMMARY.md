---
phase: 18-immersive-survey-layout
plan: 09
subsystem: ui
tags: [region-page, plate, pins, container-queries, sweep, server-components]
status: complete

requires:
  - phase: 18-01
    provides: "phase defaults (P1-P7)"
  - phase: 18-08
    provides: "li#photo-{slug} jump targets (tabIndex -1, :target neatline), the region page order"
provides:
  - "lib/photos/plate-layout.ts (pure; imports css-escape and overview-layout's boxesMeet): BADGE 24, DOT 8, DOT_CASING 2, GAP 8, INSET 8, PLATE_SWEEP_MIN_S 320, PLATE_SWEEP_MAX_S 634, LEADER_STEPS [12, 20, 28, 40], SAME_SPOT_PX 1"
  - "platePins(views), plateGroups(pins), plateLayout(pins, S), plateSegments(pins), plateCss(pins, containerName); types PlatePin, PlateGroup, PlatePlacement, PlateSegment"
  - "lib/regions.ts regionPlateSheet(id): { id, hillshade, contours, pins } plain props, and a load-time check that every region plate has a hillshade"
  - "components/photos/region/PlateSheet.tsx: figure > div[data-plate-sheet={id}] with [data-plate-pin=key] > [data-plate-leader], [data-plate-dot], [data-plate-unit] > a[data-plate-badge={slug}]"
  - "region page: section[aria-labelledby=region-map] with h2 'Map' after the facts"
affects: [18-10, 18-11, 18-14, 18-29]

actuals:
  tokens: 16600    # chars/4 over the plan's code diff (git diff dd336fc..82fbd60 = 66,430 chars incl. context)
  tasks: 2
  commits: 4       # measured: git rev-list --count dd336fc..82fbd60; the metadata commit follows
plan_head_before: dd336fc187f9c3e99828d2dd7b7707ef485c37ee
plan_head_after: 82fbd6069b2883765c961e7efefc409dfccecc24

tech-stack:
  added: []
  patterns:
    - "Badge units are offset from their dot by a constant per choice, so plateCss positions the dot with calc(<u> * 100cqw) and the unit and leader with plain px"
    - "Outward direction order from the nearest other dot's uv direction, so the candidate order is the same at every S"
    - "Depth-first search over candidates in ascent order returns the first legal combination; least-conflicting fallback marks a group not placed"

key-files:
  created:
    - lib/photos/plate-layout.ts
    - lib/__tests__/plate-layout.test.ts
    - components/photos/region/PlateSheet.tsx
  modified:
    - lib/regions.ts
    - "app/(site)/photos/regions/[region]/page.tsx"
    - e2e/photos-region.spec.ts

key-decisions:
  - "18-09: pins whose stored uv are under 1 px apart at S 634 share one dot (SAME_SPOT_PX). img-0680 and img-0682 are not identical (under 1 px apart), so exact equality would not group them. The shared dot is the first pin's stored uv, never a mean (T-18-24)"
  - "18-09: a badge may not cover another pin's dot. Saalfelden's aerial pair (a few px apart) therefore has both badges displaced outward with leaders, and neither is centred over the other's dot"
  - "18-09: the leader runs from the dot to the badge unit's centre and is drawn under the badges, so it shows from the dot to the badge edge (and into the gap for a shared pair)"
  - "18-09: the plate sheet's edge is a 1 px inside outline (outline-1 -outline-offset-1 outline-line), not a border, so the container side equals the box width the sweep assumes (18-13's note)"
  - "18-09: REGION-02 stays Pending: 18-10, 18-11, 18-14 and 18-29 also declare it (requirements.ready-ids: blocked)"

patterns-established:
  - "PlateSheet hooks: [data-plate-sheet=id], [data-plate-pin=key] (zero-size box at the dot), [data-plate-leader], [data-plate-dot], [data-plate-unit], [data-plate-badge=slug], data-approximate on dashed dots and badges"

requirements-completed: []  # REGION-02 stays Pending (shared with 18-10, 18-11, 18-14, 18-29)

coverage:
  - deliverable: "plateLayout places every pin's badge legibly at every S 320-634 (8 px gaps, 8 px inset, leaders to exact dots, no covered dot, no leader across a badge)"
    human_judgment: false
    verification:
      - kind: test
        ref: "lib/__tests__/plate-layout.test.ts#plateLayout SWEEP"
        status: pass
  - deliverable: "Shared spot, near pairs, count guard and slug guard"
    human_judgment: false
    verification:
      - kind: test
        ref: "lib/__tests__/plate-layout.test.ts#shared spots / near pairs / count guard / plateCss guards"
        status: pass
  - deliverable: "plateSegments and plateCss reproduce the layout at every S"
    human_judgment: false
    verification:
      - kind: test
        ref: "lib/__tests__/plate-layout.test.ts#plateCss cascades to plateLayout"
        status: pass
  - deliverable: "Region page plate: badge count and order, dashed approximate pins, pointer-only badges, inset/gap/leader geometry at 375/768/1440"
    human_judgment: false
    verification:
      - kind: e2e
        ref: "e2e/photos-region.spec.ts#Region plate pins (18-09; REGION-02)"
        status: pass
  - deliverable: "The plate's look on the dark relief (badge legibility, dashed treatment, leaders)"
    human_judgment: true
    rationale: "Visual quality is judged from screenshots; region pages are baselined in 18-14"

metrics:
  duration: "about 16 min (14:30Z to 14:46Z 2026-11-25)"
  completed: 2026-11-25
---

# Phase 18 Plan 09: Region plate with photo pins Summary

**Each region page now shows its own plate: the hillshade under the hero contours, an exact dot and a 24 px numbered badge per photo. Every element is server-rendered. A pure candidate-search layout keeps the badges 8 px apart and 8 px inside the sheet at every side from 320 to 634 px. It displaces near pairs outward with leaders back to the exact dot, and gives photos at one spot one dot with side-by-side badges.**

## Performance

- **Duration:** about 16 min
- **Started:** 2026-11-25T14:30:54Z
- **Completed:** 2026-11-25T14:46:38Z
- **Tasks:** 2 (4 commits: two RED/GREEN pairs)
- **Files:** 3 created, 3 modified

## Accomplishments

- **`plateLayout(pins, S)`**: the candidates are, in order, centred on the dot, then at each leader step (12, 20, 28, 40 px from the dot centre to the unit's facing edge) the eight directions, sorted outward. A candidate is legal when:
  - the unit stays 8 px inside the sheet;
  - it keeps 8 px from every placed unit (inclusive);
  - it covers no other pin's dot, casing included;
  - its leader crosses no placed unit, and no placed leader crosses it.

  The search is depth-first in ascent order and returns the first legal combination.
- **Sweep results (real data, S 320-634):**
  - Ortler: both pins centred, 1 segment.
  - Saalfelden: both aerial pins displaced at every S, 1 is SW12 and 2 is NE12, 1 segment.
  - Zermatt: 2 segments (break at 459). Pin 2 (img-0629) moves to S12 up to 458 and is centred after that. Pins 5 and 6 (img-0682, img-0680) share one centred dot, with the dot showing in the 8 px gap between them.
  - Every group is placed at every S.
- **`plateCss`**: the first segment is unconditional and later segments are `@container plate-{id} (min-width: …)` blocks that repeat only the rules that change. The dot is positioned at `calc(<u> * 100cqw + 0px)` / `calc(<v> * 100cqw + 0px)`, and the unit and leader as px offsets from it. Sizes: Ortler 579 B, Saalfelden 703 B, Zermatt about 1.9 kB.
- **`regionPlateSheet(id)`** returns plain props: the hillshade AVIF/WebP at 640 and 1100, `{ assets: { contours: { hero } } }` for ContourField, and the pins. A plate without a hillshade throws at module load.
- **PlateSheet** (server, zero JS):
  - The sheet is a square inline-size container with an inside 1 px outline. It is full-bleed below 640 and `max-w-xl`, centred, above that.
  - The relief is lazy at `--relief-opacity`, with ContourField `lod="hero"` over it.
  - Each group has its leader svg (1 px, ink-muted, under the badges) and the 8 px dot with its `ring-2 ring-surface` casing.
  - The badges are `<a href="#photo-{slug}" tabIndex={-1} aria-hidden="true">`: mono 600 numbers in a `size-6` circle with a 44 px `before:` hit area.
  - Approximate photos get a hollow `border-2 border-dashed border-ink` dot and a `bg-surface border-2 border-dashed border-ink text-ink` badge.
- **The region page** mounts the plate under an h2 **Map** after the facts. 18-10 adds the key list and the grid.

## Task Commits

1. **Task 1 (tracer, tdd): the base sweep, plateLayout, plateCss and the server sheet on every region page**
   - RED `625fff2` (test). 12 of 26 failed against a skeleton (constants and types, empty returns).
   - GREEN `de8e0ad` (feat). Jest 26/26. `PW_PROD=1` photos-region gave **109/109** on Chromium and Firefox, 0 flaky.
   - Tracer gate (end-of-phase, automated verify): the verify passed end to end before expansion.
2. **Task 2 (tdd): shared spots, near pairs, count and slug guards, leaders and approximate pins**
   - RED `5de4351` (test). 5 of 39 failed.
   - GREEN `82fbd60` (feat). Jest 39/39. `PW_PROD=1` photos-region gave **139/139** on Chromium and Firefox, 0 flaky (fresh build).

**Plan metadata:** the docs(18-09) commit that follows.

## TDD Gate Compliance

- Order: RED `625fff2` → GREEN `de8e0ad`, then RED `5de4351` → GREEN `82fbd60`.
- Both RED records are `RED_EVIDENCE_OK` (`target_test_failed`) from `gsd-tools check tdd-red-evidence`. They are at `.gsd/tdd-evidence/18-09/red-t1.json` and `red-t2.json` (ignored). JUnit XML came from a scratchpad Jest reporter, as in 18-08 and 18-13.
- **Task 1 RED.** The target 'gives every pin one 24 px badge with its number, and places every group' failed on `toEqual([])`: no region had any badge.
  - The 12 failures were the platePins rows, the badge-per-pin row, the 6 segment rows and the 3 cascade rows.
  - The 14 passing rows were the constants and the geometric rule rows, which loop over an empty layout. The badge-per-pin row guards them from passing vacuously; I tightened it before the RED commit so it compares against the view count.
- **Task 2 RED.** The target "gives Zermatt's img-0680 and img-0682 one dot and two badges side by side at every side" failed with two dots at S 320-634.
  - The other failures were the tolerance fixture, the hollow-dot fixture and both plateCss guard rows.
  - The near-pair and count-guard rows passed already on Task 1's behaviour.
  - A first run also failed the CSS charset row on a test bug ('=' missing from the allowed set). I fixed it before recording.
- No load, syntax or fixture fault in either RED run.

## Client JS (record-only; enforced at 18-25 and 18-29)

| Point | Total | Files | vs running total 1,861,681 B | vs cap 1,855,841 B |
|---|---|---|---|---|
| After 18-08 (running total) | 1,861,681 B | 25 | 0 | +5,840 |
| **18-09 final (after 82fbd60)** | **1,861,681 B** | **25** | **0** | **+5,840** |

Measured after `rm -rf .next/static && npm run build` as the byte sum of `.next/static/chunks/**/*.js`. The plate is a server component with no client island, so it adds no client JS.

## Verification

- Full Jest: 127 suites, **2,564 tests passed**. `npm run type-check` exits 0. `npm run lint` exits 0, including data:check, served-images and the test-count scan.
- Plan verify: `npx jest lib/__tests__/plate-layout.test.ts` 39/39. `PW_PROD=1` photos-region gave 139/139 on Chromium and Firefox.
- Extra, on the fresh measurement build: audit + keyboard + shell + seo on Chromium and Firefox gave 176/177. The one failure was the known Firefox `/offline` "Page crashed" flake (deferred-items.md, 18-06). A Firefox audit rerun gave 16/16.
- e2e rows added (data-driven; no position written):
  - one badge per photo with a position;
  - badge texts 1..N in sequence order, each `href="#photo-{slug}"` with its `li` present;
  - the Map h2;
  - a dashed 2 px badge and dot for approximate photos, and 0 px for exact ones;
  - tabindex -1 and aria-hidden on every badge;
  - a Tab walk from the page start passes the sheet without landing inside it (`@needs-tab-to-links`: the walk Tabs through links, which WebKit off Linux never does, so Linux WebKit in CI runs it);
  - at 375, 768 and 1440, every badge is 8 px inside the sheet and no two come closer than 8 px;
  - every shown leader box runs from its dot centre to its unit centre.
- A screenshot check (scratchpad, Chromium, Zermatt at 375 and 1440, Saalfelden at 375) showed what the sweep says. Pin 2's leader drops below its dot at 375, pins 5 and 6 sit side by side around one dot, Saalfelden's pair is pushed apart diagonally with short leaders, and pin 4's dashed badge reads as hollow.
- `node scripts/ci/check-snapshot-commit.mjs --sha <sha> --none` gave OK (0 changed) on all four commits. No PNG was staged, and region pages are not baselined until 18-14.
- `public/service-worker.js` was restored after every build. Both `next start` servers I launched on :3000 were stopped.
- Acceptance greps:
  - `export function plateCss` = 1;
  - `aria-hidden` in PlateSheet = 4;
  - `RangeError` in plate-layout = 8;
  - `border-dashed` in PlateSheet = 2.

## ui-ux-pro-max

ux-domain searches: "touch target hit area", "color not only indicator", "aria hidden decorative" (the last one returned off-topic rows, Overflow Hidden and ARIA Labels, so I did not use it). They returned:

- **Touch Target Size (High):** web targets need 24 CSS px plus WCAG exceptions, and 44 is the platform norm. Applied: the badge draws 24 px and hits 44 px through `before:-inset-2.5`, as the UI-SPEC asks.
- **Touch Spacing (Medium):** keep 8 px between targets. The layout keeps 8 px between badge boxes. The 44 px hit areas of side-by-side badges overlap, which is accepted because the badges are pointer-only and the key list (18-10) is the primary path.
- **Color Only (High):** do not convey information by colour alone. Precision is shown by shape (hollow dashed dot and badge), not colour (Contract 5).

No new token was added.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] "Identical uv" does not describe the Zermatt pair**
- **Found during:** Task 1 (data probe)
- **Issue:** img-0680 and img-0682 differ slightly in stored uv (under 1 px apart at every swept S). Grouping by exact equality would draw two overlapping dots and two displaced badges, not the shared dot the UI-SPEC asks for.
- **Fix:** `SAME_SPOT_PX = 1` groups pins under 1 px apart at S 634, so the grouping is the same at every S. The shared dot is the first pin's stored uv (T-18-24). A Jest fixture checks that pins further apart keep their own dots.
- **Commit:** 82fbd60

**2. [Rule 2 - Missing critical rule] A badge may not cover another pin's dot**
- **Found during:** Task 1
- **Issue:** with Saalfelden's pair 3-6 px apart, a centred badge for one hides the other's dot. That dot's leader would then end under a badge and cross it.
- **Fix:** a legality rule and a sweep row: no badge covers another group's dot (8 px plus casing). Both Saalfelden badges are displaced outward.
- **Commit:** de8e0ad

**3. [Design detail] Leaders and the sheet edge**
- The leader runs from the dot to the badge unit's centre and is drawn under the badges, so it ends visibly at the badge's round edge. A box-edge endpoint would leave a gap at a circle.
- Leaders render from Task 1, not Task 2, because Task 1's behaviour already requires a leader for every displaced badge.
- The sheet edge is an inside outline, not the plan's `border border-line`. A border would make the container side 2 px less than the box, while the sweep and the e2e inset assume they are equal (18-13's note).
- **Commit:** de8e0ad

**4. [Rule 1 - Test bugs] Corrected during GREEN**
- The side-by-side row compared float positions exactly. It now uses a 1e-9 tolerance.
- The e2e border row expected `none` for exact badges. Preflight gives every element `border-style: solid` at 0 px, so the row now checks "dashed or not" plus the width.
- **Commits:** 82fbd60

---

**Total deviations:** 4 (1 bug, 1 missing rule, 1 design detail, 1 set of test bugs). **Impact:** no scope creep. The rules are stricter than the plan, and the shared-dot rule matches the real data.

## Known Stubs

None. The plate has no figcaption yet (18-11's SheetMargin) and no key list (18-10). Both are later plans, and neither blocks this plan's goal.

## Threat Flags

None. No new endpoint or trust boundary.
- T-18-23 is mitigated. The slug pattern guard throws a RangeError for a slug or container name, every selector value goes through cssEscape, and a Jest row checks that the CSS holds only numbers, the slugs and fixed selectors.
- T-18-24 is mitigated. Pins use the stored uv, and a shared dot uses its first pin's uv. The test files and this summary hold no coordinate or uv value.

## Next Phase Readiness

- 18-10:
  - The key-list sync can target `[data-plate-badge=slug]`, which needs an accent state and must keep `data-approximate`'s dashed look.
  - `sizes` in PlateSheet assumes 576 px from 640. When the grid makes the plate 634 px at 1440, update it to the grid width.
- 18-11: SheetMargin goes in the `<figure>` as its figcaption.
- 18-14: the region baselines will include the plate. The relief is lazy, so wait for it to load before the shot.

## Self-Check: PASSED

- FOUND: lib/photos/plate-layout.ts, lib/__tests__/plate-layout.test.ts, components/photos/region/PlateSheet.tsx
- FOUND: 625fff2, de8e0ad, 5de4351, 82fbd60 (ancestors of HEAD)
- evaluation-scope for 18-09 resolved its commits on this branch
