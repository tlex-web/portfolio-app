---
phase: 09-home-ascent
verified: 2026-10-25T15:00:00Z
status: human_needed
score: 5/5 roadmap success criteria verified (code and CI evidence); 1 manual device check open; 2 warnings and 1 defect group carried
covered_files:
  - ".planning/phases/09-home-ascent/09-01-PLAN.md"
  - ".planning/phases/09-home-ascent/09-01-SUMMARY.md"
  - ".planning/phases/09-home-ascent/09-02-PLAN.md"
  - ".planning/phases/09-home-ascent/09-02-SUMMARY.md"
  - ".planning/phases/09-home-ascent/09-03-PLAN.md"
  - ".planning/phases/09-home-ascent/09-03-SUMMARY.md"
  - ".planning/phases/09-home-ascent/09-04-PLAN.md"
  - ".planning/phases/09-home-ascent/09-04-SUMMARY.md"
  - ".planning/phases/09-home-ascent/09-05-PLAN.md"
  - ".planning/phases/09-home-ascent/09-05-SUMMARY.md"
  - ".planning/phases/09-home-ascent/09-06-PLAN.md"
  - ".planning/phases/09-home-ascent/09-06-SUMMARY.md"
  - ".planning/phases/09-home-ascent/09-07-PLAN.md"
  - ".planning/phases/09-home-ascent/09-07-SUMMARY.md"
  - ".planning/phases/09-home-ascent/09-08-PLAN.md"
  - ".planning/phases/09-home-ascent/09-08-SUMMARY.md"
  - ".planning/phases/09-home-ascent/09-09-PLAN.md"
  - ".planning/phases/09-home-ascent/09-09-SUMMARY.md"
  - ".planning/phases/09-home-ascent/09-10-PLAN.md"
  - ".planning/phases/09-home-ascent/09-10-SUMMARY.md"
  - ".planning/phases/09-home-ascent/09-11-PLAN.md"
  - ".planning/phases/09-home-ascent/09-11-SUMMARY.md"
  - ".planning/phases/09-home-ascent/09-12-PLAN.md"
  - ".planning/phases/09-home-ascent/09-12-SUMMARY.md"
  - ".planning/phases/09-home-ascent/09-13-PLAN.md"
  - ".planning/phases/09-home-ascent/09-13-SUMMARY.md"
  - ".planning/phases/09-home-ascent/09-14-PLAN.md"
  - ".planning/phases/09-home-ascent/09-14-SUMMARY.md"
  - "app/(site)/page.tsx"
  - "components/home/AltimeterRail.tsx"
  - "components/home/AscentController.tsx"
  - "components/home/AscentHero.tsx"
  - "components/home/HeroBlock.tsx"
  - "components/home/SummitPlaque.tsx"
  - "components/home/TerrainStage.tsx"
  - "components/home/WaypointCard.tsx"
  - "components/home/terrain/CameraRig.tsx"
  - "components/home/terrain/TerrainCanvas.tsx"
  - "components/home/terrain/TerrainMesh.tsx"
  - "e2e/home-ascent.spec.ts"
  - "e2e/home-canvas.spec.ts"
  - "e2e/home-modes.spec.ts"
  - "e2e/perf/home-baseline.json"
  - "e2e/perf/home-baseline.spec.ts"
  - "lib/ascent/capability.ts"
  - "lib/ascent/frame-budget.ts"
  - "lib/useAscentMode.ts"
covered_digest: "v3:sha256:5b08b0b1e9f350fef189f9dcce9f32d9d1b6e1a5bb79e82beb8a374de5b2a6c9"
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "A reveal burst that a pause interrupts starts over instead of declining (CameraRig comment, HOME-07 pause contract)"
    test: "On a capable device at pixel ratio 1, load Home, and within the first second after the canvas fades in switch to another tab for 2 s, then return. Read the 'ascent-frame-budget' performance mark and data-ascent-mode."
    expected: "A fresh burst starts on return and the verdict is 'ok'; data-ascent-mode stays '3d'."
    why_human: "Code trace says the opposite happens for a hidden tab (see WR-01). The existing e2e fakes visibilityState while animation frames keep running, so no test exercises the real frozen-rAF path."
