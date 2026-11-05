---
phase: 11-engineering-roadmap
plan: 07
subsystem: ui
tags: [nextjs, zod, server-components, playwright, case-study, data-swap]

requires:
  - phase: 11-02
    provides: Tim's quoted resolved values and the approved captures (verbatim)
  - phase: 11-03
    provides: DemoTerminal with name/commands props and the note line
  - phase: 11-06
    provides: RoutePanel and the toPanelProps mapper on /projects
  - phase: 11-08
    provides: route-log row ids (coin-flip-v1-1, coin-flip-play-store)
provides:
  - "ProjectSchema: strict box | coin-flip discriminated union with optional slot blocks (no features, highlights, pricing or risk fields)"
  - "data/projects.ts: box then coin-flip from approved values only; projectsIntro"
  - "components/projects/CaseStudy.tsx: SECTION_ORDER, Slot, slotMeta, caseStudySections, exhaustive slot switch"
  - "components/projects/Trailhead.tsx: back link, kicker, h1#case-title, outcome, links row, optional figure column"
  - "components/projects/sections/Demo.tsx: box terminal section"
  - "/projects/box and /projects/coin-flip; the CLI_X slugs are designed 404s"
affects: [11-11, 11-12, 11-13, 11-15, 11-16, 11-17, 11-18]

actuals:
  tokens: 18600
  tasks: 1
  commits: 1
plan_head_before: dd74d1378a03c963cdeb01eb01996a46ae0bd7a8
plan_head_after: d526b7ef1d3daa20b3e681e16fea00cddba04650

tech-stack:
  added: []
  patterns:
    - "Case-study slots: constant SECTION_ORDER mapped through one exhaustive switch (never check); a slot without approved data renders nothing"
    - "Third slot id/label comes from the project (safety/Safety on box, privacy/Privacy on coin-flip)"
    - "Approved prose is stored without the review copy's inline-code backticks; renderers style flags themselves"

key-files:
  created:
    - components/projects/CaseStudy.tsx
    - components/projects/Trailhead.tsx
    - components/projects/sections/Demo.tsx
  modified:
    - data/schemas/project.ts
    - data/projects.ts
    - data/__tests__/projects.test.ts
    - app/(site)/projects/[slug]/page.tsx
    - app/(site)/projects/page.tsx
    - components/projects/__tests__/projects-page.test.tsx
    - e2e/case-study.spec.ts
    - e2e/no-webgl.spec.ts
    - e2e/shell.spec.ts

key-decisions:
  - "Approved prose ships without the markdown backticks of the 11-02 review copy (wording unchanged); 11-11 splits forceLine on the literal '--force', which backticks would break"
  - "The /projects intro lives in data/projects.ts as projectsIntro (copy.projects-intro), read by the page and mockable in its test"
  - "Box stack items split from Tim's comma lists (Platform: 'Windows', 'PowerShell 7'; Crates: eight names); coin-flip has no Rendering group (not supplied)"
  - "Trailhead private-note separator shows from 640 px only; below that the note and the walkthrough link stack, so no dangling dot"

patterns-established:
  - "Trailhead({ project, figure }) owns its page container; 11-12 passes the route profile as figure"
  - "caseStudySections(project) returns { id, label, node } in slot order for the 11-13 route index"

requirements-completed: [ENG-01, ENG-02, ENG-03, ENG-04, ENG-05]

