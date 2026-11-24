---
phase: 17-region-routes-seo-structured-data
plan: 12
subsystem: ui
tags: [nextjs, react, photo-viewer, lightbox, url-parsing, jest, playwright]

requires:
  - phase: 17-region-routes-seo-structured-data
    provides: 17-06 PhotoViewer D-08/D-09 (the viewer this plan edits); 17-05 the v2.0 identity harness and base; 17-16 the D-03 reserved-segment test in regions.test.ts
provides:
  - RESERVED_PHOTO_SEGMENTS ('regions') in lib/photos/stepping.ts, applied in slugFromPath after one guarded decode
  - slugFromPath as the only photo-path parser in client code; LightboxDialog uses it for the shown slug, close() and onClose
  - lib/dom/editable.ts exporting isEditable, used by PhotoViewer and ZoomStage
  - a one-definition source scan for photo-path regexes in lib/__tests__/photos-stepping.test.ts
affects: [17-13, 17-15, 18]

actuals:
  tokens: 1487     # chars/4 over the added lines of d3abc54..2762130
  tasks: 2
  commits: 3       # MEASURED: git rev-list --count d3abc54..HEAD at SUMMARY write
plan_head_before: d3abc5435adb1205cd642beede6490cddafd99e7
plan_head_after: 2762130e8773cf24580c3f885a101307fd687138

tech-stack:
  added: []
  patterns:
    - "Photo URLs are read only through slugFromPath; a static segment under /photos goes in RESERVED_PHOTO_SEGMENTS, never in a caller's own regex"
    - "Small DOM helpers shared by client components live in lib/dom/ (pure, import-free)"

key-files:
  created:
    - lib/dom/editable.ts
  modified:
    - lib/photos/stepping.ts
    - components/photos/LightboxDialog.tsx
    - components/photos/PhotoViewer.tsx
    - components/photos/ZoomStage.tsx
    - lib/__tests__/photos-stepping.test.ts

key-decisions:
  - "17-12 D-24: the reserved check runs on the decoded segment, so /photos/%72egions is null like /photos/regions; matching stays exact and case-sensitive (/photos/Regions is still read as the slug 'Regions')"
  - "17-12 D-24: the one-parser scan matches `const NAME = /^\\/photos\\/` definitions (exported, typed or not) over app/, components/ and lib/; proxy.ts's REGION_PATH and DETAIL_PATH sit outside that walk or do not match, and stay as they are"

patterns-established:
  - "A one-definition gate for a shared helper: a source scan in the helper's own test, with a self-test of the pattern on good and bad snippets"

requirements-completed: [REGION-07]

coverage:
  - id: D1
    description: "slugFromPath returns null for /photos/regions, /photos/regions/<id>, /photos/regions/<id>/x and /photos/%E0, and the slug for /photos/<slug>; it decodes once and never throws"
    requirement: REGION-07
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-stepping.test.ts#slugFromPath"
        status: pass
    human_judgment: false
  - id: D2
    description: "LightboxDialog has no regex or decoder of its own and reads the shown slug, close() and onClose through slugFromPath; a source scan finds exactly one photo-path regex definition, in lib/photos/stepping.ts"
    requirement: REGION-07
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-stepping.test.ts#one photo-path parser (17 D-24)"
        status: pass
      - kind: unit
        ref: "components/photos/__tests__/lightbox-dialog.test.tsx"
        status: pass
      - kind: other
        ref: "git grep -c PHOTO_PATH -- components/photos/LightboxDialog.tsx -> 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "One isEditable, in lib/dom/editable.ts, used by PhotoViewer and ZoomStage; neither defines its own"
    verification:
      - kind: other
        ref: "git grep --untracked -l 'function isEditable' -- app components lib -> 1 file (lib/dom/editable.ts)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The lightbox, region and keyboard behaviour is unchanged in the browser (arrows, Escape and Back, in and out of text fields)"
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts e2e/photos-region.spec.ts e2e/keyboard.spec.ts --project=chromium --project=firefox -> 178 passed"
        status: pass
    human_judgment: false
  - id: D5
    description: "The v2.0 four are identical to the phase base on all 36 compared fields after this plan"
    verification:
      - kind: other
        ref: "node v20-identity.mjs http://localhost:3017 v20-base.json -> exit=0 differing=0 compared=36 head=2762130e8773"
        status: pass
    human_judgment: false
  - id: D6
    description: "Client JS 1,851,755 B in 24 files, within the 1,855,781 B cap"
    verification:
      - kind: other
        ref: "rm -rf .next/static && npm run build; byte-sum one-liner (exit 0)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-11-24
status: complete
---

# Phase 17 Plan 12: One Photo-Path Parser and One isEditable Summary

