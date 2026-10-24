---
phase: 08-data-terrain-pipeline
plan: 09
subsystem: ci-guards
tags: [sharp, exif, xmp, iptc, privacy, lint, selftest, playwright, vercel, cache-control]

requires:
  - phase: 08-06
    provides: content-hashed /terrain/ assets, the immutable /terrain/:path* header and the CSP matcher that skips images/ and terrain/
  - phase: 08-07
    provides: photo derivatives in public/images/photos/, data/generated/image-manifest.ts, and the D-11 removal of the eight full-res copies and optimization-manifest.json
  - phase: 08-08
    provides: typed photo facts (lint chain state the guard is appended to)
provides:
  - scripts/guards/check-served-images.mjs (rules metadata, oversize, orientation, hash-name, orphan, missing, svg-content, metadata-call; flag --root)
  - npm script guard:images, appended to npm run lint
  - ten served-images selftest cases (SERVED / si()) with one mini-root fixture per rule under scripts/guards/__selftest__/served-images/
  - e2e/data-privacy.spec.ts (describe "Data privacy (DATA-05)")
  - CI evidence on ci/08-09 and Vercel preview evidence (Tim) for DATA-05
affects: [08-10, 08-11, 08-12, 08-13, phase 10 photo pipeline consumers, phase 12 legacy image cleanup (VERIFY-01)]

actuals:
  tokens: 7300
  tasks: 3
  commits: 2
plan_head_before: 1d79be79d067c9992a424b074519339c7a227395
plan_head_after: 7df0fc401492a779d38d5801d0bcc8e9cf549639

tech-stack:
  added: []
  patterns:
    - "Served-image guard: repo mode scans git ls-files (every tracked image, not only public/); fixture mode (--root) walks a mini root; one '<path> <rule>: <detail>' line per violation, then 'served-images: OK' or 'served-images: N violations'"
    - "Metadata detection is belt and braces: sharp metadata() exif/xmp/iptc plus a byte scan for Exif/XMP/IPTC/raw-profile markers; an unreadable image fails as 'metadata: unreadable'"
    - "Selftest fixtures stored byte-exact via .gitattributes '-text' so hashed names and planted EXIF/XMP survive autocrlf"
    - "Prod-only header assertions are in-test conditions on !!process.env.CI || !!process.env.PW_PROD, never test.skip (test-count.mjs rejects skips)"

key-files:
  created:
    - scripts/guards/check-served-images.mjs
    - e2e/data-privacy.spec.ts
    - scripts/guards/__selftest__/served-images/ (good + nine bad-* mini roots)
  modified:
    - package.json
    - scripts/guards/selftest.mjs
    - .gitattributes

key-decisions:
  - "Manifest URL regexes are limited to quoted strings via lookarounds: the plan's /\\/terrain\\/[^'\"]+/g also matched path names in generated-file header comments and produced two false missing: violations"
  - "The metadata rule also byte-scans for Exif/XMP/IPTC/raw-profile markers and fails unreadable images, so an image sharp cannot parse still cannot slip through"
  - "metadata-call rule scope is .mjs/.cjs/.js/.ts under scripts/photos and scripts/terrain, with ICC-profile methods excluded (colour profile is not personal metadata), matching the metadata rule"
  - "DATA-05 preview check done by Tim in a signed-in browser because Vercel SSO deployment protection answers anonymous requests with 302 to vercel.com/sso-api (the plan's 401 branch)"

patterns-established:
  - "Every new CI guard ships with a clean fixture that prints the OK line and one failing fixture per rule, proven by a mutant guard with that rule disabled"

requirements-completed: [DATA-05]

