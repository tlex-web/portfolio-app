---
phase: 07-foundation-guardrails
plan: 19
subsystem: ui
tags: [tokens-v2, semantic-tokens, stock-palette, photos, offline, error, not-found, visual-regression, re-baseline, dsgn-06, guard-04, build-step-8c]

requires:
  - phase: 07-18
    provides: "The 8c map pattern (one route group per commit, mapping and re-baseline in the same reviewed commit), the neutral-band / one-accent-primary treatment and the text-ink-inverse-on-accent rule"
  - phase: 07-15
    provides: "One colour value per property in every class string (dark: pairs collapsed), so the mapping is one-to-one"
  - phase: 07-09
    provides: "The L2 semantic utilities (surface*, ink*, line*, accent*, success, caution, danger) via @theme inline --color-* tokens"
provides:
  - "Photos and edge pages group (app/photos/page.tsx, PhotosPageClient, GalleryGrid, ImageDetailModal, InteractiveHotspot, PhotoCarousel3D, app/offline/page.tsx, app/error.tsx, app/not-found.tsx) on L2 semantic utilities only: stock palette count 87 -> 0; white/black utilities 56 -> 10, all deliberate black scrims/frames and the carousel white hover"
  - "Stock palette count 0 across the whole scan set (app, components, lib, data, e2e, including app/api/__tests__, components/__tests__, lib/__tests__); the 87 left at b1ea33d were all in this group, so no file outside the four 8c groups needed mapping. 07-20 can enable the palette guard"
  - "photos/*, offline/* and not-found/* {375,768,1440}-reduced-visual-dark-linux.png re-baselined inside the mapping commit baffad8; every other snapshot unchanged"
affects: [07-20, 07-22, 07-23, 10, 12]

actuals:
  tokens: 8075    # chars/4 over `git diff b1ea33d..baffad8 -- app components` (32299 chars, 9 files, 91+/91-); the 9 PNGs are binary and not counted
  tasks: 2
  commits: 1      # measured: git rev-list --count b1ea33d..HEAD = 1 (baffad8), before the docs commits
plan_head_before: b1ea33db3565c6b0f5e1e858901209a1a8f1a8d5
plan_head_after: baffad83532907d7dfb009c982de97aeab75ab06

tech-stack:
  added: []
  patterns:
    - "Staged dark: removal, stage 3 (map), last group: one route group per commit, mapping and re-baseline in the same reviewed commit"
    - "Scrims over photos and canvas stay black (bg-black, bg-black/60..80, from-black/60); text on them is text-ink or text-accent at full opacity"
    - "Solid accent markers (bg-accent text-ink-inverse) for interactive photo hotspots; their labels and info card are neutral surfaces with border-line-strong"

key-files:
  created: []
  modified:
    - app/photos/page.tsx
    - components/PhotosPageClient.tsx
    - components/GalleryGrid.tsx
    - components/ImageDetailModal.tsx
    - components/InteractiveHotspot.tsx
    - components/PhotoCarousel3D.tsx
    - app/offline/page.tsx
    - app/error.tsx
    - app/not-found.tsx
    - e2e/visual/routes.spec.ts-snapshots/photos/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/photos/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/photos/1440-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/offline/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/offline/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/offline/1440-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/not-found/375-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/not-found/768-reduced-visual-dark-linux.png
    - e2e/visual/routes.spec.ts-snapshots/not-found/1440-reduced-visual-dark-linux.png

key-decisions:
  - "Photos and edge pages mapped to semantic tokens in baffad8 (group stock count 87 -> 0, whole scan set 0); the 9 photos/offline/not-found visual-dark PNGs re-baselined in the same commit; CI run 40007564121 green (Visual, Unit, E2E)"
  - "Tim's D1-D7, answered 'All recommended': D1 = A photos hero + view-toggle strip as one neutral bg-surface-raised band with border-t/border-b border-line, accent active segment; D2 = B neutral outlined 'N hotspots' badge; D3 = A black scrims over photos/canvas kept, text on them text-ink/text-accent; D4 = A solid accent hotspot markers, neutral hover label; D5 = A solid bg-surface hotspot info card, neutral icon tile; D6 = A neutral carousel pill, bg-black frame kept; D7 i-A offline box border-2 border-line-strong, ii-A icon text-ink-muted; recorded in the baffad8 body"
  - "Page height: photos +2px at every width from the D1 band hairlines; offline and not-found unchanged; not a layout regression"
  - "DSGN-06 and GUARD-04 stay Pending: requirements.ready-ids reports both blocked, because 07-20 also declares them and has no SUMMARY yet"

