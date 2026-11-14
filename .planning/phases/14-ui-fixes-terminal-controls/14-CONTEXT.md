# Phase 14: UI Fixes & Terminal Controls - Context

**Gathered:** 2026-11-14
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase removes the UI bugs carried from v2.0 for keyboard, touch and narrow-screen visitors, and adds manual stepping and a static transcript to the box terminal demo. Requirements: SHELL-07, SHELL-08, HOME-09, HOME-10, LBOX-08, ENG-06.

Deliverables:
- **Mobile menu (SHELL-07, SHELL-08).** Tapping the current page's link closes the panel. Every focus ring in the panel is fully visible at 375 px.
- **Home at 375 px (HOME-09).** No horizontal overflow in any Home mode, fixed at the overflowing element, or proven absent and guarded.
- **Altimeter rail (HOME-10).** Every tick label keeps at least 4.5:1 over the live canvas and the poster at every md+ breakpoint, and the rail scrim covers the full label run.
- **Lightbox focus (LBOX-08, ledger 10 IN-01).** After stepping and closing, focus lands on the shown photo's trigger, fully in view. A regression test holds this before Phase 18 rewrites the lightbox. Hiding labels no longer leaves a hidden callout that eats the first Escape.
- **Terminal (ENG-06).** Previous and Next step buttons, and a static transcript in a disclosure that is open by default under reduced motion.

The UI-SPEC is required but short (`/gsd-ui-phase 14` with ui-ux-pro-max, before `/gsd-plan-phase 14`). It covers the terminal step buttons and transcript disclosure, the rail scrim stops and the menu's inset ring. One declared PNG set per cause (mobile menu, Home at 375 px if a fix changes pixels, rail scrim, case-study terminal); baselines come only from the CI `workflow_dispatch` container, and Tim commits the PNGs.

Out of scope: new terminal interactions beyond the buttons and transcript, the Phase 18 lightbox rewrite, and anything in the other v2.1 phases.

</domain>

<decisions>
## Implementation Decisions

### Terminal step controls (ENG-06)
- **D-01: Previous and Next sit on either side of the dots in the bottom bar.** The title bar is unchanged: `{name} · n / count` on the left, Pause on the right. Layout at a glance: `[‹]  • ━ • •  [›]`. The buttons are 44 × 44 px hit areas. Their names follow the photo viewer's 'Previous photo' / 'Next photo' pattern (for example 'Previous command' / 'Next command'; the UI-SPEC fixes the copy). Like the dots, they render only when there are two or more commands (G2 unchanged).
- **D-02: A step presses Pause.** Pressing Previous, Next or a dot sets the sticky Pause (`aria-pressed="true"`), so the visitor reads at their own pace. Only releasing Pause resumes, and the release follows 11 D-02 (amended) unchanged: it also clears the hover and focus pauses. This changes how the 11 D-03 dots behave today: a dot press used to pause only while hover or focus lasted, and on touch autoplay moved on 3 s after the tap. `lib/demo-terminal.ts` and its Jest suite, `components/projects/__tests__/DemoTerminal.test.tsx` and `e2e/case-study.spec.ts` change together. Tests assert state (`aria-pressed`, `data-playback`, `data-command`), not classes.
- **D-03: The steps stop at the ends and never wrap.** On command 1, Previous is `aria-disabled`; on the last command, Next is. Both stay focusable and do nothing, exactly like the photo viewer's stepping controls (`components/photos/PhotoViewer.tsx` "Moving between photos", UI-SPEC OQ4). Autoplay still loops from the last command back to the first; only the manual steps stop.

