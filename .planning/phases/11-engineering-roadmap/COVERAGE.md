# API Coverage — geo.admin.ch REST API (manual trail-geometry fetch)

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Scope: `scripts/terrain/fetch-trails.mjs` (plan 11-04) is a manual, networked build script that runs once to
> fetch the official swisstopo hiking-trail geometry for the two trails Tim approves (D-07). It never runs in
> lint, data:check, prebuild or CI, and the site itself calls no geo.admin.ch service at request time.
> The api-coverage detector reported no integration signal for Phase 11 (2026-11-01); this matrix records the
> one real external API use anyway, so the seal-time gate has a decided surface.

| capability | decision | reason |
|---|---|---|
| SearchServer location search (type=locations, sr=2056) | INTEGRATE | |
| MapServer identify on ch.swisstopo.swisstlm3d-wanderwege (envelope, returnGeometry, geojson) | INTEGRATE | |
| MapServer find (attribute search) | OPT-OUT | not needed: identify over the trail's envelope returns every segment with its id |
| MapServer feature by id and htmlPopup | OPT-OUT | not needed: identify already returns geometry and feature ids for provenance |
| layer metadata, legend and layersConfig | OPT-OUT | not needed: the layer id is fixed and recorded in trails.json provenance |
| height service | OPT-OUT | explicitly out of scope: heights come from the committed Phase 8 DEM (08 D-17), not a live service |
| profile service | OPT-OUT | explicitly out of scope: profiles are sampled offline from the committed DEM with --check (D-05) |
| WMTS and WMS map tiles | OPT-OUT | not needed: no map tiles are shown; the sheet uses the Phase 8 raster |
| STAC data download (data.geo.admin.ch) | OPT-OUT | not needed here: Phase 8's fetch-dem already uses it for the DEM |
| coordinate transformation services | OPT-OUT | not needed: every request and result is LV95 (sr=2056) |
| shortlink, QR code, print and KML services | OPT-OUT | not needed: map-viewer features with no use in a build script |