coverage:
  - id: D1
    description: "Served-image guard scans every git-tracked image in npm run lint and fails EXIF/XMP/IPTC anywhere, oversize/orientation in public/, bad hash names, orphan/missing manifest entries, unsafe SVG and metadata-keeping sharp calls"
    requirement: DATA-05
    verification:
      - kind: other
        ref: "node scripts/guards/check-served-images.mjs -> served-images: OK (60 public/images/optimized legacy files + 36 e2e PNGs)"
        status: pass
      - kind: other
        ref: "CI run 40114812277 job 'Lint and Type Check' (120933799555): served-images: OK"
        status: pass
      - kind: other
        ref: "removed IMG_0605-Enhanced (2022_02_01 09_47_03 UTC).jpg from e5422b5^ in scratch -> oversize: 12480x8320"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each guard rule has a failing fixture and the clean fixture passes (ten served-images selftest cases)"
    requirement: DATA-05
    verification:
      - kind: unit
        ref: "node scripts/guards/selftest.mjs -> selftest: 72/72 cases passed (local and CI)"
        status: pass
      - kind: other
        ref: ".git/gsd-red/08-09-mutation.tap (each Task 2 fixture fails its case under .git/gsd-red/served-images-mutant.mjs with that rule disabled)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Production server returns 404 for the eight old full-res URLs and optimization-manifest.json; /terrain/ and /images/photos/ assets return 200, immutable, no CSP; / keeps the CSP"
    requirement: DATA-05
    verification:
      - kind: e2e
        ref: "e2e/data-privacy.spec.ts (PW_PROD=1 --project=chromium: 12 passed)"
        status: pass
      - kind: e2e
        ref: "CI run 40114812277 job 'E2E Tests' (120933799415): 146 passed incl. the spec's 24 (chromium + firefox), immutable assertion on the production server"
        status: pass
    human_judgment: false
  - id: D4
    description: "Vercel preview: old full-res URL is 404 and the contour strip is served with public, max-age=31536000, immutable"
    requirement: DATA-05
    verification:
      - kind: manual_procedural
        ref: "Tim, signed-in browser on https://portfolio-dmxqsav4h-old-shatterhands-projects.vercel.app: reply 'green: 404, 200 public, max-age=31536000, immutable'"
        status: pass
    human_judgment: false
  - id: D5
    description: "CI green on ci/08-09 with zero visual baseline change"
    verification:
      - kind: other
        ref: "node scripts/ci/check-visual-run.mjs --sha 7df0fc4 --wait 30 (and --job 'Lint and Type Check' / 'Unit Tests' / 'E2E Tests') -> exit 0"
        status: pass
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha HEAD --none -> snapshot-commit: OK (0 changed)"
        status: pass
    human_judgment: false

duration: 1h 8m
completed: 2026-10-24
status: complete
---

# Phase 8 Plan 09: Served-Image Guard and DATA-05 Proof Summary

**`npm run lint` now fails any tracked image that carries EXIF, XMP or IPTC, plus oversized, rotated, misnamed, orphaned or unsafe served images. A production-server e2e and the Vercel preview show that the old full-resolution URLs return 404 and the hashed terrain and photo assets are served with an immutable Cache-Control header.**

## Performance

- **Duration:** 1h 8m (includes the CI wait and the human-verify pause)
- **Started:** 2026-10-24T17:01:11Z
- **Completed:** 2026-10-24T18:09:48Z
- **Tasks:** 3 (2 committed, 1 human-verify checkpoint)
- **Files modified:** 30 (5 code/config files + 25 fixture files)

## Accomplishments

- `scripts/guards/check-served-images.mjs` has eight rules. In repo mode it scans `git ls-files` across the whole repo, so an original added with `git add -f` also fails. It is wired in as `guard:images` at the end of `npm run lint`, and it passes on the repo: 60 legacy optimized files and 36 e2e PNGs.
- There are ten selftest cases: one clean mini-root that prints `served-images: OK` and one failing fixture per rule (EXIF-GPS, XMP-only, oversize, orientation, hash-name, svg-script, orphan, missing, metadata-call). Running the guard with each rule disabled shows that each of the eight Task 2 fixtures fails only because of its own rule.
- `e2e/data-privacy.spec.ts` checks the following. The eight old full-res URLs and `optimization-manifest.json` return 404. The strip and a 640 WebP return 200 with no CSP, and on the production server they are also `public, max-age=31536000, immutable`. `/` still carries the CSP.
- CI on `ci/08-09` is green across every job, with zero baseline change. On the Vercel preview, Tim confirmed the 404 and the immutable header.

## Task Commits

1. **Task 1 (tracer): served-image guard in lint** - `2b4ca2e` (feat)
2. **Task 2: one failing fixture per remaining rule, plus the privacy e2e** - `7df0fc4` (test)
3. **Task 3: CI on ci/08-09 and Vercel preview (checkpoint:human-verify, gate=blocking)** - no commit (push + verification only)

**Plan metadata:** recorded in the docs(08-09) commits that follow this SUMMARY.

## Task 3 Checkpoint Resolution

**Push:** `git ls-remote origin refs/heads/ci/08-09` returned nothing, so the branch was pushed plainly with `git push origin HEAD:refs/heads/ci/08-09` (no force). Pushed SHA: `7df0fc401492a779d38d5801d0bcc8e9cf549639`. The phase branch and main were not pushed.

