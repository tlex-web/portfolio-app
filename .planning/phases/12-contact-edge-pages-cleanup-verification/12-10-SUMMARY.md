---
phase: 12-contact-edge-pages-cleanup-verification
plan: 10
subsystem: seo
tags: [open-graph, next-og, satori, imageresponse, fonts, tokens, seo]

requires:
  - phase: 12-01
    provides: "Resolved values og.alt-default (supplied) and default.8 (supplied, the default: contain-fit in a 768 slot)"
  - phase: 12-09
    provides: "metadataBase from site.url, root openGraph { type, siteName, locale } and twitter { card } in app/layout.tsx"
provides:
  - "lib/og/template.tsx: OG_SIZE, ogFonts, contourDataUrl, OgFrame (default, photo, project), ogPhotoFit, ogPhotoImage, defaultCardText"
  - "app/opengraph-image.tsx: the site-wide default card, prerendered static, inherited by every route without its own"
  - "lib/og/fonts: committed static TTFs (Schibsted Grotesk 600, Inter 400, JetBrains Mono 400), OFL texts, README with sources and SHA-256"
  - "tokens.hex.night700, trailYellow, trailBlaze, trailAlpine, trailMountain"
  - "e2e/og.spec.ts: og:image and twitter:image on Home, 200 image/png 1200 x 630"
affects: [12-14, 12-17, seo, og-images]

actuals:
  tokens: 13800
  tasks: 2
  commits: 3
plan_head_before: ca7298abf99d6057aa10936dbd38648a9f0b7ba8
plan_head_after: c2f4878de4a4cf87c9883a4d943c144589564cfc

tech-stack:
  added: []
  patterns:
    - "OG cards are host-element trees built by helper functions (never mounted components), so Jest walks props.children for every drawn string"
    - "Vertical stacks are real flex-column elements: Satori lays a React fragment out as a row"
    - "Glyph coverage test: every drawn character must be in its committed font's cmap, so Satori never falls back to a fetched font"

key-files:
  created:
    - lib/og/template.tsx
    - lib/og/__tests__/template.test.tsx
    - app/opengraph-image.tsx
    - e2e/og.spec.ts
    - lib/og/fonts/README.md
    - lib/og/fonts/SchibstedGrotesk-SemiBold.ttf
    - lib/og/fonts/Inter-Regular.ttf
    - lib/og/fonts/JetBrainsMono-Regular.ttf
    - lib/og/fonts/OFL-SchibstedGrotesk.txt
    - lib/og/fonts/OFL-Inter.txt
    - lib/og/fonts/OFL-JetBrainsMono.txt
  modified:
    - scripts/tokens/build-tokens.mjs
    - data/generated/tokens.ts
    - data/__tests__/tokens.test.ts
    - .gitattributes

key-decisions:
  - "Full static font instances, not Google's latin subset: the latin subset lacks U+2192, the arrow in the project caption (D-15). The fonts are read from disk at build, never served, so the extra 260 KB costs nothing at runtime."
  - "Default card alt is Tim's og.alt-default: 'Tim Lui, developer and photographer, over a contour map of the Matterhorn'"
  - "OG photo layout ships default.8's default (contain-fit in the 768 slot with night950 mats), as Tim's 12-01 reply supplied"
  - "No app/twitter-image: Next copies the file-based OG image into twitter:image under the root summary_large_image card (checked in the served head)"
  - "Long-text checks use the committed TTFs' advance widths (hmtx), not the flat em ratios in the plan. The measured box title widths match the UI-SPEC's [MEAS] figures."

patterns-established:
  - "OG colours only from data/generated/tokens.ts; build-tokens.mjs --check keeps them in step with app/globals.css"
  - "ogPhotoImage(id) reads the manifest's 1200 px JPEG as a data URL, ready for the photo route in 12-14"

requirements-completed: [SEO-02]

