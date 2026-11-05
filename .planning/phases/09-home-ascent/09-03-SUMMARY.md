---
phase: 09-home-ascent
plan: 03
subsystem: ui
tags: [nextjs, react-server-components, tailwind, scroll-driven-animations, picture, home, a11y, jest, playwright]

requires:
  - phase: 09-01
    provides: "AscentHero stage + track grid, HeroBlock, lib/home-format formatCaptureMonth/shortPlace, aria-label pattern for flex links"
  - phase: 09-02
    provides: "components/home boundary test (new Home files are checked automatically)"
  - phase: 08
    provides: "data/generated/photos.ts (elevation, uv, position.approximate), image-manifest variants, data/photos/editorial.ts copy and slugs"
provides:
  - "lib/ascent/waypoints.ts: Waypoint type, buildWaypoints() (the single ascent ordering, RangeError on empty/orphan/invalid data), waypointKicker()"
  - "components/home/WaypointCard.tsx: server card section (kicker, h2, manifest picture, place and date, story, View photo -> /photos#{slug})"
  - "AscentHero ol 'Waypoints, lowest first' with li#waypoint-{slug}[data-ascent-block=waypoint][data-k] stage blocks"
  - "Card layouts: docked panel < 768 px, side card from md, stacked under motion-reduce"
  - "CSS .ascent-card-fade with @keyframes ascent-card-in / ascent-card-out"
  - "LandscapeImage.slug (bridge) and id={image.slug} on /photos grid items"
  - "e2e/home-ascent.spec.ts describe 'Waypoint cards (HOME-05)' (5 tests)"
affects: [09-05, 09-06, 09-07, 09-08, 09-10, 09-14, 10]

actuals:
  tokens: 8000
  tasks: 3
  commits: 4
plan_head_before: 578c9136e721fd024d0d5080b1a9d27e15cc8dc5
plan_head_after: 18084549755e001a29e9c2ce813dfaee176c0a4b

tech-stack:
  added: []
  patterns:
    - "One pure buildWaypoints() feeds every waypoint consumer (cards now; poster pins, 3D pins and rail ticks later)"
    - "Card photos as raw <picture> from content-hashed manifest variants, lazy, pre-sized with width/height + inline aspect-ratio on a surface-overlay box"
    - "Three layouts from one markup with base / md: / motion-reduce: variants; sm:motion-reduce: where a breakpoint variant would otherwise win (breakpoints sort after motion-reduce in Tailwind 4)"
    - "Scroll-driven decoration in plain CSS: @supports (animation-timeline: view()) + no-preference + min-width, final state opaque"

key-files:
  created:
    - lib/ascent/waypoints.ts
    - components/home/WaypointCard.tsx
    - lib/__tests__/ascent-waypoints.test.ts
    - components/home/__tests__/waypoints.test.tsx
    - e2e/home-ascent.spec.ts
  modified:
    - components/home/AscentHero.tsx
    - app/globals.css
    - data/types.ts
    - data/landscapes.ts
    - components/GalleryGrid.tsx
    - components/__tests__/GalleryGrid.test.tsx

key-decisions:
  - "The View photo accessible name is an explicit aria-label 'View photo: {title}' instead of an sr-only ': {title}' span: the link is a flex box, the same accname spacing problem 09-01 found on the trail signs"
  - "ascent-card-out fills forwards, not both: a backwards fill holds its opacity-1 start keyframe before the exit range and overrides the fade-in (measured: the card fades in over entry, stays at 1, fades out over exit)"
  - "The docked-panel bottom padding is the class pb-[max(16px,env(safe-area-inset-bottom))], not an inline style: an inline padding-bottom would override md:p-6 and motion-reduce:p-6"
  - "No eslint-disable on the card <img>: @next/next/no-img-element exempts an img inside <picture> (09-01 precedent); a plain JSX comment explains the raw img"

patterns-established:
  - "Waypoint order and every card field come from buildWaypoints(); no altitude, date or place is typed in JSX or in tests"
  - "Stage blocks carry the fragment id (li#waypoint-{slug}), cards carry aria-labelledby (correction C8)"

requirements-completed: [HOME-05]

