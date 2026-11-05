# Phase 9: Home Ascent - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-24
**Phase:** 09-home-ascent
**Areas discussed:** Ascent pacing & route, Waypoint moments, First viewport & page, Mobile & load policy

---

## Ascent pacing & route

### How should scroll progress map to altitude?

| Option | Description | Selected |
|--------|-------------|----------|
| Equal stages | Each leg gets the same scroll share, with real altitude interpolated inside a leg and evenly spaced rail ticks (a route profile) | ✓ |
| Linear + dwell plateaus | True linear altimeter with scroll plateaus at each photo; first two photos back-to-back, long empty final leg | |
| Pure linear | 1 px = fixed metres; first two photos bunched in ~2% of scroll, top 60% empty | |

### What path should the camera take?

| Option | Description | Selected |
|--------|-------------|----------|
| Steady approach | One smooth rising path NE → W toward the summit, turning toward each stage's waypoint, no detours | ✓ |
| Visit each spot | Fly to each photo position in altitude order; zig-zags ~4 km east then ~8 km west | |
| Rising orbit | Circle the Matterhorn while climbing; summit is always the subject | |

### What should the final frame show at 4,478 m?

| Option | Description | Selected |
|--------|-------------|----------|
| Look back down | Settle above the summit facing NE toward Zermatt with all four waypoints below | ✓ |
| Pull up to plan view | Rise into a top-down map of the whole sheet | |
| Summit close-up | End close on the summit pyramid | |

### How long should the climb be?

| Option | Description | Selected |
|--------|-------------|----------|
| ~1 viewport per leg | ~500svh sticky track (4 legs + summit hold) | ✓ |
| Short (~3 viewports) | Quick climb; fast flicks blur stages | |
| Long (~8 viewports) | Two viewports per leg; cinematic but slow | |

### Should the rail ticks be clickable?

| Option | Description | Selected |
|--------|-------------|----------|
| Decorative only | HOME-04 as written; navigation via skip link and the card list | ✓ |
| Pointer shortcut | Click a tick to jump; ticks stay aria-hidden with tabindex=-1 | |

### How tightly should the camera follow scroll?

| Option | Description | Selected |
|--------|-------------|----------|
| Light damping | ~200–300 ms ease, invalidate until settled | ✓ |
| Exact scrub | No smoothing; mouse-wheel notches show as jumps | |
| Heavy inertia | ~600 ms+ glide; feels laggy | |

---

## Waypoint moments

### What appears when the climb reaches a photo's stage?

| Option | Description | Selected |
|--------|-------------|----------|
| Photo card | HTML card on the side away from the rail: 3:2 photo, title, altitude, story, View photo; pin lights up | ✓ |
| Pin label only | Small label anchored to the 3D pin; photos only in list and gallery | |
| Full chapter | Photo takes over most of the screen, terrain dims behind | |

### When should the 3D pins be visible?

| Option | Description | Selected |
|--------|-------------|----------|
| All visible, active lit | All four from the start; active one brightens and gets the label; Riffelsee dashed "approx." | ✓ |
| Reveal at altitude | Each pin fades in when its stage is reached | |

### How should the always-rendered photo list (HOME-05) work?

| Option | Description | Selected |
|--------|-------------|----------|
| Cards are the list | The stage cards are real sections in altitude order, always in the DOM; focusing a link scrolls to its stage | ✓ |
| Separate log at summit | Visible waypoint table after the summit; cards are visual only | |
| Screen-reader list | Visually hidden list; fails visible focus for sighted keyboard users | |

### What extra data should each card carry?

| Option | Description | Selected |
|--------|-------------|----------|
| Place + date line | Mono line, e.g. "Gornerschlucht, Zermatt · Sep 2021"; film scan "2019"; full EXIF stays in the lightbox | ✓ |
| Full EXIF strip | Adds focal length, aperture, shutter, ISO | |
| Nothing extra | Photo, title, altitude, story, link only | |

---

## First viewport & page

### What should the first viewport say?

| Option | Description | Selected |
|--------|-------------|----------|
| Name h1 + thesis | Kicker "45.9763 N · 7.6586 E", h1 "Tim Lui", role line, thesis "Photographs and software from one mountain." | ✓ |
| Thesis h1, name above | Thesis at display size, name in the kicker | |
| Name + role only | No thesis | |

