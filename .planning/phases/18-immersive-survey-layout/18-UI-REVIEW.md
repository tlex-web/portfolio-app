# Phase 18 — UI Review

**Audited:** 2026-11-26
**Baseline:** 18-UI-SPEC.md (approved 2026-11-24, with the 2026-11-25 and 2026-11-26 amendments)
**Screenshots:** not captured. This was a code, summary and test-evidence audit only. No production build or `next start` was run, and no dev server was probed. Visual and layout claims below rest on the pure-layout Jest sweeps and e2e results recorded in the SUMMARYs (18-29 gate: Jest 2802/2802, prod e2e Chromium + Firefox green, CI visual regression PASS on b6939ea). They were not re-observed.
**Interaction captures:** off (workflow.ui_interaction_capture is false). Interaction findings are code-derived.

Known and decided, recorded and not scored as defects: Zermatt overview plate takes the pinned diagonal place at sheet widths 560–719 (Tim: keep the fallback); photo page at 1440 is 855x583, not 912x622, because of the 18-17 breadcrumb row (accepted with the 18-20 baselines); Share is icon-only in the bar below 1024 and stays in the strip at 375; region-list thumbnails load eager with low fetch priority (18-22).

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Contract strings present and specific; the draft `/sources` and short-credit copy was not re-verified against Tim's D-20 sign-off, and no render was checked |
| 2. Visuals | 3/4 | Clear focal points and bespoke marks by construction; unverified in pixels, and the diagonal-plate fallback is a legible but off-contract layout at the two most-used widths |
| 3. Color | 4/4 | No hex or rgb literals in Phase 18 files; accent confined to the six declared uses |
| 4. Typography | 4/4 | Only `text-sm`, `text-base`, `text-heading` plus base h1; weights only `font-semibold` over the 400 default |
| 5. Spacing | 4/4 | Zero arbitrary px/rem spacing, no half steps, no `px-3` in the audited files |
| 6. Experience Design | 3/4 | Loading, error, empty and disabled states are specified and coded; photo-page LCP of 4128 ms is the weak spot, and WebKit-on-Windows focus and crash flakes are open |

**Overall: 21/24**

No pillar scored 1, so there is no BLOCKER. Everything below is a WARNING.

---

## Top 3 Priority Fixes

1. **Photo page LCP is 4128 ms (median of 5, `/photos/riffelsee-reflection`) against 1280 ms for the region page** — the photo page is the page visitors reach from a shared link, and it is over the 2.5 s "good" threshold by about 1.6 s. 18-29 recorded it as a baseline for the next phase, not as a fix. Fix: audit the photo page's stage image for `fetchPriority="high"`, a `sizes` that matches the 855 px stage, and whether the opener (low-res) layer is the LCP candidate. Set a budget before Phase 19 adds video to the region page.
2. **The overview `:has()` sync still emits the pattern WebKit fails to invalidate** — `syncRules` in `lib/photos/overview-layout.ts` (around line 924) uses `:is()` inside `:has()`, deferred in 18-14 as "for the plan that renders overviewCss". The plate page was fixed and the overview was not. Result: on Safari the region-list to map cross-highlight (UI-SPEC "Sync between list and map") may not update on hover or focus. State is shape plus fill, so it is not a WCAG failure, but it breaks the central overview interaction on one engine. Fix: emit one `:has()` per state, as 2325d0a did for the plate. Confirm with a WebKit run that the marker and rectangle recolour.
3. **Re-verify the diagonal-plate fallback and the compact tier visually before shipping** — the fallback at S 560–719 (Zermatt) and 560–587 (Ortler) covers the 768 and 1024 viewports, which are the most-used tablet and small-laptop widths. Only the Jest sweep and baselines guard it. Take 768 and 1024 `/photos` screenshots from the production build and confirm plate-to-marker association is obvious at a glance (the sweep pins the invariant "every other marker at least 16 px farther", which is geometry, not legibility).

Minor: re-confirm that Tim signed off the `/sources` intro, Sheet titles and short credits (all marked draft in the contract); confirm the five Windows-WebKit-only region e2e rows and the Hotspots D-22 row (deferred-items.md) are not masking a real Tab-focus defect on Safari.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

