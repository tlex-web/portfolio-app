---
phase: 11-engineering-roadmap
verified: 2026-11-02T12:00:00Z
status: human_needed
score: 5/5 must-haves verified
covered_files:
  - ".planning/phases/11-engineering-roadmap/11-01-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-01-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-02-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-02-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-03-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-03-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-04-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-04-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-05-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-05-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-06-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-06-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-07-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-07-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-08-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-08-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-09-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-09-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-10-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-10-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-11-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-11-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-12-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-12-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-13-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-13-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-14-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-14-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-15-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-15-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-16-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-16-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-17-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-17-SUMMARY.md"
  - ".planning/phases/11-engineering-roadmap/11-18-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-18-SUMMARY.md"
  - "app/(site)/projects/[slug]/page.tsx"
  - "app/(site)/projects/page.tsx"
  - "app/(site)/roadmap/page.tsx"
  - "components/projects/CaseStudy.tsx"
  - "components/projects/DemoClip.tsx"
  - "components/projects/DemoTerminal.tsx"
  - "components/projects/RouteIndex.tsx"
  - "components/projects/RoutePanel.tsx"
  - "components/projects/RouteProfile.tsx"
  - "components/projects/TrailGradeMark.tsx"
  - "components/projects/sections/Demo.tsx"
  - "components/projects/sections/Metrics.tsx"
  - "components/projects/sections/Privacy.tsx"
  - "components/projects/sections/Safety.tsx"
  - "components/roadmap/RouteLog.tsx"
  - "components/roadmap/RouteLogFilters.tsx"
  - "components/roadmap/RouteRow.tsx"
  - "data/generated/media-manifest.ts"
  - "data/generated/trail-profiles.ts"
  - "data/projects.ts"
  - "data/roadmap.ts"
  - "data/schemas/project.ts"
  - "data/schemas/roadmap.ts"
  - "lib/demo-terminal.ts"
  - "lib/route-log.ts"
  - "lib/trail-grade.ts"
covered_digest: "v4:sha256:cd1293b30ac3dc0cee45bb21ed6d0185ed648eeec105147f6b048801cafa3e8e"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Open /projects/coin-flip on a real device or desktop Chrome/Safari and look at the Demo clip at rest (poster, native controls shown)."
    expected: "The word HEADS on the poster is readable above the native control bar, or the figcaption carries the result so no cue is lost (11-UI-REVIEW priority fix 2)."
    why_human: "CI baselines hide native controls and Playwright Chromium cannot play H.264; the occlusion only exists in a real browser."
  - test: "Press play on the coin-flip clip in Chrome, Safari and Firefox."
    expected: "The 4.4 s silent clip plays, no audio, no autoplay or loop; the load-failure fallback paragraph is not shown."
    why_human: "e2e never presses play (H.264 unsupported in Playwright Chromium); playback is real-browser behaviour."
  - test: "Eyeball /projects (both panels), /projects/box (Demo terminal) and /roadmap at 375, 768 and 1440 px."
    expected: "Elevation-profile glyph, T4/T1 waymark badge, terminal (no large dead area, UI-REVIEW fix 3) and route-log axis read as intended and look good."
    why_human: "Visual quality and aesthetic judgement are not automatable; the visual baselines only prove no change since Tim's accepted baseline."
  - test: "Check the three box metric tiles' 'Source' links with a screen reader or the accessibility tree."
    expected: "Each link's accessible name says what it sources (tools, tests, binary), not three identical 'Source' names (UI-REVIEW warning)."
    why_human: "Judgement on whether the identical names are acceptable; advisory, not a spec failure."
---

# Phase 11: Engineering & Roadmap Verification Report

**Phase Goal:** Visitors read Tim's engineering work, box and coin-flip, as surveyed routes (route-panel projects and case studies with honest metrics and a per-project safety slot) and follow his roadmap as a route log.
**Verified:** 2026-11-02
**Status:** human_needed
**Re-verification:** No, initial verification

