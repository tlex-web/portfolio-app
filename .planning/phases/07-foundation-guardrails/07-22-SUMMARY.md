---
phase: 07-foundation-guardrails
plan: 22
subsystem: ui
tags: [shell, site-chrome, route-group, app-site, git-mv, skip-link, aria-current, mobile-menu, reduced-motion, home-identity, re-baseline, e2e, shell-01, shell-02, shell-03, dsgn-08, build-step-9]

requires:
  - phase: 07-21
    provides: "data/site.ts identity, SkipLink/SiteNav/SiteFooter/SiteChrome (default and static variants), --nav-h and the :where(*) scroll-margin-top sticky-nav offset (post-close fix 5544cc3)"
  - phase: 07-20
    provides: "Palette guard and white/black ratchet (palette-ratchet.json keyed by file path)"
  - phase: 07-09
    provides: "MotionProvider (MotionConfig reducedMotion=\"user\"), now mounted by SiteChrome instead of the root layout"
provides:
  - "app/(site)/ route group holding every content route (/, /photos, /projects, /projects/[slug], /roadmap, /contact, /offline) plus error.tsx, moved with git mv (renames 89-100%); app/api, app/layout.tsx, app/globals.css and app/not-found.tsx stay at the root; URLs unchanged"
  - "app/(site)/layout.tsx: <SiteChrome>{children}</SiteChrome>; app/layout.tsx no longer wraps MotionProvider"
  - "v1 Header/Footer removed from all seven pages; Hero3DMountain without GlassmorphismNav, CTAs and the hero sr-only skip link target #home-content, hero height calc(100svh - var(--nav-h)), h1 {site.name}, pill {site.role}"
  - "e2e/homepage.spec.ts scoped to the Primary nav (exact names Home, Photographs, Engineering)"
  - "e2e/shell.spec.ts: 17 tests (Shell landmarks 14, Shell mobile menu 2, Shell reduced motion 1), green in chromium and firefox in CI"
  - "33 visual baselines re-baselined in the mount commit (home, photos, projects, clix-cli, clix-website, roadmap, contact, offline); not-found unchanged"
affects: [07-23, 07-24, 07-25, 07-26, 09, 10, 11, 12]

actuals:
  tokens: 5667    # chars/4 over `git diff 38c8b7e..fbdbd1d -- . ':!*.png'` (22667 chars, 14 code files, 239+/49-); the 33 PNGs are binary and not counted
  tasks: 3        # Task 1 tracer and Task 3 executed; Task 2 checkpoint resolved by Tim's amend and reply "pushed"
  commits: 2      # measured: git rev-list --count 38c8b7e..HEAD = 2 (0c57f7f, fbdbd1d), before the docs commits
plan_head_before: 38c8b7efec4145158336c5e9d774a792d5fe8d6b
plan_head_after: fbdbd1dc8a899bd0a14c5bf5997a3323f9e6d7a6

tech-stack:
  added: []
  patterns:
    - "Site chrome is mounted once by the (site) route-group layout; pages render content only"
    - "Shell e2e: one route loop asserts every landmark with toHaveCount(1), never .first()"
    - "Reduced-motion e2e asserts getAnimations({ subtree: true }) is empty, and a motion-allowed probe proves the assertion can fail"
    - "No-horizontal-scroll is asserted as scrollWidth <= clientWidth (the 07-12 stable gutter makes innerWidth the wrong reference)"

