---
phase: 12-contact-edge-pages-cleanup-verification
plan: 27
subsystem: infra
tags: [npm, supply-chain, source-map-js, baseline-browser-mapping, copy, proxy, edge-404]
status: complete

requires:
  - phase: 12-contact-edge-pages-cleanup-verification
    provides: "12-FOLLOWUP-SCOPE groups E and F plus the C1/IN-02 note; 12-06's registry-facts table and version-scoped override form; 12-01's only-quoted-copy-ships rule"
provides:
  - "source-map-js 1.2.2 and baseline-browser-mapping 2.11.35 in the lockfile, integrity equal to what Tim was shown, floors raised"
  - "## Resolved values (follow-up): pkg.source-map-js, pkg.baseline-browser-mapping, copy.field-error-name-long, meta.global-error-title, edge.header-guard (read by 12-28, 12-29, 12-32, 12-34)"
affects: [12-28, 12-29, 12-32, 12-34]

actuals:
  tokens: 6200
  tasks: 3
  commits: 1
plan_head_before: 3900ab925da0ef80694c2df2ab53da60254f2273
plan_head_after: 1ae83783f7c19e838bc696850e4f59859f7b3a5f

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/phases/12-contact-edge-pages-cleanup-verification/12-27-SUMMARY.md
  modified:
    - package-lock.json
    - scripts/guards/version-floors.json
    - .planning/phases/12-contact-edge-pages-cleanup-verification/deferred-items.md

key-decisions:
  - "Tim approved both npm advisory bumps (source-map-js 1.2.2, baseline-browser-mapping 2.11.35, not the aged 2.11.27); applied as a lockfile-only npm update, no override needed, floors raised in the same commit"
  - "IN-01 copy (12-28): name over 100 characters reads \"Shorten your name to 100 characters (now {n}).\" with {n} = formatCount(value.length)"
  - "IN-05 title (12-32): app/global-error.tsx titles the tab \"Something went wrong · Tim Lui\""
  - "404 header guard (12-29): option A, drop the purpose: prefetch entry from proxy config.matcher[0].missing; the residual becomes accepted risk AR-12-02 and IN-02 is recorded deferred, not fixed (12-34)"

patterns-established: []

requirements-completed: [CONTACT-02, CONTACT-03, EDGE-01, VERIFY-01]

coverage:
  - id: D1
    description: "source-map-js 1.2.2 and baseline-browser-mapping 2.11.35 installed with the integrity Tim was shown; floors raised; both advisories gone from npm audit"
    requirement: VERIFY-01
    verification:
      - kind: other
        ref: "npm ls source-map-js baseline-browser-mapping --all -> only 1.2.2 / 2.11.35; lockfile integrity equals the shown sha512 strings; node scripts/guards/check-install-parity.mjs -> parity: OK"
        status: pass
      - kind: other
        ref: "Task 3 verify 2 (npm audit --json | node reader) -> total 42, approved source-map-js,baseline-browser-mapping, still listed none"
        status: pass
    human_judgment: false
  - id: D2
    description: "Tim's four answers quoted and recorded as five Resolved values (follow-up) rows in the pinned form"
    requirement: VERIFY-01
    verification:
      - kind: other
        ref: "Task 3 verify 3 (resolved values node reader) -> resolved values OK"
        status: pass
    human_judgment: false
  - id: D3
    description: "The bumped tree passes lint (with guards), type-check, the full Jest suite and the shell spec on a fresh production build"
    verification:
      - kind: unit
        ref: "npm run lint && npm run type-check && npx jest --silent -> 102 suites, 1658 tests passed"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/shell.spec.ts --project=chromium -> 33 passed, fresh build"
        status: pass
    human_judgment: false

duration: 3min (Task 3 continuation; Task 1 ran in an earlier executor)
completed: 2026-11-03
---

# Phase 12 Plan 27: Follow-up Decision Packet and npm Advisory Bumps Summary

**Tim approved both prod-tree advisory bumps (source-map-js 1.2.1 to 1.2.2, baseline-browser-mapping 2.10.13 to 2.11.35), which landed as a six-line lockfile change with matching integrity and raised floors (npm audit 44 to 42). He also supplied the IN-01 and IN-05 strings verbatim and picked option A for the 404 header guard, so IN-02 is recorded deferred under AR-12-02.**

## Performance

