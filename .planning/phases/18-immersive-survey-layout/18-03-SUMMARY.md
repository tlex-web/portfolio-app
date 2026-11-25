---
phase: 18-immersive-survey-layout
plan: 03
subsystem: ui
tags: [footer, sources-page, licences, attribution, client-graph, copy-checkpoint]
status: in-progress   # DRAFT: paused at Task 2 (checkpoint:decision, gate blocking-human); Task 3 not started

requires:
  - phase: 18-02
    provides: /sources page, data/sources.ts (server-only), data/source-credits.ts (client-safe), draft copy
provides:
  - "Footer Source row on every route: 'Contours derived from' + short swissALTIRegio credit linked to /sources#swissaltiregio, then an 'All data sources' link to /sources (D-16)"
  - "SWISSALTIREGIO_CREDIT in server-only data/sources.ts, byte-identical to v2.0 (631 chars, sha256 bb9aae2f...); site.attribution removed from data/site.ts and the Site type"
  - "D-20 packet for Tim (strings 1-6, licence reading, G1/G2), awaiting his reply"
affects: [18-04, 18-11, 18-22, 18-23, SiteFooter, SheetLegend, global-error]

actuals:   # partial (Task 1 only); the continuation agent rewrites these at plan completion
  tokens: 5800     # chars/4 over the Task 1 code diff (git diff dee02a8..f9e7308 = 23,309 chars)
  tasks: 1
  commits: 1       # measured: git rev-list --count dee02a8..f9e7308
plan_head_before: dee02a82614aa18e07e045e4934d7c03f30283a5

tech-stack:
  added: []
  patterns:
    - "A moved verbatim string is pinned by sha256 and length, so a move can never change it; e2e checks the rendered text against the same hash instead of importing the server-only module"
    - "Footer links are plain anchors: the global-error fallback must not use next/link"

key-files:
  created: []
  modified:
    - components/terrain/SheetLegend.tsx
    - data/sources.ts
    - data/site.ts
    - data/types.ts
    - data/__tests__/sources.test.ts
    - components/site/__tests__/SiteFooter.test.tsx
    - e2e/shell.spec.ts
    - e2e/sources.spec.ts

key-decisions:
  - "The footer Source links are plain <a>, not next/link: global-error.test pins that the fallback never uses the router link"
  - "The footer now has five tab stops (GitHub, LinkedIn, Email + the two Source links); the 07 'three tab stops' rows are rewritten to name all five"

requirements-completed: []   # REGION-06 is marked at plan completion (Task 3)
---

# Phase 18 Plan 03: Footer Source row and the D-20 copy checkpoint Summary (DRAFT, paused at Task 2)

On every route the footer's Source row now gives a short swissALTIRegio credit linked to its /sources entry and an "All data sources" link. The 631-character reference lives once, in server-only `data/sources.ts`, and has left the client JS. The D-20 copy packet is ready, and the plan is paused for Tim's reply.

## Progress

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Footer Source row end to end; reference moved to server-only data (tracer) | Done | f9e7308 |
| 2 | Tim approves the D-20 copy, the licence reading and the GLO-90 placement | Done: "approve-G1 (Recommended)", 2026-11-25 | this commit |
| 3 | Apply the approved copy verbatim and pin it (tdd) | Not started | n/a |

## Task 1 (f9e7308)

- `data/sources.ts`: `SWISSALTIREGIO_CREDIT` holds the string copied programmatically from `site.attribution.terrain`: 631 characters, sha256 `bb9aae2fda067c1337d3dde7cd31223ea425286b4c81eaeadf8c1a8d158f19ea` (checked before and after the move). The swissALTIRegio entry's credit reads it. `attribution` is gone from `data/site.ts` (code and doc block) and from the `Site` type.
- `SheetLegend.tsx`: the Source `dd` reads `Contours derived from` + `<a class="prose-link" href="/sources#swissaltiregio">swissALTIRegio, swisstopo</a>.`, then `<span class="mt-1 block"><a class="prose-link inline-flex min-h-11 items-center" href="/sources">All data sources</a></span>`. It imports only `data/source-credits.ts`. Every other row is unchanged.
- Tests rewritten, none deleted, same count. `sources.test` pins the hash and length. `SiteFooter.test` asserts both links, their hrefs and classes, the two-line row, that no word of the reference past "Bundesamt" appears in the footer, and that there is no © in the Source row. The focus row lists the five footer tab stops by name. In `shell.spec`, the legend rows expect 5 tab stops, and the every-route row asserts the short credit link, the All data sources link and no "Tarquini". `sources.spec` checks the rendered swissALTIRegio credit against the same sha256 and length.
- Verification:
  - Jest: full suite 120/120 suites, 2,403 tests passed. The plan's three suites: 44/44.
  - `PW_PROD=1` shell + sources on Chromium and Firefox: 96 passed, 0 flaky.
  - Clean build (`rm -rf .next/static`) succeeded; no client chunk contains "Tarquini".
  - type-check and eslint passed; `check-snapshot-commit --none` OK (0 changed).
  - `public/service-worker.js` restored after each build.
