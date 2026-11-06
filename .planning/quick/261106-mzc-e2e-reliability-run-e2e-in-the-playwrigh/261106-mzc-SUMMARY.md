---
phase: quick-261106-mzc
plan: 01
status: complete
subsystem: ci-and-tests
tags: [ci, e2e, flakes, focus-trap, axe]
requires: []
provides:
  - "E2E runs in the Playwright image, with no apt downloads"
  - "A focus trap that ignores visibility: hidden controls"
  - "A nav menu that a late photo step cannot close"
  - "An axe check on the case-study pages that measures final colours"
affects: [.github/workflows/ci.yml, components/photos/LightboxDialog.tsx, components/site/SiteNav.tsx, e2e/case-study-page.spec.ts, e2e/photos-lightbox.spec.ts]
key-files:
  modified:
    - .github/workflows/ci.yml
    - components/photos/LightboxDialog.tsx
    - components/site/SiteNav.tsx
    - components/site/__tests__/SiteNav.test.tsx
    - e2e/case-study-page.spec.ts
    - e2e/photos-lightbox.spec.ts
key-decisions:
  - "Two of the three flakes are product bugs, narrow but real, so they are fixed in the product and not with test waits"
  - "The axe flake is a measurement race and the colours are correct at both ends, so only the test changes"
  - "Done inline: the causes were already diagnosed, and gsd-planner and gsd-executor cost about 480k tokens on 261106-joo"
completed: 2026-11-06
---

# Quick task 261106-mzc: E2E reliability

**E2E no longer downloads its browsers' system packages, and all three known flakes are fixed at their causes.**

## Commits

| Commit | Change |
|--------|--------|
| 3fb4435 | `tabbables()` skips `visibility: hidden`, plus a deterministic E2E test |
| 7cb7e9f | `SiteNav` ignores a change between two photo paths, plus two unit tests |
| f2eec2a | The case-study axe test waits for the press and the fade |
| 8239f91 | The E2E job runs in `mcr.microsoft.com/playwright:v1.64.0-noble` with `HOME: /root` |

## Evidence

| Check | Before | After |
|-------|--------|-------|
| View transition held open, Tab from Close | Focus on `BODY` | Focus on Previous photo, inside the dialog |
| New E2E test | Failed on Chromium and WebKit, passed on Firefox | Passes on all three |
| Nav menu replay, 8 in parallel | 3 failures in 60 | 0 in 96 |
| Lines 410 and 487, Chromium, 48 repeats each, no retries | Not measured like for like | 96 passed |
| Lightbox spec, three engines, no retries | | 139 passed |
| Case-study, shell and keyboard specs, three engines, no retries | | 192 passed |
| Jest | 1702 | 1704 passed |

ESLint, `tsc` and `guard:parity` pass.

## Limits

- The axe fix was not checked by repetition, because the failure did not reproduce in 100 free runs. The evidence is the fade paused at 35%, which gives CI's failure in both Firefox and Chromium, and nothing at 0% or 100%.
- Nothing here has run in the container locally. The PR's CI is the first real run of all three engines in the image.
- The new image tag has to move with the others whenever Playwright is bumped. `guard:parity` enforces that.
