---
phase: 11-engineering-roadmap
plan: 14
subsystem: ui
tags: [nextjs, react, intersection-observer, scroll-spy, playwright, axe, inline-code]

requires:
  - phase: 11-engineering-roadmap
    provides: "caseStudySections/CaseStudy (11-11, 11-13), Trailhead with RouteProfile (11-12), TrailSigns plate (09), RouteRow code spans (11-08), approved copy (11-02)"
provides:
  - "RouteIndex client island: 'Route stages' nav, sticky list from 1024 px, closed <details> below, scroll-spy with aria-current=location"
  - "EndBlock (Server): '{other}, next route' trail sign and the one primary fill 'Ask for a walkthrough' -> /contact (default.6)"
  - "Case-study body grid lg:grid-cols-[12rem_minmax(0,1fr)] with the index fed by caseStudySections"
  - "e2e/case-study-page.spec.ts: 9 page-level tests per project (18)"
  - "lib/inline-code.ts + components/InlineCode.tsx: the site's one backtick-to-<code> renderer (route log and case-study prose)"
affects: [11-16, 11-17, phase-12]

actuals:
  tokens: 14900
  tasks: 3
  commits: 7
plan_head_before: 56b52bfc44892fc86c99e1ab6ed04995cd9da766
plan_head_after: 79ed27ae6662230feabf17ab93a550fa46ff7425

tech-stack:
  added: []
  patterns:
    - "Scroll-spy: one IntersectionObserver (rootMargin '-80px 0px -60% 0px'); current = first section in the band, else the last above it; a passive scroll handler marks the last section only at the page end; state set only in callbacks"
    - "Inline code: copy stores backticks; splitInlineCode tokenizes, InlineCode renders <code class='font-mono whitespace-nowrap'>; plainText gives the read text for tests"

key-files:
  created:
    - components/projects/RouteIndex.tsx
    - components/projects/EndBlock.tsx
    - components/projects/__tests__/RouteIndex.test.tsx
    - components/projects/__tests__/EndBlock.test.tsx
    - e2e/case-study-page.spec.ts
    - lib/inline-code.ts
    - lib/__tests__/inline-code.test.ts
    - components/InlineCode.tsx
  modified:
    - app/(site)/projects/[slug]/page.tsx
    - components/roadmap/RouteRow.tsx
    - components/projects/sections/Problem.tsx
    - components/projects/sections/Pipeline.tsx
    - components/projects/sections/Safety.tsx
    - data/projects.ts
    - data/__tests__/projects.test.ts
    - components/projects/__tests__/sections.test.tsx
    - e2e/case-study.spec.ts

key-decisions:
  - "§I #6 default applied (Tim, 11-02 default.6 'All defaults (Recommended)'): the case-study primary CTA is 'Ask for a walkthrough' -> /contact, the page's one accent fill"
  - "Scroll-spy current section = the first section in the band below the nav, else the last one above it, and the last section at the page end; the plan's 'last section whose top passed the 40 % line' marked the next section after an anchor jump to a short one"
  - "Inline code (orchestrator-added, Tim's 'yes'): box's approved prose carries the 11-02 backticks again; one InlineCode renderer (RouteRow's font-mono whitespace-nowrap style) for the route log and the case-study prose; the --force line's code changes from text-sm text-ink to the route-log style"
  - "Tim resolved 11-13's Next steps link question with 'A': keep the plain <a> in RouteRow's compact variant (no code change)"

patterns-established:
  - "Copy with code tokens: write backticks in data, render through components/InlineCode, compare tests against plainText(data)"
  - "Page grid with a client index: CaseStudy wrapped in one grid cell (it returns a fragment), index gets only {id,label}"

requirements-completed: [ENG-02]

coverage:
  - id: D1
    description: "Route index beside the sections: sticky nav from 1024 px with aria-current scroll-spy, closed disclosure below, numbers from rendered order, absent below two sections"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "components/projects/__tests__/RouteIndex.test.tsx (11 tests)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study-page.spec.ts#the route index lists the rendered sections / hash section current / closed Route stages disclosure (chromium + firefox, both projects)"
        status: pass
    human_judgment: false
  - id: D2
    description: "End block: '{other}, next route' trail sign and 'Ask for a walkthrough' -> /contact"
    requirement: ENG-02
    verification:
      - kind: unit
        ref: "components/projects/__tests__/EndBlock.test.tsx (4 tests)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study-page.spec.ts#the end block signs the next route and asks for a walkthrough"
        status: pass
    human_judgment: false
  - id: D3
    description: "Page-level guardrails: one Primary + one Route stages nav, no filler in main, axe wcag2a/wcag2aa clean, no sideways scroll at 375, trailhead figure 1440 only"
    requirement: ENG-02
    verification:
      - kind: e2e
        ref: "e2e/case-study-page.spec.ts (18 tests, chromium + firefox, production build)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Inline code in approved box prose: listed tokens render as <code>, no backticks in the DOM, text equals the approved sentence"
    verification:
      - kind: unit
        ref: "lib/__tests__/inline-code.test.ts; components/projects/__tests__/sections.test.tsx#Inline code in the approved box prose; data/__tests__/projects.test.ts#Inline code in approved copy"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#box Safety shows the real preview output (D-25)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Visual quality of the index, end block and inline code at 375 and 1440 px"
    verification: []
    human_judgment: true
    rationale: "Layout and spacing judgment belongs to Tim's 11-17 visual review; screenshots are in the session scratchpad 11-14/shots"