coverage:
  - id: D1
    description: "Strict box | coin-flip schema rejecting features, highlights, pricing, riskScore and riskLevel; coin-flip has no link field"
    requirement: ENG-03
    verification:
      - kind: unit
        ref: "data/__tests__/projects.test.ts#ProjectSchema"
        status: pass
    human_judgment: false
  - id: D2
    description: "box and coin-flip data from quoted supplied rows; captures byte for byte; no paths, ANSI, private patterns, D-30 words or banned phrases"
    requirement: ENG-04
    verification:
      - kind: unit
        ref: "data/__tests__/projects.test.ts#Captured strings / Copy"
        status: pass
    human_judgment: false
  - id: D3
    description: "/projects/box and /projects/coin-flip: titles, meta description = pitch, trailheads, no WebGL, no horizontal scroll at 375 px; CLI_X slugs, /projects/BOX and an unknown slug are 404s without redirect"
    requirement: ENG-02
    verification:
      - kind: e2e
        ref: "e2e/case-study.spec.ts#Case-study route"
        status: pass
    human_judgment: false
  - id: D4
    description: "box Demo section with the four approved commands and notes in the terminal; coin-flip has no Demo"
    requirement: ENG-05
    verification:
      - kind: e2e
        ref: "e2e/case-study.spec.ts#Demo (ENG-05)"
        status: pass
    human_judgment: false
  - id: D5
    description: "/projects panels: box GitHub link, coin-flip private note, approved intro, kickers 'v2.0 · shipped' and 'v1 · on device'"
    requirement: ENG-01
    verification:
      - kind: unit
        ref: "components/projects/__tests__/projects-page.test.tsx"
        status: pass
      - kind: e2e
        ref: "e2e/projects.spec.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "Trailhead visual quality (spacing, wrapping, link row) on both case studies"
    verification: []
    human_judgment: true
    rationale: "Layout quality is a visual judgment; the 11-17 re-baseline covers the changed case-study screenshots"

duration: 11min
completed: 2026-11-01
status: complete
---

# Phase 11 Plan 07: box and coin-flip replace CLI_X Summary

**Strict box | coin-flip schema and Tim's approved data now drive /projects and the two case studies: a Trailhead header band, the CaseStudy slot template with box's four-command terminal wired, and the CLI_X slugs as designed 404s.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-11-01T21:03:00Z
- **Completed:** 2026-11-01T21:14:00Z
- **Tasks:** 1 (tracer)
- **Files modified:** 17 (3 created, 9 modified, 5 deleted)

## Accomplishments

- `data/schemas/project.ts`: `DemoCommandSchema { input, output, note? }` and `ProjectSchema = z.discriminatedUnion('slug', [Box, CoinFlip])`, all strict, every slot block optional, exactly the interfaces-block shape. The CLI_X blocks and enums are gone (`RiskLevel`, `RiskScaleBlock`, `PricingBlock`, `HighlightBlock`: 0).
- `data/projects.ts`: box then coin-flip, written only from CONTEXT facts and quoted 'supplied' rows (see the mapping below). The four terminal captures and the Safety preview were compared byte for byte against the raw capture files from 11-02 (CRLF to LF and the final newline dropped, the convention 11-02 states); all six strings match.
- `CaseStudy.tsx`: `SECTION_ORDER`, `Slot`, `slotMeta` (third slot `safety`/`Safety` on box, `privacy`/`Privacy` on coin-flip), `renderSlot` with a `never` default, `caseStudySections`, and the default export (first section `mt-0`, then `mt-16`).
- `Trailhead.tsx`: 'All routes' back link, `{version} · {status}` kicker in nowrap units, `h1#case-title` with `text-balance`, outcome line, and the links row (box: secondary 'GitHub' button, same tab; coin-flip: LockKey icon, 'Source: private repository', separator, 'Ask for a walkthrough' to /contact). The optional `figure` goes in the right column from 1024 px.
- `sections/Demo.tsx`: box's section with the approved intro and `<DemoTerminal name commands>` (imported directly); null for coin-flip or without commands.
- `/projects/[slug]`: route contract kept; `generateMetadata` returns the title and the pitch as description; the body is `<article aria-labelledby="case-title">` with Trailhead and CaseStudy.
- `/projects`: `toPanelProps` passes `kicker`, `pitch` and `{ github }` (box) or `{ privateRepo: true }` (coin-flip); the approved intro sits under the h1.
- Removed: `lib/legacy-highlights.ts`, its fixture, `FeatureShowcase`, `ProjectHighlights`, `TechStackDisplay`.

