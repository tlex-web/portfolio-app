---
phase: 13-repo-safety-test-debt
fixed_at: 2026-11-13T22:26:59Z
review_path: .planning/phases/13-repo-safety-test-debt/13-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 13: Code Review Fix Report

**Fixed at:** 2026-11-13T22:26:59Z
**Source review:** .planning/phases/13-repo-safety-test-debt/13-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (WR-01 to WR-05; Tim chose "Fix all 5 warnings now")
- Fixed: 5
- Skipped: 0
- Out of scope: IN-01, IN-02 and IN-03, deferred to Phase 15 (guards). See the end of this report.

Each fix is one commit with a test that fails on the old code. The full local gate ran before each commit. The fixes ride in the phase-close PR, whose full CI and Visual Regression run are their live proof.

## Fixed Issues

### WR-01: Push-event docs-only classification compares only the latest push, so CI OK can go green on a SHA whose branch carries untested code

**Files modified:** `.github/workflows/ci.yml`, `scripts/guards/lib/workflow-shell.mjs`, `scripts/guards/selftest.mjs`
**Commit:** 1f8a5bc
**Status:** fixed: requires human verification (live proof: the phase-close PR's CI)
**Applied fix:** Root cause: on `push`, `BASE` was `github.event.before`, so the compare covered only the latest push. The `Classify the diff` step now gets `REF` through `env:`. A push to any branch but `main` compares `main...HEAD` (the merge-base), as the dispatch path already did. `main` keeps the previous tip, because it moves only by merged PRs that `CI OK` gated. A new branch (empty or all-zero `before`) still runs the full CI, and the check for that comes first. D-08 already names "the merge-base with main" for push runs. No `develop` branch exists on the remote, and the change only ever turns a docs-only verdict into a full run. The selftest compare stub can serve a separate body for `compare/main...`. New `workflow-shell changes:` cases cover: a non-main push compares `main...HEAD` (ci/, develop, feature/main refs); a docs-only push on top of an untested code push runs the full CI; `main` still compares the previous tip; a new-branch push makes no gh call. Against the old block (`GUARD_SELFTEST_WORKFLOW_DIR`), 2 of them fail.

### WR-02: Four of the D-09 "docs-only" files are Tailwind source inputs, so a docs-only change can alter the production stylesheet with build and visual regression skipped

**Files modified:** `app/globals.css`, `scripts/guards/selftest.mjs`
**Commit:** aee0ad3
**Status:** fixed
**Applied fix:** `app/globals.css` adds `@source not` for `../README.md`, `../AGENTS.md`, `../e2e/visual/README.md` and `../.github/copilot-instructions.md`, in the existing comment style. `scripts/README.md` was already covered by `../scripts`. Tailwind 4.3.4 passes each `@source` path to the oxide Scanner as `{ base, pattern, negated }`, and a probe confirmed that a single-file pattern works: the scan went from 349 to 345 files, exactly these four, while `.github/workflows/*` stays scanned.

Two new selftest cases compile `app/globals.css` with `@tailwindcss/node` and scan with `@tailwindcss/oxide`, both resolved from `@tailwindcss/postcss` and set up the way that plugin sets them up:
- The first fails if any `DOCS_ONLY_FILES` entry is a source. It also requires `app/layout.tsx` to be scanned, so it cannot pass vacuously. On the old stylesheet it fails and names the four files.
- The second proves the same scan reports the files once their lines are removed.

The selftest runner now awaits `fn` cases, which changes nothing for the sync ones. CSS comparison: `next build` before and after emits byte-identical stylesheets (`1k7l-2kdv5s93.css` 63,824 B and `2akvaw1kstmed.css` 5,061 B, same SHA-256). No utility disappeared, so the change is pixel-neutral.

### WR-03: The fail-closed limiter still throws at module scope on a malformed credential, bypassing the 503 contract

**Files modified:** `lib/rate-limit.ts`, `lib/__tests__/rate-limit.test.ts`, `e2e/prod/contact-form.prod.ts`
**Commit:** bc76d03
**Status:** fixed
**Applied fix:** Root cause confirmed in `@upstash/redis` 1.41.0: `new Redis()` builds an `HttpClient` that throws `UrlError` synchronously for a URL failing `/^https?:\/\/[^\s#$./?].\S*$/`, which includes a trailing newline. A bad token only warns at construction. The fix has two parts:
- `upstashCredentials()` trims both values and treats a blank one as missing. That fixes pasted newlines everywhere and is a no-op for valid credentials.
- The client is built inside try/catch. In production, a pair the client rejects refuses every call as `unconfigured`: 503 `server-error` and one `[rate-limit]` line per call, with no visitor data. Outside production it still throws (D-12, the existing behaviour).

Nine new jest tests cover trimming, a mocked constructor throw in production and in preview, and isolated imports through the real Redis constructor: a URL without https://, a quoted URL, and a URL and token with a trailing newline, under production and preview. 7 of the 9 fail against the old module. The 2 that pass pin the kept preview behaviour. The prod-form probe's 503 explanation now also names malformed variables.

### WR-04: The relay finds its dispatched run by comparing second-truncated runner time with GitHub's `created_at`, so a small clock offset turns a good run into a red CI OK

**Files modified:** `.github/workflows/ci-skip-relay.yml`, the five ci-gate relay fixtures (`good`, `bad-relay-checkout`, `bad-relay-if`, `bad-relay-interpolation`, `bad-relay-trigger`), `scripts/guards/lib/workflow-shell.mjs`, `scripts/guards/selftest.mjs`
**Commit:** 4dfeee9
**Status:** fixed: requires human verification (live proof: a `[ci skip]` head on the phase-close PR)
**Applied fix:** The lookup now:
- accepts runs created from `SKEW` (10) seconds before the dispatch, compared as epoch seconds (`fromdateiso8601`);
- takes the newest run whose `head_sha` is this PR head;
- has jq read `SINCE` and `SHA` from `$ENV`, so nothing is interpolated into the filter. A GET confirmed that gh 2.103's gojq supports `$ENV`.

The safety properties are unchanged:
- No match within the same 30 × 10 s budget stays red. When only other-SHA runs were seen, the error names one ("the branch moved"); otherwise it gives the 5-minute message. The relay no longer turns red early on another-SHA run that appears first, so a run of its own that shows up later can still be matched.
- No checkout, the fork check before dispatch, the ref as one literal argument, and `check-ci-gate.mjs` rules 10 to 15 are all unchanged; the guard file was not touched for this fix.

Each relay fixture is still the real relay plus exactly one violation. Three mutation anchors moved from `since=$(date` to `now=$(date`. A stub `date` reads `STUB_NOW`, so the clock is deterministic. New cases cover:
- a run stamped 1 s and 10 s before the runner clock (mirrored);
- a run at and after it (mirrored);
- 11 s before it (red after 30 polls);
- another SHA in the window, in either order (this SHA's run is mirrored);
- the newest of two runs on this SHA.

Against the old block, 4 cases fail, including the clock-skew case.

### WR-05: Most CI jobs that the relay and CI OK wait on have no `timeout-minutes`

**Files modified:** `.github/workflows/ci.yml`, `scripts/guards/check-ci-gate.mjs`, `scripts/guards/selftest.mjs`, the nine ci-gate `ci.yml` fixtures, `scripts/README.md`
**Commit:** cb5983f
**Status:** fixed
**Applied fix:** The jobs now carry these timeouts, well above the observed runs in the 13-15 and 13-20 SUMMARYs and well under the relay's 100-minute wait:
- lint-and-typecheck: 15 (observed about 1.5 min)
- unit-tests: 15 (about 2 min)
- build: 20 (about 1.2 min)
- dependency-review: 10 (a few seconds)
- security-audit: 10 (about 1 min)

New `check-ci-gate.mjs` rule 16: every job in `ci.yml` and `ci-skip-relay.yml` declares a job-level `timeout-minutes` that is a positive whole number. Rules 1 to 15 are unchanged. The fixtures get `timeout-minutes: 5` just before each job's `steps:`, so no asserted line number moves. New ci-gate cases cover a missing timeout in ci.yml, a missing timeout in the relay, a value of 0, and a quoted `'15'` that passes. The first three fail against the old guard, and the new guard flags exactly the five jobs in the old ci.yml. `scripts/README.md` gets the rule's row.

A separate docs commit, 89b3553, updates `scripts/README.md`: it describes the push base (WR-01), the Tailwind exclusion and its check (WR-02), and the relay lookup with its `STUB_NOW` clock (WR-04).

## Out of Scope (deferred, not skipped)

Tim's decision: the three Info findings are deferred to Phase 15 (guards). `13-REVIEW-DISPOSITION.md` records them as `deferred`, and `.planning/ROADMAP.md` Phase 15 has a scope note naming them.

- IN-01: SafeCanvas's new log duplicates Next's own caught-error log, and the WebGL failure is not actually silent.
- IN-02: ci-gate rules 11 and 12 inspect only `run:` blocks, so a `with:` input to an action could interpolate untrusted event fields without being flagged.
- IN-03: rule 5 detects a second CI OK only by literal substring, so a computed name evades it.

## Verification

- **Where the gates ran:** in the main checkout on `gsd/phase-13-repo-safety-test-debt`, not in an isolated worktree. A hand-rolled worktree has no `node_modules`, so the required per-commit gates could not run there. The fixes ran inline as the single writer, and every number below can be reproduced from the tree.
- **Before each fix commit:** `npm run lint` (all guards plus the guard selftest), `npm run type-check`, `npm test -- --json`, then `node scripts/guards/test-count.mjs --jest <json>`. The diff was also checked for added `.only(` / `.skip(` / `.fixme(`.
- **Baseline (88ba095):** selftest 201/201; jest 1757; test-count jest 1757 + e2e 556 = 2313 (baseline 2243) OK.
- **After all fixes (89b3553):** selftest 216/216; type-check clean; jest 1766/1766 in 105 suites; test-count jest 1766 + e2e 556 = 2322 OK. `npm run build` succeeded, and the emitted CSS is byte-identical to the baseline. `public/service-worker.js` was restored after every build.
- **Old-code proof:** each new test was run against the pre-fix file (or workflow, through `GUARD_SELFTEST_WORKFLOW_DIR`) and failed as listed above.

---

_Fixed: 2026-11-13T22:26:59Z_
_Fixer: Claude (gsd-code-fixer protocol, run inline by the dispatched agent)_
_Iteration: 1_
