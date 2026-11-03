# Phase 12 — UI Review

**Audited:** 2026-11-03
**Baseline:** 12-UI-SPEC.md (approved), with 12-01-SUMMARY.md Resolved values as the only approved copy
**Screenshots:** not captured. This was a code-only audit; no build or dev server was run, so nothing below is verified at 375/768/1440 px.
**Interaction captures:** off (workflow.ui_interaction_capture is false). Interaction findings are code-derived.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Contact, edge and offline strings match the approved packet; no generic labels |
| 2. Visuals | 3/4 | Structure and a11y match the contract, but no render was inspected, so layout and the OG cards are unproven |
| 3. Color | 3/4 | No hex or v1 colors in Phase 12 files; the "Report this error" link is accent-colored outside the declared accent list |
| 4. Typography | 4/4 | No `font-bold`, `font-medium`, or sizes outside the 07 roles; mono used for data and kickers as specified |
| 5. Spacing | 3/4 | On-scale classes throughout; the only arbitrary values are the pre-existing `min-[112rem]` footer breakpoints |
| 6. Experience Design | 3/4 | Strong state handling, but copy-fallback and retry-failure paths are unverified in a browser |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **Visuals were never rendered** — layout at 375 px, the `order-first` panel swap, the edge-art sheet and the OG cards cannot be confirmed. Run `npm run build`, start `next start`, and capture /contact, /404, /offline and /opengraph-image at 375/768/1440. Check for `scrollWidth <= clientWidth` and a 2-line balanced h1 on the 404.
2. **"Report this error" link uses `text-accent`** (`components/site/ErrorBody.tsx` TEXT_LINK). The spec's accent list allows one primary fill per view plus inline prose links, and this is a standalone action-row link. It competes with Try again. Use the `ink-muted` link style, as the spec does for Copy and `mailto:`. If 07 permits it for NotFoundBody's text links, record that as a deliberate deviation.
3. **Saved-page row hover uses `hover:bg-surface-raised`** (`components/site/SavedPages.tsx:14`). The spec lists `surface-overlay` for saved-page row hover. The contrast margin is large (ink on raised 15.02), so this is cosmetic, but it is a token deviation. Change it to `hover:bg-surface-overlay`.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- `app/(site)/contact/page.tsx`: kicker "Summit register", h1 "Contact", h2 "Sign the register", lead "Your name, your email and a message." (the approved option 2, no claim), and "Fields marked * are required." All match 12-01. The retired strings ("Get in Touch", "Send Me a Message") are absent.
- `ErrorBody.tsx`: "Something went wrong", "Try again", "Report this error", "Reload page". `offline/page.tsx`: "You're offline" and the approved body sentence. Labels are specific; no "Submit", "OK" or "Click here".
- Informational only: the 404 kicker "Error 404 · Page not found" is mono although it contains plain words. The spec itself sets edge kickers to mono, so this is not a deviation.
- Unconfirmed: the "Replies: Usually within a few days" wording in DirectContactPanel is hard-coded rather than read from a Resolved-values key.

### Pillar 2: Visuals (3/4)
- Contact has a clear hierarchy: header band, then form card (2fr) and Direct contact panel (1fr) from 1024 px. Below 1024 px `order-first` shows the panel first while the DOM keeps header, form, panel, which preserves keyboard order.
- EdgeLayout keeps the art `aria-hidden` and in the 28rem right column. `EdgeArt` is `aspect-square max-w-md` (= 28rem), consistent with the grid.
- Icon-only controls: all icons are `aria-hidden` and sit beside visible text. The Copy button has `aria-label="Copy email address"`, which contains its visible "Copy" (WCAG 2.5.3 passes).
- Weakness: the accessible name stays "Copy email address" in the "Copied" state, so the check-icon swap depends on the polite status span to be perceived by non-visual users. That is acceptable but should be tested.
- Unverified: OG templates (default, photo, project), Satori font loading and hierarchy, and the D-24 fixes (EndBlock, DemoClip, DemoTerminal, RouteLog).

### Pillar 3: Color (3/4)
- Grep for hex or `rgb(` across `components/contact`, `components/site`, `app/(site)/contact`, offline, error, global-error, not-found and opengraph-image returns 0 hits outside tests.
- Accent is used on the primary button (Send Message, Try again, Go to the homepage), the `you are here` dot in EdgeArt (`fill-accent`), and TEXT_LINK. `danger` is correctly confined to errors and the required asterisk.
- WARNING: TEXT_LINK = `text-accent underline` for "Report this error" is a fourth accent element on the error page. See priority fix 2.
- WARNING: `hover:bg-surface-raised` on saved-page rows is not the specified overlay.

### Pillar 4: Typography (4/4)
- 0 occurrences of `font-bold`, `font-medium`, `font-light`, or `text-xs/2xl–6xl` in the audited paths. The only classes are `text-sm`, `text-base` and the `text-heading` role.
- Weights are 600 and 400 only. Mono carries data: the email, coordinates, and the "Error"/"Offline" kickers, all with `tabular-nums`. The h1 uses `text-balance`, and the email uses `wrap-anywhere` with a `<wbr>`.

### Pillar 5: Spacing (3/4)
- Spacing classes follow the scale: `mb-4/mb-8`, `gap-4/gap-8`, `p-6 lg:p-8`, `pt-8 pb-6`, `min-h-11` touch targets, `min-h-12` saved rows. Edge layout uses `pt-16 pb-16` and `gap-y-12`.
- The only arbitrary values are `min-[112rem]` in `SiteFooter.tsx:31-32` (a breakpoint, not spacing).
- Cannot confirm optical rhythm without a render.

### Pillar 6: Experience Design (3/4)
- Form: `noValidate`, a focused error summary with `role="alert"` and per-field links, `aria-invalid`/`aria-describedby`, and `aria-disabled` while sending (focus is kept). The fields are read-only during send. There is a honeypot, a live counter, `maxLength` and `autoComplete`. The send-failure box has a Retry button, and the success state is `role="status"` with a CheckCircle.
- Copy button: the Clipboard-API-missing path falls back to selecting the address text, and its timers are cleaned up. SavedPages has checking, ready, unsupported and empty states, and ErrorBody moves focus to the h1.
- WARNING: `SummitRegister.tsx` is 774 lines, which is a high regression surface for a single client island. The state matrix (invalid, sending, failure, success, counter over the limit) was not exercised in a render, so no state is confirmed visually.
- No destructive actions in this phase; no confirmations are needed.
- Registry audit: skipped (no `components.json`).

---

## Files Audited
- `app/(site)/contact/page.tsx`
- `components/contact/SummitRegister.tsx`, `CopyEmailButton.tsx`, `DirectContactPanel.tsx`
- `components/site/EdgeLayout.tsx`, `EdgeArt.tsx`, `ErrorBody.tsx`, `NotFoundBody.tsx`, `SavedPages.tsx`
- `app/(site)/offline/page.tsx`
- Grep scans over `app/(site)/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `app/opengraph-image.tsx` (hex, weight and size classes only)
