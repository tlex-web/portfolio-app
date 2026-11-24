# Phase 18: Immersive Survey Layout - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-24
**Phase:** 18-immersive-survey-layout
**Areas discussed:** Overview + old view URLs, Region page + sequence, Lightbox, Share, LV95, Credits, sources, baselines (plus the ci/18-* approval)

**Sessions:** Areas 1–3 were answered in a first session that ended before CONTEXT.md was written. That session's answers survive only in `18-DISCUSS-CHECKPOINT.json`, which stored option labels but not their descriptions, so those tables show labels only. The second session resumed from the checkpoint (Tim: "Resume (Recommended)"), discussed area 4 and the CI approval, and wrote CONTEXT.md.

---

## Overview + old view URLs (session 1)

| Question | Options presented | Selected |
|----------|-------------------|----------|
| Region list / pin tab order (also the next-region chain) | West to east (Recommended) · Newest first · Oldest first | West to east (Recommended) |
| What each region list row shows | Cover thumbnail + data (Recommended) · Text only · Text + preview on focus | Cover thumbnail + data (Recommended) |
| Where ?view=grid and ?view=carousel land | Grid/Carousel → Zermatt page (Recommended) · Every ?view= → /photos | Grid/Carousel → Zermatt page (Recommended) |
| Overview rectangle → plate morph | No morph now, defer it (Recommended) · Yes, rectangle → plate morph | No morph now, defer it (Recommended) |

---

## Region page + sequence (session 1)

| Question | Options presented | Selected |
|----------|-------------------|----------|
| Top of a region page (Phase 19 header slot) | Cover photo in the slot (Recommended) · Text header, no media yet · Plate as the header | Cover photo in the slot (Recommended) |
| Nav hides on scroll down? | Nav stays fixed (Recommended) · Hide on scroll down | Nav stays fixed (Recommended) |
| Phone position in the ascent (rail from 768 px) | Caption carries n / N (Recommended) · Slim rail on phones too · Sticky sheet bar on phones | Caption carries n / N (Recommended) |
| Plate pin click on a region page | Scroll to it in the sequence (Recommended) · Open the lightbox | Scroll to it in the sequence (Recommended) |
| Photo page back link | All 11 → their region (Recommended) · Keep v2.0 four → /photos | All 11 → their region (Recommended) |
| Visible breadcrumb | Yes, with BreadcrumbList (Recommended) · No breadcrumb | Yes, with BreadcrumbList (Recommended) |
| Last region's next-region block / end card | Wrap to Zermatt (Recommended) · Back to the overview | Wrap to Zermatt (Recommended) |

---

## Lightbox, Share, LV95 (session 1)

| Question | Options presented | Selected |
|----------|-------------------|----------|
| End-of-series card shape | One extra step after the last (Recommended) · Panel on the last photo | One extra step after the last (Recommended) |
| Share / Copy link placement | Viewer strip + region header (Recommended) · Viewer strip only · Also on each sequence figure | Viewer strip + region header (Recommended) |
| Where coordinates appear for Swiss photos | Collar WGS84, strip adds LV95 (Recommended) · Swiss collars in LV95 | Collar WGS84, strip adds LV95 (Recommended) |
| LV95 rounding for future coarse CH photos | Match its precision (Recommended) · No LV95 for coarse photos | Match its precision (Recommended) |

---

## Credits, sources, baselines (session 2)

Context given before the questions:
- every page's footer prints the full swissALTIRegio credit (about 600 characters) in the Matterhorn legend;
- "Last surveyed" is the data edition (Matterhorn May 2026, Ortler May 2026, Saalfelden Sep 2025, overview "2021 release" with no month);
- the footer says "Extent (LV95)", while Saalfelden is on EPSG:3035 and the overview is in degrees;
- the GLO-90 notice may not be shortened (16 D-21).

### Footer Source row once /sources exists

