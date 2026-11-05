---
phase: 07-foundation-guardrails
reviewed: 2026-10-24T12:00:00Z
depth: standard
files_reviewed: 117
files_reviewed_list:
  - .github/dependabot.yml
  - .github/workflows/ci.yml
  - .github/workflows/visual-baselines.yml
  - .gitignore
  - README.md
  - app/(site)/contact/page.tsx
  - app/(site)/error.tsx
  - app/(site)/layout.tsx
  - app/(site)/not-found.tsx
  - app/(site)/offline/page.tsx
  - app/(site)/page.tsx
  - app/(site)/photos/page.tsx
  - app/(site)/projects/[slug]/page.tsx
  - app/(site)/projects/page.tsx
  - app/(site)/roadmap/page.tsx
  - app/global-error.tsx
  - app/globals.css
  - app/layout.tsx
  - app/not-found.tsx
  - components/FeatureShowcase.tsx
  - components/FeedbackForm.tsx
  - components/Footer.tsx
  - components/GalleryGrid.tsx
  - components/GeologicalButton.tsx
  - components/GlassmorphismNav.tsx
  - components/Header.tsx
  - components/Hero3DMountain.tsx
  - components/HologramTerminal.tsx
  - components/HologramTerminalDemo.tsx
  - components/ImageDetailModal.tsx
  - components/InteractiveHotspot.tsx
  - components/MountainTerrain3D.tsx
  - components/PhotoCarousel3D.tsx
  - components/PhotosPageClient.tsx
  - components/ProjectCard.tsx
  - components/ProjectDetailClient.tsx
  - components/ProjectHighlights.tsx
  - components/RoadmapFilters.tsx
  - components/RoadmapProgress.tsx
  - components/RoadmapTimeline.tsx
  - components/SafeCanvas.tsx
  - components/TechStackDisplay.tsx
  - components/__tests__/GalleryGrid.test.tsx
  - components/__tests__/RoadmapFilters.test.tsx
  - components/__tests__/RoadmapTimeline.test.tsx
  - components/__tests__/SafeCanvas.test.tsx
  - components/__tests__/global-error.test.tsx
  - components/providers/MotionProvider.tsx
  - components/site/ErrorBody.tsx
  - components/site/NotFoundBody.tsx
  - components/site/SiteChrome.tsx
  - components/site/SiteFooter.tsx
  - components/site/SiteNav.tsx
  - components/site/SkipLink.tsx
  - components/site/__tests__/ErrorBody.test.tsx
  - components/site/__tests__/SiteChrome.test.tsx
  - components/site/__tests__/SiteNav.test.tsx
  - data/site.ts
  - data/types.ts
  - e2e/a11y-contact.spec.ts
  - e2e/design-system.spec.ts
  - e2e/homepage.spec.ts
  - e2e/no-webgl.spec.ts
  - e2e/perf/home-baseline.json
  - e2e/perf/home-baseline.spec.ts
  - e2e/shell.spec.ts
  - e2e/visual/README.md
  - e2e/visual/hide-canvas.css
  - e2e/visual/routes.spec.ts
  - eslint.config.mjs
  - lib/__tests__/motion-tokens.test.ts
  - lib/animations.ts
  - lib/email.ts
  - lib/useGlowIntensity.ts
  - package.json
  - playwright.config.ts
  - scripts/README.md
  - scripts/ci/check-snapshot-commit.mjs
  - scripts/ci/check-visual-run.mjs
  - scripts/guards/__selftest__/contrast/at-threshold.css
  - scripts/guards/__selftest__/contrast/below-threshold.css
  - scripts/guards/__selftest__/contrast/empty.css
  - scripts/guards/__selftest__/contrast/low-ink.css
  - scripts/guards/__selftest__/contrast/missing-danger.css
  - scripts/guards/__selftest__/contrast/unknown-token.css
  - scripts/guards/__selftest__/contrast/var-cycle.css
  - scripts/guards/__selftest__/same-classnames/after-changed.tsx.txt
  - scripts/guards/__selftest__/same-classnames/after-neutral.tsx.txt
  - scripts/guards/__selftest__/same-classnames/before.tsx.txt
  - scripts/guards/__selftest__/test-count/baseline-90.json
  - scripts/guards/__selftest__/test-count/baseline-91.json
  - scripts/guards/__selftest__/test-count/clean/e2e/clean.ts
  - scripts/guards/__selftest__/test-count/focused/e2e/x.ts
  - scripts/guards/__selftest__/test-count/jest-65.json
  - scripts/guards/__selftest__/test-count/jest-66.json
  - scripts/guards/__selftest__/test-count/jest-pending.json
  - scripts/guards/__selftest__/test-count/list-25-two-projects.json
  - scripts/guards/__selftest__/test-count/list-25.json
  - scripts/guards/__selftest__/visual-run/jobs-fail.json
  - scripts/guards/__selftest__/visual-run/jobs-no-visual.json
  - scripts/guards/__selftest__/visual-run/jobs-pass.json
  - scripts/guards/__selftest__/visual-run/jobs-pending.json
  - scripts/guards/__selftest__/visual-run/runs-no-ci.json
  - scripts/guards/__selftest__/visual-run/runs.json
  - scripts/guards/check-contrast.mjs
  - scripts/guards/check-identity.mjs
  - scripts/guards/check-install-parity.mjs
  - scripts/guards/check-palette.mjs
  - scripts/guards/lib/legacy-dead-files.mjs
  - scripts/guards/palette-ratchet.json
  - scripts/guards/same-classnames.mjs
  - scripts/guards/selftest.mjs
  - scripts/guards/test-count.baseline.json
  - scripts/guards/test-count.mjs
  - scripts/guards/version-floors.json
  - tsconfig.json
  - vercel.json
