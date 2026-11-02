---
phase: 12-contact-edge-pages-cleanup-verification
plan: 26
subsystem: ui
tags: [react, forms, validation, a11y, error-summary, live-region, playwright, jest]

requires:
  - phase: 12-01
    provides: "Resolved values: copy.field-errors, copy.summary-title (`Check 1 field` / `Check {n} fields`), default.5 (inline errors with no live role; summary role=alert + focus)"
  - phase: 12-13
    provides: "SummitRegister with validateField, issueMessage, formatCount, the message slot and the interim first-invalid-field focus"
  - phase: 12-03
    provides: "The 400 `validation` answer with an issue-code `fields` map (codes only, never values)"
provides:
  - "Blur-then-live validation in SummitRegister: a touched set gates blur validation, a shown-error set makes a field revalidate on every input"
  - "The focused error summary (role=alert, tabindex=-1) in the message slot for an invalid submit and a server validation 400"
  - "The message helper row with the `{formatCount(n)} / 2,000` counter and the exported `counterStatus(n)` threshold announcement"
  - "A pointer-press hold so a blur error never swallows the click that caused the blur"
affects: [12-19, 12-UAT]

actuals:
  tokens: 6933
  tasks: 2
  commits: 4
plan_head_before: 5c3a14a0a89e42a9b4cafce3f2763066f49e08bd
plan_head_after: 029c931107c00725fb785a7bca231cbde07b9692

tech-stack:
  added: []
  patterns:
    - "Error summary keyed by submit number: every invalid submit mounts a fresh alert and takes focus; later fixes update it with aria-live off"
    - "Blur validation is held while a pointer is pressed inside the form and runs after the click (setTimeout 0 after pointerup)"
    - "Threshold-only sr-only status: a pure function of the count, so its text (and the announcement) changes only at the thresholds"

key-files:
  created: []
  modified:
    - components/contact/SummitRegister.tsx
    - components/contact/__tests__/SummitRegister.test.tsx
    - e2e/contact-form.spec.ts

key-decisions:
  - "The summary closes when no field is left to fix (E4 'zero invalid fields render no summary'); otherwise it stays until the next submit"
  - "Not re-announced: the summary renders role=alert with no aria-live override when a submit opens it; the first later fix sets aria-live=off, so the title and list update silently while focus stays put"
  - "counterStatus over the limit is singular only for exactly one character (`1 character over the limit`, `2 characters over the limit`), the same rule as the summary title"
  - "A field blur during a pointer press inside the form waits until the press is over (Rule 1 fix): the inline error otherwise pushes Send down between mousedown and mouseup and the submit click is lost"
  - "Blur validates a field the visitor typed in, or one that has already shown an error; submit and a server validation answer add every errored field to the live set"

patterns-established:
  - "Contact e2e scopes role=alert to the form (`getByRole('form', { name: 'Sign the register' }).getByRole('alert')`), because Next's route announcer is also role=alert inside a shadow root"

requirements-completed: [CONTACT-02]

coverage:
  - id: D1
    description: "Blur-then-live validation: an untouched field never errors on blur; a typed field errors on blur; a field that has shown an error revalidates on input and clears the moment it is valid; every typed value is kept"
    requirement: CONTACT-02
    verification:
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx#SummitRegister validation timing (CONTACT-02, 12-26) (7 cases)"
        status: pass
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx#shows no error on an untouched field when it loses focus"
        status: pass
    human_judgment: false
  - id: D2
    description: "Message adjacency: 10 and 2,000 characters valid, 9 and 2,001 invalid with the approved too-short and too-long copy including the count"
    requirement: CONTACT-02
    verification:
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx#accepts exactly 10 and 2,000 characters on blur and rejects 9 and 2,001 with the count"
        status: pass
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx#validateField (CONTACT-02, FEEDBACK_LIMITS)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Focused error summary: role=alert, tabindex=-1, 'Check 1 field' / 'Check {n} fields', one link per invalid field in form order with the inline error's message; links focus their field and scroll it clear of the sticky nav; the list updates without moving focus; a server validation 400 shows the same summary"
    requirement: CONTACT-02
    verification:
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx#SummitRegister error summary (CONTACT-02, 12-26) (6 summary cases)"
        status: pass
      - kind: e2e
        ref: "e2e/contact-form.spec.ts#should focus the error summary when Send is clicked straight from an invalid field (chromium, firefox, webkit)"
        status: pass
      - kind: e2e
        ref: "e2e/a11y-contact.spec.ts (field-error state now includes the summary; axe color-contrast, three engines)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Counter: '{formatCount(n)} / 2,000' in ink-muted, caution from 1,800, danger over 2,000; the sr-only status speaks only at 1,800, 1,900, 1,950, 2,000 and over the limit; a message over 2,000 blocks submit"
    requirement: CONTACT-02
    verification:
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx#counts the message as {n} / 2,000, colours it by threshold and announces only at the thresholds"
        status: pass
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx#counterStatus (UI-SPEC \"Counter announcement\") (3 cases)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Visual quality of the helper row, counter and summary at 375, 768 and 1440 (round-2 pixels; the counter now shows on the untouched form)"
    requirement: CONTACT-02
    verification: []
    human_judgment: true
    rationale: "Pixel change is intentional and Tim-gated: contact is on the round-2 re-baseline (12-19), where the new shots are reviewed"
  - id: D6
    description: "Screen-reader experience: the summary is announced once per invalid submit and its later updates stay silent; the counter speaks only at the thresholds"
    requirement: CONTACT-02
    verification: []
    human_judgment: true
    rationale: "Jest and Playwright assert the markup (role, aria-live, aria-atomic, text) but not what NVDA, JAWS or VoiceOver actually speak"