patterns-established:
  - "A black scrim or frame over photographic or canvas content is a deliberate white/black utility, recorded by the 07-20 ratchet; it is not mapped to a surface token"
  - "Tailwind 4 has no bg-opacity-*: a v3 bg-opacity class is dead and the element renders fully opaque; use a /NN modifier when translucency is wanted"

# Copied verbatim from the PLAN's `requirements`. DSGN-06 and GUARD-04 are NOT flipped in REQUIREMENTS.md:
# requirements.ready-ids reports both blocked (07-20 also declares them and has no SUMMARY yet).
requirements-completed: [DSGN-06, GUARD-04]

coverage:
  - id: D1
    description: "Every stock Tailwind palette class in the Photos and edge pages group is replaced by an L2 semantic utility (count 0)"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "Task 1 <verify> stock-palette grep over the 9 group files | wc -l = 0 (87 at b1ea33d; close-out re-run)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No v1 alias, raw OKLCH, hex, rgba() or arbitrary colour value introduced by the mapping"
    requirement: DSGN-06
    verification:
      - kind: other
        ref: "git show baffad8 -- app components: added lines matching (alpine|granite|snow|frost|ember|pine|rust)-[0-9] | #hex | oklch( | rgba?( | (bg|text|border)-[ = 0 hits (close-out re-run); v1 alias one-liner 'v1 alias count not increased 1 -> 1' (Task 1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Stock palette count is 0 across app/, components/, lib/, data/, e2e/ and every __tests__ directory"
    requirement: GUARD-04
    verification:
      - kind: other
        ref: "Task 1 <verify> second grep, grep -r app components lib data e2e --include=*.ts/*.tsx/*.js/*.mjs | wc -l = 0 (close-out re-run). The __tests__ directories (app/api/__tests__, components/__tests__, lib/__tests__) sit inside app/components/lib and are covered. The same grep over b1ea33d (git grep) = 87, equal to the group count, so no file outside the four 8c groups held a stock class"
        status: pass
    human_judgment: false
  - id: D4
    description: "The mapping is its own commit, photos/*, offline/* and not-found/* are re-baselined in it with the reason stated, and no other snapshot changes"
    requirement: GUARD-04
    verification:
      - kind: other
        ref: "check-snapshot-commit.mjs --sha HEAD --allow photos --allow offline --allow not-found --some -> 'snapshot-commit: OK (9 changed)', exit 0; git show --name-status baffad8: 9 source M + 9 PNG M, 0 A, 0 D (close-out re-run)"
        status: pass
      - kind: automated_ui
        ref: "check-visual-run.mjs --sha baffad83532907d7dfb009c982de97aeab75ab06 --wait 1 -> PASS https://github.com/tlex-web/portfolio-app/actions/runs/40007564121/job/120599269123, exit 0 (close-out re-run)"
        status: pass
      - kind: unit
        ref: "npx jest --silent 9/9 suites, 82/82; npx playwright test e2e/photos.spec.ts --project=chromium 6 passed (Task 1); CI Unit Tests PASS .../runs/40007564121/job/120599268959, E2E Tests PASS .../job/120599269230"
        status: pass
    human_judgment: true   # Tim reviewed the three crop sheets (photos, offline, not-found) and the height change before the amend (Task 2)

duration: about 24 min by commit timestamps (07-18 close-out b1ea33d 18:33:58Z to the amended commit 18:57:29Z), plus 1 baseline run and 2 CI runs; push CI on baffad8 finished 19:04:44Z
completed: 2026-10-23
status: complete
---

# Phase 7 Plan 19: Photos and edge pages mapped from stock palette to semantic tokens (build step 8c, last group)

**Commit `baffad8` replaces the last 87 stock palette classes in the codebase. They sat in the Photos group (`app/photos/page.tsx`, `PhotosPageClient`, `GalleryGrid`, `ImageDetailModal`, `InteractiveHotspot`, `PhotoCarousel3D`) and the edge pages (`offline`, `error`, `not-found`), and now use L2 semantic utilities per Tim's choices D1-D7. The stock count is 0 across app, components, lib, data, e2e and every `__tests__` directory, so 07-20 can enable the palette guard. The 9 `photos/*`, `offline/*` and `not-found/*` dark shots are re-baselined in the same commit. CI run 40007564121 on `ci/07-19` passes Visual, Unit and E2E.**

