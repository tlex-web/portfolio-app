---
phase: 18-immersive-survey-layout
plan: 12
subsystem: ui
tags: [altimeter-rail, intersection-observer, client-island, region-page, reduced-motion, e2e-settle-signal]
status: complete

requires:
  - phase: 18-01
    provides: "P1 answer (Defaults): the rail shows metres only, a dashed tick means approximate, the head label follows the aerial rule"
  - phase: 18-08
    provides: "RegionSequence's empty 6rem rail column and li[data-sequence-item] in section[data-region-sequence]"
provides:
  - "lib/photos/region-rail.ts (pure): RailTick, RailView, railTicks(views), railHead(views), RAIL_MAX_PHOTOS (16), railCurrent(observation)"
  - "components/photos/region/RegionRail.tsx ('use client'): the sticky rail in the sequence's rail column, data-rail-current as the settle signal"
  - "data-rail-current on [data-region-rail]: '1' in the server HTML, then the centred figure's 1-based index (18-14's mid shot waits on it)"
affects: [18-14, 18-25, 18-29, REGION-05]

actuals:
  tokens: 8200     # chars/4 over git diff 4453896..0df2343 (32,629 chars, 6 files)
  tasks: 2
  commits: 3       # measured: git rev-list --count 4453896..0df2343; the metadata commit follows
plan_head_before: 4453896a8f87ad4775b0b41c05c553d6fe2ddb46
plan_head_after: 0df234355f28a5423115d5651041e81d1e358317

tech-stack:
  added: []
  patterns:
    - "Two IntersectionObservers decide position: a zero-height root at the viewport centre ('-50% 0px -50% 0px') and the region above the line ('10000% 0px -50% 0px'); per-item states kept in arrays, decided once both first batches arrive"
    - "The decision rule is a pure function in lib (railCurrent), tested in Jest; the island holds no rule of its own"
    - "A percentage translateY on a track that spans the tick area puts the marker on any tick without reading layout"
    - "Server builds the props (labels and booleans); the island imports only railCurrent, and Turbopack drops railTicks/formatMetres from the chunk"

key-files:
  created:
    - lib/photos/region-rail.ts
    - lib/__tests__/region-rail.test.ts
    - components/photos/region/RegionRail.tsx
  modified:
    - components/photos/region/RegionSequence.tsx
    - components/photos/region/__tests__/SequenceFigure.test.tsx
    - e2e/photos-region.spec.ts

key-decisions:
  - "18-12: P1 as drafted (Tim's 18-01 answer 'Defaults (Recommended)'): tick labels are formatMetres(altitudeM) only, dashed tick = approximate position, head 'Ground altitude' only when every photo is aerial"
  - "18-12: the head label wraps at its space instead of staying nowrap; 'Ground altitude' in mono text-sm is wider than the 96 px column and pushed Saalfelden 6 px sideways at 768 in Firefox"
  - "18-12: the rail stays its own component; Home's AltimeterRail and lib/ascent are unchanged (git diff 769e1b8 prints nothing)"
  - "18-12: reduced motion sets transition-duration 0s as well as transition-property none, so the marker's computed duration reads 0s"

requirements-completed: []  # REGION-05 stays Pending: 18-14 baselines the region pages with the rail's mid-sequence shot, and 18-29 closes the phase (same practice as 18-08 to 18-11)

metrics:
  duration: "about 16 min (15:21Z to 15:37Z, 2026-11-25)"
  completed: 2026-11-25
---

# Phase 18 Plan 12: Region altimeter rail Summary

From 768 px a sticky altimeter rail sits beside the region sequence. It has one evenly spaced tick per photo, metres only, dashed when the position is approximate. Two IntersectionObservers mark the figure at the viewport's centre. The mark holds its side in the gaps between figures and is right after any jump. `data-rail-current` is the settle signal for e2e and 18-14. The island adds 2,498 B of client JS.

## Progress

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | End-to-end rail: tick model, the island in the rail column, data-rail-current following the centred figure at 1440 (tracer) | Done | 9dbeb92 (RED), 730d0be (GREEN) |
| 2 | Every rail rule under test: ends, every index, gaps, jumps, dashed ticks, head label, phones, reduced motion; client JS measured (tdd) | Done | 0df2343 |

Tracer gate (interactive, `human_verify_mode` end-of-phase, automated-only verify): the tracer's `<verify>` was re-run end to end after the head-label fix. Jest passed, and the photos-region spec passed 179/179 on Chromium and Firefox, so expansion went ahead.

## How the current photo is decided

`railCurrent` in `lib/photos/region-rail.ts`, fed by the island's two observers:

| Line position | Containing item | Tops reached (k) | Marked |
|---------------|-----------------|------------------|--------|
| Inside figure i | i | any | i |
| Above the first figure | none | 0 | 1 |
| Below the last figure | none | N | N |
| Gap k, k + 1, coming from k or k + 1 | none | k | stays (k down, k + 1 up) |
| Gap k, k + 1, after a jump from elsewhere | none | k | k |

