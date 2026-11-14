# Phase 14: UI Fixes & Terminal Controls - Pattern Map

**Mapped:** 2026-11-14
**Files analyzed:** 18 (all modified, none created; PNGs excluded)
**Analogs found:** 18 / 18 (every analog is git-tracked source)

All files below are modified. For each, the analog is the file's own current convention plus the closest sibling pattern. Locked inputs: D-01..D-23 (14-CONTEXT.md), UI-SPEC Contracts 1-4 with P1/P2/P3/P5 defaults and P4 → restore code (D-21, no `scroll-mb-4`).

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `components/photos/LightboxDialog.tsx` | component (client util fn) | event-driven (history traversal → focus) | own `restoreFocus` L118-136 + unmount microtask L226-238 | exact |
| `components/photos/PhotoViewer.tsx` | component | event-driven (key/click → state) | own `toggleLabels` L322, button L537, `collapseCallout` L339-348 | exact |
| `components/site/SiteNav.tsx` | component | event-driven | own Escape handler L100-105, panel `<Link>` L185-195 | exact |
| `components/home/AscentHero.tsx` | component (SSR markup) | static | own scrim L84-87 | exact |
| `lib/demo-terminal.ts` | utility (pure state machine) | transform | own `goTo` L91-98 | exact |
| `components/projects/DemoTerminal.tsx` | component (client island) | event-driven + SSR | own `TOGGLE`/`DOT`, `override ?? reduced`; `CarouselControls.tsx` L45-60; `roadmap/RouteRow.tsx` L79-83 | exact |
| `components/site/__tests__/SiteNav.test.tsx` | test (Jest) | — | own L87-100 | exact |
| `components/projects/__tests__/DemoTerminal.test.tsx` | test (Jest) | — | own L278-285, L313-320 | exact |
| `lib/__tests__/demo-terminal.test.ts` | test (Jest) | — | own `goTo` row L84 | exact |
| `components/photos/__tests__/lightbox-dialog.test.tsx` | test (Jest) | — | own header + router mock L1-25 | exact |
| `components/home/__tests__/rail.test.tsx` | test (Jest, keep unchanged) | — | L197 scrim class assertion | guard |
| `e2e/photos-lightbox.spec.ts` | test (Playwright) | — | own "Focus and Escape" L399-490, L692-730 | exact |
| `e2e/home-modes.spec.ts` | test (Playwright) | — | own 375 block L363-388, B8 L483-519, `worstContrastBehind` L122 | exact |
| `e2e/shell.spec.ts` | test (Playwright) | — | own "Shell mobile menu" L269-331 | exact |
| `e2e/case-study.spec.ts` | test (Playwright) | — | own Demo L507-717, reduced L719-733 | exact |
| `e2e/visual/routes.spec.ts` | test (visual) | — | own reduced loop L144-157, lightbox L206-237 | exact |
| `e2e/helpers/ascent.ts` | test helper | — | own `scrollBlockToCentre` L12-18; move `waitForRevealed` from `e2e/home-canvas.spec.ts` L85-90 | exact |
| `13-LEDGER-TRIAGE.md` row #30 / #6 write-back | docs | — | — | n/a |

## Pattern Assignments

### `components/photos/LightboxDialog.tsx` (LBOX-08, D-21)

