---
phase: "7"
slug: "foundation-guardrails"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: "2026-10-24"
---

# Phase 7 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Built by `/gsd-secure-phase 07` from the `<threat_model>` blocks of all 26 plans (07-01 … 07-26) and the `## Threat Flags` sections of their SUMMARYs. ASVS level 1: each mitigation was checked at grep depth against the tree at `d6594a5` (code identical to `4969072`, CI run 40045453857 green).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → install / lockfile / runtime / client bundle / guard tooling | Package bytes enter the build, the server runtime, every visitor's bundle or the dev toolchain (07-01, 07-05, 07-06, 07-13, 07-20) | Third-party code; pinned by `package-lock.json` integrity hashes under `npm ci` |
| Dependabot → repository | Automated PRs can change dependency versions (07-01, 07-26) | Version bumps; gated by CI and the parity guard |
| CI runner → Vercel | The production build must match what CI tested (07-01) | Install command and Node version |
| Developer → lint / guard configuration | A weakened config, raised ratchet or new exemption silently stops a guard (07-02, 07-20) | Repository config |
| GitHub Actions token → repository | A baseline job with write access could alter the repo unreviewed (07-03) | `GITHUB_TOKEN` scope |
| Workflow inputs → shell | `workflow_dispatch` inputs reach a run step (07-03) | Untrusted strings |
| CI artifact → developer machine → commit | Baseline PNGs are downloaded and committed by hand; an unintended diff could hide in an intended re-baseline (07-03, 07-04, 07-14) | Snapshot images |
| Container registry → CI runner | The baseline renderer is a third-party container image (07-08) | Container image |
| Returning visitor's service worker → deleted routes | A precached v1 page could still be served (07-04) | Cached HTML |
| Internet → Next.js server (Vercel) | Every request is handled by the framework that carried the announced CVEs (07-06, 07-07) | All public HTTP traffic |
| Build → Google Fonts | `next/font` downloads the font at build time and self-hosts it (07-11) | Font files (build time only) |
| Tim / repository → public site and package metadata | Contact identity in `data/site.ts` and `package.json` is published to every visitor (07-21, 07-25) | Public name, email, LinkedIn, GitHub |
| Request routing → `app/api` | Moving routes into `app/(site)` must not change API or proxy matching (07-22) | Request paths, CSP nonce matcher |
| Server/runtime error → rendered page | Exception detail could reach the visitor (07-23) | Error message, digest |
| Browser form → `/api/feedback` | Untrusted input crosses here: zod validation, CSRF origin check, Upstash rate limit (07-24) | Visitor-supplied form fields |

