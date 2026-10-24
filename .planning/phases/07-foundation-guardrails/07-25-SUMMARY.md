---
phase: 07-foundation-guardrails
plan: 25
subsystem: infra
tags: [identity, shell-03, dsgn-10, metadata, title-template, package-author, email-template, forbidden-strings, emoji-rule, guards, selftest, legacy-dead-files, build-step-9]

requires:
  - phase: 07-24
    provides: "Contact shows site.email; the last placeholder address on a live page is gone"
  - phase: 07-22
    provides: "v1 Header, Footer and GlassmorphismNav have no importers (replaced by SiteChrome)"
  - phase: 07-21
    provides: "data/site.ts with Tim's name, role, email, GitHub and LinkedIn"
  - phase: 07-20
    provides: "check-palette.mjs with the emoji rule (run with --skip emoji until now) and the selftest harness"
provides:
  - "app/layout.tsx root metadata: title { default: 'Tim Lui · Developer & photographer', template: '%s · Tim Lui' }, description 'Tim Lui is a developer and photographer. Landscape photographs from the Matterhorn region and software projects.'"
  - "package.json author 'Tim Lui (https://github.com/tlex-web)', derived from data/site.ts and checked by the identity guard"
  - "lib/email.ts: HTML and text footer lines read 'This message was sent via the contact form on Tim Lui's website'; the collaboration line has no sparkle emoji"
  - "scripts/guards/check-identity.mjs (--root): forbidden placeholders in app/components/lib/data + package.json, site.ts shape (name, github, email, linkedin), derived author; npm script guard:identity, in the lint chain"
  - "scripts/guards/lib/legacy-dead-files.mjs: LEGACY_DEAD_FILES, assertNoImporters(root), isLegacyDeadFile(rel)"
  - "check-palette.mjs emoji rule on in lint (no --skip), with the dead-file exemption tied to assertNoImporters"
  - "10 new selftest cases (7 identity, 3 palette emoji); selftest 55/55"
affects: [07-26, 12]

actuals:
  tokens: 9670    # chars/4 over `git diff 980960d..44612f3` (38681 chars, code + fixtures + package.json)
  tasks: 2
  commits: 2      # measured: git rev-list --count 980960d..HEAD = 2 (168f176, 44612f3), before the docs commits
plan_head_before: 980960d5e52431a183e5f8b9cbd01e149b17417b
plan_head_after: 44612f3e2eec64ba8c1a60cd85dc0f7b9bd7e293

tech-stack:
  added: []
  patterns:
    - "One identity record: data/site.ts is the source; package.json author is a derived copy that a guard compares to `${name} (${github})`"
    - "Dead-file exemptions are conditional: a shared LEGACY_DEAD_FILES list is skipped only while assertNoImporters() finds no importer, so reviving a v1 file fails both the identity and emoji rules"
    - "Relative import specifiers are resolved against the importing file before matching, so ./SiteFooter or a components/site/Footer never count as the legacy components/Footer.tsx"