**CI:** run https://github.com/tlex-web/portfolio-app/actions/runs/40114812277 (headBranch `ci/08-09`, headSha matches; the orchestrator re-checked it independently with gh):

| Job | Result | Evidence |
|-----|--------|----------|
| Lint and Type Check (120933799555) | success | log shows `selftest: 72/72 cases passed` and `served-images: OK` |
| Unit Tests (120933799426) | success | |
| E2E Tests (120933799415) | success | 146 passed, incl. the new spec's 24 (12 x chromium + firefox); the immutable Cache-Control assertion ran on the production server |
| Visual Regression (120933799221) | success | no baseline change |
| Build Application | success | |
| Security Audit | success | |
| Dependency Review | skipped | |

**Acceptance commands:** `check-visual-run.mjs --sha 7df0fc4 --wait 30` exited 0. The `--job "Lint and Type Check"`, `--job "Unit Tests"` and `--job "E2E Tests"` checks exited 0. `check-snapshot-commit.mjs --sha HEAD --none` printed `snapshot-commit: OK (0 changed)`.

**Preview:** https://portfolio-dmxqsav4h-old-shatterhands-projects.vercel.app (deployment 7301783022, state success). Anonymous requests to both URLs returned `302 Found` to vercel.com/sso-api with `cache-control: no-store, max-age=0`. This is Vercel SSO deployment protection, which is the plan's 401 case, so Tim checked both URLs in his signed-in browser.

Tim's reply, verbatim:

    green: 404, 200 public, max-age=31536000, immutable

Recorded results:

| URL on the preview | Status | Cache-Control | CSP header |
|--------------------|--------|---------------|------------|
| `/images/optimized/IMG_0605-Enhanced%20(2022_02_01%2009_47_03%20UTC).jpg` (old full-res) | **404** | - | - |
| `/terrain/contours-strip.e1af353f82.svg` (strip) | **200** | **`public, max-age=31536000, immutable`** | not reported on the preview; the CI production-server e2e (`... is served without CSP (immutable on the production server)`) asserts it is absent |

## Files Created/Modified

- `scripts/guards/check-served-images.mjs` - the DATA-05 served-image privacy and integrity guard (repo mode and `--root` fixture mode)
- `package.json` - `guard:images` script; `lint` ends with `&& npm run guard:images`
- `scripts/guards/selftest.mjs` - `SERVED` / `si()` constants and ten served-images cases
- `scripts/guards/__selftest__/served-images/**` - mini roots `good`, `bad-exif-gps`, `bad-xmp-only`, `bad-oversize`, `bad-orientation`, `bad-hash-name`, `bad-svg-script`, `bad-orphan`, `bad-missing`, `bad-metadata-call` (all under 20 KB)
- `e2e/data-privacy.spec.ts` - 404 for removed full-res URLs; cache and CSP headers on hashed assets; CSP on `/`
- `.gitattributes` - `scripts/guards/__selftest__/served-images/** -text`

## Decisions Made

See key-decisions in the frontmatter. In short: manifest URLs are matched only inside quoted strings. The metadata rule adds a byte scan and fails unreadable images. ICC-profile methods are exempt from metadata-call. The preview check went to Tim because SSO protection blocks anonymous requests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Manifest URL regexes matched header comments**
- **Found during:** Task 1
- **Issue:** The interfaces-block regexes `/\/images\/photos\/[^'"]+/g` and `/\/terrain\/[^'"]+/g` also matched path names in the generated files' header comments, which produced two false `missing:` violations on the repo.
- **Fix:** Both regexes now match only inside quoted strings, using lookarounds.
- **Files modified:** scripts/guards/check-served-images.mjs
- **Verification:** The guard prints `served-images: OK` on the repo, and the `bad-missing` and `bad-orphan` fixtures still fail.
- **Committed in:** 2b4ca2e (fixed before the Task 1 commit)

**2. [Rule 3 - Blocking] Fixtures needed byte-exact storage**
- **Found during:** Task 1
- **Issue:** Under `core.autocrlf`, the SVG/TS fixture bytes could be rewritten. That would break the hashed names (sha256 of the bytes) and the planted EXIF/XMP.
- **Fix:** `.gitattributes` gets `scripts/guards/__selftest__/served-images/** -text`. The file was not in the plan's files list.
- **Files modified:** .gitattributes
- **Verification:** Selftest passes 72/72 locally and on the CI Linux checkout.
- **Committed in:** 2b4ca2e

