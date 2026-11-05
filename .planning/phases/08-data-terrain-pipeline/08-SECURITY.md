---
phase: "08"
slug: "data-terrain-pipeline"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-24"
---

# Phase 08 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time (all 13 plans carry a `<threat_model>`); verified at ASVS L1 (grep/test depth) by secure-phase on 2026-10-24. block_on: high.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Tim's local originals → public git repo | GPS-bearing originals and full-precision coordinates must never cross into a commit or into public/ | Photos with GPS EXIF (high) |
| local originals → committed public/ derivatives | Only resized, rotated, metadata-free copies cross into the public repo and site | Image derivatives |
| any commit → public repo and site | A metadata-bearing or full-size image must be stopped before deploy | Images (high) |
| committed facts → client bundles | photos.ts ships to browsers (footer, bridge) | 4-dp coordinates, heights |
| build scripts → shipped bundle | Generator libraries and raw DEM data must stay on the build side | Code, raster data |
| committed source → generated public assets | Generated SVGs are served same-origin | SVG markup |
| proxy (CSP) → static assets | Excluded /terrain paths no longer receive a CSP header | Static SVG/PNG/AVIF/WebP |
| precache.json → service worker | Generated URLs are injected into executable SW code | URL strings |
| CDN/browser cache → visitors | Immutable responses are never revalidated; old URLs cached outside our control | Hashed assets |
| swisstopo STAC/COG (network) → committed source raster | External data enters the repo once, by a manual run | DEM raster |
| swisstopo product page → committed attribution constant | Legal text copied from an external page | Attribution string |
| external fact sources → shipped copy | Facts fetched from the web become published claims | Editorial text |
| Tim's CLI_X output / corrections → committed data | Human-reported facts; no estimates substituted | riskScores, corrections |
| source class names → compiled CSS → pixels | A rename must not change any rendered colour | CSS |
| CI artifact → committed baselines | Baselines define correctness for every later visual run | PNG baselines |
| npm registry → devDependencies | exif-reader, geotiff, d3-contour, simplify-js are new supply-chain surface | Packages |
| footer markup → every page | Must stay static, deterministic and accessible | Markup |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-08-01 | Information disclosure | app/, components/, lib/, data/ import graph | medium | mitigate | ESLint `no-restricted-imports` on d3-contour, geotiff, simplify-js, exif-reader, sharp outside scripts/**/*.mjs; selftest proves fail in components/ and lib/ (Task 3). **Evidence:** eslint.config.mjs bans the 5 generator libs outside scripts/**/*.mjs; selftest 72/72 | closed |
| T-08-02 | Tampering | lib/terrain/contour-paths.ts contourSvg | medium | mitigate | Serializer emits only svg, g and path elements from numeric input; test asserts no `<script`, `href` or `on` attribute (Task 2). **Evidence:** contour-paths.test asserts no <script/href/on…; served-images svg-content rule | closed |
| T-08-SC (08-01) | Tampering | npm installs | high | mitigate | No package installs in this plan. **Evidence:** package.json dependency diff over the phase adds nothing in this plan | closed |
| T-08-03 | Information disclosure | assets/photos-original/ originals | high | mitigate | Folder outside public/ and gitignored; Task 1 verify asserts check-ignore, no tracked file under assets/ and no public/images/landscapes/; 08-09's guard scans every tracked image for EXIF. **Evidence:** git check-ignore assets/photos-original → ignored; 0 tracked files under assets/; public/images/landscapes untracked | closed |
| T-08-04 | Information disclosure | data/photos/exif-sidecar.json GPS fields | high | mitigate | Rounding to 4 dp inside extract-exif before ExifSidecar.parse; Coord4 refine rejects 5 dp; raw-text regex test (Task 2). **Evidence:** 0 coords with ≥5 dp in exif-sidecar.json; Coord4 refine in data/schemas/photo.ts | closed |
| T-08-05 | Tampering | edited original not re-extracted | medium | mitigate | sha256 per original in the sidecar; extract-exif --check re-hashes and re-extracts locally and fails on any byte difference. **Evidence:** sha256 per original in sidecar; `photos:exif -- --check` exit 0 | closed |
| T-08-06 | Information disclosure | GPS-bearing originals in public git history (287c2e9, 8fa0991) | medium | accept | D-12: Tim accepts the history exposure; no rewrite, no force-push; recorded in PROJECT.md by 08-07 and in the phase SUMMARY. **Evidence:** Accepted (D-12), see Accepted Risks Log; D-12 row in PROJECT.md | closed |
| T-08-SC (08-02) | Tampering | npm install exif-reader@2.0.3 | high | mitigate | RESEARCH Package Legitimacy Audit verdict OK (no postinstall); exact pin; devDependency only; guard:parity after install. **Evidence:** exif-reader@2.0.3 exact pin, devDependency, no install scripts | closed |
| T-08-07 | Repudiation | data/projects.ts riskScore values | medium | mitigate | riskScore required by schema and type; values copied verbatim from Tim's quoted reply in the SUMMARY; band membership test (Task 3). **Evidence:** riskScore required in DemoCommandSchema (no optional form); band-membership tests; Tim-supplied values quoted in 08-03-SUMMARY | closed |
| T-08-08 | Tampering | ProjectHighlights output on clix pages | low | mitigate | Order-sensitive JSON equality against the HEAD fixture; same-classnames parity; projects e2e (Task 1). **Evidence:** legacy-highlights.json HEAD fixture equality test; same-classnames OK; projects e2e green | closed |
| T-08-SC (08-03) | Tampering | npm installs | high | mitigate | No package installs in this plan. **Evidence:** package.json dependency diff over the phase adds nothing in this plan | closed |
| T-08-09 | Denial of service | build depends on swisstopo availability | medium | mitigate | fetch-dem is manual and absent from prebuild and CI; lint and Vercel use the committed source raster only. **Evidence:** no prebuild script; terrain:fetch absent from CI workflows; lint uses the committed raster | closed |
| T-08-10 | Tampering | downloaded DEM window | medium | mitigate | source.json records the STAC item, COG URL and checksum; build-terrain verifies the PNG sha256 against source.json on every run. **Evidence:** source.json records sha256; `terrain:build -- --check` exit 0 (fails on sha mismatch, proven in 08-04) | closed |
| T-08-11 | Tampering / XSS | public/terrain/*.svg | medium | mitigate | contourSvg emits only svg, g and path; terrain.test.ts rejects `<script`, `href` and `on…=`; 08-09's served-images guard repeats the scan in lint. **Evidence:** contourSvg allowlist + terrain.test rejects script/href/on…; guard:images svg-content rule | closed |
| T-08-12 | Information disclosure | data/generated/terrain.ts in client bundles | low | mitigate | Module holds only scalars and URLs; test asserts no import, no path data, size under 4 KB. **Evidence:** data/generated/terrain.ts 2305 B, 0 imports, scalars/URLs only; size test | closed |
| T-08-SC (08-04) | Tampering | npm install geotiff@3.0.5 d3-contour@4.0.2 simplify-js@1.2.4 | high | mitigate | RESEARCH Package Legitimacy Audit verdicts OK (no postinstall); exact pins; devDependencies only; ESLint ban from 08-01 keeps them out of shipped code; guard:parity after install. **Evidence:** geotiff@3.0.5, d3-contour@4.0.2, simplify-js@1.2.4 exact pins, devDependencies, no install scripts | closed |
| T-08-13 | Tampering | eight codemodded files | medium | mitigate | Primitive-identical mapping table; compiled-declaration comparison (Task 1); CI Visual Regression with check-snapshot-commit --none (Task 3). **Evidence:** 58 utilities compile to identical declarations; CI run 40107844864 Visual Regression 0 changed | closed |
| T-08-14 | Tampering | palette guard scope | low | mitigate | Widened v1names rule with three selftest fixtures proving fail on a live file and pass on the two exemptions (Task 2). **Evidence:** widened v1names rule; fixtures bad-v1names-live / v1names-dead-exempt / v1names-alias-defs | closed |
| T-08-SC (08-05) | Tampering | npm installs | high | mitigate | No package installs in this plan. **Evidence:** package.json dependency diff over the phase adds nothing in this plan | closed |
| T-08-15 | Tampering | immutable /terrain/* | medium | mitigate | Immutable only for /terrain/, whose files are all name.<10 hex>.ext (08-04 tests, 08-09 guard); SW cache names rotate per build. **Evidence:** next.config.ts immutable header scoped to /terrain/ hashed names; prod e2e asserts Cache-Control | closed |
| T-08-16 | Information disclosure / XSS | /terrain/*.svg without CSP after the matcher change | medium | mitigate | SVGs come only from contourSvg; terrain tests and the 08-09 guard reject script, href and event-handler attributes; pages keep the nonce CSP (curl check in Task 1). **Evidence:** proxy matcher excludes /terrain; SVGs only from contourSvg; guard:images svg-content rule | closed |
| T-08-17 | Tampering | inject-build-hash writing precache URLs into SW code | low | mitigate | Injector accepts only a JSON array of strings starting with /terrain/, serialised with JSON.stringify; `node --check` on the injected SW (Task 1 verify). **Evidence:** inject-build-hash accepts only content-hashed /terrain/ URLs, JSON.stringify + function replacer; `node --check` after inject | closed |
| T-08-SC (08-06) | Tampering | npm installs | high | mitigate | No package installs in this plan. **Evidence:** package.json dependency diff over the phase adds nothing in this plan | closed |
| T-08-18 | Information disclosure | public/images/photos/* metadata | high | mitigate | Default sharp output only (no metadata-retaining call; grep criterion in Task 1); --check rejects exif/xmp/iptc/icc/orientation on every derivative; 08-09 guard repeats it for every tracked image. **Evidence:** 0 metadata-retaining sharp calls in scripts/photos; sharp scan: 0/36 derivatives with EXIF/ICC/XMP/IPTC | closed |
| T-08-19 | Information disclosure | full-resolution copies served from public/ | high | mitigate | git rm of all eight plus optimization-manifest.json; no derivative above 2560 px (schema + test); 08-09 e2e asserts 404 for the old URLs. **Evidence:** 8 full-res copies + optimization-manifest git-rm'd (e5422b5); legacy optimized max edge 2400 px; e2e 404 (CI) + preview 404 (Tim) | closed |
| T-08-20 | Information disclosure | full-res and GPS originals in git history and existing caches | medium | accept | D-12: Tim accepts; recorded in PROJECT.md (Task 2) and the phase SUMMARY; purge remains possible later. **Evidence:** Accepted (D-12), see Accepted Risks Log | closed |
| T-08-21 | Tampering | derivatives built from an older original | low | mitigate | sourceSha256 in the manifest compared with the sidecar in --check (CI). **Evidence:** sourceSha256 per derivative in image-manifest.ts; `photos:derive -- --check` exit 0 | closed |
| T-08-SC (08-07) | Tampering | npm installs | high | mitigate | No package installs in this plan. **Evidence:** package.json dependency diff over the phase adds nothing in this plan | closed |
| T-08-22 | Information disclosure | data/generated/photos.ts coordinates | high | mitigate | Positions only from the 4-dp sidecar or 4-dp corrections; Coord4 in PhotoFacts; raw-text 5-decimal regex in Task 1 verify and Task 2 tests. **Evidence:** no ≥5-dp coordinate in data/generated/photos.ts (only exposureTimeS 0.00625); Coord4 in PhotoFacts | closed |
| T-08-23 | Spoofing | film-scan position presented as exact | medium | mitigate | Position refines require approximate + reason + radiusM for hand-placed positions; tests (Task 2); footer renders the dashed tick from the flag (08-12). **Evidence:** schema refine requires approximate+reason+radiusM; footer renders the dashed tick (CI baselines 88191d0) | closed |
| T-08-24 | Tampering | stale photo facts | medium | mitigate | photos:build --check byte-compares in lint; source PNG sha256 verified against source.json. **Evidence:** `photos:build -- --check` in lint (data:check), exit 0 | closed |
| T-08-SC (08-08) | Tampering | npm installs | high | mitigate | No package installs in this plan. **Evidence:** package.json dependency diff over the phase adds nothing in this plan | closed |
| T-08-25 | Information disclosure | any tracked image with EXIF/XMP/IPTC (including GPS) | high | mitigate | metadata rule over every git-tracked image in lint; fixtures for EXIF-GPS and XMP-only (Tasks 1, 2). **Evidence:** guard:images metadata rule over git ls-files; fixtures bad-exif-gps, bad-xmp-only; `served-images: OK` | closed |
| T-08-26 | Information disclosure | an original committed with git add -f | high | mitigate | Scope is git ls-files across the whole repo, not only public/; originals carry EXIF and fail the metadata rule. **Evidence:** guard scope is git ls-files repo-wide; mutation TAP proves each fixture fails | closed |
| T-08-27 | Information disclosure | full-res reachable on the live site | high | mitigate | oversize rule; e2e 404 on the production build; preview curl (Task 3); cached copies accepted under D-12. **Evidence:** oversize rule; data-privacy e2e 404 on prod build (CI 40114812277); preview 404 confirmed by Tim | closed |
| T-08-28 | Tampering / XSS | SVG under public/ | medium | mitigate | svg-content rule rejects script, on-handlers, href and foreignObject (fixture bad-svg-script). **Evidence:** svg-content rule; fixture bad-svg-script | closed |
| T-08-29 | Information disclosure | a future script re-adding metadata | medium | mitigate | metadata-call rule over scripts/photos and scripts/terrain (fixture bad-metadata-call). **Evidence:** metadata-call rule over scripts/photos + scripts/terrain; fixture bad-metadata-call | closed |
| T-08-SC (08-09) | Tampering | npm installs | high | mitigate | No package installs in this plan. **Evidence:** package.json dependency diff over the phase adds nothing in this plan | closed |
| T-08-30 | Repudiation | annotation facts in data/photos/editorial.ts | low | mitigate | Fact schema requires a source per claim; SUMMARY lists the URLs; Tim reviews at Task 3. **Evidence:** editorial schema requires a source per fact; URLs listed in 08-10-SUMMARY; Tim approved ("approve") | closed |
| T-08-31 | Tampering | legacy bridge output feeding v1 components | medium | mitigate | Bridge tests pin order, the Home LCP src, tags and elevations; GalleryGrid and photos e2e unchanged and green. **Evidence:** bridge tests pin order, LCP src, tags, elevations; photos e2e green | closed |
| T-08-SC (08-10) | Tampering | npm installs | high | mitigate | No package installs in this plan. **Evidence:** package.json dependency diff over the phase adds nothing in this plan | closed |
| T-08-32 | Tampering | e2e/visual/routes.spec.ts-snapshots/ | medium | mitigate | Only changed PNGs copied after blob comparison; check-snapshot-commit --some --allow photos (never --allow-all); Tim reviews and commits. **Evidence:** check-snapshot-commit --some --allow photos OK (3 changed); Tim committed c0f2418 | closed |
| T-08-33 | Repudiation | approved copy and slugs | low | mitigate | Tim's literal reply quoted in 08-10-SUMMARY.md is the precondition; edits applied verbatim and listed. **Evidence:** Tim's literal "approve" quoted in 08-10-SUMMARY | closed |
| T-08-SC (08-11) | Tampering | npm installs | high | mitigate | No package installs in this plan. **Evidence:** package.json dependency diff over the phase adds nothing in this plan | closed |
| T-08-34 | Repudiation | site.attribution.terrain | medium | mitigate | Required string in the Site type (tsc fails without it); copied from the live page in Tim's chosen form with fetch date recorded; e2e asserts it on every route. **Evidence:** attribution required in Site type (no optional form); byte-identical to the live page (fetched 2026-10-24); e2e asserts it | closed |
| T-08-35 | Information disclosure | waypoint ticks | low | accept | Ticks use 4-dp-derived UV only along the easting, aria-hidden and decorative; no more precise than DATA-06 allows. **Evidence:** Accepted, see Accepted Risks Log | closed |
| T-08-36 | Tampering | inline mask style in SiteFooter/ContourField | low | mitigate | URL comes from generated terrain.ts (hashed same-origin path); CSP style-src already allows inline styles and img-src 'self' covers the mask. **Evidence:** mask URL read from generated terrain.ts (hashed same-origin path) | closed |
| T-08-SC (08-12) | Tampering | npm installs | high | mitigate | No package installs in this plan. **Evidence:** package.json dependency diff over the phase adds nothing in this plan | closed |
| T-08-37 | Tampering | e2e/visual/routes.spec.ts-snapshots/ | medium | mitigate | Blob-compare and copy only changed PNGs; per-slug --allow list (never --allow-all); Tim reviews and commits; unexpected slugs reported, not committed. **Evidence:** check-snapshot-commit with 9 per-slug --allow OK (27 changed); Tim committed 88191d0; 0 unexpected | closed |
| T-08-38 | Tampering | scripts/guards/test-count.baseline.json | medium | mitigate | --update refuses a lower total; verify asserts the total rose above 206. **Evidence:** test-count --update refuses a lower total; ratchet 206 → 533 (74653dd) | closed |
| T-08-SC (08-13) | Tampering | npm installs | high | mitigate | No package installs in this plan. **Evidence:** package.json dependency diff over the phase adds nothing in this plan | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-08-01 | T-08-06 | GPS-bearing originals remain in public git history (287c2e9, 8fa0991). Rewriting history on a public repo needs a force-push and cannot recall existing clones or forks; HEAD and the site no longer carry them. Purge remains possible later (D-12). | Tim (D-12, PROJECT.md Key Decisions) | 2026-10-24 |
| AR-08-02 | T-08-20 | Full-res copies and GPS originals remain in git history and in third-party/browser caches of the old URLs; the old URLs now 404 on the site and the preview. Same rationale as AR-08-01 (D-12). | Tim (D-12) | 2026-10-24 |
| AR-08-03 | T-08-35 | Footer waypoint ticks place photos along the easting from 4-dp-derived UV; aria-hidden and decorative, no more precise than DATA-06 already publishes. | Plan 08-12 threat model (accept), bounded by DATA-06 | 2026-10-24 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-24 | 51 | 51 | 0 | secure-phase (orchestrator, L1 short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-24

## Security Audit 2026-10-24

| Metric | Count |
|---|---|
| Threats found | 51 |
| Closed | 51 |
| Open | 0 |
