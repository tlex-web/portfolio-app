---
phase: 18-immersive-survey-layout
plan: 08
subsystem: ui
tags: [region-page, photo-sequence, map-collar, header-slot, srcset, sizes, view-transitions, server-components]
status: complete

requires:
  - phase: 18-01
    provides: "P3 and P4 at the defaults (Tim: Defaults (Recommended)): cover pillarboxed in a 16:9 slot; the grid morph carried over to photos opened from the region page"
  - phase: 18-06
    provides: "RegionHeader band, NextRegion (section#next-region) closing the page"
  - phase: 18-07
    provides: "Share region in the header band (failurePlacement 'row' after the post-plan fix)"
provides:
  - "lib/photos/image-sizes.ts: CONTENT_MAX_PX 1088, GUTTER_PX {16,24,32}, WIDE_FROM_PX 1216, RAIL_COLUMN_PX 96, RAIL_GAP_PX 24, NAV_PX 64, FIGURE_CHROME_PX 192, FIGURE_MIN_PX 256, PHOTO_COLUMN_MAX_PX 968; figureSizes(ar) and headerSlotSizes(ar)"
  - "components/photos/region/SequenceFigure.tsx: li#photo-{slug} (tabIndex -1, data-sequence-item) holding one figure: top collar, neatline ring, eight outside ticks, the photo link (data-photo-id), the caption. Exports collarParts(strip)"
  - "components/photos/region/RegionSequence.tsx: section[data-region-sequence] gallery band, head row with 'Skip to next region', the ordered list, an empty div[data-region-rail-column] (6rem, from 768 px) for 18-12, the rights line. Exports countLabel(n)"
  - "components/photos/region/HeaderSlot.tsx: div[data-region-header-slot] 16:9 cover box and the h-11 caption row with an empty span[data-header-control] for Phase 19"
  - "components/photos/region/FigureTransition.tsx: client island, photo-{slug} morph name while no photo is open"
  - "components/photos/ExifStrip.tsx now exports ListLine, ListRow and exifLineRows (markup unchanged)"
affects: [18-09, 18-10, 18-12, 18-14, 18-19, 18-24, 18-25, 18-29, e2e/photos-region.spec, Phase 19 header video]

actuals:
  tokens: 15300    # chars/4 over the plan's code diff (git diff 3e298e0..df4f8e8 = 61,117 chars incl. context)
  tasks: 2
  commits: 3       # git rev-list --count 3e298e0..df4f8e8; the metadata commit follows
plan_head_before: 3e298e005e344f5deb46c0d431981f9d77d8730f
plan_head_after: df4f8e840c720af8cbf7b9b796c2e9d01bfc878f

tech-stack:
  added: []
  patterns:
    - "sizes strings built from exported layout constants, with a Jest source scan that pins the Tailwind classes spelling the same values (the lightbox-tiers parity precedent)"
    - "Map-collar ticks positioned on an aria-hidden -inset-px frame (the ring's outer box), so 8 px strokes continue the neatline outward using scale classes only"
    - "e2e srcset gate: chosen candidate's descriptor >= painted width x DPR, the next smaller candidate < that, and the decoded file's own pixel width >= that (catches descriptor lies)"

key-files:
  created:
    - lib/photos/image-sizes.ts
    - lib/__tests__/image-sizes.test.ts
    - components/photos/region/SequenceFigure.tsx
    - components/photos/region/FigureTransition.tsx
    - components/photos/region/RegionSequence.tsx
    - components/photos/region/HeaderSlot.tsx
    - components/photos/region/__tests__/SequenceFigure.test.tsx
  modified:
    - "app/(site)/photos/regions/[region]/page.tsx"
    - components/photos/ExifStrip.tsx
    - e2e/photos-region.spec.ts
    - .planning/phases/18-immersive-survey-layout/deferred-items.md

