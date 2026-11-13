---
phase: 13-repo-safety-test-debt
plan: 17
subsystem: contact-form-rate-limiter
status: complete
tags: [guard-09, upstash, keep-alive, production, vercel, rate-limit, d-13, d-14, d-15]

requires:
  - phase: 13-repo-safety-test-debt
    provides: "13-02 fail-closed limiter (slidingWindow(5, '1 h'), 503 when unavailable in production) and the PROD_FORM_LIMIT honeypot loop; 13-05 production Upstash pair; 13-16 merge d48af99 on main"
provides:
  - "prod.deployment_sha: d48af99994a419aced1473f56b8cfa9b8d0a5c11 (deployment 7770069186, status success)"
  - "keepalive.run_id: 43466849915 (workflow_dispatch on main, headSha d48af99, conclusion success, \"Upstash answered PONG\")"
  - "probe.runner: tim-runs (Tim's selection \"I run it (tim-runs)\")"
  - "probe.result: the live limiter answered 429 with a Retry-After > 0 (assertion passed in Tim's run B); 4/4 default tests passed twice; no 503, no email"
affects: [13-22 (GUARD-09 is also declared there; REQUIREMENTS.md stays Pending until 13-22 finishes; live Deployment Checks evidence stays with 13-22)]

prod:
  deployment_sha: d48af99994a419aced1473f56b8cfa9b8d0a5c11
  deployment_id: 7770069186
  deployment_status: success
keepalive:
  run_id: 43466849915
  head_sha: d48af99994a419aced1473f56b8cfa9b8d0a5c11
  conclusion: success
probe:
  runner: tim-runs
  runner_reply: "I run it (tim-runs)"
  result: "pass: 429 with Retry-After > 0 observed through the passing assertion; request number not printed (inferred sixth in the window, loop post 2); Retry-After value not printed"
  runs_at_limit_level: 1
  runs_at_default_level: 1   # run A, accidental, caused by the bash-syntax command in the orchestrator's instruction

actuals:
  tokens: 5300     # chars/4 over the files this plan changed: this SUMMARY (~19,700 chars) and the deferred-items.md entry (~1,300)
  tasks: 3
  commits: 1       # MEASURED: git rev-list --count 705cf86..HEAD at this SUMMARY write = d476f8a (the partial SUMMARY). The docs commits carrying this SUMMARY and STATE/ROADMAP follow
plan_head_before: 705cf8674bf1d3e05e34afd4219e659f488a3542
plan_head_after: d476f8ad2786e34ff0adecb2c04cc958ef2d69b1

tech-stack:
  added: []
  patterns:
    - "Live probes that cost the operator something (an IP lockout) run in Tim's own terminal; the agent transcribes the pasted output and separates what the reporter printed from what the code's assertions imply"

key-files:
  created: []
  modified:
    - .planning/phases/13-repo-safety-test-debt/13-17-SUMMARY.md
    - .planning/phases/13-repo-safety-test-debt/deferred-items.md

key-decisions:
  - "13-17: production serves the 13-16 merge d48af99 (deployment 7770069186, success 16:09:27Z, predates Deployment Checks, so no gate evidence); the first manual Upstash keep-alive run 43466849915 on main succeeded (\"Upstash answered PONG\"), so the repository secrets and the REST call work"
  - "13-17: Tim ran the live 429 probe himself (selection \"I run it (tim-runs)\"). Run B (PROD_FORM_LIMIT=1) passed 5/5: the limit test's assertions prove a 429 with Retry-After > 0 and no 503 in the loop. The request number and Retry-After value were not printed; the 429 is inferred to be the sixth request in the window (loop post 2)"
  - "13-17: GUARD-09 stays Pending in REQUIREMENTS.md by the shared-ID gate, because 13-22 also declares GUARD-09 and has no SUMMARY yet"

patterns-established:
  - "On Windows, the opt-in production levels use PowerShell env syntax: $env:PROD_FORM_LIMIT='1'; npm run test:prod-form; Remove-Item Env:PROD_FORM_LIMIT"

requirements-completed: [GUARD-09]   # copied from the plan; REQUIREMENTS.md not ticked, shared-ID gate (13-22 also declares GUARD-09)

