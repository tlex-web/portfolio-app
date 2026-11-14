# Phase 14: UI Fixes & Terminal Controls - Research

**Researched:** 2026-11-14
**Domain:** Next 16.4.5 App Router focus/scroll behaviour, React 19.3 client islands, Playwright 1.65 e2e
**Confidence:** HIGH (LBOX-08 root cause reproduced and its fix prototyped in Edge and Firefox; WebKit could not be run locally)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Terminal step controls (ENG-06)
- **D-01: Previous and Next sit on either side of the dots in the bottom bar.** The title bar is unchanged: `{name} · n / count` on the left, Pause on the right. Layout at a glance: `[‹]  • ━ • •  [›]`. The buttons are 44 × 44 px hit areas. Their names follow the photo viewer's 'Previous photo' / 'Next photo' pattern (for example 'Previous command' / 'Next command'; the UI-SPEC fixes the copy). Like the dots, they render only when there are two or more commands (G2 unchanged).
- **D-02: A step presses Pause.** Pressing Previous, Next or a dot sets the sticky Pause (`aria-pressed="true"`), so the visitor reads at their own pace. Only releasing Pause resumes, and the release follows 11 D-02 (amended) unchanged: it also clears the hover and focus pauses. This changes how the 11 D-03 dots behave today: a dot press used to pause only while hover or focus lasted, and on touch autoplay moved on 3 s after the tap. `lib/demo-terminal.ts` and its Jest suite, `components/projects/__tests__/DemoTerminal.test.tsx` and `e2e/case-study.spec.ts` change together. Tests assert state (`aria-pressed`, `data-playback`, `data-command`), not classes.
- **D-03: The steps stop at the ends and never wrap.** On command 1, Previous is `aria-disabled`; on the last command, Next is. Both stay focusable and do nothing, exactly like the photo viewer's stepping controls (`components/photos/PhotoViewer.tsx` "Moving between photos", UI-SPEC OQ4). Autoplay still loops from the last command back to the first; only the manual steps stop.

#### Terminal transcript (ENG-06)
- **D-04: The transcript is a native `<details>` directly below the terminal box, outside its `role="region"`.** Its summary reads 'Transcript' (the UI-SPEC may refine the wording). It holds every command in order: the prompt glyph and command line, the captured output exactly as captured (11 D-26: real output is the proof), and the note when the command has one. It is server-rendered, so it works without JavaScript, and it is plain, selectable text, never `aria-live`. Commands and output are set in mono and notes in Inter, as in the terminal.
- **D-05: Under reduced motion the visitor sees both:** the paused terminal (which already starts paused with command 1's full text and can still be stepped) above the open transcript. The duplicate text is accepted; the terminal looks the same for every visitor.
- **D-06: The server renders the transcript closed, and after hydration the client opens it under `prefers-reduced-motion: reduce`.** This is the same pattern as the Pause toggle, which flips to pressed after hydration. Only reduced-motion visitors see the one-time expand; default visitors and Lighthouse see no layout shift. Without JavaScript it stays closed and can be opened. The open state is not remembered between visits.
- **D-07: Opening the transcript presses Pause** (the same rule as D-02), so nothing moves above the text being read. Closing it does not resume; only releasing Pause does. Under reduced motion Pause is already pressed, so the automatic open changes nothing.

#### Lightbox focus on close (LBOX-08)
- **D-08: Diagnose before fixing** (ROADMAP research note: not diagnosed at 12-UAT). The 12-UAT finding: after stepping, then Escape, focus landed on a map mark outside the viewport at 1366×650 (partly), 1280×560 and 720×450 (fully). `restoreFocus` (`components/photos/LightboxDialog.tsx`) already focuses the mark with `preventScroll` and then calls `scrollIntoView({ block: 'nearest' })`, so something that runs later (most likely scroll restoration after `router.back()`) probably moves the page. The researcher or planner confirms the root cause and records it.
- **D-09: The guaranteed outcome.** After close, focus is on `[data-photo-id="{slug shown}"]` in the mounted view, and that element and its 2 px focus ring are fully inside the viewport, below the sticky nav. The page scrolls as little as needed, with an instant jump and no smooth scroll. If the trigger is already fully visible, the page does not move. The existing fallbacks (the opener, then the main h1) are unchanged.
- **D-10: Every close path gets the D-09 guarantee:** Escape, the 'Close photo' button and browser Back (toolbar, Alt+←, gesture). All three already end in `restoreFocus`, so one fix covers them, and the test proves each.
- **D-11: The regression test asserts the contract, not the views.** It checks the `[data-photo-id]` focus target and its in-viewport rectangle, so when Phase 18 retires the Map/Grid/Carousel switch it rewrites only the open-and-step setup, never the assertion (GUARD-03). Matrix:
  - Chromium: Map, Grid and Carousel × 1366×650, 1280×560, 720×450 and 375×667, each opening a photo, stepping several times, then pressing Escape.
  - Firefox and WebKit: one Map case at 720×450 with Escape.
  - Chromium at 720×450: the 'Close photo' button and browser Back (`page.goBack()`) paths.
  The step count and starting photo are chosen so the shown photo's trigger starts off-screen at each size.

#### Escape when labels are hidden (ledger 10 IN-01, 13-LEDGER-TRIAGE.md #30)
- **D-12: Hiding labels collapses the open callout.** Pressing 'Hide labels' or the H key clears `expandedId`, so the next Escape goes to zoom or closes the lightbox, and a key press never acts on something the visitor can't see. Showing labels again starts with every callout collapsed. The callout stays the first Escape layer while labels are shown (10-UI-SPEC order: callout, then zoom, then close). Ledger row #30 is written back as fixed in Phase 14.

#### Rail scrim and label contrast (HOME-10)
- **D-13: Deepen the scrim's gradient stops and keep its `w-56` width, element and place in the stage.** `components/home/terrain/CameraRig.tsx:390` reads the scrim's `offsetWidth` as the rail zone, so the same width keeps the camera framing, the pin layout and the summit pin-clearance tests unchanged. The dense part of the gradient holds past the longest label's left edge ('2,760 m approx.') at every md+ breakpoint, then fades. This reverses 12-07 D-24 ("accept 4.81:1, no scrim change"), and HOME-10 records why. — **Reversibility:** reversible — the stops are one class string; the PNG set is re-baselined once.
- **D-14: Aim for at least 5:1, gate at 4.5:1.** The UI-SPEC sizes the stops so every label's worst pixel measures at least 5:1 in CI over both surfaces; the test fails below 4.5:1 (AA, the requirement's number). The headroom absorbs GPU and antialiasing noise without making CI brittle.
- **D-15: The contrast check samples breakpoints × stops on both surfaces.** B8 in `e2e/home-modes.spec.ts` is rewritten, never deleted. It runs in Chromium with WebGL on (the live canvas) and off (the poster), at 768, 1023, 1280 and 1440 px wide, at each waypoint's settled stop and at the summit, taking the worst pixel behind every tick label (the readout stays hidden while sampling, as today). The live-canvas rows are Chromium-only because software WebGL in the other engines is unreliable in CI. The existing N1 rows stay.

