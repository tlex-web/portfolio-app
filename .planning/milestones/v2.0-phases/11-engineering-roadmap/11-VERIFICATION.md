---
phase: 11-engineering-roadmap
verified: 2026-11-02T15:00:00Z
status: passed
score: 11/11 must-haves verified
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
  - ".planning/phases/11-engineering-roadmap/11-19-PLAN.md"
  - ".planning/phases/11-engineering-roadmap/11-19-SUMMARY.md"
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
  - "components/projects/__tests__/Metrics.test.tsx"
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
  - "e2e/case-study.spec.ts"
  - "lib/demo-terminal.ts"
  - "lib/route-log.ts"
  - "lib/trail-grade.ts"
covered_digest: "v4:sha256:bb16d4ec6d2d5f0f58abbc5cd7b26176c48c5e8a049d87c8921618e380790047"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 5/5
  gaps_closed:
    - "G-11-4: the three box Metrics Source links all had the accessible name 'Source' (UAT test 4)"
  gaps_remaining: []
  regressions: []
advisory:
  - finding: "IN-13: the G-11-4 link names are distinct only while tile labels are non-empty and unique; the schema enforces neither (11-REVIEW, disposition open, not yet triaged)"
    category: other
    reason: "Not reachable with the current data: box labels are Tools, Tests, Binary. A schema refine would close it."
    evidence_status: "reviewed; no failing test"
  - finding: "IN-14: the unit assertion toHaveClass('sr-only') on a node selected by .sr-only cannot fail (11-REVIEW, open)"
    category: other
    reason: "The real guard is the toHaveLength(1) check plus the e2e geometry test, which fail if the class is lost."
    evidence_status: "reviewed; no failing test"
---

# Phase 11: Engineering & Roadmap Verification Report

**Phase Goal:** Visitors read Tim's engineering work, box and coin-flip, as surveyed routes (route-panel projects and case studies with honest metrics and a per-project safety slot) and follow his roadmap as a route log.
**Verified:** 2026-11-02
**Status:** passed
**Re-verification:** Yes, after gap closure (plan 11-19, gap G-11-4)

Gap G-11-4 is closed in code and the five roadmap success criteria still hold. Items 1 to 3 of the earlier human list were walked by Tim in 11-UAT.md and passed. Item 4 was the G-11-4 issue and is now fixed. No human item remains open. One automated gate is still pending (CI Visual Regression on the 11-19 commits, see Advisory).

## Goal Achievement

### Observable Truths (ROADMAP success criteria, regression check)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `/projects` shows each project as a full-width route panel; no hexagon cards remain | ✓ VERIFIED | Files `projects/page.tsx`, `RoutePanel.tsx`, `RouteProfile.tsx`, `TrailGradeMark.tsx` exist and are non-empty. The only `hex` hits in app, components, lib and data are a JSDoc comment in `RoutePanel.tsx` ("replacing the v1 hexagon card") and a test file. Prior detailed read (wiring, data flow) carried forward. Jest `components/projects` passes. |
| 2 | Each project page is a case study with omit-if-empty sections, a tabular instrument panel with context lines, and every claim sourced or softened | ✓ VERIFIED | `Metrics.tsx` re-read in full: `dl` panel, Mono `tabular-nums` value, required context line, box tiles with `sourceUrl` (data/projects.ts lines 80, 87, 94), coin-flip tiles with softened context and no link. `Metrics` returns `null` for zero tiles. The coin-flip strip has 2 tiles because the "Network calls" tile was softened out per the content packet (copy.tiles-cf, B proposal under N3), so the tile count the live-DOM check flagged is intended. |
| 3 | Safety slot per project; trail grades only as real SAC badges; ENG-03 dropped (D-24) | ✓ VERIFIED | `Safety.tsx`, `Privacy.tsx`, `trail-profiles.ts`, `TrailGradeMark.tsx` present. `npm run trails:build -- --check` printed `trails: OK`. REQUIREMENTS.md line 89 and the traceability row mark ENG-03 "Dropped (D-24)". |
| 4 | Terminal demo uses tokens v2, stops auto-playing on focus, hover and reduced motion, and has a pause button | ✓ VERIFIED | `DemoTerminal.tsx` and `lib/demo-terminal.ts` present. Re-run: `lib/__tests__/demo-terminal.test.ts` and `DemoTerminal.test.tsx` pass (326 tests, 17 suites, see spot-checks). |
| 5 | `/roadmap` is a route log on a vertical elevation axis with a last-surveyed date, and a URL-backed segmented filter that disables empty combinations | ✓ VERIFIED | `RouteLog.tsx`, `RouteRow.tsx`, `RouteLogFilters.tsx`, `lib/route-log.ts`, `data/roadmap.ts` present. `data/__tests__/roadmap.test.ts`, `route-log.test.ts` and `components/roadmap` pass in the re-run. |