- **Duration:** about 3 min for Task 3 (continuation, 2026-11-03T12:18:00Z to 12:21Z); Task 1 and the Task 2 checkpoint ran earlier the same day
- **Started:** 2026-11-03T12:18:00Z (continuation)
- **Completed:** 2026-11-03T12:22Z
- **Tasks:** 3 of 3 (Task 1 tracer packet, Task 2 blocking-human checkpoint, Task 3 apply and record)
- **Files modified:** 4 (package-lock.json, scripts/guards/version-floors.json, deferred-items.md, this SUMMARY)

## Accomplishments

- The two approved advisories are patched: GHSA-68fv-2mgg-jv7q (source-map-js, high) and GHSA-w5vr-8v7q-w6rv (baseline-browser-mapping, moderate) are gone from `npm audit`.
- `scripts/guards/version-floors.json` now floors `source-map-js` at 1.2.2 and `baseline-browser-mapping` at 2.11.35, and guard:parity passes against the lockfile.
- Tim's answers are on record as the five `## Resolved values (follow-up)` rows that 12-28 (IN-01), 12-29 (C1, IN-02), 12-32 (IN-05) and 12-34 read.

## npm audit before

Recorded 2026-11-03 at HEAD `3900ab9`, before any install.

`npm audit --json` `metadata.vulnerabilities`:

| total | critical | high | moderate | low | info |
|-------|----------|------|----------|-----|------|
| 44 | 0 | 5 | 35 | 4 | 0 |

Advisory rows for the two packages:

| Package | GHSA | Severity | Vulnerable range | fixAvailable | Title |
|---------|------|----------|------------------|--------------|-------|
| source-map-js | GHSA-68fv-2mgg-jv7q | high (CVSS 7.5) | `>=1.0.0 <1.2.2` | true | event-loop denial of service through indexed source-map section offsets |
| baseline-browser-mapping | GHSA-w5vr-8v7q-w6rv | moderate | `>=2.0.0 <2.11.0` | true | process termination on invalid input causes denial of service |

`npm ls source-map-js baseline-browser-mapping --all` (one installed copy each, deduped):

```
+-- @tailwindcss/postcss@4.3.0
| `-- @tailwindcss/node@4.3.0
|   `-- source-map-js@1.2.1 deduped
+-- autoprefixer@10.5.0
| `-- browserslist@4.28.2
|   `-- baseline-browser-mapping@2.10.13 deduped
+-- next@16.4.2
| `-- baseline-browser-mapping@2.10.13
`-- postcss@8.5.23
  `-- source-map-js@1.2.1
```

Dependent ranges (package-lock.json): postcss `source-map-js ^1.2.1`, @tailwindcss/node `source-map-js ^1.2.1`, next `baseline-browser-mapping ^2.9.19`, browserslist `baseline-browser-mapping ^2.10.12`. Both proposals below sit inside every range, so a lockfile-only `npm update` can apply them with package.json unchanged.

## Registry facts

Checked 2026-11-03 with `npm view <pkg> dist-tags time --json` and `npm view <pkg>@<version> version dist.integrity dist.tarball _npmUser maintainers repository.url dist.attestations --json`. A version published under 30 days before today is [SUS] (age only), the 12-06 rule.

| Package | Current | Proposed | Published | Publisher / repository | Integrity | Dist-tag | Advisory | Verdict |
|---------|---------|----------|-----------|------------------------|-----------|----------|----------|---------|
| source-map-js | 1.2.1 | 1.2.2 | 2026-09-30T14:08Z (34 days ago; 1.2.1 was 2024-09-08) | `_npmUser` 7rulnik, sole maintainer 7rulnik (same as 1.2.1); github.com/7rulnik/source-map-js; no provenance attestation (none on 1.2.1 either) | `sha512-KGj/8Y43x35aZVDtt+J4mK1hoLGHULMYfSkODJNQjNDC3oW1PqPoxMwo0pLUsWM/UEGzON/NxeHywEfNXNP3Vw==` | `latest` | GHSA-68fv-2mgg-jv7q, fixed at 1.2.2 | [OK] |
| baseline-browser-mapping | 2.10.13 | 2.11.35 | 2026-11-02T22:41Z (1 day ago) | `_npmUser` GitHub Actions trusted publisher (OIDC), maintainer tonypconway (same as 2.10.13); github.com/web-platform-dx/baseline-browser-mapping; SLSA v1 provenance attestation present | `sha512-GNk8KX52CHqeNKGk8+7tZnQab/2k1t/BgrUHPKNdijzpEhF1saPQZHVKb6m5loSAxB39gyrTYw34Qf9CQ3u1qQ==` | `latest` (`beta` is 2.11.0-beta.0) | GHSA-w5vr-8v7q-w6rv, fixed at 2.11.0 | [SUS] (age only) |

Notes for the baseline-browser-mapping row:

- It is a data package (browser-version and Baseline feature dates) and publishes every few days: 35 releases in the 2.11 line since 2.11.0 (2026-07-21), the last eight between 2026-10-08 and 2026-11-02. So `latest` is almost always under 30 days old, and [SUS] here reflects cadence, not a publisher change. The publisher and repository match 2.10.13, and the release carries a provenance attestation.
- An aged alternative, if you prefer one over 30 days old: 2.11.27, published 2026-10-01T19:28Z (33 days ago), same publisher and repository, integrity `sha512-ElY12DaROGuan+lMmZ8Cvo/ZUbXPe7Enc/9VU/b1T3Kp4dwytRcNdR8DoSJN5SNJT/CuvcCA0DHDVmMOCePdRQ==`. It also fixes the advisory. Tim did not take it (he chose 2.11.35).
- A newer release could appear before Task 3 runs. If `npm update` then resolved something other than the approved version, Task 3 step 2 would restore the lockfile and pin the approved version with a version-scoped override, so the installed integrity is always the one shown here. It was not needed (see "Apply path" below).

`npm view` does not report weekly downloads, so that column is omitted (as in 12-06).

## Copy proposals

None of these ships until Tim's literal reply approves it (12-01 rule). Tim's choices are in `## Answers (verbatim)`.