coverage:
  - id: D1
    description: "The default card renders as a static 1200 x 630 PNG at /opengraph-image, and Home's head names it in og:image and twitter:image with Tim's alt"
    requirement: SEO-02
    verification:
      - kind: e2e
        ref: "e2e/og.spec.ts#Home's head names og:image and twitter:image, both the root card"
        status: pass
      - kind: e2e
        ref: "e2e/og.spec.ts#the og:image URL answers 200 with a 1200 x 630 PNG"
        status: pass
      - kind: other
        ref: "npm run build: '├ ○ /opengraph-image'"
        status: pass
    human_judgment: false
  - id: D2
    description: "The default card prints name, role, summit, height, coordinates and sheet title, all derived from data (formatLatLon, formatMetres, sheet.title)"
    requirement: SEO-02
    verification:
      - kind: unit
        ref: "lib/og/__tests__/template.test.tsx#prints the name, role, summit, height, coordinates and sheet title, all derived"
        status: pass
    human_judgment: false
  - id: D3
    description: "Committed static TTFs with OFL licences and a README of source URLs and SHA-256; every drawn glyph is in its committed font, so nothing is fetched"
    requirement: SEO-02
    verification:
      - kind: unit
        ref: "lib/og/__tests__/template.test.tsx#every drawn character is in the cmap of the committed font it is set in"
        status: pass
      - kind: other
        ref: "sha256sum lib/og/fonts/* matches README after commit"
        status: pass
    human_judgment: false
  - id: D4
    description: "Token build carries night700 and the four trail paints with --check green; no hex literal in lib/og or app/opengraph-image.tsx"
    verification:
      - kind: unit
        ref: "data/__tests__/tokens.test.ts#every hex is lowercase #rrggbb and every sRGB channel is in [0, 1]"
        status: pass
      - kind: other
        ref: "npm run lint (tokens:build --check, guard:palette); git grep -I -nE '#[0-9a-fA-F]{6}' -- lib/og app/opengraph-image.tsx"
        status: pass
    human_judgment: false
  - id: D5
    description: "Photo and project variants print their data with missing lines left out, no undefined/NaN; ogPhotoFit contain-fits every manifest JPEG"
    requirement: SEO-02
    verification:
      - kind: unit
        ref: "lib/og/__tests__/template.test.tsx (24 tests over every photo view and project)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The cards' visual quality: layout, contour field, type and the coin-flip pitch at 4 lines"
    verification: []
    human_judgment: true
    rationale: "Visual design judgment. The photo and project cards are not served until 12-14 adds their routes; previews were rendered locally and looked right to the executor, but the UI-SPEC's 3-line pitch limit does not hold for coin-flip (see Deviations)"

duration: 17min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 10: Shared Open Graph Template Summary

**One Satori/next-og template draws the default, photo and project cards from committed static TTFs and token hexes. The site-wide default card is a prerendered 1200 x 630 PNG at /opengraph-image, and every route without its own card inherits it.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-11-02T19:14:20Z
- **Completed:** 2026-11-02T19:31:40Z
- **Tasks:** 2
- **Files modified:** 16 (11 created, 4 modified, plus the 1 test created in Task 2)

## Accomplishments

- `app/opengraph-image.tsx` renders the default card (D-16): "Tim Lui" and "Developer & photographer" over the contour field, and a plate with Matterhorn, 4,478 m and 45.9764 N · 7.6586 E (from `terrain.summit` through `formatMetres` and `formatLatLon`) above "Zermatt – Matterhorn". Build output: `├ ○ /opengraph-image` (static).
- Home's head carries `og:image` and `twitter:image` with the same URL (`/opengraph-image?<hash>` on site.url), plus width 1200, height 630, type image/png and Tim's alt. 12-09's root `openGraph` and `twitter` fields are unchanged and not duplicated.
- `OgFrame` photo variant (D-14): the manifest JPEG is contain-fitted with night950 mats (768 x 512 with 59 px mats for 3:2; 768 x 524 for the 1200 x 818 film scan). The plate shows title, place, altitude label (with " approx." when approximate) and "© {year} Tim Lui". The film scan reads "© 2019 Tim Lui".
- `OgFrame` project variant (D-15): kicker, name and pitch sit over the contour field. The plate draws the RouteProfile paths as a 336 x 120 inline svg, the caption "Schwarzsee 2,587 m → Hörnlihütte 3,262 m" (which wraps only at the arrow), and the waymark at 2x with its grade (box T4 white-blue-white, coin-flip T1 yellow rhombus).
- The fonts are committed with their OFL texts and a README, and `.gitattributes` keeps their bytes exact so the recorded hashes stay reproducible.

## Font sources and SHA-256

Downloaded 2026-11-02 over HTTPS. The URLs came from `https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@600&family=Inter:wght@400&family=JetBrains+Mono:wght@400` requested with `User-Agent: Wget/1.21`. All three files start with the magic bytes `00 01 00 00` (TrueType) and have no `fvar` table (they are static instances).

