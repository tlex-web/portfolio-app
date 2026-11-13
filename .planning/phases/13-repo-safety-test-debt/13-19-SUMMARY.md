---
phase: 13-repo-safety-test-debt
plan: 19
subsystem: infra
tags: [github, ruleset, ci-ok, live-proof, d-06, d-08, d-10, skip-relay, guard-07, guard-08]

requires:
  - phase: 13-repo-safety-test-debt
    provides: "13-16 live main ruleset 27216079 (CI OK from app 15368 required, no bypass), with ci.yml's CI OK, the docs-only fast path and ci-skip-relay.yml on main (d48af99)"
provides:
  - "Red proof: PR #144 with a deliberately failing test got CI OK failure; after gh pr ready mergeStateStatus was BLOCKED and the single gh pr merge --merge was refused by the base branch policy"
  - "Docs-only proof: PR #145 (one .planning/ file) got docs_only=true in its pull_request run, six heavy jobs skipped, CI OK success, mergeStateStatus CLEAN"
  - "Skip proof (relay acceptance test, A1): PR #146 with a [ci skip] head got no push or pull_request CI run; the relay's CI OK check run (pull_request_target, app 15368) sat on the head SHA and concluded success, it was the only CI OK in the PR's check rollup (isRequired true), and mergeStateStatus read CLEAN after gh pr ready"
  - "All three proof PRs closed unmerged, the three ci/13-proof-* branches deleted from origin, the temp worktrees removed"
  - "relay.decision: a-confirmed (Tim's selection \"a-confirmed (Recommended)\"): D-06 option A, the relay mirror, stands"
affects: [13-21 (records 'not needed': Task 1 only, Tasks 2-3 skipped, because relay.decision is a-confirmed), 13-22 (Key Decisions row for option A and the accepted check-name exception; hand-over of the unexercised long-mirror path)]

actuals:
  tokens: 7000     # chars/4 over this SUMMARY (~26,900 chars) plus the three throwaway proof files (~1,100 chars, on deleted branches)
  tasks: 3         # Tasks 1-2 by the first executor, Task 3 (Tim's decision) recorded by the continuation
  commits: 1       # MEASURED: git rev-list --count 0c272c1..HEAD at this SUMMARY write (b46ae54, the partial SUMMARY). The docs commit finalizing this SUMMARY and the STATE/ROADMAP commit follow. The three proof commits (536aea6, 2b19a2b, c374806) lived only on the deleted ci/13-proof-* branches
plan_head_before: 0c272c1fc6c2b8db3cf7ca959a57293156856b48
plan_head_after: b46ae544cbe7568b1a796cc12a6dff0b2b240ecb

tech-stack:
  added: []
  patterns:
    - "Live proofs run in temp worktrees from origin/main so the working branch never moves; each proof branch is pushed plain (new branch), opened as a draft, and closed with --delete-branch"
    - "A merge attempt on a proof PR is gated in one shell step on a fresh reading (head SHA unchanged, mergeStateStatus BLOCKED, every CI OK check run on the head concluded failure)"
    - "Which check a ruleset counted is read from the PR's GraphQL statusCheckRollup (isRequired per check run, with its check suite's workflow run event), not from the commit's check-runs list, which also holds checks the PR does not count"

key-files:
  created:
    - .planning/phases/13-repo-safety-test-debt/13-19-SUMMARY.md
  modified: []

key-decisions:
  - "13-19: Only the red proof got a merge attempt; the docs-only and [ci skip] proofs got none because they are green by design (D-10 'Nothing is merged' governs)"
  - "13-19: The red proof's test is expect(1).toBe(2), not a literal 1 === 2, so that Unit Tests is the only red job (TypeScript rejects comparing non-overlapping literal types)"
  - "13-19: relay.decision a-confirmed (Tim's selection \"a-confirmed (Recommended)\"); option A, the relay mirror, stands, so 13-21 records 'not needed' and builds no fallback"
  - "13-19: Untested path handed to 13-22: a [ci skip] head whose dispatched CI takes the full ~40-minute path has not been mirrored live (the proof's run was docs-only, ~1.5 minutes); the relay's timeout-minutes: 100 and gh run watch --interval 60 budget for it, the workflow is unchanged"