key-files:
  created:
    - scripts/guards/check-identity.mjs
    - scripts/guards/lib/legacy-dead-files.mjs
    - scripts/guards/__selftest__/identity/** (7 fixtures)
    - scripts/guards/__selftest__/palette/{emoji-legacy-dead,bad-emoji-component,bad-emoji-legacy-imported}/**
  modified:
    - app/layout.tsx
    - lib/email.ts
    - package.json
    - e2e/homepage.spec.ts
    - scripts/guards/check-palette.mjs
    - scripts/guards/selftest.mjs

key-decisions:
  - "data/site.ts is the single identity record; package.json author is a derived copy (package.json cannot import TS) that check-identity.mjs fails on if it differs from `${site.name} (${site.links.github})`"
  - "Legacy v1 Header/Footer/GlassmorphismNav stay exempt from the identity and emoji rules only while nothing imports them; assertNoImporters() resolves alias (@/components/X) and relative (./X, ../X) specifiers against the importing file, and the dead files themselves do not count as importers"
  - "The identity guard scans live source only: __tests__ dirs, *.test.* / *.spec.* files and e2e/ are out of scope (contact-form.spec legitimately uses example.com addresses)"
  - "The email subject and labels keep 'Portfolio Feedback' wording (plan: subject and field labels stay); only the footer lines and the sparkle changed"
  - "CI verification of 168f176 and 44612f3 is pending: no pixel changes, so there is no baseline checkpoint; the orchestrator pushes next and 07-26's CI check covers these commits"

patterns-established:
  - "Every guard exemption names its condition and is proven by a passing fixture (exempt) and a failing fixture (condition broken)"

# Copied verbatim from the PLAN's `requirements`.
requirements-completed: [SHELL-03, DSGN-10]

coverage:
  - id: D1
    description: "Root metadata title { default: 'Tim Lui · Developer & photographer', template: '%s · Tim Lui' } with the UI-SPEC description; homepage title matches /Tim Lui/"
    requirement: SHELL-03
    verification:
      - kind: e2e
        ref: "e2e/homepage.spec.ts 'should load the homepage successfully' (PW_PROD=1, chromium, 5/5)"
        status: pass
    human_judgment: false
  - id: D2
    description: "package.json author 'Tim Lui (https://github.com/tlex-web)' and the guard fails when it drifts from data/site.ts"
    requirement: SHELL-03
    verification:
      - kind: command
        ref: "npm run guard:identity -> identity: OK; selftest 'identity: a package.json author that drifts from data/site.ts fails'"
        status: pass
    human_judgment: false
  - id: D3
    description: "Feedback email footer reads '...via the contact form on Tim Lui's website' with no emoji"
    requirement: SHELL-03
    verification:
      - kind: command
        ref: "npm run guard:palette (emoji on) -> palette: OK; grep finds no 'portfolio website contact form' or sparkle in lib/"
        status: pass
    human_judgment: false
  - id: D4
    description: "Lint fails on any forbidden placeholder, a bad site.ts email or LinkedIn, or an import of a legacy dead file"
    requirement: SHELL-03
    verification:
      - kind: command
        ref: "node scripts/guards/selftest.mjs: 7 identity cases PASS (good + bad-placeholder, bad-wordmark, bad-author, bad-linkedin, bad-email, bad-dead-import)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Emoji rule runs in lint for all live source; dead v1 Footer heart exempt only while unimported"
    requirement: DSGN-10
    verification:
      - kind: command
        ref: "grep -c 'skip emoji' package.json = 0; npm run lint -> palette: OK; selftest 3 palette emoji cases PASS"
        status: pass
    human_judgment: false

duration: 6 min (ledger 980960d at 00:02:42Z to the Task 2 commit 44612f3 at 00:07:44Z), plus about 3 min of final checks (build, guard:tests)
completed: 2026-10-24
status: complete
---

# Phase 7 Plan 25: Identity metadata, author, email copy, forbidden-strings guard and emoji rule (build step 9, part 5)

**No placeholder identity can ship unnoticed. The root title is now `Tim Lui · Developer & photographer` with a `%s · Tim Lui` template, the `package.json` author is `Tim Lui (https://github.com/tlex-web)` and must match `data/site.ts`, and the feedback email footer names "the contact form on Tim Lui's website" without the sparkle. A new `check-identity.mjs` in lint rejects the PITFALLS-27 placeholders, a non-real site email or LinkedIn URL, and author drift. The palette emoji rule is switched on in lint. The v1 Header, Footer and GlassmorphismNav keep their placeholders until Phase 12, but they are exempt only while nothing imports them.**

## Performance

- **Duration:** 6 min from the ledger (`980960d`, 00:02:42Z) to the Task 2 commit (`44612f3`, 00:07:44Z), plus about 3 min of final checks.
- **Tasks:** 2/2 (Task 1 tracer, Task 2 auto)
- **Files modified:** 36 in the diff (6 source and package files, 2 new guard modules, 28 fixture files)

## Accomplishments

- **Identity copy (SHELL-03):**
  - `app/layout.tsx`: `title: { default: 'Tim Lui · Developer & photographer', template: '%s · Tim Lui' }` and the UI-SPEC description. The Next 16 docs (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`) confirm `default` is required with `template`, and the template applies only to child segments. No child segment sets a title today, so every route shows the default.
  - `package.json`: `"author": "Tim Lui (https://github.com/tlex-web)"`.
  - `lib/email.ts`: the HTML and plain-text footer lines read "This message was sent via the contact form on Tim Lui's website", and the collaboration line is "Interested in collaboration opportunities" without the sparkle. The subject, the `<title>`, the "New Portfolio Feedback" header and the field labels are unchanged, as the plan says.
  - `e2e/homepage.spec.ts`: the title assertion was rewritten to `toHaveTitle(/Tim Lui/)`. It was not deleted. No other spec asserts a title.
- **`scripts/guards/check-identity.mjs` (`--root <dir>`, dependency-free ESM):**
  - **Forbidden strings:** it scans `{app,components,lib,data}/**/*.{ts,tsx,mjs,js}` and `package.json`. It skips `__tests__` dirs, `*.test.*` and `*.spec.*` files, and e2e/ is out of scope.
    - Exact strings: `your.email@example.com`, `contact@example.com`, `Welcome to My Portfolio`, `My Portfolio`, `Your Name`.
    - Regexes: the split wordmark `(?<![A-Za-z])ortfolio`, plus quoted bare `https://github.com` and `https://(www.)linkedin.com` roots.
    - "Portfolio" and "portfolio" inside words still pass, because the lookbehind sees a letter.
  - **data/site.ts:** name must be `Tim Lui` and github `https://github.com/tlex-web`. The email must match `^[^@\s]+@[^@\s]+\.[^@\s]+$` and must not contain example.com. LinkedIn must match `^https://(www\.)?linkedin\.com/in/[^\s/]+/?$`. Tim's `https://www.linkedin.com/in/luitim/` passes, trailing slash included. No value in `data/site.ts` was changed.
  - **Author:** the `package.json` author must equal `${name} (${github})`.
  - **Output:** `identity: OK`, or one line per violation followed by `identity: N violations` and exit 1.
