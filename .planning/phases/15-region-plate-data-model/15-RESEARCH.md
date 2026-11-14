# Phase 15: Region & Plate Data Model - Research

**Researched:** 2026-11-14
**Domain:** In-repo data model, offline terrain/photo generators, served-asset guard, TypeScript test type-checking (Next 16.4.5 / TS 6.0.3 / Jest 30.5.2 / Playwright 1.65.0 / Zod 4)
**Confidence:** HIGH (codebase-grounded; every open question settled by reading the code or running a read-only command)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Region and country data (DATA-10)

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

#### Home waypoint list (DATA-09)

- **D-06: Home has an explicit list of four photo ids:** `img-0605`, `img-0629`, `img-0662`, `r004-011`, each with its slug as a comment. The list controls membership only. The order is still DEM height ascending with ties broken by id, as `buildWaypoints` does today, so the single-order rule and its tests are unchanged.
- **D-07: The list is strict.** A test or the build fails unless it has exactly four ids, all in region `zermatt` and on plate `matterhorn`. Changing the ascent is out of scope for v2.1, and Home's layout (poster pins, plaque, label rules) is tuned for four.
- **D-08: The rail start is the lowest DEM height among the listed waypoints.** That is 1,617 m (`img-0605`) today, so the value is unchanged. `lowestDemM` is no longer generated over every photo. It is computed in `lib/ascent` over the Home list (research §1.3). Otherwise the first lower photo anywhere in the Alps would silently move the rail.
- **D-09: Every Home consumer reads the list.** That covers the waypoint cards, the poster pins, the 3D pins, the rail ticks and the footer ticks. `SiteFooter` renders on every route and loops over every photo today. It also covers Home's trail sign ("Photographs · 4 waypoints", `components/home/TrailSigns.tsx:36`, which counts every photo today); it counts the Home list and stays at 4. Phase 18 may reword the sign once the album has an overview.
  - **The test (success criterion 1):** add a photo outside the list, or in another region. The ascent, the 1,617 m rail start, the footer ticks and the trail sign all stay unchanged.

#### Plate registry and terrain build (DATA-11)

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

#### Photo URL helper (success criterion 5)

- **D-16: One helper, `photoHref(slug)`, builds every photo URL in the app.** It returns `/photos/<slug>` and covers:
  - Link hrefs, `router.push` and `history.replaceState` (PhotoViewer ×2);
  - the sitemap and the saved-pages catalog;
  - metadata canonicals and OG paths.

  The plain `/photos` index link is not a photo link and is allowed.
- **D-17: Tests keep the literal `/photos/${slug}`,** about 30 sites in Jest and e2e. That keeps them an independent check of the URL contract (PHOTO-05). One unit test pins `photoHref(slug) === '/photos/' + slug`.
- **D-18: A Jest source-scan test proves the one-helper rule.** It reads `app/`, `components/`, `lib/` and `proxy.ts` (not tests or e2e) and fails on any hand-built photo path: a `` `/photos/${…}` `` template, `'/photos/' + …` concatenation, or a `router.push` or `replaceState` with one. It runs in the Unit Tests job and in `npm test`.
- **D-19: `regionHref` waits for Phase 17,** which fixes the region path after its intercept spike. Phase 17 adds it to the same module and extends the scan to region paths.

#### Telemetry guard (DATA-15)

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

#### Test type-check (GUARD-10)

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

#### Carried review findings

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

#### Branch, pushes and gates

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

### Deferred Ideas (OUT OF SCOPE)

- **14 IN-04 (shared `STEP` class string) goes to Phase 18.** It resolves when the Carousel retires (D-29).
- **Phase 18 may reword Home's trail sign** once the album has an overview (D-09).
- **`regionHref` goes to Phase 17,** after the region path spike (D-19).
- **Removing the Matterhorn's unused `map` LOD** (93 KB, F11) would change the file set, so it is not done here. Revisit only with an intended asset change.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-09 | Adding photos or regions never changes Home: four Matterhorn waypoints, 1,617 m rail start, footer ticks, from an explicit Home waypoint list | §"DATA-09: Home list" — filter in the *default input* of `buildWaypoints`, never inside it; six `lowestDemM` consumers (not three); seven tests that read the global `photos` for Home surfaces; success-criterion-1 test via `jest.mock` of the generated photos module |
| DATA-10 | Every photo has an explicit region and country in typed, committed data that CI checks | §"DATA-10: photo map, regions, generators" — schemas, where each D-01 failure is checked (local vs CI), `PHOTO_DATA_INPUTS` in the G5 harness must grow, `extract-exif.mjs` needs `--root` for fixture cases |
| DATA-11 | Terrain build reads a plate registry, builds every plate in one run, `--check` deterministic, Matterhorn byte-identical | §"DATA-11: plate registry and terrain build" — `build-terrain.mjs` has no `--root`; `MANAGED` and the poster regexes must widen; keep `terrain.ts` byte-identical and add `data/generated/plates.ts`; fixture plate lives in `selftest.mjs` (sharp is ESLint-banned in Jest) |
| DATA-15 | Served-asset guard rejects drone sidecars and telemetry anywhere in repo or site | §"DATA-15: telemetry guard" — walker rejection measured on five synthetic MP4s; repo mode needs `-co --exclude-standard` plus a `public/` walk; `.gitignore` bracket patterns; selftest `cwd` cases with a temp git repo |
| GUARD-10 | `npm run type-check` covers Jest tests, e2e specs and Playwright configs with zero errors | §"GUARD-10" — re-measured **100 errors in 24 files** (99 in 23 Jest files + 1 in 1 e2e file); globals d.ts shape verified against installed packages; d.ts location constraint (Jest would collect it from `__tests__/`); child tsconfigs must override `exclude` |
</phase_requirements>

## Project Constraints (from AGENTS.md, CLAUDE.md and memory)

No `./CLAUDE.md` or `./.claude/CLAUDE.md` exists. Directives that bind this phase:

- **AGENTS.md:** "This is NOT the Next.js you know … Read the relevant guide in `node_modules/next/dist/docs/` before writing any code." Next facts below are cited from those docs. `next dev` re-adds the AGENTS.md block; committing it keeps the tree clean.
- **Installs use the bundled npm:** `node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" …` (bundled 11.20.0). `npm` on PATH resolves to the global 11.6.1, which rewrites unrelated lockfile metadata. [VERIFIED: `npm --version` → 11.6.1; bundled `npm-cli.js --version` → 11.20.0]
- **Recursive content search uses `git grep`** (a plain recursive grep reaches `.env.local`). Never read `.env*`.
- **Git Bash path mangling:** `git grep -F "/photos"` silently returns nothing under Git Bash because MSYS rewrites the leading `/`. Prefix with `MSYS_NO_PATHCONV=1`. [VERIFIED: reproduced this session]
- **Visual baselines** come only from the CI `workflow_dispatch` container; only Tim commits PNGs; this phase declares no PNG set and dispatches nothing (D-31, D-32).
- **`npm run build`'s postbuild rewrites tracked `public/service-worker.js`;** `git restore public/service-worker.js` after any local build (including `PW_PROD=1` without `PW_REUSE=1`, which builds). Stop orphan `next start` before `npm ci`.
- **Never touch Claude settings files.** Push only `ci/15-*` under D-31.
- **Tests are rewritten in place, never deleted or skipped** (GUARD-03); test counts only go up.
- **UI skills** (`.claude/skills/ui-ux-pro-max` etc.) apply only to judging the zero-diff `SheetMargin` extraction; nothing visible is designed in this phase.

## Summary

Phase 15 is pure groundwork. All five requirements can be built with in-repo patterns and no new runtime library. The only package change is promoting `@jest/globals` 30.5.2 (already hoisted in the lockfile) to a direct devDependency. The research settled each open question against the code; six findings change or sharpen the plan:

1. **GUARD-10 is 100 errors in 24 files, not 69 in 21** (TS 6.0.3, Jest 30.5.2, jest-dom 7.0.1; 99 in 23 Jest files plus `e2e/home-canvas.spec.ts:1004`). The result is the same with and without `next-env.d.ts`, so CI (where that file is absent) agrees. About 45 of them are one cause: untyped `jest.fn()` is `Mock<UnknownFunction>` under `@jest/globals`, so `mockResolvedValue(x)` takes `never`. A globals file that fails to resolve `@jest/globals` makes every global `any` *with no error*, because `skipLibCheck: true` suppresses errors inside `.d.ts` files (measured: 287 bogus errors, none of them in the d.ts). The plan needs a canary that proves the globals are typed.
2. **The globals d.ts cannot sit in a `__tests__/` folder unless Jest ignores `.d.ts` files.** Jest's `testMatch` collects `__tests__/jest-globals.d.ts` as a test suite (measured with micromatch). It also cannot sit anywhere else without a `tsconfig.json` exclude, because the app config includes `**/*.ts`. Child tsconfigs must override `exclude`. Otherwise they inherit `e2e/**`, `**/__tests__/**` and `**/*.spec.ts` and silently check nothing.
3. **`build-terrain.mjs` has no `--root` today**, and three regexes block prefixed plates: `MANAGED`, `PosterAvif`/`PosterWebp` and the `hillshade-(1100|640)` refine. Keep `data/generated/terrain.ts` byte-identical as the Matterhorn/Home module, and emit new plates to a second generated module. That module's URLs must join the guard's `MANIFESTS`. The fixture-plate test must live in `scripts/guards/selftest.mjs`, because `sharp` is ESLint-banned outside `scripts/`.
4. **`lowestDemM` has six consumers, not three** (`lib/ascent/summit.ts` for "Height gained", plus `lib/__tests__/ascent-summit.test.ts` and `e2e/home-canvas.spec.ts`). Seven tests read the global `photos` for Home surfaces (footer ticks, trail sign, `n`), and they must move to the Home list. Without that move, Phase 16 breaks them even though Phase 15 stays green.
5. **The MP4 walker rejects every telemetry-track kind.** This was measured on five synthetic files built by splicing a second `trak` into the committed clean fixture clip. Fixtures need no ffmpeg and no camera data. In repo mode, the guard today lists only *tracked* files; D-21 needs `-co --exclude-standard` plus a full `public/` walk.
6. **Photo URLs are built by hand at 11 sites in 10 files** (not 13). All 11 are `/photos/${` templates, so one regex family covers them. No false positive was found against `'/photos'`, `` `/photos?view=${view}` ``, regex literals `\/photos\/` or `/images/photos/`.