key-decisions:
  - "The widest sizes term starts at 1216 px (WIDE_FROM_PX), not at the container's 1152 px max: 100vw includes a classic scrollbar, and 64 px of slack keeps every term an upper bound, so no breakpoint under-fetches"
  - "The figure link's name is an aria-label (alt + ', open in the photo viewer'), not an sr-only suffix after the img: dom-accessibility-api, and browsers too, insert a space between the img's alt and the suffix ('foreground , open …')"
  - "The header slot is full-bleed on phones through a block box with auto width and -mx-4 (no w-full). With the UI-SPEC's literal 'w-full -mx-4' the box would be 343 px, shifted left, not 375 px"
  - "Figure links use scroll={false}, as the grid tiles do, so opening the lightbox over the region page leaves the page where it is"
  - "The sequence caption prints the EXIF lines through ExifStrip's ListLine/exifLineRows (now exported), so the caption and the viewer strip cannot drift apart"
  - "P3 and P4 applied as Tim's defaults (18-01): a 16:9 cover box with object-contain; FigureTransition names each figure's image box photo-{slug} while no photo is open. The header cover never carries a name"
  - "REGION-02/03/04 stay Pending, as in 18-06 and 18-07: 18-14 baselines the region pages and 18-29 closes the phase; both list these requirements"

requirements-completed: []  # REGION-02, REGION-03, REGION-04 stay Pending; this plan builds the header slot, the sequence and the collar. 18-09/18-10 (plate), 18-12 (rail), 18-14 (baselines) and 18-29 complete them

metrics:
  duration: "about 21 min (11:59Z to 12:20Z 2026-11-25)"
  completed: 2026-11-25
---

# Phase 18 Plan 08: Header slot and the uncropped photo sequence in map collars Summary

**Each region page now opens with its cover in Phase 19's 16:9 box, then shows every photo in a full-width sequence on gallery-black: uncropped, framed in a map collar (the position at its own precision above, a 1 px neatline and eight 8 px corner ticks outside the image), with an always-visible caption. Every image's `sizes` comes from the layout constants. The e2e at 375, 768 and 1440 checks the srcset choice, the decoded file width, the geometry and overflow.**

## Performance

- **Duration:** about 21 min
- **Started:** 2026-11-25T11:59:42Z
- **Completed:** 2026-11-25T12:20:09Z
- **Tasks:** 2 (3 commits: tracer feat, TDD test RED, TDD feat GREEN)
- **Files:** 7 created, 4 modified

## Accomplishments

- **`lib/photos/image-sizes.ts`** (pure, import-free):
  - `figureSizes(ar)` = `(min-width: 1216px) min(968px, cap), (min-width: 768px) min(calc(100vw - 168px), cap), min(calc(100vw - 32px), cap)`, where cap = `max(256px, calc((100vh - 256px) * ar))` and ar is printed to 4 decimals.
  - `headerSlotSizes(ar)` = `1088px / calc(100vw - 64px) / calc(100vw - 48px) / 100vw`, each times min(1, 9/16 · ar), so a 3:2 cover gives `918px … * 0.8438` and a 16:9 cover gives the plain box widths.
  - Every number comes from the exported constants.
- **SequenceFigure:**
  - The `li#photo-{slug}` is the jump target (tabIndex -1, the global scroll-margin).
  - The collar is the strip's Position value at its own precision ('≈ ' when approximate), plus `±100 m` when a radius exists. Without a position there is no element.
  - The `ring-1 ring-line-strong` neatline turns `ink-muted` on hover and `ink` on `:target` (`group-target`, checked in the built CSS).
  - Eight `bg-ink-muted` 1 px × 8 px ticks continue the neatline outward from its outer corners.
  - The stage `<picture>` is lazy and `object-contain` in an `aspect-[var(--ar)] bg-surface-overlay` box.
  - The caption is the title, then the data line (`n / N ·` is `md:hidden aria-hidden`), then the EXIF lines or the film line.
