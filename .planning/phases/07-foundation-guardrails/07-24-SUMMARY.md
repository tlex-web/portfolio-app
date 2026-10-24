---
phase: 07-foundation-guardrails
plan: 24
subsystem: ui
tags: [contact, feedback-form, contrast, wcag-aa, axe, axe-core-playwright, color-scheme, solid-panels, phosphor, site-email, re-baseline, e2e, shell-06, build-step-9]

requires:
  - phase: 07-23
    provides: "Shell 404 and error boundaries; E2E baseline of 116 tests (chromium + firefox), 0 flaky"
  - phase: 07-22
    provides: "app/(site)/contact/page.tsx inside SiteChrome; e2e/shell.spec.ts /contact landmarks and 768 no-scroll checks"
  - phase: 07-21
    provides: "data/site.ts with Tim's public email (old2shatterhand@gmail.com)"
  - phase: 07-20
    provides: "check-contrast.mjs (28 UI-SPEC pairs, danger/surface-overlay 6.18, line-strong/surface-overlay 4.17) and the palette guard"
  - phase: 07-16
    provides: "Contact mapped to L2 semantic utilities; Tim's D1 (outlined status boxes) and D2 (faded accent submit while pending)"
  - phase: 07-13
    provides: "@phosphor-icons/react 2.1.10, imported only from dist/ssr"
provides:
  - "app/(site)/contact/page.tsx: 'Get in Touch' hero on a solid bg-surface-raised border-line rounded-lg panel (text-left, h1 text-ink without drop-shadow, lead text-ink-muted max-w-prose); form card bg-surface-raised border-line rounded-lg p-8 with h2 text-ink; three solid info cards (Response Time, Email, Location) with Phosphor Clock / EnvelopeSimple / MapPin in bg-surface-overlay tiles; Email card shows {site.email} as selectable text with wrap-anywhere and a <wbr> after '@'"
  - "components/FeedbackForm.tsx: labels text-ink with an aria-hidden text-danger asterisk; inputs w-full min-h-11 bg-surface-overlay border-line-strong (border-danger when invalid); errors mt-2 text-sm text-danger (ids and role=alert unchanged); submit bg-accent text-ink-inverse, enabled:hover:bg-accent-hover, disabled:opacity-50 disabled:cursor-not-allowed; status boxes rounded-sm p-4 with 20 px CheckCircle / WarningCircle; required on Name, Email, Message; textarea resize-y"
  - "e2e/a11y-contact.spec.ts (3 tests): axe color-contrast on /contact under colorScheme dark, light, and light with every canvas hidden; covers the empty-submit error state and (dark, light) the mocked 500 failure box"
  - "devDependency @axe-core/playwright 4.13.0 (exact pin); axe-core deduped at 4.13.0"
  - "contact/{375,768,1440}-reduced-visual-dark re-baselined (Tim's amend into c9aac91)"
affects: [07-25, 07-26, 12]

actuals:
  tokens: 5928    # chars/4 over `git diff f004192..c9aac91 -- . ':!*.png'` (21730 chars code + 1982 chars package-lock.json = 23712); the 3 PNGs are binary and not counted
  tasks: 2        # Task 1 tracer executed; Task 2 checkpoint resolved by Tim's amend and reply "pushed"
  commits: 1      # measured: git rev-list --count f004192..HEAD = 1 (c9aac91), before the docs commits
plan_head_before: f0041922d023f7efb7a9f6d09307b21d4f9c53dd
plan_head_after: c9aac9189215db6738784abff001cb2e01d46dc6

tech-stack:
  added: ["@axe-core/playwright 4.13.0 (devDependency, exact pin; MPL-2.0; no install scripts)"]
  patterns:
    - "Text never sits on the animated mesh: every Contact text block lives on a solid bg-surface-raised panel, so contrast is the same before the canvas mounts, with the mesh, and without WebGL"
    - "axe colour-contrast specs wait for fonts, scroll to fire whileInView fade-ins, and wait until the text elements are fully opaque before analysing (axe skips transparent elements), then assert that axe actually measured the key nodes"
    - "Decorative required asterisks are aria-hidden; the input's required attribute is the source of truth, with noValidate keeping the custom validation"
    - "An email address that is one text node gets a <wbr> after '@' so it breaks at the natural point; wrap-anywhere stays as the fallback"

