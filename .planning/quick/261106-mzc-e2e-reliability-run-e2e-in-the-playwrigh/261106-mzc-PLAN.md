---
phase: quick-261106-mzc
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .github/workflows/ci.yml
  - components/photos/LightboxDialog.tsx
  - components/site/SiteNav.tsx
  - components/site/__tests__/SiteNav.test.tsx
  - e2e/case-study-page.spec.ts
  - e2e/photos-lightbox.spec.ts
autonomous: true
must_haves:
  truths:
    - "The E2E job downloads nothing from the Ubuntu mirrors"
    - "Tab cannot leave the lightbox while the gutter labels are hidden"
    - "A late usePathname report of a photo step does not close the open nav menu"
    - "Axe on the case-study pages measures final colours, not the Pause toggle's fade"
---

# Quick task 261106-mzc: E2E reliability

E2E failed 4 of 8 runs on 2026-11-06, none because of the PR under test. Tim approved fixing this before group C is pushed. Done inline rather than through gsd-planner and gsd-executor, because the causes were already diagnosed in the orchestrator and the two agents cost about 480k tokens on 261106-joo.

## Causes, each reproduced

| Failure | Cause | Evidence |
|---------|-------|----------|
| `npx playwright install --with-deps` took 55 of 60 minutes (run 42223932292) | About 180 apt packages from a slow azure.archive.ubuntu.com mirror | Job log gaps of up to 6 minutes between `Get:` lines, with `Ign:` retries |
| `e2e/photos-lightbox.spec.ts:410`, after Tab 1 | `tabbables()` counts the hidden gutter label, so Close is not treated as last and Chromium and WebKit let Tab out | Holding the view transition's `ready` open gives `active=BODY` every time |
| `e2e/photos-lightbox.spec.ts:487`, Menu button not focused | Next's late `replaceState` echo of the earlier step closes the menu as a route change, before Escape | Focus log: echo at 348 ms, no `focus()` on Menu after Escape at 350 ms |
| `e2e/case-study-page.spec.ts:230`, Firefox `color-contrast` on the Pause toggle | Under reduced motion the toggle turns pressed at hydration and fades; axe landed inside the fade | Paused at 35% of the fade, axe reports the same target at 1.21:1 in Firefox and Chromium; nothing at 0% or 100% |

## Tasks

1. `tabbables()` also skips `visibility: hidden`. New E2E test holds the labels hidden; it failed on Chromium and WebKit before the fix.
2. `SiteNav` does not treat a change between two photo paths as a route change. Two new unit tests: a photo step stays open, photo to gallery closes.
3. The case-study axe test waits for the press and for animations with the existing `waitForAnimations` helper.
4. The E2E job runs in the Playwright image that Visual Regression uses, with `HOME: /root` for Firefox, and the install step is removed.

## Verification

- Jest, `tsc`, ESLint and `guard:parity` pass.
- Affected specs pass in all three engines on a production build; lines 410 and 487 repeated 48 times each on Chromium.
- CI on the PR is the real test of the container change: all three engines must run in the image.

## Out of scope

- Playwright 1.65, the axe 4.14 upgrade and group C.
- The `chore/deps-playwright-axe` branch must also move this new image tag to 1.64.1 when it is rebased.