All five roadmap success criteria are met in the codebase. The status is `human_needed` only because a few visual and real-browser items cannot be checked automatically. There are no gaps.

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `/projects` shows each project as a full-width route panel (name, pitch, metric strip, trail-grade badge, elevation-profile glyph); no hexagon cards remain | ✓ VERIFIED | `app/(site)/projects/page.tsx` is a Server Component rendering one `RoutePanel` per project from `data/projects.ts` (box, then coin-flip) in an `<ol>`. `RoutePanel.tsx` renders kicker, h2 stretched link, pitch, a `dl` metric strip with the release line, a links row, and `<RouteProfile id={project.route}/>`. `RouteProfile` renders the SVG elevation glyph plus the caption with `TrailGradeMark`. Hex check: the only `hex` matches in app, components, lib, data, e2e and scripts are comments and the e2e assertion that no `[class*="hex-"]` exists. No `hex` in `globals.css`. |
| 2 | Each project page reads as a case study (problem, pipeline, safety, metrics, demo, stack, next steps), omits sections with no data, shows metrics as a tabular instrument panel with a context line, and every claim is sourced or softened | ✓ VERIFIED | `CaseStudy.tsx` has `SECTION_ORDER` with 7 slots and an exhaustive `never`-checked switch. Each renderer returns `null` without data, and `caseStudySections` drops those slots so the `RouteIndex` entry goes with them. `Metrics.tsx` is a `dl` panel with a Mono `tabular-nums` value and a required context line. In `data/projects.ts`, every box tile has a `sourceUrl` pointing at the public box repo and a "Measured at v2.0" release line. coin-flip tiles carry softened context ("Checked on the release APK"), no link, and the repository is private. coin-flip's Demo section renders only if the manifest has `coin-flip-toss` and an approved description exists. |
| 3 | Safety slot per project: box Safety shows real preview output from a gated destructive command and says what `--force` would change; coin-flip Privacy lists approved facts; trail grades appear only as the real SAC badge of the profile trail with marker glyph and text label; ENG-03 dropped (D-24) | ✓ VERIFIED | box `safety.capture` is a real `bulk-rename` dry run ("Dry run: 2 to rename... Re-run with --force to apply.") and `forceLine` states what `--force` would rename. It renders in `Safety.tsx` as a static `<pre>`, with React text children so it is escaped. coin-flip `privacy.facts` has 3 approved facts (no permissions, fully offline, no ads/trackers/accounts), rendered by `Privacy.tsx` in the same third slot (id `privacy`). `trail-profiles.ts` carries Hörnliweg 27 as T4 (Schwarzsee 2,587 m to Hörnlihütte 3,262 m) and Zmutt path 2 as T1 (Zermatt 1,606 m to Zmutt 1,950 m). `TrailGradeMark` shows a waymark glyph, the visible grade text and an sr-only waymark name. `trails:build --check` printed `trails: OK`. Grades exist nowhere else. |
| 4 | Terminal demo uses tokens v2, stops auto-playing on focus, hover and reduced motion, and has a pause button | ✓ VERIFIED | `DemoTerminal.tsx` uses token utilities only (`bg-surface-raised`, `border-line`, `text-ink`) with no raw colours. `isPlaying()` in `lib/demo-terminal.ts` requires no sticky, hover, focusWithin, offscreen or hidden source. Under reduced motion `sticky = override ?? reduced`, so it starts paused. A `Pause demo` `aria-pressed` button is present, and release resumes at once via `releaseSticky`. The behaviour is exercised by passing named unit tests (`lib/__tests__/demo-terminal.test.ts`, `DemoTerminal.test.tsx`): Jest on components/projects and lib gave 325/325. |
| 5 | `/roadmap` orders items on a vertical elevation axis (completed below with dates, in-progress at the current camp, planned above), lists v2.0 as in progress, shows a "last surveyed" date; a segmented control filters by project and status, the filter lives in the URL, and empty filters are removed or disabled | ✓ VERIFIED | `lib/route-log.ts` `bands()` returns Summit (planned), Current camp (in-progress) and Base (completed), sorted by `order` descending. `RouteLog.tsx` draws the axis, with Current camp as the raised plate. `RouteRow.tsx` renders `Completed {formatLogDate(completedAt)}`. `data/roadmap.ts` has `portfolio-v2` as `in-progress` with its 6 phases, and `surveyedAt = '2026-11-01'`, rendered as "Route log surveyed ..." in the page header. `RouteLogFilters` has two `aria-pressed` groups. Counts of 0 give `aria-disabled`, and stale counts during a pending press are also disabled (WR-02). The state comes from `searchParams` through `parseProject`/`parseStatus` whitelists, and `router.replace(routeLogHref(...))` writes it back to the URL with no history entry. `data/__tests__/roadmap.test.ts` and `route-log.test.ts` pass. |

