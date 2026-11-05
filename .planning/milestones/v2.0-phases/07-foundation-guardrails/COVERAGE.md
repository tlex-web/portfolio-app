# API Coverage — GitHub Actions REST API (read-only CI status helper)

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Scope: `scripts/ci/check-visual-run.mjs` (plan 07-03) reads the public GitHub REST API to report the CI
> "Visual Regression" / "E2E Tests" / "Lint and Type Check" job result for a commit SHA. It is developer
> tooling for the Phase 7 gate protocol, not a product feature; the site itself calls no GitHub API.

| capability | decision | reason |
|---|---|---|
| list-workflow-runs-by-head-sha | INTEGRATE | |
| list-jobs-for-workflow-run | INTEGRATE | |
| optional-token-auth (GITHUB_TOKEN header) | INTEGRATE | |
| download-workflow-artifacts | OPT-OUT | needs auth even on public repos; user decision 2026-10-10: Tim downloads and reviews baselines by hand |
| download-job-logs | OPT-OUT | not needed; failure detail comes from the visual-diff artifact Tim reviews |
| create-workflow-dispatch | OPT-OUT | explicitly out of scope: requires a write token; dispatch stays manual and workflows keep contents: read |
| rerun-or-cancel-workflow-runs | OPT-OUT | not needed; would require write auth |
| check-runs-and-commit-statuses | OPT-OUT | not needed; the jobs endpoint already returns each job's conclusion |
| workflow-runner-secret-variable-cache-management | OPT-OUT | explicitly out of scope: repository administration, never automated by this phase |