## Data fields and their sources

| Field | box | coin-flip |
|-------|-----|-----------|
| slug, name | `box` (D-22, default.N1) | `coin-flip` (D-22, default.N1) |
| pitch | copy.pitch-box | copy.pitch-cf |
| outcome | copy.outcome-box | copy.outcome-cf |
| kicker.version | `v2.0` (CONTEXT) | `v1` (CONTEXT, D-29) |
| kicker.status | copy.status-box (`shipped`) | `on device` (CONTEXT, D-29) |
| route | `hoernliweg-27` (D-07) | `zmutt-2` (D-07) |
| links / repository | `links.github` = box URL (D-12) | `repository: 'private'` (D-12) |
| problem | copy.problem-box (one paragraph) | copy.problem-cf (one paragraph) |
| pipeline | copy.pipeline-box (3 stages, no intro/in/out) | copy.pipeline-intro-cf, copy.pipeline-endpoints-cf (`in`, `out`), copy.pipeline-stages-cf (4) |
| safety.intro | copy.safety-intro-box (claim.box-safe-default, claim.box-preflight soft wording) | (n/a) |
| safety.capture | capture.box-safety: command `bulk-rename`, typed line and output verbatim | (n/a) |
| safety.forceLine | copy.force-line | (n/a) |
| privacy | (n/a) | copy.privacy-intro-cf, copy.privacy-facts-cf (3 facts; claim.cf-offline, claim.cf-no-ads) |
| metrics.releaseLine | copy.release-box | copy.release-cf |
| metrics.tiles | copy.tiles-box: Tools 23, Tests 507, Binary 1 with context lines and source URLs (claim.box-tools, -tests, -binary) | copy.tiles-cf: Permissions 0, Result split 50/50; no Network calls tile (claim.cf-network-calls soften, N3) |
| demo.intro | copy.demo-intro-box | (none; clip in 11-16) |
| demo.commands | capture.box-terminal C1.1 to C1.4 in order, notes from copy.terminal-notes | (n/a) |
| stack.groups | copy.stack-box (Language, Crates, Platform) | copy.stack-cf (Language, Platform; Rendering not supplied, left out) |
| nextSteps | omitted (N4: box has no planned row) | `coin-flip-v1-1`, `coin-flip-play-store` (log.rows planned) |
| projectsIntro | copy.projects-intro | |

Not shipped anywhere: claim.box-loc-timeline (cut), claim.cf-reduced-motion and claim.cf-font-scaling (unused), the coin-flip clip block (11-16).

## Task Commits

1. **Task 1 (tracer): box and coin-flip through the case-study route and /projects, CLI_X gone**: `d526b7e` (feat)

**Plan metadata:** see the docs(11-07) commit that adds this file.

## Test counts

- `data/__tests__/projects.test.ts`: 12 old tests rewritten into 23 (15 test calls by the acceptance regex; `test.each` over the three v1 keys, the two risk keys and the five D-30 words).
- `components/projects/__tests__/projects-page.test.tsx`: 4 to 5 (the interim "no repository link" test became the D-12 links test; an intro test was added).
- `e2e/case-study.spec.ts`: 14 to 20 per browser (both titles with meta description, four 404 paths, no-WebGL on both, coin-flip no Demo, two trailhead tests, 375 px on both; the Demo describe runs on /projects/box).
- Full Jest: 73 suites, 1147 tests. `guard:tests`: jest 1147 + e2e 402 = 1549 (baseline 1300), OK.
- Plan e2e set (`case-study`, `no-webgl`, `shell`, `projects`, chromium, production build): 67/67, including the `/projects/clix-website` 404 test.

## Decisions Made