### copy.field-error-name-long (IN-01)

Today `issueMessage` in `components/contact/SummitRegister.tsx` returns `Enter your name.` for every name issue, including too long. The zod limit is 100 characters and the input has `maxLength={100}`, so only a server answer or programmatic input reaches this message. The model is the message field's approved cause-plus-fix style: `Shorten the message to 2,000 characters (now {formatCount(n)}).`

| Option | String | Note |
|--------|--------|------|
| 1 (recommended) | `Shorten your name to 100 characters (now {n}).` | `{n}` = `formatCount(value.length)`; matches the message branch exactly |
| 2 | `Shorten your name to 100 characters.` | no count |
| 3 | `Use 100 characters or fewer for your name.` | no count, different verb |

### meta.global-error-title (IN-05)

`app/global-error.tsx` replaces the root layout, renders no `<title>`, and cannot use the root `'%s · Tim Lui'` title template (Next does not support a metadata export there), so the full string is written out.

| Option | String | Note |
|--------|--------|------|
| 1 (recommended) | `Something went wrong · Tim Lui` | ErrorBody's approved h1 plus the template suffix |
| 2 | `Error · Tim Lui` | the page kicker |
| 3 | `Site error · Tim Lui` | |

## 404 header guard options

**Finding.** The deferred C1 note's second mechanism ("make the 404 render ignore the header when the proxy did not set it", i.e. ignore `x-edge-section` on a `next-router-prefetch` request) cannot be built in Next 16.4. `node_modules/next/dist/server/async-storage/request-store.js` seals the userland `headers()` view with `HIDDEN_REQUEST_HEADERS`, which spreads `FLIGHT_HEADERS` from `client/components/app-router-headers.js` (`rsc`, `next-router-state-tree`, `next-router-prefetch`, `next-hmr-refresh`, `next-router-segment-prefetch`). So `app/not-found.tsx` cannot see `next-router-prefetch` and cannot tell a prefetch it should distrust from a normal render.

Today `proxy.ts` `config.matcher[0].missing` skips the proxy for requests carrying `next-router-prefetch` or `purpose: prefetch`, and the source pattern skips `api…`, `_next/…`, `images/`, `terrain/` and `media/`. On those requests the proxy's delete of a visitor-sent `x-edge-section` (proxy.ts, the T-12-02 line) never runs, and no CSP header is set.

| Option | Change | Delivers IN-02 as written | Cost |
|--------|--------|---------------------------|------|
| A (recommended) | Drop the `{ type: 'header', key: 'purpose', value: 'prefetch' }` entry from `config.matcher[0].missing`, so document prefetches pass the proxy (CSP header present, visitor copy of `x-edge-section` deleted). Narrow the "only the proxy may name the section" comments to requests the proxy handles. Close T-12-02 with an accepted residual, AR-12-02: a forged header still picks the generic 404's context link in the sender's own RSC-prefetch payload, an `/api…` 404, or a missing-static-file 404 under `images/`, `terrain/` or `media/`. The allow-list has two values (`photos`, `projects`) and the result is only ever seen by the sender. | no | Smallest change: one matcher entry and comments, no 404 render change, no new API. |
| C | A, plus a per-build proxy token: on a miss the proxy sets `x-edge-proxy: <token>` beside the section (and deletes any visitor copy of both); `parseEdgeSection` accepts the section only when the marker equals the token. The token is generated once in `next.config.ts` (`process.env.EDGE_PROXY_TOKEN` when set, else random bytes) and inlined through the `env` config key. | yes | `env` is a legacy Next config API; a random token per build may defeat the Turbopack build cache (12-29 would measure warm builds before and after); a token mismatch would drop the context link (the not-found e2e on every CI build catches that); about five files. |

