---
schema_version: 1
wave: all
outcome: verified
reason: ok
checked: 30
passed: 26
failed: 0
needs_review: 4
---

# Phase 18 — live-DOM verification

Target: `next start -p 3018` (production build of the phase tip), Chrome via claude-in-chrome, viewport 2560 px wide. Checks ran on the live DOM, plus same-origin `fetch` + DOMParser for the server HTML of the other routes.

## Passed

- 18-22 D-03: `?view=grid` and `?view=carousel` redirect to `/photos/regions/zermatt`. `?view=map`, `?view=bogus` and `?view=GRID` stay on the overview with 200. The 308 status code itself is hidden by fetch-follow; only `redirected=true` plus the final URL could be seen.
- 18-22 REGION-01 header: kicker `3 regions · 11 photographs · 2016–2026`, one h1 `Photographs`, title `Photographs · Tim Lui`.
- 18-22 list: h2 `Regions` sits over `ol[aria-label="Regions, west to east"]`. It holds 3 `a[data-region-row]` rows in the order zermatt, ortler, saalfelden, each linking to its regionHref. Each row has a number badge, heading, count and range · years. Saalfelden reads `ground 820–880 m · 2026`.
- 18-22 thumbnails: alt is empty, all render 96 px wide, true ratio (96x64, 96x128 portrait, 96x54).
- 18-22 PHOTO-06: no view switcher in the DOM.
- 18-23 sheet: wide-tier label plates are present (`Zermatt 7 photographs`, etc.) and all 5 summit labels show. The sheet is 736 px wide at the lg layout. The list column is 320 px and sits to the right (P7).
- 18-23 rectangles and markers: 3 polygons with `vector-effect: non-scaling-stroke` and `fill: none`. There are 3 markers, links to regionHref with `tabindex=-1` and `aria-hidden=true`, numbered 1/2/3.
- 18-23 heading outline: h2 `Map` (sr-only) comes before h2 `Regions`.
- 18-23 REGION-06 overview margin: `The Alps · contours every 1,000 m`, Extent `SW 43° N 5° E · NE 49° N 17° E`, Last surveyed `2021`, Source linking to `/sources#copernicus-glo-90`. The Summits row reads west to east: Mont Blanc, Dufourspitze, Zugspitze, Grossglockner, Triglav.
- 18-02 /sources: h1 `Data sources` with sections in the order `swissaltiregio`, `bev-als-dtm`, `copernicus-glo-90`. Each has an h2 and a dl of Credit, Licence, Changes and Used on.
- 18-02 licence links: all 3 have `target=_blank`, `rel="noopener noreferrer"` and the sr-only `(opens in a new tab)`.
- 18-02 BEV wording: the note that the edition is the dataset creation date, not a survey date, is present.
- 18-02 wrapping: 7 `wrap-anywhere` elements.
- 18-02 shell: no breadcrumb and no aria-current nav item on /sources.
- 18-03 footer Source row: `Contours derived from swissALTIRegio, swisstopo.` links to `/sources#swissaltiregio`, then `All data sources` links to `/sources`. Extent (LV95) and Last surveyed are unchanged.
- 18-06 breadcrumb: `Photographs / Zermatt`; the current crumb is a SPAN with aria-current, not a link. The BreadcrumbList JSON-LD names match, with absolute `https://www.tlui.de/...` URLs. Ortler and Saalfelden show the same pattern. There is no breadcrumb on /photos.
- 18-06 header: h1 `Zermatt, Switzerland`, data line `7 photographs · 1,617–2,928 m · 2019–2024`.
- 18-06 next region: `section#next-region` wraps Zermatt to Ortler, Ortler to Saalfelden and Saalfelden to Zermatt, then `All regions` links to /photos.
- 18-07 Share: server/hydrated state is copy mode, visible `Copy link` with aria-label `Copy link to this region`. Width is 168 px, matching the amended `min-w-42`. Not pressed.
- 18-08 sequence: `section[data-region-sequence]` has the gallery background. 7 figures are in DEM-height order with object-fit `contain`. Captions follow the stated order: collar position, title, data line, EXIF. Collar lines read N before E. The loaded image's rendered ratio is within 1% of its natural ratio.
- 18-08 header slot: `[data-header-control]` is 44 px wide and empty. The caption reads `Matterhorn from Zermatt · 1,617 m`.
- 18-08/12 D-07: at 2560 px there is no `n / N` in the captions, and the rail is shown.
- 18-08 D-06: the nav stays at top 0 after scrolling mid-sequence.
- 18-09/10 plate and key list: 7 badges are `a[href^="#photo-"]` with tabindex=-1 and aria-hidden. The key list `Photographs on the map, lowest first` has 7 anchors in sequence order.
- 18-11 plate margins:
  - Zermatt: `Extent (LV95)` with footer format, `May 2026`, linking to `/sources#swissaltiregio`.
  - Ortler: WGS84 4dp extent, `May 2026`.
  - Saalfelden: WGS84 4dp extent, `Sep 2025`, source `ALS DTM, BEV, CC BY 4.0`.
