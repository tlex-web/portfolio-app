---
status: diagnosed
trigger: "UAT G-09-3: At 768 px the waypoint-2 pin label on the static poster is hidden behind its card, and at 375 px the docked waypoint card's kicker '1,668 m · Waypoint 2 of 4' wraps with a lone '4'."
created: 2026-10-25T15:10:00Z
updated: 2026-10-25T16:05:00Z
goal: find_root_cause_only
---

## Current Focus

bug_class: Bohrbug (deterministic layout; the same render on every run at a given viewport, font rasteriser and scrollbar mode)
hypothesis: CONFIRMED for both (see Resolution). (a) and (b) are independent mechanisms; (b) also covers G-09-4 N2.
test: done. Scratch Playwright measurements on `next dev` (static poster, md sweep, 3D md sweep, phone sweep with and without the scrollbar gutter), plus ink measurement of the CI baseline PNG.
expecting: n/a
next_action: return ROOT CAUSE FOUND to the orchestrator (diagnose-only mode). The dev server was started for this session and has been stopped.

reasoning_checkpoint:
  hypothesis: "(a) At 768 the clear band between the md card (x 24-472) and the rail scrim (x 534-758) is 62 px, but a lit label needs 150-260 px (20 px offset + 130-240 px label). flipPinLabels tests only the right obstacle, so pin 2 (head x 487-511, 35 px from the scrim) flips left and its label (x 296-479) lands under the card, which paints above the whole stage. (b) The kicker and place line are plain strings whose only non-breaking joint is the NBSP in formatMetres; in the docked 1fr column (stage width - 176 px) they always wrap on phones, and the greedy line breaker breaks at whichever U+0020 falls at the column edge. 'Lone 4' is the case where the column fits 23 but not 25 mono characters."
  confirming_evidence:
    - "Measured 768x900 static: data-flip on pin 2, label 295.6-479.3 vs card 24-472: 176.4 px under, 7.3 px visible. Matches the CI baseline sliver."
    - "Measured unflipped: label 519-703 lies 169 px under the scrim and 2 px from the '2,760 m approx.' tick, so no side placement is clear at 768."
    - "Measured 375x900 desktop (gutter): column 189 px, local advance 8.4 px -> 'Waypoint 2 ' / 'of 4'. Mobile emulation 375x667 (overlay scrollbar): column 199 -> 'Waypoint 2 of ' / '4' for k=1,2,3 and 'Gornerschlucht, Zermatt ' / '· Sep 2021'."
    - "CI baseline ink: kicker line 1 (23 chars) = 183 px of ink => 8.0 px whole-pixel advance on Linux CI, so 189 px fits 23 chars -> lone '4'."
  falsification_test: "(a) If the label were hidden for a reason other than the card overlap (z-order bug, clipping, flip miscalculation), it would stay hidden at 1280/1440 or after removing the card; it is clear there, and the measured label box matches the posterFrame + flip arithmetic to < 1 px. (b) If the break were caused by something other than column width vs plain-space text (e.g. a stray newline or text-wrap style), the break position would not move with column width and glyph advance; it moves exactly as predicted (22 chars/line at 189/8.4, 23 at 199/8.4 or 189/8.0, single line at >= 210)."
  fix_rationale: "n/a (diagnose only). (a) needs a placement rule that knows the card box (or a layout where pins land in a free band at md), not a different flip threshold. (b) needs explicit break points: nowrap segments with the separator attached to the first segment, or the date on its own line in the docked layout."
  blind_spots: "Real-device rendering not checked; the phone result is Chromium mobile emulation. Safari's line breaking is the same UAX-14 greedy algorithm with fractional advances, so the 375 phone result should match, but this was not verified on a device. 3D md result measured under SwiftShader on the dev server only."
  candidate_causes:
    - "code/layout: flipPinLabels right-edge-only rule (AscentController.tsx:139-154) and the PinMark label being side-only (PinMark.tsx:58-63)"
    - "code/layout: fixed 448 px md card (WaypointCard.tsx:21, AscentHero.tsx:84) occupying 59 % of a 758 px stage, with poster pins at fixed p=0 UVs (PosterSheet.tsx:36,80-89)"
    - "config/CSS: scrollbar-gutter: stable (app/globals.css:254) narrowing the stage to 758/365 (shifts results; not causal for (a), changes the break position for (b))"
    - "environment: platform glyph-advance rounding (Linux CI 8.0 px vs 8.4 px elsewhere) moving the kicker break"
    - "data: label lengths 130-240 px; strings built with plain spaces (waypoints.ts:130,143-145; home-format.ts:60)"
  and_gate: "(a) yes: the overlap needs BOTH a pin whose label must flip into the left half (a right-side obstacle within 240 px) AND a card occupying that half; at 1280 the flip still happens but the card is far enough left. (b) yes: it needs BOTH a column narrower than the string (phones 360-412) AND a plain space at the column edge inside a segment; the exact symptom ('4' alone vs 'of 4') is selected by column width (gutter) and glyph advance (platform)."