### Gap-closure truths (plan 11-19 must_haves, G-11-4)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | Box Metrics source links are named exactly "Source (Tools)", "Source (Tests)", "Source (Binary)", with unchanged hrefs and no target, and no bare "Source" link in `section#metrics` | ✓ VERIFIED | `Metrics.tsx` lines 93 to 100: `Source`, `ArrowSquareOutIcon` (aria-hidden), then `<span className="sr-only"> ({tile.label})</span>`, anchor classes and `href={tile.sourceUrl}` unchanged. Labels Tools, Tests, Binary come from `data/projects.ts` lines 77, 84, 91. 11-DOM-VERIFY C1 (live production build, 2560 px): exactly 3 links with those names and hrefs, no target, no aria-label. |
| 7 | The suffix is the tile's own dt label in an sr-only span starting with a space; no new words; the plan claims no wording approval beyond Tim's reply | ✓ VERIFIED | The span text is ` (` + `{tile.label}` + `)`. 11-19-PLAN and SUMMARY quote "yes change to a suffix on each link" and state the wording was not separately approved. UAT line 40 carries that literal reply. 11-DOM-VERIFY C2: each link holds exactly one `span.sr-only` with text `" (Tools)"` etc., computed `position: absolute`. |
| 8 | Sighted view unchanged: removing the suffixes moves no dl, tile, dd or link and changes no scroll size at 375, 768, 1440 px; each suffix at most 1x1 px | ✓ VERIFIED | The permanent e2e in `e2e/case-study.spec.ts` (added in d111885) measures and compares in one `page.evaluate`; the SUMMARY reports it passing at all three widths in chromium and firefox, plus two negative controls. I did not re-run Playwright (it needs a server). Independent corroboration: 11-DOM-VERIFY C3 on a production `next start`, rects identical before and after removal and suffixes 1x1 at 2560 px. The 375/768/1440 widths rest on the e2e result. |
| 9 | coin-flip is untouched: no sourceUrl, no link, no suffix (D-23) | ✓ VERIFIED | `data/projects.ts` coin-flip tiles (lines 204 to 217) carry no `sourceUrl`; `git diff 4f5bdc1..HEAD` touches only Metrics.tsx, Metrics.test.tsx and e2e/case-study.spec.ts outside `.planning`. 11-DOM-VERIFY C4: 0 links, 0 `.sr-only`. |
| 10 | No PNG added or modified and no re-baseline dispatched | ✓ VERIFIED | Re-run by me: `check-snapshot-commit --sha 293b093 --none` and `--sha d111885 --none` both print `snapshot-commit: OK (0 changed)`. `git diff --name-only 4f5bdc1..HEAD` has no `png` and no `e2e/visual` path. |
| 11 | Tests rewritten, not deleted: Jest +1, e2e +1, guard green, baseline not raised | ✓ VERIFIED | `Metrics.test.tsx` has the rewritten D-23 test (name `Source (Label 1)`, line 96) and the new G-11-4 test (line 121). `e2e/case-study.spec.ts` lines 309 to 321 build names from `tile.label` and assert no bare "Source" and a link count equal to sourced tiles. SUMMARY reports Jest 1307, e2e 462, floor 1749, baseline file not raised; the orchestrator reports full Jest 1307/1307. I did not re-run the full suite or `guard:tests`. |

