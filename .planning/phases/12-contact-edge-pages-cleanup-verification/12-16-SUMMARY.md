---
phase: 12-contact-edge-pages-cleanup-verification
plan: 16
subsystem: ui
tags: [nextjs, react, server-components, clipboard-api, a11y, playwright, jest]

requires:
  - phase: 12-13
    provides: "SummitRegister island, the /contact grid that reserves the panel column, formatLatLon decimals option"
  - phase: 12-25
    provides: "site.location (Zürich, 47.37 / 8.54, 2-decimal data test)"
  - phase: 12-01
    provides: "Resolved values: copy.panel-h2 'Direct contact', geo.location, default.2 (form then panel, order-first below 1024), default.3 (quiet select fallback)"
provides:
  - "DirectContactPanel (server): section aria-labelledby with a dl of Email, Location, Replies, Elsewhere"
  - "CopyEmailButton (client) with COPIED_MS = 2000 and a persistent polite status"
  - "/contact renders the panel after the form, order-first below 1024 px"
  - "components/AnimatedGradientMesh.tsx deleted; no reference left in app, components, lib or e2e"
affects: [12-18, 12-19, 12-22, 12-26]

actuals:
  tokens: 9200
  tasks: 2
  commits: 4
plan_head_before: ccb1b5b275b2ef183e10ee9e8a7f74fc2409e029
plan_head_after: 0c5544c133a7464d21b842488f963e9d164932fc

tech-stack:
  added: []
  patterns:
    - "Server panel passes plain props (email, targetId) to a small client island; the island is server-rendered with its final label, so no layout shift"
    - "Clipboard copy: empty the status when a press starts, then set 'Copied' when writeText resolves, so each successful press is a fresh live-region change"
    - "Jest timer counts flush React's zero-delay scheduler timer first (advanceTimersByTime(0)) so getTimerCount() counts only the component's timer"

key-files:
  created:
    - components/contact/DirectContactPanel.tsx
    - components/contact/CopyEmailButton.tsx
    - components/contact/__tests__/DirectContactPanel.test.tsx
    - components/contact/__tests__/CopyEmailButton.test.tsx
  modified:
    - app/(site)/contact/page.tsx
    - e2e/contact-form.spec.ts
    - e2e/visual/hide-canvas.css
    - components/__tests__/SafeCanvas.test.tsx
  deleted:
    - components/AnimatedGradientMesh.tsx

key-decisions:
  - "default.2 and default.3 shipped as their defaults (Tim: 'F: defaults'): DOM order form then panel with order-first below 1024, and a quiet select-the-address fallback when the clipboard is missing or rejects"
  - "The panel sits in a grid-item wrapper div carrying order-first min-w-0 lg:order-none, so DirectContactPanel keeps only its own card classes"
  - "The WebKit e2e run checks Tab order up to Copy only: Playwright's WebKit keeps Safari's default, where Tab never lands on a link (Alt+Tab does not either)"
  - "The Copy button keeps the accessible name 'Copy email address' in both states; the 'Copied' state reaches screen readers through the polite status"

patterns-established:
  - "Location rows print formatLatLon(location, { decimals: 2 }) + ' · ' + name, and only when the location exists"

requirements-completed: [CONTACT-01, VERIFY-01]

