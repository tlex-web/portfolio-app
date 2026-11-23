---
phase: 17-region-routes-seo-structured-data
plan: 01
subsystem: routing
tags: [nextjs, app-router, parallel-routes, proxy, seo, playwright, jest]

requires:
  - phase: 16-new-region-data
    provides: data/regions/regions.json, the Regions schema, seriesInput, aerial photos (16 D-04)
provides:
  - regionHref(id) in lib/photos/routes.ts (no registry import)
  - lib/photos/region-ids.ts, the proxy-only region id list
  - lib/regions.ts, the server-only region model with Tim's approved copy (regionTitle, regionDescription, regionOgAlt, regionRights, regionMetadata)
  - the D-11 region stand-in page at /photos/regions/<id> and the null @modal/regions/[region] slot page
  - proxy.ts REGION_PATH / KNOWN_REGIONS / missedSection, region misses answered with the neutral photos 404
  - e2e/photos-region.spec.ts (D-01 navigation checks), lib/__tests__/regions.test.ts (copy pins), REGION_HAND_BUILT scan, region 404 rows
affects: [17-05, 17-07, 17-14, 17-16, 18]

actuals:
  tokens: 10018    # chars/4 over the added lines of 17-01's four commits
  tasks: 3
  commits: 8       # MEASURED rev-list base..HEAD; 4 of them are 17-02's (13ff26a, f0aeb69, dafe5ea, b83347e), which ran while 17-01 was paused
plan_head_before: 0769c9f21997940f207a2c4a46816b6409e089dc
plan_head_after: 79aec33e11fe10f3af635e7caf049b8e4ee699a2

tech-stack:
  added: []
  patterns:
    - "A region path segment is matched in proxy.ts by exact, case-sensitive Set lookup before render; misses render the photos 404 under the neutral slug"
    - "Region copy is template-driven from the data (count, range, years, all-aerial) and pinned literally per region in regions.test.ts"
    - "Flight-payload echo checks unescape \\\" quotes first and carry a positive control"

key-files:
  created:
    - lib/photos/region-ids.ts
    - lib/regions.ts
    - app/(site)/photos/regions/[region]/page.tsx
    - app/(site)/photos/@modal/regions/[region]/page.tsx
    - e2e/photos-region.spec.ts
    - lib/__tests__/regions.test.ts
  modified:
    - lib/photos/routes.ts
    - lib/photos/view-model.ts
    - proxy.ts
    - lib/__tests__/proxy.test.ts
    - lib/__tests__/photo-routes.test.ts
    - e2e/routes.ts
    - e2e/not-found.spec.ts

key-decisions:
  - "D-14 copy approved by Tim (17-01 Task 2): country as the full name, no 'approx.' in height ranges, region titles/descriptions/rights lines as drafted"
  - "Region OG alt carries 'ground' before the range when every photo of the region is aerial (Tim: Add \"ground\"); the rule is data-driven, not a Saalfelden special case"
  - "Case-study copyrightNotice is option (a), the footer line exactly: '© {current year} Tim Lui. All rights reserved.' (17-14 applies it)"
  - "Aerial photo descriptions approved as drafted: '{title}: an aerial photograph by Tim Lui over {short place}, ground {m} approx., {Mon YYYY}.' (applied by the plan that owns the photo copy, 17-05)"
  - "Region page h2 headings 'Facts' and 'Photographs' and the row format '{title} | {altitude} · {capture}' approved as drafted"

patterns-established:
  - "regionHref(id) is the only builder of /photos/regions/<id>; REGION_HAND_BUILT fails on any other"
  - "Server-only region data stays out of lib/photos/routes.ts; proxy.ts reads ids from lib/photos/region-ids.ts"

requirements-completed: [REGION-07, PHOTO-05]