duration: 17min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 26: Summit Register Validation Summary

**The summit register now validates a field when the visitor leaves it after typing, then live once it has shown an error. An invalid submit, or the server's `validation` answer, fills the message slot with one focused `role="alert"` summary (`Check {n} fields`, one link per field in form order). Under Message sits a `{n} / 2,000` counter whose sr-only status speaks only at 1,800, 1,900, 1,950, 2,000 and over the limit. Nothing the visitor typed is ever cleared.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-11-02T22:55:24Z
- **Completed:** 2026-11-02T23:12:28Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 3

## Accomplishments

- **Validation timing (Task 1).** `SummitRegister` keeps a `touched` set (fields the visitor typed in) and a `shown` set (fields that have shown an error). On blur it validates touched or shown fields with the existing `validateField`. On input, a shown field revalidates and its error clears the moment the value is valid; the `(now {n})` count follows the typing. Submit and a server `validation` 400 put every errored field in the live set. The server answer still goes through `issueMessage`, so it carries codes only and no value is echoed (T-12-42). Sign again resets both sets.
- **Error summary (Task 2).** It fills the message slot, the form's first child, which holds one box at a time:
  - Markup: `role="alert" tabIndex={-1} aria-labelledby="register-errors-title"`, a `WarningCircleIcon` title `Check 1 field` / `Check {n} fields` (12-01 copy.summary-title), and one `min-h-11` link per invalid field in Name, Email, Message order, whatever order the fields were blurred in. Each link carries its inline error's exact message.
  - Links: a link prevents the anchor jump, scrolls the field's wrapper (label plus input, which carries the global nav-height `scroll-margin-top`) into view, then focuses the field.
  - Opening and focus: the summary takes focus on every invalid submit and on a server validation answer. This replaces 12-13's interim first-invalid-field focus. Keying the summary by submit number makes each submit mount a fresh alert.
  - Live updates: later fixes update the title and the list with `aria-live="off"` and never move focus. The summary stays until the next submit, or closes once no field is left to fix.
  - Inline errors still have no live role (default.5).
- **Counter (Task 2).** The helper row is `mt-2 flex flex-wrap items-start justify-between gap-4`:
  - Left: `#message-hint` `10 to 2,000 characters`, still in Message's `aria-describedby`.
  - Right: an `aria-hidden` `font-mono tabular-nums` `{formatCount(n)} / 2,000`, coloured `text-ink-muted` below 1,800, `text-caution` from 1,800 to 2,000 and `text-danger` above 2,000.
  - Announcement: one sr-only `role="status" aria-atomic="true"` (`#message-count-status`) holds `counterStatus(n)`. Its text changes only at the thresholds: `200 characters left`, `100 characters left`, `50 characters left`, `No characters left`, then `{n} characters over the limit`.
  - **Singular form recorded:** exactly one character over reads `1 character over the limit`. Two read `2 characters over the limit`, and `{n}` comes from formatCount (`1,234 characters over the limit`). This is the same rule as `Check 1 field` / `Check {n} fields`.
  - A message over 2,000 characters fails validation and blocks submit.

## Task Commits

1. **Task 1 RED: failing tests for blur-then-live validation:** `00f5341` (test)
2. **Task 1 GREEN: blur-then-live validation (CONTACT-02):** `f4e0760` (feat)
3. **Task 2 RED: failing tests for the error summary and the counter:** `2947794` (test)
4. **Task 2 GREEN: the focused error summary and the character counter, plus the press-hold fix:** `029c931` (feat)

There was no REFACTOR commit.

## TDD Gate

