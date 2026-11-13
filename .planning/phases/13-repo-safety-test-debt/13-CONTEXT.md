# Phase 13: Repo Safety & Test Debt - Context

**Gathered:** 2026-11-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase guarantees that a red pull request can no longer reach `main` or production, and proves that the contact form's rate limiter works in production. It also closes the test and cleanup debt that has to be settled before the v2.1 refactors start. Requirements: GUARD-07, GUARD-08, GUARD-09, DEPS-06, VERIFY-05, VERIFY-06, VERIFY-07, CLEAN-01.

Deliverables:
- **Merge gate.** One aggregate `CI OK` check plus a `main` ruleset that requires it. A PR whose head commit carries `[ci skip]` still gets a final result on that check.
- **Production gate.** Production deploys wait on `CI OK` through Vercel Deployment Checks. If Hobby doesn't offer them, the residual risk is recorded instead.
- **Rate limiter.** Fails closed in production when unconfigured or unreachable. A daily keep-alive also acts as its monitor, and the live 429 probe has been run.
- **Playwright 1.65** and its container tag land in one commit, re-baselined alone (closes #140).
- **Audit gate.** Takes its routes from the site's data and covers `/projects/coin-flip` and every photo slug.
- **Photo-script tests.** G5 and G6 regression tests for the photo scripts land before Phase 15 rewrites them.
- **Ledger triage.** Every open review-ledger row from Phases 7, 9, 10 and 12 is triaged.
- **CLEAN-01 removals,** with no visual diff.

No UI change. The only pixel change allowed is the Playwright 1.65 re-baseline.

</domain>

<decisions>
## Implementation Decisions

### Ruleset & bypass (GUARD-07)
- **D-01:** The new `main` ruleset has an **empty bypass list**. Nobody can bypass it, Tim included. In an emergency, Tim disables the ruleset in Settings → Rules, which is a visible, deliberate act. The ruleset must make a deliberately red PR unmergeable for everyone. Its rules: deletion, non_fast_forward, pull_request with 0 required approvals, and required_status_checks requiring only `CI OK`, pinned to the GitHub Actions integration (id 15368 per research; confirm before applying). Strict up-to-date stays off. Starting template: `.planning/research/STACK.md` §5.3, with the `bypass_actors` entry removed. — **Reversibility:** reversible — a settings change Tim can edit or disable at any time.
- **D-02:** **Delete** the inert `automated-actions` ruleset (id 10401314). It targets no branch, and it carries deletion, non-fast-forward and code-owner-review rules plus an Integration bypass (actor 29110). Before deleting it, save its full JSON export (`gh api repos/{owner}/{repo}/rulesets/10401314`) in the phase folder so it can be recreated. — **Reversibility:** reversible — the saved export can be re-POSTed.
- **D-03:** The ruleset allows **merge commits only** (`allowed_merge_methods: ["merge"]`). This matches every PR from #109 to #142; planning docs cite branch SHAs that a squash or rebase would orphan. Side effect: README edits from the GitHub web editor (as in cf7975b) must go through "Propose changes" and a PR.
- **D-04:** **Tim applies the settings himself with prepared `gh` commands.** The agent writes `main-ruleset.json` and the delete command, and Tim reviews them. Tim then runs `! gh api -X POST repos/{owner}/{repo}/rulesets --input …` and the delete himself, so the output lands in the session. The agent verifies straight away with `gh api repos/{owner}/{repo}/rules/branches/main` and diffs the result against the JSON. The agent never applies a settings change.
- **D-05 (sequencing, follows from D-04):** The ruleset goes live **only after the `CI OK` job (with D-06 and D-08) has reached `main`**. Otherwise Dependabot PRs and branches cut from the old `main` would wait forever on a check their workflow never produces. Phase 13 therefore needs a **mid-phase PR to `main`** carrying the CI changes; Tim merges it. The ruleset, the proofs (D-10) and the Deployment Checks setting come after that.

### Skipped CI & deploys (GUARD-08)
- **D-06:** **A PR head marked `[ci skip]` still runs the full CI.**
  - **Trigger.** A small companion workflow spots a skip marker on a same-repo PR head. Markers: `[skip ci]`, `[ci skip]`, `[no ci]`, `[skip actions]`, `[actions skip]`, `skip-checks: true`. It then dispatches the normal `ci.yml` for that commit via `workflow_dispatch`. GitHub honours skip markers only on `push` and `pull_request` events, and a `workflow_dispatch` sent with `GITHUB_TOKEN` still creates a run.
  - **Result.** The PR gets a real `CI OK` on its head SHA. The GSD ship note (`docs(NN): ship phase NN — PR #N [ci skip]`) then merges without a recovery commit.
  - **Forks.** A fork PR with a marker gets a red `CI OK`.
  - **Safety constraints.**
    - Never check out or run PR code inside a `pull_request_target` context.
    - Never define a second job named `CI OK` that an `if:` could skip, because GitHub reports a job skipped that way as Success.
    - Keep check names unique across workflows.
  - **Amendment (2026-11-12, Tim, after research — supersedes the Trigger mechanism above):** GitHub's "Troubleshooting required status checks" page states that checks from a `workflow_dispatch` run "do not satisfy a required status check in a branch ruleset"; only `push`, `pull_request`, `pull_request_review`, `pull_request_target`, `deployment` and `deployment_status` count. Tim chose **option A, the relay mirror** (13-RESEARCH.md Pattern 2, Open Question 1): a `pull_request_target` workflow that never checks out PR code detects the marker, confirms GitHub really skipped the `pull_request` CI run, dispatches `ci.yml`, waits for that run and mirrors its conclusion under the check name `CI OK` (job name set through `needs`, no job-level `if:`). On unmarked heads the relay job carries a different name. Accepted exception to "unique check names": on marked heads only, both the relay and the dispatched run emit `CI OK`. Fork PRs with a marker still get a red `CI OK`. **Fallback:** if D-10's `[ci skip]` proof shows the relay's check is not counted on the PR head SHA, switch to option B (eligible `CI OK` that fails fast with "push a commit without the marker"); if that is not counted either, option C (pending until a new push), recorded as an accepted risk in PROJECT.md Key Decisions.
- **D-07:** **Production gate: Vercel Deployment Checks requiring `CI OK`** are the primary mechanism. Vercel's changelog says they work for every GitHub-connected project; Tim confirms availability in the Hobby dashboard before setting them up. Production then promotes about 40 minutes after a merge, once CI finishes. **Fallback if Hobby lacks them:** the ruleset alone (D-01) stands, and the merge-commit residual is written down as an accepted risk in PROJECT.md Key Decisions. That residual: the merge commit deploys before its own CI finishes, and with strict off it isn't byte-identical to the tested head. Deploying production from GitHub Actions and turning on strict up-to-date checks were both considered and rejected.
- **D-08:** **Docs-only fast path inside `CI OK`.** Tim chose this over the recommended "every PR runs all".
  - A `changes` job diffs the PR against its base. For `workflow_dispatch` (D-06) and push runs, it uses the merge-base with `main` or the pushed range.
  - When every changed path is docs-only, the heavy jobs skip and `CI OK` accepts those skips as intended.
  - A path that can't be classified, or a diff that can't be computed, runs the full CI.
  - The fast path lives **inside** the workflow (a job plus job-level conditions). Workflow-level `paths:` or `paths-ignore:` filters stay banned, because a workflow skipped that way leaves the required check pending. A guard or test fails if `ci.yml` gains one.
- **D-09:** **Docs-only paths** are `.planning/**` plus an explicit list: `README.md`, `AGENTS.md`, `scripts/README.md`, `e2e/visual/README.md`, `.github/copilot-instructions.md`.
  - Never a blanket `*.md`: `scripts/guards/__selftest__/served-images/*/README.md` are guard selftest fixtures.
  - `app/globals.css` already has `@source not "../.planning"`, so Tailwind output can't depend on `.planning`.
- **D-10:** **The agent runs the live proofs with throwaway PRs.** It pushes `ci/13-*` branches and opens **draft** PRs for three cases:
  - a deliberately red test, which must not merge;
  - a head commit carrying `[ci skip]`, which must get a final `CI OK`;
  - a docs-only diff, which must take the fast path.

  For each, it records `mergeStateStatus` and the `gh pr merge` refusal, then closes the PR and deletes the branch. Nothing is merged. Direct-push blocking is proven only from the `gh api …/rules/branches/main` output, **never by a live push to `main`**. Scope of Tim's answer: it covers the `ci/13-*` branch pushes and draft PRs for these three proofs. It does **not** create a standing approval for other `ci/13-*` pushes, such as the visual re-baseline dispatch. Ask Tim for those, because the existing standing approval covers only `ci/07-NN` to `ci/12-NN`.

### Limiter failure mode (GUARD-09)
- **D-11 (locked by GUARD-09):** In production, an unconfigured or unreachable limiter **refuses** the submission. That covers missing variables, Redis errors and `@upstash/ratelimit` timeouts, whose default lets the request through. Visitors see the existing send-failure state, so nothing in the UI changes. That state reads "Couldn't send. Your message is still here. Try again, or email me at …" (`components/contact/SummitRegister.tsx`, where `server-error` and `send-failed` map to `failure.kind: 'send'`).
- **D-12:** **Fail-closed applies only when `VERCEL_ENV === 'production'`.** Previews and local dev keep the allow-all fallback and its warning, so preview UAT and local Playwright runs need no Redis.
- **D-13:** A **daily keep-alive** stops Upstash's free-tier archival after about 14 days without traffic. Without it, the fail-closed form would quietly go down.
- **D-14:** **The keep-alive doubles as the monitor.** It runs as a **scheduled GitHub workflow** that PINGs Redis through the REST API and fails if it can't, and GitHub then emails Tim about the failed run.
  - Tim adds the Upstash REST URL and token as repository secrets. That's a Tim input, and the secret names must match whichever pair `vercel env ls production` shows.
  - The workflow must stay out of `CI OK` and never run on PRs.
  - GitHub pauses scheduled workflows after 60 days without repo activity and warns by email first. Record that.
  - Vercel Hobby keeps runtime logs for only about an hour, so a logged error alone is not a monitor.
- **D-15:** **The live 429 probe runs once from Tim's machine**, using the existing `PROD_FORM_LIMIT=1 npm run test:prod-form` (`e2e/prod/contact-form.prod.ts`, 6 honeypot POSTs, 429 expected on the sixth). It runs after the production variable names are confirmed and the fail-closed code is deployed. Tim runs it, or explicitly approves the agent running it. It locks Tim's IP out of the form for up to an hour, which is harmless.

### Ledger triage (VERIFY-07)
- **D-16:** **The agent proposes, and Tim approves one table.** The agent checks each of the 44 open rows against the current code:
  - Phase 7: WR-01 to WR-07 and 16 IN rows.
  - Phase 9: 6 IN rows.
  - Phase 10: IN-01 to IN-10.
  - Phase 12: IN-08 to IN-12.

  It proposes one disposition per row: **already fixed** (citing the commit), **fix now**, **accept with a reason**, **hand to a later phase or requirement**. Tim approves or overrides the whole table at a single checkpoint, and fixes start only after that. Rows already owned by v2.1 requirements are disposed as handed over: 07 WR-06 to SHELL-07 (Phase 14), 07 WR-05 to DEPS-06, 12 IN-11 to GUARD-09.
- **D-17:** Rows in code that a later v2.1 phase rewrites or retires are **handed to that phase**, not fixed now. For example, the Phase 10 rows on the carousel, lightbox stepping and view switch go to Phase 18, and photo-script rows go to Phase 15. Each becomes a note in that phase's scope, or a requirement if it describes behaviour the rewrite must keep, and its ledger entry points there. UI fixes go to Phase 14, as the ROADMAP scope notes already say. Any other new requirement gets an ID in REQUIREMENTS.md and a phase.
- **D-18:** For rows whose code survives: **fix when the fix is cheap, pixel-neutral and testable**, and **accept with a written reason** when it is costly, risky or purely cosmetic in tests. Guard and test-quality rows lean towards fixing, because a guard that misses things undermines the whole gate. Examples: 07 WR-01 to WR-04, IN-06, IN-07, IN-17, and 10 IN-09.
- **D-19:** **The record lives in two places, with Phase 13 as the source.** `13-LEDGER-TRIAGE.md` holds every row's disposition, reason, commit or owner, and Tim's approval. Each archived `*-REVIEW-DISPOSITION.md` row under `.planning/milestones/v2.0-phases/` changes from `open` to its final status and points to that file, so neither place reads stale.

### Carried forward (decided earlier, not re-asked)
- **Playwright 1.65 (DEPS-06).** `@playwright/test` and both `mcr.microsoft.com/playwright:v1.64.1-noble` tags in `ci.yml` (E2E and Visual Regression) move together in **one commit**, because `scripts/guards/check-install-parity.mjs` fails a split bump. It is re-baselined **alone**, before any intended visual change, and closes Dependabot PR #140.
- **Visual baselines** come only from the CI `workflow_dispatch` container (`visual-baselines.yml`). Claude dispatches the run, downloads the result and compares it; only Tim commits and pushes PNGs. A diff is handled by the zero-diff exception policy: a verified upstream fix that matches the code's intent, Tim's explicit approval, a documented reason and per-slug checks.
- **Settings changes are always Tim's.** Repo settings, Vercel settings, secrets and the Upstash variables are never applied by an agent.
- **VERIFY-06 (G5/G6) must land before Phase 15** refactors the photo scripts. These are characterization tests: red on a seeded fault, green on the current code.

### Claude's Discretion
- **The `CI OK` job's shape.** `if: always()`, `needs:` every CI job. It fails unless every need is `success`, or is an intended skip: `dependency-review` on non-PR events, or a heavy job skipped by D-08's docs-only result. Use a `jq` check over `toJSON(needs)` or similar.
- **The D-06 companion workflow's mechanics.** The event choice, how it finds the head commit message, and how a fork PR gets its red result.
- **The D-08 `changes` job's mechanics.** Which jobs count as "heavy": lint and typecheck, unit tests, E2E, visual, build and security audit are the expected set; the planner decides.
- **Upstash variable names.** Accept both the `UPSTASH_REDIS_REST_URL`/`_TOKEN` pair and the `KV_REST_API_URL`/`_TOKEN` pair, then confirm with `npx vercel@latest env ls production` (names only, never `env pull`).
- **Fail-closed details.** The HTTP status for a refusal (503 suggested) and the response code: reuse `server-error`, or add a code that maps to the existing `send` failure copy. A new code must keep `FEEDBACK_CODES` and the form's mapping in sync, and the UI must not change. Also the limiter timeout value and the structured per-refusal log line, which replaces the warn-once. Unit tests cover the unconfigured, error and timeout paths in production and the allow path in preview and dev.
- **Keep-alive details.** Schedule time, REST command (PING or a touch of a dedicated key) and secret names.
- **G5 and G6 testability.** Either move `zurichOffset`/`buildCapture` into an importable module, or add `--sidecar`/`--corrections`/`--out-dir` flags with selftest fixtures (see `10-VALIDATION.md` rows G5 and G6). Pick what Phase 15's rewrite is least likely to break.
- **Audit gate.** Derive the routes from the site's data rather than by index. Pitfall 1 warns that `buildPhotoViews()[0]` shifts when photos are added. Every template runs in all three engines at 375, 768 and 1440, and every photo slug runs at least once in Chromium. Keep E2E under about 45 minutes; it is about 37 of 60 today with `workers: 1`. Sharding or a matrix is allowed, because only `CI OK` is required and job renames no longer touch settings.
- **CLEAN-01 removals.** `TILT_CONFIG`, `cssDuration` and `cssEase` (`lib/animations.ts`, used only by `lib/__tests__/motion-tokens.test.ts`), the `images` block in `next.config.ts`, the `/_next/image` branch in `public/service-worker.js`, the two commented "Optimize images" steps in `ci.yml` and `<link rel="dns-prefetch" href="https://vercel.com">` in `app/layout.tsx`. Prove each is unused before removing it; the scout found `next/image` only in comments in `lib/og/template.tsx`. Then show no visual diff.
- **Mid-phase PR scope (D-05).** The agent decides what goes into it, beyond the CI changes.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` §"Phase 13: Repo Safety & Test Debt": goal, 5 success criteria, research note (identifiers to confirm), Tim's inputs, scope notes
- `.planning/REQUIREMENTS.md`: GUARD-07, GUARD-08, GUARD-09, DEPS-06, VERIFY-05, VERIFY-06, VERIFY-07, CLEAN-01
- `.planning/PROJECT.md`: Key Decisions (zero-diff exception policy; baselines only from the CI container, only Tim commits PNGs; the `gsd/phase-NN-*` branch convention marked "Revisit"), Context "Known tech debt", Constraints

### Repo safety research
- `.planning/research/STACK.md` §5 "Repo safety": ruleset vs classic protection, skipped-CI semantics table (§5.2), the recommended `CI OK` job and ruleset JSON (§5.3, minus the bypass actor per D-01), Upstash confirmation steps (§5.4)
- `.planning/research/PITFALLS.md`: Pitfall 15 (required checks that deadlock or pass vacuously), Pitfall 16 (limiter fails open or closed by accident), Pitfall 11 (test-count ratchet, audit gate and CI time), Pitfall 10 (baseline churn: Playwright 1.65 alone first), Pitfall 23 (G5/G6 before the refactor), Pitfall 1 (index-based test fixtures), and the "Looks done but isn't" checklist
- `.planning/research/SUMMARY.md`: Phase 1 delivery list (this phase), D10 "Repo settings (Tim applies them)", the confidence notes on Vercel Deployment Checks, `integration_id` 15368, admin role id and the Upstash variable names
- `~/.claude/gsd-core/workflows/ship.md` lines ~498–540: the GSD ship note commit that writes `[ci skip]` and its zero-checks recovery (the reason for D-06)
- Vercel Deployment Checks: https://vercel.com/docs/deployment-checks and https://vercel.com/changelog/block-vercel-deployment-promotions-with-github-actions (availability on Hobby still needs confirming in the dashboard)

### Test debt
- `.planning/milestones/v2.0-MILESTONE-AUDIT.md`: the v2.0 debt list and ledger counts
- `.planning/milestones/v2.0-phases/10-photography/10-VALIDATION.md`: rows G5 and G6 (what to test, why it was deferred, the suggested testability change)
- `e2e/visual/README.md`: the visual baseline protocol

### Review ledgers (VERIFY-07)
- `.planning/milestones/v2.0-phases/07-foundation-guardrails/07-REVIEW.md` and `07-REVIEW-DISPOSITION.md`
- `.planning/milestones/v2.0-phases/09-home-ascent/09-REVIEW.md` and `09-REVIEW-DISPOSITION.md`
- `.planning/milestones/v2.0-phases/10-photography/10-REVIEW.md`, `10-REVIEW-FIX.md` and `10-REVIEW-DISPOSITION.md`
- `.planning/milestones/v2.0-phases/12-contact-edge-pages-cleanup-verification/12-REVIEW.md` and `12-REVIEW-DISPOSITION.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.github/workflows/ci.yml`: 7 jobs (`lint-and-typecheck`, `unit-tests`, `e2e-tests` with a 60-min limit, `visual-regression` with a 45-min limit, `build` with `needs: [lint-and-typecheck, unit-tests]`, `dependency-review` gated by `if: github.event_name == 'pull_request'`, `security-audit`). Push triggers: `main`, `develop`, `ci/**`. PR triggers: `main`, `develop`. **No path filters.** No `workflow_dispatch` yet, which D-06 needs.
- `.github/workflows/visual-baselines.yml`: the `workflow_dispatch` re-baseline flow, used for DEPS-06. `scripts/ci/check-visual-run.mjs` looks up the "Visual Regression" job by name, so keep that name or update the script.
- `scripts/guards/check-install-parity.mjs`: enforces container tag == lockfile `@playwright/test` version.
- `scripts/guards/test-count.mjs` and its baseline: the test-count ratchet, which new tests raise and rewritten view tests must not drop.
- `e2e/prod/contact-form.prod.ts` and `playwright.prod.config.ts`: the opt-in production probes (`PROD_FORM_SEND`, `PROD_FORM_LIMIT`). The 429 probe is already written.
- `e2e/routes.ts`: the shared `ROUTES` list read by `audit.spec.ts`, `keyboard.spec.ts`, `seo.spec.ts` and `shell.spec.ts`. It currently audits only `buildPhotoViews()[0]` and `/projects/box`.
- `e2e/audit.spec.ts`: the permanent production audit gate. It checks axe, CLS, links, images, CSP events and the console at `WIDTHS = [375, 768, 1440]`, plus the interactive-state tests.
- `scripts/guards/selftest.mjs`: the guard selftest harness, a natural home for G6 fixtures (`served-images` fixtures live under `scripts/guards/__selftest__/`).

### Established Patterns
- Opt-in production probes use env flags and are never part of default CI (`PROD_FORM_*`).
- Every page carries a WebKit tag with a reason comment; `test.skip` is never used (12-23). CI runs with `--fail-on-flaky-tests` and 2 retries.
- `lib/rate-limit.ts` builds the Upstash limiter only when `UPSTASH_REDIS_REST_URL` and `_TOKEN` are set, and otherwise uses an allow-all mock that warns once. `app/api/feedback/route.ts` runs the limiter **before** body parse, zod and the honeypot (CONTACT-03), so the honeypot probe exercises it. An error the limiter throws falls into the outer `catch`, which returns a 500 `server-error`.
- `lib/contact/api-contract.ts`: `FEEDBACK_CODES` (`ok`, `validation`, `origin-rejected`, `rate-limited`, `send-failed`, `server-error`) and the log events. `SummitRegister.tsx` `outcomeOf` maps `send-failed` and `server-error` to the `send` failure copy.
- `vercel.json`: `git.deploymentEnabled.main: true`, `installCommand: npm ci`.

### Integration Points
- The `CI OK` job goes at the end of `ci.yml`, and D-06's companion workflow sits beside it. Its required-check name must be unique across `.github/workflows/*`.
- The ruleset JSON and the `automated-actions` export (D-02) are stored in the phase folder; the agent decides the exact file names.
- The fail-closed branch goes in `lib/rate-limit.ts` (`createRateLimiter`), with unit tests beside the existing `lib/__tests__`.
- The new keep-alive workflow goes in `.github/workflows/`, scheduled only.
- The audit gate's data source is `lib/photos/view-model.ts` (`buildPhotoViews`) and `data/projects.ts`. Phase 15 introduces `lib/photos/routes.ts` and the region registries, so keep the derivation easy to point at them.

</code_context>

<specifics>
## Specific Ideas

- Tim chose the docs-only fast path (D-08) over the recommended "every PR runs all". Keep it narrow: the explicit path list from D-09, and full CI whenever the diff can't be classified.
- Proofs must never risk a production deploy. That is why there's no live push to `main` in D-10, and why the ruleset goes live only after `CI OK` is on `main` (D-05).
- The limiter's failure must be visible to Tim within a day (D-14). A visitor finding a broken form must not be the first signal.

</specifics>

<deferred>
## Deferred Ideas

None came up. The discussion stayed within Phase 13's scope.

These are known debt outside Phase 13's requirements and were not discussed. They're listed so the planner doesn't pull them in:
- the 7 untriaged code-scanning alerts and the CodeQL failure on PR #109;
- the R3F `THREE.Clock` warning, waiting on upstream;
- the `caniuse-lite` refresh, which needs Tim;
- 08 review CR-01, which stays deferred under D-12 of v2.0.

</deferred>

---

*Phase: 13-repo-safety-test-debt*
*Context gathered: 2026-11-12*