**Current code to change** (L118-136): only the `mark` branch.
```tsx
export function restoreFocus(slug: string, opener: Element | null): void {
  const mark = slug
    ? document.querySelector<HTMLElement>(`[data-photo-id="${cssEscape(slug)}"]`)
    : null;
  if (mark) {
    mark.focus({ preventScroll: true });
    mark.scrollIntoView({ block: 'nearest' });   // <- replace with revealTrigger(mark) + rAF re-reveal
    return;
  }
  if (opener instanceof HTMLElement && opener.isConnected) { opener.focus({ preventScroll: true }); return; }
  const heading = document.querySelector<HTMLElement>('main h1');
  ...
}
```
**Caller, unchanged** (L226-238): every close path (Escape, Close photo, Back) ends in `queueMicrotask(() => { ... restoreFocus(slug, opener.current); })`, so one change covers D-10.
**Shape to use:** 14-RESEARCH "LBOX-08 fix" (`RING_PX = 4`, `--nav-h` from `getComputedStyle(document.documentElement)`, `window.scrollBy({ top: delta, behavior: 'instant' })`, top-align oversized triggers, `requestAnimationFrame(() => { if (document.activeElement === mark) revealTrigger(mark); })`). Never `scrollIntoView` (scrolls the `overflow-hidden` map sheet). Doc comment convention: JSDoc citing the decision ID (`(14-RESEARCH D-08)`), as the existing comment cites `T-10-12`. Export `revealTrigger` if Jest tests it directly.

### `components/photos/PhotoViewer.tsx` (D-12, D-22)

**Two toggles to route through one `setLabels(on)`:**
```tsx
// L322
const toggleLabels = useEffectEvent(() => setLabelsOn(!labelsOn));
// L537 (Hide labels button)
onClick={() => setLabelsOn(!labelsOn)}
```
**Escape layer to guard** (L339-348):
```tsx
const collapseCallout = useEffectEvent((): boolean => {
  if (expandedId === null) return false;
  const id = cssEscape(expandedId);
  setExpandedId(null);
  const candidates = viewerRef.current?.querySelectorAll<HTMLElement>(
    `[data-hotspot-label="${id}"], [data-hotspot-row="${id}"]`
  );
  [...(candidates ?? [])].find((el) => el.getClientRects().length > 0)?.focus();
  return true;   // D-22: return false when no candidate is visible (zoomed / labels hidden)
});
```
Registered via `lightbox?.registerEscape(() => collapseCallout())` (L349) and the page keydown (L355). Do not clear in an effect on `labelsOn` (it is a cross-tab `useSyncExternalStore` pref, `lib/photos/hotspot-pref.ts`).

### `components/site/SiteNav.tsx` (SHELL-07/08, D-16, D-17, D-23)

**Focus-return order to copy** (Escape handler, L100-105):
```tsx
const onKeyDown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  buttonRef.current?.focus();
  setOpen(false);
};
```
**Panel link to extend** (L185-195): add `onClick` (plain activation, `item.href === pathname && location.search === ''` per D-23 → `preventDefault()`, focus `buttonRef`, `setOpen(false)`) and `focus-visible:-outline-offset-4` to:
```tsx
<Link
  href={item.href}
  aria-current={current ? 'page' : undefined}
  className={`relative flex min-h-12 items-center px-4 font-display text-heading font-normal ${COLOR_TRANSITION} ${
    current ? 'text-ink' : 'text-ink-muted hover:text-ink'
  }`}
>
```
Panel container (L180-182) keeps `overflow-y-auto`; `app/globals.css` `:focus-visible` (L200-204) unchanged. Use `isCurrentPath` (L58) only for `aria-current`; the D-16 test is strict `href === pathname`.

### `components/home/AscentHero.tsx` (HOME-10, D-13, P3 default)

**One class string** (L84-87):
```tsx
<div
  data-ascent-rail-scrim
  className="pointer-events-none absolute inset-y-0 right-0 hidden w-56 bg-linear-to-l from-surface/85 from-0% via-surface/60 via-70% to-transparent md:block"
/>
```
Change only stops to UI-SPEC Contract 3 (`from-surface/90 via-surface/85 via-85% ...`). Must keep `pointer-events-none hidden md:block w-56` (asserted at `rail.test.tsx:197`) and the width (read as `offsetWidth` by `components/home/terrain/CameraRig.tsx` L389-391).

### `lib/demo-terminal.ts` (ENG-06, D-03)