requirements-completed: []  # GUARD-07 and GUARD-08 stay Pending by the shared-ID gate: requirements.ready-ids blocked both because 13-21 and 13-22 also declare them and have no SUMMARY yet

status: complete
---

# Phase 13 Plan 19: Live Ruleset, Docs-Only and Skip-Relay Proofs Summary

**A red PR is refused by the live `main` ruleset, a docs-only PR gets a green `CI OK` in 29 seconds, and a `[ci skip]` head gets a counted `CI OK` from the relay; Tim chose `a-confirmed`, so D-06 option A stands.**

**Status: complete.** Tasks 1 and 2 were run by the first executor (partial SUMMARY in b46ae54); Task 3 is recorded below from Tim's selection.

## Proof red

PR: #144
Branch: ci/13-proof-red (from origin/main d48af99)
Head SHA: 536aea6cd0a3ab6ef567f2779dac8fdba0b1176c
Change: `lib/__tests__/ci-proof-red.test.ts`, one test `expect(1).toBe(2)` with a comment that it is a D-10 proof that must never merge. (`expect(1).toBe(2)` rather than a literal `1 === 2`: TypeScript rejects comparing two non-overlapping literal types, which would have turned Lint and Type Check red as well. With `expect`, Unit Tests is the only red job.)
CI OK: failure

