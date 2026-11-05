---
phase: 12-contact-edge-pages-cleanup-verification
plan: 15
subsystem: ui
tags: [nextjs, error-boundary, global-error, offline, cache-storage, service-worker, edge-pages, jest, playwright]

requires:
  - phase: 12-01
    provides: "Resolved values: copy.error-report, copy.offline-h1, -body, -h2, -empty, -unsupported (all supplied)"
  - phase: 12-08
    provides: "Network-first SW, /offline precached with its /_next/static assets, exact-URL cache match on offline navigations"
  - phase: 12-09
    provides: "Root title template and metadataBase; /offline out of the sitemap and disallowed in robots"
  - phase: 12-12
    provides: "EdgeLayout (text, art, extra) and the hook-free EdgeArt sheet"
provides:
  - "ErrorBody in EdgeLayout with the EdgeArt sheet and 'Report this error' to /contact (router link in the section variant, plain anchor in global-error)"
  - "/offline as a Server Component: metadata title Offline + robots noindex, EdgeLayout, OfflineRetry, SavedPages in extra"
  - "components/site/OfflineRetry.tsx: primary Try again (reload) and one online listener with once: true"
  - "components/site/SavedPages.tsx: client island reading every cache's keys into checking, list, empty or unsupported"
  - "lib/saved-pages.ts: savedPageCatalog (nav, photos, projects) and savedPageRows (exact cached paths only)"
  - "e2e/offline.spec.ts: head, layout, empty, seeded cache, unsupported, 375 px"
affects: [12-16, 12-17, 12-19, 12-21, 12-23]

actuals:
  tokens: 10500
  tasks: 2
  commits: 5
plan_head_before: 16853d304ee0a2bc59c2c3c19eaffe93c94fa5f6
plan_head_after: 3cd9fe22c8ea471413c642a0dcf0cd33dd0642da

tech-stack:
  added: []
  patterns:
    - "Server page builds a small serializable catalog from data and hands it to a browser-API island, so the client bundle carries no data modules"
    - "Offline lists match cached request URLs by exact path against a data catalog; nothing from the cache is ever printed"

key-files:
  created:
    - components/site/OfflineRetry.tsx
    - components/site/SavedPages.tsx
    - components/site/__tests__/SavedPages.test.tsx
    - components/site/__tests__/OfflineRetry.test.tsx
    - lib/saved-pages.ts
    - lib/__tests__/saved-pages.test.ts
    - e2e/offline.spec.ts
  modified:
    - components/site/ErrorBody.tsx
    - components/site/__tests__/ErrorBody.test.tsx
    - app/global-error.tsx
    - components/__tests__/global-error.test.tsx
    - "app/(site)/offline/page.tsx"

key-decisions:
  - "savedPageRows takes the catalog as a second argument (savedPageCatalog built on the server page from site.nav, photoViews and projects), so the offline client island ships titles and paths only, not the photo view-model and project prose"
  - "A cached URL with a query string never makes a row on its own: the SW answers offline navigations with an exact-URL match, so only a cached bare path is openable; '/roadmap?view=1' next to '/roadmap' collapses into the one Roadmap row, and _rsc entries drop"
  - "Saved-page rows and the global-error Report link are plain anchors: offline a document navigation goes straight to the SW's cached page, and global-error must not depend on the router"
  - "SavedPages renders exactly the UI-SPEC markup with no live region (the spec has none; not redesigned)"

patterns-established:
  - "Edge pages: kicker, h1 text-balance, one ink-muted sentence, action row flex-wrap items-center gap-4, text links in the 07 prose link style"

requirements-completed: [EDGE-01, EDGE-02]