IN-02 asks that the 404 ignore a visitor-sent `x-edge-section` wherever the proxy did not run; A does not do that (on the paths the proxy skips the 404 still trusts the header, which becomes accepted risk AR-12-02, and 12-34 then records IN-02 deferred, not fixed); only C does.

## Answers (verbatim)

Tim answered the Task 2 checkpoint on 2026-11-03 through a four-question dialog. His selections, quoted exactly:

| # | Question | Tim's answer (verbatim) |
|---|----------|-------------------------|
| 1 | npm advisory bumps (source-map-js 1.2.1→1.2.2; baseline-browser-mapping 2.10.13→2.11.35, alternative 2.11.27) | "Approve both, 2.11.35 (Recommended)" |
| 2 | IN-01 name-over-100-characters error text | "Shorten your name to 100 characters (now {n})." |
| 3 | IN-05 global-error browser-tab title | "Something went wrong · Tim Lui" |
| 4 | 404 header guard (C1 + IN-02), A or C | "A (Recommended)" |

Every key was answered, so no re-ask was needed and no key is `not supplied` or `pending Tim`. Answer 1 approves both packages, with baseline-browser-mapping at 2.11.35 (not the aged alternative 2.11.27). Answer 4 picks option A knowing it does not deliver IN-02 as written: the residual becomes AR-12-02, and 12-34 records IN-02 deferred, not fixed.

## Resolved values (follow-up)

| Key | Status | Value | Tim's words |
|-----|--------|-------|-------------|
| pkg.source-map-js | approved | `1.2.2` | "Approve both, 2.11.35 (Recommended)" |
| pkg.baseline-browser-mapping | approved | `2.11.35` | "Approve both, 2.11.35 (Recommended)" |
| copy.field-error-name-long | supplied | `Shorten your name to 100 characters (now {n}).` | "Shorten your name to 100 characters (now {n})." |
| meta.global-error-title | supplied | `Something went wrong · Tim Lui` | "Something went wrong · Tim Lui" |
| edge.header-guard | option A | `drop purpose: prefetch from the proxy matcher; residual AR-12-02` | "A (Recommended)" |

`{n}` in copy.field-error-name-long is `formatCount(value.length)`, as proposed in option 1.

## Apply path (Task 3)

- **Step 1 path used, step 2 not needed.** `npm update source-map-js baseline-browser-mapping` resolved exactly the approved versions: no newer baseline-browser-mapping than 2.11.35 was picked up, so no version-scoped override was written and package.json is unchanged.
- `npm ls source-map-js baseline-browser-mapping --all` after the update: `source-map-js@1.2.2` under postcss and (deduped) @tailwindcss/node; `baseline-browser-mapping@2.11.35` under next and (deduped) browserslist. No other copy.
- Lockfile integrity, read from `packages['node_modules/<pkg>'].integrity`: source-map-js `sha512-KGj/8Y43x35aZVDtt+J4mK1hoLGHULMYfSkODJNQjNDC3oW1PqPoxMwo0pLUsWM/UEGzON/NxeHywEfNXNP3Vw==`, baseline-browser-mapping `sha512-GNk8KX52CHqeNKGk8+7tZnQab/2k1t/BgrUHPKNdijzpEhF1saPQZHVKb6m5loSAxB39gyrTYw34Qf9CQ3u1qQ==`. Both equal the strings Tim was shown.
- `git diff --stat package-lock.json`: `1 file changed, 6 insertions(+), 6 deletions(-)`, only the two packages' `version`, `resolved` and `integrity` lines.
- Floors added in the same commit (`1ae8378`): `"source-map-js": "1.2.2"`, `"baseline-browser-mapping": "2.11.35"`. `node scripts/guards/check-install-parity.mjs` prints `parity: OK`.

## npm audit after

Recorded 2026-11-03 at `1ae8378`.

| total | critical | high | moderate | low | info |
|-------|----------|------|----------|-----|------|
| 42 | 0 | 4 | 34 | 4 | 0 |

