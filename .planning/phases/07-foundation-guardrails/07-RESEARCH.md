# Phase 7: Foundation & Guardrails - Research

**Researched:** 2026-10-10
**Domain:** CI guardrails (install parity, visual regression, test ratchet, palette/contrast/a11y lint), isolated dependency upgrades (motion 14.1, Next 16.4 + React 19.3 + R3F 9.8.1, Playwright 1.64), tokens v2, and the `(site)` shell in Next.js App Router + Tailwind v4
**Confidence:** HIGH for repo state, versions and upgrade compatibility. Each upgrade was dry-run against the lockfile in a scratch copy, then `tsc`, Jest and `next build` were run. MEDIUM for the Linux baseline workflow and HOME-08 measurement design. Those are standard patterns but were not executed here, because the Docker daemon is not running.

<user_constraints>
## User Constraints (no CONTEXT.md; locked decisions come from ROADMAP Phase 7 and the approved 07-UI-SPEC.md)

### Locked Decisions
- **Build order is LOCKED** (ROADMAP Phase 7), as 10 steps:
  1. Install parity + lint wiring + test ratchet.
  2. Baselines on the lockfile Playwright version.
  3. Delete the playground (`/gradient-mesh`, `/particle-buttons`, `/transitions`, the `/transitions` link on Photos, zero-consumer components). `AnimatedGradientMesh` stays until Phase 12.
  4. `framer-motion` → `motion` 14.1 (`motion/react`) in its own zero-diff commit with a single `motion-dom`.
  5. Next 16.4.x (incl. the 2026-10-14 security patch) + React 19.3 + `@types/react*` + R3F 9.8.1 + drei 10.7.9 in one atomic zero-diff commit.
  6. Playwright 1.64 in its own commit; re-baseline only if Chromium forces it.
  7. Tokens v2 / type stack / motion tokens (parity test, `MotionConfig reducedMotion="user"`) / visible scrollbar with `scrollbar-gutter: stable` / one SVG icon family. UI-SPEC sub-commits 7a–7e, each re-baselined with a stated reason.
  8. Staged `dark:` removal (neutralise, then collapse with zero diff, then map, then remove), and only then the palette guard (scans `data/` and tests, per-file `white`/`black` ratchet) and the contrast check reading `globals.css`.
  9. Shell: `data/site.ts`, `SiteNav`, `SiteFooter`, `SiteChrome`; `git mv` routes into `app/(site)/`; root `not-found` + `global-error` inside the shell; Contact contrast fix.
  10. Record the Home mobile LCP + JS baseline for HOME-08.
- **Deleted routes render a 404 in the shell; no redirects.**
- **UI-SPEC (approved 2026-10-10), LOCKED:**
  - **Design system:** no shadcn or preset; Tailwind v4 CSS-first tokens in `app/globals.css`. Dark only: `color-scheme: dark`, `<html class="dark">` during neutralise, no `dark:` once the guard is on.
  - **Type and icons:** display face **Schibsted Grotesk**, **Inter** body, **JetBrains Mono** for data only, with tabular figures. Icons are **`@phosphor-icons/react` 2.1.10 imported only from `/dist/ssr`**.
  - **Tokens v2:** the L1/L2/L3 values, contrast pairs and v1→v2 alias map exactly as specified; v1 `amber` is renamed `caution` (no alias).
  - **Motion tokens:** the table as specified; existing `DURATION` / `EASING` values are kept.
  - **Shell:** contract, copy and landmarks as specified. Identity: `name: 'Tim Lui'`, `role: 'Developer & photographer'`, `links.github: 'https://github.com/tlex-web'`.
- **BLOCKING INPUT:** `site.email` and `site.links.linkedin` are deferred by Tim and gate **step 9 only**. Never invent them. Type them as required `string`.
- **Contact:** restyle only. `FeedbackForm` data path, `/api/feedback`, CSRF, rate limit, labels, button text and error strings are unchanged.
- **Test discipline:** tests are rewritten, never deleted (GUARD-03), in the same commit as the change.

### Claude's Discretion (UI-SPEC "Defaults to Confirm at Plan Review" + mechanics left open)
- The UI-SPEC defaults #1–#6: Phosphor weight `regular`, nav labels, sticky solid nav, same-tab footer links, glacier accent, 40 px display size.
- The guard implementation details: file layout, ratchet file format, CI job structure, baseline-generation mechanics, the HOME-08 measurement harness. These are researched and recommended below.

### Deferred Ideas (OUT OF SCOPE for Phase 7)
- Footer map legend, contour art and swisstopo attribution (SHELL-04, Phase 8).
- "Off the marked trail" 404 content (EDGE-01, Phase 12).
- Network-first service worker (EDGE-02, Phase 12).
- Removing v1 aliases, ratcheting `white`/`black` to 0, deleting `AnimatedGradientMesh`, `Header`, `GlassmorphismNav` and the rest of the dead code (VERIFY-01, Phase 12).
- Hero rebuild (Phase 9), lightbox (Phase 10), hex retirement (Phase 11).
- `--color-*: initial` compile-time backstop: only after the guard reports zero stock usage.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GUARD-01 | `npm ci` locally, in CI and on Vercel; CI on Node 24 | Step 1 table (`vercel.json:4`, 5× `node-version: '20'`, `.node-version` = 20); `engines.node: "24.x"` (Vercel docs); `check-install-parity.mjs` |
| GUARD-02 | Dark and light baselines, every route, Linux production build, SW blocked, `retries: 0` | Pattern 4/5, visual spec skeleton, container workflow, Pitfalls 2–4 |
| GUARD-03 | CI fails if the test count drops | Pattern 1 (Jest `--json` + `playwright --list` unique count; start value 91) |
| GUARD-04 | No `dark:` or stock palette; per-file `white`/`black` ratchet | Pattern 2 (regexes produce the verified counts), step 8 inventory |
| GUARD-05 | Contrast check reads `globals.css`, runs in lint, all pairs AA | Pattern 3 (colorjs.io reproduces the UI-SPEC table) |
| GUARD-06 | jsx-a11y in lint via `eslint-config-next` | Validated `eslint.config.mjs`; Next's own a11y rules only warn, so add `recommended` at error |
| DEPS-03 | motion 14.1, zero diff incl. mid-scroll | Step 4 (20 files; scratch tsc, Jest and build green; single `motion-dom`); Pitfall 3 |
| DEPS-04 | Next 16.4.x + patch, React 19.3, R3F 9.8.1, drei 10.7.9, one commit, zero diff | Step 5 dry run; Pitfalls 6 and 7 (patch not yet released) |
| DEPS-05 | Playwright 1.64 in its own commit after baselining on 1.60 | Step 6; container tag parity; Pitfall 8 |
| DSGN-05 | Same dark design regardless of OS scheme | `visual-light` → dark pathTemplate from 8a; Pitfall 10 |
| DSGN-06 | Tokens v2 with semantic tokens; v1 only as aliases | Tailwind 4.3 probe (inline aliases, `/opacity` via color-mix); contrast-script token classification |
| DSGN-07 | Schibsted / Inter / JetBrains Mono, tabular numerals | `font-data.json` verified; `text-heading` / `text-display` compile verified |
| DSGN-08 | Shared motion tokens, reduced motion | Motion-token parity test; `@theme static` ease vars verified; `duration-(--x)` verified |
| DSGN-09 | Thin visible scrollbar, stable gutter | Pitfalls 4 and 11 (`--hide-scrollbars`), computed-style assertions |
| DSGN-10 | One SVG family, no emoji | Phosphor `dist/ssr` exports + Jest CJS resolution verified; emoji regex caveats (©, ✓) |
| SHELL-01 | One nav, one main, skip link, current-page indicator | Step 9 inventory (6 Header + 7 Footer imports, `#main-content` at `app/page.tsx:29`); `e2e/shell.spec.ts` |
| SHELL-02 | Mobile menu with 44 px targets, closes on route change and Escape | `shell.spec.ts` mobile describe |
| SHELL-03 | Real identity, no placeholders | Forbidden-strings guard scoped to source; required-string types; BLOCKING INPUT gate |
| SHELL-05 | Playground routes removed; 404 in the shell; no links | Step 3 deletion list (only link: `app/photos/page.tsx:23-31`); 404 status assertions |
| SHELL-06 | Contact heading and fields AA for all visitors | `@axe-core/playwright` 4.13.0 `color-contrast` under both schemes |
</phase_requirements>

## Summary

Phase 7 is mostly **plumbing that must land in a strict order**, and the order is where the risk sits. The milestone research and the approved UI-SPEC already settle the design. This document adds what a planner needs to size and sequence the work:

- the exact repo inventory (files, counts, test numbers)
- upgrade compatibility verified against the real lockfile
- the mechanics of each guard
- the hazards that would break the "every commit passes a zero-diff baseline run" rule

Verified this session:
- **Upgrade chain.** In a scratch install of the lockfile, swapping `framer-motion` for `motion@14.1.0` (`motion/react` imports), then `next@16.4.0` + `react@19.3.0` + `@react-three/fiber@9.8.1` + `@react-three/drei@10.7.9` + `@types/react*@19.3.0` + `eslint-config-next@16.4.0`, then `@playwright/test@1.64.0`, resolved with no peer conflicts. `npm ls --depth=0` exits 0 and there is a single `motion-dom@14.1.0`. The repo source then passed `tsc --noEmit` (TypeScript 6.0.3), all **66/66 Jest tests**, and `next build`.
- **Security patch timing.** The **Next.js security release is not out yet.** `16.4.0` (2026-10-06) is `latest`, and the out-of-band patch is announced for **Wednesday 2026-10-14**. Plan step 5 on `16.4.0` and gate a follow-up patch bump.
- **Lint wiring is not free.** Wiring `eslint-config-next` brings `eslint-plugin-react-hooks` 7.x, whose React-Compiler rules are **errors**. Its jsx-a11y rules are only 6 rules at **warn**, so they would never fail CI. A dry run on today's code gives **49 errors with the 16.2.6 config and 58 with the 16.4.0 config**, or 58 and 67 once jsx-a11y `recommended` is added. Step 1 needs a validated config (below) that gates a11y at error level and confines the compiler rules to legacy files that later phases replace.

