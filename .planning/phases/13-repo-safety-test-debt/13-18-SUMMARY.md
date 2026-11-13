---
phase: 13-repo-safety-test-debt
plan: 18
subsystem: e2e-toolchain
status: complete
tags: [deps-06, playwright, container-tag, parity-guard, dependabot-140]

requires:
  - phase: 13-repo-safety-test-debt
    provides: "13-16 merge d48af99 on main (mid-phase PR #143), so the bump lands after the mid-phase merge and before any intended visual change"
provides:
  - "bump.commit: 5ab6d15f24c362f0579a10685e23f776e8cdf414 (five files only)"
  - "@playwright/test ^1.65.0 in package.json; @playwright/test, playwright and playwright-core pinned at 1.65.0 in package-lock.json"
  - "all four container tag sites at mcr.microsoft.com/playwright:v1.65.0-noble; version floor @playwright/test 1.65.0"
affects: [13-20 (three-engine CI run, functional fallout, re-baseline on 1.65, closing Dependabot #140), 13-22 (DEPS-06 also declared there)]

legitimacy: verified   # Tim's literal reply to the Task 1 blocking-human checkpoint (an AskUserQuestion selection)
bump:
  commit: 5ab6d15f24c362f0579a10685e23f776e8cdf414
  files: 5
smoke:
  command: "npx playwright test e2e/homepage.spec.ts --project=chromium"
  result: "pass, 7/7 in 16.8s (dev server, no build)"

actuals:
  tokens: 4200     # chars/4 over the realized diff: bump commit diff (~5,200 chars) plus this SUMMARY (~11,700 chars)
  tasks: 2
  commits: 1       # MEASURED: git rev-list --count eb22e0e..HEAD at this SUMMARY write = 5ab6d15. The docs commits carrying this SUMMARY and STATE/ROADMAP follow
plan_head_before: eb22e0e6625e25df9bb31bf257a284a748c25727
plan_head_after: 5ab6d15f24c362f0579a10685e23f776e8cdf414

tech-stack:
  added: []
  patterns:
    - "Run lockfile-writing npm through Node's bundled npm (node \"C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js\") when the global npm under %APPDATA%\\npm is older; the old one rewrites unrelated lockfile metadata"

key-files:
  created:
    - .planning/phases/13-repo-safety-test-debt/13-18-SUMMARY.md
  modified:
    - package.json
    - package-lock.json
    - .github/workflows/ci.yml
    - .github/workflows/visual-baselines.yml
    - scripts/guards/version-floors.json

key-decisions:
  - "13-18: Tim replied \"verified\" to the @playwright/test 1.65.0 legitimacy checkpoint; Playwright 1.65.0 and container tag v1.65.0-noble landed together in the single five-file commit 5ab6d15 (parity guard OK, type-check, lint and jest green)"
  - "13-18: the lockfile was written with Node 26's bundled npm 11.20.0, not the shadowing global npm 11.6.1, whose install rewrote unrelated metadata (peer/dev flags, dropped libc arrays); the committed lockfile diff touches only the root spec and the three Playwright entries"
  - "13-18: DEPS-06 stays Pending in REQUIREMENTS.md by the shared-ID gate (13-20 and 13-22 also declare it and have no SUMMARY yet)"

patterns-established:
  - "Check `git diff package-lock.json` after any local npm install here; a diff beyond the intended packages means the wrong npm wrote it"

requirements-completed: [DEPS-06]   # copied from the plan; REQUIREMENTS.md not ticked, shared-ID gate (13-20 and 13-22 also declare DEPS-06)

duration: 6min
completed: 2026-11-13
---

# Phase 13 Plan 18: Playwright 1.65.0 Bump Summary

**`@playwright/test` 1.65.0 (with `playwright` and `playwright-core` 1.65.0) and container tag `mcr.microsoft.com/playwright:v1.65.0-noble` at all four sites landed in one five-file commit, `5ab6d15`. The parity guard, type-check, lint (157 selftests) and jest (1757 tests) pass, and the local chromium homepage smoke passed 7/7.**

## Performance

- **Duration:** about 6 min (task 2 start 2026-11-13T17:00:46Z; bump commit 17:02:57Z; smoke and SUMMARY afterwards)
- **Started:** 2026-11-13T17:00:46Z
- **Tasks:** 2 (Task 1 resolved by Tim before dispatch, Task 2 executed here)
- **Files modified:** 5 in the bump commit

## Task 1: Package legitimacy (checkpoint:human-verify, gate blocking-human)

**legitimacy: verified.** This is Tim's literal reply, an AskUserQuestion selection, given before this executor started.

Before Tim answered, the orchestrator gathered this evidence with read-only public queries and showed it to him:

- `npm view @playwright/test@1.65.0`: version 1.65.0, dist-tag `latest`. Maintainers include microsoft-oss-releases, microsoft1es, dgozman-ms, pavelfeldman and yurys. Repository `git+https://github.com/microsoft/playwright.git`, `scripts: {}`, dependencies `{ "playwright": "1.65.0" }`, registry `dist.signatures` present.
- `playwright@1.65.0` depends on `playwright-core` 1.65.0. Neither package has install scripts.
- npm publish times: 1.64.0 on 2026-10-07, 1.64.1 on 2026-10-14, 1.65.0 on 2026-11-05T18:30:18Z.
- `gh release view v1.65.0 -R microsoft/playwright`: name v1.65.0, publishedAt 2026-11-05T18:25:45Z, author dgozman, not a prerelease.

The precondition for Task 2 was also met: 13-16-SUMMARY records that PR #143 was merged as merge commit `d48af99`.

## Task 2: The single Playwright 1.65 commit

**Commit:** `5ab6d15f24c362f0579a10685e23f776e8cdf414`, `chore(13): Playwright 1.65.0 with container tag v1.65.0-noble (DEPS-06)`

```
$ git show --stat HEAD
 .github/workflows/ci.yml               |  4 ++--
 .github/workflows/visual-baselines.yml |  4 ++--
 package-lock.json                      | 24 ++++++++++++------------
 package.json                           |  2 +-
 scripts/guards/version-floors.json     |  2 +-
 5 files changed, 18 insertions(+), 18 deletions(-)
```

What changed:
- `package.json`: `"@playwright/test": "^1.64.1"` became `"^1.65.0"`.
- `package-lock.json`: the root devDependencies spec, plus `node_modules/@playwright/test`, `node_modules/playwright` and `node_modules/playwright-core`. Each now has version 1.65.0 with its new `resolved` and `integrity`, and the inner dependency pins moved to 1.65.0. No other entry changed.
- `.github/workflows/ci.yml`: the E2E (line 158) and Visual Regression (line 209) container images.
- `.github/workflows/visual-baselines.yml`: the container image (line 32) and `PW_CONTAINER_TAG` (line 71).
- `scripts/guards/version-floors.json`: the `@playwright/test` floor went from 1.64.0 to 1.65.0.
- `e2e/perf/home-baseline.json` was not touched. It records a measurement.

No running `next start` or `next dev` was found before the install. The only node process belonged to Adobe Creative Cloud, and port 3000 was free.

### npm ls

```
$ npm ls @playwright/test playwright playwright-core
portfolio-app@1.0.0
+-- @axe-core/playwright@4.14.0
| `-- playwright-core@1.65.0
+-- @playwright/test@1.65.0
| `-- playwright@1.65.0
|   `-- playwright-core@1.65.0 deduped
`-- next@16.4.5
  `-- @playwright/test@1.65.0 deduped
```

### Verify outputs

| Check | Result |
|-------|--------|
| `npm run guard:parity` | `parity: OK`, exit 0 |
| `npx playwright --version` | `Version 1.65.0` |
| `npm run type-check` (`tsc --noEmit`) | exit 0. The 1.65 `test.slow` signature change (assumption A5) caused no type error |
| `npm run lint` | exit 0. Covers eslint, every guard (parity, ci-gate, palette, contrast 47 pairs, identity) and the data checks. 157 selftest lines PASS, 0 FAIL |
| `npm test` (jest) | 105/105 suites, 1757/1757 tests passed, 0 snapshots, 12.84 s |
| `git grep -c "v1.64.1-noble" -- .github` | no output (exit 1) |
| `git grep -c "v1.65.0-noble" -- .github` | `ci.yml:2`, `visual-baselines.yml:2` |
| `git show --stat HEAD` | exactly the five files (above) |
| Post-commit deletion check | no deletions |

### Local smoke

`npx playwright install chromium` downloaded Chrome Headless Shell 158.0.8127.18 (playwright chromium-headless-shell v1254).

`npx playwright test e2e/homepage.spec.ts --project=chromium`: **7 passed (16.8 s)**. Because `CI` and `PW_PROD` were unset, `playwright.config.ts` started `npm run dev` and ran no `next build`, so `public/service-worker.js` was never rewritten. The run left no server: nothing listens on port 3000 afterwards, and the only node process is Adobe's. No visual test ran, no `--update-snapshots` was used, and no `*-snapshots/` PNG was touched.

Expected noise during the run: the Next.js dev warning about custom Cache-Control headers on `/_next/static/:path*`, and the `THREE.Clock` deprecation notice from the browser console.

## Dependabot #140

Dependabot PR #140 is still open. Nothing in this plan touched GitHub. It closes when 1.65 reaches `main`, either when Dependabot sees the version or through the comment-and-close step in 13-20.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Wrong npm wrote unrelated lockfile metadata on the first install**
- **Found during:** Task 2
- **Issue:** The first `npm install -D @playwright/test@1.65.0` ran through the global npm 11.6.1 in `%APPDATA%\npm`. Node's `npm` shim prefers that copy over the npm 11.20.0 bundled with Node 26.13.1. Besides the three Playwright entries, it rewrote unrelated lockfile metadata: new `"peer": true` flags on many entries (next, react types, eslint and others), `"dev": true` added to the optional `@img/sharp-*` and `@emnapi/runtime` entries (a semantic change for production installs), and `libc` arrays dropped from the platform-specific optional packages. That came to 130 changed lines, against the brief's rule of changing nothing beyond @playwright/test, playwright and playwright-core.
- **Fix:** Restored only `package.json` and `package-lock.json` (`git checkout --` on those two files), then re-ran the same approved command through the bundled npm 11.20.0: `node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" install -D @playwright/test@1.65.0`. That diff is 24 lines in the lockfile, covering the root spec and the three Playwright entries only, and it is the version committed. No other package was installed or changed.
- **Files modified:** package.json, package-lock.json (both in the bump commit)
- **Commit:** 5ab6d15

**Note:** npm 11.20.0 printed a warning that `@parcel/watcher@2.6.0` has an install script not yet covered by `allowScripts`. That is local `node_modules` state only. The lockfile is unaffected, and lint, jest and the smoke all passed. The first (discarded) npm 11.6.1 run also left extra optional packages in the local `node_modules` ("added 84 packages"). That is local only and changes nothing committed. A later `npm ci` (with any `next` server stopped first) brings `node_modules` back in line with the lockfile.

**Engine note:** local Node is 26.13.1 and `package.json` engines asks for `24.x`, so npm printed EBADENGINE. CI uses `.nvmrc` 24, so this is not a defect of this plan.

## Issues Encountered

None beyond the deviation above.

## Known Stubs

None. This plan made no code changes.

## Next Phase Readiness

- 13-20 can run the three-engine CI and the re-baseline. The only change since the last green Visual Regression (13-15, 1.64.1 baselines) that could move pixels is this commit.
- All work is local. Nothing was pushed: no PR, no workflow dispatch, no settings change.

## Self-Check: PASSED

- `.planning/phases/13-repo-safety-test-debt/13-18-SUMMARY.md` exists.
- Commit `5ab6d15` is an ancestor of HEAD. `git show --stat 5ab6d15` lists exactly the five plan files.
- `npm run guard:parity` prints `parity: OK`, and `npx playwright --version` prints `Version 1.65.0`. Both were re-run after this SUMMARY was written.
- `commits: 1` was measured from the ledger at `.git/gsd-plan-head-before-13-18` (`eb22e0e..HEAD`). The docs commits carrying this SUMMARY and the STATE/ROADMAP update follow it.
- Port 3000 is free, and `git status --short` shows only the four untracked paths (`.claude/`, `.planning/state.json`, `.planning/ui-reviews/`, `graphify-out/`) before the docs commit.

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
