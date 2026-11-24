---
phase: 17-region-routes-seo-structured-data
plan: 07
subsystem: seo
tags: [nextjs, opengraph-image, generateImageMetadata, og, zod, jest, playwright]

requires:
  - phase: 17-region-routes-seo-structured-data
    provides: 17-01 region model and Tim's approved regionOgAlt (D-14); 17-05 published photo set and the v2.0 identity harness
  - phase: 16-new-region-data
    provides: the region registry, photo map and the three plates' hero contour SVGs
provides:
  - Region.cover (required photo-id slug) and each region's cover in data/regions/regions.json (Tim's D-13 picks)
  - regionCover(id), validated at module load, and regionCardFacts(id) in lib/regions.ts
  - contourDataUrl(src = terrain.assets.contours.hero) and the OgFrame 'region' variant in lib/og/template.tsx
  - app/(site)/photos/regions/[region]/opengraph-image.tsx, one 1200 x 630 card per region
  - routes.test region cases and og.spec coverage of every published photo, project and region page
affects: [17-12, 17-13, 17-15, 18]

actuals:
  tokens: 5666     # chars/4 over the added lines of ec07b6e..95c8df8
  tasks: 3
  commits: 4       # MEASURED: git rev-list --count ec07b6e..HEAD at SUMMARY write
plan_head_before: ec07b6e3abf3feef863fa1757c3857dd85439386
plan_head_after: 95c8df872e6bbe6a2b123e4a4818b1e63f657a40

tech-stack:
  added: []
  patterns:
    - "A registry field that names a photo is shape-checked by zod (schema files import only zod) and membership-checked twice: photo-map.test against photo-map.json, and lib/regions.ts at module load"
    - "The region card's plate figures come from the same copyFigures as regionOgAlt (regionCardFacts), so the drawn text and the alt cannot disagree"

key-files:
  created:
    - app/(site)/photos/regions/[region]/opengraph-image.tsx
  modified:
    - data/schemas/region.ts
    - data/regions/regions.json
    - data/__tests__/photo-map.test.ts
    - lib/regions.ts
    - lib/__tests__/regions.test.ts
    - lib/og/template.tsx
    - lib/og/__tests__/routes.test.ts
    - e2e/og.spec.ts
    - scripts/guards/selftest.mjs

key-decisions:
  - "17-07 D-13: region covers are Tim's picks, verbatim: zermatt img-0605 (matterhorn-from-zermatt), ortler sam-20160717-120906 (meadow-stream-below-the-peaks), saalfelden dji-20260919-162232 (castle-below-limestone-peaks)"
  - "17-07 D-12: the region card is the photo variant's frame and type scale with the cover's 1200 px JPEG derivative and the region plate's own hero contours; plate text name / country / count / range, '© {years} Tim Lui' at the bottom"
  - "17-07: regionCardFacts(id) in lib/regions.ts shares copyFigures with regionOgAlt; an all-aerial region's card range reads 'ground {range}' like its approved alt"

patterns-established:
  - "contourDataUrl() with no argument is the home plate's hero SVG; only the region card passes a plate's hero path"

requirements-completed: [REGION-07, PHOTO-05]