Plans 07-09, 07-10, 07-12 and 07-15 … 07-19 declared no new boundary (CSS and client config only).

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-07-01 | Tampering | `vercel.json` installCommand | medium | mitigate | `vercel.json` `"installCommand": "npm ci"`; `check-install-parity.mjs` asserts it in lint | closed |
| T-07-02 | Repudiation | test suites | medium | mitigate | `test-count.mjs` fails on a drop, `.skip(` or `.only(`; `--update` refuses to lower the baseline (206 = baseline 206) | closed |
| T-07-03 | Tampering | `.github/dependabot.yml` | low | mitigate | Phase 7 upgrade holds removed in 07-26 (`8eddb50`); no `motion`/`framer-motion` ignore entries remain | closed |
| T-07-04 | Tampering | `eslint.config.mjs` | low | mitigate | `selftest.mjs` jsx-a11y probe requires exit 1 with a `jsx-a11y/` rule id (55/55 self-test cases pass) | closed |
| T-07-05 | Elevation of Privilege | `.github/workflows/visual-baselines.yml` | high | mitigate | `permissions: contents: read`; artifact upload only; no `contents: write`, `git push`, `git commit` or PR step | closed |
| T-07-06 | Tampering | e2e/visual baselines | medium | mitigate | Human review before a manual commit; `e2e/visual/README` forbids non-Linux PNGs; the snapshot-commit checker compares the changed PNG set with the expected list (`--allow <slug>`, never `--allow-all`) | closed |
| T-07-07 | Tampering | `workflow_dispatch` inputs | medium | mitigate | Inputs are `type: choice` and reach the shell only through `env` (`UPDATE_MODE`); no `${{ inputs.* }}` inside `run:` | closed |
| T-07-08 | Tampering | `public/service-worker.js` precache | low | accept | SW precaches only `/` and `/offline`, keyed by build hash; network-first navigation is EDGE-02 (Phase 12). See Accepted Risks Log | closed |
| T-07-09 | Tampering | e2e/visual baselines | medium | mitigate | Changed-PNG set had to equal the six `/photos` files (07-04 Task 3) before the amend; same checker as T-07-06 | closed |
| T-07-10 | Tampering | `motion@14.1.0` install | high | mitigate | Blocking-human legitimacy checkpoint (07-05 Task 1, approved); `"motion": "14.1.0"` exact; lockfile integrity present; no install script; `npm ci` in CI | closed |
| T-07-11 | Elevation of Privilege | Next runtime (announced upstream CVEs) | high | mitigate | Closed by T-07-13: 16.4.0 floor blocked downgrades until 07-07 installed the patched release | closed |
| T-07-12 | Tampering | next / eslint-config-next / R3F / drei installs | high | mitigate | Blocking-human legitimacy checkpoint (07-06 Task 1, approved); exact versions installed and locked (`package-lock.json` integrity, `npm ci` everywhere); `version-floors.json` blocks downgrades. `package.json` keeps caret ranges by the 07-06 decision ("caret style kept"); the lockfile is the pin | closed |
| T-07-13 | Elevation of Privilege | next and upstream dependencies (2 Critical + 1 High) | critical | mitigate | Installed `next` 16.4.2 and `sharp` ≥ 0.35.5 (the advisory's patched versions); floors in `version-floors.json` enforced by `check-install-parity.mjs` | closed |
| T-07-14 | Tampering | `mcr.microsoft.com/playwright` image | medium | mitigate | Official MCR image only; every `playwright:vX.Y.Z-noble` tag must equal the lockfile `@playwright/test` (parity guard) | closed |
| T-07-15 | Tampering | motion tokens (CSS vs JS drift) | low | mitigate | `lib/__tests__/motion-tokens.test.ts` CSS/JS parity suite (green) | closed |
| T-07-16 | Tampering | text/background contrast during the palette shift | low | mitigate | Human review of every re-baselined route; `check-contrast.mjs` enforces AA on every semantic pair in lint since 07-20 | closed |
| T-07-17 | Information Disclosure | font loading | low | mitigate | `next/font` in `app/layout.tsx` self-hosts the files; CSP in `proxy.ts` keeps `font-src 'self'` | closed |
| T-07-18 | Denial of Service | layout shift on scroll lock | low | mitigate | `design-system.spec.ts` "scroll lock keeps the header box" runs with real scrollbars (CI E2E green) | closed |
| T-07-19 | Tampering | `@phosphor-icons/react@2.1.10` | medium | mitigate | RESEARCH audit [OK]; `"2.1.10"` exact; lockfile integrity; no install script; legitimacy re-checked before install (07-13) | closed |
| T-07-20 | Tampering | `.github/workflows/visual-baselines.yml` | medium | mitigate | Update step runs `--project=visual-dark` only; `visual-light` appears 0 times in the workflow | closed |
| T-07-21 | Tampering | Contact form markup during the `dark:` collapse | low | mitigate | Class-only edits; `contact-form.spec.ts` and `FeedbackForm.test.tsx` unchanged and green | closed |
| T-07-22 | Tampering | Contact form during class mapping | medium | mitigate | Class-only edits; `/api/feedback`, CSRF and rate limiting untouched; contact tests unchanged and green | closed |
| T-07-23 | Tampering | Roadmap information encoding | low | accept | Colour-only change; icons and text labels carry the meaning. See Accepted Risks Log | closed |
| T-07-24 | Tampering | Project detail rendering | low | accept | Class-only edits reviewed in the re-baseline; `projects.spec.ts` covers navigation and content. See Accepted Risks Log | closed |
| T-07-25 | Tampering | Photo modal and edge pages | low | accept | Class-only edits reviewed in the re-baseline; `photos.spec.ts` covers the modal. See Accepted Risks Log | closed |
| T-07-26 | Tampering | `scripts/guards/palette-ratchet.json` | medium | mitigate | `check-palette.mjs --update` refuses to raise any count; a lower count fails until recorded; self-test proves the refusal | closed |
| T-07-27 | Tampering | `colorjs.io@0.7.1` | low | mitigate | RESEARCH audit [OK]; devDependency only, used only by `.mjs` guards (no import in `app`, `components`, `lib`, `data`); no install script | closed |
| T-07-28 | Spoofing | `data/site.ts` identity | medium | mitigate | Blocking-human input (07-21 Task 1); required string types; `check-identity.mjs` in lint since 07-25 | closed |
| T-07-29 | Information Disclosure | contact email | low | accept | Tim chose the public address; the executor never reads git config or account metadata. See Accepted Risks Log | closed |
| T-07-30 | Tampering | `proxy.ts` CSP/nonce matcher and `app/api` | medium | mitigate | `proxy.ts` and `app/api` stay at the root (no `app/(site)/api`); route groups do not change URLs; contact-form e2e (CSRF path) green | closed |
| T-07-31 | Information Disclosure | `(site)/error`, `global-error` | medium | mitigate | `ErrorBody` never reads `error.message`/`digest`; `ErrorBody.test.tsx` and `global-error.test.tsx` assert a secret message and digest are absent | closed |
| T-07-32 | Spoofing | identity strings across app, data, `package.json` | medium | mitigate | `npm run guard:identity` in lint (forbidden strings, `site.ts` shape, derived author) with failing self-test fixtures | closed |
| T-07-33 | Tampering | FeedbackForm restyle vs `/api/feedback` CSRF + rate limit + validation | high | mitigate | `app/api` untouched; `contact-form.spec.ts` and `app/api/__tests__/feedback.test.ts` unchanged and green | closed |
| T-07-34 | Tampering | `scripts/guards/test-count.baseline.json` | medium | mitigate | `test-count.mjs --update` refuses a lower total; baseline raised 91 → 206 in 07-26 | closed |
| T-07-35 | Tampering | resumed Dependabot PRs (incl. `@playwright/test` without the container tag) | low | mitigate | Parity guard fails a `@playwright/test` bump without the matching container tag; version floors block downgrades | closed |
| T-07-SC | Tampering | npm installs (every plan) | high | mitigate | `npm ci` in every CI job and on Vercel (no `npm install` in workflows, parity-guarded); lockfile integrity for every package; legitimacy gate before each new or too-new package (07-02, 07-05 … 07-08, 07-13, 07-20, 07-24); no new package has an install script; plans without installs added none | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-07-01 | T-07-08 | A returning visitor's service worker precaches only `/` and `/offline`, keyed by build hash, so a deleted playground route is not served from cache; network-first navigation is scheduled as EDGE-02 (Phase 12) | 07-04 plan threat model (`accept` disposition) | 2026-10-24 |
| AR-07-02 | T-07-23 | Roadmap colours changed only; icons and visible labels still carry status, area and priority; reviewed in the re-baseline | 07-17 plan threat model (`accept` disposition) | 2026-10-24 |
| AR-07-03 | T-07-24 | Project detail class-only edits, reviewed in the re-baseline; `projects.spec.ts` (7) passes | 07-18 plan threat model (`accept` disposition) | 2026-10-24 |
| AR-07-04 | T-07-25 | Photo modal and edge pages class-only edits, reviewed in the re-baseline; `photos.spec.ts` (6) passes | 07-19 plan threat model (`accept` disposition) | 2026-10-24 |
| AR-07-05 | T-07-29 | The published contact email is the public address Tim supplied at the 07-21 blocking input; no other identity source is read | 07-21 plan threat model (`accept` disposition) | 2026-10-24 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-24 | 36 | 36 | 0 | `/gsd-secure-phase 07` (orchestrator, ASVS L1 grep depth; auditor skipped by the short-circuit rule) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-24