human_verification:
  - test: "Real-device 3D quality and vestibular comfort (09-11 human-check; VALIDATION Manual-Only row, status OPEN)"
    expected: "On an iPhone, a mid-range Android phone and a laptop: the canvas fades in without a jump, scrolling is smooth with no scroll hijack, the climb is comfortable (no dizzying turns), the summit view shows all four pins, and an old or slow phone ends on the poster. Record the result in 09-UAT.md."
    why_human: "GPU paths, frame pacing and vestibular comfort cannot be emulated; CI runs SwiftShader, where the frame budget reads as noise at desktop sizes."
  - test: "Summit plaque and pin overlaps (known, deferred-items.md; Tim: 'Gap plan after 09-14')"
    expected: "At 375x667, 768x1024, 820x1180 and 1024x768 the four 3D pins at #summit are not hidden behind the plaque, and below 1280 px the static poster pins are not under the plaque. Tim decides at UAT whether to accept or to run /gsd-plan-phase 09 --gaps."
    why_human: "Product call on a plaque layout; the verifier's reading is that D-03 is not delivered visually at these sizes (see Anti-Patterns and Gaps Summary)."
  - test: "768 px waypoint-2 pin label hidden behind the card (static poster) and 375 px docked kicker orphaning the '4'"
    expected: "The pin label is legible beside the card at 768, and the kicker wraps without a lone '4' at 375."
    why_human: "Visual judgement on baselines already committed as-is; Tim routed both to the gap plan."
  - test: "UI-REVIEW NEW findings: hero scrim over the altimeter rail at 768-1023 px, place line wrapping with a leading dot at 375, pin 3 under hero copy at p=0 at 375 and 768"
    expected: "Tim accepts or routes each to the gap plan."
    why_human: "Visual severity is a design decision; found by 09-UI-REVIEW from baselines, not measured."
---

# Phase 9: Home Ascent Verification Report

**Phase Goal:** Visitors land on the real Matterhorn and climb it by scrolling, passing Tim's photographs where they were taken. Every visitor gets a complete, readable Home, with or without WebGL and motion.
**Verified:** 2026-10-25T15:00:00Z
**Status:** human_needed
**Re-verification:** No, initial verification
**HEAD:** 65885d0 on gsd/phase-09-home-ascent

## Verdict

Not `passed`, and not `gaps_found`. Reasoning, stated plainly:

- All five ROADMAP success criteria are met in code and by CI evidence on Tim's baseline commit 284f433. No artifact is a stub, every key link is wired, and all eight requirement IDs are accounted for.
- `passed` is unavailable: the real-device 3D quality and vestibular-comfort check is a required manual item (09-11 human-check, VALIDATION Manual-Only row "OPEN"), and no 09-UAT.md exists. One behavior-dependent invariant (WR-01) is also not exercised by any real test.
- `gaps_found` is not what I conclude, but this is a judgement, so the reasoning is explicit: the deferred overlaps and WR-01 do not falsify a ROADMAP success criterion or the text of any HOME requirement (details below). They are nonetheless real defects, not cosmetic ones. D-03 (locked, 09-CONTEXT) says the summit frame shows all four waypoints with the plaque and signs over it, and at four common sizes it does not. I am not relabelling that as acceptable. It is carried as a human decision item because Tim already routed it ("Gap plan after 09-14", 2026-10-25). If Tim decides at UAT that D-03 at those sizes is part of the Phase 9 contract, this phase becomes `gaps_found` with that single gap.

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | First viewport shows name, role and primary CTA, readable before any script, no animation, no WebGL | VERIFIED | `app/(site)/page.tsx` is a Server Component (no client directive; enforced by `components/home/__tests__/boundary.test.ts`). `HeroBlock.tsx` renders kicker, `h1` `site.name`, `site.role`, thesis, `TrailSigns`, cue links as server HTML. e2e `homepage.spec.ts` "server HTML shows the name, role and relief poster" and "Home without JavaScript" at several viewports; CI green on 284f433 twice. |
| 2 | Capable device: real Matterhorn terrain with contours; native scroll drives the camera; rail climbs 1,617 to 4,478 m, decorative, aria-hidden, hidden below 768 px; skip link past the ascent | VERIFIED | `TerrainCanvas.tsx` (`frameloop="demand"`), `TerrainMesh.tsx` (fast-png heightmap, contour shader), `CameraRig.tsx` follows one damped progress value. `lowestDemM = 1617` (`data/generated/photos.ts:160`), `officialM = 4478` (`data/generated/terrain.ts:67`). `AltimeterRail.tsx` is inside the `aria-hidden` stage (`AscentController.tsx` AscentStageFrame), `hidden md:block`, `pointer-events-none`. No `preventDefault`/`scrollTo` in `components/home` or `lib/ascent` (grep). e2e "native scroll: no wheel or touch interception, no snapping", "the rail is decorative and hidden below 768 px", "Skip to the summit moves focus to the summit". |
| 3 | Photo waypoints at real positions and heights; film-scan labelled approximate; always-rendered list links to every photo; two trail signs; stats as summit plaque | VERIFIED | `AscentHero.tsx` builds the `ol` of four `li#waypoint-{slug}` from `buildWaypoints()` (DEM heights and UVs from generated data); `approximate` flows to rail tick, pin label and card (`lib/ascent/waypoints.ts`). `TrailSigns` in hero and at `#summit`; `SummitPlaque` stats derived (`lib/ascent/summit.ts`). e2e "every View photo link lands on its photo", "cards read in ascending altitude", "trail signs appear in the hero and at the summit", "plaque shows the derived summit stats". Caveat: at four sizes the summit pins are covered by the plaque (see Anti-Patterns); the list and the plaque text are unaffected. |
| 4 | Reduced motion, Save-Data, no WebGL2, low memory or lost context give a static poster with every section in final readable state; canvas renders on demand and pauses off-screen | VERIFIED (with WR-01 caveat) | `lib/ascent/capability.ts` `decideAscentMode` covers all five triggers; `TerrainStage.tsx` loads the chunk only via `next/dynamic` after arming. e2e `home-modes.spec.ts` (static triggers fetch no heightmap or three.js, both browsers), `no-webgl.spec.ts`, `home-canvas.spec.ts` "context loss falls back to the poster", "draws nothing at rest", "draws nothing off-screen", "pauses while the tab is hidden". Unit: `frame-budget.test.ts`, `ascent-capability.test.ts`. The burst-restart-after-hidden-tab invariant is NOT met, see WR-01 and `behavior_unverified_items`. |
| 5 | Mobile LCP and Home JS no worse than the Phase 7 baseline | VERIFIED | Phase 7 baseline `e2e/perf/home-baseline.json`: LCP 4,692 ms, 468,770 B. Official container run 40189690406 (5 runs, medians): LCP 3,112 ms, total JS 444,761 B. Local re-run `test-results/home-perf-local.json` agrees (3,060 ms, 444,761 B, mode 3d). Since 218840e `e2e/perf/home-baseline.spec.ts` asserts `totalJsTransferBytes <= baseline` and `lcpMs <= baseline` and that every sample stays in 3d. Gate definition ("total-keep") was Tim's choice. |