**`slugFromPath` is now the only photo-path parser in client code. It decodes the segment once, returns null on a malformed escape, and returns null for the reserved `regions` segment, so no client code reads `/photos/regions` as a photo. LightboxDialog's private regex and its unguarded decoder are gone. `isEditable` lives once, in `lib/dom/editable.ts`, and PhotoViewer and ZoomStage import it. The v2.0 four are identical to the phase base on 36 of 36 fields. Client JS is 1,851,755 B.**

## Performance

- **Duration:** about 12 min (by `date`)
- **Started:** 2026-11-24T00:35Z
- **Completed:** 2026-11-24T00:47Z
- **Tasks:** 2
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

- `lib/photos/stepping.ts`: `RESERVED_PHOTO_SEGMENTS = new Set(['regions'])`, with a doc comment. `slugFromPath` decodes once inside the existing try/catch, then returns null for a reserved segment.
- `components/photos/LightboxDialog.tsx`: the private `PHOTO_PATH` regex and `slugOf` are deleted. The initial shown slug, `close()` and the dialog's `onClose` all use `slugFromPath`. `onClose` calls `api.close()` only when `slugFromPath(window.location.pathname) !== null`. On photo paths nothing changes, because pathnames never carry `?` or `#`. On a malformed escape the lightbox no longer throws.
- `lib/dom/editable.ts` exports `isEditable(target)` with the original body and doc line. Both component copies are deleted.
- `lib/__tests__/photos-stepping.test.ts` has the reserved, case, malformed-escape and decode-once rows, a self-test of the scan pattern, and a source scan that finds exactly one photo-path regex definition.

## v2.0 identity (after 17-12)

Build: `rm -rf .next/static && npm run build` on the Task 2 working tree, then `git restore public/service-worker.js`. That tree was committed unchanged as 2762130 before the server started, so the build is HEAD's. Server: `node node_modules/next/dist/bin/next start -p 3017`. Harness: `<scratchpad>/v20-identity.mjs` (SHA-256 `b722b56559399d47fbee6408e7d29bed2f4f7daef51486bee6212949290f2dd6`) and `<scratchpad>/v20-base.json` (SHA-256 `be3ad3b82fd3f659b8fc5084a28099fe239cd1d3958b57052fbda3b3b99f200a`). Both match the 17-05 SUMMARY's hashes, so I did not recreate them. Command, run from the repo root: `node <scratchpad>/v20-identity.mjs http://localhost:3017 <scratchpad>/v20-base.json`. Complete stdout:

```text
v20-identity: exit=0 differing=0 compared=36 removed=0,0,0,0 base=51b7f4d9b291 head=2762130e8773
```

Exit code: 0. Stderr was empty.

| Field | matterhorn-from-zermatt | gornerschlucht-waterfall | matterhorn-glacier-trail | riffelsee-reflection |
|---|---|---|---|---|
| status | identical | identical | identical | identical |
| title | identical | identical | identical | identical |
| headSha256 | identical | identical | identical | identical |
| ogImage | identical | identical | identical | identical |
| ogStatus | identical | identical | identical | identical |
| ogContentType | identical | identical | identical | identical |
| ogSha256 | identical | identical | identical | identical |
| mainSha256 | identical | identical | identical | identical |
| htmlSha256 | identical | identical | identical | identical |
| ldJsonRemoved (recorded, not compared) | 0 | 0 | 0 | 0 |

I stopped the server by killing the process tree on :3017. Nothing listens on :3000 or :3017.

## Client JS

`rm -rf .next/static && npm run build` gives **1,851,755 B in 24 files**, within the 1,855,781 B cap. The orchestrator's last figure was 1,851,837 B, so this plan saves 82 B: two identical function copies became one module, and the lightbox's private regex and decoder are gone.

## Task Commits

1. **Task 1: One photo-path parser that never reads a region path as a photo, used by the lightbox**
   - `cb01fc6` (test, RED): reserved, malformed-escape and decode-once rows, and the one-parser scan
   - `affc985` (feat, GREEN): `RESERVED_PHOTO_SEGMENTS` in `slugFromPath`; LightboxDialog on `slugFromPath`
2. **Task 2: One isEditable for the viewer and the zoom stage, and the lightbox behaviour unchanged in the browser**
   - `2762130` (refactor): `lib/dom/editable.ts`, imported by PhotoViewer and ZoomStage

## TDD Gate Compliance

- **RED (`cb01fc6`):** `npx jest lib/__tests__/photos-stepping.test.ts` exited 1 with 4 failed and 15 passed. All four failures were on the planned behaviour:
  - `slugFromPath('/photos/regions')` returned `"regions"` where null was expected;
  - `RESERVED_PHOTO_SEGMENTS` did not exist yet, so the spread threw "is not iterable";
  - `slugFromPath('/photos/%72egions')` returned `"regions"`;
  - the scan found `components/photos/LightboxDialog.tsx` as well as `lib/photos/stepping.ts`.

  There were no load, import or syntax errors. next/jest uses SWC, so a missing export is simply `undefined`. The rows that passed are guards that already held: the `%E0` row (stepping.ts already guarded its decode), the case-sensitivity and published-slug rows, and the pattern self-test. The Jest default reporter is not a `tdd-red-evidence` classifier format, so I did not run the classifier. The RED verdict rests on reading the output, saved to the git-ignored `.gsd/tdd-evidence/17-12/red-t1.txt`.
