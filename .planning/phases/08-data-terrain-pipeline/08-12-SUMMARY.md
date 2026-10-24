---
phase: 08-data-terrain-pipeline
plan: 12
subsystem: ui
tags: [footer, swisstopo, swissaltiregio, css-mask, container-queries, cqw, tailwind-v4, scale-bar, lv95, attribution, playwright, jest]

# Dependency graph
requires:
  - phase: 08-data-terrain-pipeline (08-04)
    provides: "data/generated/terrain.ts (extent, dem.edition 2026-05, contours.strip.intervalM, hashed strip URL) and Tim's sheet decisions (\"defaults\": Option A attribution, no copyright sign, 5:1/8:1/12:1 band)"
  - phase: 08-data-terrain-pipeline (08-06)
    provides: "immutable /terrain/* delivery and the SW precache of the strip"
  - phase: 08-data-terrain-pipeline (08-08)
    provides: "typed photo facts with position.approximate and uv.u"
provides:
  - "components/terrain/ContourField.tsx: server, zero-JS contour mask for every LOD"
  - "SiteFooter map-sheet margin: contour band, waypoint ticks, title, true scale bar, equidistance, LV95 extent, last surveyed, source (SHELL-04)"
  - "lib/footer-format.ts: import-free, locale-free formatters and scale tiers"
  - "site.attribution.terrain (required string in Site), the verbatim swissALTIRegio 2025+ reference"
  - "e2e describe 'Footer map legend (SHELL-04)' and a visual settle() that waits for the strip mask"
affects: [08-13 all-route visual re-baseline, phase 9 hero (ContourField lod hero), phase 10 map (ContourField lod map), phase 12 cross-browser pass]

# Actuals (#2632)
actuals:
  tokens: 8615
  tasks: 3
  commits: 4
plan_head_before: 7b4d4486a3987dca2660d0dc90141e6c77980f10
plan_head_after: c2e42f99fb0a5e54f868ada75e6b85908b89bee8

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Decorative SVG art as a CSS mask over a token background (bg-contour), never <img>, so it takes the token colour"
    - "True-scale UI from container query units: width calc(100cqw * L / extentWidthM) inside an @container footer"
    - "Breakpoint variants beyond lg: written in rem (min-[112rem]:) so Tailwind orders them after lg:"
    - "Visual settle() waits for CSS mask images through performance resource entries"

key-files:
  created:
    - components/terrain/ContourField.tsx
    - lib/footer-format.ts
    - lib/__tests__/footer-format.test.ts
    - components/site/__tests__/SiteFooter.test.tsx
    - .planning/phases/08-data-terrain-pipeline/deferred-items.md
  modified:
    - components/site/SiteFooter.tsx
    - data/site.ts
    - data/types.ts
    - .planning/PROJECT.md
    - e2e/shell.spec.ts
    - e2e/visual/routes.spec.ts

key-decisions:
  - "Attribution re-copied from the live swissALTIRegio page on 2026-10-24T19:25Z (HTTP 200): identical to the 08-04 and UI-SPEC transcriptions (631 characters, diff empty), shipped verbatim as Option A with no copyright sign"
  - "The 500 m tier variant uses min-[112rem]: (= 1792 px), not min-[1792px]:, because Tailwind 4.3 emits the px arbitrary min-width before lg:, so lg:flex overrode min-[1792px]:hidden and showed two tiers at 1792 px and up"
  - "tickLeft writes the shortest number form (65.7%, not 65.70%), which is what browsers serialise back; still 2 decimals of percent at most and locale-free"
  - "Scale-bar sr text uses a normal space ('Scale bar, 2 km'); the visual labels and the equidistance use U+00A0"
  - "The 375 px no-horizontal-scroll e2e check is scoped to the footer on / and page-wide on /roadmap, because Home's legacy v1 cards overflow at 375 on their own (logged to deferred-items.md for Phase 9)"

patterns-established:
  - "Footer reads required generated metadata; a missing field fails tsc or --check, never renders a dash"
  - "Static-source grep test for server shell components: no 'use client', motion/react, Intl, toLocale, hooks or animate- utilities"