**Score:** 5/5 roadmap truths verified; 1 behavior-dependent invariant PRESENT_BEHAVIOR_UNVERIFIED (and in fact contradicted by code trace, WR-01).

### Requirements Coverage

Plan frontmatter IDs, unioned over 09-01 to 09-14: HOME-01, 02, 03, 04, 05, 06, 07, 08. REQUIREMENTS.md maps exactly those eight to Phase 9. No orphans, no unclaimed IDs.

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| HOME-01 | 09-01, 02, 12, 14 | Name, role, CTA readable without animation or WebGL | SATISFIED | SC1 evidence; JS-disabled e2e |
| HOME-02 | 09-01, 04, 07, 08, 10, 11, 12, 13, 14 | Real terrain with contours; static poster otherwise | SATISFIED (real-device check open) | SC2 and SC4 evidence; 3D only proven on SwiftShader in CI |
| HOME-03 | 09-05, 06, 10 | Native-scroll camera, skip link | SATISFIED | no-interception e2e; "Skip to the summit" focuses `#summit` |
| HOME-04 | 09-06 | Rail 1,617 to 4,478 m, decorative, hidden below 768 | SATISFIED | `AltimeterRail.tsx`, rail e2e and `rail.test.tsx` |
| HOME-05 | 09-03, 06, 10, 14 | Waypoints at real positions and heights; always-rendered list | SATISFIED | `ol` of four cards in server HTML; pin tests; summit pin overlaps are a visual caveat only |
| HOME-06 | 09-01, 05 | Two trail-sign links; stats as summit plaque | SATISFIED | `TrailSigns`, `SummitPlaque`, e2e. Note: the REQUIREMENTS text for HOME-06 does not mention "all four waypoints at the summit"; that outcome comes from locked decision D-03 and plan 09-10, and it is the part not delivered at four sizes. |
| HOME-07 | 09-07, 11 | Reduced motion final state; on-demand render; pause off-screen | SATISFIED for reduced motion and off-screen pause; hidden-tab burst interplay is WR-01 | draw-counter e2e |
| HOME-08 | 09-07, 09, 12, 13, 14 | LCP and JS no worse than Phase 7 baseline | SATISFIED | SC5 evidence |

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `app/(site)/page.tsx`, `components/home/{AscentHero,HeroBlock,TrailSigns,PosterSheet,WaypointCard,SummitPlaque,AboutSection,AltimeterRail,AscentController,TerrainStage,PinMark}.tsx` | VERIFIED | Substantive, wired from `AscentHero`/`page.tsx` |
| `components/home/terrain/{TerrainCanvas,TerrainMesh,CameraRig,PinLayer3D,ContextLossGuard}.tsx` | VERIFIED | Reached only through `next/dynamic` in `TerrainStage.tsx` (boundary test) |
| `lib/ascent/{capability,frame-budget,progress,route,summit,waypoints,poster-frame}.ts`, `lib/useAscentMode.ts`, `lib/terrain/heightmap.ts`, `lib/home-format.ts` | VERIFIED | Pure modules unit-tested |
| `e2e/{home-ascent,home-modes,home-canvas,homepage,no-webgl}.spec.ts`, `e2e/perf/home-baseline.spec.ts` | VERIFIED | Present; perf spec asserts the HOME-08 gate |
| `scripts/guards/test-count.baseline.json` | VERIFIED | 832 total (jest 646, e2e 186), raised from 533 |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `page.tsx` | `AscentHero` / `AboutSection` | import | WIRED |
| `AscentHero` | `AscentController`, `AscentStageFrame`, `PosterSheet`, `TerrainStage`, `AltimeterRail`, `WaypointCard`, `SummitPlaque` | JSX composition | WIRED |
| `TerrainStage` | `terrain/TerrainCanvas` | `dynamic(() => import(...), { ssr: false })`, armed by gate and `requestIdleCallback` | WIRED (lazy) |
| `AscentController` progress | rail, poster pins, `CameraRig` | one motion value, `useMotionValueEvent` | WIRED |
| `CameraRig` | IntersectionObserver and `visibilitychange` | `useEffect` in CameraRig | WIRED (see WR-01 for burst handling) |
| `WaypointCard` | `/photos#{slug}` | `GalleryGrid` `id={image.slug}` | WIRED (IN-06: only for the current gallery page) |