**Primary recommendation:** Do GUARD-10 first, so every later test edit is type-checked. Then do the three registries plus the terrain builder (`--root`, plate loop, union sweep, `plates.ts`), and prove D-15 with a literal pin test plus the selftest fixture plate. Then move the photo scripts and Home consumers. Keep `terrain.ts`, `precache.json` and every `public/terrain/` byte identical.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Photo → region/country membership, id map | Build-time generators (`scripts/photos/*.mjs`) | Committed data (`data/photos/photo-map.json`) | Offline, CI-checked by `--check`; never derived at runtime (D-02) |
| Plate registry, per-plate asset build | Build-time generator (`scripts/terrain/build-terrain.mjs`) | CDN/static (`public/terrain/`, flat hashed names) | One run owns every plate (F15); output is static, immutable-cached |
| Home waypoint list, rail start | Shared lib (`lib/ascent/`) consumed by Server Components | — | Pure data function; Home components are server-rendered |
| Region series for `/photos` | Shared lib (`lib/photos/view-model.ts`) | Frontend server (RSC pages) | Filter by generated `photo.region`; no registry import in client code |
| Photo URL building | Shared lib (`lib/photos/routes.ts`) | Frontend server (proxy, sitemap, metadata) and browser (router.push, replaceState) | One helper used by every tier |
| Unknown-slug 404 | Frontend server (`proxy.ts`) | — | Needs a slim slug set, not the view-model (F5) |
| Telemetry ban | CI guard (`check-served-images.mjs`) | `.gitignore` (convenience) | The guard is the enforcement; `.gitignore` only prevents `git add -A` accidents |
| Test type-checking | Tooling (`tsc` × 3 configs) | CI lint-and-typecheck job | `next build` type-checks only `tsconfig.json` |

## Standard Stack

### Core (all already installed; versions read from `node_modules/*/package.json` this session)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| typescript | 6.0.3 | `tsc -p` × 3 | Repo's compiler [VERIFIED: node_modules] |
| jest | 30.5.2 | unit tests | Repo's runner [VERIFIED] |
| @jest/globals | 30.5.2 | the types of `describe/it/expect/jest` for the globals d.ts | Jest's own type entry; hoisted at `node_modules/@jest/globals`, lockfile line 1930 [VERIFIED: package-lock.json] |
| @testing-library/jest-dom | 7.0.1 | `./jest-globals` export augments `@jest/expect`'s `Matchers` | Exports map has `"./jest-globals": { "types": "./types/jest-globals.d.ts" }` [VERIFIED: node_modules/@testing-library/jest-dom/package.json] |
| @playwright/test | 1.65.0 | e2e | Repo's runner [VERIFIED] |
| zod | ^4.6.7 | strict schemas for `photo-map.json`, `regions.json`, `plates.json` | Existing schema pattern, zod-only imports so `.mjs` generators type-strip them [VERIFIED: data/schemas/terrain.ts:13-17] |
| sharp | ^0.35.5 | fixture DEM/JPEG generation inside `selftest.mjs` only | ESLint bans it outside `scripts/` [VERIFIED: eslint.config.mjs:74] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| d3-contour / simplify-js | 4.0.3 / 1.2.4 | contour LODs per plate | unchanged code path, per plate |
| fast-png | 8.0.0 | (alternative) 16-bit PNG encode without sharp | only if a fixture DEM must be made outside `scripts/` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@jest/globals` + local d.ts | `@types/jest` | Not approved (D-24); its looser `jest.fn()` typing would hide ~45 real mock-type errors |
| three `tsc -p` runs | `tsc -b` with project references | Needs `composite` and declaration emit; no benefit at this size |

**Installation (bundled npm, D-24):**
```bash
node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" install --save-dev --save-exact @jest/globals@30.5.2
# then: git diff package-lock.json  -> only the root "devDependencies" entry should change
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| @jest/globals | npm | 30.5.2 published 2026-09-18 | 62.7M/wk | github.com/jestjs/jest | [OK] (`gsd-tools query package-legitimacy check`) | Approved; already a transitive dep at the same version; no postinstall [VERIFIED: npm registry] |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 committed inputs                         generators (offline, CI --check)                  outputs (committed)                 consumers
 ────────────────                         ────────────────────────────────                  ───────────────────                 ─────────
 assets/photos-original/ (ignored) ─┐
 data/photos/photo-map.json ────────┼──► photos:exif  (file→id from map; fails on       ──► data/photos/exif-sidecar.json
                                    │                  unmapped original / dup file)
 data/regions/regions.json ─────────┤
 data/terrain/plates.json ──────────┼──► photos:build (map↔sidecar bijection; region→  ──► data/generated/photos.ts ──┬──► lib/ascent (Home list ⊂ photos:
 data/photos/corrections.json ──────┤                  plate→source raster; WR-01        (+region,+country,           │     buildWaypoints, homeLowestDemM)
 data/terrain/source/ (matterhorn) ─┤                  per plate; DEM sample)            −lowestDemM)                 │      └─► Home, SiteFooter ticks, TrailSigns
 data/terrain/plates/<id>/ (later) ─┘                                                                                 └──► lib/photos/view-model (series 'zermatt')
                                    └──► terrain:build (loop plates; union sweep;      ──► public/terrain/<prefix><asset>.<hash>.<ext> (flat)
                                                        terrain.ts = home plate,      ──► data/generated/terrain.ts  (byte-identical)
                                                        plates.ts = every plate)      ──► data/generated/plates.ts   (new) ──► ContourField(plate, lod)
                                                                                      ──► data/generated/precache.json (home only, unchanged)
 lib/photos/routes.ts (photoHref, route slugs) ──► proxy.ts KNOWN set, sitemap, links, router.push, replaceState, canonical
 check-served-images (repo: git ls-files -co --exclude-standard; public/: full walk) ──► fails on telemetry files and MP4 extra tracks
```

### Recommended Project Structure (delta only)

```
data/
├── home.ts                    # + homeWaypointIds (4 ids, slug comments)
├── photos/photo-map.json      # NEW (D-01)
├── regions/regions.json       # NEW (D-03)
├── terrain/plates.json        # NEW (D-10); Matterhorn source stays in data/terrain/source/
├── schemas/photo.ts           # + PhotoMap, PhotoFacts.region/country
├── schemas/region.ts          # NEW (zod-only)
├── schemas/terrain.ts         # + Plates registry, PlateSheet meta; poster regexes allow a prefix
└── generated/plates.ts        # NEW (generated)
lib/
├── ascent/home.ts             # NEW: homeInput(), homeLowestDemM (or inside waypoints.ts)
└── photos/routes.ts           # NEW: photoHref, photoRouteSlugs (slim; proxy imports this)
components/terrain/SheetMargin.tsx  # NEW: extracted from SiteFooter (zero diff)
__tests__/jest-globals.d.ts    # NEW (location: see GUARD-10 option table)
tsconfig.jest.json, tsconfig.e2e.json   # NEW
```

### GUARD-10: test type-check

**Measured (2026-11-14, HEAD ffb0d81):** two scratch configs outside the repo. Each `extends` the absolute repo `tsconfig.json` with `incremental: false` and overrides `exclude`. A scratch globals d.ts resolved `@jest/globals` through `paths`.

| Scope | Errors | Files | Note |
|-------|--------|-------|------|
| Jest tests (105 files: 63 `.ts`, 42 `.tsx`) | **99** | **23** | identical with and without `next-env.d.ts` |
| e2e (36 specs) + `playwright.config.ts` + `playwright.prod.config.ts` | **1** | **1** | `e2e/home-canvas.spec.ts(1004,72)` TS2339 `getContext` on `Element` |
| App `tsconfig.json` | 0 | — | unchanged |

**By cause (Jest scope, 99):**

| # | Cause | Count | Files | Proper fix (D-26) |
|---|-------|-------|-------|-------------------|
| A | Untyped `jest.fn()` is `Mock<UnknownFunction>`, so `mockResolvedValue/RejectedValue/ReturnValue(x)` takes `never` | 38 | `app/api/__tests__/feedback.test.ts` (14), `components/contact/__tests__/SummitRegister.test.tsx` (15), `CopyEmailButton.test.tsx` (4), `lib/__tests__/rate-limit.test.ts` (5) | type the mock: `jest.fn<typeof fetch>()`, `jest.fn<() => Promise<RateLimitResult>>()`, or `jest.mocked(fn)` on a `jest.mock`ed module |
| B | `mockImplementation()` / `mockResolvedValue()` with no argument (required in jest-mock 30) | 7 | feedback (4), rate-limit (3) | `.mockImplementation(() => {})`, `.mockResolvedValue(undefined)` |
| C | Typed mock arity versus `toHaveBeenCalledWith` | 9 | `RouteLogFilters.test.tsx` (7), `terrain-stage.test.tsx:99`, `sw-update.test.ts:182` | type the mock from the real signature (the app calls `replace(url, { scroll: false })`) |
| D | `jest.SpyInstance` is a `@types/jest` name, absent from `@jest/globals`, plus cascading TS7006 | 5 + 5 | `SafeCanvas.test.tsx:23`, `OfflineRetry.test.tsx:11,18`, `rate-limit.test.ts:372`, `useAscentMode.test.tsx:18` | `jest.Spied<typeof console.error>` or `ReturnType<typeof jest.spyOn>` |
| E | `it.each(arr.map(...))` tables infer unions, not tuples | ~20 | `lib/og/__tests__/routes.test.ts` (18), `service-worker-media.test.ts:180`, `template.test.tsx` | `it.each<[Route, Card]>(…)` or `as const` tuples |
| F | Mock function versus real DOM/lib signature (matchMedia, Redis ctor, timers) | ~7 | `SiteNav.test.tsx:42`, `DemoTerminal.test.tsx:78`, `useAscentMode.test.tsx:29`, `rate-limit.test.ts:361`, `service-worker-navigation.test.ts:190`, `useReducedMotion.test.tsx:20` | type the factory's return as `MediaQueryList` etc. |
| G | Hook/test returns a value: `beforeEach(() => x.mockClear())` | 2 | `pin-layer-3d.test.tsx:34`, `routes.test.ts:85` | braces: `beforeEach(() => { x.mockClear(); })` |
| H | Real fixture drift | ~7 | `Metrics.test.tsx:207`, `sections.test.tsx:448` (missing required `links`), `editorial.test.ts:157` (string index), `photos.test.ts:102` (`reason` narrowing), `saved-pages.test.ts:61` (TS2558), `template.test.tsx:310`, `rate-limit.test.ts:29` (TS7022) | fix the fixture/narrowing; use `@ts-expect-error -- <reason>` only for deliberate bad input |

[VERIFIED: scratch tsc runs this session; outputs grouped by `grep -c` per message.] The jump from 13-06's 69 is partly measurement method: 13-06 probably aliased `SpyInstance`, and Phases 13 and 14 changed tests since.

**Globals d.ts (verified to type-check against the installed packages):**

```ts
// __tests__/jest-globals.d.ts  — Jest globals for tsconfig.jest.json only (GUARD-10, D-24)
import type {
  describe as d, it as i, test as t, expect as e, jest as j,
  beforeAll as ba, beforeEach as be, afterAll as aa, afterEach as ae,
} from '@jest/globals';
import type { ClassLike, FunctionLike, UnknownFunction } from 'jest-mock';
import '@testing-library/jest-dom/jest-globals'; // augments @jest/expect Matchers (jest-dom 7.0.1)