**Analog** (L91-98), import-free, JSDoc citing decision IDs:
```ts
/**
 * Jump to a command, complete (the selector dots, D-03). Throws a RangeError
 * for anything but an integer in [0, count).
 */
export function goTo(index: number, count: number): TerminalState {
  if (!Number.isInteger(index) || index < 0 || index >= count) {
    throw new RangeError(`goTo: index ${index} is outside [0, ${count})`);
  }
  return { index, phase: 'shown', chars: 0 };
}
```
Add `stepTo(index, dir: -1 | 1, count): TerminalState | null` beside it (null at either end, never wraps).

### `components/projects/DemoTerminal.tsx` (ENG-06, D-01..D-07)

**Class-constant convention** (L26-32): new `STEP` constant documented with a JSDoc line citing 14-UI-SPEC, next to:
```tsx
const DOT =
  'group inline-flex size-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-sm';
```
**End-stop button to copy** (`components/photos/CarouselControls.tsx` L48-58, class `STEP_BUTTON` L8-9):
```tsx
<button
  type="button"
  aria-label="Previous photo"
  aria-disabled={atStart ? 'true' : undefined}
  className={STEP_BUTTON}
  onClick={() => { if (!atStart) onStep(-1); }}
>
  <CaretLeftIcon size={24} aria-hidden="true" />
</button>
```
`STEP_BUTTON` = `'inline-flex size-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-sm border border-line-strong text-ink transition-colors duration-(--duration-fast) ease-erosion hover:bg-surface-overlay aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent'` (use the UI-SPEC Contract 1 string for the terminal). Icons from `@phosphor-icons/react/dist/ssr`.
**Sticky Pause state** (L159-166): `const [override, setOverride] = useState<boolean | null>(null); const sticky = override ?? reduced;` — D-02: step/dot press calls `setState(target); setOverride(true);`.
**Bottom bar to rework** (L289-316): `role="group" aria-label="Commands"`, class switch `count >= 7 ? 'min-h-12 flex-wrap' : 'h-12'`, dot `onClick={() => setState(goTo(i, count))}` (L304) → `show(goTo(i, count))`. Insert Previous before and Next after the dots map (Tab order Pause → Previous → dots → Next).
**Region wrapper** (L228-239): `role="region"`, `data-playback`, `data-command` unchanged; island returns a fragment with `<details data-transcript>` after the region (outside it).
**Disclosure precedent** (`components/roadmap/RouteRow.tsx` L79-83):
```tsx
<details className="group mt-2">
  <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-base font-semibold text-ink-muted hover:text-ink [&::-webkit-details-marker]:hidden">
    ...
    <CaretDownIcon size={20} aria-hidden="true" className="group-open:rotate-180" />
  </summary>
```
No `open` prop; mount-only `useEffect` reading `window.matchMedia('(prefers-reduced-motion: reduce)')` (not the reactive `reduced`); `onToggle` presses Pause only when `e.currentTarget.open && !sticky` (Pitfall 9). `<pre className="whitespace-pre-wrap wrap-anywhere">` per Pitfall 10.

## Test Pattern Assignments

### `components/site/__tests__/SiteNav.test.tsx`
Mocks only `usePathname` (L6-10, `mockUsePathname.mockReturnValue('/')` in `beforeEach`), `renderNav()` helper returns `menuButton`/`panel`/`outside`. Copy L87-100:
```tsx
it('closes on Escape and returns focus to the button', async () => {
  const user = userEvent.setup();
  const { menuButton, panel } = renderNav();
  await user.click(menuButton());
  await user.tab();
  expect(panel()).toContainElement(document.activeElement as HTMLElement);
  await user.keyboard('{Escape}');
  expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
  expect(panel()).not.toBeVisible();
  expect(menuButton()).toHaveFocus();
});
```
New rows: `mockUsePathname.mockReturnValue('/roadmap')`, `fireEvent.click(link)` returns `false` (defaultPrevented); modifier click (`{ ctrlKey: true }`) keeps it open. No `AppRouterContext` in Jest, so don't use `onNavigate`.