| Run | Event | Workflow | Conclusion | Created to updated (UTC) |
|-----|-------|----------|------------|--------------------------|
| 43469702804 | push | CI | failure | 17:07:57 to 17:45:48 |
| 43469717491 | pull_request | CI | failure | 17:08:02 to 17:39:56 |
| 43469717034 | pull_request_target | CI skip relay | success | job named `CI skip relay` (no marker) |
| 43469712186 | dynamic | CodeQL (PR #144) | success | |

Check runs on the head SHA (`name | conclusion | app.id | check run id | run id`):

```
Analyze (actions) | success | 15368 | 132038086299 | 43469712186
Analyze (javascript-typescript) | success | 15368 | 132038086996 | 43469712186
Build Application | skipped | 15368 | 132039122040 | 43469717491
Build Application | skipped | 15368 | 132039337142 | 43469702804
CI OK | failure | 15368 | 132056437338 | 43469717491
CI OK | failure | 15368 | 132059700563 | 43469702804
CI skip relay | success | 15368 | 132038169060 | 43469717034
Classify changes | success | 15368 | 132038046264 | 43469702804
Classify changes | success | 15368 | 132038098277 | 43469717491
CodeQL | success | 57789 | 132038412842 | 132038412842
Dependency Review | skipped | 15368 | 132038049889 | 43469702804
Dependency Review | success | 15368 | 132038098721 | 43469717491
E2E Tests | success | 15368 | 132038151414 | 43469702804
E2E Tests | success | 15368 | 132038215047 | 43469717491
Lint and Type Check | success | 15368 | 132038151395 | 43469702804
Lint and Type Check | success | 15368 | 132038214987 | 43469717491
Security Audit | success | 15368 | 132038151473 | 43469702804
Security Audit | success | 15368 | 132038215155 | 43469717491
Skip-marker check | success | 15368 | 132038106816 | 43469717034
Unit Tests | failure | 15368 | 132038151448 | 43469702804
Unit Tests | failure | 15368 | 132038215072 | 43469717491
Vercel Preview Comments | success | 8329 | 132039418108 | 132039418108
Visual Regression | success | 15368 | 132038151367 | 43469702804
Visual Regression | success | 15368 | 132038215081 | 43469717491
```

The Unit Tests log shows exactly the proof test failing: `FAIL lib/__tests__/ci-proof-red.test.ts`, `D-10 red proof › fails on purpose so CI OK goes red`, `Expected: 2`, `Received: 1`. Build Application skipped because it `needs` Unit Tests.

`gh pr ready 144` at 17:46:54Z, once every check run on the head had completed. The first reading was not UNKNOWN: `BLOCKED draft=false review= mergeable=MERGEABLE`.

The reading taken immediately before the attempt (17:47:08Z): head `536aea6…` unchanged, `mergeStateStatus=BLOCKED`, and every `CI OK` check run on the head concluded `failure`. The guard passed and exactly one `gh pr merge 144 --merge` ran (no `--admin`, no `--auto`):

mergeStateStatus: BLOCKED
Merge refusal: X Pull request tlex-web/portfolio-app#144 is not mergeable: the base branch policy prohibits the merge.
To have the pull request merged after all the requirements have been met, add the `--auto` flag.
To use administrator privileges to immediately merge the pull request, add the `--admin` flag.

(gh exit code 1; afterwards `{"mergeStateStatus":"BLOCKED","mergedAt":null,"state":"OPEN"}`.) gh's text names the base branch policy, not the check. To show which requirement blocked, the GraphQL PR view right after the refusal read: `reviewDecision: null` (no review required), `statusCheckRollup.state: FAILURE`, and the only checks with `isRequired: true` were the two `CI OK` check runs, both `FAILURE`. The approval-related field (see Issues Encountered) was not the blocker.

Closed at 17:47:24Z with `--delete-branch`: `{"closedAt":"2026-11-13T17:47:24Z","mergedAt":null,"state":"CLOSED"}`.

## Proof docs-only

PR: #145
Branch: ci/13-proof-docs (from origin/main d48af99)
Head SHA: 2b19a2bd763b6951f7ecfc7062f9b09b83f0d2b9
Change: `.planning/ci-proof-docs-only.md` only.

pull_request run 43469724612 (17:08:05Z to 17:08:34Z, success). Its `Classify changes` job printed:

```
Compared d48af99994a419aced1473f56b8cfa9b8d0a5c11...2b19a2bd763b6951f7ecfc7062f9b09b83f0d2b9: 1 file(s).
docs_only=true
```

Skipped heavy jobs in that run: Lint and Type Check, Unit Tests, E2E Tests, Visual Regression, Build Application, Security Audit (all six `skipped`). Dependency Review ran and succeeded (it runs on every pull_request event and is not one of the six). The `CI OK` step printed `{"changes":"success","lint-and-typecheck":"skipped","unit-tests":"skipped","e2e-tests":"skipped","visual-regression":"skipped","build":"skipped","dependency-review":"success","security-audit":"skipped"}` and the `ci-ok.jq` verdict `true`.

CI OK: success (check run 132038338382, app 15368, from the pull_request run, 29 seconds after the run started)

The push run 43469709687 (17:07:59Z to 17:37:18Z, success) is the other one: a new branch has an all-zero `before`, so its `Classify changes` printed `No base commit to compare against; running the full CI.` and every job ran (Dependency Review skipped, as on every push). Its `CI OK` (check run 132054924944) also succeeded. So both `CI OK` check runs on the head were green; the fast one came from the pull_request run.

Check runs on the head SHA:

```
Analyze (actions) | success | 15368 | 132038112833 | 43469719425
Analyze (javascript-typescript) | success | 15368 | 132038113339 | 43469719425
Build Application | skipped | 15368 | 132038339962 | 43469724612
Build Application | success | 15368 | 132039465927 | 43469709687
CI OK | success | 15368 | 132038338382 | 43469724612
CI OK | success | 15368 | 132054924944 | 43469709687
CI skip relay | success | 15368 | 132038272155 | 43469724666
Classify changes | success | 15368 | 132038069950 | 43469709687
Classify changes | success | 15368 | 132038123330 | 43469724612
CodeQL | success | 57789 | 132038394570 | 132038394570
Dependency Review | skipped | 15368 | 132038072329 | 43469709687
Dependency Review | success | 15368 | 132038123747 | 43469724612
E2E Tests | skipped | 15368 | 132038339322 | 43469724612
E2E Tests | success | 15368 | 132038302928 | 43469709687
Lint and Type Check | skipped | 15368 | 132038339013 | 43469724612
Lint and Type Check | success | 15368 | 132038303413 | 43469709687
Security Audit | skipped | 15368 | 132038338987 | 43469724612
Security Audit | success | 15368 | 132038302885 | 43469709687
Skip-marker check | success | 15368 | 132038129479 | 43469724666
Unit Tests | skipped | 15368 | 132038339061 | 43469724612
Unit Tests | success | 15368 | 132038302921 | 43469709687
Vercel Preview Comments | success | 8329 | 132040650909 | 132040650909
Visual Regression | skipped | 15368 | 132038340453 | 43469724612
Visual Regression | success | 15368 | 132038302992 | 43469709687
```

`gh pr ready 145` at 17:38:48Z, after every check run on the head had completed. First reading: `CLEAN draft=false review= mergeable=MERGEABLE`.

mergeStateStatus: CLEAN

No merge attempt (see D-10 deviation). Closed at 17:38:54Z with `--delete-branch`: `{"closedAt":"2026-11-13T17:38:54Z","mergedAt":null,"state":"CLOSED"}`.

## Proof skip

Branch: ci/13-proof-skip (from origin/main d48af99)
PR: #146
Head SHA: c374806970108da85e6d776a6bf546276a79d225
Head commit message: `docs(13): relay proof for skipped CI [ci skip]` (the GSD ship-note form). Change: `.planning/ci-proof-skip.md` only.
Run alone: pushed at 17:47:40Z after every red and docs-only run had completed and `gh run list` showed nothing queued or in progress.

**No push or pull_request CI run exists for the head.** `GET actions/runs?head_sha=c374806…&event=push` and `…&event=pull_request` each returned `total_count: 0`. Runs on the head, all events:

| Run | Event | Workflow | Conclusion | Created to updated (UTC) |
|-----|-------|----------|------------|--------------------------|
| 43476327018 | pull_request_target | CI skip relay | success | 17:47:49 to 17:50:06 |
| 43476491448 | workflow_dispatch | CI (dispatched by the relay) | success | 17:48:48 to 17:49:08 |
| 43476324812 | dynamic | CodeQL (PR #146) | success | 17:47:48 to 17:48:44 |

Relay run: 43476327018, conclusion success (`gh run list --workflow "CI skip relay"`: `{"databaseId":43476327018,"event":"pull_request_target","headSha":"c374806970108da85e6d776a6bf546276a79d225","conclusion":"success"}`). Its log:

```
Skip marker on c374806970108da85e6d776a6bf546276a79d225; pull_request CI runs for it: 0
Mirroring CI run 43476491448 on c374806970108da85e6d776a6bf546276a79d225
CI run 43476491448 concluded: success
```

Jobs: `Skip-marker check` 17:47:52Z to 17:48:41Z (includes the 45 s wait), then the relay job, named `CI OK`, 17:48:44Z to 17:50:05Z.

Dispatched CI run: 43476491448, event workflow_dispatch, head branch `ci/13-proof-skip`, head SHA `c374806970108da85e6d776a6bf546276a79d225`, conclusion success. Its `Classify changes` printed `Compared main...c374806…: 1 file(s).` and `docs_only=true`, so the six heavy jobs skipped and its `CI OK` verdict was `true` (all of `needs` skipped except `changes`; Dependency Review skips outside pull_request). The dispatched run therefore took the docs-only fast path. That is correct for this diff, and it made the relay's mirror take about 1.5 minutes instead of about 40. A ship note on a code-changing branch would get the full run.

Check runs on the head SHA (`name | conclusion | app.id | check run id | head_sha | run id`):

```
Analyze (actions) | success | 15368 | 132060980747 | c374806 | 43476324812
Analyze (javascript-typescript) | success | 15368 | 132060979479 | c374806 | 43476324812
Build Application | skipped | 15368 | 132061663720 | c374806 | 43476491448
CI OK | success | 15368 | 132061472478 | c374806 | 43476327018
CI OK | success | 15368 | 132061660974 | c374806 | 43476491448
Classify changes | success | 15368 | 132061554103 | c374806 | 43476491448
CodeQL | success | 57789 | 132061328979 | c374806 | 132061328979
Dependency Review | skipped | 15368 | 132061556657 | c374806 | 43476491448
E2E Tests | skipped | 15368 | 132061663275 | c374806 | 43476491448
Lint and Type Check | skipped | 15368 | 132061661689 | c374806 | 43476491448
Security Audit | skipped | 15368 | 132061661840 | c374806 | 43476491448
Skip-marker check | success | 15368 | 132060985874 | c374806 | 43476327018
Unit Tests | skipped | 15368 | 132061661352 | c374806 | 43476491448
Vercel Preview Comments | success | 8329 | 132061879116 | c374806 | 132061879116
Visual Regression | skipped | 15368 | 132061662628 | c374806 | 43476491448
```

The relay's `CI OK` check run is on the PR head SHA: id 132061472478, `head_sha c374806970108da85e6d776a6bf546276a79d225`, app 15368, conclusion success (17:48:44Z to 17:50:05Z). This answers the LOW-confidence part of assumption A1: a `pull_request_target` job's check run attaches to the PR head SHA. As expected under the accepted exception, the dispatched run's own `CI OK` (132061660974) is on the same SHA too.

`gh pr ready 146` at about 17:50:45Z, after the relay finished. (Before it, while still a draft, the PR read `CLEAN draft=true`.) First reading after ready: `CLEAN draft=false review= mergeable=MERGEABLE`.

mergeStateStatus: CLEAN

**Which `CI OK` counted.** The GraphQL PR view after ready listed **one** `CI OK` context in the head's `statusCheckRollup`: check run 132061472478, conclusion SUCCESS, `isRequired: true`, app 15368, check-suite run 43476327018, event `pull_request_target`, workflow `CI skip relay`. The workflow_dispatch run's `CI OK` (132061660974) is on the commit but **not** in the PR's rollup, so it is not what made the PR CLEAN (this matches GitHub's documentation that workflow_dispatch checks do not satisfy a ruleset). Rollup state SUCCESS, `reviewDecision: null`. The relay's `CI OK` was counted by the ruleset.

No merge attempt (green by design; see D-10 deviation). Closed at 17:51:02Z with `--delete-branch`: `{"state":"CLOSED","mergedAt":null}`.

## D-10 deviation

D-10 asks for `mergeStateStatus` and the `gh pr merge` refusal for each proof, and also says "Nothing is merged". The docs-only and `[ci skip]` proofs are green by design, so a merge attempt on either would merge it into `main` and deploy to production (the docs-only PR read CLEAN). "Nothing is merged" governs, as the plan's objective sets out: only the red proof got a merge attempt (one, guarded), and the two green proofs record `mergeStateStatus` without one.

## Relay decision (Task 3)

relay.decision: a-confirmed

Tim's reply, verbatim (an AskUserQuestion selection): "a-confirmed (Recommended)"

What Tim was shown before choosing: the relay's `CI OK` check run 132061472478 is on head c374806 (success, app 15368); the PR's check rollup holds only that one `CI OK` (pull_request_target, `isRequired: true`); `mergeStateStatus` read CLEAN after `gh pr ready`. Before the selection the orchestrator re-verified by GET: #144, #145 and #146 all `CLOSED` with `mergedAt: null`; no `ci/13-*` refs on origin; `main` still at d48af99; check run 132061472478 = `CI OK`, success, app 15368, head c374806.

The evidence the decision rests on (all from `## Proof skip`):

| Question | Answer |
|----------|--------|
| Is the relay's `CI OK` check run on the PR head SHA? | Yes: check run 132061472478, `head_sha c374806970108da85e6d776a6bf546276a79d225` |
| Its conclusion and app | success, app 15368 (GitHub Actions, the integration the ruleset pins) |
| Did GitHub create a push or pull_request CI run for the head? | No (both counts 0) |
| Dispatched CI run | 43476491448, workflow_dispatch, head SHA c374806…, success |
| `mergeStateStatus` after `gh pr ready` | CLEAN |
| Which `CI OK` the PR counted | Only the relay's (pull_request_target, `isRequired: true`); the workflow_dispatch `CI OK` is not in the PR's check rollup |

Read against D-06's amended order (A; B if the relay's check is not counted; C if B is not counted either): the relay's check is attached and counted, which is option A's success condition. Tim's selection confirms it: option A stands and no fallback is built.