## Symptoms

expected: (a) 768 px, static poster, waypoint 2 (Gornerschlucht) active: the pin label is not hidden behind the waypoint card. (b) 375 px, docked card: the kicker "1,668 m · Waypoint 2 of 4" never breaks so that "4" sits alone on the second line.
actual: User reported at UAT: "gap plan — both still there"
errors: None reported
reproduction: Test 3 in .planning/phases/09-home-ascent/09-UAT.md
started: Discovered at 09-14 Task 2 baseline review; logged in deferred-items.md and routed to a gap plan

## Eliminated

- hypothesis: The 768 label overlap is caused by the scrollbar-gutter mismatch (stage 758 < md 768), as in G-09-2's 3D framing.
  evidence: At 778x900 (stage exactly 768, no mismatch) the flipped pin-2 label still has 170 px under the card and 13.7 px visible. The gutter moves the label by about 6 px; the rail scrim is `md:block` on the viewport query and is present either way. Not causal for (a).
  timestamp: 2026-10-25T15:40:00Z

- hypothesis: Turning the flip off (or raising/lowering FLIP_PX) would make the label legible at 768.
  evidence: Unflipped, the pin-2 label spans x 519-703: 169 px under the rail scrim (534-758) and 2 px vertically from the '2,760 m approx.' tick label (x 576+). At 1024 the unflipped label intersects that tick. The clear band at 768 is 62 px; no side placement of a 130-240 px label fits.
  timestamp: 2026-10-25T15:55:00Z

- hypothesis: The kicker breaks before '4' because of a font-loading fallback or a stray character in the string.
  evidence: The string is '1,668 m · Waypoint 2 of 4' (only the metres NBSP). Locally the same markup breaks as 'Waypoint 2 ' / 'of 4' at a 189 px column and as 'Waypoint 2 of ' / '4' at a 199 px column; the break position tracks column width and glyph advance exactly, with JetBrains Mono resolved in both runs.
  timestamp: 2026-10-25T15:50:00Z

## Evidence

- timestamp: 2026-10-25T15:12:00Z
  checked: .planning/debug/knowledge-base.md
  found: No knowledge base file exists; no prior pattern match. Sibling session summit-pins-under-plaque.md is related (poster pins at fixed UVs; scrollbar gutter makes the stage 10 px narrower than the viewport).
  implication: Open investigation; reuse sibling's measurements of the gutter.

- timestamp: 2026-10-25T15:14:00Z
  checked: Baselines e2e/visual/routes.spec.ts-snapshots/home/768-ascent-waypoint-2-visual-dark-linux.png and 375-ascent-waypoint-2-visual-dark-linux.png
  found: 768: pin 2 head at about x 497, y 323, lit; its label is not visible except a ~13 px sliver at x ~472-485 between the card's right edge (~471) and the head. Rail line at x ~725 (= 758 - 32 - 1), so the CI stage is 758 wide (scrollbar gutter also in CI). 375: card spans x 0-365, View photo x 16-349 (content 333 px); kicker reads "1,668 m · Waypoint 2 of" / "4"; place line "Gornerschlucht, Zermatt" / "· Sep 2021". At 375 the pin-2 label is drawn LEFT of the head (flipped) and is fully legible because no card is beside it.
  implication: Both defects reproduce in CI baselines; the stage is 758 / 365 wide there too.

