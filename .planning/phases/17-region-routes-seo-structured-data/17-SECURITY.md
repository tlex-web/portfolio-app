---
phase: "17"
slug: "region-routes-seo-structured-data"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
created: "2026-11-24"
---

# Phase 17 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

The register was written at plan time. All 16 PLAN files have a `<threat_model>` block, with 50 rows in total:
- **34 distinct threats:** T-17-01 to T-17-34. T-17-02 (17-01, the proxy-only id list) and T-17-34 (17-16, the client-chunk guard) are the two halves of one client-chunk threat. The guard half was renumbered from a duplicate T-17-02 before execution (`0769c9f`).
- **One T-17-SC supply-chain row per plan.** It is `mitigate` (high) in 17-03, the schema-dts install, and `accept` (low) in the other 15 plans.

That makes 35 unique IDs: 4 high (T-17-SC at 17-03, T-17-06, T-17-15, T-17-25), 11 medium and 20 low.

**How the audit ran:**
- **Run by:** `gsd-security-auditor` at ASVS L1 depth on HEAD `ef2a76a` (2026-11-24). It checked that each planned mitigation exists and did not look for new threats.
- **Evidence:** each control is backed by a file:line, a test, a read-only command the audit re-ran, or the SUMMARY record of a one-time process mitigation (Tim's checkpoint replies, the push scope, booleans-only coordinate scans).
- **Re-run at HEAD:**
  - Jest on 10 suites (proxy, client-graph, regions, json-ld, photo-routes, photos-stepping, saved-pages, lib/og routes, data photos, data overview): 559/559.
  - `npm run guard:ci` OK, `npm run guard:parity` OK, and the 17-02 e2e-matrix YAML check OK.
  - `check-snapshot-commit --none` on all 95 commits in `285b6d5..HEAD`: 95 OK. `git diff 285b6d5 HEAD` has no `.png` path.
  - `npm ls`: schema-dts@2.1.0 → schema-dts-lib@1.1.0.
  - `git ls-remote origin`: the only Phase 17 ref is `ci/17-15` = `038a4cb`; no `gsd/phase-17-*` ref; no workflow_dispatch run on a phase SHA.
  - Client chunks of the current build: no `Steinernen` and no new photo slug; the server chunks do hold `Steinernen`, so the check is not vacuous.
- **Recorded evidence relied on:** the 17-15 phase-close gate (Jest 2365/2365, production Playwright 487 passed in Chromium and Firefox, v2.0 identity at the tip `differing=0`), CI run 45306356650 on `ci/17-15` (success, Visual Regression PASS), the orchestrator's post-merge gate on `d4f608e`, and the Nyquist og:image pins (`d7ff1bc`).

Seven SUMMARYs (17-05, 06, 07, 10, 12, 13, 15) have a `## Threat Flags` section. Each reads "None" and maps its new surface to registered IDs, so no threat was raised outside the register. This file holds no photo coordinate.

**Location-privacy note (D-25, booleans only, 2026-11-24):** a scan of the phase directory against the 11 generated positions found 8 coordinate-shaped strings, in `17-13-PLAN.md` (line 114) and `17-RESEARCH.md` (lines 517 and 519). All 8 belong to 4 dp photos and are at 2, 3 or 4 dp, so none is finer than the precision the public page prints (`finerThanPage=0`). They are format examples from planning (commit `b6dee39` and earlier), and they are on `origin/ci/17-15`. They expose nothing beyond the live pages, but they sit against D-25's "no photo coordinates in committed planning files". This is recorded for Tim's decision, not as a register threat (T-17-32 covers 17-15's SUMMARY only, which scanned clean).

---

## Trust Boundaries

| Boundary | Description | Plans |
|----------|-------------|-------|
| visitor URL → proxy.ts | the region path segment is untrusted input, matched before render | 17-01, 17-05 |
| server modules → client chunks | registry data must not ship to the browser | 17-01, 17-16 |
| request headers → render | x-edge-section names the 404's section | 17-01 |
| workflow file → GitHub Actions | the job graph decides what CI OK aggregates | 17-02 |
| workflow expressions → shell | an expression inside a run block is substituted before the shell runs | 17-02 |
| npm registry → package-lock.json | schema-dts and schema-dts-lib enter the lockfile CI installs | 17-03 |
| data and editorial text → HTML script element | JSON-LD text is written inside a script element | 17-03 |
| JSON-LD → public crawlers | everything in the block is published | 17-03 |
| EXIF sidecar → generated photo facts | camera-recorded offsets are checked against a derived zone | 17-04 |
| published photo set → public URLs | every published photo becomes indexable | 17-05 |
| server page → client component props | only serialisable, server-built values cross | 17-06 |
| registry data → file reads in the card route | the cover id and the plate id choose which files are read from public/ | 17-07 |
| card route → social platforms | the card image is published and cached by third parties | 17-07 |
| remote DEM tiles → committed terrain sources | a fetch writes heights the build trusts by sha256 | 17-08 |
| git checkout → sha256-verified terrain sources | EOL conversion would change bytes the build verifies | 17-09 |
| sitemap → search engines | every listed URL is offered for indexing | 17-10 |
| Cache Storage keys → rendered list | cached request URLs are device state, never rendered as text | 17-11 |
| location.pathname → client parser | the URL bar is visitor-controlled input to the lightbox | 17-12 |
| generated photo facts → public JSON-LD | location and time facts leave the page as machine-readable data | 17-13 |
| editorial text → script element | titles and alt text are written inside a script element | 17-13 |
| page data → public JSON-LD | rights and project facts leave the page as machine-readable claims | 17-14 |
| local branch → GitHub | a push publishes the phase commits on a ci/ branch | 17-15 |
| planning files → public repo | anything committed under .planning/ is public | 17-15 |
| registry ids → public URLs | a region id is a URL segment beside photo slugs and static segments | 17-16 |

---

## Threat Register

| Threat ID | Plan | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|------|----------|-----------|----------|-------------|------------|--------|
| T-17-01 | 17-01 | Information disclosure | proxy.ts region miss (reflected path echo, T-12-03) | medium | mitigate | REGION_PATH misses fetch the neutral `/photos/_` render; exact, case-sensitive Set lookup; proxy unit tests and not-found e2e rows assert no token and no `"photos","regions"` segment in the body | closed |
| T-17-02 | 17-01 | Information disclosure | regions.json in client chunks | low | mitigate | id list in proxy-only `lib/photos/region-ids.ts` and no registry import in `lib/photos/routes.ts` (Task 1 gate, this plan); the guard half (`regions.json` in SERVER_ONLY_MODULES and a build check that no chunk contains "Steinernen") is T-17-34 in 17-16 | closed |
| T-17-03 | 17-01 | Tampering | spoofed x-edge-section on a region miss | low | mitigate | unchanged proxy delete of the visitor's header (T-12-02); a region miss sets the header to 'photos' itself | closed |
| T-17-04 | 17-02 | Elevation of privilege | CI OK aggregate over a matrix job | medium | mitigate | Job id unchanged in ci-ok.needs (rule 3) and in ci-ok.jq's IN(...) list (rule 10); needs.e2e-tests.result fails when any leg fails; guard:ci and guard:selftest green | closed |
| T-17-05 | 17-02 | Tampering | matrix value in the run block | low | mitigate | The project name reaches the shell through env PW_PROJECT only; the YAML check asserts no `${{` in the job's run blocks | closed |
| T-17-06 | 17-03 | Tampering | `</script>` breakout from JSON-LD text (XSS) | high | mitigate | One serializer, jsonLdHtml, escapes every '<'; the test round-trips a `</script><script>` fixture with no raw '<' | closed |
| T-17-07 | 17-03 | Information disclosure | Person over-disclosure | medium | mitigate | Person holds name, role, url and the two profile links only; the test fails on email, address, homeLocation or site.location text | closed |
| T-17-08 | 17-03 | Denial of service | a CSP that blocks the data block | low | mitigate | No nonce, native data block (not executed, not checked against script-src); the audit gate's CSP listener runs on every audited route in three engines in CI | closed |
| T-17-09 | 17-04 | Tampering | a wrong zone or a drifted Swiss output in generated data | medium | mitigate | Closed zone map with an IANA check; schema refine zone == country zone; the diff check allows only four timeZone lines; data:check; the unchanged CH selftest case and a new IT case | closed |
| T-17-10 | 17-04 | Repudiation | photos:build hiding the cause of a failure | low | mitigate | The IN-04 message carries the import error; a selftest case pins it | closed |
| T-17-11 | 17-05 | Information disclosure | a slug admitted without a static page (empty error shell with the path in flight data, 12-RESEARCH Pitfall 1) | medium | mitigate | photo-routes.test asserts photoRouteSlugs equals publishedSlugs, the static params; the neutral 404 path is unchanged | closed |
| T-17-12 | 17-05 | Tampering | a changed v2.0 URL, og:image hash or card (broken shared links) | medium | mitigate | No edit to the per-photo card file (git diff against 285b6d5); the two-build identity comparison of status, head, og:image URL, PNG hash, main (ld+json removed on both captures) and stripped HTML, rerun by 17-06, 17-07, 17-12, 17-13 and 17-15; a 36-mutant control run shows the comparison fails on any single changed field, and 17-15 audits every recorded result line | closed |
| T-17-13 | 17-05 | Information disclosure | publishing photos not meant to be public | low | accept | Every published photo was approved by Tim in 16-08 and 16-17 with its precision and copy; D-07 publishes exactly that set | closed |
| T-17-14 | 17-06 | Tampering | the back link target | low | mitigate | href built on the server from the registry with regionHref, never from the URL or query; PhotoViewer imports no region data (grep gate, client-graph test) | closed |
| T-17-15 | 17-07 | Information disclosure | an original (EXIF-bearing) file in a card | high | mitigate | ogPhotoImage reads only the manifest's 1200 px JPEG derivative (rotated, EXIF-free); routes.test asserts the only photo file read is the cover's jpeg.src | closed |
| T-17-16 | 17-07 | Tampering | a cover or plate id steering a file read | low | mitigate | Ids come from the zod-validated registry (slug regexes, no path separators), never from the request; an unknown region gets [] and notFound(); cover membership is tested and asserted at load | closed |
| T-17-17 | 17-08 | Tampering | a corrupt or nodata tile accepted as terrain | low | mitigate | One explicit BEV value rule; a GLO-90 floor that fails voids instead of turning them into sea | closed |
| T-17-18 | 17-08 | Denial of service | a refactor that breaks the manual fetchers' refusals | low | mitigate | Every existing refusal case passes with unchanged text; new fn cases cover the shared modules | closed |
| T-17-19 | 17-09 | Tampering | EOL normalisation of 16-bit plate and overview sources under core.autocrlf=true | low | mitigate | Explicit binary and eol=lf attributes; renormalize proves no content change | closed |
| T-17-20 | 17-09 | Repudiation | an overview summit height with no attribution | low | mitigate | source and borders copied into the generated record; overview.test pins them | closed |
| T-17-21 | 17-10 | Information disclosure | a sitemap URL that is not a canonical page (an unknown or noindex path offered for indexing) | low | mitigate | Every URL comes from regionHref or photoHref over the registry and the published set; the e2e contract pins the exact list and the canonical-equals-sitemap test runs over all of it; /offline stays out | closed |
| T-17-22 | 17-11 | Information disclosure | a cached URL shown as text (T-12-30) | low | mitigate | Rows come only from the data catalog matched by exact path; the e2e text check rejects raw paths; unknown region paths drop | closed |
| T-17-23 | 17-12 | Denial of service | an unguarded decode throwing on a malformed escape in the lightbox | low | mitigate | One parser with a guarded decode; a '/photos/%E0' row pins null | closed |
| T-17-24 | 17-12 | Tampering | a region path read as a photo slug | low | mitigate | RESERVED_PHOTO_SEGMENTS in slugFromPath; rows for /photos/regions and /photos/regions/<id>; one-definition source scan | closed |
| T-17-25 | 17-13 | Information disclosure | coordinates finer than the page (location over-disclosure, D-19) | high | mitigate | roundedCoordinate at the position's own precision, strings keep the printed digits; a test compares every block's digits with the strip's Position text and its decimal count with the precision | closed |
| T-17-26 | 17-13 | Information disclosure | GPS altitude or capture seconds in JSON-LD | medium | mitigate | No elevation key (keysDeep test); dateCreated at minute precision or the year | closed |
| T-17-27 | 17-13 | Tampering | editorial text breaking out of the script element | medium | mitigate | jsonLdHtml escapes every '<' (17-03 test); every photo block round-trips through it | closed |
| T-17-28 | 17-14 | Repudiation | a copyrightNotice that disagrees with the printed rights text | low | mitigate | Region notices from regionRights (the printed paragraph); the WebSite notice and option (a) case-study notices from siteRights (the footer wording), option (b) from Tim's typed year; e2e equality checks in the browser | closed |
| T-17-29 | 17-14 | Information disclosure | a private repository named in coin-flip's block | medium | mitigate | coin-flip renders as SoftwareApplication with no codeRepository; a unit row asserts the key is absent | closed |
| T-17-30 | 17-15 | Elevation of privilege | git push scope | medium | mitigate | Plain push of a new ci/17-15 only (precondition: the remote branch does not exist); fast-forward fixes only; no force, no phase branch, no main, no workflow dispatch (D-27) | closed |
| T-17-31 | 17-15 | Tampering | visual baselines | medium | mitigate | No PNG staged or committed; check-snapshot-commit --none on every phase commit; any visual diff stops the plan for Tim | closed |
| T-17-32 | 17-15 | Information disclosure | photo coordinates in a SUMMARY | low | mitigate | The SUMMARY records hashes, statuses, counts and durations only; no coordinate is printed or copied | closed |
| T-17-33 | 17-16 | Tampering | a region id equal to a photo slug or a static segment (a public URL answering the wrong page) | low | mitigate | the D-03 disjointness test over region ids, every editorial slug and a file-system-derived reserved set, with a self-test proving it can fail | closed |
| T-17-34 | 17-16 | Information disclosure | regions.json in client chunks, the guard half (paired with T-17-02, where 17-01 holds the proxy-only id list) | low | mitigate | `regions.json` in SERVER_ONLY_MODULES (client-graph walk from every 'use client' file); a build check fails on "Steinernen" in any chunk | closed |
| T-17-SC | 17-03 | Tampering | npm install of schema-dts and schema-dts-lib | high | mitigate | Package legitimacy gate: blocking-human checkpoint before install; exact pin; bundled npm; whole-entry lockfile check bounded to the two packages and root devDependencies; guard:parity | closed |
| T-17-SC | the other 15 plans | Tampering | npm/pip/cargo installs | low | accept | No package is installed in the plan (17-05: the base worktree's `npm ci` installs the committed lockfile with the bundled npm) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

### Verification evidence (high severity and process controls)

- **T-17-SC (17-03, high):** commit `44f63c4` pins `"schema-dts": "2.1.0"` exactly as a devDependency; the lockfile gains only the root devDependency line and two `dev: true` entries with no install script; Tim's literal reply "verified (Recommended)" is recorded in 17-03-SUMMARY before the install; bundled npm 11.20.0; `guard:parity` OK; `lib/json-ld.ts` imports schema-dts with `import type` only, pinned by `json-ld.test.ts`.
- **T-17-06 (high):** `jsonLdHtml` in `lib/json-ld.ts` escapes every `<`, and all four emission sites use it (`app/(site)/layout.tsx`, `photos/[slug]/page.tsx`, `photos/regions/[region]/page.tsx`, `projects/[slug]/page.tsx`); no other `application/ld+json` or `dangerouslySetInnerHTML` exists in `app/` or `components/`; `json-ld.test.ts` round-trips a `</script><script>` fixture with no raw `<`.
- **T-17-15 (high):** `ogPhotoImage` in `lib/og/template.tsx` reads only `public/<manifest jpeg.src>` (the 1200 px, EXIF-free derivative) for both the region and the photo card; `lib/og/__tests__/routes.test.ts` asserts the only photo file read matches `/images/photos/*.jpg`.
- **T-17-25 (high):** `roundedCoordinate` rounds at the position's own precision and keeps the printed digits as strings; `json-ld.test.ts` compares every block's digits with the strip's Position text and its decimal count with the precision, and rejects any stored coordinate finer than its precision; the region gallery and project blocks carry no geo.
- **T-17-30 (push scope):** see the `git ls-remote` result above; 17-15-SUMMARY records the plain push to a new branch, no force, no dispatch, no PNG.
- **T-17-31 (pixels):** 95/95 commits pass `check-snapshot-commit --none`; CI Visual Regression PASS.
- **T-17-32 (SUMMARY privacy):** a scripted scan of 17-15-SUMMARY for all 11 generated positions (2, 3, 4 dp and raw) found 0 matches.

Per-threat file:line evidence for the remaining rows is in the auditor's verdict (session record, 2026-11-24).

**Non-blocking observations from the audit:**
1. T-17-34's build half (the "Steinernen" chunk grep) and T-17-05's "no `${{` in run blocks" check are one-off checks, not wired into CI; the lasting guards are the SERVER_ONLY_MODULES client-graph walk and the literal matrix values.
2. T-17-12's two-build identity harness is scratchpad-only (Tim: "Keep scratchpad-only (Recommended)"); the committed guards are the og:image URL pins (`d7ff1bc`) and the unchanged per-photo card file.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-17-01 | T-17-SC (17-01, 02, 04, 06–16; 14 rows) | No package is installed in these plans. Verified: `44f63c4` (17-03) is the only commit in `285b6d5..HEAD` touching package.json or package-lock.json, and no other dependency manifest changed. | Planner (17 PLAN threat models), verified by gsd-security-auditor | 2026-11-24 |
| AR-17-02 | T-17-SC (17-05) | No package is added; the base-capture worktree's `npm ci` installs only the committed lockfile with the bundled npm. Verified by the same history check. | Planner (17-05 threat model), verified by gsd-security-auditor | 2026-11-24 |
| AR-17-03 | T-17-13 (17-05) | Publishing every photo exposes only photos Tim approved: the seven new photos with their precision and copy in 16-08 (five) and 16-17 (two Ortler), and the four v2.0 photos, public since v2.0. `data/photos/editorial.ts` is unchanged since `285b6d5` (11 slugs), and `publishedSlugs` has 11 entries. | Planner (17-05 threat model, D-07), verified by gsd-security-auditor | 2026-11-24 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-24 | 35 | 35 | 0 | gsd-security-auditor (ASVS L1), /gsd-secure-phase 17 |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-24