coverage:
  - id: D1
    description: "Direct contact panel: region named Direct contact with a dl of Email, Location, Replies and Elsewhere; Location left out when site.location is absent"
    requirement: CONTACT-01
    verification:
      - kind: unit
        ref: "components/contact/__tests__/DirectContactPanel.test.tsx (9 tests)"
        status: pass
      - kind: e2e
        ref: "e2e/contact-form.spec.ts#Direct contact panel › should list email, location, replies and profiles with a mailto link (chromium, firefox, webkit)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The address as selectable mono text with a <wbr> after '@', a mailto link and a 2-decimal location line ('47.37 N · 8.54 E · Zürich')"
    requirement: CONTACT-01
    verification:
      - kind: unit
        ref: "components/contact/__tests__/DirectContactPanel.test.tsx#shows the address as one selectable string with a break chance after @ / reads the location at 2 decimals / never shows more than 2 decimals"
        status: pass
    human_judgment: false
  - id: D3
    description: "Copy writes exactly site.email, shows Copied for 2,000 ms with a polite status, restarts per press, falls back to selecting the address, leaves no timer after unmount"
    requirement: CONTACT-01
    verification:
      - kind: unit
        ref: "components/contact/__tests__/CopyEmailButton.test.tsx (7 tests)"
        status: pass
      - kind: e2e
        ref: "e2e/contact-form.spec.ts#should copy exactly the address and announce Copied @chromium-only"
        status: pass
    human_judgment: false
  - id: D4
    description: "Layout: panel above the form at 375 px without sideways scroll, right of the form at 1440 px; Tab order Name, Email, Message, checkbox, Send Message, Copy, Write an email"
    requirement: CONTACT-01
    verification:
      - kind: e2e
        ref: "e2e/contact-form.spec.ts#should show the panel above the form at 375 px / should place the panel right of the form at 1440 px / should tab from the register into the panel at 1440 px"
        status: pass
    human_judgment: false
  - id: D5
    description: "Panel visual quality at 375, 768 and 1440 (spacing, the mono address, icon alignment) against the UI-SPEC; contact baselines change in round 2"
    requirement: CONTACT-01
    verification: []
    human_judgment: true
    rationale: "Pixel baselines are re-captured in the Tim-gated round 2 (12-19); visual sign-off is his"
  - id: D6
    description: "AnimatedGradientMesh deleted; no reference in app, components, lib or e2e; SafeCanvas fixture uses 'Scene fallback'"
    requirement: VERIFY-01
    verification:
      - kind: other
        ref: "git ls-files components/AnimatedGradientMesh.tsx (empty); git grep -l AnimatedGradientMesh -- app components lib e2e (empty); git grep -c 'Get in Touch' -- components app e2e (empty)"
        status: pass
      - kind: unit
        ref: "components/__tests__/SafeCanvas.test.tsx (7 tests)"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 16: Direct contact panel and gradient-mesh removal Summary

**Server-rendered Direct contact panel on /contact: the address as selectable mono text with Copy (Clipboard API, 2 s "Copied" plus a polite status, quiet select fallback) and a mailto link, Zürich at 2 decimals, the reply time and the GitHub/LinkedIn links. The v1 gradient-mesh component is deleted.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-11-02T22:37:12Z
- **Completed:** 2026-11-02T22:50:12Z
- **Tasks:** 2
- **Files modified:** 9 (4 created, 4 modified, 1 deleted)

## Accomplishments

- `DirectContactPanel` (Server Component): `<section aria-labelledby="direct-contact-title">` card with h2 `Direct contact` (12-01 copy.panel-h2) and a `<dl>` of Email (`{user}@<wbr />{domain}` in `#contact-email`, Copy, `Write an email`), Location (`formatLatLon(location, { decimals: 2 }) · name`, only when set), Replies (`Usually within a few days`) and Elsewhere (GitHub, LinkedIn, 20 px marks, same tab). All classes follow 12-UI-SPEC lines 154-172.
- `CopyEmailButton` (client island, the only `'use client'` file in this plan): the 07 secondary button at `px-4`, CopyIcon/CheckIcon 20, `aria-label="Copy email address"`. It writes exactly `email`, and a press inside the window restarts it. With no clipboard, or when the write rejects, it selects the address quietly through a Range. Unmounting clears the timer, and a write that resolves after unmount starts none.
- `/contact`: the panel follows the form card in the DOM inside an `order-first min-w-0 lg:order-none` grid item (12-01 default.2).
- contact-form e2e: 5 new tests (dl terms and links, real Chromium copy, 375 above, 1440 right, Tab order).
- `components/AnimatedGradientMesh.tsx` removed. The hide-canvas.css header now describes only the Home terrain canvas, and the SafeCanvas fixture heading reads `Scene fallback`.