### Caveat: the long-mirror path is untested (not a defect)

The skip proof's dispatched CI run (43476491448) took the docs-only path, because the proof head changed one `.planning/` file, so the relay mirrored a run of about 1.5 minutes. A marked head that changes code would make the relay wait for a full CI run of about 40 minutes. `.github/workflows/ci-skip-relay.yml` (identical on `main` and on this branch) gives the mirror job `timeout-minutes: 100` (line 103) and watches the dispatched run with `gh run watch "$id" … --exit-status --interval 60` (line 157), so the budget covers a full run. A long mirror wait has not been exercised live. The workflow is unchanged.

Hand-over: 13-22 records this with the option A Key Decisions row (an untested path, to be watched on the first code-changing ship note with a `[ci skip]` head).

## Next steps

- **13-21:** with `relay.decision: a-confirmed`, 13-21's Task 1 records "not needed" and its Tasks 2 and 3 (the B or C fallback PR from `ci/13-relay-fallback` and the `ci/13-proof-skip-2` re-proof) are skipped. 13-21 changes no file other than its own SUMMARY. This plan did not execute 13-21.
- **13-22:** the Key Decisions skip-marker row takes the option A wording (the relay's `CI OK` on marked PR heads is the accepted exception to unique check names; it never runs on pushes, so Deployment Checks only see ci.yml's `CI OK`), plus the long-mirror caveat above as a hand-over item.
- **GUARD-07, GUARD-08:** stay Pending in REQUIREMENTS.md until the last declaring plan (13-22) has its SUMMARY; `requirements.ready-ids` blocked both at this plan's close.

