# Phase 13: Repo Safety & Test Debt - Research

**Researched:** 2026-11-12
**Domain:** GitHub Actions merge gating (rulesets, aggregate check, skip-marker relay), Vercel Deployment Checks, Upstash rate-limiter failure modes, Playwright 1.65 upgrade, Playwright audit-gate route derivation, Node build-script characterization tests, review-ledger triage
**Confidence:** MEDIUM-HIGH (repo facts HIGH; one locked mechanism, D-06, is contradicted by GitHub's docs, see Open Question 1)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Ruleset & bypass (GUARD-07)
- **D-01:** The new `main` ruleset has an **empty bypass list**. Nobody can bypass it, Tim included. In an emergency, Tim disables the ruleset in Settings → Rules, which is a visible, deliberate act. The ruleset must make a deliberately red PR unmergeable for everyone. Its rules: deletion, non_fast_forward, pull_request with 0 required approvals, and required_status_checks requiring only `CI OK`, pinned to the GitHub Actions integration (id 15368 per research; confirm before applying). Strict up-to-date stays off. Starting template: `.planning/research/STACK.md` §5.3, with the `bypass_actors` entry removed. — **Reversibility:** reversible — a settings change Tim can edit or disable at any time.
- **D-02:** **Delete** the inert `automated-actions` ruleset (id 10401314). It targets no branch, and it carries deletion, non-fast-forward and code-owner-review rules plus an Integration bypass (actor 29110). Before deleting it, save its full JSON export (`gh api repos/{owner}/{repo}/rulesets/10401314`) in the phase folder so it can be recreated. — **Reversibility:** reversible — the saved export can be re-POSTed.
- **D-03:** The ruleset allows **merge commits only** (`allowed_merge_methods: ["merge"]`). This matches every PR from #109 to #142; planning docs cite branch SHAs that a squash or rebase would orphan. Side effect: README edits from the GitHub web editor (as in cf7975b) must go through "Propose changes" and a PR.
- **D-04:** **Tim applies the settings himself with prepared `gh` commands.** The agent writes `main-ruleset.json` and the delete command, and Tim reviews them. Tim then runs `! gh api -X POST repos/{owner}/{repo}/rulesets --input …` and the delete himself, so the output lands in the session. The agent verifies straight away with `gh api repos/{owner}/{repo}/rules/branches/main` and diffs the result against the JSON. The agent never applies a settings change.
- **D-05 (sequencing, follows from D-04):** The ruleset goes live **only after the `CI OK` job (with D-06 and D-08) has reached `main`**. Otherwise Dependabot PRs and branches cut from the old `main` would wait forever on a check their workflow never produces. Phase 13 therefore needs a **mid-phase PR to `main`** carrying the CI changes; Tim merges it. The ruleset, the proofs (D-10) and the Deployment Checks setting come after that.

#### Skipped CI & deploys (GUARD-08)
- **D-06:** **A PR head marked `[ci skip]` still runs the full CI.**
  - **Trigger.** A small companion workflow spots a skip marker on a same-repo PR head. Markers: `[skip ci]`, `[ci skip]`, `[no ci]`, `[skip actions]`, `[actions skip]`, `skip-checks: true`. It then dispatches the normal `ci.yml` for that commit via `workflow_dispatch`. GitHub honours skip markers only on `push` and `pull_request` events, and a `workflow_dispatch` sent with `GITHUB_TOKEN` still creates a run.
  - **Result.** The PR gets a real `CI OK` on its head SHA. The GSD ship note (`docs(NN): ship phase NN — PR #N [ci skip]`) then merges without a recovery commit.
  - **Forks.** A fork PR with a marker gets a red `CI OK`.
  - **Safety constraints.**
    - Never check out or run PR code inside a `pull_request_target` context.
    - Never define a second job named `CI OK` that an `if:` could skip, because GitHub reports a job skipped that way as Success.
    - Keep check names unique across workflows.
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

#### Limiter failure mode (GUARD-09)
- **D-11 (locked by GUARD-09):** In production, an unconfigured or unreachable limiter **refuses** the submission. That covers missing variables, Redis errors and `@upstash/ratelimit` timeouts, whose default lets the request through. Visitors see the existing send-failure state, so nothing in the UI changes. That state reads "Couldn't send. Your message is still here. Try again, or email me at …" (`components/contact/SummitRegister.tsx`, where `server-error` and `send-failed` map to `failure.kind: 'send'`).
- **D-12:** **Fail-closed applies only when `VERCEL_ENV === 'production'`.** Previews and local dev keep the allow-all fallback and its warning, so preview UAT and local Playwright runs need no Redis.
- **D-13:** A **daily keep-alive** stops Upstash's free-tier archival after about 14 days without traffic. Without it, the fail-closed form would quietly go down.
- **D-14:** **The keep-alive doubles as the monitor.** It runs as a **scheduled GitHub workflow** that PINGs Redis through the REST API and fails if it can't, and GitHub then emails Tim about the failed run.
  - Tim adds the Upstash REST URL and token as repository secrets. That's a Tim input, and the secret names must match whichever pair `vercel env ls production` shows.
  - The workflow must stay out of `CI OK` and never run on PRs.
  - GitHub pauses scheduled workflows after 60 days without repo activity and warns by email first. Record that.
  - Vercel Hobby keeps runtime logs for only about an hour, so a logged error alone is not a monitor.
- **D-15:** **The live 429 probe runs once from Tim's machine**, using the existing `PROD_FORM_LIMIT=1 npm run test:prod-form` (`e2e/prod/contact-form.prod.ts`, 6 honeypot POSTs, 429 expected on the sixth). It runs after the production variable names are confirmed and the fail-closed code is deployed. Tim runs it, or explicitly approves the agent running it. It locks Tim's IP out of the form for up to an hour, which is harmless.

#### Ledger triage (VERIFY-07)
- **D-16:** **The agent proposes, and Tim approves one table.** The agent checks each of the 44 open rows against the current code:
  - Phase 7: WR-01 to WR-07 and 16 IN rows.
  - Phase 9: 6 IN rows.
  - Phase 10: IN-01 to IN-10.
  - Phase 12: IN-08 to IN-12.

  It proposes one disposition per row: **already fixed** (citing the commit), **fix now**, **accept with a reason**, **hand to a later phase or requirement**. Tim approves or overrides the whole table at a single checkpoint, and fixes start only after that. Rows already owned by v2.1 requirements are disposed as handed over: 07 WR-06 to SHELL-07 (Phase 14), 07 WR-05 to DEPS-06, 12 IN-11 to GUARD-09.
- **D-17:** Rows in code that a later v2.1 phase rewrites or retires are **handed to that phase**, not fixed now. For example, the Phase 10 rows on the carousel, lightbox stepping and view switch go to Phase 18, and photo-script rows go to Phase 15. Each becomes a note in that phase's scope, or a requirement if it describes behaviour the rewrite must keep, and its ledger entry points there. UI fixes go to Phase 14, as the ROADMAP scope notes already say. Any other new requirement gets an ID in REQUIREMENTS.md and a phase.
- **D-18:** For rows whose code survives: **fix when the fix is cheap, pixel-neutral and testable**, and **accept with a written reason** when it is costly, risky or purely cosmetic in tests. Guard and test-quality rows lean towards fixing, because a guard that misses things undermines the whole gate. Examples: 07 WR-01 to WR-04, IN-06, IN-07, IN-17, and 10 IN-09.
- **D-19:** **The record lives in two places, with Phase 13 as the source.** `13-LEDGER-TRIAGE.md` holds every row's disposition, reason, commit or owner, and Tim's approval. Each archived `*-REVIEW-DISPOSITION.md` row under `.planning/milestones/v2.0-phases/` changes from `open` to its final status and points to that file, so neither place reads stale.

#### Carried forward (decided earlier, not re-asked)
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

### Deferred Ideas (OUT OF SCOPE)
None came up. The discussion stayed within Phase 13's scope.

These are known debt outside Phase 13's requirements and were not discussed. They're listed so the planner doesn't pull them in:
- the 7 untriaged code-scanning alerts and the CodeQL failure on PR #109;
- the R3F `THREE.Clock` warning, waiting on upstream;
- the `caniuse-lite` refresh, which needs Tim;
- 08 review CR-01, which stays deferred under D-12 of v2.0.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GUARD-07 | A red PR cannot merge into `main`: one aggregate required check on every CI job, ruleset requires it, verified via `gh api` and a red test PR | §"CI inventory" (7 jobs, names verbatim), `CI OK` job example, ruleset JSON with verified `integration_id` 15368, current ruleset/rules state from `gh api`, a new `check-ci-gate.mjs` guard so a new job cannot escape `CI OK`, Pitfall "draft PRs cannot prove a merge refusal" |
| GUARD-08 | `[ci skip]` or path filters never leave the check pending forever nor reach production unchecked | **Open Question 1**: GitHub docs say `workflow_dispatch` checks do not satisfy a ruleset; recommended relay mechanism on `pull_request_target`; `changes` job design (D-08/D-09); Vercel Deployment Checks facts (D-07) |
| GUARD-09 | Upstash limiter confirmed live (variables set, 6th honeypot → 429); production never silently allows all | Limiter code path today (fail-open on missing vars, 500 on Redis error, **allow on 5 s timeout** verified in `@upstash/ratelimit` source), both name pairs read by `Redis.fromEnv()` (verified), fail-closed sketch, keep-alive workflow, probe wording mismatch, sequencing pitfall (env confirm before merge) |
| DEPS-06 | Playwright 1.65 + container tag in one commit, re-baselined alone, closes #140 | 1.65.0 on npm (published 2026-11-05) and `v1.65.0-noble` on MCR verified; **four** tag sites (not two); 1.65 notable changes (Node 26 in image, accessible-name change, test.skip signature); #140's CI failure explained |
| VERIFY-05 | Audit gate covers `/projects/coin-flip` and every photo slug; each template in 3 engines, each slug once in Chromium; new region pages join automatically | `ROUTES` today (index-based), `sitemap.ts` as the single data source, template-coverage test, ratchet-safe looping test |
| VERIFY-06 | G5 (wrong offset fails `photos:build`) and G6 (invalid source keeps derivatives, exit 1) | Both scripts read fixed `ROOT` paths; `--root` flag (repo precedent) + selftest cases with temp roots; exact error strings to assert |
| VERIFY-07 | All 44 open ledger rows triaged | Full proposed triage table below, each row checked against current code |
| CLEAN-01 | Remove `TILT_CONFIG`, `cssDuration`, `cssEase`, `images` block, SW `/_next/image` branch, commented CI steps, vercel.com `dns-prefetch` with no visual diff | Per-target file:line and reference check; Next 16.4 docs on `images` defaults; ratchet effect of deleting 2 helper tests |
</phase_requirements>

## Project Constraints (from AGENTS.md and the user's global CLAUDE.md)

No `./CLAUDE.md` or `./.claude/CLAUDE.md` exists. `AGENTS.md` and the user's global instructions apply:

- **AGENTS.md:** "This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` … before writing any code. Heed deprecation notices." Next.js is `16.4.5` [VERIFIED: node_modules/next/package.json:3]. The `images` facts below were read from `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`.
- **AGENTS.md:** the block is re-added by `next dev`; committing it keeps the tree clean.
- **Global (developer profile):** before modifying working code, verify the change is safe and flag regression risks explicitly; present decisions as comparison tables and let Tim decide; pair code with 1–2 sentence explanations.
- **Project memory (binding conventions):** settings files are never touched by an agent; only Tim commits PNGs; force pushes and `main` pushes are excluded from standing approvals; never tell a subagent "Tim approved X" without his literal reply; search with `git grep` (a recursive grep reaches `.env.local`); stop `next start` before `npm ci`.
- **Project skills** (`.claude/skills/`: banner-design, brand, design, design-system, slides, ui-styling, ui-ux-pro-max) are all UI/design skills. This phase has no UI change, so none applies; if a ledger row turns into a UI fix it goes to Phase 14, where `ui-ux-pro-max` is required.

## Summary

The phase is mostly well-trodden GitHub/Vercel configuration plus test debt, and the repo makes most of it straightforward: `ci.yml` has no path filters, every check run on `main` comes from the GitHub Actions app (id 15368, verified), there are no active rules on `main` today (`gh api …/rules/branches/main` returns `[]`, classic protection 404s), and the guard selftest harness is a ready home for script tests. The limiter, audit gate and photo scripts each have one clear seam to change.

**One locked mechanism does not work as written.** D-06 says a companion workflow dispatches `ci.yml` via `workflow_dispatch` and "the PR gets a real `CI OK` on its head SHA". GitHub's own troubleshooting page says checks from a `workflow_dispatch` run on a PR's head branch "do not satisfy a required status check in a branch ruleset", and lists the only eligible events: `push`, `pull_request`, `pull_request_review`, `pull_request_target`, `deployment`, `deployment_status` [CITED: docs.github.com troubleshooting-required-status-checks]. The fix that keeps D-06's outcome and safety rules is a relay: the companion runs on `pull_request_target` (not affected by skip markers), never checks out PR code, dispatches `ci.yml` as D-06 says, waits for it, and reports the result itself in a job whose name becomes `CI OK` only when the head carries a skip marker. That job is the only `CI OK` from an eligible event on that SHA. It still conflicts with D-06's "keep check names unique across workflows" for those heads, and whether a `pull_request_target` job check attaches to the PR head SHA is not documented (LOW confidence; D-10's `[ci skip]` proof settles it). The planner needs a Tim checkpoint on this before building it (Open Question 1).

The second sequencing risk is GUARD-09: the fail-closed limiter must not reach `main` before Tim has confirmed the production Upstash variable names, or production refuses every contact submission. Also verified in the installed source: `@upstash/ratelimit` 2.2.0 resolves a timed-out call as `success: true` with `reason: "timeout"` after 5000 ms, so fail-closed has to check `reason`, not only catch errors.

**Primary recommendation:** Build the CI gate (`changes` + `CI OK` + `workflow_dispatch` + relay + a `check-ci-gate.mjs` guard) and the dual-name limiter first; ship them in the D-05 mid-phase PR only after Tim confirms the Vercel variable names; run the D-10 proofs (the `[ci skip]` proof is also the relay's acceptance test); then land Playwright 1.65 alone, the audit gate, G5/G6, the ledger fixes and CLEAN-01 as separate, individually verified commits.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Merge gate (`CI OK`, ruleset) | CI (GitHub Actions) | GitHub repo settings (Tim) | Aggregation is workflow logic; enforcement is a ruleset Tim applies |
| Skip-marker handling | CI (`pull_request_target` relay) | — | Only an eligible-event job can satisfy the ruleset; no PR code in that context |
| Production gate | Vercel (Deployment Checks) | CI (`CI OK` on the merge commit) | Vercel holds promotion until the named GitHub check passes |
| Rate-limit decision, fail-closed | API / Backend (`app/api/feedback/route.ts`, `lib/rate-limit.ts`) | Database (Upstash Redis) | Decision belongs server-side; Redis is only the counter store |
| Limiter keep-alive / monitor | CI (scheduled workflow) | Upstash REST | Out of band, emails Tim on failure; never part of `CI OK` |
| Refusal UX | Browser (`SummitRegister.tsx` `outcomeOf`) | — | Unchanged: `server-error` already maps to the `send` copy |
| Audit route list | Test tier (Playwright) reading build-time data (`app/sitemap.ts`, `photoSlugs`, `projects`) | — | Same source as `generateStaticParams` and the sitemap |
| Photo-script characterization | Build scripts (Node, `scripts/photos/*.mjs`) | Guard selftest harness | Spawned end-to-end, so the CLI contract survives Phase 15's rewrite |
| CLEAN-01 | Frontend server config (`next.config.ts`, `app/layout.tsx`), service worker (browser), CI config | — | Removals only |

## Standard Stack

### Core (all already in the repo; one version bump)
| Library / tool | Version | Purpose | Why standard |
|---------|---------|---------|--------------|
| `@playwright/test` | 1.64.1 → **1.65.0** | E2E, audit gate, visual | Latest on npm (`dist-tags.latest` = `1.65.0`, published 2026-11-05T18:30:18Z) [VERIFIED: npm registry] |
| `mcr.microsoft.com/playwright:v1.65.0-noble` | 1.65.0 | CI container | Tag listed by `https://mcr.microsoft.com/v2/playwright/tags/list` [VERIFIED: MCR tag list, 2026-11-12] |
| `@upstash/ratelimit` | 2.2.0 (installed) | Sliding-window limiter | Already used; `timeout` default `5e3` [VERIFIED: node_modules/@upstash/ratelimit/dist/index.js:767] |
| `@upstash/redis` | 1.41.0 (installed) | REST Redis client | Already used; `fromEnv()` reads both name pairs [VERIFIED: node_modules/@upstash/redis/nodejs.js:6916-6922] |
| GitHub rulesets REST API | — | `main` protection | Visible, exportable, app-pinned checks [CITED: STACK.md §5.1] |
| Vercel Deployment Checks | — | Hold production promotion on `CI OK` | "available for all projects connected to GitHub repositories" [CITED: vercel.com/changelog/block-vercel-deployment-promotions-with-github-actions, 2025-10-09]; Hobby not named (see Assumptions) |
| Jest | ^30.5.2 | Unit tests (limiter, CI-gate structure, template coverage) | Existing runner |
| Guard selftest harness | `scripts/guards/selftest.mjs` | G5/G6, CI-gate guard fixtures | Existing; spawns scripts against fixtures |
| `jq` | preinstalled on `ubuntu-latest` | `CI OK` needs check | Pattern from STACK.md §5.3 |

### Alternatives Considered
| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| `pull_request_target` relay (Open Q1, option A) | Fail-fast relay: same eligible-event `CI OK`, red with "push a commit without the marker" (option B) | No dispatch and no 40-minute waiting job, but a marker head never goes green on its own; GSD's existing empty-commit recovery covers ship notes |
| `--root` flag for photo scripts | Extract `zurichOffset`/`buildCapture` into a module and unit-test it | A module test pins today's internals, which Phase 15 is about to restructure; a spawned CLI test pins the behaviour that must survive |
| Audit routes from `sitemap()` | Build the list from `photoSlugs` + `projects` + `site.nav` by hand | Hand-built list must be edited for every new route type; the sitemap is already required (REGION-07) to list region pages |
| New `check-ci-gate.mjs` guard | Extend `check-install-parity.mjs` | Parity fixtures (`__selftest__/parity/good`, `bad`) contain workflow files that would all need a `CI OK`; a separate guard keeps both focused |

**Installation (DEPS-06 only):**
```bash
npm install -D @playwright/test@1.65.0   # updates package.json and package-lock (playwright, playwright-core follow)
```
Then edit the four container-tag sites in the same commit (see DEPS-06 below).

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@playwright/test@1.65.0` | npm | 7 days (2026-11-05) | 125,956,355/wk | github.com/microsoft/playwright | [SUS] reason `too-new` | Flagged; existing dependency, official Microsoft package, no `postinstall` on `@playwright/test`, `playwright`, `playwright-core` 1.65.0. Planner adds `checkpoint:human-verify` before the install, as the gate requires |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `@playwright/test@1.65.0` (only because it is 7 days old). `@playwright/test` 1.65.0 depends on `playwright` 1.65.0, which depends on `playwright-core` 1.65.0; `engines.node` `>=20` [VERIFIED: npm view].

No other package is added by this phase.

## Architecture Patterns

### System Architecture Diagram

```
 PR push / open ─────────────┬──────────────────────────────────────────────────────────────┐
                             │                                                              │
             head commit has a skip marker?                                     pull_request_target
                  │ no                     │ yes (push + pull_request runs skipped)     (runs from main's copy,
                  ▼                        │                                             no checkout)
     ci.yml (pull_request) ──┐             │                                                │
       changes ──► docs-only? ─┐           │                         detect: marker? fork? ──┤
          │ no         │ yes   │           │                                                ▼
          ▼            ▼       │           │                 relay job (name = "CI OK" only on marker heads)
   heavy jobs     heavy jobs   │           │                   │ fork → fail red
   (lint, unit,   skipped      │           │                   │ same repo → gh workflow run ci.yml --ref <head>
    e2e, visual,               │           │                   │            └► ci.yml (workflow_dispatch) runs full CI
    build, audit)              │           │                   │               (its own CI OK is not counted by rulesets)
          ▼            ▼       ▼           │                   └ waits, exits with that run's conclusion
        CI OK (if: always(), jq over needs) │                             │
          │                                 │                             │
          └────────────► required check "CI OK" (app 15368) on head SHA ◄─┘
                                   │
                         main ruleset (no bypass): PR + CI OK + no force push/deletion, merge commits only
                                   │ merge
                                   ▼
                   push to main ─► ci.yml (push) ─► CI OK on merge commit
                                   │                       │
                   Vercel builds production ─► Deployment Check "CI OK" ─► promote to tlui.de

 Daily: keep-alive.yml (schedule) ─► Upstash REST PING/SET ─► fail → GitHub emails Tim
 Contact POST ─► validateOrigin ─► limiter.limit(ip) ─┬─ success ─► parse, zod, honeypot, send
                                                      ├─ limited ─► 429 + Retry-After
                                                      └─ unavailable (prod only) ─► 503 server-error ─► "Couldn't send." copy
```

### Recommended file layout (new and changed)
```
.github/workflows/
├── ci.yml                  # + workflow_dispatch, + changes job, + needs/if on heavy jobs, + ci-ok job, - commented steps
├── ci-skip-relay.yml       # NEW (Open Q1): pull_request_target relay, no checkout
└── upstash-keepalive.yml   # NEW: schedule + workflow_dispatch only
scripts/guards/
├── check-ci-gate.mjs       # NEW: no workflow-level paths filters, CI OK needs every job, CI OK name unique
└── __selftest__/ci-gate/   # NEW fixtures (good/bad workflow dirs)
scripts/photos/
├── build-photo-data.mjs    # + --root <dir>
└── build-derivatives.mjs   # + --root <dir>
lib/rate-limit.ts           # dual-pair resolution, explicit Redis, timeout, fail-closed in production
lib/__tests__/rate-limit.test.ts   # NEW
e2e/routes.ts               # ROUTES stays one-per-template (named photo slug); + AUDIT_SWEEP from sitemap
e2e/audit.spec.ts           # + one @chromium-only sweep test looping every sitemap path not in ROUTES
.planning/phases/13-repo-safety-test-debt/
├── main-ruleset.json        # prepared for Tim (D-04)
├── automated-actions-10401314.json   # export before delete (D-02)
└── 13-LEDGER-TRIAGE.md      # D-19
```

### CI inventory (current, verbatim) [VERIFIED: .github/workflows/ci.yml, read this session]

Triggers, lines 3-7:
```yaml
on:
  push:
    branches: [main, develop, 'ci/**']
  pull_request:
    branches: [main, develop]
```
No `paths:`/`paths-ignore:` and no `workflow_dispatch:` (D-06/relay needs one). Top-level `permissions: contents: read` (lines 9-10).

| Job id (line) | `name:` (= check name) | Notes |
|---|---|---|
| `lint-and-typecheck` (13) | `Lint and Type Check` | `npm run lint` runs every guard, `guard:selftest` and `data:check` (package.json `lint` script) |
| `unit-tests` (38) | `Unit Tests` | jest + `npm run guard:tests` ratchet + codecov (non-failing) |
| `e2e-tests` (74) | `E2E Tests` | `timeout-minutes: 60`; container `mcr.microsoft.com/playwright:v1.64.1-noble` (line 85); commented step lines 103-105 |
| `visual-regression` (129) | `Visual Regression` | `timeout-minutes: 45`; container tag line 138; name read by `scripts/ci/check-visual-run.mjs` |
| `build` (172) | `Build Application` | `needs: [lint-and-typecheck, unit-tests]` (175); commented step lines 194-196 |
| `dependency-review` (212) | `Dependency Review` | `if: github.event_name == 'pull_request'` (215) |
| `security-audit` (228) | `Security Audit` | Never fails: `continue-on-error: true` and a `::warning::` only |

Other workflow: `visual-baselines.yml` (`workflow_dispatch` only; container tag line 32; `PW_CONTAINER_TAG` env line 71). CodeQL runs as GitHub default setup (check runs `Analyze (actions)`, `Analyze (javascript-typescript)` on `main`, app 15368) and is not a workflow file; it stays out of `CI OK` (deferred).

Last `main` run (43298341533, 2026-11-12): E2E 36 m 56 s, Visual 4 m 4 s, Lint 1 m 25 s, Unit 1 m 21 s, Build 1 m 33 s [VERIFIED: gh api actions/runs/…/jobs].

### Pattern 1: `changes` + `CI OK` (D-08, GUARD-07)
**What:** a cheap first job classifies the diff; heavy jobs `needs: changes` and skip on docs-only; `CI OK` accepts only the intended skips.
**When:** every `ci.yml` event (`push`, `pull_request`, `workflow_dispatch`).
```yaml
# Source: pattern from .planning/research/STACK.md §5.3, extended for D-08/D-09
  changes:
    name: Classify changes
    runs-on: ubuntu-latest
    permissions: { contents: read }
    outputs:
      docs_only: ${{ steps.classify.outputs.docs_only }}
    steps:
      - id: classify
        env:
          GH_TOKEN: ${{ github.token }}
          REPO: ${{ github.repository }}
          EVENT: ${{ github.event_name }}
          BASE: ${{ github.event.pull_request.base.sha || github.event.before }}
          HEAD: ${{ github.event.pull_request.head.sha || github.sha }}
        run: |
          set -euo pipefail
          docs_only=false
          if [ "$EVENT" = workflow_dispatch ]; then BASE=main; fi
          # 0000… (new branch push) or an empty base = cannot classify -> full CI
          if [ -n "$BASE" ] && [ "${BASE//0/}" != "" ]; then
            if files=$(gh api "repos/$REPO/compare/$BASE...$HEAD" --jq '.files[] | .filename, (.previous_filename // empty)') \
               && [ "$(gh api "repos/$REPO/compare/$BASE...$HEAD" --jq '.files | length')" -lt 300 ] \
               && [ -n "$files" ]; then
              docs_only=true
              while IFS= read -r f; do
                case "$f" in
                  .planning/*|README.md|AGENTS.md|scripts/README.md|e2e/visual/README.md|.github/copilot-instructions.md) ;;
                  *) docs_only=false; break ;;
                esac
              done <<< "$files"
            fi
          fi
          echo "docs_only=$docs_only" >> "$GITHUB_OUTPUT"

  # every heavy job gains:
  #   needs: [changes]            (build: needs: [changes, lint-and-typecheck, unit-tests])
  #   if: needs.changes.outputs.docs_only != 'true'

  ci-ok:
    name: CI OK            # the only required check; unique across .github/workflows except the relay (Open Q1)
    if: always()
    needs: [changes, lint-and-typecheck, unit-tests, e2e-tests, visual-regression, build, dependency-review, security-audit]
    runs-on: ubuntu-latest
    permissions: {}
    steps:
      - name: Every needed job passed or skipped on purpose
        env:
          NEEDS: ${{ toJSON(needs) }}
          EVENT: ${{ github.event_name }}
        run: |
          echo "$NEEDS" | jq -e --arg event "$EVENT" '
            (.changes.result == "success" and .changes.outputs.docs_only == "true") as $docs
            | to_entries
            | all(
                .value.result == "success"
                or (.key == "dependency-review" and .value.result == "skipped" and $event != "pull_request")
                or ($docs and .value.result == "skipped"
                    and (.key | IN("lint-and-typecheck","unit-tests","e2e-tests","visual-regression","build","security-audit")))
              )'
```
Notes: the compare API returns at most 300 files per page [ASSUMED: GitHub compare pagination limit]; the sketch treats ≥ 300 as "cannot classify". `IN` exists in jq ≥ 1.6. A `changes` failure skips every heavy job and then fails `CI OK` (fail-closed). `dependency-review` stays unconditional on PRs (cheap).

### Pattern 2: skip-marker relay (Open Question 1, option A — needs Tim's checkpoint)
```yaml
# .github/workflows/ci-skip-relay.yml  — runs from main's copy; never checks out PR code (D-06 safety)
name: CI skip relay
on:
  pull_request_target:
    branches: [main]
    types: [opened, synchronize, reopened]
permissions: {}
concurrency:
  group: ci-skip-relay-${{ github.event.pull_request.number }}
  cancel-in-progress: true
jobs:
  detect:
    name: Skip-marker check
    runs-on: ubuntu-latest
    permissions: { contents: read, actions: read }
    outputs:
      skipped: ${{ steps.d.outputs.skipped }}
    steps:
      - id: d
        env:
          GH_TOKEN: ${{ github.token }}
          REPO: ${{ github.repository }}
          SHA: ${{ github.event.pull_request.head.sha }}
        run: |
          msg=$(gh api "repos/$REPO/commits/$SHA" --jq .commit.message)
          marker=false
          printf '%s' "$msg" | grep -qiF -e '[skip ci]' -e '[ci skip]' -e '[no ci]' -e '[skip actions]' -e '[actions skip]' && marker=true
          printf '%s' "$msg" | tail -n 1 | grep -qiE '^skip-checks: ?true$' && marker=true
          # Confirm GitHub really skipped: no pull_request CI run exists for this SHA after a short wait
          skipped=false
          if [ "$marker" = true ]; then
            sleep 45
            n=$(gh api "repos/$REPO/actions/runs?head_sha=$SHA&event=pull_request" --jq '[.workflow_runs[] | select(.name == "CI")] | length')
            [ "$n" = 0 ] && skipped=true
          fi
          echo "skipped=$skipped" >> "$GITHUB_OUTPUT"
  relay:
    name: ${{ needs.detect.outputs.skipped == 'true' && 'CI OK' || 'CI skip relay' }}   # no job-level if:
    needs: detect
    runs-on: ubuntu-latest
    timeout-minutes: 100
    permissions: { actions: write, contents: read }
    steps:
      - if: needs.detect.outputs.skipped != 'true'
        run: echo "No skipped CI on this head; ci.yml reports CI OK itself."
      - if: needs.detect.outputs.skipped == 'true'
        env:
          GH_TOKEN: ${{ github.token }}
          REPO: ${{ github.repository }}
          HEAD_REPO: ${{ github.event.pull_request.head.repo.full_name }}
          REF: ${{ github.event.pull_request.head.ref }}     # attacker-controlled on forks: env only, never ${{ }} in run
          SHA: ${{ github.event.pull_request.head.sha }}
        run: |
          set -euo pipefail
          if [ "$HEAD_REPO" != "$REPO" ]; then
            echo "::error::Fork PR head carries a skip marker; push a commit without it."; exit 1
          fi
          gh workflow run ci.yml --repo "$REPO" --ref "$REF"
          # find the dispatched run for this SHA, then mirror its conclusion
          for i in $(seq 1 30); do
            id=$(gh api "repos/$REPO/actions/runs?head_sha=$SHA&event=workflow_dispatch" --jq '[.workflow_runs[] | select(.name=="CI")][0].id // empty')
            [ -n "$id" ] && break; sleep 10
          done
          [ -n "${id:-}" ] || { echo "::error::dispatched CI run not found"; exit 1; }
          gh run watch "$id" --repo "$REPO" --exit-status --interval 60
```
Why each part: `pull_request_target` is not affected by skip markers ("Skip instructions only apply to the `push` and `pull_request` events" [CITED: docs.github.com skip-workflow-runs]) and is an eligible event for required checks [CITED: troubleshooting-required-status-checks]; `jobs.<id>.name` may use the `needs` context [CITED: docs.github.com contexts, "Context availability"]; `workflow_dispatch` sent with `GITHUB_TOKEN` "always create[s] workflow runs" [CITED: docs.github.com trigger-a-workflow]. The relay job has no job-level `if:`, so it can never report a vacuous Success under the name `CI OK`. LOW-confidence parts: which SHA a `pull_request_target` job check is attached to, and `gh run watch` flags (verify with `gh run watch --help` at implementation).

### Pattern 3: fail-closed limiter (GUARD-09)
```ts
// lib/rate-limit.ts (sketch)
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type Unavailable = 'unconfigured' | 'error' | 'timeout';
export interface RateLimitResult { success: boolean; limit: number; remaining: number; reset: number; unavailable?: Unavailable }
export interface RateLimiter { limit(identifier: string): Promise<RateLimitResult> }
type Env = Record<string, string | undefined>;

/** One complete pair, never a mix (Redis.fromEnv() would mix UPSTASH_ url with a KV_ token). */
export function upstashCredentials(env: Env): { url: string; token: string } | null {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
    return { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN };
  if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN)
    return { url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN };
  return null;
}

export const LIMIT_TIMEOUT_MS = 3000; // discretion; the form aborts at 15 s

export function createRateLimiter(env: Env = process.env): RateLimiter {
  const production = env.VERCEL_ENV === 'production';
  const refuse = (why: Unavailable): RateLimitResult => {
    console.error('[rate-limit]', { event: 'rate-limit', outcome: 'refused', reason: why, timestamp: new Date().toISOString() });
    return { success: false, limit: 0, remaining: 0, reset: 0, unavailable: why };
  };
  const creds = upstashCredentials(env);
  if (!creds) {
    let warned = false;
    return {
      async limit() {
        if (production) return refuse('unconfigured');           // never throw at construction: next build imports this module
        if (!warned) { console.warn('[rate-limit] no Upstash credentials; rate limiting is disabled (not production)'); warned = true; }
        return { success: true, limit: 5, remaining: 5, reset: 0 };
      },
    };
  }
  const rl = new Ratelimit({
    redis: new Redis({ url: creds.url, token: creds.token }),
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'ratelimit:feedback',
    timeout: LIMIT_TIMEOUT_MS,
  });
  return {
    async limit(id) {
      try {
        const r = await rl.limit(id);
        if (r.reason === 'timeout' && production) return refuse('timeout'); // library resolves success: true on timeout
        return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
      } catch (e) {
        if (production) return refuse('error');
        throw e; // preview/dev keep today's behaviour (route's outer catch → 500 server-error)
      }
    },
  };
}
export const feedbackRateLimit: RateLimiter = createRateLimiter();
```
Route change (after the `limit()` call, before the existing `!success` branch): `if (result.unavailable) { logFeedback('limiter-unavailable', ip); return respond({ code: 'server-error' }, 503); }`. Reusing `server-error` keeps `FEEDBACK_CODES` untouched; `outcomeOf` already maps it to the `send` copy [VERIFIED: components/contact/SummitRegister.tsx:224-232 — `case 'send-failed':` / `case 'server-error':` → `return { kind: 'failed', failure: { kind: 'send' } };`]. Add `'limiter-unavailable'` to the server-only `FeedbackOutcome` union and a 503 row to the contract doc table.

### Pattern 4: audit routes from site data (VERIFY-05)
```ts
// e2e/routes.ts (additions)
import sitemap from '@/app/sitemap';
import { site } from '@/data/site';

/** Every page the sitemap lists, as a path (site.url stripped). Region pages join when REGION-07 adds them. */
export const SITEMAP_PATHS: readonly string[] = sitemap().map(({ url }) => {
  const path = url.slice(site.url.length);
  return path === '' ? '/' : path;
});

/** Pages audited once in Chromium at one width: every sitemap path not already a ROUTES template entry. */
export const AUDIT_SWEEP: readonly string[] = SITEMAP_PATHS.filter((p) => !ROUTES.some(([r]) => r === p));
```
In `ROUTES`, replace `buildPhotoViews()[0].slug` with a named slug (`photoBySlug('matterhorn-from-zermatt')`, throwing if missing) so the template entry cannot shift (Pitfall 1). In `audit.spec.ts`, add **one** test `every sitemap page once in Chromium @chromium-only` that loops `AUDIT_SWEEP` at 1440 and collects findings into one `expectClean` (one ratchet count, full coverage). `/projects/coin-flip` and photo slugs 2-4 enter through this sweep. Sitemap order today: nav, `photoSlugs`, `projects` [VERIFIED: app/sitemap.ts:15-21].

### Pattern 5: script characterization through a `--root` flag (VERIFY-06)
Both scripts compute `const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');` [VERIFIED: build-photo-data.mjs:59, build-derivatives.mjs:74] and accept only `--check` (`unknown argument(s) …; the only flag is --check`, lines 301-306 / 422-427). Add `--root <dir>` (default unchanged), the same flag `check-install-parity.mjs`, `test-count.mjs` and `check-served-images.mjs` already take. Schema imports stay relative to the script file. Then selftest cases spawn the scripts against temp roots:

- **G5** (`photos:build --check --root <tmp>`), temp root = copies of `data/photos/exif-sidecar.json`, `data/photos/corrections.json`, `data/terrain/source/source.json`, `data/terrain/source/dem-10m.png` (1.4 MB) and `data/generated/photos.ts`:
  - control: unmodified → exit 0, output `photos:build: OK`;
  - WR-03: set `img-0605` `offsetTimeOriginal` to `"+01:00"` (its `dateTimeOriginal` is `"2021-09-06T10:48:46"`, a September capture) → exit 1, output contains `EXIF OffsetTimeOriginal +01:00 is not the Europe/Zurich offset +02:00` [VERIFIED: build-photo-data.mjs:149-153; data/photos/exif-sidecar.json:20-21];
  - D-04: shift `img-0605` `gps.utc` by one hour → exit 1, output contains `not +02:00 within 60 s` (lines 154-160);
  - WR-01: give `r004-011` a hand-placed position outside the plate → exit 1, `position lies outside the DEM extent` (lines 226-229).
- **G6** (`photos:derive --root <tmp>`, write mode): setup writes two tiny sRGB JPEGs with sharp under `<tmp>/assets/photos-original/`, a sidecar listing `img-0001` (valid) then `img-0002` (bytes that sharp cannot decode, sidecar `sha256` matching those bytes), a pre-existing `public/images/photos/` with a stale file, and an existing `data/generated/image-manifest.ts`. Expect exit 1, every pre-existing file byte-identical, no new file under `public/images/photos/`, manifest unchanged. The valid photo comes first, so an implementation that writes as it encodes, or unlinks stale files early, turns the case red. Sidecar ids must match `/^(img-\d{4}|r\d{3}-\d{3})$/` and be sorted ascending; `space` must be the literal `'srgb'` [VERIFIED: data/schemas/photo.ts:57-65, 80-88].
- Prove each case is red on a seeded fault once (temporarily delete the WR-03 check; move the unlink loop before encoding), record it in the SUMMARY, and revert.

### Anti-Patterns to Avoid
- **A second `CI OK` with a job-level `if:`** — a skipped job reports Success [CITED: troubleshooting-required-status-checks]; this is why the relay uses a dynamic name, not `if:`.
- **Relying on `workflow_dispatch` checks for the ruleset** — not evaluated [CITED: same page].
- **`Redis.fromEnv()` with two possible name pairs** — it falls back per variable, so a URL and token from different pairs can combine.
- **Throwing in `createRateLimiter()`** — the module is imported during `next build`; a throw there breaks the build. Refuse inside `limit()`.
- **Per-slug `test()` calls** — the ratchet counts each one forever (Pitfall 11).
- **Proving merge refusal on a draft PR** — `gh pr merge` refuses drafts for being drafts, which proves nothing (see Pitfall 4).

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Deciding "did every CI job pass" | Per-job required checks in the ruleset | One `CI OK` with `jq` over `toJSON(needs)` | Renames and the PR-only `dependency-review` would break per-job rules |
| Waiting for a dispatched run | A custom polling loop over `/actions/runs/{id}` | `gh run watch <id> --exit-status` | Already on runners; handles completion and conclusion |
| Upstash credentials | String-concatenated REST calls in the route | `new Redis({ url, token })` + `Ratelimit` | Retries, typed responses, timeout handling |
| Photo-script test fixtures in git | Committed binary originals | Generate tiny JPEGs with sharp in the selftest setup | No new binaries; sharp is already a devDependency |
| A YAML parser for the CI guard | Adding `js-yaml` as a dependency | Line-based parsing like `check-install-parity.mjs` `extractRunCommands` | `js-yaml` is only transitive here; no new dependency |
| Probing the limiter | A new probe script | Existing `PROD_FORM_LIMIT=1 npm run test:prod-form` | Already written and documented (D-15) |

## Runtime State Inventory

CLEAN-01 is a removal, not a rename, but two runtime items are worth stating:

| Category | Items found | Action required |
|----------|-------------|-----------------|
| Stored data | Visitors' service-worker caches named `images-<BUILD_HASH>` keep any `/_next/image` responses from older builds | None: cache names change with every build (`scripts/inject-build-hash.mjs`), and no page uses `next/image` |
| Live service config | Vercel: production env vars (names unconfirmed), "Enable access to System Environment Variables" (needed for `VERCEL_ENV`), Deployment Checks (not set). GitHub: ruleset 10401314 (inert), no rules on `main` | Tim confirms or applies each (see "Identifiers") |
| OS-registered state | None. Verified: no scheduler or service registrations are involved in this phase | None |
| Secrets/env vars | Repo secrets today: `FEEDBACK_FROM_EMAIL`, `FEEDBACK_RECIPIENT_EMAIL`, `RESEND_API_KEY` (names only, `gh secret list`). No Upstash secrets yet | Tim adds the Upstash URL/token pair as repo secrets for the keep-alive (D-14) |
| Build artifacts | None for removals. DEPS-06 changes `node_modules` (playwright 1.65) locally | `npm ci` after the bump (stop `next start` first) |

## Identifiers (read-only confirmations, 2026-11-12)

| Identifier | Value | How confirmed | Status |
|---|---|---|---|
| GitHub Actions app id | `15368` | `gh api apps/github-actions` → `{"id":15368,"name":"GitHub Actions","slug":"github-actions"}`; every check run on `main` HEAD has `app_id` 15368 | [VERIFIED: gh api] |
| Rulesets on the repo | one: `automated-actions`, id `10401314`, `enforcement: "active"`, `conditions.ref_name.include: []`, rules `deletion`, `non_fast_forward`, `pull_request` (`require_code_owner_review: true`, `allowed_merge_methods: ["merge","squash","rebase"]`, plus `required_reviewers: []`, `require_extra_approval_for_unattributed_changes: true`), bypass `{"actor_id":29110,"actor_type":"Integration","bypass_mode":"always"}`, `current_user_can_bypass: "never"` | `gh api repos/tlex-web/portfolio-app/rulesets/10401314` | [VERIFIED: gh api] |
| Active rules on `main` | `[]` | `gh api …/rules/branches/main` | [VERIFIED] |
| Classic branch protection | none (`404 Branch not protected`) | `gh api …/branches/main/protection` | [VERIFIED] |
| Admin `RepositoryRole` id | not needed: D-01 has an empty bypass list | — | n/a |
| Repo merge settings | `allow_merge_commit`, `allow_squash_merge`, `allow_rebase_merge` all `true`; `delete_branch_on_merge: true`; owner type `User`; public | `gh api repos/…` | [VERIFIED]; the ruleset's `allowed_merge_methods` narrows `main` |
| Default `GITHUB_TOKEN` permissions | `read`; `can_approve_pull_request_reviews: false`; fork approval `first_time_contributors` | `gh api …/actions/permissions/workflow` | [VERIFIED] |
| Vercel GitHub app id | `8329` | `gh api apps/vercel` | [VERIFIED] (informational) |
| Production Upstash variable names | **not confirmed** | Vercel CLI not installed; `.vercel/` absent (project not linked) | Open item for Tim: `npx vercel@latest link` (decline any env pull), then `npx vercel@latest env ls production`; record names only |
| Vercel Deployment Checks on Hobby | **not confirmed** | Docs: "available for all projects connected to GitHub repositories"; Hobby not named | Open item for Tim (dashboard: Project → Settings → Build and Deployment → Deployment Checks); prerequisite: "automatic aliasing for production is turned on" [CITED: vercel.com/docs/deployment-checks] |
| `VERCEL_ENV` at runtime | "Available at: Both build and runtime", values production / preview / development — only when "Enable access to System Environment Variables" is checked | [CITED: vercel.com/docs/environment-variables/system-environment-variables] | Open item for Tim: confirm the checkbox |
| `gh` token scopes | `gist`, `read:org`, `repo`, `workflow` | `gh auth status` | [VERIFIED] (`workflow` scope is needed to push workflow-file changes) |

## DEPS-06: Playwright 1.65 details

- **Four tag sites, not two:** `.github/workflows/ci.yml:85` and `:138` (`image: mcr.microsoft.com/playwright:v1.64.1-noble`), `.github/workflows/visual-baselines.yml:32` (`image: …v1.64.1-noble`) and `:71` (`PW_CONTAINER_TAG: mcr.microsoft.com/playwright:v1.64.1-noble`) [VERIFIED: git grep + Read]. The parity guard matches every `mcr.microsoft.com/playwright:vX.Y.Z-noble` string in every workflow against the lockfile `@playwright/test` version [VERIFIED: scripts/guards/check-install-parity.mjs:160-198]. CONTEXT's "both tags in `ci.yml`" understates it; all four move in the one commit.
- Optional in the same commit: raise `scripts/guards/version-floors.json` `"@playwright/test": "1.64.0"` (line 10) to `1.65.0`. Leave `e2e/perf/home-baseline.json` (`"playwrightVersion": "1.64.0"`, a recorded measurement) alone.
- **Why #140 is red:** it bumps only `package.json`/lockfile; in the 1.64.1 container Playwright 1.65 looks for `/ms-playwright/chromium_headless_shell-1254/…` and fails `Executable doesn't exist`; Lint fails on the parity guard [VERIFIED: gh run view 42591538183 --log-failed]. So #140 tells us nothing about 1.65 behaviour; the first real 1.65 E2E run is ours.
- **1.65 notable changes that can bite here** [CITED: github.com/microsoft/playwright/releases/tag/v1.65.0]:
  - "Docker images now include Node.js 26 instead of Node.js 24". The CI jobs run `actions/setup-node` with `node-version-file: .node-version` (`24`) inside the container, which puts Node 24 first on `PATH` [ASSUMED: setup-node PATH precedence in a container]. Add a `node --version` line in the first 1.65 run's log check.
  - Text the browser does not render no longer counts toward accessible names (`getByRole` with `name`, aria snapshots). This repo relies heavily on `getByRole(…, { name })`; run the full three-engine E2E on a `ci/13-*` branch before the re-baseline.
  - `click()`/`fill()` wait for an element to stop being `inert` (the lightbox uses `showModal()`, which makes the page inert).
  - `test.skip()`, `test.fixme()`, `test.fail()`, `test.slow()` "now accept only a description". The repo calls `test.slow()` with no arguments in 8 places (`e2e/case-study.spec.ts:349,484`, `photos-lightbox.spec.ts:78`, `photos-sweep.spec.ts:220,293`, `projects.spec.ts:63,95`, `shell.spec.ts:414`) and never `skip/fixme/fail` [VERIFIED: git grep]. Whether a bare `test.slow()` still type-checks and runs is not stated in the notes [ASSUMED: it does]; check on the first run.
  - A sharded run with no matching tests fails ("No tests found"); relevant only if E2E is sharded.
  - Browser versions: Chromium 158.0.8127.18, Firefox 159.0, WebKit 27.2.
- **Closing #140:** Dependabot normally closes its own PR once the default branch already has the version [ASSUMED]; otherwise close it with a comment pointing at the commit (not a settings change, but ask Tim before closing).
- The re-baseline dispatch on a `ci/13-*` branch needs Tim's explicit approval (D-10 scope note; memory: standing approval covers `ci/07-NN` to `ci/12-NN` only).

## CLEAN-01 removal table

| Target | Location (verbatim) | References outside its definition | Removal notes |
|---|---|---|---|
| `TILT_CONFIG` | `lib/animations.ts:53-59` (`export const TILT_CONFIG = { maxRotation: 12, perspective: 600 } as const;`) | none (`git grep`) | Delete with its doc comment |
| `cssDuration`, `cssEase` | `lib/animations.ts:43-51`; helper `const kebab` at `:41` is used only by them | `lib/__tests__/motion-tokens.test.ts:8` (import) and `:25-33` (`describe('motion token helpers', …)`, 2 tests) | Delete both functions, `kebab`, the import and the 2-test `describe`; keep the parity `describe`. Ratchet is total-based (`now.total < baseline.total` fails, `scripts/guards/test-count.mjs`); baseline `total` 2243 (`jest` 1694, `e2e` 549); the local jest count was 1702 on 2026-11-06, so 2 deletions fit, and this phase adds tests anyway. Land it after the limiter tests if in doubt |
| `images` block | `next.config.ts:8-14` (`formats: ['image/webp', 'image/avif']`, `deviceSizes`, `imageSizes`, `minimumCacheTTL: 60 * 60 * 24 * 365`, `qualities: [75, 85]`) plus the whitespace-only line 15 | No `next/image` import anywhere; only the two comments in `lib/og/template.tsx:114,295` | Next 16.4: the block configures the `next/image` loader; without it `qualities` defaults to `[75]` [CITED: node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md "qualities"]. No rendering change; the `/_next/image` endpoint simply keeps defaults |
| SW `/_next/image` branch | `public/service-worker.js:194-201`: `url.pathname.startsWith('/_next/image') \|\|` | none in tests | Remove only that condition; **keep** `request.destination === 'image'`, which `lib/__tests__/service-worker-media.test.ts:161` relies on (`/media/` poster → `images-__BUILD_HASH__`). `proxy.ts:237` matcher still excludes `_next/image`; out of scope, harmless |
| Commented CI steps | `ci.yml:103-105` and `:194-196` (`# Skip image optimization - …`, `# - name: Optimize images for tests/build`, `#   run: npm run optimize-images`) | `optimize-images` script no longer exists in `package.json` | Delete all six lines |
| `dns-prefetch` | `app/layout.tsx:58-59` (`{/* Resource Hints for Performance */}`, `<link rel="dns-prefetch" href="https://vercel.com" />`) | none | Delete both lines; keep the two `rel="prefetch"` links |

No-visual-diff proof: the `Visual Regression` job runs on the commit with `--update-snapshots=none` and must pass (`node scripts/ci/check-visual-run.mjs --sha <HEAD> --wait 30`), plus `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --none` (e2e/visual/README.md "Zero-diff gate"). Recommend verifying CLEAN-01 against the current 1.64.1 baselines **before** the Playwright bump, so a 1.65 rendering change cannot hide inside it.

## VERIFY-07: proposed ledger triage (44 rows, for Tim's single checkpoint)

Each row was checked against the current tree on 2026-11-12. "Fix here" rows are cheap, pixel-neutral and testable per D-18.

| # | Row | Source | Summary | Evidence today | Proposed disposition |
|---|---|---|---|---|---|
| 1 | 07 WR-01 | 07-REVIEW.md:195 | Contrast guard merges `:root` blocks nested in `@media` | `BLOCK` regex unchanged, `scripts/guards/check-contrast.mjs:100` | **Fix here** (guard) + `media-override.css` selftest fixture |
| 2 | 07 WR-02 | :224 | Palette regex misses directional borders, ring offsets, shadow families | `PRE` unchanged, `check-palette.mjs:46` | **Fix here**; run the widened regex first: new hits or `wb` count changes need Tim before the ratchet moves |
| 3 | 07 WR-03 | :234 | `png` rule walks the disk; lint fails on Windows after a local visual run | `readdirSync` walk, `check-palette.mjs:101,176` | **Fix here** (`git ls-files -co --exclude-standard`) |
| 4 | 07 WR-04 | :242 | `same-classnames` skips moved files, passes with 0 compared | `--no-renames`, `same-classnames.mjs:154` | **Fix here** (pair renames, fail on 0 compared) |
| 5 | 07 WR-05 | :256 | Dependabot Playwright bumps fail parity | Group now excludes `@playwright/test` (`.github/dependabot.yml`), lone PRs still red (#140) | **Handed to DEPS-06** (D-16) |
| 6 | 07 WR-06 | :271 | Current-page menu link leaves panel open | `SiteNav.tsx` closes on route change only | **Handed to SHELL-07, Phase 14** (D-16) |
| 7 | 07 WR-07 | :281 | `SafeCanvas` swallows errors without logging | `componentDidCatch` forwards to `onError` only (542bef5), `components/SafeCanvas.tsx:29-31` | **Tim's call**: fix (log non-WebGL errors) is cheap and unit-testable, but a new `console.error` can trip the audit gate's console check on Home |
| 8 | 07 IN-01 | :336 | `scripts/README.md` lint chain and emoji row stale | Chain fixed (line 52); emoji row still says "skipped in lint until plan 07-25" (line 66) | **Fix here** (one line) |
| 9 | 07 IN-02 | :342 | Layout comment names `middleware.ts` | `app/layout.tsx:52` now says `proxy.ts` | **Already fixed** (123d67a) |
| 10 | 07 IN-03 | :348 | G3 comment describes deleted v1 Header | `e2e/design-system.spec.ts:177` unchanged | **Fix here** (comment) |
| 11 | 07 IN-05 | :360 | Home stats hard-coded | Literals gone | **Already fixed** (98de4c5, Home rebuild) |
| 12 | 07 IN-06 | :366 | Contrast selftest pins exact ratios | `selftest.mjs:738` still lists 12 exact ratios | **Fix here** (D-18 example) |
| 13 | 07 IN-07 | :372 | `check-snapshot-commit` passes merge commits | No merge detection, `scripts/ci/check-snapshot-commit.mjs:119` | **Fix here**; more relevant now that D-03 allows merge commits only |
| 14 | 07 IN-08 | :378 | Tests and e2e excluded from `type-check` | `tsconfig.json` `exclude` unchanged | **Tim's call after measuring**: run `tsc` with a `tsconfig.test.json` once; few errors → fix here, many → new requirement |
| 15 | 07 IN-09 | :384 | FeedbackForm parses JSON before status | `components/FeedbackForm.tsx` deleted; `SummitRegister` maps unreadable bodies to the network copy by design | **Already fixed** (b48c4d9) |
| 16 | 07 IN-10 | :390 | `high`/`critical` risk render identically | `HologramTerminalDemo.tsx` deleted | **Already fixed** (cf369b5) |
| 17 | 07 IN-11 | :396 | Section error component named `Error` | `app/(site)/error.tsx:12` `export default function Error(` | **Fix here** (rename `SectionError`) |
| 18 | 07 IN-12 | :402 | Roadmap dot clips its icon | `RoadmapTimeline.tsx` deleted | **Already fixed** (e37f2af) |
| 19 | 07 IN-13 | :408 | Hero badge contrast | `Hero3DMountain.tsx` deleted | **Already fixed** (efd11e7) |
| 20 | 07 IN-14 | :414 | Hover lost on white CTAs | Hero and old Home CTAs deleted | **Already fixed** (efd11e7, 98de4c5) |
| 21 | 07 IN-15 | :420 | v3 `bg-opacity-*` in image modal | `ImageDetailModal.tsx` deleted | **Already fixed** (aa9dff6) |
| 22 | 07 IN-16 | :426 | `/projects/[slug]` 404 has no server body | `dynamicParams = false` + `generateStaticParams` (cf369b5), EDGE-01 404 | **Already fixed** (cf369b5; confirm with the existing 404 e2e) |
| 23 | 07 IN-17 | :432 | Skip-link count checked only once | `e2e/shell.spec.ts:67` single count | **Fix here** (re-count after interaction) |
| 24 | 09 IN-01 | 09-REVIEW.md:120 | `measurePlaque` assumes a centred summit block | `components/home/AscentController.tsx:277` unchanged | **Accept with reason**: only short-landscape full layout, the domain of 09 WR-01 that Tim accepted at 09-UAT; a fix moves Home pixels |
| 25 | 09 IN-02 | :133 | Two width sources for narrow/wide | `TerrainStage.tsx:39,62` vs `CameraRig.tsx:136,519` | **Accept with reason**: nothing breaks; aligning them changes the 768 px Home render (visual baselines) |
| 26 | 09 IN-03 | :139 | Summit-layout magic numbers unguarded | `lib/ascent/summit-layout.ts:40,43`; no e2e reads them | **Fix here** (one e2e assertion of measured plaque height vs `COMPACT_H`/`FULL_H`; test-only) |
| 27 | 09 IN-04 | frontmatter | `fourDecimals` not round-half-up for every input | `lib/home-format.ts:37-45` `Math.round(Math.abs(v) * scale) / scale` | **Fix here** with a unit test proving the four current coordinates print unchanged; or hand to Phase 18 (PHOTO-08 coordinate formatting) if Tim prefers |
| 28 | 09 IN-06 | frontmatter | `/photos#slug` target only on current gallery page | Home cards link `/photos/${slug}` (`components/home/WaypointCard.tsx:110`) | **Already fixed** (b38b6c4, 10-05) |
| 29 | 09 IN-07 | frontmatter | Server-HTML assertion escapes only first `&` | `e2e/homepage.spec.ts:56` `.replace('&', '&amp;')` | **Fix here** (`replaceAll`) |
| 30 | 10 IN-01 | 10-REVIEW.md:170 | Hidden callout takes the first Escape | `PhotoViewer.tsx:321,536` unchanged | **UI → Phase 14** (behaviour decision for Tim, as the review says) |
| 31 | 10 IN-02 | :176 | `CSS.escape` without jsdom fallback | `PhotoViewer.tsx:340`; fallback exists in `LightboxDialog.tsx:111-113` | **Fix here** (share `cssEscape`) |
| 32 | 10 IN-03 | :182 | Duplicated photo-path parsing and `isEditable` | `LightboxDialog.tsx:79,90` vs `lib/photos/stepping.ts:22` | **Hand to Phase 17** (photo/region routes change this parsing) |
| 33 | 10 IN-04 | :188 | Neighbour preload asks for AVIF only | `PhotoViewer.tsx:182` | **Hand to Phase 18** (LBOX-09 stepping rework) |
| 34 | 10 IN-05 | :194 | `STAGE_SIZES` ignores tier height conditions | `PhotoViewer.tsx:149` | **Hand to Phase 18** (immersive layout resizes the stage) |
| 35 | 10 IN-06 | :200 | Unused parameters (`at`, `labelsOn`) | `ZoomStage.tsx:126,225`; `Hotspots.tsx` | **Fix here** (typecheck proves it) |
| 36 | 10 IN-07 | :206 | Fact list keyed by text | `components/photos/Hotspots.tsx:89` | **Fix here** |
| 37 | 10 IN-08 | :212 | Row-height drift guard not tied to breakpoint | `components/__tests__/GalleryGrid.test.tsx:166-167` | **Hand to Phase 18** (PHOTO-06 rewrites the view tests) |
| 38 | 10 IN-09 | :218 | Absence-only asserts after fixed sleeps | `e2e/photos-lightbox.spec.ts:783-837`, `photos-sweep.spec.ts:214` | **Fix here** (D-18 example; positive settle signal first). Some of these tests cover the view switch Phase 18 retires; fix the ones that survive |
| 39 | 10 IN-10 | :224 | `closing` never reset in LightboxDialog | `LightboxDialog.tsx:162-163` | **Fix here** (reset in the layout effect; unit-testable) |
| 40 | 12 IN-08 | 12-REVIEW.md:94 | Fieldless `validation` offers a pointless Retry | `SummitRegister.tsx` unchanged | **Tim's call** (copy/UX); if fixed, Phase 14 |
| 41 | 12 IN-09 | :110 | `storeCopy` sync throw replaces a good answer | `public/service-worker.js:23-31` | **Fix here** (try/catch; test in the existing SW harness). Separate commit from CLEAN-01's change to the same file |
| 42 | 12 IN-10 | :126 | Name-too-long copy hard-codes 100 | `SummitRegister.tsx:36` | **Fix here** (same output today) |
| 43 | 12 IN-11 | :132 | Only `UPSTASH_*` names read | `lib/rate-limit.ts:24-25`; README no longer mentions Upstash (cf7975b) | **Handed to GUARD-09** (D-16) |
| 44 | 12 IN-12 | :138 | Floors checked only on the hoisted lockfile copy | `check-install-parity.mjs:143,215` | **Fix here** (guard) + selftest fixture with a nested older copy |

Totals: already fixed 10, fix here 21, handed over 8 (DEPS-06, SHELL-07, GUARD-09, Phase 14 ×1, Phase 17 ×1, Phase 18 ×3), accept 2, Tim's call 3 (07 WR-07, 07 IN-08, 12 IN-08) = 44. Note: the Phase 9 ledger's IN-01..IN-03 ids were reused by the later 09-REVIEW.md run; the titles in `09-REVIEW-DISPOSITION.md` frontmatter are the ones triaged here.

## Common Pitfalls

### Pitfall 1: the D-06 dispatch never satisfies the ruleset
**What goes wrong:** the companion dispatches `ci.yml`, CI goes green, but the PR stays "Expected — Waiting for status to be reported".
**Why:** `workflow_dispatch` checks are not evaluated for PRs or rulesets [CITED: troubleshooting-required-status-checks].
**Avoid:** relay pattern (Open Q1) or option B; prove it with D-10's `[ci skip]` PR.
**Warning sign:** `gh pr checks` lists no `CI OK` while the dispatched run is green.

### Pitfall 2: fail-closed code reaches `main` before the variable names are known
**What goes wrong:** production has the KV pair under a third name, or none; every contact POST gets 503.
**Avoid:** Tim runs `npx vercel@latest env ls production` before the mid-phase PR merges; the code reads both pairs. A variable change takes effect only after a redeploy.
**Warning sign:** 503s from `/api/feedback`; `[rate-limit]` `refused` lines.

### Pitfall 3: `VERCEL_ENV` missing in production
**What goes wrong:** if "Enable access to System Environment Variables" is off, `VERCEL_ENV` is undefined and the limiter silently stays fail-open.
**Avoid:** Tim confirms the checkbox; the unit tests pin `VERCEL_ENV === 'production'` behaviour; the 429 probe proves the limiter is configured (it cannot prove fail-closed, which stays unit-tested per SC 2).

### Pitfall 4: draft PRs cannot demonstrate a merge refusal
**What goes wrong:** `gh pr merge` on a draft fails because it is a draft, and `mergeStateStatus` reads `DRAFT`, so D-10's record proves nothing about the ruleset.
**Avoid:** keep the PR draft while CI runs, then `gh pr ready` only on the red PR right before `gh pr merge --merge`, record the refusal naming `CI OK`, and close. Never try `--admin`: if the ruleset were wrong it would merge a red commit into production. Prove "no bypass" from the ruleset GET (`current_user_can_bypass: "never"`, empty `bypass_actors`) and `rules/branches/main`.

### Pitfall 5: the probe's wording and counts
**What goes wrong:** after fail-closed lands, the probe's failure texts mislead: `'500 here means the route crashed, most likely on bad Upstash credentials'` (`e2e/prod/contact-form.prod.ts:106`) and ``No 429 after ${LIMIT_PROBES} requests: the Upstash variables are missing, so every request is allowed`` (:168). With fail-closed, missing variables give 503, not 200/400. Also the limit test posts `INVALID_BODY`, not honeypot bodies; the 429 comes on the sixth request overall (2 default tests + 4 loop probes), not the sixth honeypot.
**Avoid:** update both messages (503 = limiter unavailable); decide whether the loop should post honeypot bodies to match GUARD-09's wording (both prove the same thing, because the limiter runs before parsing).

### Pitfall 6: Playwright 1.65 changes more than pixels
**What goes wrong:** functional E2E breaks (accessible names, inert waits) and gets mixed into the re-baseline.
**Avoid:** run the full three-engine E2E on the bump commit first; fix functional fallout in its own commit; only then dispatch the visual re-baseline; ratify any diff under the zero-diff exception policy.

### Pitfall 7: a new CI job escapes `CI OK`
**What goes wrong:** someone adds a job and forgets `ci-ok.needs`; it can go red without blocking merges.
**Avoid:** `check-ci-gate.mjs` fails when `ci-ok` `needs` differs from the set of other job ids, when `ci.yml` has workflow-level `paths:`/`paths-ignore:`, or when a job named `CI OK` appears in another workflow outside the relay's dynamic name. Wire it into `npm run lint` and the selftest.

### Pitfall 8: the relay and Vercel's same-name warning
Vercel: "Avoid using the same name for actions across multiple workflows … these will collide and introduce race conditions when used with GitHub branch protection rules, GitHub rulesets, and Vercel Deployment Checks" [CITED: vercel.com/docs/deployment-checks]. The relay's `CI OK` appears only on PR heads with a skip marker; production commits (merge commits on `main`) never carry one and the relay never runs on `push`, so Deployment Checks only ever see `ci.yml`'s `CI OK`. Record this as the accepted exception to D-06's uniqueness rule if Tim picks option A.

### Pitfall 9: old branches and Dependabot PRs after D-05
`pull_request` runs use the workflow from the PR merge ref, so open PRs get `CI OK` on their next push or `@dependabot rebase`; a re-run of an old run uses the old workflow and never produces `CI OK` [ASSUMED: re-run semantics]. Branches cut before the merge lack `workflow_dispatch:` in their `ci.yml`, so the relay's dispatch fails red for them until rebased. The relay and keep-alive workflows only exist once they are on `main` (`pull_request_target` and `schedule` read the default branch).

### Pitfall 10: audit sweep surfaces real findings on new pages
`/projects/coin-flip` (with its clip) and photo slugs 2-4 have never been through the full audit (axe, CSP, console, links, CLS). Expect possible findings; fix them, never add exemptions (`ALLOWED_CONSOLE` must not grow).

## Code Examples

### `main-ruleset.json` (D-01, D-03; for Tim to apply)
```json
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "bypass_actors": [],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 0, "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false, "require_last_push_approval": false,
        "required_review_thread_resolution": false, "allowed_merge_methods": ["merge"] } },
    { "type": "required_status_checks", "parameters": {
        "strict_required_status_checks_policy": false, "do_not_enforce_on_create": false,
        "required_status_checks": [{ "context": "CI OK", "integration_id": 15368 }] } }
  ]
}
```
Tim: `! gh api -X POST repos/tlex-web/portfolio-app/rulesets --input .planning/phases/13-repo-safety-test-debt/main-ruleset.json`. Agent verifies: `gh api repos/tlex-web/portfolio-app/rules/branches/main` (expect four rules carrying the new `ruleset_id`) and `gh api repos/tlex-web/portfolio-app/rulesets/<id> --jq '{bypass_actors, current_user_can_bypass, rules}'`. The API now returns extra `pull_request` fields (`required_reviewers`, `require_extra_approval_for_unattributed_changes`) that the export of 10401314 shows; diff on the fields we set, not the whole object.

### Keep-alive workflow (D-13, D-14)
```yaml
name: Upstash keep-alive
on:
  schedule:
    - cron: '23 5 * * *'     # daily; GitHub pauses schedules after 60 days without repo activity (email first)
  workflow_dispatch:          # lets Tim run it once after adding the secrets
permissions: {}
jobs:
  ping:
    name: Upstash keep-alive  # never "CI OK"; not in ci.yml; no pull_request trigger
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - env:
          URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}     # or the KV_ pair, matching `vercel env ls production`
          TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}
        run: |
          [ -n "$URL" ] && [ -n "$TOKEN" ] || { echo "::error::Upstash secrets are not set"; exit 1; }
          body=$(curl -fsS --max-time 20 -H "Authorization: Bearer $TOKEN" "$URL/ping")
          echo "$body" | jq -e '.result == "PONG"'
```
REST format: path-style commands with `Authorization: Bearer $TOKEN`; success JSON has a `result` field, failure an `error` field; "Read Only token permits access to the read commands only" [CITED: upstash.com/docs/redis/features/restapi]. Whether a `PING` counts as activity for the 14-day archival is not documented [ASSUMED]; a `SET keepalive:ping <timestamp> EX 1209600` (needs the full token) is the stronger keep-alive, a `PING` with a read-only token the least-privilege one. The monitor role catches either failure within a day.

## State of the Art

| Old approach | Current approach | When changed | Impact |
|---|---|---|---|
| Classic branch protection, per-job required checks | Rulesets + one aggregate check pinned to an app | Rulesets GA; app pin via `integration_id` | Renames and matrices never touch settings |
| "Required check from any event on the head SHA" | Only `push`, `pull_request`, `pull_request_review`, `pull_request_target`, `deployment`, `deployment_status` job checks count | Current GitHub docs | `workflow_dispatch` re-runs cannot unblock a PR |
| Vercel promotes every production build | Deployment Checks hold promotion on named GitHub checks | 2025-10-09 changelog | Closes the "merge deploys before its CI" gap if Hobby has it |
| Playwright Docker images on Node 24 | Node 26 in 1.65 images | 1.65.0 | `setup-node` keeps CI on 24 |

**Deprecated/outdated:** `ci.yml`'s "Optimize images" steps (script gone); `next.config.ts` `images` block (no `next/image`).

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | A `pull_request_target` job's check run attaches to the PR head SHA and satisfies the ruleset | Pattern 2, Open Q1 | Relay produces no counted `CI OK`; fallback option B/C needed; D-10 proof catches it |
| A2 | Vercel Deployment Checks exist on Hobby | Identifiers | D-07 fallback (record residual risk in PROJECT.md) |
| A3 | "Enable access to System Environment Variables" is on for the project | Pitfall 3 | Fail-closed never engages in production |
| A4 | `setup-node` puts Node 24 ahead of the image's Node 26 on `PATH` | DEPS-06 | Tests run on Node 26; parity guard does not detect it |
| A5 | Bare `test.slow()` still works in 1.65 | DEPS-06 | 8 call sites need a description argument |
| A6 | Dependabot auto-closes #140 once `main` has 1.65.0 | DEPS-06 | Close by hand with Tim's OK |
| A7 | GitHub compare API caps `files` at 300 per response | Pattern 1 | Large diffs misclassified; the sketch already falls back to full CI at ≥ 300 |
| A8 | Upstash counts a `PING` as activity for archival | Keep-alive | Database archives despite the job; the job then fails and emails Tim |
| A9 | Re-running an old workflow run uses the old workflow file | Pitfall 9 | Minor: an old run might produce `CI OK` |
| A10 | `gh run watch --exit-status --interval` flags as written | Pattern 2 | Adjust flags at implementation |

## Open Questions

1. **D-06 mechanism (blocks GUARD-08 design; needs Tim's checkpoint before the relay is built)**
   - What we know: GitHub docs say `workflow_dispatch` job checks "do not satisfy a required status check in a branch ruleset"; `pull_request_target` is eligible and not affected by skip markers; job names can use `needs`.
   - What's unclear: whether a `pull_request_target` job check attaches to the head SHA (LOW, undocumented).
   - Options:

     | Option | What happens on a `[ci skip]` head | Pros | Cons |
     |---|---|---|---|
     | **A. Relay mirror (recommended)** | `pull_request_target` job named `CI OK` dispatches `ci.yml`, waits, mirrors its result | Keeps D-06's outcome (full CI, real green); ship notes merge without a recovery commit | A second workflow can emit `CI OK` (exception to D-06's uniqueness rule, Pitfall 8); a runner waits ~40 min; A1 unproven |
     | B. Relay fail-fast | Same eligible `CI OK`, red, "push a commit without the marker" | Simple, no waiting job | Head never goes green; GSD's empty-commit recovery still needed |
     | C. No companion | Check stays pending (fail-closed) until a new push | Nothing to build | Does not meet D-06; "pending" until someone pushes |
   - Recommendation: A, with B as the fallback if D-10's `[ci skip]` proof shows the check is not counted (then C, recorded as accepted risk).

2. **Production Upstash variable names** — not confirmed (no Vercel CLI, project not linked). Tim runs `npx vercel@latest link` (decline env pull) and `npx vercel@latest env ls production` before the GUARD-09 code merges.

3. **Vercel Deployment Checks on Hobby and the System Environment Variables checkbox** — Tim checks both in the dashboard.

4. **Keep-alive command and token** — `SET` with the full token (stronger) vs `PING` with a read-only token (least privilege). Recommend `PING` first; switch if an Upstash archival warning arrives.

5. **Three ledger rows need Tim's call** (07 WR-07, 07 IN-08 after measurement, 12 IN-08).

6. **Mid-phase PR contents** — recommend: CI gate (`changes`, `CI OK`, `workflow_dispatch`, relay, keep-alive file, `check-ci-gate.mjs`), the CLEAN-01 CI comment removal, and the dual-pair limiter **only if** Tim has confirmed the names; otherwise ship the limiter in a second PR. The milestone branch `gsd/v2.1-survey-expansion` is local and unpushed, so the PR also carries the v2.1 planning docs (all docs-only paths).

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `gh` CLI, authenticated with `workflow` scope | rulesets GETs, proofs, dispatch, pushes of workflow files | ✓ | 2.103.3 | — |
| `jq` | local checks of `CI OK` logic | ✓ | 1.8.2 | — |
| Node (local) | scripts, jest | ✓ | v26.13.1 (project pins 24.x; CI uses 24) | Run version-sensitive checks in CI |
| npm | install | ✓ | 11.6.1 | — |
| Vercel CLI | `env ls production` | ✗ (not installed; project not linked) | — | `npx vercel@latest` on Tim's machine |
| Docker | optional local actionlint | ✓ (binary present; daemon not checked) | — | Skip; CI is the check |
| actionlint | workflow linting | ✗ | — | `check-ci-gate.mjs` + a real CI run |
| MCR image `playwright:v1.65.0-noble` | DEPS-06 | ✓ (tag listed) | 1.65.0 | — |

**Missing with no fallback:** none. **Missing with fallback:** Vercel CLI (Tim via `npx`), actionlint.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest ^30.5.2 (jsdom default; `@jest-environment node` per file), Playwright 1.64.1 → 1.65.0, Node guard selftest harness |
| Config files | `jest.config.js`, `playwright.config.ts`, `playwright.prod.config.ts`, `scripts/guards/selftest.mjs` |
| Quick run | `npx jest lib/__tests__/rate-limit.test.ts app/api/__tests__/feedback.test.ts` ; `npm run guard:selftest` |
| Full suite | `npm run lint && npm run type-check && npm test` (local); CI `CI OK` on the PR (authoritative, includes three-engine E2E and Visual) |
| Note | `next/jest` does not load `.env.local` in the test environment [CITED: node_modules/next/dist/docs/01-app/02-guides/environment-variables.md "Test Environment Variables"]; limiter tests pass an explicit env object anyway |

### Phase Requirements → Test Map
| Req ID | Behaviour | Test type | Automated command | File exists? |
|--------|-----------|-----------|-------------------|-------------|
| GUARD-07 | `ci-ok` needs every job; no workflow `paths:`; `CI OK` name unique | guard + selftest | `node scripts/guards/check-ci-gate.mjs && npm run guard:selftest` | ❌ Wave 0 |
| GUARD-07 | Ruleset live, no bypass | API check (after Tim applies) | `gh api repos/tlex-web/portfolio-app/rules/branches/main` + ruleset GET diff | manual-only (settings) |
| GUARD-07 | Red PR cannot merge | live proof (D-10) | draft → ready → `gh pr merge --merge` refused | manual-only (live GitHub) |
| GUARD-08 | Docs-only PR takes the fast path; `[ci skip]` head gets final `CI OK` | live proof (D-10) | `gh pr checks <n>`; `gh api repos/…/commits/<sha>/check-runs --jq '.check_runs[]|{name,conclusion}'` | manual-only |
| GUARD-08 | `CI OK` jq accepts only intended skips | unit (jq fixture) | `echo '<needs json>' \| jq -e '<expr>'` cases inside `check-ci-gate` selftest | ❌ Wave 0 |
| GUARD-09 | Production refuses on unconfigured / error / timeout; preview/dev allow; both name pairs; no mixed pair | unit | `npx jest lib/__tests__/rate-limit.test.ts` | ❌ Wave 0 |
| GUARD-09 | Route returns 503 `server-error` on `unavailable`, logs metadata only | unit | `npx jest app/api/__tests__/feedback.test.ts` | ✅ (extend) |
| GUARD-09 | 6th request → 429 on production | live probe | `PROD_FORM_LIMIT=1 npm run test:prod-form` (Tim) | ✅ |
| DEPS-06 | Tags = lockfile; 1.65 E2E green; re-baseline set declared | guard + CI | `npm run guard:parity`; `node scripts/ci/check-visual-run.mjs --sha <HEAD> --wait 30`; `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some …` | ✅ |
| VERIFY-05 | Sweep covers every sitemap path; every app page template has a `ROUTES` representative | e2e + unit | `PW_PROD=1 npx playwright test e2e/audit.spec.ts --project=chromium`; `npx jest <template-coverage test>` | ❌ Wave 0 (template test) |
| VERIFY-06 | G5 wrong offset / GPS drift / off-plate fail; G6 invalid source keeps files, exit 1 | selftest (spawn) | `npm run guard:selftest` | ❌ Wave 0 |
| VERIFY-07 | Every ledger row has a final disposition in both places | doc check | `git grep -n "| open |" -- .planning/milestones/v2.0-phases/0{7,9}*/ .planning/milestones/v2.0-phases/1{0,2}*/` returns nothing | manual + grep |
| CLEAN-01 | Targets gone; no pixel change | grep + CI visual | `git grep -n "TILT_CONFIG\|cssDuration\|cssEase\|dns-prefetch\|_next/image\|optimize-images" -- lib app public .github next.config.ts`; `check-visual-run.mjs` + `check-snapshot-commit.mjs --none` | ✅ |

### Sampling Rate
- **Per task commit:** the quick commands for the touched area, plus `npm run guard:selftest` for any guard/script change.
- **Per wave merge:** `npm run lint && npm run type-check && npm test`.
- **Phase gate:** green `CI OK` on the phase PR, the three D-10 proofs recorded, `gh api` ruleset verification, Tim's 429 probe, before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `lib/__tests__/rate-limit.test.ts` (`@jest-environment node`; mock `@upstash/ratelimit` and `@upstash/redis`) — GUARD-09
- [ ] `scripts/guards/check-ci-gate.mjs` + `scripts/guards/__selftest__/ci-gate/{good,bad-*}/` + `guard:ci` in the `lint` chain — GUARD-07/08
- [ ] `--root` flags in `build-photo-data.mjs` and `build-derivatives.mjs`, then G5/G6 cases in `selftest.mjs` — VERIFY-06
- [ ] Template-coverage unit test (every `app/(site)/**/page.tsx` maps to a `ROUTES` entry) — VERIFY-05
- No framework install needed.

## Security Domain

`security_enforcement` is absent from `.planning/config.json`, so enabled.

### Applicable ASVS Categories
| ASVS category | Applies | Standard control |
|---------------|---------|-----------------|
| V1 Architecture / CI integrity | yes | Ruleset with empty bypass, app-pinned `CI OK`, least-privilege `permissions:` per job |
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes | `pull_request_target` relay: no checkout, `permissions: {}` at top, only `actions: write` in the relay job, fork heads refused |
| V5 Input Validation | yes | Untrusted PR fields (`head.ref`, commit message) only via `env:`, never `${{ }}` inside `run:`; zod unchanged in the route |
| V7 Error handling / logging | yes | Structured `[rate-limit]` refusal line, no visitor data (D-04); the keep-alive is the monitor |
| V11 Business logic (abuse) | yes | Fail-closed limiter in production; 5/hour sliding window unchanged |
| V14 Configuration | yes | Secrets only in repo secrets; never `vercel env pull`; `.vercel/` is gitignored (`.gitignore:51`) |

### Known Threat Patterns
| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| "Pwn request" via `pull_request_target` checking out PR code | Elevation of privilege | Relay never checks out or runs PR code; the dispatched `ci.yml` runs with its own `contents: read` |
| Script injection through branch names or commit messages | Tampering | Pass through `env:`; quote shell variables |
| Spoofed `CI OK` status from another app | Spoofing | `integration_id: 15368` on the required check |
| Forged `CI OK` via Checks API from a workflow with `checks: write` | Spoofing | No workflow gets `checks: write`; `check-ci-gate.mjs` can flag `checks: write` |
| Contact-form flood when Redis is down | Denial of service / abuse | Fail-closed in production, 503 |
| Upstash token leak from repo secrets | Information disclosure | Scheduled workflow only (no PR trigger, secrets unavailable to forks); prefer the read-only token |

## Sources

### Primary (HIGH confidence)
- Repo files read this session: `.github/workflows/ci.yml`, `.github/workflows/visual-baselines.yml`, `.github/dependabot.yml`, `lib/rate-limit.ts`, `app/api/feedback/route.ts`, `lib/contact/api-contract.ts`, `components/contact/SummitRegister.tsx` (224-246), `e2e/prod/contact-form.prod.ts`, `playwright.prod.config.ts`, `playwright.config.ts`, `e2e/routes.ts`, `e2e/audit.spec.ts`, `app/sitemap.ts`, `lib/photos/view-model.ts` (320-400), `scripts/photos/build-photo-data.mjs`, `scripts/photos/build-derivatives.mjs`, `data/schemas/photo.ts` (57-88), `scripts/guards/check-install-parity.mjs`, `scripts/guards/test-count.mjs` (1-60), `scripts/guards/selftest.mjs` (1-117), `scripts/ci/check-visual-run.mjs` (1-80), `lib/animations.ts`, `lib/__tests__/motion-tokens.test.ts`, `next.config.ts`, `public/service-worker.js` (180-215), `app/layout.tsx` (40-70), `jest.config.js`, all four review ledgers and reviews.
- Installed library source: `node_modules/@upstash/ratelimit/dist/index.js:750-949`, `dist/index.d.ts:40-95`; `node_modules/@upstash/redis/nodejs.js:185-230, 6904-6929`.
- Next 16.4.5 bundled docs: `image.md` ("qualities"), `next-config-js/images.md`, `guides/environment-variables.md`.
- `gh api` GETs: rulesets, ruleset 10401314, `rules/branches/main`, branch protection, `apps/github-actions`, `apps/vercel`, check runs on `main`, repo settings, Actions permissions, secrets list, PR #140 checks and failed log, CI job timings.
- npm registry (`npm view`) for `@playwright/test`, `playwright`, `playwright-core` 1.65.0; MCR tag list.

### Secondary (MEDIUM confidence, official docs)
- https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
- https://docs.github.com/en/actions/reference/workflows-and-actions/contexts
- https://vercel.com/docs/deployment-checks ; https://vercel.com/changelog/block-vercel-deployment-promotions-with-github-actions
- https://vercel.com/docs/environment-variables/system-environment-variables
- https://upstash.com/docs/redis/features/restapi ; https://upstash.com/docs/redis/help/faq (14-day archival)
- https://github.com/microsoft/playwright/releases/tag/v1.65.0

### Tertiary (LOW confidence)
- nixpkgs workflow README (via search) on `pull_request_target` base/head context; no source states which SHA a `pull_request_target` check satisfies.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (versions, tags and ids verified with tools)
- Architecture: MEDIUM (CI gate and limiter patterns are standard; the relay's head-SHA attachment is LOW until proven)
- Pitfalls: HIGH for repo-derived ones, MEDIUM for 1.65 behaviour (release notes, not yet run)
- Ledger triage: HIGH for "already fixed" and "still present" evidence; dispositions are proposals for Tim

**Research date:** 2026-11-12
**Valid until:** 2026-11-26 (GitHub/Vercel behaviour and Playwright releases move fast; re-check the relay facts when implementing)
