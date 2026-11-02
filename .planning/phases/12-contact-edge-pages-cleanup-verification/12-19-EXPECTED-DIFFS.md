# Phase 12 Plan 19: Round 2 expected diffs

Written and committed before the round-2 `visual-baselines` dispatch on `ci/12-19` (D-27, threat T-12-35). The commit that adds this file comes before the run id recorded in 12-19-SUMMARY.md. The SUMMARY copies this list verbatim under `## Round 2 expected diffs`. (The orchestrator holds SUMMARY.md until the plan completes, so the list is committed here first, as 12-11 did for round 1.)

Baseline under comparison: the tree after round 1 (`a046347`, roadmap re-baselined), unchanged since. 53 commits from `a046347` to `50be5e4`; none touches a PNG.

Sources: the round-2 sections of 12-12, 12-13, 12-15, 12-16 and 12-26 SUMMARYs; 12-18-SUMMARY for the carousel; the zero-pixel claims of 12-14, 12-17 and 12-25.

Snapshots: `e2e/visual/routes.spec.ts-snapshots/<slug>/<width>-<mode>-visual-dark-linux.png`, 48 files. Comparator threshold 0.01, so `update_mode=changed` captures every real change. visual-light compares against the same dark PNGs.

## Expected to change

| Slug | Width | File | Reason | Source plan |
|------|-------|------|--------|-------------|
| contact | 375 | `375-reduced` | Summit register replaces the v1 feedback form: new header band, form card, no gradient mesh (12-13); Direct contact panel above the form (12-16); helper-row counter `0 / 2,000` visible on the untouched form (12-26). Page height changes | 12-13, 12-16, 12-26 |
| contact | 768 | `768-reduced` | same | 12-13, 12-16, 12-26 |
| contact | 1440 | `1440-reduced` | same, with the Direct contact panel filling the right column | 12-13, 12-16, 12-26 |
| not-found | 375 | `375-reduced` | Marked-trail 404 in the edge layout: new kicker, h1, sentence and the edge art sheet; the page gets taller | 12-12 |
| not-found | 768 | `768-reduced` | same, taller | 12-12 |
| not-found | 1440 | `1440-reduced` | same | 12-12 |
| offline | 375 | `375-reduced` | Offline page in the edge layout: kicker, Tim's h1 and body, Try again, the contour sheet and "Saved on this device" (the empty sentence in a fresh context once Cache Storage is read); taller | 12-15 |
| offline | 768 | `768-reduced` | same, taller | 12-15 |
| offline | 1440 | `1440-reduced` | same | 12-15 |

Each of these nine is expected to differ. If one of them comes back byte-identical, that is reported as unexpected (the redesign did not render in CI), not passed.

## Expected unchanged (any diff here is a regression: stop, report, copy nothing)

| Slug | Files | Why no change is expected |
|------|-------|---------------------------|
| home | `{375,768,1440}-reduced`, `{375,768,1440}-ascent-{start,waypoint-2,summit}` (12) | No Home component changed since round 1. `lib/home-format.ts` was refactored (12-13 adds `formatEntryTime`/`formatCount`, 12-25 adds an optional `decimals` to `formatLatLon` defaulting to 4); the Home strings are pinned by `lib/__tests__/home-format.test.ts` and are unchanged |
| photos | `{375,768,1440}-reduced` | 12-14 adds per-slug OG image routes and head tags only, not rendered in the page body |
| photos-grid | `{375,768,1440}-reduced` | same |
| photos-carousel | `{375,768,1440}-reduced` | 12-18 rewrote `useProgressiveTextures` (3D path only); the shot is the reduced-motion stepper, which does not use the hook |
| photo | `{375,768,1440}-reduced` | 12-14 (OG route and head tags only) |
| lightbox | `{375,768,1440}` | no lightbox change |
| projects | `{375,768,1440}-reduced` | 12-14 (project OG route and head tags only) |
| box | `{375,768,1440}-reduced` | 12-14 (head tags only) |
| coin-flip | `{375,768,1440}-reduced` | same |
| roadmap | `{375,768,1440}-reduced` | re-baselined in round 1 at `a046347`; nothing since touches the route log (its `formatLatLon`/date helpers keep their default output) |

Also zero-pixel by their own summaries: 12-14 (OG head tags), 12-17 (e2e specs and a `@prod-only` Playwright tag only), 12-25 (identity URL guard and `Site.location`, rendered only on Contact). 12-16's `e2e/visual/hide-canvas.css` edit is comment-only. No PNG may be added or deleted.

Expected changed set: 9 PNGs (contact ×3, not-found ×3, offline ×3). Expected byte-identical: 39 PNGs.

## Local round-level gate (run before this file was committed, at 50be5e4)

- `npm run lint`: exit 0. `npm run type-check`: exit 0. `npx jest --silent`: 102 suites, 1647 tests passed.
- `PW_PROD=1 npx playwright test --project=chromium --project=firefox --project=webkit` (fresh build, Windows): 1250 passed, 28 failed, 0 flaky. Chromium and Firefox passed in full; all 28 failures are WebKit. `public/service-worker.js` restored afterwards.
- None of the 28 is in Phase 12 code, so per the plan they are recorded for 12-23 and do not stop the round:
  - Tab does not focus links in Playwright's WebKit on Windows (`toBeFocused()` after a Tab press), 19 tests: `shell.spec` Shell landmarks ×8 and Shell mobile menu (the 9 already recorded by 12-02, 12-12 and 12-15); `photos.spec` Map view Tab order and the 375 view switcher focus; `projects.spec` Tab reaches each panel title link; `photos-carousel.spec` stepper focus; `case-study.spec` Pause-resume focus; `home-ascent.spec` keyboard focus on a card; `photos-lightbox.spec` focus checks at :457, :539, :565, :670.
  - `page.goBack: Page crashed` in WebKit, 3 tests: `photos-lightbox.spec:353`, `photos-sweep.spec:289`, `photos.spec:501`.
  - Lightbox close via the router leaves the dialog in WebKit (`toHaveCount(0)` / timeout on Escape), 4 tests: `photos-lightbox.spec` :401, :411, :424, :651.
  - `photos-lightbox.spec:883` zoom centring off by more than 2 px; `demo-clip.spec:176` the failing-clip `error` event did not fire in WebKit.
