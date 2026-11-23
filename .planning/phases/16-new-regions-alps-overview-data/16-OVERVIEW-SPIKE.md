# Phase 16: Alps overview spike (DATA-12, D-16 to D-21)

Run 2026-11-23 in the session scratchpad (plan 16-02, Task 1). Nothing here is overview build code: the scripts, tiles and renders stay outside the repository. This note records what was measured so Tim can fix the projection, contour variant, hillshade, size budget and summits before 16-13 writes the build (success criterion 4).

## Method

**Tiles (D-16).** The spike fetched `tileList.txt` from the public Copernicus DEM GLO-90 bucket (26,475 names, sha256 `e5a5efe0…f49ed97` on the day) and checked the 72 slots for latitudes 43-48 and longitudes 5-16. 71 are listed; the one absent slot, N43 E014 (Adriatic), was filled as 0 m. Every listed tile was read with geotiff `fromUrl` range requests at overview level 2 (300 x 300 px per tile, 300 px per degree), 6 in parallel, with up to 3 attempts per tile and a hard stop naming the tile if a listed one failed. All 71 arrived on the first attempt in 11.8 s.

**PixelIsPoint.** Every tile reports GTRasterTypeGeoKey 2 and an origin on the whole degree (for example N43 E009 at 9° E, 44° N), so the origin is a pixel centre. A level-2 pixel averages four full-resolution pixels, so its centre lies 1.5 full-resolution cells (0.00125°) east and south of the tile corner plus four cells per step. The mosaic sampler applies that offset (0.125 of a mosaic pixel) when resampling. At overview scale the shift is about 0.06 px, as RESEARCH predicted.

**Mosaic and grids.** The tiles form a 3,600 x 1,800 mosaic covering 5-17° E by 43-49° N. Negative heights and the sea slot are clamped to 0 m. The mosaic was resampled bilinearly (sampling each output pixel centre) to plate carrée with x scaled by cos 46.5°: a 1,200 x 872 grid (one cell is about 766 m) and a 750 x 545 grid (about 1,226 m). The highest cell on the 1,200 grid is 4,692 m.

**Contours.** Each variant ran d3-contour on the grid (or on a 3 x 3 box blur of it, edge-clamped), with levels every `interval` metres starting at `from` metres. Rings then went through a copy of `ringPaths` from `scripts/terrain/build-terrain.mjs` with the simplify tolerance as a parameter, and the result was serialised by the repository's own `lib/terrain/contour-paths.ts` (`openRuns`, `runToPath`, `contourSvg`, imported directly). The ring filter drops a ring whose bounding box is under N px in both width and height. Index contours use every 5th interval, as on the plates. Bytes are the raw SVG, brotli at quality 11 and gzip at level 9 (Node `zlib`). The run is deterministic: a second run gave identical bytes.

**Hillshade.** A copy of `shadeGrey8` with the repository's HILLSHADE lights (315°/45° weighted 0.75 plus 270°/55° weighted 0.25, gamma 1) and vertical exaggeration z = 3, using the grid's cell size, encoded with sharp as AVIF quality 50 and WebP quality 75 (the `encodePoster` settings). It was measured on the plain heights, which is the default, and also on the 3 x 3 blurred heights, because the RESEARCH calibration figures turned out to match the blurred heights (see the note under the hillshade table).

**Plate outlines (D-17).** Each plate's four corners were projected into overview UV, with u = (lon − 5) / 12 and v = (49 − lat) / 6. The Matterhorn plate (LV95 W 2,616,000 S 1,088,000 E 2,627,000 N 1,099,000) and the Ortler default plate (LV95 W 2,832,000 S 1,150,000 E 2,844,000 N 1,162,000) used `lv95ToWgs84` from `lib/geo.ts`. The Saalfelden plate (EPSG:3035 W 4,529,000 S 2,701,000 E 4,541,000 N 2,713,000) used an approximate inverse LAEA written in the scratch script: the ellipsoidal formulas from IOGP Guidance Note 7-2 with the latitude series truncated at the sixth power of e. Its forward formula reproduces the guidance note's worked example to 3 mm, and the corners round-trip to under 1 mm. The Saalfelden outline is therefore approximate, though far below a pixel; 16-13 replaces it with proj4.

**Previews.** Candidates A, C, E and F, plus C over the 750 px hillshade (plain heights, 55 % opacity), were rendered with sharp/librsvg to PNG at 375 px and 750 px wide. Contours are drawn as 1 device-pixel strokes to imitate `vector-effect="non-scaling-stroke"`, the three plate outlines in orange, and the five candidate summits as dots with short labels. No photo position appears in any render or in this note.

**Summits and notice.** The national services were queried directly where they answer without a key (results and gaps in `## Summits`). The licence PDF was downloaded again and the notice was copied from its text layer and checked against a 200 dpi render of page 20.

## Measurements

Contour variants (bytes of the shipped SVG text):

