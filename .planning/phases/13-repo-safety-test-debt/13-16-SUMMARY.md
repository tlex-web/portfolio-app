---
phase: 13-repo-safety-test-debt
plan: 16
subsystem: infra
tags: [github, ruleset, ci-ok, merge-gate, vercel, deployment-checks, d-01, d-02, d-03, d-04, d-05, d-07, guard-07, guard-08]

requires:
  - phase: 13-repo-safety-test-debt
    provides: "13-01/13-07/13-10 CI OK aggregate job, docs-only fast path and skip relay; 13-05 Tim's production facts (Deployment Checks offered on Hobby); 13-15 PR #143 with a green CI OK"
provides:
  - "PR #143 merged into main by Tim with a merge commit: d48af99994a419aced1473f56b8cfa9b8d0a5c11 (parents b81d6f2, 962e732), 2026-11-13T16:07:24Z"
  - "CI OK success (app 15368) on the merge commit from the push run 43459507776, recorded before the ruleset existed (D-05)"
  - "Live repository ruleset `main`, id 27216079, applied by Tim: no bypass actors, PR required with 0 approvals, merge commits only, CI OK pinned to integration 15368, strict off. Verified field by field against main-ruleset.json"
  - "Ruleset 10401314 (automated-actions) deleted by Tim; GET returns 404; its raw export is saved as automated-actions-10401314.json (D-02)"
  - "Vercel Deployment Checks on CI OK, per Tim's reply \"applied, deployment checks on\". Not verifiable by the agent; live evidence is a follow-up for 13-22"