### What is the primary CTA in the first viewport?

| Option | Description | Selected |
|--------|-------------|----------|
| Trail signs, repeated | Two trail signs with data counts in the hero and again at the summit; quiet "Start the ascent ↓" cue | ✓ |
| Start the ascent | One primary action in the hero; trail signs only at the summit | |
| Get in touch | Contact as the hero primary action | |

### How should the nav behave over the hero and ascent?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep solid sticky | Same nav as everywhere; stage = 100svh minus nav height | ✓ |
| Transparent over hero | Home-only transparent state with a scrim, solid after the ascent | |
| Hide while climbing | Slides away on scroll-down, returns on scroll-up | |

### What comes after the summit, before the footer?

| Option | Description | Selected |
|--------|-------------|----------|
| Short About + contact | 2–3 sentence About (Claude drafts, Tim approves) and one contact line to Contact and Roadmap | ✓ |
| Summit is the end | Plaque and trail signs, then the footer | |
| Keep all, restyled | Current About, skill chips and contact CTA in v2 tokens | |

### How should the 3D terrain take over from the plan-view poster?

| Option | Description | Selected |
|--------|-------------|----------|
| Start top-down, tilt in | 3D camera matches the poster at scroll 0, then tilts into perspective over Zermatt | ✓ |
| Cross-fade to perspective | Canvas fades straight to the perspective view after load | |
| Perspective poster | New build step renders a perspective still of the starting frame | |

### How should the hero text stay readable over the light hillshade?

| Option | Description | Selected |
|--------|-------------|----------|
| Night-tinted terrain | Poster tinted into the night palette in CSS, contour token lines, soft scrim; AA measured on the composed result | ✓ |
| Solid text panel | Hero text on a surface-raised panel | |
| Light terrain, dark text | Bright first screen with dark ink | |

### How should the skip-the-ascent link appear and where should it land?

| Option | Description | Selected |
|--------|-------------|----------|
| Visible, lands at summit | "Skip to the summit" next to the start cue; lands on the plaque and trail signs | ✓ |
| Focus-only, lands at summit | Appears only on keyboard focus | |
| Visible, lands after summit | Jumps to About and contact | |

---

## Mobile & load policy

### Should phones get the 3D ascent?

| Option | Description | Selected |
|--------|-------------|----------|
| 3D on capable phones | The capability gate decides, not width; 256² mesh, DPR ≤ 1.5; rail hidden < 768 px | ✓ |
| Poster below 768 px | All small viewports get the static poster | |

### When should the 3D canvas code start loading?

| Option | Description | Selected |
|--------|-------------|----------|
| Idle or first scroll | Whichever comes first; the poster holds until the canvas is ready | ✓ |
| On first scroll only | Nothing 3D until the visitor scrolls | |
| Right after hydration | Fastest 3D; competes with LCP on throttled phones | |

### Where do the stage cards sit below 768 px?

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom card over terrain | Card docks in the lower ~40% over a scrim; camera frames the pin above | ✓ |
| Card replaces terrain | Card covers the stage during its leg | |
| Compact pin label | Pin label only on phones | |

### How should CI guard the ascent against visual regressions?

| Option | Description | Selected |
|--------|-------------|----------|
| Static baselines + canvas smoke | Canvas stays hidden in route baselines; separate SwiftShader smoke test with pixel sampling at 3 scroll positions | ✓ |
| Full canvas baselines | Pixel-baseline the WebGL canvas at 0.01 | |
| Static baselines only | No canvas coverage beyond unit tests | |

---

## Claude's Discretion

- Camera curve, FOV, look-at targets, damping constant; how the tilt-in shares the track with leg 1
- Pin and label implementation (drei `<Html>` acceptable if CSP-safe)
- "View photo" link format until Phase 10 (minimal, no Phase 10 work)
- Whether the dead hero chain (`Hero3DMountain` and dependants) is deleted in Phase 9
- Card transitions between stages; capability thresholds and shader tuning (research items)

## Deferred Ideas

None. The discussion stayed within the phase scope.