- source-map-js: not listed (GHSA-68fv-2mgg-jv7q gone; high 5 to 4).
- baseline-browser-mapping: not listed (GHSA-w5vr-8v7q-w6rv gone; moderate 35 to 34).
- The total drops by exactly the two approved advisories (44 to 42). The remaining high rows (brace-expansion, browserslist, js-yaml, ws) are the dev-tree and semver-major items 12-FOLLOWUP-SCOPE F leaves out of scope.

## Verification

| Check | Result |
|-------|--------|
| `npm run lint` (with the guard chain) | exit 0 |
| `npm run type-check` | exit 0 |
| `npx jest --silent` | 102 suites, 1658 tests passed |
| npm audit reader (verify 2) | `total 42 approved source-map-js,baseline-browser-mapping still listed none` |
| Resolved values reader (verify 3) | `resolved values OK` |
| `PW_PROD=1 npx playwright test e2e/shell.spec.ts --project=chromium` (fresh build, no PW_REUSE, port 3000 free first) | 33 passed, 0 failed, 0 flaky |
| `git status --porcelain public/service-worker.js` after the run | empty (restored with `git checkout -- public/service-worker.js`); no orphan `next start` on port 3000 |

**Build warnings with the new baseline-browser-mapping:** none from baseline-browser-mapping itself. The build still prints `Browserslist: browsers data (caniuse-lite) is 7 months old`, which is about the separate `caniuse-lite` data package (1.0.30001791), outside Tim's approval; logged in deferred-items.md. The other build lines (the custom Cache-Control notice for `/_next/static/:path*`, Node's DEP0205 `module.register()` notice) predate this plan.

## Task Commits

1. **Task 1 (tracer): the decision packet** - no commit (the plan commits nothing in Task 1; the draft stayed untracked until Task 3)
2. **Task 2: Tim's checkpoint answers** - no commit (checkpoint)
3. **Task 3: apply the approved bumps, raise the floors, record the answers** - `1ae8378` (fix: lockfile and floors), then the docs commit that carries this SUMMARY and deferred-items.md

## Files Created/Modified

- `package-lock.json` - source-map-js 1.2.2 and baseline-browser-mapping 2.11.35 (version, resolved, integrity only)
- `scripts/guards/version-floors.json` - floors for the two approved packages
- `.planning/phases/12-contact-edge-pages-cleanup-verification/deferred-items.md` - the caniuse-lite age warning, out of scope
- `.planning/phases/12-contact-edge-pages-cleanup-verification/12-27-SUMMARY.md` - the packet, Tim's answers and the follow-up Resolved values

## Decisions Made

- Both bumps applied through `npm update` (step 1); the override path (step 2) was not needed because the update resolved exactly 2.11.35 and 1.2.2.
- The IN-01 string, the IN-05 title and option A ship only as Tim worded them; 12-28, 12-29 and 12-32 read them from the table above.
- Option A means AR-12-02 is accepted and IN-02 is deferred, not fixed (12-34 records it).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Inline `node -e` verifies run from a script file on this Windows host**
- **Found during:** Task 1 (by the previous executor), applies to Task 3's node verifies too
- **Issue:** On this Windows host the command-line round-trip halves doubled backslashes inside the plan's inline `node -e` regexes (for example `replace(/\r/g,'')`), and bash heredocs are affected too, so the inline commands do not test what they say.
- **Fix:** The same logic, unchanged, was written with the Write tool into a .js file in the session scratchpad and run with `node <file>` (stdin piped where the plan pipes `npm audit --json`).
- **Files modified:** none in the repo
- **Verification:** Task 1 printed `packet OK`; Task 3 printed the audit line and `resolved values OK`
- **Committed in:** n/a

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** None on the result; the checks are the plan's own logic, run from a file.

## Issues Encountered

- The fresh build's Browserslist warning about `caniuse-lite` age is unrelated to the two approved packages; logged in deferred-items.md rather than bumped, since nothing outside Tim's approval may be installed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 12-28 (IN-01) can read `copy.field-error-name-long` = supplied; 12-29 can read `edge.header-guard` = option A; 12-32 can read `meta.global-error-title` = supplied; 12-34 records IN-02 deferred under AR-12-02.
- Commits are local and unpushed.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-03*

## Self-Check: PASSED

- FOUND: package-lock.json, scripts/guards/version-floors.json, this SUMMARY
- FOUND commits on HEAD: 1ae8378 (fix), 76c3375 (docs)
- Verifies: lint, type-check, jest green; audit reader "still listed none"; resolved values OK; shell spec 33 passed on a fresh build