declare global {
  const describe: typeof d;
  const it: typeof i;
  const test: typeof t;
  const expect: typeof e;
  const jest: typeof j;
  // A types-only namespace merges with the const above, so `jest.Mock<…>` works in type positions.
  namespace jest {
    type Mock<T extends FunctionLike = UnknownFunction> = j.Mock<T>;
    type Mocked<T extends object> = j.Mocked<T>;
    type MockedFunction<T extends FunctionLike> = j.MockedFunction<T>;
    type Spied<T extends ClassLike | FunctionLike> = j.Spied<T>;
    type SpiedFunction<T extends FunctionLike> = j.SpiedFunction<T>;
  }
  const beforeAll: typeof ba;
  const beforeEach: typeof be;
  const afterAll: typeof aa;
  const afterEach: typeof ae;
}
export {};
```

The repo uses these namespace members: `jest.Mock` (45), `jest.SpyInstance` (5), `jest.MockedFunction` (2) and `jest.SpiedFunction` (1) [VERIFIED: `git grep -ohE "\bjest\.[A-Z][A-Za-z]+"`]. Do not alias `SpyInstance`; fix the five sites (cause D). jest-dom's `types/jest-globals.d.ts` reads `declare module '@jest/expect' { export interface Matchers<R …> extends TestingLibraryMatchers<…> {} }` [VERIFIED: file read this session]. The runtime `jest.setup.js` keeps importing `@testing-library/jest-dom`; the d.ts is types only.

**Location of the d.ts (a real constraint, measured):**

| Option | Change | Pros | Cons |
|--------|--------|------|------|
| **A. `__tests__/jest-globals.d.ts` at the repo root + `testPathIgnorePatterns: [..., '\\.d\\.ts$']` in `jest.config.js`** (recommended) | 1 line in `jest.config.js` | `tsconfig.json` stays literally unchanged (D-25); the app config already excludes `**/__tests__/**` | Without the ignore pattern, Jest collects the file as a suite and fails ("must contain at least one test"): micromatch `isMatch('__tests__/jest-globals.d.ts', '**/__tests__/**/*.[jt]s?(x)')` → `true` [VERIFIED] |
| B. `types/jest-globals.d.ts` + add it to `tsconfig.json` `exclude` | 1 line in `tsconfig.json` | Jest never sees it | Edits the app config D-25 says stays unchanged; without the exclude, the app's `**/*.ts` include leaks Jest globals into app code |

**The three tsconfigs:**

```jsonc
// tsconfig.jest.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "incremental": false },
  "include": ["next-env.d.ts", "**/__tests__/**/*.ts", "**/__tests__/**/*.tsx"],
  // MUST override: the base exclude lists **/__tests__/**, *.test.ts(x), e2e/** and would empty this config
  "exclude": ["node_modules", "e2e/**", "scripts/guards/__selftest__/**"]
}
// tsconfig.e2e.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "incremental": false },
  "include": ["next-env.d.ts", "e2e/**/*.ts", "playwright.config.ts", "playwright.prod.config.ts"],
  "exclude": ["node_modules"]   // MUST override: base excludes e2e/** and **/*.spec.ts
}
```

```json
"type-check": "tsc --noEmit && tsc -p tsconfig.jest.json && tsc -p tsconfig.e2e.json"
```

- `include`, `exclude` and `files` are inherited from the base when a child omits them. A child that overrides only `include` inherits the base `exclude`, which removes every test or spec, and that failure is silent or shows up as TS18003. [CITED: TypeScript tsconfig `extends` semantics; ASSUMED wording, behaviour matches the measurement method]
- `tsconfig.json` already includes `playwright.config.ts` and `playwright.prod.config.ts` [VERIFIED: `tsc -p tsconfig.json --listFilesOnly`]. Leave it unchanged; the e2e config checks them again without Jest globals, which is harmless (they pass both).
- `lib/__tests__/audit-routes.test.ts:17` imports `../../e2e/routes`, so the Jest config also type-checks `e2e/routes.ts` transitively. That is harmless; it is plain data.
- `next build` type-checks only the config `typescript.tsconfigPath` names (default `tsconfig.json`) through the project-local `tsc` CLI: "The CLI checks the complete project selected by your `tsconfig` file. This includes test files and `.next/dev/types` when they are included by that configuration." [CITED: node_modules/next/dist/docs/01-app/03-api-reference/05-config/02-typescript.md:38-40]. So tests stay out of `next build` as long as `tsconfig.json` keeps excluding them.
- The CI `lint-and-typecheck` job runs `npm run type-check` with no `next-env.d.ts` (gitignored) and no `.next/types`. The measurement above matched that case.
- `incremental: false` in the children avoids two new `.tsbuildinfo` files. `*.tsbuildinfo` is already gitignored, so either setting is safe.

**`@jest/globals` pin:** D-24 says "pinned to the jest version". `jest` is `^30.5.2`. An exact `30.5.2` pin drifts when Dependabot bumps jest to 30.6 (two copies, mismatched types). Use the same range as jest (`^30.5.2`) or group them in Dependabot (Open Question 1, resolved: `^30.5.2`, carried by 15-01).

**D-27 `--scan-only`:** `test-count.mjs` `parseArgs` requires `--jest` (`if (!args.jest) usage('--jest <file> is required')`) [VERIFIED: scripts/guards/test-count.mjs:63]. The scan is self-contained: `findFocusedOrSkipped(root)` walks `<root>/e2e/` and every `__tests__` under `UNIT_TEST_ROOTS = ['app', 'components', 'lib', 'data']` with `FOCUS_OR_SKIP = /\.(only|skip|fixme)\(/` [VERIFIED: scripts/guards/test-count.mjs:35-37]. Add a `--scan-only` flag that skips the `--jest` requirement, the Jest read and `loadPlaywrightList` (which spawns `npx playwright test --list`, slow), and runs only `findFocusedOrSkipped(args.root)`. Reject `--scan-only` together with `--jest`, `--list` or `--update`. Script: `"guard:tests:scan": "node scripts/guards/test-count.mjs --scan-only"`, appended to `lint`. Selftest: reuse the existing fixtures `tc('focused')` (expect exit 1 and `x.ts:2`) and `tc('clean')` (exit 0). No guard parses `package.json` scripts, so adding to `lint` needs no guard change [VERIFIED: `git grep` over scripts/guards and scripts/ci].

### DATA-11: plate registry and terrain build

**Today's builder (read in full):**

- `ROOT` is fixed from `import.meta.url` (line 77). **There is no `--root`:** the arg check allows only `--check` (lines 598-603). Every path constant (`SOURCE_DIR`, `PUBLIC_DIR`, `META_PATH`, `PRECACHE_PATH`) is module-level. Port `build-photo-data.mjs`'s `parseArgs` (parse before deriving any path; lines 64-100) [VERIFIED: scripts/terrain/build-terrain.mjs:77-90, 598-603].
- `MANAGED = /^(contours-[a-z0-9-]+\.[^.]+\.svg|heightmap-[0-9]+\.[^.]+\.png|hillshade-[0-9]+\.[^.]+\.(avif|webp))$/` [VERIFIED: :89-90]. A prefixed `fixture-contours-hero.<h>.svg` **does not match**, so neither the sweep nor `--check`'s `extra` rule sees it. Widen to an optional `<plate>-` prefix and build the sweep's expected set as the union over plates.
- `SUMMIT` (Matterhorn name, 4478 m, ref URL, `lv95 {e: 2617049, n: 1091673}`) is hard-coded (:93-98). `STRIP` uses `SUMMIT.lv95.n` for `stripBbox` (:418). Move these into the registry entry with identical values, or keep them as the Home plate's constants. A 2D plate needs a `stripCentreN` (any whole-metre northing; `stripBbox` snaps to 100 m and needs `width / 5 ≤ height`) [VERIFIED: lib/geo.ts:81-92].
- `committedMeta()` parses terrain.ts with `/export const terrain = ([\s\S]*) as const;\s*$/` to recover the recorded poster URLs (:326-337). **Any change to terrain.ts's shape breaks the lossy-poster "kept" path**, and `--check` then reports the posters stale.
- Lossy posters are never re-encoded when the committed set passes `inspectPoster`, `sameSource` and `sameParams` (:347-393). Heightmaps are kept when the name hash and pixels match (:246-265). SVG, terrain.ts and precache.json are byte-compared (:557-591). That is why Matterhorn byte-identity is achievable: the Matterhorn path runs the same pure functions on the same raster.
- `precacheText = [strip, hero]` of the one meta (:466-470). It must stay exactly that: Home plate only (D-14).
- Measured: `npm run terrain:build -- --check` → `terrain: OK` in 0.8 s [VERIFIED].

**Recommended generated-output shape (discretion):**

| Option | terrain.ts | Consumers | Verdict |
|--------|-----------|-----------|---------|
| **A. Keep `export const terrain` = Home plate, byte-identical; add `data/generated/plates.ts` (`export const plates = { matterhorn: {...2D sheet...}, <id>: {...} } as const`)** | unchanged (2,305 B; `committedMeta` regex unchanged) | ~40 importers of `terrain` untouched; `ContourField`/`SheetMargin` read `plates[plate]` | **Recommended** |
| B. Replace with a `plates` map in terrain.ts | rewritten | ~40 files + tests rewritten; `committedMeta` rewritten; `terrain.test.ts:59-63` and `trail-profiles.test.ts:137` cap terrain.ts at 4096 B, which N plates exceed | Reject |
| C. Append a second export to terrain.ts | bytes change | `committedMeta`'s `\s*$` anchor breaks | Reject |

With A, `plates.ts` carries per plate: `id`, `prefix`, `crs`, `extent.lv95`, `dem {product, edition, cellM}`, the declared contour LODs with `intervalM`/`indexEvery` and URL, the strip `lv95`, the hillshade `{avif, webp}` URLs plus `sourceSha256`. For non-Home plates, the builder reads its recorded poster set from `plates.ts`. Add `data/generated/plates.ts` to the guard's `MANIFESTS` (check-served-images.mjs:91-95), or prefixed fixture files report `orphan`. Add a Jest test that `plates.matterhorn`'s URLs equal `terrain.assets` (no drift), and give `plates.ts` its own size budget.

