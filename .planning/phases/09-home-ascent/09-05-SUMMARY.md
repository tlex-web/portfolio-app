---
phase: 09-home-ascent
plan: 05
subsystem: ui
tags: [nextjs, react-server-components, tailwind, home, a11y, skip-link, jest, playwright, phosphor]

requires:
  - phase: 09-01
    provides: "HeroBlock, TrailSigns, lib/home-format (formatLatLon, formatKilometres, formatYearRange), data/home.ts DRAFT About/contact copy"
  - phase: 09-02
    provides: "components/home boundary test (new Home files checked automatically)"
  - phase: 09-03
    provides: "buildWaypoints() (order, altitudeM, approximate, shortPlace, position, years) and the AscentHero waypoint ol"
  - phase: 08
    provides: "terrain.summit (name, officialM, lv95), lowestDemM, lib/geo wgs84ToLv95/lv95ToWgs84, lib/photo-format formatMetres"
provides:
  - "lib/ascent/summit.ts: PlaqueStat, SummitPlaque type, summitPlaque(waypoints?) deriving kicker, title, height and the four UI-SPEC stats"
  - "components/home/SummitPlaque.tsx: section#summit[tabindex=-1][aria-labelledby=summit-title][data-ascent-block=summit], survey plate, two-column dl, repeated TrailSigns; last AscentHero track child"
  - "HeroBlock cue row: 'Start the ascent' -> #waypoint-{first slug}, 'Skip to the summit' -> #summit (HOME-03 skip link)"
  - "components/home/AboutSection.tsx: About and contact block after AscentHero (DRAFT copy from data/home.ts)"
  - "e2e/shell.spec.ts skip-link helper by exact global name, plus the rule that only 'Skip to the summit' on / may also match /skip to/i"
  - "e2e/home-ascent.spec.ts describe 'Summit, trail signs and About (HOME-03, HOME-06)' (7 tests)"
affects: [09-06, 09-07, 09-08, 09-10, 09-12, 09-14]

actuals:
  tokens: 6900
  tasks: 3
  commits: 5
plan_head_before: 2c3ba062c65966da0fbf3058b44fc40faabb389a
plan_head_after: 275ca94e8339c1af96b843487501f10cf9bfc05d

tech-stack:
  added: []
  patterns:
    - "Plaque facts come from one pure summitPlaque(), recomputed in the unit test and fed synthetic waypoints to prove nothing is typed"
    - "Plaque values wrapped in whitespace-nowrap spans: NBSP keeps units on numbers, but '2019–2021' could still break after the en dash"
    - "Page-level skip cues coexist with the shell SkipLink by testing the global link by exact name and pinning every other /skip to/i match"

key-files:
  created:
    - lib/ascent/summit.ts
    - lib/__tests__/ascent-summit.test.ts
    - components/home/SummitPlaque.tsx
    - components/home/AboutSection.tsx
    - components/home/__tests__/summit.test.tsx
  modified:
    - components/home/AscentHero.tsx
    - components/home/HeroBlock.tsx
    - app/(site)/page.tsx
    - e2e/shell.spec.ts
    - e2e/home-ascent.spec.ts
    - e2e/homepage.spec.ts

key-decisions:
  - "Highest-photograph ties keep the earlier waypoint in ascent order (reduce with a strict >); the note is shortPlace plus ', approx.' only when the position is approximate"
  - "The shell e2e asserts the exact-name global skip link count 1, 'Skip to the summit' count 1 on / and 0 elsewhere, and the /skip to/i total (2 on /, 1 elsewhere, 1 on every 404 path), so no third skip link can slip in"
  - "The no-JS first-viewport test in e2e/homepage.spec.ts scopes its targets to [data-ascent-block=hero], because the summit repeats the kicker and the trail signs by design (D-13)"
  - "About links use the 07 .prose-link class (accent, underline 0.2em, decoration 1 px, accent-hover) rather than a re-typed utility list"

patterns-established:
  - "The summit block reuses the hero's below-768 px vertical scrim (md:hidden); from 768 px the solid plate needs none"

requirements-completed: [HOME-03, HOME-06]

