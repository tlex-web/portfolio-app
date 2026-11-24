---
phase: 17-region-routes-seo-structured-data
plan: 14
subsystem: seo
tags: [json-ld, schema-dts, structured-data, image-gallery, software-source-code, playwright, jest]
status: complete

requires:
  - phase: 17-region-routes-seo-structured-data
    provides: "17-01 region model and Tim's D-14 reply (case-study option a); 17-03 jsonLdHtml, siteRights, siteGraph, keysDeep/blocksOf; 17-10 sitemap with region pages; 17-13 photoImageId, personRef, photoImageLd"
provides:
  - "regionGalleryLd(id): the ImageGallery on every region page"
  - "projectLd(project) and caseStudyRights(slug): the project block on every case study"
  - "e2e/seo.spec.ts rendered JSON-LD @type contract over every sitemap page plus /offline, the lightbox row and the copyright equalities"
affects: [17-15, 18, seo, structured-data]

actuals:
  tokens: 8501     # chars/4 over the realized diff (34,003 chars, 5 files)
  tasks: 2
  commits: 3       # MEASURED: git rev-list --count 2cbb60c..HEAD at SUMMARY write
plan_head_before: 2cbb60cecf2d8ef3490f95dfe8e8f497c7a122d6
plan_head_after: b28f12e74f0c048fedb15eb13ccedf645e17ef20

tech-stack:
  added: []
  patterns:
    - "Page-level JSON-LD as a native ld+json script first in a fragment ahead of the page's content, so no element's :first-child or layout changes"
    - "The project's schema type follows its data: a public links.github makes it SoftwareSourceCode, none makes it SoftwareApplication"

key-files:
  created: []
  modified:
    - lib/json-ld.ts
    - lib/__tests__/json-ld.test.ts
    - "app/(site)/photos/regions/[region]/page.tsx"
    - "app/(site)/projects/[slug]/page.tsx"
    - e2e/seo.spec.ts

key-decisions:
  - "Case-study copyrightNotice ships option (a), per Tim's 17-01 reply \"(a) Footer line (Recommended)\": caseStudyRights(slug) returns siteRights(), the footer line '© {current year} Tim Lui. All rights reserved.'"
  - "The region ImageGallery's contentLocation is a Place named region.name with PostalAddress.addressCountry (the registry's ISO code). It has no geo because the stand-in page prints no coordinates"
  - "No BreadcrumbList anywhere: it waits for Phase 18's visible breadcrumb (RESEARCH Open Question 6)"

patterns-established:
  - "17-14 per-node rule (unit): every top-level node of every block built in lib/json-ld.ts that lacks creator, copyrightNotice or creditText must be the site graph's Person"

requirements-completed: [SEO-04]

coverage:
  - id: D1
    description: "Every region page's ImageGallery: page URL @id/url, printed heading, approved description, Place + addressCountry with no geo, hasPart = the photos' #image @ids in link order, creator, creditText site.name, copyrightNotice = regionRights(id)"
    requirement: SEO-04
    verification:
      - kind: unit
        ref: "lib/__tests__/json-ld.test.ts#regionGalleryLd: the ImageGallery on every region page"
        status: pass
    human_judgment: false
  - id: D2
    description: "box is SoftwareSourceCode with codeRepository = links.github; coin-flip is SoftwareApplication with no codeRepository key and no github.com text; both have name, pitch, URL, creator, creditText and caseStudyRights = siteRights()"
    requirement: SEO-04
    verification:
      - kind: unit
        ref: "lib/__tests__/json-ld.test.ts#projectLd: the project on every case study; caseStudyRights: Tim's 17-01 option (a)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every sitemap page plus /offline: all ld+json blocks parse and hold exactly the expected @types; the per-node rule holds on every flattened node"
    requirement: SEO-04
    verification:
      - kind: e2e
        ref: "e2e/seo.spec.ts#every page carries exactly its JSON-LD types @chromium-only (PW_PROD=1)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Opening the lightbox by soft navigation adds no JSON-LD block and no ImageObject"
    requirement: SEO-04
    verification:
      - kind: e2e
        ref: "e2e/seo.spec.ts#the lightbox adds no JSON-LD @chromium-only (PW_PROD=1)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The WebSite and box copyrightNotice equal the footer paragraph's text, and the zermatt gallery's equals the page's rights paragraph, by exact string equality in the browser"
    requirement: SEO-04
    verification:
      - kind: e2e
        ref: "e2e/seo.spec.ts#copyright notices equal the printed rights text @chromium-only (PW_PROD=1)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The new blocks raise no CSP, axe, CLS or console fault on /photos/regions/zermatt and /projects/box in Chromium and Firefox"
    requirement: SEO-04
    verification:
      - kind: e2e
        ref: "e2e/audit.spec.ts#/photos/regions/zermatt: axe, CLS, links, images, CSP, console; /projects/box: same (chromium + firefox)"
        status: pass
    human_judgment: false

