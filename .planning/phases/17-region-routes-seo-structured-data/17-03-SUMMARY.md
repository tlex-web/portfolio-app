---
phase: 17-region-routes-seo-structured-data
plan: 03
subsystem: seo
tags: [json-ld, schema-dts, structured-data, csp, xss-escape, next-app-router]

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: the 16-09 package-legitimacy gate and whole-entry lockfile check this plan adapts
provides:
  - schema-dts 2.1.0 pinned exact in devDependencies (schema-dts-lib 1.1.0 transitively), type-only
  - lib/json-ld.ts with jsonLdHtml (the one escaping serializer), siteGraph (Person + WebSite), siteRights, PERSON_ID, WEBSITE_ID
  - the site-wide JSON-LD data block in app/(site)/layout.tsx
  - lib/__tests__/json-ld.test.ts, the Wave 0 SEO-04 test, with the keysDeep and blocksOf helpers
affects: [17-13, 17-14, seo, structured-data]

actuals:
  tokens: 3800     # chars/4 over the realized diff e0c4cc7..667a83c (15,051 chars)
  tasks: 2         # Tasks 2 and 3 executed here; Task 1 answered before dispatch
  commits: 3       # MEASURED: git rev-list --count e0c4cc7..667a83c
plan_head_before: e0c4cc7efbf98d5b1400f3570d6d8c85b1512712
plan_head_after: 667a83c3e71c6445ac51385b7bb963aaa440e6fc

tech-stack:
  added: [schema-dts@2.1.0 (devDependency, type-only), schema-dts-lib@1.1.0 (transitive)]
  patterns:
    - "One serializer: every JSON-LD block goes through jsonLdHtml (JSON.stringify plus '<' to \\u003c)"
    - "Per-node rights rule: creator, copyrightNotice and creditText on every non-Person node; Person exempt"
    - "Native application/ld+json data block, no nonce, never next/script"

key-files:
  created:
    - lib/json-ld.ts
    - lib/__tests__/json-ld.test.ts
  modified:
    - app/(site)/layout.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "The site-wide block meets D-16's creator, copyrightNotice and creditText through its WebSite node; the Person node carries none of the three because schema.org defines them on CreativeWork only (per-node exemption, pinned by json-ld.test.ts)"
  - "The WebSite's copyrightNotice is siteRights(), the same wording and year expression SiteFooter prints, so the markup never disagrees with the printed footer (D-17)"
  - "The site graph lives in app/(site)/layout.tsx, so the root not-found and global-error carry no identity markup (measured: /no-such-page 404 has 0 ld+json blocks)"

patterns-established:
  - "keysDeep(value) and blocksOf(html) in lib/__tests__/json-ld.test.ts: later JSON-LD blocks (17-13, 17-14) extend this file"

requirements-completed: [SEO-04]

coverage:
  - id: D1
    description: "schema-dts 2.1.0 installed exactly as Tim verified, lockfile changed only in the root devDependencies and the schema-dts and schema-dts-lib entries"
    requirement: SEO-04
    verification:
      - kind: other
        ref: "whole-entry lockfile check (Task 2 verify one-liner) -> 'lockfile: only schema-dts, schema-dts-lib and the root devDependencies changed', exit 0"
        status: pass
      - kind: other
        ref: "npm ls schema-dts schema-dts-lib -> schema-dts@2.1.0 / schema-dts-lib@1.1.0 (2 matches)"
        status: pass
      - kind: other
        ref: "npm run guard:parity -> parity: OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "jsonLdHtml escapes every '<' as \\u003c, round-trips through JSON.parse, and keeps a </script><script> breakout inside one block"
    requirement: SEO-04
    verification:
      - kind: unit
        ref: "lib/__tests__/json-ld.test.ts#jsonLdHtml, the one serializer (D-16, T-17-06)"
        status: pass
    human_judgment: false
  - id: D3
    description: "siteGraph: one Person (name, role, url, two profiles, no rights keys) and one WebSite (author/creator by @id, creditText site.name, copyrightNotice the footer line); no license, email, address, homeLocation or location text"
    requirement: SEO-04
    verification:
      - kind: unit
        ref: "lib/__tests__/json-ld.test.ts#siteGraph / per-node rule / disclosure describes"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every content page carries exactly one un-nonced ld+json block; no CSP violation, console error or axe finding on the audited routes"
    requirement: SEO-04
    verification:
      - kind: unit
        ref: "lib/__tests__/json-ld.test.ts#source rules (D-16, D-21)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/audit.spec.ts -g \"(/roadmap|/projects/box|/photos/matterhorn-from-zermatt): axe\" --project=chromium --project=firefox (6 passed)"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-11-23
status: complete
---