- Client JS: **1,850,219 B in 24 files**, 1,526 B below the phase base of 1,851,745 B (cap 1,855,841 B).
- Acceptance greps: `attribution` in the code lines of data/site.ts = 0; `site.attribution.terrain` in the code lines of SheetLegend.tsx = 0; `SWISSALTIREGIO_CREDIT` in data/sources.ts = 3.
- Tracer gate: `<verify>` passed end to end, so expansion may proceed. The next task is the human checkpoint.

## Task 2 material: D-20 packet (as shown to Tim; his reply is below)

Captured from the f9e7308 build served on :3017 (server stopped). The same packet is at `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/41a6ee3c-da8d-49d7-8f73-f61ebc0e4623/scratchpad/d20-packet.md`.

**Rendered footer Source row (/roadmap; every route is the same):** `Contours derived from swissALTIRegio, swisstopo.` / `All data sources`. The links go to `/sources#swissaltiregio` and `/sources`.

**Rendered /sources:**
- title: "Data sources · Tim Lui"
- description: "The elevation models behind the maps on this site, with the credit each licence asks for, the licence and the changes made."
- h1: "Data sources"
- intro: as draft 5b below
- three sections in order: `#swissaltiregio`, `#bev-als-dtm`, `#copernicus-glo-90`. Each has its verbatim Credit, the licence links (new tab, "(opens in a new tab)") and the Changes and Used on text listed below.

