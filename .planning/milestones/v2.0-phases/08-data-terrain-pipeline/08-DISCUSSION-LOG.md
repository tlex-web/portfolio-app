# Phase 8: Data & Terrain Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-24
**Phase:** 08-data-terrain-pipeline
**Areas discussed:** Photo facts & copy, Originals & full-res, Terrain framing, Footer map legend, riskScore source

Facts presented before the questions: the EXIF of all four originals (dates 6–7 Sep 2021; GPS for three photos; R004-011 has only a 2020-02-12 scan date); the committed 12480×8320 full-res copies in `public/images/optimized/` that are served live; and, found during the discussion, the GPS-bearing originals in the public Git history (`287c2e9`, deleted in `347d8e1`).

---

## Photo facts & copy

### Waterfall location (img-0629, GPS 46.0081 N 7.7385 E, 1,715 m)
| Option | Description | Selected |
|--------|-------------|----------|
| Gornerschlucht (Recommended) | Matches the GPS; recorded as a locationOverride | ✓ |
| Somewhere nearby, not the gorge | Another waterfall near Zermatt | |
| Not sure: 'Gorge near Zermatt' | Neutral label, no invented precision | |

### Lake for R004-011 (film scan, no GPS)
| Option | Description | Selected |
|--------|-------------|----------|
| Riffelsee (2,757 m) | Classic Matterhorn mirror shot, below Gornergrat | ✓ |
| Stellisee (2,537 m) | Five Lakes Walk above Blauherd | |
| Leisee / Grindjisee | Other Five Lakes reflection spots | |
| Don't know which lake | Most likely candidate, wider approx. radius | |

### Capture date for R004-011
| Option | Description | Selected |
|--------|-------------|----------|
| I know the exact date | Manual override, source Tim | |
| I know the year only | Year-precision date, no invented day | ✓ |
| Unknown: use 'before 2020' | Show "film, scanned 2020" | |

Follow-up, year: 2019 (options 2019 / 2018 / 2020) ✓ 2019

### Who writes the corrected copy
| Option | Description | Selected |
|--------|-------------|----------|
| Claude drafts, Tim approves (Recommended) | Drafted from EXIF facts; Tim reviews every story | ✓ |
| I'll write the stories | Tim supplies four stories | |
| Facts only, minimal edit | Fix facts, de-duplicate with one-line changes | |

### Photo URL slug shape
| Option | Description | Selected |
|--------|-------------|----------|
| Descriptive (Recommended) | e.g. /photos/matterhorn-from-zermatt | ✓ |
| Camera ids | e.g. /photos/img-0605 | |
| Place + year | e.g. /photos/zermatt-2021 | |

### Tags
| Option | Description | Selected |
|--------|-------------|----------|
| Derive year + season (Recommended) | From the capture date; subject tags stay hand-written | ✓ |
| Drop tags entirely | No v2.0 view shows tags | |
| Keep hand-written, just fix them | Correct the four by hand | |

---

## Originals & full-res

### Where the originals live
| Option | Description | Selected |
|--------|-------------|----------|
| Local, gitignored folder (Recommended) | e.g. assets/photos-original/, outside /public | ✓ |
| Private cloud bucket | CI pulls them with a secret | |
| Outside the repo entirely | --originals path flag or env var | |

### CI stale check without originals
| Option | Description | Selected |
|--------|-------------|----------|
| Two-stage + fingerprints (Recommended) | Committed EXIF sidecar (GPS pre-rounded, sha256); CI re-derives and diffs | ✓ |
| Fingerprints only | Hash agreement only | |
| Local hook only | pre-push hook; CI checks the schema only | |

### Public Git history
| Option | Description | Selected |
|--------|-------------|----------|
| Site only, leave history | Meets DATA-05 as written; exposure accepted | ✓ |
| Purge, as a separate step Tim runs | filter-repo + force-push; every SHA changes | |
| Make this repo private | History intact but not public | |

### Largest served size
| Option | Description | Selected |
|--------|-------------|----------|
| 2560 px long edge (Recommended) | Retina lightbox, far below print | ✓ |
| 1920 px (as now) | Smallest | |
| 3200 px | 4K/5K crisp, larger files | |

