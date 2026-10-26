# Phase 10 — UI Review

**Audited:** 2026-10-26
**Baseline:** 10-UI-SPEC.md (approved, amended 487e113) plus Tim's STATE.md deviations (zoomed-photo drag block, 16 px map clearance, grid rows 224/280, previous/next via history.replaceState), checked against ui-ux-pro-max rules
**Screenshots:** Not captured locally. I used the committed CI baselines (Linux, reduced motion, dark) in e2e/visual/routes.spec.ts-snapshots/{photos,photos-grid,photos-carousel,photo,lightbox}. The photos, photos-grid, photos-carousel, photo and lightbox sets were viewed at 375/768/1440 where noted. No dev server was started.
**Interaction captures:** off (workflow.ui_interaction_capture is false). All interaction findings are code- or spec-derived.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Contract copy is met; the legend and EXIF lines wrap awkwardly mid-phrase |
| 2. Visuals | 3/4 | Clear focal points on every surface; the 375 stepper frame wastes about 40% of its height |
| 3. Color | 4/4 | Tokens only (no hex in components); accent confined to the declared uses |
| 4. Typography | 4/4 | Only the four declared sizes and two weights; no text-xs/lg or font-bold/medium found |
| 5. Spacing | 3/4 | The scale is held; the desktop map is a 660 px island with dead margins, and the fixed-box map plates cover a lot of relief |
| 6. Experience Design | 3/4 | State coverage is strong; two Tim-approved exceptions to the contract are open, and the 3D carousel and 1024x768 tier are unverified |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **Carousel stepper at 375 leaves the photo small in a tall frame** (WARNING). The photo is about 290 px wide inside a 448 px frame, with roughly 200 px of empty surface above and below. The focal point is weaker on phones than the grid tile. Fix: size the frame box to the photo's ratio on the stepper (keep `h-[28rem]` only for the 3D scene), or cap the frame at `aspect-ratio` plus padding.
2. **Strip mono lines break mid-phrase at 768 and 1440** (WARNING). The EXIF line splits before "ISO 100". The shortcut legend splits "H labels ·" from "Esc close" or "Esc all photographs". The place line wraps "Zermatt, / Switzerland" at 375. The spec's nowrap units are not applied to every separator group. Fix: wrap each ` · `-joined unit in `whitespace-nowrap` and use `text-balance`, or let the legend be a flex-wrap row of `<kbd>` pairs.
3. **Document the two accepted deviations and put them in UAT** (WARNING). The zoomed-photo drag block contradicts spec line 393 ("no drag blocking"). The 1024x768 key tier shrinks the photo. Neither is a defect against Tim's decisions. Both need a recorded UAT line so they are not re-flagged as regressions or silently lost.

Minor, not in the top 3:
- The map at 1440 is 660 px centred in a 1088 px container, with 200+ px of empty ground each side (spec-intended; consider a wider sheet if "fit first viewport" can be relaxed).
- The Riffelsee plate at 1440 is within 14 px of its dot, so the leader is nearly invisible.
- The photo-page chrome packs "All photographs", the prev/next buttons and the counter with no separation, so the leading link reads as part of the stepper cluster. A divider or more gap would help.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)
- Kicker `4 waypoints · 1,617–2,760 m · Zermatt`, h1 `Photographs`, view names Map/Grid/Carousel, and the map margin line `Zermatt – Matterhorn · contours every 100 m` / `Terrain: swissALTIRegio, swisstopo` all match the contract (photos baselines).
- Map plates show `2,760 m approx.` and the grid caption `Riffelsee · 2,760 m approx. · 2019`; the strip shows `Film scan · 2019` and `≈ 45.9837 N 7.7623 E · ±100 m (approx.)`. The film-scan and approximate-position rules are met.
- "Open photo" is the single accent CTA at 375 (photos-carousel). The viewer's visible chrome words (Hide labels, Zoom, Close) appear from 768 px as specified.
- Voice is plain with no filler, and no `—`, `undefined` or `null` appeared in the five viewed strips.
- Deductions: the legend shows `← → photos · Z zoom · H labels · Esc close`, so the key glyphs read as ordinary mono text rather than `<kbd>` pairs (the baseline shows no key styling). The 375 lightbox place line hard-wraps "Zermatt, / Switzerland".