### Data-Flow Trace (Level 4)

| Artifact | Variable | Source | Real Data | Status |
|----------|----------|--------|-----------|--------|
| `AscentHero` | waypoints, heights, ticks | `buildWaypoints()` over `data/generated/photos.ts` and `terrain.ts` | Yes (4 photos, DEM heights, 1617 to 4478) | FLOWING |
| `SummitPlaque` | stats | `lib/ascent/summit.ts` from generated data | Yes (derived; IN-03 notes one parameter ignored) | FLOWING |
| `TerrainMesh` | heightmap | fast-png decode of hashed heightmap asset | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Home unit and component suites | `npx jest lib/__tests__ components/home data/__tests__/tokens.test.ts --silent` | 27 suites, 395 tests passed | PASS |
| Phase 7 baseline vs measured | read `e2e/perf/home-baseline.json` and `test-results/home-perf-local.json` | 468,770 B / 4,692 ms vs 444,761 B / 3,060 ms | PASS |
| CI on 284f433 | `gh run view 40193992531` | success: Lint and Type Check, Visual Regression, E2E, Security Audit, Unit Tests, Build | PASS |
| Playwright e2e | not run locally (needs server, SwiftShader timing is the known noise source); relied on CI run above | n/a | SKIPPED |

### Probe Execution