- **Task 1 RED (`00f5341`):** `npx jest components/contact/__tests__/SummitRegister.test.tsx` gave 6 failed and 41 passed. Each new case failed on its planned assertion: `toHaveAttribute('aria-invalid', 'true')` received no attribute (there was no blur validation), `toHaveAccessibleDescription('Error: …')` received only the hint, and the server case's `not.toHaveAttribute('aria-invalid')` received `true` (no live clear). There were no load, syntax or fixture faults. Semantic assessment: valid RED.
- **Task 1 GREEN (`f4e0760`):** 47 of 47 passed.
- **Task 2 RED (`2947794`):** 9 failed and 48 passed. As in 12-13, a temporary uncommitted stub `counterStatus` returning `''` meant the counter cases failed on assertions, not on a missing export. The stub was removed before the commit.
  - The summary cases failed on `Unable to find an accessible element with the role "alert"`, and the counter case on the missing `{n} / 2,000` text.
  - `counterStatus` received `''` where a phrase was expected.
  - `stays silent below 1,800 characters` passed against the stub, which is expected because the stub returns the right answer for that range; it stays as a regression guard.
  - Semantic assessment: valid RED.
- **Task 2 GREEN (`029c931`):** 58 of 58 passed in the SummitRegister suite and 74 of 74 in `components/contact`.
- Jest's default reporter is not a format the RED classifier supports, and `workflow.tdd_mode` is off, so no classifier record was produced (the 12-13 precedent).

## Test counts

- `components/contact/__tests__/SummitRegister.test.tsx`: **17 → 34** `it`/`test` lines by the acceptance grep (Task 1 needed at least 21 and reached 23; Task 2 needed at least 26). That is **41 → 58** Jest tests.
- All 18 titles from 12-13 are still present (checked by name: the 17 `it` lines plus the rate-limit `it.each`).
- `grep -c 'role="alert"' components/contact/SummitRegister.tsx`: **1 → 3** (the failure box, the summary, and the component doc comment).
- `e2e/contact-form.spec.ts`: one new test, so 19 per engine. `e2e/a11y-contact.spec.ts`: unchanged.

### 12-13 tests adjusted (none removed)

- **`maps a server validation answer onto the inline errors`:** it asserted `queryByRole('alert')` was absent. The plan now requires a one-item summary for a server validation 400, so the case asserts that the only alert is the summary (`Check 1 field`, no `Couldn't` failure copy). The inline-error and kept-values assertions are unchanged.
- No other 12-13 case needed a change. None of them asserted the interim first-invalid-field focus.

## Files Created/Modified

- `components/contact/SummitRegister.tsx`: touched and shown sets, `onFieldChange` / `onFieldBlur` / `showError` / `showErrors`, the summary block and `jumpTo`, the helper row, `counterStatus` (exported), `counterTone`, and the pointer-press hold.
- `components/contact/__tests__/SummitRegister.test.tsx`: three new describes (validation timing 7, error summary 7, counterStatus 3) and the one adjusted 12-13 case.
- `e2e/contact-form.spec.ts`: `should focus the error summary when Send is clicked straight from an invalid field`.

## Decisions Made

See `key-decisions` in the frontmatter. The ones later plans should know:
- **The summary closes at zero.** "Stays until the next submit" and "zero invalid fields render no summary" meet when the visitor fixes every field. The summary then closes, rather than showing `Check 0 fields`.
- **Silent updates.** The first fix after a submit sets `aria-live="off"` on the summary, so its live title and list changes are not re-announced. The next submit mounts a fresh alert (keyed by submit) with the implicit assertive politeness.
- **`flex-wrap` on the helper row.** UI-SPEC lists `flex items-start justify-between gap-4`. I added `flex-wrap` so the row wraps with gap-4 when it does not fit, as truth E7 requires. At 375 px it fits on one line (283 px row, 20 px tall).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A blur error swallowed the Send click that caused the blur**
- **Found during:** Task 2, the live-DOM probe at 375 px against the production build.
- **Issue:** with Message focused and invalid, a click on Send blurred Message on `mousedown`. Task 1's blur validation then inserted the inline error above the helper row, which moved Send about 28 px down before `mouseup`. The `mouseup` landed off the button, no `click` fired, and the form never submitted, so no summary appeared. A real visitor who types a short message and clicks Send would lose that click (the checkbox below has the same risk). The existing 12-13 e2e `should show validation error for short message` passed anyway, because the blur alone shows the inline error it asserts.
- **Fix:** the form's `onPointerDownCapture` marks a press. A field blur during the press is held with its value. A window `pointerup`/`pointercancel` listener runs the held blur in `setTimeout(0)`, after the click, through a ref refreshed after every render. A Send click has validated every field by then, so the held blur is a no-op. Blurs not caused by a press inside the form (Tab, a click elsewhere) validate at once, as before.
- **Files modified:** components/contact/SummitRegister.tsx, components/contact/__tests__/SummitRegister.test.tsx (`holds a blur error until a press inside the form is over…`), e2e/contact-form.spec.ts (the new summary test, which drives the real click).
- **Verification:** the probe then showed the focused summary. The three-engine contact run passed 55 of 55, on both the per-task reuse build and the fresh plan-level build.
- **Committed in:** `029c931` (part of the Task 2 commit)