- **`scripts/guards/lib/legacy-dead-files.mjs`:**
  - Exports `LEGACY_DEAD_FILES` (`components/Header.tsx`, `components/Footer.tsx`, `components/GlassmorphismNav.tsx`, with the comment "v1 files with no importers since 07-22; deleted in Phase 12 (VERIFY-01)"), plus `assertNoImporters(root)` and `isLegacyDeadFile(rel)`.
  - `assertNoImporters` scans app/, components/ and lib/ for static, side-effect, re-export, dynamic `import()` and `require()` specifiers. It resolves `@/` and `./` or `../` specifiers against the importing file and returns `{ importer, target, line }` for each hit.
- **Emoji rule on (DSGN-10):**
  - `guard:palette` is now `node scripts/guards/check-palette.mjs` with no `--skip emoji`.
  - `check-palette.mjs` imports `LEGACY_DEAD_FILES` and `assertNoImporters`. It skips the emoji scan for a dead file only while nothing imports it. If an importer exists, it reports `<importer>:<line> emoji imported legacy file <target>` and the file's emoji.
  - The only live emoji was the email sparkle, removed in Task 1. The Footer heart (`components/Footer.tsx:186`) is in an exempt dead file. No Phosphor replacement was needed.
- **Lint chain:** `eslint . && npm run guard:parity && npm run guard:palette && npm run guard:contrast && npm run guard:identity && npm run guard:selftest`.

## Guard selftest cases (new, all PASS; selftest 55/55)

| # | Case | Fixture | Expect | Proof fragment |
|---|------|---------|--------|----------------|
| 1 | identity good: real record, derived author, in-word "Portfolio", `./SiteFooter` import, unimported legacy Footer with "My Portfolio", contact@example.com and a bare github href | `identity/good` | exit 0 | `identity: OK` |
| 2 | contact@example.com in a live component | `identity/bad-placeholder` | exit 1 | `components/ContactCard.tsx:3 forbidden contact@example.com` |
| 3 | split P + "ortfolio" text node | `identity/bad-wordmark` | exit 1 | `components/Brand.tsx:6 forbidden split wordmark` |
| 4 | author drifted (`.../someone-else`) | `identity/bad-author` | exit 1 | `package.json: author ... expected "Tim Lui (https://github.com/tlex-web)"` |
| 5 | bare `https://linkedin.com` in site.ts | `identity/bad-linkedin` | exit 1 | `data/site.ts:8 forbidden bare LinkedIn root href` + `links.linkedin ... is not a full` |
| 6 | `hello@example.com` in site.ts (not an exact forbidden string) | `identity/bad-email` | exit 1 | `data/site.ts: email "hello@example.com" is not a real address` |
| 7 | page imports `@/components/Header`, Shell imports `./Footer` | `identity/bad-dead-import` | exit 1 | `app/page.tsx:2 legacy file is imported again: components/Header.tsx`, `components/Shell.tsx:2 ... components/Footer.tsx`, `components/Header.tsx:6 forbidden split wordmark` |
| 8 | emoji in a non-legacy component | `palette/bad-emoji-component` | exit 1 | `components/Badge.tsx:3 emoji ❤` |
| 9 | same emoji in an unimported legacy `components/Footer.tsx` | `palette/emoji-legacy-dead` | exit 0 | `palette: OK` |
| 10 | legacy Footer imported by app/page.tsx | `palette/bad-emoji-legacy-imported` | exit 1 | `app/page.tsx:2 emoji imported legacy file components/Footer.tsx` + `components/Footer.tsx:3 emoji ❤` |