key-files:
  created:
    - app/(site)/layout.tsx
    - e2e/shell.spec.ts
  modified:
    - app/(site)/page.tsx
    - app/(site)/error.tsx
    - app/(site)/photos/page.tsx
    - app/(site)/projects/page.tsx
    - app/(site)/projects/[slug]/page.tsx
    - app/(site)/roadmap/page.tsx
    - app/(site)/contact/page.tsx
    - app/(site)/offline/page.tsx
    - app/layout.tsx
    - components/Hero3DMountain.tsx
    - e2e/homepage.spec.ts
    - scripts/guards/palette-ratchet.json
    - e2e/visual/routes.spec.ts-snapshots/** (33 PNGs)

key-decisions:
  - "palette-ratchet.json key renamed app/page.tsx -> app/(site)/page.tsx (count 5 unchanged) in the mount commit; the plan's files_modified omitted the ratchet, which is keyed by path"
  - "Task 2 re-baseline: Tim amended the 33 PNGs into the mount commit (bb2a627 -> 0c57f7f) and replied 'pushed'; check-snapshot-commit with the 8 allowed slugs OK; CI run 40028858703 Visual, E2E and Unit green"
  - "The 768 px no-horizontal-scroll check is scrollWidth <= clientWidth, not scrollWidth == innerWidth, because the stable scrollbar gutter (07-12) makes innerWidth larger than the layout width without any overflow"
  - "Shell tests are test-after against the already-mounted shell (no RED commit); falsifiability shown by the Escape focus-return path and the reduced-motion probe"

patterns-established:
  - "Routes added later go into app/(site)/ and get the shell for free; only the root keeps api, layout, globals.css and not-found"

# Copied verbatim from the PLAN's `requirements`. Flipped in REQUIREMENTS.md per
# requirements.ready-ids 07-22-PLAN.md SHELL-01 SHELL-02 SHELL-03 DSGN-08 ->
# ready [SHELL-02, DSGN-08], blocked [SHELL-01 (07-23), SHELL-03 (07-25)].
requirements-completed: [SHELL-01, SHELL-02, SHELL-03, DSGN-08]

coverage:
  - id: D1
    description: "Every content route lives in app/(site)/ and renders inside SiteChrome; no page imports the v1 Header/Footer; the hero no longer renders GlassmorphismNav; URLs unchanged"
    requirement: SHELL-01
    verification:
      - kind: other
        ref: "per-page-shells node check -> 'per-page shells removed'; npm run build route list /, /_not-found, /api/feedback, /contact, /offline, /photos, /projects, /projects/[slug], /roadmap"
        status: pass
    human_judgment: false
  - id: D2
    description: "One banner, one Primary nav (inside the banner), one #main-content, one main and one contentinfo per route; skip link is the first Tab stop and focuses main; aria-current on the expected link only (none on /offline); footer hrefs equal site values"
    requirement: SHELL-01
    verification:
      - kind: e2e
        ref: "e2e/shell.spec.ts 'Shell landmarks' (7 routes); CI run 40030195076 E2E job 120676267671 (chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D3
    description: "At 768x900 the header is 64 px and the page has no horizontal scroll; at 375x812 the Menu button is >= 44 px, rows >= 48 px, Escape closes and returns focus, clicking Photographs navigates and hides the panel"
    requirement: SHELL-02
    verification:
      - kind: e2e
        ref: "e2e/shell.spec.ts 'Shell landmarks' 768 loop and 'Shell mobile menu' (2); CI run 40030195076"
        status: pass
    human_judgment: false
  - id: D4
    description: "Under reducedMotion 'reduce' the header subtree runs no animations after the menu opens; MotionProvider is mounted by SiteChrome"
    requirement: DSGN-08
    verification:
      - kind: e2e
        ref: "e2e/shell.spec.ts 'Shell reduced motion' (getAnimations = 0; the same probe with motion allowed found 2)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Home shows h1 'Tim Lui' and the 'Developer & photographer' pill, hero ends at the fold under the sticky nav, fully opaque at scroll 0"
    requirement: SHELL-03
    verification:
      - kind: visual
        ref: "Update visual baselines run 40021976701 (33 changed); review sheets sent to Tim; CI run 40028858703 Visual job 120671787466"
        status: pass
    human_judgment: true
    rationale: "Layout and identity rendering were reviewed by eye on the baseline sheets before Tim committed the PNGs"

duration: 1h 28m (plan start 20:26:50Z at ledger 38c8b7e; bb2a627 20:45:30Z; Tim's amend 0c57f7f 21:43:37Z; fbdbd1d 21:54:54Z; includes the Task 2 wait for Tim)
completed: 2026-10-23
status: complete
---

# Phase 7 Plan 22: Shell mounted through app/(site), 33 re-baselines, shell route-loop spec (build step 9, part 2)

**One atomic commit (`0c57f7f`) moves every content route into `app/(site)/` with `git mv`, mounts `SiteChrome` from the route-group layout, removes the v1 Header, Footer and GlassmorphismNav, gives Home the "Tim Lui" / "Developer & photographer" identity, and carries the 33 re-baselined PNGs that Tim reviewed and amended in. `fbdbd1d` adds `e2e/shell.spec.ts` (17 tests), which checks the landmarks, skip link, current page, 768 px header, mobile menu and reduced motion on every content route. CI is green in chromium and firefox.**

## Performance

- **Duration:** 1h 28m from the ledger (20:26:50Z) to `fbdbd1d` (21:54:54Z). This includes the Task 2 wait for Tim's review and amend.
- **Tasks:** 3/3
- **Files modified:** 47 (14 code files, 33 PNGs)

## Accomplishments

- **Route group (SHELL-01):** `app/(site)/` holds the 7 pages plus `error.tsx` and the new `layout.tsx`. Every file was moved with `git mv` (renames 89-100%), and `app/page.tsx` is gone. `app/api`, `app/layout.tsx`, `app/globals.css` and `app/not-found.tsx` stay at the root. The build route list is unchanged: `/`, `/_not-found`, `/api/feedback`, `/contact`, `/offline`, `/photos`, `/projects`, `/projects/[slug]`, `/roadmap`.
- **Mount:** `app/(site)/layout.tsx` renders `<SiteChrome>{children}</SiteChrome>`. The root layout no longer wraps `MotionProvider`, because SiteChrome's default variant mounts it.
- **Per-page shells removed:** no file under `app/` imports `@/components/Header` or `@/components/Footer`, and `Hero3DMountain` no longer renders `GlassmorphismNav`.
- **Home identity (SHELL-03, interim):** the inner `id="main-content"` is now `id="home-content"` (1 occurrence). Both hero targets now point to `#home-content`: the CTA and the hero's sr-only skip link (2 occurrences). The hero is `h-[calc(100svh-var(--nav-h))]`, the h1 is `{site.name}` and the pill is `{site.role}`. No `scroll-padding` exists anywhere.
- **Homepage spec:** the nav tests are scoped to `getByRole('navigation', { name: 'Primary' })` with the exact names Home, Photographs and Engineering. The title and stats tests are unchanged.
- **Shell spec (SHELL-01, SHELL-02, DSGN-08):** `e2e/shell.spec.ts` has 17 tests:
  - **Shell landmarks, per route (×7):** exactly one banner, Primary nav, `#main-content`, main and contentinfo, each checked with `toHaveCount(1)`. The nav is inside the banner and there is no nav in the footer. `aria-current="page"` is on the expected link only (Engineering on `/projects/clix-cli`, none on `/offline`). The footer hrefs equal `site.links.github`, `site.links.linkedin` and `mailto:` + `site.email`. The first Tab stop is the skip link, and Enter on it focuses `#main-content`.
  - **768x900, per route (×7):** after settling, the header is 64 px tall and there is no horizontal scroll.
  - **Shell mobile menu (×2) at 375x812:** the Menu button is at least 44 px and the rows at least 48 px. Escape after tabbing into the panel hides it, sets `aria-expanded=false` and returns focus to the button. Clicking Photographs navigates and the panel is hidden.
  - **Shell reduced motion (×1):** `header.getAnimations({ subtree: true })` is 0 after the menu opens.
  - The spec has no `.first()` on landmarks, no skip/only/fixme and no `@chromium-only` tag.

## Task Commits

1. **Task 1 (tracer): atomic mount**: `bb2a627` (feat), amended by Tim into `0c57f7f` with the 33 PNGs. Tracer gate: every `<verify>` is automated and `human_verify_mode` is end-of-phase, so the checks were re-run green and work continued.
2. **Task 2 (checkpoint:human-action, blocking-human): re-baseline**: Tim amended the 33 PNGs into `0c57f7f` and replied "pushed". There is no separate commit.
3. **Task 3 (auto, tdd): shell route-loop spec**: `fbdbd1d` (test).

`git rev-list --count 38c8b7e..HEAD` = 2, measured from the plan ledger. `origin/ci/07-22` = `fbdbd1d` (fast-forward push).

## Re-baseline (Task 2)

- `ci/07-22` was first pushed at `bb2a627` (a plain push, new branch). The "Update visual baselines" run 40021976701 succeeded. A blob compare shows 33 PNGs changed, all within home (reduced plus scroll-0/50/100 at 3 widths), photos, projects, clix-cli, clix-website, roadmap, contact and offline. not-found is byte-identical. The push CI run 40021977274 failed Visual (expected) and passed E2E, Unit, Lint+Type, Build and Security. Determinism: 66/66 pixel-identical.
- Review (sheets sent to Tim):
  - One 64 px sticky header with the "Tim Lui" wordmark.
  - Five links on one row at 768 (the current one has the accent bar), and the Menu button at 375.
  - Home shows the h1 "Tim Lui" and the pill "Developer & photographer". The hero is fully opaque at scroll-0, so the 07-21 regression stays fixed.
  - The plain identity footer. No v1 header or footer, no GlassmorphismNav and no doubled nav.
- After Tim's amend (`0c57f7f`, 13 code files + 33 PNGs), `check-snapshot-commit` with the 8 allowed slugs returned OK (33 changed). CI run 40028858703 passed Visual (job 120671787466), E2E (120671787442) and Unit (120671787231).

Page heights in px (old -> new). The v1 header (64/80 px) and tall v1 footer (about 950/650/480 px) were replaced by the 64 px sticky nav and the plain footer (322 px at 375, 246 px at 768 and 1440):

| Route | 375 | 768 | 1440 |
|-------|-----|-----|------|
| home | 5645 -> 5018 | 3909 -> 3506 | 3514 -> 3285 |
| photos | 2764 -> 2135 | 1820 -> 1399 | 1687 -> 1440 |
| projects | 2657 -> 2028 | 2241 -> 1820 | 1546 -> 1299 |
| clix-cli | 9219 -> 8590 | 6347 -> 5926 | 4965 -> 4718 |
| clix-website | 8345 -> 7716 | 5349 -> 4928 | 4281 -> 4034 |
| roadmap | 10445 -> 9816 | 6259 -> 5838 | 4835 -> 4588 |
| contact | 2943 -> 2314 | 2115 -> 1694 | 1921 -> 1674 |
| offline | 1915 -> 1286 | 1631 -> 1210 | 1457 -> 1210 |

The executor's Windows-measured prediction matched exactly on photos, projects, contact and offline, and on home, clix-website and roadmap at 1440. The remaining 26-108 px gaps come from text wrapping differently on Windows and Linux (checked visually).

The hero's ViewTimeline range shrank by 64 px (the hero is 836 px at a 900 px viewport and ends at the fold under the sticky nav). As a result, the scroll-50 and scroll-100 shots show the hero further faded at the same offset. This is expected.

## Files Created/Modified

- `app/(site)/layout.tsx`: route-group layout (new).
- `app/(site)/{page,error}.tsx` and `photos`, `projects`, `projects/[slug]`, `roadmap`, `contact`, `offline` pages: moved; Header/Footer removed. On Home, the anchor id changed and the orphaned `{/* Footer */}` comment was removed.
- `app/layout.tsx`: `MotionProvider` removed.
- `components/Hero3DMountain.tsx`: GlassmorphismNav removed, `#home-content` targets, hero height, `site.name` and `site.role`.
- `e2e/homepage.spec.ts`: scoped to the Primary nav.
- `e2e/shell.spec.ts`: new, 17 tests.
- `scripts/guards/palette-ratchet.json`: key renamed.
- `e2e/visual/routes.spec.ts-snapshots/**`: 33 PNGs.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] palette-ratchet.json key rename**
- **Found during:** Task 1.
- **Issue:** the 07-20 ratchet is keyed by file path, so moving `app/page.tsx` made the palette guard fail on a missing and a new entry. The plan's `files_modified` did not list the ratchet.
- **Fix:** `"app/page.tsx": 5` became `"app/(site)/page.tsx": 5`. It is a pure rename with the same count, briefed by the orchestrator. **Commit:** `0c57f7f`.

