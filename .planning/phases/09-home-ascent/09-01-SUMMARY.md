---
phase: 09-home-ascent
plan: 01
subsystem: ui
tags: [nextjs, react-server-components, tailwind, home, lcp, a11y, jest, playwright]

requires:
  - phase: 08
    provides: "terrain.assets.hillshade (AVIF/WebP 640/1100), terrain.assets.contours.hero, ContourField, photos/lowestDemM, lib/geo lv95ToWgs84"
  - phase: 07
    provides: "token system (L1/L2), text-heading, SiteNav/SkipLink shell, palette/contrast guards"
provides:
  - "app/(site)/page.tsx as a Server Component rendering AscentHero"
  - "AscentHero one-cell grid: sticky aria-hidden stage (size container) + content track; data-ascent-stage, data-ascent-mode=pending, data-ascent-track hooks"
  - "PosterSheet: hillshade <picture> LCP at --relief-opacity, ContourField hero, sheet box placed with POSTER_X_BIAS; data-poster-img"
  - "HeroBlock (data-ascent-block=hero): derived kicker, h1 site.name, role, thesis, C6 scrim, TrailSigns"
  - "TrailSigns: two data-counted next/link signs with exact accessible names, bg-trail tip"
  - "lib/home-format.ts: formatLatLon, formatCaptureMonth, formatKilometres, formatYearRange, countLabel, shortPlace"
  - "lib/ascent/poster-frame.ts: POSTER_X_BIAS, posterFrame (shared with the 09-08 camera)"
  - "data/home.ts: thesis + DRAFT About/contact copy (status 'draft')"
  - "CSS: --relief-opacity, --trail-yellow, --text-hero (+ line-height, letter-spacing), @utility bg-trail"
affects: [09-02, 09-03, 09-05, 09-07, 09-08, 09-10, 09-12, 09-14]

actuals:
  tokens: 12200
  tasks: 2
  commits: 3
plan_head_before: dcad809fa5712ed0e9352b6c2957dc623ee9bad7
plan_head_after: 86c9bfe4292727b51531dd6a40e5026ac26dd7d3

tech-stack:
  added: []
  patterns:
    - "Raw <picture>/<img> for content-hashed terrain assets: eager + fetchPriority high, no preload link"
    - "Sheet box sized in cqw/cqh inside a [container-type:size] stage, positioned by the same rule as posterFrame()"
    - "Explicit aria-label on links whose visible parts are flex items (blockified children break sr-only separators in name computation)"
    - "RTL text queries on U+00A0 strings use getDefaultNormalizer({ collapseWhitespace: false })"

key-files:
  created:
    - components/home/AscentHero.tsx
    - components/home/PosterSheet.tsx
    - components/home/HeroBlock.tsx
    - components/home/TrailSigns.tsx
    - components/home/__tests__/hero.test.tsx
    - lib/ascent/poster-frame.ts
    - lib/__tests__/poster-frame.test.ts
    - lib/home-format.ts
    - lib/__tests__/home-format.test.ts
    - data/home.ts
  modified:
    - app/(site)/page.tsx
    - app/globals.css
    - scripts/guards/palette-ratchet.json
    - e2e/homepage.spec.ts

key-decisions:
  - "Trail-sign accessible names come from an explicit aria-label ('Photographs, 4 waypoints'), not an sr-only ', ' separator: the flex plate blockifies its children, so accname inserts a space before the comma ('Photographs , 4 waypoints')"
  - "No eslint-disable on the poster <img>: @next/next/no-img-element exempts an img inside <picture>, so the planned directive was an unused-directive warning"

patterns-established:
  - "Server Components on Home use CSS duration/ease utilities, never lib/animations (client module)"
  - "Home copy and numbers derive from data (site, terrain, photos, projects, home); no hand-typed identity, coordinate or count"

requirements-completed: [HOME-01, HOME-02, HOME-06]

