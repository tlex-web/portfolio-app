# Phase 14: UI Fixes & Terminal Controls - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-14
**Phase:** 14-ui-fixes-terminal-controls
**Areas discussed:** Terminal controls, Lightbox Escape focus, Rail scrim & contrast, Menu & Home at 375 px

---

## Setup: branch

| Option | Description | Selected |
|--------|-------------|----------|
| New branch from HEAD (Recommended) | `gsd/phase-14-ui-fixes-terminal-controls` from e6ffce1; the Phase 13 close commits ride along to main with the Phase 14 PR | ✓ |
| New branch from main | Branch from origin/main (aef25e2); the close commits need their own small PR | |
| Stay on phase-13 branch | Commit the CONTEXT here and sort out branches before execution | |

**User's choice:** New branch from HEAD (Recommended)

---

## Terminal controls

### Where do Previous and Next go?

| Option | Description | Selected |
|--------|-------------|----------|
| Around the dots (Recommended) | Flank the dots in the bottom bar; the title bar keeps only Pause | ✓ |
| In the title bar | Beside Pause in the top bar; tight at 375 px | |
| Replace the dots | Bottom bar becomes Prev, `n / 4` and Next; the dots and direct jumps go | |

**User's choice:** Around the dots (Recommended)

### What does a step do to autoplay?

| Option | Description | Selected |
|--------|-------------|----------|
| Step presses Pause (Recommended) | A step or a dot press sets the sticky Pause; this changes how the dots behave today | ✓ |
| Same as dots today | Only the temporary hover and focus pauses; on touch, autoplay moves on 3 s after a tap | |
| Step stops autoplay for the visit | Autoplay is off until a reload; Pause can't bring it back | |

**User's choice:** Step presses Pause (Recommended)

### Wrap or stop at the ends?

| Option | Description | Selected |
|--------|-------------|----------|
| Stop, aria-disabled (Recommended) | Focusable, does nothing at either end, like the photo viewer | ✓ |
| Wrap around | Next on the last command goes to the first, matching the autoplay loop | |

**User's choice:** Stop, aria-disabled (Recommended)

### Transcript placement and content

| Option | Description | Selected |
|--------|-------------|----------|
| Below terminal, everything (Recommended) | Native `<details>` under the terminal box, outside its region; every command with its output and note; server-rendered | ✓ |
| Inside the terminal box | A last bar inside the border; two copies of the text inside the region | |
| Commands only | Command lines and notes without the captured output | |

**User's choice:** Below terminal, everything (Recommended)

### What a reduced-motion visitor sees

| Option | Description | Selected |
|--------|-------------|----------|
| Both (Recommended) | The paused, steppable terminal above the open transcript | ✓ |
| Transcript only | The terminal box is hidden under reduced motion | |

**User's choice:** Both (Recommended)

### Open on load

| Option | Description | Selected |
|--------|-------------|----------|
| Closed, opens for reduced (Recommended) | Server renders it closed; the client opens it after hydration under reduced motion; no shift for default visitors | ✓ |
| Open, closes for others | Server renders it open; most visitors see a collapse right after load | |
| Remember the choice | The first option plus a per-browser stored open or closed state | |

**User's choice:** Closed, opens for reduced (Recommended)

### Does opening the transcript pause autoplay?

| Option | Description | Selected |
|--------|-------------|----------|
| Opening presses Pause (Recommended) | Same rule as a step; closing doesn't resume | ✓ |
| Independent | The terminal keeps cycling while the transcript is read | |

**User's choice:** Opening presses Pause (Recommended)

---

## Lightbox Escape focus

### Bringing an off-screen trigger into view

| Option | Description | Selected |
|--------|-------------|----------|
| Nearest, clear of nav (Recommended) | Scroll as little as needed, below the sticky nav, instantly; no movement if already visible | ✓ |
| Centre it | Always scroll the trigger to the middle of the viewport | |
| Restore, then nearest | Restore the scroll from when the lightbox opened, then scroll the least needed | |

**User's choice:** Nearest, clear of nav (Recommended)

### Ledger 10 IN-01: a hidden callout takes the first Escape

| Option | Description | Selected |
|--------|-------------|----------|
| Hiding labels collapses it (Recommended) | Hide labels (button or H) closes the open callout | ✓ |
| Keep it, skip while hidden | The callout survives Hide and Show; its Escape layer passes the press on while labels are hidden | |
| Accept as is | Record the row as accepted; Phase 18 rewrites the lightbox | |