### Pillar 2: Visuals (3/4)
- Each surface has the anchor the spec names: the map sheet (photos), the first-row images (grid), the stage photo (viewer). The header band stays compact and never competes.
- The grid at 1440 gives two rows of two (224/280 deviation, approved). The second row leaves the right third empty because of the filler tile, which looks unfinished next to the full-width first row. This follows from the approved justified-row rule, so it is a WARNING, not a defect.
- The 375 stepper frame: the photo sits in a tall empty frame (photos-carousel 375), so the focal point is weak.
- Icon-only buttons at 375 (Hide labels, Zoom, Close) carry the spec's accessible names, and the 24 px icons are consistent Phosphor `regular`.
- The summit marker and the approximate dashed dot are legible on the relief. Gutter leaders read well on the bright photo (lightbox 1440).

### Pillar 3: Color (4/4)
- `grep` for hex, `rgb(`, `bg-white` and `bg-black` in components/photos and app/(site)/photos found no matches in the components (the one `[…]` match was the nav-width arbitrary variant, not a colour).
- Accent appears only on the selected-segment bar, "Open photo", the expanded hotspot and source links. The map labels, chrome and pressed toggles use ink and gallery tokens. The baselines show exactly one accent fill per page.
- The new gallery contrast pairs are in the contract. I did not re-run the guard; I am relying on the plan summary.

### Pillar 4: Typography (4/4)
- Four sizes (text-sm, text-base, text-heading, text-display) and weights 400/600 only; Mono is used for data throughout (altitudes, EXIF, counter, margin line). No size or weight violations were found by grep.

### Pillar 5: Spacing (3/4)
- Arbitrary values are limited to the declared geometry (`h-17` = 68 px, `w-36`, `w-64`, `h-[28rem]`, `@min-[35rem]` tiers). I found no free pixel offsets.
- The 375 header band wraps the switcher under the title with a consistent 16 px gap. The sheet is full-bleed as specified.
- At 1440 the map plates stack on the left of their dots in two clusters (Zermatt/Gornerschlucht, Glacier Trail/Riffelsee), covering a large area of the relief, with an 8 px gap between plates (spec-compliant).
- The 768 lightbox leaves about 110 px of black above and below the photo. That is the contain-fit result and is acceptable.

### Pillar 6: Experience Design (3/4)
- Covered by the contract and code: a no-wrap stepper with `aria-disabled` ends, a polite live region, the focus trap and return-focus order, the 1 s "Loading photo" state, a Retry error state, and the reduced-motion paths. The baselines show the disabled Previous at 1 / 4 and the pressed-state inversion.
- Accepted deviations (not scored down individually, flagged for UAT): the zoomed-photo drag block versus spec line 393; map clearance 16 px; previous/next through history.replaceState.
- Open and unverified here: the 3D carousel look at 1280/375 (canvas is hidden in baselines), the stepper look, the 1024x768 key tier shrinking the photo, and WebKit on localhost (CSP upgrade-insecure-requests). These are already UAT items.
- The swipe, zoom and hotspot interactions were not exercised, because interaction capture was off and no browser session was run.
- No registry audit: no `components.json`.

---

## Files Audited
- 10-UI-SPEC.md (lines 1-551, plus the remaining sections through Copywriting)
- Baselines: photos/{375,1440}, photos-grid/1440, photos-carousel/375, photo/1440, lightbox/{375,768,1440}
- components/photos/MapSheet.tsx, CarouselStepper.tsx (class-level grep), plus grep sweeps across components/photos and app/(site)/photos
- Not read in full: the 13 PLAN/SUMMARY files, CONTEXT.md, STATE.md (deviations taken from the brief)