### `components/projects/__tests__/DemoTerminal.test.tsx`
Header JSDoc lists the state sources (`data-playback`, `data-command`, `aria-pressed`, `aria-current`). Fake timers + `setup()`/`advance()`/`region()`/`toggle()` helpers. **Rewrite, don't delete:** L278-285 (Tab lands on 'Previous command' now) and L313 "without touching the toggle" (now `aria-pressed="true"`, leaving does not resume). Pattern:
```tsx
await user.tab();
expect(within(region()).getByRole('button', { name: 'Go to command 1' })).toHaveFocus();
expect(region()).toHaveAttribute('data-playback', 'playing');
```
Add SSR row via `renderToString` from `react-dom/server`: `details[data-transcript]` without `open`. Toggle row with `fireEvent` on `toggle` (jsdom fires it on a real `setTimeout(0)`).

### `lib/__tests__/demo-terminal.test.ts`
One `describe('demo terminal state machine')`, plain `it` rows (e.g. L84 'jumps to a command, complete'). Add `stepTo` rows: mid-step, null at 0/-1, null at last/+1.

### `components/photos/__tests__/lightbox-dialog.test.tsx`
Suite-level router mock (L19-23: `mockRouter = { back: jest.fn(), ... }`, `usePathname: () => '/photos/test'`). Add `revealTrigger` rows by stubbing `getBoundingClientRect`, `window.innerHeight`, `window.scrollBy = jest.fn()`; assert `scrollBy` args (above, below, tall → top-aligned, visible → not called).

### `e2e/photos-lightbox.spec.ts`
`test.describe.configure({ mode: 'default' })` (L31). Helpers `clickTile`, `openFirstTile`, `waitForHydration` (L303-352). Every close-through-history test carries `@no-win-webkit` in the title with the three-line comment (L439-441). Existing focus assertion (L446-449) only checks the id, which is why the bug passed:
```ts
await expect
  .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
  .toBe(first.slug);
```
New describe "Focus on close stays in view (LBOX-08)" adds `expectTriggerFullyInView` (14-RESEARCH D-11 assertion) and Pitfall 4 setups. Keep L471 (scroll unchanged). Hotspot rows for D-12/D-22 at 1440×900.

### `e2e/home-modes.spec.ts`
Mode table pattern (L363-388) with tag suffix:
```ts
const modes: (Setup & { tag?: string })[] = [
  { name: 'static', setup: disableWebGL },
  { name: 'static-reduced', setup: reduceMotion },
  { name: 'eligible', setup: async () => {}, tag: ' @chromium-only' },
];
for (const { name, setup, tag = '' } of modes) { test(`${name}: ...${tag}`, ...) }
```
Extend with a no-JS mode and all stops via `scrollBlockToCentre` + `expectNoHorizontalScroll`. B8 (L483-519): loop widths, `disableWebGL`, `img.decode()`, hide `[data-ascent-cursor]`, `worstContrastBehind(page, label)`, push `annotations` `{ type: 'contrast' }`, `toBeGreaterThanOrEqual(4.5)`. Rewrite keeping the "B8:" title prefix; widths 768/1023/1280/1440 × stops × WebGL off/on (`@chromium-only`). N1 (L521+) stays.

### `e2e/shell.spec.ts`
"Shell mobile menu" (L269-331), `test.use({ viewport: { width: 375, height: 812 } })`, waits for panel animations to finish before measuring, and uses `tabReachesLinks(browserName)` (`e2e/helpers/engine.ts` L27) else `.focus()`:
```ts
if (tabReachesLinks(browserName)) await page.keyboard.press('Tab');
else await rows.nth(0).focus();
```
New rows: tap 'Roadmap' on `/roadmap` scrolled → hidden, button focused, `scrollY` and URL unchanged; computed `outline-offset` `-4px` and ring rect inside `#site-menu`. Keep 'choosing Photographs navigates' (L317).