coverage:
  - id: D1
    description: "/photos/regions/<id> answers 200 server-rendered for ortler, saalfelden, zermatt on hard load and reload, Photographs current, no dialog"
    requirement: REGION-07
    verification:
      - kind: e2e
        ref: "e2e/photos-region.spec.ts (PW_PROD=1, chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-01 navigations: soft push from /photos renders the region page; lightbox over the region page closes cleanly on Back; push from an open lightbox to a region leaves no stuck modal"
    requirement: REGION-07
    verification:
      - kind: e2e
        ref: "e2e/photos-region.spec.ts (@prod-only rows, chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Region misses (unknown id, wrong case, bare /photos/regions) answer the designed 404 with 'All photographs' and no path echo"
    requirement: PHOTO-05
    verification:
      - kind: unit
        ref: "lib/__tests__/proxy.test.ts#proxy(): region pages (D-04, D-05)"
        status: pass
      - kind: e2e
        ref: "e2e/not-found.spec.ts (MISSES /photos/regions/<token>; /photos/regions and /photos/regions/Zermatt row)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Tim's approved region copy ships verbatim (title, description, OG alt, rights line)"
    requirement: REGION-07
    verification:
      - kind: unit
        ref: "lib/__tests__/regions.test.ts#Tim's approved region copy (D-14)"
        status: pass
    human_judgment: false
  - id: D5
    description: "No source builds a region path by hand (D-06)"
    verification:
      - kind: unit
        ref: "lib/__tests__/photo-routes.test.ts#no hand-built region path outside lib/photos/routes.ts (D-06)"
        status: pass
    human_judgment: false

duration: Task 3 continuation ~35min (Task 1 by the previous executor)
completed: 2026-11-23
status: complete
---

# Phase 17 Plan 01: Region Routes Tracer Summary

**`/photos/regions/<id>` served end to end (regionHref, proxy-only id list, server-only region model, stand-in page, null modal slot, proxy miss branch), with Tim's approved region copy pinned verbatim, a hand-built region path scan and the region 404 rows**

## Performance

- **Duration:** Task 3 continuation about 35 min; Task 1 ran in the previous executor session
- **Completed:** 2026-11-23T22:15Z
- **Tasks:** 3 (Task 2 a blocking-human copy checkpoint)
- **Files modified:** 13

## Accomplishments

- A region page answers on its own path in a production build; the lightbox opens over it and closes cleanly; a push from an open lightbox to a region page leaves no stuck modal (Chromium and Firefox).
- proxy.ts decides region misses before render with an exact, case-sensitive lookup and serves the neutral photos 404, so no typed id or `regions` flight segment reaches the HTML.
- Tim's D-14 copy ships verbatim: `regionOgAlt` added (with the data-driven "ground" rule), all per-region strings pinned literally in `lib/__tests__/regions.test.ts`.
- `REGION_HAND_BUILT` scan (D-06) with BAD/GOOD self-tests, mutation-checked: an appended `` `/photos/regions/${id}` `` in lib/regions.ts fails it.

## D-14 copy (Tim's reply, verbatim)

Tim replied through four AskUserQuestion questions. Each question, its options, and Tim's literal selected label:

1. Country form and "approx." in ranges (options: "Name, no approx (draft)" / "Name + approx." / "Code, no approx" / "Code + approx.") → Tim selected: **"Name, no approx (draft)"**
2. Saalfelden OG alt "ground" label (options: "Add \"ground\" (Recommended)" / "As drafted") → Tim selected: **"Add \"ground\" (Recommended)"**
3. Case-study copyrightNotice (options: "(a) Footer line (Recommended)" / "(b) Per-project year") → Tim selected: **"(a) Footer line (Recommended)"**
4. Everything else — per-region rights lines, the two aerial descriptions, h2 headings "Facts"/"Photographs", the row format (options: "Approve as drafted (Recommended)" / "Edit some") → Tim selected: **"Approve as drafted (Recommended)"**

No notes or replacement text were typed.

### The approved strings as shipped (U+00A0 shown as `·nbsp·` where the page prints it: after "ground" and before "m")