**Primary recommendation:**
- Execute the locked 10-step order exactly.
- Generate **and** compare visual baselines only inside the `mcr.microsoft.com/playwright:v<lockfile-version>-noble` container in CI, using a `workflow_dispatch` "update baselines" job that uploads PNGs for review.
- Make `visual-light` assert against the `visual-dark` PNG files from the dark-neutralise commit onward, which proves DSGN-05 with no extra script.
- Build every guard as a dependency-free Node script with a self-test, so each one can be shown to fail.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Install parity (`npm ci`, Node 24) | CI / Build (GitHub Actions, Vercel build) | Repo config (`vercel.json`, `package.json#engines`, `.node-version`) | Enforced where installs happen; the config files are the source of truth |
| Visual baselines | CI (Linux Playwright container) | Frontend server (production `next start`) | Pixels must come from one OS, font stack and Chromium build, against production HTML |
| Test-count / palette / contrast / forbidden-string guards | CI lint job (Node scripts) | Repo files (`app/globals.css`, ratchet JSON) | Static analysis of committed files, with no build needed |
| jsx-a11y | CI lint (ESLint flat config) | — | Static JSX analysis |
| Tokens v2, scrollbar, type stack | Browser / Client (CSS in `app/globals.css`) | Frontend server (`next/font` self-hosting) | CSS custom properties + Tailwind v4 utilities; fonts are build-time downloads served same-origin |
| Motion tokens + `MotionConfig` | Browser / Client | — | Runtime animation config; CSS and JS parity is checked by a Jest test |
| `SiteChrome` / `SiteFooter` / `SkipLink` | Frontend server (RSC) | — | Static identity data from `data/site.ts`; no client JS |
| `SiteNav` (current page, mobile menu) | Browser / Client (`'use client'`) | Frontend server (SSR of initial HTML) | Needs `usePathname` and menu state |
| 404 / error / global-error | Frontend server (`not-found`) / Browser (`error`, `global-error` are client error boundaries) | — | Next.js file conventions |
| HOME-08 perf baseline | CI / tooling (Playwright measuring a production build) | — | Lab measurement, reproducible in a container |

## Standard Stack

### Core (versions verified against the npm registry on 2026-10-10)

| Library | Current lockfile | Target | Purpose | Verified |
|---------|-----------------|--------|---------|----------|
| `next` | 16.2.6 | **16.4.0** now, then the 2026-10-14 patch | Framework | `npm view next dist-tags` gives `latest: 16.4.0`, published 2026-10-06T18:35Z; no 16.4.1 yet [VERIFIED: npm registry] |
| `react` / `react-dom` | 19.2.6 | **19.3.0** | Runtime | Published 2026-09-09 [VERIFIED: npm registry] |
| `@types/react` / `@types/react-dom` | 19.2.14 / 19.2.3 | **19.3.0** | Types | [VERIFIED: npm registry] |
| `motion` (replaces `framer-motion`) | `framer-motion` 12.39.0 | **14.1.0** (exact) | Animation | deps `{"tslib":"^2.4.0","framer-motion":"14.1.0"}`, peer `react ^18 \|\| ^19`; scratch tree has one `motion-dom@14.1.0` [VERIFIED: npm registry + scratch `npm ls`] |
| `@react-three/fiber` | 9.6.1 | **9.8.1** | R3F | peer `"react": ">=19 <19.4"` [VERIFIED: npm registry] |
| `@react-three/drei` | 10.7.7 | **10.7.9** | R3F helpers | peer `react ^19`, `@react-three/fiber ^9.0.0` [VERIFIED: npm registry] |
| `@playwright/test` | 1.60.0 | **1.64.0** (step 6) | E2E + visual | Published 2026-10-07; Chromium 156.0.8078.4 [VERIFIED: npm registry; CITED: playwright.dev/docs/release-notes] |
| `eslint-config-next` | 16.2.6 | 16.2.6 in step 1, **16.4.0** in step 5 | Lint presets (react, react-hooks, jsx-a11y, import, @next) | deps include `eslint-plugin-jsx-a11y ^6.10.0`, `eslint-plugin-react-hooks ^7.1.0` (resolved 7.1.1) [VERIFIED: npm registry + scratch install] |
| `eslint` | 9.39.4 | keep | Lint | Lockfile 9.39.4; **local node_modules has 10.0.3**, which crashes `@typescript-eslint/utils` ("Class extends value undefined") [VERIFIED: local run] |
| `typescript` | 6.0.3 | keep | Types | Local node_modules has 5.9.3 (stale) [VERIFIED: local inspection] |
| `tailwindcss` / `@tailwindcss/postcss` | 4.3.0 | keep | CSS | [VERIFIED: lockfile] |
| `jest` / `jest-environment-jsdom` | 30.4.2 / 30.4.1 | keep | Unit tests | [VERIFIED: lockfile] |

### Supporting (new in Phase 7)

| Library | Version | Purpose | When |
|---------|---------|---------|------|
| `@phosphor-icons/react` | 2.1.10 (LOCKED by UI-SPEC) | One SVG icon family | Step 7e |
| `colorjs.io` | 0.7.1 (devDep) | OKLCH → sRGB → WCAG contrast in the contrast guard | Step 8 (guard enable). ESM-only (`"type":"module"`), so use it from `.mjs` scripts and never from Jest [VERIFIED: npm pack + scratch run] |
| `@axe-core/playwright` | 4.13.0 (devDep) | SHELL-06 verification: axe `color-contrast` on `/contact` under both schemes | Step 9 [VERIFIED: npm registry; peer `playwright-core >= 1.0.0`] |
| `eslint-plugin-jsx-a11y` | 6.10.2 (already transitive) | `flatConfigs.recommended` rules at error level | Step 1. Import it in `eslint.config.mjs`; add it as a direct devDep so the import doesn't rely on hoisting |
| `eslint-config-prettier` | 10.1.8 (present) | `eslint-config-prettier/flat` export exists | Step 1 [VERIFIED: package exports] |

**Removed:** `framer-motion` (step 4) and `wcag-contrast` (step 8, together with `scripts/verify-contrast.mjs` and its `postbuild` hook). The direct devDeps `@eslint/compat`, `@eslint/eslintrc`, `@eslint/js` and `@typescript-eslint/*` become unused once the flat config is replaced. Remove them in step 1 or leave them; the planner decides.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Grep-script palette guard (locked: SUMMARY resolution e) | `eslint-plugin-better-tailwindcss` | Rejected at milestone level: it misses object maps, data files and tests, and has no ratchet |
| Playwright-container baselines generated in CI | Local Docker Desktop | Docker CLI 29.8.2 is installed but **the daemon is not running**, and a bind mount would clobber the Windows `node_modules`. Use CI as the primary path |
| Playwright LCP / JS-bytes harness for HOME-08 | Lighthouse CI (`@lhci/cli`) | LHCI adds a heavy dependency. Playwright is already installed and runs in the same container. `next build` no longer prints First Load JS (verified: the Next 16.4 build output in scratch shows only route types) |

**Installation, one command block per commit:**
```bash
# Step 1 (local only, no package.json change): resync the stale install
npm ci
# Step 1 (direct devDep for the a11y import)
npm install -D eslint-plugin-jsx-a11y@6.10.2
# Step 4
npm uninstall framer-motion && npm install --save-exact motion@14.1.0
# Step 5
npm install next@16.4.0 react@19.3.0 react-dom@19.3.0 @react-three/fiber@9.8.1 @react-three/drei@10.7.9
npm install -D @types/react@19.3.0 @types/react-dom@19.3.0 eslint-config-next@16.4.0
# Step 5b (after 2026-10-14; exact versions come from the advisory)
npm install next@<patched> [react@<patched> react-dom@<patched>] && npm install -D eslint-config-next@<patched>
# Step 6 (also bump the container tag in every workflow to v1.64.0-noble in the same commit)
npm install -D @playwright/test@1.64.0
# Step 7e
npm install @phosphor-icons/react@2.1.10
# Step 8
npm install -D colorjs.io@0.7.1 && npm uninstall wcag-contrast
# Step 9
npm install -D @axe-core/playwright@4.13.0
```

## Package Legitimacy Audit

Run with `gsd-tools query package-legitimacy check --ecosystem npm …` on 2026-10-10. No package has a `postinstall` script (`npm view <pkg> scripts.postinstall` was empty for motion, @phosphor-icons/react, colorjs.io and @axe-core/playwright).

| Package | Registry | Published (target version) | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|------|-----------|-------------|---------|-------------|
| motion@14.1.0 | npm | 2026-10-09 (1 day old) | 24.4M | github.com/motiondivision/motion | [SUS: too-new] | Flagged: checkpoint before install. Version LOCKED by ROADMAP |
| next@16.4.0 | npm | 2026-10-06 | 66.2M | github.com/vercel/next.js | [SUS: too-new] | Flagged: checkpoint |
| eslint-config-next@16.4.0 | npm | 2026-10-06 | 36.4M | github.com/vercel/next.js | [SUS: too-new] | Flagged: checkpoint |
| @playwright/test@1.64.0 | npm | 2026-10-07 | 74.2M | github.com/microsoft/playwright | [SUS: too-new] | Flagged: checkpoint |
| @react-three/fiber@9.8.1 | npm | 2026-09-24 | 6.0M | github.com/pmndrs/react-three-fiber | [SUS: too-new] | Flagged: checkpoint |
| @react-three/drei@10.7.9 | npm | 2026-09-25 | 4.2M | github.com/pmndrs/drei | [SUS: too-new] | Flagged: checkpoint |
| react / react-dom@19.3.0 | npm | 2026-09-09 | 186M / 175M | github.com/react/react | [OK] | Approved |
| @types/react / @types/react-dom@19.3.0 | npm | 2026-09-09 | 170M / 146M | DefinitelyTyped | [OK] | Approved |
| @phosphor-icons/react@2.1.10 | npm | 2025-05-22 | 5.1M | github.com/phosphor-icons/react | [OK] | Approved |
| colorjs.io@0.7.1 | npm | 2026-07-24 | 9.3M | github.com/color-js/color.js | [OK] | Approved |
| @axe-core/playwright@4.13.0 | npm | 2026-08-11 | 13.7M | github.com/dequelabs/axe-core-npm | [OK] | Approved |
| eslint-plugin-jsx-a11y@6.10.2 | npm | 2024-10-26 | 50.1M | github.com/jsx-eslint/eslint-plugin-jsx-a11y | [OK] | Approved |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** motion, next, eslint-config-next, @playwright/test, @react-three/fiber, @react-three/drei. Every flag is **only** the recency heuristic ("too-new"). Each is the canonical package with millions of weekly downloads, and each version is the one the locked ROADMAP names. The planner still inserts a lightweight `checkpoint:human-verify` before steps 4, 5 and 6 (for example, confirm the registry tarball `dist.integrity` matches the lockfile entry and skim the release notes).

## Current Repo State vs Target (per build step)

All counts are from scripts run this session against the working tree (`HEAD 5756fe7`).

### Baseline facts
- **Tests:** Jest **66 tests in 7 suites**, all passing (`npx jest --json`). Playwright has **25 distinct tests in 4 spec files** (`contact-form` 7, `homepage` 5, `photos` 6, `projects` 7). CI runs them ×2 projects (chromium, firefox), locally ×3. There are no `.skip`, `.only` or `.fixme` calls. **Ratchet start value: 91** (66 + 25). [VERIFIED: local jest run + `playwright test --list`]
- **Local install drift** (`npm ls --depth=0` exits 1). next 16.1.6 vs 16.2.6, react 19.2.4 vs 19.2.6, framer-motion 12.35.1 vs 12.39.0, R3F 9.5.0 vs 9.6.1, three 0.183.2 vs 0.184.0, Playwright 1.58.2 vs 1.60.0, **eslint 10.0.3 vs 9.39.4**, **typescript 5.9.3 vs 6.0.3**, tailwindcss 4.2.1 vs 4.3.0, jest 30.2.0 vs 30.4.2. [VERIFIED: local node_modules vs package-lock.json]
- **Node:** local v24.21.0, npm 11.6.1. `.node-version` contains `20` [VERIFIED: .node-version:1]. Lockfile v3. There is no `engines` field in `package.json`.

