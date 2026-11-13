---
phase: 13-repo-safety-test-debt
plan: 03
subsystem: testing
tags: [playwright, axe, audit-gate, sitemap, jest, verify-05]

requires:
  - phase: 12
    provides: app/sitemap.ts (nav, photoSlugs, projects in order) and the D-20 audit gate in e2e/audit.spec.ts
provides:
  - e2e/routes.ts SITEMAP_PATHS (sitemap URLs as exact paths) and AUDIT_SWEEP (sitemap paths that are not ROUTES entries)
  - ROUTES photo template entry by the named slug matterhorn-from-zermatt, throwing if it disappears
  - one @chromium-only sweep test auditing every AUDIT_SWEEP path at 1440
  - lib/__tests__/audit-routes.test.ts tying every page template and every sitemap path to the audit
affects: [phase-16 new photos, phase-17 region pages (REGION-07), 13-15 mid-phase PR three-engine run]

actuals:
  tokens: 2312
  tasks: 2
  commits: 2
plan_head_before: 7e4b705be79e56d52fcb5192fe4875f83622455e
plan_head_after: 349b34312faf2cec469e7706f255daed73df8636

tech-stack:
  added: []
  patterns:
    - "Audit routes from site data: templates in ROUTES (three engines x three widths), every other sitemap page once in a Chromium sweep"
    - "Template coverage by file walk: app/(site)/**/page.tsx outside @-segments must match a ROUTES path"

key-files:
  created:
    - lib/__tests__/audit-routes.test.ts
  modified:
    - e2e/routes.ts
    - e2e/audit.spec.ts

key-decisions:
  - "13-03: AUDIT_SWEEP is a plain filter of SITEMAP_PATHS (no dedupe), so a duplicated sitemap entry fails the jest test instead of being hidden"
  - "13-03: SITEMAP_PATHS throws if a sitemap URL is not on site.url, so a foreign or mistyped origin cannot become a wrong path"
  - "13-03: the sweep is its own describe ('Audit: every sitemap page (VERIFY-05)') beside the D-20 describe; one test, so the ratchet counts it once"

patterns-established:
  - "New page template: add one ROUTES representative or audit-routes.test.ts fails naming the page.tsx"
  - "New photo or region page: joins AUDIT_SWEEP through app/sitemap.ts with no edit to the e2e files"

requirements-completed: [VERIFY-05]

coverage:
  - id: D1
    description: "Every sitemap page not in ROUTES (coin-flip, photo slugs 2-4) passes the full audit once in Chromium at 1440 on the production build"
    requirement: VERIFY-05
    verification:
      - kind: e2e
        ref: "e2e/audit.spec.ts#every sitemap page once in Chromium @chromium-only (PW_PROD=1, --project=chromium)"
        status: pass
      - kind: other
        ref: "PW_PROD=1 npx playwright test --list --project=chromium --project=firefox --project=webkit -g 'every sitemap page' (lists [chromium] only)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The photo template entry is the named slug matterhorn-from-zermatt; adding photos cannot shift it"
    requirement: VERIFY-05
    verification:
      - kind: unit
        ref: "lib/__tests__/audit-routes.test.ts#covers /projects/coin-flip and every photo slug"
        status: pass
    human_judgment: false
  - id: D3
    description: "A page template with no ROUTES entry fails a jest test that names its page.tsx; sitemap paths are covered, disjoint, ordered, deduplicated and exactly encoded"
    requirement: VERIFY-05
    verification:
      - kind: unit
        ref: "lib/__tests__/audit-routes.test.ts (9 tests)"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 03: Audit Routes From Site Data Summary

**The audit gate now takes its pages from app/sitemap.ts: templates keep their three-engine, three-width run through a named-slug ROUTES list, and coin-flip plus photo slugs 2-4 (and later every region page) pass the full audit once in a single Chromium sweep test, with a jest test that fails on any page template missing from ROUTES.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-11-13T10:38:07Z
- **Completed:** 2026-11-13T10:42:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `e2e/routes.ts`: the photo template entry is `photoBySlug('matterhorn-from-zermatt')`, throwing an error naming the slug if it is gone; `SITEMAP_PATHS` and `AUDIT_SWEEP` added with REGION-07 doc comments; the `buildPhotoViews` import is dropped from routes.ts (audit.spec.ts keeps its own).
- `e2e/audit.spec.ts`: one test, `every sitemap page once in Chromium @chromium-only`, loops `AUDIT_SWEEP` at 1440 with the same probes, status check and `audit()` as the per-route test, into one `expectClean`. Today's sweep: `/photos/<slugs 2-4>` and `/projects/coin-flip`. It passed on a local production build twice (once before the commit, once after as the tracer gate) with no findings, so no page fix was needed.
- `lib/__tests__/audit-routes.test.ts`: 9 tests, one per `<behavior>` line (template coverage plus a sanity count, sitemap ⊆ ROUTES ∪ sweep, disjointness, coin-flip and every photo slug, ≥ 9 paths and a non-empty sweep, no duplicates and sitemap order, exact encoding).

## Task Commits

