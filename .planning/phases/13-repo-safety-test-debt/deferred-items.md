# Phase 13 deferred items

Out-of-scope findings logged during plan execution (scope boundary: not caused by the plan's own changes).

## Deferred Items

- scripts/README.md says the contrast guard measures 36 pairs; it measures 47
  status: open
  **Found by:** 13-13 (while editing the same paragraph for 07 WR-01)
  **What:** `scripts/README.md:78` still lists 36 pairs (28 UI-SPEC + 4 accent-strong + 4 gallery). Phase 11 added the `ink-inverse`/`ink` toggle pair and the 10 trail pairs, so `check-contrast.mjs` prints `contrast: OK (47 pairs)`. Pre-existing doc drift, not caused by 13-13, so left as is.
