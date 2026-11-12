# Phase 13: Repo Safety & Test Debt - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-12
**Phase:** 13-repo-safety-test-debt
**Areas discussed:** Ruleset & bypass, Skipped CI & deploys, Limiter failure mode, Ledger triage

---

## Ruleset & bypass

**Who can bypass the new `main` ruleset?**

| Option | Description | Selected |
|--------|-------------|----------|
| Nobody (Recommended) | Empty bypass list, so a red PR can't merge, not even Tim's; emergency = disable the ruleset in Settings | ✓ |
| Admin, via PR only | "Merge without waiting" box on PRs; direct pushes blocked; red-PR test holds only for non-admins | |
| Admin, always | Admin can also push straight to main, which Vercel deploys; reopens the GUARD-07/08 gap | |

**User's choice:** Nobody (Recommended)

**What happens to the inert `automated-actions` ruleset (id 10401314)?**

| Option | Description | Selected |
|--------|-------------|----------|
| Delete it (Recommended) | New ruleset already carries deletion and non-fast-forward; JSON export saved first | ✓ |
| Disable, keep it | Enforcement set to disabled; stays listed, inert | |
| Leave as is | Harmless today; risk if a branch is ever added to it | |

**User's choice:** Delete it (Recommended)

**Which merge methods does the ruleset allow?**

| Option | Description | Selected |
|--------|-------------|----------|
| Merge commit only (Recommended) | Matches #109 to #142; squash or rebase would orphan cited SHAs | ✓ |
| Merge + squash | Small Dependabot or chore PRs could land as one commit | |
| All three | Same as the current repo settings | |

**User's choice:** Merge commit only (Recommended)
**Notes:** The web-editor README edit (cf7975b) would now need "Propose changes" → PR.

**How does Tim apply the settings changes?**

| Option | Description | Selected |
|--------|-------------|----------|
| Prepared gh commands (Recommended) | Tim reviews the JSON and runs `! gh api …` himself; agent verifies with `gh api` | ✓ |
| GitHub UI + checklist | Tim clicks through Settings → Rules; agent verifies and diffs | |
| Agent applies after OK | Agent runs `gh api` after approval in chat; breaks "settings are Tim's" | |

**User's choice:** Prepared gh commands (Recommended)
**Notes:** Applied only after the `CI OK` job has reached main.

---

## Skipped CI & deploys

**What should `CI OK` do when a PR head says `[ci skip]`?**

| Option | Description | Selected |
|--------|-------------|----------|
| Run full CI anyway (Recommended) | Companion workflow dispatches normal CI via workflow_dispatch; real `CI OK`; fork PRs with the marker go red | ✓ |
| Red CI OK + instructions | Instant fail with "push a commit without the marker"; GSD ship's zero-checks recovery would stop firing | |
| Stop writing the marker | Patch the GSD ship step locally; overwritten by updates; hand-typed markers still pend | |

**User's choice:** Run full CI anyway (Recommended)

**Production gate fallback if Vercel Deployment Checks aren't on Hobby**

| Option | Description | Selected |
|--------|-------------|----------|
| Ruleset only, record gap (Recommended) | Every main commit arrives via a green PR; the merge-commit residual is recorded as an accepted risk | ✓ |
| Deploy prod from Actions | Turn off Vercel auto production deploys; `vercel deploy --prod` after `CI OK`; needs VERCEL_TOKEN | |
| Ruleset + up-to-date | Strict checks close most of the gap; every behind PR needs an update and a new 40-min run | |

**User's choice:** Ruleset only, record gap (Recommended)
**Notes:** Deployment Checks on `CI OK` stay the primary mechanism; Vercel's changelog says they work for every GitHub-connected project, but the Hobby dashboard must confirm it.

**Should docs-only PRs skip the heavy jobs?**

| Option | Description | Selected |
|--------|-------------|----------|
| No, every PR runs all (Recommended) | Nothing passes by skipping; a guard bans `paths:` filters; planning PRs wait about 40 min | |
| Yes, fast path in CI OK | A changes job diffs against the base; docs-only → heavy jobs skip; `CI OK` accepts intended skips | ✓ |

**User's choice:** Yes, fast path in CI OK (Tim chose against the recommendation)

**Which paths count as docs-only?**

