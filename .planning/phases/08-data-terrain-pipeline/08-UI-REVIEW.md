---
phase: "08"
slug: "data-terrain-pipeline"
audited: "2026-10-24"
baseline: "08-UI-SPEC.md (approved)"
overall: 20
max: 24
blockers: 0
auditor: gsd-ui-auditor (sonnet), ui-ux-pro-max Quick Reference rules
---

# Phase 08 — UI Review

**Baseline:** 08-UI-SPEC.md (approved).
**Screenshots:** none captured locally (no dev server; visual specs are CI-only on this Windows machine). The auditor viewed the Tim-committed CI baselines `home/375-reduced` and `not-found/1440-reduced`; the other routes, the 768 width and `photos` were not viewed.
**Interaction capture:** off (`workflow.ui_interaction_capture: false`); interaction findings are code-derived.
**Scope:** Phase 8's visible changes: the map-sheet SiteFooter (08-12), the v1 modal capture label and /photos hotspot counts (08-10). Pre-existing v1 issues are listed separately and not scored.

## Scores

| Pillar | Score | Key finding |
|---|---|---|
| 1 Copywriting | 3/4 | Labels, title, value formats and the Tim-decided attribution match the spec. The Source line runs about 8 lines at 1440 and about 25 at 375. |
| 2 Visuals | 3/4 | Band, 16 px ticks and scale bar match the spec. Contour lines and waypoint ticks are very faint. |
| 3 Color | 4/4 | Only L2 tokens (`bg-contour`, `bg-ink-muted`, `border-ink-muted`, `text-ink*`). No accent, hex, white or black in the footer; contour colour reaches the band only through the mask. |
| 4 Typography | 4/4 | `text-sm` and `text-base` only; weights 400/600; mono only on data values, Inter on labels and attribution. |
| 5 Spacing | 3/4 | All values on the scale (`mt-4`, `gap-x-8`, `gap-y-6`, `pt-6`, `mt-12`, `h-2`, `h-4`); one geometry nit. |
| 6 Experience Design | 3/4 | No new tab stops, no motion import, no Intl/locale APIs, server component, aspect-ratio boxes reserve height, SW covers `/terrain/`. Two spec backstops not visually confirmed. |

**Overall: 20/24. No BLOCKERs.**

## Top Fixes (all WARNING, defer to Phase 12 polish)

1. **The Source line is long and leaves an empty area.** It sits in a `lg:col-span-4` row capped at `max-w-prose`. At 1440 it runs about 8 lines, not the about 4 the UI-SPEC predicted, and the right ~55% of that row is empty. At 375 it is about 25 lines of 14 px `ink-muted` text. Tim chose the full string (Option A), so do not shorten it. Lower its visual weight instead, for example with a 2-column layout from `lg` (Source beside the data row) or a wider measure.
2. **Band legibility.** At 1440 the contours read as a faint hairline texture (`contour` token, alpha 0.14, decorative per spec). The waypoint ticks are 1 × 16 px against a ~120 px band; they carry the photo-position meaning but are easy to miss. Keep the 1 px spec and consider raising their length or contrast. Solid and dashed ticks do read as distinct at 1440. At 375 the auditor could not confirm from the downscaled baseline that the two close ticks (img-0605 / img-0629, ≈7.7 px apart) render as two lines. The 08-13 executor's pixel measurement did confirm two separate ticks 7 px apart.
3. **Scale-bar label overhang.** The `0` label is offset `-0.5ch` and so sits ~4 px left of the content edge (x≈167 against text at x=171 at 1440). This follows the spec but looks misaligned with the grid column.

## Minor / Unconfirmed

- **Scale-bar truth** (barPx / bandPx = L / widthM) and "exactly one tier announced": the tier classes (`lg:hidden` / `min-[112rem]`) are ordered correctly in code. At 1440 the bar is ≈131 px, which matches 1000 / 11000 × 1440. The other breakpoints were not measured; the 08-12 e2e covers one-tier visibility, including at 1920.
- The "2 px contour spacing at 375" density rule (100 m interval) cannot be checked from the downscaled 375 baseline.
- "Zermatt – Matterhorn" (en dash) and "Last surveyed: May 2026" match Tim's decisions.
- The 375 baseline shows a readable footer with no clipping. The Scale bar sits beside Equidistance, and Extent spans both columns, as specified.

## Pre-existing v1 Issues (not scored against Phase 8)

- Home 375 px horizontal overflow, caused by a v1 project card → Phase 9 (`deferred-items.md`).
- `bg-ink hover:bg-ink` lost hover → Phase 9.
- "1 hotspots" plural in GalleryGrid → Phase 10 (STATE todo).
- Firefox 1 px stroke check not yet done → Phase 12 (STATE todo).
- The Home hero and cards still use v1 gradient and stock-palette styling (cyan badge, gradient cards). The new footer clashes tonally with them until Phases 9–12. In the 375 baseline, the "Let's Work Together" card copy is low-contrast on its gradient.
- Command 4 explanation "High-risk operation" beside a CRITICAL RISK badge: open with Tim.

## Not Examined

- 08-10's modal capture label was not reviewed visually (code renders `captureLabel` conditionally; unit tests cover it).
- `/photos` hotspot counts (covered by the 08-11 baseline review).
- Registry audit: skipped, because there is no `components.json` (shadcn not initialised).
- The 768 baselines.

## Files Audited

`components/site/SiteFooter.tsx`, `components/terrain/ContourField.tsx`, `lib/footer-format.ts`, `data/generated/terrain.ts`, `data/generated/photos.ts`, `data/site.ts`, `public/service-worker.js` (grep only), `components/ImageDetailModal.tsx` (grep only), `08-UI-SPEC.md`, `deferred-items.md`, and the CI baselines `home/375-reduced` and `not-found/1440-reduced`.