| Variant | Raw B | Brotli B | Gzip B |
|---------|------:|---------:|-------:|
| A: 1,200 x 872, no blur, 1,000 m from 1,000 m, simplify 1 px, no ring filter (levels 1,000-4,000) | 207,644 | 48,468 | 65,071 |
| B: 1,200 x 872, 3 x 3 blur, 1,000 m from 1,000 m, simplify 1.5 px, rings ≥ 8 px (levels 1,000-3,000) | 65,087 | 16,792 | 22,733 |
| C: 1,200 x 872, 3 x 3 blur, 1,000 m from 1,000 m, simplify 2 px, rings ≥ 8 px (levels 1,000-3,000) | 53,906 | 14,312 | 19,131 |
| D: 1,200 x 872, 3 x 3 blur, 500 m from 1,000 m, simplify 1.5 px, rings ≥ 8 px (levels 1,000-3,500) | 109,306 | 27,673 | 37,289 |
| E: 1,200 x 872, 3 x 3 blur, 1,000 m from 1,000 m, simplify 2 px, rings ≥ 12 px (levels 1,000-3,000) | 50,268 | 13,268 | 17,916 |
| F: 1,200 x 872, 3 x 3 blur, 500 m from 1,500 m, simplify 2 px, rings ≥ 12 px (levels 1,500-3,500) | 54,349 | 13,925 | 18,838 |
| C at 750 x 545: 3 x 3 blur, 1,000 m from 1,000 m, simplify 2 px, rings ≥ 8 px (levels 1,000-3,000) | 25,182 | 6,781 | 8,945 |

The six variants RESEARCH calibrated (A to F) agree with its pre-spike figures to within 1.7 % (largest gap: A raw, 207,644 against 210,959 B). The 3 x 3 blur pulls the highest cell below 4,000 m, so every blurred variant loses the 4,000 m rings of the highest massifs. That is why A has four levels and C three.

Hillshade posters (z = 3, AVIF q50, WebP q75):

| Hillshade | Width px | AVIF B | WebP B |
|-----------|---------:|-------:|-------:|
| Hillshade 1,200 x 872, plain heights | 1,200 | 115,927 | 194,594 |
| Hillshade 750 x 545, plain heights | 750 | 44,436 | 72,706 |
| Hillshade 1,200 x 872, 3 x 3 blurred heights | 1,200 | 71,545 | 117,938 |
| Hillshade 750 x 545, 3 x 3 blurred heights | 750 | 25,515 | 40,524 |

The hillshade figures differ from the RESEARCH calibration, and so from the plan's checkpoint option text, which quotes about 34 KB AVIF and 53 KB WebP at 750 px. The 1,200 px calibration (71,727 B AVIF) matches the blurred-height shading measured here (71,545 B), so the calibration evidently shaded blurred heights. With plain heights the 750 px poster costs 44,436 B AVIF and 72,706 B WebP; with blurred heights it costs 25,515 B and 40,524 B, softer but cheaper. The C + hillshade preview uses the plain-height 750 px poster.

Served totals for the candidates, contours as brotli plus one poster format, before the summit and plate data (well under 2 KB):

| Candidate | Poster | Contours br | Poster bytes | Total |
|-----------|--------|------------:|-------------:|------:|
| C | none | 14,312 B | 0 B | 14,312 B |
| E | none | 13,268 B | 0 B | 13,268 B |
| F | none | 13,925 B | 0 B | 13,925 B |
| C | 750 px plain-height AVIF | 14,312 B | 44,436 B | 58,748 B |
| C | 750 px plain-height WebP (fallback) | 14,312 B | 72,706 B | 87,018 B |
| C | 750 px blurred-height AVIF | 14,312 B | 25,515 B | 39,827 B |

Plate outlines on the 1,200 x 872 grid (D-17):

| Plate | Grid | Bounding box px | Top edge rotation | Largest corner offset from its bounding box |
|-------|------|-----------------|-------------------|---------------------------------------------|
| Matterhorn | LV95 | 14.25 x 14.43 | 0.21° | 0.06 px |
| Ortler | LV95 | 16.24 x 16.30 | 2.27° | 0.63 px |
| Saalfelden (approximate inverse LAEA) | EPSG:3035 | 16.48 x 16.29 | 2.17° | 0.61 px |

As RESEARCH predicted, grid convergence turns the Ortler and Saalfelden plates by about 2°, and a corner sits about 0.6 px from the bounding box. Storing the four projected corners keeps both drawing choices open for Phase 18.

Previews (scratchpad, not committed; absolute paths in the 16-02 SUMMARY):

| Candidate | 375 px | 750 px |
|-----------|--------|--------|
| A | preview-A-375.png | preview-A-750.png |
| C | preview-C-375.png | preview-C-750.png |
| E | preview-E-375.png | preview-E-750.png |
| F | preview-F-375.png | preview-F-750.png |
| C + 750 px hillshade | preview-C-hillshade750-375.png | preview-C-hillshade750-750.png |

