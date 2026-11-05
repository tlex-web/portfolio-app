# Phase 12 — UI Review (re-audit after follow-up plans 12-27..12-34)

**Audited:** 2026-11-03
**Baseline:** 12-UI-SPEC.md (approved, incl. the 2026-11-03 12-32 amendment)
**Screenshots:** not captured. Code-only audit; no server was started, so nothing is verified at 375/768/1440 px.
**Interaction captures:** off (workflow.ui_interaction_capture is false). Interaction findings are code-derived.

---

## Pillar Scores (vs previous 20/24)

| Pillar | Score | Previous | Key Finding |
|--------|-------|----------|-------------|
| 1. Copywriting | 4/4 | 4 | Unchanged; failure/retry and global-error title copy match the Resolved values |
| 2. Visuals | 3/4 | 3 | Still never rendered; layout and OG cards unproven |
| 3. Color | 4/4 | 3 | Both color warnings fixed (Report link ink-muted; row hover overlay) |
| 4. Typography | 4/4 | 4 | No `font-bold`/`font-medium`/off-scale sizes in audited files |
| 5. Spacing | 3/4 | 3 | On-scale; only arbitrary values are `underline-offset-[0.2em]` (NotFoundBody) and the pre-existing `min-[112rem]` footer breakpoints |
| 6. Experience Design | 3/4 | 3 | Error/Retry states now coded, but still no render; SummitRegister grew to 796 lines |

**Overall: 21/24** (+1)

---

## Previous top fixes: status

1. Visuals never rendered: **still open.** No screenshots in this pass either.
2. "Report this error" accent link: **resolved.** `components/site/ErrorBody.tsx:24` now uses `text-base text-ink-muted underline decoration-1 underline-offset-4 hover:text-ink` on `--duration-fast` `ease-erosion`, exactly the amended spec string. Try again is the sole accent on the error pages. The 404 action-row links keep `text-accent` (`NotFoundBody.tsx:52`), which the amendment explicitly keeps.
3. Saved-page row hover: **resolved.** `components/site/SavedPages.tsx:14` is `hover:bg-surface-overlay`.

## Top 3 Priority Fixes

1. **Still no rendered verification** (WARNING) — Build, run `next start`, and capture /contact (form states: invalid, sending, failure, success), /404, /offline, /opengraph-image at 375/768/1440. Check `scrollWidth <= clientWidth` and the balanced 404 h1. This is the only thing keeping Visuals and Experience Design at 3.
2. **SummitRegister.tsx is 796 lines** (WARNING) — One client island carries validation, send, rate-limit minutes, failure, and success. Split the failure panel (lines ~180-205) and the field list into components before the next change; every follow-up has grown it.
3. **404 text link uses an arbitrary `underline-offset-[0.2em]`** (minor WARNING) — `NotFoundBody.tsx:52` is off the token style that ErrorBody now uses (`underline-offset-4`). Align it or record it as deliberate in the spec.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4, unchanged)
- `ErrorBody.tsx:27` REPORT_LABEL "Report this error" and "Try again" match the contract. Contact failure copy at `SummitRegister.tsx:187-203` ("Your message is still here. Try again, or email me at ...", "Check your connection...", "Try again later" / "Try again in N minute(s)") is specific, actionable, and correctly pluralized.
- `app/global-error.tsx:31` title "Something went wrong · Tim Lui" (IN-05) matches the Resolved value and is set as a React `<title>` (line 59), which the file notes React 19 hoists.
- No generic "Submit", "OK" or "Click here" labels.

### Pillar 2: Visuals (3/4, unchanged)
- Structure, `aria-hidden` art, the 28rem art column, and icon labelling are unchanged and consistent with the contract. The error page now has a clearer hierarchy: one filled accent action and quiet text links.
- Unverified: 375 px panel-first order, the edge-art sheet, OG templates, and the D-24 fixes. No evidence of a render exists, so no 4.

### Pillar 3: Color (4/4, was 3)
- No hex or `rgb(` in Phase 12 component files (spot-checked components/contact and components/site).
- Accent is confined to the primary buttons, the EdgeArt "you are here" dot, and the 404 action-row links (spec-permitted). `danger` is on errors and the required asterisk only. Error panels use `border-danger bg-surface-overlay`.
- Both previous warnings are closed. Caveat: ink-muted link contrast on the error surface follows the spec's measured value and was not re-measured here.

### Pillar 4: Typography (4/4, unchanged)
- Grep over `components/contact` and `components/site` (non-test) for `font-bold`, `font-medium`, `text-xs`, `text-2xl` returned 0 hits. Roles used are `text-sm`, `text-base`, and the heading role; weights 600/400.

### Pillar 5: Spacing (3/4, unchanged)
- Scale classes only: `min-h-11` touch targets, `min-h-12` saved rows, `p-6 lg:p-8`, `gap-4/gap-8`.
- Arbitrary values: `underline-offset-[0.2em]` (`NotFoundBody.tsx:52`, new this audit, minor) and `min-[112rem]` footer breakpoints (pre-existing). Optical rhythm is unconfirmed without a render.

### Pillar 6: Experience Design (3/4, unchanged)
- Added by 12-28: a distinct rate-limit state ("Try again in N minutes") and a network-failure state with Retry; Retry re-runs field validation first (`SummitRegister.tsx:127` comment). The prior strengths remain: `noValidate`, error summary with `role="alert"`, `aria-invalid`/`aria-describedby`, `aria-disabled` while sending, honeypot, live counter, focus moved to the h1 on error pages, SavedPages checking/ready/unsupported/empty states.
- WARNING: the new failure and Retry paths are unit-tested at best; none was exercised in a browser. The file is 796 lines (up from 774).
- No destructive actions. Registry audit: skipped (no `components.json` at the repo root).

---

## Files Audited
- `components/site/ErrorBody.tsx`, `NotFoundBody.tsx`, `SavedPages.tsx`, `EdgeLayout.tsx`, `EdgeArt.tsx`
- `components/contact/SummitRegister.tsx`, `CopyEmailButton.tsx`, `DirectContactPanel.tsx`
- `app/global-error.tsx`, `app/(site)/contact/page.tsx`, `app/(site)/offline/page.tsx`
- 12-UI-SPEC.md (amendment at line 291), previous 12-UI-REVIEW.md
- Grep scans over `components/` and `app/` for hex, weight, size and spacing classes