Step 7c: no probe scripts declared by the phase (no `probe-*.sh` in PLAN or SUMMARY). Not applicable.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `components/home/terrain/CameraRig.tsx` | 260-293, 338-342 | WR-01: burst is only dropped when a frame runs while not shown; a hidden tab runs no frames (rAF suspended), so on return `frame-budget.ts:54` (`now - start >= burstWindowMs && frames < minSamples`) returns `decline`. At pixel ratio 1 this calls `downgradeAscent('frame-budget')` and Home goes static for the rest of the page view (module-level `downgraded`, IN-05). I traced this in the code and agree with the review. | WARNING | A capable device can be declined into the static poster if the tab is hidden in the first ~0.35-1 s after reveal. It fails safe (the static Home is complete and readable), so no ROADMAP criterion breaks, but a capable-device guarantee in SC2 is narrowly violated. |
| `e2e/home-canvas.spec.ts` | 761-810 | WR-02: context-loss test runs at 412x839 with the real budget, where CI's verdict is noise (decline at 80.7 ms in run 40190531971). Passed on 284f433 twice, but depends on runner speed. | WARNING | Flake risk, not a product defect. |
| Summit frame, `components/home` plaque and pin layout | n/a | Known, measured in 09-12: at 375x667 all four 3D pins are under the docked plaque; 820x1180 pins 1-3; 768x1024 pin 3; 1024x768 pin 1 touches and pin 4 is under the rail scrim. Static poster pins are under the plaque below 1280 px (3 pins at 375, 2 at 412, 1 at 768 and 1024). E2E `summit pins clear the plaque` covers only 1440x900, 1280x720 and 412x839. | WARNING (see Gaps Summary) | Violates the D-03 intent at four sizes including a common small phone. Does not hide plaque text, the waypoint list or the trail signs. |
| `HeroBlock.tsx` scrim / `PosterSheet` pin 2 at 768 | n/a | Waypoint-2 pin label hides behind the card in the static poster at 768; docked kicker orphans "4" at 375. Both baselines committed as-is by Tim. | WARNING | Decorative label and a typographic orphan; card content still readable. |
| UI-REVIEW NEW items | n/a | Hero scrim dims rail labels at 768-1023 px; place line wraps with a leading dot at 375; pin 3 under hero copy at p=0 at 375 and 768. | INFO/WARNING | Derived from baselines, unmeasured. |
| Debt markers | n/a | Grep for TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER over Phase 9 files: none. | none | Clean. |

Open review items WR-01, WR-02 and IN-01 to IN-07 are all `open` in `09-REVIEW-DISPOSITION.md`; none is a blocker finding (0 critical). `09-SECURITY.md`: threats_open 0. `09-VALIDATION.md`: nyquist_compliant true. `09-UI-REVIEW.md`: 18/24.

### Human Verification Required

1. **Real-device 3D quality and vestibular comfort.** Test: open the ci/09-13 preview or LAN dev server on an iPhone, a mid-range Android phone and a laptop. Expected: smooth canvas fade-in, no scroll hijack, comfortable climb, all four summit pins visible, an old phone falls back to the poster. Why human: GPU and comfort cannot be emulated. Record in 09-UAT.md.
2. **Summit plaque and pin overlaps (375x667, 768x1024, 820x1180, 1024x768; static poster below 1280).** Tim to confirm accept versus gap plan. Why human: plaque layout is a product decision.
3. **768 pin-2 label behind the card; 375 kicker "4" orphan.** Tim to confirm routing to the gap plan.
4. **UI-REVIEW NEW findings** (scrim over rail at 768-1023, leading-dot place line, pin 3 under hero copy). Tim to accept or route.
5. **Hidden-tab burst (WR-01)** on a real device, or a CDP `Page.setWebLifecycleState({ state: 'frozen' })` test, per the behavior-unverified item in the frontmatter.

### Gaps Summary

No ROADMAP success criterion or HOME requirement text is FAILED, so there is no `gaps:` block and the status is `human_needed` rather than `gaps_found`.

What I weighed and where it lands:

- **Deferred overlaps and the "complete, readable Home" goal.** The content a visitor needs (name, role, CTA, four photo cards with links, plaque stats, trail signs, About) renders unobstructed at every size; the covered elements are decorative pins and one pin label. So the goal sentence holds.
- **Deferred overlaps and D-03.** D-03 is a locked CONTEXT decision, not a ROADMAP criterion. The 09-10 e2e "summit frame shows every waypoint" proves the pins project inside the stage, which is a weaker claim than "visible". At 375x667, 768x1024, 820x1180 and 1024x768 the visible outcome is not delivered. This is the one place I would call the phase's own design intent unmet. It is already routed by Tim to a gap plan, which would also take the 768 label, the 375 kicker and one more Home re-baseline.
- **WR-01.** A confirmed logic defect with a narrow trigger window and a safe failure mode (static poster). It should ride along in the same gap plan. It is not a regression introduced after verification-relevant evidence; no test covers it.
- **WR-02** is test flake exposure only.

Recommended next step: run the real-device check and record 09-UAT.md; at UAT, decide on item 2. If accepted as a gap, `/gsd-plan-phase 09 --gaps` with: compact summit plaque or pin-above-plaque framing, 768/375 label and kicker fixes, WR-01 fix with a frozen-lifecycle test, WR-02 `budgetMeasureOnly` on the context-loss test, then one Home re-baseline.

---

_Verified: 2026-10-25T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
