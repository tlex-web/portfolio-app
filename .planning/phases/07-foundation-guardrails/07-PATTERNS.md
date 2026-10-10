# Phase 7: Foundation & Guardrails - Pattern Map

**Mapped:** 2026-10-10
**Files analyzed:** 30 (new + modified)
**Analogs found:** 24 / 30

All analog paths below are git-tracked source (verified with `git ls-files`).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/guards/test-count.mjs` | utility (CI guard) | batch / file-I/O | `scripts/inject-build-hash.mjs` | role-match |
| `scripts/guards/check-palette.mjs` | utility (CI guard) | batch / file-I/O | `scripts/inject-build-hash.mjs` | role-match |
| `scripts/guards/check-contrast.mjs` | utility (CI guard) | transform | `scripts/verify-contrast.mjs` (replaced) | exact (purpose) |
| `scripts/guards/check-install-parity.mjs` | utility (CI guard) | file-I/O | `scripts/inject-build-hash.mjs` | role-match |
| `scripts/guards/*.json` (baseline, ratchet) | config | - | none | no analog |
| `scripts/guards/__selftest__/*` | test fixtures | - | none | no analog |
| `eslint.config.mjs` (rewrite) | config | - | itself (lines 1-70) | modify |
| `playwright.config.ts` (visual projects) | config | - | itself (lines 1-52) | modify |
| `vercel.json`, `.node-version`, `package.json#engines` | config | - | itself | modify |
| `.github/workflows/ci.yml` | config (CI) | batch | itself (lines 13-33 job shape) | modify |
| `.github/workflows/visual-baselines.yml` | config (CI) | batch | `.github/workflows/ci.yml` | role-match |
| `e2e/visual/routes.spec.ts` | test (e2e) | request-response | `e2e/homepage.spec.ts` | role-match |
| `e2e/shell.spec.ts`, `e2e/design-system.spec.ts`, `e2e/a11y-contact.spec.ts`, `e2e/perf/home-baseline.spec.ts` | test (e2e) | request-response | `e2e/homepage.spec.ts` | role-match |
| `e2e/visual/hide-canvas.css` | config | - | none | no analog |
| `lib/__tests__/motion-tokens.test.ts` | test (unit) | file-I/O | `lib/__tests__/useReducedMotion.test.tsx` | role-match |
| `components/__tests__/global-error.test.tsx` | test (unit) | - | `components/__tests__/ProjectCard.test.tsx` / `useReducedMotion.test.tsx` | role-match |
| `lib/animations.ts` (add fast/panel/descent + helpers) | utility | - | itself (lines 11-33) | modify |
| `app/globals.css` (tokens v2, base, scrollbar) | config (styles) | - | itself | modify |
| `data/site.ts` | model (static data) | - | `data/projects.ts` | exact |
| `components/site/SiteNav.tsx` (client) | component | event-driven | `components/Header.tsx` | exact (being replaced) |
| `components/site/SiteFooter.tsx` (server) | component | - | `components/Footer.tsx` | exact (being replaced; drop motion) |
| `components/site/SiteChrome.tsx`, `SkipLink.tsx` | component (RSC) | - | `app/layout.tsx` body composition | partial |
| `components/providers/MotionProvider.tsx` | provider | - | none (no MotionConfig exists) | no analog |
| `app/layout.tsx` (Schibsted, `dark` class) | layout | - | itself (lines 1-54) | modify |
| `app/(site)/layout.tsx` | layout | - | `app/layout.tsx` | role-match |
| `app/not-found.tsx`, `app/(site)/not-found.tsx` | route (edge page) | - | `app/not-found.tsx` | exact |
| `app/(site)/error.tsx` | route (error boundary) | - | `app/error.tsx` (git mv + rewrite) | exact |
| `app/global-error.tsx` | route (error boundary) | - | `app/error.tsx` + `app/layout.tsx` html/body | role-match |
| Moved pages (`git mv` into `app/(site)/`) | route | - | themselves | modify (remove Header/Footer imports) |

## Pattern Assignments

### `scripts/guards/*.mjs` (CI guard scripts)

**Analog:** `scripts/inject-build-hash.mjs`. Copy the header-docblock and fs conventions.

Header and imports (lines 1-20):
```js
#!/usr/bin/env node
/**
 * Post-build script: ...
 * Usage:
 *   node scripts/inject-build-hash.mjs
 */