duration: 16min
completed: 2026-11-01
status: complete
---

# Phase 11 Plan 14: Route Index, End Block and Page E2E Summary

**Case studies now have a sticky, scroll-spying 'Route stages' index (a closed disclosure below 1024 px), an end block with the Next route trail sign and the one 'Ask for a walkthrough' CTA, an 18-test page e2e (axe, landmarks, filler, 375 px), and box's approved prose renders its code tokens through one shared InlineCode renderer.**

## Performance

- **Duration:** 16 min (clock)
- **Started:** 2026-11-01T22:37:41Z
- **Completed:** 2026-11-01T22:53:12Z
- **Tasks:** 2 plan tasks + 1 orchestrator-added task
- **Files modified:** 17

## Accomplishments

- `RouteIndex` client island: receives only `{ id, label }[]` from `caseStudySections` (T-11-31), renders nothing below two sections (G6), one observer disconnected on unmount (T-11-32); `/projects/box#pipeline` lands with Pipeline current, scrolling to the end marks the last section.
- `EndBlock` Server Component: TrailSigns plate and `bg-trail` tip, explicit aria-label `'{other}, next route'`, primary `Ask for a walkthrough` -> `/contact` (§I #6 default).
- Page body grid `lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-x-12`; page stays a Server Component.
- `e2e/case-study-page.spec.ts`: 9 tests per project, 18 total, green in chromium and firefox against the production build.
- Inline code: `lib/inline-code.ts` (pure tokenizer, `plainText`), `components/InlineCode.tsx`; RouteRow, Problem, Pipeline and Safety use it; Safety's split-on-`--force` ForceLine is gone.

## Task Commits

1. **Task 1 RED: failing tests for the route index and end block** - `2d138d0` (test)
2. **Task 1 GREEN: route index with scroll-spy and the end block** - `5fdeb70` (feat)
3. **Task 1 REFACTOR: JSDoc wording for the acceptance grep** - `1e8e189` (refactor)
4. **Task 1 fix found by Task 2: scroll-spy rule and page end** - `705eccc` (fix)
5. **Task 2: case-study page e2e** - `65457fb` (test)
6. **Orchestrator-added RED: inline-code tests** - `aee1a78` (test)
7. **Orchestrator-added GREEN: inline code in the approved prose** - `79ed27a` (feat)

## TDD Gate Compliance

- Task 1: RED `2d138d0` precedes GREEN `5fdeb70`. RED run: 11 of 12 failed on their planned assertions (missing 'Route stages' nav / links); the 12th, "renders nothing below two sections", passed against the null stub as expected. Suites loaded (null stubs committed with the tests). Semantic assessment: valid RED, every target failed for the intended reason.
- Inline code: RED `aee1a78` precedes GREEN `79ed27a`. RED run: 11 targets failed on assertions (tokenizer output, approved-copy equality, missing `<code>` elements); 0 load failures. Semantic assessment: valid RED.
- The `gsd check tdd-red-evidence` classifier has no Jest adapter (TAP, JUnit, swift, unittest, go only), so the evidence is the Jest `--json` report kept in the session scratchpad (`11-14/red1.json`, `11-14/red2.json`), not machine-classified.

## Orchestrator-added task: inline code in approved case-study prose

Tim's reply, verbatim, to the orchestrator's question "Still open: should the box Problem paragraph render `--clip` and `ConvertFrom-Json` as code? The default is plain text.":

```
yes
```

Scope as the orchestrator stated it back to Tim: every approved case-study string whose 11-02 packet draft wrapped a token in backticks: the box Problem paragraph (`ConvertFrom-Json`, `--clip`), the box Safety intro (`--force`), the box Pipeline Output stage (`--json`, `--clip`) and the `--force` line (`--force`, `hut.txt`, `hut.md`, `zmutt.txt`, `zmutt.md`, `copies`). Wording unchanged.

Done: `data/projects.ts` now holds those four strings byte-identical to the 11-02 "Resolved values" drafts (data test with the literal packet strings). A second data test keeps backticks paired and out of every other prose field (captures excluded). Each listed token renders as `<code class="font-mono whitespace-nowrap">`, no backtick reaches the DOM, and each paragraph's text equals the approved sentence (`plainText`). No `dangerouslySetInnerHTML` (T-11-26). Terminal notes and stage names were left alone, as instructed.

## Decisions Made

- §I #6: default, 'Ask for a walkthrough' -> /contact.
- Scroll-spy rule changed (see Deviations).
- Inline code uses RouteRow's existing class pair, so the `--force` line's code is now inherited size and colour (was `text-sm text-ink`). Tim sees this in 11-17.
- Recorded for STATE: Tim answered 11-13's Next steps link question with "A" (keep the plain `<a>`); no code change.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CaseStudy returns a fragment, so it needs its own grid cell**
- **Found during:** Task 1
- **Issue:** The planned `<div grid><RouteIndex/><CaseStudy/></div>` would put each section in its own grid cell, spread across both columns.
- **Fix:** CaseStudy sits in `<div className="mt-8 first:mt-0 lg:mt-0">` (spacing under the narrow disclosure; none when the index is absent).
- **Files modified:** app/(site)/projects/[slug]/page.tsx
- **Committed in:** 5fdeb70

**2. [Rule 1 - Bug] Scroll-spy marked the wrong section after a jump, and never reached a short last section**
- **Found during:** Task 2 (production-build e2e)
- **Issue:** (a) The planned rule, "last section whose top passed the 40 % line", marked Safety after a jump to `#pipeline`, because box's Pipeline is shorter than the band. (b) The IntersectionObserver does not report a section that jumps from below the band to above it, so coin-flip's Next steps was never marked current at the page end.
- **Fix:** The current section is the first one in the band, else the last one above it. A passive scroll handler marks the last section when the page is scrolled to its end, and sets state only when that flips. Hash on load and hashchange are unchanged. Unit tests were rewritten for the new rule and 3 were added (gap, all below, page end).
- **Files modified:** components/projects/RouteIndex.tsx, its test
- **Committed in:** 705eccc

**3. [Rule 1 - Bug] Existing coin-flip trailhead e2e hit two 'Ask for a walkthrough' links**
- **Found during:** Task 2
- **Issue:** `e2e/case-study.spec.ts` looked for the walkthrough link anywhere in the article. Its strict locator now matched both the trailhead link and the end-block CTA, which share the same words and the same /contact by design (UI-SPEC line 562).
- **Fix:** Scoped the locator to the trailhead `header`. The new page e2e checks every walkthrough link goes to /contact.
- **Committed in:** 705eccc

**4. [Rule 3 - Blocking] Acceptance grep counted the JSDoc**
- **Issue:** `grep -c 'aria-label="Route stages"'` printed 2 because the JSDoc quoted the attribute.
- **Fix:** Reworded the comment (1e8e189). The grep now prints 1.

---

**Total deviations:** 4 auto-fixed (3 bugs, 1 blocking). **Impact:** all needed for correct behaviour. Scope did not grow beyond the plan and the orchestrator-added task.

## Verification

- Acceptance: Route stages aria-label 1; RouteIndex in eslint.config.mjs 0; page 'use client' 0; `caseStudySections(` in page 1; case-study-page tests listed 18 (at least 9 required); AxeBuilder present.
- `npm run lint` exit 0; `npm run type-check` clean; `npx jest` 82 suites, 1285 tests passed.
- `npx playwright test e2e/case-study-page.spec.ts e2e/case-study.spec.ts e2e/projects.spec.ts e2e/no-webgl.spec.ts e2e/roadmap.spec.ts --project=chromium --project=firefox` against the production build (`npm run build` + `npm run start`): 188 passed. `public/service-worker.js` was restored after each build.
- `npm run guard:tests`: jest 1285 + e2e 450 = 1735 (baseline 1300) OK.
- Screenshots for Tim's 11-17 review are in the session scratchpad, folder `11-14/shots`: box and coin-flip at 375 (full page, index open, end of page) and 1440 (full page, sticky index, end of page), plus box Problem, Pipeline and Safety at both widths.

## Issues Encountered

- Visual note for 11-17: below 1024 px the disclosure sits 88 px under the trailhead rule (container `pt-16` plus the spec's `mt-6`). The GUARD-02 baselines for `box` and `coin-flip` change with this plan, as 11-17 expects.

## User Setup Required

None.

## Next Phase Readiness

- 11-16 (coin-flip clip in Demo) gets a Demo entry in the index for free, because the index follows `caseStudySections`.
- ENG-02 stays Pending in REQUIREMENTS: `requirements.ready-ids` reports it blocked by sibling plans that have not finished.

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-01*

## Self-Check: PASSED