coverage:
  - id: D1
    description: "buildWaypoints orders photos by DEM height ascending (ties by id), k 1..n of n, altitudes 1617/1668/2585/2760, only r004-011 approximate; placeDate and kicker strings exact; srcsets from the 640/1024 manifest variants, no -large/-thumb; n = 1 prints 'Waypoint 1 of 1'"
    requirement: HOME-05
    verification:
      - kind: unit
        ref: "lib/__tests__/ascent-waypoints.test.ts#buildWaypoints on the committed data (HOME-05, D-01)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/ascent-waypoints.test.ts#buildWaypoints on synthetic data (D-01 generalised)"
        status: pass
    human_judgment: false
  - id: D2
    description: "buildWaypoints throws RangeError naming the photo on an empty set, missing editorial or manifest entry, missing 640 variant, null position/uv/elevation and uv outside [0, 1]"
    requirement: HOME-05
    verification:
      - kind: unit
        ref: "lib/__tests__/ascent-waypoints.test.ts#throws ... (5 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "WaypointCard: section aria-labelledby its h2; DOM order kicker, h2, picture (AVIF before WebP, 640w/1024w, sizes), place and date, story, link; img lazy, async, width/height from the 640 variant, aspect-ratio W / H, editorial alt, bg-surface-overlay; link 'View photo: {title}' -> /photos#{slug}"
    requirement: HOME-05
    verification:
      - kind: unit
        ref: "components/home/__tests__/waypoints.test.tsx#WaypointCard (HOME-05, D-07, D-10)"
        status: pass
    human_judgment: false
  - id: D4
    description: "AscentHero renders one ol 'Waypoints, lowest first' with four li#waypoint-{slug} blocks (data-ascent-block, data-k) in ascending order; four View photo links in DOM order resolve to an element on /photos"
    requirement: HOME-05
    verification:
      - kind: unit
        ref: "components/home/__tests__/waypoints.test.tsx#AscentHero waypoint list (HOME-05, D-08)"
        status: pass
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#every View photo link lands on its photo in the gallery"
        status: pass
      - kind: unit
        ref: "components/__tests__/GalleryGrid.test.tsx#gives each item its image slug as the id"
        status: pass
    human_judgment: false
  - id: D5
    description: "In Chromium: h2 titles, kickers and place/date lines match buildWaypoints; approx. only on the Riffelsee card; every img/source URL in the list is a hashed /images/photos derivative"
    requirement: HOME-05
    verification:
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#cards read in ascending altitude with their data; card photos come from the manifest derivatives"
        status: pass
    human_judgment: false
  - id: D6
    description: "375 px docked panel: the second card sits within 16 px of the viewport bottom, story hidden, 44 px link, no horizontal overflow; reduced motion: every story visible, cards >= 40 px apart, no overflow at 375 px"
    requirement: HOME-05
    verification:
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#the docked panel at 375 px; reduced motion stacks the cards"
        status: pass
    human_judgment: false
  - id: D7
    description: "Visual quality of the three card layouts and the scroll-driven fade (spacing, docked-panel proportion, fade feel)"
    verification: []
    human_judgment: true
    rationale: "Visual judgement; baselined at p_2 (375 and 1440 px) and the reduced-motion full page in 09-14 per the UI-SPEC E6 backstop"

duration: 20min
completed: 2026-10-25
status: complete
---

# Phase 9 Plan 03: Waypoint cards Summary

**Home now lists its four photo waypoints as server-rendered cards in ascending DEM height. Each card shows its real photo (hashed AVIF/WebP manifest variants), its altitude kicker (with "approx." only for the hand-placed film scan), place and date, story and a "View photo" link that lands on that photo in the /photos gallery. The layout docks as a bottom panel below 768 px, sits as a side card from 768 px, and stacks under reduced motion, with a decorative scroll-driven fade where scroll timelines exist.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-10-24T23:42:26Z
- **Completed:** 2026-10-25T00:02:18Z
- **Tasks:** 3
- **Files modified:** 11 (5 created, 6 modified)

## Accomplishments
- `lib/ascent/waypoints.ts` is the single waypoint ordering and field source. It sorts by `elevation.m` (ties by id), derives place, short place, place-and-date, year, the card image (640/1024 variants only) and the kicker, and throws a `RangeError` naming the photo for every invalid-data case. Zero or orphan waypoints fail tests and the build.
- `WaypointCard` follows the UI-SPEC DOM order. The photo is lazy and pre-sized at its true ratio on a surface-overlay box, so the layout is final before the image arrives.
- `AscentHero` holds the `<ol aria-label="Waypoints, lowest first">` after the hero. Each `li#waypoint-{slug}` is one stage tall in tall modes and collapses to natural height under reduced motion (correction C8: the fragment id is on the block).
- Measured in Chromium (temporary probe, not committed): at 375 px the docked panel is 253 px tall with the second card centred, sticky at the viewport bottom, story hidden. At 700 px it is 189 px. At 1280 × 720 the side card is 448 × 600 px inside a 656 px block. Under reduced motion the cards are static, 448 px wide (333 px at 375), with margin 0 at 700 px. Fade opacity over scroll offsets -700…700 px around the centred position: 0, 0.50, 1, 1, 1, 0.83, 0. `scrollWidth <= clientWidth` in every case.
- The /photos grid items now carry `id={slug}` (one attribute, through `LandscapeImage.slug` set by the bridge), so all four fragments resolve.