**2. [Cleanup] Orphaned `{/* Footer */}` comment removed on Home**
- The other pages keep `<>` fragments that are now redundant, so their diffs stay minimal. **Commit:** `0c57f7f`.

**3. [Rule 1 - Bug] No-horizontal-scroll assertion is `scrollWidth <= clientWidth`**
- **Issue:** the plan says `documentElement.scrollWidth equals innerWidth`. Because of the 07-12 `scrollbar-gutter: stable`, `innerWidth` includes the gutter, so the literal check fails even when nothing overflows.
- **Fix:** compare against `clientWidth`. **Commit:** `fbdbd1d`.

**4. [Rule 3] Settle helper copied into the shell spec**
- `e2e/visual/routes.spec.ts` keeps its settle helper local (it is not exported), so a copy lives in `e2e/shell.spec.ts`. **Commit:** `fbdbd1d`.

**5. [Rule 2] The Escape test tabs into the panel first**
- With focus already on the button, a focus-return assertion would pass even if focus never moved. Tabbing into the panel first makes the assertion meaningful. **Commit:** `fbdbd1d`.

**6. [Process] TDD test-after**
- The shell already existed when the spec was written, so every test was green on its first run ("unexpected GREEN" per tdd.md, which is expected for an e2e contract) and there is no RED commit. The spec can still fail: deviation 5 covers the Escape path, and the reduced-motion probe found 2 animations with motion allowed. The plan type is `execute`, so the gate is advisory.

