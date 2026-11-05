# Phase 11 — UI Review

**Audited:** 2026-11-02
**Baseline:** 11-UI-SPEC.md (approved)
**Screenshots:** not captured (no dev server on 3000/5173/8080). Audited the committed CI baselines (e511d7a; box 1440 and roadmap 375 viewed) plus code analysis.
**Interaction captures:** off (workflow.ui_interaction_capture is false). Interaction findings are code-derived.

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Specific, candid copy and no generic labels. The coin-flip poster HEADS label is hidden on the live site by the native controls. |
| 2. Visuals | 3/4 | Clear hierarchy and one primary CTA per page. The demo terminal has a large dead area and the live poster is covered. |
| 3. Color | 4/4 | Accent is limited to the reserved list, the trail paint is background-only, and no hardcoded colors. |
| 4. Typography | 3/4 | Four sizes and two weights hold. The `--force` inline code now follows paragraph size and colour. |
| 5. Spacing | 3/4 | One banned `py-3` (12 px) and one arbitrary `top-[39px]`. The phone Route stages disclosure sits 88 px under the trailhead. |
| 6. Experience Design | 3/4 | Native details, 44 px targets, a reduced-motion pause and a designed 404 are in place. Live clip controls are unverified. |

**Overall: 19/24**

## Top 3 Priority Fixes

1. **Banned 12 px padding on the end-block route sign** (`components/projects/EndBlock.tsx:8`, `py-3`). This breaks the spec rule "no 12 px padding" and fails the spacing guard intent. Use `py-4`, or `min-h-11` with `py-2`.
2. **The native video control bar hides the poster's HEADS label on the live site** (`components/projects/DemoClip.tsx:32-37`, `controls` plus `poster`). The only visible state-of-the-result cue is lost at rest, and CI baselines hide controls so they never show it. Either move the label into the figcaption or re-crop the poster so the label sits above the control bar's height (about 40 px).
3. **Demo terminal reserves a fixed-height body that is mostly empty** (`components/projects/DemoTerminal.tsx`, body region, visible in the box 1440 baseline at about y 1150-1250). The short commands leave roughly 100 px of dead panel and weaken the Demo block. Size the body to the tallest transcript entry rather than a fixed minimum.

Also worth fixing: `components/roadmap/RouteLog.tsx:61` uses `top-[39px] -left-[33px]`. These are arbitrary offsets, so derive them from the row's padding and the axis offset tokens.

## Detailed Findings

### Pillar 1: Copywriting (3/4)
- No generic Submit, OK or Click Here strings in the Phase 11 components.
- The CTAs "Ask for a walkthrough", "GitHub", "All routes", "Show all entries" and "Phases 7–12" match the contract. The roadmap shows "Want to talk about something on this list? Get in touch."
- Roadmap rows are specific and candid. Dates render through `formatLogDate`, for example "Completed 9 Aug 2026".
- WARNING: on live coin-flip the poster's HEADS text is occluded by the native controls (known note 1).
- WARNING: the box "Source" links in metric tiles are all the same word. Their accessible names should say what each source is (tools, tests, binary).

### Pillar 2: Visuals (3/4)
- The focal point is clear. The box trailhead stacks h1, outcome line and profile figure, with the profile glyph balancing the right column at 1440.
- Waymark badge `T4` and its caption are legible. The trail glyph at 16 × 12 px is small but never carries meaning alone, which is correct.
- The roadmap 375 baseline reads well: axis, a Current camp band with its marker, and Summit/Base bands.
- WARNING: terminal dead area (see fix 3). The Pause toggle's inverse fill (`aria-pressed:bg-ink`) is the brightest element on the page at rest. It competes with the single primary CTA, though the spec allows it.
- No icon-only buttons found without a label (Pause carries a visible text label).

### Pillar 3: Color (4/4)
- No hex or rgb literals in Phase 11 components. The only matches were class strings.
- Accent appears only on the reserved list: the end-block primary fill, selected-segment bar, route-index current bar, camp marker and prose links. There is one primary fill per view.
- Trail paint uses the `bg-trail-*` utilities only, as backgrounds.

### Pillar 4: Typography (3/4)
- No `text-xs`, `text-xl`, `font-bold` or `font-medium` found in Phase 11 files. This matches the four-size, two-weight contract.
- WARNING: the `--force` inline code in the Safety prose now follows the paragraph size and colour (known note 3). The baseline shows it renders as plain mono in muted ink, so it reads weaker than the preview-block commands. This is acceptable but diverges from the spec's mono-for-commands treatment.
- Line length is held by `max-w-prose`. The Problem and Safety paragraphs wrap at about 65ch in the baseline.

### Pillar 5: Spacing (3/4)
- BLOCKER-level for the guard intent only: `EndBlock.tsx:8` `py-3` (12 px). It is a single cosmetic deviation, so scored as a warning.
- WARNING: arbitrary `top-[39px]` and `-left-[33px]` in `RouteLog.tsx:61`. The spec lists geometric exceptions, but these are not among them.
- WARNING: on phones the Route stages disclosure sits 88 px under the trailhead (known note 2). The gap breaks the 48 px section rhythm and orphans the disclosure from the heading it indexes.
- Gaps between sections hold `mt-16` and the section rhythm is consistent in the 1440 baseline.

### Pillar 6: Experience Design (3/4)
- Native `<details>` is used for the mobile route index and roadmap phase disclosures, both with `min-h-11` summaries. 12 `min-h-11` / `min-w-11` target declarations were found.
- The terminal starts paused under reduced motion (`DemoTerminal.tsx:153`). `aria-pressed` carries the state, and the pager dots are keyed by count.
- Former CLI_X slugs return the designed 404 (`dynamicParams = false`).
- WARNING: loading, error and empty states are partial. The route-log empty state exists, but there is no visible failure path for the video (no fallback text inside `<video>` beyond the poster). Not verified in a browser.
- The pager dots are small, with a 2 px × 24 px active mark. Their hit areas were not verified at 44 px (the dot bar is 48 px tall, so the row passes by height; width per dot is unverified).

## needs_human_review
- Live coin-flip clip: confirm the poster crop against the native control bar in Chrome, Safari and Firefox.
- Phone view: confirm the 88 px gap above the Route stages disclosure is acceptable.
- Pager dot hit width at 375 (not measured).
- The 3/4 scores for Typography, Visuals and Spacing rest on baselines and code, not on live screenshots.

## Files Audited
components/projects/{EndBlock,DemoTerminal,DemoClip,RouteIndex,CaseStudy,RoutePanel,RouteProfile,TrailGradeMark,Trailhead}.tsx, components/roadmap/{RouteLog,RouteLogFilters,RouteRow}.tsx, app/(site)/projects/page.tsx, app/(site)/projects/[slug]/page.tsx, app/(site)/roadmap/page.tsx, 11-UI-SPEC.md, and CI baselines for box 1440 and roadmap 375.