A jump from the top straight to `#next-region` changes no item's line state, but every item's top crosses the line, so the above observer reports it and the mark goes to N. There is no scroll listener and no `getBoundingClientRect`. `setCurrent` runs only in the observer callbacks.

## Rail anatomy (18-UI-SPEC Contract 2 "Altimeter rail")

- Root `div[data-region-rail]`: `sticky top-[calc(var(--nav-h)+24px)] h-[calc(100svh-var(--nav-h)-48px)] hidden md:block pointer-events-none`, `aria-hidden="true"`, `data-rail-current`.
- The head label sits on top, right-aligned, mono `text-sm` ink-muted, wrapping at its space. Below it is the tick area (`mt-6 mb-3 flex-1`), with a 1 px `bg-ink-muted` line at its right edge.
- Ticks sit at `bottom: k/(N-1) * 100%` (0 for a single tick): the label, `gap-2`, then a `w-4` tick, dashed when approximate. The current label is `font-semibold text-ink`.
- The marker is Home's `h-0.5 w-6 bg-accent`, centred on the line. It sits on a track spanning the tick area, moved by `translateY(-k/(N-1) * 100%)` over `--duration-panel` with `ease-erosion`. A new target retargets the running transition. Under reduced motion it moves instantly (`transition-none duration-0`).

## Client JS (record-only; enforced at 18-25 and 18-29)

Measured with `rm -rf .next/static && npm run build`, then the byte sum of `.next/static/chunks/**/*.js`, then `git restore public/service-worker.js`. For the per-chunk delta, the base was rebuilt with only `RegionSequence.tsx` reverted to 4453896 (restored afterwards with `git checkout --`), and the build was then redone at HEAD.

| Point | Total | Files | vs running total 1,861,681 B | vs phase base 1,851,745 B | vs cap 1,855,841 B |
|-------|-------|-------|------------------------------|---------------------------|--------------------|
| Before 18-12 (4453896 rebuilt) | 1,861,681 B | 25 | 0 | +9,936 | +5,840 |
| **18-12 final (0df2343)** | **1,864,179 B** | **25** | **+2,498** | **+12,434** | **+8,338** |

Per chunk, only one changed: the region page chunk, `2k-v8s-urry4p.js` 11,326 B became `1ugrm7nr0n3qc.js` 13,824 B (+2,498 B). This chunk also holds the Share button. The chunk contains the observers and `railCurrent` only. `railTicks`, `RAIL_MAX_PHOTOS` and `formatMetres` are absent, checked by grep for their strings. The island imports no icon and no `'use client'` or data module. Following Tim's "Track it, decide at 18-25", nothing was clawed back here.

## ui-ux-pro-max

The skill was invoked before the markup. Its quick reference and searches returned these rules, all applied:
- `transform-performance`, `layout-shift-avoid`: the marker moves by transform only.
- `interruptible`, `cancellable-state-transitions`: a CSS transition retargets on a new target and never waits for an end event.
- `reduced-motion`: Animation/Reduced Motion, severity High.
- `excessive-motion`: the marker is the only moving element.
- `reduce-reflows`, `main-thread-budget`: observers instead of per-frame layout reads.
- `icon-context`: a decorative indicator is `aria-hidden`.
- `number-tabular`: tick labels use `tabular-nums`.

The react stack search for "intersection observer scroll" found no match. The retry ("scroll listener effect") returned the effect-dependency and `useEffectEvent` rows. The effect has no reactive dependencies, so neither changed the code. The UX search for "scroll progress indicator sticky" returned the generic Progress Indicators row, which the rail satisfies.

## Verification

- `npx jest lib/__tests__/region-rail.test.ts`: 17 passed. Full Jest: 129 suites, 2,613 tests passed.
- `PW_PROD=1 npx playwright test e2e/photos-region.spec.ts e2e/home-ascent.spec.ts --project=chromium --project=firefox`: 312 passed, none flaky. The local Firefox `/offline` flake did not occur; that spec was not in the run.
- `npm run type-check` and `npm run lint` (with the test-count scan) passed.
- `node scripts/ci/check-snapshot-commit.mjs --sha <sha> --none`: OK, 0 changed, on 9dbeb92, 730d0be and 0df2343. No PNG was touched.
- `git diff --name-only 769e1b8 -- components/home/AltimeterRail.tsx lib/ascent` prints nothing.
- `grep -c data-rail-current components/photos/region/RegionRail.tsx` = 2, and `grep -c RAIL_MAX_PHOTOS lib/__tests__/region-rail.test.ts` = 6.

