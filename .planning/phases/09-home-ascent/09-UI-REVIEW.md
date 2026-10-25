# Phase 9 — UI Review (revised)

**Audited:** 2026-10-25 (revised after reading 09-CONTEXT, the 09-07/10/11/12/13/14 SUMMARYs and the ui-ux-pro-max checklists)
**Baseline:** 09-UI-SPEC.md (approved 2026-10-24)
**Screenshots:** No fresh captures (no dev server started). Evidence used:
- The committed CI baselines `e2e/visual/routes.spec.ts-snapshots/home/{375,768,1440}-*`. These are static-poster renders. 09-11 and 09-14 explain why: the frame-budget gate declines SwiftShader at desktop size, so CI falls back to the poster.
- The 09-12 live 3D renders in the scratchpad `09-12/` directory: `summit-fixed-1440.png`, `summit-fixed-1280.png`, `summit-fixed-412.png`, `shots/3d-ex1.00-pb450-wp2-1440.png`.
**Interaction captures:** off (workflow.ui_interaction_capture is false). Interaction findings are code-derived.
**ui-ux-pro-max:** SKILL.md loaded. Checklists applied: Accessibility (`color-contrast`, `alt-text`, `keyboard-nav`, `focus-not-obscured`, `reduced-motion`, `heading-hierarchy`, `color-not-only`), Touch (`touch-target-size`, `touch-spacing`), Performance (`image-dimension`, `content-jumping`), Layout (no horizontal scroll), Typography and Color (`semantic tokens`, no raw hex, 16 px base). The skill's one-primary-CTA rule is met with zero primaries, as the spec states.

Tag key: **KNOWN** = in `deferred-items.md`, already routed to the gap plan after 09-14. **NEW** = found here. **Gap-plan candidate** = Y / N / Maybe.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Matches the contract and About copy is approved; docked-card kicker orphans the "4" (KNOWN) and the place line wraps to start with a dangling "·" (NEW) |
| 2. Visuals | 3/4 | The live 3D stage is strong at 1280, 1440 and 412. KNOWN plaque and pin overlaps below 1280; NEW pin 3 under hero copy at 375 and 768 |
| 3. Color | 3/4 | Accent only on the two new uses; no hex or white/black; the hero scrim dims the rail labels at 768 to 1023 (NEW) |
| 4. Typography | 3/4 | Exactly four sizes and two weights; docked-card line breaks are the only defects |
| 5. Spacing | 3/4 | On the scale; arbitrary values are only the geometric ones the spec lists |
| 6. Experience Design | 3/4 | Three modes all complete; known overlaps remain; B8 contrast covers the summit only, not the start |

**Overall: 18/24** (was 17/24: Visuals raised from 2 to 3 after judging the live 3D renders; two earlier NEW findings withdrawn, see Corrections)

---

## Corrections to the first pass

| First-pass claim | Verdict | Evidence |
|------------------|---------|----------|
| About and contact copy is DRAFT | **Wrong, withdrawn.** Tim approved it verbatim ("approve") at the 09-12 copy checkpoint. `data/home.ts:20` has `status: 'approved'` (09-12-SUMMARY, commit ae50279). No score impact. | `09-12-SUMMARY.md` lines 48, 127-128, 166 |
| Year range prints a hyphen, not an en dash | **Wrong, withdrawn.** `lib/home-format.ts:20` defines `EN_DASH = '–'` and `lib/home-format.ts:78` returns `` `${min}${EN_DASH}${max}` ``. `lib/ascent/summit.ts:58` feeds it the "Photographed" value. The baseline's JetBrains Mono renders U+2013 like a short hyphen at 14 px. | Code |
| 1440 reduced-motion drops the terrain after the hero | **Withdrawn as a defect; most likely a full-page capture artifact.** UI-SPEC "Modes" says static-reduced is "Poster only, sticky behind the content" (UI-SPEC line 214). In code the stage is `sticky top-(--nav-h) col-start-1 row-start-1` (`AscentController.tsx:280`) in the same grid cell as the track (`AscentHero.tsx:72`). A Playwright full-page capture never scrolls, so a sticky stage shows only once at the top. I did not confirm the live reduced layout, so the poster staying behind the stacked cards is unverified. The sparse right-hand side of the stacked column is the design (left-aligned cards, D-07). | Spec and code |
| Hero scrim flips at `lg:`, not 768 | **Confirmed, but KNOWN.** `HeroBlock.tsx` `SCRIM` uses `lg:bg-linear-to-r`. The spec (Hero Block) says 768. It is logged open in `deferred-items.md` ("Hero scrim switches to the horizontal gradient at `lg:`") and in 09-07-SUMMARY line 235, owner 09-14. The code comment says Tim accepted correction C6 on 2026-10-25. Not new. | Cited |