# Phase 17 Plan 03: schema-dts Install and Site-wide JSON-LD Summary

**schema-dts 2.1.0 pinned as a type-only devDependency after Tim's verification, plus the one `<`-escaping JSON-LD serializer and a Person + WebSite graph rendered as an un-nonced data block on every `(site)` page**

## Performance

- **Duration:** 7 min
- **Started:** 2026-11-23T22:18:15Z
- **Completed:** 2026-11-23T22:25:48Z
- **Tasks:** 3 of 3 (Task 1 answered by Tim before dispatch; Tasks 2 and 3 executed here)
- **Files modified:** 5

## Task 1: Tim's package-legitimacy reply (D-21)

The orchestrator showed Tim the blocking-human gate before this dispatch (AskUserQuestion, 2026-11-23). The question: "17-03 Task 1 (D-21 package gate): may I install exactly schema-dts@2.1.0, pinned exact in devDependencies via the bundled npm and imported with `import type` only, plus its one dependency schema-dts-lib@1.1.0? …" with the options "verified (Recommended)" and "Stop: concern".

Tim's literal selected reply: **"verified (Recommended)"**

Registry facts the orchestrator re-checked the same day (`npm view`, bundled npm) and showed Tim in the question:
- **schema-dts 2.1.0**: Apache-2.0, repository git+https://github.com/google/schema-dts.git, maintainer google-wombot, unpacked 1,016,322 B, dependencies {"schema-dts-lib":"^1.1.0"}, no install/postinstall script (`prepare` = `mkdirp lib/`, runs only in a git checkout), dist-tag latest = 2.1.0.
- **schema-dts-lib 1.1.0**: Apache-2.0, same repository, unpacked 15,075 B, dependencies {}, no install scripts.

## Accomplishments

- schema-dts 2.1.0 installed with the bundled npm (11.20.0), exact pin, lockfile bounded to the two packages and the root devDependencies
- `lib/json-ld.ts`: `jsonLdHtml` (the single serializer), `siteGraph()`, `siteRights()`, `PERSON_ID`, `WEBSITE_ID`, importing schema-dts through `import type` only
- `app/(site)/layout.tsx` renders `<script type="application/ld+json">` with `jsonLdHtml(siteGraph())` before `SiteChrome`. It has no nonce and does not use next/script
- `lib/__tests__/json-ld.test.ts` (25 rows) pins the escape, the graph contents, the Person exemption, the disclosure rules and the source rules

## Task 2 records

**Lockfile check** (run before the task commit, HEAD holding the pre-install lockfile):
```
lockfile: only schema-dts, schema-dts-lib and the root devDependencies changed
```
Full lockfile diff: +21 lines, 0 removed. The root entry's devDependencies gained `"schema-dts": "2.1.0"`. A new `node_modules/schema-dts` entry has version 2.1.0, `dev: true`, license Apache-2.0, integrity `sha512-Y/NvOvuJ…Jt9ow==` and dependencies `{"schema-dts-lib":"^1.1.0"}`. A new `node_modules/schema-dts-lib` entry has version 1.1.0, `dev: true`, license Apache-2.0, integrity `sha512-Nx00FDPH…k1G+Q==` and engines node >=14.0.0. No other entry changed. package.json changed by one line (`"schema-dts": "2.1.0"` in devDependencies).

**`npm ls schema-dts schema-dts-lib`:**
```
portfolio-app@1.0.0 C:\Users\tim\MyDocuments\Programming\portfolio_app
`-- schema-dts@2.1.0
  `-- schema-dts-lib@1.1.0
```
**`npm run guard:parity`:** `parity: OK`.

The bundled npm printed one notice: `install-scripts: @parcel/watcher@2.6.0 (install: node-gyp rebuild)` is not yet covered by allowScripts. That package was already in the tree before this install and is unrelated to schema-dts. Neither new package has an install script.

## Task Commits

1. **Task 1: Tim verifies schema-dts 2.1.0 and schema-dts-lib 1.1.0** - no commit (answered before dispatch: "verified (Recommended)")
2. **Task 2: Install schema-dts 2.1.0 with the bundled npm and bound the lockfile diff** - `44f63c4` (chore)
3. **Task 3: escaping serializer, site graph, Wave 0 test** (TDD)
   - RED `0cf5abd` (test): json-ld.test.ts plus a compiling lib/json-ld.ts skeleton (naive serializer, empty graph)
   - GREEN `667a83c` (feat): the real serializer and graph, and the layout script

## TDD record (Task 3)