---

## Terrain framing

### Extent
| Option | Description | Selected |
|--------|-------------|----------|
| Photos + summit, ~11 km square (Recommended) | ~21 m/px at 512²; Italian side below the summit included | ✓ |
| Wide valley, ~16 km square | Adds Gornergrat, Klein Matterhorn, Theodul, Cervinia | |
| Summit-centred, ~11 km | Summit in the middle; Zermatt and Riffelsee near the corner | |

### Attribution string
| Option | Description | Selected |
|--------|-------------|----------|
| Research finds it, I confirm (Recommended) | Exact product wording plus source URL; one constant | ✓ |
| I already have the string | Tim types it | |
| Use '© swisstopo' + product name now | Fallback; correct later | |

### Poster look
| Option | Description | Selected |
|--------|-------------|----------|
| Hillshade + contours (Recommended) | Imhof-style relief, NW light, AVIF/WebP + contour SVG | ✓ |
| Contours only (pure SVG) | Tiny, diagrammatic | |
| Both, chosen per surface | Pipeline emits both | |

### Which heights win
| Option | Description | Selected |
|--------|-------------|----------|
| DEM for photos, official summit (Recommended) | Rail starts at the lowest photo's DEM height; HOME-04 wording updated | ✓ |
| Keep 1,626 / 4,478 literal | Fixed rail endpoints | |
| DEM everywhere | Summit from the DEM too | |

---

## Footer map legend

### Kind of legend
| Option | Description | Selected |
|--------|-------------|----------|
| Map-sheet margin (Recommended) | Sheet title, equidistance, scale bar, corners, last surveyed, attribution | ✓ |
| Symbol key | Contours, waypoints, approx. pin, trail grades | |
| Art band + essentials | Strip, scale bar, attribution only | |

### Contour art placement
| Option | Description | Selected |
|--------|-------------|----------|
| Full-bleed band on top (Recommended) | Crop through the summit; text grid below | ✓ |
| Behind the content, faint | Atmospheric; contrast risk | |
| Framed inset 'map tile' | Bordered inset beside identity | |

### Waypoints in the footer
| Option | Description | Selected |
|--------|-------------|----------|
| Decorative marks only (Recommended) | aria-hidden ticks, not links | ✓ |
| Linked waypoints | 4 extra tab stops per page | |
| No waypoints | Pure terrain | |

### Motion
| Option | Description | Selected |
|--------|-------------|----------|
| Static (Recommended) | No animation; deterministic baselines | ✓ |
| One-time draw-in | stroke-dashoffset on view | |
| Slow ambient drift | Needs a pause control | |

---

## riskScore source (added via "Explore more gray areas")

### Source of riskScore values
| Option | Description | Selected |
|--------|-------------|----------|
| Real CLI_X output (Recommended) | Tim runs the commands and supplies the scores | ✓ |
| Representative, labelled | Claude picks in-band values, marked illustrative | |
| Band midpoints | 0.15 / 0.45 / 0.70 / 0.90 | |

### When Tim supplies them
| Option | Description | Selected |
|--------|-------------|----------|
| Checkpoint during execution (Recommended) | A human-action checkpoint in the highlights plan | ✓ |
| I'll paste them now | Recorded in CONTEXT.md | |

---

## Claude's Discretion

- Season rule for derived tags (shown to Tim in the copy review)
- Heightmap encoding conflict (16-bit grey vs terrain-RGB): the researcher resolves it, and the requirement wording wins by default
- Contour interval and LODs, naming and hashing, sidecar and manifest shape, derivative widths below 2560 px, `lib/geo.ts` math, keeping d3-contour out of Jest
- Footer corner-coordinate format and "last surveyed" source (footer UI-SPEC)
- Exact Riffelsee pin coordinates

## Deferred Ideas

- Git history purge (declined for now; possible later as a separate step run by Tim)
- Medium/Critical CLI_X demo commands (Phase 11; may be collected at the Phase 8 checkpoint)