| # | String | Current / draft text | → Proposed final | Applies |
|---|--------|----------------------|------------------|---------|
| 1 | Overview kicker | `3 regions · 11 photographs · 2016–2026` (computed: 3 regions, 11 published photos, capture years 2016–2026) | Same | 18-22 |
| 2 | /photos meta description | Live: "Landscape photographs from around Zermatt, each placed on the terrain where Tim took it." Draft: "Landscape photographs from three Alpine regions, each placed on the terrain where Tim took it." | "Landscape photographs from across the Alps, each placed on the terrain where Tim took it." (no count to go stale) | 18-22 |
| 3a | Short credit swissALTIRegio | `swissALTIRegio, swisstopo` | Same | 18-03 footer, 18-11 margins |
| 3b | Short credit BEV | `ALS DTM, BEV, CC BY 4.0` | Same | 18-11 |
| 3c | Short credit GLO-90 | `Copernicus DEM GLO-90` | Same (G1) | 18-23 |
| 3d | Footer Source row | `Contours derived from swissALTIRegio, swisstopo.` / `All data sources` | Same | 18-03 |
| 4 | Sheet titles | `The Alps`, `Zermatt – Matterhorn` (unchanged), `Ortler`, `Saalfelden` | Same | 18-11 / 18-23 |
| 5a | /sources description | "The elevation models behind the maps on this site, with the credit each licence asks for, the licence and the changes made." | Same | 18-03 |
| 5b | /sources intro | "The maps on this site are drawn from three elevation models. Each entry gives the credit exactly as its licence asks, the licence itself, what was done to the data and the maps that use it." | Same | 18-03 |
| 6a | swissALTIRegio licence name | "swisstopo terms of use for free geodata" | "swisstopo terms of use for free geodata and geoservices (OGD)" (swisstopo's own heading) | 18-03 |
| 6b | swissALTIRegio licence target | https://www.swisstopo.admin.ch/en/conditions-geodata | Same (200 OK) | 18-03 |
| 6c | swissALTIRegio Changes | "Resampled to a 10 m grid; contours every 100 m and a hillshade derived; modified." | "Cut to each map's extent at its native 10 m grid; contours every 100 m and a hillshade derived; modified." (accuracy: swissALTIRegio is natively 10 m per swisstopo STAC, read at cellM 10) | 18-03 |
| 6d | BEV licence | "CC BY 4.0" → https://creativecommons.org/licenses/by/4.0/ (from source.json) | Same | 18-03 |
| 6e | BEV Changes | "Resampled to a 10 m grid; contours every 100 m and a hillshade derived; modified." / "Edition 15 September 2025, the date BEV created the dataset, not a survey date." | Same | 18-03 |
| 6f | GLO-90 licence | "Licence for COP-DEM-GLO-90-F Global 90m Full, Free & Open" → dataspace.copernicus.eu licence PDF | Same (200 OK, application/pdf) | 18-03 |
| 6g | GLO-90 Changes | "Resampled to a coarser grid covering the Alps; contours every 1,000 m derived; modified." | Same (the overview draws no hillshade) | 18-03 |
| 6h | Used on labels | "The footer of every page" · "Alps overview" | Same | 18-03 |

**Licence reading to confirm (research, MEDIUM confidence, assumption A4):**
- CC BY 4.0 §3(a)(2) and Etalab 2.0 accept a hyperlink explicitly.
- dl-de/by-2-0 sets no placement rule.
- swisstopo OGD requires a source reference "attached" but says nothing about links or placement.
- GLO-90 Art. 6(b) requires the notice to be "provided" but sets no placement; /sources is a reasonable "legal notice" for 6(c).

No licence was found that requires its full notice at the map.

**GLO-90 placement:**
- **G1 (Recommended):** the overview margin shows `Copernicus DEM GLO-90` linked to `/sources#copernicus-glo-90`, where the notice and the liability sentence stand in full.
- **G2:** the overview margin carries GLO90_NOTICE (182 chars) and GLO90_LIABILITY (149 chars) verbatim (`font-body text-sm text-ink-muted max-w-prose`), then `Licence and details` linking to the entry.

## D-20 copy (Tim's reply, verbatim)

Tim answered on 2026-11-25 through an AskUserQuestion prompt in the orchestrator session, after seeing the packet (scratchpad `d20-packet.md`, built from f9e7308). The literal record is the "18-03 Task 2" section of `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/41a6ee3c-da8d-49d7-8f73-f61ebc0e4623/scratchpad/tim-answers-18.md`.

**Question (verbatim):** "18-03 D-20 copy checkpoint: approve the proposed finals (including the three changed rows 2, 6a, 6c), the licence reading (credit by link is enough), and which GLO-90 placement? To change any string, pick Other and type the row number and replacement text plus G1 or G2."

**Selected label (verbatim):** "approve-G1 (Recommended)"

**Option description as shown (verbatim):** "Every proposed final in the packet, the licence reading, and G1: the overview margin shows the short credit 'Copernicus DEM GLO-90' linked to /sources#copernicus-glo-90, where the notice and the liability sentence stand in full."

**Options offered and not chosen:** "approve-G2"; "Drafts for 2/6a/6c, G1".

What the reply approves, per the packet's section E ("`approve-G1`: approve every proposed final in B, the reading in C, and G1"):

- the **proposed final** column of section B, every row (rows 2, 6a and 6c take the new text, not the draft);
- the **licence reading** of section C: no licence requires its full notice on the map itself, so the footer and the sheet margins may carry a short credit that links to the full text on /sources;
- **G1** for the GLO-90 placement (D-17): the overview margin shows the short credit `Copernicus DEM GLO-90` linked to `/sources#copernicus-glo-90`, where GLO90_NOTICE and GLO90_LIABILITY stand in full. G2 (the verbatim notice in the overview margin) is not chosen.

### Final strings and the plan that applies each

The text is copied from the packet's section B, proposed-final column; for a "Same" row it is the draft text, word for word.

| # | String | Final text (approved 2026-11-25) | Applies |
|---|--------|----------------------------------|---------|
| 1 | Overview kicker | `3 regions · 11 photographs · 2016–2026` (the format `N regions · N photographs · YYYY–YYYY`, computed from the data) | 18-22 |
| 2 | /photos meta description | "Landscape photographs from across the Alps, each placed on the terrain where Tim took it." | 18-22 |
| 3a | Short credit, swissALTIRegio (footer, Zermatt and Ortler margins) | `swissALTIRegio, swisstopo` | 18-03 (footer, `SHORT_CREDIT`), 18-11 (margins) |
| 3b | Short credit, BEV (Saalfelden margin) | `ALS DTM, BEV, CC BY 4.0` | 18-03 (`SHORT_CREDIT`), 18-11 (margin) |
| 3c | Short credit, GLO-90 (overview margin) | `Copernicus DEM GLO-90` | 18-03 (`SHORT_CREDIT`), 18-23 (margin, G1) |
| 3d | Footer Source row | `Contours derived from swissALTIRegio, swisstopo.` then `All data sources` | 18-03 |
| 4a | Sheet title, overview | `The Alps` | 18-11 / 18-23 |
| 4b | Sheet title, Zermatt | `Zermatt – Matterhorn` | 18-11 |
| 4c | Sheet title, Ortler | `Ortler` | 18-11 |
| 4d | Sheet title, Saalfelden | `Saalfelden` | 18-11 |
| 5a | /sources meta description | "The elevation models behind the maps on this site, with the credit each licence asks for, the licence and the changes made." | 18-03 |
| 5b | /sources intro | "The maps on this site are drawn from three elevation models. Each entry gives the credit exactly as its licence asks, the licence itself, what was done to the data and the maps that use it." | 18-03 |
| 6a | swissALTIRegio licence name | "swisstopo terms of use for free geodata and geoservices (OGD)" | 18-03 |
| 6b | swissALTIRegio licence target | https://www.swisstopo.admin.ch/en/conditions-geodata | 18-03 |
| 6c | swissALTIRegio Changes | "Cut to each map's extent at its native 10 m grid; contours every 100 m and a hillshade derived; modified." | 18-03 |
| 6d | BEV licence name and target | "CC BY 4.0" → https://creativecommons.org/licenses/by/4.0/ | 18-03 |
| 6e | BEV Changes | "Resampled to a 10 m grid; contours every 100 m and a hillshade derived; modified." / "Edition 15 September 2025, the date BEV created the dataset, not a survey date." | 18-03 |
| 6f | GLO-90 licence name and target | "Licence for COP-DEM-GLO-90-F Global 90m Full, Free & Open" → https://dataspace.copernicus.eu/sites/default/files/media/files/2025-06/copernicus_contributing_mission_data_access_v2_cop_dem_licenses.pdf | 18-03 |
| 6g | GLO-90 Changes | "Resampled to a coarser grid covering the Alps; contours every 1,000 m derived; modified." | 18-03 |
| 6h | Used on labels | "The footer of every page" · "Alps overview" | 18-03 |
| G | GLO-90 placement | G1: the overview margin shows `Copernicus DEM GLO-90` linked to `/sources#copernicus-glo-90` | 18-23 |
| C | Licence reading | A short credit linked to the full text on /sources is enough for every licence; no full notice at the map | 18-11, 18-23 (margins), 18-03 (footer) |

Row 6f's target is written out in full from `data/sources.ts`; the packet abbreviated it as "dataspace.copernicus.eu licence PDF". Row 6c's apostrophe is the ASCII `'` (U+0027) the packet uses, and it ships as that byte.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Footer links switched from next/link to plain anchors**
- **Found during:** Task 1 (full Jest run)
- **Issue:** The first cut used `next/link`. `components/__tests__/global-error.test.tsx` pins that the global-error fallback, which renders this footer, never uses the router link.
- **Fix:** Plain `<a>` elements, matching SiteFooter's own links. The doc block says why.
- **Files modified:** components/terrain/SheetLegend.tsx
- **Commit:** f9e7308

**2. [Rule 3 - Blocking] e2e/sources.spec.ts rewritten (not in Task 1's file list)**
- **Found during:** Task 1
- **Issue:** The spec compared the rendered swissALTIRegio credit with `site.attribution.terrain`, which no longer exists.
- **Fix:** It now checks the rendered text against the pinned sha256 and length, so the spec stays independent of `data/sources.ts`, as its doc block requires.
- **Files modified:** e2e/sources.spec.ts
- **Commit:** f9e7308

**3. [Rule 1 - Contract update] Footer tab-stop count 3 → 5**
- **Found during:** Task 1
- **Issue:** The 07 rows in SiteFooter.test and shell.spec pinned exactly three footer tab stops. D-16's two Source links make it five.
- **Fix:** Both rows are rewritten to five; the Jest row names each stop. keyboard.spec reads the footer links dynamically and needed no change.
- **Commit:** f9e7308

## Notes for later plans

- 18-04's re-baseline round covers this footer change (D-24). No baseline was run or dispatched here.
- Planning docs (18-UI-SPEC E9 long-text backstop, 18-CONTEXT, 18-RESEARCH, 18-PATTERNS) still say `site.attribution.terrain`. The string's home is now `SWISSALTIREGIO_CREDIT` in `data/sources.ts`, and no later plan in this phase references the old name.
