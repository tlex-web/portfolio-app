---
phase: 12
review: 12-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "A `validation` answer with no visible-field issue leaves the form silent: no error, no confirmation"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "DemoTerminal's IN-01 \"restart on shrink\" unmounts the observed region; the IntersectionObserver then watches a removed element"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "README still documents `FEEDBACK_EMAIL`; the code requires `FEEDBACK_RECIPIENT_EMAIL`, so following the README makes every contact send return 502"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "Service-worker cache writes are fire-and-forget, so a navigation copy can be lost and a quota error is an unhandled rejection"
  - id: IN-01
    severity: info
    disposition: fixed
    title: "The name field's \"too long\" error reads \"Enter your name.\""
  - id: IN-02
    severity: info
    disposition: deferred
    title: "The T-12-02 \"only the proxy may name the section\" guarantee does not hold where the proxy does not run"
  - id: IN-03
    severity: info
    disposition: fixed
    title: "`useProgressiveTextures` never reloads when the sources change but their count does not"
  - id: IN-04
    severity: info
    disposition: fixed
    title: "The service-worker update interval is never cleared, and its rejection is unhandled"
  - id: IN-05
    severity: info
    disposition: fixed
    title: "`global-error` renders no `<title>`"
  - id: IN-06
    severity: info
    disposition: fixed
    title: "Retry re-sends the current values without client-side validation"
  - id: IN-07
    severity: info
    disposition: fixed
    title: "`z.string().email()` is the deprecated Zod 4 form"
open: 0
total: 11
recorded: 2026-11-03T10:39:05.082Z
---

# Phase 12: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | 12-28: e22a714 (RED), e9a3fa1 (fix) |
| WR-02 | warning | fixed | 12-31: dafcb6e (RED), 4312701 (fix) |
| WR-03 | warning | fixed | 12-33: d847f8c (README names the five variables lib/email.ts and lib/rate-limit.ts read; Node.js 24) |
| WR-04 | warning | fixed | 12-30: 11ef205 (RED), 29c321a (fix) |
| IN-01 | info | fixed | 12-28: f180a4c (RED), 44f764f (fix), with Tim's 12-27 string (copy.field-error-name-long, status supplied) |
| IN-02 | info | deferred | Narrowed, not fixed as written. 12-27 edge.header-guard status reads option A, Tim's words "A (Recommended)". 12-29's C1 commits 16deede (RED) and 099fab7 (fix) send document prefetches through the proxy, which closes that path; 0b3b5c4 scopes the comments and 9abf40a closes T-12-02. The paths proxy.ts config.matcher still skips (RSC prefetches, api, missing files under images/, terrain/, media/) are the residual Tim accepted as AR-12-02 (12-SECURITY.md). |
| IN-03 | info | fixed | 12-31: d1c7946 (RED), de25be0 (fix) |
| IN-04 | info | fixed | 12-31: a5ff20f (RED), b2fb90e (fix) |
| IN-05 | info | fixed | 12-32: d252a64 (RED), 0eff11c (fix), with Tim's 12-27 string (meta.global-error-title, status supplied) |
| IN-06 | info | fixed | 12-28: f180a4c (RED), 44f764f (fix) |
| IN-07 | info | fixed | 12-28: 5abc9b6 (contract pin), b81d5bd (fix) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