## Performance

- **Duration:** about 24 min by commit timestamps (`b1ea33d` 18:33:58Z, task commit `7e555be` authored 18:44:18Z, amend `baffad8` committed 18:57:29Z). The baseline run 40005878881 finished at 18:49:45Z and the push CI run 40007564121 at 19:04:44Z.
- **Tasks:** 2/2
- **Files modified:** 18 (9 source, 9 PNG)

## Accomplishments
- **Mapping (DSGN-06, 8c Photos + edge pages):** group stock count 87 -> 0 (photos page 5, PhotosPageClient 4, GalleryGrid 18, ImageDetailModal 13, InteractiveHotspot 20, PhotoCarousel3D 2, offline 16, error 5, not-found 4). No v1 alias, hex, oklch, rgba or arbitrary colour added.
- **Whole scan set at 0 (prepares GUARD-04):** the plan's second grep over app, components, lib, data and e2e (`.ts/.tsx/.js/.mjs`; `app/api/__tests__`, `components/__tests__` and `lib/__tests__` included) prints 0. At `b1ea33d` the same grep gave 87, all in this group, so the "map any leftover outside the four groups" step found nothing.
- **White/black utilities 56 -> 10**, each deliberate: GalleryGrid `from-black/60` caption scrim; ImageDetailModal `bg-black` backdrop and `bg-black/60` zoom pill; InteractiveHotspot `bg-black/70` backdrop; PhotoCarousel3D `bg-black/80` x2 and `hover:bg-white/10` x2; PhotosPageClient `bg-black` x2 (carousel frame and loader). The 07-20 ratchet records them; photos page, offline, error and not-found are at 0.
- **Photos band (D1 = A):** hero and view-toggle strip are one `bg-surface-raised` band with `border-t` / `border-b border-line`, `text-ink` / `text-ink-muted`. The segmented track is `bg-surface-overlay`; the active segment is `bg-accent text-ink-inverse`, inactive `text-ink hover:text-accent`.
- **Hotspots (D2 = B, D4 = A, D5 = A):** the "N hotspots" badge is a neutral outlined pill (`bg-surface-raised text-ink border-line-strong`, blur dropped). Markers are solid `bg-accent text-ink-inverse` with `border-2 border-ink` and an accent pulse; the hover label is neutral. The info card is solid `bg-surface border-line-strong` (alpha and blur dropped) with a `bg-surface-overlay` icon tile and `text-ink-muted` icon.
- **Scrims and carousel (D3 = A, D6 = A):** black scrims over photos and the 3D canvas stay; text on them is `text-ink` / `text-accent` at full opacity. The carousel instruction pill is `bg-surface-raised text-ink border-line-strong`; the `bg-black` frame and loader stay.
- **Edge pages (D7 i-A / ii-A):** the offline info box is `bg-surface-raised border-2 border-line-strong` with `text-ink` body and a `text-ink-muted` decorative icon; Try Again is the one accent button. not-found's Go Back Home is `bg-accent text-ink-inverse`. error.tsx mapped the same way.
- **Re-baseline:** Tim amended `photos/*`, `offline/*` and `not-found/*` {375,768,1440}-reduced-visual-dark-linux.png into `baffad8`. The commit body states the reason and Tim's choices.

## Task Commits