### `e2e/case-study.spec.ts`
`test.describe('Demo (ENG-05)')` with `test.use({ reducedMotion: 'no-preference' })` (L507-508); locators `page.getByRole('region', { name: regionName })`, `region.getByRole('button', { name: 'Pause demo', exact: true })`. Rewrite L577-600 (Tab → 'Previous command') and L638 (dot presses Pause). Reduced-motion block (L719-733) asserts the post-hydration flip:
```ts
await expect(region.getByRole('button', { name: 'Pause demo', exact: true })).toHaveAttribute('aria-pressed', 'true');
await expect(region).toHaveAttribute('data-playback', 'paused');
```
Add `details[data-transcript]` toHaveAttribute('open', '') there; no-JS row via `test.use({ javaScriptEnabled: false })`; extend 375 row (L664) to open the transcript first.

### `e2e/visual/routes.spec.ts`
Reduced loop (L144-157): `emulateMedia({ reducedMotion: 'reduce' })`, `setViewportSize`, `goto`, `settle(page)`, `toHaveScreenshot([name, \`${w}-reduced.png\`], { fullPage: true, stylePath })`. For box, wait for `details[data-transcript][open]` before the shot. New menu set copies the lightbox pattern (L206-237, viewport shot) on `/projects` with the current row focused (P5). PNGs only via `visual-baselines.yml` dispatch; Tim commits.

### `e2e/helpers/ascent.ts`
Convention: JSDoc per export, imports `nextFrames` from `./webgl`. Move `waitForRevealed` (`e2e/home-canvas.spec.ts` L85-90) here as an export (it uses `stage`/`canvasBox` locators, move or inline those); update `home-canvas.spec.ts` to import it.

## Shared Patterns

### Tag conventions (`playwright.config.ts` L62-93)
- `@chromium-only`: dropped by Firefox/WebKit projects (live WebGL rows, B8 WebGL-on).
- `@no-win-webkit`: Windows WinCairo WebKit only; required on every lightbox close-through-history test, with the standard comment.
- `@firefox-43967`: Firefox-only skip for the Playwright 1.65 page crash; add only if a new Firefox row hits it.
Tags go at the end of the test title string.

### Assert state, not classes
Assert `aria-pressed`, `aria-disabled`, `aria-current`, `aria-expanded`, `data-playback`, `data-command`, `data-photo-id`, `open`, computed style or rects. Exceptions already in repo: `rail.test.tsx:197` class list, DemoTerminal layout-contract classes.

### Test ratchet (GUARD-03)
`scripts/guards/test-count.mjs` + `test-count.baseline.json`: test count may only go up; `.only(`/`.skip(`/`.fixme(` fail. Rewrite in place. Runs in CI Unit Tests job, not local lint.

### Class-string guards (run in `npm run lint`, package.json L10)
`scripts/guards/check-palette.mjs` (no stock palette, `dark:`, white/black; `palette-ratchet.json`), `check-contrast.mjs`, `check-identity.mjs`, `check-served-images.mjs`, `same-classnames.mjs`. Use tokens only (`surface`, `surface-raised`, `ink`, `ink-muted`, `line`, `line-strong`, `focus`, `accent`). All Phase 14 strings in RESEARCH Pitfall 11 pass.

### Post-hydration flip
Server renders the default; client changes only after hydration (`override ?? reduced` in DemoTerminal; transcript opens in a mount-only effect). Never render text that hydration would blank.

## No Analog Found

None. `revealTrigger` has no in-repo analog for the rect math; use the 14-RESEARCH code example directly.

## Metadata

**Analog search scope:** `components/{photos,site,home,projects,roadmap}`, `lib/`, `e2e/`, `e2e/helpers`, `e2e/visual`, `scripts/guards`, `playwright.config.ts`
**Files scanned:** ~25
**Pattern extraction date:** 2026-11-14