coverage:
  - id: D1
    description: "Production serves the 13-16 merge commit d48af99 with status success"
    requirement: GUARD-09
    verification:
      - kind: other
        ref: "gh api repos/tlex-web/portfolio-app/deployments?environment=Production&per_page=5: newest 7770069186 for d48af99994a419aced1473f56b8cfa9b8d0a5c11; statuses[0].state success"
        status: pass
    human_judgment: false
  - id: D2
    description: "A manual run of the Upstash keep-alive on main succeeds with the repository secrets"
    requirement: GUARD-09
    verification:
      - kind: other
        ref: "gh run list --workflow upstash-keepalive.yml --limit 1 --json conclusion --jq '.[0].conclusion' -> success (run 43466849915, headSha d48af99)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The live limiter answers 429 with a positive Retry-After past its window, with no 503 and no email; default-level tests pass (validation 400, honeypot quiet 200, foreign origin 403)"
    requirement: GUARD-09
    verification:
      - kind: manual_procedural
        ref: "Tim's terminal: $env:PROD_FORM_LIMIT='1'; npm run test:prod-form (run B) -> 5 passed, incl. e2e/prod/contact-form.prod.ts#the limiter refuses requests past its window"
        status: pass
      - kind: manual_procedural
        ref: "Tim's terminal: npm run test:prod-form (run A, default level) -> 4 passed"
        status: pass
    human_judgment: true
  - id: D4
    description: "GUARD-09 concurrency: parallel submissions at the window edge are counted atomically by Upstash's sliding window"
    requirement: GUARD-09
    verification:
      - kind: other
        ref: "backstop: Upstash slidingWindow evaluates in one server-side script per request (lib/rate-limit.ts:83 slidingWindow(5, '1 h')); not tested live"
        status: unknown
    human_judgment: true

duration: 15min
completed: 2026-11-13
---

# Phase 13 Plan 17: Live rate limiter proof Summary

**Production serves the fail-closed limiter from merge `d48af99`; the first Upstash keep-alive run answered PONG; and in Tim's own terminal the live contact form answered 429 with a positive Retry-After once its window was used up (5/5 tests passed, no 503, no email). The reporter did not print which request got the 429 or the Retry-After value; the sixth-request position is inferred, not observed.**

## Performance

- **Duration:** about 15 min of agent time (16:50Z to about 17:05Z on 2026-11-13), plus Tim's probe runs in his terminal
- **Tasks:** 3 (1 auto, 1 decision checkpoint, 1 record)
- **Files modified:** 2 (this SUMMARY, `deferred-items.md`); no source

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

As 13-16 recorded, this deployment predates Vercel Deployment Checks, so it went to production without waiting for CI OK. It is not evidence about the gate either way; 13-22 owns that evidence.

### Upstash keep-alive (dispatched exactly once)

`gh workflow run upstash-keepalive.yml --ref main` at 2026-11-13T16:51:01Z. No earlier runs of this workflow existed.

