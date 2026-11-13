---
phase: 13-repo-safety-test-debt
reviewed: 2026-11-13T21:49:01Z
depth: standard
files_reviewed: 94
files_reviewed_list:
  - .env.example
  - .github/workflows/ci-skip-relay.yml
  - .github/workflows/ci.yml
  - .github/workflows/upstash-keepalive.yml
  - .github/workflows/visual-baselines.yml
  - app/(site)/error.tsx
  - app/api/__tests__/feedback.test.ts
  - app/api/feedback/route.ts
  - app/layout.tsx
  - components/SafeCanvas.tsx
  - components/__tests__/SafeCanvas.test.tsx
  - components/contact/SummitRegister.tsx
  - components/contact/__tests__/SummitRegister.test.tsx
  - components/photos/Hotspots.tsx
  - components/photos/LightboxDialog.tsx
  - components/photos/PhotoViewer.tsx
  - components/photos/ZoomStage.tsx
  - components/photos/__tests__/hotspots.test.tsx
  - components/photos/__tests__/lightbox-dialog.test.tsx
  - e2e/audit.spec.ts
  - e2e/case-study.spec.ts
  - e2e/design-system.spec.ts
  - e2e/helpers/view-transitions.ts
  - e2e/home-ascent.spec.ts
  - e2e/homepage.spec.ts
  - e2e/photos-lightbox.spec.ts
  - e2e/prod/contact-form.prod.ts
  - e2e/roadmap.spec.ts
  - e2e/routes.ts
  - e2e/shell.spec.ts
  - e2e/visual/README.md
  - lib/__tests__/audit-routes.test.ts
  - lib/__tests__/css-escape.test.ts
  - lib/__tests__/home-format.test.ts
  - lib/__tests__/motion-tokens.test.ts
  - lib/__tests__/rate-limit.test.ts
  - lib/__tests__/service-worker-media.test.ts
  - lib/animations.ts
  - lib/contact/api-contract.ts
  - lib/home-format.ts
  - lib/photos/css-escape.ts
  - lib/rate-limit.ts
  - next.config.ts
  - package-lock.json
  - package.json
  - playwright.config.ts
  - public/service-worker.js
  - scripts/README.md
  - scripts/ci/check-snapshot-commit.mjs
  - scripts/ci/ci-ok.jq
  - scripts/ci/classify-changes.mjs
  - scripts/guards/__selftest__/ci-gate/bad-checks-write/.github/workflows/ci.yml
  - scripts/guards/__selftest__/ci-gate/bad-ci-ok-if/.github/workflows/ci.yml
  - scripts/guards/__selftest__/ci-gate/bad-duplicate-ci-ok/.github/workflows/ci.yml
  - scripts/guards/__selftest__/ci-gate/bad-duplicate-ci-ok/.github/workflows/other.yml
  - scripts/guards/__selftest__/ci-gate/bad-heavy-mismatch/.github/workflows/ci.yml
  - scripts/guards/__selftest__/ci-gate/bad-heavy-mismatch/scripts/ci/ci-ok.jq
  - scripts/guards/__selftest__/ci-gate/bad-missing-need/.github/workflows/ci.yml
  - scripts/guards/__selftest__/ci-gate/bad-no-dispatch/.github/workflows/ci.yml
  - scripts/guards/__selftest__/ci-gate/bad-paths-filter/.github/workflows/ci.yml
  - scripts/guards/__selftest__/ci-gate/bad-relay-checkout/.github/workflows/ci-skip-relay.yml
  - scripts/guards/__selftest__/ci-gate/bad-relay-if/.github/workflows/ci-skip-relay.yml
  - scripts/guards/__selftest__/ci-gate/bad-relay-interpolation/.github/workflows/ci-skip-relay.yml
  - scripts/guards/__selftest__/ci-gate/bad-relay-trigger/.github/workflows/ci-skip-relay.yml
  - scripts/guards/__selftest__/ci-gate/bad-token-scope/.github/workflows/ci.yml
  - scripts/guards/__selftest__/ci-gate/bad-token-scope/.github/workflows/other.yml
  - scripts/guards/__selftest__/ci-gate/good/.github/workflows/ci-skip-relay.yml
  - scripts/guards/__selftest__/ci-gate/good/.github/workflows/ci.yml
  - scripts/guards/__selftest__/ci-gate/good/scripts/ci/ci-ok.jq
  - scripts/guards/__selftest__/contrast/media-override.css
  - scripts/guards/__selftest__/palette/bad-directional/app/page.tsx
  - scripts/guards/__selftest__/palette/bad-png-untracked/e2e/.gitkeep
  - scripts/guards/__selftest__/parity/nested-floor/.github/workflows/ci.yml
  - scripts/guards/__selftest__/parity/nested-floor/.node-version
  - scripts/guards/__selftest__/parity/nested-floor/package-lock.fixture.json
  - scripts/guards/__selftest__/parity/nested-floor/package.fixture.json
  - scripts/guards/__selftest__/parity/nested-floor/scripts/guards/version-floors.json
  - scripts/guards/__selftest__/parity/nested-floor/vercel.json
  - scripts/guards/__selftest__/parity/unfloored-line/.github/workflows/ci.yml
  - scripts/guards/__selftest__/parity/unfloored-line/.node-version
  - scripts/guards/__selftest__/parity/unfloored-line/package-lock.fixture.json
  - scripts/guards/__selftest__/parity/unfloored-line/package.fixture.json
  - scripts/guards/__selftest__/parity/unfloored-line/scripts/guards/version-floors.json
  - scripts/guards/__selftest__/parity/unfloored-line/vercel.json
  - scripts/guards/check-ci-gate.mjs
  - scripts/guards/check-contrast.mjs
  - scripts/guards/check-install-parity.mjs
  - scripts/guards/check-palette.mjs
  - scripts/guards/lib/workflow-shell.mjs
  - scripts/guards/same-classnames.mjs
  - scripts/guards/selftest.mjs
  - scripts/guards/version-floors.json
  - scripts/photos/build-derivatives.mjs
  - scripts/photos/build-photo-data.mjs
