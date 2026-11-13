---
phase: 13-repo-safety-test-debt
plan: 17
subsystem: contact-form-rate-limiter
status: partial
tags: [guard-09, upstash, keep-alive, production, vercel, d-13, d-14, d-15]
requires: [13-16]
provides:
  - "prod.deployment_sha: d48af99994a419aced1473f56b8cfa9b8d0a5c11 (deployment 7770069186, status success)"
  - "keepalive.run_id: 43466849915 (workflow_dispatch on main, headSha d48af99, conclusion success)"
affects: [13-22]
prod:
  deployment_sha: d48af99994a419aced1473f56b8cfa9b8d0a5c11
  deployment_id: 7770069186
  deployment_status: success
keepalive:
  run_id: 43466849915
  head_sha: d48af99994a419aced1473f56b8cfa9b8d0a5c11
  conclusion: success
probe:
  runner: pending (Task 2 checkpoint awaiting Tim's reply)
  result: pending
---

# Phase 13 Plan 17: Live rate limiter proof Summary (partial: Task 1 done, Task 2 awaiting Tim)

**Production serves merge commit `d48af99` (deployment 7770069186, success). The first manual Upstash keep-alive run 43466849915 on main answered PONG with the repository secrets. The live 429 probe has not run and waits for Tim's decision in Task 2.**

## Task 1: production deployment and keep-alive

### Production deployment (GET only)

`gh api "repos/tlex-web/portfolio-app/deployments?environment=Production&per_page=5"`: the newest Production deployment is for the 13-16 merge SHA.

| Field | Value |
|-------|-------|
| Deployment id | 7770069186 |
| SHA | `d48af99994a419aced1473f56b8cfa9b8d0a5c11` (equals the 13-16 merge SHA) |
| Created | 2026-11-13T16:09:27Z |
| Latest status | `success` (2026-11-13T16:09:27Z) |
| main HEAD at check | `d48af99994a419aced1473f56b8cfa9b8d0a5c11` |

As 13-16 recorded, this deployment predates Vercel Deployment Checks, so it went to production without waiting for CI OK. It is no evidence about the gate either way. 13-22 owns that evidence.

### Upstash keep-alive (dispatched exactly once)

`gh workflow run upstash-keepalive.yml --ref main` at 2026-11-13T16:51:01Z. No earlier runs of this workflow existed.

| Field | Value |
|-------|-------|
| Run id | 43466849915 |
| Event / branch | `workflow_dispatch` / `main` |
| headSha | `d48af99994a419aced1473f56b8cfa9b8d0a5c11` (main's HEAD) |
| Conclusion | `success` (`gh run watch --exit-status` exit 0), 16:51:03Z to 16:51:11Z |
| Step | "PING Upstash Redis" success; log line "Upstash answered PONG" |

Plan verify: `gh run list --workflow upstash-keepalive.yml --limit 1 --json conclusion --jq '.[0].conclusion'` printed `success`.

The repository secrets `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set and the REST call works. Only the PONG line was read from the log; no secret value was printed.

## Task 2: who runs the live 429 probe

Pending. A `checkpoint:decision` (gate blocking-human) was returned with the options `tim-runs` and `agent-runs`. The probe (`PROD_FORM_LIMIT=1 npm run test:prod-form`) was **not** run.

## Task 3: probe result

Pending Task 2.

## Deviations from Plan

None so far.

## Commits

- Task 1: this partial SUMMARY (docs commit, local only; nothing pushed)