## Task Commits

1. **Task 1 (tracer): waypoint data, card section and stage blocks, linked to /photos#slug**: `190d312` (feat)
2. **Task 2 RED: failing tests for the full card and the waypoint list**: `0725233` (test)
3. **Task 2 GREEN: card photo, place and date, story; side, docked and stacked layouts; card fade**: `371f414` (feat)
4. **Task 3: waypoint card e2e (order, data, docked panel, reduced motion)**: `1808454` (test)

No REFACTOR commit was needed.

Tracer gate: interactive run, `human_verify_mode` end-of-phase, automated-only verify. Task 1 passed lint, type-check and Playwright (home-ascent + photos 7/7; homepage + shell 36/36), so expansion continued with no checkpoint.

## TDD Gate Compliance

- **RED** (`0725233`): Jest has no TAP reporter in this project, so the run used a small custom flat-TAP-13 Jest reporter kept in the session scratchpad (as in 09-01). `check tdd-red-evidence` returned **RED_EVIDENCE_OK** (`target_test_failed`, format `tap`, no report errors). Target: `components/home/__tests__/waypoints.test.tsx > WaypointCard (HOME-05, D-07, D-10) > lists the AVIF source before the WebP source, each with 640w and 1024w`. 33 tests: 29 pass, 4 fail.
  - **Semantic assessment:** the target ran and failed on its `toHaveLength(2)` assertion (received 0) because the Task 1 card had no `<picture>` yet. There was no load, import, syntax or fixture fault. The other three failures were the planned card behaviours (DOM order, pre-sized img and docked-panel story), all failing on missing elements. The buildWaypoints, AscentHero list and GalleryGrid tests passed in RED because Task 1 had already implemented them, as the plan orders, so they act as characterisation tests. A first RED run also failed two kicker tests, but that was a test bug (the NBSP constant had been saved as a plain space). It was fixed to `' '` before the evidence run.
- **GREEN** (`371f414`): 3 suites, 33/33. Full Jest: 35 suites, 480/480.
- **REFACTOR:** none.

## Files Created/Modified
- `lib/ascent/waypoints.ts`: `Waypoint`, `buildWaypoints`, `waypointKicker`.
- `components/home/WaypointCard.tsx`: the card section and its three layouts.
- `components/home/AscentHero.tsx`: the waypoint `<ol>` of stage blocks.
- `app/globals.css`: `.ascent-card-fade` (in `@layer utilities`) and the `ascent-card-in` / `ascent-card-out` keyframes.
- `data/types.ts`: `LandscapeImage.slug?`. `data/landscapes.ts`: `slug: copy.slug`. `components/GalleryGrid.tsx`: `id={image.slug}`.
- Tests: `lib/__tests__/ascent-waypoints.test.ts` (16), `components/home/__tests__/waypoints.test.tsx` (7), one new GalleryGrid test, and `e2e/home-ascent.spec.ts` (5).

## Decisions Made
See key-decisions. In short: an explicit aria-label for the link name, a forwards-only fill on the fade-out, a class instead of an inline style for the safe-area padding, and no eslint-disable inside `<picture>`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] "View photo" accessible name via `aria-label` instead of an sr-only `: {title}` span**
- **Found during:** Task 1
- **Issue:** The link is a flex box. Its children are blockified, so accessible-name computation puts a space before an sr-only separator ("View photo : title"). 09-01 hit the same problem on the trail signs.
- **Fix:** `aria-label={\`View photo: ${title}\`}` on the link. The visible text "View photo" starts the name, so label-in-name (WCAG 2.5.3) holds. The UI-SPEC name is exact in every engine.
- **Files modified:** components/home/WaypointCard.tsx
- **Verification:** The unit test and the e2e test find the link by the name `View photo: {title}`.
- **Committed in:** 190d312

**2. [Rule 1 - Bug] `ascent-card-out` fills `forwards` instead of `both`**
- **Found during:** Task 2
- **Issue:** Two animations on `opacity` with `both` fill: the later one (out) applies its opacity-1 start keyframe during its before phase and replaces the fade-in.
- **Fix:** `ascent-card-in linear both, ascent-card-out linear forwards`.
- **Files modified:** app/globals.css
- **Verification:** Chromium probe: opacity 0 → 0.50 → 1 on entry, 1 at the centre, 0.83 → 0 on exit.
- **Committed in:** 371f414

