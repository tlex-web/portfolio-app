# Phase 17 — UI Review

**Audited:** 2026-11-24
**Baseline:** abstract 6-pillar standards plus ui-ux-pro-max guidelines (no UI-SPEC.md; roadmap UI hint: no)
**Screenshots:** not captured (no dev server on 3000, 5173 or 8080; none started)
**Interaction captures:** off (workflow.ui_interaction_capture is false)

**Caveats:** code-only audit, nothing verified in a browser. Files read: the region page, region OG image route, `@modal` region page, the region branch of `lib/og/template.tsx`, the back-link code in `PhotoViewer.tsx`, parts of `lib/regions.ts`, `17-UAT.md` and `17-CONTEXT.md` (D-01..D-27). The 16 SUMMARY and PLAN files were not read. UAT records the deployed OG card as passing; it was not re-viewed.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Specific labels (Facts, Photographs, "All photographs", region heading as h1); sources announce "(opens in a new tab)". No guard for empty facts or photos. |
| 2. Visuals | 2/4 | Text-only stand-in, no image or focal point beyond the h1. Locked by D-11 (Phase 18 designs the page), so this is the declared interim, not a defect. |
| 3. Color | 3/4 | Semantic tokens only (`border-line`, `text-ink-muted`, `prose-link`); no hardcoded colors on the page. |
| 4. Typography | 3/4 | `text-base`/`text-sm` plus `font-mono` for altitude and date. Muted `text-sm` lines need a contrast check in both themes. |
| 5. Spacing | 3/4 | Consistent 4/8 rhythm, no arbitrary values, `max-w-prose` keeps line length readable. |
| 6. Experience Design | 3/4 | `min-h-11` targets; `@modal` null page closes the lightbox (e2e guarded). Back-link duplication and 375px source-link overflow unverified. |

**Overall: 17/24** (no score changes after the D-11 cross-check)

---

## Top Priority Fixes

No BLOCKER found. All are WARNING or minor.

1. **No visual anchor on the region page** — a visitor from a shared OG card lands on text only — add the cover thumbnail in Phase 18. Covered by D-11 ("no thumbnails, plate, map or rail (Phase 18 designs it)"), so not a Phase 17 defect; confirm Phase 18 is scheduled.
2. **No empty-state guard for facts or photos** — if `region.facts` or `views` were empty the page would render a heading over a blank list — guard on length or assert minimum counts in the region schema. Not covered by any decision. I did not check whether `data/schemas/region.ts` already enforces non-empty arrays, so the risk may already be closed.
   *Orchestrator check (verify-work, 2026-11-24): closed at the data layer. `data/schemas/region.ts:80-83` requires 1 to 3 facts, and `data/__tests__/photo-map.test.ts` requires each region's `cover` to be one of its photos, so a region always has at least one fact and one photo. No page guard is needed.*
3. **Muted secondary text contrast and 375px overflow** — `text-sm text-ink-muted` source, altitude and rights lines, and `whitespace-nowrap` source links with a 16px icon — verify 4.5:1 in light and dark and check long labels at 375px.
4. **Duplicate back link in `PhotoViewer`** — one in the page body and one in the chrome, switched by breakpoint — confirm only one is exposed to assistive tech at each breakpoint.
5. **OG region card fallback** — `maybeText` drops a missing `facts.range` silently — acceptable given registry validation; optional fallback line.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)
`app/(site)/photos/regions/[region]/page.tsx`: headings "Facts" and "Photographs", h1 from `regionHeading`, rights line from `regionRights`. Back label is the region name for new photos and "All photographs" for the v2.0 four (D-09). Gap: no empty state for facts or photos (fix 2).

### Pillar 2: Visuals (2/4)
Plain stand-in: h1, facts list, text-link photo list, rights line. No thumbnails, plate, map or rail. D-11 locks this explicitly, so it is recorded as scored-but-expected; the score reflects what was built. The OG card uses the photo-style frame (D-12) with the cover photo and the region's plate contour; UAT passed on the deployed build.

### Pillar 3: Color (3/4)
Only semantic tokens on the page. OG card colors come from the shared template tokens. Muted text contrast not measured.

### Pillar 4: Typography (3/4)
Two sizes on the page (`text-base`, `text-sm`), one mono usage for altitude and date, h1/h2 from global styles. OG card uses 24px labels, legible at thumbnail scale.

### Pillar 5: Spacing (3/4)
`pt-8 pb-6`, `mt-8`, `mt-12`, `py-2`, `gap-4`, `gap-x-3`, container `px-4 sm:px-6 lg:px-8`, `max-w-6xl`. No arbitrary values.

### Pillar 6: Experience Design (3/4)
Positives: 44px targets, `rel="noopener noreferrer"` on external sources, lightbox closes on soft navigation to a region page, Escape and back links go to the region page. Unverified: duplicate back link exposure, 375px overflow, no loading or error state needed (static, `dynamicParams = false`, unknown ids 404 in `proxy.ts`).

---

## Files Audited
- app/(site)/photos/regions/[region]/page.tsx
- app/(site)/photos/regions/[region]/opengraph-image.tsx
- app/(site)/photos/@modal/regions/[region]/page.tsx
- lib/og/template.tsx (region branch)
- lib/regions.ts (partial)
- components/photos/PhotoViewer.tsx (back link)
- .planning/phases/17-region-routes-seo-structured-data/17-CONTEXT.md, 17-UAT.md