## Task Commits

1. **Task 1 RED:** `cd7b28d` (test): failing DirectContactPanel and CopyEmailButton suites with export-only skeletons
2. **Task 1 GREEN:** `fa8ddf7` (feat): Direct contact panel with Copy, coordinates and links
3. **Task 2:** `b9d383e` (refactor): delete the contact gradient mesh
4. **Plan-level fix:** `0c5544c` (fix): check the mailto Tab step outside WebKit only

## TDD

- **RED (`cd7b28d`):** `npx jest components/contact/__tests__/CopyEmailButton.test.tsx components/contact/__tests__/DirectContactPanel.test.tsx` exited 1 with 15 failed and 1 passed. The RED commit carried export-only skeletons (both components render `null`; `COPIED_MS = 2000` is the interface constant) so the suites load; without them the run fails on module resolution (INVALID_RED). Each target failed on its assertion, mostly `Unable to find an accessible element with the role "region" / "term" / "button" and name "Copy email address"`, plus `#contact-email` `Received: null` and the missing location text. The one pass is the negative guard "names nothing Name or Message", which an empty render satisfies trivially. Raw Jest JSON: `C:/Users/tim/AppData/Local/Temp/claude/C--Users-tim-MyDocuments-Programming-portfolio-app/db4d785f-fc8b-44f3-9be7-c9aef8d6fcda/scratchpad/red-12-16-t1.json`.
- **Semantic assessment:** valid RED. Every target ran and failed because the behaviour was missing. `gsd check tdd-red-evidence` was not run because Jest output is not a supported format and no TAP or JUnit reporter is installed. This plan is `type: execute` with `workflow.tdd_mode` off, so the gate is advisory.
- **GREEN (`fa8ddf7`):** 16/16 in the two suites. Two test-side corrections went in before this commit (see Deviations 1 and 2).
- **REFACTOR:** none needed.

## Files Created/Modified

- `components/contact/DirectContactPanel.tsx`: the server panel
- `components/contact/CopyEmailButton.tsx`: the Copy island, `COPIED_MS`
- `components/contact/__tests__/DirectContactPanel.test.tsx`: 9 tests
- `components/contact/__tests__/CopyEmailButton.test.tsx`: 7 tests
- `app/(site)/contact/page.tsx`: renders the panel after the form card; JSDoc updated
- `e2e/contact-form.spec.ts`: `Direct contact panel` describe (5 tests)
- `e2e/visual/hide-canvas.css`: header comment only (no pixel effect)
- `components/__tests__/SafeCanvas.test.tsx`: fixture heading `Scene fallback` in both places
- `components/AnimatedGradientMesh.tsx`: deleted (intentional; the only deletion in these commits)

## Decisions Made

- default.2 and default.3 took their defaults per Tim's "F: defaults" (12-01 Resolved values). No checkpoint was needed, and nothing is pending with Tim for this plan.
- The grid-order classes sit on a wrapper div, not on the panel's section, so the panel component stays layout-agnostic.
- The Copy button's accessible name stays `Copy email address` in both states, as the plan specifies. Screen readers hear the success through the status region.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Location test compared whitespace-normalised text**
- **Found during:** Task 1 GREEN
- **Issue:** `getByText('47.37\u00a0N · …')` never matched. Testing Library normalises the node text (U+00A0 becomes a space) but compares the string matcher unnormalised, so the correct render failed.
- **Fix:** the test reads the Location `dd`'s exact `textContent` and compares it with `'47.37\u00a0N · 8.54\u00a0E · Zürich'`, so the NBSP formatLatLon emits is still asserted.
- **Files modified:** components/contact/__tests__/DirectContactPanel.test.tsx
- **Committed in:** fa8ddf7

