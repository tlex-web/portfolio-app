---
phase: "18"
slug: "immersive-survey-layout"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
created: "2026-11-26"
---

# Phase 18 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Built from the 29 plan-time `<threat_model>` blocks (register_authored_at_plan_time: true) and the 16 SUMMARY threat-flag sections; verified by gsd-security-auditor at ASVS L1 on the phase tip (44a8867, sources identical to `ci/18-29` b6939ea, CI run 45879391203 green).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| local branch → GitHub | Pushes publish commits on `ci/` branches; dispatches run workflows on them | commits, workflow runs (public repo) |
| CI artifact → working tree | Downloaded baseline PNGs are untrusted until byte-compared with HEAD | PNG baselines |
| shared link previews → card route | Platforms cache the og:image URL, query included | og image URL and hash |
| server modules → client chunks | Credits, registry and overview data stay server-only; the footer ships in global-error's client graph | data/sources.ts, lib/regions.ts, overview data |
| /sources → external licence sites | Outbound links open new browsing contexts | links (tabnabbing) |
| Tim's reply → shipped copy | Approved wording becomes public text and licence compliance | credit and licence strings |
| region names / photo titles → JSON-LD | Text lands inside a `<script>` element | BreadcrumbList names |
| page → OS share sheet and clipboard | The URL leaves the page through browser APIs | canonical photo/region URL |
| photo data → page | Positions and images are published from committed derivatives at their own precision | WGS84/LV95 positions, image derivatives |
| data → inline `<style>` | Slugs and region ids become CSS selectors, including `:has()` | slugs, region ids |
| page / viewer → history | Hash entries and the end-card step must leave the URL on the last photo | history entries |
| build scripts → generated data | proj4 output enters committed generated files | generated coordinates |
| margins → licence compliance | Each map's credit must satisfy its licence | sheet-margin credits |
| server routes → client islands | Labels, card strings and hrefs cross only as props | props |
| URL → viewer state and back target | Both come from committed data, never from the request | slug → photo id |
| viewer → image derivatives | Only content-hashed manifest derivatives are fetched | stage srcsets, preloads |
| visitor URL → proxy.ts | The `?view=` value is untrusted input, decided before render | query string |
| test suite → regression safety | Rewriting or retiring tests can drop coverage silently | test counts, mappings |
| retirement → Home | The shared three.js stack and Home's waypoint list | Home data and modules |
| planning files → public repo | Write-backs are public text | SUMMARY and ledger content |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-18-01 | Tampering | e2e/og.spec.ts card pin | medium | mitigate | og.spec.ts:157-163 LF pin; old/new query both 200 (18-01); Tim's option A | closed |
| T-18-02 | Elevation of privilege | push scope ci/18-01 | medium | mitigate | ci/18-01 = f93a888; branch creation only; 0 force, 0 dispatch | closed |
| T-18-03 | Information disclosure | coordinates in 18-01 SUMMARY | low | mitigate | coordinate-pattern grep of 18-01-SUMMARY: no match | closed |
| T-18-04 | Information disclosure | data/sources.ts in client chunk | low | mitigate | client-graph.test.ts:66 SERVER_ONLY_MODULES; walk test :210 | closed |
| T-18-05 | Tampering | licence links (tabnabbing) | low | mitigate | sources/page.tsx:56-57 rel; e2e/sources.spec.ts:161-162 | closed |
| T-18-06 | Repudiation | licence credit altered | medium | mitigate | data/__tests__/sources.test.ts:71,81,86-87 strict equality | closed |
| T-18-07 | Repudiation | licence reading (A4) | medium | mitigate | 18-03-SUMMARY: Tim's verbatim "approve-G1 (Recommended)" | closed |
| T-18-08 | Repudiation | copy without literal reply | low | mitigate | 18-03-SUMMARY verbatim reply plus final-string trace table | closed |
| T-18-09 | Information disclosure | long reference in client chunks | low | mitigate | only data/sources.ts:64 holds it; 0 hits in .next/static | closed |
| T-18-10 | Tampering | footer re-baseline round | high | mitigate | Tim's 48963a9: 36 declared PNGs; check-snapshot-commit OK (36) | closed |
| T-18-11 | Elevation of privilege | ci/18-04 push and dispatch | medium | mitigate | creation plus Tim's push; one dispatch 45524859021; 0 force | closed |
| T-18-12 | Tampering | downloaded artifacts | low | mitigate | empty download dirs, external compare scripts; Tim's commits PNG-only | closed |
| T-18-13 | Tampering | /sources round | high | mitigate | c24568d adds exactly 3 sources PNGs; `--allow sources` OK (3) | closed |
| T-18-14 | Tampering | photo shot drift (Pitfall 8) | medium | mitigate | e2e/visual/routes.spec.ts:37-43 film-line filter, exactly one | closed |
| T-18-15 | Elevation of privilege | ci/18-05 scope | medium | mitigate | creation plus 3 fast-forward pushes; one dispatch 45622077291; 0 force | closed |
| T-18-16 | Tampering | BreadcrumbList name injection | medium | mitigate | json-ld/site.ts:51-52 escapes `<`; json-ld.test:118,185-200 | closed |
| T-18-17 | Information disclosure | registry via Breadcrumb/TrailSign | low | mitigate | both import only next/link; client-graph test passes | closed |
| T-18-18 | Information disclosure | shared URL with query or hash | low | mitigate | ShareButton.tsx:151,180 url prop; RegionHeader.tsx:45; photos-region.spec `?x=1#y` | closed |
| T-18-19 | Denial of service | repeated share presses | low | mitigate | ShareButton.tsx:171,184 pending ref; share-button.test.tsx:180 | closed |
| T-18-20 | Elevation of privilege | Permissions-Policy | low | accept | next.config.ts:91 restricts camera/microphone/geolocation only (see log) | closed |
| T-18-21 | Information disclosure | collar precision | medium | mitigate | SequenceFigure.tsx:66-72 reuses the strip's precision-aware Position | closed |
| T-18-22 | Information disclosure | originals or EXIF served | low | mitigate | SequenceFigure.tsx:118-122, HeaderSlot.tsx:40-44 manifest stage srcsets only | closed |
| T-18-23 | Tampering | plateCss slug injection | low | mitigate | plate-layout.ts:69,562-566 RangeError; cssEscape :493,:531; test :603-666 | closed |
| T-18-24 | Information disclosure | pin precision | low | mitigate | plate-layout.ts:140-150 stored uv; regions.ts:329-337 | closed |
| T-18-25 | Repudiation | margin credit or anchor | medium | mitigate | sheet-margin.ts:117-119,198 by dem.product; sheet-margin.test:176 | closed |
| T-18-26 | Tampering | Matterhorn data | low | mitigate | `git diff a0da7ca..HEAD` home-plate.ts empty; data:check in lint | closed |
| T-18-27 | Information disclosure | proj4 in client | low | mitigate | eslint.config.mjs:78-81 bans proj4 outside scripts | closed |
| T-18-28 | Denial of service | per-frame layout reads | low | mitigate | RegionRail.tsx:65-68 two IntersectionObservers; no scroll listener | closed |
| T-18-29 | Information disclosure | registry in rail chunk | low | mitigate | RegionRail.tsx:35 props are ticks and a head string | closed |
| T-18-30 | Tampering | overviewCss id injection | low | mitigate | overview-layout.ts:139,477-510,1230 RangeError; cssEscape :1147-1197; test :867,875 | closed |
| T-18-31 | Tampering | region round | high | mitigate | 8944359: 24 region PNGs only (Tim extended 15 → 24); `--allow region` OK | closed |
| T-18-32 | Tampering | flaky baselines | medium | mitigate | routes.spec.ts:169-224 settle waits; :257-266 copy mode, reduced motion; :356 rail | closed |
| T-18-33 | Elevation of privilege | ci/18-14 scope | medium | mitigate | fast-forward pushes only; 2 dispatches, the 2nd authorised by Tim (18-14 SUMMARY); 0 force | closed |
| T-18-34 | Tampering | stepping target from input | low | mitigate | regions.ts:374-377 regionViewerSet by photo id; [slug]/page.tsx:108 | closed |
| T-18-35 | Information disclosure | registry in viewer or card chunk | low | mitigate | EndCard and PhotoViewer import no registry module; client-graph passes | closed |
| T-18-36 | Tampering | BreadcrumbList title injection | medium | mitigate | [slug]/page.tsx:98-103 jsonLdHtml; json-ld.test `<` rows :441,:636 | closed |
| T-18-37 | Spoofing | back target from URL | low | mitigate | regions.ts:356-360 photoBack by photo id, throws on unknown | closed |
| T-18-38 | Information disclosure | LV95 finer than shown WGS84 | high | mitigate | lv95-line.ts:46-52 rounds to shown value, snaps to grid; property rows :123-153 | closed |
| T-18-39 | Information disclosure | shared photo URL | low | mitigate | PhotoViewer.tsx:597 site.url + photoHref(slug); photos-lightbox.spec:436 | closed |
| T-18-40 | Denial of service | over-fetching derivatives | low | mitigate | image-sizes.ts:141 stageSizes; photos-lightbox.spec:240,252 currentSrc gates | closed |
| T-18-41 | Information disclosure | preload of non-manifest files | low | mitigate | PhotoViewer.tsx:236-242 preloadStage uses view.stage only | closed |
| T-18-42 | Tampering | viewer round | high | mitigate | e0c8e3a: 6 photo/lightbox PNGs; `--allow photo --allow lightbox` OK (6) | closed |
| T-18-43 | Elevation of privilege | ci/18-20 scope | medium | mitigate | 3 fast-forward pushes; 2 dispatches, the 2nd authorised by Tim; 0 force | closed |
| T-18-44 | Spoofing | open redirect via `?view=` | medium | mitigate | proxy.ts:231,242-246 constant LEGACY_VIEW_REGION; proxy.test:595-625 | closed |
| T-18-45 | Information disclosure | query reflected into redirect | low | mitigate | proxy.ts:246 fresh URL; proxy.test:614,621; e2e/photos.spec.ts:63,73 | closed |
| T-18-46 | Tampering | cached 308 outliving a mapping | low | accept | mapping permanent by D-03 (proxy.ts:253, 308) (see log) | closed |
| T-18-47 | Information disclosure | overview data in client chunks | low | mitigate | OverviewSheet is a server component; client-graph.test.ts:64 | closed |
| T-18-48 | Tampering | CSS injection via region ids | low | mitigate | overviewCss slug guard and cssEscape; overview-layout.test:867,875 | closed |
| T-18-49 | Repudiation | 18-24 tests deleted | medium | mitigate | 18-24-SUMMARY mapping (64); guard:tests in CI; floor 3,024, now 3,653 | closed |
| T-18-50 | Tampering | Home edits during carousel removal | medium | mitigate | `git diff a0da7ca..HEAD lib/ascent components/home` empty | closed |
| T-18-51 | Tampering | fixture drift | medium | mitigate | no light-table identifiers in code or tests; regions.test:519,533 invariants | closed |
| T-18-52 | Repudiation | MapSheet and label-layout tests | medium | mitigate | 18-27-SUMMARY mappings and count gate; guard:tests floor | closed |
| T-18-53 | Tampering | Home data | medium | mitigate | `git diff a0da7ca..HEAD data/home-waypoints.ts lib/ascent components/home` empty | closed |
| T-18-54 | Tampering | overview round | high | mitigate | fc16583: 3 photos modified + exactly 6 grid/carousel deletions; checker OK (9) | closed |
| T-18-55 | Repudiation | baseline deleted without replacement | low | mitigate | replacements in 8944359; deletions in fc16583; 18-28-SUMMARY | closed |
| T-18-56 | Elevation of privilege | ci/18-28 scope | medium | mitigate | creation plus Tim's push; one dispatch 45869004528; 0 force | closed |
| T-18-57 | Elevation of privilege | ci/18-29 scope | medium | mitigate | creation only; one perf dispatch 45882211560; no visual dispatch | closed |
| T-18-58 | Tampering | baselines at tip | medium | mitigate | checker over 137 phase commits, 0 fail; Visual Regression run 45879391203 | closed |
| T-18-59 | Information disclosure | coordinates in 18-29 SUMMARY | low | mitigate | coordinate-pattern grep of 18-29-SUMMARY: no match | closed |
| T-18-60 | Tampering | `:has()` sync selector injection | low | mitigate | plate-layout.ts:531 cssEscape; plate-layout.test:616 | closed |
| T-18-61 | Tampering | hash written to history | low | mitigate | no hash handler added; no location.hash writes in photo code | closed |
| T-18-62 | Information disclosure | registry via regionViewerSet | low | mitigate | server pages only; PhotoViewer imports PhotoView as a type | closed |
| T-18-63 | Tampering | card step writes history or URL | low | mitigate | stepping.ts:71-74 null past ends; photo-viewer.test:348; no pushState | closed |
| T-18-64 | Repudiation | view tests rewritten | medium | mitigate | 18-21-SUMMARY mapping table; guard:tests floor in CI | closed |
| T-18-65 | Tampering | axe finding hidden | low | mitigate | e2e/audit.spec.ts:344-390 three widths, expectClean, untagged | closed |
| T-18-66 | Repudiation | texture-hook test deleted | low | mitigate | 18-25-SUMMARY mapping of 11 to the e2e row; guard:tests floor | closed |
| T-18-67 | Repudiation | test-count baseline | medium | mitigate | 98ec000 changes only the baseline; test-count.mjs:202-224 | closed |
| T-18-68 | Repudiation | Map, switcher, `?view=` tests retired | medium | mitigate | 18-22-SUMMARY retirement mapping; guard:tests floor | closed |
| T-18-SC | Tampering | npm installs | low | accept | committed-lockfile installs only; ff477ab added 0 entries, removed 36 (see log) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