**Keep the Matterhorn source where it is** (`data/terrain/source/`). It is named in terrain.ts's header comment (part of the byte-compared text, :460), in `.gitattributes:7,12,35`, `build-trails.mjs`, `fetch-dem.mjs`, `data/__tests__/terrain.test.ts:23`, `trail-profiles.test.ts:19` and the G5 harness. New plates go in `data/terrain/plates/<id>/{source.json,dem-10m.png}`; the registry names each plate's source dir.

**Registry shape (illustrative; field names are a recommendation):**

```json
{
  "schemaVersion": 1,
  "plates": [
    {
      "id": "matterhorn", "prefix": "", "source": "data/terrain/source",
      "home": true, "threeD": true,
      "outputs": { "heightmaps": [512, 256], "contours": ["hero", "map", "strip"], "hillshade": [1100, 640] },
      "strip": { "centreN": 1091673 }
    }
  ]
}
```

Schema refines: ids `^[a-z]+(-[a-z]+)*$`, unique; never `contours`, `heightmap` or `hillshade`; `prefix === '' ⇔ home`, else `prefix === id + '-'`; exactly one `home`, and it is `threeD`; `threeD: false ⇒ no heightmaps and no map`. Each `region.plate` names a plate (checked by photos:build and a Jest test).

**Schema literals that block a second plate (F13):** `TerrainSource.file: z.literal('dem-10m.png')`, `product: z.literal('swissALTIRegio')`, `crs: z.literal('EPSG:2056')`, `heightSystem: z.literal('LN02')` [VERIFIED: data/schemas/terrain.ts:45,55,56,62]. Phase 15 needs none of them widened if the fixture uses `dem-10m.png`, swissALTIRegio, EPSG:2056 and LN02 (all valid synthetic values). **The poster regexes do need a prefix:** `PosterAvif` is `/^\/terrain\/hillshade-(1100|640)\.[0-9a-f]{10}\.avif$/` (and the WebP twin), and the refine checks `startsWith('/terrain/hillshade-${s}.')` [VERIFIED: :83-88, :173-180]. `TerrainAssetUrl` `/^\/terrain\/[a-z0-9-]+\.[0-9a-f]{10}\.(svg|png|avif|webp)$/` already admits prefixes [VERIFIED: :75-80]. Keep `TerrainMeta` (Matterhorn) untouched, and give `plates.ts` its own prefix-aware schema.

**What can break byte identity (and what cannot):**

| Risk | Breaks D-15? | Guard |
|------|-------------|-------|
| Generalising precache to "every plate's strip + hero" | precache.json + SW change | precache = Home plate only; `data/__tests__/precache.test.ts` |
| Touching `TerrainMeta` key order, header comment or `JSON.stringify` indent | terrain.ts bytes (not asset names) | `--check` byte compare |
| Re-encoding posters (sharp/libvips version) | yes, poster hashes | builder keeps a committed set that passes `inspectPoster`; never force-encode |
| Prefix regex that lets `^heightmap-512…` match another plate's file | wrong `resolveHeightmap` candidate | anchor per plate: `^${prefix}heightmap-${size}\.([0-9a-f]{10})\.png$` |
| Plate iteration order | no: per-plate outputs are pure functions of that plate's raster | — |
| Float formatting | no: identical `JSON.stringify` and `round4` | — |
| Matterhorn `map` LOD dropped by a "2D" default | yes | registry declares Matterhorn's full set (D-12) |

**Synthetic fixture plate (D-13) in `scripts/guards/selftest.mjs` (pattern: `tempPhotoDataRoot` :793-818 and `tempDeriveRoot` :958-996):**

1. `mkdtemp` → copy `data/terrain/source/{source.json,dem-10m.png}`, `public/terrain/*`, `data/generated/{terrain.ts,precache.json,plates.ts}` and `data/terrain/plates.json`.
2. Write `data/terrain/plates/fixture/dem-10m.png`: a 100 × 100 grey16 PNG made with sharp from a `Uint16Array` (pass the typed array itself; build-terrain.mjs:234 warns a Buffer corrupts silently). Use a synthetic hill of 1,500-2,500 m in decimetres so 100 m contours exist. Add `source.json` with `cellM: 10`, a 1,000 m extent (`width × cellM` = extent), synthetic `https://example.invalid/...` URLs, its real `sha256`, and product, crs and heightSystem as the literals. The strip is 200 m (20 rows), row-aligned because `snapM` 100 is a multiple of `cellM` 10.
3. Append `{ id: 'fixture', prefix: 'fixture-', threeD: false, outputs: { contours: ['hero','strip'], hillshade: [1100, 640] }, … }` to the copy's `plates.json`.
4. Run `build-terrain.mjs --root <tmp>` (write), then assert:
   - every D-15 file is byte-equal to the repo copy;
   - `terrain.ts` and `precache.json` are byte-equal;
   - exactly `fixture-contours-hero.*.svg`, `fixture-contours-strip.*.svg` and `fixture-hillshade-{1100,640}.*.{avif,webp}` are new;
   - no `fixture-heightmap-*` and no `fixture-contours-map-*`;
   - then `--check --root <tmp>` passes.
5. A second case removes the fixture from the registry and re-runs. It asserts only the `fixture-*` files are swept (union sweep), and Matterhorn is still byte-equal.

Measured poster cost on this machine: sharp AVIF 1100² 150 ms and 640² 80 ms; WebP 77/23 ms [VERIFIED]. With the Matterhorn contours (~0.8 s), each case adds about 1.5-2 s to `guard:selftest`, which currently runs 216/216 cases in 34 s [VERIFIED].

**Four asset-root lists (F14), for a reconcile test:**

| List | Where | Current value |
|------|-------|---------------|
| Cache headers | `next.config.ts` `headers()` | sources `/images/:path*`, `/terrain/:path*`, `/media/:path*`, `/_next/static/:path*` [VERIFIED: next.config.ts read] |
| SW cache-first prefixes | `public/service-worker.js:190-194` | `/_next/static/`, `/images/`, `/terrain/` (+ fonts) [VERIFIED] |
| Proxy matcher exclusions | `proxy.ts:236-237` | `'/((?!api|_next/static|_next/image|favicon.ico|service-worker.js|images/|terrain/|media/).*)'` [VERIFIED] |
| Guard hashed dirs | `check-served-images.mjs:87` | `['public/terrain/', 'public/images/photos/', 'public/media/']` [VERIFIED] |

They differ on purpose (`/media/` video is network-only in the SW). A reconcile test should assert that every list covers `/terrain/`, that every URL in `terrain.ts` and `plates.ts` is flat (`^/terrain/[a-z0-9-]+\.[0-9a-f]{10}\.(svg|png|avif|webp)$`, no second `/`), and that the guard's `HASH_NAME` (`/^[a-z0-9-]+\.([0-9a-f]{10})\.(png|svg|avif|webp|jpg|mp4)$/`, :88) accepts a prefixed name.

**`fetch-dem.mjs --plate`:** defer to Phase 16. No real window is fetched in Phase 15, and networked code with no target is untestable here. The registry and `--root` are what Phase 16 needs.

### DATA-10: photo map, regions, generators

- **`idFromFile`** is `/^(IMG_\d{4}|R\d{3}-\d{3})/` → lowercased, `_`→`-` (extract-exif.mjs:67-73) [VERIFIED]. Replace it with a lookup in `photo-map.json` (file → id). An unmapped original throws `add a record for <file> to data/photos/photo-map.json` (CONTEXT specifics). Duplicate `file` across records is a schema refine.
- **Where each D-01 rule can run:**
  - "an original has no record": only where originals exist (local `photos:exif` write and `--check`). In CI the originals are absent and `--check` runs the schema check only (extract-exif.mjs:242-247).
  - "two records name one file": schema refine, runs everywhere.
  - "a record has no sidecar entry" and "a sidecar entry has no record": cross-file checks; run them in `photos:build` (CI) and a Jest data test. Also require `map[id].file === sidecar[id].file`.
  - Locally the originals are present: `npm run data:check` printed `photos:exif: OK` with no "hash check skipped" line, so the D-01 extraction path can be exercised end to end on Tim's machine [VERIFIED].
- **`extract-exif.mjs` has no `--root`** (fixed `ROOT`, :48; only `--check` accepted, :286-291). Add the same `parseArgs` so selftest can prove "unmapped original fails" and "duplicate file fails" with sharp-generated JPEGs (the `tempDeriveRoot` pattern: no camera data).
- **`build-photo-data.mjs`** already has `--root` (:64-100). It reads `SOURCE_REL = 'data/terrain/source'` (:103) and one DEM (`loadDem`, :113-132), and fails off-extent with `` `${entry.id}: position lies outside the DEM extent (uv …)` `` (:266-270). Per-plate: photo → `photoMap[id].region` → `regions[region].plate` → `plates[plate].source` → load and cache each raster once. Keep the error text or update the G5 expectation `'r004-011: position lies outside the DEM extent'` (selftest.mjs:2257) in place.
- **G5 harness must grow:** `PHOTO_DATA_INPUTS` lists exactly sidecar, corrections, `source.json`, `dem-10m.png` and `photos.ts` (selftest.mjs:783-789) [VERIFIED]. Without `photo-map.json`, `regions.json` and `plates.json` in that list, the G5 control case fails. `tempPhotoDataRoot(edit)` edits only `{ sidecar, corrections }` (:801-815); extend it for the new D-01/D-05 failure cases.
- **Generated output:** `PhotoFacts` (strict, data/schemas/photo.ts:216-229) gains `region` and `country`. Drop `export const lowestDemM` (build-photo-data.mjs:292-303) and the header line that names it (:299). `photos.ts` bytes change; that is expected and is not a pixel change.
- **Country type:** use a closed enum, not `/^[A-Z]{2}$/`, so `ch` or `CHE` fail. Recommended: the Alpine Convention states `AT, CH, DE, FR, IT, LI, MC, SI` [ASSUMED list], plus a display-name lookup (discretion).
- **Sidecar is already closed:** `ExifSidecarEntry` and `ExifSidecar` are `z.strictObject` (photo.ts:57, :81) [VERIFIED]. The discretion test just pins that, for example `ExifSidecarEntry.safeParse({...valid, serial: 'x'}).success === false`.
- **`PhotoId` regex** `/^(img-\d{4}|r\d{3}-\d{3})$/` appears twice (photo.ts:58 and :96) [VERIFIED]. Leave it in Phase 15 (discretion; widen with the first non-Canon original in Phase 16), and make the photo-map key use the same `PhotoId`.
- **`Elevation.product`:** not needed in Phase 15. Every photo is on a swissALTIRegio plate, and adding it churns `photos.ts` for no consumer.