Fixture `package.json` files have no `name` field. No fixture is a Jest test file (see deviation 3).

## Legacy dead-file exemption evidence

- **No importers:** `assertNoImporters('.')` on the repo returns `[]`. A grep for `from '...(Header|Footer|GlassmorphismNav)'` in app/, components/ and lib/ finds nothing. `components/site/SiteChrome.tsx` imports `./SiteFooter`, which resolves to `components/site/SiteFooter` and does not count.
- **Placeholders the exemption covers** (forbidden-pattern grep over the three dead files):
  - `components/Header.tsx:58`: `ortfolio`
  - `components/GlassmorphismNav.tsx:110`: `ortfolio`
  - `components/Footer.tsx`:
    - line 15: `'https://github.com'`
    - line 28: `'https://linkedin.com'`
    - line 37: `mailto:your.email@example.com`
    - lines 83 and 148: `My Portfolio`
    - line 158: `mailto:contact@example.com`
    - line 186: emoji ❤
- **Outside the dead files:** before this plan, the only hits were the `package.json` author (fixed) and the `lib/email.ts` sparkle (removed). This matches the orchestrator's forecast, and no exemption had to be widened.

## Task Commits

1. **Task 1 (tracer): identity guard end to end**: `168f176` `feat(07-25): identity metadata, author, email copy and forbidden-strings guard (SHELL-03)`.
   - Tracer gate: every `<verify>` is automated and `human_verify_mode` is end-of-phase. `guard:identity` (identity: OK) and the selftest (52/52) were re-run green after the commit, and then work continued to Task 2.
2. **Task 2 (auto): emoji rule enforced in lint**: `44612f3` `feat(07-25): emoji rule enforced in lint (DSGN-10)`.

`git rev-list --count 980960d..HEAD` = 2, measured from the plan ledger. Nothing was pushed, and no `ci/*` branch or PNG was touched.

## Check outputs

| Check | Result |
|-------|--------|
| `npm run guard:identity` | `identity: OK` (exit 0) |
| `npm run guard:palette` (no skip) | `palette: OK` (exit 0); before Task 1 it reported `components/Footer.tsx:186 emoji ❤` and `lib/email.ts:123 emoji ✨` |
| `node scripts/guards/selftest.mjs` | 52/52 after Task 1; 55/55 after Task 2; 0 FAIL; 7 identity PASS lines |
| `npm run lint` (full chain, emoji on) | exit 0: eslint 0 errors and 54 warnings, all in files this plan did not touch (`npx eslint` on the 7 touched lintable files is clean); parity OK, palette OK, contrast OK (28 pairs), identity OK, selftest 55/55 |
| `npm run type-check` | exit 0 |
| `npx jest --silent` | 13 suites, 107/107 passed |
| `PW_PROD=1 npx playwright test e2e/homepage.spec.ts --project=chromium` | 5 passed (after both tasks) |
| `npm run build` | exit 0 (9 routes + proxy); `public/service-worker.js` restored with `git checkout --` |
| `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` | `test-count: jest 107 + e2e 98 = 205 (baseline 91)`, `test-count: OK`; jest-results.json deleted, never staged |
| Acceptance T1 | author line, `"guard:identity"`, `template: '%s · Tim Lui'` and `toHaveTitle(/Tim Lui/)` each grep 1; `check-identity --root .../bad-dead-import` exits 1 |
| Acceptance T2 | `grep -c "skip emoji" package.json` = 0; `check-palette.mjs` has `import { LEGACY_DEAD_FILES, assertNoImporters }` |

