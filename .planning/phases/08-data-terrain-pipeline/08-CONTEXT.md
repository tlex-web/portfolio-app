# Phase 8: Data & Terrain Pipeline - Context

**Gathered:** 2026-10-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Build-time data that every later surface reads, plus one visible change:

- **Terrain:** swissALTIRegio DEM for the Zermatt–Matterhorn area → content-hashed 16-bit heightmap (512² desktop, 256² mobile), contour SVG(s) and a hillshade poster, with one shared coordinate contract (`lib/geo.ts`, terrain metadata).
- **Photo data:** EXIF from the four originals → committed, typed, zod-validated photo data with a CI staleness check; corrected editorial copy; a hand-placed approximate position for the film scan.
- **Images:** privacy-safe derivatives (resized, rotated, metadata-free) plus a manifest that components use; full-resolution files no longer served; a CI scan that enforces it.
- **Projects:** per-project typed highlight schemas; a numeric `riskScore` on every CLI_X demo command; `lib/trail-grade.ts`.
- **Footer (SHELL-04):** `SiteFooter` becomes a map-sheet margin drawn from the real terrain, with a scale bar and swisstopo attribution. This is the only UI change in Phase 8 (its UI-SPEC covers only the footer legend).

Requirements: DATA-01 … DATA-08, SHELL-04. Out of this phase: the Home hero (Phase 9), the Photos map, grid and lightbox (Phase 10), the case-study UI (Phase 11), deleting legacy variants and v1 alias definitions (Phase 12).

</domain>

<decisions>
## Implementation Decisions

### Photo facts & editorial copy
- **D-01:** The waterfall (`img-0629`, EXIF GPS 46.0081 N 7.7385 E, 1,715 m) is the **Gornerschlucht** (Gorner Gorge), as Tim confirmed. Record it as a `locationOverride` with the reason "EXIF GPS + confirmed by Tim". The "Teufelsschlucht" title, alt text, story and the `teufelsschlucht-trail-1` annotation (with its facts) are all wrong and get replaced. The Teufelsschlucht is near Hägendorf SO, not Zermatt.
- **D-02:** The film scan (`r004-011`, no GPS) shows the **Riffelsee (~2,757 m)**. Hand-place its pin on the lake's north shore (the classic Matterhorn reflection viewpoint), taking the coordinates from the swisstopo map during research. The data flags it approximate (e.g. `position.approximate: true` plus a reason), and every consumer must be able to show that flag (DATA-04).
- **D-03:** The film scan was shot in **2019 (year only)**. Its EXIF `DateTimeOriginal` (2020-02-12 15:38) is the **scan date** and must never be used as the capture date. The current `2021-07-21` is wrong too. The schema must support a year-precision capture (e.g. `capture: { year: 2019, precision: 'year', source: 'Tim' }`), so no day or month is invented. "© 2019 Tim Lui" follows from it.
- **D-04:** Capture dates for the three digital photos come only from EXIF (naive local time, stored with `Europe/Zurich`): img-0605 is 2021-09-06 10:48:46, img-0629 is 2021-09-06 11:22:57 and img-0662 is 2021-09-07 10:58:25. The filename-derived `captureDate` values (2022-02-01, 2022-07-29) are deleted.
- **D-05:** **Claude drafts all corrected copy and Tim approves it** before it ships, so the plan needs a review checkpoint. In scope: new stories for all four photos (img-0662 and r004-011 currently share the same "Glacier Trail" story), titles and alt text where facts change, and annotations. Rules: first person, short, factual. Every annotation fact must be checkable (DEM height, place names, sourced facts). Generic trivia that can't be sourced (Toblerone, "over 500 deaths", "visible from 100 km", the Glacier Paradise / Klein Matterhorn note on a Riffelsee photo) is cut or replaced with a sourced fact.
- **D-06:** The Glacier Trail copy is fixed against the data: img-0662 sits at ~2,597 m (EXIF) near the **Schwarzsee end** of the Matterhorn Glacier Trail (45.9908 N 7.7104 E), not at 2,900–3,100 m. Annotation altitudes must agree with the DEM-sampled height (DATA-03).
- **D-07:** **Descriptive slugs** for `/photos/[slug]` (e.g. `matterhorn-from-zermatt`, `gornerschlucht-waterfall`, `riffelsee-reflection`). The slug field lives in the photo data now. The old camera ids (`img-0605`, …) stay as internal keys tying editorial data to EXIF and derivatives. — **Reversibility:** one-way — once Phase 10 ships `/photos/[slug]`, the URLs get shared and linked, so renaming one needs redirects. Tim approves the final slug strings.
- **D-08:** **Year and season tags are derived from the capture date**, never hand-typed (img-0605 is tagged "2024" today, but it was shot in Sep 2021). Subject tags (e.g. `reflection`) stay hand-written in the editorial file. A year-only capture (the film scan) gets a year tag and no season tag.