coverage:
  - id: D1
    description: "(site)/error and global-error render ErrorBody in EdgeLayout with the EdgeArt sheet, kicker Error, the focused h1 'Something went wrong', Try again (retry, once per press, no pending UI), Go to the homepage or Reload page, and Report this error to /contact (plain anchor in global-error); a failing retry re-renders the same body"
    requirement: EDGE-01
    verification:
      - kind: unit
        ref: "components/site/__tests__/ErrorBody.test.tsx"
        status: pass
      - kind: unit
        ref: "components/__tests__/global-error.test.tsx"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/no-webgl.spec.ts (chromium, firefox, webkit; relies on the error h1 being absent)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No exception message, stack or digest on any error page (T-12-29)"
    requirement: EDGE-01
    verification:
      - kind: unit
        ref: "components/__tests__/global-error.test.tsx#never renders the exception message or digest; components/site/__tests__/ErrorBody.test.tsx#app/(site)/error"
        status: pass
    human_judgment: false
  - id: D3
    description: "global-error keeps its own html.dark and body, globals.css, fonts and SiteChrome variant='static', with no router link anywhere in the fallback"
    requirement: EDGE-01
    verification:
      - kind: unit
        ref: "components/__tests__/global-error.test.tsx"
        status: pass
    human_judgment: false
  - id: D4
    description: "/offline: Server Component, title 'Offline · Tim Lui', robots noindex, EdgeLayout with kicker Offline, Tim's h1 and body, Try again, the art sheet, no focus move, old card and icon gone; 375 px without horizontal scroll"
    requirement: EDGE-02
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/offline.spec.ts --project=chromium --project=firefox --project=webkit (18 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "OfflineRetry: Try again reloads; one online listener with once: true reloads once and is removed on unmount"
    requirement: EDGE-02
    verification:
      - kind: unit
        ref: "components/site/__tests__/OfflineRetry.test.tsx"
        status: pass
    human_judgment: false
  - id: D6
    description: "SavedPages and savedPageRows (UI-SPEC E11): checking first paint, rows only for cached catalog paths titled from data with Photograph/Project labels in nav-photos-projects order, /offline, assets, query variants, duplicates and unknown paths dropped, empty and unsupported sentences, rows >= 48 px, art does not move when the list arrives"
    requirement: EDGE-02
    verification:
      - kind: unit
        ref: "lib/__tests__/saved-pages.test.ts; components/site/__tests__/SavedPages.test.tsx"
        status: pass
      - kind: e2e
        ref: "e2e/offline.spec.ts#seeded Cache Storage (chromium, firefox, webkit)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Visual quality of the error and offline pages at 375, 768 and 1440 (round 2 pixels)"
    requirement: EDGE-02
    verification: []
    human_judgment: true
    rationale: "The offline pixels change on purpose and the round 2 re-baseline (12-19) is Tim-gated; the error pages have no visual snapshot, so their look is judged live"

duration: 12min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 15: Error, Global-Error and Offline in the Edge Layout Summary

**The error pages and global-error now render in the shared edge layout, beside the same contour sheet as the 404, and offer "Report this error" (/contact). /offline is a noindexed Server Component with Tim's h1 "You're offline", a Try again that also reloads once when the connection returns, and a "Saved on this device" list. The list reads Cache Storage and shows only cached pages, titled from data. It never prints a URL.**

## Performance

- **Duration:** about 12 min (measured from the start stamp)
- **Started:** 2026-11-02T22:20:03Z
- **Completed:** 2026-11-02T22:32:07Z
- **Tasks:** 2
- **Files modified:** 12 (7 created, 5 modified)

## Accomplishments

- `ErrorBody` returns `<EdgeLayout text={…} />`. The text block has the kicker `Error`, the focused h1 `Something went wrong` (unchanged, `e2e/helpers/webgl.ts` depends on it), the 07 body, and an action row (`flex flex-wrap items-center gap-4`): primary Try again (`retry()`), secondary Go to the homepage or Reload page, then the text link **Report this error** (copy.error-report). The link uses `next/link` in the section variant and `<a href="/contact">` in the root variant. The error object is still never passed in.
- `app/global-error.tsx` keeps its own `html.dark`, body, `globals.css`, the three fonts and `SiteChrome variant="static"`. Only its doc comment changed. Nothing in the fallback calls `next/link`; the test asserts this.
- `app/(site)/offline/page.tsx` is now a Server Component. It exports `metadata = { title: 'Offline', robots: { index: false } }`, giving the title "Offline · Tim Lui" and `<meta name="robots" content="noindex">`. It renders `EdgeLayout` with the kicker `Offline`, h1 `You're offline` and the body from copy.offline-body. `OfflineRetry` sits in the action row and `SavedPages` in `extra`. The stock icon, the "Good news" card and the old links are gone.
- `OfflineRetry`: a primary Try again (07 PRIMARY classes) calls `location.reload()`. `window.addEventListener('online', reload, { once: true })` is added on mount and removed on unmount.
- `SavedPages` matches the UI-SPEC E11 markup: `<section aria-labelledby="saved-title">`, `<h2 id="saved-title" class="text-heading">Saved on this device</h2>`, then `Checking saved pages…` until `caches.keys()` and each `cache.keys()` have been read. After that it shows the `ul mt-4 border-b border-line` rows (`li border-t`, `a.flex.min-h-12…`, title plus a `text-sm text-ink-muted` label), the empty sentence, or the unsupported sentence. The unsupported sentence shows when the caches API is missing or a read rejects.
- `lib/saved-pages.ts` is pure (JSDoc cites D-12 and T-12-30). `savedPageCatalog` lists the nav labels, then photo titles in data order, then project names. `savedPageRows(urls, catalog)` keeps catalog rows whose exact path was cached, in catalog order and each once.

## Task Commits

1. **Task 1 RED:** `2dfeb22` test(12-15): failing error and global-error edge layout tests
2. **Task 1 GREEN:** `a4e8778` feat(12-15): error and global-error in the edge layout (EDGE-01, D-09)
3. **Task 2 RED:** `79da4ba` test(12-15): failing saved-pages, SavedPages and OfflineRetry tests
4. **Task 2 GREEN:** `6161db3` feat(12-15): the offline page with saved pages (EDGE-02, D-12)
5. **Fix:** `3cd9fe2` fix(12-15): read the seeded cache from a second page so WebKit keeps it

No REFACTOR commit.

## TDD

- **Task 1 RED (`2dfeb22`):** `npx jest components/site/__tests__/ErrorBody.test.tsx components/__tests__/global-error.test.tsx` exited 1 with 7 failed and 12 passed. Each target failed on its assertion: no art sheet (`Received: null`), no "Report this error" link (`Unable to find … role "link" and name "Report this error"`), no plain /contact anchor in global-error (`Received: undefined`). The 12 that passed are the existing assertions, kept unchanged. There were no load or syntax faults. Raw Jest JSON: `C:/Users/tim/AppData/Local/Temp/claude/C--Users-tim-MyDocuments-Programming-portfolio-app/db4d785f-fc8b-44f3-9be7-c9aef8d6fcda/scratchpad/red-12-15-t1.json`.
- **Task 2 RED (`79da4ba`):** the three suites exited 1 with 12 failed and 7 passed. The RED commit carried export-only skeletons (an empty catalog and rows, components rendering `null`) so the suites load. Without them the run would fail on module resolution, which counts as INVALID_RED. The failures were deep-equality misses on the catalog and rows, a missing region/list/button, and missing empty and unsupported sentences. The 7 that passed are negative guards (no /offline, query-only dropped, no raw URL, listener removed on unmount, and so on), which an empty skeleton satisfies trivially. They are regression guards, not RED targets. Raw JSON: `…/scratchpad/red-12-15-t2.json`.
- **Semantic assessment:** valid RED for both tasks. Every target ran and failed for the missing behaviour. `gsd check tdd-red-evidence` was not run: Jest output is not a supported format, and no TAP or JUnit reporter is installed (package installs are not auto-fixable). This plan is `type: execute` and `workflow.tdd_mode` is off, so the gate is advisory.
- **GREEN:** `a4e8778` and `6161db3` each follow their RED commit. Full Jest: 99 suites, 1,605 tests passed.

## Files Created/Modified

- `components/site/ErrorBody.tsx`: the text block in EdgeLayout, plus the Report this error link per variant
- `components/site/__tests__/ErrorBody.test.tsx`: art sheet, Report link per variant (next/link mocked to tell router links from plain anchors), Try again once per press with no pending UI, a failing retry re-renders the same body, plus the section boundary still shows no exception text
- `app/global-error.tsx`: doc comment only
- `components/__tests__/global-error.test.tsx`: art sheet in main, plain /contact anchor with next/link never called, h1 focused on mount; every earlier assertion kept, the "secret never rendered" ones included
- `app/(site)/offline/page.tsx`: the Server Component page
- `components/site/OfflineRetry.tsx`, `components/site/SavedPages.tsx`: the two client islands
- `components/site/__tests__/OfflineRetry.test.tsx`, `components/site/__tests__/SavedPages.test.tsx`: island tests with Cache Storage stubbed
- `lib/saved-pages.ts`, `lib/__tests__/saved-pages.test.ts`: the catalog and the row mapper (data-driven, no literal slugs)
- `e2e/offline.spec.ts`: 6 tests (head, layout, empty, seeded cache, unsupported, 375 px)

## Decisions Made

See `key-decisions` in the frontmatter. All copy comes from supplied rows of the 12-01 `## Resolved values` table (copy.error-report, copy.offline-h1, -body, -h2, -empty, -unsupported). The locked strings ("Error", "Something went wrong", the 07 bodies, "Try again", "Offline", "Checking saved pages…") come from 12-UI-SPEC.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Performance] `savedPageRows` takes the catalog as an argument**
- **Found during:** Task 2
- **Issue:** the plan's single-argument `savedPageRows(urls)` would import `lib/photos/view-model` (which pulls in the image manifest, terrain, waypoints and editorial data) and `data/projects` into the `/offline` client bundle. The SW precaches that bundle for every visitor at install.
- **Fix:** `lib/saved-pages.ts` has no data imports. `savedPageCatalog({ nav, photos, projects })` runs on the server page, and `SavedPages` receives the resulting `catalog` (about 11 `{ href, title, label }` rows) and calls `savedPageRows(urls, catalog)`. Behaviour and order are exactly as planned. The key link `savedPageRows(` in SavedPages.tsx still holds.
- **Files modified:** lib/saved-pages.ts, components/site/SavedPages.tsx, app/(site)/offline/page.tsx
- **Committed in:** 6161db3