- **RegionSequence:** a full-bleed `bg-gallery mt-16 py-12 md:py-16` band, the head row (h2, `{n} photographs, lowest first`, Skip to next region), the `md:grid-cols-[minmax(0,1fr)_6rem] md:gap-6` grid with an empty rail column, the `<ol aria-label="{name} photographs, lowest first">`, then the rights line. Nothing in the band clips overflow (Pitfall 10, Jest-asserted).
- **HeaderSlot:** the cover in the 16:9 gallery box. It is full-bleed below 640, `object-contain`, eager, `fetchPriority="high"`, `alt=""`, and has no view-transition name. Below it is the `h-11` caption row `{title} · {altitudeLabel}` with an empty 44 px `data-header-control`.
- **FigureTransition:** the TileTransition rule for the sequence (`photo-{slug}`, `share="morph"`, `default="none"`, only while `slugFromPath(usePathname())` is null). Its doc block doesn't name TileTransition (18-24's grep).
- **The region page** now runs: header band → header slot → facts (container) → sequence band → next region. The text photo list is gone.

## Task Commits

1. **Task 1 (tracer): figureSizes, the collar and caption, the gallery band, e2e uncropped and ticks outside**, `8d30564` (feat). Tracer gate: interactive, end-of-phase, automated verify. The verify passed end to end before expansion: Jest image-sizes + lightbox-tiers + components/photos 134/134, then `PW_PROD=1` photos-region 60/60 on Chromium and Firefox.
2. **Task 2 (tdd): header slot, the morph rule, the phone counter, the geometry, sizes and overflow gates**
   - RED `6364416` (test). 6 of 17 failed. The five `headerSlotSizes` rows failed on their `toBe`/`toContain`/`toThrow` assertions against a stub that returns the UI-SPEC starting point and ignores the ratio. The HeaderSlot source scan failed on ENOENT, because the file did not exist yet. Classifier: `RED_EVIDENCE_OK` (junit, target 'applies the contain factor to every box width for a 3:2 cover'). Semantic check: the target ran and failed on the planned string assertion. There was no load, syntax or fixture fault. The 11 passing rows are Task 1's figureSizes and constants, the SequenceFigure/RegionSequence parity scans that Task 1 already satisfies, and the 2.4-vs-16:9 row, which the stub passes trivially.
   - GREEN `df4f8e8` (feat). image-sizes 17/17, the new SequenceFigure suite 26/26, and the plan's verify `PW_PROD=1` photos-region + photos-lightbox **226/226 on Chromium and Firefox, 0 flaky** (fresh build).

**Plan metadata:** the docs(18-08) commit that follows.

## Client JS (record-only; enforced at 18-25 and 18-29)

`rm -rf .next/static && npm run build`, then a byte sum of `.next/static/chunks/**/*.js`:

