---
phase: 12-contact-edge-pages-cleanup-verification
plan: 13
subsystem: ui
tags: [nextjs, server-components, react, forms, a11y, honeypot, abortcontroller, playwright, jest]

requires:
  - phase: 12-01
    provides: "Resolved values: copy.contact-*, copy.form-*, copy.checkbox-label, copy.field-errors, copy.fail-*, meta.contact, defaults 2/4/6/13/14"
  - phase: 12-03
    provides: "lib/contact/api-contract.ts (FeedbackResponse codes, FEEDBACK_LIMITS, HONEYPOT_FIELD) and the coded /api/feedback route"
  - phase: 12-09
    provides: "pageMetadata helper and the root metadataBase"
provides:
  - "/contact as a Server Component with pageMetadata (meta.contact), the Summit register header band and the form card"
  - "components/contact/SummitRegister.tsx: the form island with submit-time validation, the trail_note honeypot, Sending, the register entry and the failure box"
  - "Exports validateField, minutesFromRetryAfter, SEND_TIMEOUT_MS from SummitRegister"
  - "lib/home-format.ts: formatLatLon { decimals: 2 | 4 }, formatEntryTime, formatCount"
  - "components/FeedbackForm.tsx deleted; its tests carried over into SummitRegister.test.tsx"
affects: [12-16, 12-19, 12-22, 12-26]

actuals:
  tokens: 19217
  tasks: 2
  commits: 4
plan_head_before: 617cf8f84c14da27f78a416d24cb8f276c7dabca
plan_head_after: ba8749ddf6bef8cc56fff2466a7937d761336dda

tech-stack:
  added: []
  patterns:
    - "Server page renders the card chrome (heading, lead, required note); the client island swaps only form <-> register entry inside it"
    - "Send timeout as Promise.race against a timer that also aborts the request, plus a request id so a late answer is ignored"
    - "aria-disabled (never disabled) plus a synchronous ref guard for the sending state"
    - "Message slot as `empty:hidden` first child, so an empty slot adds no flex gap"
    - "Contact e2e waits for the hydrated Send button (__reactProps) before typing"

key-files:
  created:
    - components/contact/SummitRegister.tsx
    - components/contact/__tests__/SummitRegister.test.tsx
  modified:
    - app/(site)/contact/page.tsx
    - lib/home-format.ts
    - lib/__tests__/home-format.test.ts
    - e2e/contact-form.spec.ts
    - e2e/a11y-contact.spec.ts
    - e2e/no-webgl.spec.ts
  deleted:
    - components/FeedbackForm.tsx
    - components/__tests__/FeedbackForm.test.tsx (moved)

key-decisions:
  - "Task 1 (the tracer) already ships submit-time validateField with the approved copy, because the rewritten e2e and a11y specs need field errors; Task 2's RED targets are the sr-only 'Error: ' prefix, the error-then-hint description, the entry timestamp and the formatters (the carried behaviours pass at RED as regression guards, the 12-09 precedent)"
  - "The rate-limit minutes read the Retry-After header and fall back to the body's retryAfterS (the same server value); with neither the copy reads 'Try again later'"
  - "Client lengths count the message as typed, the way the route's zod schema does; name and email are sent trimmed; a value of only spaces counts as empty"
  - "An invalid submit focuses the first invalid field until 12-26 adds the focusable summary (UUPM focus-management fallback)"
  - "The form declares method=\"post\": a submit that lands before hydration is a native post and never puts the visitor's words into a URL (D-04)"
  - "The entry timestamp is the submit time (captured when the send starts), formatted with formatEntryTime in the visitor's local time"

patterns-established:
  - "Contact copy only from the 12-01 Resolved values table; locked/unmarked UI-SPEC strings (required note, message hint) ship as written"

requirements-completed: [CONTACT-01, CONTACT-02, CONTACT-03, SEO-01]

