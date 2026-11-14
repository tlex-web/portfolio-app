---
phase: 14-ui-fixes-terminal-controls
reviewed: 2026-11-14T14:23:39Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - components/home/AscentHero.tsx
  - components/photos/LightboxDialog.tsx
  - components/photos/PhotoViewer.tsx
  - components/photos/__tests__/lightbox-dialog.test.tsx
  - components/projects/DemoTerminal.tsx
  - components/projects/__tests__/DemoTerminal.test.tsx
  - components/site/SiteNav.tsx
  - components/site/__tests__/SiteNav.test.tsx
  - e2e/case-study.spec.ts
  - e2e/helpers/ascent.ts
  - e2e/home-canvas.spec.ts
  - e2e/home-modes.spec.ts
  - e2e/photos-lightbox.spec.ts
  - e2e/photos-sweep.spec.ts
  - e2e/shell.spec.ts
  - e2e/visual/routes.spec.ts
  - lib/__tests__/demo-terminal.test.ts
  - lib/demo-terminal.ts
findings:
  critical: 0
  warning: 3
  info: 6
  total: 9
  necessity: 1
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-11-14T14:23:39Z
**Depth:** standard
**Files Reviewed:** 18 source/test files (plus 12 binary PNG baselines, not source-reviewable)
**Status:** issues_found

## Summary

The review covered the Phase 14 diff (`e6ffce1..HEAD`) for the 18 text files in scope. The 12 PNG baselines under `e2e/visual/routes.spec.ts-snapshots/` are CI-rendered binaries. Tim reviewed and committed them (55160a4), and Visual Regression passed against them, so they were noted, not read.

Overall the phase is solid. The terminal state machine (`stepTo`), the step and dot "press Pause" rule, the transcript's SSR-closed / mount-only-open pattern, the window-only `revealTrigger`, the D-22 hidden-callout guard and the D-16/D-23 current-link close all match the locked decisions. `eslint` and `tsc --noEmit` are clean on the changed files. No security issues were found: there is no user input, and the transcript renders captured text through React's escaping.

Findings:
- One real interaction risk in the new SiteNav focus handler: it scrolls on pointer focus, between mousedown and mouseup.
- One provable necessity finding: a triple-guarded end press in DemoTerminal.
- One new e2e row that skips the hydration wait that its sibling row says is required.
- Six info items: fragile px parsing, a duplicated class string, an orphaned comment block, fixed sleeps, thin cross-engine coverage of the rAF re-reveal, and `innerHeight` against `clientHeight`.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: `revealFocusedRow` also scrolls the panel on pointer focus, so a tap near a partly hidden row's edge can miss the link

**File:** `components/site/SiteNav.tsx:67-76` (wired at `:214`)
**Issue:** The handler runs on every `focus` event that reaches the panel, including focus from a mouse or touch press. Firefox on Windows and Linux focuses a link on `mousedown`. When the panel scrolls (short viewports, as in the 375 x 320 row), pressing a partly visible row makes the handler move `panel.scrollTop` by `hiddenPart + 8` px between `mousedown` and `mouseup`.

Take a 48 px row with `v` px visible at the bottom edge, pressed at offset `p` into its visible part. After the shift the pointer sits at `p + 56 - v` inside the row. For `p >= v - 8` that is past the row's 48 px, in the 8 px `gap-2` between rows. `mouseup` then hits the `<li>`/`<ul>`, and `click` goes to the common ancestor of the two targets, not the `<a>`, so nothing navigates. The top edge fails the same way.

The requirement (SHELL-08, D-17) is about the keyboard focus ring, which only draws under `:focus-visible`. Neither Chromium nor Firefox scrolls a container on mouse focus by itself, so this scroll is new behaviour added on the pointer path.
**Fix:** Reveal only for keyboard focus, which is the case the ring exists for:
```tsx
function revealFocusedRow(event: ReactFocusEvent<HTMLDivElement>) {
  const panel = event.currentTarget;
  const row = event.target;
  if (row === panel || !(row instanceof HTMLElement) || !row.matches(':focus-visible')) return;
  // ...unchanged
}
```
The existing SHELL-08 e2e rows open the menu and focus rows from the keyboard, so they keep passing.

### WR-02: Already-defended-elsewhere: the Previous/Next end press is guarded three times

**File:** `components/projects/DemoTerminal.tsx:389-391`, `:424-426`, `:285-286`
**Category:** necessity
**Issue:** Each step button's `onClick` checks `state.index > 0` (or `< count - 1`) before it calls `show(stepTo(...))`. By contract, `stepTo` returns `null` in exactly those end cases (`lib/demo-terminal.ts:109-112`, unit-tested at `lib/__tests__/demo-terminal.test.ts` "stops at the ends"). `show` already treats `null` as "an end press: nothing changes and nothing is pressed" (`DemoTerminal.tsx:280-286`). So the inline guard defends against a state the next two layers already handle. The dot path never passes `null`. With three places encoding one rule, one of them can drift. The docblock already says `show` owns the D-03 end rule.
**Fix:** Drop the inline guards and let `stepTo` + `show` own D-03:
```tsx
onClick={() => show(stepTo(state.index, -1, count))}
...
onClick={() => show(stepTo(state.index, 1, count))}
```
The D-03 unit and e2e rows (end presses change nothing and press nothing) cover the behaviour unchanged.