| Region | h1 / title (document title adds " · Tim Lui") | Meta description | OG alt (17-07) | Rights line |
|---|---|---|---|---|
| ortler | `Ortler, Italy` | `2 photographs by Tim Lui from Ortler, Italy, at 2,190–2,520·nbsp·m, 2016.` | `Ortler, 2 photographs by Tim Lui. Italy, 2,190–2,520·nbsp·m` | `© 2016 Tim Lui, all rights reserved` |
| saalfelden | `Saalfelden, Austria` | `2 aerial photographs by Tim Lui over Saalfelden, Austria, ground·nbsp·820–880·nbsp·m, 2026.` | `Saalfelden, 2 photographs by Tim Lui. Austria, ground·nbsp·820–880·nbsp·m` | `© 2026 Tim Lui, all rights reserved` |
| zermatt | `Zermatt, Switzerland` | `7 photographs by Tim Lui from Zermatt, Switzerland, at 1,617–2,928·nbsp·m, 2019–2024.` | `Zermatt, 7 photographs by Tim Lui. Switzerland, 1,617–2,928·nbsp·m` | `© 2019–2024 Tim Lui, all rights reserved` |

### Copy decisions other plans apply

- **17-14, case-study JSON-LD `copyrightNotice`:** option (a), the footer line exactly: `© {current year} Tim Lui. All rights reserved.`
- **17-05 (the plan that publishes the aerial photo pages and their copy), aerial photo descriptions:**
  - `saalfelden-valley-from-the-air`: `Saalfelden valley from the air: an aerial photograph by Tim Lui over Saalfelden, ground 820 m approx., Sep 2026.`
  - `castle-below-limestone-peaks`: `Castle below limestone peaks: an aerial photograph by Tim Lui over Saalfelden, ground 880 m approx., Sep 2026.`
- **Region page:** h2 headings `Facts` and `Photographs`, photo row format `{title} | {altitude} · {capture}`, as drafted and already rendered by Task 1.

## Task Commits

1. **Task 1: End-to-end `/photos/regions/<id>` (tracer)** - `3024ec5` (feat)
2. **Task 2: Tim approves the region copy (D-14, blocking-human)** - no commit; reply recorded above
3. **Task 3: Tim's copy verbatim and pinned, the region path scan, the region 404 rows**
   - `08f7cfa` (test, RED): regions.test.ts copy pins, one-photo description, region order
   - `b5f7f09` (feat, GREEN): approved copy applied, `regionOgAlt` added
   - `79aec33` (test): REGION_HAND_BUILT scan and region 404 rows

Commits `13ff26a`, `f0aeb69`, `dafe5ea`, `b83347e` in the ledger range belong to 17-02, which ran while this plan was paused at Task 2.

## TDD Gate Compliance (Task 3)

- RED `08f7cfa`: `npx jest lib/__tests__/regions.test.ts` exit 1, 3 failed / 21 passed. The three failures are the target `has the approved OG alt text (17-07 reads it)` rows, `TypeError: (0 , _regions.regionOgAlt) is not a function` (runtime, not a compile or discovery failure). The 21 passing rows confirmed the title/description/rights templates already produced Tim's approved text (the draft was approved unchanged for those).
- GREEN `b5f7f09`: 24/24 pass.
- No REFACTOR commit (the `copyFigures` share landed inside GREEN).

## Files Created/Modified