coverage:
  - id: D1
    description: "/contact is a Server Component with its own title 'Contact · Tim Lui', the meta.contact description and canonical, no canvas and no motion import"
    requirement: SEO-01
    verification:
      - kind: e2e
        ref: "e2e/contact-form.spec.ts#should display the register with its locked names"
        status: pass
      - kind: e2e
        ref: "e2e/no-webgl.spec.ts#contact keeps the form (chromium, firefox, webkit)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Locked contract kept: labels Name, Email, Message, button Send Message, one checkbox, JSON POST to /api/feedback with interestedInCollaboration and trail_note"
    requirement: CONTACT-01
    verification:
      - kind: e2e
        ref: "e2e/contact-form.spec.ts#should sign the register and offer an empty form again"
        status: pass
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx#handles collaboration checkbox and sends it in the payload"
        status: pass
    human_judgment: false
  - id: D3
    description: "Submit-time validation with the approved inline errors (aria-invalid, sr-only 'Error: ' prefix, error then hint in aria-describedby, no live role); nothing is sent while a field is invalid"
    requirement: CONTACT-02
    verification:
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx (empty name, invalid email, short message, validateField table)"
        status: pass
      - kind: e2e
        ref: "e2e/contact-form.spec.ts (three validation tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Sending state (Sending…, aria-disabled, read-only fields, 'Sending your entry'), one request per double click, 15 s abort to the network failure box with a late answer ignored"
    requirement: CONTACT-02
    verification:
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx#enters Sending: aria-disabled button, read-only fields, one request for a double click"
        status: pass
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx#times out a never-settling send after 15 s, keeps the fields and ignores a late answer"
        status: pass
    human_judgment: false
  - id: D5
    description: "Register entry only on { code: 'ok' }: focused role=status with the local time, Register signed, Signed by {name}., I'll reply to {email}.; Sign again restores an empty form and focuses Name"
    requirement: CONTACT-02
    verification:
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx#dates the register entry with formatEntryTime of the submit time"
        status: pass
      - kind: e2e
        ref: "e2e/contact-form.spec.ts#should sign the register and offer an empty form again"
        status: pass
    human_judgment: false
  - id: D6
    description: "Failure box: send-failed/server-error/network with Retry ('Retry sending'), 429 minutes from Retry-After without Retry, 403 reload instruction without Retry, every body ending in a mailto: link, every field kept"
    requirement: CONTACT-02
    verification:
      - kind: e2e
        ref: "e2e/contact-form.spec.ts (502, 429 Retry-After 120, 403)"
        status: pass
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx (failure, retry, rate-limited it.each, origin-rejected, non-JSON)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Honeypot trail_note in an aria-hidden sr-only wrapper, tabIndex -1, autocomplete off, never reached by Tab"
    requirement: CONTACT-03
    verification:
      - kind: unit
        ref: "components/contact/__tests__/SummitRegister.test.tsx#keeps the honeypot out of the Tab order and the accessibility tree"
        status: pass
    human_judgment: false
  - id: D8
    description: "Contrast holds in the field-error, failure-box and register-entry states; nothing scrolls sideways at 375 px with a long echoed name and address"
    requirement: CONTACT-01
    verification:
      - kind: e2e
        ref: "e2e/a11y-contact.spec.ts (3 tests, chromium, firefox, webkit)"
        status: pass
      - kind: e2e
        ref: "e2e/contact-form.spec.ts#should never scroll sideways at 375 px, even with a long entry"
        status: pass
    human_judgment: false
  - id: D9
    description: "Visual quality of the new Contact layout and states at 375, 768 and 1440 (round 2 pixels)"
    requirement: CONTACT-01
    verification: []
    human_judgment: true
    rationale: "Pixel change is intentional and Tim-gated: the round 2 re-baseline (12-19) is where the new contact shots are reviewed"

duration: 16min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 13: The Summit Register Summary