| Option | Description | Selected |
|--------|-------------|----------|
| Short credit + Sources link (Recommended) | Short credit plus an "All data sources" link to /sources; the full string moves there; research confirms the licences accept a credit by link | ✓ |
| Keep full string + add link | The footer keeps the full credit and gains the link; safest for the licences, still long on every page | |

### Margin credit link

| Option | Description | Selected |
|--------|-------------|----------|
| Link to its /sources entry (Recommended) | Each short credit links to its anchor on /sources; if a licence needs the full notice at the map (possible for Copernicus), that margin carries it in full | ✓ |
| Plain text, footer link only | Margins show plain text; only the footer links to /sources | |

### Meaning of "Last surveyed"

| Option | Description | Selected |
|--------|-------------|----------|
| Data edition, as today (Recommended) | Matterhorn May 2026, Ortler May 2026, Saalfelden Sep 2025, overview "2021" (year only) | ✓ |
| When you photographed it | Newest photo date per region; the footer's Matterhorn legend would mean something different | |
| Both, two rows | "Data edition" and "Last visited" rows in every margin | |

### Extent grid per sheet

| Option | Description | Selected |
|--------|-------------|----------|
| LV95 for the Swiss sheet, WGS84 else (Recommended) | Matterhorn keeps "Extent (LV95)"; Ortler, Saalfelden and the overview show WGS84; same rule as photos | ✓ |
| Each sheet's own grid | Matterhorn and Ortler LV95, Saalfelden ETRS89-LAEA metres, overview WGS84 | |
| WGS84 everywhere, LV95 added for Swiss | Every sheet WGS84; Matterhorn adds LV95; changes the v2.0 footer's content | |

### /sources page organisation

| Option | Description | Selected |
|--------|-------------|----------|
| One entry per source, licences linked (Recommended) | Three anchored entries with the credit or notice word for word, licence name linked to its official text, what was done to the data, and the maps that use it | ✓ |
| Per source, full licence texts copied | Same entries with the full CC BY 4.0 and Copernicus licence texts reproduced | |
| One entry per map | Overview, Matterhorn, Ortler, Saalfelden; the swissALTIRegio credit appears twice | |

### Region-page screenshot baselines

Context: the one-photo page baseline is 1.06 MB at 1440×1650. A full-page Zermatt region page (7 photos) was estimated at about 9,000 px tall and about 5 MB per PNG at 1440.

| Option | Description | Selected |
|--------|-------------|----------|
| Viewport shots at fixed spots (Recommended) | Zermatt at 3 positions (top, one collar with the rail, end); Ortler and Saalfelden top only; 15 PNGs, 900 px high | ✓ |
| Every region at 3 positions | 27 PNGs, 900 px high | |
| Full-page, like other routes | 9 tall PNGs (an estimated ~17 MB); each new photo forces its region's re-baseline | |

### photos-grid / photos-carousel visual entries

| Option | Description | Selected |
|--------|-------------|----------|
| Rewrite as region shots (Recommended) | Both entries become the region-page shots; an e2e test asserts where each ?view= URL lands | ✓ |
| Keep shooting the ?view= URLs | They screenshot the redirect target, duplicating the Zermatt shots | |

---

## CI approval (session 2)

| Option | Description | Selected |
|--------|-------------|----------|
| ci/18-* plus declared dispatches (Recommended) | Plain pushes of new ci/18-* branches, fast-forward fix pushes, reading CI, and each visual-baselines dispatch a plan declares; excludes force pushes, the phase branch or main, PNG commits and undeclared dispatches | ✓ |
| ci/18-* pushes only | Same pushes; every dispatch asked at its checkpoint | |
| Ask each time | No standing approval | |

---

## Claude's Discretion

- The redirect mechanism and status for `?view=` URLs.
- The breadcrumb's segments and separator (the JSON-LD must match).
- Short-credit wording, drafted for Tim's copy checkpoint.
- The `/sources` anchor ids.
- Whether `/sources` joins the saved-pages catalog.
- Which photo the Zermatt mid-sequence baseline centres on (chosen from the data).

## Deferred Ideas

- Overview extent-rectangle → region plate View Transition morph (REGION-F4).