affects: [13-17 (production deployment of d48af99 predates the Deployment Checks setting), 13-19 (live proofs now run under the ruleset), 13-21, 13-22 (Key Decisions rows: ruleset id 27216079 and the production-gate row; live Deployment Checks evidence), Dependabot PR #140 (needs a rebase for CI OK)]

actuals:
  tokens: 4700     # chars/4 over the files this plan changed: main-ruleset.json (915 chars), automated-actions-10401314.json (1043) and this SUMMARY (~17,000)
  tasks: 3
  commits: 1       # MEASURED: git rev-list --count 962e732..HEAD at this SUMMARY write = 485ecbe. The docs commits carrying this SUMMARY and STATE/ROADMAP follow
plan_head_before: 962e732e0da09f62b2bc5bed0e6004cabb61ef8a
plan_head_after: 485ecbee202504a1e8384617eaa6faa1ddf6d179

tech-stack:
  added: []
  patterns:
    - "Ruleset verification projects the live GET onto the keys the payload sets (rules matched by type) and compares for equality, so API-added fields (id, source, node_id, required_reviewers, require_extra_approval_for_unattributed_changes, _links) cannot cause a false mismatch"

key-files:
  created:
    - .planning/phases/13-repo-safety-test-debt/main-ruleset.json
    - .planning/phases/13-repo-safety-test-debt/automated-actions-10401314.json
    - .planning/phases/13-repo-safety-test-debt/13-16-SUMMARY.md
  modified: []

key-decisions:
  - "13-16: Tim merged PR #143 with a merge commit (literal reply \"merged\"); d48af99 has two parents (b81d6f2, 962e732), as D-03 requires. CI OK on d48af99 concluded success (app 15368, check run 132021059347) before any ruleset existed (D-05)"
  - "13-16: Tim applied the main ruleset and deleted 10401314 (literal reply \"applied, deployment checks on\"). The live ruleset is id 27216079 and matches main-ruleset.json on every field the payload sets; 10401314 returns HTTP 404"
  - "13-16: Deployment Checks on CI OK are recorded from Tim's reply only. The agent has no Vercel API access in this plan, so the first production deployment after the next merge to main is the live evidence, owned by 13-22. The d48af99 production deployment (success 16:09:27Z, before CI OK at 16:39:08Z) predates the setting and is not evidence"

patterns-established:
  - "Settings plans: the agent prepares the payload and the recovery export, Tim runs the POST and DELETE, and the agent verifies with GET only"

requirements-completed: [GUARD-07, GUARD-08]

coverage:
  - id: D1
    description: "PR #143 merged into main with a merge commit, and the push run of ci.yml on the merge commit reports CI OK success before any ruleset exists (D-05)"
    requirement: GUARD-07
    verification:
      - kind: other
        ref: "gh pr view 143 --json state,mergeCommit: MERGED, d48af99994a419aced1473f56b8cfa9b8d0a5c11; gh api commits/d48af99 --jq .parents: b81d6f2, 962e732"
        status: pass
      - kind: other
        ref: "gh api commits/d48af99.../check-runs: CI OK success, app 15368, check run 132021059347 (run 43459507776, 16:07:29Z to 16:39:08Z); ruleset 27216079 created_at 16:43:57Z"
        status: pass
    human_judgment: false
  - id: D2
    description: "rules/branches/main lists deletion, non_fast_forward, pull_request and required_status_checks, each from ruleset 27216079"
    requirement: GUARD-07
    verification:
      - kind: other
        ref: "gh api repos/tlex-web/portfolio-app/rules/branches/main --jq '[.[].type] | sort' and the ruleset_id of each rule"
        status: pass
    human_judgment: false
  - id: D3
    description: "Ruleset 27216079: bypass_actors [], current_user_can_bypass never, enforcement active, ~DEFAULT_BRANCH included, allowed_merge_methods [merge], 0 approvals, the four booleans false, strict off, do_not_enforce_on_create false, one check {CI OK, 15368}"
    requirement: GUARD-07
    verification:
      - kind: other
        ref: "gh api repos/tlex-web/portfolio-app/rulesets/27216079 + jq -e field checks (true) + projection onto main-ruleset.json keys (equal: true)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Ruleset 10401314 is gone and its raw export is saved first"
    requirement: GUARD-07
    verification:
      - kind: other
        ref: "gh api -i repos/tlex-web/portfolio-app/rulesets/10401314: HTTP/2.0 404 Not Found; jq -e '.id == 10401314' automated-actions-10401314.json: true"
        status: pass
    human_judgment: false
  - id: D5
    description: "Vercel Deployment Checks require CI OK before production promotion (D-07)"
    requirement: GUARD-08
    verification:
      - kind: manual_procedural
        ref: "Tim's literal reply: \"applied, deployment checks on\""
        status: unknown
    human_judgment: true
    rationale: "The Vercel setting cannot be read by the agent in this plan (no Vercel CLI or API calls). Live evidence is the first production deployment after the next merge to main reaching success only after CI OK on that merge commit; 13-22 owns that check"

duration: 1h50m
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 16: Main Ruleset and Production Gate Summary

**`main` now requires a green `CI OK` from the GitHub Actions app (integration 15368) through ruleset 27216079, with no bypass actors, merge commits only, 0 approvals and strict off. Tim merged PR #143 as merge commit `d48af99`, whose push run reported `CI OK` success before the ruleset existed (D-05). Tim then applied the ruleset, deleted the inert ruleset 10401314 (GET now returns 404, export saved), and turned on Vercel Deployment Checks. The agent verified every ruleset field by `gh api` GET and changed no setting.**

## Performance

- **Duration:** about 1h50m of wall time, most of it Tim's merge, the 32-minute push run of CI and Tim's settings work. The agent's own work was about 20 minutes.
- **Started:** about 2026-11-13T15:00Z (Task 1; its commit `485ecbe` is 15:05:40Z)
- **Completed:** 2026-11-13T16:50Z
- **Tasks:** 3 of 3 (Tasks 2 and 3 were Tim's actions, verified by the agent)
- **Files modified:** 3 (two JSON files and this SUMMARY, all under `.planning/`)

## Task 1: payload, export and Tim's commands

- `gh api apps/github-actions --jq .id` printed `15368`. All 9 check runs on `b81d6f2` (main's tip at the time) and `CI OK` on PR #143 head `962e732` carried app id 15368.
- `automated-actions-10401314.json` is the raw, unchanged output of `GET rulesets/10401314` (1043 bytes): enforcement active, `conditions.ref_name.include: []`, rules deletion, non_fast_forward and pull_request (`require_code_owner_review: true`, merge/squash/rebase), one bypass actor `{actor_id: 29110, actor_type: Integration, bypass_mode: always}`, `current_user_can_bypass: "never"`. It can be re-POSTed if ever needed (D-02).
- `main-ruleset.json` (915 bytes) follows RESEARCH "Code Examples" with the bypass actor dropped (D-01) and the confirmed integration id.
- Both plan `<verify>` jq checks printed `true`.
- The command lines handed to Tim, in full-path form because `gh` is not on PATH in the agent's bash:
  1. `! "/c/Program Files/GitHub CLI/gh.exe" api -X POST repos/tlex-web/portfolio-app/rulesets --input .planning/phases/13-repo-safety-test-debt/main-ruleset.json`
  2. `! "/c/Program Files/GitHub CLI/gh.exe" api -X DELETE repos/tlex-web/portfolio-app/rulesets/10401314`

## Task 2: the merge and CI OK on main

Tim's literal reply: "merged".

| Field | Value |
|-------|-------|
| PR | #143, `MERGED` at 2026-11-13T16:07:24Z by tlex-web |
| Merge commit | `d48af99994a419aced1473f56b8cfa9b8d0a5c11`, parents `b81d6f2` (main) and `962e732` (PR head): a true merge commit (D-03) |
| Push run of CI | 43459507776, 16:07:29Z to 16:39:08Z, conclusion success |
| Jobs | Classify changes, Lint and Type Check, Unit Tests, E2E Tests, Visual Regression, Build Application, Security Audit, CI OK: all success. Dependency Review skipped (it runs on PRs only) |
| `CI OK` | check run 132021059347, app id 15368, success |
| Check runs on `d48af99` | all 11 carry app id 15368 |
| CodeQL | run 43459504568, success |
| `ci-skip-relay.yml` on main | blob `567076047a7f8fb3950f31986affded6b4c07144`, 7267 bytes |
| `upstash-keepalive.yml` on main | blob `b41ed989d396d82a7d223758858b28e559b284d8`, 3077 bytes |
| Remote phase branch | deleted on merge (`delete_branch_on_merge: true`) |

`CI OK` reached `main` (16:39:08Z) before the ruleset was created (16:43:57Z), so the gate could not strand `main` (T-13-41).

**Pitfall 9:** the only open PR is Dependabot #140 (`@playwright/test` 1.64.1 to 1.65.0). An open Dependabot PR gets `CI OK` only after a rebase onto main. With the ruleset live, #140 cannot merge until it is rebased and green. It also needs the Playwright 1.65 re-baseline (13-18/13-20).

## Task 3: ruleset and Deployment Checks

Tim's literal reply: "applied, deployment checks on".

All checks below are GET requests made by the agent after that reply.

**Rulesets on the repo** (`gh api repos/tlex-web/portfolio-app/rulesets`): exactly one, `{"id":27216079,"name":"main","target":"branch","enforcement":"active"}`.

**Rules on `main`** (`gh api repos/tlex-web/portfolio-app/rules/branches/main`):

```json
[{"ruleset_id":27216079,"type":"deletion"},{"ruleset_id":27216079,"type":"non_fast_forward"},{"ruleset_id":27216079,"type":"pull_request"},{"ruleset_id":27216079,"type":"required_status_checks"}]
```

`[.[].type] | sort` gives `["deletion","non_fast_forward","pull_request","required_status_checks"]`.

**Live ruleset** (`gh api repos/tlex-web/portfolio-app/rulesets/27216079`, created 2026-11-13T17:43:57+01:00, that is 16:43:57Z):

```json
{"id":27216079,"name":"main","target":"branch","source_type":"Repository","source":"tlex-web/portfolio-app","enforcement":"active","conditions":{"ref_name":{"exclude":[],"include":["~DEFAULT_BRANCH"]}},"rules":[{"type":"deletion"},{"type":"non_fast_forward"},{"type":"pull_request","parameters":{"required_approving_review_count":0,"dismiss_stale_reviews_on_push":false,"required_reviewers":[],"require_code_owner_review":false,"require_last_push_approval":false,"required_review_thread_resolution":false,"require_extra_approval_for_unattributed_changes":true,"allowed_merge_methods":["merge"]}},{"type":"required_status_checks","parameters":{"strict_required_status_checks_policy":false,"do_not_enforce_on_create":false,"required_status_checks":[{"context":"CI OK","integration_id":15368}]}}],"bypass_actors":[],"current_user_can_bypass":"never"}
```

(`node_id`, `updated_at` and `_links` omitted here.)

| Field | Expected (main-ruleset.json) | Live 27216079 | Match |
|-------|------------------------------|---------------|-------|
| `name` / `target` | `main` / `branch` | `main` / `branch` | yes |
| `enforcement` | `active` | `active` | yes |
| `conditions.ref_name.include` / `exclude` | `["~DEFAULT_BRANCH"]` / `[]` | same | yes |
| `bypass_actors` | `[]` | `[]` | yes |
| `current_user_can_bypass` | `never` (plan truth) | `never` | yes |
| rule types | deletion, non_fast_forward, pull_request, required_status_checks | same | yes |
| `required_approving_review_count` | 0 | 0 | yes |
| `dismiss_stale_reviews_on_push`, `require_code_owner_review`, `require_last_push_approval`, `required_review_thread_resolution` | all false | all false | yes |
| `allowed_merge_methods` | `["merge"]` | `["merge"]` | yes |
| `strict_required_status_checks_policy` | false | false | yes |
| `do_not_enforce_on_create` | false | false | yes |
| `required_status_checks` | `[{"context":"CI OK","integration_id":15368}]` | same | yes |

- The combined `jq -e` check (bypass, can-bypass, enforcement, include, exclude, name, target, merge methods, required checks, strict) printed `true`.
- A projection of the live JSON onto exactly the keys `main-ruleset.json` sets (rules matched by `type`) compared equal to the payload: `{"equal": true}`.
- Fields the API added that the payload does not set: `id`, `source_type`, `source`, `node_id`, `created_at`, `updated_at`, `_links`, `required_reviewers: []` and `require_extra_approval_for_unattributed_changes: true`. These are outside the diff by the plan's rule. The last one is GitHub's default; see Issues Encountered.

**Old ruleset:** `gh api -i repos/tlex-web/portfolio-app/rulesets/10401314` returned `HTTP/2.0 404 Not Found` (`{"message":"Not Found",...,"status":"404"}`). The export saved in Task 1 is the recovery path.

**Push block:** not tested with a live push to `main`, as the plan forbids. `GET branches/main` reports `protected: true` with tip `d48af99`.

**Deployment Checks (D-07):** Tim's reply says they are on. The agent cannot verify the Vercel setting: this plan allows no Vercel CLI or API calls. GitHub's deployments API shows the `d48af99` production deployment (id 7770069186) created and marked success at 16:09:27Z. That is before `CI OK` finished at 16:39:08Z, so that deployment ran ungated. Deployment Checks were turned on after it, so it is not evidence either way. The live evidence is the **first production deployment after the next merge to `main`**: its status should reach success only after `CI OK` succeeds on that merge commit. **Owner: 13-22.** 13-22 records the production-gate row in PROJECT.md Key Decisions from this SUMMARY. Neither 13-17 nor 13-22 merges to `main`, so the evidence most likely arrives with the phase-close merge; 13-22 should record it as pending until then. 13-17 polls production deployments only for `d48af99`, which predates the setting.

## Threat register outcomes

| Threat | Disposition | Outcome |
|--------|-------------|---------|
| T-13-37 ruleset bypass | mitigate | Mitigated: live `bypass_actors: []` and `current_user_can_bypass: "never"` on 27216079 |
| T-13-38 required check from another app | mitigate | Mitigated: `CI OK` pinned to `integration_id: 15368`, read from the live ruleset; 15368 confirmed as `apps/github-actions` |
| T-13-39 unchecked commit promoted to production | mitigate | Mitigated by Tim's setting (reply "applied, deployment checks on"); not agent-verified. Live evidence pending for 13-22. The `d48af99` deployment itself ran before the gate existed |
| T-13-40 deleted ruleset unrecoverable | mitigate | Mitigated: raw export committed in `485ecbe` before Tim's DELETE |
| T-13-41 ruleset before CI OK on main | mitigate | Mitigated: `CI OK` success on `d48af99` at 16:39:08Z; ruleset created 16:43:57Z |
| T-13-SC npm installs | accept | No package install in this plan |

## Accomplishments

- A red PR can no longer merge into `main` for anyone, Tim included. The only emergency path is Tim disabling the ruleset under Settings → Rules.
- Only merge commits can land on `main`. Deletion and force pushes are blocked.
- The old `automated-actions` ruleset, with its Integration bypass, is gone, and a re-POSTable export is saved.
- Production promotion waits on `CI OK` per Tim's Vercel setting, with live evidence handed to 13-22.

## Task Commits

1. **Task 1: Prepare the ruleset JSON, the export and Tim's exact commands:** `485ecbe` (docs)
2. **Task 2: Tim merges the mid-phase PR; the agent confirms CI OK on main:** no commit (Tim's action, verified by GET)
3. **Task 3: Tim applies the ruleset, deletes 10401314 and sets Deployment Checks; the agent verifies:** no commit (Tim's action, verified by GET)

**Plan metadata:** the docs commit adding this SUMMARY, then a docs commit for STATE and ROADMAP. All commits are local; nothing was pushed (the remote phase branch was deleted on merge).

## Files Created/Modified

- `.planning/phases/13-repo-safety-test-debt/main-ruleset.json`: the ruleset Tim POSTed (D-01, D-03).
- `.planning/phases/13-repo-safety-test-debt/automated-actions-10401314.json`: raw export of the deleted ruleset (D-02).
- `.planning/phases/13-repo-safety-test-debt/13-16-SUMMARY.md`: this file.

## Decisions Made

- The ruleset diff projects the live GET onto the payload's keys rather than diffing whole documents, so the API's defaults do not register as mismatches. The plan asks for exactly this.
- The live Deployment Checks evidence goes to 13-22, not 13-17. 13-17 reads the `d48af99` production deployment, which finished before the setting existed. 13-22 owns the production-gate Key Decisions row.
- GUARD-07 and GUARD-08 are not ticked in REQUIREMENTS.md. 13-19, 13-21 and 13-22 also declare them and are not complete. GUARD-07 also calls for a deliberately red test PR, and GUARD-08 for the skip proofs. This matches how 13-15 handled its shared IDs.

## Deviations from Plan

None. The plan was executed as written. The only change is the command form: Tim's two lines use the full `gh.exe` path, because `gh` is not on PATH in the agent's bash. The arguments are identical to the plan's.

## Issues Encountered

- **`require_extra_approval_for_unattributed_changes: true`** appears in the live `pull_request` rule. The payload does not set it, so this is GitHub's default and outside the plan's diff. With `required_approving_review_count: 0` it is expected to be inert for Tim's own PRs. If a PR is ever blocked on an approval despite a green `CI OK`, this field is the first thing to check. It is noted for 13-19's live proofs, and nothing was changed.
- **Dependabot #140** is blocked by the new gate until it is rebased onto `main` and green (Pitfall 9). It also needs the Playwright 1.65 re-baseline (13-18/13-20).
- **Local-only commits:** `485ecbe` and this plan's docs commits exist only on the local `gsd/phase-13-repo-safety-test-debt`. The remote branch was deleted when #143 merged, and main is now protected by the ruleset, so these commits reach `main` only through a later PR.

## Known Stubs

None.

## User Setup Required

None remaining. Tim did the merge, the ruleset POST and DELETE, and the Vercel Deployment Checks setting.

## Next Phase Readiness

- **13-17:** production serves `d48af99` (deployment 7770069186, success 16:09:27Z). The keep-alive and the probe can proceed. That deployment predates Deployment Checks, so 13-17 will not see a gated promotion.
- **13-19:** `ci/13-*` live proofs now run with the relay on `main` and the ruleset live. Any PR to `main` needs `CI OK` from app 15368.
- **13-22:** record ruleset id 27216079 and the production-gate row (Deployment Checks on `CI OK`, per Tim). Confirm or record as pending the live evidence: the first production deployment after the next merge to `main` waits for `CI OK`.
- **Emergency:** if the gate must be lifted, Tim disables ruleset 27216079 under Settings → Rules. The agent never does (D-04).

## Self-Check: PASSED

- `main-ruleset.json`, `automated-actions-10401314.json` and `13-16-SUMMARY.md` exist under `.planning/phases/13-repo-safety-test-debt/`.
- Commit `485ecbe` is an ancestor of HEAD.
- Live GETs at write time: `rules/branches/main` shows 4 rules from 27216079; ruleset 27216079 matches `main-ruleset.json` on every field the payload sets (`jq -e` true, projection equal true); `rulesets/10401314` returns 404.
- `commits: 1` was measured from the ledger at `.git/gsd-plan-head-before-13-16` (`962e732..HEAD`). The docs commits that carry this SUMMARY and the STATE/ROADMAP update follow it.
- No setting was changed by the agent, no PR was merged, no workflow was dispatched, and nothing was pushed.

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
