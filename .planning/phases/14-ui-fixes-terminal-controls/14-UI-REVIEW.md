# Phase 14 — UI Review

**Audited:** 2026-11-14
**Baseline:** 14-UI-SPEC.md (approved)
**Screenshots:** not captured by this audit (no server started). Evidence: CI-rendered baselines from 55160a4 (menu/375, box/375, home/1440 summit) read directly, plus code inspection of the five changed components.
**Interaction captures:** off (workflow.ui_interaction_capture is false). Interaction findings are code- and summary-derived.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | "Previous command", "Next command", "Transcript" match the contract verbatim |
| 2. Visuals | 3/4 | Menu ring and terminal controls match; 375 px box page is long and the transcript duplicates the demo above it (accepted by D-05) |
| 3. Color | 3/4 | No new tokens; scrim darkens the right band by design but is a visible hard-ish edge at 1440 |
| 4. Typography | 4/4 | Only text-sm, text-base font-semibold, existing roles; Mono for data, Inter for notes |
| 5. Spacing | 3/4 | Scale respected; dot row gap-1 is a ratified amendment, leaving 4 px between 44 px targets (below the spec's own 8 px touch-spacing rule) |
| 6. Experience Design | 3/4 | aria-disabled ends, sticky Pause, native details and no-JS transcript are solid; some interaction claims unverified visually |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **Dot-row gap-1 undercuts the spec's 8 px touch-spacing rule** — at 4 px between adjacent 44 px dot hit areas, mis-taps on phones are likelier; this was a deliberate amendment to avoid a 3+1 wrap in desktop Chromium at 375 px — Consider making the dot hit areas smaller than 44 px with 8 px spacing, or accept and document an explicit exception against the UUPM `touch-spacing` rule.
2. **Scrim band edge visible at 1440 px** — in the summit baseline the right 224 px reads as a distinct darker slab with a noticeable left transition against bright terrain; legibility is satisfied (B8 lowest 7.91:1) but the edge competes with the terrain — Consider `via-80%` or a softer fade only if Tim finds it distracting. The spec's P3 alternative (`via-90%`) would be harder, so this is a taste call, not a defect.
3. **Transcript doubles the page length at 375 px** — in reduced-motion the open transcript repeats all four commands directly beneath the terminal, pushing Stack and the CTA far down the page — Accepted by D-05; revisit with a `max-h` scroll only if analytics or Tim show drop-off (the spec bans inner scroll, so this would need a spec change).

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- DemoTerminal.tsx:386 `aria-label="Previous command"`, :421 "Next command", summary text "Transcript" (:441) — exact match to the Copywriting Contract.
- No generic labels introduced; no new empty or error copy needed (contract marks both N/A).
- Minor: "Transcript" is a bare noun; the checker flagged this as non-blocking and it sits under the "Demo" h2.

### Pillar 2: Visuals (3/4)
- Menu baseline (menu/375): the focused "Engineering" row shows a 2 px cyan ring fully inside the panel on all sides, not clipped; the current-row accent bar abuts the ring as designed. Clear focal state. WARNING: because the ring and the bar are 1.21:1 against each other, on this row the left edge reads as a single thick stroke; acceptable per the spec, but confirm on real devices.
- Box baseline (box/375): bottom bar shows one row `‹ • ━ • • ›` with the Pause pill above; the transcript sits below as an unfilled framed block with a caret, visually distinct from the raised terminal. Matches P1/P2 defaults.
- Home summit (1440): ticks, readout and pins remain readable; 2,760 m approx. label legible over the scrim.
- Icon-only buttons all carry aria-labels; icons are `aria-hidden`.

### Pillar 3: Color (3/4)
- No new `--color-*` token; no hardcoded hex found in DemoTerminal.tsx or SiteNav.tsx (git grep clean).
- Accent is not used on step buttons, dots, transcript or summary (contract holds); focus ring uses `focus` token.
- Scrim: AscentHero.tsx:92 uses the locked stops `from-surface/90 via-surface/85 via-85% to-transparent to-100%`; B8 recorded 7.91:1 lowest live and 7.93:1 poster, above 5:1 aim. WARNING (visual only): the slab edge is visible in the 1440 summit PNG.

### Pillar 4: Typography (4/4)
- Transcript: `text-sm` Mono for command and output, `font-body` for notes, `text-base font-semibold` for the summary; weights remain 400/600.
- `whitespace-pre-wrap wrap-anywhere` on both `<code>` and `<pre>`; no sideways scroll visible in the 375 baseline, the long `box du` pipeline wraps.
- Prompt glyph is `select-none` and `aria-hidden` as specified.

### Pillar 5: Spacing (3/4)
- Bar: `min-h-12 gap-2 px-4`, STEP `size-11`, transcript `mt-4`, entries `py-4`, command to output `mt-1`, output to note `mt-2` — all on the declared scale; no arbitrary values found.
- WARNING: dot wrapper uses `gap-1` (DemoTerminal.tsx:395), amended with Tim's decision (c) from `gap-2`. Documented, but 4 px between 44 px targets conflicts with the contract's own "8 px to neighbours" exception line; the spec text for Spacing still reads 8 px.
- Menu ring offset -4 px (SiteNav.tsx:251) as specified.

### Pillar 6: Experience Design (3/4)
- Ends use `aria-disabled` and stay focusable; press does nothing (14-05 summary, Jest and Playwright rows).
- Sticky Pause coupling for steps, dots and transcript open; closing does not resume.
- Transcript: server-rendered closed `<details data-transcript>`, mount-only reduced-motion open, only when `count > 1` — matches Discretion decisions.
- SHELL-07 tap-close uses `preventScroll` focus on Menu; lightbox `revealTrigger` with double reveal after history restoration; Hide-labels clears expandedId and D-22 visibility guard on Escape. All backed by Chromium and Firefox runs plus CI WebKit (1471 passed per 14-08).
- WARNING: none of these interaction behaviours were visually captured in this audit; the findings are summary- and code-derived. The 14-08 follow-up flagged 12-UAT test 3 (keyboard re-check) as outstanding for verify-work.
- No registry audit (shadcn not initialised).

---

## Files Audited
- components/projects/DemoTerminal.tsx
- components/site/SiteNav.tsx
- components/home/AscentHero.tsx
- e2e/visual/routes.spec.ts-snapshots/menu/375-current-focus-visual-dark-linux.png
- e2e/visual/routes.spec.ts-snapshots/box/375-reduced-visual-dark-linux.png
- e2e/visual/routes.spec.ts-snapshots/home/1440-ascent-summit-visual-dark-linux.png
- .planning/phases/14-ui-fixes-terminal-controls/14-UI-SPEC.md and 14-01 to 14-08 SUMMARY files