### DATA-09: Home list and view-model split

- `buildWaypoints(input = { photos, editorial, imageManifest })` sorts by DEM then id and throws `RangeError` (lib/ascent/waypoints.ts:92-147) [VERIFIED]. **Filter in the default input, never inside the function.** `lib/__tests__/ascent-waypoints.test.ts:140-187` calls it with synthetic ids (`'a'`, `'b'`, `'orphan'`); an internal filter would empty them. Shape: `homeInput()` returns `photos.filter(p => homeWaypointIds.includes(p.id))` and throws `RangeError` when a listed id is missing; `buildWaypoints(input = homeInput())`.
- **`homeWaypointIds`** in `data/home.ts` (or `lib/ascent/home.ts`), typed `readonly PhotoId[]` with `PhotoId` from `data/photos/editorial.ts:19` (`(typeof photos)[number]['id']`). tsc then rejects an unknown id. The D-07 Jest test asserts: length 4, every id's `region === 'zermatt'`, and its region's plate `=== 'matterhorn'`.
- **`lowestDemM` consumers (six, not three):** `lib/ascent/summit.ts:1,52` ("Height gained", app code), `components/home/__tests__/rail.test.tsx:12,170`, `data/__tests__/photos.test.ts:20,162-165`, `lib/__tests__/ascent-summit.test.ts:13,48`, `e2e/home-ascent.spec.ts:2,831`, `e2e/home-canvas.spec.ts:7,489` [VERIFIED: git grep]. Replace with `homeLowestDemM` from `lib/ascent`; it equals `buildWaypoints()[0].altitudeM` = 1617.
- **Tests that read the global `photos` for Home surfaces (move to the Home list):** `components/home/__tests__/hero.test.tsx:19` (trail sign), `components/site/__tests__/SiteFooter.test.tsx:18` (ticks), `e2e/home-ascent.spec.ts:381` and `e2e/homepage.spec.ts:79` (trail sign), `e2e/shell.spec.ts:563` (footer ticks), `lib/__tests__/ascent-waypoints.test.ts:29` (`w.n === photos.length`) and `lib/__tests__/poster-frame.test.ts:21` [VERIFIED].
- **App consumers:** `SiteFooter.tsx:74` (`photos.map` ticks), `TrailSigns.tsx:36` (`photos.length`). The poster pins, 3D pins, cards and rail all go through `buildWaypoints()` (`AscentHero.tsx:67`, `HeroBlock.tsx:47`, `PosterSheet.tsx:38`) [VERIFIED].
- **View-model split:** `buildPhotoViews` is built on `buildWaypoints(input)` (view-model.ts:328-331). Extract the order and validation into a shared `orderByDem(photos)`. Home uses it over the Home list; `buildPhotoViews` uses it over `seriesInput('zermatt')`, which is `photos.filter(p => p.region === 'zermatt')`. `photoViews` (the light table, `PhotosHeader` kicker) becomes the Zermatt series. Rewrite `photos-view-model.test.ts:31` ("exactly the buildWaypoints() order") in place to "series order is DEM ascending, ties by id". Keep a Phase-15 equality assertion.
- **Success-criterion-1 test (Jest):** `jest.mock('@/data/generated/photos', () => { const a = jest.requireActual(...); return { ...a, photos: [...a.photos, EXTRA] }; })`. `EXTRA` is a photo in region `elsewhere`, lower DEM (e.g. 900 m), positioned. Then assert:
  - `buildWaypoints()` ids are unchanged;
  - `homeLowestDemM === 1617`;
  - `<SiteFooter/>` has 4 `[data-tick]`;
  - `<TrailSigns/>` still says 4 waypoints;
  - the rail first label is unchanged.

  Add a second variant with `EXTRA` in `zermatt` but not on the list. `editorial`'s `Record<PhotoId,…>` type is derived from the real photos, so construct `EXTRA` with its own manifest/editorial mocks or cast through the structural `PhotoInput` type.
- **`proxy.ts:5`** imports `photoSlugs` from the full view-model [VERIFIED]. `lib/photos/routes.ts` exports `photoHref` and `photoRouteSlugs = Object.values(editorial).map(e => e.slug)`. That still bundles editorial copy, but not manifests, generated photos or terrain. Pair it with a Jest test that `new Set(photoRouteSlugs)` equals the set of every photo's slug. Keep `sitemap.ts` and `generateStaticParams` on the view-model's ordered `photoSlugs` (server-only, order-stable), wrapped in `photoHref`.

### DATA-15: telemetry guard

- **Today's scope:** repo mode is `git ls-files -z -- <pathspecs>` (tracked only) over image and video extensions; fixture mode walks `--root` (check-served-images.mjs:137-170). `collect()` throws on git failure, "never a silent pass" [VERIFIED].
- **New rule (`telemetry`):** a set `TELEMETRY_EXT = ['.srt','.lrf','.dat','.lrv','.thm','.xmp','.gpx','.kml','.kmz','.nmea','.igc','.fit','.tcx']`, matched on `path.extname(rel).toLowerCase()`.
  - Repo: `git ls-files -z -co --exclude-standard -- ':(icase)*.srt' …`. Measured this session: lists untracked-not-ignored `track.GPX` and `flight.Kml`, and a force-added ignored `a.srt` [VERIFIED].
  - Plus `walk(root/public)` including ignored files.
  - Allow `assets/photos-original/` and `assets/clips-original/`. They are ignored, so `--exclude-standard` already drops them; add an explicit allow so a future `git add -f` of an original's sidecar is still reported (Open Question 3, resolved: no explicit originals exception; a tracked file there fails, carried by 15-12).
  - Keep `scripts/guards/__selftest__/` out of repo mode, as `SELFTEST_PREFIX` does today.
- **MP4 telemetry tracks (D-23), measured:** splicing one extra `trak{tkhd, mdia{mdhd, hdlr(<h>), minf{nmhd, stbl{stsd{<entry>}}}}}` into `moov` of the committed clean fixture (`good-mp4/public/media/coin-flip-toss.d423c62633.mp4`, 1,115 B) and fixing the `moov` size gives:

  | Fixture | hdlr / stsd entry | `checkMp4` result |
  |---------|-------------------|-------------------|
  | DJI telemetry | `meta` / `djmd` | `tracks: vide,meta (need exactly one video track, no audio)` |
  | DJI debug | `meta` / `dbgi` | `tracks: vide,meta (…)` |
  | GoPro GPMF | `meta` / `gpmd` | `tracks: vide,meta (…)` |
  | Subtitle | `sbtl` / `tx3g` | `tracks: vide,sbtl (…)` |
  | Text track | `text` / `tx3g` | `tracks: vide,text (…)` |
  | clean | — | `[]` |

  [VERIFIED: probe script run against scripts/guards/lib/mp4-boxes.mjs this session; files 1,348 B each.] The walker reads only the `hdlr` handler (`trackHandlers`, :68-72). `stsd` entries make the fixtures realistic but are not what triggers the rule. Stale `stco` offsets after the splice are irrelevant to the walker. Put fixtures outside hashed dirs (e.g. `bad-mp4-djmd/clips/DJI_0001.MP4`). Then only the `video` rule fires (no hash-name or orphan noise), and the "anywhere in the repo" claim is proven, since `maxBytes` applies only under `public/`. Optional: word the message "(need exactly one video track: no audio, telemetry or subtitle track)". Existing expectations match by substring (`'video: tracks: vide,soun'`, selftest.mjs:1695), so appending is safe.
- **Repo-mode selftest:** the runner supports `cwd` (selftest.mjs:15) and `gitIn` fixtures (:834-838). Build a temp git repo, then run the guard with no `--root` and `cwd: <tmp>` to prove:
  - an untracked root `x.srt` fails;
  - an ignored `public/x.gpx` fails;
  - an ignored `assets/photos-original/IMG.xmp` passes;
  - a `git add -f` of an ignored `y.KML` fails.
- **`.gitignore` case:** write bracket classes, e.g. `*.[sS][rR][tT]`, `*.[lL][rR][fF]`, `*.[gG][pP][xX]`. They match every case regardless of `core.ignorecase` (this checkout has `core.ignorecase=true`; Linux CI defaults to false). Measured: on this Windows build, `git -c core.ignorecase=false check-ignore` still matched `E.LRF` with a plain `*.lrf` line. **No observation of Linux semantics was possible here**, so the bracket form is the safe choice and the guard (case-folded extension compare) remains the enforcement. `.dat` and `.fit` are generic extensions. No tracked file has any of the 13 today [VERIFIED: `git ls-files | grep -iE`], and `git ls-files -o -i --exclude-standard -- public` is empty locally [VERIFIED].

### Success criterion 5: photo URL inventory and scan

Hand-built photo URLs in `app/`, `components/`, `lib/`, `proxy.ts` (`MSYS_NO_PATHCONV=1 git grep -n -F "/photos"`) [VERIFIED]:

| # | Site | Form |
|---|------|------|
| 1 | `app/sitemap.ts:18` | `` `${site.url}/photos/${slug}` `` (absolute) → `` `${site.url}${photoHref(slug)}` `` |
| 2 | `components/home/WaypointCard.tsx:110` | `` href={`/photos/${slug}`} `` |
| 3 | `components/photos/CarouselControls.tsx:96` | `` href={`/photos/${photo.slug}`} `` |
| 4 | `components/photos/CarouselStepper.tsx:34` | `` href={`/photos/${slug}`} `` |
| 5 | `components/photos/CarouselView.tsx:119` | `` router.push(`/photos/${photos[i].slug}`, { scroll: false }) `` |
| 6 | `components/photos/JustifiedGrid.tsx:65` | `` href={`/photos/${slug}`} `` |
| 7 | `components/photos/MapSheet.tsx:131` | `` href={`/photos/${p.slug}`} `` |
| 8 | `components/photos/PhotoViewer.tsx:241` | `` window.history.replaceState(null, '', `/photos/${slug}`) `` |
| 9 | `components/photos/PhotoViewer.tsx:261` | `` const path = `/photos/${current.slug}` `` (title keeper) |
| 10 | `lib/photos/view-model.ts:395` | `` alternates: { canonical: `/photos/${view.slug}` } `` |
| 11 | `lib/saved-pages.ts:41` | `` href: `/photos/${slug}` `` |