**2. [Rule 1 - Correctness] Query variants count only through their bare path**
- **Found during:** Task 2
- **Issue:** "query variants (normalised)" could be read as "list `/photos` when only `/photos?view=grid` is cached". The SW serves offline navigations with `caches.match(request)`, which is an exact-URL match, so that link would fail and show `/offline` again. That breaks "only pages this device can open".
- **Fix:** a cached URL with a search string never makes a row on its own. Next to its bare path it collapses into that one row, so the plan's test case (`/roadmap` + `/roadmap?view=1`) gives one Roadmap row. `_rsc` entries drop the same way.
- **Committed in:** 6161db3

**3. [Rule 1 - Test] WebKit loses seeded cache entries on a reload of the same page**
- **Found during:** plan-level verification (webkit only)
- **Issue:** after `cache.put` and `page.reload()`, WebKit still listed the cache name but had no entries, so the list showed the empty sentence. A probe (`wk-probe.cjs` and `wk-probe2.cjs` in the scratchpad) reproduced this with service workers blocked and allowed, after a 2 s delay, with `goto` instead of reload, and with a Blob body. A second page of the same context saw the entry.
- **Fix:** the test seeds Cache Storage from the first page and reads the list from `context.newPage()`. It passes on all three engines. This is a quirk of Playwright's ephemeral WebKit session, not an app defect: real Safari keeps Cache Storage, and in production the worker writes the cache.
- **Files modified:** e2e/offline.spec.ts
- **Committed in:** 3cd9fe2