**3. [Rule 1 - Bug] Safe-area padding as a class, not an inline style**
- **Found during:** Task 2
- **Issue:** An inline `paddingBottom` would beat `md:p-6` and `motion-reduce:p-6`, leaving the side and stacked cards with 16 px bottom padding.
- **Fix:** `pb-[max(16px,env(safe-area-inset-bottom))]` in the base layout. `md:p-6` and `motion-reduce:p-6` override it.
- **Files modified:** components/home/WaypointCard.tsx
- **Verification:** The probe measured `padding-bottom` 16px in the docked panel and 24px on the side and stacked cards. The acceptance grep for `env(safe-area-inset-bottom)` prints 1.
- **Committed in:** 371f414

**4. [Rule 1 - Bug] `sm:motion-reduce:mx-0` added to the card**
- **Found during:** Task 2
- **Issue:** Breakpoint variants are registered after `motion-reduce` in Tailwind 4.3. `sm:-mx-6` would therefore beat `motion-reduce:mx-0` between 640 and 767 px, and the stacked card would bleed 24 px into the gutter.
- **Fix:** Added the compound `sm:motion-reduce:mx-0`.
- **Verification:** The probe at 700 px with reduced motion measured `margin-left: 0px`.
- **Committed in:** 371f414

**5. [Plan wording] No `eslint-disable` comment on the card `<img>`**
- The plan asked for a scoped `@next/next/no-img-element` disable. The rule exempts an `<img>` inside `<picture>`, so the directive would be reported as unused (09-01 deviation 1). A plain JSX comment carries the same rationale.

---

**Total deviations:** 4 auto-fixed (all Rule 1) plus 1 note on plan wording.
**Impact on plan:** Every must-have holds. No scope creep. Nothing of Phase 10 was built beyond the planned grid ids.

## Issues Encountered
- The first Task 3 e2e run failed 3 of 5 tests while the dev server recompiled after the edits: `/photos` grid ids resolved to 0 for the whole retry window. The next run passed 5/5, and `--repeat-each=3` passed 15/15.
- In the combined plan-verification run (home-ascent, photos, homepage, shell and design-system, 54 tests), `photos.spec.ts` "should switch to 3D carousel view" failed once. Its canvas never attached, alongside the known React `removeChild` console error on the legacy /photos 3D toggle (STATE, Phase 10 item from 07-19). `photos.spec.ts` alone passed 18/18 with `--repeat-each=3`. This is logged in `deferred-items.md` for Phase 10. The other 53 passed.
- At 375 px the docked panel is 253 px tall, not the ≈ 190 px the UI-SPEC estimates. The title and kicker wrap beside the 128 px thumbnail, which the spec allows (titles wrap, never truncate). At 700 px it is 189 px. The proportion goes to Tim's visual review at 09-12/09-14.
- `npm run lint` still prints the same 24 legacy warnings as after 09-02, with 0 errors. All guards report OK.

## Known Stubs
None. Every card field is wired to committed data.

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- 09-05 (summit) can append its block after the `<ol>`. The track is (n + 2) stage heights once the summit lands.
- 09-06 and 09-10 (pins) and the rail can call `buildWaypoints()` for order, `uv`, `shortPlace`, `altitudeM` and `approximate`.
- 09-07 (focus contract and modes) targets `li[data-ascent-block="waypoint"]` and the card sections.
- The `home/*` visual baselines remain out of date and are re-baselined in 09-14.

## Self-Check: PASSED
- All 11 key files exist on disk.
- Commits `190d312`, `0725233`, `371f414` and `1808454` are ancestors of HEAD. `git rev-list --count 578c913..HEAD` = 4.
- Acceptance criteria: the slug and id greps = 1/1, the ol label = 1, "legacy" = 0 in both files, `ascent-card-fade` = 2, `animation-timeline: view()` = 2, `env(safe-area-inset-bottom)` = 1, `--list` shows 5 tests, and skip/only/fixme = 0.
- Verification: Jest for the 3 plan suites passes 33/33 (full suite 35 suites, 480/480). `guard:tests` reports jest 480 + e2e 124 = 604 (baseline 533), OK. `npm run lint` and `npm run type-check` exit 0. Playwright home-ascent 5/5 (15/15 repeated) and photos 7/7 on chromium.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*