requirements-completed: [SHELL-04, DATA-04]

coverage:
  - id: D1
    description: "Full-bleed aria-hidden contour band (strip LOD as a CSS mask over bg-contour) at 5:1 / 8:1 / 12:1 with a neatline, first child of an @container footer"
    requirement: SHELL-04
    verification:
      - kind: unit
        ref: "components/site/__tests__/SiteFooter.test.tsx#starts the footer with an aria-hidden band whose mask is the strip asset"
        status: pass
      - kind: e2e
        ref: "e2e/shell.spec.ts#Footer map legend (SHELL-04) @375/@768/@1440/@1920 (band height = width / aspect within 1 px)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Waypoint ticks: one per positioned photo at tickLeft(u), dashed exactly where position.approximate"
    requirement: DATA-04
    verification:
      - kind: unit
        ref: "components/site/__tests__/SiteFooter.test.tsx#SiteFooter waypoint ticks (D-20, DATA-04) (3 tests)"
        status: pass
      - kind: e2e
        ref: "e2e/shell.spec.ts#Footer map legend (SHELL-04) ([data-tick] count, one approximate)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Sheet margin: title, dt order, Extent/Source placement, equidistance, LV95 extent, last surveyed (May 2026), source line"
    requirement: SHELL-04
    verification:
      - kind: unit
        ref: "components/site/__tests__/SiteFooter.test.tsx#SiteFooter sheet margin (D-15, D-18) (7 tests)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/footer-format.test.ts (formatters, 31 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "True scale bar: one tier visible per breakpoint, bar = band width x L / extent.widthM, fits its cell for 10-12 km extents"
    requirement: SHELL-04
    verification:
      - kind: e2e
        ref: "e2e/shell.spec.ts#Footer map legend (SHELL-04) (|bar - band x L / W| <= 1 px; one visible 'Scale bar, ...')"
        status: pass
      - kind: unit
        ref: "lib/__tests__/footer-format.test.ts#scaleFits (E4 overflow backstop)"
        status: pass
    human_judgment: false
  - id: D5
    description: "site.attribution.terrain typed as a required string, verbatim from the live page, shown on every route"
    requirement: SHELL-04
    verification:
      - kind: e2e
        ref: "e2e/shell.spec.ts#every route credits the source with site.attribution.terrain"
        status: pass
      - kind: other
        ref: "scratchpad fetch of https://www.swisstopo.admin.ch/en/height-model-swissaltiregio (2026-10-24T19:25Z): site.ts literal === live string === 08-04 and UI-SPEC transcriptions"
        status: pass
    human_judgment: false
  - id: D6
    description: "Visual settle() waits for the hashed strip mask before capture"
    requirement: SHELL-04
    verification:
      - kind: other
        ref: "npx playwright test --list --project=visual-dark -> 36 tests (unchanged); probe: strip entry appears on /, /offline, /__no-such-page__ within ~40 ms"
        status: pass
    human_judgment: true
    rationale: "The determinism backstop (two consecutive CI visual runs pixel-identical in the footer) and the look of the band in Firefox and WebKit (RESEARCH A2) are judged in the 08-13 re-baseline, which Tim runs and commits"

# Metrics
duration: 14min
completed: 2026-10-24
status: complete
---

# Phase 8 Plan 12: Footer Map-Sheet Margin Summary

**Every page footer now shows the real swissALTIRegio contour strip as a CSS mask with photo waypoint ticks, and a swisstopo-style margin with a true container-query scale bar, 100 m equidistance, LV95 corner coordinates, "May 2026" and the verbatim source reference, all static and locale-free.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-10-24T19:22:31Z
- **Completed:** 2026-10-24T19:36:50Z
- **Tasks:** 3 (Task 1 tracer, Task 2 TDD, Task 3)
- **Files modified:** 11 (5 created, 6 modified, plus deferred-items.md)

## Accomplishments