coverage:
  - id: D1
    description: "Each region names a required cover Tim picked; the schema rejects a missing or malformed cover and the cross-check rejects a cover from another region"
    requirement: REGION-07
    verification:
      - kind: unit
        ref: "data/__tests__/photo-map.test.ts#17 D-13 rows"
        status: pass
      - kind: unit
        ref: "lib/__tests__/regions.test.ts#each region's cover (D-13)"
        status: pass
    human_judgment: false
  - id: D2
    description: "/photos/regions/<id>/opengraph-image-<x>/card answers a 1200 x 630 image/png for each region in a production build; each region page's og:image and twitter:image name it, with Tim's approved alt"
    requirement: REGION-07
    verification:
      - kind: e2e
        ref: "e2e/og.spec.ts#/photos/regions/<id> names its own card, a 1200 x 630 PNG (PW_PROD=1, chromium + firefox)"
        status: pass
      - kind: unit
        ref: "lib/og/__tests__/routes.test.ts#region route: generateImageMetadata (17 D-12, D-14)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The region card renders the 'region' variant from the cover's JPEG derivative (the only photo file read) over the region plate's hero contours, and the route exports no generateStaticParams or dynamicParams"
    requirement: REGION-07
    verification:
      - kind: unit
        ref: "lib/og/__tests__/routes.test.ts#region route: the cover's derivative over the region's own plate"
        status: pass
      - kind: unit
        ref: "lib/og/__tests__/routes.test.ts#route exports"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every published photo page, project page and region page names its own card; no two share a card URL or alt, and none is Home's"
    requirement: PHOTO-05
    verification:
      - kind: e2e
        ref: "e2e/og.spec.ts#Per-slug Open Graph cards (PW_PROD=1, chromium + firefox, 70 passed with seo.spec)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The v2.0 four are unchanged: the per-photo card file is byte-identical to 285b6d5 and the identity compare is identical on all 36 fields, the OG PNG SHA-256 included"
    requirement: PHOTO-05
    verification:
      - kind: other
        ref: "node v20-identity.mjs http://localhost:3017 v20-base.json -> exit=0 differing=0 compared=36"
        status: pass
      - kind: other
        ref: "git diff --quiet 285b6d5 -- app/(site)/photos/[slug]/opengraph-image.tsx"
        status: pass
    human_judgment: false
  - id: D6
    description: "The region card's composition (cover framing, contour legibility on each plate) reads well as a link preview"
    human_judgment: true
    rationale: "Visual quality of a social preview is a judgment; the three PNGs were inspected locally (scratchpad) but no test asserts aesthetics"

duration: 15min
completed: 2026-11-24
status: complete
---

# Phase 17 Plan 07: Region Open Graph Cards Summary

**Each region now has its own Open Graph card: Tim's cover photo over the region plate's own contours, in the photo card's frame and type, with Tim's approved alt. The covers are required in the registry, checked against the photo map, and the v2.0 four's cards are byte-identical on all 36 compared fields.**

## Performance

- **Duration:** about 15 min (2026-11-23T23:58:11Z to 2026-11-24T00:13Z)
- **Tasks:** 3 (Task 1 the blocking-human cover decision, answered before dispatch)
- **Files modified:** 10 (1 created)

## D-13 covers (Tim's reply, verbatim)

The orchestrator asked Tim one AskUserQuestion question per region before this dispatch. It first listed the candidates from `data/photos/photo-map.json` and `data/photos/editorial.ts`. Tim's literal selected labels:

- Zermatt: "matterhorn-from-zermatt (proposed)"
- Ortler: "meadow-stream-below-the-peaks (proposed)"
- Saalfelden: "castle-below-limestone-peaks (proposed)"

No notes were typed. At the start of Task 2 I re-checked the candidate set against the data. `photo-map.json` still listed exactly the seven Zermatt, two Ortler and two Saalfelden photos Tim saw. `git diff 285b6d5 HEAD` over `regions.json`, `photo-map.json` and `editorial.ts` was empty. The covers in `data/regions/regions.json` use the photo-id form the schema requires:

| Region | `cover` | Slug |
|---|---|---|
| ortler | `sam-20160717-120906` | meadow-stream-below-the-peaks |
| saalfelden | `dji-20260919-162232` | castle-below-limestone-peaks |
| zermatt | `img-0605` | matterhorn-from-zermatt |

## Accomplishments