**User's choice:** Hiding labels collapses it (Recommended)

### Regression test reach

| Option | Description | Selected |
|--------|-------------|----------|
| All views in Chromium (Recommended) | Map, Grid and Carousel at the 3 UAT sizes plus 375×667 in Chromium; one Map case at 720×450 in Firefox and WebKit | ✓ |
| Full matrix, all engines | About 36 cases | |
| Map only | The reported failure only | |

**User's choice:** All views in Chromium (Recommended)

### Which close paths

| Option | Description | Selected |
|--------|-------------|----------|
| All three paths (Recommended) | Escape, Close photo and browser Back each tested (Chromium, 720×450) | ✓ |
| Escape only | What LBOX-08 names | |

**User's choice:** All three paths (Recommended)

---

## Rail scrim & contrast

### How the scrim covers the label run

| Option | Description | Selected |
|--------|-------------|----------|
| Deepen stops, same width (Recommended) | Keep w-56 (the camera reads the width); hold the dense stop past the longest label | ✓ |
| Widen the scrim | The camera framing and pins shift; the pin-clearance tests are re-measured | |
| Band in the rail layer | A separate band behind the label column; the camera is unaffected | |
| Cartographic label halos | A text halo per label; SC3 would need rewording | |

**User's choice:** Deepen stops, same width (Recommended)

### Where the 4.5:1 check samples

| Option | Description | Selected |
|--------|-------------|----------|
| Breakpoints × stops (Recommended) | Chromium, WebGL on and off; 768, 1023, 1280, 1440; every waypoint stop and the summit | ✓ |
| Summit only, both surfaces | B8's single position plus the live canvas and two more widths | |
| Every engine too | The first option in all engines | |

**User's choice:** Breakpoints × stops (Recommended)

### Target and gate

| Option | Description | Selected |
|--------|-------------|----------|
| Aim 5:1, gate 4.5:1 (Recommended) | Headroom in the design, AA in CI | ✓ |
| Gate at 5:1 | Stricter; may flake on canvas noise | |
| Aim and gate 4.5:1 | Lightest scrim; can tip over on a different renderer | |

**User's choice:** Aim 5:1, gate 4.5:1 (Recommended)

---

## Menu & Home at 375 px

### SHELL-07: what else the current-page tap does

| Option | Description | Selected |
|--------|-------------|----------|
| Close, focus Menu, stay put (Recommended) | Focus returns to the Menu button as Escape does; no scroll | ✓ |
| Close and go to the top | The page jumps to the top and focus goes to the h1 | |
| Close only | Focus falls to `<body>` | |

**User's choice:** Close, focus Menu, stay put (Recommended)

### SHELL-08: focus ring treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Inset ring on menu rows (Recommended) | The same 2 px ring drawn inside each row; rows stay full-bleed | ✓ |
| Pad the panel | Side padding gives the outside ring room; rows are no longer full-bleed | |
| Let the UI-SPEC pick | Leave it to /gsd-ui-phase with a visibility and 3:1 rule | |

**User's choice:** Inset ring on menu rows (Recommended)

### HOME-09 if nothing overflows today

| Option | Description | Selected |
|--------|-------------|----------|
| Prove wider, then close (Recommended) | Measure every Home mode and scroll stop at 375 px (and sweep the case-study and photo pages); fix the element or add guard rows and close | ✓ |
| Also on your phone | Plus a real-device check by Tim | |
| Close as done | Record as met by 09-01 with no new measurement | |

**User's choice:** Prove wider, then close (Recommended)
**Notes:** The option text included a sweep of the case-study and photo pages. CONTEXT keeps HOME-09's fix scope to Home and logs any overflow found elsewhere as a new item for Tim.

---

## Claude's Discretion

- Copy for the step buttons and the transcript summary (UI-SPEC with ui-ux-pro-max)
- A step lands on a fully typed command (`goTo`), with no typing replay
- Whether a single-command terminal renders a transcript
- Whether other panel links close at tap rather than on the route change
- The mechanism behind D-09 after the root-cause diagnosis
- The geometric assertion for "the scrim covers the full label run"
- How the PNG sets split per cause
- Applying the `@firefox-43967` tag rule if a new Firefox case crashes

## Deferred Ideas

- Any 375 px overflow found outside Home is logged for Tim as a new item