**2. [Rule 1 - Bug] Timer-count assertions counted React's scheduler timer**
- **Found during:** Task 1 GREEN
- **Issue:** after a press, `jest.getTimerCount()` read 2: the component's timer plus a zero-delay timer React's scheduler queues for the re-render. After unmount it read 1.
- **Fix:** the `press()` helper and the unmount tests run `advanceTimersByTime(0)` before counting, so the count is the component's own timer. The intent is unchanged: 1 after a restart, 0 after unmount.
- **Files modified:** components/contact/__tests__/CopyEmailButton.test.tsx
- **Committed in:** fa8ddf7

**3. [Rule 1 - Bug] WebKit Tab never reaches links**
- **Found during:** plan-level three-engine verification
- **Issue:** the Tab-order test failed in WebKit at the `Write an email` step. A probe showed that Playwright's WebKit skips links on Tab (Safari's default), and Alt+Tab, Meta+Tab and Control+Tab do not reach them either.
- **Fix:** WebKit checks the order up to Copy. Chromium and Firefox check the full order, including the mailto link.
- **Files modified:** e2e/contact-form.spec.ts
- **Committed in:** 0c5544c

---

**Total deviations:** 3 auto-fixed (3 Rule 1, all test-side). **Impact:** none on shipped behaviour; no scope creep.

## Issues Encountered

- Lint reports 7 warnings in `lib/useProgressiveTextures.ts`, which predate this plan. The 2 warnings from the deleted mesh are gone.
- Left alone on purpose: `README.md:187` still lists `AnimatedGradientMesh.tsx` in the tree (docs pass, 12-22), and `eslint.config.mjs:10` still lists it (12-18, inert for a missing file).

## Round 2 expected visual diffs

The contact pixels change on purpose, after 12-13: the Direct contact panel now fills the right column at 1440 and sits above the form at 375 and 768. Expected to change (no re-baseline, no PNG touched here):

- `e2e/visual/routes.spec.ts-snapshots/contact/375-reduced-visual-dark-linux.png`
- `e2e/visual/routes.spec.ts-snapshots/contact/768-reduced-visual-dark-linux.png`
- `e2e/visual/routes.spec.ts-snapshots/contact/1440-reduced-visual-dark-linux.png`

(visual-light compares against the same dark PNGs.) The hide-canvas.css edit is comment-only and moves no pixel on any route.

## Verification

- `npx jest components/contact --silent`: 3 suites, 57 tests passed
- `npx jest --silent` (full): 101 suites, 1,621 tests passed
- `npm run lint`: exit 0, 0 errors, no guard violation; `npm run type-check`: exit 0
- Per-task `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/contact-form.spec.ts --project=chromium`: 15 passed
- Plan-level `PW_PROD=1 npx playwright test e2e/contact-form.spec.ts e2e/a11y-contact.spec.ts e2e/no-webgl.spec.ts --project=chromium --project=firefox --project=webkit` (fresh build): 64 passed, 0 failed, 0 flaky
- Acceptance: `grep -c "<DirectContactPanel" "app/(site)/contact/page.tsx"` = 1; CopyEmailButton test count = 7 (at least 4); `git ls-files components/AnimatedGradientMesh.tsx` empty; `git grep -l AnimatedGradientMesh -- app components lib e2e` empty; `git grep -c "Get in Touch" -- components app e2e` empty
- Visual check: local screenshots at 375 and 1440 (dark) match the UI-SPEC wireframe; the address fits on one line at 375 and nothing scrolls sideways
- Port 3000 was free at return. `public/service-worker.js` was restored after each build.

## Known Stubs

None. The RED skeletons were replaced in the GREEN commit.

## User Setup Required

None.

## Next Phase Readiness

- CONTACT-01 is complete for the panel. 12-26 still owns the error-summary focus change inside SummitRegister, which this plan did not touch.
- Round 2 (12-19) needs the three contact baselines above re-captured, gated on Tim.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*

## Self-Check: PASSED

- FOUND: the 4 created files on disk; components/AnimatedGradientMesh.tsx absent
- FOUND: commits cd7b28d, fa8ddf7, b9d383e, 0c5544c on this branch
