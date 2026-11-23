---
phase: "16"
slug: "new-regions-alps-overview-data"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
created: "2026-11-23"
---

# Phase 16 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

The register was written at plan time. All 18 PLAN files have a `<threat_model>` block, with 65 rows in total:
- **47 distinct threats:** T-16-01 to T-16-47.
- **One T-16-SC supply-chain row per plan.** It is `mitigate` in 16-04 (low) and 16-09 (high), and `accept` in the other 16 plans.

That makes 48 unique IDs. Twelve are high severity, most of them about photo-position and altitude privacy (D-03, D-04, D-12 and D-25); T-16-SC counts at its highest plan-level severity.

**How the audit ran:**
- **Run by:** `gsd-security-auditor` on HEAD `9e29ffe`, at ASVS L1 depth. It checked that each planned mitigation exists and did not look for new threats.
- **Evidence:** each control is backed by a file:line, a test or selftest case, a read-only command the audit re-ran at HEAD, or the SUMMARY record of a one-time process mitigation (your checkpoint decisions, booleans-only D-25 scans, the push scope).
- **Re-run at HEAD:**
  - `npm run guard:selftest`: 290/290, all 8 `privacy:` cases included.
  - Jest on 11 suites: 328/328.
  - `npm run guard:images`: OK.
  - `check-snapshot-commit --none` on all 67 commits in `7a12661..HEAD`: 67 OK.
  - A booleans-only check of `exif-sidecar.json` against `photo-map.json`, at HEAD and at the 4 phase commits that touched them: 0 entries finer than their precision, and 0 altitudes kept for coarse or aerial photos.

No SUMMARY has a `## Threat Flags` section, so no threat was raised outside the register. This file holds no photo coordinate, grid value or GPS altitude.