Totals: 69 threats (6 high, 26 medium, 37 low); 66 mitigate, 3 accept; 69 closed, 0 open.

**Post-plan scope mapped to existing threats (no new attack surface):** 18-18 inline icons (static server SVG module; T-18-35); 18-20 compact Share bar (same factory, server-built url; T-18-18, T-18-19, T-18-39); 18-23 placement solver (server-only, capped search of 200,000 checks, computed once per process, CSS still slug-guarded and escaped; T-18-30, T-18-47, T-18-48); 18-25 `LIGHTBOX_CLOSE_EVENT` removal (removes surface; T-18-63 unchanged); 18-25 drei removal with `@types/three` 0.183.1 pinned (T-18-SC; 0 lockfile entries added, 36 removed, 0 version or integrity changes; Security Audit job green on b6939ea).

**Audit notes (non-blocking):**
- T-18-54: `check-snapshot-commit --allow-deletions` is all-or-nothing; "exactly six named deletions" is proven by fc16583's contents, not by the tool. A `--allow-deletions <subdir>` form would make it tool-enforced.
- T-18-38: lv95Line takes raw lat/lon but rounds through the strip's own `roundedCoordinate` first; the property rows prove equivalence with "consumes the rounded strings".
- T-18-33, T-18-43: each round used one dispatch more than D-23's one; Tim's literal approval for each is recorded in the 18-14 and 18-20 SUMMARYs.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-18-01 | T-18-20 | `next.config.ts` Permissions-Policy restricts only camera, microphone and geolocation, so web-share and clipboard-write stay available; no change needed for PHOTO-07 | plan-time register (Phase 18 plans) | 2026-11-24 |
| AR-18-02 | T-18-46 | A cached 308 could outlive a change of the `?view=grid|carousel` → `/photos/regions/zermatt` mapping; the mapping is permanent by D-03 and changing it was rated costly | plan-time register (18-22) | 2026-11-24 |
| AR-18-03 | T-18-SC | Plans install nothing beyond the committed lockfile (`npm ci`); the Tim-approved 18-25 cleanup ran the bundled npm to pin the already-locked `@types/three` 0.183.1 directly and remove drei, adding no new package | plan-time register; cleanup approved by Tim ("Pin @types/three 0.183.1 (Recommended)") | 2026-11-26 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-26 | 69 | 69 | 0 | gsd-security-auditor (ASVS L1, block_on high) via /gsd-secure-phase 18 |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-26