findings:
  critical: 0
  warning: 5
  info: 3
  total: 8
  necessity: 0
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-11-13T21:49:01Z
**Depth:** standard
**Files Reviewed:** 94
**Status:** issues_found

## Summary

Scope: the full Phase 13 diff `b9db4ae..69d57ce`, excluding `.planning/` (94 files). I read each file's diff and the surrounding code where a change depended on it.

To confirm claims I ran these read-only checks:
- `node scripts/guards/check-ci-gate.mjs`, `check-install-parity.mjs`, `check-contrast.mjs` and `check-palette.mjs`: all OK.
- `node scripts/guards/selftest.mjs`: 201/201 passed.
- `check-ci-gate.mjs` against each `bad-*` ci-gate fixture: each one triggers the rule its name and selftest.mjs claim. The extra "ci.yml cannot be read" and "ci-ok.jq does not exist" lines are incidental, and the selftest asserts them.
- A Tailwind oxide `Scanner` probe in the scratchpad, for WR-02.
- The installed `@upstash/ratelimit` 2.2.0, `@upstash/redis` 1.41.0 and Next client error-callback sources, for WR-03 and IN-01.

No Critical issues. Other things checked and found clean:
- Production fails closed on missing credentials, a Redis error and the library's `success: true` timeout, as intended.
- The 503 `server-error` maps to the form's "Couldn't send" copy (`SummitRegister.tsx:230-232`).
- The `@firefox-43967` exclusion covers exactly the 7 tagged titles and affects the Firefox project only.
- No `.skip`, `.only` or `fixme` was added.
- The relay never checks out PR code, never interpolates an expression into a shell, and fails a fork head red.
- The lockfile moves only `@playwright/test`, `playwright` and `playwright-core` to 1.65.0, matching `package.json`, the container tags and `version-floors.json`.
- Removing the `images` block from `next.config.ts` and the `/_next/image` service-worker branch is safe: no `next/image` import is left in the tree.

Main concerns:
- **Docs-only fast path (WR-01, WR-02).** Its inputs are weaker than its comments claim. On push events it compares against `github.event.before`, which only covers the latest push. And four of its "docs" files are Tailwind source inputs.
- **Fail-closed limiter (WR-03).** It has one construction-time hole.
- **Relay (WR-04, WR-05).** The dispatched-run lookup depends on second-truncated clock comparisons. The jobs it waits on mostly have no timeout.

## Warnings

### WR-01: Push-event docs-only classification compares only the latest push, so CI OK can go green on a SHA whose branch carries untested code

**File:** `.github/workflows/ci.yml:52`, `.github/workflows/ci.yml:56`
**Issue:** `BASE` is `github.event.pull_request.base.sha || github.event.before`. On a push, that is the previous tip of the same branch, so the compare covers only the commits in this push. Before this phase, every push ran the full CI. Now the following can happen on any `ci/**` or `develop` branch (`origin/ci/13-*` exist), and on `main`:
1. A code push fails, or is cancelled or superseded.
2. A docs-only commit is pushed on top.
3. That run classifies `docs_only=true`, skips all six heavy jobs, and `ci-ok.jq:39-41` accepts the skips, so `CI OK` is green on a head that contains broken code.

Branches in the push filter that also have an open PR get two `CI OK` check runs on the same head SHA, one from `push` and one from `pull_request`. The push one is incremental and finishes in about a minute. The required check therefore depends on how GitHub picks between same-named check runs, not on the full PR diff.

The `workflow_dispatch` path gets this right: line 56 compares against `main`.