No OG path builds a photo URL by hand (`app/(site)/photos/[slug]/opengraph-image.tsx` only names it in comments). The allowed `/photos` index uses are: `PhotoViewer.tsx:280,496,513`, `TrailSigns.tsx:36`, `NotFoundBody.tsx:25-47`, `app/layout.tsx:60`, `view-param.ts:39` (`` `/photos?view=${view}` ``) and `PhotosHeader.tsx:8`. Path parsers (not builders): `lib/photos/stepping.ts:22` and `LightboxDialog.tsx:82` `PHOTO_PATH`, `proxy.ts:25` `DETAIL_PATH`. Tests hold 91 `photos/${` templates (D-17 keeps them).

**Scan regexes** (applied to raw source text; exempt `lib/photos/routes.ts`):

```ts
const HAND_BUILT = [
  /(?<![\w-])\/photos\/\$\{/,                       // `/photos/${…}` anywhere in a template, incl. `${site.url}/photos/${…}`
  /['"`]\/photos\/['"`]\s*\+/,                       // '/photos/' + …
  /\+\s*['"`]\/photos\//,                            // … + '/photos/…'
  /\b(?:router\.(?:push|replace|prefetch)|history\.(?:pushState|replaceState)|redirect|permanentRedirect)\s*\([^)]*['"`]\/photos\//, // any navigation to a photo path, literal or not
  /href=["']\/photos\/[^"'?#]/,                      // a hard-coded slug in a JSX attribute
];
```

False-positive check against today's tree: none match `'/photos'`, `/photos?view=`, `\/photos\/` (escaped regex literals) or `/images/photos/…` (lookbehind). Comments use `{slug}` without `$`, so they do not match. Include a self-test array in the Jest test: every "bad" snippet must match and every "good" snippet must not, so a weakened regex fails. Scan `app/ components/ lib/` recursively plus `proxy.ts`, skipping `__tests__`.

### Carried findings (D-28): code locations and complications

| Finding | Code | Complication |
|---------|------|--------------|
| 13 IN-01 | `components/SafeCanvas.tsx:38-41` comment `// 07 WR-07: a scene bug is logged; the expected no-WebGL fallback stays silent` | Comment-only; Next's `onCaughtError` logs every caught error, so "stays silent" is false. Keep the `console.error('[SafeCanvas]', …)` |
| 13 IN-02 | `check-ci-gate.mjs` `checkRelay` (:560+), rules 11/12 inspect only `run:` blocks | The relay has **no `uses:` steps today**; all `${{` are in `env:` and `group:` (ci-skip-relay.yml:50-119), so a `with:`-only rule stays green on the real file [VERIFIED] |
| 13 IN-03 | `findCiOkOutsideCi` / `isNeedsNameExpression` (:480-500) | The relay's job `name:` *is* an expression (ci-skip-relay.yml:100), so the new rule must reuse `isNeedsNameExpression` as the allowed shape. `visual-baselines.yml` and `upstash-keepalive.yml` names are literal [VERIFIED] |
| 14 IN-01/02 | `components/photos/LightboxDialog.tsx:127-141` (`parseFloat(--nav-h)`, `window.innerHeight`); `e2e/photos-lightbox.spec.ts:831-852` `triggerState` | `--nav-h: 64px` (globals.css:53). The header is `sticky top-0 h-16` (SiteNav.tsx:168). A probe element (`style.height = 'var(--nav-h)'` → `offsetHeight`) keeps exact semantics; `header.getBoundingClientRect().bottom` also works but there is a second `<header>` at SiteNav.tsx:284. Change both sides together, or the e2e mirror diverges |
| 14 IN-03 | `components/site/SiteNav.tsx:116-123` (orphan "Close trigger 7" block), inline `onClick` :229-250 | Pure move; the `preventDefault`/focus order must stay byte-equivalent (SHELL-07 tests) |
| 14 IN-05 | `e2e/case-study.spec.ts:685`, `:803` `waitForTimeout(4000)` | `lib/demo-terminal.ts` is import-free ("never add an import", :5) with `TIMINGS.holdMs: 3000` (:47), so `import { TIMINGS } from '@/lib/demo-terminal'` is safe in e2e. `TIMINGS.holdMs + 1000` is the minimal change; `page.clock` needs install before navigation |
| 14 IN-06 | `e2e/photos-lightbox.spec.ts:800-824` row matrix | Existing Back row `{ view: 'Map', 720×450, close: 'browser Back', tags: CHROMIUM }` (:824). Add a row with `tags: '@no-win-webkit'` (the Escape Firefox row's tag, :803). The title includes the tags, so it stays unique and the test count goes up. If Firefox crashes, add `@firefox-43967` (playwright.config.ts:87-94) |
| README | `scripts/README.md:78` "measures 36 pairs" | → 47; add the telemetry rule to the `check-served-images.mjs` section (:87-103) |

### Zero-diff risks: `SheetMargin` and `ContourField(plate, lod)`

- **Visual coverage:** full-page baselines at 375, 768 and 1440 for every route (`e2e/visual/routes.spec.ts:160-161`, `fullPage: true`), so the footer is in every shot. PosterSheet (Home), MapSheet (`/photos`) and EdgeArt (404, offline) draw `ContourField lod="hero"`; the footer draws `lod="strip"` [VERIFIED].
- **`ContourField`** today is `({ lod, className })` with `` mask = `url(${terrain.assets.contours[lod]})` `` (ContourField.tsx:16-17). Adding `plate` (required, `'matterhorn'` at all four call sites) leaves the DOM identical as long as the URL string is identical. Type `lod` per plate (2D plates have no `map`).
- **SheetMargin pixel traps:**
  1. The scale bar width is `calc(100cqw * fraction)`, relative to the footer's `@container` (SiteFooter.tsx:68, :109). **Do not put `@container` on any new wrapper**; that changes `cqw` and shifts the scale bar.
  2. The band must stay the footer's **first child div**. `SiteFooter.test.tsx:23` uses `footer.firstElementChild`, and `e2e/shell.spec.ts` uses `footer.locator(':scope > div').first()`.
  3. The band (top, full-bleed) and the legend `<dl>` (inside `max-w-6xl`, after the links grid) are not adjacent. A single `SheetMargin` element would reorder the DOM. Extract two server components, e.g. `SheetBand({ plate, ticks })` and `SheetLegend({ plate, title })`, composed in the same positions.
  4. No wrapper element, no new whitespace text nodes.
  5. `SiteFooter.test.tsx`'s D-21 static-source test reads only `SiteFooter.tsx` and `ContourField.tsx` (:166-169). **Add the new file to `sources`**, or the no-motion/no-`use client` rule silently stops covering the extracted code.
- **Proof before CI:** before the refactor, dump `renderToStaticMarkup(<SiteFooter />)` (same year) to a scratch file; after it, diff (expect empty); then push `ci/15-*` and require Visual Regression green with no update.

### Anti-Patterns to Avoid
- **Filtering inside `buildWaypoints`:** breaks the synthetic-data tests; filter the default input.
- **A child tsconfig that overrides only `include`:** it inherits the base `exclude` and checks nothing.
- **A globals d.ts that might not resolve:** `skipLibCheck` hides the failure; everything becomes `any`.
- **Per-plate builder runs:** they delete other plates' files (F15).
- **Real drone or camera files as fixtures:** location data can't be purged from git history (D-23).
- **Moving the Matterhorn source dir:** it changes terrain.ts's header text and six other references, for no gain.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Jest global types | a hand-written `declare function expect(...)` | `@jest/globals` types re-declared as globals | exact Jest 30 typings, matcher augmentation from jest-dom |
| MP4 track detection | a new parser | `scripts/guards/lib/mp4-boxes.mjs` `checkMp4` | already rejects extra tracks (measured) |
| Test-fixture git repos | ad-hoc `execSync` | `gitIn` + `GIT_FIXTURE_CONFIG` in selftest.mjs:834-838 | fixed identity, no global config, throws on failure |
| Temp-root generator tests | new harness | `tempPhotoDataRoot` / `tempDeriveRoot` / `snapshotTree` / `treeUnchanged` (selftest.mjs:793-996) | proven G5/G6 pattern, cleanup built in |
| Bilinear DEM sampling, LV95 → UV | per-plate copies | `lib/terrain/dem-sample.ts`, `lib/geo.ts` | D-17 sampler unchanged |
| 16-bit PNG encode | Buffer + `raw depth: 'ushort'` | sharp with a `Uint16Array` input (build-terrain.mjs:233-239) | the Buffer path corrupts silently (STACK.md §4) |

**Key insight:** every mechanism this phase needs already exists in the repo. The work is generalising it (a loop over plates, a lookup instead of a regex, a second scan location), never writing a new parser.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None. The site has no database; all data is committed JSON or TS. Upstash (rate limit) holds no photo or terrain keys | none |
| Live service config | Vercel/CDN caches `/terrain/*` and `/images/*` as `immutable` (next.config.ts). Matterhorn names are unchanged (D-15), so no cached URL changes | none; verify D-15 |
| OS-registered state | None (no scheduled tasks or services reference these names) | none |
| Secrets/env vars | None touched | none |
| Build artifacts | (1) Service-worker precache, injected by postbuild from `data/generated/precache.json`: must stay byte-identical (D-14). (2) `.next/dev/types/**` is included by `tsconfig.json` and can go stale locally; CI has none. (3) New child tsconfigs could write `*.tsbuildinfo` (gitignored). (4) Returning visitors' SW `STATIC_CACHE` holds the Matterhorn URLs; they stay valid | keep precache.json identical; `incremental: false` in children |

## Common Pitfalls

### Pitfall 1: Silent-`any` Jest globals
**What goes wrong:** the globals d.ts imports `@jest/globals`, the import fails to resolve, and `tsc` reports *nothing* in the d.ts while every `expect` becomes `any`.
**Why it happens:** `skipLibCheck: true` (tsconfig.json:10) suppresses diagnostics inside every `.d.ts`, including unresolved imports. Measured: 287 bogus TS7006/TS2503 errors elsewhere, zero in the d.ts.
**How to avoid:** a canary in one Jest test file, `// @ts-expect-error -- canary: proves the Jest globals are typed, not any` on `expect(1).toBe();`. If `expect` were `any`, the directive is unused and tsc fails with TS2578. This is the one deliberate-wrong-input use D-26 allows.
**Warning signs:** a sudden drop to 0 errors, or many TS7006 "implicitly any" errors in `it.each` callbacks.

### Pitfall 2: Inherited `exclude` empties a child config
**What goes wrong:** `tsconfig.e2e.json` overrides `include` only, inherits `"e2e/**"` and `"**/*.spec.ts"` from the base exclude, and checks just the two Playwright configs (green, meaningless).
**How to avoid:** always override `exclude`; verify with `tsc -p tsconfig.e2e.json --listFilesOnly | grep -c '/e2e/'` (expect ≥ 36).

### Pitfall 3: Jest collects the globals d.ts
**What goes wrong:** `__tests__/jest-globals.d.ts` matches `testMatch` (measured), and the suite fails with "Your test suite must contain at least one test".
**How to avoid:** `testPathIgnorePatterns` gets `'\\.d\\.ts$'` (option A), or the file lives outside `__tests__` with a `tsconfig.json` exclude (option B).

### Pitfall 4: Prefixed plate files invisible to the sweep
**What goes wrong:** with today's `MANAGED`, a fixture plate's files are neither swept nor reported as `extra`, so a deleted plate leaves orphans that only the served-images guard catches (and only if listed nowhere).
**How to avoid:** widen `MANAGED` with an optional plate prefix; expected = union over plates; selftest case 5 above.

### Pitfall 5: G5 control case breaks when photos:build gains inputs
**What goes wrong:** `PHOTO_DATA_INPUTS` copies an explicit file list; the new registries are missing in the temp root and the "unmodified copy passes" case fails.
**How to avoid:** add `data/photos/photo-map.json`, `data/regions/regions.json` and `data/terrain/plates.json` to the list in the same commit as the generator change.

### Pitfall 6: Phase-15-green tests that Phase 16 breaks
**What goes wrong:** tests that read global `photos` for Home surfaces still pass with four photos, then fail when Phase 16 adds photos.
**How to avoid:** move the seven listed tests to the Home list or `buildWaypoints()` now. Prefer named fixtures (`photoBySlug('riffelsee-reflection')`) where a test audits a specific light-table photo. There are 93 index lookups in tests; Home-ascent indices (`waypoints[i]`) are stable because the list is frozen.

### Pitfall 7: Footer extraction moves the scale bar
**What goes wrong:** a new wrapper with `@container`, or moving the legend out of the footer, changes `100cqw`.
**How to avoid:** see Zero-diff risks above; markup diff before CI.

### Pitfall 8: Git Bash rewrites `/photos`
**What goes wrong:** `git grep -F "/photos"` returns nothing under Git Bash, and an inventory or verification step falsely reports zero hand-built URLs.
**How to avoid:** `MSYS_NO_PATHCONV=1`, or use the Jest scan test as the source of truth.

## Code Examples

### `test-count.mjs --scan-only` (shape)
```js
// in parseArgs: accept '--scan-only' as a boolean flag; skip the '--jest is required' check when set
if (args.scanOnly) {
  if (args.jest || args.list || args.update) usage('--scan-only takes only --root');
  const hits = findFocusedOrSkipped(args.root);
  for (const h of hits) console.error(`test-count: FAIL ${h}`);
  console.log(hits.length ? `test-count: ${hits.length} focused/skipped call(s)` : 'test-count: scan OK');
  process.exit(hits.length ? 1 : 0);
}
```

### Synthetic telemetry MP4 (selftest helper; verified this session)
```js
// Source: probe run against scripts/guards/lib/mp4-boxes.mjs (2026-11-14)
const box = (type, ...payload) => { const body = Buffer.concat(payload); const h = Buffer.alloc(8); h.writeUInt32BE(8 + body.length); h.write(type, 4, 'latin1'); return Buffer.concat([h, body]); };
const full = (v, f = 0) => Buffer.from([v, (f >> 16) & 255, (f >> 8) & 255, f & 255]);
const zeros = (n) => Buffer.alloc(n);
function trak(handler, entry) {
  const tkhd = box('tkhd', full(0, 3), zeros(80));                 // v0, zero times
  const mdhd = box('mdhd', full(0), zeros(20));                     // v0, zero times
  const hdlr = box('hdlr', full(0), zeros(4), Buffer.from(handler, 'latin1'), zeros(12), Buffer.from('\0'));
  const stsd = box('stsd', full(0), Buffer.from([0, 0, 0, 1]), box(entry, zeros(8)));
  return box('trak', tkhd, box('mdia', mdhd, hdlr, box('minf', box('nmhd', full(0)), box('stbl', stsd))));
}
function withTrack(buf, t) {                                        // insert after the first trak, grow moov
  const all = boxes(buf); const moov = all.find((b) => b.type === 'moov'); const first = all.find((b) => b.type === 'trak');
  const at = first.offset + first.size;
  const out = Buffer.concat([buf.subarray(0, at), t, buf.subarray(at)]);
  out.writeUInt32BE(moov.size + t.length, moov.offset);
  return out;
}
// withTrack(goodMp4(), trak('meta', 'djmd')) -> checkMp4: ['tracks: vide,meta (need exactly one video track, no audio)']
```
Either commit the spliced bytes as fixture files (as `bad-mp4-uuid` was made "by a Node `Buffer.concat` (no ffmpeg)", per its README) or build them in memory in `fn` cases. Committed files plus a README per fixture match the existing convention.

### `.gitignore` block
```gitignore
# Drone and GPS telemetry (DATA-15, D-22): never staged by `git add -A`; the guard still catches `git add -f` and public/
*.[sS][rR][tT]
*.[lL][rR][fF]
*.[dD][aA][tT]
*.[lL][rR][vV]
*.[tT][hH][mM]
*.[xX][mM][pP]
*.[gG][pP][xX]
*.[kK][mM][lL]
*.[kK][mM][zZ]
*.[nN][mM][eE][aA]
*.[iI][gG][cC]
*.[fF][iI][tT]
*.[tT][cC][xX]
```

### `photoHref`
```ts
// lib/photos/routes.ts
import { editorial } from '@/data/photos/editorial';
/** The one photo URL builder (D-16). Phase 17 adds regionHref here (D-19). */
export const photoHref = (slug: string): `/photos/${string}` => `/photos/${slug}`;
/** Every photo slug, for proxy.ts's unknown-slug 404 (F5): no manifests, no generated facts. */
export const photoRouteSlugs: readonly string[] = Object.values(editorial).map((e) => e.slug);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@types/jest` ambient globals | `@jest/globals` typed exports (stricter `jest.fn()` → `Mock<UnknownFunction>`) | Jest 27+ (`@jest/globals`), stricter mock typing in Jest 29/30 | the ~45 mock-typing fixes are expected, not a regression |
| `next build` type-check via the JS compiler API | project-local `tsc` CLI by default (`experimental.useTypeScriptCli`) | Next 16.x docs | `next build` checks exactly the `tsconfig.json` project [CITED: next docs 02-typescript.md:36-41] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Alpine Convention country list `AT, CH, DE, FR, IT, LI, MC, SI` for the country enum | DATA-10 | low: an enum is easy to widen; Tim may prefer a smaller set |
| A2 | On Linux (`core.ignorecase=false`), a plain `*.srt` gitignore line does not match `X.SRT`, so bracket classes are needed | DATA-15 | none if bracket form is used (correct either way); could not be observed on this Windows checkout |
| A3 | A child tsconfig inherits the base `exclude` unless it overrides it | GUARD-10 | high if wrong in the other direction; mitigated by the `--listFilesOnly` verification step |
| A4 | Real DJI/GoPro files carry telemetry as `meta`-handler tracks with `djmd`/`dbgi`/`gpmd` sample entries and subtitles as `sbtl`/`text` | DATA-15 | low: the walker rejects *any* second track regardless of type, as measured |
| A5 | `jest.mock` of `@/data/generated/photos` with an appended photo works under next/jest SWC hoisting | DATA-09 | medium: the fallback is calling the pure builders with an injected input plus rendering components with props |

## Open Questions (RESOLVED)

All four are resolved by the planner (2026-11-14). Each resolution is a planner decision pending Tim's review, not a Tim decision; each names the plan that carries it, and each is reversible in one small change.

1. **`@jest/globals` pin: exact `30.5.2` or `^30.5.2`?**
   - What we know: D-24 says "pinned to the jest version"; jest is `^30.5.2`; lockfile has 30.5.2 hoisted.
   - Unclear: whether "pinned" means exact. An exact pin diverges at the next jest minor.
   - Recommendation (at research time): `^30.5.2`, identical to jest's range, with a one-line note in the plan; Tim's review of the plan can switch it to an exact pin.
   - **RESOLVED (planner decision pending Tim's review): `^30.5.2`, the same range as `jest`.** Carried by `15-01-PLAN.md` ("Planner decisions": the `@jest/globals` range; Task 1 installs `@jest/globals@^30.5.2` with the bundled npm and gates `package.json` on that exact spec). If Tim prefers an exact pin, it is one line in `package.json`.
2. **D-07 "a test or the build"**: a Jest test is sufficient and simpler, because the Home list is TS and generators can't import `@/` modules. Recommend the Jest test plus tsc typing of the ids.
   - **RESOLVED (planner decision pending Tim's review): a Jest test plus tsc typing.** Carried by `15-08-PLAN.md`: Task 1 types `homeWaypointIds` `as const satisfies readonly PhotoId[]`, Task 2 adds the strict-list test `data/__tests__/home.test.ts`.
3. **Telemetry files under ignored originals folders:** D-21 allows the two ignored folders. Should a *force-added* `assets/photos-original/x.xmp` still pass? Recommend: allow only while ignored-and-untracked; fail when tracked. This matches "the guard still catches `git add -f`" (D-22).
   - **RESOLVED (planner decision pending Tim's review): allowed only while ignored and untracked; a tracked (force-added) telemetry file under the originals folders fails.** Carried by `15-12-PLAN.md` as flagged assumption A-15-12 (Task 2's repo scan adds no originals exception, and the selftest case `served-images: telemetry: a force-added sidecar under the originals folder fails` pins it). If Tim reads D-21 the other way, the change is one path condition in `collect()` and one selftest case.
4. **Fixture plate in selftest vs Jest:** sharp is ESLint-banned outside `scripts/` (eslint.config.mjs:74), so the write-and-assert test must be in `selftest.mjs`. Jest can still assert the committed-state invariants (D-15 literal pin, `plates.ts` ↔ `terrain.ts` equality, asset budget on committed plates). Planner: put the fixture in `guard:selftest` (runs in `lint`).
   - **RESOLVED (planner decision): the fixture plate lives in `guard:selftest`; Jest holds the committed-state invariants.** Carried by `15-05-PLAN.md` (the `tempTerrainRoot` fixture plate and its three selftest cases) and `15-04-PLAN.md` (the D-15 literal pin in `terrain.test.ts` and `plates.test.ts`: `plates.ts` equals `terrain.ts`, the asset roots, the budget of the committed plates).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | generators, tsc, jest | ✓ | **v26.13.1 locally**; CI uses `.node-version` = 24 | type-stripping `.ts` imports work on both; CI is the authority |
| bundled npm | `@jest/globals` install | ✓ | 11.20.0 (`C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js`) | — |
| global npm (PATH) | — | ✓ (avoid) | 11.6.1 | do not use for installs |
| git | guard repo mode, selftest fixtures | ✓ | 2.56.0.windows.4 (`core.ignorecase=true`) | — |
| sharp | fixture DEM/JPEG, poster encode | ✓ | ^0.35.5 | — |
| originals (`assets/photos-original/`) | local D-01 extraction check | ✓ (local only) | — | CI runs schema-only |
| ffmpeg | — | not needed | — | MP4 fixtures via `Buffer.concat` |
| jq | existing selftest CI-OK cases | ✓ (216/216 passed) | — | — |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.5.2 (jsdom, next/jest SWC), Playwright 1.65.0, guard selftest (`node scripts/guards/selftest.mjs`) |
| Config file | `jest.config.js`, `playwright.config.ts`, new `tsconfig.jest.json` / `tsconfig.e2e.json` |
| Quick run command | `npx jest <path>` |
| Full suite command | `npm run lint && npm run type-check && npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GUARD-10 | three configs, zero errors | tooling | `npm run type-check` | ❌ Wave 0 (`tsconfig.jest.json`, `tsconfig.e2e.json`, globals d.ts) |
| GUARD-10 | e2e config really includes specs | tooling | `npx tsc -p tsconfig.e2e.json --listFilesOnly \| grep -c "/e2e/"` (≥ 36) | ❌ Wave 0 |
| GUARD-10 | globals typed, not `any` (canary) | unit (type) | `npx tsc -p tsconfig.jest.json` (TS2578 if the canary is unused) | ❌ Wave 0 |
| GUARD-10 / D-27 | scan-only catches `.fixme(` locally | guard selftest | `npm run guard:selftest` (new test-count `--scan-only` cases); `npm run guard:tests:scan` | ❌ new cases |
| DATA-09 | extra photo (other region / not listed) leaves ascent, 1,617 m, footer ticks, trail sign unchanged | unit | `npx jest lib/__tests__/home-waypoints.test.tsx` | ❌ Wave 0 |
| DATA-09 | D-07 list strict (4 ids, zermatt, matterhorn) | unit | `npx jest data/__tests__/home.test.ts` | ❌ |
| DATA-09 | Home e2e unchanged (rail readout, trail sign, footer ticks) | e2e | `PW_PROD=1 npx playwright test e2e/home-ascent.spec.ts e2e/shell.spec.ts --project=chromium --project=firefox --reporter=line` | ✅ (edit consumers) |
| DATA-10 | photo-map/regions parse; bijection with sidecar; region known; country enum | unit + generator | `npx jest data/__tests__/photo-map.test.ts` ; `npm run photos:build -- --check` | ❌ / ✅ |
| DATA-10 | stale or missing map/region fails CI | guard selftest (G5 cases) | `npm run guard:selftest` | ❌ new G5 cases |
| DATA-10 | unmapped original / duplicate file fails extraction | guard selftest (`extract-exif --root`) | `npm run guard:selftest` | ❌ |
| DATA-10 | sidecar schema closed | unit | `npx jest data/__tests__/exif-sidecar.test.ts` | ✅ (extend) |
| DATA-11 | D-15 names pinned literally | unit | `npx jest data/__tests__/terrain.test.ts` | ✅ (extend) |
| DATA-11 | registry build reproduces Matterhorn; `--check` green | generator | `npm run terrain:build -- --check` | ✅ |
| DATA-11 | fixture plate: own prefixed 2D files, Matterhorn byte-equal, union sweep | guard selftest | `npm run guard:selftest` | ❌ |
| DATA-11 | `plates.ts` ↔ `terrain.ts` agree; asset-root lists reconcile; per-plate budget | unit | `npx jest data/__tests__/plates.test.ts` | ❌ |
| DATA-15 | 13 telemetry extensions (any case), repo + public walk, originals allowed | guard selftest | `npm run guard:selftest` ; `npm run guard:images` | ❌ new fixtures |
| DATA-15 | MP4 with djmd/dbgi/gpmd/subtitle track fails | guard selftest | `npm run guard:selftest` | ❌ new fixtures |
| SC-5 | one URL helper; scan finds no hand-built path | unit | `npx jest lib/__tests__/photo-routes.test.ts` | ❌ |
| SC-5 / D-32 | zero visual diff | CI | push `ci/15-*` → Visual Regression green, no update; `node scripts/ci/check-snapshot-commit.mjs --sha <each phase commit> --none` (or `git diff --name-only d29ea9a...HEAD -- '*.png'` empty) | ✅ |
| D-28 14 IN-06 | Firefox browser-Back row | e2e | `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox --reporter=line -g "LBOX-08"` | ✅ (add row) |
| D-28 14 IN-05 | case-study waits derived from holdMs | e2e | `PW_PROD=1 npx playwright test e2e/case-study.spec.ts --project=chromium --project=firefox --reporter=line -g "ENG-06"` | ✅ |
| D-28 13 IN-02/03 | ci-gate new rules | guard selftest | `npm run guard:selftest` (`npm run guard:ci` on the real workflows stays OK) | ❌ new cases |
| All | data staleness | generator | `npm run data:check` | ✅ |

`PW_PROD=1` without `PW_REUSE=1` runs `npm run build && npm run start` (playwright.config.ts:175-178). Its postbuild rewrites `public/service-worker.js`, so run `git restore public/service-worker.js` afterwards. For repeated runs, use `npm run build`, `npm run start &`, then `PW_PROD=1 PW_REUSE=1 …` (the Phase 14 quick-run pattern), and stop the orphan `next start` afterwards.

### Sampling Rate
- **Per task commit:** `npx jest <touched test paths>` + `npm run type-check` (once GUARD-10 lands) + the generator `--check` the task touched
- **Per wave merge:** `npm run lint` (includes `guard:selftest`, `data:check`, `guard:images`, and after D-27 `guard:tests:scan`) + `npm test`
- **Phase gate:** full suite green; a `ci/15-*` push with every CI job green including Visual Regression (no update); `check-snapshot-commit --none` over the phase commits; D-15 pin test green

### Wave 0 Gaps
- [ ] `tsconfig.jest.json`, `tsconfig.e2e.json`, the globals d.ts, the `jest.config.js` `.d.ts` ignore, and the `type-check` script
- [ ] `--scan-only` in `scripts/guards/test-count.mjs` + `guard:tests:scan` in `lint` + selftest cases
- [ ] `build-terrain.mjs --root` and `extract-exif.mjs --root` (prerequisites for the fixture cases)
- [ ] `PHOTO_DATA_INPUTS` extended in `scripts/guards/selftest.mjs`

## Security Domain

`security_enforcement` is absent from `.planning/config.json`, which means enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | strict Zod schemas (`z.strictObject`) for every new JSON input; closed country enum; id regex |
| V6 Cryptography | no (sha256 used for integrity and naming only, via `node:crypto`) | — |
| V8 Data Protection (privacy) | yes | GPS and telemetry never committed or served: extension ban + MP4 track ban + `.gitignore`; 4-dp coordinate rule unchanged (`Coord4`) |
| V12 Files and Resources | yes | served-asset guard: hash-name, orphan, metadata, video box whitelist, new telemetry rule; flat names only under `public/terrain/` |
| V14 Configuration | yes | `check-ci-gate.mjs` relay rules (13 IN-02/03): no `${{` in action `with:` inputs under `pull_request_target` |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Drone SRT/LRF or GPX committed with take-off GPS | Information disclosure | guard rule + `.gitignore`; synthetic fixtures only |
| Telemetry track hidden inside an MP4 | Information disclosure | `checkMp4` "exactly one video track" (measured) |
| An ignored file under `public/` served by `next start` | Information disclosure | full `public/` walk in repo mode (D-21) |
| Expression injection into an action input in the `pull_request_target` relay | Tampering / elevation | ci-gate rule for `with:` values (13 IN-02) |
| Proxy bundle carrying editorial or manifest data | Information disclosure (minor) | slim `lib/photos/routes.ts` import (F5) |

## Sources

### Primary (HIGH confidence)
- Codebase files read this session:
  - `tsconfig.json`, `package.json`, `package-lock.json` (`@jest/globals`)
  - `jest.config.js`, `jest.setup.js`, `playwright.config.ts`
  - `scripts/terrain/build-terrain.mjs` (full), `scripts/photos/extract-exif.mjs` (full), `scripts/photos/build-photo-data.mjs` (full)
  - `scripts/guards/{check-served-images,test-count,selftest(parts),check-ci-gate(parts)}.mjs`, `scripts/guards/lib/mp4-boxes.mjs`
  - `data/schemas/{terrain,photo}.ts`, `data/generated/{terrain,photos(head/tail)}.ts`, `data/generated/precache.json`
  - `lib/ascent/waypoints.ts`, `lib/photos/view-model.ts` (parts)
  - `components/site/SiteFooter.tsx`, `components/terrain/ContourField.tsx`, `components/photos/{PhotoViewer,LightboxDialog}.tsx` (parts), `components/site/SiteNav.tsx` (parts)
  - `proxy.ts`, `public/service-worker.js` (parts), `next.config.ts`
  - `.gitignore`, `.github/workflows/{ci,ci-skip-relay}.yml` (parts)
  - `node_modules/@testing-library/jest-dom/{package.json,types/jest-globals.d.ts}`, `node_modules/@jest/globals/build/index.d.ts`, `node_modules/@jest/types/build/index.d.ts` (Each)
- Measurements this session:
  - scratch `tsc` runs (jest and e2e scopes, with and without `next-env.d.ts`, unresolved-import control)
  - `tsc --listFilesOnly`
  - `terrain:build -- --check`, `data:check`, `guard:images`, `guard:selftest` (216/216)
  - MP4 walker probe (5 variants)
  - micromatch testMatch probe, git `ls-files -co --exclude-standard` icase probe, sharp encode timings
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/02-typescript.md` and `01-next-config-js/typescript.md`: build type-check behaviour

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` F4, F5, F10-F15, §1.2-§2.4 (milestone research; used for context, re-verified against code where cited)
- `.planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md` Measurement section (13-06 method)

### Tertiary (LOW confidence)
- A1, A2, A4 in the Assumptions Log

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. No new runtime libraries; `@jest/globals` verified in the lockfile, the registry and the legitimacy seam.
- Architecture: HIGH. Every recommended change is anchored to read code; the generated-output shape is a recommendation, but the constraints that drive it (`committedMeta` regex, 4096-byte caps, precache) are verified.
- Pitfalls: HIGH. Pitfalls 1-3 and 8 were reproduced by measurement this session.

**Research date:** 2026-11-14
**Valid until:** 2026-12-14 (stable in-repo facts; re-measure GUARD-10 if tests change before planning)