- `lib/photos/routes.ts` - `regionHref(id)`, header doc forbids a registry import
- `lib/photos/region-ids.ts` - `regionRouteIds`, proxy-only
- `lib/regions.ts` - server-only region model and Tim's approved copy, `regionOgAlt`
- `app/(site)/photos/regions/[region]/page.tsx` - D-11 stand-in page
- `app/(site)/photos/@modal/regions/[region]/page.tsx` - null slot page
- `proxy.ts` - `REGION_PATH`, `KNOWN_REGIONS`, `missedSection`
- `lib/photos/view-model.ts` - `factSource` exported
- `lib/__tests__/proxy.test.ts` - region proxy rows
- `lib/__tests__/regions.test.ts` - copy pins, one-photo description, order
- `lib/__tests__/photo-routes.test.ts` - `REGION_HAND_BUILT` scan with self-tests
- `e2e/routes.ts` - `REGION_TEMPLATE_ID`, ROUTES entry `/photos/regions/zermatt`
- `e2e/photos-region.spec.ts` - D-01 navigation checks
- `e2e/not-found.spec.ts` - region miss rows

## Decisions Made

See `key-decisions` and "Copy decisions other plans apply" above. The OG alt's "ground" rule uses the same all-aerial test as the description (a region with mixed photos reads as a ground region), so it holds when data changes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `factSource` exported from `lib/photos/view-model.ts`** (Task 1, `3024ec5`)
- One keyword so the region page reuses the fact source-label logic; view-model.ts was not in the plan's file list.

**2. [Rule 1 - Bug] The planned flight-segment assertion was vacuous** (Task 3, `79aec33`)
- **Issue:** The plan asked that the 404 body not contain `"photos","regions"`. The flight payload sits inside script strings with escaped quotes; a real region page serves `\"photos\",\"regions\",\"zermatt\"`, so the literal check could never fail.
- **Fix:** `unescapeQuotes(body)` before the negative checks, plus a positive control that `/photos/regions/zermatt` contains `"photos","regions","zermatt"` after unescaping.
- **Verification:** confirmed against `next start` with curl; not-found spec 46/46 on Chromium and Firefox.

### Other notes carried from Task 1

- The region → photo → Back row carries `@no-win-webkit` (like the existing lightbox Back rows); the modal rows carry `@prod-only` as planned.
- The aerial draft uses an NBSP after "ground" (`ground 820–880 m`), matching `formatAltitude`; the approved OG alt keeps that convention.
- The page renders as `ƒ` (dynamic) like every page here, because of the per-request CSP nonce; `generateStaticParams` and `dynamicParams = false` remain.
- The 404 test covers both the bare and the wrong-case path in one test (loop) as the plan describes.
- No Firefox #43967 crash, so no `@firefox-43967` tag.

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug). **Impact:** no scope change.

## Verification

- Jest: `regions`, `photo-routes`, `proxy`, `audit-routes` 152/152 (Task 1 also ran `client-graph`, 129/129 at the time).
- `npm run type-check` (three configs) and `npm run lint` (incl. the test-count scan) pass.
- `PW_PROD=1 npx playwright test e2e/photos-region.spec.ts e2e/not-found.spec.ts e2e/shell.spec.ts e2e/seo.spec.ts --project=chromium --project=firefox`: 166 passed, 0 failed, 0 flaky; not-found re-run after the quote fix 46/46. `public/service-worker.js` restored after the build.
- `node scripts/ci/check-snapshot-commit.mjs --none` OK on every commit; no PNG staged.
- Acceptance greps: `REGION_HAND_BUILT` 3, `/photos/regions` in not-found.spec 6, `regionTitle` in regions.test 2.

## Known Stubs

None. Known gap from the plan (not a stub): the region page links to the seven not-yet-published photos answer 404 until 17-05.

## Issues Encountered

None beyond the vacuous assertion above.

## User Setup Required

None.

## Next Phase Readiness

- 17-16 adds the D-03 collision rows to `lib/__tests__/regions.test.ts`, the `SERVER_ONLY_MODULES` guard for the registry and the client JS measurement.
- 17-07 reads `regionOgAlt(id)`; 17-14 applies copyrightNotice option (a); 17-05 applies the aerial descriptions.

## Self-Check: PASSED

Commits 3024ec5, 08f7cfa, b5f7f09, 79aec33 are ancestors of HEAD; all six created files exist.

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-23*