findings:
  critical: 1
  warning: 9
  info: 17
  total: 27
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-10-24T12:00:00Z
**Depth:** standard
**Files Reviewed:** 117 source/config/fixture files (the 36 `e2e/visual/routes.spec.ts-snapshots/**/*.png` baselines and `package-lock.json` in scope were not read as content; only the code that names or versions them was checked)
**Status:** issues_found

## Summary

I reviewed the guard scripts and their self-test fixtures, the CI and baseline workflows, the new shell (`components/site/*`, `app/(site)/layout.tsx`, the 404 and error boundaries), the tokens v2 stylesheet, and the v1 page and component bodies that this phase restyled.

Commands run to confirm findings (all read-only):
- `node scripts/guards/selftest.mjs`: 55/55 pass.
- `check-palette`, `check-identity`, `check-install-parity`, `check-contrast`: all OK at HEAD.
- An out-of-band `tsc` over `e2e/**` and `playwright.config.ts`: clean.
- Throwaway probes in the session scratchpad for the contrast and palette regex gaps (WR-01, WR-02). No repository file was changed.

The guards do what their self-tests cover. The main problems are gaps those self-tests do not exercise:
- The contrast guard can pass when the screen value fails (WR-01).
- The palette guard does not see several Tailwind colour utility families (WR-02).
- The palette guard's `png` rule fails `npm run lint` after any local visual run on Windows (WR-03).
- `same-classnames` passes without checking anything on moved files (WR-04).

The one BLOCKER is in the shell: every route has the same `document.title`, so Next's route announcer never announces a client-side navigation. The 404 body's design relies on that announcement (CR-01).

Items already listed in `.planning/STATE.md` "Blockers/Concerns" that I came across are reported as Info and tagged "known, deferred" (IN-13 to IN-16).