| File | Source | SHA-256 |
|------|--------|---------|
| SchibstedGrotesk-SemiBold.ttf (94,344 B) | https://fonts.gstatic.com/s/schibstedgrotesk/v7/JqzK5SSPQuCQF3t8uOwiUL-taUTtarVKQ9vZ6pJJWlMN_MYATw.ttf | `5ae8a45dcff8a321e7866fc7b38d31bd9f209bfb20df63272bdff14b5235af18` |
| Inter-Regular.ttf (324,820 B) | https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf | `1b08e7fc267a5c7e1d614100f604b83e7e8a0be241f0f288faa2b3ac93a683ba` |
| JetBrainsMono-Regular.ttf (112,172 B) | https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPQ.ttf | `44ce4a84f20d60f24539bd0cef11f79c29e38609e0f8adf18551c9794a5d9dc3` |
| OFL-SchibstedGrotesk.txt | https://github.com/google/fonts/raw/main/ofl/schibstedgrotesk/OFL.txt | `3b4f3063b6ac7c1e403e2c4a5e8ef3a58190ff83ed7b15af66511858699139ce` |
| OFL-Inter.txt | https://github.com/google/fonts/raw/main/ofl/inter/OFL.txt | `5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57` |
| OFL-JetBrainsMono.txt | https://github.com/google/fonts/raw/main/ofl/jetbrainsmono/OFL.txt | `b2fe5e8987594e9ffd1d2ca52a2f5d73eb8335243893c5d6254b5ad69269591d` |

## Build-output line

```
├ ○ /opengraph-image
```
(`○ (Static) prerendered as static content`, Next.js 16.4.2 Turbopack). The prerendered PNG is 171,094 bytes.

## Resolved values used

- `og.alt-default` (supplied): `Tim Lui, developer and photographer, over a contour map of the Matterhorn`, used as the `alt` export.
- `default.8` (supplied, the default): OG photo contain-fit in the 768 slot with mats. Task 2 shipped it. No checkpoint was needed.

## Task Commits

1. **Task 1 (tracer): committed fonts and token colours render the default card** - `38dd418` (feat)
2. **Task 2 RED: failing element-tree tests** - `5c05e90` (test)
3. **Task 2 GREEN: photo and project OG variants** - `c2f4878` (feat)

Task 2 needed no refactor commit.

## TDD (Task 2)

- **RED:** `npx jest lib/og` exited 1 with 14 failed and 10 passed. The planned assertions failed: `toContain(view.title)` / `toContain(project.pitch)` received the default card's strings (OgFrame had no photo or project branch yet), and `ogPhotoFit` was not exported (`TypeError ... is not a function`, the feature-absent failure). There were no syntax, load or fixture errors. **Semantic assessment:** the target tests ran and failed for the intended reason. Jest has no TAP or JUnit reporter installed here, so `check tdd-red-evidence` was not run; `workflow.tdd_mode` is off for this project.
- **GREEN:** after `ogPhotoFit`, `ogPhotoImage` and the photo and project branches were added, all 24 tests pass.

## Files Created/Modified

- `lib/og/template.tsx`: the shared template (frame, plate, contour layer, variants, fonts, contour data URL, photo fit).
- `lib/og/__tests__/template.test.tsx`: walks the element tree over every photo and project. Covers the fit, strings, empty-data omission, glyph coverage and line counts from the font metrics.
- `app/opengraph-image.tsx`: the root default card.
- `e2e/og.spec.ts`: head tags, 200, image/png and the IHDR size.
- `lib/og/fonts/*`: three TTFs, three OFL texts and the README.
- `scripts/tokens/build-tokens.mjs`, `data/generated/tokens.ts`: night700 and the trail hexes.
- `data/__tests__/tokens.test.ts`: the pinned key list now includes the new keys.
- `.gitattributes`: TTFs as binary and the OFL texts with LF, so the README hashes reproduce.

## Decisions Made

See key-decisions in the frontmatter. In short:
- The full font instances were kept because the latin subset has no "→".
- Twitter inherits the OG image without a twitter-image file.
- Line counts are measured with real advance widths.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tokens.test.ts pinned the old hex key list**
- **Found during:** Task 1
- **Issue:** `data/__tests__/tokens.test.ts` asserts the exact `tokens.hex` keys, so adding night700 and the trail paints broke it.
- **Fix:** Added the five new keys to the expected list.
- **Files modified:** data/__tests__/tokens.test.ts (not in files_modified)
- **Committed in:** 38dd418