#### Mobile menu (SHELL-07, SHELL-08; ledger 07 WR-06, 13-LEDGER-TRIAGE.md #6)
- **D-16: Tapping the link for the page already shown** (its `href` equals the pathname) closes the panel, returns focus to the Menu button as Escape does, and leaves the scroll position untouched: no jump to the top and no visible reload. Links that change the pathname keep today's behaviour; for example, 'Photos' on `/photos/[slug]` is marked current but navigates to `/photos`. The hidden link never takes focus down with it to `<body>`.
- **D-17: Menu rows get an inset focus ring.** Links inside the panel draw the same 2 px ring inside their own box (negative offset), so the panel's `overflow-y-auto` can't clip it at any width. The rows stay full-bleed, and the current-page accent bar stays at the left edge. The exception is scoped to the panel's links; the global `:focus-visible` rule in `app/globals.css` is unchanged. The ring keeps at least 3:1 against the panel background, and the UI-SPEC records the exact offset and how the ring meets the accent bar.

#### Home at 375 px (HOME-09)
- **D-18: Measure first, then fix or guard.** The overflow first reported (the v1 project card ending at x = 399, 08 deferred items) was removed in 09-01, and `e2e/home-ascent.spec.ts` already checks 375 px in its docked, summit and reduced-motion rows. Phase 14 measures Home at 375 px in every mode (live 3D, poster/static, reduced motion, no JavaScript) at every scroll stop (hero, each waypoint, summit, About and footer), with `document.documentElement.scrollWidth <= clientWidth`.
  - If an element overflows, it is fixed at that element. Never with `overflow-x: hidden` on `html`, `body` or `main`, which breaks the sticky stage and rail (`.planning/research/PITFALLS.md`); `overflow-x: clip` only on the element itself if a clamp is still needed.
  - If nothing overflows, the missing rows are added to the e2e suite as a guard, and HOME-09 is closed as "fixed by 09-01, now guarded".
  - The same 375 px sweep runs on the case-study and photo pages. An overflow found there is logged for Tim as a new item, not fixed under HOME-09.

#### Branch, merge and process
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

### Deferred Ideas (OUT OF SCOPE)
- An overflow found outside Home by the D-18 sweep (case-study or photo pages at 375 px) is logged for Tim as a new item, not fixed under HOME-09.

Otherwise none: the discussion stayed within phase scope.

**Also locked:** `14-UI-SPEC.md` (approved 2026-11-14, 7/7). Its P1–P5 defaults stay open for Tim at plan review; this research gives evidence on P4 only.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHELL-07 | Tapping the current page's link in the mobile menu closes the menu | Finding 3a: `onClick` + `preventDefault` on the panel `<Link>` (Next's Link skips navigation when `defaultPrevented`); `onNavigate` is unreachable in Jest |
| SHELL-08 | Focus rings in the mobile menu are fully visible at 375 px | Finding 3a: `focus-visible:-outline-offset-4` is a valid Tailwind 4.3.4 utility (negative values supported) |
| HOME-09 | No horizontal overflow at 375 px, fixed at the element | Finding 3d: **measured, no overflow** in 4 modes × 8 stops (Edge and Firefox). Close as "fixed by 09-01, now guarded"; extend the existing `home-modes.spec.ts` 375 block |
| HOME-10 | Rail tick labels ≥ 4.5:1 over canvas and poster; scrim covers label run | Finding 3c: geometry measured (longest label 182.0 px from scrim right at all four widths, = 0.8125 of 224); B8 rewrite plan |
| LBOX-08 | Focus returns to the visible trigger, never off-screen, with a regression test | Finding 1: **root cause reproduced** (native history scroll restoration undoes `scrollIntoView`); fix prototyped and passing on all three close paths and all three views |
| ENG-06 | Previous/Next step buttons and a static transcript, open by default under reduced motion | Finding 3b: state-machine API, Pause coupling, the `<details>` pattern without a hydration mismatch, and the tests that must be rewritten |
</phase_requirements>

## Project Constraints (from CLAUDE.md / AGENTS.md)

No `./CLAUDE.md` or `./.claude/CLAUDE.md` exists in the repo. Directives that apply:
- **AGENTS.md:** "This version has breaking changes … Read the relevant guide in `node_modules/next/dist/docs/` … before writing any code." This research read `01-app/03-api-reference/02-components/link.md` (`scroll`, `onNavigate`), `04-functions/use-router.md`, and `02-guides/preserving-ui-state.md`, plus the installed router source. Next is 16.4.5.
- **AGENTS.md block:** `next dev` re-adds its block to AGENTS.md; commit it with the work if it shows up in the diff.
- **Memory / PROJECT.md:** use ui-ux-pro-max for all UI work (the UI-SPEC already did); dark-only; tokens only. The palette, contrast, identity and served-image guards run in `npm run lint`.
- **Process:** tests are rewritten, never deleted (GUARD-03, `scripts/guards/test-count.mjs`: "The number of tests may only go up"; `.only(`/`.skip(`/`.fixme(` fail). Visual baselines come only from the CI `workflow_dispatch` (`visual-baselines.yml`), and Tim commits the PNGs. Pushes and dispatches in Phase 14 need Tim's ask (D-19).
- **Search hygiene:** never read `.env.local`; search the repo with `git grep`.

## Summary

**LBOX-08 is diagnosed and reproduced.** Every lightbox close is a history traversal: `router.back()` for Escape and 'Close photo', the browser itself for Back. Next's app router never sets `history.scrollRestoration`, so it stays at `'auto'`. React commits the modal unmount synchronously inside the `popstate` task, and `restoreFocus` runs in a microtask straight after it. `scrollIntoView` does scroll the page. Then, before the next frame, the **browser's native scroll restoration** sets the window back to the scroll position saved for the gallery history entry, which is the position at open time. With the page scroll-locked while the lightbox is open, that saved position is exactly where the page already was, so the restoration only undoes the reveal. Measured in Edge: `scrollY` was 128 right after `scrollIntoView` and still 128 in the next microtask, then 0 by `requestAnimationFrame`, and no script scroll API was called. With the gallery entry's `scrollRestoration` set to `'manual'`, `scrollY` stays at 128. The 12-UAT sizes reproduce exactly: the target mark was at y 620–688 at 1366×650 (partly visible), 1280×560 (off-screen) and 690–758 at 720×450 (off-screen). Grid and Carousel fail too, at all four sizes once the trigger starts off-screen. Firefox behaves the same way.