**Incremental re-review after gap-closure plan 07-27 (2026-10-24, standard depth, diff `0745a54..HEAD`):** `components/Hero3DMountain.tsx` and `e2e/shell.spec.ts`, both already in the list above. The removal of the hero's own skip anchor leaves nothing dangling (`#home-content` is still the CTA target at `Hero3DMountain.tsx:96` and exists at `app/(site)/page.tsx:29`), and the new count assertion is not vacuous (red on `5f403af`, green on `460b3a4`). IN-04 is resolved. Two new findings, numbered on from this report: WR-09 (the guard is name-based) and IN-17 (the count is taken once, before hydration settles).

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Every route shares one document title, so client-side navigations (including the 404) are never announced

**File:** `app/layout.tsx:30-35` (also `components/site/NotFoundBody.tsx:7`, every `app/(site)/**/page.tsx`)
**Issue:** The root metadata defines `title: { default: 'Tim Lui · Developer & photographer', template: '%s · Tim Lui' }`, and its comment says "child segments render '<page> · Tim Lui'". No segment sets a title, though: `grep metadata app/` finds only `app/layout.tsx`. Most pages are `'use client'` (Home, Contact, Projects, Roadmap, Offline) and cannot export `metadata`. Neither not-found file sets one either.

Next 16.4's `AppRouterAnnouncer` (`node_modules/next/dist/client/components/app-router-announcer.js:50-65`) reads `document.title` and only announces when it differs from the previous title. With one constant title, a screen-reader user hears nothing on any client-side navigation. That includes Link navigations to `/projects/<bad-slug>`, which reach the 404.