What the previews show, for Tim to judge: at 375 px, A is a dense tangle of rings across the whole arc. C and E read as the arc with its main ranges, with the Jura, Apennines and Dinaric fringe as scattered outlines; E has slightly fewer specks. F keeps only the high Alps, with no Jura, almost no Apennines and a bare Po plain. The hillshade adds clear relief under C, including the plains' edges. At 375 px the Dufourspitze dot touches the Matterhorn plate outline, and the Zugspitze label runs into the Saalfelden outline, with the Grossglockner dot just below it. The preview labels are placed by hand; Phase 18 places the real labels (D-18).

## Summits

Positions are public summit positions in WGS84. Heights are metres above each country's own datum, as the source states them.

| Summit | Country | Height | Position | officialRef | Status |
|--------|---------|--------|----------|-------------|--------|
| Dufourspitze | CH (IT border) | 4,634 m | 45.9369 N, 7.8668 E (LV95 E 2,633,206 N 1,087,350) | https://map.geo.admin.ch/?lang=en&E=2633206&N=1087350&zoom=10 | Verified in RESEARCH (swisstopo SearchServer gazetteer point plus height service 4,634.1 m); not re-queried |
| Mont Blanc | FR / IT | Choose one: 4,806 m (IGN map value), 4,807.47 m (2026 survey), 4,805.59 m (2023 survey) | 45.83267 N, 6.86463 E (IGN BD TOPO / BD CARTO summit point, cleabs PAIOROGR0000000067336158, planimetric precision 5 m) | https://www.geoportail.gouv.fr/carte?c=6.86463,45.83267&z=15&permalink=yes | IGN map value confirmed this session: BD CARTO V5 `detail_orographique` gives `cote` 4806, nature Sommet, toponym "Mont Blanc". The 2026 and 2023 survey figures are secondary only (2026: euronews 2026-10-14, per RESEARCH); no IGN publication of either was reached |
| Grossglockner | AT | 3,798 m | 47.0745 N, 12.6939 E (BEV point MGI / Austria GK Central x −48,511, y 215,254, converted here with the EPSG:1618 Helmert parameters, approximate to a few metres) | https://data.bev.gv.at/geonetwork/srv/api/records/a6ea4096-8adc-4752-aac2-a4c115b8c12d (BEV DLM Bergnamen, edition 2020-12-18, OBJECTID 14342) | Confirmed against BEV: the DLM mountain-names layer gives HOEHE_MEER 3798, source "Herkunft KM50" (the ÖK50 map); its name field uses the German sharp s, written here with ss. This is the archived 2020 edition; the current DLM names edition (2025-03-25, GeoPackage) was not downloaded, and the Austrian Map viewer has no keyless lookup |
| Zugspitze | DE (AT border) | 2,962 m | 47.4211 N, 10.9864 E (GN250 point UTM 32N E 649,822.6 N 5,253,875.0) | https://daten.gdz.bkg.bund.de/produkte/sonstige/gn250/aktuell/ (BKG GN250, NNID DEBKGGND00002I7K, edition 31.12.2024) | Confirmed against the federal BKG GN250 names register ("Besonderer_Hoehenpunkt", HOEHE 2962). Not confirmed against LDBV BayernAtlas: its search service returned HTTP 403 without an API key |
| Triglav (optional 5th) | SI | 2,864 m | 46.3783 N, 13.8369 E | none | Not confirmed: the GURS e-prostor services returned HTTP 407 (proxy authentication) from this session, so height and position are the secondary figures from RESEARCH |

The IGN altimetry service returns 4,767.96 m from the RGE ALTI model at the Mont Blanc point. That is a model value at a 5 m planimetric point on a snow dome, not a summit height, so it is not offered as a choice.

## GLO-90 notice

Source: "Licence for COP-DEM-GLO-90-F Global 90m Full, Free & Open", Article 6(b) and 6(c), page 20 of `https://dataspace.copernicus.eu/sites/default/files/media/files/2025-06/copernicus_contributing_mission_data_access_v2_cop_dem_licenses.pdf`, downloaded 2026-11-23 (499,914 B, sha256 `bb4a01dc…c26c8701f`).

Adapted or modified data (applies, because the contours and any hillshade are derived):

> "produced using Copernicus WorldDEM™-90 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved"

Liability sentence (to be added "in a licence or any legal warning or notice" covering distribution to the General Public):

> "The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM™-90"

The trademark glyph was confirmed by eye on a 200 dpi render of page 20: the licence prints "WorldDEM" followed by a raised ™ and then "-90". The PDF's text layer carries the same character (U+2122), so the text above is copied, not retyped. On the page the adapted notice opens with a straight double quote and closes with a curly one (”) before the full stop; the liability sentence uses straight quotes. The quotes above mark the sentence boundaries and are not part of the notice. Article 6(d) also bars implying endorsement by the Provider, the Licensor or the programme.

## Decisions