key-files:
  created:
    - e2e/a11y-contact.spec.ts
  modified:
    - app/(site)/contact/page.tsx
    - components/FeedbackForm.tsx
    - package.json
    - package-lock.json
    - e2e/visual/routes.spec.ts-snapshots/contact/** (3 PNGs)

key-decisions:
  - "Contact text sits only on solid panels (bg-surface-raised border-line) above the unchanged AnimatedGradientMesh, so AA holds for dark-OS and light-OS visitors and with no WebGL; Phase 12 removes the mesh"
  - "Tim's 07-16 D1 and D2 kept: status boxes stay outlined on bg-surface-overlay (now rounded-sm p-4 with 20 px CheckCircle / WarningCircle), and the submit stays the accent button faded while pending (disabled:opacity-50 disabled:cursor-not-allowed, disabled={isSubmitting}); no decision checkpoint needed"
  - "@axe-core/playwright pinned exactly at 4.13.0 (npm wrote ^4.13.0; T-07-SC says exact). npm deduped axe-core by upgrading eslint-plugin-jsx-a11y's copy 4.11.2 -> 4.13.0 inside its ^4.10.0 range instead of adding a second copy; lint stays at 0 errors"
  - "required added to Name, Email and Message, because the plan makes the asterisk aria-hidden on the assumption that required is the source of truth; noValidate keeps validation and error copy unchanged, accessible names unchanged"
  - "The 07-16 inline whileHover rgba glows on Contact are gone (no whileHover, rgba(, rotate, shadow-* or backdrop-blur left in page.tsx); that STATE concern is resolved"
  - "Task 2 re-baseline: Tim amended the 3 contact PNGs into the Contact commit (9e5a579 -> c9aac91) and replied 'pushed'; check-snapshot-commit --allow contact OK (3 changed); final CI run 40041886574 green"

patterns-established:
  - "Interim contrast fixes prove AA with axe color-contrast in both colorScheme values plus a no-canvas case, not only with the token-pair guard"
  - "axe specs assert that the nodes they care about were measured, so an element skipped for transparency cannot pass silently"

# Copied verbatim from the PLAN's `requirements`. Flipped in REQUIREMENTS.md per
# requirements.ready-ids 07-24-PLAN.md SHELL-06 -> ready [SHELL-06], blocked [].
requirements-completed: [SHELL-06]

coverage:
  - id: D1
    description: "axe color-contrast reports zero violations on /contact under colorScheme dark and light, including the h1, h2, labels, inputs, field errors, helper text, the email paragraph and the failure box"
    requirement: SHELL-06
    verification:
      - kind: e2e
        ref: "e2e/a11y-contact.spec.ts (3 tests; chromium PW_PROD and dev 10/10 with contact-form.spec); CI run 40041886574 on c9aac91 E2E (chromium + firefox, 122 passed, 0 flaky)"
        status: pass
    human_judgment: false
  - id: D2
    description: "With every canvas hidden (no mesh), axe still reports zero color-contrast violations"
    requirement: SHELL-06
    verification:
      - kind: e2e
        ref: "e2e/a11y-contact.spec.ts no-mesh test; e2e/no-webgl.spec.ts 'contact keeps the form'"
        status: pass
    human_judgment: false
  - id: D3
    description: "Form data path, /api/feedback contract, CSRF, rate limiting, field names, ids, labels and error strings unchanged"
    requirement: SHELL-06
    verification:
      - kind: e2e
        ref: "e2e/contact-form.spec.ts unchanged and green; contract-file diff empty before commit"
        status: pass
      - kind: unit
        ref: "components/__tests__/FeedbackForm.test.tsx + app/api/__tests__/feedback.test.ts (25/25); full Jest 107/107"
        status: pass
    human_judgment: false
  - id: D4
    description: "Contact on solid panels with Phosphor info icons and the real email looks right at 375, 768 and 1440"
    requirement: SHELL-06
    verification:
      - kind: automated_ui
        ref: "Update visual baselines run 40041212555 (only contact/{375,768,1440} changed); CI run 40041886574 Visual green on Tim's amend c9aac91"
        status: pass
    human_judgment: true
    rationale: "The restyled page was reviewed by eye on the baseline sheets before Tim committed the PNGs"

duration: 20 min (ledger f004192 23:30:02Z; Contact commit authored 23:42:02Z; Tim's amend c9aac91 23:50:28Z; includes the Task 2 wait for Tim, excludes the final CI run)
completed: 2026-10-24
status: complete
---

# Phase 7 Plan 24: Contact interim contrast fix on solid panels (build step 9, part 4)

**Contact text no longer sits on the animated mesh. The "Get in Touch" hero, the form card and the three info cards are solid `bg-surface-raised` panels, the info icons are Phosphor, and the Email card shows Tim's real address (`old2shatterhand@gmail.com`) instead of `your.email@example.com`. A new axe spec proves zero color-contrast violations under `colorScheme` dark, light, and light with the mesh hidden, including the error and failure states. The form's data path, `/api/feedback` and every contract test are unchanged. The 3 contact PNGs were re-baselined (Tim's amend `c9aac91`), and the final CI run 40041886574 is green with 122 E2E passed and 0 flaky.**

## Performance

- **Duration:** 20 min from the ledger (`f004192`, 23:30:02Z) to Tim's amend `c9aac91` (23:50:28Z). This includes the Task 2 wait for Tim and excludes the final CI run.
- **Tasks:** 2/2
- **Files modified:** 8 (5 code and package files, 3 PNGs)

## Accomplishments

- **Contact page (SHELL-06):**
  - The hero copy sits in a `bg-surface-raised border border-line rounded-lg p-8 md:p-12 text-left` panel in the same `max-w-3xl` column as the form. The h1 keeps its copy and size, takes `text-ink` and drops `drop-shadow-lg`. The lead paragraph is `text-base text-ink-muted max-w-prose`.
  - The form card is `bg-surface-raised border border-line rounded-lg p-8`, with no translucency and no backdrop blur. Its h2 is `text-ink`.
  - The info cards (Response Time, Email, Location) are `bg-surface-raised border border-line rounded-lg p-6`. Each has a `bg-surface-overlay` icon tile with a Phosphor `Clock`, `EnvelopeSimple` or `MapPin` (20 px, `aria-hidden`, `text-ink-muted`, from `@phosphor-icons/react/dist/ssr`). Headings are `text-ink` and body text is `text-ink-muted`.
  - The Email card shows `{site.email}` as selectable text with `wrap-anywhere` and a `<wbr>` after "@" (see deviation 3).
  - The rotate-360 icon hover, the coloured box shadows and the 07-16 inline `whileHover` rgba glows are gone. `AnimatedGradientMesh` stays as the background until Phase 12.
- **FeedbackForm (class and decorative markup, plus `required`):**
  - Labels are `text-sm font-semibold text-ink`. The asterisk is `text-danger` with `aria-hidden="true"` and no sr-only text, so accessible names and the contact-form.spec label regexes do not change.
  - Inputs and the textarea are `w-full min-h-11 px-4 py-2 rounded-sm bg-surface-overlay text-ink border border-line-strong placeholder:text-ink-muted`, with `border-danger` when invalid, next to the existing `aria-invalid`.
  - Errors are `mt-2 text-sm text-danger` with the existing ids and `role="alert"`.
  - The checkbox is `accent-accent border-line-strong`, its label `text-sm text-ink`.
  - The submit is `bg-accent text-ink-inverse`, `enabled:hover:bg-accent-hover`, `disabled:opacity-50 disabled:cursor-not-allowed`, and still reads "Send Message" / "Sending...".
  - The success and failure boxes are `bg-surface-overlay border rounded-sm p-4 text-ink` with `border-success` + `CheckCircle` or `border-danger` + `WarningCircle` (20 px, `aria-hidden`).
  - Handlers, state, validation, fetch, field names, ids and copy are untouched.
- **axe spec (`e2e/a11y-contact.spec.ts`, 3 tests):**
  - Cases: dark; light; light with `canvas { visibility: hidden !important }` (no mesh).
  - Each test waits for `document.fonts.ready`, scrolls to fire the fade-ins, and waits until every h1, h2, h3, p and label in main is fully opaque, because axe skips transparent elements. It then submits the empty form, so labels, inputs, field errors and helper text are all present.
  - The dark and light tests also mock `/api/feedback` with a 500 and re-run axe on the failure box.
  - Each test asserts that axe measured the h1, the h2, `#name-error`, the Message label, the email paragraph and (where present) the failure text.
  - `incomplete` nodes: none in any case, on either the dev or the production server.
  - Falsifiability: a temporary `text-line` lead produced a `.text-line` violation and a failing test. The change was reverted.
- **Package:** `@axe-core/playwright` 4.13.0, pinned exactly (see the Supply chain section).

## Task Commits

1. **Task 1 (tracer): Contact interim restyle on solid panels, proven by axe color-contrast in both schemes**: `9e5a579` (feat), amended by Tim into `c9aac91` with the 3 contact PNGs. Tracer gate: every `<verify>` is automated and `human_verify_mode` is end-of-phase, so the checks were re-run green and work continued.
2. **Task 2 (checkpoint:human-action, blocking-human): re-baseline contact**: Tim amended the PNGs into `c9aac91` and replied "pushed". There is no separate commit.

`git rev-list --count f004192..HEAD` = 1, measured from the plan ledger. `origin/ci/07-24` = `c9aac91`.

## Re-baseline (Task 2)

- **Baseline run:** `ci/07-24` was first pushed at `9e5a579` (a plain push, new branch). The "Update visual baselines" run 40041212555 changed only `contact/{375,768,1440}-reduced-visual-dark`. Page heights grew as predicted: 375 2314 -> 2360 (+46), 768 1694 -> 1780 (+86), 1440 1674 -> 1736 (+62).
- **Push CI (run 40041212981):** Visual failed, as expected. E2E had 122 passed and 0 flaky: the previous 116 plus 3 axe tests on chromium and on Firefox, so axe also passes on Firefox. The other jobs passed. Determinism 6/6.
- **Review (sheets sent to Tim):**
  - the solid hero panel, left-aligned
  - the solid form card with bordered 44 px inputs
  - the solid info cards with Phosphor icons
  - the real email `old2shatterhand@gmail.com` in place of `your.email@example.com`
- **After Tim's amend (`c9aac91`):** `check-snapshot-commit --allow contact` returned OK (3 changed).
- **Final CI:** run 40041886574 on `c9aac91`. All jobs passed, E2E 122 passed and 0 flaky.

## Supply chain (T-07-SC)

- `npm view` was re-run before the install and matched the research audit. `@axe-core/playwright` 4.13.0 has integrity `sha512-6YLx+kxXu5GJceG4ozFg+33a2EMTdjYwWGloJ3sb9Kta5pp+ZNS53uxGVog5JetIY8s++P5UrtX+cri+u0VAVg==`. It resolves `axe-core` 4.13.0, is MPL-2.0 and has no install scripts.
- `package.json` pins `"4.13.0"` exactly. npm wrote `^4.13.0`, but the threat model requires an exact version, which also matches the `eslint-plugin-jsx-a11y` pin style.
- Lockfile changes:
  - `@axe-core/playwright` added.
  - The existing `axe-core` used by `eslint-plugin-jsx-a11y@6.10.2` was upgraded from 4.11.2 to 4.13.0, inside its `^4.10.0` range, instead of a second copy being added.
  - `playwright-core` is marked `"peer": true`.
  - No unvetted package was added. `npm ls` shows single copies. Lint (jsx-a11y) still has 0 errors.

## Files Created/Modified

- `app/(site)/contact/page.tsx`: hero, form card and info cards on solid panels, Phosphor icons, `site.email`.
- `components/FeedbackForm.tsx`: token classes, aria-hidden asterisk, `required`, status icons.
- `e2e/a11y-contact.spec.ts`: the axe color-contrast spec (new, 3 tests).
- `package.json`, `package-lock.json`: `@axe-core/playwright` 4.13.0.
- `e2e/visual/routes.spec.ts-snapshots/contact/*`: 3 PNGs.

## Decisions Made

See `key-decisions` in the frontmatter.

Decision check against Tim's 07-16 choices: there is no conflict. D1 (outlined status boxes `bg-surface-overlay border-success/danger text-ink`) is kept, with `rounded-sm p-4` and the 20 px icons added. D2 (the submit is `bg-accent text-ink-inverse`, faded while pending) is kept: the fade now comes from `disabled:opacity-50 disabled:cursor-not-allowed`, and the behaviour is the same because the button has `disabled={isSubmitting}`. No decision checkpoint was raised.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Accessibility] Added `required` to Name, Email and Message**
- **Found during:** Task 1.
- **Issue:** the plan makes the asterisk `aria-hidden` because "the `required` attribute stays the source of truth", but the inputs had no `required` attribute. Hiding the asterisk would have left screen-reader users with no required signal.
- **Fix:** added `required` to the three inputs. `noValidate` keeps the custom validation and error copy unchanged, and accessible names do not change. The contract tests are byte-identical and green.
- **Commit:** `c9aac91`.

**2. [Rule 2 - UX] Textarea and status-box wrapping**
- The textarea is `resize-y`, so it cannot be dragged wider than the card.
- The status-box message is wrapped in `<span class="min-w-0 wrap-break-word">`, so a long server error wraps inside the box next to the icon.
- **Commit:** `c9aac91`.

**3. [Rule 1 - Layout] `<wbr>` after "@" in the email**
- **Issue:** the address is one text node. With `wrap-anywhere` alone it broke mid-word at 768.
- **Fix:** a `<wbr>` after "@" makes 768 break as `old2shatterhand@` / `gmail.com`. It stays on one line at 375 and 1440. The copied text is still the plain address, and `wrap-anywhere` remains as the fallback.
- **Commit:** `c9aac91`.

**4. [Open choices, within the plan's latitude]**
- The hero panel sits in the same `max-w-3xl` column as the form.
- The info cards keep centred text.
- The status icons inherit `text-ink`.
- The fade-ins are unchanged.
- The whole-card hover on the info cards (scale, radius, shadow, `cursor-pointer`) was removed, because the cards are not clickable.

---

**Total deviations:** 3 auto-fixed (1 accessibility, 1 UX, 1 layout) plus 4 open-choice notes.
**Impact on plan:** no scope change. The form's behaviour, data path and security are unchanged.

## Issues Encountered

- **Local cold dev server:** on the first dev-server run, 2 contact-form submit tests stayed on "Sending..." while `/api/feedback` compiled. A warm dev server passed 10/10, and PW_PROD passed 10/10. CI uses a production build and was green.

### Full checks

| Check | Result |
|-------|--------|
| `npx playwright test e2e/a11y-contact.spec.ts e2e/contact-form.spec.ts --project=chromium` | PW_PROD 10/10; dev 10/10 (warm) |
| `npx jest components/__tests__/FeedbackForm.test.tsx app/api/__tests__/feedback.test.ts` | 25/25; full Jest 13 suites 107/107 |
| `npm run lint && npm run type-check && npm run build` | lint 0 errors (palette OK, contrast OK 28 pairs, selftest 45/45); type-check OK; build OK |
| `guard:tests` | "jest 107 + e2e 98 = 205 (baseline 91) OK" |
| shell.spec and no-webgl | green, including /contact landmarks, 768 no-scroll and "contact keeps the form" |
| Acceptance | contract-file diff empty before commit; page.tsx has `site.email`, `wrap-anywhere`, `bg-surface-raised`, `@phosphor-icons/react/dist/ssr` and no `drop-shadow-lg`; FeedbackForm has `border-line-strong`, `text-danger`, `aria-hidden="true"`, `Send Message`, `Sending...`, `role="alert"`; devDependencies have `@axe-core/playwright`. PASS |
| Task 2 | check-snapshot-commit `--allow contact` OK (3 changed); final CI run 40041886574 on `c9aac91`: every job passed, E2E 122 passed, 0 flaky |

## Known Stubs

None. The Email card shows the real `site.email` value, and the placeholder address is gone.

## Threat Flags

None new.
- **T-07-33 (tampering, FeedbackForm vs `/api/feedback`):** mitigated. `app/api` is untouched. contact-form.spec and feedback.test run unchanged and green. The only non-class change is `required` on three inputs, and `noValidate` keeps the browser from acting on it.
- **T-07-SC:** mitigated. Exact pin, the integrity hash was checked, there are no install scripts, and the package is a devDependency only.

## User Setup Required

None from this plan.

## Next Phase Readiness

- **07-25** (identity metadata, forbidden-strings guard, emoji rule on) is next and autonomous. It turns on the emoji rule that `guard:palette` currently skips.
- The 07-16 STATE concern about Contact's inline `rgba` hover glows is resolved.
- **Requirements:** SHELL-06 is Complete (ready-ids: ready).

## Self-Check: PASSED

- `e2e/a11y-contact.spec.ts`, `app/(site)/contact/page.tsx` and `components/FeedbackForm.tsx` exist on disk.
- `c9aac91` is an ancestor of HEAD. `git rev-list --count f004192..HEAD` = 1.
- No source, test, package or PNG file changed during close-out.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-24*