| Option | Description | Selected |
|--------|-------------|----------|
| .planning/** + named docs (Recommended) | Plus README.md, AGENTS.md, scripts/README.md, e2e/visual/README.md, .github/copilot-instructions.md; anything else runs full CI | ✓ |
| .planning/** only | Tightest; a README edit runs the full CI | |
| Any *.md anywhere | Broadest; would let selftest fixture READMEs skip the guard selftest | |

**User's choice:** .planning/** + named docs (Recommended)

**Who runs the live proofs (red PR, `[ci skip]` head PR, docs-only PR)?**

| Option | Description | Selected |
|--------|-------------|----------|
| Agent, throwaway PRs (Recommended) | `ci/13-*` branches, draft PRs, record merge state and refusal, close and delete; direct-push blocking proven from `gh api` only | ✓ |
| Agent prepares, you open | Agent pushes branches and writes the PR text; Tim opens and closes the PRs | |
| Agent, incl. direct push | Also a live empty-commit push to main that must be rejected; a wrong ruleset would deploy a no-op | |

**User's choice:** Agent, throwaway PRs (Recommended)

---

## Limiter failure mode

**Free-tier archival after about 14 days idle, given fail-closed**

| Option | Description | Selected |
|--------|-------------|----------|
| Daily keep-alive (Recommended) | A scheduled job touches Redis daily; Tim adds the secret it needs | ✓ |
| Rely on Upstash emails | No new parts; form down from archival until Tim restores | |
| Fail open on outage only | Refuse only when unconfigured; conflicts with GUARD-09 as written | |

**User's choice:** Daily keep-alive (Recommended)

**Where does the live 429 probe run?**

| Option | Description | Selected |
|--------|-------------|----------|
| Your machine, once (Recommended) | Existing `PROD_FORM_LIMIT=1 npm run test:prod-form`; Tim's IP locked out for up to an hour | ✓ |
| GitHub runner, on demand | Manual workflow from a hosted runner; repeatable, no lockout; one more workflow | |

**User's choice:** Your machine, once (Recommended)

**How does Tim find out that the form is refusing?**

| Option | Description | Selected |
|--------|-------------|----------|
| Keep-alive doubles as monitor (Recommended) | Scheduled GitHub workflow PINGs Redis and fails if it can't, and GitHub emails Tim; Upstash secrets in the repo | ✓ |
| Plus email on refusal | /api/feedback also emails Tim via Resend once per instance | |
| Vercel Cron, logs only | Keep-alive as a cron route; failures only in roughly 1-hour Hobby logs | |

**User's choice:** Keep-alive doubles as monitor (Recommended)

**What do previews do when the limiter is missing or unreachable?**

| Option | Description | Selected |
|--------|-------------|----------|
| Production only (Recommended) | Previews and local keep the allow-all fallback with its warning | ✓ |
| Previews fail closed too | Previews need the Upstash variables; test sends count against production's limits unless separated | |

**User's choice:** Production only (Recommended)

---

## Ledger triage

**How are the 44 open rows decided?**

| Option | Description | Selected |
|--------|-------------|----------|
| Agent proposes, one table (Recommended) | Agent checks each row against current code and proposes a disposition; Tim approves or overrides the table at one checkpoint | ✓ |
| Agent settles info rows | Agent closes IN rows alone; Tim decides the 7 warnings and risky accepts | |
| You decide each row | Small batches, ruled on one by one | |

**User's choice:** Agent proposes, one table (Recommended)

**Rows in code that a later v2.1 phase rewrites or retires**

| Option | Description | Selected |
|--------|-------------|----------|
| Hand to rewriting phase (Recommended) | Note in that phase's scope, or a requirement; only surviving code is fixed now | ✓ |
| Fix now regardless | Close every fixable row now, even in code about to be replaced | |

**User's choice:** Hand to rewriting phase (Recommended)

**Default stance on small info findings whose code survives**

| Option | Description | Selected |
|--------|-------------|----------|
| Fix if cheap & neutral (Recommended) | Small, pixel-neutral, testable → fix; otherwise accept with a reason; guard and test rows lean towards fixing | ✓ |
| Fix everything fixable | Maximum closure; noticeably bigger phase | |
| Accept unless it bites | Fix only warnings and real-impact rows | |

**User's choice:** Fix if cheap & neutral (Recommended)

**Where is the triage outcome recorded?**

| Option | Description | Selected |
|--------|-------------|----------|
| Both, phase 13 is source (Recommended) | `13-LEDGER-TRIAGE.md`, plus archived rows flipped to their final status with a pointer | ✓ |
| Phase 13 file only | Archived ledgers keep reading "open" | |
| Archived ledgers only | Updated in place, no Phase 13 summary | |

**User's choice:** Both, phase 13 is source (Recommended)

---

## Claude's Discretion

- `CI OK` job shape and its intended-skip rules
- Mechanics of the `[ci skip]` companion workflow and the docs-only `changes` job
- Accepting both the `UPSTASH_*` and the `KV_REST_API_*` variable pairs
- Fail-closed status and code (no UI change), the timeout value and per-refusal logging
- Keep-alive schedule, command and secret names
- G5/G6 testability approach
- Audit gate route derivation, widths and keeping E2E under about 45 minutes (sharding allowed)
- CLEAN-01 removals, each proven unused first
- Scope of the mid-phase PR to `main`

Offered at the wrap-up and not discussed: the E2E time budget and how a Playwright 1.65 re-baseline diff is handled. Tim chose "I'm ready for context", so both follow the research and the zero-diff exception policy.

## Deferred Ideas

None. The discussion stayed within the phase scope.