**4. [Scope] OfflineRetry got its own test file**
- `components/site/__tests__/OfflineRetry.test.tsx` is new and not in `files_modified`. The behaviour list names OfflineRetry cases, and a separate file keeps SavedPages.test.tsx about one component.

**5. [TDD hygiene] Task 2 RED carried export-only skeletons** (see TDD above).

---

**Total deviations:** 3 auto-fixed (1 Rule 2, 2 Rule 1), plus 1 scope note and 1 TDD hygiene note.
**Impact on plan:** no change to scope or visible behaviour. The fixes keep the client bundle small and the list truthful.

## Verification

- `npm run lint` (eslint and every guard): exit 0. `npm run type-check`: exit 0. `npx jest --silent`: 99 suites, 1,605 tests passed. This includes the SW harness (`service-worker-navigation`, which covers the /offline install precache) and `data/__tests__/precache.test.ts`.
- Per task, against one reused production server: `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/no-webgl.spec.ts --project=chromium` passed 4 of 4 (Task 1), and `e2e/offline.spec.ts --project=chromium` passed 6 of 6 (Task 2).
- Plan level, fresh build: `PW_PROD=1 npx playwright test e2e/offline.spec.ts e2e/shell.spec.ts e2e/no-webgl.spec.ts --project=chromium --project=firefox --project=webkit` gave 119 passed and 10 failed.
  - 9 failures are the pre-existing webkit `shell.spec` Tab-focus cases: "Shell landmarks" (8 routes, /offline among them) and "Shell mobile menu" (1). Each times out on `toBeFocused()` after a Tab, because WebKit on Windows does not Tab-focus links by default. 12-02 and 12-12 recorded the same 9, and 12-23 owns them.
  - The 10th was the webkit seeded-cache case, fixed in `3cd9fe2` (deviation 3). After the fix, `e2e/offline.spec.ts` passed 18 of 18 on chromium, firefox and webkit against the same fresh build. `e2e/not-found.spec.ts` and `e2e/seo.spec.ts` passed 22 of 22 on chromium, so the shared EdgeLayout and the `/offline` sitemap and robots rules hold.