**/contact is now a Server Component with its own metadata and the Summit register header band. Its only client code is the `SummitRegister` island, built on the 12-03 contract. It checks every field before sending and keeps the honeypot out of the Tab order. It shows the register entry only when the API answers `ok`; every other outcome gets a focused failure box that keeps every word the visitor typed.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-11-02T21:28:06Z
- **Completed:** 2026-11-02T21:44:00Z
- **Tasks:** 2 (1 tracer, 1 TDD)
- **Files modified:** 10 (2 created, 6 modified, 2 deleted)

## Accomplishments

- `app/(site)/contact/page.tsx`: the client directive, `AnimatedGradientMesh`, every `motion` import and the three info cards are gone. The page exports `pageMetadata({ title: 'Contact', description: <meta.contact>, path: '/contact' })`. It renders the header band (kicker `Summit register`, h1 `Contact`, the approved intro) and the content grid `mt-8 pb-12 md:pb-16 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] …`, which holds the form card: h2 `Sign the register`, the no-claim lead "Your name, your email and a message.", the required note, and `<SummitRegister />`. The grid's second column is left for the 12-16 panel.
- `SummitRegister`:
  - Labelled 07 fields. Name has `autoComplete="name" maxLength={100}`. Email has `type="email" inputMode="email" spellCheck={false}`. Message is a 6-row `resize-y` textarea with no maxLength and the hint `10 to 2,000 characters`.
  - The checkbox carries the approved label `I'd like to talk about working together`.
  - The `trail_note` honeypot sits in an aria-hidden sr-only wrapper with `tabIndex={-1}`, `autoComplete="off"` and the password-manager ignore attributes. Its label is `Leave this field empty`.
  - The message slot is the form's first child.
- Submit validates every field with `validateField` against `FEEDBACK_LIMITS`. Each error appears under its field with the approved cause-plus-fix copy and an sr-only `Error: ` prefix, and has no live role. `aria-describedby` lists the error, then the hint. Nothing is sent while any field is invalid.
- Sending: the button reads `Sending…` with `aria-disabled="true"` (not `disabled`), the fields are read-only, and an sr-only status reads `Sending your entry`. A synchronous ref guard means a double click sends once. A 15,000 ms timer aborts the request and resolves to the network failure; any answer that arrives later is ignored.
- `ok` shows the focused register entry: the local time (`2 Nov 2026 · 14:32`), `Register signed` with CheckCircleIcon, `Signed by {name}.` and `I'll reply to {email}.`, echoed through React text nodes with `wrap-anywhere`. `Sign again` restores an empty form and focuses Name.
- The failure box (`role="alert"`, focused):
  - `send-failed`, `server-error`, a network error or a timeout show `Couldn't send.` or `Couldn't reach the server.` with Retry (accessible name `Retry sending`, `aria-disabled` while resending; the box stays until the new answer arrives).
  - 429 shows `Too many attempts.` with the minutes (ceil, at least 1, `1 minute` singular, `later` when missing) and no Retry.
  - 403 shows the reload instruction and no Retry.
  - Every body ends with a `mailto:` link to `site.email`.
  - A server `validation` answer maps onto the inline errors.
- `lib/home-format.ts` gains `fixedDecimals`, `formatLatLon(pos, { decimals = 4 })` (default output byte-identical to before), `formatEntryTime` and `formatCount`. `groupedMetres` now reuses `formatCount`.

## Task Commits

1. **Task 1 (tracer): the summit register on a server-rendered Contact page:** `dc69a7b` (feat)
2. **Task 2 RED: failing tests for the validation copy, the entry time and the formatters:** `e50f9b6` (test)
3. **Task 2 GREEN: submit-time validation, the entry time and the formatters:** `b48c4d9` (feat)
4. **Fix found by the plan-level three-engine run: hydration wait and native post:** `ba8749d` (fix)

There was no REFACTOR commit.

## TDD Gate (Task 2)