coverage:
  - id: D1
    description: "GET / returns server HTML with the h1 'Tim Lui', the role and the 1100 hillshade WebP URL; the h1 is visible in the browser"
    requirement: HOME-01
    verification:
      - kind: e2e
        ref: "e2e/homepage.spec.ts#server HTML shows the name, role and relief poster (HOME-01)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Relief poster: picture with AVIF/WebP 640w/1100w sources from terrain.assets.hillshade, img alt='' eager, fetchpriority high, async, 1100x1100, opacity var(--relief-opacity), hero contour mask, no preload link"
    requirement: HOME-02
    verification:
      - kind: unit
        ref: "components/home/__tests__/hero.test.tsx#PosterSheet (HOME-02, D-17)"
        status: pass
    human_judgment: false
  - id: D3
    description: "posterFrame windows at 375x603, 768x960, 1440x836 within 0.001; every photo UV inside each window; summit inside on landscape"
    requirement: HOME-02
    verification:
      - kind: unit
        ref: "lib/__tests__/poster-frame.test.ts#posterFrame"
        status: pass
    human_judgment: false
  - id: D4
    description: "Home formatters: formatLatLon exact code points '45.9764 N · 7.6586 E', month, km, year range, countLabel zero-one-many, shortPlace; import-free, no locale APIs"
    requirement: HOME-06
    verification:
      - kind: unit
        ref: "lib/__tests__/home-format.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "HeroBlock renders the derived kicker, one h1 site.name, the role and home.thesis; TrailSigns renders two links named 'Photographs, 4 waypoints' (/photos) and 'Engineering, 2 routes' (/projects); a zero count names the destination only; bg-trail only on the aria-hidden tips"
    requirement: HOME-01
    verification:
      - kind: unit
        ref: "components/home/__tests__/hero.test.tsx#HeroBlock (HOME-01, D-11); TrailSigns (D-13)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Legacy Home sections removed; page.tsx is a Server Component with no client directive and no three/motion/lib/animations import; palette ratchet tightened"
    requirement: HOME-01
    verification:
      - kind: other
        ref: "grep acceptance criteria (use client 0, Hero3DMountain 0) + npm run lint (palette OK)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Visual quality of the first viewport: relief tint, scrim legibility, sign proportions at 375 and 1440 px"
    verification: []
    human_judgment: true
    rationale: "Visual judgement; relief opacity and scrim are tuned with Tim at 09-12 Task 2 and baselined in 09-14; composed-contrast backstop lands in 09-07"

duration: 13min
completed: 2026-10-25
status: complete
---

# Phase 9 Plan 01: Server-rendered Home hero Summary

**Home is now a Server Component. Its first viewport is plain server HTML: the night-tinted hillshade `<picture>` (the LCP image), the hero contour mask, a derived `45.9764 N · 7.6586 E` kicker, "Tim Lui" in the new 64 px `text-hero`, the role, the thesis and two trail signs whose counts come from the data, with no JS, motion or WebGL.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-10-24T23:13:56Z
- **Completed:** 2026-10-24T23:27:29Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- The legacy client Home is gone: no stat tiles, feature cards, skill chips or contact panel, and no Hero3DMountain import. `app/(site)/page.tsx` renders `<AscentHero />` only, and the palette ratchet entry for the page was removed with `--update`.
- AscentHero holds the stage and the track in one grid cell. The stage is sticky at `top-(--nav-h)`, one stage tall, `aria-hidden`, a size container and `overflow-hidden`. PosterSheet places a square sheet box of side `max(100cqw, 100cqh)` in it, offset by `POSTER_X_BIAS`.
- The poster-frame rule is unit-tested at the three baseline stage sizes, and every photo UV is inside the visible window. 09-08's camera uses the same function.
- Six import-free Home formatters, with exact code-point tests.
- The two trail signs (dark plate, yellow `bg-trail` tip) have the exact accessible names the UI-SPEC specifies. The hero scrim uses the C6 stops Tim accepted.
- Browser check on the dev server: the h1 stays on one line (64 px tall) at 375 and 1440 px, the thesis wraps to two lines at 375 px, nothing scrolls horizontally, and the stage measures 603 / 836 px.

## Task Commits

1. **Task 1 (tracer): Server Component Home with the ascent grid, relief poster LCP and h1/role**: `98de4c5` (feat)
2. **Task 2 RED: failing tests for formatters, hero copy and trail signs**: `1b66539` (test)
3. **Task 2 GREEN: hero kicker, thesis and trail signs from data**: `86c9bfe` (feat)

No REFACTOR commit was needed.

## TDD Gate Compliance

- **RED** (`1b66539`): `home-format.test.ts`, `poster-frame.test.ts` and `hero.test.tsx` were committed with signature-only stubs (`lib/home-format.ts` returning `''`, `TrailSigns` returning `null`) and `data/home.ts`, so the suites fail on assertions rather than on imports. Jest has no TAP or JUnit reporter installed in this project, so the run went through a small custom Jest reporter (`--reporters`, kept in the session scratchpad) that prints the real results as flat TAP 13. The classifier `check tdd-red-evidence` returned **RED_EVIDENCE_OK** (`target_test_failed`): target `lib/__tests__/home-format.test.ts > formatLatLon (hero and plaque kicker, D-11) > prints the derived summit kicker 45.9764 N · 7.6586 E`, 34 tests, 16 pass, 18 fail, format `tap`, no report errors.
  - **Semantic assessment:** the target ran and failed on its `toEqual` code-point assertion against the stub's empty string. There was no load, import, syntax or fixture fault. The other 17 failures are the planned home-format, HeroBlock and TrailSigns behaviours, all assertion failures; the zero-count test rendered successfully and failed only on the missing link. The poster-frame and PosterSheet tests passed in RED because Task 1 had already implemented those modules, as the plan orders (they act as characterisation tests).
- **GREEN** (`86c9bfe`): 3 suites, 34/34 pass. Full Jest: 32 suites, 450/450.
- **REFACTOR:** none.