**Fix:** Classify pushes against a cumulative base, the way dispatch does. Keep `event.before` only for `main`, where the previous tip was itself gated by a PR:
```bash
if [ "$EVENT" = workflow_dispatch ]; then BASE=main; fi
if [ "$EVENT" = push ] && [ "$GITHUB_REF" != refs/heads/main ]; then BASE=main; fi
```
Or allow `docs_only=true` only for `pull_request` and `workflow_dispatch`, and print `docs_only=false` for every push. Add a selftest `changesCase` for a non-main push.

### WR-02: Four of the D-09 "docs-only" files are Tailwind source inputs, so a docs-only change can alter the production stylesheet with build and visual regression skipped

**File:** `scripts/ci/classify-changes.mjs:29`; `app/globals.css:5-8`
**Issue:** `DOCS_ONLY_FILES` contains `README.md`, `AGENTS.md`, `e2e/visual/README.md` and `.github/copilot-instructions.md`. Tailwind v4's automatic source detection scans all four:
- I built a `@tailwindcss/oxide` `Scanner` over the repo with the same four `@source not` exclusions as `globals.css` (`.planning`, `.claude`, `graphify-out`, `scripts`).
- It lists all four files as sources.
- `scripts/README.md` and `.planning/**` are the only docs-only paths excluded.

So any utility-shaped token added to one of these files ends up in the compiled CSS, while `build` and `visual-regression` are skipped as docs-only. The project already excludes `scripts` and `.planning` for this reason ("their text would otherwise emit phantom utilities"), so this is a gap in that same defence.

Two more points:
- `AGENTS.md` is rewritten by `next dev` itself (see AGENTS.md).
- The rendering risk is limited to class names already present in the DOM without a static source occurrence. But bundle drift that no CI job built is exactly what the fast path promises cannot happen.

**Fix:** Add explicit exclusions next to the existing ones, so the classifier's premise holds:
```css
@source not "../README.md";
@source not "../AGENTS.md";
@source not "../e2e/visual/README.md";
@source not "../.github";
```
Or remove those entries from `DOCS_ONLY_FILES`. Either way, add a guard or selftest that every `DOCS_ONLY_FILES` entry is outside Tailwind's sources.

### WR-03: The fail-closed limiter still throws at module scope on a malformed credential, bypassing the 503 contract

**File:** `lib/rate-limit.ts:79-87`, `lib/rate-limit.ts:121`
**Issue:** `createRateLimiter()` runs at import (`export const feedbackRateLimit = createRateLimiter()`). In `@upstash/redis` 1.41.0, `new Redis({ url, token })` builds an `HttpClient`. That constructor throws `UrlError` synchronously when the URL fails `/^https?:\/\/[^\s#$./?].\S*$/` (`node_modules/@upstash/redis/nodejs.js:141-144`). That covers:
- a pasted value with a trailing newline or space;
- a host with no `https://`;
- a quoted value.

`upstashCredentials()` accepts any non-empty string, so a bad value throws out of module evaluation. The route module then fails to load:
- Every POST gets Next's generic 500 instead of the documented 503 `server-error`. The form maps the unreadable body to "Couldn't reach the server" rather than "Couldn't send".
- The `[rate-limit]` refusal line is never written.
- The comment at line 104 says "Never throw here: `next build` imports this module", but that holds only on the no-credentials path. The T-13-07 test (`rate-limit.test.ts:270-283`) covers only that path.

The behaviour was the same with `Redis.fromEnv()` before this phase. But the phase's stated contract (refuse on unconfigured, error, timeout; never throw at import) leaves this case out.

**Fix:** Build the client inside a try/catch and degrade to the same refusal path:
```ts
let ratelimit: Ratelimit | null = null;
if (credentials) {
  try {
    ratelimit = new Ratelimit({ redis: new Redis(credentials), /* ... */ timeout: LIMIT_TIMEOUT_MS });
  } catch (error) {
    if (!production) throw error;          // keep dev loud
    // fall through: production refuses with reason 'error' on every call
  }
}
// in limit(): if (production && credentials && !ratelimit) return refuse('error');
```
Optionally `.trim()` both values in `upstashCredentials()`. Add a test with `UPSTASH_REDIS_REST_URL: 'upstash.example.test'` (no scheme) under `VERCEL_ENV=production` that expects import not to throw and `unavailable: 'error'`.

### WR-04: The relay finds its dispatched run by comparing second-truncated runner time with GitHub's `created_at`, so a small clock offset turns a good run into a red CI OK

**File:** `.github/workflows/ci-skip-relay.yml:128-148`
**Issue:**
- `since` is the runner's `date -u` truncated to whole seconds, taken before `gh workflow run`.
- The lookup keeps only runs with `created_at >= since`, where `created_at` is GitHub's clock, also truncated to seconds.
- If the runner clock is ahead of GitHub's by even a fraction of a second near a second boundary, the run GitHub creates can carry an earlier second than `since`.
- Because the lookup is a strict string `>=` on second-resolution stamps, the run is never matched.