- **RED (`e50f9b6`):** `npx jest components/contact lib/__tests__/home-format.test.ts` gave 13 failed and 58 passed. As in 12-03, I added a temporary, uncommitted stub to `lib/home-format.ts` with `formatEntryTime` and `formatCount` returning `''`, so the new formatter cases failed on their assertions instead of on a missing export. The stub was removed before the RED commit.
  - Failing targets, each on its planned assertion:
    - the name, email, short-message and server-validation cases: `toHaveAccessibleDescription('Error: …')`, where the received description had no prefix and no hint;
    - the entry timestamp: expected `2 Nov 2026 · 14:32`, received `''`;
    - formatLatLon `{ decimals: 2 }`: four decimals received;
    - formatEntryTime ×2 and formatCount ×5.
  - The carried behaviours passed at RED because the tracer had already shipped them. They act as regression guards: fields, success, failure, checkbox payload, Sign again, double click, the 15 s timeout, Retry, 429/403, non-JSON and the honeypot.
  - Semantic assessment: a valid RED for the intended reason, with no load, syntax or fixture faults.
  - Jest's default reporter is not a format the RED classifier supports, and `workflow.tdd_mode` is off, so no classifier record was produced.
- **GREEN (`b48c4d9`):** the same command passed 71 of 71.

## Test counts (for 12-26)

- `components/contact/__tests__/SummitRegister.test.tsx`: **17** `it`/`test` lines by the acceptance grep. With the three `it.each` tables expanded, that is **41 Jest tests** (18 SummitRegister, 11 validateField, 9 minutesFromRetryAfter; the rate-limit table adds 4 to the 18). 12-26 builds on these.
- `lib/__tests__/home-format.test.ts`: 25 lines by the grep (baseline 21), 30 Jest tests.
- `e2e/contact-form.spec.ts`: 10 tests (baseline 7). `e2e/a11y-contact.spec.ts`: 3 (unchanged). `e2e/no-webgl.spec.ts`: unchanged count.
- Full Jest: 94 suites, 1,542 tests passing.

## Files Created/Modified

- `components/contact/SummitRegister.tsx`: the register island (validation, honeypot, sending, entry, failure box)
- `components/contact/__tests__/SummitRegister.test.tsx`: moved from FeedbackForm.test.tsx and rewritten
- `app/(site)/contact/page.tsx`: server page, metadata, header band, form card
- `lib/home-format.ts`, `lib/__tests__/home-format.test.ts`: the new formatters and their cases
- `e2e/contact-form.spec.ts`: rewritten for the new copy, mocked 200/502/429/403, a 375 px overflow check and a hydration wait
- `e2e/a11y-contact.spec.ts`: contrast in the field-error, failure-box and register-entry states. The mesh test became the register-entry test.
- `e2e/no-webgl.spec.ts`: Contact asserts zero canvas and the `Contact` h1. The unused `webglFailure` import was dropped.
- Deleted: `components/FeedbackForm.tsx`. No live page renders the old form.

## Decisions Made

See `key-decisions` in the frontmatter. The two that most affect later plans:
- **Validation moved into the tracer.** The tracer task already ships `validateField` with the approved copy, because its own e2e and a11y verify steps need field errors.
- **Interim focus target.** Until 12-26 adds the focusable summary, an invalid submit focuses the first invalid field.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Text typed before hydration was lost in WebKit**
- **Found during:** plan-level verification (three-engine run)
- **Issue:** `[webkit] contact-form › should never scroll sideways at 375 px` failed. The Name typed right after `goto` was reset when React hydrated the server-rendered register, so the submit stopped at `Enter your name.` A click before hydration would also have been a native GET submit, which puts the field values into the URL.
- **Fix:** the spec's `openContact()` waits for the hydrated Send Message button (`__reactProps`, the photos-carousel pattern) before any fill or click. The form declares `method="post"`, so a pre-hydration submit never puts the visitor's words into a URL (D-04).
- **Files modified:** e2e/contact-form.spec.ts, components/contact/SummitRegister.tsx
- **Verification:** the fresh-build three-engine run then passed 51 of 51.
- **Committed in:** `ba8749d`