## Files Created/Modified
- `app/(site)/page.tsx`: Server Component Home that renders AscentHero.
- `components/home/AscentHero.tsx`: the one-cell grid with the stage and track hooks.
- `components/home/PosterSheet.tsx`: the relief `<picture>` (LCP), the hero ContourField and the sheet-box placement.
- `components/home/HeroBlock.tsx`: kicker, h1, role, thesis, C6 scrim and the trail signs.
- `components/home/TrailSigns.tsx`: two data-counted signs with the `bg-trail` tip.
- `lib/ascent/poster-frame.ts`: `POSTER_X_BIAS = 0.64` and `posterFrame()`.
- `lib/home-format.ts`: the six import-free formatters.
- `data/home.ts`: the thesis, plus About and contact copy marked DRAFT (`status: 'draft'`) for the 09-12 copy checkpoint.
- `app/globals.css`: `--relief-opacity`, `--trail-yellow`, `--text-hero*` and `@utility bg-trail`.
- `scripts/guards/palette-ratchet.json`: the page entry removed (tightened).
- `e2e/homepage.spec.ts`: the stats test rewritten as the HOME-01 server-HTML test (still 5 tests).
- Tests: `lib/__tests__/home-format.test.ts`, `lib/__tests__/poster-frame.test.ts` and `components/home/__tests__/hero.test.tsx`.

## Decisions Made
- Trail-sign names come from an explicit `aria-label` (see deviation 2).
- The `<img>` inside `<picture>` has no eslint-disable directive (see deviation 1).
- The hero container also carries the stage `min-h`, so `justify-end` / `md:justify-center` position the copy inside a full-height block.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dropped the planned `eslint-disable-next-line @next/next/no-img-element`**
- **Found during:** Task 1
- **Issue:** `@next/next/no-img-element` does not report an `<img>` inside `<picture>`, so the planned directive produced an "Unused eslint-disable directive" warning.
- **Fix:** Replaced it with a plain JSX comment that explains why a raw `<img>` is used.
- **Files modified:** components/home/PosterSheet.tsx
- **Verification:** `npx eslint components/home` is clean.
- **Committed in:** 98de4c5

**2. [Rule 1 - Bug] Trail-sign accessible names via `aria-label` instead of an sr-only separator**
- **Found during:** Task 2 GREEN
- **Issue:** The plate is `display: flex`, so its children are blockified. Accessible-name computation puts a space around non-inline children, so the specified sr-only `", "` gave the name "Photographs , 4 waypoints" (jsdom, which follows the same accname rule Chrome applies to block-level children).
- **Fix:** The link now has `aria-label={count ? \`${label}, ${count}\` : label}`, built from the same data, and the sr-only span is removed. The label starts with the visible destination, so label-in-name (WCAG 2.5.3) holds. Visible markup is unchanged.
- **Files modified:** components/home/TrailSigns.tsx
- **Verification:** The TrailSigns tests find "Photographs, 4 waypoints" and "Engineering, 2 routes", and "Engineering" when the count is zero.
- **Committed in:** 86c9bfe

**3. [Rule 1 - Bug] The kicker test query keeps U+00A0**
- **Found during:** Task 2 GREEN
- **Issue:** RTL's default normalizer collapses U+00A0 in the DOM text, so `getByText` with the exact NBSP string never matched.
- **Fix:** The query uses `getDefaultNormalizer({ collapseWhitespace: false })`. The implementation was already correct.
- **Files modified:** components/home/__tests__/hero.test.tsx
- **Committed in:** 86c9bfe

**4. [Criterion wording] `fetchPriority` count and `git grep bg-trail` scope**
- The PosterSheet JSDoc first mentioned `fetchPriority`, which made the grep count 2. The comment was reworded and the count is now 1.
- `git grep -n "bg-trail" -- components app lib` also lists `app/globals.css`, where the plan's own step 4 defines `@utility bg-trail`, and the test file that asserts the class. The criterion's intent holds: `components/home/TrailSigns.tsx` is the only component that uses `bg-trail`.

---

**Total deviations:** 3 auto-fixed (all Rule 1) plus 1 note on criterion wording.
**Impact on plan:** Every must-have holds, including the accessible names, which are now exact in every engine. No scope creep.

## Issues Encountered
- None blocking. Running `npm run lint` still prints the legacy React Compiler warnings from the pre-existing `LEGACY_COMPILER_FILES` (the dead hero chain). 09-02 deletes that chain. All guards report OK.

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- 09-02 can now delete the hero chain this plan left unimported, tighten the guards, add the RSC boundary test and the JavaScript-disabled proof.
- Visual baselines for `home/*` are out of date because of this change. They are re-baselined in 09-14, as the Task 1 commit body notes.
- The About and contact copy in `data/home.ts` is DRAFT and waits for the 09-12 copy checkpoint.

## Self-Check: PASSED
- All 14 key files exist on disk.
- Commits 98de4c5, 1b66539 and 86c9bfe are ancestors of HEAD, and `check evaluation-scope --plan 09-01 --commits-only` resolves all three.
- Verification: Jest for the 3 plan suites passes 34/34 (full suite 450/450). `npm run lint` and `npm run type-check` exit 0. Playwright `e2e/homepage.spec.ts` + `e2e/shell.spec.ts` on chromium pass 34/34, and the homepage spec lists 5 tests.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*