**7. [Process] Root-pin guard re-run** after the spec was created (passed) and again before the commit.

---

**Total deviations:** 4 auto-fixed (1 blocking, 1 bug, 1 missing check, 1 helper copy), 1 cleanup, 2 process notes.
**Impact on plan:** none of them changes scope. URLs, the API location and proxy.ts are unchanged (T-07-30).

## Issues Encountered

- **Local cold dev server:** the homepage, contact-form, photos and projects specs ran 25/25. On the first cold compile of each route there were 4 transient failures. They did not reproduce on a warm server, under PW_PROD, or in CI.
- **Firefox locally:** the Playwright Firefox binary is not installed locally, so Firefox coverage comes from CI only (run 40030195076).
- **Stale comments:** `components/SafeCanvas.tsx:59`, `e2e/no-webgl.spec.ts:8` and `eslint.config.mjs:58` still name `app/error.tsx`. Plan 07-23 rewrites `error.tsx` and can update them.

### Full checks

| Check | Result |
|-------|--------|
| Per-page shells node check (Task 1) | `per-page shells removed` |
| `npm run type-check && npm run lint && npx jest --silent && npm run build` (Task 1) | type-check 0; lint 0 (palette OK, contrast OK, selftest 45/45); Jest 11 suites 97/97; build OK with the route list above |
| Homepage, contact-form, photos, projects specs on chromium (Task 1) | 25/25 (cold-compile flakes noted above) |
| Task 1 acceptance criteria | `app/(site)` holds 7 pages + error.tsx + layout.tsx; `app/page.tsx` not tracked; `<SiteChrome>` in layout; `home-content` 1 / `#home-content` 2; hero calc and `site.name` present; no `MotionProvider` in `app/layout.tsx`. PASS |
| Task 2 verification | check-snapshot-commit (8 slugs, --some) OK, 33 changed; CI run 40028858703 Visual + E2E + Unit PASS |
| `npx playwright test e2e/shell.spec.ts --project=chromium` (Task 3) | 17 passed in dev, 17 passed under PW_PROD (at least 10 required) |
| `npx jest --json ... && npm run guard:tests` (Task 3) | `jest 97 + e2e 89 = 186 (baseline 91)`, OK. `jest-results.json` is gitignored |
| lint / type-check after Task 3 | 0 / 0. The root tsconfig excludes `e2e`, so the spec was type-checked separately with a scratch tsconfig: 0 errors |
| CI run 40030195076 on `fbdbd1d` | E2E PASS (job 120676267671), 104 passed vs 70 before (+34 = 17 shell tests × chromium and firefox), none flaky; Visual, Unit, Lint and Type Check PASS |