- `Region.cover` is a required photo-id slug, its shape duplicated from photo.ts (schema files import only zod). photo-map.test checks that each cover's record belongs to its region, with a swapped-cover and unknown-id control. It also checks that `Regions` rejects a region with no cover or a malformed one.
- `regionCover(id)` is resolved at module load. A cover outside the region's photos throws, naming the region, the cover and `data/regions/regions.json`; a mocked-registry row proves the throw.
- `contourDataUrl(src = terrain.assets.contours.hero)`. The photo, project and default cards still call it with no argument, and routes.test asserts that a photo card reads the home hero SVG.
- OgFrame variant `'region'` is `frame(photoSlot(photo), plate(contour, …))` with the photo variant's type scale and tokens:
  - name: 32 Schibsted;
  - country: 24 Inter, mist300, 16 px below the name;
  - count and range: 24 Mono, 8 px apart;
  - bottom line: `© {years} Tim Lui`.
- `app/(site)/photos/regions/[region]/opengraph-image.tsx` mirrors the photo card's structure and doc. It exports `size`, `contentType`, `generateImageMetadata` (Tim's `regionOgAlt`) and a default `Image` that calls `notFound()` for an unknown id. It has no `generateStaticParams` and no `dynamicParams`. Its doc records RESEARCH Pitfall 6 (a plate SVG read through a variable path) for 17-15.
- og.spec now covers every published photo (11), every project and every region page. Before, it covered the light-table four.

## Region cards (production build, 95c8df8, `next start -p 3017`)

| Region | Page | og:image path | Card | og:image:alt |
|---|---|---|---|---|
| ortler | 200 | /photos/regions/ortler/opengraph-image-1cmaag/card?d447e566894b1199 | 200 image/png 1200 x 630 | Ortler, 2 photographs by Tim Lui. Italy, 2,190–2,520 m |
| saalfelden | 200 | /photos/regions/saalfelden/opengraph-image-1cmaag/card?d447e566894b1199 | 200 image/png 1200 x 630 | Saalfelden, 2 photographs by Tim Lui. Austria, ground 820–880 m |
| zermatt | 200 | /photos/regions/zermatt/opengraph-image-1cmaag/card?d447e566894b1199 | 200 image/png 1200 x 630 | Zermatt, 7 photographs by Tim Lui. Switzerland, 1,617–2,928 m |

`twitter:image` equals `og:image` on all three pages. `/photos/regions/nowhere/opengraph-image-1cmaag/card` answers 404. (The alts carry U+00A0 before "m" and after "ground", as 17-01 recorded.)

## v2.0 identity (after 17-07)

On this tree (HEAD 95c8df8): `rm -rf .next/static && npm run build`, then `git restore public/service-worker.js`. The server was `node node_modules/next/dist/bin/next start -p 3017`. Before the run, the scratchpad script and base matched 17-05's recorded SHA-256s: `v20-identity.mjs` b722b565…2dd6, `v20-base.json` be3ad3b8…200a. Command: `node <scratchpad>/v20-identity.mjs http://localhost:3017 <scratchpad>/v20-base.json`. Complete stdout:

```text
v20-identity: exit=0 differing=0 compared=36 removed=0,0,0,0 base=51b7f4d9b291 head=95c8df872e6b
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
| ldJsonRemoved (recorded, not compared) | 0 | 0 | 0 | 0 |

## Client JS

`rm -rf .next/static && npm run build` on 95c8df8: **1,851,749 B in 24 files** under `.next/static/chunks`. That equals the 17-06 figure; the cap is 1,855,781 B. A grep of `.next/static/chunks` for `Steinernen`, `matterhorn-from-zermatt`, `ortler-contours-hero` and `regionCardFacts` found no file.

## Task Commits

1. **Task 1: Tim picks each region's cover (D-13, blocking-human)**: no commit; his reply is recorded above.
2. **Task 2: Each region's cover in the registry, required by the schema and tested against the photo map**
   - `79634e2` (test, RED): photo-map.test cover rows and schema boundary; regions.test regionCover rows
   - `6e0920e` (feat, GREEN): `Region.cover`, the three covers, `regionCover`, selftest fixture cover
3. **Task 3: The region card, its route, and card coverage for every published photo and region**
   - `3785828` (test, RED): routes.test region cases, og.spec page list, a behaviourless route skeleton
   - `95c8df8` (feat, GREEN): `contourDataUrl(src)`, OgFrame `'region'`, the route, `regionCardFacts`

## TDD Gate Compliance

- **Task 2 RED (`79634e2`):** `npx jest data/__tests__/photo-map.test.ts lib/__tests__/regions.test.ts` exited 1: 10 failed, 48 passed. Failures:
  - `TypeError: regionCover is not a function` (runtime, the missing behaviour);
  - the registry `toEqual` rows missing `cover`;
  - the schema rows: a region with no cover parsed (`Expected: false, Received: true`);
  - the load-throw row: the old strict schema threw a ZodError instead of the named membership error.

  All are assertions on the planned behaviour. None is a syntax, collection or import fault (`.gsd/tdd-evidence/17-07/red-t2.txt`, git-ignored).
- **Task 2 GREEN (`6e0920e`):** the five verify suites passed 126/126.
- **Task 3 RED (`3785828`):** the first run failed to load (`Cannot find module …/regions/[region]/opengraph-image`), which is INVALID_RED. The RED commit therefore carries a behaviourless skeleton: no card entries, `notFound()` for every id. The rerun exited 1 with 8 failed and 61 passed:
  - the per-region `generateImageMetadata` rows (`Expected length: 1, Received length: 0`);
  - the shared-alt row;
  - the three render rows and the aerial-range row (the skeleton's `notFound()`).

  The route-export row and the home-hero row already passed. They guard against regressions and are not RED targets (`red-t3.txt`, `red-t3.json`).
- **Task 3 GREEN (`95c8df8`):** routes, client-graph and regions passed 121/121.
- The `tdd-red-evidence` classifier was not run. Jest's reporters are not among its formats (TAP, JUnit XML, go test, unittest, swift-testing), and installing a reporter package is excluded from auto-fixes. The RED verdicts above are a semantic assessment from the saved output, as in 17-01 and 17-05.
- No REFACTOR commits.

## Files Created/Modified

- `app/(site)/photos/regions/[region]/opengraph-image.tsx`: the per-region card route (created)
- `data/schemas/region.ts`: `cover` on the strict `Region`, its slug shape duplicated from photo.ts
- `data/regions/regions.json`: `cover` per region (Tim's picks)
- `data/__tests__/photo-map.test.ts`: cover in the registry records, cover cross-check with controls, schema rejection rows
- `lib/regions.ts`: `regionCover` (load-time membership check), `regionCardFacts`
- `lib/__tests__/regions.test.ts`: regionCover pins, unknown-id throw, mocked-registry load throw
- `lib/og/template.tsx`: `contourDataUrl(src)`, `OgFrameProps` `'region'`, its OgFrame branch and doc
- `lib/og/__tests__/routes.test.ts`: region metadata, render, aerial range, export and home-hero cases
- `e2e/og.spec.ts`: page list over published photos, projects and regions, plus a list self-check
- `scripts/guards/selftest.mjs`: `FIXTURE_REGION` carries a cover

## Decisions Made

- I put the plate figures in `regionCardFacts(id)` in lib/regions.ts, sharing `copyFigures` with `regionOgAlt`. The plan put the formatter calls in the route. With one source, the drawn range and the alt's range cannot drift apart, and routes.test asserts that the alt ends with the card's range.
- The cover's zod type is a separate `CoverPhotoId` in region.ts. Its rule message is the same as photo.ts's.
- The region variant prints the count and the range on two Mono lines, matching the photo variant's single Mono altitude line. A long Zermatt range (`1,617–2,928 m`) fits the 336 px column on one line.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The guard selftest's fixture regions had no cover**
- **Found during:** Task 2 (`npm run lint`)
- **Issue:** The plan expected the selftest roots to copy the real registry. Seven cases (one photos:build case and six privacy cases) also add fixture regions built from `FIXTURE_REGION`. Without a cover, those regions failed `Regions` and the cases broke on the schema, not on their own rules (291/298).
- **Fix:** `FIXTURE_REGION` carries `cover: 'fixture-cover'`. The generators check only its shape; membership is checked by photo-map.test and lib/regions.ts, as the doc comment says.
- **Files modified:** `scripts/guards/selftest.mjs`
- **Verification:** selftest 298/298; `npm run lint` exit 0
- **Committed in:** `6e0920e`

**2. [Rule 1 - Bug] The load-throw test's `jest.doMock` outlived `isolateModulesAsync`**
- **Found during:** Task 2 GREEN
- **Issue:** The next row loaded the mocked registry and threw.
- **Fix:** `jest.dontMock('@/data/regions/regions.json')` in a `finally`.
- **Files modified:** `lib/__tests__/regions.test.ts`
- **Committed in:** `6e0920e`

**3. [Rule 3 - Blocking] RED needed a loadable route module**
- **Found during:** Task 3 RED
- **Issue:** A missing module fails at load, which is INVALID_RED.
- **Fix:** A behaviourless skeleton went into the RED commit; GREEN replaced it.
- **Committed in:** `3785828`

**4. Files outside the task lists:** `lib/__tests__/regions.test.ts` holds the `regionCover` behaviour rows (the plan's Task 2 verify already runs it). `lib/regions.ts` also gained `regionCardFacts` in Task 3 (see Decisions).

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 test bug), plus 2 files outside the task lists. **Impact on plan:** none on scope. The fixture fix keeps every selftest case failing on the rule it names.

## Issues Encountered

None beyond the deviations above.

## Verification

- Jest: the Task 2 verify suites 126/126; the Task 3 verify suites (routes, client-graph) plus regions 121/121; full suite **118 suites, 2,182 tests**, all passing.
- `npm run type-check` (three configs) exit 0. `npm run lint` exit 0: eslint, guards, selftest 298/298, `data:check`, images, test-count scan.
- `git diff --quiet HEAD -- data/generated public/terrain` exit 0 before the Task 2 commit, so no generated module or terrain asset changed.
- `PW_PROD=1 npx playwright test e2e/og.spec.ts e2e/seo.spec.ts --project=chromium --project=firefox`: **70 passed**, 0 failed, 0 flaky. That includes the three region card rows in each engine. `public/service-worker.js` was restored afterwards.
- `git diff --quiet 285b6d5 -- "app/(site)/photos/[slug]/opengraph-image.tsx"` exit 0.
- `node scripts/ci/check-snapshot-commit.mjs --none`: OK (0 changed) after each of the four commits. No PNG was staged.
- Acceptance greps:
  - `"cover"` in regions.json: 3;
  - `cover` in region.ts: 4;
  - `export function generateImageMetadata` in the region route: 1;
  - `variant: 'region'` in template.tsx: 1;
  - `/photos/regions/` in og.spec.ts: 3.
- No server is left on :3000 or :3017.

## Known Stubs

None. The RED skeleton was replaced in `95c8df8`.

## Threat Flags

None. The new public surface is the three region card URLs. T-17-15 is mitigated: routes.test asserts the only photo file read is the cover's `jpeg.src` derivative. T-17-16 is mitigated: file names come from the zod-validated registry and the generated modules, an unknown id gets `[]` and `notFound()`, and cover membership is tested and asserted at load.

## User Setup Required

None.

## Next Phase Readiness

- 17-15 should fetch one region card on the Vercel preview (RESEARCH Pitfall 6: the plate SVG path is a variable, so output tracing may not ship it). Locally, `next start` reads public/ directly.
- 17-12, 17-13 and 17-15 rerun the v2.0 identity; the base and script are unchanged.
- Phase 18 can read `regionCover(id)` for an optional region header.

## Self-Check: PASSED

`app/(site)/photos/regions/[region]/opengraph-image.tsx` exists, and so do the nine modified files. Commits 79634e2, 6e0920e, 3785828 and 95c8df8 are ancestors of HEAD. The TDD gate pairs are present: test(17-07) 79634e2 then feat(17-07) 6e0920e, and test(17-07) 3785828 then feat(17-07) 95c8df8.

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-24*