duration: 9 min
completed: 2026-11-24
---

# Phase 17 Plan 14: Region ImageGallery, Case-Study Project Blocks and the Rendered JSON-LD Contract Summary

**Each region page now carries an ImageGallery and each case study a SoftwareSourceCode (box) or SoftwareApplication (coin-flip) block. Every copyrightNotice matches the rights text the page prints. A browser contract over all sitemap pages plus /offline checks the exact @types, the per-node rights rule, and that the lightbox adds no block.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-11-24T01:17:25Z
- **Completed:** 2026-11-24T01:26:41Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `regionGalleryLd(id)` in `lib/json-ld.ts` builds the gallery from the page's own data:
  - `@id` and `url` are `site.url + regionHref(id)`, and `name` is `regionHeading`.
  - `description` is the approved `regionDescription`, the text the page's meta description carries.
  - `contentLocation` is a `Place` named for the region, with `PostalAddress.addressCountry`.
  - `hasPart` lists `{ '@id': photoImageId(slug) }` in `regionPhotoViews` order, which is the order the page links the photos.
  - `creator` is `personRef()`, `creditText` is `site.name`, and `copyrightNotice` is `regionRights(id)`.
- `projectLd(project)`:
  - box (it has `links`) is `SoftwareSourceCode` with `codeRepository` set to its GitHub URL.
  - coin-flip is `SoftwareApplication` with no repository key at all (T-17-29).
  - Both carry `name`, `description` (the pitch), `url`, `creator`, `creditText` and `copyrightNotice: caseStudyRights(slug)`.
- `caseStudyRights(slug)` implements Tim's option (a): it returns `siteRights()`.
- Both pages render the block through `jsonLdHtml` as a native `<script type="application/ld+json">` with no nonce. It sits first in a fragment ahead of the existing markup.
- `e2e/seo.spec.ts` gains three `@chromium-only` rows: the exact @type contract plus the per-node rule, the lightbox row, and the copyright equalities.

## Case-study copyright option shipped

**Option (a): the footer line.** Tim's 17-01 reply selected the literal label **"(a) Footer line (Recommended)"**. `caseStudyRights(slug)` returns `siteRights()`, i.e. `© {new Date().getFullYear()} Tim Lui. All rights reserved.`. That is the same expression SiteFooter renders in the same static render. In the browser, the box block's notice equals the footer paragraph's `textContent` exactly. No `CASE_STUDY_YEAR` record exists, because option (b) was not chosen.

## Task Commits

1. **Task 1: ImageGallery on region pages and the project blocks on case studies** (TDD)
   - `e538bb3` (test, RED): region and project block contracts, the per-node rule, no BreadcrumbList, page source rules
   - `da24425` (feat, GREEN): the builders, the two page scripts, and the statement-based schema-dts import guard
2. **Task 2: The rendered JSON-LD contract, the lightbox, the copyright equalities**: `b28f12e` (test)

## TDD Gate Compliance

- **First RED attempt was invalid. It was not committed.** The per-node describe block built its rows at collection time. The missing `regionGalleryLd` therefore threw while Jest collected the suite (`Tests: 0 total`), a load fault. The rows were changed to build each block inside the test body.
- **RED (`e538bb3`):** `npx jest lib/__tests__/json-ld.test.ts` exited 1: 42 failed, 126 passed of 168.
  - Every failing row is a new 17-14 target row. Each failed inside its own test body on the missing builder: `regionGalleryLd`, `projectLd` or `caseStudyRights` "is not a function", or `toThrow(RangeError)` received a TypeError. The two page source rows failed on `Expected substring: "type=\"application/ld+json\""`.
  - The new rows that passed did so for a stated reason. They are guards that held before the change (no BreadcrumbList in `lib/json-ld.ts`, no ld+json in the @modal region page) or "runs over" counts.
- **Semantic assessment:** each target row ran and failed because the planned behaviour was missing. None failed on a collection, syntax or import fault.
  - Jest's default reporter is not a format `tdd-red-evidence` accepts, so the classifier was not run (as in 17-03, 17-05 and 17-13).
  - The raw output is in the git-ignored `.gsd/tdd-evidence/17-14/red-t1.txt`.
- **GREEN (`da24425`):** the json-ld, regions and client-graph suites pass, 220 of 220.
- Gate order: `test(17-14)` e538bb3 comes before `feat(17-14)` da24425, and GREEN descends from RED. No REFACTOR commit was needed.

## Files Created/Modified