- Strings in code match the Copywriting Contract where checked: `ShareButton.tsx:31` `FAILED_STATUS = "Couldn't copy the link. It's selected below."` matches the contract verbatim; the status region is `role="status" aria-live="polite"` (`ShareButton.tsx:235`); `Breadcrumb.tsx:28` names the nav `Breadcrumb`.
- No generic "Submit", "Click here" or "OK" labels in `components/photos/**` (grep over the new components returned none beyond the contract's own labels).
- Share exposes an `aria-label` in both modes (`ShareButton.tsx:225`), so the icon-only bar button keeps a name that begins with its visible words.
- Not verified: the contract marks the `/sources` intro, the Ortler and Saalfelden sheet titles and every short credit as draft pending Tim's D-20 checkpoint. I did not find proof of that sign-off in the files read. This is the reason for 3, not 4. The 18-29 summary says the phase passes all gates but does not name the copy checkpoint.
- Not verified in a render: the exact kicker `3 regions · 11 photographs · 2016–2026` and the live-region strings (derived by formatters, covered by Jest).

### Pillar 2: Visuals (3/4)

- Clear focal point per surface by structure: the overview sheet is the largest block, the region page's 16:9 header slot is above the fold, the viewer keeps its stage. Heading outline in the spec has no level skips.
- Marks are bespoke elements, not icons (overview marker `size-6 rounded-full`, `OverviewSheet.tsx:35`; label plate `h-12 w-36 ... ring-1 ring-inset`, `OverviewSheet.tsx:43`), matching the 24 px badge and the 48 px plate box in the contract.
- Icon-only controls are named: Share carries `aria-label`; markers are `aria-hidden` with `tabIndex=-1` and the list carries the keyboard path.
- Weakness: the decided fallback (diagonal Zermatt plate at 560–719) is accepted, but there is no screenshot evidence in this audit that it reads cleanly. Also, I could not confirm the Ortler portrait cover pillarbox in the 16:9 header slot.
- The five-tier layout function plus count guards are strong protection against overlap regressions; the remaining risk is perceptual, which a sweep does not check.

### Pillar 3: Color (4/4)

- `git grep` for hex or `rgb(` in `components/photos`, the sources route and the photos route (tests excluded): 0 matches.
- Accent usage in non-test Phase 18 components: `Hotspots.tsx` 1, `OverviewSheet.tsx` 1, `RegionList.tsx` 2, `RegionRail.tsx` 1. That is the six reserved uses only: active marker fill, row bar, badge, rail marker (`h-0.5 w-6 bg-accent`, `RegionRail.tsx:136`).
- `bg-trail` appears only in `NextRegion.tsx`, the declared new use with a test pinning that it is absent when there is no next region.
- Observation (not a defect): `Hotspots.tsx:106` uses `bg-accent text-ink-inverse` for the active hotspot, which is a pre-Phase-18 use already in the 10 list.

### Pillar 4: Typography (4/4)

- Size distribution across `components/photos`, the footer, `/sources` and the photos routes: `text-sm` 46, `text-base` 16, `text-heading` 3. No `text-xs`, `text-lg`, `text-xl` or `text-2xl`. Display size is the base h1, as specified.
- Weights: `font-semibold` 20, no `font-bold`, `font-medium` or `font-light`. Matches "four sizes, two weights".
- Mono is used for data lines and badge numbers in the files read (`font-mono text-sm ... tabular-nums`, `OverviewSheet.tsx:35`).

### Pillar 5: Spacing (4/4)

- Arbitrary spacing grep (`p/m/gap-[Npx|rem]`, `.5` half steps, `px-3`) over non-test Phase 18 files: 0 matches.
- Strokes and bars use `h-0.5`, `w-0.5` as the contract's 2 px exceptions (`RegionList.tsx:33`, `RegionRail.tsx:136`). Negative margins `-mx-2` match the row spec.
- Touch targets: 31 uses of `min-h-11`, `min-w-11`, `min-w-42` and `size-6` across `components/photos`; `PlateKey.tsx:13` has `min-h-11 ... gap-2`, as specified.

### Pillar 6: Experience Design (3/4)

- States covered by design and code: stage load error with Retry and focus kept (`StagePhoto.tsx:43`, `:94`, `:109`); Share copy-failure fallback with selected URL and polite status; end-card `aria-disabled` Next and Zoom; empty regions fail the build instead of rendering empty; interaction colour transitions use `--duration-fast`, with no motion beyond colour in the overview.
- No destructive actions, so no confirmation needed. Reduced motion handled by the contract (no Motion code added).
- Risk 1: PHOTO-LCP baseline 4128 ms on the photo page (18-29 summary line 19 and 159). Region page 1280 ms is fine.
- Risk 2: the overview's WebKit `:has()` sync was deferred (`deferred-items.md`, 18-14). Check whether it was ultimately fixed in a later plan; I found no resolution in the greps I ran.
- Risk 3: open Windows-WebKit-only e2e failures (five 18-10 region rows at a Tab onto a link, a Hotspots D-22 row, a soft-navigation crash in 18-16) are recorded as local-engine issues. They could indicate a genuine Safari focus problem; they are unproven either way.
- Risk 4: the Firefox `/offline` audit flake is unrelated to Phase 18 UI.
- Registry audit: not applicable (no `components.json`).

---

## Files Audited

- `.planning/phases/18-immersive-survey-layout/18-UI-SPEC.md` (lines 1–628 of 780), `18-29-SUMMARY.md`, `deferred-items.md`, other SUMMARY files by grep
- `components/photos/ShareButton.tsx`, `Breadcrumb.tsx`, `EndCard.tsx`, `StagePhoto.tsx`, `Hotspots.tsx`
- `components/photos/overview/OverviewSheet.tsx`, `RegionList.tsx`, `OverviewHeader.tsx`
- `components/photos/region/NextRegion.tsx`, `PlateKey.tsx`, `RegionRail.tsx`, `SequenceFigure.tsx`
- Class-level greps across `components/photos`, `components/site/SiteFooter.tsx`, `app/(site)/sources`, `app/(site)/photos`

---

## Orchestrator verification notes (2026-11-26)

Added by the execute-phase orchestrator after checking the review's open risks against the repository; the auditor's scores are left as written.

- **No screenshots were taken in this audit.** The auditor's first shell call was denied by the auto-mode classifier, so the review is code-, summary- and test-evidence-based. Pixel evidence for every Phase 18 route exists elsewhere: Tim reviewed and committed the D-24 baselines in five rounds (48963a9, c24568d, 8944359, e0c8e3a, fc16583), and CI Visual Regression passed 140/140 on the phase tip (run 45879391203, `ci/18-29`).
- **Top fix 2 / Risk 2 (overview `:has()` sync on WebKit) is already resolved.** `syncRules` emits one `:has()` per state (`lib/photos/overview-layout.ts:1201-1205`: `:has(row:hover)`, `:has(row:focus-visible)`, `:has(marker:hover)`); the `:is()` text at lines 1189-1193 is the explanatory comment. `deferred-items.md` records "Resolved in 18-23 (2026-11-26, f2fc609)", with a unit pin and e2e hover/focus rows that ran green in CI's Linux WebKit.
- **Top fix 3 (fallback plates at 768/1024) was reviewed by Tim.** He saw the local screenshots of the placement fix and chose "Keep the fallback (Recommended)" before 18-28, then reviewed and committed the CI-rendered `photos/*` baselines (fc16583), which include the 768 fallback.
- **D-20 copy sign-off exists.** 18-03-SUMMARY records Tim's reply "approve-G1 (Recommended)" (2026-11-25) for every proposed final string, the licence reading and the GLO-90 placement.
- **Risk 3 (Windows-WebKit-only rows).** The five 18-10 rows carry `@needs-tab-to-links` (added in 18-15) and the Hotspots D-22 row carries `@no-win-webkit` (Tim's choice, 4a82db7); both tags drop the rows only on local Windows WebKit, and CI's Linux WebKit runs and passes them.
- **Top fix 1 (photo-page LCP 4,128 ms)** stands as a valid observation: PHOTO-LCP is record-only by design in Phase 18 (first baseline from perf dispatch 45882211560); a budget is a candidate for a later phase.