- **GREEN (`affc985`):** the Task 1 verify suites (stepping, lightbox-dialog, components/photos, photo-routes), plus regions.test.ts and components/site, passed 279/279 across 18 suites.
- Task 2 is a plain `type="auto"` task (no `tdd`). It is a behaviour-preserving move, so it is committed as `refactor(17-12)`.

## Files Created/Modified

- `lib/dom/editable.ts` (new): `isEditable(target: EventTarget | null): boolean`
- `lib/photos/stepping.ts`: `RESERVED_PHOTO_SEGMENTS`, and the reserved check in `slugFromPath` with its doc block
- `components/photos/LightboxDialog.tsx`: imports `slugFromPath`; the private regex and decoder are deleted; a doc bullet names D-24
- `components/photos/PhotoViewer.tsx`: imports `isEditable`; the local copy is deleted
- `components/photos/ZoomStage.tsx`: imports `isEditable`; the local copy is deleted
- `lib/__tests__/photos-stepping.test.ts`: D-24 rows, the pattern self-test and the one-definition scan

## Decisions Made

- The reserved check runs after the decode, so a percent-encoded `regions` is also null. The proxy already answers 404 for that URL, so the client and the server agree.
- The scan pattern also accepts `export const` and a type annotation (`const P: RegExp = …`), so a re-added copy cannot hide behind either spelling. It does not match `DETAIL_PATH`'s `/^\/(photos|projects)\/`. The walk is app/, components/ and lib/ as the plan specifies, so `proxy.ts`'s server-side `REGION_PATH` is outside it.
- Other `slugFromPath` callers (SiteNav, TileTransition, CarouselView, PhotoViewer) change only on the `/photos/regions` URL, which is a proxy 404. There, the mobile menu now closes on navigation, and grid tiles keep their view-transition names. Both are the correct reading of a non-photo URL. Region pages (`/photos/regions/<id>`) were already null, because they have two segments.

## Deviations from Plan

None. The plan was executed as written.

## Issues Encountered

- `npx prettier --check` warns on every working-tree file because `core.autocrlf=true` checks files out with CRLF line endings. I checked formatting on the committed blobs and on CR-stripped text instead. All changed files are clean except `components/photos/PhotoViewer.tsx`. Its 8 lines of drift (the `hotspotKey` wrapping, noted in 17-06) are identical at d3abc54 and at HEAD, so this plan added none.
- A shell-quoted `node -e` edit of the test file failed on bash quoting before it wrote anything (`git status` was clean afterwards). I redid the edit with the Edit tool.

## Verification

- Jest: the full suite passed, 119 suites and 2,206 tests.
- `npm run type-check` (three configs) and `npm run lint` (ESLint, the served-images scan and the test-count scan) exited 0.
- `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts e2e/photos-region.spec.ts e2e/keyboard.spec.ts --project=chromium --project=firefox`: **178 passed**, 0 failed, 0 flaky. `public/service-worker.js` was restored afterwards.
- Acceptance greps:
  - `PHOTO_PATH` in LightboxDialog.tsx: 0
  - `slugFromPath` in LightboxDialog.tsx: 5
  - `RESERVED_PHOTO_SEGMENTS` in stepping.ts: 3
  - `function isEditable` across app/components/lib: 1 file (`lib/dom/editable.ts`)
  - `lib/dom/editable` in PhotoViewer.tsx: 1, and in ZoomStage.tsx: 1
  - `lib/dom/editable.ts` exists
- `node scripts/ci/check-snapshot-commit.mjs --none` passed after every commit (0 changed). No PNG was staged.
- Nothing listens on :3000 or :3017.

## Known Stubs

None.

## Threat Flags

None. T-17-23 is mitigated: there is one guarded decode, and the `/photos/%E0` row pins null. T-17-24 is mitigated by `RESERVED_PHOTO_SEGMENTS`, the region-path rows and the one-definition scan. No package was installed (T-17-SC). The plan adds no new network, auth or file surface.

## User Setup Required

None.

## Next Phase Readiness

- 17-13 and 17-15 rerun the identity compare. The harness and base in the scratchpad still match 17-05's hashes.
- A future static segment under `/photos` goes into `RESERVED_PHOTO_SEGMENTS`. The stepping test pins the set to exactly `['regions']`, so adding one is a deliberate test edit.

## Self-Check: PASSED

All six key files exist. Commits cb01fc6, affc985 and 2762130 are ancestors of HEAD. The TDD gate commits are present: test(17-12) cb01fc6, followed by feat(17-12) affc985.

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-24*