coverage:
  - id: D1
    description: "summitPlaque() returns the UI-SPEC stats Height gained 2,861 m; Highest photograph 2,760 m / Riffelsee, approx.; Photographed 2019–2021; Distance from Zermatt 7.7 km / straight line; kicker = formatLatLon(lv95ToWgs84(summit.lv95)), title 'Matterhorn summit', height '4,478 m'; each value recomputed from the data; legacy claims absent"
    requirement: HOME-06
    verification:
      - kind: unit
        ref: "lib/__tests__/ascent-summit.test.ts#summitPlaque on the committed data (HOME-06, D-03)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Synthetic waypoints: an exact highest photograph drops 'approx.', an altitude tie keeps the earlier waypoint, one shared year prints once, the distance is measured from the first waypoint and names its place"
    requirement: HOME-06
    verification:
      - kind: unit
        ref: "lib/__tests__/ascent-summit.test.ts#summitPlaque on synthetic waypoints (derived, never typed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "SummitPlaque renders section#summit (tabindex -1, aria-labelledby summit-title, data-ascent-block summit), the derived kicker and height, four dt/dd stats in order with block muted notes, and one Trail signs list; in Chromium the plaque values and two trail-sign groups (hero and summit) with data-built names are visible"
    requirement: HOME-06
    verification:
      - kind: unit
        ref: "components/home/__tests__/summit.test.tsx#SummitPlaque (HOME-06, D-03, D-13)"
        status: pass
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#plaque shows the derived summit stats; trail signs appear in the hero and at the summit"
        status: pass
    human_judgment: false
  - id: D4
    description: "Hero cue row: Start the ascent -> #waypoint-matterhorn-from-zermatt (resolves on /), Skip to the summit -> #summit; clicking it sets the hash, focuses #summit and leaves its top inside the viewport; each link min-h-11 with one aria-hidden svg"
    requirement: HOME-03
    verification:
      - kind: unit
        ref: "components/home/__tests__/summit.test.tsx#HeroBlock cue links (HOME-03, D-13, D-15)"
        status: pass
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#Skip to the summit moves focus to the summit; Start the ascent resolves to the first waypoint"
        status: pass
    human_judgment: false
  - id: D5
    description: "One global 'Skip to main content' link on every route and 404 path; 'Skip to the summit' is the only other /skip to/i link, on / only"
    requirement: HOME-03
    verification:
      - kind: e2e
        ref: "e2e/shell.spec.ts#Shell landmarks (7 routes) and Shell 404 (5 paths)"
        status: pass
    human_judgment: false
  - id: D6
    description: "AboutSection after AscentHero: region labelled by h2 About, body and contact line from data/home.ts, prose links to /contact and /roadmap; heading outline in main is h1, 4 card h2s, 'Matterhorn summit', 'About', no h3-h6; no horizontal overflow and no wrapped plaque value at 375 px"
    verification:
      - kind: unit
        ref: "components/home/__tests__/summit.test.tsx#AboutSection (D-14, DRAFT copy)"
        status: pass
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#heading outline has no skipped level; About and contact; nothing overflows at 375 px"
        status: pass
    human_judgment: false
  - id: D7
    description: "Visual quality of the summit plate, the cue row and the About block (spacing, scrim legibility over the final frame), and the About/contact wording"
    verification: []
    human_judgment: true
    rationale: "Visual judgement and copy approval: the About and contact copy is DRAFT until Tim's 09-12 checkpoint; visuals are baselined in 09-14"

duration: 15min
completed: 2026-10-25
status: complete
---

# Phase 9 Plan 05: Summit plaque, skip cue and About Summary

**The ascent now ends at a summit section: a flat survey plate with the hero's derived `45.9764 N · 7.6586 E` kicker, "Matterhorn summit", `4,478 m` and four static stats computed by `summitPlaque()` from the terrain, photo and geo data (Height gained 2,861 m, Highest photograph 2,760 m / Riffelsee, approx., Photographed 2019–2021, Distance from Zermatt 7.7 km / straight line), followed by the same two trail signs as the hero. The hero gained "Start the ascent" and "Skip to the summit" cue links (the second jumps past the ascent and focuses `#summit`), and a plain About and contact block follows the ascent.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-10-25T00:13:31Z
- **Completed:** 2026-10-25T00:29:06Z
- **Tasks:** 3
- **Files modified:** 11 (5 created, 6 modified)