- **RED `0cf5abd`:** `npx jest lib/__tests__/json-ld.test.ts` exit 1, 13 failed / 12 passed of 25. The failures are assertion-level failures on the planned behavior: `expect(received).not.toContain("<")` on the breakout fixture, `Expected substring: "\\u003c/script>"`, `SyntaxError: Unterminated string in JSON` from blocksOf (the unescaped breakout closed the block early, which is the T-17-06 defect), `toHaveLength(1)` on the empty graph's Person/WebSite lookups, `Expected: "© 2026 Tim Lui. All rights reserved."` for siteRights, and the missing layout script. The 12 passing rows are the import-type source rule, the keysDeep helper row, and rows that pass trivially on an empty graph (escape of siteGraph, the per-node "every non-Person node" loops, disclosure checks). The test also has a row asserting the graph has at least one non-Person node, which failed in RED, so the loops cannot pass on an empty graph undetected. **Semantic assessment:** the target rows ran and failed on their planned assertions, not on a load, syntax or discovery fault. The skeleton existed so the suite would load and fail on its assertions rather than on "Cannot find module". The RED is valid.
- **GREEN `667a83c`:** 25/25 pass.
- **REFACTOR:** none needed.
- Gate log: `test(17-03)` 0cf5abd precedes `feat(17-03)` 667a83c (667a83c descends from 0cf5abd).

## Files Created/Modified

- `lib/json-ld.ts` - the serializer, site graph, rights line and node ids (pure, type-only schema-dts import)
- `lib/__tests__/json-ld.test.ts` - the SEO-04 Wave 0 test with keysDeep and blocksOf
- `app/(site)/layout.tsx` - the site-wide data block and its doc comment (why this layout, why the 404 has none, why no nonce)
- `package.json`, `package-lock.json` - schema-dts 2.1.0 exact devDependency

## Decisions Made

- Person exemption is per node, recorded in the lib doc block and pinned by three test rows (the Person has no creator, copyrightNotice or creditText) plus three rows requiring them on every non-Person node.
- `jsonLdHtml` accepts `Graph | WithContext<Thing>` so the 17-13/17-14 blocks (ImageObject, ImageGallery, SoftwareSourceCode) type-check through the same function.
- The layout doc comment says "JSON-LD data block" instead of repeating the MIME string. This keeps the acceptance grep (`application/ld+json` occurs exactly once in the layout) meaningful.

## Deviations from Plan

None that changed scope. Two notes:
- The RED commit included a compiling skeleton of `lib/json-ld.ts` alongside the test, so RED fails on assertions rather than on module resolution (see TDD record). The GREEN commit replaced it entirely.
- After the audit run, the layout doc comment was reworded (no code change) so the `application/ld+json` grep prints 1. Jest, prettier and eslint were re-run on it before the GREEN commit.

**Total deviations:** 0 auto-fixed. **Impact on plan:** none.

## Verification

- `npx jest lib/__tests__/json-ld.test.ts`: 25 passed
- Full `npx jest`: 117 suites, 2081 tests passed
- `npm run type-check`: exit 0
- `npm run lint` (all guards, data:check, test-count scan): exit 0
- `PW_PROD=1 npx playwright test e2e/audit.spec.ts -g "(/roadmap|/projects/box|/photos/matterhorn-from-zermatt): axe" --project=chromium --project=firefox`: 6 passed (axe, CLS, links, images, CSP, console). `public/service-worker.js` restored after the build.
- Live check on `next start -p 3017` (stopped afterwards; nothing left on :3000 or :3017): `/roadmap`, `/` and `/photos/matterhorn-from-zermatt` each serve exactly 1 block, `attrs[type="application/ld+json"]` with no nonce attribute; `/no-such-page` (404) serves 0 blocks. The /roadmap block parses to the expected Person + WebSite graph with `copyrightNotice` "© 2026 Tim Lui. All rights reserved."
- `node scripts/ci/check-snapshot-commit.mjs --none`: OK (0 changed) after each task commit
- Acceptance greps: `"schema-dts": "2.1.0"` in package.json 1; `application/ld+json` in layout 1; `^import type .*from 'schema-dts'` 1; value import from schema-dts 0; `nonce=` in layout 0; `copyrightNotice` in lib 4, in test 6

## Issues Encountered

None.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- 17-13 (photo and region blocks) and 17-14 (case studies) extend `lib/__tests__/json-ld.test.ts` and use `jsonLdHtml`. `keysDeep` and `blocksOf` are in place.
- WebKit runs only in CI. It has not run locally on the audited routes; CI covers it.

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-23*

## Self-Check: PASSED

- FOUND: lib/json-ld.ts, lib/__tests__/json-ld.test.ts, app/(site)/layout.tsx, package.json, package-lock.json
- FOUND: 44f63c4, 0cf5abd, 667a83c (all ancestors of HEAD; evaluation-scope resolves all three for 17-03)