| Point | Total | Files | vs running total 1,861,419 B | vs cap 1,855,841 B |
|---|---|---|---|---|
| After the 18-07 Share fix (orchestrator's running total) | 1,861,419 B | n/a | 0 | +5,578 |
| **18-08 final (after df4f8e8)** | **1,861,681 B** | **25** | **+262** | **+5,840** |

The +262 B is FigureTransition, the plan's one client island, which the P4 morph needs. Every other new component is a server component. This plan adds no needless JS, so nothing was traded back here.

## Verification

- Full Jest: 126 suites, **2,524 tests passed**. `npm run type-check` 0. `npm run lint` 0 (test-count scan OK).
- Task 1 verify: Jest 134/134; `PW_PROD=1` photos-region **60/60** on Chromium and Firefox.
- Task 2 verify: Jest image-sizes 17/17; `PW_PROD=1` photos-region + photos-lightbox **226/226**, 0 flaky.
- Extra, on the same production build:
  - audit, keyboard, seo, offline and og rows filtered to region/JSON-LD/offline gave 44/44.
  - The full audit + keyboard specs on both engines gave 58/59. The one failure was the known Firefox `/offline` "Page crashed" flake (deferred-items.md, 18-06). A Firefox audit rerun gave 16/16.
- e2e rows added (every region × 375/768/1440, data-driven, no literal coordinates):
  - The sequence order equals `regionPhotoViews`.
  - The count label is checked.
  - Each figure's ratio is within 1 % of natural.
  - All 8 ticks stay off the image rect and inside the page.
  - The caption title is visible without hover.
  - `n / N` is visible below 768 and hidden from 768.
  - The srcset fit holds: descriptor ≥ painted width × DPR, the next smaller candidate is below that, and the decoded file is at least that wide.
  - `scrollWidth ≤ clientWidth`.
  - The rail column is hidden below 768 and 96 px from 768.
- Header slot rows:
  - alt '', eager, fetchpriority high.
  - A 16:9 box with `object-fit: contain`.
  - No view-transition name anywhere in the slot.
  - Full-bleed at 375.
  - Its srcset fit, measured on the contained width.
  - The caption text is `{title} · {altitudeLabel}`, the row is 44 px with scrollHeight ≤ clientHeight and ≤ 2 lines, and the control slot is an empty 44×44 span with aria-hidden.
- D-06: after a 2,000 px scroll on Zermatt at 375 and 1440 the banner is visible at y 0.
- Morph, Chromium: the open records the `photo-{slug}` group/old/new pseudos, with no duplicate-name console message.
- Reduced motion, both engines: no `::view-transition` pseudo runs on open, and focus lands on Close photo.
- `node scripts/ci/check-snapshot-commit.mjs --sha <sha> --none`: OK (0 changed) on 8d30564, 6364416 and df4f8e8. No PNG was staged; region pages are not baselined until 18-14.
- `public/service-worker.js` was restored after every build. Both `next start` servers I launched on :3000 were stopped.
- Acceptance greps: `export function figureSizes` 1; `data-region-sequence` in RegionSequence 1; `data-region-header-slot` in HeaderSlot 1; `fetchPriority="high"` in HeaderSlot 1. FigureTransition names TileTransition 0 times.

## ui-ux-pro-max

The ux-domain searches were "lazy loading images", "responsive images srcset sizes" and "reserve space image layout shift". They returned:

- Lazy Loading (Medium): lazy-load below-fold images. Applied to the sequence.
- Alt Text (High): descriptive alt on content images. The sequence images carry the editorial alt. The header cover's `alt=""` is the UI-SPEC's recorded duplicate-avoidance exception, because the same photo follows in the sequence with its alt and caption.
- Image Scaling (Medium): images scale with their container.
- Breakpoint Testing (Medium): 375/768/1440 are all under test.
- Font Loading (Medium): reserve space. The aspect boxes reserve the image space, so CLS is 0.

These agree with the UI-SPEC's own UUPM rows. No new token was added.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The header slot would not be full-bleed with `w-full -mx-4`**
- **Found during:** Task 2
- **Issue:** The plan's class list `relative aspect-video w-full bg-gallery -mx-4 sm:mx-0` gives a 343 px box shifted 16 px left at 375. `w-full` fixes the width to the container's content box.
- **Fix:** `relative -mx-4 aspect-video bg-gallery sm:mx-0` (auto width takes the negative margins). The e2e asserts left 0 and width = the page width at 375.
- **Files modified:** components/photos/region/HeaderSlot.tsx
- **Commit:** df4f8e8

**2. [Rule 1 - a11y] The figure link name had a stray space before the comma**
- **Found during:** Task 2 (the new SequenceFigure Jest)
- **Issue:** With the plan's sr-only `, open in the photo viewer` after the img, the computed name read '… foreground , open in the photo viewer'.
- **Fix:** an `aria-label` of `${alt}, open in the photo viewer` on the link. The img keeps its alt.
- **Commit:** df4f8e8

**3. [Rule 3 - Blocking] An existing lightbox row read the title from the link text**
- **Found during:** Task 1
- **Issue:** 'a photo link opens the lightbox over the region page' took `link.textContent()` as the dialog's expected name. The figure link has no title text, only the image.
- **Fix:** the row now reads the title from `publishedViews`. The assertion is unchanged.
- **Commit:** 8d30564

**4. [Rule 1 - Test bug] Two e2e measurements, corrected before commit**
- In the srcset fit, the header `img` box is the whole 16:9 slot, but `object-contain` paints a narrower image. The fit now uses the contained width, min(w, h · natural ratio).
- For page width, Chromium's stable scrollbar gutter is counted in `documentElement.clientWidth` (375) but not in the page (365). The rows measure against the full-bleed sequence band instead. A probe confirmed the slot at left 0 and width 365 = the page width.
- **Commit:** df4f8e8

**5. [Design detail] Not in the plan's file list, inside its scope**
- ExifStrip exports `ListLine`, `ListRow` and `exifLineRows`, so the caption's EXIF lines are formatted by the strip's own code (lightbox/photo-page markup unchanged).
- `components/photos/region/__tests__/SequenceFigure.test.tsx` covers the prohibition rows (precision, never over the image) with `verification: test`. It also covers collarParts with placeholder values, countLabel (1 photograph) and every real figure. Collars are compared with the view's own strip values, so no coordinate is written in the file.
- Figure links use `scroll={false}`, as the grid tiles do.
- The RED commit carried a `headerSlotSizes` stub (the UI-SPEC starting point), so RED failed on assertions and not on a missing export.

---

**Total deviations:** 5 (2 bugs, 1 blocking, 1 test bug, 1 design detail). **Impact:** no scope creep. No baselined page changed pixels: ExifStrip's markup is byte-identical (the same code, moved into exported functions), and check-snapshot-commit reported 0 changed.

## Deferred Issues

Logged in `deferred-items.md`:
- **Portrait srcset descriptors (for 18-19).** `imageSet` (view-model.ts:203-204) uses the long edge as each `w` descriptor, so a portrait's descriptor claims 4/3 of the file's width. At DPR 1 (every local and CI project) nothing is under-fetched; the new e2e decodes each chosen file and checks its pixel width. At DPR 2 a portrait figure would take a 768 px file for a 966 px need. The fix (`v.width`) changes baselined tile and stage srcsets, so it belongs with 18-19's stage `sizes` and its re-baseline.
- **The Firefox /offline audit flake** recurred once (see above). It is untouched by this plan.

## Known Stubs

- `div[data-region-rail-column]` is empty on purpose. 18-12 fills it with the altimeter rail.
- `span[data-header-control]` is empty on purpose. It is Phase 19's reserved pause-control space (UI-SPEC: "no element rendered in Phase 18").

Neither blocks this plan's goal.

## Threat Flags

None. No new endpoint or trust boundary.
- T-18-21 is mitigated. The collar prints the strip's precision-aware Position value. Jest compares it with the view's own value, and the e2e and Jest files hold no literal coordinate.
- T-18-22 is mitigated. Only the manifest's content-hashed stage AVIF/WebP derivatives are referenced.

## Next Phase Readiness

- 18-09/18-10 can link `#photo-{slug}`. The `li` targets exist with tabIndex -1, and `:target` already turns the neatline `ink`.
- 18-12 mounts the rail inside `div[data-region-rail-column]` (96 px from 768). No ancestor clips overflow.
- 18-14's region baselines should wait for each figure image to load (lazy), as `loadFigure` in photos-region.spec does.
- 18-19 should consider the portrait descriptor fix together with the stage `sizes`.

## Self-Check: PASSED

- All 7 created files exist.
- Commits 8d30564, 6364416 and df4f8e8 are ancestors of HEAD.
- The four acceptance greps each print 1.
