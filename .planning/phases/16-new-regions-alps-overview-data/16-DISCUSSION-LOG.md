# Phase 16: New Regions & Alps Overview Data - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-15
**Phase:** 16-new-regions-alps-overview-data
**Areas discussed:** Location privacy rules, Launch regions & intake, Zermatt growth & light table, Alps overview contents, Housekeeping

---

## Location privacy rules

**How should a coarse location be expressed?**

| Option | Description | Selected |
|--------|-------------|----------|
| Named levels (Recommended) | '3dp' (~100 m) and '2dp' (~1 km) besides 4dp; rounded at extraction before the sidecar is written; existing dashed 'approx.' treatment | ✓ |
| Radius per photo | Tim gives a radius per photo; the position snaps to a grid of that size | |
| Hand-placed pin only | Like Riffelsee: a hand-placed pin with a reason and a radius | |

**What does a new photo get when nothing marks its precision?**

| Option | Description | Selected |
|--------|-------------|----------|
| Required on every record (Recommended) | Every photo-map record states its precision; extraction fails without one | ✓ |
| 4dp unless flagged | Default 4dp; only marked records get coarser | |
| Coarse unless opted in | Every new photo 3dp unless marked 4dp | |

**For a coarse photo, which position does the height come from?**

| Option | Description | Selected |
|--------|-------------|----------|
| True spot, rounded (Recommended) | DEM sampled at the in-memory GPS position; height rounded 10 m (3dp) / 50 m (2dp); only rounded height and coarse position committed | ✓ |
| Coarse spot, as is | Sample the DEM at the rounded position; can be hundreds of metres off in steep terrain | |
| No height shown | Coarse photos show no altitude; need a fallback in the altitude sequence | |

**What should an aerial (drone) photo show?**

| Option | Description | Selected |
|--------|-------------|----------|
| Ground height, labelled (Recommended) | Marked aerial; aircraft altitude never extracted; DEM ground height labelled as ground | ✓ |
| No altitude at all | Aerial photos show no height | |
| No drone stills this phase | Ground photos only; drone material arrives as Phase 19 loops | |

**User's choice:** All four Recommended options.

---

## Launch regions & intake

