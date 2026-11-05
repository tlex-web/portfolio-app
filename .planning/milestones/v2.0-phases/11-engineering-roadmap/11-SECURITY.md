---
phase: "11"
slug: "engineering-roadmap"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-11-02"
---

# Phase 11 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> The register was authored at plan time: all 19 plans carry a `<threat_model>` (gap plan 11-19 added T-11-42 and T-11-43 on 2026-11-02, both closed at L1). That gives 43 threats, T-11-01 to T-11-43, plus the shared supply-chain row T-11-SC (low, accept; `package-lock.json` is untouched in Phase 11). secure-phase verified it at ASVS L1 with block_on: high: gsd-security-auditor ran on 2026-11-02 at HEAD 6872c0a. Its one open finding, T-11-15 (medium: the captured-strings path check missed a driveless Windows home path such as `..\Users\tim`), was closed by Tim's choice "Fix both now (Recommended)" with commit e41cb46, which adds a `\Users\` alternative to the `ABSOLUTE` regex. The same commit adds the missing T-11-19 selftest fixtures (`bad-mp4-uuid`, `bad-mp4-xmp`), so the `uuid`, `XMP_` and XMP-marker rules of the served-asset guard are now proven to fail.
> Threat Flags: the 11-11 and 11-13 SUMMARYs each have a `## Threat Flags` section reading "None" (informational; they map to T-11-26, T-11-29 and T-11-30). No other SUMMARY has one.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| server data → client bundle | Island props ship to every visitor | DemoTerminal `name`/`commands`, RouteLogFilters filter and counts, RouteIndex `{id, label}`; trail profiles stay server-side |
| browser timers and observers → UI state | Timers, IntersectionObserver and page visibility drive playback and the current section | `setTimeout` ids, intersection entries, `document.hidden` |
| private coin-flip repo → public planning docs, data and site | Anything copied becomes public history | Only summarised D-23 facts; no source, paths, IDs or test evidence |
| scratchpad capture → packet → shipped HTML | CLI output becomes page text | box terminal and Safety strings (no paths or escapes) |
| upstream box repo → local build | Tim's public code compiled locally | box v2.0 source and its locked cargo dependencies |
| geo.admin.ch → committed source → generated module | Network data committed once, by hand | Trail polylines and the DEM, pinned by sha256 |
| URL query → route-log server render | Visitor-controlled strings | `?project`, `?status` (whitelisted to enums) |
| visitor click → `router.replace` | The island navigates the browser | Hrefs built only from enum values |
| project data → rendered and outbound links | Data URLs become public links | box GitHub and README links, route-log row ids; no coin-flip link |
| Tim's checkpoint answers → committed data | Only quoted, approved text ships | Copy, route-log rows and dates, Home About, clip description |
| device recording → repository and served file | Recordings carry time, location, device tags and audio | MP4 (stripped) and WebP poster; original gitignored |
| build script → ffmpeg process | Arguments cross into a child process | `execFileSync` argument arrays, sha256-pinned original |
| browser → service worker cache | Partial media responses must not be cached | Range, video and audio requests bypass the cache |
| design tokens → rendered colours | New paint must pass the contrast and palette guards | `--trail-*` background-only tokens |
| local repo → GitHub | Remote actions run with Tim's credentials | Fast-forward pushes to `ci/11-17` and visual-baselines dispatches |
| CI artifact → working tree | Downloaded PNGs enter the snapshot folder | Baseline PNGs (Tim commits them) |
| visual route table → CI baselines | The table decides which pages get baselines | `routes.spec.ts` slugs and snapshot folders |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-11-01 | Information disclosure | `components/projects/DemoTerminal.tsx` | low | mitigate | The client island imports only react, one Phosphor icon, the import-free `lib/demo-terminal` and `useReducedMotion` (DemoTerminal.tsx:3-17), so no server data module reaches the bundle | closed |
| T-11-02 | Denial of service | DemoTerminal timer loop | low | mitigate | One `setTimeout` at a time, cleared on every re-run and on unmount (DemoTerminal.tsx:156-160); DemoTerminal.test.tsx:301 and :328 assert the pending-timer count returns to 0 | closed |
| T-11-03 | Information disclosure | 11-CONTENT-PACKET coin-flip sections | high | mitigate | The packet carries a privacy note (11-CONTENT-PACKET.md:15) and holds only summarised D-23 facts; Tim answered "approve-all"; `git grep` finds no coin-flip source, paths or ids anywhere in the repository | closed |
| T-11-04 | Information disclosure | captured box output | medium | mitigate | A drive-letter, `\Users\`, `/Users/` and AppData scan of the packet and the SUMMARY gives 0 hits; the `dupes` capture was rejected because its output carried absolute paths | closed |
| T-11-05 | Tampering | box v2.0 build | low | accept | Built from Tim's public repo at tag v2.0 (61afb3d) with `--locked`, in the scratchpad only; his installed box is untouched (11-02-SUMMARY D-34 record). See Accepted Risks Log AR-11-01 | closed |
| T-11-06 | Denial of service | DemoTerminal release handler | low | mitigate | `onToggle` changes only the override, hover and focus-within state, so a release cannot start a second loop; DemoTerminal.test.tsx:275, :287 and :328 | closed |
| T-11-07 | Information disclosure | DemoTerminal imports | low | mitigate | The island takes only `{ name, commands }` as props (DemoTerminal.tsx:136-142) and has no `@/data` import | closed |
| T-11-08 | Tampering | `scripts/terrain/fetch-trails.mjs` | medium | mitigate | Only the package.json `trails:fetch` script runs it; `data:check`, lint and CI run `trails:build --check`, which never touches the network; the Nyquist test "offline guarantee (T-08-09)" in trail-profiles.test.ts pins this | closed |
| T-11-09 | Tampering | `trails.json` and the DEM | medium | mitigate | `build-trails.mjs` checks the DEM sha256 (:72-75) and each trail's `polylineSha256` (:90-94) and exits 1 on any mismatch (:179); `trails:build --check` OK | closed |
| T-11-10 | Tampering | route-log parsers, `routeLogHref` | medium | mitigate | `parseProject` and `parseStatus` accept only exact whitelist members (lib/route-log.ts:98-114), and `routeLogHref` rebuilds the query from those enums alone (:173-178); route-log.test.ts:81, :124, :147 | closed |
| T-11-11 | Information disclosure | RoutePanel links row | medium | mitigate | The projects page passes `privateRepo: true` for coin-flip (projects/page.tsx:26); RoutePanel renders "Source: private repository" as plain text with no link (RoutePanel.tsx:103-107); RoutePanel.test.tsx:88 | closed |
| T-11-12 | Tampering | external GitHub link | low | mitigate | The box GitHub link opens in the same tab with no `target` (RoutePanel.tsx:96-99), so no opener handle is exposed; RoutePanel.test.tsx:84 asserts there is no `target` | closed |
| T-11-13 | Information disclosure | coin-flip data entry | high | mitigate | projects.test.ts runs `PRIVATE_PATTERNS` (issue ids, constants, method calls, source paths) and the D-30 word list against every coin-flip string | closed |
| T-11-14 | Information disclosure | coin-flip repo link | medium | mitigate | The schema pins `repository: z.literal('private')` and allows no `links` key (schemas/project.ts:114); projects.test.ts:90-97 and case-study.spec.ts:174 assert no link to the private repo | closed |
| T-11-15 | Information disclosure | captured CLI strings | medium | mitigate | The shipped captures are byte-equal to the approved captures (10/10). The `ABSOLUTE` regex in projects.test.ts now also rejects a driveless `\Users\` segment, with five pinned reject samples (e41cb46). Closed by Tim's choice "Fix both now (Recommended)" | closed |
| T-11-16 | Repudiation | unapproved copy shipped | medium | mitigate | Every `data/projects.ts` string appears verbatim in the 11-02 approval docs; the declined Rendering group and Network tile are absent | closed |
| T-11-17 | Tampering | roadmap empty state and status line | medium | mitigate | The page shows only enum labels (roadmap/page.tsx:26-31) built from parsed values (:57); roadmap.spec.ts:185 asserts an unknown value is never echoed | closed |
| T-11-18 | Repudiation | `data/roadmap.ts` | medium | mitigate | Every roadmap string is verbatim in the 11-02 SUMMARY; roadmap.test.ts:143-165 pins the D-20 survey window | closed |
| T-11-19 | Information disclosure | served MP4 and poster | high | mitigate | `build-clip.mjs` strips audio, metadata, chapters and SEI and writes bit-exact output (:243-249). The guard's box walker forbids `uuid`, `XMP_`, `©xyz` and `loci` (mp4-boxes.mjs:17, `checkMp4` :79-104) and scans for XMP markers. The selftest now proves each rule with the `bad-mp4-uuid` and `bad-mp4-xmp` fixtures (e41cb46, 85/85); `guard:images` OK | closed |
| T-11-20 | Information disclosure | raw recording in git | high | mitigate | `.gitignore:60` lists `assets/clips-original/`; `git check-ignore` passes; no `clips-original` path appears in any commit; the Nyquist test "the raw clip recordings in assets/clips-original/ are gitignored (D-27)" pins it. The guard skips `scripts/guards/__selftest__/` in repo mode, so `.gitignore` is the primary control | closed |
| T-11-21 | Tampering | ffmpeg invocation | medium | mitigate | `execFileSync` with argument arrays and no shell (build-clip.mjs:56, 285, 287); the original must match the sidecar `sourceSha256` before encoding (:280) | closed |
| T-11-22 | Denial of service | service worker media handling | low | mitigate | Range, video and audio requests return before `respondWith`, so partial responses never reach the cache (service-worker.js:120-127); service-worker-media.test.ts:82-114 | closed |
| T-11-23 | Tampering | RouteLogFilters `router.replace` | medium | mitigate | The island calls `replace(routeLogHref(next))` only (RouteLogFilters.tsx:92); tests :152, :160 and :170 assert the exact arguments | closed |
| T-11-24 | Information disclosure | filters client bundle | low | mitigate | RouteLogFilters imports only react, `next/navigation` and the import-free `lib/route-log` (RouteLogFilters.tsx:3-13) | closed |
| T-11-25 | Information disclosure | Safety preview block | low | mitigate | `Safety.tsx` renders the approved capture only; case-study.spec.ts:383-384 asserts the block's `textContent` equals the data | closed |
| T-11-26 | Tampering | capture rendered as HTML | low | mitigate | No `dangerouslySetInnerHTML` in app, components or lib (0 hits); `Safety.tsx` renders text children through the InlineCode tokenizer, which emits no HTML | closed |
| T-11-27 | Information disclosure | trail profiles in client bundles | low | mitigate | `RouteProfile.tsx` has no `'use client'`; trail-profiles.test.ts:121 fails if any client module imports `data/generated/trail-profiles` | closed |
| T-11-28 | Tampering | trail paint tokens | low | mitigate | The `--trail-*` tokens live outside the `--color-*` namespace (globals.css:48-60) and are painted only through background utilities (:341-356); check-contrast.mjs:93-95 measures them in lint | closed |
| T-11-29 | Information disclosure | coin-flip metric context | medium | mitigate | projects.test.ts:255-258 fails on any coin-flip tile with a `sourceUrl`; case-study.spec.ts:320 asserts no link in coin-flip's `#metrics` | closed |
| T-11-30 | Tampering | Next steps links | low | mitigate | Row and Next steps hrefs come from `routeLogHref` with enum values (RouteRow.tsx:110, NextSteps.tsx:39); projects.test.ts:268-276 proves each row id exists in `roadmapItems` | closed |
| T-11-31 | Information disclosure | RouteIndex client bundle | low | mitigate | RouteIndex is typed `{ id, label }[]` and imports only react and one icon; the page maps sections down to those two fields ([slug]/page.tsx:61-62) | closed |
| T-11-32 | Denial of service | scroll-spy observer | low | mitigate | One IntersectionObserver, disconnected on unmount, and a passive scroll handler; RouteIndex.test.tsx:179-187 | closed |
| T-11-33 | Information disclosure | raw recording | high | mitigate | The original is ignored; the only tracked media are the hashed MP4 and poster; `guard:images` and `clip:derive --check` pass | closed |
| T-11-34 | Information disclosure | on-screen clip content | medium | mitigate | 11-15-PLAN:173 gives the recording brief; the 11-15 SUMMARY records the frames viewed; 11-16-SUMMARY records Tim's "approve" | closed |
| T-11-35 | Repudiation | coin-flip clip block | medium | mitigate | Tim's quoted "approve" (11-16-SUMMARY); projects.test.ts:192-215 pins the clip copy byte-identical to the approved draft | closed |
| T-11-36 | Information disclosure | served clip | medium | mitigate | `DemoClip.tsx` sets `preload="none"`; demo-clip.spec.ts "loading coin-flip makes no request for the MP4 before play" | closed |
| T-11-37 | Elevation of privilege | gh pushes and dispatches | medium | mitigate | Ran only on the quoted `ci.approval` (11-02-SUMMARY:389) plus Tim's 11-17 "B" for one extra dispatch; `origin/ci/11-17` history has only fast-forwards, none forced | closed |
| T-11-38 | Repudiation | baseline PNG commit | medium | mitigate | e511d7a, authored by tlex-web, holds 21 PNG changes and nothing else; `check-snapshot-commit` OK | closed |
| T-11-39 | Tampering | downloaded artifact | low | mitigate | Only PNGs entered the tree (e511d7a); the procedure is in 11-17-PLAN:127 and the 11-17 SUMMARY | closed |
| T-11-40 | Repudiation | `data/home.ts` About | medium | mitigate | home.ts:22 equals the approved `copy.home-about` row with `{name}` filled in; home-ascent.spec.ts:444 reads the text from the data | closed |
| T-11-41 | Tampering | visual route table and snapshot folders | low | mitigate | 203d032 changes only `routes.spec.ts` and the README; e511d7a deletes only the clix-cli and clix-website folders | closed |
| T-11-42 | Information disclosure | `Metrics.tsx` sr-only suffix (11-19, G-11-4) | low | mitigate | Metrics.tsx:100 renders only `{tile.label}`, the text the tile's dt already shows; projects.test.ts:257 asserts no coin-flip tile has a `sourceUrl`; case-study.spec.ts:328-330 asserts coin-flip's `section#metrics` has no link | closed |
| T-11-43 | Tampering | box visual baselines (11-19) | low | mitigate | case-study.spec.ts:342 proves zero layout change and a ≤1×1 px suffix at 375/768/1440 in chromium and firefox; `check-snapshot-commit --none` OK (0 changed) on 293b093 and d111885; no PNG or `e2e/visual` path in 4f5bdc1..d111885; no re-baseline dispatched | closed |
| T-11-SC | Tampering | supply chain (npm deps) | low | accept | `package-lock.json` has no Phase 11 commit (last change b101a0c, 09-08; 11-19 installs nothing). See Accepted Risks Log AR-11-SC | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-11-01 | T-11-05 | Tim's own public repository at a fixed tag (v2.0, 61afb3d), built with `--locked` against its committed lockfile, in the scratchpad only. Nothing is installed and his installed box is untouched. | Plan-time `accept` disposition (11-02-PLAN threat model), reviewed by secure-phase | 2026-11-02 |
| AR-11-SC | T-11-SC | The shared supply-chain acceptance repeated in all 19 plans (18 + gap plan 11-19). No dependency changes in Phase 11. | Plan-time `accept` disposition (all 19 plans) | 2026-11-02 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-02 | 41 (+SC) | 41 | 0 | gsd-security-auditor (ASVS L1, block_on high) + Tim's "Fix both now (Recommended)" (T-11-15, e41cb46) |
| 2026-11-02 | 43 (+SC) | 43 | 0 | secure-phase L1 short-circuit (plan-time register, threats_open 0): gap plan 11-19 adds T-11-42 and T-11-43, both closed by grep-level evidence at HEAD 7f2d2bd |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-02

## Security Audit 2026-11-02

| Metric | Count |
|---|---|
| Threats found | 41 |
| Closed | 41 |
| Open | 0 |

## Security Audit 2026-11-02

| Metric | Count |
|---|---|
| Threats found | 43 |
| Closed | 43 |
| Open | 0 |