1. **Task 1 (tracer): Map the Photos and edge pages group from stock palette to semantic tokens** - `baffad8` (refactor). The pre-amend commit `7e555be` had the same source change without PNGs.
2. **Task 2: Re-baseline the Photos and edge pages snapshots and confirm CI green** (checkpoint:human-action, blocking-human). `ci/07-19` was first pushed at `7e555be` (plain push, new branch). The "Update visual baselines" run 40005878881 (update_mode changed) succeeded; against HEAD only photos/*, offline/* and not-found/* differed (9 PNGs). The push CI run 40005879420 on `7e555be` failed only Visual Regression, on those 3 slugs, as expected before the re-baseline; Unit, E2E, Lint + Type, Build and Security passed. Tim amended the 9 PNGs (`baffad8`), pushed and replied "pushged" (typo for "pushed"; the amend is on HEAD and on `origin/ci/07-19`). Push CI run 40007564121 was green. No separate commit.

`git rev-list --count b1ea33d..HEAD` = 1, measured from the plan ledger.

**Plan metadata:** the docs commit that follows this SUMMARY.

## Files Created/Modified
- `app/photos/page.tsx` - hero mapped into the neutral band (D1).
- `components/PhotosPageClient.tsx` - toggle strip and segmented control (D1); `bg-black` carousel frame and loader kept (D6).
- `components/GalleryGrid.tsx` - tiles, hotspot badge (D2), caption text on the black scrim (D3); "Click to explore" `text-cyan-300` -> `text-accent`.
- `components/ImageDetailModal.tsx` - close button and image well `bg-gray-900` -> `bg-surface`; text on the black backdrop `text-ink`.
- `components/InteractiveHotspot.tsx` - markers, hover label, info card, icon tile (D4, D5).
- `components/PhotoCarousel3D.tsx` - instruction pill (D6); tooltip and control bar `text-white` -> `text-ink`.
- `app/offline/page.tsx` - info box, icon, body text, Try Again (D7).
- `app/error.tsx`, `app/not-found.tsx` - mapped now for the 07-20 guard; rewritten later in 07-22/07-23.
- `e2e/visual/routes.spec.ts-snapshots/{photos,offline,not-found}/{375,768,1440}-reduced-visual-dark-linux.png` - re-baselined.

## Decisions Made
- **D1-D7 are Tim's choices.** He answered the batched Task 1 decision checkpoint in this session with "All recommended": D1 A, D2 B, D3 A, D4 A, D5 A, D6 A, D7 i-A / ii-A. The `baffad8` body records them.
- **Contrast basis** (survey of the globals.css OKLCH values). Pre-existing failures this plan fixes: white on the cyan-500 hotspot badge 2.36:1, white on the cyan-600 3D pill 3.60:1, the gray-600 offline icon 2.35:1 and the offline box border 2.01:1. The `offline:61` small text from the 07-14 concern is now `text-ink-muted`. Mapped pairs: `text-ink-inverse` on accent 11.29:1 and on accent-hover 13.62:1; `text-ink` on `surface-raised` 15.02:1; `text-ink-muted` on `surface` 8.92:1; `line-strong` on `surface` / `surface-raised` 4.85 / 4.54:1; accent on black 12.40:1.
- **DSGN-06 and GUARD-04 stay Pending.** `requirements.ready-ids 07-19-PLAN.md` returns `ready: [], blocked: [DSGN-06, GUARD-04]`: 07-20 also declares both and has no SUMMARY. `requirements-completed` copies the plan's `requirements` verbatim; REQUIREMENTS.md is unchanged.

## Deviations from Plan

None in the delivered result: group and whole-scan stock count 0, only photos/*, offline/* and not-found/* re-baselined, tests unmodified, CI green. Applications beyond the mapping table, consistent with D3:
- **GalleryGrid:** "Click to explore" `text-cyan-300` -> `text-accent`. The tiles lost `focus:outline-none focus:ring-2 focus:ring-blue-500`, so the global `:focus-visible` ring applies (07-16 precedent).
- **PhotoCarousel3D:** tooltip and control-bar `text-white` -> `text-ink`.
- **ImageDetailModal:** close button and image well `bg-gray-900` -> `bg-surface`.
- **app/error.tsx:** the Go to Homepage button had no text-colour class; none was added.
- **Blur dropped** on the hotspot badge, hover label, info card and carousel pill. Those elements are now opaque, so the blur had no visual effect.

## Issues Encountered
- **Page height changed, not only colour:** photos 1440 1685 -> 1687, 768 1818 -> 1820, 375 2762 -> 2764 px. The shift starts at the D1 band and is constant below it: its `border-t` + `border-b` hairlines add 2px. offline and not-found are unchanged (0px), as predicted before the run. The D2 badge border adds 2px to an absolutely positioned badge, so page height does not change. Tim reviewed it before the amend. It is not a regression.
- **Determinism:** the CI actual images are pixel-identical to the baseline-run PNGs for all 18 shots (3 slugs x 3 widths x dark/light).
- **Dead `bg-opacity-*` classes (pre-existing):** `components/ImageDetailModal.tsx` L46 (`bg-black bg-opacity-90`) and L60 (`bg-surface bg-opacity-50 hover:bg-opacity-75`) use Tailwind v3 classes that Tailwind 4.3 does not generate. The modal backdrop and close button already render fully opaque. Left as is (class-mapping only); Phase 10 (photos/lightbox rework) should use `/NN` modifiers if translucency is wanted.
- **Inline colours left (out of scope, UI-SPEC v2-only rule):** `components/PhotoCarousel3D.tsx` Three.js values L75 `#1f2937`, L215 `#0a0a0a`, L264 `#06b6d4`, L265 `#8b5cf6`, L268 fog `#0a0a0a`. The class grep does not see them.
- **v1 alias left:** `components/PhotoCarousel3D.tsx` L183 `text-snow-200` (count 1 -> 1). The plan maps only stock classes; the alias goes when the v1 layer is removed (Phase 12).
- **Unverified console error:** during the local `e2e/photos.spec.ts` run the dev server logged three deprecation warnings and a React "removeChild ... not a child" console error on the grid/3D toggle. The tests pass. Class-string edits cannot cause a DOM removal error, so it very likely predates this plan, but it was not checked at `HEAD~1`, and CI E2E logs do not capture the browser console. Recorded as a STATE concern for Phase 10.
- **Lint:** `npm run lint` exit 0 (0 errors, 54 pre-existing react-hooks warnings; guard:parity OK; selftest 25/25). `npm run type-check` exit 0.

## Known Stubs
None.

## Threat Flags
None new.
- **T-07-25 (Photo modal and edge pages):** accepted as planned. Class-only edits, reviewed in the re-baseline; `e2e/photos.spec.ts` passes (6).
- **T-07-SC (npm installs):** no packages were installed.

## User Setup Required
None new from this plan. The two 07-USER-SETUP.md items are still open with Tim (Vercel build log Node 24.x / `npm ci`; required status checks on `main`).

## Next Phase Readiness
- **Ready for 07-20** (8d "remove + enable": delete `@custom-variant dark`, palette guard and white/black ratchet, contrast check via colorjs.io). The stock count is 0 everywhere, so the guard can start at 0. The ratchet starts at 10 white/black utilities in this group (listed above) and 0 in Contact, Roadmap and Projects.
- **Pushing:** `baffad8` is on `origin/ci/07-19`. The docs commits stay local.

## Verification (close-out, 2026-10-23)

| Check | Result |
|-------|--------|
| `check-visual-run.mjs --sha baffad83532907d7dfb009c982de97aeab75ab06 --wait 1` | `PASS https://github.com/tlex-web/portfolio-app/actions/runs/40007564121/job/120599269123`, exit 0 |
| `check-visual-run.mjs --sha baffad8… --job "Unit Tests" --wait 1` | `PASS …/runs/40007564121/job/120599268959`, exit 0 |
| `check-visual-run.mjs --sha baffad8… --job "E2E Tests" --wait 1` | `PASS …/runs/40007564121/job/120599269230`, exit 0 |
| `check-snapshot-commit.mjs --sha HEAD --allow photos --allow offline --allow not-found --some` | `snapshot-commit: OK (9 changed)`, exit 0 |
| `git show --name-status baffad8` | 18 M (9 source, 9 PNG), 0 A, 0 D |
| Task 1 stock-palette grep, group | 0 (87 at `b1ea33d`) |
| Task 1 stock-palette grep, whole scan set (incl. all `__tests__`) | 0 (87 at `b1ea33d`, all in this group) |
| white/black utilities in the 9 files | 10 (56 at `b1ea33d`), all listed above |
| v1 alias / hex / oklch / rgba / arbitrary colour in added lines | 0 |
| `requirements.ready-ids 07-19-PLAN.md DSGN-06 GUARD-04` | ready [], blocked [DSGN-06, GUARD-04] |

## Self-Check: PASSED
- `baffad8` is an ancestor of HEAD; `git rev-list --count b1ea33d..HEAD` = 1 from the plan ledger.
- All 18 modified files exist and are within the plan's `files_modified` (9 source files + `photos/**`, `offline/**`, `not-found/**`).
- Task 1 automated stock greps and Task 2 acceptance commands re-run at close-out and pass.

---
*Phase: 07-foundation-guardrails*
*Completed: 2026-10-23*
