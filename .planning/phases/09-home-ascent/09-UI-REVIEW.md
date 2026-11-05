# Phase 9 — UI Review (re-audit after gap closure 09-15 to 09-22)

**Audited:** 2026-10-25
**Baseline:** 09-UI-SPEC.md (with the 09-17 to 09-21 amendments) and the accepted D-09 amendment
**Screenshots:** Not captured fresh (no dev server started). Evidence: the new committed CI baselines (Tim's commit e9ebee7) in `e2e/visual/routes.spec.ts-snapshots/home/`, read as images. Viewed: 375 start, waypoint-2, summit and reduced; 768 start, waypoint-2 and summit; 1440 start and summit. I did not open the 1440 waypoint-2, 1440 reduced or 768 reduced shots. These are static-poster renders, so live 3D framing (09-20, 09-21) is judged from the summaries and tests only.
**Interaction captures:** off (workflow.ui_interaction_capture is false). Interaction findings are code- and summary-derived.
**ui-ux-pro-max:** SKILL.md loaded. Checklists applied: accessibility (contrast, focus, reduced motion, heading order), touch (44 px targets, 8 px spacing), layout (no horizontal cut-off, safe area), typography and colour (semantic tokens, 4.5:1).
**Not signed off by Tim:** review items S1-S4, W1-W2, T1, R1-R2 (09-22-SUMMARY) and the planner's three design choices. Nothing below is described as approved except the D-09 pin 3 amendment.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Copy matches the contract. The kicker "4" orphan and the leading "·" are gone in the 375 waypoint-2 shot. |
| 2. Visuals | 3/4 | Rail, plaque and pin 2 label fixed. Open: S3 (pin 4 and summit triangle cut off on phones), pin 3 sits on hero text at 375 and 768, reduced-motion plaque covers pins. |
| 3. Color | 3/4 | Accent use unchanged and token-only. Rail labels are readable at 768 now. The hero scrim still switches at `lg:` (open deferred item, not re-measured). |
| 4. Typography | 4/4 | Four sizes, two weights. Card breaks fixed. |
| 5. Spacing | 3/4 | No raw pixel or hex values. The phone summit frame clips pin 4 and the triangle. The 375 hero keeps a large empty band below the cue links. |
| 6. Experience Design | 3/4 | Compact plate stops the summit overlap at every guarded size. Open: reduced-motion overlap, 4 `delayHeightmap` tests that can flake, checklist unsigned. |

**Overall: 20/24** (was 18/24: Copywriting 3 to 4, Typography 3 to 4; Visuals, Color, Spacing and Experience Design stay at 3 because of the open items below)

---

## Changes since the 18/24 review

| Earlier finding | Status | Evidence |
|-----------------|--------|----------|
| KNOWN: docked card kicker orphans the "4" | **Fixed** | `375-ascent-waypoint-2`: "1,668 m ·" / "Waypoint 2 of 4" on two lines (09-16). The separator trails line 1, which is acceptable. |
| N2: place line wraps with a leading "·" | **Fixed** | Same shot: "Gornerschlucht, Zermatt" / "Sep 2021". |
| N1: hero scrim dims the rail at 768 to 1023 | **Fixed** | `768-ascent-start`: all rail labels and the 1,617 m readout read clearly (09-17, rail in its own layer). Not pixel-measured by me. The 09-22 summary reports the `lg:` tail no longer touches "2,760 m approx." at 1440. |
| KNOWN: 768 waypoint-2 pin label hides behind the card | **Fixed** | `768-ascent-waypoint-2`: the label "Gornerschlucht · 1,668 m" sits below the lit pin, clear of the card (09-19). |
| KNOWN: summit plaque covers poster pins below 1280 | **Mostly fixed** | `375-ascent-summit` and `768-ascent-summit` show the compact one-line plate with the signs, and pins 1 to 3 are clear. 1440 shows the full plaque with all four pins clear. Two cases remain open: S3 and reduced motion (below). |
| Pin 3 label hidden at 768 to 1024 | **Accepted** (D-09 amendment, Tim: "Accept, amend D-09") | Code comment and UI-SPEC Pins row; scored neutrally. |
| N3: pin 3 collides with hero copy at p = 0 | **Open** | `375-ascent-start`: the pin 3 head sits directly under "Tim Lui" and left of "Developer & photographer". `768-ascent-start`: it sits just under the thesis line and above the "Photographs" sign. `1440-ascent-start`: clear. |
| N4: summit triangle low contrast on dark ridge | **Open, optional** | `1440-ascent-summit`: the small triangle at (136, 713) is faint but readable. |
| N5: cue links stack at 375, leaving an empty band | **Open, minor** | `375-ascent-start`: about 70 px of empty hero below "Skip to the summit". |
| Dark wedge at the 1440 summit | **Benign, still logged open** | `1440-ascent-summit` shows terrain shading only. Recommend closing it. |
| Hero scrim `lg:` vs 768 spec row | **Open** | deferred-items.md. The decision (align the code or amend the spec) is still not made. |
| "2,760 m approx." at 4.81:1 at 768 | **Unverified** | It reads clearly in `768-ascent-start`. I have no new measurement, so the entry should be re-measured by the B8 test rather than closed here. |

---

## Top 3 Priority Fixes

1. **S3 (open, WARNING): the phone summit frame cuts off pin 4 and the summit triangle.** In `375-ascent-summit` only pins 1 to 3 show. Pin 4 is past the right edge (x 377 to 401 at 375 x 900, and 403 to 427 at 412 x 915), and the triangle is off the left edge at every phone size. Phone users never see the summit marker or the fourth waypoint, while D-09 requires all four pins to be visible. Fix: reframe the poster crop on narrow stages so the pin box fits inside the stage, or add the two pins to the narrow-stage containment test, as the 11-size guard does for plaque overlap. Tim must triage this one.
2. **Reduced motion keeps the full plaque, which covers all four poster pins at 375 x 667 (open, WARNING).** The overlap is 15 to 127 px in Chromium and Firefox. Fix: apply the compact layout under reduced motion too, or move the pin layer above the stacked column. The stacked layout has no fixed summit frame, so there are no pins to hide there. The simplest fix is to hide the poster behind the full plaque deliberately. This needs Tim's decision.
3. **Pin 3 renders on hero copy at 375 and 768 (open, WARNING).** At 375 the head touches the "Tim Lui" and role text, and at 768 it sits tight against the thesis line. D-09 wants every pin visible from the start, so only the Zermatt pins may overlap. Fix: nudge the poster x-share or hide pin 3 under the hero text with a hero-box check, as 09-19 does for card-aware labels.

Smaller items (not in the top 3): decide the hero scrim breakpoint (`lg:` vs 768) and amend the spec if the code stays; add `serviceWorkers: 'block'` to the four other `delayHeightmap` tests; re-measure "2,760 m approx." at 768 with B8 at p = 0 and p = 1.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- Rendered copy matches the contract in every shot viewed: kicker `45.9764 N · 7.6586 E`, `Tim Lui`, "Developer & photographer", thesis, both cue links, "Photographs / 4 waypoints", "Engineering / 2 routes", "Matterhorn summit / 4,478 m", plaque stat labels with second lines ("Riffelsee, approx.", "straight line"), and `View photo`.
- The kicker in `375-ascent-waypoint-2` now reads "1,668 m ·" over "Waypoint 2 of 4", and the place line "Gornerschlucht, Zermatt" over "Sep 2021". Both former breaks are gone.
- Minor: "2019-2021" in the plaque renders an en dash in JetBrains Mono at 14 px that looks like a hyphen. Code uses `EN_DASH`, so this is not a defect.
- Minor: the kicker's trailing "·" ends line 1. Acceptable, and a nowrap pair is the intended behaviour.

### Pillar 2: Visuals (3/4)
- Hierarchy is strong: the 64 px h1, the signpost pair with the yellow tips, the lit cyan pin with its label, and the rail marker kept in step with the pin.
- Fixed: the compact summit plate at 375 and 768 leaves the pins clear. The 768 waypoint-2 label sits clear of the card. The 1440 plaque no longer covers any pin, and the rail is above the scrim.
- WARNING (S3, open): pin 4 and the triangle are cut off on phones; see Top Fixes 1.
- WARNING (open): reduced-motion plaque covers pins at 375 x 667; see Top Fixes 2.
- WARNING (open): pin 3 on hero copy; see Top Fixes 3.
- Accepted: pin 3's poster label is hidden while its head lies under the card at about 768 to 1090 px (D-09 amendment). In `768-ascent-start` the pin 4 dashed head sits close to the rail labels but clear of them.
- Optional polish: the summit triangle at 1440 is small and low contrast.

### Pillar 3: Color (3/4)
- `bg-accent` x2 and `text-ink-inverse` x1 (the pin head and rail marker) are the only accent uses. No hex or `rgb(` in `components/home` or `app/(site)/page.tsx`. Trail yellow appears only on the sign tips. 60/30/10 holds.
- The rail labels at 768 are readable in `768-ascent-start`, which is the main improvement since the last review.
- WARNING (open): the hero scrim still flips at `lg:` rather than at 768, against the spec row. Three of four hero text lines were measured at 6.84:1 or better at 768 before the gap plans; I did not re-measure.
- The "2,760 m approx." at 4.81:1 entry is not re-measured. The label looks clear in the 768 shot.

### Pillar 4: Typography (4/4)
- Sizes in `components/home`: `text-base` x12, `text-sm` x12, `text-heading` x4, `text-hero` x1 (the h1 only). Weights: `font-semibold` x6, `font-normal` x1. That is exactly the contract's four sizes and two weights.
- Mono keeps tabular figures for coordinates, altitudes and counts. The 375 h1 fits one line. The docked card heading wraps on a word boundary ("Waterfall in / the Gornerschlucht").
- No findings against the contract.

### Pillar 5: Spacing (3/4)
- No arbitrary pixel values in the `[Npx]` form; geometric calc values remain. Spacing follows the scale. Touch targets keep `min-h-11` and 8 px gaps, and the docked panel uses safe-area padding.
- WARNING (S3): on phones the framing clips pin 4 and the triangle; the 375 summit shot also has the pins close to the right edge.
- Minor (N5): at 375 the stacked cue links leave an empty band under the hero.
- No horizontal overflow in any shot viewed. The thin right gutter in the 375 baselines is the scrollbar.

### Pillar 6: Experience Design (3/4)
- Three modes remain complete pages. The docked panel, compact plate and card-aware label placement are guarded by e2e at eleven sizes in Chromium and Firefox, per the 09-18 to 09-21 summaries. CI was green twice on 05a5e8c.
- WARNING (open): reduced-motion overlap; see Top Fixes 2.
- WARNING (open): four `delayHeightmap` tests share the service-worker bypass and pass only because their checks finish before the mesh is built. "A load abandoned for reduced motion reveals nothing" is the most exposed.
- WARNING (open): `lib/useAscentMode.ts` fails `prettier --check` (minor, not UI).
- Process note: the visual checklist is not signed off, and the three planner design choices are unaddressed. The hand-over test failure on re-run was a harness race, fixed in `05a5e8c`, not a product regression.
- Not verified: live 3D framing at the md sizes (09-20, 09-21) and reduced-motion layout behaviour. Both are summary-derived.
- Registry audit: not applicable (no shadcn).

---

## Files Audited
- `.planning/phases/09-home-ascent/09-UI-REVIEW.md` (previous), `deferred-items.md`, `09-UAT.md`, `09-22-SUMMARY.md`
- `components/home/*` and `app/(site)/page.tsx` (class counts by grep)
- Baselines in `e2e/visual/routes.spec.ts-snapshots/home/` (nine viewed as images; 768-reduced, 1440-reduced and 1440-waypoint-2 not opened)