- **Contour band (D-19).** `ContourField` masks `bg-contour` with `terrain.assets.contours[lod]`, read from the generated metadata. The band is the footer's first child, full width, `aspect-[5/1] sm:aspect-[8/1] lg:aspect-[12/1]`, with a `border-b border-line` neatline and `pointer-events-none`. Its height is reserved before the mask loads.
- **Waypoint ticks (D-20, DATA-04).** One 1 x 16 px tick per photo with a position, at `left: tickLeft(u)`. The Riffelsee scan's tick is dashed because `position.approximate` is true; no id is hard-coded.
- **Sheet margin (D-18).** "Zermatt – Matterhorn" (a `p`) and a `dl` in the order Scale, Equidistance (`100 m`), Extent (LV95) (`SW 2’616’000, 1’088’000` / `NE 2’627’000, 1’099’000`), Last surveyed (`May 2026`) and Source. Extent and Source span the columns as the UI-SPEC places them.
- **True scale bar.** Three tier variants (2 km, 1 km, 500 m). Each bar is `calc(100cqw * L / 11000)` of the `@container` footer, and the label strip has the same width. Only one variant is displayed at a time, so only one `Scale bar, ...` name is announced. `scaleFits` checks every viewport from 320 to 4096 px for extents of 10 to 12 km.
- **Attribution (D-15).** `site.attribution.terrain` is a required string in `Site`. It holds the full 2025+ swissALTIRegio reference, copied from the live page, including the source's typo "tétéchargées" and its stray "”". The footer shows `Contours derived from swissALTIRegio. ` followed by the constant, with no "©". PROJECT.md's Attribution constraint now names the constant.
- **Browser checks.** At 375, 768, 1440 and 1920 px, e2e checks the band's aspect ratio, the bar ratio (within 1 px), the tick count, 3 tab stops and footer overflow. A route loop checks the attribution on every page. The visual `settle()` now waits for the strip SVG resource and then two frames.

## Task Commits

1. **Task 1 (tracer): contour band and waypoint ticks:** `3a40caf` (feat)
2. **Task 2 RED: failing tests for the sheet margin and formatters:** `2553d77` (test)
3. **Task 2 GREEN: sheet margin, scale bar, attribution constant:** `c5cf402` (feat)
4. **Task 3: footer legend e2e and visual strip wait:** `c2e42f9` (test)

**Plan metadata:** the docs commit that follows this SUMMARY.

**Tracer gate:** this was an interactive run with `human_verify_mode` end-of-phase, and the Task 1 verify is automated only. Jest (3 suites, 19 tests), lint (0 errors / 54 warnings), type-check and build all passed. The built CSS contained `container-type:inline-size`, `aspect-ratio:5`, `aspect-ratio:8` and `aspect-ratio:12`. Tracer verified end-to-end, so the plan expanded to Tasks 2 and 3.

## TDD Gate Compliance (Task 2)

- **RED** `2553d77`: `test(08-12)`. Target `SiteFooter sheet margin (D-15, D-18) > lists the dt labels in the UI-SPEC order` failed on `toEqual` and received `[]`. The record is `.git/gsd-red/08-12-red.json` (flat TAP from the scratchpad reporter, exit 1, 41 tests, 9 pass, 32 fail), and `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`).
  - *Semantic assessment:* the target ran and failed on its assertion because the footer at `3a40caf` had no `dl`. The footer-format tests failed with TypeErrors (exports missing), which is expected and not the target. The `formatMonthYear` throw test was tightened to `toThrow(/edition/)` before the RED run, so a missing function cannot pass it. The 9 passing tests are the Task 1 tests.
- **GREEN** `c5cf402`: `feat(08-12)`. 4 suites and 53 tests pass. Two test assertions were adjusted for jsdom here (see Deviations 2).
- **REFACTOR:** none needed.

## Files Created/Modified

