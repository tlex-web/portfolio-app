---
phase: "09"
slug: "home-ascent"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-25"
---

# Phase 09 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> The register was authored at plan time (all 14 plans carry a `<threat_model>`). secure-phase verified it at ASVS L1 (grep and test depth) on 2026-10-25 at HEAD 0190d0f, with block_on: high. No SUMMARY carries a `## Threat Flags` section.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| committed data/copy -> server HTML | Typed site, photo, project and copy data becomes page text | Copy, numbers, hrefs |
| generated photo data -> displayed numbers | Altitudes, dates and place lines are shown as facts | Derived metres, dates |
| generated data -> plaque facts | Numbers presented as measured facts at the summit | Summit stats |
| generated photo positions -> on-screen pins | Positions shown as places on the terrain | 4-decimal UVs (DATA-06) |
| image manifest -> served card photos | Only pipeline derivatives (metadata-free, hashed) may reach Home | Image URLs (EXIF/GPS-free) |
| app/globals.css -> generated shader constants | A stale or hand-edited constant would ship a colour the CSS does not use | Colour tokens |
| Server Component graph -> every visitor's first load | Anything a Server Component imports ships to every visitor, Save-Data and low-memory devices included | Code |
| device capability signals -> mode decision | Browser APIs decide what code and assets load | Capability signals (client-only) |
| lazy chunk -> page | Code loaded after hydration under the nonce CSP | three.js / R3F chunk |
| /terrain/heightmap-*.png -> main-thread decoder -> GPU | A binary asset is parsed in the page and becomes GPU geometry | 16-bit heightmap |
| page -> GPU | Rendering load on devices of unknown capability | Draw calls |
| visitor input (wheel, touch, keyboard) -> page | Native scroll must never be intercepted or made expensive | Input events |
| page markup -> assistive tech | A second "skip" link must not shadow the global one | Landmarks, skip links |
| npm registry -> package-lock.json | A new runtime dependency enters the bundle | fast-png 8.0.0, iobuffer 6.0.1 |
| guard baselines -> CI | The compiler-exception list, palette ratchet and test-count ratchet decide what lint and CI accept | Ratchet files |
| Tim's replies -> committed copy and constants | Human decisions become shipped content | Copy, tuning constants |
| local repo -> GitHub (ci/09-13, ci/09-14 push, workflow dispatch) | Remote actions under Tim's credentials | Commits, workflow inputs |
| CI container measurements / artifact -> HOME-08 verdict | Downloaded numbers decide a requirement | LCP, JS bytes |
| CI artifact -> committed baselines | Baselines define correctness for every later visual run | Home PNGs |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-09-01 | Tampering | HeroBlock, TrailSigns, data/home.ts | low | mitigate | No dangerouslySetInnerHTML in app/components/lib/data; copy rendered as React text (HeroBlock.tsx:54-57, AboutSection.tsx:27-37); TrailSigns hrefs checked against site.nav (TrailSigns.tsx:11-15) | closed |
| T-09-02 | Tampering | scripts/guards/palette-ratchet.json | medium | mitigate | check-palette.mjs:202-210 fails below the ratchet and `--update` refuses on any rise; runs in lint/CI; the phase diff only removes two entries | closed |
| T-09-03 | Information disclosure | WaypointCard picture | medium | mitigate | URLs only from imageManifest[id].variants (waypoints.ts:99,106,133-137); unit "never uses a -large or -thumb file", e2e home-ascent.spec.ts:89-90; guard:images in lint | closed |
| T-09-04 | Repudiation | card kicker and place line | low | mitigate | No altitude literal in components/home, lib/ascent or lib/home-format; ascent-waypoints.test.ts:27-31,55 and waypoints.test.tsx:28-31 compare against data | closed |
| T-09-05 | Tampering | data/generated/tokens.ts | low | mitigate | build-tokens.mjs writes one fixed path; byte compare at :205-207 in data:check (lint); .gitattributes:31 eol=lf; `tokens: OK` | closed |
| T-09-06 | Repudiation | SummitPlaque, lib/ascent/summit.ts | low | mitigate | summit.ts:40-52 derives all values; ascent-summit.test.ts:41-54 recomputes, :56-61 rejects legacy claims; git grep gate clean | closed |
| T-09-07 | Spoofing | skip links (shell vs Home) | low | mitigate | shell.spec.ts:78-83 and :174-176 assert exactly one "Skip to main content" and "Skip to the summit" only on / | closed |
| T-09-08 | Denial of service | AscentController scroll path | low | mitigate | No wheel/touch listeners; one useScroll (AscentController.tsx:173); per-frame work writes the spring and DOM attributes only; e2e home-ascent.spec.ts:430-466 asserts no preventDefault, no snap | closed |
| T-09-09 | Information disclosure | lib/useAscentMode.ts probes | low | mitigate | One probe, released with loseContext (useAscentMode.ts:56-68); no renderer-string read, beacon, console, storage or cookie; only a local performance mark | closed |
| T-09-10 | Denial of service | weak devices and Save-Data visitors | medium | mitigate | capability.ts:36-42 rejects Save-Data, memory < 4, no WebGL2, texture < 2048 before the chunk; e2e home-modes.spec.ts:194-214 proves no heightmap and no three.js request | closed |
| T-09-11 | Elevation of privilege | lazy chunk under CSP | medium | mitigate | No proxy.ts or next.config.ts change in range; CSP unchanged (nonce + strict-dynamic); no Worker/Blob; e2e "no worker and no CSP violation"; 09-13 filter is anchored to the two off-Vercel analytics MIME refusals only | closed |
| T-09-12 | Tampering | TerrainMesh heightmap decode | medium | mitigate | Content-hashed same-origin URL; validateHeightmap (heightmap.ts:32-45) before buildGeometry; catch -> downgradeAscent('load-error') | closed |
| T-09-13 | Denial of service | main-thread decode and mesh build | low | mitigate | Fixed 512/256 grids; yieldToMain between fetch, decode and build; AbortController cancelled on unmount (TerrainMesh.tsx:161-205) | closed |
| T-09-14 | Repudiation | e2e/perf/home-baseline.spec.ts, routes.spec.ts | low | mitigate | Phase 7 baseline JSON untouched; profile unchanged; mode per sample; visual shots force the static path; container pinned v1.64.0-noble; HOME-08 gate asserted since 218840e | closed |
| T-09-15 | Information disclosure | PinLayer3D, poster pins | low | accept | Accepted by Tim (see the Accepted Risks Log): pins reuse already-published 4-decimal UVs; the 3D projection adds no precision | closed |
| T-09-16 | Denial of service | CameraRig rendering | medium | mitigate | DPR step-down then static (CameraRig.tsx:353-361); frameloop demand; IntersectionObserver + visibilitychange pause; fixed meshes; GPU disposal; draw-counter e2e plus the no-flag "slow device declines" e2e. The measure-only test hook (`window.__ascentBudgetMeasureOnly === true`, read only on a decline) is set only by Playwright init scripts; no URL, storage or product code sets it | closed |
| T-09-17 | Denial of service | ContextLossGuard | low | mitigate | Context loss -> sticky static, no restore/retry (ContextLossGuard.tsx:29-40, useAscentMode.ts:101-103); e2e context loss and remount | closed |
| T-09-18 | Repudiation | data/home.ts approval state, route constants | low | mitigate | 'approved' set only in ae50279, whose body quotes Tim's "approve"; fc24d57 and ee39140 quote his framing replies; all in 09-12-SUMMARY | closed |
| T-09-19 | Spoofing | ci/09-13 / ci/09-14 push and dispatch | medium | mitigate | Tim's "approve" quoted in 09-13-SUMMARY; reflog shows plain fast-forward pushes only; headBranch/headSha confirmed for all six runs | closed |
| T-09-20 | Repudiation | HOME-08 numbers | low | mitigate | From run 40189690406 (v1.64.0-noble container) with URLs recorded; baseline JSON not edited; E2E failures reported, not relabelled | closed |
| T-09-21 | Tampering | e2e/visual/routes.spec.ts-snapshots/home/ | medium | mitigate | Tim's 284f433 touches only home/ (3 M, 9 A, 9 D); check-snapshot-commit --allow home --allow-deletions OK; update_mode=changed; run 40193992531 green on both attempts | closed |
| T-09-22 | Tampering | scripts/guards/test-count.baseline.json | medium | mitigate | test-count.mjs:168-185 refuses a lower total; only change 02cfdd7 raises 533 -> 832 | closed |
| T-09-23 | Tampering | eslint.config.mjs LEGACY_COMPILER_FILES, palette-ratchet.json | medium | mitigate | Phase diff removes 3 compiler-exception entries and adds none; ratchet per T-09-02 | closed |
| T-09-24 | Denial of service | Server Component import graph of / | medium | mitigate | boundary.test.ts:104-148 rules (a)-(e) incl. import()/require(); passes at HEAD | closed |
| T-09-SC | Tampering | npm installs | high | mitigate | Only dependency change: `"fast-png": "8.0.0"` exact (b101a0c); lockfile adds fast-png 8.0.0 + iobuffer 6.0.1 with sha512 integrity; no install scripts; legitimacy audit in 09-RESEARCH.md:155-165; guard:parity + CI `npm ci` | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-09-01 | T-09-15 | Pins (3D and poster) use only the UVs the footer and /photos data already publish: coordinates rounded to 4 decimals (about 10 m, DATA-06), and the r004-011 film scan is hand-placed and marked approx. The 3D projection adds no precision. | Tim ("Accept (Recommended)", secure-phase 2026-10-25) | 2026-10-25 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-25 | 25 | 25 | 0 | gsd-security-auditor (ASVS L1) + orchestrator; T-09-15 closed by Tim's acceptance |

Informational, no action this phase: the fflate 0.8.2 `unzipSync` ZIP64 advisory (moderate) is logged in deferred-items.md (fast-png does not use that path; the CI Security Audit job passed). The "LEGACY_COMPILER_FILES never grows" rule is enforced only by a comment. Optional hardening: compile the measure-only test hook out of production builds behind a dedicated build flag (not NODE_ENV, since CI's e2e and perf runs use a production `next start`).

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-25
