# Phase 13 deferred items

Out-of-scope findings logged during plan execution (scope boundary: not caused by the plan's own changes).

## Deferred Items

- scripts/README.md says the contrast guard measures 36 pairs; it measures 47
  status: open
  **Found by:** 13-13 (while editing the same paragraph for 07 WR-01)
  **What:** `scripts/README.md:78` still lists 36 pairs (28 UI-SPEC + 4 accent-strong + 4 gallery). Phase 11 added the `ink-inverse`/`ink` toggle pair and the 10 trail pairs, so `check-contrast.mjs` prints `contrast: OK (47 pairs)`. Pre-existing doc drift, not caused by 13-13, so left as is.

- npm audit reports 25 dev-only advisories (3 low, 22 moderate) that the Security Audit job only warns about
  status: open
  **Found by:** 13-15 (PR #143, CI run 43430095783, head 90758db)
  **What:** The Security Audit job concluded success. Its `npm audit --audit-level=moderate` step exited 1 under `continue-on-error: true`, and the next step printed `::warning::Security vulnerabilities found`. The log names, among others, deepmerge GHSA-gcqx-w48m-w2h4 and glob GHSA-3g3m-2fjr-6pw4, both moderate. Locally, `npm audit --omit=dev` finds 0 vulnerabilities, so production dependencies are clean. `main` has the same warn-only step (ci.yml line 243 on origin/main). This is pre-existing and not caused by 13-15. Two decisions for a later plan: whether to fix the dev advisories, and whether the audit step should fail CI OK.