**Score:** 5/5 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/(site)/projects/page.tsx` | Route panel list | ✓ VERIFIED | Server Component, wired to data and `RoutePanel`. |
| `app/(site)/projects/[slug]/page.tsx` | Case-study route | ✓ VERIFIED | `generateStaticParams` lists box and coin-flip; `dynamicParams = false` and `notFound()` give a 404 for any other slug. |
| `components/projects/{RoutePanel,RouteProfile,TrailGradeMark,CaseStudy,Trailhead,EndBlock,RouteIndex,DemoTerminal,DemoClip}.tsx` | Panels, glyph, badge, case study, terminal, clip | ✓ VERIFIED | All substantive and imported. |
| `components/projects/sections/*` (Safety, Privacy, Metrics, Pipeline, Problem, Stack, NextSteps, Demo) | Seven slots | ✓ VERIFIED | Wired through the `CaseStudy` switch. |
| `components/roadmap/{RouteLog,RouteRow,RouteLogFilters}.tsx` | Route log | ✓ VERIFIED | Wired in `roadmap/page.tsx`. |
| `data/projects.ts`, `data/roadmap.ts`, `data/schemas/{project,roadmap}.ts` | Strict zod contracts and approved data | ✓ VERIFIED | `data:check` passes. |
| `data/generated/trail-profiles.ts`, `data/terrain/source/trails.json` | Real trail geometry with provenance | ✓ VERIFIED | `trails:build --check` printed `OK`. |
| `data/generated/media-manifest.ts`, `public/media/coin-flip-toss.*.mp4` and poster | Clip and poster | ✓ VERIFIED | 4.417 s, 211,784 B, 512×1010; `clip:derive --check` printed `clips: OK`. |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| `projects/page.tsx` | `RoutePanel` + `RouteProfile` | ✓ WIRED | `toPanelProps` passes `figure=<RouteProfile id={project.route}/>`. |
| `RouteProfile` | `trailProfiles` (generated) | ✓ WIRED | Server-only import, no client import. |
| `[slug]/page.tsx` | `CaseStudy` + `RouteIndex` | ✓ WIRED | The index receives only the ids and labels of the sections that render. |
| `Demo.tsx` | `DemoTerminal` / `DemoClip` | ✓ WIRED | Imported directly; the island receives only `{name, commands}`. |
| `CaseStudy` NextSteps | `roadmapItems` | ✓ WIRED | `nextStepRows` resolves ids against the route log. |
| `roadmap/page.tsx` | `routeLogView` + `RouteLogFilters` + `RouteLog` | ✓ WIRED | The URL is the single source of filter state. |
| `RouteLogFilters` | URL | ✓ WIRED | `router.replace(routeLogHref(next), {scroll:false})`. |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| RoutePanel strip | `project.metrics.tiles` | `data/projects.ts` (Tim-approved, sourced) | Yes | ✓ FLOWING |
| RouteProfile | `points`, start/end heights | Generated from the swisstopo trail polyline and the committed DEM, sha256-pinned | Yes | ✓ FLOWING |
| Safety figure | `capture` | Verbatim box v2.0 dry-run output | Yes | ✓ FLOWING |
| RouteLog | `roadmapItems` | Tim-confirmed rows | Yes | ✓ FLOWING |
| DemoClip | `mediaManifest['coin-flip-toss']` | Derived by `build-clip.mjs`, content-hashed | Yes | ✓ FLOWING |

### Behavioral Spot-Checks (run by the verifier, at HEAD 74e3525)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Projects, roadmap, route-log and terminal logic | `npx jest data/__tests__/projects.test.ts data/__tests__/roadmap.test.ts components/projects components/roadmap lib/__tests__/route-log.test.ts lib/__tests__/demo-terminal.test.ts --silent` | 17 suites, 325/325 pass | ✓ PASS |
| Types | `npm run type-check` | clean | ✓ PASS |
| Lint, all guards, `data:check`, `guard:images` | `npm run lint` | passes (`clips: OK`, `served-images: OK`) | ✓ PASS |
| Guard selftest | `npm run guard:selftest` | 85/85 | ✓ PASS |
| Trail geometry offline check | `npm run trails:build -- --check` | `trails: OK` | ✓ PASS |
| Clip manifest check | `npm run clip:derive -- --check` | `clips: OK` | ✓ PASS |
| Debt markers | grep for TBD/FIXME/XXX in app, components, lib, data, scripts and e2e | Only test assertions that ban those strings from the rendered output | ✓ PASS |

Already gathered by the orchestrator and not re-run: Jest 1306/1306 at HEAD, and CI run 41367381672 on e511d7a green on every job including E2E and Visual Regression. The WR-01/WR-02 fixes and the Nyquist/secure-phase tests landed after that CI run and were verified locally only (see the human items below and the Anti-Patterns table).

### Probe Execution

No `probe-*.sh` declared or present. Step 7c skipped.

### Requirements Coverage

Every ID in the phase's plan frontmatter appears in REQUIREMENTS.md and in the traceability table.

| Requirement | Source plans | Status | Evidence |
|-------------|--------------|--------|----------|
| ENG-01 | 11-04, 11-06, 11-07, 11-12, 11-17, 11-18 | ✓ SATISFIED | Truth 1; hex code is gone. |
| ENG-02 | 11-01, 11-07, 11-09, 11-11, 11-13..11-17 | ✓ SATISFIED | Truths 2 and 3; seven slots, omit-if-empty. |
| ENG-03 | 11-02, 11-07, 11-18 (carried in frontmatter) | ✓ ACCOUNTED FOR (Dropped, D-24) | REQUIREMENTS.md line 89 and the traceability row read "Dropped (D-24)". ROADMAP SC3 states the same. No risk bands exist anywhere; grades are only real SAC badges. Not a gap. |
| ENG-04 | 11-02, 11-07, 11-12, 11-13, 11-17 | ✓ SATISFIED | Truth 2; Mono tabular values, context lines, sources or softened wording. |
| ENG-05 | 11-01, 11-03, 11-07, 11-17 | ✓ SATISFIED | Truth 4. |
| ROUTE-01 | 11-05, 11-08, 11-13, 11-17 | ✓ SATISFIED | Truth 5. |
| ROUTE-02 | 11-05, 11-08, 11-10, 11-17 | ✓ SATISFIED | Truth 5. |
| ROUTE-03 | 11-05, 11-08, 11-17 | ✓ SATISFIED | Truth 5; `surveyedAt` and `completedAt` are in the data and rendered. |

Orphaned requirements: none. REQUIREMENTS.md maps exactly these 8 IDs to Phase 11, and every one is claimed by a plan.

### Plan-time value changes (each Tim-approved with a quote in the SUMMARYs)

Confirmed in the code: Zmutt route ends at "Zmutt" 1,950 m (`trail-profiles.ts`). Inline code formatting is present via `InlineCode` in Safety. The clip is 4.417 s, inside the 4–10 s D-27 range. The Next steps link and the RouteIndex stale-stage fix are present. WR-02 disabled-while-pending logic is in `RouteLogFilters.tsx`.

### Private-repo leak check (coin-flip)

- `data/projects.ts` and the schema contain no coin-flip link. `repository` is the literal `'private'`, and the schema has no `links` key for coin-flip. `RoutePanel` prints "Source: private repository" as plain text.
- A `git grep` over code, data, lib, app and e2e finds no `github.com/tlex-web/coin-flip`, no Kotlin or Android identifiers, no package id, `.kt`, `AndroidManifest` or gradle references (the only hits are binary PNG noise).
- The planning docs mention the private repo's name and URL (STATE.md, CONTEXT, plans). That is the repo's existence, which Tim stated himself, not its internals. The D-23 rule is "no source, paths, IDs or test evidence", and the packet holds only approved summary wording. 11-SECURITY.md records T-11-03/T-11-13/T-11-14 as closed, with data-test enforcement (`PRIVATE_PATTERNS`, D-30 word list).
- Conclusion: no coin-flip internals leaked.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/WINDOWS.md` | 24 (row 7) | Stale "open" stub entry: "Demo returns null for coin-flip until clip lands in 11-15/11-16" | ⚠️ Warning (ledger housekeeping) | `Demo.tsx` now renders the clip, so the entry should be marked fixed. Left open, `open_count > 0` would block `/gsd-ship` if `workflow.windows_enforce` is on. Row 3 (Phase 10, WebKit Tab-wrap) is also open, but it predates this phase. |
| `components/projects/EndBlock.tsx` | 8 | `py-3` (12 px, banned by the spacing rule) | ℹ️ Info | 11-UI-REVIEW fix 1; advisory (19/24). |
| `components/roadmap/RouteLog.tsx` | ~61 | Arbitrary `top-[39px] -left-[33px]` offsets | ℹ️ Info | UI-REVIEW; cosmetic. |
| 11-REVIEW-DISPOSITION.md IN-01..IN-12 | n/a | 12 info findings, left open (empty command list in `DemoTerminal`, `RangeError` in the MP4 walker, URL scheme on `sourceUrl`, unconstrained row ids, and others) | ℹ️ Info | None reachable with the current data and none block the goal. Dispositioned by Tim. |

The two review warnings (WR-01, WR-02) are fixed in code. WR-02 was confirmed in `RouteLogFilters.tsx`, and Tim kept its behaviour. Those two fixes and the Nyquist/secure-phase tests were not covered by CI; I re-ran lint, type-check and the targeted Jest above and all pass.

### Human Verification Required

#### 1. coin-flip poster versus the native control bar

**Test:** Open `/projects/coin-flip` in desktop Chrome and Safari and on a phone, and look at the Demo clip at rest.
**Expected:** The "HEADS" label on the poster is not covered by the native control bar, or the figcaption carries the result.
**Why human:** CI baselines hide native controls, so only a live browser shows the occlusion (11-UI-REVIEW priority fix 2).

#### 2. Clip playback

**Test:** Press play in Chrome, Safari and Firefox.
**Expected:** The silent 4.4 s clip plays, with no autoplay or loop and no fallback text.
**Why human:** Playwright Chromium cannot decode H.264, so e2e never plays it.

#### 3. Glyph, terminal and route-log visual quality

**Test:** View `/projects`, `/projects/box` and `/roadmap` at 375, 768 and 1440 px.
**Expected:** The profile glyph and waymark badge, the terminal (no large dead area) and the elevation axis read as designed.
**Why human:** Aesthetic judgement. The visual baselines only prove nothing changed since Tim's accepted baseline.

#### 4. Metric "Source" link names

**Test:** Check the accessible names of the three box tile "Source" links.
**Expected:** Each says what it sources.
**Why human:** Advisory UI-REVIEW warning; Tim decides whether identical names are acceptable.

### Gaps Summary

No gaps. All five roadmap success criteria, and all of ENG-01, ENG-02, ENG-04, ENG-05 and ROUTE-01..03, are backed by code I read and by checks I re-ran. ENG-03 is dropped by decision D-24 and is consistent across REQUIREMENTS.md, the ROADMAP and the code. The status is `human_needed` because of the four visual and real-browser items above, which are listed rather than treated as failures.

Housekeeping for the orchestrator: mark `.planning/WINDOWS.md` row 7 fixed (the coin-flip Demo now renders), so it doesn't block a later `/gsd-ship`.

---

_Verified: 2026-11-02_
_Verifier: Claude (gsd-verifier)_