**Which new region(s) do you have photos from?** (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| Val Gardena / Seceda (IT) | Dolomites edge, ~11.7° E | ✓ |
| Innsbruck / Ötztal (AT) | Tyrol, inside the footprint | ✓ |
| Aosta / Cervinia / Gran Paradiso (IT) | Western Italian Alps | ✓ |
| Lake Como / Garda / Ortler (IT) | Lombardy, Trentino and the Ortler group | ✓ |

**Notes:** All four selected. DATA-13 scopes 1–2 new regions, so Claude asked which two launch.

**Which (at most) two launch in Phase 16?**

| Option | Description | Selected |
|--------|-------------|----------|
| Val Gardena / Seceda (IT) | | |
| Innsbruck / Ötztal (AT) | | ✓ |
| Aosta / Cervinia / Gran Paradiso (IT) | | |
| Lake Como / Garda / Ortler (IT) | | ✓ |

**Which one is the Italian region?**

| Option | Description | Selected |
|--------|-------------|----------|
| Lake Como | ~9.3° E | |
| Lake Garda | ~10.7° E | |
| Ortler / Stelvio | ~10.5° E, high glaciated relief | ✓ |

**What is the Austrian region?**

| Option | Description | Selected |
|--------|-------------|----------|
| Innsbruck / Nordkette | Compact plate | |
| Ötztal | Compact plate | |
| Both as one region | One wider plate (~45 km) | |

**User's choice (free text):** "The photos / drones shots are taken around Saalfelden in Austria"
**Notes:** Claude checked STACK.md: the swissALTIRegio rectangle ends at 11.99° E, Saalfelden is at about 12.85° E (outside). A comparison table (A: Ortler now, Saalfelden later; B: Saalfelden on BEV now; C: Saalfelden without a plate) was shown.

**Saalfelden is outside swissALTIRegio. How should Phase 16 handle the Austrian region?**

| Option | Description | Selected |
|--------|-------------|----------|
| A: Ortler now, Saalfelden later | Ortler only; Saalfelden to DATA-F1 | |
| B: Saalfelden on BEV now | Amend DATA-11, DATA-13 and the footprint decision; BEV ALS DTM plate (EPSG:3035, proj4 in scripts, BEV credit) | ✓ |
| C: Saalfelden, no plate | Overview pin only; breaks DATA-11 and REGION-02 | |

**Where is your drone footage from?**

| Option | Description | Selected |
|--------|-------------|----------|
| Only Saalfelden | | |
| Also Zermatt or Ortler | | |
| Not decided yet | | |

**User's choice (free text):** "Some drone footage is from around Saalfelden +50km radius and from Zürich, Airolo and Vättis in Switzerland"

**How big may a new region's plate get?**

| Option | Description | Selected |
|--------|-------------|----------|
| Compact, curate photos (Recommended) | ~10–20 km around the main cluster; photos further out aren't in the series | ✓ |
| Sized to all photos | Plate grows to cover every photo, possibly 50–100 km | |
| Decide per region later | Checkpoint per extent once originals are in | |

**When are the new originals ready?**

| Option | Description | Selected |
|--------|-------------|----------|
| Before planning (Recommended) | Copied into assets/photos-original/ before /gsd-plan-phase 16; research records only plate extents | ✓ |
| During execution | Pipeline on synthetic fixtures, checkpoint for originals | |
| Partly now, rest later | Mixed | |

**What format will the originals be in?** (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| Edited JPEG exports | Like the current four | ✓ |
| DJI JPEG stills | Straight from the drone | |
| Phone HEIC / DNG RAW | Needs a new decoder path | |

---

## Zermatt growth & light table

**If a new Zermatt photo lies outside the Matterhorn plate, what happens?**

| Option | Description | Selected |
|--------|-------------|----------|
| Wider plate only if needed (Recommended) | Matterhorn plate if all fit; else a compact 'zermatt' region plate, Home keeps 'matterhorn' | ✓ |
| Matterhorn plate, curate out | Region always uses the Matterhorn plate | |
| Always a new Zermatt plate | Own wider plate regardless | |

**Do new Zermatt photos join the v2.0 /photos light table in Phase 16?**

| Option | Description | Selected |
|--------|-------------|----------|
| Hold until Phase 18 (Recommended) | Data only; light table keeps the current four; pixel-neutral | ✓ |
| Join now, one re-baseline | Light table, lightbox and pages now; re-baseline now and again in Phase 18 | |

---

## Alps overview contents

**What area should the overview sheet cover?**

| Option | Description | Selected |
|--------|-------------|----------|
| Whole Alpine arc (Recommended) | About 5–17° E as prototyped; never re-cropped | ✓ |
| Cropped to the regions | About 7–14° E at a larger scale | |

**Which reference summits orient the overview (3–5)?**

| Option | Description | Selected |
|--------|-------------|----------|
| Highest per country (Recommended) | Mont Blanc, Dufourspitze, Grossglockner, Zugspitze, optionally Triglav | ✓ |
| Famous landmarks | Mont Blanc, Matterhorn, Eiger, Grossglockner, Zugspitze | |
| Away from the regions | Mont Blanc, Piz Bernina, Grossglockner, Triglav | |

**How should places be named?**

| Option | Description | Selected |
|--------|-------------|----------|
| Common English, one name (Recommended) | Grossglockner with ss; ids zermatt / ortler / saalfelden | ✓ |
| Both names | 'Ortler / Ortles', 'Matterhorn / Cervino' | |
| Local language | Name used on the ground | |

**Should the overview have a hillshade under its contours?**

| Option | Description | Selected |
|--------|-------------|----------|
| Spike decides, contours first (Recommended) | Optional hillshade only if it fits the budget and reads at 375 px | ✓ |
| Contours only | Pure line sheet index | |
| Always a hillshade | Relief shading like the local plates | |

---

## Housekeeping

| Question | Options | Selected |
|----------|---------|----------|
| Where does Phase 16 run? | New branch, stacked (Recommended) / Ship Phase 15 first | New branch, stacked (Recommended) |
| Standing push approval for Phase 16 CI branches? | Standing approval, ci/16-* (Recommended) / Ask each time | Standing approval, ci/16-* (Recommended) |
| Phase 15 IN-01..08? | Fix all eight (Recommended) / IN-01 only | Fix all eight (Recommended) |
| Assumption A-15-12? | Keep it (Recommended) / Add an exception | Keep it (Recommended) |
| Remaining gray areas? | I'm ready for context / Explore more gray areas | I'm ready for context |

---

## Claude's Discretion

- Schema shapes for precision, aerial and region facts; the DJI-make aerial safety net.
- How extraction samples the plate DEM at the true spot (the rule itself is locked).
- `radiusM` and reason per precision level.
- Whether LV95 plates move to proj4 (only if the measured error requires it).
- Editorial copy drafting (Tim approves at a checkpoint).
- A phase client-JS budget, the per-plate asset budget test, the `PhotoId` regex, the fetcher layout.
- Overview rectangle rendering (projected outline or bounding box) and projection (spike).

## Deferred Ideas

- Further regions inside swissALTIRegio: Val Gardena / Seceda, Aosta / Cervinia / Gran Paradiso, Lake Como, Lake Garda, Innsbruck / Ötztal; Zürich, Airolo and Vättis (drone footage).
- Saalfelden drone footage beyond the compact plate (~50 km radius).
- Country borders on the overview (REGION-F5).
- Dolomites core and Hohe Tauern (DATA-F1, now TINITALY-only for Italy).