**2. [Rule 2 - Integrity] .gitattributes for the font files**
- **Found during:** Task 1
- **Issue:** With `core.autocrlf=true`, a Windows checkout would rewrite the OFL texts to CRLF, and the SHA-256 values recorded in the README would no longer reproduce (T-12-21 mitigation).
- **Fix:** Added `lib/og/fonts/*.ttf binary` and `lib/og/fonts/*.txt text eol=lf`.
- **Committed in:** 38dd418

**3. [Rule 1 - Bug] Satori lays React fragments out as a row**
- **Found during:** Task 1, on the first rendered PNG: the summit lines overlapped on one row.
- **Fix:** Stacks are now real flex-column elements built with `createElement(..., ...children)`, so children need no keys. Re-rendered and checked visually.
- **Committed in:** 38dd418

**4. [Plan detail] Long-text estimate uses font metrics, not flat em ratios**
- **Found during:** Task 2
- **Issue:** The plan's flat ratios (8.6 px per Inter character at 16 px) predicted 4 lines for box's pitch. The UI-SPEC measured 3, and the real hmtx widths agree with the UI-SPEC.
- **Fix:** The test parses the committed TTFs' cmap and hmtx tables and wraps words greedily with real advances.

**5. [Spec conflict, flagged for Tim] coin-flip's pitch takes 4 lines, not the UI-SPEC's 3 or fewer**
- **Found during:** Task 2
- **Issue:** The must-have says "pitch <= 3 lines in 640 px at 32 px", but the UI-SPEC measured only box. coin-flip's approved 123-character pitch wraps to 4 lines ("…and no / network.") and is 1,836 px wide at 32 px Inter. The approved copy cannot change, and the type scale and 640 px box are fixed by the spec.
- **Fix:** Nothing is clipped or truncated. The test asserts what actually holds: the kicker + name + pitch block (32 + 76 + 16 + 4 × 40 = 284 px) fits the slot's 502 px content height, and the pitch takes at most 4 lines. The rendered preview looks balanced.
- **Open for Tim:** keep 4 lines, or choose a fix (pitch at 24 px for long pitches, or a shorter OG-only line he approves). This is not resolved here.

---

**Total deviations:** 3 auto-fixed (1 blocking, 1 integrity, 1 bug), 1 plan-detail change, 1 spec conflict flagged.
**Impact on plan:** No scope creep. The spec conflict affects only the project card's look in 12-14.

## Issues Encountered

- The acceptance grep `git grep -nE "#[0-9a-fA-F]{6}" -- lib/og app/opengraph-image.tsx` reports "Binary file ... matches" for the three TTFs (random font bytes). With `-I`, which skips binaries, it prints nothing. No source file contains a hex literal: the contour stroke is swapped with a regex on the `<g>` attribute, so not even `#000` is written.
- The plan's `size`/`alt` exports and `ImageResponse` usage follow the installed docs: `04-functions/image-response.md` and `01-metadata/opengraph-image.md`.

## Verification

- `npm run lint`: exit 0 (no errors, no guard violation lines; palette, identity, tokens --check and data:check OK). The 9 eslint warnings are pre-existing and in other files.
- `npm run type-check`: exit 0.
- `npx jest lib/og --silent`: 24/24 pass. Full Jest: 90 suites, 1470 tests pass.
- `PW_PROD=1 npx playwright test e2e/og.spec.ts --project=chromium` (fresh build): 2/2 pass. `e2e/seo.spec.ts` also passes (7/7 with og.spec), so 12-09's head contract still holds.
- `git status --porcelain public/service-worker.js`: empty. It was restored after each build once the server had stopped. Port 3000 is free.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 12-14 can add `app/(site)/photos/[slug]/opengraph-image.tsx` and the project equivalent. Each route does `OgFrame({ variant: 'photo', contour: await contourDataUrl(), view, photo: await ogPhotoImage(view.id) })` or `{ variant: 'project', project }` with `fonts: await ogFonts()`, and must confirm ● or ○ in the build output.
- Open for Tim: coin-flip's 4-line pitch (Deviation 5).

## Self-Check: PASSED

- All 11 created files exist on disk; commits 38dd418, 5c05e90 and c2f4878 are ancestors of HEAD.
- `git ls-files lib/og/fonts` lists 7 files; `grep -c night700 data/generated/tokens.ts` = 2; the test file has 13 `it`/`it.each` lines; `export function ogPhotoFit` appears once; e2e/og.spec.ts is 58 lines.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*