### Originals, privacy & served images
- **D-09:** The 194 MB originals move to a **local, gitignored folder at the repo root, outside `/public`** (e.g. `assets/photos-original/`). Only Tim's machine runs the full extraction, and Tim keeps his own backup. Nothing photo-original is committed, Git LFS included, because the repo is **public** (`tlex-web/portfolio-app`).
- **D-10:** The **CI stale check is two-stage with fingerprints** (DATA-02):
  1. Locally, originals → a **committed EXIF sidecar**: the extracted fields with GPS already rounded to 4 decimals, so full precision is never committed, plus a sha256 per original.
  2. In CI, sidecar → typed photo data is re-derived and the build fails on any diff. CI also checks that the committed derivatives match the hashes in the image manifest. Run locally, `--check` additionally re-hashes the originals against the sidecar.
- **D-11:** **The full-resolution copies leave the site and HEAD.** `public/images/optimized/*UTC).jpg` and `*UTC).webp` (12480×8320 and 4712×3212, EXIF already stripped, ~85 MB) are committed and served on the live site today, and they are also the input of `prebuild` → `optimize-images.mjs` on Vercel. Once they are gone, Vercel cannot regenerate derivatives at build time, so **derivatives are generated locally and committed** (content-hashed), and the prebuild step must no longer depend on full-res inputs.
- **D-12:** **Git history is left as is (site only).** The GPS-bearing originals sit in public history at `287c2e9` (initial commit, deleted in `347d8e1`), and the full-res copies at `8fa0991`. Tim accepts that exposure; record it in the phase SUMMARY and PROJECT.md. No history rewrite and no force-push. — **Reversibility:** reversible — a later filter-repo purge stays possible as a separate step run by Tim.
- **D-13:** The **largest served image is 2560 px on the long edge** (the lightbox at 2× DPR, still far below print resolution, consistent with all rights reserved). The legacy `-large` (2400 px) files stay on disk until Phase 12, per the existing decision.

### Terrain framing, attribution & heights
- **D-14:** **Extent: an ~11 km square around all four photo spots and the summit**, ~21 m/px at 512². Zermatt sits near the NE edge, the summit near the W edge, and the Italian side below the summit is included (the reason swissALTIRegio was chosen). The same extent feeds both heightmaps, the contour SVGs, the hillshade, the footer band and the Phase 10 map. Reference points: Matterhorn 45.9763 N 7.6586 E, img-0605 46.0150 N 7.7414 E, img-0629 46.0081 N 7.7385 E, img-0662 45.9908 N 7.7104 E, Riffelsee ≈ 45.987 N 7.77 E (verify). — **Reversibility:** costly — changing it later moves every terrain UV, the Phase 9 camera route and the waypoint placement, and re-baselines every footer screenshot.
- **D-15:** **Attribution string:** the researcher pulls the exact source reference from the swissALTIRegio product documentation, because swisstopo's general terms say swissALTI and Regio products use product-specific wording rather than the plain "© swisstopo". The researcher quotes the source URL, and Tim confirms the string at plan review. It lives in one constant (e.g. in `data/site.ts`).
- **D-16:** **The static poster is hillshade + contours:** Swiss-style relief shading (Imhof tradition, NW light) rendered from the same DEM at build time as AVIF/WebP, with the contour SVG overlaid. Phase 9 uses it as the LCP and as the fallback without WebGL or motion. The poster asset is produced here.
- **D-17:** **Heights:** photo waypoints use **DEM-sampled heights** (EXIF altitude is 9–25 m off). The summit shows the **official 4,478 m** as a named constant, because a 10 m DEM rounds the peak off. The altimeter rail starts at the **lowest photo's DEM height**, so its start is data-driven, and the **HOME-04 / Phase 9 wording "1,626 m" is updated to match** (1,626.1 m is img-0605's EXIF altitude). Store both values where they differ (e.g. `elevationDem` vs the official constant) so the summit plaque and the rail stay consistent.