**3. [Rule 2 - Missing critical] Metadata rule hardened beyond sharp metadata()**
- **Found during:** Task 1
- **Issue:** Relying only on sharp `metadata()` misses metadata in a file sharp cannot parse, and that is the privacy failure this guard exists to stop (T-08-25 / T-08-26).
- **Fix:** The rule also byte-scans for Exif/XMP/IPTC/raw-profile markers, and an unreadable image fails as `metadata: unreadable`.
- **Files modified:** scripts/guards/check-served-images.mjs
- **Verification:** No false positives on the repo's 96 tracked images; the `bad-exif-gps` and `bad-xmp-only` fixtures fail.
- **Committed in:** 2b4ca2e

**4. [Rule 2 - Missing critical] metadata-call scope widened to all script extensions**
- **Found during:** Task 1
- **Issue:** The plan named only `.mjs`. A `.cjs`/`.js`/`.ts` script under scripts/photos or scripts/terrain could re-add metadata (T-08-29).
- **Fix:** The scope now covers `.mjs/.cjs/.js/.ts` under those two directories. ICC-profile methods are excluded, consistent with the metadata rule.
- **Files modified:** scripts/guards/check-served-images.mjs
- **Verification:** The `bad-metadata-call` fixture fails, and the repo's own photo and terrain scripts pass.
- **Committed in:** 2b4ca2e

---

**Total deviations:** 4 auto-fixed (1 bug, 1 blocking, 2 missing critical)
**Impact on plan:** All four were needed for correctness or for the privacy goal. There is no scope creep and no new dependency.

## TDD Gate Compliance

Task 2 (`tdd="true"`) was test-only work. The plan had all eight rules built in Task 1 (the tracer), so the eight new selftest cases passed as soon as they were added. There is **no `RED_EVIDENCE_OK` record**, and none could be produced honestly: no new behavior was left to implement after the tests.

The evidence that each fixture can fail is the mutation run instead. Each of the eight Task 2 fixtures fails its selftest case under a mutant guard with that one rule disabled. The mutant is at `.git/gsd-red/served-images-mutant.mjs` and the TAP at `.git/gsd-red/08-09-mutation.tap`. The commit sequence is `feat(08-09)` (Task 1) then `test(08-09)` (Task 2), which follows the plan's task order rather than RED-before-GREEN. Treat this as test-after coverage, not a TDD cycle.

## Issues Encountered

- The orientation tag of a JPEG lives in EXIF, so the `bad-orientation` fixture also triggers `metadata:`. Its selftest case therefore checks only for `orientation: tag 6`, not for a single violation.
- The Vercel preview is behind SSO deployment protection: anonymous `curl -I` gets a 302 to vercel.com/sso-api. Tim did the preview check in his browser, as the plan's fallback allows.

## Verification Log (local, at 7df0fc4)

- `node scripts/guards/check-served-images.mjs` -> `served-images: OK`
- `node scripts/guards/selftest.mjs` -> `selftest: 72/72 cases passed`
- `PW_PROD=1 npx playwright test e2e/data-privacy.spec.ts --project=chromium` -> 12 passed
- `npm run lint` -> 0 errors / 54 warnings (pre-existing), ends with `served-images: OK`; `tsc` clean
- Jest 355 passed; `npm run guard:tests` OK; `public/service-worker.js` restored after the build
- Acceptance: `grep -c "npm run guard:images" package.json` = 1; `bad-exif-gps` exits 1 with `public/images/a.jpg metadata:`; no fixture over 20 KB; all ten fixture dirs present; the spec has no `.skip(` and contains `immutable` and `404`

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- DATA-05 is enforced in CI. Phase 8 now has 9 of 13 plans complete, Wave 5 is done, and the next plan is 08-10.
- Plans that add served images or change the terrain/photo generators must keep the manifests and the files in step. Otherwise `orphan:`/`missing:` fail lint.
- The 60 legacy files in `public/images/optimized/` pass the guard (they are under 2560 px and metadata-free). Phase 12 (VERIFY-01) removes them.

## Self-Check: PASSED

- FOUND: scripts/guards/check-served-images.mjs, e2e/data-privacy.spec.ts, scripts/guards/selftest.mjs, .gitattributes, package.json, and all ten fixture dirs
- FOUND: 2b4ca2e, 7df0fc4 (ancestors of HEAD)
- commits measured from the ledger: `git rev-list --count 1d79be7..HEAD` = 2

---
*Phase: 08-data-terrain-pipeline*
*Completed: 2026-10-24*