## Accomplishments
- `lib/ascent/summit.ts` derives every plaque value: the official summit height minus `lowestDemM`, the highest waypoint and its short place (", approx." only when hand-placed), the capture-year span and the LV95 straight-line distance from the first waypoint to the summit (`Math.hypot` over metres). The unit test recomputes each value and feeds synthetic waypoints to show they follow the data.
- `SummitPlaque` is `section#summit` (tabIndex -1, labelled by its h2, `data-ascent-block="summit"`), one stage tall in tall modes, bottom-docked under the hero's 0.5-floor scrim below 768 px and centred from md, and natural height under reduced motion. It is the last child of the AscentHero track.
- HeroBlock's cue row uses Phosphor `ArrowDownIcon` / `ArrowLineDownIcon` from `dist/ssr` (20 px, aria-hidden). The links are plain fragment anchors, so the jump is native with no smooth scrolling.
- The shell skip-link check now counts the exact global name, so all 12 `toHaveCount(1)` assertions keep their 07-27 meaning. It also pins "Skip to the summit" as the only other `/skip to/i` link, present on / only.
- AboutSection renders the DRAFT body and contact line from `data/home.ts`, with `.prose-link` links to /contact and /roadmap. It uses no Motion and no view-triggered animation.
- Measured in Chromium (temporary probe, not committed), at the test viewport's 365 px clientWidth (375 minus the stable gutter): the plaque is 333 px wide and each stat column 130 px. "Highest photograph" and "Distance from Zermatt" wrap to two lines, values stay on one line, and `scrollWidth` equals `clientWidth`. At 768 and 1440 px the plate is 448 px and each column 187 px. The summit block is 748 px tall at 812 px viewport height. The About block is 457 px at 375 px and 337 px at ≥768 px.

## Task Commits

1. **Task 1 RED: failing tests for the derived summit plaque**: `8e4864c` (test)
2. **Task 1 (tracer) GREEN: summit section, derived plaque, cue row, shell skip-link rewrite**: `76e7a10` (feat)
3. **Task 2 RED: failing tests for the summit, cue links and About section**: `3dd018e` (test)
4. **Task 2 GREEN: About and contact block below the ascent**: `f916ff3` (feat)
5. **Task 3: summit, trail signs, skip link and About e2e**: `275ca94` (test)

No REFACTOR commit was needed.

Tracer gate: the run is interactive, `human_verify_mode` is end-of-phase (the default) and the verify is automated-only. Task 1 passed Jest (8/8), lint, type-check and Playwright shell + homepage (36/36), so expansion continued with no checkpoint.

## TDD Gate Compliance

- **RED 1** (`8e4864c`): `lib/__tests__/ascent-summit.test.ts` with a signature-only `summitPlaque` stub (empty strings, `stats: []`). Run through the session's flat-TAP Jest reporter (as in 09-01/09-03); `check tdd-red-evidence` returned **RED_EVIDENCE_OK** (`target_test_failed`, format `tap`, no report errors): 8 tests, 1 pass, 7 fail. Target `… > summitPlaque on the committed data (HOME-06, D-03) > prints the four UI-SPEC stats in order`.
  - **Semantic assessment:** the target ran and failed on its `toEqual` against the stub's empty `stats`. There was no load, import, syntax or fixture fault. The test that passed in RED ("never shows the unsourced legacy claims") is a negative check, and the empty stub already satisfies it.