---

## Top Fixes

1. **KNOWN, routed to the gap plan: summit plaque covers pins below 1280.** Measured in 09-12 at 375x667 (all four 3D pins), 768x1024 (pin 3), 820x1180 (pins 1-3) and 1024x768 (pin 1 touches, pin 4 under the rail scrim). The static poster pins sit under the plaque: 3 at 375, 2 at 412, 1 each at 768 and 1024. Fix: a compact plaque on short or portrait stages, or framing that puts the pins above it. The 3D renders at 1280, 1440 and 412 x 839 are clear.
2. **NEW, gap-plan candidate (Y): the hero scrim overlays and dims the altimeter rail at 768 to 1023.** The track (and the hero scrim inside it) paints above the stage (`AscentHero.tsx:72`, later DOM order), so at `md` through `lg-1` the vertical scrim (from-surface/90 to /50) sits over the rail labels. In `768-ascent-start` the labels are barely readable. Not measured, since I had no image tool for pixel values. B7 samples only hero text; B8 samples only the summit position (`e2e/home-modes.spec.ts` B8, 09-07-SUMMARY line 144). Fix: limit the scrim box to the copy column, or lift the rail above the track, then add a B8 case at p = 0 and 768.
3. **NEW, gap-plan candidate (Y, low): the docked card's place line wraps with a leading "·" at 375, and its kicker orphans the "4" (KNOWN).** Fix both together with `whitespace-nowrap` on the segments, or move the date to its own line (`WaypointCard.tsx` kicker and place line in the 128 px column).
4. **NEW, gap-plan candidate (Maybe): pin 3 renders behind hero copy at p = 0 at 375 and 768.** See Visuals.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)
- Rendered copy matches the contract: kicker `45.9764 N · 7.6586 E`, `Tim Lui`, role, thesis, both cue links, `Photographs · 4 waypoints`, `Engineering · 2 routes`, `Waypoint 2 of 4`, `View photo`, `Matterhorn summit`, `4,478 m`, four plaque stats with their second lines, `2,760 m approx.` on the rail, and the approved About copy.
- `WaypointCard.tsx` names the link with `aria-label="View photo: {title}"` instead of the spec's visible text plus sr-only span. The name is equivalent and each link stays distinguishable (`aria-labels`, WCAG 2.4.4). Method deviation only, and the code comment explains it.
- WARNING, KNOWN, routed to the gap plan: at 375 the docked kicker orphans the "4" (`375-ascent-waypoint-2`).
- WARNING, NEW, gap-plan candidate Y: in the same render the place line wraps as `Gornerschlucht, Zermatt` / `· Sep 2021`, a separator at the start of a line.
- Trail-sign labels are nouns by design (the spec checker's non-blocking FLAG).

### Pillar 2: Visuals (3/4)
- Live 3D judged from the 09-12 renders. At 1440 and 1280 the summit look-back puts all four pins to the right of the plaque with the summit triangle at the foot; at 412 the plaque is docked and pins 1-3 and the dashed 4 sit above it, small but clear. The Gornerschlucht 1440 frame (`3d-ex1.00-pb450-wp2-1440.png`) shows the card on the left, the lit pin with its label, and the readout on 1,668 m. This clears the 09-10 "pins behind plaque at 1440" item, which is resolved.
- **Dark wedge at the 1440 summit (deferred item, open): judged benign.** In `summit-fixed-1440.png` the dark mass at about x 560-660, y 740-900 is the shaded near ridge of the peak, with the summit triangle floating on it at x 561, y 802. It reads as terrain, not a render artefact, and it has no text on it. I would close the item. The summit triangle sits on a near-black face and is low contrast. A small lift of `SUMMIT_LIFT_M` would help; this is optional polish.
- WARNING, KNOWN, routed to the gap plan: the plaque overlaps pins at 375x667, 768x1024, 820x1180 and 1024x768, and the static poster pins sit under the plaque below 1280 (`375-ascent-summit`: pins 1 and 2 only; `768-ascent-summit`: pin 3 hidden).
- WARNING, KNOWN, routed to the gap plan: at 768 the waypoint-2 pin label hides behind the card.
- WARNING, NEW, gap-plan candidate Maybe: pin 3 sits behind hero copy at p = 0. Evidence: `375-ascent-start` (pin 3 head beside "Developer & photographer"), `768-ascent-start` (between the thesis and the "Photographs" sign), `1440-ascent-start` (just above that sign, not touching text). The spec does require all four pins visible from the start (D-09, "All pins visible", and the Pins "Visibility" row). It accepts only an overlap between the two Zermatt pins, not pin versus copy. So this is not a spec violation, but the collision is unplanned. Cheap fix: nudge the poster crop (`0.64` x-share) or accept it as decorative.
- Hierarchy is strong: the 64 px h1, the signpost pair with the yellow tips, a flat panel system, and the rail marker kept in step with the lit pin.

### Pillar 3: Color (3/4)
- `bg-accent` and `text-ink-inverse` appear only in `PinMark.tsx` (the active head) and `AltimeterRail.tsx:112` (the marker): the two new "you are here" uses. No hex, `rgb(`, white or black in `components/home` or `app/(site)/page.tsx`. Trail yellow only through `bg-trail` on the sign tips. Semantic tokens only (the skill's raw-hex rule).
- WARNING, KNOWN, routed to the gap plan: the hero scrim switches at `lg:` rather than 768. B7 still measures 6.84:1 or better on every hero text line.
- WARNING, NEW, gap-plan candidate Y: the hero scrim reaches the rail at 768 to 1023 (see Top Fixes #2). It is a layering defect, not a token one. It also makes the deferred "2,760 m approx. at 4.81:1" number understate the problem at the start position, because that number was measured at the summit only. 09-14-SUMMARY line 214 saw the faint readout at 768 and tied it to the scrim item. I add the mechanism.
- 60/30/10 holds: dark surface dominates, raised panels hold the cards and plaque, accent is minimal.

### Pillar 4: Typography (3/4)
- `text-sm` x11, `text-base` x10, `text-heading` x4, `text-hero` x1 (on the h1 only); weights `font-semibold` x6 and `font-normal` x1. Exactly the contract's four sizes and two weights. Mono is used for coordinates, altitudes and counts, with `tabular-nums`; the thesis is Inter; h1 and h2 are Schibsted.
- Base text is 16 px with line-height 1.5 (the skill's base rule). Smallest text is 14 px data (kicker, pin labels, tick labels), which is the contract's label size.
- "Tim Lui" fits one line at 375. The thesis wraps to two lines as specified.
- WARNING: the docked-card breaks at 375 (Copywriting).

### Pillar 5: Spacing (3/4)
- Arbitrary values are all geometric: `h-[calc(100svh-var(--nav-h))]`, `grid-cols-[128px_1fr]`, `pb-[max(16px,env(safe-area-inset-bottom))]`, the pin clip-path. Spacing classes follow the scale (`py-12`, `mt-8`, `mt-6`, `gap-x-6`, `p-6`, `p-4`, `gap-4`, `px-2 py-1`).
- Touch: cue links `min-h-11`, card link `min-h-11`, signs 56 px, `gap-2` between signs and `gap-y-2` between cue links (the 8 px spacing rule).
- No horizontal overflow visible at 375 in any baseline (a thin right-hand gutter in the 375 baselines is the scrollbar).
- Minor, NEW, gap-plan N: at 375 the cue links stack, leaving a large empty band under them in the hero. Not a contract violation.

### Pillar 6: Experience Design (3/4)
- Three modes are complete pages (the baselines and 09-11/09-14 fall back to the poster with no error copy, per D-21). `motion-reduce:` variants are throughout. The docked panel uses safe-area padding. Heading hierarchy is h1, then four h2 cards, then the summit h2 and About h2. No spinner or "loading 3D" copy.
- WARNING, KNOWN, routed to the gap plan: summit pin overlaps (Visuals).
- WARNING, NEW, gap-plan candidate Y: the composed-contrast backstops do not cover the rail at the start position (B8 is summit-only; 09-07-SUMMARY line 262 says to recheck once a live canvas sits behind the rail, and 09-13/14 did not add a start-position case).
- Open, owner 09-14, not in the gap plan: the hero scrim breakpoint decision (align to 768, or amend the spec to `lg:`). I recommend amending the spec if Tim accepted C6, so the spec and code agree.
- Not verified: the reduced-motion live layout (poster sticky behind stacked cards), and live camera snap or reveal behaviour (covered by e2e per the summaries).
- Registry audit: not applicable (no shadcn).

---

## NEW findings (evidence and gap-plan status)

| # | Finding | Evidence | Gap-plan candidate |
|---|---------|----------|--------------------|
| N1 | Hero scrim paints over the altimeter rail at 768 to 1023, dimming labels and readout | `768-ascent-start-visual-dark-linux.png` (faint rail); `AscentHero.tsx:72` (track after stage); `HeroBlock.tsx` `SCRIM` (vertical below `lg:`); 09-07-SUMMARY line 144 (B8 summit only); not pixel-measured | Y |
| N2 | Docked card place line wraps with a leading "·" | `375-ascent-waypoint-2-visual-dark-linux.png` ("Gornerschlucht, Zermatt" / "· Sep 2021"); `WaypointCard.tsx` place line | Y (bundle with the "4" orphan) |
| N3 | Pin 3 collides with hero copy at p = 0 at 375 and 768 (near, not touching, at 1440) | `375-ascent-start`, `768-ascent-start`, `1440-ascent-start` baselines; D-09 and Pins "Visibility" row (all pins visible; only the Zermatt overlap is accepted) | Maybe |
| N4 | The 3D summit marker triangle floats on a near-black ridge, low contrast, at 1440 and 1280 | `summit-fixed-1440.png` (x 561, y 802), `summit-fixed-1280.png` (x 498, y 676) | N (optional polish; closes the dark-wedge item as benign) |
| N5 | Cue links stack at 375, leaving a large empty band under the hero | `375-ascent-start` | N |

Withdrawn from the first pass: About draft finding, en dash, reduced-motion terrain drop (see Corrections).

---

## Files Audited
- `.planning/phases/09-home-ascent/09-UI-SPEC.md`, `09-CONTEXT.md`, `deferred-items.md`, `09-07/10/11/12/13/14-SUMMARY.md` (targeted sections)
- `components/home/PinMark.tsx`, `WaypointCard.tsx`, `HeroBlock.tsx`, `AscentHero.tsx`, `AscentController.tsx` (grep), `lib/home-format.ts`, `lib/ascent/summit.ts`, `data/home.ts` (grep)
- Baselines in `e2e/visual/routes.spec.ts-snapshots/home/` and the 09-12 scratchpad renders
- `.claude/skills/ui-ux-pro-max/SKILL.md`