import fs from 'fs';
import path from 'path';
const root = process.cwd();
const buildIdPath = path.join(root, '.next', 'BUILD_ID');
```
Error handling (lines 22-30): try/catch around `fs.readFileSync`, `console.error(...)`, then `process.exit(...)`. **Deviation for guards:** exit with `process.exit(1)` on a failed check (the analog exits 0 because it is non-fatal).

Guard specifics come from RESEARCH Pattern 1 (Jest `--json` `numTotalTests` + `playwright test --list --reporter=json` unique `file+titlePath`), Pattern 2 (the STOCK/DARK/WB regexes, verbatim), and Pattern 3 (colorjs.io, ESM only, `.mjs`).

### `scripts/guards/check-contrast.mjs`

**Analog:** `scripts/verify-contrast.mjs` (lines 1-70). Keep the docblock style (purpose, thresholds 4.5/3, usage). **Anti-pattern to drop:** the hand-copied hex table (lines 22-66). The new script parses `app/globals.css` `:root` plus the `@theme inline` / `@theme` blocks and resolves `var()` chains. Delete the old script and its `postbuild` hook, together with `wcag-contrast`, in step 8.

### `eslint.config.mjs` (rewrite)

**Current:** FlatCompat + prettier (lines 10-34). It imports `eslint-plugin-react`, `react-hooks` and `globals`, none of which are direct deps (lines 1-9). Keep the ignore list (lines 21-31) and extend it with `.claude/**`, `graphify-out/**`, `.planning/**`, `project_concept/**` and `public/**`. Keep the `@typescript-eslint/no-unused-vars` `argsIgnorePattern: "^_"` rule (lines 62-64). Replace everything else with the validated config in RESEARCH "Code Examples": `eslint-config-next/core-web-vitals` + `/typescript`, jsx-a11y `flatConfigs.recommended` at error, a legacy-file override that sets the compiler rules to warn, `eslint-config-prettier/flat`, and `globalIgnores`.

### `playwright.config.ts`

**Current** (lines 6-52). Changes:
- Projects array (lines 21-39): add `visual-dark` / `visual-light` objects in the same `{ name, use: { ...devices['Desktop Chrome'], colorScheme } }` shape, with `retries: 0` and `serviceWorkers: 'block'`.
- Functional projects: add `testIgnore: /visual\//`.
- `webServer.command` (lines 45-47): change the condition to `process.env.CI || process.env.PW_PROD`.
- From step 8a, give `visual-light` an `expect.toHaveScreenshot.pathTemplate` that points at the dark files.

### `e2e/*.spec.ts` (new specs)

**Analog:** `e2e/homepage.spec.ts` (lines 1-30):
```ts
import { test, expect } from '@playwright/test';
test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Portfolio/i);
    await expect(page.locator('#main-content')).toBeVisible();
  });
```
Conventions: `test.describe` per feature, `getByRole('link', { name })` locators, `toHaveURL` with `{ timeout: 15000 }`. **Contract rewrite (step 9):** `/Portfolio/i` changes to the new title, and the `/Photos/` and `/Projects/` link names change to `Photographs` and `Engineering`. Rewrite in the same commit; never delete (GUARD-03). The visual spec loops over the route list × [375, 768, 1440] (count via `--list`, not regex).

### `lib/__tests__/motion-tokens.test.ts`

**Analog:** `lib/__tests__/useReducedMotion.test.tsx`. Use relative imports (`from '../useReducedMotion'`) and one `describe` per unit. The new test reads `app/globals.css` with `fs.readFileSync(path.join(process.cwd(),'app/globals.css'))` and asserts every `DURATION[k]*1000 ms` and `EASING[k]` against `--duration-k` / `--ease-k`.

### `lib/animations.ts`

Existing shape (lines 11-33): `EASING` entries are `[a,b,c,d] as readonly [number, number, number, number]`, the object ends `as const`, and each key has a JSDoc one-liner. Add `descent: [0.4, 0, 1, 1]`, `DURATION.fast = 0.15` and `DURATION.panel = 0.25`. Add the `cssDuration` / `cssEase` helpers in the same file. Keep the `'use client'` directive (line 1). **Note:** that directive means server components (SiteFooter) should not import from here. Shell motion is CSS-only anyway.

### `data/site.ts`

**Analog:** `data/projects.ts` (lines 1-3): `import { Project } from './types'; export const projects: Project[] = [...]`. Follow the named-export convention. Per the UI-SPEC, use `as const` with required `string` for `email` and `links.linkedin` (BLOCKING INPUT, never invented). Optionally add a `Site` type to `data/types.ts`.

### `components/site/SiteNav.tsx`

**Analog:** `components/Header.tsx` (lines 1-30, 66-83, 144-155):
```tsx
'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
...
const pathname = usePathname();
const isActive = pathname === item.href;
```
Keep `'use client'`, `next/link`, `usePathname` and `useState`. **Drop:** the `framer-motion` / `AnimatePresence` imports, `useReducedMotion`, the scroll listener with `scrolled` state (lines 24-30), the inline `navigation` array (lines 16-22, replaced by `site.nav`) and `layoutId="activeTab"`. **Change** the active match to: `/` exact, prefix match for the others. Add `aria-current="page"`, Escape, focusout, outside-click, route-change and ≥768px close handlers, and `hidden` + `data-state` on `#site-menu`.

### `components/site/SiteFooter.tsx`

**Analog:** `components/Footer.tsx`. It is replaced; take only the link list. Make it a server component (no `'use client'`, no motion), with Phosphor icons from `@phosphor-icons/react/dist/ssr` and a server-computed year.

### `app/layout.tsx`

The font pattern (lines 9-19) is reused for `Schibsted_Grotesk`:
```ts
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
```
Then update the `className` on line 37 to `` `dark ${schibsted.variable} ${inter.variable} ${jetbrainsMono.variable}` ``. Keep `await headers()` (line 34, CSP nonce), `ServiceWorkerRegistration`, `Analytics` and `SpeedInsights`. Update the `metadata.title` on line 22: it contains "Portfolio", which the forbidden-strings guard and SHELL-03 flag.

### `app/global-error.tsx`

Combine two sources:
- the `'use client'` + `useEffect` console.error pattern from `app/error.tsx` (lines 1-15);
- the font imports and the `<html lang="en" className=...><body className="font-body antialiased">` from `app/layout.tsx` (lines 3-19, 37-46). global-error does not receive root styles, so import `./globals.css` explicitly.

Wire "Try again" to `retry()` (Next 16.3+), falling back to `reset`. The planner confirms which.

### `app/(site)/error.tsx`

`git mv app/error.tsx` and rewrite. Keep the props signature and `useEffect` logging (lines 5-15). Replace the `<a href="/">` (lines 32-37) with `Link` (lint fix in step 1). Replace the classes with v2 tokens and the Primary/Secondary button specs from the UI-SPEC.

### `app/not-found.tsx` / `app/(site)/not-found.tsx`

**Analog:** the current `app/not-found.tsx` (lines 1-21): a server component with `Link`, using `&apos;` escapes. Extract `NotFoundBody`. The root wraps it in `<SiteChrome>`.

## Shared Patterns

### Import alias
Use `@/` path aliases (`app/layout.tsx:6` `@/components/ServiceWorkerRegistration`; `Header.tsx:7` `@/lib/animations`). Apply to all new components.

### Client vs server
`'use client'` goes on the first line, only where hooks are needed (`Header.tsx:1`, `error.tsx:1`). SiteChrome, SiteFooter, SkipLink and data stay server-side.

### CI job shape
Source: `.github/workflows/ci.yml` lines 13-33 (`actions/checkout@v6`, `actions/setup-node@v6` with `cache: 'npm'`, then `npm ci`). Replace `node-version: '20'` with `node-version-file: .node-version` in all 5 jobs, and add an `npm ls --depth=0` preflight. The visual workflows add `container: mcr.microsoft.com/playwright:v1.60.0-noble` with `--ipc=host`.

### Icons
Import only from `@phosphor-icons/react/dist/ssr`, weight `regular` with no prop, and `aria-hidden="true"` beside text. The palette guard enforces this.

## No Analog Found

| File | Role | Reason |
|---|---|---|
| `components/providers/MotionProvider.tsx` | provider | No `MotionConfig` exists. Use the UI-SPEC snippet (`reducedMotion="user"`, `DURATION.enter`, `EASING.geological`) with `'use client'` |
| `scripts/guards/test-count.baseline.json`, `palette-ratchet.json` | config | New format: `{ jest: 66, e2e: 25, total: 91 }` |
| `scripts/guards/__selftest__/` | fixtures | Use the RESEARCH "Key insight" fixtures |
| `e2e/visual/hide-canvas.css` | config | `canvas { visibility: hidden !important; }` |
| `components/site/SkipLink.tsx` | component | No skip link exists today. Use the UI-SPEC SkipLink table |
| `.github/workflows/visual-baselines.yml` | CI | No `workflow_dispatch` or container job exists; follow RESEARCH Pattern 5 |

## Metadata
**Analog search scope:** `app/`, `components/`, `lib/`, `data/`, `scripts/`, `e2e/`, `.github/workflows/`, root configs
**Files scanned:** ~20
**Pattern extraction date:** 2026-10-10