### Terminal transcript (ENG-06)
- **D-04: The transcript is a native `<details>` directly below the terminal box, outside its `role="region"`.** Its summary reads 'Transcript' (the UI-SPEC may refine the wording). It holds every command in order: the prompt glyph and command line, the captured output exactly as captured (11 D-26: real output is the proof), and the note when the command has one. It is server-rendered, so it works without JavaScript, and it is plain, selectable text, never `aria-live`. Commands and output are set in mono and notes in Inter, as in the terminal.
- **D-05: Under reduced motion the visitor sees both:** the paused terminal (which already starts paused with command 1's full text and can still be stepped) above the open transcript. The duplicate text is accepted; the terminal looks the same for every visitor.
- **D-06: The server renders the transcript closed, and after hydration the client opens it under `prefers-reduced-motion: reduce`.** This is the same pattern as the Pause toggle, which flips to pressed after hydration. Only reduced-motion visitors see the one-time expand; default visitors and Lighthouse see no layout shift. Without JavaScript it stays closed and can be opened. The open state is not remembered between visits.
- **D-07: Opening the transcript presses Pause** (the same rule as D-02), so nothing moves above the text being read. Closing it does not resume; only releasing Pause does. Under reduced motion Pause is already pressed, so the automatic open changes nothing.

### Lightbox focus on close (LBOX-08)
- **D-08: Diagnose before fixing** (ROADMAP research note: not diagnosed at 12-UAT). The 12-UAT finding: after stepping, then Escape, focus landed on a map mark outside the viewport at 1366×650 (partly), 1280×560 and 720×450 (fully). `restoreFocus` (`components/photos/LightboxDialog.tsx`) already focuses the mark with `preventScroll` and then calls `scrollIntoView({ block: 'nearest' })`, so something that runs later (most likely scroll restoration after `router.back()`) probably moves the page. The researcher or planner confirms the root cause and records it.
- **D-09: The guaranteed outcome.** After close, focus is on `[data-photo-id="{slug shown}"]` in the mounted view, and that element and its 2 px focus ring are fully inside the viewport, below the sticky nav. The page scrolls as little as needed, with an instant jump and no smooth scroll. If the trigger is already fully visible, the page does not move. The existing fallbacks (the opener, then the main h1) are unchanged.
- **D-10: Every close path gets the D-09 guarantee:** Escape, the 'Close photo' button and browser Back (toolbar, Alt+←, gesture). All three already end in `restoreFocus`, so one fix covers them, and the test proves each.
- **D-11: The regression test asserts the contract, not the views.** It checks the `[data-photo-id]` focus target and its in-viewport rectangle, so when Phase 18 retires the Map/Grid/Carousel switch it rewrites only the open-and-step setup, never the assertion (GUARD-03). Matrix:
  - Chromium: Map, Grid and Carousel × 1366×650, 1280×560, 720×450 and 375×667, each opening a photo, stepping several times, then pressing Escape.
  - Firefox and WebKit: one Map case at 720×450 with Escape.
  - Chromium at 720×450: the 'Close photo' button and browser Back (`page.goBack()`) paths.
  The step count and starting photo are chosen so the shown photo's trigger starts off-screen at each size.

### Escape when labels are hidden (ledger 10 IN-01, 13-LEDGER-TRIAGE.md #30)
- **D-12: Hiding labels collapses the open callout.** Pressing 'Hide labels' or the H key clears `expandedId`, so the next Escape goes to zoom or closes the lightbox, and a key press never acts on something the visitor can't see. Showing labels again starts with every callout collapsed. The callout stays the first Escape layer while labels are shown (10-UI-SPEC order: callout, then zoom, then close). Ledger row #30 is written back as fixed in Phase 14.

### Rail scrim and label contrast (HOME-10)
- **D-13: Deepen the scrim's gradient stops and keep its `w-56` width, element and place in the stage.** `components/home/terrain/CameraRig.tsx:390` reads the scrim's `offsetWidth` as the rail zone, so the same width keeps the camera framing, the pin layout and the summit pin-clearance tests unchanged. The dense part of the gradient holds past the longest label's left edge ('2,760 m approx.') at every md+ breakpoint, then fades. This reverses 12-07 D-24 ("accept 4.81:1, no scrim change"), and HOME-10 records why. — **Reversibility:** reversible — the stops are one class string; the PNG set is re-baselined once.
- **D-14: Aim for at least 5:1, gate at 4.5:1.** The UI-SPEC sizes the stops so every label's worst pixel measures at least 5:1 in CI over both surfaces; the test fails below 4.5:1 (AA, the requirement's number). The headroom absorbs GPU and antialiasing noise without making CI brittle.
- **D-15: The contrast check samples breakpoints × stops on both surfaces.** B8 in `e2e/home-modes.spec.ts` is rewritten, never deleted. It runs in Chromium with WebGL on (the live canvas) and off (the poster), at 768, 1023, 1280 and 1440 px wide, at each waypoint's settled stop and at the summit, taking the worst pixel behind every tick label (the readout stays hidden while sampling, as today). The live-canvas rows are Chromium-only because software WebGL in the other engines is unreliable in CI. The existing N1 rows stay.

### Mobile menu (SHELL-07, SHELL-08; ledger 07 WR-06, 13-LEDGER-TRIAGE.md #6)
- **D-16: Tapping the link for the page already shown** (its `href` equals the pathname) closes the panel, returns focus to the Menu button as Escape does, and leaves the scroll position untouched: no jump to the top and no visible reload. Links that change the pathname keep today's behaviour; for example, 'Photos' on `/photos/[slug]` is marked current but navigates to `/photos`. The hidden link never takes focus down with it to `<body>`.
- **D-17: Menu rows get an inset focus ring.** Links inside the panel draw the same 2 px ring inside their own box (negative offset), so the panel's `overflow-y-auto` can't clip it at any width. The rows stay full-bleed, and the current-page accent bar stays at the left edge. The exception is scoped to the panel's links; the global `:focus-visible` rule in `app/globals.css` is unchanged. The ring keeps at least 3:1 against the panel background, and the UI-SPEC records the exact offset and how the ring meets the accent bar.