- **GREEN 1** (`76e7a10`): 8/8. The first GREEN run failed 4 tests. The cause was a test bug, not an implementation bug: the `NBSP` constant had been saved as a plain space, the same slip 09-03 recorded. It was fixed to U+00A0 in the GREEN commit.
- **RED 2** (`3dd018e`): `components/home/__tests__/summit.test.tsx` with an `AboutSection` stub returning null. **RED_EVIDENCE_OK** (`target_test_failed`, `tap`): 9 tests, 6 pass, 3 fail. Target `… > AboutSection (D-14, DRAFT copy) > is a region labelled by its h2 About`.
  - **Semantic assessment:** the target ran and failed because no About heading exists (`getByRole` found nothing in the stub's empty render), which is the missing behaviour. The SummitPlaque and cue-link tests passed in RED because Task 1 had already built them, as the plan orders, so they act as characterisation tests.
- **GREEN 2** (`f916ff3`): summit, hero and boundary suites 24/24. Full Jest: 38 suites, 503/503.

## Files Created/Modified
- `lib/ascent/summit.ts`: `PlaqueStat`, `SummitPlaque`, `summitPlaque()`.
- `components/home/SummitPlaque.tsx`: the summit section, plate, stats and trail signs.
- `components/home/AboutSection.tsx`: About and contact.
- `components/home/AscentHero.tsx`: renders `<SummitPlaque />` after the waypoint list.
- `components/home/HeroBlock.tsx`: the cue row.
- `app/(site)/page.tsx`: `<AscentHero />` then `<AboutSection />`.
- `e2e/shell.spec.ts`: exact-name skip-link helper, `anySkipLinks` / `summitSkipLinks` checks.
- `e2e/homepage.spec.ts`: no-JS first-viewport targets scoped to the hero block (deviation 1).
- `e2e/home-ascent.spec.ts`: the 7-test summit/About describe (12 tests in the file).
- Tests: `lib/__tests__/ascent-summit.test.ts` (8), `components/home/__tests__/summit.test.tsx` (9).

## Decisions Made
See key-decisions. In short: altitude ties keep the earlier waypoint, the shell pins the full set of skip links, the no-JS hero test is scoped to the hero, and the About links use `.prose-link`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The no-JS first-viewport test now targets the hero block**
- **Found during:** Task 1 verification (`e2e/homepage.spec.ts` was in the verify command but not in the plan's file list)
- **Issue:** "Home without JavaScript" expected exactly one kicker and one of each trail-sign link inside `#main-content`. The summit repeats both by design (D-13), so both viewports failed with "Expected 1, Received 2".
- **Fix:** The targets are now located inside `[data-ascent-block="hero"]`, and the test also asserts that `main` holds exactly one h1. It still checks the same things: the hero copy is visible above the fold with no horizontal scroll.
- **Files modified:** e2e/homepage.spec.ts
- **Verification:** homepage + shell 36/36 on chromium; homepage `--repeat-each=3` 21/21.
- **Committed in:** 76e7a10

**2. [Rule 1 - Bug] Value spans do not wrap**
- **Found during:** Task 1
- **Issue:** NBSP keeps "2,861 m" together, but "2019–2021" can still break after the en dash in a 130 px column, which breaks the "values never wrap" truth.
- **Fix:** Each dd value sits in a `whitespace-nowrap` span, and the note is a second `block text-sm text-ink-muted` span.
- **Verification:** The 375 px e2e test asserts each value is one line (height < 30 px) inside its column.
- **Committed in:** 76e7a10

**3. [Plan wording] Comments reworded for the no-Motion grep**
- The acceptance grep `whileInView|motion\.` matched prose in the JSDoc ("reduced motion." and a mention of the legacy `whileInView`). The comments were reworded so the count is 0 for both files. The code never used Motion.

---

**Total deviations:** 2 auto-fixed (both Rule 1) plus 1 note on criterion wording.
**Impact on plan:** Every must-have holds. No scope creep.

## Issues Encountered
- On one combined Playwright run, two `homepage.spec.ts` nav-click tests ("should navigate to photos/projects page") timed out at 15 s with the URL still `/`. That happened while the dev server was compiling the edited routes. The next runs passed: homepage `--repeat-each=3` 21/21, homepage + shell 36/36, and the plan verification (home-ascent + shell + homepage) 48/48. This is a dev-server cold-compile flake, not a code change.
- **Cue row at 375 px:** the must-have says the two links "wrap onto separate lines" at 375 px. Measured, they fit on one row: 144 + 24 + 164 = 332 px inside a 333 px column at the test's 365 px clientWidth, and 343 px on a real 375 px phone with no gutter. `flex-wrap` stays, so they wrap whenever they do not fit and nothing overflows (asserted). One spare pixel at the test width means a font-metric change could flip it onto two rows; the 09-14 baselines will show which. I added no forced line break, because the UI-SPEC's intent is no overflow.
- `npm run lint` prints the same 24 legacy warnings as before, with 0 errors. All guards report OK.
- The `home/*` visual baselines are still out of date, as expected. They are re-baselined in 09-14.

## Known Stubs
None. Every plaque value is wired to committed data. The About and contact copy is real but marked DRAFT in `data/home.ts` (`status: 'draft'`) for Tim's 09-12 copy checkpoint. That is a planned approval gate, not a stub.

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- 09-07 (focus contract and modes) can target `section#summit[data-ascent-block="summit"]` as the last stage block. The track is now (n + 2) stage heights in tall modes.
- 09-08 (camera) can snap to the summit block on the "Skip to the summit" jump.
- 09-12 takes the About and contact DRAFT copy to Tim.
- 09-14 re-baselines `home/*`, including p = 1 (the summit).

## Self-Check: PASSED
- All 11 key files exist on disk.
- Commits `8e4864c`, `76e7a10`, `3dd018e`, `f916ff3` and `275ca94` are ancestors of HEAD. `git rev-list --count 2c3ba06..HEAD` = 5, and `check evaluation-scope --plan 09-05 --commits-only` resolves them.
- Acceptance criteria: `id="summit"` = 1, `#summit` in HeroBlock = 1, the exact skip-link helper = 1, and the legacy-claims git grep prints nothing (exit 1). `AboutSection` in page.tsx = 2, and `whileInView|motion\.` = 0 in both files. The summit/About describe = 1 and `--list` shows 12 tests. skip/only/fixme = 0.
- Verification: Jest summit unit and the summit/hero/boundary components pass (5 suites, 39/39; full 38 suites, 503/503). `guard:tests` reports jest 503 + e2e 131 = 634 (baseline 533), OK. `npm run lint` and `npm run type-check` exit 0. Playwright home-ascent + shell + homepage pass 48/48 on chromium.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*