- timestamp: 2026-10-25T15:16:00Z
  checked: components/home/PinMark.tsx:58-63; components/home/AscentController.tsx:108-109, 139-154; components/home/AltimeterRail.tsx:63-66; 09-UI-SPEC.md:352, 538, 540
  found: Label is absolute, `left-full ml-2` (right of head) or with data-flip `right-full mr-2` (left of head), whitespace-nowrap. flipPinLabels computes x = posterFrame.left + u * side and sets data-flip when (stageW - railScrimWidth) - x < 240. The rail scrim is `w-56` (224 px) from md. The UI-SPEC only specifies the right-edge flip (240 px of the stage's right edge); nothing in spec or code considers the waypoint card on the left at md (card `md:max-w-md` = 448 px, left, AscentHero.tsx:84 + WaypointCard.tsx:21).
  implication: Predicts at 758 x 836 stage: side 836, left (758-836)*0.64 = -49.9, pin 2 x = -49.9 + 0.657*836 = 499.4; edge = 758 - 224 = 534; 534 - 499 = 35 < 240 -> flip -> label right edge = 499 - 12 - 8 = 479, label (~175 px) spans ~304-479, card spans 24-472. Matches the baseline sliver.

- timestamp: 2026-10-25T15:16:00Z
  checked: components/home/AscentHero.tsx:66-91
  found: The stage and the track share one grid cell; the track is `relative` and later in DOM order, so it (and the card) paints above everything in the stage, including the pin labels (`data-[active]:z-10` only orders pins among themselves inside the stage).
  implication: Any label box that intersects the card box is hidden; there is no z-order path for the label to show over the card.

- timestamp: 2026-10-25T15:17:00Z
  checked: components/home/WaypointCard.tsx:21, 53-55, 78; lib/ascent/waypoints.ts:130, 143-145; lib/photo-format.ts:101-105
  found: Docked layout `grid grid-cols-[128px_1fr] gap-4` inside `p-4` on a full-bleed card. Kicker `<p class="col-start-2 font-mono text-sm ...">` holds the plain string `${formatMetres} · Waypoint ${k} of ${n}`. formatMetres joins number and unit with NBSP, but every other separator (" · ", "Waypoint 2", "2 of", "of 4") is an ordinary U+0020 space. No whitespace-nowrap, no text-wrap balance/pretty, no nbsp grouping. placeDate is `${location} · ${month year}`, same pattern, same column, same classes.
  implication: Column = 365 - 2*16 - 128 - 16 = 189 px. The kicker (25 chars) needs ~210 px of 14 px mono; greedy breaking takes the longest prefix that fits and the remaining token "4" goes alone.

- timestamp: 2026-10-25T15:30:00Z
  checked: scratchpad/g093-measure.cjs on `next dev`, WebGL off (static), motion on, waypoint 2 block centred (the visual spec's procedure), 768x900 and 375x900 (scratchpad/g093-base.txt)
  found: |
    768x900: stage 758x836, card x 24-472, scrim x 534-758 (band 62 px). Pin 2 data-flip=true, head x 487.3-511.3, label "Gornerschlucht · 1,668 m" x 295.6-479.3 (w 183.7): 176.4 px under the card, 7.3 px visible. Pin 3's head is under the card as well.
    375x900: stage 365x836, kicker column 189 px, natural kicker width 210 px (8.4 px/char, JetBrains Mono, text-wrap wrap/auto). Lines: "1,668 m · Waypoint 2 " / "of 4". Place line: "Gornerschlucht, " / "Zermatt · Sep 2021".
  implication: (a) reproduces exactly as the baseline. (b) wraps locally, but at a different space than the CI baseline: the break position is platform-dependent.

- timestamp: 2026-10-25T15:40:00Z
  checked: md sweep, static, every waypoint centred, 768/778/820/900/1023/1024/1280/1440 x 900 and 768x1024 (scratchpad/g093-sweep-md.txt)
  found: |
    Active label px under its card: 768x900 k1 105, k2 176, k3 240 (pin 3 head itself under the card), k4 46; 778 k1 99, k2 170, k3 all, k4 40; 820 k1 72, k2 143, k3 all, k4 13; 900 k1 19, k2 91, k3 44 (unflipped, head under card); 1023 k2 10; 1024 k2 17.5 (lg padding moves the card 8 px right); 1280 and 1440 all clear. 768x1024: k1 101, k2 174, k3 all, k4 23.
    Pin 3's head is under the card at every width 768-1024 (u 0.459 -> x 334-465).
  implication: The waypoint-2 baseline is one sample of a md-wide defect: below ~1050 px viewport at least one lit poster label (and pin 3 itself) is under its card. Clear condition for k2 on landscape stages: 0.657 W - 204 >= card right (472/480) -> stage W >= ~1041.

- timestamp: 2026-10-25T15:45:00Z
  checked: Same sweep in live 3D (SwiftShader, __ascentBudgetMeasureOnly), 768/778/900/1024/1280 x 900 (scratchpad/g093-sweep-3d.txt)
  found: |
    3D lit pin sits on the view axis: narrow framing (canvas 758 at viewport 768, gutter) puts it at 0.3 w = x 215-239; wide framing (viewport 778, 900) at 0.5 w = x 372-396 / 433-457. Card is x 24-472 in all three. Pin head AND label are fully under the card for k=1,2,4 at 768 and all k at 778 and 900 (k3 at 768 escapes only because it is above the card's top edge). 1024 (head 495-519 vs card right 480) and 1280: clear.
    Mechanism: lib/ascent/route.ts:338-367 viewOffsetAt/viewOffsetXAt return 0 on wide stages (no horizontal offset away from the left card); the narrow x offset (VIEW_OFFSET_X_SHARE 0.2, route.ts:112-119) moves the target LEFT to 30 % to make room for a label on the right, which at 758-767 px canvas widths is under the md card (CameraRig.tsx:98-99, 315-319 narrow = canvas w < 768).
  implication: Outside the literal G-09-3 scope (static poster), but the same class and worse: in 3D at viewport 768-~980 the lit pin is invisible at every waypoint. A poster-only fix leaves this. Existing e2e (home-canvas.spec.ts:441-453 expectLit3dPin) only asserts the label is inside the stage.

- timestamp: 2026-10-25T15:50:00Z
  checked: CI baseline 375-ascent-waypoint-2-visual-dark-linux.png ink extents (scratchpad/g093-ink.cjs, decoded via a browser canvas)
  found: Kicker line 1 "1,668 m · Waypoint 2 of" ink x 161-343 (183 px), line 2 "4" x 161-166. Place line 1 "Gornerschlucht, Zermatt" x 161-343 (183 px), line 2 "· Sep 2021". 23 chars in 183 px of ink = 22 advances of 8.0 px + the last glyph; at 8.4 px the same text would need ~192 px.
  implication: Linux CI Chromium renders JetBrains Mono at whole-pixel 8.0 px advances (no subpixel positioning), so its 189 px column fits 23 characters; Windows/macOS use 8.4 px and fit 22. That is why CI shows the lone "4" and the local Windows run shows "of 4". Both lines (kicker and place) break at the identical 23-character position, so N2 and the "4" are one condition.

- timestamp: 2026-10-25T15:55:00Z
  checked: Phone sweep with isMobile emulation (overlay scrollbars, no gutter): 375x667, 360x780, 390x844, 412x915, every waypoint
  found: |
    375 (column 199): kicker "… Waypoint N of " / "4" for k=1,2,3; k4 "2,760 m approx. · " / "Waypoint 4 of 4". Place: k1 "Zermatt, Switzerland · " / "Sep 2021"; k2 "Gornerschlucht, Zermatt " / "· Sep 2021"; k3 "Matterhorn Glacier " / "Trail, Zermatt · Sep " / "2021"; k4 "Riffelsee, Zermatt · " / "2019".
    360 (column 184): kicker "… Waypoint N " / "of 4" (k1-3); place k1 "Zermatt, Switzerland " / "· Sep 2021"; k3 splits "Sep / 2021".
    390 (214): kicker on one line for k1-3; place k3 "Matterhorn Glacier Trail, " / "Zermatt · Sep 2021".
    412 (236): k4 kicker "… Waypoint 4 " / "of 4"; place k1 "… · Sep " / "2021".
  implication: On a real 375 px phone (no gutter, fractional advances) the lone "4" appears for three of four waypoints and N2's leading dot for waypoint 2. Across 360-412 px the same plain-space strings also split "Waypoint N of N", "Sep 2021", and leave dangling or leading separators. The width at which each defect shows depends on column width (gutter) and glyph advance (platform), so a fix must define break points, not tune widths.

- timestamp: 2026-10-25T15:58:00Z
  checked: Existing tests: e2e/home-ascent.spec.ts:403-410; e2e/home-canvas.spec.ts:441-453; components/home/__tests__/waypoints.test.tsx; e2e/visual/routes.spec.ts:146-170
  found: Poster: lit label only `toBeVisible()` (true even when covered). 3D: label inside the stage only. No test intersects a lit label or pin head with the card box, and no test reads kicker/place line breaks. The visual baselines caught both, but only as pixels, with Linux whole-pixel metrics.
  implication: No gate exists for occlusion by the card or for line-break quality; the gap plan needs geometric and structural assertions.

## Resolution

root_cause: |
  (a) 768 label under the card. AND-gate of two layout rules that never consult each other:
    1. At md the waypoint card is a fixed 448 px column on the left (components/home/WaypointCard.tsx:21 `md:w-full md:max-w-md`; components/home/AscentHero.tsx:84 li `max-w-6xl px-4 sm:px-6 lg:px-8 md:justify-center`) = x 24-472, 59 % of the 758 px stage at 768. The track paints over the whole stage (AscentHero.tsx:72 `relative`, later in DOM; 09-UI-SPEC line 77), so anything in the stage under that box is hidden.
    2. Poster pins sit at fixed UVs of the p=0 crop (components/home/PosterSheet.tsx:36, 80-89; lib/ascent/poster-frame.ts:40-56); pin 2 (u 0.657) lands at head x 487-511 at 758x836. The label is side-only (components/home/PinMark.tsx:58-63: `left-full ml-2`, or `right-full mr-2` with data-flip) and the flip rule (components/home/AscentController.tsx:108-109 FLIP_PX 240; 139-154 flipPinLabels: edge = stageW - rail scrim width, flip when edge - x < 240) knows only the right obstacle. Pin 2 is 35 px from the scrim (components/home/AltimeterRail.tsx:63-66 `w-56 md:block`, x 534-758), so it flips left and the 184 px label spans x 296-479: 176 px under the card, 7 px visible. The spec defines only this right-edge flip (09-UI-SPEC lines 352, 538, 540); nothing defines placement when the left side is the card.
    The clear band between card and scrim is 62 px at 768 (114 at 820, 194 at 900) against 150-260 px needed, so neither side placement can work below ~1050 px: unflipped, the label runs 169 px into the scrim and touches the '2,760 m approx.' tick. The scrollbar gutter (app/globals.css:254) is not causal here (778 px, no mismatch, still 170 px under).
    Extent: every lit poster label at 768-1023 intersects its card (k1 105, k2 176, k4 46 px at 768) and pin 3's head is under the card at 768-1024. Same class, worse, in live 3D: the lit pin sits on the view axis (0.3 w narrow at viewport 768-777, 0.5 w wide from 778; lib/ascent/route.ts:112-119, 338-367; components/home/terrain/CameraRig.tsx:98-99, 315-319), which is under the card, so at viewport 768-~980 the lit 3D pin and label are fully hidden at every waypoint.
  (b) 375 kicker orphaning "4" (and G-09-4 N2, the leading "·"). One mechanism:
    The docked text column is stage width - 176 px (components/home/WaypointCard.tsx:21 `-mx-4 p-4`, :53 `grid-cols-[128px_1fr] gap-4`): 189 px at 375 with the scrollbar gutter (CI, desktop), 199 px on a phone with overlay scrollbars. The kicker (WaypointCard.tsx:54-56; lib/ascent/waypoints.ts:143-145 `${metres} · Waypoint ${k} of ${n}`, 25 chars) and the place line (WaypointCard.tsx:78; waypoints.ts:130 `${location} · ${month year}`, lib/home-format.ts:60) are plain strings; only formatMetres' NBSP (lib/photo-format.ts:104) is unbreakable. They are wider than the column on every phone, and greedy line breaking breaks at whichever plain space sits at the column edge. When the column fits 23 but not 25 characters, the kicker ends "of" / "4" and the place line ends "Zermatt" / "· Sep 2021" (both have 23-char first lines). That happens in CI (189 px / 8.0 px Linux whole-pixel advance = 23.6) and on real 375 px phones (199 / 8.4 = 23.7), but not on desktop Windows/macOS (189 / 8.4 = 22.5 -> "of 4"). Across 360-412 the same strings also split "Sep / 2021" and "Waypoint 4 / of 4".
  Test gap: no test intersects a lit label or pin head with the card box (home-ascent.spec.ts:403-410 only toBeVisible; home-canvas.spec.ts:441-453 only inside the stage), and none reads kicker/place line breaks.
fix:
verification:
files_changed: []