**2. [Rule 3 - Blocking] Field errors needed in Task 1**
- **Found during:** Task 1
- **Issue:** the tracer's verify step runs the rewritten validation e2e tests and `a11y-contact`'s field-error state.
- **Fix:** `validateField` and the inline errors shipped in Task 1. Task 2 kept its RED/GREEN on the prefix, the hint, the timestamp and the formatters.
- **Committed in:** `dc69a7b`

**Interpretation note:** the a11y spec no longer checks the email card's markup in the field-error state, because the panel that shows the address arrives in 12-16. It now checks the same `@<wbr>` markup on the failure box's mailto link.

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking).
**Impact on plan:** both were needed for correct, verifiable behaviour. There was no scope creep.

## Issues Encountered

- After the first fresh-build Playwright run, `public/service-worker.js` still held the injected hash, so the next fresh build refused to start. Restoring it with `git checkout -- public/service-worker.js` fixed this. It was restored again after the final run, and it was never staged.
- `README.md` still lists `FeedbackForm.tsx` in its tree (lines 185 and 189). This is out of scope here; the README pass is 12-22.

## Round 2 expected visual diffs

These change on purpose. They are not re-baselined here; that happens in 12-19 and is Tim-gated.
- `e2e/visual/routes.spec.ts-snapshots/contact/375-reduced-visual-dark-linux.png`
- `e2e/visual/routes.spec.ts-snapshots/contact/768-reduced-visual-dark-linux.png`
- `e2e/visual/routes.spec.ts-snapshots/contact/1440-reduced-visual-dark-linux.png`

(contact at 375, 768 and 1440: new header band, form card and no mesh. 12-16 changes them again when it adds the Direct contact panel.)

## Verification

- `npm run lint`: exit 0 (eslint and every guard). `npm run type-check`: exit 0. `npx jest --silent`: 94 suites, 1,542 tests passing.
- Per task, `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/contact-form.spec.ts e2e/a11y-contact.spec.ts --project=chromium`: 13 passed, after both Task 1 and Task 2.
- Plan level, `PW_PROD=1 npx playwright test e2e/contact-form.spec.ts e2e/a11y-contact.spec.ts e2e/no-webgl.spec.ts --project=chromium --project=firefox --project=webkit` (fresh build): 51 passed, 0 failed, 0 flaky.
- Acceptance:
  - no client directive in page.tsx; `pageMetadata(` appears 1 time;
  - `Get in Touch` no longer appears in e2e or the contact page;
  - contact-form has 10 tests (needed at least 7); SummitRegister.test has 17 lines (at least 11); home-format.test has 25 (at least 24);
  - `export function formatEntryTime` appears 1 time;
  - `git ls-files` lists neither FeedbackForm file;
  - `public/service-worker.js` is clean;
  - no `.only(`, `.skip(` or `.fixme(`.
- Port 3000 is free, and every server started during this plan has been stopped.

## Threat Flags

None. The island adds no new endpoint. It posts to the existing `/api/feedback`, and the echo uses React text nodes only (T-12-25). `Register signed` renders only on `code: 'ok'` (T-12-26).

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 12-16 can add the Direct contact panel into the grid's second column (`order-first lg:order-none`) and use `formatLatLon(site.location, { decimals: 2 })`.
- 12-26 can add blur-then-live timing, the focusable error summary in the message slot (replacing the interim first-field focus) and the counter. The counter uses `formatCount` beside `#message-hint`.

## Self-Check: PASSED

- The key files exist on disk, and `components/FeedbackForm.tsx` is gone.
- Commits `dc69a7b`, `e50f9b6`, `b48c4d9` and `ba8749d` are ancestors of HEAD.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*
