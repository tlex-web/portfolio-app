# Phase 15: Region & Plate Data Model - Context

**Gathered:** 2026-11-14
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase readies the data, the terrain build and the photo links for many regions while the site looks and builds exactly as before. It covers five requirements:
- **DATA-09:** Home reads an explicit list of its four Matterhorn waypoints.
- **DATA-10:** every photo record names its region and its country, in typed, committed data that CI checks.
- **DATA-11:** the terrain build reads a plate registry and builds every listed plate in one run.
- **DATA-15:** the served-asset guard rejects drone sidecars and telemetry.
- **GUARD-10:** `npm run type-check` covers the Jest tests, the e2e specs and the Playwright configs, with zero errors.

Every photo link comes from one URL helper, still `/photos/<slug>`. The phase changes no pixels and no Matterhorn terrain hash. New regions, new photos, the overview map, the region routes and every visible change belong to Phases 16 to 19.

</domain>

<decisions>
## Implementation Decisions

### Region and country data (DATA-10)

- **D-01: `data/photos/photo-map.json` holds one record per photo.** The record is keyed by photo id and holds `file` (the original's file name), `region` and `country`.
  - **Two jobs in one file.**
    - It is the research's explicit source-file → id map (PITFALLS "Drone material", SUMMARY D9). `scripts/photos/extract-exif.mjs` assigns ids from it instead of the file-name regex (`IMG_0605-Enhanced (…).jpg` → `img-0605`), so a DJI still or a second camera's `IMG_0605` cannot collide.
    - It also holds the region and country that stage 2 needs.
  - **The build fails when:**
    - an original has no record;
    - two records name one file;
    - a record has no sidecar entry;
    - a sidecar entry has no record.
  - The sidecar already commits each file name, so nothing new becomes public.
  - Tim chose this over research §1.3's `regions[].photos` list. The §1.3 checks still apply: every photo is in exactly one region.
  - **Reversibility:** costly. Phase 16 adds every new photo through this file, so moving membership later means rewriting the file, both photo scripts and their checks.
- **D-02: Country is explicit on every photo, with no region default.** It is an ISO 3166-1 alpha-2 code (`CH`, `IT`, `AT`). All four current photos are `CH`. There is no borders dataset (REGION-F5 is deferred), so country is never derived from coordinates. PHOTO-08 (Phase 18) shows LV95 when the photo's country is `CH`. A wrong country would put LV95 on an Italian photo, which is why there is no default.
- **D-03: `data/regions/regions.json` holds the region registry, with Zermatt only.** The entry is id `zermatt`, name `Zermatt`, plate `matterhorn`. A region is an editorial series and a plate is a terrain sheet; they are separate on purpose (research §1.2), so a later `zermatt-wide` plate can serve the region while Home keeps `matterhorn` byte for byte. The registry holds only the fields Phase 15 needs, and its strict schema grows in Phase 16. The id `zermatt` becomes a public URL segment once Phase 17 ships region pages; until then it is internal.
- **D-04: A photo whose position falls outside its region's plate fails the build.** This is today's WR-01 rule, applied per plate. Each photo's `uv` and DEM height come from its own plate's source raster, using the existing bilinear sampler (D-17 of v2.0 unchanged). Phase 16 sizes each new plate to cover its photos.
- **D-05: The generated photo data carries `region` and `country` per photo.** Zod schemas parse `photo-map.json` and `regions.json`. `photos:build --check` and `data:check` fail when either is missing, unknown or stale (success criterion 2).
- **Carried from the roadmap:** from this phase on, the v2.0 light table (`/photos`) shows the Zermatt series only, so Phase 16's new regions never land on the Matterhorn map.

### Home waypoint list (DATA-09)

- **D-06: Home has an explicit list of four photo ids:** `img-0605`, `img-0629`, `img-0662`, `r004-011`, each with its slug as a comment. The list controls membership only. The order is still DEM height ascending with ties broken by id, as `buildWaypoints` does today, so the single-order rule and its tests are unchanged.
- **D-07: The list is strict.** A test or the build fails unless it has exactly four ids, all in region `zermatt` and on plate `matterhorn`. Changing the ascent is out of scope for v2.1, and Home's layout (poster pins, plaque, label rules) is tuned for four.
- **D-08: The rail start is the lowest DEM height among the listed waypoints.** That is 1,617 m (`img-0605`) today, so the value is unchanged. `lowestDemM` is no longer generated over every photo. It is computed in `lib/ascent` over the Home list (research §1.3). Otherwise the first lower photo anywhere in the Alps would silently move the rail.
- **D-09: Every Home consumer reads the list.** That covers the waypoint cards, the poster pins, the 3D pins, the rail ticks and the footer ticks. `SiteFooter` renders on every route and loops over every photo today. It also covers Home's trail sign ("Photographs · 4 waypoints", `components/home/TrailSigns.tsx:36`, which counts every photo today); it counts the Home list and stays at 4. Phase 18 may reword the sign once the album has an overview.
  - **The test (success criterion 1):** add a photo outside the list, or in another region. The ascent, the 1,617 m rail start, the footer ticks and the trail sign all stay unchanged.

### Plate registry and terrain build (DATA-11)

- **D-10: `data/terrain/plates.json` holds the plate registry, with `matterhorn` only.** A test fixture adds a second plate. One builder run owns every plate, because a per-plate run would delete the other plates' files (F15). The stale-file sweep compares against the union of every plate's expected names.
- **D-11: The Matterhorn plate keeps today's unprefixed file names.** Its registry prefix is empty. Every later plate is named `<plate>-<asset>.<hash>.<ext>`, flat in `public/terrain/` with no subdirectories (F14), so the schema regex, the guard's `HASH_NAME`, the `next.config` cache headers, the service-worker prefix rules and the proxy matcher keep working.
  - This overrides research §2.2 ("only the prefix changes"), so success criterion 3 holds literally: the same names and the same bytes.
  - **Reversibility:** costly. A later rename changes the URLs in `data/generated/terrain.ts`, the precache list and the OG template's input, and every returning visitor downloads about 1 MB once.
- **D-12: Each plate's output set is declared in the registry.**
  - **Matterhorn keeps its full current set:** heightmaps 256 and 512, `hero`, `map` and `strip` contours, and hillshade 640 and 1100 in AVIF and WebP. That includes the `map` LOD, which nothing reads (F11), so its files stay byte-identical.
  - **New 2D plates build only `hero` and `strip` contours plus the hillshade posters.** They get no `map` LOD and no heightmaps (`threeD: false`).
    - `hero` is what MapSheet, PosterSheet, EdgeArt and the OG template draw.
    - `strip` is the contour band of each plate's own sheet margin (REGION-06, Phase 18).
  - The target per new plate is about 0.55 MB served and about 250 KB fetched per visit (research §2.4).
  - Tim's first answer here rested on Claude's wrong claim that MapSheet reads the `map` LOD. He was re-asked with the facts and chose "hero + strip".
- **D-13: The fixture second plate is synthetic.** It is a tiny generated 16-bit DEM with its own source record. The builder runs with `--root` on a temp copy, the same pattern as the G5 and G6 tests in 13-12. The test asserts that the fixture gets its own prefixed files and that every Matterhorn file stays byte for byte. There is no network access and no real region data is committed; Phase 16 fetches the real windows.
- **D-14: The precache stays Home-only** (research §2.3). Region plates are cached cache-first under `/terrain/` on first visit, as today.
- **D-15: The acceptance gate is that the Matterhorn names and hashes equal today's:**
  - `contours-hero.2f3a04accc.svg`
  - `contours-map.f78bc9a25c.svg`
  - `contours-strip.e1af353f82.svg`
  - `heightmap-512.548be40405.png`
  - `heightmap-256.f792a8921f.png`
  - `hillshade-1100.5b6bae8c54.webp` and `hillshade-1100.ba22a91f95.avif`
  - `hillshade-640.80f2045ea4.webp` and `hillshade-640.b019a3335a.avif`

  `terrain:build --check` stays green.

### Photo URL helper (success criterion 5)

- **D-16: One helper, `photoHref(slug)`, builds every photo URL in the app.** It returns `/photos/<slug>` and covers:
  - Link hrefs, `router.push` and `history.replaceState` (PhotoViewer ×2);
  - the sitemap and the saved-pages catalog;
  - metadata canonicals and OG paths.

  The plain `/photos` index link is not a photo link and is allowed.
- **D-17: Tests keep the literal `/photos/${slug}`,** about 30 sites in Jest and e2e. That keeps them an independent check of the URL contract (PHOTO-05). One unit test pins `photoHref(slug) === '/photos/' + slug`.
- **D-18: A Jest source-scan test proves the one-helper rule.** It reads `app/`, `components/`, `lib/` and `proxy.ts` (not tests or e2e) and fails on any hand-built photo path: a `` `/photos/${…}` `` template, `'/photos/' + …` concatenation, or a `router.push` or `replaceState` with one. It runs in the Unit Tests job and in `npm test`.
- **D-19: `regionHref` waits for Phase 17,** which fixes the region path after its intercept spike. Phase 17 adds it to the same module and extends the scan to region paths.

### Telemetry guard (DATA-15)

- **D-20: `scripts/guards/check-served-images.mjs` rejects these file types (case-insensitive):**
  - DJI sidecars and flight logs: `.srt`, `.lrf` and `.dat`;
  - GoPro previews and thumbnails: `.lrv` and `.thm`;
  - standalone `.xmp` sidecars: Lightroom writes GPS there, and today's guard only scans XMP embedded in images;
  - GPS tracks: `.gpx`, `.kml`, `.kmz`, `.nmea`, `.igc`, `.fit` and `.tcx`.

  GeoJSON stays allowed, because Phase 16 may use it for map data. No tracked file has any of these extensions today.
- **D-21: The guard scans two places.**
  - **The repo:** tracked plus untracked-but-not-ignored files (`git ls-files -co --exclude-standard`, as in 13-13's PNG rule).
  - **All of `public/`:** a full walk that includes ignored files, because `next start` serves them.

  The ignored originals folders (`assets/photos-original/`, `assets/clips-original/`) stay allowed. Fixture mode (`--root`) works as today.
- **D-22: `.gitignore` lists the same types repo-wide,** so `git add -A` never stages a drone dump. The guard still catches `git add -f` and anything under `public/`.
- **D-23: The existing MP4 box walker covers telemetry tracks inside MP4 files.** It requires exactly one video track and rejects `©xyz`, `loci`, `uuid` and `XMP_`, so it already rejects DJI `djmd`/`dbgi` tracks, GoPro `gpmd` tracks and subtitle tracks (F10). Phase 15 proves it with selftest fixtures, one per telemetry-track kind and per sidecar type. **The fixtures are synthetic, never a real drone or camera file,** because a real file carries Tim's take-off GPS, and location data can't be purged from git history (D-12 of v2.0).

### Test type-check (GUARD-10)

- **D-24: One local declaration file types the Jest globals.** It maps `describe`, `it`, `test`, `expect`, `jest` and the hooks to the `@jest/globals` types and pulls in jest-dom's `jest-globals` matcher types. No test file changes.
  - `@jest/globals` is Jest's own package, already installed through jest 30. It becomes a direct devDependency pinned to the jest version.
  - `@types/jest` is not added.
  - Install with the bundled npm (memory: the global npm 11.6.1 rewrites unrelated lockfile metadata).
- **D-25: Three tsconfigs.**
  - `tsconfig.json` is the app config, unchanged.
  - `tsconfig.jest.json` covers the Jest tests plus the globals file.
  - `tsconfig.e2e.json` covers the e2e specs and the Playwright configs, with no Jest globals.

  `npm run type-check` runs all three with zero errors. App code can't see Jest globals, and an e2e spec can't fall back to Jest's `expect`.
- **D-26: The ~69 real errors are fixed properly** (13-06 measured 69 in 21 files with the globals declared). `@ts-expect-error` is allowed only where a test passes deliberately wrong input, such as schema rejection cases, and each one carries a reason. No new `any` casts or `@ts-ignore`.
- **D-27: `test-count.mjs` gets a `--scan-only` mode.** It runs only the `.only(` / `.skip(` / `.fixme(` scan, which needs no Jest results, as `guard:tests:scan` inside `npm run lint`. GUARD-03 in CI is unchanged. This closes 13-20's gap, where a `.fixme(` in `e2e/` passed every local gate and failed only in CI.

### Carried review findings

- **D-28: Fix eight parked info findings,** each pixel-neutral:
  - **Phase 13**
    - **IN-01:** reword the SafeCanvas comment and keep the WR-07 log that 13-11 added.
    - **IN-02:** `check-ci-gate.mjs` also fails on `${{` in a `with:` value of any non-checkout `uses:` step in the relay.
    - **IN-03:** it also flags a job `name:` outside `ci.yml` that holds `${{` and is not the relay shape.
    - IN-02 and IN-03 each get selftest cases.
  - **Phase 14**
    - **IN-01:** read the nav height without assuming px, in both `revealTrigger` and the e2e `triggerState`.
    - **IN-02:** `document.documentElement.clientHeight` in both.
    - **IN-03:** a named `closeOnCurrentLink` handler in `SiteNav`, with the block comment above it.
    - **IN-05:** the 4 s waits are derived from `TIMINGS.holdMs`, or replaced by `page.clock`.
    - **IN-06:** a Firefox-capable browser-Back row in "Focus on close stays in view", so LBOX-08 is guarded before Phase 18 rewrites the lightbox. If it hits the Firefox crash, the `@firefox-43967` tag rule applies.
  - **Also:** correct the `scripts/README.md` contrast paragraph from 36 to 47 pairs while documenting the new guard rules.
- **D-29: 14 IN-04 (the shared `STEP` class string) goes to Phase 18.** `CarouselControls.tsx` retires with the Carousel there, after which DemoTerminal's string is the only copy. Write the dispositions back in `13-REVIEW-DISPOSITION.md` and `14-REVIEW-DISPOSITION.md`: fixed with SHAs, and IN-04 deferred to Phase 18, following the 14-07 write-back precedent. Add a Phase 18 scope note to ROADMAP.md.

### Branch, pushes and gates

- **D-30: Phase 15 runs on `gsd/phase-15-region-plate-data-model`,** cut from `d29ea9a`: the Phase 14 tip, with the local ship-note. It is stacked while PR #148 is open. Merges are merge commits only, so once Tim merges #148, the Phase 15 PR's diff shrinks to Phase 15 alone, and `d29ea9a` reaches `main` with it as planned.
- **D-31: Standing push approval for `ci/15-*`** (Tim, 2026-11-14, "Standing approval, ci/15-* (Recommended)").
  - **Covered:** plain pushes of new `ci/15-*` branches, fast-forward fix pushes, and reading back their CI runs.
  - **Not covered:**
    - force pushes;
    - pushing the phase branch or `main`;
    - any visual-baselines dispatch, since none is expected; on a visual diff, stop and ask;
    - PNG commits, which stay Tim's.
- **D-32: Acceptance gates (ROADMAP).**
  - Every visual baseline is unchanged: Visual Regression passes with no updates on a `ci/15-*` push, and `check-snapshot-commit --none` passes.
  - `data:check` is green.
  - D-15 holds.
  - `npm run type-check` passes with zero errors across all three configs.
  - The phase declares no PNG set.
- **D-33: ROADMAP Phase 15 gets `**UI hint**: no`.** Without it, the wave UI gate token-sniffs the roadmap prose (memory; `d16d15b` precedent for Phase 13). This discussion's commit adds the line. No UI-SPEC is needed: nothing visible changes.

### Claude's Discretion

- The module layout, for example:
  - `lib/photos/routes.ts` holds `photoHref` and a slim route list that `proxy.ts` imports instead of the whole view-model (F5);
  - the view-model splits into Home waypoints, region series and photo views.
- `SheetMargin` is extracted from `SiteFooter` with zero visual diff, and `ContourField(plate, lod)` gets its plate parameter (both from the roadmap scope notes). `PlateSheet` is added only if Phase 15 needs it.
- The shape of `data/generated/terrain.ts`: keep a `terrain` export for the Matterhorn, or move to a `plates` map and update the consumers. Also the source layout: leave the Matterhorn in `data/terrain/source/`, or move it to a per-plate folder. Both must keep D-15 and `--check` exact.
- Whether `fetch-dem.mjs` gains `--plate` now or in Phase 16.
- Named test fixtures instead of index lookups, such as `photoBySlug('riffelsee-reflection')` (research PITFALLS), so adding photos can't change which photo a test audits.
- A test that reconciles the four asset-root lists (F14), and the per-plate asset budget test (research §2.4), with the fixture plate exercising the non-3D budget.
- When to widen the `PhotoId` regex. With D-01's id map, ids no longer depend on file names, so the regex can widen with the first non-Canon original in Phase 16.
- Whether `Elevation` gains a `product` field (research §1.3). That changes the generated data but not the pixels; add it only if Phase 15 needs it.
- A test that the sidecar schema stays closed (rejects unknown keys such as a serial or XMP fields; research PITFALLS).
- Country display names (a small lookup from the ISO code).
- How the `.gitignore` patterns cover upper and lower case on every platform.
- Where the Playwright configs end up, if the app config already includes them.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` § "Phase 15: Region & Plate Data Model": goal, six success criteria and scope notes (groundwork list, one builder run, flat prefixed names, Zermatt-only light table, GUARD-10, guard:tests suggestion, scripts/README 47 pairs, Phase 13 IN-01..03).
- `.planning/REQUIREMENTS.md`: DATA-09, DATA-10, DATA-11, DATA-15 and GUARD-10. Out of Scope table: no Home ascent changes, no URL move, one elevation source per plate.
- `.planning/PROJECT.md` Key Decisions rows dated 2026-11-12: region series, overview plus local plates, Home unchanged, launch regions inside the swissALTIRegio footprint, `/photos/<slug>` kept, JSON-LD and coarse locations.

### Research (v2.1)
- `.planning/research/ARCHITECTURE.md`:
  - findings F4 (hand-built URLs), F5 (proxy imports the view-model), F10 (MP4 walker), F11 (`map` LOD has no consumer), F12 (heightmaps 3D-only), F13 (schema literals), F14 (flat names), F15 (one builder);
  - §1.2 (plate ≠ region), §1.3 (photo → region, heights, `lowestDemM`), §1.4 (CI staleness checks);
  - §2.1 to §2.4 (per-plate build, `--check` determinism, precache, asset budget).
  - D-01 and D-11 deliberately deviate from §1.3 and §2.2.
- `.planning/research/PITFALLS.md`:
  - "Drone material" (sidecars, `.SRT`/`.LRF`, DJI XMP, the closed sidecar schema, the explicit id map; around lines 45 to 68);
  - named fixtures instead of index lookups (line 37);
  - G5/G6 before the photo-script refactor (line 485);
  - the "Originals" release checklist (line 580).
- `.planning/research/SUMMARY.md`: D9 (privacy rules for new material) and the Phase 15 deliverables list (around line 129).

### Carried findings and earlier decisions
- `.planning/phases/13-repo-safety-test-debt/13-REVIEW.md` IN-01, IN-02 and IN-03, and `13-REVIEW-DISPOSITION.md`, where the rows are written back.
- `.planning/phases/14-ui-fixes-terminal-controls/14-REVIEW.md` IN-01 to IN-06, and `14-REVIEW-DISPOSITION.md`, where the rows are written back.
- `.planning/phases/14-ui-fixes-terminal-controls/14-CONTEXT.md` D-09, D-11 and D-21: the LBOX-08 contract and `revealTrigger`, which 14 IN-01, IN-02 and IN-06 touch.
- `.planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md` row #14: 07 IN-08 becomes GUARD-10.
- `.planning/phases/13-repo-safety-test-debt/13-06-SUMMARY.md`: the GUARD-10 measurement (5,482 errors in 103 files; 69 in 21 with the globals declared).
- `.planning/phases/13-repo-safety-test-debt/13-12-SUMMARY.md`: `--root` on the photo scripts and the G5/G6 selftest pattern that D-13 reuses.
- `.planning/phases/13-repo-safety-test-debt/13-20-SUMMARY.md`: the `@firefox-43967` tag rule and the local guard:tests gap (D-27).

### Code the phase changes
- `data/schemas/photo.ts`, `data/photos/exif-sidecar.json`, `data/photos/corrections.json`, `data/photos/editorial.ts` and `data/generated/photos.ts`.
- `scripts/photos/extract-exif.mjs` (the `idFromFile` regex at line 67), `scripts/photos/build-photo-data.mjs` and `scripts/photos/build-derivatives.mjs`.
- `data/schemas/terrain.ts`, `data/terrain/source/source.json`, `scripts/terrain/build-terrain.mjs` (`MANAGED`, the stale sweep, `--check`) and `data/generated/terrain.ts`.
- `lib/ascent/waypoints.ts`, `lib/photos/view-model.ts`, `components/site/SiteFooter.tsx`, `components/home/TrailSigns.tsx`, `components/terrain/ContourField.tsx` and `proxy.ts`.
- The photo-URL call sites: `components/home/WaypointCard.tsx:110`, `components/photos/{CarouselControls,CarouselStepper,CarouselView,JustifiedGrid,MapSheet}.tsx`, `components/photos/PhotoViewer.tsx:241,261`, `app/sitemap.ts` and `lib/saved-pages.ts`.
- `scripts/guards/check-served-images.mjs` with its selftest fixtures under `scripts/guards/__selftest__/served-images/`, `scripts/guards/lib/mp4-boxes.mjs` and `.gitignore`.
- `scripts/guards/test-count.mjs`, `tsconfig.json` and `package.json` (the `type-check` and `lint` scripts).
- `scripts/README.md`: the contrast paragraph, 36 → 47 pairs.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`--root` testability on the photo scripts (13-12).** D-13's fixture plate reuses the same temp-root pattern for `build-terrain.mjs`.
- **The MP4 box walker** (`scripts/guards/lib/mp4-boxes.mjs`) already rejects extra tracks and GPS boxes. DATA-15 adds file-type rules and fixtures around it.
- **`buildWaypoints`** already owns the single DEM order and throws a `RangeError` on bad data. The Home list narrows its input, and the sort stays.
- **Strict Zod schemas** in `data/schemas/*.ts` import only `zod`, so the `.mjs` generators can type-strip them. New schemas for `photo-map.json`, `regions.json` and `plates.json` follow the same rule.

### Established Patterns
- The `--check` mode of every generator is the CI staleness gate (`data:check` in `lint`).
- Hashed, flat asset names, checked by the guard's `hash-name` and `orphan` rules against the generated manifests.
- Guards prove themselves with selftest fixtures (`npm run guard:selftest`).
- Tests are rewritten in place, never deleted or skipped (GUARD-03), and test counts only go up.
- Visual baselines come only from the CI dispatch, and only Tim commits PNGs. This phase expects none.

### Integration Points
- **`lowestDemM`:** `data/generated/photos.ts:160` is read by `components/home/__tests__/rail.test.tsx`, `data/__tests__/photos.test.ts` and `e2e/home-ascent.spec.ts`. They move to the Home-list value with the same 1,617.
- **Footer ticks:** `SiteFooter.tsx` loops over `photos` at line 74.
- **`app/sitemap.ts:18`** builds the absolute form (`` `${site.url}/photos/${slug}` ``), so D-18's scan must catch `/photos/${` inside a longer template, and the sitemap prefixes `site.url` to `photoHref`.
- **Trail sign count:** `TrailSigns.tsx:36` uses `photos.length`.
- **The `/photos` header kicker** ("4 waypoints · 1,617–2,760 m · Zermatt") is computed from the light table's photos, which become the Zermatt series. Phase 18 retires it.
- **`proxy.ts:5`** imports `photoSlugs` from the full view-model. It should import a slim route list instead.

</code_context>

<specifics>
## Specific Ideas

- Each `photo-map.json` record keeps the slug or file name readable at a glance. The Home list carries the slug as a comment beside each id.
- Every rule that fails names the file and the fix, for example "add a record for IMG_1234.jpg to data/photos/photo-map.json". That matches the existing guard and generator messages.

</specifics>

<deferred>
## Deferred Ideas

- **14 IN-04 (shared `STEP` class string) goes to Phase 18.** It resolves when the Carousel retires (D-29).
- **Phase 18 may reword Home's trail sign** once the album has an overview (D-09).
- **`regionHref` goes to Phase 17,** after the region path spike (D-19).
- **Removing the Matterhorn's unused `map` LOD** (93 KB, F11) would change the file set, so it is not done here. Revisit only with an intended asset change.

</deferred>

---

*Phase: 15-region-plate-data-model*
*Context gathered: 2026-11-14*
