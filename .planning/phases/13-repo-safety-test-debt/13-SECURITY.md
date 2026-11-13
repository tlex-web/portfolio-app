---
phase: "13"
slug: "repo-safety-test-debt"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
created: "2026-11-13"
---

# Phase 13 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time (22 of 22 PLAN files carry a `<threat_model>`). L1 (grep-depth) verification, plus read-only `gh api` GETs for the settings-type mitigations.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| PR author → CI (ci.yml, `changes` job) | Any PR can change `ci.yml`; file names and event fields are attacker-controlled on fork PRs | Workflow YAML, file names, event fields (untrusted) |
| Workflow → Checks API | A job with `checks: write` could post a check run named `CI OK` | Check-run identity (merge gate) |
| PR (possibly a fork) → `pull_request_target` relay | Runs with the base repo's token; PR content is untrusted | Head ref, head SHA, commit message (untrusted); `actions: write` token |
| Merge → `main` → Vercel production | A merged commit deploys; ruleset 27216079 and Deployment Checks gate it | Production code |
| Visitor → `/api/feedback` | Untrusted POSTs; the limiter runs before body parse | Visitor name, email, message, IP |
| Route → Upstash REST | Network dependency that can be missing, slow or archived | Rate-limit keys (IP), Upstash credentials |
| GitHub Actions → Upstash REST | Repository secret crosses into a scheduled job | `UPSTASH_REDIS_REST_URL` / `_TOKEN` (secret) |
| Agent → settings / secrets / pushes | Settings, secrets, pushes and merges are Tim's only (D-04, D-10) | Repository and Vercel configuration |
| Browser → service worker cache | Image and navigation responses cached per build hash | Public site assets |
| npm registry → lockfile | A new package version enters the dependency tree | Dev dependency code (`@playwright/test` 1.65.0) |
| CI artifact → committed baselines | Downloaded PNGs become the new truth | Visual baselines |
| Lockfile, commits, tests, guards → merge gate | A weakened test or guard false negative lets regressions through `CI OK` | Test and guard logic |
| Phase records → later phases | Later planners trust these records | Ledger dispositions, SHAs |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-13-01 | Spoofing | Checks API / any workflow | high | mitigate | `scripts/guards/check-ci-gate.mjs` rule 6 bans `checks: write` and `permissions: write-all` (`CHECKS_WRITE`, `WRITE_ALL`, l.88, l.499-502), rule 7 requires explicit token scope (l.509); live ruleset 27216079 requires `CI OK` with `integration_id: 15368` (GET 2026-11-13; `apps/github-actions` id 15368) | closed |
| T-13-02 | Tampering | `ci-ok.needs` | high | mitigate | Guard rule 3 (set equality of `ci-ok.needs` vs every job id); `ci.yml:335` lists all 8 jobs; `guard:ci` is in `npm run lint` (`package.json`); `ci-gate: OK` | closed |
| T-13-03 | Elevation of privilege | `ci-ok` job-level `if:` | high | mitigate | Guard rule 2 (`check-ci-gate.mjs:371-376`, exactly `always()`); `ci.yml:334`; `scripts/ci/ci-ok.jq` fails non-object, empty input, missing/failed `changes`, and any `skipped` outside the two allowed cases | closed |
| T-13-04 | Denial of service (abuse) | Ratelimit timeout | high | mitigate | `lib/rate-limit.ts`: `if (production && result.reason === 'timeout') return refuse('timeout')`; test `rate-limit.test.ts:220` | closed |
| T-13-05 | Denial of service (abuse) | Unconfigured production limiter | high | mitigate | `lib/rate-limit.ts`: no-credentials branch `if (production) return refuse('unconfigured')`; route answers 503 (`app/api/feedback/route.ts`); tests `rate-limit.test.ts:86-103`, `feedback.test.ts:452` | closed |
| T-13-06 | Information disclosure | `[rate-limit]` and `[feedback]` logs | medium | mitigate | `refuse()` logs `{event, outcome, reason, timestamp}` only; test "never writes the identifier into the refusal line" (`rate-limit.test.ts:98`); `VISITOR_TEXT` afterEach in `app/api/__tests__/feedback.test.ts:86-91`. The `[feedback]` line keeps its pre-phase `ip` field, unchanged by this phase | closed |
| T-13-07 | Denial of service | `next build` importing the module | medium | mitigate | No throw at construction ("Never throw here: `next build` imports this module"); test "module import (T-13-07)" `rate-limit.test.ts:278` | closed |
| T-13-08 | Spoofing | Mixed credential pair | low | mitigate | `upstashCredentials()` returns one complete pair or null; tests `rate-limit.test.ts:163-204, 263` | closed |
| T-13-09 | Tampering | Audit exemptions | medium | mitigate | `ALLOWED_CONSOLE` (`e2e/helpers/audit.ts:39`) unchanged across the phase (`git diff b9db4ae HEAD -- e2e/helpers/audit.ts` empty) | closed |
| T-13-10 | Repudiation | Index-based route fixture | low | mitigate | `e2e/routes.ts:15-22` named `PHOTO_TEMPLATE_SLUG`, throws when missing; `lib/__tests__/audit-routes.test.ts` | closed |
| T-13-11 | Denial of service | `public/service-worker.js` image branch | low | mitigate | `request.destination === 'image'` kept (`service-worker.js:201`); SW media/navigation harness tests pass | closed |
| T-13-12 | Information disclosure | Upstash token in the keep-alive | medium | mitigate | `.github/workflows/upstash-keepalive.yml`: `schedule` + `workflow_dispatch` only, `permissions: {}`, secrets via `env:` only, curl stderr discarded, body never printed. Read-only token: Tim's confirmation on 2026-11-13 (his AskUserQuestion selection "It's the read-only token": the secret holds Upstash's Read-Only REST token). This rests on Tim's word, not on agent verification (the agent cannot read secret values); 13-05-SUMMARY:130 had recorded it as unverified | closed (Tim's confirmation) |
| T-13-13 | Denial of service | Archived Upstash database under fail-closed | high | mitigate | Daily cron `23 5 * * *`, fails red on missing secrets / curl error / no PONG; workflow `active`; run 43466849915 (main, success, PONG); 60-day pause recorded in the workflow header and PROJECT.md | closed |
| T-13-14 | Elevation of privilege | Agent applying settings | high | mitigate | 13-05 checkpoint: Tim added the secrets himself (Reply 2 "secrets added"); names only recorded; `gh secret list` names only | closed |
| T-13-15 | Repudiation | Ledger dispositions | low | mitigate | `13-LEDGER-TRIAGE.md` `## Approval` quotes Tim's reply verbatim; every row cites evidence; 65c32c6 wrote the four v2.0 `*-REVIEW-DISPOSITION.md` files, each referencing `13-LEDGER-TRIAGE` | closed |
| T-13-16 | Elevation of privilege | Docs-only classification | high | mitigate | `scripts/ci/classify-changes.mjs`: exact `DOCS_ONLY_FILES` + `.planning/` prefix, no extension rule, empty/truncated → full CI; `ci.yml` changes step feeds `previous_filename`, maps line-break names to a non-docs marker, failed compare / empty base → `docs_only=false`; selftest + G2 stub-gh test (5cdec94) | closed |
| T-13-17 | Tampering | `changes` job shell | high | mitigate | Event fields only via `env:` and quoted; no `${{` in the run block; file names from the compare API via jq → stdin, never evaluated | closed |
| T-13-18 | Denial of service | Workflow-level path filter | medium | mitigate | Guard rule 9 (`PATHS_FILTER`, `check-ci-gate.mjs:92, 418`); `ci.yml` `on:` has none; fixture `bad-paths-filter` | closed |
| T-13-19 | Tampering | e2e and unit assertions | low | mitigate | 13-08-SUMMARY "Seeded faults" table and `RED_EVIDENCE_OK` records; no `.only(`/`.skip(`/`.fixme(` in `e2e lib components app` | closed |
| T-13-20 | Denial of service | LightboxDialog closing state | low | mitigate | `closing.current = false` on show (`LightboxDialog.tsx` useLayoutEffect); test `lightbox-dialog.test.tsx:122` | closed |
| T-13-21 | Tampering | Selector built from a slug | low | accept | See Accepted Risks AR-13-01 | closed |
| T-13-22 | Elevation of privilege | Relay under `pull_request_target` | critical | mitigate | `ci-skip-relay.yml` has no checkout step and no git/gh checkout; guard rule 11 (`USES_CHECKOUT`, `CHECKOUT_COMMAND`); dispatched `ci.yml` runs with `permissions: contents: read` | closed |
| T-13-23 | Tampering | Head ref and commit message in shell | high | mitigate | All event fields via `env:`, quoted; guard rule 12 bans `${{` in run blocks (incl. comments); G1 stub-gh test (952c3a6) | closed |
| T-13-24 | Spoofing | Fork PR with a marker | high | mitigate | Relay step: `if [ "$HEAD_REPO" != "$REPO" ]; then ... exit 1` before any dispatch | closed |
| T-13-25 | Elevation of privilege | Token scope | medium | mitigate | Relay top-level `permissions: {}`; `detect` read-only; `actions: write` only on `relay`; guard rule 15 (+ fixture `bad-token-scope`) | closed |
| T-13-26 | Elevation of privilege | Vacuous CI OK via skipped job | high | mitigate | Relay job has no job-level `if:`; name is a `needs.`-based expression; guard rules 5 and 13 | closed |
| T-13-27 | Denial of service | Relay never reports | medium | mitigate | `timeout-minutes: 100`; fails when the dispatched run is not found in 5 min or tested another SHA | closed |
| T-13-28 | Denial of service | `storeCopy` | low | mitigate | `try/catch` around `clone()`/`waitUntil` plus `.catch(() => {})` on the put (`service-worker.js:25`); 8 harness cases `service-worker-media.test.ts:199-227` | closed |
| T-13-29 | Information disclosure | SafeCanvas error logging | low | accept | See Accepted Risks AR-13-02 | closed |
| T-13-30 | Tampering | `--root` flag | low | accept | See Accepted Risks AR-13-03 | closed |
| T-13-31 | Tampering | Phase 15 refactor silently dropping a guard | medium | mitigate | Spawned characterization cases in `scripts/guards/selftest.mjs:2051-2109` (G5, G6); 13-12-SUMMARY seeded-fault table | closed |
| T-13-32 | Tampering | Contrast and palette guards | medium | mitigate | Fixtures `contrast/media-override.css`, `palette/bad-directional`, `palette/bad-png-untracked`; 13-13-SUMMARY RED evidence; real tree passes `npm run lint` guards | closed |
| T-13-33 | Tampering | Snapshot gate on merge commits | medium | mitigate | `snapshotDiffArgs()` diffs a merge against `parents[0]` (`scripts/ci/check-snapshot-commit.mjs`); selftest cases (bcd38e0, 08f11e2) | closed |
| T-13-34 | Tampering | Nested vulnerable dependency copy | medium | mitigate | `check-install-parity.mjs` checks every nested `.../node_modules/<name>` copy and per-version-line floors; fixtures `parity/nested-floor`, `parity/unfloored-line` | closed |
| T-13-35 | Denial of service | Fail-closed limiter reaching main before names confirmed | high | mitigate | 13-15 Task 1 precondition recorded (13-15-SUMMARY:130: complete UPSTASH pair in Production, System Env Vars on); 13-17 live 429 probe confirms the limiter answers in production | closed |
| T-13-36 | Elevation of privilege | Unapproved push | high | mitigate | Tim's literal reply "Push and pr", mapped by the orchestrator to option `push-and-pr` (plain push, PR, fast-forward fix pushes allowed); plain `git push -u origin HEAD`; one fast-forward fix push 5436cb2 within that option | closed |
| T-13-37 | Elevation of privilege | Ruleset bypass | high | mitigate | Live GET 2026-11-13: ruleset 27216079 `enforcement: active`, `bypass_actors: []`, `current_user_can_bypass: "never"`; the only ruleset on the repo | closed |
| T-13-38 | Spoofing | Required check from another app | high | mitigate | Live GET: `required_status_checks: [{context: "CI OK", integration_id: 15368}]`; `apps/github-actions` id 15368 | closed |
| T-13-39 | Tampering | Unchecked commit promoted to production | high | mitigate | Vercel Deployment Checks on `CI OK`: Tim's literal reply "applied, deployment checks on" (13-16). **Not agent-verified** (no Vercel API in scope). The only production deployment (7770069186, d48af99, 16:09:27Z) predates the setting; `main` is still d48af99, so no gated promotion has happened yet. Live proof pending the phase-close merge (owner: Phase 13 close; fallback: first Phase 14 merge; `deferred-items.md:33-35`, ROADMAP Phase 14 scope notes). See Accepted Risks AR-13-06 | closed (accepted, live proof pending) |
| T-13-40 | Repudiation | Deleted ruleset unrecoverable | low | mitigate | Export committed in 485ecbe (`automated-actions-10401314.json`, `main-ruleset.json`) before deletion; GET ruleset 10401314 now 404 | closed |
| T-13-41 | Denial of service | Ruleset before CI OK on main | medium | mitigate | Live GET: `CI OK` on d48af99 success at 16:39:08Z (app 15368); ruleset `created_at` 16:43:57Z | closed |
| T-13-42 | Denial of service | Probing IP lockout | low | accept | See Accepted Risks AR-13-04 | closed |
| T-13-43 | Information disclosure | Keep-alive logs | low | mitigate | Workflow never echoes URL/token (`2>/dev/null` on curl, body only piped to jq); 13-17 read only the PONG line | closed |
| T-13-44 | Tampering | Split bump (tag vs lockfile) | medium | mitigate | Single commit 5ab6d15 (5 files); `check-install-parity.mjs` rule 4 matches every `playwright:vX.Y.Z-noble` tag to the lockfile; four sites at v1.65.0-noble; `parity: OK` | closed |
| T-13-45 | Elevation of privilege | Proof PR merged into production | high | mitigate | Live GET: #144, #145, #146 all `CLOSED`, `mergedAt: null`; no open `ci/13-proof-*` PR; 13-19-SUMMARY merge-attempt gating | closed |
| T-13-46 | Elevation of privilege | Pushes beyond the D-10 approval | medium | mitigate | Only `ci/13-proof-red`, `-docs`, `-skip` were pushed; none remain on origin (branch list GET) | closed |
| T-13-47 | Tampering | Re-baseline absorbing an unintended change | high | mitigate | Baseline run 43500162579: 48 PNGs, all blob-identical; Tim's reply "none"; `check-snapshot-commit --none` OK (0 changed) on 5ab6d15, 3757994, cffcf99; 0 PNGs changed in the phase (`git diff b9db4ae HEAD -- '*.png'`) | closed |
| T-13-48 | Tampering | Artifact contents | low | mitigate | Artifact downloaded into a new empty scratchpad dir `dl-baselines-43500162579`; nothing placed (`changed_pngs: []`) | closed |
| T-13-49 | Spoofing | Fail-fast relay reporting green | high | mitigate | Not applicable: option B was never built (13-21, `relay.decision a-confirmed`); the live relay is option A and passes guard rules 11-15 | closed (component not built) |
| T-13-50 | Elevation of privilege | Early delivery of unrelated work to main | medium | mitigate | Not applicable: no fallback branch or PR exists (branch and PR list GET) | closed (component not built) |
| T-13-51 | Repudiation | Stale or unsupported ledger status | low | mitigate | All 51 SHAs cited in `13-LEDGER-TRIAGE.md` `## Rows` resolve to commits (`git cat-file -e`); 44 rows each with a Final value | closed |
| T-13-52 | Repudiation | Fix-now rows with no owner task | low | mitigate | `13-LEDGER-TRIAGE.md` `## Unowned fix rows`: none | closed |
| T-13-SC (13-18) | Tampering | npm install of `@playwright/test` 1.65.0 | high | mitigate | Tim's literal reply "verified" at the blocking checkpoint, before install (13-18-SUMMARY:17, 72-78, with `npm view` evidence); lockfile pins `@playwright/test`, `playwright`, `playwright-core` at 1.65.0 with integrity; lockfile committed in 5ab6d15 | closed |
| T-13-SC (21 plans) | Tampering | npm installs | low | accept | See Accepted Risks AR-13-05 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-13-01 | T-13-21 | Slugs are build-time data validated by the photo schema; `cssEscape` (`lib/photos/css-escape.ts`) covers odd characters anyway | Plan-time disposition (13-09-PLAN threat model) | 2026-11-13 |
| AR-13-02 | T-13-29 | SafeCanvas logs to the client-side console only; errors carry no visitor data | Plan-time disposition (13-11-PLAN threat model) | 2026-11-13 |
| AR-13-03 | T-13-30 | `--root` is a local developer flag, never set in CI except by the selftest's own temp roots; default unchanged | Plan-time disposition (13-12-PLAN threat model) | 2026-11-13 |
| AR-13-04 | T-13-42 | Lockout of up to one hour for Tim's IP only; the probe ran once, with his approval (D-15) | Plan-time disposition (13-17-PLAN); outcome recorded in 13-17-SUMMARY | 2026-11-13 |
| AR-13-05 | T-13-SC (13-01 to 13-17, 13-19 to 13-22) | No package install in these plans. Verified: the only phase commit changing a dependency is 5ab6d15 (13-18); 1bbb347 changed `package.json` scripts only | Plan-time disposition (each PLAN threat model) | 2026-11-13 |
| AR-13-06 | T-13-39 | Mitigation configured per Tim's 13-16 reply "applied, deployment checks on" (Vercel Deployment Checks on `CI OK`). Not verified by API (no Vercel access in scope) and not yet observed live: the only production deployment (7770069186, d48af99) predates the setting and `main` has not moved since. The live proof, a production deployment held until its merge commit's `CI OK` succeeds, is owned by the phase-close merge, with the first Phase 14 merge as fallback (`deferred-items.md` lines 33-35; ROADMAP.md Phase 14 scope notes, "Fallback for the Deployment Checks live proof"). If that deployment promotes before `CI OK`, the D-07 residual applies and goes back to Tim | Tim, AskUserQuestion selection "Accept, track proof (Recommended)" | 2026-11-13 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-13 | 54 | 52 | 2 (1 blocking: T-13-39; 1 non-blocking: T-13-12) | gsd-secure-phase (L1, orchestrator classification; read-only gh GETs) |
| 2026-11-13 | 54 | 54 | 0 | gsd-secure-phase Step 4 resolution: T-13-39 accepted by Tim (AR-13-06, live proof pending); T-13-12 closed on Tim's confirmation of the Read-Only token |

Informational (not threats):
- 13-15-SUMMARY:125 said "No fix push was needed", while lines 47, 201 and 229 record the fast-forward fix push 5436cb2 (within the approved `push-and-pr` option). Corrected in the same commit as this file.
- `@firefox-43967` excludes 7 cases on Firefox only (13-20, Tim's choice "A-tag (Recommended)"); owner and trigger for removal are in `deferred-items.md`.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-13 (T-13-39 closed as an accepted risk with its live proof still pending; T-13-12 closed on Tim's word)