E2E rows added to `e2e/photos-region.spec.ts`:
- Every region at 768 × 1024 and 1440 × 900: the rail reads 1 on load. Each figure centred in turn gives its index. Past the last figure (`#next-region`) it reads N. A jump from the top straight to `#next-region` gives N, and back to the top gives 1.
- Zermatt gap rows at 768 × 900 and 1440 × 900:
  - The line is asserted to lie between figure 3's bottom and figure 4's top.
  - After three animation frames in the gap the rail still reads 3 (down) or 4 (up).
  - A MutationObserver records exactly `['4']` and then `['3']`.
- Every region at 1440:
  - Root: `aria-hidden`, `pointer-events: none`, `position: sticky`.
  - Ticks: tick count = photo count, labels = `railTicks`, only the current label at weight 600, dashed exactly when approximate.
  - Head label per the aerial rule. A non-vacuity row checks that both approximate and exact photos exist.
- Saalfelden heads its rail "Ground altitude". The server HTML carries `data-rail-current="1"`.
- At 375 on every region the rail has no box, and each caption's counter reads `n / N · `.
- Marker transition: duration 0.25s and property list containing `transform`. Under reduced motion the duration is 0s and the rail still follows.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 'Ground altitude' overflowed the rail column at 768**
- **Found during:** Task 1 (tracer verify, the 18-08 sequence row "no sideways overflow", Firefox, Saalfelden at 768: scrollWidth 774 > 768)
- **Issue:** The head label was `whitespace-nowrap` in the 96 px column. "Ground altitude" in mono `text-sm` is about 126 px wide and overflowed to the right. UI E6/overflow measured only the tick labels ("4,478 m" = 83 px).
- **Fix:** The head label wraps at its space ("Ground / altitude", right-aligned). The rail became an inner flex column, so the tick area starts below however many lines the head takes.
- **Files modified:** components/photos/region/RegionRail.tsx
- **Commit:** 730d0be

**2. [Rule 3 - Blocking] The 18-08 SequenceFigure test read every `ol > li` in the band**
- **Found during:** Task 1. The rail adds its own `ol` of ticks, so the band's item list grew.
- **Fix:** The selector became `ol[aria-label] > li` (the sequence list has its aria-label). The test still asserts the sequence order. No assertion was removed.
- **Files modified:** components/photos/region/__tests__/SequenceFigure.test.tsx
- **Commit:** 730d0be

**3. [Rule 1 - Bug, test] Two Task 2 e2e expectations were wrong about Tailwind 4 computed styles**
- **Found during:** Task 2's first run.
- **Issue:** Preflight gives every element `border: 0 solid`, so a solid tick's `borderTopStyle` is `solid`, not `none`. Also, `transition-transform` computes to `transform, translate, scale, rotate`.
- **Fix:** Assert `dashed` exactly when approximate, and assert the property list contains `transform`. The component did not change.
- **Commit:** 0df2343

**4. [Plan detail] Reduced motion adds `motion-reduce:duration-0`**
- **Issue:** `transition-none` alone leaves the computed `transition-duration` at 0.25s, but the plan's row asserts 0s.
- **Fix:** Both utilities apply under reduced motion.
- **Commit:** 730d0be

## TDD Gate Compliance

- **RED (Task 1, tests first):** 9dbeb92 `test(18-12)`.
  - `npx jest lib/__tests__/region-rail.test.ts` exited 1 with "Cannot find module '@/lib/photos/region-rail'", so 0 tests ran.
  - Semantic assessment: this is a module-load failure, the classifier's `fixture_or_load_failure`, not an assertion RED. It is the usual shape when the module under test does not exist yet. The rows then passed against the new module in 730d0be (`feat`).
- **Task 2 (`tdd="true"`):** no honest RED was possible. The plan's Task 1 action already implements every behaviour Task 2 pins: the guard, the gaps, the jumps, the head label and reduced motion. The new Jest rows passed on first run (unexpected green, investigated: the feature exists by plan design). The first e2e run's only failures were the two wrong expectations in deviation 3, not behaviour.
- Task 2 is therefore a characterization commit, 0df2343 `test(18-12)`, with no GREEN commit of its own. `workflow.tdd_mode` is false, so the plan-level gate is not enforced.

## Known Stubs

None.

## Threat Flags

None. The island receives labels and booleans only (T-18-29). It reads no layout per frame and has no scroll listener (T-18-28). No package was installed (T-18-SC).

## Notes for later plans

- 18-14: wait on `[data-region-rail][data-rail-current="<n>"]` after centring figure n (`scrollIntoView({ block: 'center', behavior: 'instant' })`). The value is reliable in the gaps and after jumps.
- 18-25: the running client JS total is 1,864,179 B (+8,338 over the cap). The rail chunk's 2,498 B is the island and its IntersectionObserver wiring.
- `.next` was rebuilt at HEAD after the measurement, and `public/service-worker.js` was restored after every build. No `next start` was left running.

## Self-Check: PASSED

- FOUND: lib/photos/region-rail.ts, lib/__tests__/region-rail.test.ts, components/photos/region/RegionRail.tsx
- FOUND commits: 9dbeb92, 730d0be, 0df2343 (ancestors of HEAD)