## Issues Encountered

- **`require_extra_approval_for_unattributed_changes: true`** (GitHub-added field on the live `pull_request` rule, noted in 13-16): no proof pointed at a review or approval requirement. The docs-only and skip PRs read CLEAN with `reviewDecision: null`. The red PR's refusal ("the base branch policy prohibits the merge") came with `reviewDecision: null`, and the only required checks in its rollup were the two failed `CI OK` runs. The field was inert for these PRs, which Tim's own account authored and pushed.
- **gh's merge refusal does not name the check.** D-10 and Pitfall 4 expected the refusal to name `CI OK`; gh 2.103.3 prints only "the base branch policy prohibits the merge". The GraphQL rollup reading above supplies the missing attribution.
- **`gh pr close --delete-branch` switches the worktree to `main`.** In each temp worktree gh deleted the local proof branch and checked out the local `main` (stale at 94d79c4, last moved 2026-11-06). The `main` ref was not changed (reflog unchanged), the main working tree stayed on `gsd/phase-13-repo-safety-test-debt`, and each worktree was removed straight after.
- **A draft PR read CLEAN.** PR #146 read `CLEAN draft=true` before `gh pr ready`, so `mergeStateStatus` alone does not show draft state; Pitfall 4's "reads DRAFT" did not hold here. No merge was attempted on a draft.
- **Vercel preview deployments** ran for all three proof heads (the `Vercel Preview Comments` check, app 8329). These are previews; nothing reached production.
- **Push runs on a new `ci/**` branch run the full CI** (all-zero `before`), as the plan expected. That doubled the red and docs-only heads' CI cost (two 30 to 38 minute runs on the red head).

