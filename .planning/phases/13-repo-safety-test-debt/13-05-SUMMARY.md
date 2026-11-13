---
phase: 13-repo-safety-test-debt
plan: 05
subsystem: infra
tags: [upstash, github-actions, keep-alive, monitor, vercel, rate-limit, guard-09]

# Dependency graph
requires:
  - phase: 13-repo-safety-test-debt
    provides: 13-02's dual-pair credential read (UPSTASH_REDIS_REST_* else KV_REST_API_*) and fail-closed limiter; 13-01/13-07/13-10's ci-gate guard (rules 5-7 on every workflow)
provides:
  - Tim's recorded production facts (upstash.pair, vercel.system_env, vercel.deployment_checks, keepalive.command, keepalive.secrets)
  - .github/workflows/upstash-keepalive.yml, the daily Upstash PING keep-alive that doubles as the limiter monitor (D-13, D-14)
affects: [13-15, 13-16, 13-17, 13-22]

# Actuals (#2632)
actuals:
  tokens: 2400     # chars/4: workflow 3077 chars (~770) plus this SUMMARY (~6600 chars, ~1650)
  tasks: 2
  commits: 1       # MEASURED: git rev-list --count plan_head_before..plan_head_after at SUMMARY write; the SUMMARY and STATE/ROADMAP commits follow
plan_head_before: edc9251e112e1f74bf2ccb398df056646aeb2213
plan_head_after: 6eb94f664190b3c09f4c67a57a59fe15186316e6

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scheduled monitor workflow: schedule + workflow_dispatch only, permissions: {}, secrets only through env:, curl stderr discarded so a host fragment never reaches the log, ::error:: on every failure path"

key-files:
  created:
    - .github/workflows/upstash-keepalive.yml
  modified: []

key-decisions:
  - "Keep-alive command is ping-readonly (Tim, 2026-11-13): GET $URL/ping, jq check .result == \"PONG\"; no D-14 deviation"
  - "Keep-alive secrets are UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (both confirmed present by gh secret list, names only, 2026-11-13T12:49Z); whether the token is the read-only one is unverified"
  - "Production has the complete UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN pair (Tim's vercel env ls production, 2026-11-13), which 13-02 reads first; REDIS_URL is also set and unused by the app. Pitfall 2 is resolved for production and 13-15 is unblocked on this point"
  - "Vercel System Environment Variables are on (VERCEL_ENV reaches the runtime, so fail-closed engages in production) and Deployment Checks are offered on Hobby (D-07 primary path for 13-16/13-22)"
  - "The keep-alive discards curl's stderr and reports only its exit code, because curl's error text can name the host and GitHub masks only the whole secret string"

patterns-established:
  - "Monitor workflows never join CI OK and never run on pull_request"

requirements-completed: [GUARD-09, GUARD-08]

coverage:
  - id: D1
    description: "Tim's five production facts recorded with all three replies quoted verbatim and dated; production has the complete UPSTASH_REDIS_REST_* pair"
    requirement: "GUARD-09"
    verification: []
    human_judgment: true
    rationale: "The facts are Tim's dashboard and CLI observations; no automation in this plan can read Vercel settings or secret contents"
  - id: D2
    description: "upstash-keepalive.yml runs daily and on dispatch only, permissions: {}, secrets only via env, PINGs Upstash and fails loudly on missing secrets, curl failure or a non-PONG answer"
    requirement: "GUARD-09"
    verification:
      - kind: other
        ref: "npm run guard:parity (parity: OK)"
        status: pass
      - kind: other
        ref: "npm run guard:ci (ci-gate: OK)"
        status: pass
      - kind: other
        ref: "13-05-PLAN Task 2 inline node structure check (keepalive: OK)"
        status: pass
      - kind: other
        ref: "npm run lint (exit 0)"
        status: pass
      - kind: other
        ref: "local bash run of the run: block: empty secrets, unresolvable host (curl 6) and refused port (curl 7) each exit 1 with an ::error:: line and no host in the output"
        status: pass
    human_judgment: false
  - id: D3
    description: "The first live keep-alive run succeeds against production Upstash"
    requirement: "GUARD-09"
    verification: []
    human_judgment: true
    rationale: "A schedule only runs from main; the first manual run is 13-17 after 13-15 merges"

# Metrics
duration: 3min (continuation; Task 1 was answered between sessions)
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 05: Production facts and Upstash keep-alive Summary

**Tim's production facts are recorded: the complete `UPSTASH_REDIS_REST_*` pair is set in production, System Environment Variables are on, Deployment Checks are offered on Hobby, and the keep-alive uses PING with the secrets `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. A new daily `Upstash keep-alive` workflow PINGs Redis over REST and fails loudly, so GitHub emails Tim within a day.**

## Performance

- **Duration:** about 3 min for this continuation (the first executor stopped at the Task 1 checkpoint)
- **Started:** 2026-11-13T12:50:10Z
- **Completed:** 2026-11-13T12:55Z
- **Tasks:** 2
- **Files modified:** 1

## Task 1: Tim's replies (verbatim, 2026-11-13)

Reply 1 (2026-11-13): "ping-readonly, i added the variables in the env.local file and connected the db to my project on vercel, System Environment Variables: on Deployment Checks offered on Hobby: yes UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN approve — WR-07 fix, IN-08 GUARD-10, 12 IN-08 accept)"

The trailing "approve — …" segment answered plan 13-06, not 13-05.

Reply 2 (2026-11-13): "secrets added, why does the local env file matter? the .env.local file should definitely stay ignored"