| Field | Value |
|-------|-------|
| Run id | 43466849915 |
| Event / branch | `workflow_dispatch` / `main` |
| headSha | `d48af99994a419aced1473f56b8cfa9b8d0a5c11` (main's HEAD) |
| Conclusion | `success` (`gh run watch --exit-status` exit 0), 16:51:03Z to 16:51:11Z |
| Step | "PING Upstash Redis" success; log line "Upstash answered PONG" |

The repository secrets `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set and the REST call works. Only the PONG line was read from the log; no secret value was printed.

## Task 2: who runs the live 429 probe

A `checkpoint:decision` (gate blocking-human) offered `tim-runs` and `agent-runs`. Tim's answer, an AskUserQuestion selection, verbatim:

> I run it (tim-runs)

`probe.runner: tim-runs`. The agent ran nothing against production: no `npm run test:prod-form` in any form and no request to tlui.de.

## Task 3: the probe, as Tim ran it

Tim ran the probe in his own PowerShell terminal, not through the session, and pasted the output. Both runs are transcribed verbatim.

### Run A (default level, accidental)

The command first handed to Tim used bash syntax (`PROD_FORM_LIMIT=1 npm run test:prod-form`). PowerShell rejected the `VAR=1 cmd` prefix, and Tim then ran the default level without the flag:

```
PS C:\Users\tim\MyDocuments\Programming\portfolio_app> PROD_FORM_LIMIT=1 npm run test:prod-form
PROD_FORM_LIMIT=1: The term 'PROD_FORM_LIMIT=1' is not recognized as a name of a cmdlet, function, script file, or executable program.
Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
PS C:\Users\tim\MyDocuments\Programming\portfolio_app> npm run test:prod-form

> portfolio-app@1.0.0 test:prod-form
> playwright test --config=playwright.prod.config.ts


Running 4 tests using 1 worker

  ✓  1 …act form on production, no email sent › the register renders and an empty submit never leaves the browser (1.9s)
  ✓  2 …rod.ts:111:7 › Contact form on production, no email sent › a foreign origin is refused before the limiter (1.2s)
  ✓  3 …rod.ts:118:7 › Contact form on production, no email sent › a same-origin invalid body reaches validation (254ms)
  ✓  4 …s:132:7 › Contact form on production, no email sent › the honeypot answers like a success without sending (95ms)

  4 passed (3.8s)
```

### Run B (limit level, the probe)

Command, PowerShell syntax: `$env:PROD_FORM_LIMIT='1'; npm run test:prod-form; Remove-Item Env:PROD_FORM_LIMIT`. Output as pasted:

```
Running 5 tests using 1 worker

  ✓  1 …ct form on production, no email sent › the register renders and an empty submit never leaves the browser (471ms)
  ✓  2 …od.ts:111:7 › Contact form on production, no email sent › a foreign origin is refused before the limiter (276ms)
  ✓  3 …rod.ts:118:7 › Contact form on production, no email sent › a same-origin invalid body reaches validation (130ms)
  ✓  4 …:132:7 › Contact form on production, no email sent › the honeypot answers like a success without sending (157ms)
  ✓  5 …t-form.prod.ts:169:9 › Contact form on production, opt-in › the limiter refuses requests past its window (193ms)

  5 passed (1.6s)
```

### What is observed

These follow from the tests passing and from the code of `e2e/prod/contact-form.prod.ts`:

| Test | Passed in | What the pass proves |
|------|-----------|----------------------|
| the register renders and an empty submit never leaves the browser | A and B | `/contact` answers 200, hydrates, and client validation marks Name invalid with no POST to `/api/feedback` |
| a foreign origin is refused before the limiter | A and B | `Origin: https://evil.example` gets 403 `{code:'origin-rejected'}`, before the limiter (no slot used) |
| a same-origin invalid body reaches validation | A and B | 400 `{code:'validation', fields:{name:'required', email:'invalid_email', message:'too_short'}}`; not 429, not 503 |
| the honeypot answers like a success without sending | A and B | 200 `{code:'ok'}`; not 429, not 503; no email (honeypot path) |
| the limiter refuses requests past its window (lines 169-188) | B | Within at most 6 loop posts a **429** arrived; its **`Retry-After`** header was present and `Number(retryAfter) > 0`; no loop post got a 503; every loop post before the 429 was 200 `{code:'ok'}` |

So the live limiter in production counts and refuses: a 429 with a positive Retry-After. It did not fail closed with a 503, so the Upstash variables are read and Upstash answers. No email was sent in either run (`PROD_FORM_SEND` was not set).

### What is not observed

The `list` reporter (the only reporter in `playwright.prod.config.ts`) prints a pass and a duration per test. It does **not** print:

- the loop post (or the request number in the window) that received the 429, and
- the Retry-After value in seconds.

Neither value was captured, and neither is invented here.

### Inference: the 429's position (labelled as an inference)

The limiter counts every same-origin POST before the body is read (`slidingWindow(5, '1 h')`, `lib/rate-limit.ts:83`). The foreign-origin test is refused before the limiter and the client-validation test sends no POST, so each default run uses 2 slots.

| Slot in the window | Request | Answer |
|--------------------|---------|--------|
| 1 | run A, invalid body | 400 (passed) |
| 2 | run A, honeypot | 200 (passed) |
| 3 | run B, invalid body | 400 (passed) |
| 4 | run B, honeypot | 200 (passed) |
| 5 | run B, loop post 1 | expected 200 |
| 6 | run B, loop post 2 | expected 429 |

The expected 429 is the sixth request in the window, which is loop post 2. That assumes no other POST from Tim's IP to `/api/feedback` in the hour before run A. The passing default tests in run B bound this: had two or more earlier slots been used, run B's honeypot test (slot 4 plus those) would have met the 429 and failed. So at most one earlier slot existed, and the 429 came on loop post 1 or 2. The limit test took 193 ms; a single default post took 95 ms to 157 ms. That fits about two posts but does not prove it. Upstash's sliding window also weights the previous window's count, which could shift the refusal earlier; that cannot be checked from this output either.

Note that the doc comment in `contact-form.prod.ts` ("after the two default posts that is the fourth honeypot post of the loop") describes a fresh window with one default run. Here two default runs came first, so loop post 2, not 4, is the expected position.

### Running it again on Windows

PowerShell does not accept the bash `VAR=1 cmd` prefix. Use:

```powershell
$env:PROD_FORM_LIMIT='1'; npm run test:prod-form; Remove-Item Env:PROD_FORM_LIMIT
```

Run it only after the previous window has passed (up to an hour); it locks the probing IP out of the form for up to an hour again (D-15).

## GUARD-09 truths

| Truth | Result |
|-------|--------|
| Production serves the merge commit with the fail-closed limiter (deployment SHA = 13-16 merge SHA, success) | Pass: 7770069186 for d48af99, success |
| A manual keep-alive run on main succeeded | Pass: run 43466849915, success, PONG |
| `PROD_FORM_LIMIT=1 npm run test:prod-form` answered 429 with a positive Retry-After on the sixth request, and the default tests passed (validation 400, honeypot quiet 200) | Pass for the 429, the positive Retry-After and the default tests (all observed through passing assertions). **"On the sixth request" is inferred, not printed** (see above) |
| Concurrency: parallel submissions at the window edge are counted atomically, so no burst gets more than five through (`verification: backstop`) | Backstop, not tested live. What covers it: `@upstash/ratelimit`'s `slidingWindow` reads and increments the counters in one Redis script per `limit()` call, evaluated atomically on the Upstash server, so concurrent requests are serialised there and cannot all read the same count. The probe sent its posts one after another (one worker, serial), so it says nothing about parallel bursts. Firing a parallel burst at production would lock the IP out again for no gain over the vendor guarantee |

The prohibition "MUST NOT run the live 429 probe unless Tim explicitly approves the agent running it" held: Tim chose `tim-runs`, and the agent ran nothing against production.

## Threat register outcomes

| Threat | Disposition | Outcome |
|--------|-------------|---------|
| T-13-42 probing IP lockout | accept | Tim's IP only, locked out of the form for up to an hour after run B |
| T-13-43 keep-alive logs | mitigate | Only the PONG line was read; no secret printed |
| T-13-SC npm installs | accept | No install in this plan |

## Accomplishments

- Production runs the fail-closed limiter from merge `d48af99`
- The daily Upstash keep-alive works with the repository secrets (first run 43466849915)
- The live limiter refuses past its window with 429 and a positive Retry-After, with no 503 and no email
- A follow-up to make the probe print its request number and Retry-After is logged in `deferred-items.md`

## Task Commits

1. **Task 1: production deployment and keep-alive** - `d476f8a` (docs, partial SUMMARY)
2. **Task 2: who runs the probe** - no commit (decision: "I run it (tim-runs)")
3. **Task 3: record the probe** - the docs commit that carries this SUMMARY and the `deferred-items.md` entry

## Files Created/Modified

- `.planning/phases/13-repo-safety-test-debt/13-17-SUMMARY.md` - deployment SHA, keep-alive run, probe runner and both probe outputs
- `.planning/phases/13-repo-safety-test-debt/deferred-items.md` - new entry: the limit probe should report its request number and Retry-After

## Decisions Made

- GUARD-09 stays `Pending` in REQUIREMENTS.md: by the shared-ID gate, 13-22 also declares GUARD-09 and has no SUMMARY yet.
- The concurrency truth is recorded as a backstop (vendor atomicity), not probed live.

## Deviations from Plan

**1. [Acceptance criterion partly met] The request number and Retry-After value are not in the output**
- **Found during:** Task 3
- **Issue:** The criterion "The SUMMARY shows the 429, its request number, and a Retry-After greater than 0" assumes the output prints them. The `list` reporter prints only pass/fail and duration.
- **What is recorded:** the 429 and Retry-After > 0 are proven by the passing assertion (lines 182-187); the request number (sixth in the window, loop post 2) is an inference from the slot count, labelled as such; the Retry-After value is unknown.
- **Follow-up:** logged in `deferred-items.md` (annotate the probe index and Retry-After via `test.info().annotations`); not implemented here.

**2. [Run count] The probe ran once at the limit level, plus one accidental default-level run**
- **Found during:** Task 3
- **Issue:** The command first given to Tim used bash `VAR=1 cmd` syntax, which PowerShell rejects. Tim then ran the default level (run A), which used 2 slots, before running the limit level once with PowerShell syntax (run B).
- **Effect:** "The probe ran exactly once" holds for the limit-level probe. Run A moved the expected 429 from loop post 4 to loop post 2, and it is why the slot table above starts with run A.
- **Fix for next time:** the PowerShell form is recorded above.

## Issues Encountered

None beyond the two deviations.

## Known Stubs

None. No source changed.

## User Setup Required

None. Tim's IP may be locked out of the contact form until about an hour after run B.

## Next Phase Readiness

- 13-22 owns the live Deployment Checks evidence and closes GUARD-09 in REQUIREMENTS.md once it finishes.
- The deferred probe-reporting follow-up is open for any later plan that touches `e2e/prod/contact-form.prod.ts`.

## Self-Check: PASSED

- `13-17-SUMMARY.md` and `deferred-items.md` exist under `.planning/phases/13-repo-safety-test-debt/`.
- Commit `d476f8a` is an ancestor of HEAD.
- Task 1 verify (`gh run list --workflow upstash-keepalive.yml --limit 1 --json conclusion --jq '.[0].conclusion'`) prints `success`; Task 3 verify (the node check for "429" and "Retry-After" in this file) prints `recorded`. Both were re-run after this SUMMARY was written.
- `commits: 1` was measured from the ledger at `.git/gsd-plan-head-before-13-17` (`705cf86..HEAD`). The docs commits carrying this SUMMARY and the STATE/ROADMAP update follow it.
- Nothing was run against production by the agent, no workflow was dispatched or re-run in this continuation, and nothing was pushed.

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