1. **Task 1: Sitemap-derived sweep audited end to end in Chromium** - `6b5182b` (feat)
2. **Task 2: Jest coverage test for templates and sitemap paths** - `349b343` (test)

**Plan metadata:** the docs commit that adds this SUMMARY

## Files Created/Modified

- `e2e/routes.ts` - named photo template slug, `SITEMAP_PATHS`, `AUDIT_SWEEP`
- `e2e/audit.spec.ts` - the sweep test in its own `Audit: every sitemap page (VERIFY-05)` describe
- `lib/__tests__/audit-routes.test.ts` - template and sitemap coverage tests

## Verification Results

| Check | Result |
|-------|--------|
| `PW_PROD=1 npx playwright test e2e/audit.spec.ts --project=chromium -g "every sitemap page"` | 1 passed (run before and after the Task 1 commit) |
| `--list` across chromium, firefox, webkit | one line, `[chromium]` only |
| `grep -c "buildPhotoViews()\[0\]" e2e/routes.ts` | 0 (HEAD: 1) |
| `grep -c AUDIT_SWEEP e2e/audit.spec.ts` | 2 |
| `grep -c ALLOWED_CONSOLE e2e/audit.spec.ts` | 2 before, 2 after (no new exemption) |
| `npx jest lib/__tests__/audit-routes.test.ts` | 9 passed |
| `npm test` | 104 suites, 1732 tests passed (floor in test-count.baseline.json is 1694 jest) |
| eslint and prettier on the three files | clean |

The three-engine CI run of the sweep (it lists in Chromium only, by design) and the template tests happens on the mid-phase PR (13-15).

### Seeded fault (Task 2)

With `['/offline', null]` removed from ROUTES, `npx jest lib/__tests__/audit-routes.test.ts` exits 1 with `1 failed, 8 passed`. The only failure is `every page template has a ROUTES entry (VERIFY-05) › maps every app/(site) page.tsx outside @-segments to a ROUTES path`, received `["app/(site)/offline/page.tsx"]` against `[]`. `e2e/routes.ts` was restored with `git checkout -- e2e/routes.ts` and the suite passes again.

## TDD Gate Compliance

Task 2 is `tdd="true"`, but the behaviour it tests was built by the Task 1 tracer, which the plan orders first. So the `feat(13-03)` commit (`6b5182b`) comes before the `test(13-03)` commit (`349b343`), and no GREEN commit descends from the RED commit. The end-of-phase TDD review will report this plan as `green_before_red`. That is the order the plan prescribes; no implementation was held back to manufacture a RED.

- **RED:** the new test file passed 9/9 against the committed implementation (an expected GREEN, because Task 1 had already shipped the feature). RED evidence came from the plan's seeded fault (above): the target test failed on its own assertion, naming the uncovered template, for the intended reason. The other 8 tests passed, with no load, syntax or fixture errors.
- **Classifier:** `gsd_run check tdd-red-evidence` returned `INVALID_RED / invalid_record` ("Unsupported report format"). Jest's console report has no adapter, and no TAP or JUnit reporter is installed in this repo. Installing one is a package install, which executors may not do. The semantic assessment above is manual and is not a classifier verdict.
- **GREEN:** `6b5182b` (Task 1). **REFACTOR:** none.

## Decisions Made

- `AUDIT_SWEEP` is a plain filter with no dedupe. A duplicated sitemap entry then fails the jest duplicate test instead of being hidden.
- `SITEMAP_PATHS` throws when a sitemap URL is not on `site.url`. Slicing a foreign origin would otherwise produce a wrong path silently.
- The sweep test has its own describe beside the D-20 describe, so its title reads as one gate entry and the ratchet counts it once.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Guard on the sitemap origin in SITEMAP_PATHS**
- **Found during:** Task 1
- **Issue:** the pattern sliced `site.url.length` characters off every URL without checking the prefix. A URL on another origin would turn into a garbage path, and the sweep would audit the wrong page or 404.
- **Fix:** throw an error naming the URL when it does not start with `site.url`.
- **Files modified:** e2e/routes.ts
- **Verification:** the jest encoding tests and the Chromium sweep pass
- **Committed in:** 6b5182b

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** a small guard, no scope change.

## Issues Encountered

- `next build` (run by Playwright's webServer under PW_PROD) rewrites `public/service-worker.js` with the build hash and precache list in postbuild. That generated change was restored with `git checkout -- public/service-worker.js` after each run and never committed. Playwright stopped its own `next start`, and port 3000 was confirmed down after both runs.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 16 photos and Phase 17 region pages (REGION-07) join the sweep through `app/sitemap.ts`. A new region page template must also get a ROUTES entry, or `audit-routes.test.ts` fails.
- The 13-15 mid-phase PR is where the sweep and the template tests first run in CI, in all three engines.

## Self-Check: PASSED

- FOUND: e2e/routes.ts, e2e/audit.spec.ts, lib/__tests__/audit-routes.test.ts
- FOUND: 6b5182b, 349b343 (both ancestors of HEAD; `git rev-list --count 7e4b705..349b343` = 2)
- Acceptance criteria for both tasks re-run: all pass (table above)

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