## Findings

- **Home overflows horizontally before its v1 `whileInView` animations fire (pre-existing, Phase 9).** A "Programming Projects" card starts at `initial x: 50`, so before settling, `scrollWidth` is 399 at 375 px and 784 at 768 px. After settling the check passes. Visitors who have not scrolled yet do see the overflow. It is recorded as a STATE concern for the Phase 9 Home rebuild.
- **React "removeChild ... not a child" console error** appeared again in the dev-server logs. It is already a STATE concern from 07-19 (Phase 10), so nothing changed here.

## Known Stubs

None. The Home identity strings come from `data/site.ts`. The rest of Home (layout, motion, v1 styling) is interim on purpose until the Phase 9 rebuild.

## Threat Flags

None new.
- **T-07-30 (routing tampering):** mitigated. `app/api` stays at the root and `proxy.ts` is untouched. The build route list has unchanged URLs, and the contact-form e2e (CSRF path) passed locally and in CI.
- **T-07-SC:** no package installs.

## User Setup Required

None from this plan.

## Next Phase Readiness

- **07-23** (404 inside the shell, `(site)/error` and `global-error` with `retry()`): `app/(site)/error.tsx` is in place with its v1 content, and `SiteChrome variant="static"` is ready for global-error. Update the three stale `app/error.tsx` comments while there.
- **07-25:** SHELL-03 still needs the metadata, author and email copy and the forbidden-strings guard. The title test in `e2e/homepage.spec.ts` still expects `/Portfolio/i`.
- **Requirements:** SHELL-02 and DSGN-08 are Complete. SHELL-01 stays Pending until 07-23 and SHELL-03 until 07-25.

## Self-Check: PASSED

- `app/(site)/layout.tsx` and `e2e/shell.spec.ts` exist on disk, and `app/page.tsx` is not tracked.
- `0c57f7f` and `fbdbd1d` are ancestors of HEAD. `git rev-list --count 38c8b7e..HEAD` = 2.
- No source, test or PNG file changed during close-out.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-23*
