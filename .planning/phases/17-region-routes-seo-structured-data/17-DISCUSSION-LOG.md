# Phase 17: Region Routes, SEO & Structured Data - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-23
**Phase:** 17-region-routes-seo-structured-data
**Areas discussed:** Region path shortlist, New photo pages now, Region page + OG card, JSON-LD credit wording (plus branch base and CI push approval)

---

## Branch

| Option | Description | Selected |
|--------|-------------|----------|
| New branch from Phase 16 tip (Recommended) | Cut gsd/phase-17-region-routes-seo-structured-data from 285b6d5, stacked like 15 and 16; merge order 14 → 15 → 16 → 17 | ✓ |
| Keep committing on the Phase 16 branch | No new branch; Phase 16 and 17 ship as one PR | |

**User's choice:** New branch from Phase 16 tip (Recommended)

---

## Region path shortlist

| Option | Description | Selected |
|--------|-------------|----------|
| /photos/regions/<id> (Recommended) | Static sibling under /photos; lightbox from region pages via the intercept, nav current for free, one modal slot; static-sibling intercept rated LOW, needs the spike in dev and build | ✓ |
| /photos/series/<id> | Same mechanics, 'series' as the word | |
| /regions/<id> (top-level) | No collision risk; photo links become full page loads unless a second intercept is added; nav current needs mapping | |

**User's choice:** /photos/regions/<id> (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Only if the first choice fails (Recommended) | Proceed if every spike check passes in dev and build; any failure stops for Tim with evidence | ✓ |
| Always, with the evidence | The spike report always comes to Tim before plans are written | |

**User's choice:** Only if the first choice fails (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Use the ids as they are (Recommended) | zermatt, ortler, saalfelden; a test bans an id equal to a photo slug or reserved word | ✓ |
| Separate URL slug field | A `slug` in regions.json so the URL can differ from the id | |

**User's choice:** Use the ids as they are (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| The designed 404 (Recommended) | Bare /photos/regions answers the neutral 404, no redirect, no index page | ✓ |
| Redirect to /photos | A 308 to /photos | |

**User's choice:** The designed 404 (Recommended)

---

## New photo pages now

| Option | Description | Selected |
|--------|-------------|----------|
| No stepping yet (Recommended) | Previous/Next and counter hidden on new photo pages; Phase 18 brings per-region stepping to all | ✓ |
| Step within its region | Step through the region series in altitude order; Zermatt inconsistent with the v2.0 four until Phase 18 | |

**User's choice:** No stepping yet (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Its region page (Recommended) | e.g. 'Ortler' → /photos/regions/ortler; v2.0 four keep 'All photographs' → /photos | ✓ |
| All photographs → /photos | Same link as the v2.0 pages, though /photos doesn't show the new photo yet | |

**User's choice:** Its region page (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| In Phase 18, once (Recommended) | No baseline added or changed in Phase 17; new pages covered by e2e, audit gate and metadata tests | ✓ |
| Add a small set now | One new photo page and one region page baselined now (dispatch + PNG commit), replaced in Phase 18 | |

**User's choice:** In Phase 18, once (Recommended)

---

## Region page + OG card

| Option | Description | Selected |
|--------|-------------|----------|
| Text links (Recommended) | Title, altitude and date per photo, altitude order, existing shell; matches the roadmap's no-UI-SPEC scope | ✓ |
| Small thumbnails | A simple grid of the 640 px derivatives; design work Phase 18 redoes | |

**User's choice:** Text links (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| A cover photo (Recommended) | Photo-card layout; plate shows name, country, photo count, altitude range over the region's own contours | ✓ |
| The region's plate contours | The local plate's contour SVG as the subject | |
| The site default card | Region pages reuse the root card | |

**User's choice:** A cover photo (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| You pick one per region (Recommended) | A `cover` id in regions.json, asked at a checkpoint; Phase 18 can reuse it | ✓ |
| Automatic: highest photo | The region's highest-altitude photo, no extra field | |

**User's choice:** You pick one per region (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Drafts for your approval (Recommended) | One copy checkpoint during execution, drafted from the existing templates, as in 16-08 | ✓ |
| Follow the existing templates | Fill the v2.0 patterns mechanically, no checkpoint | |

**User's choice:** Drafts for your approval (Recommended)

---

## JSON-LD credit wording

| Option | Description | Selected |
|--------|-------------|----------|
| The page's rights line (Recommended) | '© {capture year} Tim Lui, all rights reserved', exactly as the EXIF strip shows | ✓ |
| Footer style, current year | '© {current year} Tim Lui. All rights reserved.' on every block | |

**User's choice:** The page's rights line (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Tim Lui (Recommended) | Just the name, matching creator.name | ✓ |
| Photo: Tim Lui | Labelled credit | |
| Tim Lui / tlui.de | Name plus the site | |

**User's choice:** Tim Lui (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Place + coordinates as shown (Recommended) | Place name plus GeoCoordinates at exactly the page's printed precision | ✓ |
| Place name only | Region and country names, no coordinates in the markup | |

**User's choice:** Place + coordinates as shown (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| sameAs GitHub + LinkedIn (Recommended) | The two links already in site.ts and the footer; no email, no home location | ✓ |
| Name, role and url only | No sameAs links | |

**User's choice:** sameAs GitHub + LinkedIn (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| schema-dts, types only (Recommended) | 2.1.0 devDependency (+ schema-dts-lib 1.1.0), `import type` only, after Tim's package-verification stop | ✓ |
| Hand-written types | A small local type file; the parse test is the only guard on property names | |

**User's choice:** schema-dts, types only (Recommended)
**Notes:** The comparison was shown with registry facts checked on 2026-11-23: published by Google, Apache-2.0, 2.1.0 of 2026-10-02, 36 releases, 1.0 MB unpacked, no install scripts. The research's "no deps" was corrected: the package depends on schema-dts-lib 1.1.0 (15 KB, no deps).

---

## CI pushes

| Option | Description | Selected |
|--------|-------------|----------|
| Standing approval, ci/17-* (Recommended) | Plain new ci/17-* pushes, fast-forward fix pushes, reading CI; no force, phase branch, main, baseline dispatch or PNG commits | ✓ |
| Ask me each time | Every ci/17-* push stops for Tim's OK | |

**User's choice:** Standing approval, ci/17-* (Recommended)

---

## Claude's Discretion

- The saved-pages section label for region entries, and their order in the catalog.
- The facts block markup on the stand-in region page.
- The year span or latest year in a region gallery's copyrightNotice.
- The D-26 time-zone mechanism.
- Whether BreadcrumbList JSON-LD ships now or with Phase 18's visible breadcrumb.

Tim closed the discussion with "I'm ready for context". The offered extra areas (saved-pages labels, the facts block) were left to Claude.

## Deferred Ideas

- Per-region stepping for every photo, the designed region page, baselines for the new pages, nav and `/photos` links to region pages, and a visible breadcrumb are all Phase 18.
- Reusing the cover photo for the region header is optional for Phase 18.