## Threat register outcomes

| Threat | Disposition | Outcome |
|--------|-------------|---------|
| T-13-45 proof PR merged into production | mitigate | Mitigated: drafts until every check completed; one merge attempt, on #144 only, gated in the same shell step on head unchanged + BLOCKED + every `CI OK` failure; no `--admin`/`--auto`; #145 and #146 got no attempt; all three CLOSED with `mergedAt: null` |
| T-13-46 pushes beyond D-10 | mitigate | Mitigated: only `ci/13-proof-red`, `ci/13-proof-docs` and `ci/13-proof-skip` were pushed (plain, new branches), all deleted; the main working tree never changed branch; the phase branch and `main` were not pushed |
| T-13-SC npm installs | accept | No package install |

## Cleanup

- `gh pr list --state open` filtered to `ci/13-proof*`: `0`.
- `git ls-remote origin "refs/heads/ci/13-proof-*"`: no lines.
- `gh pr view` for #144, #145, #146: all `CLOSED`, `mergedAt: null` (closed 17:47:24Z, 17:38:54Z, 17:51:02Z).
- Temp worktrees under `%TEMP%/gsd-13-19/` removed with `git worktree remove`, then `git worktree prune`; `git worktree list` shows only the main tree. No local `ci/13-*` branch remains.
- No workflow run queued or in progress afterwards. No workflow was dispatched or re-run by the agent (the relay dispatched 43476491448 itself), no setting changed.