**2. [Rule 2 - Missing coverage] An e2e check for the summary**
- **Found during:** Task 2.
- **Issue:** no contact e2e asserted the summary, which is how deviation 1 went unseen.
- **Fix:** the new contact-form test, with `role="alert"` scoped to the form. Next's route announcer is also `role="alert"`, inside a shadow root that `getByRole` pierces.
- **Committed in:** `029c931`

**3. [Plan note] One extra assertion in GREEN**
- The `updates the list as fields are fixed…` case gained `aria-live` assertions in the GREEN commit (no override at submit, then `off` after the first fix). They pin the "not re-announced" decision made while implementing.

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing coverage) plus 1 note.
**Impact on plan:** the bug fix was needed so Send works after a blur error. `e2e/contact-form.spec.ts` was not in `files_modified`; the change adds one test and removes none.

## Issues Encountered

- My first probe waited on `getByRole('alert')` and matched Next's route announcer instead of the summary. Scoping the alert to the form fixed it, and the same scoping went into the e2e test.
- The background `npm run start` processes report "failed" in their task notifications only because I stopped them with `taskkill`.
- `public/service-worker.js` was restored after each server stopped. It was never staged and is clean now.
- Not changed, noted for later: a `validation` 400 with no `fields` map (for example an over-long `trail_note`) still shows nothing. This 12-13 behaviour is unreachable through the visible form, which validates every visible field first.

## Visual state (report as asked)

The default contact state **does change** compared with 12-16. The helper row's counter `0 / 2,000` is now visible on the untouched form, right of `10 to 2,000 characters`, on one line. Errors and the summary appear only after interaction, so they are not in the default shots. These are expected diffs for round 2 (12-19). Nothing was re-baselined and no PNG was touched:
- `e2e/visual/routes.spec.ts-snapshots/contact/375-reduced-visual-dark-linux.png`
- `e2e/visual/routes.spec.ts-snapshots/contact/768-reduced-visual-dark-linux.png`
- `e2e/visual/routes.spec.ts-snapshots/contact/1440-reduced-visual-dark-linux.png`

## Verification

- `npm run lint`: exit 0. The 7 warnings are pre-existing ones in `lib/useProgressiveTextures.ts` and others outside this plan. `npm run type-check`: exit 0, with no `error TS` lines.
- `npx jest --silent`: 101 suites, 1,638 tests passing.
- Per task, `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/contact-form.spec.ts e2e/a11y-contact.spec.ts --project=chromium`: 18 passed. After the fix, the same specs on chromium, firefox and webkit gave 55 passed.
- Plan level (fresh build), `PW_PROD=1 npx playwright test e2e/contact-form.spec.ts e2e/a11y-contact.spec.ts --project=chromium --project=firefox --project=webkit`: **55 passed, 0 failed, 0 flaky**. `git status --porcelain public/service-worker.js` is empty.
- Live-DOM probe at 375 px (production build, chromium):
  - Helper row: 283 px wide, 20 px tall, so hint and counter share one line.
  - At 2,002 characters: `text-danger`, status `2 characters over the limit`.
  - Summary: focused, wrapped link 48 px tall and inside the box, document scrollWidth 365.
  - After a link activation: Message is focused and its label top (80 px) clears the sticky nav (bottom 64 px).
- No `.only(`, `.skip(` or `.fixme(` in the touched test files. Port 3000 is free, and every server started here has been stopped.

## Threat Flags

None. No new endpoint or trust boundary. The messages are fixed approved strings with counts from formatCount, and the server answer is mapped by issue code (T-12-42).

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- CONTACT-02 is fully covered: inline errors with timing, the focused summary and kept input.
- 12-19 (round 2) should expect the contact counter in the default shots at 375, 768 and 1440.
- UAT can check the screen-reader announcements (D6) by ear.

## Self-Check: PASSED

- The modified files exist: components/contact/SummitRegister.tsx, components/contact/__tests__/SummitRegister.test.tsx, e2e/contact-form.spec.ts.
- Commits `00f5341`, `f4e0760`, `2947794` and `029c931` are ancestors of HEAD (4 commits since `5c3a14a`).

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*