- Acceptance: `grep -c "<EdgeLayout" components/site/ErrorBody.tsx` = 1; "Something went wrong" = 1; `head -1` of the offline page shows no client directive; `index: false` = 1; `test(` blocks in e2e/offline.spec.ts = 6; `git status --porcelain public/service-worker.js` is empty (restored after every server stopped). Port 3000 is free.
- Not exercised: the error pages are not visited live (no route throws on demand). Their markup and behaviour are covered by the Jest tests above.

## Round 2 expected visual diffs (for 12-19)

These snapshots change on purpose: `e2e/visual/routes.spec.ts-snapshots/offline/375-reduced-visual-dark-linux.png`, `768-reduced-visual-dark-linux.png` and `1440-reduced-visual-dark-linux.png`. They now show the edge layout, kicker, Tim's h1 and body, Try again, the contour sheet and the "Saved on this device" section. In a fresh context the section shows the empty sentence once Cache Storage is read. The page is taller at 375 and 768. The error and global-error pages have no visual snapshot. No PNG was touched.

## Issues Encountered

- Observation (logged in `deferred-items.md` for 12-17): the hero contour asset behind EdgeArt is not in the SW install precache. A visitor who opens `/offline` offline before any page has fetched that asset sees the sheet without contours. The trail, the dot and the layout are unaffected; this is the documented EdgeArt fallback.

## Known Stubs

None.

## Threat Flags

None. No new endpoint or trust boundary. T-12-29: the error is never passed to the body, and the tests assert the message and digest are absent. T-12-30: rows come only from the data catalog, matched by exact path; query strings and unknown paths are never rendered.

## User Setup Required

None.

## Next Phase Readiness

- 12-17 (SW spec) can assert the offline page served from the cache: the Schibsted h1 and the saved-pages list populated by the real worker. It can also decide on precaching the hero contour (deferred item).
- 12-19 must re-baseline the three offline shots listed above (Tim-gated).
- 12-21 keyboard spec: on the error pages the action row order is Try again, Go to the homepage (or Reload page), Report this error. On /offline it is Try again, then the saved-page rows.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*

## Self-Check: PASSED

- All 7 created files exist; commits 2dfeb22, a4e8778, 79da4ba, 6161db3 and 3cd9fe2 are ancestors of HEAD.