## Deviations from Plan

1. **[Rule 1 - Bug avoided] Red test written as `expect(1).toBe(2)`.** The plan says "one test asserting `1 === 2`". A literal `1 === 2` fails `tsc` ("This comparison appears to be unintentional"), which would have made Lint and Type Check red as well and muddied which job failed. The `expect` form asserts the same thing; Unit Tests was the only red job.
2. **D-10 deviation** (planned, see its section): the two green proofs got no merge attempt.
3. **Timing (orchestrator instruction):** the red and docs-only proofs were pushed together and waited on in parallel (ci.yml has no `concurrency` block and the relay's group is per PR number, so no proof run could cancel another); the skip proof ran alone afterwards.

## Task Commits

1. **Task 1: Red-test proof and docs-only proof:** no commit in the main tree. Proof commits `536aea6` (`test(13): deliberately red proof for the main ruleset (D-10) - do not merge`) and `2b19a2b` (`docs(13): docs-only fast-path proof (D-10) - do not merge`) existed only on the deleted proof branches.
2. **Task 2: [ci skip] proof:** no commit in the main tree. Proof commit `c374806` (`docs(13): relay proof for skipped CI [ci skip]`) existed only on the deleted proof branch.
3. **Task 3: Relay outcome:** checkpoint decision, no code. Tim's selection "a-confirmed (Recommended)" is recorded under `## Relay decision (Task 3)` by the continuation's docs commit.

**Plan metadata:** b46ae54 (`docs(13-19): record the red, docs-only and [ci skip] live proofs (partial)`), then the continuation's docs commit finalizing this SUMMARY and the docs commit recording STATE and ROADMAP progress (all local; nothing pushed besides the three proof branches).

## Requirements

| ID | Declared by | Status after 13-19 | Why |
|----|-------------|--------------------|-----|
| GUARD-07 | 13-19, 13-21, 13-22 | Pending (not marked) | `requirements.ready-ids` returned `blocked: [GUARD-07, GUARD-08]`, `ready: []`: 13-21 and 13-22 also declare them and have no SUMMARY yet. This plan's share (the ruleset refuses a red PR; docs-only and `[ci skip]` heads get a final `CI OK`) is proven above |
| GUARD-08 | 13-19, 13-21, 13-22 | Pending (not marked) | Same gate. This plan's share (the relay's `CI OK` on a marked head is attached and counted) is proven above; 13-21 (not needed) and 13-22 (Key Decisions row) finish it |

## Self-Check: PASSED

- `.planning/phases/13-repo-safety-test-debt/13-19-SUMMARY.md` exists with `## Proof red`, `## Proof docs-only`, `## Proof skip`, `## D-10 deviation` and `## Relay decision (Task 3)` reading `relay.decision: a-confirmed`.
- Plan verifies, re-run by the continuation at finalize time: open proof PRs `0`; `git ls-remote` for `ci/13-proof-*` and `ci/13-proof-skip` print nothing; the Task 1 node check prints `red and docs-only proofs recorded`; the Task 2 node check prints `recorded`.
- b46ae54 is an ancestor of HEAD; `commits: 1` measured from the ledger at `.git/gsd-plan-head-before-13-19` (`0c272c1..HEAD`) at this write.
- `ci-skip-relay.yml` line 103 (`timeout-minutes: 100`) and line 157 (`gh run watch … --interval 60`) read the same on `origin/main` and on the working branch.

---
*Phase: 13-repo-safety-test-debt*
*Partial: 2026-11-13 (Tasks 1-2); completed: 2026-11-13 (Task 3, relay.decision a-confirmed)*
