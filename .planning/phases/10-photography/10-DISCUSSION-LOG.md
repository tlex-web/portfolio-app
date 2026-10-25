# Phase 10: Photography - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-25
**Phase:** 10-photography
**Areas discussed:** Map view, Lightbox layout, Hotspot callouts, Carousel & switcher

Tim chose the recommended option for every question and added no free-text notes.

---

## Map view

### Framing

| Option | Description | Selected |
|--------|-------------|----------|
| Full sheet | The same 11 km sheet as Home's poster and the footer, with the summit in frame; the photos bunch in the east half | ✓ |
| Crop to the photos | A ~6 km viewBox crop; the pins spread out; the summit is off-frame with an edge marker | |
| Full sheet + inset | The full sheet plus a magnified Zermatt/gorge inset; most complex | |

### Labels

| Option | Description | Selected |
|--------|-------------|----------|
| Always on, leader lines | Title + mono altitude next to every pin; collisions offset with leader lines | ✓ |
| Numbered pins + key | Pins 1–4 with a key beside or under the map | |
| Labels on focus/hover | Bare pins until hovered or focused (fails hover-vs-tap) | |

### Pin action

| Option | Description | Selected |
|--------|-------------|----------|
| Opens the lightbox | The pin and label are one link to /photos/[slug]; the hover/focus thumbnail is a bonus | ✓ |
| Select, then open | The first tap fills a waypoint panel; a second action opens the photo | |

### Mobile collision (Zermatt/gorge ~27 px apart on a phone)

| Option | Description | Selected |
|--------|-------------|----------|
| Labels are the targets | ≥ 44 px label rows in clear slots with leader lines to small dots; no list | ✓ |
| Map + waypoint list | A list of the four waypoints under the map on every breakpoint | |

---

## Lightbox layout

### Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Stage + bottom strip | The photo is contained above a strip (title, place/date, story, EXIF, ©); callouts in the side gutters | ✓ |
| Photo + side panel | ~70% photo with a right info column from 1024 px | |
| Full-bleed + info toggle | Edge-to-edge photo, info overlay on I | |

### Zoom (today's modal has 1.5× click-to-zoom)

| Option | Description | Selected |
|--------|-------------|----------|
| Fit ↔ 1:1 toggle | Click/Z/button; drag and arrow pan while zoomed; Esc unzooms first; hotspots hidden while zoomed | ✓ |
| No zoom | Always fitted; native pinch only; removes an existing feature | |

### Film scan EXIF strip

| Option | Description | Selected |
|--------|-------------|----------|
| Medium line, omit gaps | "Film scan · 2019", altitude, ≈ coordinates ±100 m; no filler values | ✓ |
| I'll supply camera/film | Tim gives the camera, lens and film stock as hand-entered data | |

### Direct-load /photos/[slug]

| Option | Description | Selected |
|--------|-------------|----------|
| Viewer inside the shell | The same viewer under SiteNav with the footer, "← All photographs", prev/next; Home waypoints land here | ✓ |
| Full-screen viewer | Looks exactly like the modal, with no nav or footer | |
| Home opens the lightbox | Home clicks open /photos with the lightbox over it (fragile interception) | |

---

## Hotspot callouts

### Desktop callout style

| Option | Description | Selected |
|--------|-------------|----------|
| Labels on, details on demand | Gutter labels (title + height) with leader lines; the label button expands the description and facts | ✓ |
| Markers, one callout at a time | Markers only; activating one opens a single callout card | |

### Default visibility

| Option | Description | Selected |
|--------|-------------|----------|
| On, remembered | On at first visit; "Hide labels" (H) remembered in localStorage | ✓ |
| On, per session | The choice resets on every opening | |
| Off by default | The clean photo first; "Show labels" reveals | |

### Mobile legend (< 768 px)

| Option | Description | Selected |
|--------|-------------|----------|
| Numbered dots + inline key | 44 px numbered dots plus a key in the strip; rows expand in place | ✓ |
| Dots open a bottom sheet | A sheet slides up over the lower screen | |

---

## Carousel & switcher

### Carousel motion

| Option | Description | Selected |
|--------|-------------|----------|
| Never auto-advance | Visible ‹ › buttons, "n / 4" counter, arrow keys, "Open photo"; the idle float stops under reduced motion and offscreen | ✓ |
| Auto-advance + pause | ~6 s timer with Pause/Play; stops on focus, hover or reduced motion | |

### Flat-stepper fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Same gate as Home | `lib/useAscentMode.ts` rules; no three.js on static devices | ✓ |
| Reduced motion + no WebGL | Only the two cases the roadmap names | |

### Page head

| Option | Description | Selected |
|--------|-------------|----------|
| Data line + switcher | Mono data kicker, h1 "Photographs" and the segmented switcher on one row; no prose | ✓ |
| Data line + short intro | Plus 1–2 first-person sentences (needs a copy review) | |
| Sticky switcher bar | The switcher sticks under SiteNav | |

### Grid tile

| Option | Description | Selected |
|--------|-------------|----------|
| Slide-mount caption | An always-visible title + mono place/altitude/date; no overlay or badge | ✓ |
| Caption + hotspot count | Plus a correctly pluralised "2 annotations" badge | |

---

## Claude's Discretion

- Wrap at the ends, swipe-down to close, the shortcut hint, the live region wording
- The view-switch crossfade
- The map-pin thumbnail preview and the summit marker style
- The label-layout method (build-time table or a pure function), as long as it is deterministic
- Whether "Hide labels" also hides the mobile text key (default: the key stays)
- Hotspot glyphs; preloading neighbours, the blur-up placeholder and the error/retry state
- Where the 08 review warnings and the other carry-overs land in the plan

## Deferred Ideas

None new. PHOTO-F1 … F4 remain v2.x in REQUIREMENTS.md.