## Files Created/Modified

- `app/layout.tsx`: metadata title object and description.
- `lib/email.ts`: footer lines (HTML and text) and the sparkle removed.
- `package.json`: author, `guard:identity`, lint chain, `guard:palette` without the skip.
- `e2e/homepage.spec.ts`: title assertion rewritten.
- `scripts/guards/check-identity.mjs`: new.
- `scripts/guards/lib/legacy-dead-files.mjs`: new.
- `scripts/guards/check-palette.mjs`: emoji exemption tied to `assertNoImporters`, header doc updated.
- `scripts/guards/selftest.mjs`: 10 new cases.
- `scripts/guards/__selftest__/identity/**` (7 fixtures) and `scripts/guards/__selftest__/palette/{emoji-legacy-dead,bad-emoji-component,bad-emoji-legacy-imported}/**`.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Correctness] Relative specifiers are resolved, not matched by name**
- **Found during:** Task 1.
- **Issue:** the plan says to match `./<Name>` or `../<Name>` specifiers. A plain name match would flag a future `components/site/Footer.tsx` imported as `./Footer` from components/site, which is not the legacy file.
- **Fix:** `assertNoImporters` resolves `./` and `../` against the importing file's directory, and `@/` against the root, then compares the result (without extension) to `LEGACY_DEAD_FILES`. The dead files are not counted as importers of each other. The `good` fixture proves `./SiteFooter` passes, and `bad-dead-import` proves a relative `./Footer` from components/ fails.
- **Commit:** `168f176`.

**2. [Rule 2 - Missing proof] Added a 7th identity case and a 3rd palette emoji case**
- **Found during:** Tasks 1 and 2.
- **Issue:** none of the 6 listed identity fixtures exercised the email shape check: `bad-linkedin` covers LinkedIn, but no case had a non-real email that is not an exact forbidden string. Task 2's two listed cases did not prove the "imported legacy file" branch.
- **Fix:** added `identity/bad-email` (`hello@example.com`) and `palette/bad-emoji-legacy-imported`. The `good` identity fixture also carries an unimported legacy Footer with placeholders, so the identity exemption is proven passing as well as failing.
- **Commits:** `168f176`, `44612f3`.

**3. [Rule 3 - Blocking] A test-file fixture was dropped before commit**
- **Found during:** Task 1.
- **Issue:** I first added `identity/good/components/__tests__/Contact.test.tsx` to prove test files are out of scope. Jest's `testMatch` (`**/__tests__/**`) would have collected it as an empty suite, and failed it.
- **Fix:** removed it before committing. Test-file exclusion is covered by the walker code (`__tests__` dirs and `*.test.*` / `*.spec.*` skipped) and by the real repo passing with example.com addresses in tests. No fixture is a Jest test file.
- **Commit:** none (never committed).

**4. [Note] Extra export `isLegacyDeadFile(rel)`**
- A small helper shared by the identity guard. It is additive to the plan's `LEGACY_DEAD_FILES` and `assertNoImporters` exports.

---

**Total deviations:** 3 auto-fixed (1 correctness, 1 missing proof, 1 blocking) and 1 note.
**Impact on plan:** no scope change. The guards are stricter and better proven than specified.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Ready for 07-26 (HOME-08 performance baseline and phase close). Its CI check covers `168f176` and `44612f3`.
- CI verification of these two commits is pending; the orchestrator pushes next.
- No pixel changes are expected, because title, author and email body are not in the screenshots.

## Self-Check: PASSED

- FOUND: scripts/guards/check-identity.mjs, scripts/guards/lib/legacy-dead-files.mjs, scripts/guards/__selftest__/identity/good/data/site.ts, scripts/guards/__selftest__/palette/emoji-legacy-dead/components/Footer.tsx
- FOUND: 168f176, 44612f3 (ancestors of HEAD; `check evaluation-scope --plan 07-25 --commits-only` lists both)
- All acceptance criteria for Tasks 1 and 2 re-run PASS; plan-level verification (lint with every guard incl. emoji and identity, homepage spec) PASS
