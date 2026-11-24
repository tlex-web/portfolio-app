---
phase: 17-region-routes-seo-structured-data
plan: 13
subsystem: seo
tags: [json-ld, schema-dts, structured-data, image-object, coordinates, privacy, jest, playwright]

requires:
  - phase: 17-region-routes-seo-structured-data
    provides: 17-03 jsonLdHtml, PERSON_ID, keysDeep/blocksOf; 17-05 published set and the v2.0 identity harness; 17-06/17-12 the photo page and viewer
  - phase: 16-new-regions-alps-overview-data
    provides: per-position precision ('4dp'/'3dp'/'2dp') and the 16-REVIEW IN-01 finding
provides:
  - roundedCoordinate(v, precision) and CoordinatePrecision in lib/home-format.ts (the strip's own rounding as a signed string)
  - formatCoordinates({ lat, lon, precision }) with no default precision (16 IN-01 closed, commit a56529c)
  - photoImageId(slug), personRef(), photoLdFacts(id), PhotoLdFacts and photoImageLd(view, facts?) in lib/json-ld.ts
  - one ImageObject JSON-LD block on every full photo page, inside SiteChrome's <main>; none in the intercepted @modal page
affects: [17-14, 17-15, seo, structured-data]

actuals:
  tokens: 5440     # chars/4 over the added lines of 5caff47..a3bea04 (21,760 chars)
  tasks: 2
  commits: 4       # MEASURED: git rev-list --count 5caff47..HEAD at SUMMARY write
plan_head_before: 5caff47b46e4c22f569bc6013ea6b6fe378e5262
plan_head_after: a3bea047e975d76b7ea395b7808e0d733f37acd8

tech-stack:
  added: []
  patterns:
    - "One precision-typed rounding: the strip (formatCoordinates) and the JSON-LD (roundedCoordinate) both read PRECISION_DECIMALS in lib/home-format.ts, so they cannot print different digits"
    - "JSON-LD coordinates are strings, never numbers, so a trailing zero the page prints survives"
    - "photoImageLd(view, facts = photoLdFacts(view.id)): the generated facts are an injectable second argument, so edge fixtures (no position, year-only capture) need no module mocks"

key-files:
  created: []
  modified:
    - lib/home-format.ts
    - lib/__tests__/home-format.test.ts
    - lib/photos/view-model.ts
    - lib/json-ld.ts
    - lib/__tests__/json-ld.test.ts
    - app/(site)/photos/[slug]/page.tsx

key-decisions:
  - "17-13 16 IN-01: formatCoordinates takes { lat, lon, precision } with no default; the decimals map moved from view-model.ts into home-format.ts (PRECISION_DECIMALS) and roundedCoordinate shares it. Fix commit a56529c"
  - "17-13 D-16: the ImageObject @id is site.url + photoHref(slug) + '#image' (costly to change; 17-14's gallery hasPart refers to it); creator is an inline Person with @id PERSON_ID, name and url"
  - "17-13: ImageObject width and height are QuantitativeValue { value, unitCode 'E37' (pixel) } from the 2560 px variant, because schema-dts types width/height as Distance (Text) or QuantitativeValue and a bare number does not type-check"
  - "17-13 D-19 / OQ3: dateCreated is capture.local to the minute plus the capture offset, or the year alone for a year-only capture; geo only when the generated position exists"

patterns-established:
  - "A JSON-LD text that the page also prints is tested by exact string equality against the view-model field the page renders (title, alt, rights, place, the strip's Position row)"

requirements-completed: [SEO-04, PHOTO-05]

coverage:
  - id: D1
    description: "roundedCoordinate and the precision-typed formatCoordinates (no default); every printed strip string unchanged"
    requirement: SEO-04
    verification:
      - kind: unit
        ref: "lib/__tests__/home-format.test.ts#roundedCoordinate (one precision-typed rounding for the strip and JSON-LD)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/home-format.test.ts#formatCoordinates has no default precision (ts-expect-error, npm run type-check)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/photos-view-model.test.ts + components/photos/__tests__/strip.test.tsx (untouched, pass)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every published photo's ImageObject: page URL @id/url/mainEntityOfPage, 2560 px WebP contentUrl and size, name/caption/copyrightNotice equal to the printed title/alt/rights, creditText = creator.name = site.name, no license/acquireLicensePage/elevation"
    requirement: SEO-04
    verification:
      - kind: unit
        ref: "lib/__tests__/json-ld.test.ts#photoImageLd: the ImageObject on every photo page (SEO-04; D-16, D-17, D-18)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Coordinates are strings at exactly the position's precision and equal the strip Position digits; no stored coordinate finer than the precision is serialized; dateCreated minute+offset or year"
    requirement: SEO-04
    verification:
      - kind: unit
        ref: "lib/__tests__/json-ld.test.ts#photoImageLd location: never finer than the page (D-19, T-17-25)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/json-ld.test.ts#photoImageLd dateCreated: no finer than the capture label"
        status: pass
      - kind: other
        ref: "scratchpad/live-ld-1713.mjs on next start -p 3017 (a3bea04): live-ld: pages=11 bad=0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The full photo page renders exactly one ImageObject inside <main> (plus the site graph outside it), with no nonce and no CSP violation; the @modal page has none"
    requirement: PHOTO-05
    verification:
      - kind: unit
        ref: "lib/__tests__/json-ld.test.ts#photo page source rules (D-16, anti-pattern 9)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts e2e/photos-region.spec.ts e2e/audit.spec.ts -g \"(photos-lightbox|photos-region|/photos/matterhorn-from-zermatt: axe)\" --project=chromium --project=firefox (158 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "v2.0 identity: the four equal the phase base on all 36 compared fields, with one ld+json block stripped from each <main>"
    requirement: PHOTO-05
    verification:
      - kind: other
        ref: "node v20-identity.mjs http://localhost:3017 v20-base.json -> exit=0 differing=0 compared=36 removed=1,1,1,1"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-11-24
status: complete
---

# Phase 17 Plan 13: Photo ImageObject JSON-LD and Precision-typed Coordinates Summary

**Every full photo page now carries one ImageObject JSON-LD block. Its title, alt text, rights line, place and coordinates are character-for-character what the page prints. The coordinates go through the strip's own rounding (the new `roundedCoordinate`), at the position's precision and as strings, so the block is never more precise than the page. 16 IN-01 is closed: `formatCoordinates` now takes `{ lat, lon, precision }` with no default.**

## Performance

- **Duration:** about 13 min
- **Started:** 2026-11-24T01:00:26Z
- **Completed:** 2026-11-24T01:13Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `lib/home-format.ts`:
  - `roundedCoordinate(v, precision)` returns the signed, half-up decimal string the strip prints.
  - `formatCoordinates({ lat, lon, precision })` has no default precision, so a coarse position can never be padded to four decimals (16 IN-01).
  - Both read one `PRECISION_DECIMALS` map. The view-model's own `DECIMALS` map is gone; the strip passes the position as is.
- `lib/json-ld.ts`:
  - `photoImageId(slug)` and `personRef()` (an inline Person carrying `@id`, name and url).
  - `photoLdFacts(id)` returns the generated capture and position, and throws a RangeError for an unknown id.
  - `photoImageLd(view, facts?)` builds the block: `@id` is the page URL plus `#image`; `url` and `mainEntityOfPage` are the page URL; `contentUrl` and the size come from the 2560 px WebP derivative. `name`, `caption` and `copyrightNotice` are `view.title`, `view.alt` and `view.rights`; `creditText` is `site.name`. `dateCreated` is the minute plus the capture's offset, or the year alone. `contentLocation` is a Place with GeoCoordinates strings, and has no geo when the photo has no position.
- `app/(site)/photos/[slug]/page.tsx` renders `<script type="application/ld+json">` with `jsonLdHtml(photoImageLd(view))` next to PhotoViewer. The intercepted `@modal` page is untouched and has no JSON-LD.
- 72 new data-derived Jest rows in `json-ld.test.ts`, and the `home-format` rows rewritten to the precision-typed API.

## v2.0 identity (after 17-13)

On this tree (HEAD a3bea04): build `rm -rf .next/static && npm run build`, then `git restore public/service-worker.js`. Server: `node node_modules/next/dist/bin/next start -p 3017`. Command: `node <scratchpad>/v20-identity.mjs http://localhost:3017 <scratchpad>/v20-base.json`. The harness and base files matched 17-05's recorded SHA-256 (`b722b565…` and `be3ad3b8…`), so they were used as they were. Complete stdout, verbatim:

```text
v20-identity: exit=0 differing=0 compared=36 removed=1,1,1,1 base=51b7f4d9b291 head=a3bea047e975
```

Exit code: 0. Stderr was empty.

| Field | matterhorn-from-zermatt | gornerschlucht-waterfall | matterhorn-glacier-trail | riffelsee-reflection |
|---|---|---|---|---|
| status | identical | identical | identical | identical |
| title | identical | identical | identical | identical |
| headSha256 | identical | identical | identical | identical |
| ogImage | identical | identical | identical | identical |
| ogStatus | identical | identical | identical | identical |
| ogContentType | identical | identical | identical | identical |
| ogSha256 | identical | identical | identical | identical |
| mainSha256 | identical | identical | identical | identical |
| htmlSha256 | identical | identical | identical | identical |
| ldJsonRemoved (recorded, not compared) | 1 | 1 | 1 | 1 |

The ld+json strip has now run on the real block. Each of the four `<main>` elements held exactly one block (the new ImageObject), and once it was stripped, `<main>` hashed identically to the phase base. So the block landed inside SiteChrome's `<main id="main-content">`, it is not duplicated, and the strip's printed Position text inside `<main>` is unchanged by the IN-01 rounding change.

## Live check (production build, a3bea04)

`<scratchpad>/live-ld-1713.mjs` reads every photo URL from `/sitemap.xml` (11 pages). On each page it checks:

- status 200;
- exactly 2 ld+json blocks: the site graph and one ImageObject inside `<main>`;
- the `@id` is the page URL plus `#image`;
- no nonce on either block;
- the rights line, title and place appear in the visible text;
- the geo pair, joined with U+00A0 and hemisphere letters, appears in the visible text, which proves it equals the printed Position.

Result: `live-ld: pages=11 bad=0`. Decimal counts per page (latitude/longitude) were 3/3 on the four Saalfelden photos (3dp positions) and 4/4 on the seven Zermatt photos (4dp). dateCreated was minute+offset on ten pages and the year alone on the film scan. No coordinate value is recorded here (D-25).

## Client JS

`rm -rf .next/static && npm run build`, byte-sum of `.next/static/chunks/**/*.js`: **1,851,755 B in 24 files**. That is unchanged from 17-12, and the cap is 1,855,781 B. No chunk contains `photoImageLd`, `QuantitativeValue` or `#image`. The JSON-LD is server-rendered, schema-dts is imported with `import type` only, and the unused `roundedCoordinate` export is tree-shaken out of the client chunk that holds home-format.

## Task Commits

1. **Task 1: One precision-typed coordinate rounding for the strip and JSON-LD (16 IN-01, D-19)**
   - `228ccb0` (test, RED): formatCoordinates rows pass a precision, a no-default ts-expect-error row, roundedCoordinate rows
   - `a56529c` (fix, GREEN): **the 16 IN-01 commit for 17-15**. Adds roundedCoordinate, the precision-typed formatCoordinates, and the strip's call site
2. **Task 2: ImageObject JSON-LD on every photo page, equal to what the page prints**
   - `c29c78d` (test, RED): ImageObject contract over every published view, edge fixtures, page source rules
   - `a3bea04` (feat, GREEN): photoImageId, personRef, photoLdFacts, photoImageLd, and the full-page script

## TDD Gate Compliance

- **Task 1 RED (`228ccb0`):** `npx jest lib/__tests__/home-format.test.ts` exited 1: 13 failed, 38 passed of 51.
  - The three 3dp/2dp rows failed on their code-point assertions. With the old signature, the `precision` key in the object was ignored and the default of 4 padded each coarse half to four decimals. That is the IN-01 defect itself.
  - The ten roundedCoordinate rows failed with `roundedCoordinate is not a function` at the call inside the target test. The function did not exist yet; this was not a load or syntax fault, since the suite loaded and the 38 untouched rows passed.
- **Task 1 GREEN (`a56529c`):** home-format, photos-view-model and strip passed 104/104; `npm run type-check` exited 0, so the `@ts-expect-error` row proves a call without a precision does not compile.
- **Task 2 RED (`c29c78d`):** `npx jest lib/__tests__/json-ld.test.ts` exited 1: 93 failed, 29 passed of 122.
  - 89 failures were `photoImageLd is not a function` and 2 were `photoLdFacts is not a function`, each at the call inside the target row.
  - The full-page source row failed on `Expected substring: "type=\"application/ld+json\""`.
  - The unknown-id row failed on `Expected constructor: RangeError, Received constructor: TypeError`.
  - The 29 passes were the 25 rows from 17-03 plus four guard rows: the published set is non-empty, located photos exist, both capture kinds exist, and the @modal page has no JSON-LD (true before and after).
- **Task 2 GREEN (`a3bea04`):** json-ld, client-graph and photo-routes passed 204/204.
- **Semantic assessment:** every target row ran and failed on the missing behaviour, never on a load, collection or syntax fault. Jest's default reporter is not one of the formats `tdd-red-evidence` accepts, so the classifier was not run (as in 17-03 and 17-05). The raw outputs are in the git-ignored `.gsd/tdd-evidence/17-13/red-t1.txt` and `red-t2.txt`.
- Gate log: `test(17-13)` 228ccb0 precedes `fix(17-13)` a56529c, and `test(17-13)` c29c78d precedes `feat(17-13)` a3bea04 (each GREEN descends from its RED). No REFACTOR commit was needed.

## Files Created/Modified

- `lib/home-format.ts`: `CoordinatePrecision`, `PRECISION_DECIMALS`, `roundedCoordinate`, and the precision-typed `formatCoordinates` with updated docs
- `lib/__tests__/home-format.test.ts`: formatCoordinates rows on `{ lat, lon, precision }`, the no-default row, and the roundedCoordinate describe (synthetic values)
- `lib/photos/view-model.ts`: the `CoordinatePrecision` import, `DECIMALS` removed, and `formatCoordinates(position)`
- `lib/json-ld.ts`: `photoImageId`, `personRef`, `PhotoLdFacts`, `photoLdFacts`, `photoImageLd`, and the doc block for the 17-13 rule
- `lib/__tests__/json-ld.test.ts`: the photoImageLd describes (whole published set, location, dateCreated, edges) and the photo page source rules
- `app/(site)/photos/[slug]/page.tsx`: the JSON-LD script next to PhotoViewer, and its doc paragraph

## Decisions Made

- **width/height as QuantitativeValue (E37):** schema-dts types MediaObject width/height as `Distance` (Text) or `QuantitativeValue`. A `{ '@type': 'QuantitativeValue', value, unitCode: 'E37' }` pair carries the variant's exact pixel size and type-checks without a cast.
- **Facts as an injectable second argument:** `photoImageLd(view, facts = photoLdFacts(view.id))`. Every published photo has a position and nine have an EXIF time, so the "no position" and "no EXIF time" edges are tested with a real view plus overridden facts, not with module mocks.
- **Place name is `view.place`,** the same `w.place` the strip prints as its place line. The test asserts both are equal.
- **Script placement:** a fragment holding the script first, then the viewer. For the four, the props and markup of PhotoViewer are unchanged; the `back` branch only moved inside the fragment.
- I kept the four pre-existing "waypoint position" rows in `home-format.test.ts` (present since 09 IN-04) and only changed their call to pass `precision: '4dp'`. All new rows use synthetic values, and no new photo coordinate was typed into any test.

## Deviations from Plan

None that changed scope. Notes:
- The plan names `photoImageLd(view)`. The function also takes an optional second `facts` argument, defaulting to the generated data, so the plan's "fixture view with position null" can be expressed without mocking `data/generated/photos`. The call on the page is exactly `jsonLdHtml(photoImageLd(view))`.
- The plan says "width and height" without a schema form. I used QuantitativeValue in pixels (see Decisions).

**Total deviations:** 0 auto-fixed. **Impact on plan:** none.

## Issues Encountered

- Two Bash heredocs that held `<` inside quoted strings failed in the shell wrapper ("unexpected EOF while looking for matching `''"). Neither left a partial write: one heredoc never ran, and the other ran only after an Edit had already succeeded. Both edit scripts were rewritten with the Write tool into the scratchpad and run from there.
- Pre-existing and out of scope: the doc comment above `jsonLdHtml` in `lib/json-ld.ts` reads "escaped as < (D-16)". The intended `<` text was un-escaped in 17-03. Code behaviour is correct (17-03's escape tests). I left the comment as it was.
- Pre-existing and out of scope: `npx prettier --check` flags `lib/home-format.ts` and `lib/__tests__/home-format.test.ts` on lines that were already unformatted at 5caff47. Lint does not run prettier on them, and I did not reformat unrelated lines.

## Verification

- Jest, Task 1 verify (home-format, photos-view-model, strip): 104/104. Task 2 verify (json-ld, client-graph, photo-routes): 204/204. Full suite: **119 suites, 2,319 tests passed.**
- `npm run type-check` (three configs) exit 0. `npm run lint` (eslint and every guard, data:check, test-count scan) exit 0.
- `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts e2e/photos-region.spec.ts e2e/audit.spec.ts -g "(photos-lightbox|photos-region|/photos/matterhorn-from-zermatt: axe)" --project=chromium --project=firefox`: **158 passed**, 0 failed, 0 flaky. That includes `/photos/matterhorn-from-zermatt: axe, CLS, links, images, CSP, console` in both engines, so the page's new data block causes no CSP violation. `public/service-worker.js` was restored afterwards.
- `node scripts/ci/check-snapshot-commit.mjs --none`: `OK (0 changed)` after each of the four commits. No PNG was staged.
- Acceptance greps:
  - `decimals: 2 | 3 | 4` in home-format.ts: **0**
  - `export function roundedCoordinate`: **1**
  - `application/ld+json` in the `[slug]` page: **1**
  - `ld+json` in the `@modal` page: **0**
  - `photoImageLd` in lib/json-ld.ts: **3**
- No server is left on :3000 or :3017. The 3017 server was stopped by port, and Playwright's webServer exited with its run.

## Known Stubs

None.

## Threat Flags

None. The only new public surface is the planned JSON-LD block (T-17-25..27):
- T-17-25 is mitigated by `roundedCoordinate` at the position's precision, plus the per-photo digit and decimal-count tests and the "no stored coordinate finer than its precision" test.
- T-17-26 is mitigated by the no-`elevation` keysDeep test and minute- or year-precision `dateCreated`.
- T-17-27 is mitigated by `jsonLdHtml` with the `<` fixture row and the round-trip of every block.

## User Setup Required

None.

## Next Phase Readiness

- 17-14 can refer to each photo by `photoImageId(slug)` (the page URL plus `#image`) in the gallery `hasPart`. It can reuse `personRef()` and the test helpers.
- 17-15's record audit re-reads the `v20-identity:` line above, `removed=1,1,1,1`, and the IN-01 SHA `a56529c`.

## Self-Check: PASSED

- FOUND: lib/home-format.ts, lib/__tests__/home-format.test.ts, lib/photos/view-model.ts, lib/json-ld.ts, lib/__tests__/json-ld.test.ts, app/(site)/photos/[slug]/page.tsx
- FOUND: 228ccb0, a56529c, c29c78d, a3bea04 (all ancestors of HEAD). `gsd-tools check evaluation-scope --plan 17-13 --commits-only` resolves all four.

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-24*
