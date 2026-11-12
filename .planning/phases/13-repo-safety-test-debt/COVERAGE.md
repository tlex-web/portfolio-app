# Phase 13: API coverage matrix

The phase hardens an existing integration (Upstash rate limiting, `lib/rate-limit.ts`) and consumes three external services operationally: the Upstash REST API (limiter and the new keep-alive), the GitHub REST API (CI workflows, proofs and settings verification through `gh`), and Vercel (dashboard settings and the production deployment). It builds no general-purpose client for any of them, so most of each surface is opted out with the reason below.

| capability | decision | reason |
|---|---|---|
| upstash:ratelimit-sliding-window | INTEGRATE | |
| upstash:ratelimit-analytics | INTEGRATE | |
| upstash:ratelimit-timeout | INTEGRATE | |
| upstash:rest-ping | INTEGRATE | |
| upstash:rest-set-with-expiry | INTEGRATE | |
| upstash:rest-other-commands | OPT-OUT | No product need: the site stores nothing in Redis beyond the limiter counters and the keep-alive key |
| upstash:management-api | OPT-OUT | Database provisioning and settings are Tim's, never an agent's (D-04, carried-forward settings rule) |
| github:compare-commits | INTEGRATE | |
| github:get-commit | INTEGRATE | |
| github:actions-list-runs | INTEGRATE | |
| github:actions-workflow-dispatch | INTEGRATE | |
| github:actions-watch-run | INTEGRATE | |
| github:check-runs-read | INTEGRATE | |
| github:check-runs-write | OPT-OUT | A workflow with checks write could forge CI OK; banned by check-ci-gate (T-13-01) |
| github:rules-for-branch-read | INTEGRATE | |
| github:rulesets-read | INTEGRATE | |
| github:rulesets-write | OPT-OUT | Tim applies rulesets himself with the prepared commands; the agent never writes settings (D-04) |
| github:pulls-create-ready-close | INTEGRATE | |
| github:pulls-merge | OPT-OUT | The agent never merges; only refused merge attempts on proof PRs (D-10) and Tim's own merges |
| github:deployments-read | INTEGRATE | |
| github:repository-secrets | OPT-OUT | Secrets are Tim's input; the agent records names only |
| github:apps-read | INTEGRATE | |
| github:other-endpoints | OPT-OUT | No phase requirement uses them |
| vercel:deployment-checks | INTEGRATE | |
| vercel:system-environment-variables | INTEGRATE | |
| vercel:env-list-names | INTEGRATE | |
| vercel:env-pull-values | OPT-OUT | Secret values never leave Vercel; names only (`vercel env ls`), per the phase constraints |
| vercel:rest-api | OPT-OUT | Settings are applied by Tim in the dashboard; no automation needs the Vercel API |