**Score:** 11/11 truths verified (5 roadmap criteria, 6 gap-closure truths; 0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/projects/sections/Metrics.tsx` | sr-only suffix per source link | ✓ VERIFIED | Substantive and wired (rendered by `CaseStudy` Metrics slot). Non-comment `className="sr-only"` count is 1. |
| `components/projects/__tests__/Metrics.test.tsx` | per-tile name tests | ✓ VERIFIED | Contains `Source (Label 1)`; suite passes. |
| `e2e/case-study.spec.ts` | live names and invisibility proof | ✓ VERIFIED | Contains G-11-4 assertions. Not re-run by me. |
| All 11-01..11-18 artifacts (routes, `RoutePanel`, `CaseStudy`, sections, `RouteLog`, data, schemas, generated trail and media data, lib) | as in prior verification | ✓ VERIFIED (regression check) | All files exist and are non-empty. `git diff 4f5bdc1..HEAD` shows no code change outside the three 11-19 files. |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| `Metrics.tsx` | `data/projects.ts` | ✓ WIRED | The suffix renders `tile.label`, the same string the dt shows. |
| `e2e/case-study.spec.ts` | `data/projects.ts` | ✓ WIRED | Expected names and context lines are built from `project.metrics.tiles`, not literals. |
| Prior links (page to RoutePanel/RouteProfile, CaseStudy to RouteIndex, RouteLogFilters to URL) | | ✓ WIRED | No code changed since the last verification, which traced them. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| Metrics source link | `tile.label`, `tile.sourceUrl` | `data/projects.ts` box tiles (Tim-approved copy) | Yes | ✓ FLOWING |
| Others (RoutePanel, RouteProfile, Safety, RouteLog, DemoClip) | | unchanged since prior verification | Yes | ✓ FLOWING |

### Behavioral Spot-Checks (run by the verifier, HEAD be7d9e0)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Projects, roadmap, route-log and terminal logic | `npx jest components/projects data/__tests__/projects.test.ts data/__tests__/roadmap.test.ts components/roadmap lib/__tests__/route-log.test.ts lib/__tests__/demo-terminal.test.ts --silent` | 17 suites, 326/326 pass (325 before plus the one new 11-19 test) | ✓ PASS |
| Types | `npm run type-check` | clean | ✓ PASS |
| Data contract | `npm run data:check` | passes | ✓ PASS |
| Trail geometry | `npm run trails:build -- --check` | `trails: OK` | ✓ PASS |
| Clip manifest | `npm run clip:derive -- --check` | `clips: OK` | ✓ PASS |
| No PNG in 11-19 commits | `node scripts/ci/check-snapshot-commit.mjs --sha 293b093 --none` and `--sha d111885 --none` | `snapshot-commit: OK (0 changed)` twice | ✓ PASS |
| Debt markers | grep TBD/FIXME/XXX in phase source (non-test) | none | ✓ PASS |

### Probe Execution

No `probe-*.sh` declared or present. Step 7c skipped.

### Requirements Coverage

| Requirement | Source plans | Status | Evidence |
|-------------|--------------|--------|----------|
| ENG-01 | 11-04, 11-06, 11-07, 11-12, 11-17, 11-18 | ✓ SATISFIED | Truth 1; REQUIREMENTS.md `[x]`, traceability Complete. |
| ENG-02 | 11-01, 11-07, 11-09, 11-11, 11-13..11-17 | ✓ SATISFIED | Truths 2 and 3; `[x]`. |
| ENG-03 | 11-02, 11-07, 11-18 | ✓ ACCOUNTED FOR (Dropped, D-24) | REQUIREMENTS.md line 89 and traceability row "Dropped (D-24)"; ROADMAP SC3 consistent. Not a gap. |
| ENG-04 | 11-02, 11-07, 11-12, 11-13, 11-17, 11-19 | ✓ SATISFIED | Truths 2 and 6 to 9: instrument panel, sourced or softened, and now per-tile link names. |
| ENG-05 | 11-01, 11-03, 11-07, 11-17 | ✓ SATISFIED | Truth 4. |
| ROUTE-01 | 11-05, 11-08, 11-13, 11-17 | ✓ SATISFIED | Truth 5. |
| ROUTE-02 | 11-05, 11-08, 11-10, 11-17 | ✓ SATISFIED | Truth 5. |
| ROUTE-03 | 11-05, 11-08, 11-17 | ✓ SATISFIED | Truth 5. |

All 8 IDs in the phase brief appear in REQUIREMENTS.md, are mapped to Phase 11 and are claimed by at least one plan. Orphaned requirements: none.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `components/projects/sections/Metrics.tsx` | 100 | Link name depends on non-empty, unique tile labels; the schema enforces neither (IN-13) | ℹ️ Info | Not reachable with the current data. |
| `components/projects/__tests__/Metrics.test.tsx` | 104-106 | `toHaveClass('sr-only')` on a node selected by `.sr-only` cannot fail (IN-14) | ℹ️ Info | Real protection comes from the length check and the e2e geometry test. |
| 11-REVIEW-DISPOSITION | n/a | IN-01..IN-14 recorded with disposition `open` (not yet triaged); WR-01 and WR-02 fixed | ℹ️ Info | None reachable with the current data. |

No debt markers, no stubs, and no blocker anti-patterns in the 11-19 files.

### Human Verification Required

None. Earlier items 1 to 3 (poster against the native control bar, clip playback, visual quality) passed in 11-UAT.md, and item 4 became G-11-4, now closed. An optional real screen-reader pass (NVDA or VoiceOver) over the three links is recorded in the 11-19 SUMMARY (D4); the names are proven in jsdom and in the live accessibility snapshot, so this is not required.

### Advisory (new scope, unevidenced)

| # | Finding | Category | Why advisory |
|---|---------|----------|--------------|
| 1 | The CI Visual Regression job has not run on the 11-19 commits (nothing pushed). The box baselines are expected unchanged: the suffix is absolutely positioned, clipped to 1x1 px, and the e2e and live-DOM checks show no geometry change, but the CI run is the definitive gate. | other | A box diff there would be a code defect to fix, never a re-baseline (e2e/visual/README zero-diff rule). Pushing is Tim's call. |
| 2 | IN-13 and IN-14 (see Anti-Patterns). | other | Reviewed; disposition `open` in 11-REVIEW-DISPOSITION.md, not yet triaged; no failing test. |

### Gaps Summary

No gaps. G-11-4 is closed: the code, unit tests, e2e and a live production-build DOM check all show the three box links named "Source (Tools)", "Source (Tests)" and "Source (Binary)", with the visible text and layout unchanged, coin-flip untouched, and no PNG changed. The five roadmap success criteria still hold, and nothing but the three 11-19 files changed in code since the previous verification. ENG-03 is dropped by decision D-24 and is consistent across REQUIREMENTS.md, the ROADMAP and the code. The remaining step before merge is the CI Visual Regression run on the next push.

---

_Verified: 2026-11-02_
_Verifier: Claude (gsd-verifier)_