- `lib/json-ld.ts`: `regionGalleryLd`, `caseStudyRights`, `projectLd`, and the module doc for 17-14
- `lib/__tests__/json-ld.test.ts`: the region, project, caseStudyRights, per-node, disclosure and page-source rows, plus the statement-based import-type guard
- `app/(site)/photos/regions/[region]/page.tsx`: the ImageGallery data block
- `app/(site)/projects/[slug]/page.tsx`: the project data block
- `e2e/seo.spec.ts`: the rendered JSON-LD contract

## Decisions Made

- `contentLocation.name` is `region.name` (for example "Zermatt"), and the country comes from `addressCountry` (the registry's ISO code, such as `CH`). The heading's country name is already in `name`.
- The e2e type contract derives the project type from the data (`'links' in project`), not from an either/or. It therefore pins box to SoftwareSourceCode and coin-flip to SoftwareApplication exactly.
- The lightbox row opens the first tile of `/photos?view=grid`, the grid the lightbox spec uses. A window marker proves the click was a soft navigation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The schema-dts import-type guard matched one line only**
- **Found during:** Task 1 GREEN
- **Issue:** Five more schema-dts types made prettier wrap the `import type { ... } from 'schema-dts'` list over several lines. The 17-03 guard looked for `^import type .*from 'schema-dts'` on a single line, so it failed even though the import is still type-only.
- **Fix:** The guard now reads whole import statements. At least one schema-dts statement must exist, and every schema-dts statement must start with `import type`. The old per-line "no value import" check is kept.
- **Verification:** Mutation check: changing `import type {` to `import {` makes the row fail (1 failed). With the line restored it passes.
- **Files modified:** lib/__tests__/json-ld.test.ts
- **Commit:** da24425

---

**Total deviations:** 1 auto-fixed (Rule 3).
**Impact:** The guard is now stricter about wrapped imports and keeps its D-21 intent. No scope change.

## Verification

- `npx jest lib/__tests__/json-ld.test.ts lib/__tests__/regions.test.ts lib/__tests__/client-graph.test.ts`: 3 suites, **220 passed**
- Full `npx jest`: 119 suites, **2,365 passed**
- `npm run type-check`: exit 0. `npm run lint`: exit 0
- `PW_PROD=1 npx playwright test e2e/seo.spec.ts e2e/audit.spec.ts -g "(seo.spec|/photos/regions/zermatt: axe|/projects/box: axe)" --project=chromium --project=firefox`: **38 passed**, 0 failed, 0 flaky
  - This includes the three new rows and both audits in both engines, so the new blocks cause no CSP violation.
  - `public/service-worker.js` was restored afterwards.
- `npx playwright test e2e/seo.spec.ts --project=chromium --list | grep -cE "..."`: **3**
- Acceptance greps:
  - `jsonLdHtml` appears 2 times in each page (at least 1 required).
  - `BreadcrumbList` appears 0 times in `lib/json-ld.ts`.
  - `ld+json` appears 3 times in `e2e/seo.spec.ts`.
- `node scripts/ci/check-snapshot-commit.mjs --none`: OK (0 changed) after each of the three commits. No PNG was staged.
- Client JS (from the Playwright production build): `.next/static/chunks/**/*.js` total **1,851,755 B in 24 files**, unchanged and under the 1,855,781 B cap. No chunk contains `ImageGallery`, `SoftwareSourceCode`, `caseStudyRights` or `PostalAddress`.
- D-10 on the baselined case studies: the data block is a `<script>` (display: none). It sits ahead of `<article>` inside `<main>`, and no stylesheet selects `main > *` or a `first:` variant on that level. The audit's CLS check passed on /projects/box. The pixel baselines run in CI.

## Issues Encountered

- A Bash heredoc holding `<` in quoted strings failed in the shell wrapper ("unexpected EOF"). This is the same issue 17-13 hit. Nothing was written. The block was written with the Write tool to the scratchpad and appended from there.
- An attempted mutation-check one-liner included `git checkout -- lib/json-ld.ts` to restore the file. The auto-mode classifier denied it before anything ran, correctly, because it would have discarded the uncommitted GREEN work. The check was redone with two reversible `sed` edits.

## Known Stubs

None.

## Next Phase Readiness

- SEO-04 is complete end to end: site graph (17-03), photo ImageObject (17-13), region ImageGallery and case-study project blocks (17-14), all checked in the browser.
- Phase 18 can add BreadcrumbList when its visible breadcrumb ships. The e2e type contract will then need `BreadcrumbList` in the expected set for those paths.
- Ready for 17-15.

## Self-Check: PASSED

- FOUND: lib/json-ld.ts, lib/__tests__/json-ld.test.ts, app/(site)/photos/regions/[region]/page.tsx, app/(site)/projects/[slug]/page.tsx, e2e/seo.spec.ts
- FOUND: e538bb3, da24425, b28f12e (each an ancestor of HEAD)
- Acceptance criteria re-run: all pass

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-24*