`NotFoundBody.tsx:7` says "no focus move (the route announcer reads the title)". That is the exact mechanism that never fires. It is also a WCAG 2.4.2 (Page Titled) failure: every page carries the same title regardless of its topic. This is not a pixel-level issue, so the visual baselines cannot catch it, and no e2e test asserts per-route titles. `homepage.spec.ts:107` only checks `/Tim Lui/`.
**Fix:** Give each segment a title. Client pages need a sibling server `layout.tsx` (or a server `page.tsx` wrapping a client body). The root `not-found.tsx` supports `metadata` (see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md:185-195`).
```tsx
// app/(site)/contact/layout.tsx (same pattern for photos, projects, roadmap, offline)
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Contact' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

// app/not-found.tsx and app/(site)/not-found.tsx
export const metadata: Metadata = { title: 'Page not found' };

// app/(site)/projects/[slug]/page.tsx
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: projects.find((p) => p.slug === slug)?.name ?? 'Page not found' };
}
```
Then add an e2e assertion that `/`, `/photos`, `/projects` and `/__no-such-page__` have distinct titles.

## Warnings

### WR-01: Contrast guard merges `:root` blocks nested in `@media`, so a media-scoped override can mask a failing base token

**File:** `scripts/guards/check-contrast.mjs:71`, `scripts/guards/check-contrast.mjs:89-103`
**Issue:** `BLOCK = /(:root|@theme...)\s*\{([^{}]*)\}/g` matches every innermost `:root { }`, including one inside `@media print { }`, `@media (prefers-contrast: more) { }` or `@supports`. `readTokens` then merges them all with "later declarations win". I confirmed a false pass with a scratch copy of `app/globals.css`:
- `--mist-300` lowered to `oklch(0.30 ...)` on its own gives `contrast: 4 failures`.
- The same file plus `@media print { :root { --mist-300: oklch(0.76 0.016 250); } }` gives `ink-muted/surface 8.92 PASS`, `contrast: OK (28 pairs)`.

So the guard can report OK while screen visitors get a failing 1.40:1 pair. The reverse case (a stricter media override) produces a false fail.
**Fix:** Only read top-level blocks, and fail on any token block nested in an at-rule. A minimal version strips at-rule bodies before matching:
```js
// before matching BLOCK: blank out @media/@supports/@container bodies (they hold nested braces)
function stripConditionalBlocks(css) {
  let out = '', i = 0;
  const re = /@(media|supports|container|layer)\b[^{]*\{/g;
  let m;
  while ((m = re.exec(css))) {
    out += css.slice(i, m.index);
    let depth = 1, j = re.lastIndex;
    while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
    if (/--color-|--night-|--firn-|--mist-|--glacier-|--signal-|--caution-|--meadow-|--gallery-/.test(css.slice(m.index, j))) {
      throw new Error(`token override inside @${m[1]} is not measured; move it to a top-level block or extend the guard`);
    }
    i = re.lastIndex = j;
  }
  return out + css.slice(i);
}
```
Add a `media-override.css` self-test fixture that expects exit 1.

### WR-02: Palette guard regex misses directional borders, ring offsets and the shadow-colour families

**File:** `scripts/guards/check-palette.mjs:46-50`
**Issue:** `STOCK`/`WB` need the colour to follow the prefix directly (`(?:${PRE})-(?:${FAM})`), and the `(?<![\w-])` lookbehind rejects a match that starts after a hyphen. I ran the regexes from the real file (scratchpad probe), and each of these returned 0 matches: `border-t-red-500`, `border-x-cyan-400`, `ring-offset-red-500`, `drop-shadow-red-500`, `inset-shadow-red-500`, `inset-ring-blue-500`, `text-shadow-red-500`, `border-t-white`, `drop-shadow-black`. The code has none of these today (grep is empty), but GUARD-04/DSGN-10 promise "any stock Tailwind palette class", and Phases 9-12 rebuild pages where `border-l-*` accents and `drop-shadow-*` are common. The `wb` ratchet has the same gap, so `border-b-white/10` can be added without raising a count.
**Fix:** Allow a hyphenated sub-utility between the prefix and the colour, and add the missing families:
```js
const PRE = 'bg|text|border(?:-[xytblrse])?|ring(?:-offset)?|inset-ring|outline|from|via|to|fill|stroke|divide|placeholder|decoration|shadow|inset-shadow|drop-shadow|text-shadow|accent|caret';
```
Add self-test fixtures for `border-t-red-500` and `drop-shadow-black` (the latter at ratchet 0).

### WR-03: The `png` rule walks the disk, so `npm run lint` fails on Windows after any local visual run

**File:** `scripts/guards/check-palette.mjs:174-180`; `e2e/visual/README.md:107-112`; `playwright.config.ts:51`
**Issue:** Locally `updateSnapshots: 'missing'`, so any local `--project=visual-dark` or `visual-light` run writes `*-visual-dark-win32.png` next to the baselines. `.gitignore` ignores them, but the `png` rule lists files with `fs.readdirSync` rather than git. After a local run, `npm run lint` (which chains `guard:palette`) fails with `only -linux.png snapshots may exist under e2e/` on files that can never be committed. The README says local runs "write -win32.png files", but not that lint then fails or how to recover.

In addition, both visual projects resolve to the same `DARK_PATH`. Locally they race to write the same missing `-visual-dark-win32.png`, so the light render can become the local dark reference.
**Fix:** Check only tracked or staged files for this rule, for example `git ls-files -co --exclude-standard -- e2e '*.png'` (it drops ignored files and keeps untracked, non-ignored ones). Alternatively set `updateSnapshots: 'none'` for the two visual projects even locally, so they never write. Document the `git clean -X e2e/visual` recovery in the README.

### WR-04: `same-classnames` passes without comparing anything on moved files and empty diffs

**File:** `scripts/guards/same-classnames.mjs:154-164`, `scripts/guards/same-classnames.mjs:174`
**Issue:** The script runs `git diff --name-status --no-renames`, so a moved file shows up as `D` plus `A`, and both are skipped. This phase moved `app/page.tsx`, `app/offline/page.tsx`, `app/projects/**` and `app/roadmap/page.tsx` into `app/(site)/`. Any "pixel-neutral" check across that move compared none of those files and still printed `same-classnames: OK`. When nothing is compared at all, it also prints `OK (0 file(s) compared ...)` and exits 0, so a wrong ref or path looks like a pass.
**Fix:** Pair renames instead of skipping them, and fail when nothing was compared:
```js
const status = git('diff', '--name-status', '-M', ref, '--', 'app', 'components') ...
// R100\told\tnew -> compare git show ref:old against new
const [code, a, b] = line.split('\t');
if (code.startsWith('R')) { compared++; if (!compare(`${a} -> ${b}`, git('show', `${ref}:${a}`), fs.readFileSync(path.join(root, b), 'utf-8'))) failures++; continue; }
...
if (compared === 0) { console.log('same-classnames: nothing compared'); process.exit(1); }
```

### WR-05: Grouped Dependabot dev-dependency PRs will fail the new parity guard whenever `@playwright/test` moves

**File:** `.github/dependabot.yml:24-29`; `.github/workflows/ci.yml:131`; `.github/workflows/visual-baselines.yml:32`; `scripts/guards/check-install-parity.mjs:192-198`
**Issue:** `@playwright/test` is `^1.64.0` and sits in the weekly `development-dependencies` minor/patch group. A bump changes the lockfile version, but the two `mcr.microsoft.com/playwright:v1.64.0-noble` tags stay put (the npm ecosystem does not edit workflow container tags). `guard:parity` then fails `npm run lint` for the whole grouped PR, which blocks every other dev-dependency update in that PR. Even with the tag fixed by hand, a Playwright or Chromium bump changes rendering, so the PR needs the re-baseline protocol, not an auto-merge.
**Fix:** Take Playwright out of the group and handle it on purpose:
```yaml
    groups:
      development-dependencies:
        dependency-type: "development"
        exclude-patterns: ["@playwright/test"]
        update-types: ["minor", "patch"]
    ignore:
      - dependency-name: "@playwright/test"   # bumped by hand with the container tag + re-baseline (e2e/visual/README.md)
```

### WR-06: Choosing the current page in the mobile menu leaves the panel open

**File:** `components/site/SiteNav.tsx:58-62`, `components/site/SiteNav.tsx:161-167`
**Issue:** The panel closes on a route change by comparing `pathname` with `menuPath`. Tapping the link for the current destination (for example "Roadmap" while on `/roadmap`, or "Engineering" while on `/projects/clix-cli` when its href is `/projects`) either doesn't change the pathname or happens before the change is observed. In the same-path case the panel stays open over the content, and focus stays on the link. Neither the six numbered close triggers nor `e2e/shell.spec.ts` (which only tests navigating to a different route) cover this.
**Fix:** Close on link activation as well as on route change:
```tsx
<Link href={item.href} onClick={() => setOpen(false)} aria-current={...} className={...}>
```
Add a `shell.spec.ts` case: on `/roadmap`, open the menu and click "Roadmap"; the panel must be hidden.

### WR-07: `SafeCanvas` swallows every error below it, with no logging

**File:** `components/SafeCanvas.tsx:17-30`, `components/SafeCanvas.tsx:63-72`
**Issue:** `CanvasErrorBoundary` exists to absorb the R3F >= 9.8 "Error creating WebGL context" rethrow, but `getDerivedStateFromError` catches any error from the Canvas subtree, and there is no `componentDidCatch`. R3F re-raises errors from scene children through `<Canvas>`: a shader compile error, a failed texture load in `useProgressiveTextures`, or a null ref in `useFrame`. All of these now turn into a silent blank canvas in production. `e2e/no-webgl.spec.ts` would also pass for a scene that is broken for unrelated reasons, because it only checks that the error page is absent.
**Fix:** Log what was caught, and keep the silent fallback only for the WebGL-unavailable case:
```tsx
componentDidCatch(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  if (!/WebGL|webgl context/i.test(msg)) console.error('SafeCanvas: scene error', error);
}
```
Optionally, store the caught error in state and rethrow it from `render()` when it is not a WebGL-context error, so real scene bugs still reach `app/(site)/error.tsx`.

### WR-08: HologramTerminalDemo keeps typing and advancing after Pause (timers are not cleaned up)

**File:** `components/HologramTerminalDemo.tsx:33-89`
**Issue:** The cleanup only clears `inputInterval`. The nested `setTimeout` (500 ms), the `outputInterval` and the `loopDelay` advance timeout are never stored or cleared. This phase added `playOverride` and the reduced-motion start-paused logic, so Pause is now a primary control. Pressing it while the output is typing does three things:
- The output keeps typing.
- `setCurrentIndex` still advances after `loopDelay`.
- The re-run effect then returns early (`!isPlaying`), so the shown input and output belong to the previous command, while `currentCommand`'s risk badge and explanation show the next one.

The same leak fires `setState` after unmount (the component sits in a dynamic `ssr:false` subtree on project pages).
**Fix:** Track every timer and clear them all in the cleanup:
```ts
const timers: ReturnType<typeof setTimeout>[] = [];
const intervals: ReturnType<typeof setInterval>[] = [];
// push each setTimeout / setInterval id as it is created
return () => { timers.forEach(clearTimeout); intervals.forEach(clearInterval); };
```

### WR-09: The skip-link guard only catches links named "Skip to ...", but the comment says it catches any second skip link (and the 07-27 handoff advises naming around it)

**File:** `e2e/shell.spec.ts:30`, `e2e/shell.spec.ts:68-69`, `e2e/shell.spec.ts:160-161` (incremental review after 07-27)
**Issue:** `skipLinks` is `page.getByRole('link', { name: /skip to/i })`. The comment on lines 68 and 160 says "exactly one skip link, so a page-level second skip link fails here". In fact only a second link whose name contains "skip to" fails. A second bypass link named "Skip navigation", "Skip past the hero", "Jump to content", "Bypass the intro" or an icon-only `aria-label="Skip"` keeps the test green, although SC4 / SHELL-01 forbids it. The 07-27 SUMMARY's Phase 9 handoff note (`07-27-SUMMARY.md:148`) says a new hero "jump past the ascent" link "must not be named 'Skip to ...' ... or this guard goes red", which tells the next implementer how to avoid the guard rather than how to satisfy the invariant. The Phase 9 hero rebuild is exactly where the original duplicate came from.
**Fix:** Detect a skip link by how it is built, not only by its name, then reword the comment and the SUMMARY note so they say a second bypass link is not allowed:
```ts
// Any same-page fragment link that is visually hidden until focus is a skip link,
// whatever it is called. The visible "Explore My Work" CTA (#home-content) is excluded
// because it has a real layout box.
async function countSkipLinks(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].filter((a) => {
      const r = a.getBoundingClientRect();
      return r.width <= 1 && r.height <= 1; // sr-only box before focus
    }).length,
  );
}

await expect(skipLinks(page)).toHaveCount(1);                    // keep the named check
await expect.poll(() => countSkipLinks(page)).toBe(1);           // structural check
```
At minimum, widen the name match to `/\b(skip|jump|bypass)\b/i` and state in the comment that the check is name-based.

## Info

### IN-01: scripts/README.md lint chain and emoji row are stale

**File:** `scripts/README.md:110`, `scripts/README.md:124`
**Issue:** The README gives the lint chain as `eslint . && guard:parity && guard:palette && guard:contrast && guard:selftest`, but `package.json:10` also runs `guard:identity`, and `check-identity.mjs` has no section. The emoji row still says "skipped in lint until plan 07-25", but the rule is on (`check-palette.mjs:37`).
**Fix:** Add `guard:identity` and a `check-identity.mjs` section, and drop the "skipped until 07-25" note.

### IN-02: Root layout comment names `middleware.ts`; this Next version uses `proxy.ts`

**File:** `app/layout.tsx:42-44`
**Issue:** The comment says nonces come "from middleware.ts". The repo has `proxy.ts` and no `middleware.ts`.
**Fix:** Change the comment to `proxy.ts`.

### IN-03: The G3 test comment describes the deleted v1 Header

**File:** `e2e/design-system.spec.ts:168-169`
**Issue:** The comment says "The v1 Header slides in from y -100". The banner is now `SiteNav` (static, sticky). The settle loop is harmless but justified by code that no longer exists.
**Fix:** Update the comment, or drop `settledBox` before the click if it is no longer needed.

### IN-04: Home renders a second "Skip to content" link after the shell's skip link

**File:** `components/Hero3DMountain.tsx:159-165`
**Issue:** `SiteChrome` already renders `SkipLink` as the first tab stop. The hero adds a second sr-only "Skip to content" (`#home-content`) with v1 classes (`focus:bg-frost-600`), so keyboard users meet two skip links with different targets.
**Fix:** Remove the hero's link (Phase 9 hero rework), or leave a note in the Phase 9 plan.

### IN-05: The Home stats show hard-coded, false figures

**File:** `app/(site)/page.tsx:19-20`
**Issue:** The page shows `'850+' Tests Passing` and `'20%' Roadmap Complete` as literals. The ratchet baseline records 206 tests (`scripts/guards/test-count.baseline.json`), and roadmap completion is computed in `RoadmapProgress`.
**Fix:** Derive both figures (for example from `roadmapItems`) or drop them in the Phase 9 Home rebuild.

### IN-06: The contrast self-test pins exact production ratios, so any token tweak breaks `npm run lint`

**File:** `scripts/guards/selftest.mjs:469-474`
**Issue:** `expectOutput` requires `ink/surface 16.03`, `danger/surface-raised 6.74` and `line-strong/surface-overlay 4.17` from the real `app/globals.css`. Retuning any of those primitives, even one that still passes every threshold, fails the self-test (and lint) for reasons unrelated to the guard's ability to fail.
**Fix:** For the real file, assert only `contrast: OK (28 pairs)` and the table order. Keep exact ratios to the fixture CSS files.

### IN-07: `check-snapshot-commit` passes a merge commit without checking it under `--none`

**File:** `scripts/ci/check-snapshot-commit.mjs:119`
**Issue:** `git show --name-status` on a merge commit prints the combined diff, which is usually empty, so `--none` returns `OK (0 changed)` whatever the merge brought in.
**Fix:** Detect merges (`git rev-list --parents -n1 <sha>`) and use `git diff --name-status <sha>^1 <sha>`, or exit 2 with "merge commits are not supported".

### IN-08: Tests and e2e specs are excluded from `type-check`

**File:** `tsconfig.json:38-46`
**Issue:** `**/__tests__/**`, `*.test.*`, `*.spec.ts` and `e2e/**` are excluded, so `npm run type-check` never sees the roughly 1,300 lines of new spec and test TypeScript. Playwright and next/jest strip types without checking them. I ran an out-of-band `tsc` over `e2e/**` and it is clean today, so this is a latent gap rather than a current error.
**Fix:** Add a `tsconfig.test.json` that extends the root and includes `e2e/**` and the tests, and run it in the lint job.

### IN-09: FeedbackForm parses JSON before checking the status, so a non-JSON error shows "Network error"

**File:** `components/FeedbackForm.tsx:84-99`
**Issue:** `await response.json()` throws on an HTML 502/504 or an empty 429 body, and the catch block then shows the wrong message: "Network error. Please check your connection".
**Fix:** Parse defensively: `const data = await response.json().catch(() => ({}));`.

### IN-10: The `high` and `critical` risk levels now render identically

**File:** `components/HologramTerminalDemo.tsx:91-96`
**Issue:** Both map to `text-danger border-danger`. Before this phase they were orange and red. The visible label still differs, but the colour no longer encodes the step.
**Fix:** Acceptable as interim (the Phase 11 content needs from Tim include riskScore). If the distinction matters, add a weight or icon difference for `critical`.

### IN-11: The section error component is named `Error`, which shadows the global

**File:** `app/(site)/error.tsx:12`
**Issue:** `export default function Error(...)` shadows the global `Error` constructor in that module. It works today, because the prop type resolves to the lib interface, but any later `new Error(...)` or `instanceof Error` in the file would refer to the component.
**Fix:** Rename it to `SectionError`.

### IN-12: The roadmap timeline dot clips its 20 px icon

**File:** `components/RoadmapTimeline.tsx:110-113`
**Issue:** The dot is `w-6 h-6` with `border-4`, which leaves a 16 px content box, and the `status.Icon` inside it is `size={20}`, so it overflows the dot by 4 px. This sits next to the known Phase 11 header-overflow item, but it is a separate element.
**Fix:** Use `size={12}` for the dot icon, or enlarge the dot to `w-8 h-8`.

### IN-13: Hero badge contrast is still failing (known, deferred to Phase 9 hero rework, STATE.md)

**File:** `components/Hero3DMountain.tsx:70`
**Issue:** `text-snow-50` on `from-frost-500 to-frost-600` at 18 px semibold measures 1.42-2.17:1. The contrast guard measures token pairs only, so it does not catch this.
**Fix:** As planned in the Phase 9 hero rework; until then, `text-ink-inverse` on `bg-accent` is a passing token pair.

### IN-14: Hover background lost on the white CTAs (known, deferred to Phase 9, STATE.md)

**File:** `app/(site)/page.tsx:234`, `components/Hero3DMountain.tsx:97`
**Issue:** `bg-snow-50 hover:bg-snow-100` both resolve to `--firn-50`, so hovering does not change the background.
**Fix:** Use a distinct semantic hover state when Phase 9 migrates these buttons.

### IN-15: Tailwind v3 `bg-opacity-*` classes in the image modal (known, deferred to Phase 10, STATE.md)

**File:** `components/ImageDetailModal.tsx:46`, `components/ImageDetailModal.tsx:60`
**Issue:** Tailwind 4.3 does not generate `bg-opacity-90/50/75`, so the backdrop and close button render fully opaque.
**Fix:** The Phase 10 lightbox; the interim fix is `bg-black/90` and `bg-surface/50 hover:bg-surface/75` (within the wb ratchet).

### IN-16: `notFound()` under `/projects/[slug]` has no server-rendered 404 body (known, deferred to Phase 12 / EDGE-01, STATE.md)

**File:** `app/(site)/projects/[slug]/page.tsx:17-19`
**Issue:** The server sends HTTP 404 with an empty `__next_error__` document, and the shell and 404 body render only on the client. Combined with CR-01, a screen-reader user who follows a bad project link gets neither a server page nor an announcement.
**Fix:** Investigate before EDGE-01 sign-off, as planned (for example a `generateStaticParams` plus `dynamicParams = false` route, so unknown slugs reach the root not-found).

### IN-17: The skip-link count passes as soon as it first reads 1, so a link added after hydration is not counted

**File:** `e2e/shell.spec.ts:69`, `e2e/shell.spec.ts:161` (incremental review after 07-27)
**Issue:** `toHaveCount(1)` retries only while the count is wrong and stops at the first match. `page.goto` resolves on `load`, so the assertion usually runs against the server-rendered DOM. A second skip link rendered only on the client, for example from a `dynamic(..., { ssr: false })` hero (the pattern the Phase 9 3D hero is likely to use) or after a post-load effect, can mount after the check has passed. The RED proof covered only a server-rendered duplicate. The landmark counts on lines 63-67 work the same way, but they guard server-rendered shell parts, whereas a second skip link is most likely to come from client-side page content.
**Fix:** Count again at the end of the test, after the Tab/Enter sequence, when the page has hydrated and focus has moved:
```ts
await page.keyboard.press('Enter');
await expect(page.locator('#main-content')).toBeFocused();
await expect(skipLinks(page)).toHaveCount(1); // re-check after hydration and interaction
```
In the 404 test, add the same re-check after the `nav` assertions. Alternatively, wait for `page.waitForLoadState('networkidle')` before the first count.

---

_Reviewed: 2026-10-24T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Incremental re-review (07-27, `0745a54..HEAD`): 2026-10-24, standard depth, WR-09 and IN-17 added_