The loop then gives up after 30 × 10 s with "The dispatched CI run did not appear within 5 minutes". That leaves a red required `CI OK` on a skip-marked head whose CI was dispatched and is actually running. The SHA check on lines 152-155 already rejects a wrong run, so the strict time floor adds no safety.

**Fix:** Widen the floor and rely on the event, branch and SHA filters:
```bash
since=$(date -u -d '-2 minutes' +%Y-%m-%dT%H:%M:%SZ)
...
--jq "[.workflow_runs[] | select(.created_at >= \"$since\" and .head_sha == \"$SHA\")] | sort_by(.created_at) | last | ..."
```
`sort_by | last` picks the newest run on this SHA, so an older manual dispatch is not chosen. Add a selftest stub case whose run `created_at` is one second before `since`.

### WR-05: Most CI jobs that the relay and CI OK wait on have no `timeout-minutes`

**File:** `.github/workflows/ci.yml:80-84` (lint-and-typecheck), `:107-113` (unit-tests), `:243-249` (build), `:280-286` (dependency-review), `:296-302` (security-audit); `.github/workflows/ci-skip-relay.yml:103`
**Issue:** This phase edited each of these jobs (new `needs: [changes]` and docs-only `if:`). Only `changes` (5), `e2e-tests` (60), `visual-regression` (45) and `ci-ok` (5) have timeouts. The other five fall back to GitHub's 360-minute default. The new relay waits at most 100 minutes (`ci-skip-relay.yml:103`). So a hung `npm ci` or Jest run gives two different results:
- On a skip-marked PR, the relay's `CI OK` goes red at 100 minutes.
- On a normal PR, ci.yml's `CI OK` stays pending for up to six hours.

This is the CI/CD rule "no job-level timeout-minutes".

**Fix:** Set explicit budgets well under the relay's 100 minutes, for example `timeout-minutes: 20` on lint-and-typecheck, unit-tests and build, and `10` on dependency-review and security-audit. Optionally have `check-ci-gate.mjs` require `timeout-minutes` on every ci.yml job.

## Info

### IN-01: SafeCanvas's new log duplicates Next's own caught-error log, and the WebGL failure is not actually silent

**File:** `components/SafeCanvas.tsx:38-41`; `components/__tests__/SafeCanvas.test.tsx:111-112`
**Issue:** The comment says the boundary "used to swallow every error" and that "the expected no-WebGL fallback stays silent". In the App Router, Next installs `onCaughtError`, which calls `console.error(thrownValue)` in production for every error caught by a custom boundary (`node_modules/next/dist/client/react-client-callbacks/error-boundary-callbacks.js:101-103`). As a result:
- A scene bug now logs twice: Next's line and `[SafeCanvas]`.
- The no-WebGL failure is still logged once, by Next.

The test only filters the boundary's own `[SafeCanvas]` calls, so it cannot see this.
**Fix:** Reword the comment ("adds a tagged log for scene bugs; Next already reports every caught error"), or drop the extra `console.error` if the tag adds nothing.

### IN-02: ci-gate rules 11 and 12 only inspect `run:` blocks, so a `with:` input to an action (for example `actions/github-script` `script:`) can interpolate untrusted event fields unflagged

**File:** `scripts/guards/check-ci-gate.mjs:570-578` (rule 12), `:539-542` (rule 11)
**Issue:** The relay runs under `pull_request_target`. The guard's header promises the relay can "never interpolate an expression into a shell". But `${{ github.event.pull_request.title }}` inside `script:` of `actions/github-script`, or any other action input that evaluates code, passes both rules. Today's relay has no such step. This is a guard-coverage gap for future edits.
**Fix:** In `checkRelay`, also fail on `${{` in any `with:` value of a non-checkout `uses:` step, or allow only `uses:` of a fixed list (none today).

### IN-03: Rule 5 detects a second CI OK only by literal substring, so a computed name evades it

**File:** `scripts/guards/check-ci-gate.mjs:472-484`
**Issue:** `findCiOkOutsideCi` matches `jobName(job).includes('CI OK')`. A job named `${{ format('CI {0}', 'OK') }}` (or `'CI ' + ...` built through `needs` outputs) produces a check run named `CI OK` that the guard does not see. Low likelihood, since this guards the owner's own edits rather than an attacker, but the header claims "no workflow other than ci.yml has a job whose `name:` includes CI OK" as a structural guarantee.
**Fix:** Also flag any job `name:` outside ci.yml that contains `${{` and is not the allowed relay shape. A non-relay workflow has no need for expression job names.

---

_Reviewed: 2026-11-13T21:49:01Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