### WR-03: The new D-23 shell row clicks Menu without waiting for hydration, which its sibling row says is required

**File:** `e2e/shell.spec.ts:384-388`
**Issue:** `on a view URL, Photographs still navigates to the plain page (D-23)` goes to `/photos?view=grid` and calls `button.click()` right away. The D-16 row just above it (`:359-361`), `openMenuByKeyboard` (`:407-410`) and the new menu visual row (`e2e/visual/routes.spec.ts`) all poll for `__reactProps` first, because a press before hydration does nothing. `/photos?view=grid` is one of the heaviest pages to hydrate (the justified grid and its images). A pre-hydration click leaves `aria-expanded="false"`, and `expect(panel).toBeVisible()` fails, so the row is intermittently red for a reason unrelated to D-23. The older rows at `:285`/`:323` share the pattern, but they run on `/roadmap`.
**Fix:** Reuse the wait the file already has:
```ts
const button = page.getByRole('button', { name: 'Menu' });
await expect
  .poll(() => button.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))))
  .toBe(true);
await button.click();
```

## Info

### IN-01: `revealTrigger` parses `--nav-h` with `parseFloat`, which silently assumes px

**File:** `components/photos/LightboxDialog.tsx:128-129` (and the mirrored parse in `e2e/photos-lightbox.spec.ts` `triggerState`)
**Issue:** `--nav-h` is `64px` today (`app/globals.css:53`). If it ever becomes `4rem` or a `calc()`, `parseFloat` returns `4` or `NaN → 0`, and the reveal clears 4 px instead of 64 px of sticky nav. The e2e check uses the same parse, so it would agree with the broken value and stay green.
**Fix:** Read the nav's real height, e.g. `document.querySelector('header')?.getBoundingClientRect().bottom ?? 0`, or resolve the variable through a probe element (`el.style.height = 'var(--nav-h)'; el.offsetHeight`). Either is unit-independent.

### IN-02: `revealTrigger` measures the viewport with `window.innerHeight`

**File:** `components/photos/LightboxDialog.tsx:136-137`
**Issue:** `innerHeight` includes a horizontal scrollbar when one is present. `document.documentElement.clientHeight` is the visible area, and the e2e helper already uses `clientWidth` for the horizontal check. HOME-09 makes a horizontal scrollbar unlikely, so this is latent.
**Fix:** Use `document.documentElement.clientHeight` in both `revealTrigger` and `triggerState`.

### IN-03: Orphaned "Close trigger 7" comment block duplicates the inline handler comment

**File:** `components/site/SiteNav.tsx:111-118`
**Issue:** The block sits between the route-change close and the effect, with no code under it. The behaviour lives 110 lines later, in a 22-line inline `onClick` in the JSX map (`:225-247`) that carries its own copy of the explanation. The two will drift.
**Fix:** Move the logic into a named function, e.g. `function closeOnCurrentLink(event, href)`, place the block comment above it, and pass `onClick={(e) => closeOnCurrentLink(e, item.href)}`.

### IN-04: The `STEP` class string is a verbatim copy of `CarouselControls`' `STEP_BUTTON`

**File:** `components/projects/DemoTerminal.tsx:42-48`; source at `components/photos/CarouselControls.tsx:8-9`
**Issue:** The comment's stated intent is "one look for every ‹ › on the site", but a copy-paste does not enforce that. A later tweak to one file will not reach the other. (`PhotoViewer.tsx:164` already has a third, different `STEP_BUTTON`.)
**Fix:** Export the string from a shared module (e.g. `components/ui/step-button.ts`) and import it in both places.

### IN-05: Fixed 4 s sleeps prove "nothing advanced"

**File:** `e2e/case-study.spec.ts:685`, `:803`
**Issue:** `page.waitForTimeout(4000)` is tied implicitly to `TIMINGS.holdMs` (3000). Each sleep adds 4 s per engine, and the rows go silently stale if the hold changes.
**Fix:** Derive the wait from the constant (`TIMINGS.holdMs + 1000`, importing from `@/lib/demo-terminal` as the spec already does for data), or use `page.clock` to fast-forward deterministically.

### IN-06: The next-frame re-reveal is a timing assumption with thin cross-engine coverage

**File:** `components/photos/LightboxDialog.tsx:166-171`; `e2e/photos-lightbox.spec.ts` "Focus on close stays in view"
**Issue:** The second `revealTrigger` in `requestAnimationFrame` assumes the browser's same-document scroll restoration lands after the microtask and before the next frame. D-21 diagnosed this in Edge and Firefox. In the matrix, though, only one row (Map 720x450, Escape) runs in Firefox and Linux WebKit. 'Close photo' and browser Back are Chromium-only. If an engine restores later than one frame, focus can land off-screen again with no failing row.
**Fix:** Add a Firefox-capable browser-Back row (Back is the path most tied to engine restoration timing). Alternatively, document in 14-SECURITY or deferred-items that non-Chromium Back is unverified.

---

_Reviewed: 2026-11-14T14:23:39Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