### Step 1: install parity + lint + ratchet (GUARD-01, -03, -06)

| Item | Today | Target |
|------|-------|--------|
| `vercel.json` | `"installCommand": "npm install"` [VERIFIED: vercel.json:4] | `"npm ci"` |
| CI Node | `node-version: '20'` in **5 jobs** (lint, unit, e2e, build, security-audit) [VERIFIED: .github/workflows/ci.yml:23 and grep] | `node-version-file: .node-version` with `.node-version` = `24`. Vercel reads `engines.node`, not `.node-version` [CITED: vercel.com/docs/functions/runtimes/node-js/node-js-versions]; add `"engines": { "node": "24.x" }`. Vercel deprecated Node 20 on 2026-10-01 [CITED: same page's related changelog] |
| CI install | `npm ci` in all jobs except `security-audit`, which runs `npm audit` with no install | Keep. Add a `npm ls --depth=0` preflight step |
| `eslint.config.mjs` | FlatCompat + `prettier` only; imports `eslint-plugin-react`, `eslint-plugin-react-hooks` and `globals`, none of which are direct deps; **no jsx-a11y, no Next rules** | Replace with the validated config in Code Examples (`eslint-config-next/core-web-vitals` + `/typescript` + jsx-a11y `recommended` at error + legacy compiler-rule downgrade + `prettier/flat` + `globalIgnores`) |
| `eslint .` local scope | Would also lint `.claude/skills/**/*.cjs` (untracked) | Add `.claude/**`, `graphify-out/**`, `.planning/**`, `project_concept/**`, `public/**` to `globalIgnores` |
| Lint errors after wiring (validated config, eslint-config-next 16.4.0 in scratch) | — | **25 remaining errors**, see the table below |
| Test ratchet | none | `scripts/guards/test-count.mjs` + `scripts/guards/test-count.baseline.json` (`{ "jest": 66, "e2e": 25, "total": 91 }`) |
| Unit CI | `npm test -- --coverage --passWithNoTests` | Drop `--passWithNoTests`; add `--json --outputFile=jest-results.json`, then run the ratchet |

**Residual lint errors with the recommended config:** dry run with eslint-config-next 16.4.0 and react-hooks 7.1.1 [VERIFIED: scratch ESLint run].

| File | Errors | Fix in step 1 (pixel-neutral) |
|------|--------|-----------------------------|
| `app/page.tsx` (5), `app/roadmap/page.tsx` (3), `app/contact/page.tsx` (3), `components/FeedbackForm.tsx` (1) | `react/no-unescaped-entities` | `'` → `&apos;` / `{"'"}`. Renders identically |
| `app/error.tsx:32` | `@next/next/no-html-link-for-pages` | `<a href="/">` → `<Link href="/">`. Same DOM `<a>` |
| `components/ImageDetailModal.tsx:44,51` (4) | jsx-a11y click/static-interaction on backdrop | Justified `// eslint-disable-next-line … -- Escape handled on document; replaced by Phase 10 lightbox` (code changes here would alter behaviour before baselines exist) |
| `components/GlassmorphismNav.tsx:194` (2) | jsx-a11y click/static-interaction | Same justified disable (component deleted in step 9) |
| `components/__tests__/GalleryGrid.test.tsx:11` | `jsx-a11y/alt-text` on a mock `<img>` | add `alt=""` |
| `jest.config.js:1` | `@typescript-eslint/no-require-imports` | file-scoped override for `*.config.js` / `*.cjs` |
| `app/gradient-mesh/page.tsx`, `components/TransitionShowcase.tsx`, `components/TerminalDemo.tsx` (5) | label / unescaped | Files are deleted in step 3. Either disable for one commit, or add them to `globalIgnores` in step 1 and remove the entries in step 3 |

**React-Compiler rule errors confined to legacy files** (downgraded to `warn` by a file-scoped override): `DualParticleSystem.tsx` (24 purity), `HologramTerminal.tsx` (3), `MountainTerrain3D.tsx` (3), `GeologicalButton.tsx` (2, new in 7.1.1), `AnimatedGradientMesh.tsx` (immutability), `GlassmorphismNav.tsx` (set-state-in-effect), `HologramTerminalDemo.tsx` (set-state-in-effect, new in 7.1.1), `ShaderTransition.tsx`, `TerminalDemo.tsx`, `lib/useProgressiveTextures.ts` (refs ×3, new in 7.1.1). Every one of them is deleted or replaced in Phases 9–12, so the override list shrinks to zero by Phase 12.

### Step 2: baselines (GUARD-02)

| Item | Today | Target |
|------|-------|--------|
| Playwright config | One `use` block, projects `chromium` and `firefox` (+`webkit` locally), `retries: process.env.CI ? 2 : 0`, prod server **only in CI**, dev server locally with `reuseExistingServer` [VERIFIED: playwright.config.ts:10,44-51] | Add `visual-dark` and `visual-light` projects (Chromium, `retries: 0`, `serviceWorkers: 'block'`), `testIgnore` visual in functional projects, prod server when `CI` or `PW_PROD` is set |
| Visual specs | none | `e2e/visual/routes.spec.ts` + `e2e/visual/hide-canvas.css` |
| Routes to baseline | — | `/`, `/photos`, `/projects`, `/projects/clix-cli`, `/projects/clix-website` (the only two slugs in `data/projects.ts`), `/roadmap`, `/contact`, `/offline`, one unmatched URL (404). **Do not baseline** `/gradient-mesh`, `/particle-buttons` or `/transitions`: they are deleted in the next commit |
| Viewports | — | 375, 768, 1440 (UI-SPEC) |
| Shots | — | Full page under `reducedMotion: 'reduce'` per route × width; Home viewport shots at hero scroll 0/50/100 % under **`reducedMotion: 'no-preference'`** (see Pitfall 3) |
| Snapshot count (estimate) | 0 | 9 routes × 3 widths × 2 schemes = 54, plus 3 scroll positions × 3 widths × 2 schemes = 18, so **≈72 PNGs** |
| Baseline environment | — | `mcr.microsoft.com/playwright:v1.60.0-noble` (tag exists [VERIFIED: MCR tag list]) in GitHub Actions, via a `workflow_dispatch` job |

Canvases on baselined pages (all random or WebGL, so they must be hidden):
- `MountainTerrain3D` and `DualParticleSystem` (Home hero)
- `PhotoCarousel3D` (/photos, dynamic)
- `HologramTerminal` (project detail)
- `AnimatedGradientMesh` (/contact, **`absolute inset-0 -z-10` full-bleed**)

`DualParticleSystem` is also `absolute inset-0` over the hero [VERIFIED: components/AnimatedGradientMesh.tsx, DualParticleSystem.tsx]. Mask boxes would cover the page content on both, so hide canvases with `stylePath` instead (Pitfall 2).

### Step 3: delete the playground (SHELL-05)

| Delete | Why |
|--------|-----|
| `app/gradient-mesh/`, `app/particle-buttons/`, `app/transitions/` | Locked |
| `components/ParticleButton.tsx`, `TransitionShowcase.tsx`, `ShaderTransition.tsx` | Only consumers are the playground routes [VERIFIED: import scan] |
| `components/Hero3DSection.tsx`, `ProgressiveImage.tsx`, `TerminalDemo.tsx`, `ZoomableImage.tsx` | Zero importers today [VERIFIED: import scan, including `dynamic()`] |
| **Keep** `AnimatedGradientMesh.tsx` | Still used by `app/contact/page.tsx` |
| Edit `app/photos/page.tsx:21-32` | The "View Shader Transitions" `<Link href="/transitions">` block [VERIFIED: app/photos/page.tsx:23-31]. **This is a visible change on /photos, so step 3 re-baselines the 6 `/photos` snapshots on purpose** |
| `README.md:170-172` | Mentions the deleted folders (docs only) |

`InteractiveHotspot` stays (it is used by `ImageDetailModal`). After step 3 the 404 is still the v1 `app/not-found.tsx`. The shell's 404 arrives in step 9.

Effect on later steps: framer-motion import files drop from **24 to 20**; `dark:` from 376 occurrences in 23 files to **228 in 18 files**; stock palette classes from 938 in 30 files to **629 in 23 files**; `white`/`black` utilities from 282 in 32 files to **152 in 25 files**; emoji from 105 to **66 in 11 files** [VERIFIED: audit script, regexes from UI-SPEC § Guardrail Constraints].

### Step 4: framer-motion → motion (DEPS-03)

There are 20 files to edit after step 3: `app/page.tsx`, `app/contact/page.tsx`, `app/roadmap/page.tsx`, `components/{FeatureShowcase, Footer, GeologicalButton, GlassmorphismNav, Header, Hero3DMountain, HologramTerminalDemo, ImageDetailModal, InteractiveHotspot, MountainTerrain3D, ProjectCard, ProjectHighlights, RoadmapFilters, RoadmapProgress, RoadmapTimeline, TechStackDisplay}.tsx`, and `lib/useGlowIntensity.ts`.

Swap `from 'framer-motion'` for `from 'motion/react'` mechanically. Scratch result after the swap: `tsc` passes, 66/66 Jest tests pass, `next build` succeeds [VERIFIED: scratch run]. `useScroll` consumers: `Hero3DMountain` (element target, `offset: ['start start','end start']`), `MountainTerrain3D`, `GlassmorphismNav` (`scrollY`) and `lib/useGlowIntensity.ts`. These are the code paths the motion 13.4.4–13.5 changelog touched.

### Step 5: platform bump (DEPS-04)

The scratch dry run resolved cleanly (`added 28, removed 1, changed 21`). There are no React-peer conflicts among `@react-spring/three`, `@vercel/analytics`, `@vercel/speed-insights`, `react-markdown`, `@testing-library/react`, `its-fine`, `zustand` or `use-sync-external-store` [VERIFIED: npm view peers]. **In the same atomic commit, `eslint-config-next@16.4.0` pulls `react-hooks@7.1.1`, which adds 9 new errors** in `GeologicalButton` (purity ×2), `HologramTerminalDemo` and `TerminalDemo` (set-state-in-effect), `AnimatedGradientMesh` and `ShaderTransition` (immutability), and `lib/useProgressiveTextures.ts` (refs ×3) [VERIFIED: diff of two scratch lint runs]. With the legacy list in the recommended config these are already warnings, so lint stays green.

### Step 6: Playwright 1.64 (DEPS-05)
- Bump `@playwright/test` **and** every workflow `container.image` tag in the same commit. A version mismatch means Playwright cannot find its browsers [CITED: playwright.dev/docs/docker].
- Chromium moves from the 1.60 build to 156.0.8078.4 [CITED: release notes], so a font-rasterisation diff is plausible. Re-baseline only if the zero-diff run fails, and record the reason in that commit.

### Step 7: tokens v2, type, motion tokens, scrollbar, icons (DSGN-06 to DSGN-10)

- **Today:**
  - The `globals.css` `@theme` block (non-inline) defines `--color-alpine-*`, `granite`, `snow`, `frost`, `ember`, `pine`, `rust` and **`--color-amber-600/500/400`** (globals.css:52-54).
  - The base `h1` uses `--font-heading` (= JetBrains Mono) at 700 with `text-shadow: var(--text-shadow-glow-lg)` (globals.css:69-76).
  - Global scrollbar hiding sits at globals.css:109-118.
  - `lib/animations.ts` has `EASING` {geological, crystallize, tectonic, erosion} and `DURATION` {hover 0.35, enter 0.45, settle 0.5, fracture 0.3} (lib/animations.ts:12-33).
  - There is no `MotionConfig` anywhere.

  [VERIFIED: Read of those files]
- **Tailwind 4.3 behaviour** confirmed by compiling a probe with the lockfile's `@tailwindcss/postcss` [VERIFIED: scratch compile]:
  - `@theme inline { --color-surface: var(--night-950) }` gives `.bg-surface { background-color: var(--night-950) }`.
  - A v1 alias `--color-frost-500: var(--glacier-400)` keeps `/20` modifiers working: `.bg-frost-500/20` gives `color-mix(in oklab, var(--glacier-400) 20%, transparent)` with an opaque `@supports` fallback.
  - `--text-heading` with `--text-heading--line-height` and `--text-heading--letter-spacing` gives a `.text-heading` that sets all three.
  - `@theme static` always emits `--ease-geological` and `--ease-descent`.
  - `duration-(--duration-fast)` gives `transition-duration: var(--duration-fast)`.
  - `@utility scrollbar-none` works.
- **`next/font` Schibsted Grotesk:** present in Next 16.4's `font-data.json` (weights 400–900 + variable, `wght 400–900`, subsets latin and latin-ext) [VERIFIED: scratch next@16.4.0].
- **Phosphor:** the `@phosphor-icons/react/dist/ssr` export maps `import` → `./dist/ssr/index.es.js` and `require` → `./dist/index.cjs.js`, so **Jest (CJS) resolves it** with no `transformIgnorePatterns` change. All 25 icons spot-checked from the UI-SPEC list exist as `dist/ssr/<Name>.es.js` [VERIFIED: npm pack of 2.1.10].
- **Emoji sweep scope after step 3:** `app/page.tsx` (📸 💻 🚀 + ✓), `FeatureShowcase` (19), `ProjectHighlights` (7 + ✓), `RoadmapFilters` (8), `RoadmapProgress` (7), `RoadmapTimeline` (9), `PhotoCarousel3D` (1), `Footer` (❤️), `lib/email.ts` (✨). Tests: `RoadmapFilters.test` asserts emoji at :136-140 and `bg-cyan-600` / `bg-blue-600` at :94 and :108 [VERIFIED: Read of components/__tests__/RoadmapFilters.test.tsx:93-140]. `RoadmapTimeline.test` asserts emoji at :100-107.

### Step 8: staged `dark:` removal + guards (DSGN-05, GUARD-04, GUARD-05)

`dark:` occurrences per file after step 3:

| File | `dark:` |
|------|---------|
| RoadmapTimeline | 27 |
| contact/page | 24 |
| ImageDetailModal | 21 |
| FeedbackForm | 18 |
| RoadmapProgress | 17 |
| offline/page | 16 |
| roadmap/page | 15 |
| projects/[slug]/page | 15 |
| GalleryGrid | 14 |
| InteractiveHotspot | 14 |
| TechStackDisplay | 11 |
| FeatureShowcase | 8 |
| ProjectHighlights | 8 |
| RoadmapFilters | 8 |
| error | 4 |
| not-found | 3 |
| ProjectDetailClient | 3 |
| photos/page | 2 |

The total is 228 in 18 files. The heaviest stock-palette files after step 3 are TechStackDisplay 71, RoadmapTimeline 61, FeatureShowcase 55, RoadmapProgress 42, FeedbackForm 41, HologramTerminalDemo 41, projects/[slug] 38, roadmap/page 37, contact 35, ImageDetailModal 33 and InteractiveHotspot 33. No `prefers-color-scheme` usage exists in CSS or JS, so the neutralise step is the only switch [VERIFIED: grep].

### Step 9: shell (SHELL-01, -02, -03, -06)

- **Per-page shells:**
  - `Header` is imported by 6 surviving pages: contact, offline, photos, projects, projects/[slug] and roadmap.
  - `Footer` is imported by 7: the same six plus `app/page.tsx`.
  - Home gets its nav from `GlassmorphismNav` inside `Hero3DMountain`.
  - `id="main-content"` sits at `app/page.tsx:29`. The hero CTAs `href="#main-content"` are at `Hero3DMountain.tsx:99,164`.
  - `body.style.overflow = 'hidden'` locks exist at `ImageDetailModal.tsx:32` and `GlassmorphismNav.tsx:73`.

  [VERIFIED: grep]
- **`git mv` set:**
  - `app/page.tsx`, `app/error.tsx`, `app/photos/`, `app/projects/` (incl. `[slug]`), `app/roadmap/` and `app/contact/` move to `app/(site)/`.
  - `app/offline/` moves too: the offline page is a content route and the UI-SPEC landmark loop includes `/offline`.
  - These stay at the root: `app/layout.tsx`, `app/globals.css`, `app/not-found.tsx` (rewritten to render `SiteChrome`), the new `app/global-error.tsx` and `app/api/`.
- **Next 16.4 error props:** `retry` is the documented recovery prop and has been stable since v16.3.0. `reset()` still exists but "in most cases, you should use `retry()`". `global-error` "must define its own `<html>` and `<body>`… global styles, fonts" and does **not** receive the app's global styles [CITED: nextjs.org/docs/app/api-reference/file-conventions/error, v16.4.0]. The UI-SPEC says "Try again (`reset()`)". Wire **Try again → `retry()`**, unless the planner confirms `reset` on purpose. Rewrite the global-error backstop test to match.
- **Contract test rewrites in the same commit:**
  - `e2e/homepage.spec.ts` has `toHaveTitle(/Portfolio/i)`, `.first()` link names `/Home/`, `/Photos/` and `/Projects/`, and a `#main-content` visibility check.
  - `contact-form.spec` stays unchanged. It uses `john@example.com`, so the forbidden-string list must stay exact-string and scoped to source, not tests or CI env.

## Architecture Patterns

### Guardrail system diagram

```
 developer commit
      │
      ▼
 GitHub Actions (Node 24 via .node-version, npm ci, npm ls --depth=0 preflight)
      │
      ├─► lint job ──► eslint . (next core-web-vitals + jsx-a11y recommended=error)
      │                 └─► guard:palette  (dark:/stock regex over app components lib data e2e __tests__ + css @apply,
      │                 │                    white/black per-file ratchet JSON, emoji + forbidden-strings, phosphor import path)
      │                 └─► guard:contrast (parse app/globals.css :root + @theme inline → colorjs.io → pair table)  [step 8+]
      │                 └─► tsc --noEmit
      │
      ├─► unit job ───► jest --json ──► guard:test-count (jest total + playwright --list unique tests ≥ baseline.total)
      │
      ├─► e2e job ────► next build && next start ──► playwright chromium+firefox (functional, retries 2)
      │
      ├─► visual job ─► container mcr.microsoft.com/playwright:v<lockfile>-noble
      │                  └─► next build && next start ──► projects visual-dark + visual-light (retries 0, SW blocked)
      │                        └─► compare to e2e/visual/**-snapshots/*-linux.png ── any diff ⇒ FAIL
      │
      └─► build job ──► next build (Vercel parity)

 workflow_dispatch "update-visual-baselines" (same container) ──► --update-snapshots=changed ──► upload artifact
      └─► developer downloads, reviews PNG diffs, commits them with the reason (intentional re-baseline)

 Vercel: installCommand "npm ci", engines.node 24.x  ──► production
```

### Recommended structure (new files)
```
scripts/guards/
├── test-count.mjs              # GUARD-03
├── test-count.baseline.json    # { jest, e2e, total, recordedAt }
├── check-palette.mjs           # GUARD-04 + DSGN-10 emoji + SHELL-03 forbidden strings + phosphor path
├── palette-ratchet.json        # per-file white/black counts (only decreases)
├── check-contrast.mjs          # GUARD-05 (replaces scripts/verify-contrast.mjs)
├── check-install-parity.mjs    # GUARD-01 (vercel.json, workflows, .node-version, container tag == lockfile Playwright)
└── __selftest__/               # fixtures proving each guard fails on bad input
e2e/visual/
├── routes.spec.ts              # GUARD-02 baselines
├── hide-canvas.css             # stylePath: canvas { visibility: hidden !important }
└── routes.spec.ts-snapshots/   # *-visual-dark-linux.png (+ *-visual-light-linux.png until step 8a)
e2e/shell.spec.ts               # SHELL-01/02/05 route loop, mobile menu, 404 status
e2e/design-system.spec.ts       # DSGN-07/09 computed styles, scroll-lock nav box
e2e/a11y-contact.spec.ts        # SHELL-06 axe color-contrast, both schemes
e2e/perf/home-baseline.spec.ts  # step 10 (HOME-08 baseline; run on demand, not in the default projects)
lib/__tests__/motion-tokens.test.ts     # DSGN-08 parity
components/__tests__/global-error.test.tsx   # UI-SPEC E7 backstop
.github/workflows/visual-baselines.yml       # workflow_dispatch baseline generator
```

### Pattern 1: Test-count ratchet (GUARD-03)
**What:** count tests with the tools' own listings, never a regex. A regex undercounts loop-generated tests such as the visual route matrix.
- **Jest:** `numTotalTests` from `jest --json` (the unit job already runs Jest).
- **Playwright:** `playwright test --list --reporter=json`. It loads the config and specs without starting browsers or the `webServer` [VERIFIED: scratch run, exit 0]. Count **unique `file + titlePath`**, because the JSON repeats every spec once per project: 50 entries for 2 projects collapse to 25 [VERIFIED].
- **Fail conditions:** `jest.total + e2e.unique < baseline.total`, any `numPendingTests > 0`, or any `.only` / `.skip` / `.fixme` in a spec file.
- **Baseline updates:** only through `--update`, which refuses to lower the number. Raise it at phase close (GUARD-03 says "previous phase's count").

### Pattern 2: Palette / `dark:` guard with a `white`/`black` ratchet (GUARD-04)
**What:** a raw-text scan, so object maps, template literals, data files, tests and `@apply` are all covered. Regexes (the same ones produced the counts above):
```js
const FAM = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const PRE = 'bg|text|border|ring|outline|from|via|to|fill|stroke|divide|placeholder|decoration|shadow|accent|caret';
const STOCK = new RegExp(`(?<![\\w-])(?:[\\w-]+:)*(?:${PRE})-(?:${FAM})-\\d{2,3}(?:\\/\\d+)?\\b`, 'g');
const DARK  = /(?<![\w-])dark:/g;
const WB    = new RegExp(`(?<![\\w-])(?:[\\w-]+:)*(?:${PRE})-(?:white|black)(?:\\/\\d+)?\\b`, 'g');
```
- **Scan set:** `app/ components/ lib/ data/ e2e/` and every `__tests__/`, with extensions `.ts`, `.tsx`, `.mjs`, `.js` and `.css` (CSS: `@apply` lines plus a ban on `@custom-variant dark` once step 8 completes).
- **Ratchet:** a file with more `WB` hits than `palette-ratchet.json` fails. A file not listed there allows 0. When a count falls below the baseline, fail with "run `npm run guard:palette -- --update`" so the committed file always equals reality and the ratchet only tightens.
- **v1 alias names** (`frost-500`, `alpine-900`, …) are not stock families, so they pass until Phase 12 bans them. This is why `amber` → `caution` (step 7a) must come before the guard is enabled.
- **Emoji (DSGN-10):** `\p{Extended_Pictographic}` also matches `©`, `®` and `™`, and misses `✓` (U+2713) and `❯` [VERIFIED: node check]. Use EP minus an allowlist {`©`, `®`, `™`}, plus an explicit {`✓`, `✗`, `✔`, `✘`}. Allow `❯` (UI-SPEC: typographic). The footer's `©` must pass.
- **Forbidden strings (SHELL-03, PITFALLS 27):** exact-match list from the UI-SPEC, scoped to `app components lib data package.json`.
- **Phosphor path:** fail on `from '@phosphor-icons/react'` or `'@phosphor-icons/react/dist/csr…'`; only `/dist/ssr` is allowed.

### Pattern 3: Contrast check that reads `globals.css` (GUARD-05)
**What:**
1. Regex-extract the declarations of `:root { … }` (L1 primitives) and of every `@theme inline { … }` and `@theme { … }` block. These blocks contain no nested braces.
2. Resolve `var(--x)` chains.
3. Build `new Color(value)` and compute `fg.contrast(bg, 'WCAG21')`.

Verified this session: colorjs.io 0.7.1 reproduces the UI-SPEC table to two decimals (16.03, 15.02, 13.79, 16.87, 8.92, 7.67, 11.29, 6.18, 10.00, 9.28, 13.61/13.62, 4.85, 4.17, 1.63). `danger`/raised measured 6.74 against the spec's 6.73, so compare raw floats, not rounded strings. All primitives are in the sRGB gamut [VERIFIED: scratch colorjs.io run]. The pair table and the "unknown token fails" and "missing pair fails" rules come from the UI-SPEC. v1 alias names must be classified as `alias` (skipped). `--color-contour` and `--color-line` are `decorative` (exempt). Wire it into `npm run lint` and remove the `postbuild` call to `verify-contrast.mjs`.

### Pattern 4: Visual projects and light==dark proof (GUARD-02, DSGN-05)
**What:** two Chromium projects that differ only in `colorScheme`. Until step 8a they keep separate PNGs, because light renders the broken `dark:` fallbacks. **From the neutralise commit (8a) on, point `visual-light` at the dark files.** The light run then *asserts* identity, and the light PNGs are deleted in that commit. Playwright resolves `expect.toHaveScreenshot.pathTemplate` per project before `snapshotPathTemplate` and the legacy default `{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{-snapshotSuffix}{ext}` [VERIFIED: playwright 1.64 `workerProcessEntry.js`].

### Pattern 5: Linux baseline flow
- **Generate:** run the `workflow_dispatch` job in `container: mcr.microsoft.com/playwright:v1.60.0-noble` (options `--ipc=host`). It runs `npm ci` (with `setup-node` from `.node-version` inside the container), builds for production, runs `--project=visual-dark --project=visual-light --update-snapshots=changed`, and uploads `e2e/visual/**-snapshots/**`.
- **Review and commit:** Tim downloads the artifact, reviews the diffs and commits. `changed` rewrites only mismatching files [CITED: playwright.dev/docs/test-cli].
- **Compare:** the CI `visual` job uses the identical container, with no `-u`.
- **Version semantics:** under 1.64, `--update-snapshots=missing` now *passes* the run [CITED: release notes]. Never use `missing` or `all` in the compare job.

### Anti-Patterns to Avoid
- **Masking full-bleed canvases** with `mask:` paints an opaque box over the canvas's whole bounding box, which hides the Contact page and hero content. Use `stylePath` CSS `canvas { visibility: hidden !important; }` instead.
- **Taking full-page shots without settling.** All 12 `whileInView` usages are `once: true`, so pre-scroll the page, return to top, wait for `document.fonts.ready`, for every `img.complete`, and for finite animations to finish, then shoot.
- **Running `--update-snapshots` on `visual-light` after step 8a.** It would overwrite the dark files. Update with `--project=visual-dark` only.
- **Fixing React-Compiler violations in step 1.** No baseline exists yet, so any pixel-affecting fix is unguarded. Downgrade them for the legacy files instead.
- **Regex test counting.**
- **Hand-copied hex tables** (the current `verify-contrast.mjs`).
- **Committing `*-win32.png`.** Fail the guard on any non-`-linux` PNG under `e2e/`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OKLCH → sRGB → WCAG ratio | Own matrices | `colorjs.io` `Color#contrast(…, 'WCAG21')` | Gamut and edge cases; verified against the UI-SPEC numbers |
| Counting e2e tests | grep `test(` | `playwright test --list --reporter=json` | Catches loop-generated tests; no browser needed |
| Counting unit tests | grep `it(` | `jest --json` `numTotalTests` / `numPendingTests` | Exact, and includes skipped |
| a11y lint | Custom JSX checks | `eslint-plugin-jsx-a11y` `flatConfigs.recommended` | 31 active rules |
| Page-level contrast | Pixel sampling | `@axe-core/playwright` `withRules(['color-contrast'])` | Standard engine; reports `incomplete` over canvas |
| Icons | Inline emoji/SVG maps | `@phosphor-icons/react/dist/ssr` | Locked family; zero client JS from RSC |
| Linux font/raster parity | Local Windows screenshots | Official Playwright container | Platform-suffixed snapshots; Windows PNGs never compare in CI |
| Focus-trap / disclosure libs for the mobile menu | — | Native `<button aria-expanded>` + `hidden` panel (UI-SPEC disclosure, not dialog) | No library needed |

**Key insight:** every guard is a small, dependency-light script whose value depends on **proving it can fail**. Ship each with a `__selftest__` fixture run in CI (palette fixture with `dark:bg-gray-800`, contrast fixture with a 3:1 text pair, a11y `--stdin` probe `<div onClick={() => {}} />`, ratchet fixture with a lower count).

## Runtime State Inventory

The phase includes a rename (`framer-motion` → `motion`), a route move into `(site)` and an identity swap.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None. No database; `data/*.ts` is code. Upstash Redis rate-limit keys are IP-based and unaffected by routes [VERIFIED: lib/rate-limit.ts exists; no route strings stored] | None |
| Live service config | **Vercel project settings:** the Node.js version selected in the dashboard (Node 20 was deprecated 2026-10-01). `engines.node: "24.x"` overrides it [CITED: Vercel docs]. **GitHub branch protection:** new CI job names (`visual`, guard steps) must be added as required checks by hand, or they won't block merges. **Dependabot** (weekly, Monday 09:00, groups minor and patch, `versioning-strategy: increase`) will open PRs touching next, react, framer-motion and Playwright mid-phase [VERIFIED: .github/dependabot.yml] | Manual: set required checks. Code: add Phase 7 `ignore` entries for `next`, `react*`, `framer-motion`, `motion`, `@react-three/*`, `@playwright/test`, or pause Dependabot until step 6 lands. Note that Dependabot never bumps the Playwright container tag |
| OS-registered state | None. No scheduled tasks or daemons. Visitors' browsers hold a **service worker** precaching `/` and `/offline`, keyed by the build hash injected at `postbuild` | None for Phase 7. The new build hash invalidates the precache; network-first navigation is EDGE-02 (Phase 12) |
| Secrets / env vars | CI env `RESEND_API_KEY`, `FEEDBACK_RECIPIENT_EMAIL: test@example.com`, `FEEDBACK_FROM_EMAIL` in `ci.yml`. No env var names change | The visual workflow needs the same dummy env for `next build`. The forbidden-strings guard must not scan `.github/` |
| Build artifacts | Local `node_modules` stale (eslint 10.0.3, ts 5.9.3, …). Local `.next/` (from March) holds `.next/types` that `tsconfig.json` includes, so after the `(site)` move stale route types can break local `tsc`. `postbuild` rewrites the tracked `public/service-worker.js` in place on every build. The Playwright browser cache must match the package version | Run `npm ci` (step 1); run `rm -rf .next` after `git mv`; run `git checkout public/service-worker.js` after local builds (or ignore it); run `npx playwright install chromium` after step 6 |

## Common Pitfalls (ordering hazards for the 10-step sequence)

### Pitfall 1: Lint wiring lands before any visual net exists
**What goes wrong:** step 1 precedes baselines, so any lint fix that changes rendering is unguarded.
**How to avoid:** in step 1 make only config changes and provably pixel-neutral fixes: entity escapes, `<a>` → `<Link>`, and justified disables. Downgrade the React-Compiler rules for the listed legacy files.
**Warning sign:** a step-1 diff touching `className`, JSX structure or hooks.

### Pitfall 2: Masked canvases blank the page
**What goes wrong:** Contact's `AnimatedGradientMesh` and Home's `DualParticleSystem` are `absolute inset-0`. `mask:` covers their full bounding box with an opaque box, on top of the content.
**How to avoid:** use `stylePath: 'e2e/visual/hide-canvas.css'` with `canvas { visibility: hidden !important; }`. This keeps layout and shows the page ground, which is deterministic.

### Pitfall 3: Reduced-motion shots can't detect the Motion 14 `useScroll` change
**What goes wrong:** under `reduce`, `Hero3DMountain` zeroes `titleY`/`subtitleY` and `GlassmorphismNav` skips its `useMotionValueEvent` path (fixed 0.85/16 values). Those are exactly the paths motion 13.4.4–13.5 changed.
**How to avoid:** take the mid-scroll Home shots with `reducedMotion: 'no-preference'`, viewport-only (not `fullPage`), after `scrollTo` plus two `requestAnimationFrame` ticks, with canvases hidden. Keep the top-of-page full shots under `reduce`.

### Pitfall 4: Headless Chromium hides scrollbars
**What goes wrong:** Playwright launches headless Chromium with `--hide-scrollbars` [VERIFIED: playwright-core coreBundle.js launch args]. The step 7d gutter change may produce **no** baseline diff, and the G3 "nav box unchanged on scroll lock" backstop could pass trivially.
**How to avoid:** assert `getComputedStyle(document.documentElement).scrollbarGutter === 'stable'` and `scrollbarWidth === 'thin'`. Run the G3 check in a project with `launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] }`.
**Note:** that the flag removes the gutter from layout is [ASSUMED]; the assertion design covers both cases.

### Pitfall 5: The step-3 deletion is not zero-diff
**What goes wrong:** removing the `/transitions` link changes `/photos`.
**How to avoid:** re-baseline exactly the six `/photos` PNGs in step 3 and state the reason. Never baseline the three playground routes in step 2.

### Pitfall 6: The step-5 lint regression
**What goes wrong:** `eslint-config-next@16.4.0` → `react-hooks@7.1.1` raises 9 new errors.
**How to avoid:** use a legacy override list that already includes `GeologicalButton`, `HologramTerminalDemo` and `lib/useProgressiveTextures.ts` (the recommended config does), or extend the list in the same commit. Never split the eslint-config-next bump from the Next bump.

### Pitfall 7: Next security patch not shipped yet
**What goes wrong:** DEPS-04 says "including the 2026-10-14 security patch". Today only `16.4.0` exists, and the advisory covers "two Critical and one High" vulnerabilities in **upstream dependencies** [CITED: nextjs.org/blog/upcoming-nextjs-security-update-october-2026].
**How to avoid:** if step 5 executes before the patch exists, land it on `16.4.0` and add **step 5b**: bump `next` (and `eslint-config-next`, and `react` / `react-dom` if the advisory names React packages [ASSUMED possible, since the advisory says "upstream dependencies"]) to the patched version, in its own zero-diff commit. The phase verifier checks `next >= patched`. If execution starts after 2026-10-14, fold the patched version into step 5 directly.

### Pitfall 8: Playwright 1.64 behaviour changes
**What goes wrong:**
- `screen` is now forwarded from device descriptors, so `devices['Desktop Chrome']` screens are 1920×1080. Low risk here: no `window.screen` or `device-width` usage exists in app code [VERIFIED: grep].
- `--update-snapshots=missing` now passes the run.
- Elements in hidden iframes count as hidden.
- JSX in test files follows `tsconfig.json`.
- Chromium jumps to 156.

**How to avoid:** bump the container tag in the same commit and expect a possible font re-baseline.

### Pitfall 9: Snapshot names vs the `git mv`
**What goes wrong:** snapshot paths derive from the **spec file and test title or name argument**, not from app route files, so `git mv app/* app/(site)/` renames nothing in `e2e/`.
**How to avoid:** use explicit name arrays (`toHaveScreenshot(['home', '1440-reduced.png'])`) so later title edits don't orphan PNGs. Step 9 is an intentional re-baseline anyway (new shell).
**Real hazards in step 9:**
- duplicate `/` if `app/page.tsx` is copied instead of moved
- `#main-content` declared twice (rename Home's to `#home-content`)
- `.first()` selectors hiding two navs
- stale `.next/types`

### Pitfall 10: The neutralise commit flips the light baselines
**What goes wrong:** after 8a, light equals dark **by construction**.
**How to avoid:** switch `visual-light` to the dark path template and delete the light PNGs in that commit. If the light run then fails anywhere, some style still depends on OS scheme (the forced `color-scheme: dark` changes native form controls and scrollbars). Fix it before step 8b.

### Pitfall 11: `scrollbar-gutter` and the existing body scroll locks
**What goes wrong:** `ImageDetailModal` and `GlassmorphismNav` set `document.body.style.overflow = 'hidden'`. Body overflow propagates to the viewport, and with `scrollbar-gutter: stable` on `html` the gutter should persist [ASSUMED: CSS overflow propagation].
**How to avoid:** add the G3 bounding-box test (headed-scrollbar project) when step 7d lands, not later.

### Pitfall 12: ESM-only guard dependencies inside Jest
**What goes wrong:** `colorjs.io` is `"type": "module"` with no CJS export, and loading `eslint.config.mjs` needs dynamic `import()`, which Jest's VM rejects without flags.
**How to avoid:** keep the contrast check and the a11y self-test as Node `.mjs` scripts. Only the motion-token parity test (fs + regex) lives in Jest.

## Code Examples

### Validated `eslint.config.mjs` (step 1)
Run in scratch against the repo: only the 25 residual errors listed above remain [VERIFIED].
```js
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier/flat';

// Legacy v1 files replaced or deleted in Phases 9-12: React Compiler rules warn here only.
const LEGACY_COMPILER_FILES = [
  'components/DualParticleSystem.tsx', 'components/HologramTerminal.tsx', 'components/HologramTerminalDemo.tsx',
  'components/MountainTerrain3D.tsx', 'components/GeologicalButton.tsx', 'components/AnimatedGradientMesh.tsx',
  'components/GlassmorphismNav.tsx', 'components/ShaderTransition.tsx', 'components/TerminalDemo.tsx',
  'lib/useProgressiveTextures.ts',
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { files: ['**/*.{jsx,tsx}'], rules: { ...jsxA11y.flatConfigs.recommended.rules } }, // errors, not Next's 6 warns
  { files: LEGACY_COMPILER_FILES, rules: {
      'react-hooks/purity': 'warn', 'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn', 'react-hooks/refs': 'warn' } },
  { files: ['**/*.config.js', '**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'coverage/**', 'playwright-report/**', 'test-results/**',
    'next-env.d.ts', '.claude/**', '.planning/**', 'graphify-out/**', 'project_concept/**', 'public/**']),
]);
```
A11y self-test (proves GUARD-06 can fail): `echo "export const X = () => <div onClick={() => {}} />;" | npx eslint --stdin --stdin-filename probe.tsx`. It must exit 1.

### Playwright projects (step 2; the 8a change is commented)
```ts
// Source: playwright TestProject / expect.toHaveScreenshot.pathTemplate (verified in 1.64 types + runtime)
const VISUAL = /visual\/.*\.spec\.ts$/;
const DARK_PATH = '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}-visual-dark{-snapshotSuffix}{ext}';
const prod = !!process.env.CI || !!process.env.PW_PROD;

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000', serviceWorkers: 'block', trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', testIgnore: VISUAL, use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  testIgnore: VISUAL, use: { ...devices['Desktop Firefox'] } },
    { name: 'visual-dark',  testMatch: VISUAL, retries: 0, use: { ...devices['Desktop Chrome'], colorScheme: 'dark' } },
    { name: 'visual-light', testMatch: VISUAL, retries: 0, use: { ...devices['Desktop Chrome'], colorScheme: 'light' },
      // Step 8a onward (light must equal dark): expect: { toHaveScreenshot: { pathTemplate: DARK_PATH } },
    },
  ],
  webServer: {
    command: prod ? 'npm run build && npm run start' : 'npm run dev',
    url: 'http://localhost:3000', reuseExistingServer: !prod, timeout: 240_000,
  },
});
```

### Visual spec skeleton
```ts
import { test, expect, type Page } from '@playwright/test';
const ROUTES = [['home','/'],['photos','/photos'],['projects','/projects'],['clix-cli','/projects/clix-cli'],
  ['clix-website','/projects/clix-website'],['roadmap','/roadmap'],['contact','/contact'],['offline','/offline'],
  ['not-found','/__no-such-page__']] as const;
const WIDTHS = [375, 768, 1440] as const;
const STYLE = 'e2e/visual/hide-canvas.css'; // canvas { visibility: hidden !important; }

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {                      // fire once:true whileInView + lazy images
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
      scrollTo(0, y); await new Promise(r => setTimeout(r, 60));
    }
    scrollTo(0, 0);
  });
  await page.waitForFunction(() => Array.from(document.images).every(i => i.complete));
  await page.waitForFunction(() => document.getAnimations()
    .filter(a => a.effect?.getComputedTiming().iterations !== Infinity)
    .every(a => a.playState !== 'running'));
}

for (const [name, path] of ROUTES) for (const w of WIDTHS) {
  test(`${name} @${w} reduced`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(path);
    await settle(page);
    await expect(page).toHaveScreenshot([name, `${w}-reduced.png`], { fullPage: true, stylePath: STYLE });
  });
}

for (const w of WIDTHS) for (const pct of [0, 50, 100]) {
  test(`home scroll ${pct}% @${w}`, async ({ page }) => {   // motion ON: exercises useScroll paths
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('/'); await settle(page);
    await page.evaluate(p => scrollTo(0, innerHeight * p / 100), pct);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await expect(page).toHaveScreenshot(['home', `${w}-scroll-${pct}.png`], { stylePath: STYLE });
  });
}
```

### Baseline-generation workflow
```yaml
# .github/workflows/visual-baselines.yml
name: Update visual baselines
on: workflow_dispatch
permissions: { contents: read }
jobs:
  update:
    runs-on: ubuntu-latest
    container: { image: mcr.microsoft.com/playwright:v1.60.0-noble, options: --ipc=host }  # == lockfile @playwright/test
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with: { node-version-file: .node-version, cache: npm }
      - run: npm ci
      - run: npx playwright test --project=visual-dark --project=visual-light --update-snapshots=changed
        env: { CI: '1', RESEND_API_KEY: dummy_key_for_tests, FEEDBACK_RECIPIENT_EMAIL: test@example.com, FEEDBACK_FROM_EMAIL: noreply@example.com }
      - uses: actions/upload-artifact@v7
        with: { name: visual-baselines, path: 'e2e/visual/**/*-snapshots/**' }
```
The compare job in `ci.yml` is identical except it omits `--update-snapshots` and uploads `test-results/` on failure. `check-install-parity.mjs` asserts that the `vX.Y.Z` in every `container.image` equals `package-lock.json` `node_modules/@playwright/test`.version.

### Test-count ratchet core
```js
// scripts/guards/test-count.mjs — node scripts/guards/test-count.mjs --jest jest-results.json [--update]
import { execFileSync } from 'node:child_process'; import fs from 'node:fs';
const base = JSON.parse(fs.readFileSync(new URL('./test-count.baseline.json', import.meta.url)));
const jest = JSON.parse(fs.readFileSync(process.argv[process.argv.indexOf('--jest') + 1]));
const list = JSON.parse(execFileSync('npx', ['playwright', 'test', '--list', '--reporter=json'], { encoding: 'utf8', shell: true }));
const keys = new Set();
(function walk(s, p) { for (const x of s.suites ?? []) walk(x, [...p, x.title]);
  for (const sp of s.specs ?? []) keys.add(`${sp.file}::${[...p, sp.title].join(' > ')}`); })(list, []);
const now = { jest: jest.numTotalTests, e2e: keys.size }; now.total = now.jest + now.e2e;
if (jest.numPendingTests > 0) fail(`${jest.numPendingTests} skipped Jest tests`);
if (now.total < base.total) fail(`test count ${now.total} < baseline ${base.total} (rewrite tests, never delete)`);
// --update: write now only if now.total >= base.total
```

### Motion-token parity test (DSGN-08)
```ts
// lib/__tests__/motion-tokens.test.ts
import fs from 'node:fs'; import path from 'node:path';
import { DURATION, EASING } from '@/lib/animations';
const css = fs.readFileSync(path.join(process.cwd(), 'app/globals.css'), 'utf8');
const camelToKebab = (k: string) => k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
test.each(Object.entries(DURATION))('--duration-%s matches', (k, sec) => {
  const m = css.match(new RegExp(`--duration-${camelToKebab(k)}:\\s*(\\d+)ms`));
  expect(m && Number(m[1])).toBe(Math.round(sec * 1000));
});
test.each(Object.entries(EASING))('--ease-%s matches', (k, arr) => {
  const m = css.match(new RegExp(`--ease-${camelToKebab(k)}:\\s*cubic-bezier\\(([^)]+)\\)`));
  expect(m && m[1].split(',').map(Number)).toEqual([...arr]);
});
```
`test.each` adds tests, which feeds the ratchet.

### HOME-08 baseline (step 10)
```ts
// e2e/perf/home-baseline.spec.ts — run: PW_PROD=1 npx playwright test e2e/perf --project=chromium (in the container)
test('home mobile LCP + JS bytes', async ({ browser }) => {
  const ctx = await browser.newContext({ ...devices['Pixel 7'], serviceWorkers: 'block' });
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
  await page.goto('/', { waitUntil: 'load' }); await page.waitForTimeout(3000);
  const r = await page.evaluate(() => new Promise(res => new PerformanceObserver(l => {
    const lcp = l.getEntries().at(-1)!.startTime;
    const js = performance.getEntriesByType('resource').filter((e: any) => e.initiatorType === 'script')
      .reduce((s, e: any) => ({ transfer: s.transfer + e.transferSize, decoded: s.decoded + e.decodedBodySize }), { transfer: 0, decoded: 0 });
    res({ lcp, js });
  }).observe({ type: 'largest-contentful-paint', buffered: true })));
  // repeat 5x, record the medians to e2e/perf/home-baseline.json (+ commit SHA, Playwright version, container tag)
});
```
Record transferred **and** decoded script bytes. `next start` gzips, while Vercel serves brotli, so Phase 9 must compare in the same environment.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package, `motion/react` imports (`framer-motion@14.1.0` is an internal pinned dep) | motion 12.x→14 | Mechanical import swap; single `motion-dom` |
| `next lint` / `.eslintrc` + FlatCompat | `eslint-config-next` native flat arrays (`/core-web-vitals`, `/typescript`) + `defineConfig`/`globalIgnores` from `eslint/config` | Next 16 | Replace the FlatCompat config |
| `react-hooks` v4/v5 (2 rules) | `react-hooks` v7 recommended includes React-Compiler rules at error (`purity`, `refs`, `immutability`, `set-state-in-effect`, …) | 7.0 | New errors on R3F code; needs a legacy override |
| `error.js` `reset()` | `retry()` (stable 16.3.0); `reset()` retained | Next 16.3 | Use `retry` in `(site)/error` and `global-error` |
| `next build` First Load JS table | Removed from build output | Next 16.x (PR #83815) | HOME-08 needs a runtime measurement |
| `toHaveScreenshot` PNG only | `type: 'webp'` option (1.64) / `.webp` names (1.62) | Playwright 1.62–1.64 | Optional repo-size win after step 6. Keep PNG through Phase 7 to avoid conflating diffs |

**Deprecated / outdated in this repo:** `scripts/verify-contrast.mjs` (hand-maintained hex table), `wcag-contrast`, global scrollbar hiding, the `retries: 2` mask for visual flakes, and the CI `--passWithNoTests` flag.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 2026-10-14 Next patch will ship as a 16.4.x release (and may include patched React packages, since the advisory says "upstream dependencies") | Pitfall 7, step 5b | Step 5b's package list changes; the plan must read the advisory before executing 5b |
| A2 | `--hide-scrollbars` removes scrollbar width from layout in headless Chromium, so the gutter is invisible in baselines | Pitfall 4 | If the gutter does show, 7d produces a real width diff (still handled by the intentional re-baseline) |
| A3 | Body `overflow: hidden` propagates to the viewport and `scrollbar-gutter: stable` on `html` keeps the gutter | Pitfall 11 | The G3 test fails, and the scroll lock must move to `documentElement` (the UI-SPEC already prefers that) |
| A4 | Chromium 156 (PW 1.64) rasterises fonts differently enough to need a re-baseline in step 6 | Step 6 | Low: if there is no diff, no re-baseline is needed |
| A5 | `actions/setup-node` works inside the Playwright container so CI runs Node 24 there too | Baseline workflow | Fallback: use the container's bundled Node and document the version (GUARD-01 says "CI runs on Node 24") |
| A6 | Tim can review and commit PNG artifacts from the workflow, or approves the job committing them | Pattern 5 | Alternative: the job opens a PR (needs `contents: write`) |
| A7 | Throttling settings (4× CPU, ~1.6 Mbps / 150 ms) are an acceptable HOME-08 lab profile | Step 10 | Phase 9 compares like-for-like, so any fixed profile works if documented |

## Open Questions

1. **Security patch timing vs execution date.**
   - What we know: the patch is announced for 2026-10-14; `16.4.0` is current.
   - Unclear: whether step 5 runs before or after that date, and which packages the patch touches.
   - Recommendation: plan step 5b as a gated task with `checkpoint:human-verify` that reads the advisory.
2. **BLOCKING INPUT `site.email` and `site.links.linkedin`** (UI-SPEC).
   - These gate step 9 only. Type them as required `string` so `tsc` fails without them, and put a `checkpoint:human-input` before step 9.
3. **Baseline commit mechanics.**
   - Options: artifact download (recommended, reviewable) or a bot commit or PR.
   - Tim's preference is needed once.
4. **`retry` vs `reset`.**
   - The UI-SPEC wording says `reset()`; Next 16.4 docs recommend `retry()`.
   - Recommendation: `retry()`. Confirm at plan review.
5. **Dependabot during Phase 7.**
   - Options: pause it, or add temporary `ignore` entries.
   - Recommendation: temporary ignores, removed at phase close.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | everything | ✓ | 24.21.0 | — |
| npm | `npm ci` | ✓ | 11.6.1 | — |
| Local node_modules matching lockfile | baselines, lint | ✗ (stale) | — | `npm ci` (step 1) |
| Docker CLI | optional local Linux baselines | ✓ CLI 29.8.2 / ✗ daemon not running | — | CI `workflow_dispatch` container job (primary) |
| Playwright container `v1.60.0-noble` / `v1.64.0-noble` | GUARD-02, DEPS-05 | ✓ tags exist on MCR | — | — |
| GitHub Actions | all guards | ✓ (`ci.yml` present) | actions v6/v7 | — |
| `gh` CLI | optional (download artifacts) | ✗ (command not found) | — | Download from the Actions UI |
| Network to fonts.googleapis.com at build | `next/font/google` (Schibsted, Inter, JetBrains Mono) | ✓ (existing fonts already build) | — | — |
| Original photos (`public/images/landscapes/`, gitignored) | `prebuild` optimize-images | absent in CI (script exits 0, "No source images found") | — | Committed `public/images/optimized/*` (69 tracked files) serve all pages |

**Missing dependencies with no fallback:** none.
**Missing with fallback:** stale local install (`npm ci`), Docker daemon (CI container), `gh` (web UI).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Unit framework | Jest 30.4.2 + `jest-environment-jsdom` 30.4.1 via `next/jest`, `@testing-library/react` 16.3.2 (`jest.config.js`, `jest.setup.js`) |
| E2E framework | `@playwright/test` 1.60.0 → 1.64.0 (`playwright.config.ts`, `testDir: ./e2e`) |
| Static guards | ESLint 9.39.4 flat config + Node `.mjs` guard scripts (new) |
| Quick run command | `npm run lint && npm run type-check && npx jest --silent` (~1 min; lint includes the guards) |
| Visual run (CI container only) | `npx playwright test --project=visual-dark --project=visual-light` |
| Full suite command | `npm run lint && npm run type-check && npm test && npm run build && npx playwright test --project=chromium --project=firefox`, plus the visual job |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GUARD-01 | `npm ci` everywhere; Node 24; lockfile in sync | static guard | `node scripts/guards/check-install-parity.mjs && npm ls --depth=0` | ❌ Wave 0 |
| GUARD-02 | dark/light baselines for every route, prod build, Linux, SW blocked, retries 0 | visual e2e | `npx playwright test --project=visual-dark --project=visual-light` (container) | ❌ Wave 0 (`e2e/visual/routes.spec.ts`, `hide-canvas.css`, workflow) |
| GUARD-03 | CI fails on test-count drop | static guard + self-test | `npx jest --json --outputFile=jest-results.json && node scripts/guards/test-count.mjs --jest jest-results.json` | ❌ Wave 0 |
| GUARD-04 | no `dark:` / stock palette; white/black ratchet | static guard + self-test | `node scripts/guards/check-palette.mjs` (enabled in step 8; self-test from step 1) | ❌ Wave 0 |
| GUARD-05 | contrast from `globals.css` in `npm run lint`; all pairs AA | static guard + self-test | `node scripts/guards/check-contrast.mjs` | ❌ Wave 0 (replaces `scripts/verify-contrast.mjs`) |
| GUARD-06 | jsx-a11y runs and fails lint | lint + stdin probe | `npm run lint` and `echo "<div onClick={()=>{}}/>" \| npx eslint --stdin --stdin-filename p.tsx` (expect exit 1) | ❌ Wave 0 (config rewrite) |
| DEPS-03 | motion 14.1, `motion/react`, single `motion-dom`, zero diff incl. mid-scroll | static + visual | `npm ls motion-dom` (one entry) + `! grep -r "framer-motion" app components lib` + visual job | visual ❌ Wave 0 |
| DEPS-04 | Next 16.4.x (patched), React 19.3, R3F 9.8.1, drei 10.7.9, zero diff | static + visual + build | `node -e "…assert versions…"` in `check-install-parity.mjs` + `npm run build` + visual job | ❌ Wave 0 |
| DEPS-05 | Playwright 1.64 in its own commit; container tag matches | static | `check-install-parity.mjs` (container tag == lockfile) | ❌ Wave 0 |
| DSGN-05 | same dark site for light-OS | visual + static | visual-light compared to dark PNGs (pathTemplate) + palette guard `dark:`=0 + `color-scheme: dark` assertion | ❌ Wave 0 |
| DSGN-06 | tokens v2, v1 only as aliases | static | contrast guard (token classification: unknown token fails) + palette guard (v1 names banned in `components/site/**`, `components/providers/**`, `data/site.ts`) | ❌ Wave 0 |
| DSGN-07 | Schibsted display, Inter body, Mono data, tabular nums | e2e computed style | `npx playwright test e2e/design-system.spec.ts --project=chromium` (h1 `font-family` contains Schibsted; body Inter; `.font-mono` `font-variant-numeric: tabular-nums`) | ❌ Wave 0 |
| DSGN-08 | shared motion tokens; reduced motion respected | unit + e2e | `npx jest lib/__tests__/motion-tokens.test.ts` + shell under `reduce`: `getAnimations()` on header/menu = 0 | ❌ Wave 0 |
| DSGN-09 | thin visible scrollbar, stable gutter, no shift on modal | e2e computed style + bounding box | `design-system.spec.ts` (computed `scrollbarGutter`/`scrollbarWidth`; G3 nav box before/after opening the photo modal in a project with `ignoreDefaultArgs: ['--hide-scrollbars']`) | ❌ Wave 0 |
| DSGN-10 | one SVG family, no emoji icons | static + unit | palette guard emoji/Phosphor rules + rewritten `RoadmapFilters.test` / `RoadmapTimeline.test` (labels + one `aria-hidden` svg) | tests exist (rewrite) / guard ❌ |
| SHELL-01 | one Primary nav, one main, skip link first, `aria-current` | e2e | `npx playwright test e2e/shell.spec.ts --project=chromium` (route loop incl. `/offline` and the 404; `toHaveCount(1)`, no `.first()`) | ❌ Wave 0 |
| SHELL-02 | mobile menu ≥44 px, closes on route change and Escape | e2e (375 px) | `shell.spec.ts` mobile describe (`boundingBox().height >= 44`, Escape returns focus to the button, navigation closes the menu) | ❌ Wave 0 |
| SHELL-03 | real identity, no placeholders | static + e2e + tsc | forbidden-strings in `check-palette.mjs`; `shell.spec.ts` footer hrefs equal `site.links`; required `string` types → `npm run type-check` | ❌ Wave 0 |
| SHELL-05 | playground URLs 404 in the shell; no links | e2e + static | `shell.spec.ts`: `response.status() === 404` + nav present for the 3 URLs; `! grep -rE "/(gradient-mesh\|particle-buttons\|transitions)" app components data` | ❌ Wave 0 |
| SHELL-06 | Contact heading and fields AA in both schemes | e2e axe | `npx playwright test e2e/a11y-contact.spec.ts` (AxeBuilder `withRules(['color-contrast'])` under `colorScheme` dark and light; zero violations; `incomplete` items reviewed) | ❌ Wave 0 |
| (step 10) | Home mobile LCP + JS baseline recorded | perf harness | `PW_PROD=1 npx playwright test e2e/perf --project=chromium` | ❌ Wave 0 |

**Manual-only:** reviewing intentional re-baseline PNGs (steps 3, 6 if needed, 7b–7e, 8 map, 9), with a human sign-off per commit. Keyboard-only shell pass in Firefox and WebKit locally: VERIFY-03 is Phase 12, but a smoke pass is cheap.

### Sampling Rate
- **Per task commit:** quick command, plus the visual job on push (every zero-diff commit **must** show a green visual job before the next step starts).
- **Per wave merge:** full suite + visual job.
- **Phase gate:** full suite green, `test-count.baseline.json` raised to the new total, `palette-ratchet.json` committed, HOME-08 baseline JSON committed, then `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `scripts/guards/{test-count,check-palette,check-contrast,check-install-parity}.mjs` + baseline/ratchet JSON + `__selftest__/` fixtures
- [ ] `eslint.config.mjs` rewrite (validated config above) + `eslint-plugin-jsx-a11y` direct devDep
- [ ] `playwright.config.ts` visual projects; `e2e/visual/routes.spec.ts`, `e2e/visual/hide-canvas.css`
- [ ] `.github/workflows/visual-baselines.yml`; `ci.yml` visual job, Node 24, ratchet step, preflight
- [ ] `lib/__tests__/motion-tokens.test.ts` (step 7a)
- [ ] `e2e/design-system.spec.ts` (step 7), `e2e/shell.spec.ts` + `e2e/a11y-contact.spec.ts` + `components/__tests__/global-error.test.tsx` (step 9)
- [ ] `e2e/perf/home-baseline.spec.ts` (step 10)
- [ ] package.json scripts: `"lint": "eslint . && node scripts/guards/check-palette.mjs && node scripts/guards/check-contrast.mjs && node scripts/guards/check-install-parity.mjs"`. Add the palette and contrast steps when each guard is enabled (step 8), and keep the self-tests from step 1.

## Security Domain

`security_enforcement` is absent from `.planning/config.json`, so it is treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth surface |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (unchanged) | Contact form: zod + `/api/feedback` with `validateOrigin` CSRF + Upstash rate limit. **Restyle only in Phase 7**; `contact-form.spec` and `app/api/__tests__/feedback.test.ts` (17 tests) must stay green unchanged |
| V6 Cryptography | no | — |
| V10 Malicious code / V14 Configuration (supply chain) | yes | `npm ci` everywhere (lockfile integrity); Next security patch (step 5b); recency-flagged packages behind `checkpoint:human-verify`; no `postinstall` scripts in new packages; CSP in `proxy.ts` unchanged (`style-src 'unsafe-inline'` stays, because Motion inline styles need it); Phosphor via `dist/ssr` adds no new origins |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unpatched framework CVEs (two Critical, one High, announced) | Elevation / Tampering | Step 5b patch bump; verifier asserts the patched version |
| Dependency confusion or slopsquat during upgrades | Tampering | Exact versions from the ROADMAP; registry integrity matches the lockfile; `npm ci` |
| Workflow token misuse in the new baseline job | Elevation | `permissions: contents: read`, artifact upload only (no push) |
| Leaking error detail on the new error pages | Information disclosure | The UI-SPEC renders no `error.message` or `digest`; Next already sanitises server errors in production [CITED: Next error docs] |
| Placeholder or wrong contact identity (phishing-adjacent) | Spoofing | Forbidden-strings guard + required-`string` `site.ts` + footer href e2e |

## Project Constraints (from CLAUDE.md)

There is no project `./CLAUDE.md` or `./.claude/CLAUDE.md`. The user's global CLAUDE.md and memory add these directives:
- **UI/UX work must use the `ui-ux-pro-max` skill** (memory). The UI-SPEC already applied it; any Phase 7 UI deviation goes back through it.
- **Regression safety:** "Before modifying working code, verify the change is safe… flag potential regression risks explicitly." This is honoured by the zero-diff commit discipline and the hazards in Common Pitfalls.
- **Decisions:** present options as structured comparison tables and let Tim decide. Open Questions 3–5 are decisions of this kind.
- **Explanations:** concise; code first.
- Project skills under `.claude/skills/` (banner-design, brand, design, design-system, slides, ui-styling) are design tooling. None constrains the guard or upgrade work. The `design-system` skill's three-layer token model agrees with the UI-SPEC's L1/L2/L3.

## Sources

### Primary (HIGH confidence)
- **npm registry (`npm view`, 2026-10-10):** next (time, dist-tags, peers, engines `>=20.9.0`), react/react-dom 19.3.0, motion 14.1.0 deps/peers, framer-motion, @react-three/fiber 9.8.1 peers, drei 10.7.9 peers, eslint-config-next 16.4.0 deps/exports, @playwright/test time, @phosphor-icons/react, colorjs.io, @axe-core/playwright
- **Scratch execution** (lockfile copy under the session scratchpad): `npm ci`; motion swap → `npm ls motion-dom`; platform bump → `npm ls --depth=0` exit 0; Playwright 1.64 bump; `tsc --noEmit` pass; Jest 66/66; `next build` success on 16.4.0; two ESLint dry runs (16.2.6 / 16.4.0 configs); validated `eslint.config.mjs`; Tailwind 4.3 probe compile; colorjs.io contrast recomputation; `playwright test --list --reporter=json` counting; `npm pack @phosphor-icons/react@2.1.10` exports and icon files; Next `font-data.json`
- **Repo inspection (Read/grep):** `vercel.json`, `.node-version`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `playwright.config.ts`, `eslint.config.mjs`, `jest.config.js`, `tsconfig.json`, `app/globals.css`, `app/layout.tsx`, `lib/animations.ts`, `scripts/verify-contrast.mjs`, `app/photos/page.tsx`, `e2e/homepage.spec.ts`, `components/__tests__/RoadmapFilters.test.tsx`, `proxy.ts`, component import graph
- Playwright 1.64 installed sources: `types/test.d.ts` (snapshotPathTemplate), `lib/worker/workerProcessEntry.js` (template precedence), `playwright-core` `coreBundle.js` (`--hide-scrollbars`)
- MCR tag list `https://mcr.microsoft.com/v2/playwright/tags/list` (v1.60.0-noble … v1.64.0-noble)

### Secondary (MEDIUM confidence, official docs via WebFetch)
- https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026 (2026-10-14 release, 2 Critical + 1 High, upstream deps)
- https://nextjs.org/docs/app/api-reference/file-conventions/error (v16.4.0: `retry`, global-error html/body/styles)
- https://playwright.dev/docs/release-notes (1.61–1.64 changes, browser versions)
- https://playwright.dev/docs/test-cli (`--update-snapshots` modes) · https://playwright.dev/docs/api/class-testconfig (tokens, toHaveScreenshot options) · https://playwright.dev/docs/docker (version match, flags)
- https://vercel.com/docs/functions/runtimes/node-js/node-js-versions (engines override, 24.x default, Node 20 deprecation)
- https://tailwindcss.com/docs/theme (`@theme inline`, `static`, `--color-*: initial`, namespaces)
- Milestone research: `.planning/research/{SUMMARY,STACK,PITFALLS,ARCHITECTURE}.md`; the approved `07-UI-SPEC.md`

### Tertiary (LOW confidence)
- WebSearch: Next.js commit "Remove JS size reporting from next build (#83815)" (https://app.semanticdiff.com/gh/vercel/next.js/commit/18e7c84af25c69c7807026a9044819ace1780abb). Corroborated by the scratch 16.4 build output, which shows no size columns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Every version came from the registry, and every upgrade was dry-run with `tsc`, Jest and `next build` against the repo source.
- Architecture and guards: HIGH for config mechanics (validated ESLint config, Tailwind compile, Playwright internals); MEDIUM for the CI container workflow (not executed).
- Pitfalls: HIGH for repo-derived hazards (counts, canvas positioning, lint deltas); MEDIUM for scrollbar and headless interactions (A2, A3).

**Research date:** 2026-10-10
**Valid until:** 2026-10-17 for the Next patch status (re-check after 2026-10-14); 30 days for everything else.
