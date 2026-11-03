---
schema_version: 1
wave: 16
outcome: verified
reason: ok
checked: 6
passed: 5
failed: 0
needs_review: 1
---

# Phase 12 wave 16: live-DOM verification (12-30)

Browser: claude-in-chrome, new tab, against `next start` at http://localhost:3000 (HEAD 805d236). Before checking, one old registration was unregistered and two old caches (`static-WxYeLyf5sDow30rBkmwgp`, `dynamic-WxYeLyf5sDow30rBkmwgp`) were deleted. The page was then reloaded so a fresh worker installed.

## 1. Install precache (C2)
- Hero precached on a page that never requests it: passed. On /roadmap, after `navigator.serviceWorker.ready`, `caches.match('/terrain/contours-hero.2f3a04accc.svg')` was non-null. `performance.getEntriesByType('resource')` showed no `contours-hero` request from the page.
- Footer strip precached: passed. `caches.match('/terrain/contours-strip.e1af353f82.svg')` was non-null. The install cache `static-8PZLkT2nThiWayq2SWTks` holds `/`, `/offline`, the strip and the hero, plus same-page `/_next/static` assets.

## 2. Control and render
- Control after reload, and pages render: passed. `navigator.serviceWorker.controller` was non-null on every visit after the reload. Each page had 1 h1 and 1 main: /roadmap `Roadmap`, / `Tim Lui`, /photos `Photographs`, /projects `Engineering`.
- Console: passed. No error or exception messages across the reload and all navigations. Capture was on from the first load. The only logs were the expected Vercel Speed Insights / Web Analytics "Failed to load script" LOG lines, which are not errors.

## 3. Network-first runtime copies
- Successful GET navigations stored, 404 not stored: passed. `dynamic-8PZLkT2nThiWayq2SWTks` held `/roadmap`, `/`, `/photos`, `/projects`. After visiting /photos/nf-check-w16 (it rendered the designed 404, h1 `You've left the marked trail`), no cache key contained `nf-check`. Final entry counts: static 29 (it also gained `/terrain/hillshade-1100.ba22a91f95.avif` and a photo avif through cache-first), dynamic 4.

## 4. Offline /offline art
- needs_review. claude-in-chrome has no way to emulate offline, so this was not observed live. The Chromium offline case in e2e/service-worker.spec.ts covers it. Criterion 1 confirms the hero is in the install cache.

## Cleanup
The worker was unregistered (regs left: 0) and all origin caches were deleted (caches left: 0).