- `components/terrain/ContourField.tsx`: server, zero-JS mask component (`lod`, `className`).
- `components/site/SiteFooter.tsx`: `@container` footer, band, ticks and sheet margin. The identity, links and copyright rows are unchanged.
- `lib/footer-format.ts`: `formatLv95`, `formatExtentLines`, `formatMonthYear`, `formatEquidistance`, `SCALE_TIERS`, `scaleFraction`, `labelLeft`, `tickLeft`, `cellWidthPx`, `scaleFits`. No imports and no locale APIs.
- `lib/__tests__/footer-format.test.ts`: 31 formatter, tier, cell-width and fit tests.
- `components/site/__tests__/SiteFooter.test.tsx`: 15 band, tick, margin, focus and static-source tests.
- `data/types.ts`, `data/site.ts`: `attribution: { terrain: string }` and its value. The file JSDoc records the source URL, the fetch date and Tim's option.
- `.planning/PROJECT.md`: the Attribution constraint names `site.attribution.terrain` and Option A.
- `e2e/shell.spec.ts`: the `Footer map legend (SHELL-04)` describe, added below the existing tests. Existing tests are byte-identical; the diff adds 91 lines and removes none.
- `e2e/visual/routes.spec.ts`: the strip wait at the end of `settle()`.
- `.planning/phases/08-data-terrain-pipeline/deferred-items.md`: the pre-existing Home overflow at 375 px.

## Attribution fetch record

- URL: https://www.swisstopo.admin.ch/en/height-model-swissaltiregio, HTTP 200, fetched 2026-10-24T19:25:25Z.
- Extracted from the server-rendered `<em>` after "For the 2025 and all subsequent versions:" and cross-checked against the page's JSON payload. Both copies match.
- Compared with the 08-04-SUMMARY transcription and the 08-UI-SPEC transcription: all equal, 631 characters, **empty diff**. Non-ASCII characters: ü Ö – ” ’ é è à.
- `data/site.ts` literal === live string (checked by script after the write).

## Decisions Made

See `key-decisions` in the frontmatter. In addition:
- `cellWidthPx(375)` returns 155.5 (343 px content, 2 columns, 32 px gap). The UI-SPEC rounds it down to 155, and the test floors it as the plan specifies.
- `MONO_CH_PX = 8.4` (JetBrains Mono advance 600/1000 em at 14 px) sizes the end-label overrun in `scaleFits`. The tightest case is the 500 m tier at 4096 px with a 10 km extent: 242.6 px against a 248 px cell.

## ui-ux-pro-max

The skill was loaded once at the start of Task 1, as Tim's rule requires. One stack search (`"container query responsive" --stack html-tailwind`) confirmed Tailwind 4.3's built-in `@container` and that no plugin is needed, as the UI-SPEC already assumes. The skill's guidance and the approved UI-SPEC did not disagree. The one implementation change (rem instead of px for the 1792 px variant) is a Tailwind ordering fix, not a design change.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Two scale tiers visible from 1792 px**
- **Found during:** Task 2, checking the built CSS before the GREEN commit.
- **Issue:** Tailwind 4.3 emitted the `min-[1792px]:` rules (CSS offset 62k) before the `lg:` rules (offset 65k). In the 1 km variant, `lg:flex` therefore overrode `min-[1792px]:hidden`, so the 1 km and 500 m bars would both show at 1792 px and up.
- **Fix:** `min-[112rem]:` (= 1792 px), the same unit as `lg` (64rem), which Tailwind orders after `lg:`. A rebuild placed the 112rem rules after every `lg:` rule. An extra 1920 x 1080 e2e case for the 500 m tier asserts exactly one visible bar.
- **Files modified:** `components/site/SiteFooter.tsx`, `components/site/__tests__/SiteFooter.test.tsx`, `lib/footer-format.ts` (comment)
- **Committed in:** `c5cf402`; e2e in `c2e42f9`

**2. [Rule 1 - Bug, test] jsdom-sensitive assertions**
- **Found during:** Task 2 GREEN.
- **Issue:** jsdom folds `calc(100cqw * 0.181818)` to `calc(18.1818cqw)`, and the equidistance `toHaveTextContent` comparison did not match the U+00A0 string. Task 1 hit the same issue with `tickLeft`: jsdom serialises `65.70%` back as `65.7%`.
- **Fix:** Bar widths are compared through the CSSOM using a probe element. A new test asserts the literal `width:calc(100cqw * f)` in `renderToStaticMarkup` output, which is the HTML that ships. Equidistance compares `textContent` exactly. `tickLeft` now returns the shortest number form.
- **Committed in:** `3a40caf`, `c5cf402`