Reply 3 (2026-11-13), Tim's `vercel env ls production` names, as he gave them:

```
 UPSTASH_REDIS_REST_TOKEN    
 UPSTASH_REDIS_REST_URL     
 REDIS_URL                 
 RESEND_API_KEY              
 FEEDBACK_RECIPIENT_EMAIL   
 FEEDBACK_FROM_EMAIL
```

### The five items (names only)

| Key | Recorded value | Source |
|-----|----------------|--------|
| `keepalive.command` | `ping-readonly`: `$URL/ping`, jq check `.result == "PONG"`. No D-14 deviation | Reply 1 |
| `upstash.pair` | Complete `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` pair in Production, the pair 13-02 reads first. No `KV_REST_API_*` names are listed. `REDIS_URL` is also present and unused by the app | Reply 3 |
| `vercel.system_env` | `on` | Reply 1 |
| `vercel.deployment_checks` | `yes` (D-07 primary path for 13-16 and 13-22) | Reply 1 |
| `keepalive.secrets` | URL `UPSTASH_REDIS_REST_URL`, token `UPSTASH_REDIS_REST_TOKEN` | Reply 1 and Reply 2; the orchestrator confirmed both names with `gh secret list` at 2026-11-13T12:49Z (names only) |

Notes:
- 13-15 is unblocked on this point. A complete pair exists in Production and System Environment Variables are on, so 13-02's fail-closed limiter has credentials and engages in production. The 13-02 merge risk (Pitfall 2) is resolved for production. The 429 probe still belongs to 13-15/13-17.
- Least privilege is unverified. Tim did not say whether `UPSTASH_REDIS_REST_TOKEN` holds the read-only token. PING works with either token.
- On Reply 2's question: the local `.env.local` doesn't matter to this plan. The keep-alive reads GitHub repository secrets, and production reads Vercel's variables. `.env.local` stays ignored, and it was not read.

## Accomplishments

- Recorded the facts that gate 13-15 (the production pair, now confirmed), 13-16/13-22 (Deployment Checks are available) and fail-closed engagement (`VERCEL_ENV` is exposed).
- Added `.github/workflows/upstash-keepalive.yml`: `name: Upstash keep-alive`, job `ping` with the same name, cron `23 5 * * *` plus `workflow_dispatch`, top-level `permissions: {}`, `timeout-minutes: 5`, no checkout or setup-node, secrets only through `env:`.
- Every failure path is red and emits `::error::`: missing secrets, a curl failure (exit code reported, with a hint for 6/7, 22 and 28) or an answer that is not PONG.
- The header records four points: the job never runs on PRs and never joins CI OK; GitHub pauses the schedule after 60 days (email warning first, re-enable from the Actions tab); Vercel Hobby keeps runtime logs for roughly one hour; and the job takes effect only on `main` (13-15), with the first manual run in 13-17.

## Task Commits

1. **Task 1: Tim's production facts and the keep-alive command.** No commit. It was a checkpoint decision, recorded in this SUMMARY.
2. **Task 2: Daily Upstash keep-alive workflow (monitor).** `6eb94f6` (feat)

## Files Created/Modified

- `.github/workflows/upstash-keepalive.yml`: the daily keep-alive and limiter monitor.

## Verification

- `npm run guard:parity`: parity: OK
- `npm run guard:ci`: ci-gate: OK (rules 5 to 7 apply to every workflow; the new one has a top-level `permissions: {}`, no CI OK name and no `checks: write`)
- Plan inline structure check: keepalive: OK
- Acceptance: `permissions: {}` 1, `60 days` 1, secret references exactly `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (one each), and 0 `${{` lines in the run block
- `npm run lint`: exit 0 (ESLint and every guard)
- Local bash run of the run block: empty secrets, an unresolvable host and a refused port each exit 1 with the expected `::error::` line, and no hostname is printed

## Decisions Made

- `ping-readonly` per Tim. If the database archives anyway (research assumption A8), the job turns red and the command switches to SET with a full token.
- The secret names follow Tim's reply, and they match the production pair names.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Curl's stderr is discarded and only its exit code is reported**
- **Found during:** Task 2
- **Issue:** With `curl -fsS`, an error such as "Could not resolve host: <host>" prints the Upstash hostname. GitHub masks only the whole secret string, so a host fragment of the URL secret could reach the public log (T-13-12, "never echo the URL").
- **Fix:** `2>/dev/null` on the curl call. The exit code is captured and reported with a short hint. The response body is never printed.
- **Files modified:** `.github/workflows/upstash-keepalive.yml`
- **Verification:** Local runs against `nohost-secret-marker.invalid` and `127.0.0.1:9` printed only "curl exit 6" and "curl exit 7".
- **Committed in:** `6eb94f6`

---

**Total deviations:** 1 auto-fixed (1 missing critical).
**Impact on plan:** This tightens T-13-12 and changes no behaviour. There is no scope creep.

## Issues Encountered

None.

## User Setup Required

None remains. Task 1 collected every `user_setup` item directly from Tim, so no `13-USER-SETUP.md` was generated.

## Next Phase Readiness

- 13-15 can merge the fail-closed limiter and this workflow. Production has the complete UPSTASH pair.
- 13-16 and 13-22 can take D-07's primary path (Deployment Checks are offered on Hobby).
- 13-17 makes the first manual keep-alive run after the file reaches `main`.

## Self-Check: PASSED

- FOUND: .github/workflows/upstash-keepalive.yml
- FOUND: 6eb94f6 (ancestor of HEAD)

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
