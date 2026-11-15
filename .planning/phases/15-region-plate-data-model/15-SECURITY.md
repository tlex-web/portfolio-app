---
phase: "15"
slug: "region-plate-data-model"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
created: "2026-11-15"
---

# Phase 15 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

The register was written at plan time. All 16 PLAN files have a `<threat_model>` block, with 50 rows in total:
- 34 distinct threats, T-15-01 to T-15-35. There is no T-15-28.
- One T-15-SC supply-chain row per plan.

T-15-17 and T-15-18 (drone and GPS telemetry) are high severity. Every other row is medium or low.

The audit was run by `gsd-security-auditor` on HEAD `1ab9027`, at ASVS L1 depth. It checked that each planned mitigation exists in the code and did not look for new threats. The evidence for each control is one of:
- a file:line;
- a command the audit re-ran at HEAD;
- the CI record (run 43651737781 on `ci/15-16`).

Two SUMMARYs raised threat flags, and both map to registered threats: 15-05 maps to T-15-33 and T-15-06, and 15-11 maps to T-15-15 and T-15-16. No flag was unregistered.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → package-lock.json | A dev dependency enters the lockfile that CI installs with `npm ci` (15-01) | package tarball, integrity hash |
| Type declarations → the quality gate | The globals d.ts decides whether test code is really type-checked (15-01) | type information |
| Test sources → CI gates | Focused, skipped or silenced tests weaken what the gates prove (15-02, 15-03, 15-09, 15-14, 15-15) | test code, test selection |
| Committed registry → builder file I/O | `plates.json` names the source directories the builder reads and the files it writes and sweeps in `public/terrain/` (15-04, 15-05) | paths, plate ids |
| Builder output → CDN | Files under `public/terrain/` are served `immutable` and precached (15-04, 15-05) | hashed terrain assets |
| Committed JSON → generators | `photo-map.json`, `regions.json` and `plates.json` decide membership and which raster is read (15-06) | ids, regions, countries |
| Originals (ignored) → committed sidecar | Camera files carry GPS and serials; only the sidecar's whitelisted fields are committed (15-07) | EXIF fields |
| Generated photo data → every route's footer and Home | Data added for other regions must not reach Home surfaces; the footer's imports ship in the `global-error` client chunk (15-08, 15-11) | photo facts, plate sheet |
| Request path → proxy.ts | Unknown photo slugs are rejected before render (15-10) | photo slug |
| Local drone and camera dumps → git and `public/` → visitors | A `git add -A`/`-f` could commit take-off GPS; `next start` and the CDN serve all of `public/` (15-12) | telemetry sidecars, MP4 tracks |
| Untrusted PR metadata → the `pull_request_target` relay | The relay runs with the base repository's token on possibly untrusted PRs (15-13) | PR titles, refs, expressions |
| Local branch → GitHub (origin) | A push runs CI with repository credentials; only `ci/15-*` is in scope (D-31) (15-16) | commits |
| Planning records → later audits | Disposition files are read as the truth about review findings (15-16) | dispositions, commit SHAs |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Evidence | Status |
|-----------|----------|-----------|----------|-------------|------------|----------|--------|
| T-15-01 | Tampering | package-lock.json | medium | mitigate | Install only through the bundled npm-cli.js (11.20.0); the acceptance criterion bounds the lockfile diff to the @jest/globals entries; `npm ls --depth=0` in CI's lockfile check stays green | Lockfile diff is one line (root devDependency `@jest/globals ^30.5.2`); the `node_modules/@jest/globals` entry keeps its base integrity and has no install script; `npm ls --depth=0` passes (ci.yml runs it) | closed |
| T-15-02 | Tampering | the type-check gate (`__tests__/jest-globals.d.ts`) | medium | mitigate | `skipLibCheck` hides an unresolved import in a d.ts, so the canary test's `@ts-expect-error` (TS2578 if unused) and the exact 99-then-49 error counts prove the globals are typed | `lib/__tests__/jest-globals-canary.test.ts:4` `@ts-expect-error` canary; `tsc -p tsconfig.jest.json` 0 errors, no TS2578 | closed |
| T-15-SC (15-01) | Tampering | npm install of @jest/globals | low | mitigate | RESEARCH Package Legitimacy Audit verdict [OK] (jestjs/jest, 62.7M weekly downloads, already a transitive dependency at 30.5.2, no postinstall); no [ASSUMED] or [SUS] package, so no blocking human checkpoint is needed | 15-RESEARCH Package Legitimacy Audit: @jest/globals [OK] (jestjs/jest, no postinstall); lockfile confirms no install script | closed |
| T-15-32 | Repudiation | type-check claims for the ten test files fixed here | low | mitigate | Per-file error counts reach zero and the total drops to exactly 9; the per-commit gate proves no `any` cast, ignore directive or `@ts-expect-error` was added, so the drop means fixed, not hidden | 15-02 commits 5949638, 78c1507 add no ignore directive or `any`; Jest config type-checks at 0 | closed |
| T-15-SC (15-02) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |
| T-15-03 | Tampering | test-count.mjs (GUARD-03 ratchet) | medium | mitigate | `--scan-only` is a separate branch that rejects `--jest`, `--list` and `--update`; the ratchet path, its CI step and its selftest cases are unchanged and still pass | test-count.mjs:83-84 `--scan-only` rejects `--jest/--list/--update/--baseline`; the scan-only branch (:168) exits before the ratchet; ratchet code, `.github/` and the baseline unchanged; selftest case names 194 to 221, none removed; `.fixme(` fixture case eb22455 | closed |
| T-15-04 | Repudiation | type-check coverage claims | low | mitigate | The diff-wide gates since `d29ea9a` prove no ignore directive or `any` cast was added and every `@ts-expect-error` carries a reason, so "zero errors" means fixed, not hidden | Phase diff since d29ea9a adds no ignore directive, `any` cast or `as unknown as`; the only two `@ts-expect-error` lines carry reasons (ContourField.test.tsx:23, canary:4) | closed |
| T-15-SC (15-03) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |
| T-15-05 | Tampering | `PlateEntry.source` and plate ids | medium | mitigate | Strict Zod schema: `source` must match `^data/terrain/(source | terrain.ts:204-221 `PlateId`/`PlateSource` regexes; builder calls `Plates.parse`; sweep reads only the top level of `public/terrain/` and deletes only `MANAGED` names; plates.test.ts rejects `..`, absolute paths and asset-stem ids | closed |
| T-15-07 | Information disclosure | `public/terrain/` names and the precache | low | mitigate | Flat hashed names only (schema URL regex, guard `HASH_NAME`, `orphan` rule over `plates.ts`); precache stays the home plate's two URLs (D-14) | `TerrainAssetUrl` regex (terrain.ts:75-79); `PlateSheet` per-plate prefix check (:357-366); guard `HASH_NAME` and orphan rule over `plates.ts` (check-served-images.mjs:102, :109, :332); precache.json unchanged (home plate only) | closed |
| T-15-SC (15-04) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |
| T-15-06 | Denial of service | the served asset budget (Vercel Hobby transfer) | low | mitigate | `PLATE_BUDGET` enforced per plate by the builder (this plan) and by `plates.test.ts` on the committed plates (15-04) | build-terrain.mjs:701-721 `budgetProblems`, enforced before any write (:726) and in `--check` (:833); `PLATE_BUDGET` (terrain.ts:404) tested in plates.test.ts:248-261 | closed |
| T-15-33 | Tampering | the prefix-aware stale-file sweep in `public/terrain/` | medium | mitigate | The sweep deletes only `MANAGED` names outside the union of every plate's expected names, inside `public/terrain/`; selftest case (c) proves removing a plate deletes only its prefixed files and no Matterhorn byte | Keep set is the union of every plate's names (:754); selftest 'terrain: removing a plate sweeps only its files' passes (Matterhorn and home modules byte-equal) | closed |
| T-15-SC (15-05) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |
| T-15-08 | Tampering | `photo-map.json`, `regions.json` (V5 input validation) | medium | mitigate | `z.strictObject` schemas, closed `Country` enum, slug regexes, unique-file and sorted-key refines; cross-file bijection checks in `photos:build` (runs in CI's `data:check`) | photo.ts:107 closed `Country` enum; strict `PhotoMapEntry` with sorted-key and duplicate-file refines (:120-169); strict `Regions`; build-photo-data.mjs:259-299 one-to-one and registry-membership checks, run by `data:check` in lint (CI) | closed |
| T-15-09 | Information disclosure | `ExifSidecarEntry` (camera serials, XMP GPS) | medium | mitigate | The sidecar schema stays closed and a Jest test proves unknown keys are rejected | `ExifSidecarEntry` strictObject (photo.ts:57); exif-sidecar.test.ts:105-112 rejects `serial` and `xmp` | closed |
| T-15-SC (15-06) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |
| T-15-10 | Spoofing | photo ids from file names (a DJI or second-camera `IMG_0605`) | low | mitigate | Ids come only from the map (`idFor`), and an unmapped original fails extraction | extract-exif.mjs:139-143 `idFor` takes ids only from the map ('add a record' for an unmapped original); selftest cases pass | closed |
| T-15-34 | Information disclosure | extraction selftest fixtures | medium | mitigate | `tempExifRoot` generates its JPEGs with sharp (no EXIF, no GPS, no serial) in a temp root; nothing from `assets/photos-original/` is copied or committed | `tempExifRoot` (selftest.mjs:1243-1262) generates metadata-free JPEGs with `sharp({create})` in `os.tmpdir()`; nothing copied from the ignored originals; no media file added in the phase | closed |
| T-15-SC (15-07) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |
| T-15-11 | Tampering | Home ascent data integrity (`buildWaypoints` default input) | low | mitigate | The Home list is the only membership source; `homePhotos` throws on a missing id; the strict-list test and the injected-photo test fail on any drift | home-photos.ts:26-35 throws on a missing id; `buildWaypoints` defaults to `homeInput()`; footer uses `homePhotos()`; home.test.ts:41-66 and home-waypoints.test.tsx:85 | closed |
| T-15-12 | Denial of service | build-time throw in `homeLowestDemM` at module load | low | accept | A missing Home photo is a data error that should fail the build and tests (the existing `buildWaypoints` RangeError policy), never render a broken Home | Accepted (see Accepted Risks Log); behaviour confirmed: `homeLowestDemM` throws through `homePhotos` (waypoints.ts:190) | closed (accepted) |
| T-15-SC (15-08) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |
| T-15-35 | Tampering | GUARD-03 ratchet (the rail-start test and the seven Home-surface sites) | low | mitigate | Every site is rewritten in place with its name kept; the grep gate proves no global read remains; the full Jest run with `guard:tests` in 15-16 proves the count did not drop | `git grep lowestDemM` empty; the 15-09 global-photo-read gate over the 7 sites empty; 4 test titles renamed in place, none deleted; `guard:tests` green in CI | closed |
| T-15-SC (15-09) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |
| T-15-13 | Information disclosure | proxy.ts bundle (F5) | low | mitigate | The proxy imports only `lib/photos/routes.ts` (editorial slugs), not the view-model with manifests, generated facts and terrain | proxy.ts:5 imports only `@/lib/photos/routes` (was the view-model); routes.ts imports only type-only editorial data | closed |
| T-15-14 | Spoofing | unknown-slug handling (a slug the proxy admits but no page renders) | low | mitigate | The `photoRouteSlugs` / `photoSlugs` set-equality test fails before a mismatch can ship; `e2e/not-found.spec.ts` still passes | photo-routes.test.ts:39-52 `photoRouteSlugs` equals the static-page slugs; :60 pins the `@__PURE__` annotation; not-found spec unchanged | closed |
| T-15-SC (15-10) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |
| T-15-15 | Information disclosure | `data/generated/plates.ts` in client chunks | low | mitigate | `plates.ts` holds only scalars and content-hashed public URLs (no source paths, no checksums of private data; same rule as `terrain.ts`, T-08-12); the chunk growth is measured against the 15-01 phase-base total (at most 4,096 B), here and at the phase tip in 15-16 | `PlateSheet` strictObject with no source field; `plates.ts` holds scalars, hashed URLs and the already-public `sourceSha256`; client JS +1,190 B over base at the tip (cap 4,096 B, 15-16 SUMMARY) | closed |
| T-15-16 | Tampering | region membership of the light table | low | mitigate | `seriesInput` filters by the CI-checked generated `region`; the isolation test fails if another region's photo reaches the light table | view-model.ts:335-340 `seriesInput` filters on region; region-series.test.ts:21-40 injected-photo isolation (fails when the old default is restored) | closed |
| T-15-SC (15-11) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |
| T-15-17 | Information disclosure | drone SRT/LRF logs, GPX/KML tracks and XMP sidecars with GPS (V8) | high | mitigate | `telemetry` rule over 13 extensions, case-insensitive, in repo mode (tracked plus untracked-unignored) and over all of `public/`; `.gitignore` bracket patterns; CI runs it in `lint` | check-served-images.mjs:98 13 extensions, case-insensitive (`:(icase)` :99, `toLowerCase` :177); `repoTelemetry` (:207-211) = `git ls-files -co --exclude-standard` plus a full `walk(public/)`; .gitignore:93-105 13 bracket patterns, no negations; selftest covers all 13 in mixed case; nothing tracked or served | closed |
| T-15-18 | Information disclosure | telemetry or subtitle tracks inside an MP4 (V8) | high | mitigate | `checkMp4` requires exactly one video track (measured on five synthetic fixtures); the fixtures are spliced from the committed clean clip at selftest time under a provenance comment, a determinism case pins their bytes, and no MP4 fixture is committed | mp4-boxes.mjs:99-102 requires exactly one `vide` track; five spliced fixtures (djmd, dbgi, gpmd, sbtl, text) all rejected; determinism case pins two identical 1,348 B builds; no MP4 added | closed |
| T-15-19 | Information disclosure | an ignored file under `public/` served by `next start` | medium | mitigate | the full `public/` walk includes ignored files (D-21), proven by a temp-git-repo case | `walk(public/)` includes ignored files (:209); temp-repo case: an ignored `public/flight.gpx` fails | closed |
| T-15-20 | Repudiation | a guard that silently passes when git fails | medium | mitigate | the new listing throws like `gitLsFiles`; the outside-a-work-tree case proves exit 1 with `scope: git ls-files failed` | `gitLsFilesVisible` uses `execFileSync` (throws); caller exits 1 with 'scope: git ls-files failed' (:301-307); selftest covers running outside a work tree | closed |
| T-15-SC (15-12) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |
| T-15-21 | Tampering / Elevation of privilege | `ci-skip-relay.yml` action inputs (V14) | medium | mitigate | Rule 17 fails any `${{` in a `with:` value of a relay action step; selftest proves both directions | check-ci-gate.mjs:618-688 rule 17 `findExpressionInputs` over raw lines, called from `checkRelay`; checkout steps are already failed by rule 11; selftest both directions plus the block-scalar case; `guard:ci` OK | closed |
| T-15-22 | Spoofing | a forged `CI OK` check from an expression-named job | medium | mitigate | Rule 18 fails expression names outside `ci.yml` unless they are the relay's exact needs-based shape | Rule 18 `findExpressionNamesOutsideCi` (:528-560); the only exception is the relay `isNeedsNameExpression` shape; 3 selftest cases pass | closed |
| T-15-23 | Repudiation | misleading code comment about error logging | low | mitigate | Comment corrected; behaviour and its test unchanged | 61ea7ed touches comment lines only (SafeCanvas.tsx:39-42) | closed |
| T-15-SC (15-13) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |
| T-15-24 | Repudiation | e2e mirror of revealTrigger (`triggerState`) | low | mitigate | Both sides change together to the same unit-independent measurement; a Jest row proves the rem case | 66eb7f2 changes LightboxDialog.tsx and its e2e mirror together (probe of `var(--nav-h)` plus `clientHeight`); new Jest rem row | closed |
| T-15-25 | Tampering | GUARD-03 ratchet (test count) | low | mitigate | Rows are added, never removed; a Firefox crash uses the documented `@firefox-43967` rule, never `.skip(` or `.fixme(` (guard:tests:scan enforces) | No `.skip(`/`.fixme(`/`.only(` added; rows added, none removed; Firefox Back row 8/8 without the `@firefox-43967` tag; `guard:tests:scan` in lint | closed |
| T-15-SC (15-14) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |
| T-15-26 | Repudiation | photo tests' fixture selection | low | mitigate | `viewBySlug` throws on an unknown slug; identity lookups are named; the SUMMARY records every lookup's classification for review | e2e/helpers/photo-fixtures.ts:25-29 `viewBySlug` throws on an unknown slug; the 15-15 SUMMARY classifies all 83 lookups | closed |
| T-15-27 | Tampering | GUARD-03 ratchet | low | mitigate | No test is removed or skipped; per-file test totals are recorded before and after; `guard:tests:scan` runs | No test removed or skipped across the phase; per-file totals before and after in the 15-15 SUMMARY; scan OK | closed |
| T-15-SC (15-15) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |
| T-15-29 | Elevation of privilege | git push scope | medium | mitigate | Plain push of a new `ci/15-16` only (precondition: the remote branch does not exist); no force, no phase branch, no `main`, no workflow dispatch (D-31) | `ci/15-16` is the only Phase 15 remote ref (one plain push); no phase-branch or main push; no workflow_dispatch during the phase | closed |
| T-15-30 | Tampering | visual baselines | medium | mitigate | No PNG is staged or committed; `check-snapshot-commit --none` on every phase commit; any visual diff stops the plan for Tim | `git diff d29ea9a..HEAD -- '*.png'` empty; `check-snapshot-commit --none` 82/82 OK; CI Visual Regression passed with `--update-snapshots=none` (run 43651737781) | closed |
| T-15-31 | Repudiation | disposition write-backs | low | mitigate | Append-only with SHAs that `git cat-file` resolves; enums and Tim's columns unchanged (14-07 precedent) | 0b06608 only appends to 9 rows (old text kept as prefix); all six fix SHAs resolve in HEAD history | closed |
| T-15-SC (15-16) | Tampering | npm/pip/cargo installs | low | accept | No package is installed in this plan | Accepted (see Accepted Risks Log); premise holds: package.json and the lockfile change only in 5ad2239 (15-01) | closed (accepted) |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-15-01 | T-15-12 | A Home waypoint id with no photo makes `homePhotos()` throw, which fails the build and the tests. That is preferred to rendering a broken Home, and follows the existing `buildWaypoints` RangeError policy (15-08-PLAN.md:200; 15-08-SUMMARY.md:47; D-07). | planner (15-08 threat model) | 2026-11-14 |
| AR-15-02 | T-15-SC (15-02 to 15-16) | These 15 plans install no package, so they add no supply-chain risk. Confirmed: `package.json` and `package-lock.json` change only in `5ad2239` (15-01). | planner (each plan's threat model) | 2026-11-14 |

*Accepted risks do not resurface in future audit runs.*

**Pending decision, not an accepted risk.** A-15-12 is a flagged planner assumption in 15-12-PLAN.md:92 and is separate from T-15-12. Under it, a sidecar force-added under the ignored originals folders fails the telemetry guard. That is the stricter, fail-closed reading. It is implemented in `check-served-images.mjs:205-210` and covered by the selftest case "a force-added sidecar under the originals folder fails". It awaits Tim's review; reversing it takes one condition in `repoTelemetry()` and one selftest case.

**Notes from the audit (not findings).**
- **Version spec:** `@jest/globals` was saved as `^30.5.2`, not as an exact version. The lockfile pins 30.5.2 with its integrity hash and CI installs with `npm ci`, so the T-15-01 mitigation holds.
- **Determinism pin:** T-15-18's determinism case pins reproducibility (two identical builds) and the 1,348 B length, not a content hash. That is enough because the clips are built only from committed bytes.
- **MP4 scope:** in repo mode, `checkMp4` box-walks only tracked MP4s. The ignored-file `public/` walk that covers T-15-19 checks telemetry extensions only. No ignored, untracked MP4 exists under `public/` today, so this is outside the declared mitigations, not an open threat.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-15 | 50 | 50 | 0 | gsd-security-auditor (opus), HEAD 1ab9027 |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-15

## Security Audit 2026-11-15

| Metric | Count |
|---|---|
| Threats found | 50 |
| Closed | 50 |
| Open | 0 |