**The fix** belongs in `restoreFocus` (`components/photos/LightboxDialog.tsx:118-136`). Keep `focus({ preventScroll: true })`, and replace `scrollIntoView` with a window-only, vertical, instant, minimal `revealTrigger(el)` that clears the nav (`--nav-h`) and the 4 px ring. Run it once immediately and again in `requestAnimationFrame`, after the traversal's restoration, guarded by `document.activeElement === mark`. A prototype of exactly this passed for Escape, 'Close photo' and `goBack()`, for Map, Grid and Carousel, from both edges (trigger below the fold and trigger above, under the nav), in Edge and Firefox. A trigger that is already visible moved 0 px. Simply adding `scroll-mb-4` (UI-SPEC P4 default) **would not fix the bug**, because any scroll done in the microtask is undone.

The other five requirements need no investigation surprises. HOME-09 is clean: there is no overflow anywhere, so it is guard-only. HOME-10 geometry holds, the class strings pass the guards, and the terminal changes slot into the existing state machine. Two existing tests assume Tab goes from Pause to dot 1 and must be rewritten for the new Tab order. One adjacent bug was confirmed but is out of the D-12 scope: zoom also hides an open gutter callout, which still swallows the first Escape (see Open Questions).

**Primary recommendation:** fix LBOX-08 with a post-restoration `requestAnimationFrame` reveal in `restoreFocus`, prove it with a `[data-photo-id]` rectangle assertion. The existing lightbox focus tests only check `data-photo-id`, which is why the bug passed CI. Keep every other change to the class strings and handlers the UI-SPEC already fixes.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Lightbox focus return + reveal | Browser / Client (`LightboxDialog.tsx` `restoreFocus`) | — | Runs after the modal unmounts; the history traversal and scroll restoration are browser behaviour |
| Hidden-callout Escape (D-12) | Browser / Client (`PhotoViewer.tsx` state) | — | `expandedId` is viewer state |
| Current-page menu tap, inset ring | Browser / Client (`SiteNav.tsx`) | CSS (Tailwind utility) | Click handler and a class string |
| Rail scrim stops | CSS / SSR markup (`AscentHero.tsx`) | Client (`CameraRig` reads `offsetWidth`) | One class string; the width must not change |
| Terminal steps + Pause coupling | Browser / Client (`DemoTerminal.tsx` island) | Pure lib (`lib/demo-terminal.ts`) | State transitions stay pure and unit-tested |
| Transcript | Frontend Server (SSR in the island's output) | Client (one post-hydration open) | Must exist without JS; opens once under reduced motion |
| 375 px guard | Test tier (`e2e/home-modes.spec.ts`) | — | Nothing overflows; only guards are added |

## Standard Stack

No new dependency (UI-SPEC "Registry Safety": "No new runtime or dev dependency"). Installed versions used by the plans:

| Library | Version (installed) | Use in Phase 14 |
|---------|---------------------|-----------------|
| next | 16.4.5 [VERIFIED: `node -p "require('next/package.json').version"`] | Router, `<Link>` |
| react / react-dom | 19.3.1 [VERIFIED: `require('react-dom/package.json').version`] | `onToggle` on `<details>` is a non-delegated listener (`react-dom-client.production.js:3009-3010`: `case "details": listenToNonDelegatedEvent("toggle", instance);`) |
| tailwindcss | 4.3.4 [VERIFIED: UI-SPEC + `node_modules/tailwindcss/dist/lib.js`: `outline-offset",{supportsNegative:!0,…handleBareValue:({value:g})=>D(g)?\`${g}px\`:null`] | `-outline-offset-4` → `outline-offset: -4px` |
| @playwright/test | 1.65.0 [VERIFIED: `require('@playwright/test/package.json').version`] | e2e |
| jest / jsdom | 30.x / 26.1.0 [VERIFIED: `require('jsdom/package.json').version`] | Unit tests; jsdom fires `toggle` via a real `setTimeout(…, 0)` when `open` changes (`HTMLDetailsElement-impl.js`) |
| @phosphor-icons/react | 2.1.10 | `CaretLeftIcon`, `CaretRightIcon`, `CaretDownIcon` from `dist/ssr` (UI-SPEC inventory) |

## Package Legitimacy Audit

Not applicable: Phase 14 installs no package. **Packages removed:** none. **Flagged:** none.

## Architecture Patterns

### Close-path data flow (LBOX-08, as measured)

```
 Escape keydown ─┐                     'Close photo' click ─┐        Browser Back (toolbar/Alt+←/gesture)
   escape layers │ (callout → zoom)                          │                 │
   none consumed ▼                                           ▼                 │
            api.close() ── dispatch LIGHTBOX_CLOSE_EVENT ── router.back()     │
                                                              │                 │
                                                              ▼                 ▼
                                              history traversal → popstate (state.__NA) 
                                                              │
                                     Next handlePopState → traverse → ACTION_RESTORE (scrollRef: null → Next itself never scrolls)
                                                              │  React flushes the transition synchronously inside the popstate task
                                                              ▼
                                       @modal slot → default (null): LightboxDialog unmounts
                                       layout-effect cleanup: restore <html> overflow, queueMicrotask(…)
                                                              ▼
                                       microtask: [Back only: flushSync LIGHTBOX_CLOSE_EVENT] → restoreFocus(slug, opener)
                                         focus({preventScroll}) + scrollIntoView  → scrollY = target   ✔
                                                              ▼
                     BROWSER: same-document scroll restoration ('auto') → scrollY = gallery entry's saved Y (the open-time Y)  ✘ undoes the reveal
                                                              ▼
                                       next frame: requestAnimationFrame  ← THE FIX re-reveals here (before paint, no visible jump)
```

### Measured evidence (Edge 1280×560, Map, start `matterhorn-from-zermatt`, 3 × →, Escape)

Instrumented with an init script that wraps `scrollIntoView`, `focus`, `window.scrollTo/scroll/scrollBy` and the `Element.scrollTop` setter (times relative to the Escape press):

```
+0ms CLOSE y=0
+4ms popstate y=0  (history.scrollRestoration = auto)
+6ms focus riffelsee-reflection {"preventScroll":true}
+7ms scrollIntoView riffelsee-reflection {"block":"nearest"}   (html overflow restored, 0 dialogs, not inert, maxScroll 966)
+7ms after-siv-sync       y=128
+8ms after-siv-microtask  y=128
+8ms scroll (document)    y=0      ← no script scroll call logged
+8ms after-siv-raf        y=0
+9ms after-siv-timeout0   y=0
```
- Gallery entry set to `scrollRestoration = 'manual'` before opening: `scrollY` stays 128 after close. **This confirms the browser restoration and rules out every script actor.**
- `scrollRestoration = 'manual'` set on the photo entry just before closing: the bug persists. The mode is per history entry, and the target entry's mode governs. This rules out a "set manual in `close()`" fix.
- Firefox (Playwright build): the identical sequence (`after-siv-sync y=128` → `after-siv-raf y=0`) at 1280×560; 720×450 shows y=308 → 0.
- 12-UAT sizes, Map, no fix: target rect 620–688 at 1366×650 (`innerHeight` 650, partly visible), 620–688 at 1280×560, 690–758 at 720×450. These match the UAT's "partly / fully / fully".
- Grid, no fix: off-screen at all four sizes, including 375×667 (tile at 1207–1496). Carousel (opened from the 3D front frame), no fix: 'Open photo' off-screen at all four sizes.
- Prototype fix (reveal again in `requestAnimationFrame`): **in view** for Map at 1366×650 (+42 px), 1280×560 (+132), 720×450 (+312) and 375×667 (0 px, already visible); Grid at all four sizes; Carousel at all four sizes; the 'Close photo' button and `goBack()` at 720×450; the top edge (opened from the page end, trigger above the viewport) landing at `top` 68 = nav 64 + ring 4; Firefox Map at 1366/1280/720.

**Hypotheses ranked (the D-08 list), with the evidence:**
1. **Native scroll restoration after `router.back()`: CONFIRMED** (above).
2. Next.js soft-nav scroll: **ruled out.** `restore-reducer.js:40-43` builds `accumulation = { separateRefreshUrls: null, scrollRef: null }`, and `layout-router.js` `InnerScrollHandler` returns early when `scrollRef` is null. No `scrollTop=` or `scrollIntoView` from Next appeared in the log. The app router never touches `scrollRestoration` (it appears only in `shared/lib/router/router.js`, the pages router).
3. Layout shift from the view remounting: **ruled out.** No Activity wrapping without `cacheComponents` (`layout-router.js:519`: Activity only under `process.env.__NEXT_CACHE_COMPONENTS`; `next.config.ts` does not set it), and mark rects were identical before open and after close.
4. Sticky nav covering the target: **not the cause of this bug**, but a real second trap. `block: 'nearest'` aligns the element edge to the viewport edge, so the ring is cut at the bottom (with 'manual', the rect bottom was exactly 560 = `innerHeight`, failing the ring test). The fix must clear the ring itself (UI-SPEC "bottom-edge trap").

### Recommended mechanism (Claude's discretion item, settled by the evidence)

Files and functions touched: **`components/photos/LightboxDialog.tsx` only**. Add `revealTrigger(el)` and change the `mark` branch of `restoreFocus` (lines 122-126). Nothing in Map/Grid/Carousel changes. All three close paths already end in `restoreFocus` through the unmount microtask (lines 226-238), so D-10 is covered by one change.

- Window-only `scrollBy`, **never `scrollIntoView`**. `scrollIntoView` also scrolls scrollable ancestors, and the map plates sit inside the `overflow-hidden` sheet (`MapSheet.tsx` `SHEET`), which is a programmatic scroll container. A clipped plate would shift the whole map.
- `behavior: 'instant'` is explicit (D-09 "no smooth scroll"). The repo already uses `window.scrollTo({ top, behavior: 'instant' })` in `e2e/home-modes.spec.ts` N1.
- Nav height comes from `--nav-h`, declared on `:root` in `app/globals.css:26-53` (`--nav-h: 64px;`). Ring = 4 (2 px outline + 2 px offset: `:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; …}`, `globals.css:200-204`).
- A trigger taller than the room below the nav gets top alignment (see Pitfall 3: three grid tiles are 503 px tall at 720×450).
- **UI-SPEC P4:** the evidence favours the alternative, "handle the 4 px in the restore code". `scroll-mb-4` only acts through `scrollIntoView`/scroll-snap, which this mechanism no longer uses, so it would be dead CSS. Tim decides at plan review; if he keeps P4's default, `revealTrigger` must read `getComputedStyle(el).scrollMarginBottom`.

### D-12 change point (confirmed)

`PhotoViewer.tsx` has **two** label toggles. Both must clear `expandedId`:
- the H key: `const toggleLabels = useEffectEvent(() => setLabelsOn(!labelsOn));` (line 322);
- the button: `onClick={() => setLabelsOn(!labelsOn)}` (line 537).

Recommended: one local `setLabels(on)` that calls `setLabelsOn(on)` and, when hiding, `setExpandedId(null)`. Use it in both places. Showing labels again then starts collapsed automatically. **Do not** put this in an effect on `labelsOn`: the preference is a global `useSyncExternalStore` (`lib/photos/hotspot-pref.ts`) that another tab can flip through the `storage` event, and an effect would also run for that. Clearing on *any* hide, from any tab, is arguably right, but D-12 names the button and the H key. Reproduced before the fix (Edge, 1440×900): callout expanded → H → Escape → **dialog still open**.

### Recommended Project Structure (files touched)

```
components/photos/LightboxDialog.tsx     # revealTrigger + restoreFocus mark branch (LBOX-08)
components/photos/PhotoViewer.tsx        # setLabels(on) clears expandedId (D-12)
components/site/SiteNav.tsx              # current-page onClick close; -outline-offset-4 on panel links
components/home/AscentHero.tsx:86        # scrim class string only
lib/demo-terminal.ts                     # optional pure stepTo(index, dir, count) (import-free)
components/projects/DemoTerminal.tsx     # Previous/Next, dot press = sticky, transcript <details>
e2e/helpers/ascent.ts                    # (recommended) export waitForRevealed + settle helpers for B8
e2e/photos-lightbox.spec.ts              # LBOX-08 matrix (new describe) + IN-01 row
e2e/home-modes.spec.ts                   # B8 rewrite, 375 block extension (no-JS, all stops)
e2e/shell.spec.ts                        # SHELL-07/08 rows
e2e/case-study.spec.ts                   # steps, transcript, rewritten dot/Tab tests
e2e/visual/routes.spec.ts                # menu set (new); box reduced waits for details[open]
```

### Anti-Patterns to Avoid
- **`history.scrollRestoration = 'manual'` globally:** Next relies on the browser's native back/forward restoration across the whole site. Its docs: "The default scrolling behavior of `<Link>` in Next.js **is to maintain scroll position**, similar to how browsers handle back and forwards navigation" (`link.md:232`). Going global would regress Back on every page. Per entry, it would have to be set on the gallery entry *before* the open's `pushState`, which means touching five openers including a server component.
- **Re-revealing on every `scroll` event for N ms:** it fights the visitor's own scroll. One post-restoration frame is enough (measured), and the reveal is idempotent.
- **`<details open={reduced}>`:** a controlled `open` re-toggles when the OS preference changes (violates D-06) and couples React state to native toggling. Render no `open` prop and open imperatively once.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Disclosure | A button + `aria-expanded` + hidden panel | Native `<details>/<summary>` (the repo's `RouteIndex`/`RouteRow` precedent) | Works without JS, keyboard and AT semantics built in |
| Plain-activation filter for the menu tap | Your own `which`/`target` parsing | `event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey` in `onClick` (mirrors Next's `isModifiedEvent`, `app-dir/link.js:45-50`) | Next skips its navigation when `e.defaultPrevented` (`link.js:306-308`) |
| End-stop stepping | New disabled logic | The `CarouselControls` pattern: `aria-disabled={atStart ? 'true' : undefined}` and `onClick={() => { if (!atStart) onStep(-1); }}` (`CarouselControls.tsx:52-56`) | Already the site's one ‹ › behaviour |
| Pixel contrast | A new sampler | `worstContrastBehind` (`e2e/home-modes.spec.ts:122`) | The labels paint above the scrim (separate sticky layer), so raw text vs composed background is the right method (B7/B8); `composedContrast` stays N1's |
| Camera settle wait | Fixed sleeps | The two-reads-agree loops in `home-canvas.spec.ts` (`settledPinBoxes`, `settledLit3dBoxes`, `waitForRevealed`) | Damped spring; fixed waits flake |

## Common Pitfalls

### Pitfall 1: Fixing LBOX-08 with CSS only (`scroll-mb-4` / `scroll-margin`)
**What goes wrong:** the scroll still happens in the unmount microtask and the browser's restoration undoes it. The bug survives.
**How to avoid:** the reveal must run after restoration (`requestAnimationFrame`), as measured.
**Warning sign:** a test that asserts only `activeElement.dataset.photoId`. The three existing focus-return tests (`photos-lightbox.spec.ts:442, 695, 713`) pass today **with the bug present** (verified: 3 passed in 2.4 s against `next start`).

### Pitfall 2: `scrollIntoView` scrolling the map sheet
**What goes wrong:** `overflow: hidden` boxes are programmatic scroll containers, so a plate clipped by the sheet edge makes `scrollIntoView` scroll the sheet's contents and offset the map.
**How to avoid:** use window `scrollBy` with your own rect math.

### Pitfall 3: Triggers taller than the viewport
**What goes wrong:** at 720×450 the grid tiles measure 503 / 503 / 503 / 286 px tall. The room below the nav, less the ring, is 450 − 64 − 8 = 378 px, so D-09's "fully inside" cannot hold for three of the four grid tiles at that size.
**How to avoid:** the mechanism top-aligns oversized triggers (ring just below the nav). In the D-11 Grid × 720×450 row, end on `riffelsee-reflection` (286 px, the last photo), which fits. Map plates are 68 px, carousel 'Open photo' is 44 px, and every other measured size fits.

### Pitfall 4: The test's starting state (D-11 "trigger starts off-screen at each size")
**What goes wrong:** the restored scroll is the scroll at **open time**. At 375×667 all four map marks sit at y 296–643, so no step makes the target off-screen when the map is opened from the top. In the Carousel the single trigger stays where it was clicked.
**How to avoid:** use two setups that cover both edges. (a) **Bottom edge:** `scrollY` 0, open the first map mark or grid tile, step to the last photo (Map at 1366/1280/720, Grid at all four sizes). (b) **Top edge:** `window.scrollTo(0, scrollHeight)`, then `trigger.focus({ preventScroll: true })` + Enter, step, close (Map at 375×667, Carousel at all four via 'Open photo'). Both were prototyped and fail without the fix.

### Pitfall 5: Next `<Link>` to the current URL is not a no-op
**What goes wrong:** with `scroll` defaulting to true, a same-URL navigation runs Next's scroll handler, which jumps to the top when the page's top is above the viewport (`layout-router.js:161-172`: `htmlElement.scrollTop = 0`). It also replaces the history entry and may refetch.
**How to avoid:** call `event.preventDefault()` in the panel link's `onClick` when `item.href === pathname` and the activation is plain; focus the Menu button first, then `setOpen(false)` (the same order as the Escape handler, `SiteNav.tsx:100-105`). Focusing first also keeps the `focusout` close trigger quiet (header → header).
**Why not `onNavigate`:** Next calls it only from `linkClicked`, after `if (!router) return;` (`link.js:303-305`). In Jest there is no `AppRouterContext` (`SiteNav.test.tsx` mocks only `usePathname`), so a handler there could never be unit-tested.

### Pitfall 6: `/photos?view=grid` vs `/photos`
**What goes wrong:** on `/photos?view=grid` the pathname equals `/photos`, so D-16's literal rule makes 'Photographs' close the menu *instead of* switching to the default Map view, which today is a real URL change. The same applies to `/roadmap?project=…`. See Open Question 2.

### Pitfall 7: The new Tab order breaks two existing tests
`e2e/case-study.spec.ts:596-599` (`await page.keyboard.press('Tab'); … getByRole('button', { name: 'Go to command 1', exact: true })).toBeFocused();`) and `DemoTerminal.test.tsx:283-284` (`await user.tab(); expect(…getByRole('button', { name: 'Go to command 1' })).toHaveFocus();`) assume Pause → dot 1. With UI-SPEC order Pause → Previous → dots → Next, Tab lands on 'Previous command'. Rewrite them (GUARD-03), keeping the "moving between the region's own controls is not an entry" assertion. Also rewrite the dot tests that assert `aria-pressed="false"` after a dot press (`DemoTerminal.test.tsx:314` "without touching the toggle", `case-study.spec.ts:638` "…without touching the toggle", whose tail "only leaving resumes" inverts under D-02).

### Pitfall 8: `aria-disabled` buttons still fire `click`
Unlike `disabled`, `aria-disabled` buttons still receive clicks and Enter/Space. The handler must check the end (the `CarouselControls` pattern). This is also why `goTo` must never see `-1` or `count`: it throws `RangeError` (`lib/demo-terminal.ts:95-98`: `if (!Number.isInteger(index) || index < 0 || index >= count) { throw new RangeError(…) }`).

### Pitfall 9: Transcript hydration and `toggle`
- Render `<details data-transcript>` with **no `open` prop**. Server and first client render then match, and there is no mismatch.
- Open once in a **mount-only** effect: `useEffect(() => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) ref.current!.open = true; }, [])`. Do not use the reactive `reduced` hook value, or a later OS change would open it (D-06).
- `toggle` fires asynchronously (a queued task). Handle it with React `onToggle` (supported on `<details>`, see Standard Stack) and read `e.currentTarget.open`. Press Pause only when `open && !sticky`, so the automatic reduced-motion open changes no state. This avoids a re-render and Jest `act()` noise, because jsdom fires `toggle` on a real, unfaked `setTimeout(…, 0)`.
- Without JS the details stays closed (no effect runs) and opens natively.

### Pitfall 10: `<pre>` whitespace and width
The UI-SPEC requires `whitespace-pre-wrap wrap-anywhere` on `<pre>`: the 160-character `box du …` pipeline and the 64-character hash would otherwise overflow 375 px. The output strings begin or end with `''` lines (`data/projects.ts` box `du` output: `['', 'name      size', …, '']`). The `<samp>` wrapper inside `<pre>` keeps the leading newline (the HTML parser drops only a newline directly after the `<pre>` start tag).

### Pitfall 11: Guards and class strings
None of the new strings trip a guard. `from-surface/90`, `via-surface/85`, `via-85%`, `to-100%`, `-outline-offset-4`, `divide-line` and `group-open:` are tokens or utilities, with no stock palette, `dark:`, or white/black. `check-palette.mjs` allows the prompt glyph U+276F in TS, and the `██████████` swatch is data (U+2588 is not Extended_Pictographic). `rail.test.tsx:197` asserts the scrim keeps `'pointer-events-none', 'hidden', 'md:block', 'w-56'`, all of which are kept.

### Pitfall 12: The filler scan now sees transcript text
`case-study-page.spec.ts:209` removes `pre` and the terminal region before scanning `main` for `—`, `N/A`, `TBD`, `undefined`, `null`, `NaN` and `coming soon`. The transcript sits outside the region, but its outputs are in `<pre>` (removed), and its commands and notes contain none of those tokens. It passes as is. Add `data-filler-skip` only if the data changes.

## Code Examples

### LBOX-08 fix (prototyped behaviour; adapt names)
```tsx
// components/photos/LightboxDialog.tsx
/** The global focus ring: 2 px wide at a 2 px offset (app/globals.css :focus-visible). */
const RING_PX = 4;

/**
 * Scroll the window as little as needed, instantly, so `el` and its ring sit fully inside the
 * viewport below the sticky nav; no move when they already do. Window only, never
 * scrollIntoView (it would also scroll the map sheet's overflow-hidden box). A trigger taller
 * than the room below the nav is top-aligned.
 */
function revealTrigger(el: HTMLElement): void {
  const navH =
    Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 0;
  const rect = el.getBoundingClientRect();
  const top = rect.top - RING_PX;
  const bottom = rect.bottom + RING_PX;
  let delta = 0;
  if (top < navH) delta = top - navH;
  else if (bottom > window.innerHeight) delta = Math.min(bottom - window.innerHeight, top - navH);
  if (delta !== 0) window.scrollBy({ top: delta, behavior: 'instant' });
}

export function restoreFocus(slug: string, opener: Element | null): void {
  const mark = slug
    ? document.querySelector<HTMLElement>(`[data-photo-id="${cssEscape(slug)}"]`)
    : null;
  if (mark) {
    mark.focus({ preventScroll: true });
    revealTrigger(mark);
    // Every close is a history traversal (router.back() or browser Back). The browser restores
    // the gallery entry's saved scroll position after this microtask, undoing the reveal
    // (14-RESEARCH D-08): reveal again on the next frame, before paint.
    requestAnimationFrame(() => {
      if (document.activeElement === mark) revealTrigger(mark);
    });
    return;
  }
  // opener / main h1 fallbacks unchanged
}
```
Jest (`lightbox-dialog.test.tsx`) can unit-test `revealTrigger` by stubbing `getBoundingClientRect`, `innerHeight` and `window.scrollBy`. The traversal behaviour itself is Playwright-only.

### D-11 assertion (contract-level, view-agnostic)
```ts
async function expectTriggerFullyInView(page: Page, slug: string) {
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id'))).toBe(slug);
  await expect.poll(() =>
    page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const r = el.getBoundingClientRect();
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
      const ring = 4;
      return r.top - ring >= navH && r.bottom + ring <= innerHeight &&
             r.left - ring >= 0 && r.right + ring <= document.documentElement.clientWidth;
    })
  ).toBe(true);
}
```

### SHELL-07 handler
```tsx
// components/site/SiteNav.tsx, panel <Link>
onClick={(event) => {
  const plain = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  if (!plain || item.href !== pathname) return; // other links: today's close-on-route-change
  event.preventDefault();                       // Next skips navigation (and its scroll-to-top)
  buttonRef.current?.focus();                   // before hiding, so focus never drops to <body>
  setOpen(false);
}}
className={`relative flex min-h-12 items-center px-4 font-display text-heading font-normal focus-visible:-outline-offset-4 ${COLOR_TRANSITION} …`}
```

### Terminal steps and Pause coupling
```tsx
// lib/demo-terminal.ts (stays import-free): end-stopping step, null at either end
export function stepTo(index: number, dir: -1 | 1, count: number): TerminalState | null {
  const next = index + dir;
  return next >= 0 && next < count ? goTo(next, count) : null;
}

// components/projects/DemoTerminal.tsx
function show(target: TerminalState | null) {
  if (target === null) return;   // aria-disabled end: no state change, no Pause (D-03)
  setState(target);
  setOverride(true);             // D-02: a step or dot presses the sticky Pause
}
// dots:     onClick={() => show(goTo(i, count))}          (was setState(goTo(i, count)), line 304)
// Previous: onClick={() => show(stepTo(state.index, -1, count))}
// Next:     onClick={() => show(stepTo(state.index, 1, count))}
// bar: className "flex min-h-12 items-center gap-2 border-t border-line px-4" (retires the count >= 7 switch at line 293)
```
The island returns a fragment: the existing region `<div role="region" …>` (`DemoTerminal.tsx:228-239`), then `{count >= 2 && <details data-transcript …>}` per UI-SPEC Contract 2. The transcript maps the same `commands` prop, sourced from `data/projects.ts` box `demo.commands` (4 commands, each with `input`/`output`/`note`) and passed through `components/projects/sections/Demo.tsx:43` (`<DemoTerminal name={project.name} commands={project.demo.commands} />`).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Async transitions on `popstate` | React flushes `popstate` updates synchronously (measured: unmount + focus 2–5 ms after `popstate`, same task) | React 19 | The modal unmounts **before** the browser's restoration, which is why the reveal is undone |
| Next pages router `experimental.scrollRestoration` | App router leaves `scrollRestoration` 'auto' and never scrolls on `ACTION_RESTORE` | App router | Browser restoration is the only back/forward scroll actor |
| Activity-preserved segments | Only with `cacheComponents: true` (`preserving-ui-state.md`) | Next 16 | Not enabled here; the comment in `PhotoViewer.tsx:429` about "the copy Next keeps in a hidden Activity" does not apply to this config |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Linux WebKit (CI) performs the same-document scroll restoration before the first `requestAnimationFrame` after `popstate`, as Edge and Firefox do | LBOX-08 mechanism | The D-11 WebKit row fails; mitigation: add a second-frame re-reveal (idempotent). Local WebKit for Playwright 1.65 (`webkit-2388`) is not installed, so this was not observed |
| A2 | Mobile Safari / Android Chrome behave as desktop engines for this restoration timing | LBOX-08 | Only the touch path is affected; same mitigation as A1 |
| A3 | JetBrains Mono renders the 15-character label at 126 px on the Linux CI runner (measured 182.0 px left edge on Windows Edge) | HOME-10 geometric gate | The 0.85 gate has 8.4 px of margin; a fallback font could move it |
| A4 | B8 with WebGL on yields stable pixels once the camera has settled (two reads agree) | HOME-10 | Flaky live rows; mitigation: settle helper + Chromium-only tag (D-15) |

## Open Questions (RESOLVED)

1. **Zoom has the same hidden-callout bug as IN-01. Is it in scope?**
   - Known: reproduced at 1440×900. Callout expanded → Z → Escape → still zoomed (`aria-pressed="true"`): the invisible gutter callout ate the Escape. `HotspotOverlay` draws nothing while zoomed (`shown = labelsOn && !zoomed && …`), and `collapseCallout` ignores visibility.
   - Unclear: D-12 names only Hide labels and H.
   - **RESOLVED:** keep D-12 as locked. Offer Tim one additive guard at plan review: `collapseCallout` clears `expandedId` but returns `false` when no candidate label or row is visible, so the next layer handles the press. This would also cover any future hide path. Otherwise log it for Phase 18.
2. **D-16 with a query string (`/photos?view=grid`, `/roadmap?project=box`).**
   - Known: `usePathname()` drops the search. Today 'Photographs' there navigates to `/photos` (Map) and closes via the route change.
   - **RESOLVED (recommendation, confirm at plan review):** compare `href` with `pathname` *and* require an empty `location.search`, so a view or filter URL still navigates to the plain page. The alternative is D-16 literally (close only). Each option is one line.
3. **UI-SPEC P4.** **RESOLVED by evidence, pending Tim:** the evidence favours the alternative, "handle the 4 px in the restore code". `scroll-mb-4` alone does not fix the bug and would be unused by a `scrollBy`-based reveal.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build, tests | ✓ | v26.13.1 (engines says 24.x; it ran everything) | — |
| Microsoft Edge (`channel: 'msedge'`) | local live-DOM checks | ✓ | — | Playwright Chromium (installed, used by `npx playwright test`) |
| Playwright Chromium / Firefox | e2e | ✓ | Firefox build ran the repro | — |
| Playwright WebKit for 1.65 | local WebKit rows | ✗ (`webkit-2388/Playwright.exe` missing) | — | CI Linux WebKit; or `npx playwright install webkit` |
| `.next` production build | `PW_REUSE` runs | ✓ (BUILD_ID 2026-11-13 23:27) | — | Must be rebuilt (`npm run build`) after Phase 14 source changes; a reused server serves the old build |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30 (jsdom 26.1) + Playwright 1.65 |
| Config files | `jest.config.js` (`testEnvironment: 'jest-environment-jsdom'`, `setupFilesAfterEnv: ['<rootDir>/jest.setup.js']`), `playwright.config.ts` |
| Quick run (Jest, affected suites) | `npx jest components/site/__tests__/SiteNav.test.tsx components/projects/__tests__/DemoTerminal.test.tsx lib/__tests__/demo-terminal.test.ts components/photos/__tests__/lightbox-dialog.test.tsx components/home/__tests__/rail.test.tsx` (**measured 3.3 s, 77 tests green today**) |
| Quick run (e2e, one file) | `npm run build` once, `npm run start` in the background, then `PW_PROD=1 PW_REUSE=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --reporter=line -g "<title>"` (3 focus tests measured at 2.4 s). Stop the orphan `next start` on :3000 afterwards |
| Full suite (CI E2E job) | `npx playwright test --project=chromium --project=firefox --project=webkit --fail-on-flaky-tests` |
| Unit + ratchet (CI Unit Tests job only) | `npm test -- --coverage --json --outputFile=jest-results.json` then `npm run guard:tests` (not part of local `npm run lint`) |
| Lint / guards | `npm run lint` (eslint + parity, ci, palette, contrast, identity, selftest, data:check, images) and `npm run type-check` |
| Visual | CI "Visual Regression" job compares (`--project=visual-dark --project=visual-light --update-snapshots=none`); new or changed PNGs only via `visual-baselines.yml` `workflow_dispatch` (`suite=visual`, `update_mode=changed`), Tim commits |

### Phase Requirements → Test Map
| Req ID | Behaviour (must-hold truth) | Type | Automated check (file → new or rewritten row) | File exists? |
|--------|------------------------------|------|-----------------------------------------------|--------------|
| SHELL-07 | Plain click on the link whose `href === pathname` closes the panel, focuses Menu, no navigation (`fireEvent.click` returns false) | unit | `components/site/__tests__/SiteNav.test.tsx`: new `it(…)` with `mockUsePathname('/roadmap')` | ✅ |
| SHELL-07 | Modifier click (Ctrl/Shift) keeps the panel open; another link still closes on route change (existing test kept) | unit | same file, new row | ✅ |
| SHELL-07 | At 375 on `/roadmap` scrolled down: tap 'Roadmap' → `#site-menu` hidden, button focused, `scrollY` unchanged, URL unchanged | e2e (3 engines) | `e2e/shell.spec.ts` "Shell mobile menu": new test | ✅ |
| SHELL-08 | Focused panel link: computed `outline-offset` is `-4px`; ring rect (box ± 4 − 2) inside `#site-menu` client rect; top and bottom rows | e2e | `e2e/shell.spec.ts`, new test (focus via `.focus()` in WebKit: `tabReachesLinks`) | ✅ |
| SHELL-08 | Menu open at 375 on `/projects`, current row focused | visual (new set) | `e2e/visual/routes.spec.ts`: new test → new PNG (Tim) | ✅ file / ❌ PNG |
| HOME-09 | `scrollWidth <= clientWidth` at 375 in live / static / reduced / **no-JS** × top, waypoints 1–4, summit, About, footer | e2e | `e2e/home-modes.spec.ts` "nothing scrolls sideways at 375 px" (`:363`): add a `nojs` mode (`test.use({ javaScriptEnabled: false })` or a context) and loop all stops; keep the `@chromium-only` tag on `eligible` | ✅ |
| HOME-09 | Case-study and photo pages at 375 (log only) | e2e | existing `case-study-page.spec.ts:249`, `case-study.spec.ts:198/484/664`; photos covered by `photos-sweep.spec.ts` | ✅ |
| HOME-10 | Every `[data-tick-label]` worst pixel ≥ 4.5 (annotated), 768/1023/1280/1440 × waypoints 1–4 + summit × WebGL off (all engines) / on (`@chromium-only`) | e2e | `e2e/home-modes.spec.ts` B8 (`:482`) rewritten (title can keep "B8: …"); readout hidden while sampling | ✅ |
| HOME-10 | `scrim.offsetWidth === 224` and `scrimRect.right − labelRect.left ≤ 0.85 × 224` for every label at the four widths | e2e | same B8 describe, geometric row | ✅ |
| HOME-10 | Darker band at md+ | visual (re-baseline) | `home/{768,1440}-ascent-{start,waypoint-2,summit}`, `home/{768,1440}-reduced` | ✅ |
| LBOX-08 | Contract: focus on `[data-photo-id=shown]`, rect ± 4 inside viewport below `--nav-h` | e2e | `e2e/photos-lightbox.spec.ts`: new describe "Focus on close stays in view (LBOX-08)": Chromium Map/Grid/Carousel × 1366×650, 1280×560, 720×450, 375×667 (Escape) | ✅ |
| LBOX-08 | Same, 'Close photo' and `page.goBack()` at 720×450 (Chromium) | e2e | same describe | ✅ |
| LBOX-08 | Same, Firefox and WebKit Map 720×450 Escape | e2e | same describe; tag `@no-win-webkit` (history Back crash on Windows WebKit, per file convention); `@firefox-43967` only if it crashes | ✅ |
| LBOX-08 | Already-visible trigger: `scrollY` unchanged | e2e | existing `photos-lightbox.spec.ts:471` (keep) | ✅ |
| LBOX-08 | `revealTrigger` math (above, below, tall, visible → no call) | unit | `components/photos/__tests__/lightbox-dialog.test.tsx` new rows | ✅ |
| IN-01 (D-12) | Callout expanded → H (and → button) → one Escape closes the lightbox; showing labels again → all `aria-expanded="false"` | e2e (gutter tier 1440×900) | `e2e/photos-lightbox.spec.ts` Hotspots describe, new rows | ✅ |
| ENG-06 | Previous/Next render only with ≥ 2 commands; `aria-disabled` at the ends; an end press changes neither `data-command` nor `aria-pressed` | unit | `DemoTerminal.test.tsx` new rows; `lib/__tests__/demo-terminal.test.ts` `stepTo` rows | ✅ |
| ENG-06 | Step / dot → `aria-pressed="true"`, `data-playback="paused"`, leaving does not resume; release resumes | unit + e2e | `DemoTerminal.test.tsx:314` and `case-study.spec.ts:638` **rewritten**; new step rows | ✅ |
| ENG-06 | Tab order Pause → Previous → dot 1 … → Next | unit + e2e | `DemoTerminal.test.tsx:278`, `case-study.spec.ts:577` **rewritten** | ✅ |
| ENG-06 | SSR markup has `details[data-transcript]` **without** `open` and holds every input/output/note | unit | new Jest row using `renderToString` from `react-dom/server` | ✅ |
| ENG-06 | Reduced motion: `open` after hydration, Pause pressed; default: closed; no-JS: closed and openable | e2e | `case-study.spec.ts` "Demo under reduced motion" + new no-JS row | ✅ |
| ENG-06 | Opening the transcript presses Pause; closing leaves it pressed | e2e (+ unit with `fireEvent` on `toggle`) | `case-study.spec.ts` new row | ✅ |
| ENG-06 | 375 px, transcript open: no sideways scroll; long lines wrap | e2e | extend `case-study.spec.ts:664` to open the transcript first | ✅ |
| ENG-06 | `box/{375,768,1440}-reduced` with step buttons + open transcript | visual (re-baseline) | `routes.spec.ts`: wait for `details[data-transcript][open]` on the box route before the shot | ✅ |

### Sampling Rate
- **Per task commit:** the Jest quick run (~4 s) plus the one touched e2e file against the reused prod server, Chromium.
- **Per wave merge:** `npm run lint`, `npm run type-check`, full Jest, then the touched e2e files in chromium + firefox locally (WebKit runs in CI).
- **Phase gate:** CI green on the branch (E2E 3 engines with `--fail-on-flaky-tests`, Unit Tests with `guard:tests`, Visual Regression after Tim commits the re-baselined PNGs), before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] Shared helpers: export `waitForRevealed` and a settle-at-stop helper from `e2e/helpers/ascent.ts` (they are file-local in `home-canvas.spec.ts` today). Moving helpers deletes no test.
- [ ] An `openOffscreen(page, slug)` / `expectTriggerFullyInView(page, slug)` pair for the LBOX-08 describe (Pitfall 4 setups).
- [ ] No framework install needed.

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication / V3 Session / V4 Access Control | no | — (static portfolio UI) |
| V5 Input Validation | marginal | The lightbox slug used in the selector is already escaped (`cssEscape`, T-10-12). The transcript renders committed data as React text (no `dangerouslySetInnerHTML`) |
| V6 Cryptography | no | — |

| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| Selector injection via the URL slug in `restoreFocus` | Tampering | Unchanged: the slug comes only from `PHOTO_PATH` and passes through `cssEscape` |
| Script in transcript output | Tampering | React escapes text children; output stays data in `data/projects.ts` (zod-validated) |

## Sources

### Primary (HIGH confidence)
- Live-DOM repro scripts (Edge + Playwright Firefox against `next start`, 2026-11-14): instrumented close-path log, the `scrollRestoration` manual/auto controls, the rAF fix prototype across views, sizes, close paths and both edges, the 375 px sweeps, rail geometry and the IN-01/zoom repro.
- Installed Next 16.4.5 source: `client/components/app-router.js` (popstate, history patching), `sequential-router-queue.js` (`traverse`/`restore`), `router-reducer/reducers/restore-reducer.js` (`scrollRef: null`), `layout-router.js` (InnerScrollHandler, Activity gating), `client/app-dir/link.js` (onClick → `defaultPrevented` → `linkClicked`, `onNavigate`).
- Installed docs: `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` (§scroll, §onNavigate), `04-functions/use-router.md`, `02-guides/preserving-ui-state.md`.
- Repo files read this session: `LightboxDialog.tsx`, `PhotoViewer.tsx`, `MapSheet.tsx`, `CarouselView.tsx`, `CarouselControls.tsx`, `SiteNav.tsx`, `DemoTerminal.tsx`, `lib/demo-terminal.ts`, `Demo.tsx`, `data/projects.ts`, `AscentHero.tsx`, `CameraRig.tsx`, `AltimeterRail.tsx`, `app/globals.css`, `playwright.config.ts`, `package.json`, and the e2e/Jest files named above.

### Secondary / Tertiary
- None. No web sources were needed.

## Metadata

**Confidence breakdown:**
- LBOX-08 root cause and mechanism: HIGH (reproduced, controlled, fixed in a prototype; WebKit unobserved, see A1)
- Terminal / transcript integration: HIGH (code read, React/jsdom behaviour verified in installed source)
- Menu fix: HIGH (Next Link source read)
- HOME-09: HIGH (measured clean in 2 engines × 4 modes × 8 stops)
- HOME-10: HIGH for geometry, MEDIUM for live-canvas pixel stability (A4)

**Research date:** 2026-11-14
**Valid until:** 2026-12-14 (or any Next/React minor bump: re-check the restore reducer and the popstate flush)