**3. [Rule 3 - Blocking, test scope] 375 px horizontal scroll on Home is pre-existing**
- **Found during:** Task 3.
- **Issue:** At 375 px on `/`, `scrollWidth` is 399 against a `clientWidth` of 375. The cause is the legacy v1 project card on Home, not the footer (probe: no overflowing element inside the footer; `/roadmap` and `/contact` measure 365).
- **Fix:** The legend test asserts that nothing in the footer passes the viewport on `/`. A separate test asserts no page-wide horizontal scroll on `/roadmap`. The Home overflow is logged in `deferred-items.md` for Phase 9 and was not fixed here (scope boundary).
- **Committed in:** `c2e42f9`

**4. [Process] Task 2 split into RED and GREEN commits**
- The plan names one Task 2 commit. The TDD reference requires a `test(08-12)` RED commit before the `feat(08-12)` commit, which matches 08-08 and 08-10. The feat commit uses the plan's message.

---

**Total deviations:** 4 (2 bugs, 1 test-scope blocker, 1 process)
**Impact on plan:** Deviation 1 fixes a real rendering bug at 1792 px and up that the planned 375/768/1440 checks could not see. The other three only affect the tests. Interfaces match the plan's `<interfaces>` block. `tickLeft` returns the shortest form ("65.7%") and still returns "67.75%" for 0.6775.

## Issues Encountered

- Visual specs were not run locally. On Windows, `toHaveScreenshot` would write new `-win32` PNGs, because the baselines are Linux-only. The settle wait was checked with a scratchpad probe on the dev server instead; the strip resource entry appears in about 40 ms on `/`, `/offline` and the 404 page. The all-route re-baseline is 08-13.
- Lint holds at 0 errors and 54 warnings, all pre-existing in v1 components. Jest went from 27 suites / 374 tests to 29 suites / 416 tests. `guard:tests` is OK (jest 416 + e2e 117).
- `npm run build` was run twice. `public/service-worker.js` was restored with `git checkout` before and after each run, so no injected hash was committed.

## User Setup Required

None.

## Next Phase Readiness

- 08-13 can re-baseline every route. Every footer changed, and the visual `settle()` now waits for the strip. Firefox and WebKit stroke widths inside the mask (RESEARCH A2) are a visual check in 08-13 and in Phase 12.
- SHELL-04 is also declared by 08-13. `requirements.ready-ids` reports it as blocked until 08-13's SUMMARY exists, so only DATA-04 was marked complete here.
- Phase 9 can reuse `ContourField lod="hero"`, and Phase 10 can reuse `lod="map"`.

---
*Phase: 08-data-terrain-pipeline*
*Completed: 2026-10-24*

## Self-Check: PASSED

- FOUND: components/terrain/ContourField.tsx, lib/footer-format.ts, lib/__tests__/footer-format.test.ts, components/site/__tests__/SiteFooter.test.tsx, deferred-items.md
- FOUND: commits 3a40caf, 2553d77, c5cf402, c2e42f9 (ancestors of HEAD); 4 commits measured from the ledger
- Acceptance re-run: SiteChrome.test.tsx unchanged; `@container bg-surface-raised border-t border-line` 1; motion/react, 'use client', Intl and toLocale 0 in SiteFooter, ContourField and footer-format; `attribution: { terrain: string }` 1; `attribution:` in site.ts 1; `Zermatt – Matterhorn` 1; `Footer map legend (SHELL-04)` 1; `contours-strip` in routes.spec.ts 1; shell.spec.ts diff has no removed lines
- Plan verification: Jest 4 suites / 53 tests; full Jest 29 / 416; lint exit 0; type-check exit 0; build exit 0; `playwright test e2e/shell.spec.ts --project=chromium` 29 passed; visual-dark list 36 (unchanged)