See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `projects-page.test.tsx` fixtures used the v1 shape**
- **Found during:** Task 1
- **Issue:** The 11-06 page test mocks `@/data/projects` with `version`/`tagline` fixtures; the new mapper reads `project.kicker`, so the suite would crash. The file is not in the plan's file list.
- **Fix:** Fixtures in the new shape (one box-like, one coin-flip-like), the mock also exposes `projectsIntro`; the interim "passes no repository link" test was rewritten as the D-12 links test and an intro test was added. No test removed.
- **Files modified:** components/projects/__tests__/projects-page.test.tsx
- **Committed in:** d526b7e

**2. [Rule 1 - Honest test] Dot e2e "no note line" check**
- **Found during:** Task 1 (flagged by the 11-03 SUMMARY)
- **Issue:** Every approved box command has a note, so "a command without a note has no note line" had no subject.
- **Fix:** The dot test now asserts the shown cell's `[data-note]` text equals the last command's approved note and that exactly one note is visible in the region (the height-reservation cells hold theirs invisibly).
- **Committed in:** d526b7e

**3. [Rule 1 - UX] Dangling separator in the coin-flip links row at 375 px**
- **Found during:** Task 1 (screenshot review at 375 and 1440 px)
- **Issue:** At 375 px the note and the walkthrough link wrap onto two lines, leaving the ' · ' at the end of the first line.
- **Fix:** The aria-hidden separator renders from 640 px (`hidden sm:inline`); below that the two stack. The walkthrough link also gets `min-h-11` for a 44 px target.
- **Committed in:** d526b7e

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bug/quality)
**Impact on plan:** All within the swap's scope; no new architecture.

## Issues Encountered

- A bash heredoc with nested quotes failed; the spec rewrite was applied from a Python script in the scratchpad (not committed).
- The production-build e2e runs rewrote `public/service-worker.js`; it was restored with `git restore` each time and never staged.
- `README.md` still lists the deleted components in its project tree; 11-17 records the README tree as a Phase 12 carry-over, so it was left alone. `components/Footer.tsx` (legacy, unused) still links the CLI_X slugs, also a recorded Phase 12 carry-over.

## Known Stubs

| File | Stub | Resolved by |
|------|------|-------------|
| components/projects/CaseStudy.tsx | `problem`, `pipeline`, `safety`/`privacy`, `metrics`, `stack` and `next-steps` cases return null (their data is complete) | 11-11 (problem, pipeline, safety/privacy, metrics, stack), 11-13 (next-steps) |
| components/projects/sections/Demo.tsx | returns null for coin-flip | 11-15 (clip renderer) and 11-16 (clip and description) |

Both are recorded in `.planning/WINDOWS.md`. No placeholder text renders: a slot without a renderer is simply absent.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 11-11 and 11-13 fill the null cases in `renderSlot`; the data for every slot is already in place. `caseStudySections` gives the route index its ids and labels.
- 11-12 passes the route profile as `Trailhead`'s `figure` and extends RoutePanel with the metric strip.
- 11-18 still has: `lib/trail-grade.ts` score bands, dead `HighlightValue`/`RoadmapItem` and the stale `DemoCommand` comment in `data/types.ts`, the Home About sentence, the visual route table (`e2e/visual/routes.spec.ts` still lists the CLI_X slugs), `RoadmapFilters` 'CLI_X Tool' and the SiteChrome test pathname.
- Visual: case-study and /projects screenshots change; the 11-17 re-baseline covers them (only Tim commits PNGs).

## Self-Check: PASSED

- Created files exist: CaseStudy.tsx, Trailhead.tsx, sections/Demo.tsx. Deleted files are absent (acceptance 1).
- Commit `d526b7e` is an ancestor of HEAD; `git rev-list --count dd74d13..HEAD` = 1.
- Acceptance: `z.literal('coin-flip')` 1; removed exports 0; `never` in CaseStudy 4; test calls 15 (>= 12).
- Verification: Jest 1147/1147; lint exit 0 (11 pre-existing warnings, none in touched files); type-check clean; plan e2e 67/67; guard:tests OK.

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-01*