- 18-12 rail: `[data-region-rail]` is aria-hidden, pointer-events none and sticky, with head `Altitude` and 7 metre ticks. Server marks 1; scrolling the 4th figure to centre gave `data-rail-current="4"`. Saalfelden heads `Ground altitude`.
- 18-15/16/17/18 photo page (`matterhorn-wrapped-in-cloud`):
  - Navigation: one visible `Back to Zermatt` link to the region page; breadcrumb `Photographs / Zermatt / Matterhorn in a wisp of cloud`, matching the JSON-LD; legend `Esc back to Zermatt`; counter `7 / 7`.
  - LV95 line: `LV95 E 2’621’960 N 1’091’140`, with sr-only `Swiss grid`. The Saalfelden photo has no LV95 line and counts `2 / 2`.
  - Share: `Copy link to this photo` is present.
- 18-16 end card: Next on 7/7 shows h1 `End of the Zermatt series`. URL and title are unchanged. Next and Zoom are aria-disabled; Hide labels stays enabled. The trail sign leads to Ortler, then `All regions`. The live region reads `End of the Zermatt series. Next region: Ortler, Italy.` Previous returns to `7 / 7`.

## Needs review

- 18-08 P4 morph: every sequence image's computed `view-transition-name` is `none` (inline style is empty too). This is either P4's alternative or a name set only at click time. Someone needs to check 18-01's P4 answer and confirm the morph by eye.
- 18-23 compact tier and full-bleed below 640 px (and the 18-17 one-back-link check at 375/768): resize_window did not change the viewport (innerWidth stayed 2560), so narrow widths were not observed.
- 18-08/23 adjacency, CLS 0, srcset sufficiency and no overlap at 375/768/1024/1440 need geometry sweeps and performance tracing across widths. That is out of scope here; the e2e covers it.
- 18-16 LBOX-08 focus return from the lightbox and soft-navigation from the modal end card: the modal was not opened, so this was not observed.

---

## Orchestrator notes on the four needs-review items (2026-11-26)

The probe ran against a local production build (`next start -p 3018`, tip 5b795cf sources) in claude-in-chrome; the server was stopped afterwards. Each needs-review item has automated real-browser coverage that ran green in CI on `ci/18-29` (run 45879391203: E2E chromium 789, firefox 692, webkit 695):

1. **Photo → lightbox morph (P4).** Tim answered P1–P7 with "Defaults (Recommended)", so P4 keeps the grid morph. `FigureTransition` (React `<ViewTransition>`) applies `photo-{slug}` only while a transition runs, so a resting figure reads `view-transition-name: none` in the DOM, as observed. The morph itself is pinned by `e2e/photos-lightbox.spec.ts` 'opening from the sequence morphs the figure into the lightbox photo @chromium-only' (and 'a step morphs nothing').
2. **Narrow widths (compact overview tier, full-bleed map below 640 px; one back link at 375 and 768).** The window could not be narrowed in this session; `e2e/photos.spec.ts` 'Overview sheet' (375/768/1024/1440) and `e2e/photos-region.spec.ts` 'Photo page trail and one way back' cover these widths.
3. **Overlap sweeps, layout shift, image sizes.** Covered by the overview/plate layout Jest sweeps (S 312–1100, 320–634) and the e2e geometry, `currentSrc` and stage-size rows.
4. **Lightbox focus return and leaving from the end card (18-16).** Covered by `e2e/photos-stepping.spec.ts` 'The end-of-series card' and the LBOX-08 / 10-REVIEW WR-01 focus-return rows in `photos-lightbox.spec.ts` and `photos-stepping.spec.ts`.