**D-25 scan at phase close (booleans only, the 16-18 scan script, 2026-11-23):** run with 16-VALIDATION, 16-REVIEW, 16-REVIEW-DISPOSITION, 16-DOM-VERIFY and this file in the tree. Every line but three is byte-identical to 16-18's runs. The three changed lines add `16-REVIEW.md` to existing lat 2/3/4dp matches for one v2.0 photo. The match is in IN-01 (line 210), which reuses the D-01 format example from `16-CONTEXT.md`. That string is the known, reviewed pre-existing match the plans list, and it was already public on `origin/ci/16-18` (commit `49a3562`), so the review adds no new exposure. REVIEW.md has a single writer (`gsd-code-reviewer`), so it was left as written.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| gitignored originals → committed sidecar, derivatives and facts | stage 1 turns full-precision EXIF into a public, permanent file | photo positions and altitudes (high) |
| gitignored originals → decision packet / footprint booleans / dry-run output | full-precision EXIF is read to produce booleans for Tim or for an extent | booleans only (high if leaked) |
| Tim's reply → committed SUMMARY | recorded decisions and copy are public and permanent | decisions, copy (medium) |
| planning files / spike note → public repo | anything committed under `.planning/` is public | planning text (high for coordinates) |
| script output → public CI logs | error text from `photos:exif` and `photos:build` can reach public CI logs | file names, ids (medium) |
| generated facts → rendered text | display code decides how precise a shown position looks | coarse positions (low) |
| committed data → public routes | an editorial entry or generated photo can become a crawlable page or proxy-admitted slug | page routes (medium) |
| server data → client chunk | whatever the footer imports ships to every visitor | photo set, plate registry, overview (medium) |
| build scripts → client bundle | a generator library imported by app code would ship to visitors | proj4 (low) |
| BEV / swisstopo / GLO-90 S3 → committed sources | network heights become committed, sha256-pinned sources | DEM grids (medium) |
| fetcher arguments → files under `data/terrain` | a wrong flag could overwrite the pinned Matterhorn source | DEM source (high) |
| committed registry and sources → builder file I/O → `public/terrain` / CDN | the builder writes, sweeps and serves immutable terrain files | served terrain assets (medium) |
| derivatives → CDN | served images must carry no metadata | image bytes (medium) |
| licence text → committed record | the GLO-90 notice must stay verbatim | licence text (medium) |
| npm registry → `package-lock.json` | jest-mock, proj4, wkt-parser and mgrs enter the lockfile CI installs | dependencies (high) |
| local branch → GitHub | a push publishes the phase commits on a `ci/` branch | commits (medium) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation (evidence) | Status |
|-----------|----------|-----------|----------|-------------|-----------------------|--------|
| T-16-01 | Information disclosure | `extract-exif.mjs` sidecar write | high | mitigate | No default precision or kind (extract-exif.mjs:139-148, schemas/photo.ts:156-165); rounding before the write (extract-exif.mjs:225-228, 279-288); selftest `privacy:` 3dp and 2dp cases pass; sidecar booleans clean at HEAD and at all 4 commits | closed |
| T-16-02 | Information disclosure | GPS altitude of coarse/aerial photos | high | mitigate | `keepAlt` false for coarse or aerial (extract-exif.mjs:282-286); DJI safety net (:334-335); selftest `privacy: an aerial DJI still keeps no GPS altitude` and `privacy: a DJI still not marked aerial fails and writes nothing` pass | closed |
| T-16-03 | Information disclosure | error messages and logs | medium | mitigate | Off-plate messages name only file/id and plate (extract-exif.mjs:205-207, build-photo-data.mjs:412-414); selftest `privacy: a coarse photo rounded off its plate fails without printing its position` passes; `--check` prints field names only (extract-exif.mjs:444) | closed |
| T-16-04 | Tampering | moving originals into `incoming/` | low | accept | Accepted (AR-16-01); `incoming/` is gitignored, 0 originals ever tracked | closed |
| T-16-05 | Information disclosure | 16-OVERVIEW-SPIKE.md and previews | medium | mitigate | 16-02 D-25 scan matched nothing; no preview image committed under `.planning/` | closed |
| T-16-06 | Tampering | GLO-90 tiles read over the network (spike) | low | accept | Accepted (AR-16-02); `data/terrain/overview/source.json` records tile list URL, list sha256, tiles, absent slots and grid sha256 | closed |
| T-16-07 | Information disclosure | new photos reaching pages, sitemap, proxy | medium | mitigate | `data/light-table.ts:19-24` lists 4 ids; `lib/photos/routes.ts:15,34`; `region-series.test.ts:25`, `photo-routes.test.ts:56` pass | closed |
| T-16-08 | Information disclosure | editorial copy in client chunks | low | mitigate | `data/light-table.ts:1` type-only import; `photo-routes.test.ts:65` passes | closed |
| T-16-09 | Tampering | `package-lock.json` (jest-mock) | medium | mitigate | `7d5acb8` changes one lockfile line; full diff in 16-04-SUMMARY | closed |
| T-16-10 | Repudiation | e2e coverage per engine | low | mitigate | Both rows kept (`e2e/photos-lightbox.spec.ts:803`, `:826-838`); `@not-chromium` inverted in both modes (`playwright.config.ts:64-65`). The register's "Firefox two" is a wording slip; the plan's verify and the code give one row per engine | closed |
| T-16-11 | Denial of service | client JS budget (footer chunk) | medium | mitigate | `FORBIDDEN_IN_CLIENT_GRAPH` (`lib/__tests__/client-graph.test.ts:36-41`, tests :130-141) passes; Home-only `home-photos.ts`; 1,851,685 B against cap 1,855,668 B | closed |
| T-16-12 | Information disclosure | coordinate display | low | mitigate | Decimals from `position.precision` (`lib/photos/view-model.ts:269`), ± radius note (:277-278); `home-format.test.ts:150,162`, `strip.test.tsx:180` pass | closed |
| T-16-13 | Denial of service | plate sheets in the footer chunk | medium | mitigate | `client-graph.test.ts:39` forbids `plates.ts`; no component imports `generated/plates`; ContourField takes the sheet as a prop | closed |
| T-16-14 | Tampering | Matterhorn terrain files and modules | medium | mitigate | `terrain.ts`, `precache.json` and `data/terrain/source` identical to `56d62af` at HEAD; `public/terrain` has 13 additions, 0 modifications | closed |
| T-16-15 | Information disclosure | per-photo precision choice | high | mitigate | Tim's verbatim answers in 16-08-SUMMARY, committed in `5c7ec6b` before the ingest `b9a74e6`; `photo-map.test.ts:210` pins them | closed |
| T-16-16 | Information disclosure | copy finer than the precision | medium | mitigate | Prohibition at 16-08-PLAN:48; committed locations region-level (`data/photos/editorial.ts:38,48,164,174,246`); Tim approved the copy | closed |
| T-16-17 | Information disclosure | decision packet and SUMMARY | medium | mitigate | Packet stayed in the scratchpad; 16-08 D-25 scan matched nothing new | closed |
| T-16-18 | Tampering | wkt-parser drift | medium | mitigate | Override to 1.5.6 (`package.json:124`); `npm ls` shows it overridden under proj4 2.22.0 | closed |
| T-16-19 | Information disclosure | proj4 in a client bundle | low | mitigate | ESLint bans proj4 (`eslint.config.mjs:77-81`) except `scripts/**/*.mjs` (:91-94); imports only in `plate-dem.mjs` and `selftest.mjs` | closed |
| T-16-20 | Tampering | stale-file sweep and stem collisions | medium | mitigate | `overview` reserved stem (`data/schemas/terrain.ts:276-284`); D-15 test scoped (`terrain.test.ts:255-279`); selftest `terrain: a fixture 2D plate … Matterhorn stays byte-equal` passes | closed |
| T-16-21 | Tampering | silent strip clamp | low | mitigate | Guard at `build-terrain.mjs:851-856`; selftest `terrain: a strip centre outside its plate fails` passes | closed |
| T-16-22 | Tampering | poster re-encode on an unreadable `terrain.ts` | medium | mitigate | Refusal at `build-terrain.mjs:1064-1067`; selftest `terrain: an unreadable terrain.ts refuses to re-encode posters` passes | closed |
| T-16-23 | Tampering | network data substituted at fetch | medium | mitigate | Saalfelden `source.json` records url, length and last-modified per tile (`fetch-bev.mjs:307-318`); sha256 checked on every build (`build-terrain.mjs:281`, `plate-dem.mjs:65`); one-source schema (`terrain.ts:98-122`) | closed |
| T-16-24 | Denial of service | BEV server dropping connections | low | mitigate | `ATTEMPTS=5` with backoff (`fetch-bev.mjs:101-102,240-246`); written only at the end (:471); forced-failure dry run in 16-11-SUMMARY | closed |
| T-16-25 | Repudiation | credit misattribution | medium | mitigate | Tim's literal credit in 16-11-SUMMARY; credit, licence and DOI stored in the Saalfelden `source.json` and required by the schema (`terrain.ts:108,120-122`) | closed |
| T-16-26 | Tampering | accidental Matterhorn refetch | high | mitigate | `--plate` and `--force-home` enforced (`fetch-dem.mjs:143-165`); `fetch-bev.mjs:179-185` refuses matterhorn; selftest `fetch:` refusal cases pass | closed |
| T-16-27 | Denial of service | served bytes per plate | low | mitigate | `PLATE_BUDGET` checked (`build-terrain.mjs:1036-1052`), write refuses first (:1074-1081); `plates.test.ts:293-312` passes | closed |
| T-16-28 | Tampering | nodata or bad heights in the BEV source | medium | mitigate | Nodata and range check (`fetch-bev.mjs:390-395`); sha256 checked on every build | closed |
| T-16-29 | Tampering | sea tile vs network failure | medium | mitigate | Sea only when absent from the tile list (`fetch-overview.mjs:229-230`); truncated list fails (:179); a listed tile failure stops the fetch (:144-150); `overview.test.ts:83` passes | closed |
| T-16-30 | Repudiation | altered or paraphrased GLO-90 notice | medium | mitigate | `notice` and `liability` are `z.literal` (`data/schemas/overview.ts:107-108`); `overview.test.ts:104-130` passes | closed |
| T-16-31 | Information disclosure | new photo positions | high | mitigate | 16-14-SUMMARY per-id booleans all within precision; `photo-map.test.ts:210` passes; sidecar booleans clean at `b9a74e6`, `2ff070e`, `eb4bb1b` | closed |
| T-16-32 | Information disclosure | aircraft altitude | high | mitigate | Both DJI records `aerial`, `altM` null for both (booleans); extract-exif rule and DJI net keep re-extraction the same | closed |
| T-16-33 | Information disclosure | metadata or serials in derivatives | medium | mitigate | `npm run guard:images` OK; closed `strictObject` sidecar schema (`photo.ts:93-112`); `exif-sidecar.test.ts:111` passes | closed |
| T-16-34 | Information disclosure | new photos reaching routes or chunks | medium | mitigate | `photo-routes.test.ts:56` (4 slugs) and client-graph tests pass; 16-14 chunk grep found 0 new ids or slugs | closed |
| T-16-35 | Denial of service | overview served bytes | low | mitigate | `OVERVIEW_BUDGET` raw, brotli and served (`overview.test.ts:157,240,383`) pass | closed |
| T-16-36 | Information disclosure | overview data in client chunks | low | mitigate | `client-graph.test.ts:40` forbids `overview.ts`; 0 app/component/lib imports; 16-15 chunk grep 0 files | closed |
| T-16-37 | Tampering | overview files swept by a later build | medium | mitigate | Built in the same `write()` run; selftest `terrain: the overview builds in the same run and Matterhorn stays byte-equal` passes | closed |
| T-16-38 | Information disclosure | footprint check output | high | mitigate | 16-16-SUMMARY records booleans and the plate extent only; scratch script outside the repo; D-25 scan clean | closed |
| T-16-39 | Tampering | Matterhorn source refetch (Ortler) | high | mitigate | `data/terrain/source` identical to `56d62af` at HEAD; Ortler data only under `data/terrain/plates/ortler/` | closed |
| T-16-40 | Denial of service | plate served bytes (Ortler) | low | mitigate | Same `PLATE_BUDGET` enforcement as T-16-27; `plates.test.ts` per-sheet cases cover ortler | closed |
| T-16-41 | Information disclosure | Ortler photo positions | high | mitigate | Tim's verbatim "Both 3dp" in 16-17-SUMMARY; `photo-map.test.ts:238` passes; both sidecar entries within 3dp, `altM` null, `groundM` present (booleans) | closed |
| T-16-42 | Information disclosure | copy naming a finer place | medium | mitigate | Prohibition at 16-17-PLAN:59; location "Ortler Alps, Italy" (`editorial.ts:226,236`); Tim approved | closed |
| T-16-43 | Information disclosure | Ortler dry-run output | medium | mitigate | 16-17-SUMMARY Task 1: temp root deleted, booleans only, repo-clean verify exit 0 | closed |
| T-16-44 | Elevation of privilege | git push scope | medium | mitigate | `git ls-remote` shows only `ci/16-18` (at `e96f266`) for this phase, no phase branch; phase not on main; one `push` run, no `workflow_dispatch` | closed |
| T-16-45 | Tampering | visual baselines | medium | mitigate | `check-snapshot-commit --none` on 67/67 phase commits; no e2e PNG in the phase diff (the only PNGs are the 3 DEM sources) | closed |
| T-16-46 | Information disclosure | photo coordinates in planning files (16-18) | high | mitigate | 16-18 final D-25 run: 177 lines, byte-identical to run 1, no 16-18 file named | closed |
| T-16-47 | Information disclosure | planning files and SUMMARYs (phase-wide) | high | mitigate | Booleans-only D-25 scan records in the SUMMARYs of 16-01, 02, 08-18; each run greps all of `.planning/`, so it covers 16-03 to 16-07 too | closed |
| T-16-SC | Tampering | npm installs | high | mitigate + accept | 16-09: Tim's "verified (Recommended)", exact pin (`package.json:115`), override (:124), lockfile limited to proj4/mgrs/wkt-parser. 16-04: exact pin (:112). Elsewhere accepted (AR-16-03); lockfile changed only in `7d5acb8` and `36aa278` | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-16-01 | T-16-04 | A move inside the gitignored folder. No file is opened or changed, the names are listed in the SUMMARY, and moving back restores the state. | plan (16-01 threat model) | 2026-11-23 |
| AR-16-02 | T-16-06 | A scratch-only measurement in the spike. Nothing is committed there, and 16-13's fetch records the tile list and the sha256 of the committed grid. | plan (16-02 threat model) | 2026-11-23 |
| AR-16-03 | T-16-SC (16 plans) | No package is installed in these plans. The scratch scripts in 16-02, 16-11 and 16-13 use the repo's already-installed geotiff, sharp and d3-contour. | plan (each threat model) | 2026-11-23 |
| AR-16-04 | outside the register (pre-existing, v2.0) | 16-01's D-25 scan found the three already-published photos at about 1 m precision in eight v2.0 planning files committed before Phase 16 (`08-*` and `v2.0-research/STACK.md`). Phase 16 added no such file. | Tim, "Keep history (Recommended)" (16-01 D-25 halt) | 2026-11-23 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-23 | 48 | 48 | 0 | gsd-security-auditor (ASVS L1, HEAD `9e29ffe`) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-23