### Home at 375 px (HOME-09)
- **D-18: Measure first, then fix or guard.** The overflow first reported (the v1 project card ending at x = 399, 08 deferred items) was removed in 09-01, and `e2e/home-ascent.spec.ts` already checks 375 px in its docked, summit and reduced-motion rows. Phase 14 measures Home at 375 px in every mode (live 3D, poster/static, reduced motion, no JavaScript) at every scroll stop (hero, each waypoint, summit, About and footer), with `document.documentElement.scrollWidth <= clientWidth`.
  - If an element overflows, it is fixed at that element. Never with `overflow-x: hidden` on `html`, `body` or `main`, which breaks the sticky stage and rail (`.planning/research/PITFALLS.md`); `overflow-x: clip` only on the element itself if a clamp is still needed.
  - If nothing overflows, the missing rows are added to the e2e suite as a guard, and HOME-09 is closed as "fixed by 09-01, now guarded".
  - The same 375 px sweep runs on the case-study and photo pages. An overflow found there is logged for Tim as a new item, not fixed under HOME-09.

### Branch, merge and process
- **D-19: Phase 14 runs on `gsd/phase-14-ui-fixes-terminal-controls`,** cut from `e6ffce1` (Tim, 2026-11-14). It carries the two local Phase 13 close commits (`66958a6` UAT, `e6ffce1` transition), which reach `main` with the Phase 14 PR. Pushes of this branch, any `ci/14-*` branch and the visual re-baseline dispatch each need Tim's ask; the standing approval does not cover Phase 14.
- **D-20: The ROADMAP fallback for the Deployment Checks live proof is not needed.** 13-UAT test 1 proved it on the Phase 13 close merge (`aef25e2`, PR #147): production waited until `CI OK` (23:55:05Z), then deployed (23:55:07Z).

### Claude's Discretion
- Copy for the step buttons, the transcript summary and any live wording, settled in the UI-SPEC with ui-ux-pro-max.
- A step or a dot lands on the target command fully typed out (the existing `goTo` semantics); there is no typing replay.
- Whether the transcript renders for a single-command terminal (G2).
- Whether other panel links also close the menu at tap rather than on the route change (research suggests closing in the click handler).
- The mechanism that makes D-09 hold against scroll restoration, chosen after the D-08 diagnosis.
- How "the scrim covers the full label run" is asserted geometrically next to the pixel check (for example, the label run's left edge within the dense stop at each width).
- How the PNG sets split per cause. The terminal's reduced-motion baselines change once the transcript opens after hydration.
- If a new Firefox case hits the Playwright #43967 crash, the existing `@firefox-43967` tag rule applies (13-20).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/ROADMAP.md` § "Phase 14: UI Fixes & Terminal Controls": goal, success criteria, UI-SPEC scope, baselines, Tim inputs and scope notes (07 WR-06, 10 IN-01).
- `.planning/REQUIREMENTS.md`: SHELL-07, SHELL-08, HOME-09, HOME-10, LBOX-08, ENG-06 (lines 27-31, 69).
- `.planning/PROJECT.md` § Constraints (ui-ux-pro-max for all UI work, dark-only, same-origin) and § Key Decisions (two keyboard findings accepted unfixed at 12-UAT; the ENG-F1 deferral).
- `.planning/research/SUMMARY.md` (what Phase 14 delivers) and `.planning/research/PITFALLS.md` (375 px overflow: never `overflow-x: hidden` on body or main).

### Evidence for the bugs
- `.planning/milestones/v2.0-phases/12-contact-edge-pages-cleanup-verification/12-UAT.md` test 3: the Escape focus sizes and the clipped menu ring.
- `.planning/milestones/v2.0-phases/09-home-ascent/deferred-items.md`: the rail label at 4.81:1 at 768 px, and 12-07 D-24, which D-13 reverses.
- `.planning/milestones/v2.0-phases/08-data-terrain-pipeline/deferred-items.md`: the original 375 px Home overflow (the v1 card, removed in 09-01).
- `.planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md` rows #6 (07 WR-06, SHELL-07) and #30 (10 IN-01).
- `.planning/debug/resolved/hero-scrim-over-rail.md`: why the rail lives in its own sticky layer (G-09-4 N1).

### Prior decisions this phase builds on
- `.planning/milestones/v2.0-phases/11-engineering-roadmap/11-CONTEXT.md`: D-01 (flat token terminal), D-02 amended (pause sources, release rule), D-03 (dots), D-26 (captured output and notes).
- `.planning/milestones/v2.0-phases/11-engineering-roadmap/11-UI-SPEC.md`: the terminal's Pause toggle, dots, lines and screen-reader text.
- `.planning/milestones/v2.0-phases/12-contact-edge-pages-cleanup-verification/12-UI-SPEC.md` (D-24, E13): the terminal's shared-grid-cell layout.
- `.planning/milestones/v2.0-phases/10-photography/10-UI-SPEC.md` "Focus" and "Return on close" (Escape layers, focus return), and `10-CONTEXT.md` D-08 to D-11.
- `.planning/milestones/v2.0-phases/09-home-ascent/09-UI-SPEC.md` "Altimeter Rail" and the 375 px guardrail row.
- `.planning/milestones/v2.0-phases/07-foundation-guardrails/07-UI-SPEC.md` "SiteNav" / "Mobile menu".

### Process
- `.planning/phases/13-repo-safety-test-debt/deferred-items.md`: the Firefox `@firefox-43967` tag and `FIREFOX_INVERT` owners, and the relay long-mirror watch.
- `e2e/visual/README.md`: the re-baseline flow (CI `workflow_dispatch`; Tim commits PNGs).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/demo-terminal.ts`: a pure state machine (`goTo`, `tick`, `isPlaying`, `releaseSticky`, `visibleLines`). Previous and Next can be `goTo(index ± 1)` with end checks; the sticky press reuses the `override` state in the island.
- `components/projects/DemoTerminal.tsx`: the `TOGGLE` and `DOT` class constants, `useReducedMotion`, and the `override ?? reduced` flip after hydration (D-06 reuses that pattern for `<details open>`). It also has the sr-only `spokenCommand` block and `data-playback` / `data-command` for tests.
- The photo viewer's stepping controls (`components/photos/PhotoViewer.tsx` "Moving between photos", `components/photos/CarouselControls.tsx`): the aria-disabled-at-the-ends pattern for D-03.
- `components/photos/LightboxDialog.tsx`: `restoreFocus(slug, opener)`, `LIGHTBOX_CLOSE_EVENT`, `registerEscape`; `lib/photos/css-escape.ts`.
- `components/site/SiteNav.tsx`: `buttonRef`, the Escape handler that focuses the Menu button (D-16 reuses it), `isCurrentPath`, and `MENU_ID`.
- E2E helpers: `worstContrastBehind` (`e2e/home-modes.spec.ts:122`), `scrollBlockToCentre` (`e2e/helpers/ascent.ts`), `disableWebGL` (`e2e/helpers/webgl.ts`), and the settled-pin helpers in `e2e/home-canvas.spec.ts`.

### Established Patterns
- Tests assert state and attributes, not classes (11 D-02), and are rewritten, never deleted (GUARD-03). `guard:tests` runs in CI's Unit Tests job, not in local `npm run lint`.
- The terminal's server-rendered first state is command 1, complete; the client changes state only after hydration, so hydration never blanks text.
- The mobile menu is a disclosure, not a dialog: no focus trap, no scroll lock. Escape is captured on the document and returns focus to the Menu button.
- The palette, contrast, identity and served-image guards apply to every new class string; tokens only.
- The rail is decorative (`aria-hidden`, no pointer events) in its own sticky layer above the track. The scrim stays in the stage because the camera reads its width.

### Integration Points
- `app/(site)/projects/[slug]/page.tsx`: the server page that renders the DemoTerminal island in box's Demo section. The transcript `<details>` can render here or inside the island's server output.
- `components/home/AscentHero.tsx:84-87`: the `data-ascent-rail-scrim` element (its stops change; width and position stay).
- `e2e/home-modes.spec.ts:483` (B8) and the N1 block, `e2e/home-ascent.spec.ts` (375 px rows), `e2e/photos-lightbox.spec.ts` (the LBOX-08 test lives here or next to it), `e2e/case-study.spec.ts` (terminal behaviour), `components/site/__tests__/SiteNav.test.tsx`, `components/projects/__tests__/DemoTerminal.test.tsx`, `lib/__tests__/demo-terminal.test.ts`.
- `e2e/visual/routes.spec.ts`: the box route baselines (375 and 1440, including reduced) and the Home and menu sets.

</code_context>

<specifics>
## Specific Ideas

- The terminal's bottom bar should read like a small carousel: `[‹]  • ━ • •  [›]`, with the title bar unchanged.
- The transcript is the proof as well as the accessible text: real captured output, nothing invented (11 D-26).
- The scrim change should be invisible to the camera: same width, deeper stops.
- The menu ring goes inside full-bleed rows, like a focused row in a native list.

</specifics>

<deferred>
## Deferred Ideas

- An overflow found outside Home by the D-18 sweep (case-study or photo pages at 375 px) is logged for Tim as a new item, not fixed under HOME-09.

Otherwise none: the discussion stayed within phase scope.

</deferred>

---

*Phase: 14-ui-fixes-terminal-controls*
*Context gathered: 2026-11-14*