### Footer map legend (SHELL-04)
- **D-18:** The footer becomes a **map-sheet margin** in the style of a swisstopo sheet. Contents: a sheet title ("Zermatt – Matterhorn"), the contour interval ("Equidistance N m", read from the terrain metadata), a **true scale bar**, the corner coordinates, a "last surveyed" date and the attribution, next to the existing identity block and links. The scale bar must stay true at every breakpoint (computed from the rendered band's metres per pixel, or drawn in the same SVG coordinate space).
- **D-19:** **The contour art is a full-bleed band along the footer's top edge**, a horizontal crop of the real contours through the summit ("strip" LOD). The sheet-margin text sits in a grid below it, never on the lines.
- **D-20:** **The footer art carries decorative waypoint ticks** at the real photo positions (the Riffelsee one styled approximate). They are `aria-hidden`, not links, and add no tab stops.
- **D-21:** **The footer is static: no draw-in, no drift, no scroll-driven parallax.** This overrides research ARCHITECTURE §5's idea of footer contour parallax. It also keeps the Phase 7 rule that SiteFooter imports nothing from `motion/react` and that the screenshot baselines stay deterministic.

### Project highlights & riskScore (DATA-07)
- **D-22:** **`riskScore` values come from real CLI_X output.** Tim runs the four existing demo commands through CLI_X and supplies the scores, plus a Medium and a Critical example if he has them (Phase 11 needs those). The highlights plan stops at a **human-action checkpoint** to collect them. `riskScore` is required in the schema, so nothing ships with invented scores.

### Claude's Discretion
- **Season rule** for derived tags (meteorological, where Sep = autumn, vs astronomical): pick one, state it in the schema, and show Tim the resulting tags in the copy review (D-05). Under meteorological seasons the three Sep 2021 photos become "autumn", not today's "summer".
- **Heightmap encoding:** DATA-01, the ROADMAP research note (sharp `grey16` from a `Uint16Array`) and research STACK.md (16-bit grey PNG decoded with `fast-png`) agree. Research ARCHITECTURE.md §3 proposes terrain-RGB instead. The researcher resolves the conflict. The requirement wording (16-bit) wins unless research shows a concrete failure.
- Contour interval(s) and LODs, file naming and hashing scheme, the sidecar format, the manifest shape, the derivative widths and formats below 2560 px, the CRS math in `lib/geo.ts`, and how d3-contour (ESM-only, y-down) is kept out of Jest-imported components.
- The corner-coordinate format on the footer (WGS84 vs LV95) and the "last surveyed" source (DEM product edition vs terrain build date) go to the footer UI-SPEC.
- The exact Riffelsee pin coordinates, within D-02.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 8: Data & Terrain Pipeline": goal, success criteria, scope notes, research list, inputs from Tim
- `.planning/REQUIREMENTS.md`: DATA-01 … DATA-08, SHELL-04. HOME-04 wording changes per D-17
- `.planning/PROJECT.md` §Constraints (same-origin assets, attribution, photo rights, location privacy) and §Key Decisions (swissALTIRegio, film-scan approx. pin, originals out of /public, coordinates rounded and shown)

### Research (already done for the milestone; Phase 8 research builds on it)
- `.planning/research/SUMMARY.md`: Phase 8 section, Open Questions 1, 2, 5, 6, 7 and 12 (now answered by D-01 … D-17)
- `.planning/research/ARCHITECTURE.md` §3 (generated data: location, typing, `--check`, commit policy, cache headers), §5 (terrain components, `ContourField`, one contour asset for four consumers), §6 (typed highlights as a zod discriminated union, `lib/trail-grade.ts`). Note: D-07 replaces its `/photos/[id]` with descriptive slugs; D-21 overrides its footer parallax idea; the roadmap (alias usages codemodded here, definitions deleted in Phase 12) overrides its "aliases deleted at end of Phase 8"
- `.planning/research/STACK.md`: geotiff 3.0.5 (COG range reads), d3-contour 4.0.2, exif-reader 2.0.3, fast-png 8.0.0, swisstopo WGS84 ↔ LV95 formulas (no proj4), "don't resample float rasters with sharp"
- `.planning/research/PITFALLS.md` Pitfall 8 (legacy variants are live), 9 (build-time data CI can't see), 10 (geodesy/DEM placement), 11 (EXIF traps: time zones, orientation), 12 (originals with GPS re-leaking)

### Design system & shell (footer work)
- `.planning/phases/07-foundation-guardrails/07-UI-SPEC.md`: tokens v2, spacing scale, footer surface (`surface-raised`), typography roles, motion rule 3 (shell motion is CSS-only; SiteFooter imports nothing from `motion/react`)
- `e2e/visual/README.md`: visual baseline process. The footer change re-baselines every route; Tim commits the PNGs

### Guardrails that apply
- `scripts/guards/check-palette.mjs` + `scripts/guards/palette-ratchet.json`: no `dark:` variants, no stock palette or v1 names in new code
- `scripts/guards/test-count.mjs` + `scripts/guards/test-count.baseline.json`: test-count ratchet (Phase 8 starts from 206)
- `scripts/guards/check-contrast.mjs`: every new text/background pair (footer margin text) must pass

### External (swisstopo)
- https://www.swisstopo.admin.ch/en/conditions-geodata: OGD terms; swissALTI and Regio products have their own source wording
- https://www.swisstopo.admin.ch/en/source-reference-ogd-swisstopo: attribution FAQ
- https://opendata.swiss/en/dataset/swissaltiregio/resource/f8117254-95ac-4715-a8e9-06b040962c7a: swissALTIRegio listing ("Open use. Must provide the source")

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/site/SiteFooter.tsx`: the current plain identity footer (Server Component, Phosphor icons from `dist/ssr`, `bg-surface-raised border-t border-line`, `min-h-11` links). Extend it into the map-sheet margin; keep the identity block and links.
- `components/site/SiteChrome.tsx`: renders `SiteFooter` once per page (static variant for global-error, so the footer must work there too with no motion and no router).
- `data/site.ts` + `Site` type in `data/types.ts`: home for the attribution constant (typed, required string).
- `scripts/optimize-images.mjs`: the existing sharp pipeline (sm/md/lg × webp/avif/jpeg, idempotent). It reads from `public/images/optimized/`, the same folder as its full-res inputs, so it must be repointed at the new originals folder and stop running against committed full-res files.
- `components/ContourBackground.tsx`: v1 fake bezier contours, used only by the dead `GlassmorphismNav`. Not reused; the footer uses the real contour asset.
- `sharp` 0.35.5 (devDependency) and `zod` 4.4 are already installed.

### Established Patterns
- Guards are zero-dependency `.mjs` scripts under `scripts/guards/`, wired into `npm run lint`, with a selftest (`scripts/guards/selftest.mjs`). New `--check` steps and the GPS/metadata scan should follow this pattern.
- Tests are rewritten, never deleted (test-count ratchet). `components/__tests__/GalleryGrid.test.tsx` and other consumers of `data/landscapes.ts` must keep passing while the data shape changes.
- `data/landscapes.ts` has 12 live references to legacy `-large/-thumb` variants (Home LCP image, PhotoCarousel3D, GalleryGrid). They stay until Phase 12; the manifest arrives now and consumers migrate in Phases 9 and 10.
- Visual baselines come only from the CI `workflow_dispatch` container, at threshold 0.01. Tim commits the PNGs.

### Integration Points
- `public/service-worker.js`: cache-first for `/images/`, with a build-hash cache name. Hashed terrain and image assets need wiring into the precache and cache strategy (roadmap scope note).
- `proxy.ts` matcher (nonce CSP) plus `next.config.ts` headers: `/terrain/*` (or the chosen path) gets immutable cache headers, which is safe only with content-hashed names.
- `.gitignore` already ignores `public/images/landscapes/`. The new originals folder needs its own entry, and the old entry goes once the folder moves.
- `data/projects.ts`: `highlights` is a generic `Record<string, HighlightValue>` today; `demoCommands` hold `riskLevel` only (3 low, 1 high).

### Verified repo facts (from this discussion)
- EXIF (sharp metadata + IFD parse): all three digital photos are Canon EOS 6D Mark II with the EF24-105mm f/4L IS II USM and carry GPS. R004-011 has no GPS and only a scan date.
- The probed derivatives (`-sm/-lg/-thumb/-large` JPEGs and the full-res JPG/WebP copies) carry **no EXIF** (0 bytes). The CI scan must still check every served file and format.
- Repo `tlex-web/portfolio-app` is **public**; pack size ~407 MB.

</code_context>

<specifics>
## Specific Ideas

- The footer should read like the margin of a swisstopo national map sheet: sheet title, equidistance, scale bar, corner coordinates, attribution.
- The poster follows the Swiss relief-shading tradition (Eduard Imhof), NW light.
- The waterfall copy should describe the Gornerschlucht (the Gornera river gorge just south of Zermatt). The Riffelsee copy is the mirror reflection seen from the lake.

</specifics>

<deferred>
## Deferred Ideas

- **Git history purge** of the GPS-bearing originals (`287c2e9`) and the full-res copies (`8fa0991`): declined for now (D-12). It could still run later as a separate step by Tim (git filter-repo, force-push every branch, GitHub Support cache purge), at the cost of changing every commit SHA cited in `.planning/`.
- **Medium and Critical CLI_X demo commands:** Phase 11 needs them. Tim may supply them at the Phase 8 riskScore checkpoint (D-22), which would save Phase 11 a trip.

</deferred>

---

*Phase: 08-data-terrain-pipeline*
*Context gathered: 2026-10-24*
