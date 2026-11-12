# Phase 13: Repo Safety & Test Debt - Pattern Map

**Mapped:** 2026-11-12
**Files analyzed:** 22 new/modified
**Analogs found:** 19 / 22 (3 are settings/doc artifacts with no code analog)

All analog paths below are git-tracked (`git ls-files` checked). None is generated output.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.github/workflows/ci.yml` (modify: `workflow_dispatch`, `changes`, job `if:`/`needs`, `ci-ok`, drop commented steps, 2 tag bumps) | config (workflow) | event-driven | itself (existing job shape) + `.github/workflows/visual-baselines.yml` (dispatch trigger) | exact |
| `.github/workflows/ci-skip-relay.yml` (NEW) | config (workflow) | event-driven (pull_request_target) | `.github/workflows/visual-baselines.yml` (env-only inputs, minimal perms) | role-match |
| `.github/workflows/upstash-keepalive.yml` (NEW) | config (workflow) | batch (schedule) | `.github/workflows/visual-baselines.yml` | role-match |
| `.github/workflows/visual-baselines.yml` (modify: tag lines 32, 71) | config | — | `scripts/guards/check-install-parity.mjs` lines 160-198 dictates the rule | exact |
| `scripts/guards/check-ci-gate.mjs` (NEW) | utility (guard) | file-I/O, transform | `scripts/guards/check-install-parity.mjs` | exact |
| `scripts/guards/__selftest__/ci-gate/{good,bad-*}/.github/workflows/*.yml` (NEW) | test fixture | file-I/O | `scripts/guards/__selftest__/parity/bad/.github/workflows/ci.yml` | exact |
| `scripts/guards/selftest.mjs` (modify: ci-gate, G5, G6, IN-06/IN-12 cases; cleanup list) | test harness | batch | itself (parity + test-count cases) | exact |
| `package.json` (modify: `guard:ci` script, add to `lint` chain; playwright bump) | config | — | existing `guard:*` scripts lines 10, 21-27 | exact |
| `scripts/guards/version-floors.json` (optional bump) | config | — | itself | exact |
| `scripts/photos/build-photo-data.mjs` (modify: `--root`) | utility (build script) | file-I/O | `check-install-parity.mjs` `parseArgs` lines 39-56 | exact |
| `scripts/photos/build-derivatives.mjs` (modify: `--root`) | utility (build script) | file-I/O | same | exact |
| `lib/rate-limit.ts` (modify: dual pair, timeout, fail-closed) | service | request-response | itself + RESEARCH Pattern 3 | exact |
| `lib/__tests__/rate-limit.test.ts` (NEW) | test | request-response | `app/api/__tests__/feedback.test.ts` (jest.mock + console spies), `lib/__tests__/proxy.test.ts` (node env, env vars) | role-match |
| `app/api/feedback/route.ts` (modify: `unavailable` → 503 `server-error`) | controller (route) | request-response | itself lines 90-96 (rate-limited branch) | exact |
| `lib/contact/api-contract.ts` (modify: `'limiter-unavailable'` outcome) | model (types) | — | itself lines 52-58 | exact |
| `app/api/__tests__/feedback.test.ts` (extend: 503 case) | test | request-response | itself lines 14-90 | exact |
| `e2e/prod/contact-form.prod.ts` (modify messages :106, :168) | test (probe) | request-response | itself | exact |
| `e2e/routes.ts` (modify: named photo slug, `SITEMAP_PATHS`, `AUDIT_SWEEP`) | utility (test data) | transform | itself + `app/sitemap.ts` | exact |
| `e2e/audit.spec.ts` (modify: one `@chromium-only` sweep test) | test (e2e) | request-response | itself lines 109-159 | exact |
| Template-coverage jest test (NEW, e.g. `lib/__tests__/audit-routes.test.ts`) | test | file-I/O | `lib/__tests__/photos-view-model.test.ts` lines 269-288 (fs walk) | role-match |
| CLEAN-01 edits: `lib/animations.ts`, `lib/__tests__/motion-tokens.test.ts`, `next.config.ts`, `public/service-worker.js`, `app/layout.tsx` | removals | — | n/a (removal table in RESEARCH lines 559-570) | n/a |
| `.planning/phases/13-.../main-ruleset.json`, `automated-actions-10401314.json`, `13-LEDGER-TRIAGE.md` | config / doc | — | none in code | none |

## Pattern Assignments

### `scripts/guards/check-ci-gate.mjs` (guard, file-I/O)

**Analog:** `scripts/guards/check-install-parity.mjs` (237 lines). Copy its whole skeleton.

**Header doc + usage** (lines 1-29): numbered "Checks (all paths relative to --root)" list, `Usage: node scripts/guards/check-ci-gate.mjs [--root <dir>]`, "Exit code 1 on any failure (one line per failure), 0 with "ci-gate: OK"."

**Imports + `--root` parsing** (lines 31-58):
```js
import fs from 'fs';
import path from 'path';

function parseArgs(argv) {
  const args = { root: process.cwd() };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') {
      const value = argv[i + 1];
      if (!value) { console.error('parity: --root needs a directory'); process.exit(1); }
      args.root = path.resolve(value);
      i++;
    } else {
      console.error(`parity: unknown argument ${argv[i]}`);
      process.exit(1);
    }
  }
  return args;
}
const { root } = parseArgs(process.argv.slice(2));
const failures = [];
const fail = (file, message) => failures.push(`${file}: ${message}`);
```

**Workflow enumeration + comment stripping** (lines 146-166): `readdirSync(path.join(root, '.github','workflows')).filter(f => /\.ya?ml$/.test(f)).sort()`, then `text.split(/\r?\n/).filter(line => !/^\s*#/.test(line))`. Reuse for: (1) no workflow-level `paths:`/`paths-ignore:` under `on:` in `ci.yml`; (2) `ci-ok` `needs:` equals every other job id (job ids = lines matching `/^  ([a-z0-9-]+):\s*$/` under `jobs:`); (3) `name: CI OK` appears only in `ci.yml` (relay's dynamic `${{ ... 'CI OK' ... }}` name is the allowed exception); (4) optional: no `checks: write`.

**Line-based YAML (no js-yaml)** (lines 99-121 `extractRunCommands`): indentation-tracked block parsing — copy this approach for reading the `needs: [...]` list and `on:` block.

**Failure output** (lines 232-237):
```js
if (failures.length > 0) {
  for (const f of failures) console.error(`parity: FAIL ${f}`);
  console.error(`parity: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('parity: OK');
```
Use prefix `ci-gate:`.

**jq check of the `CI OK` expression** (RESEARCH Wave 0): either export the jq expression as a constant and run `jq -e` on fixture `needs` JSON from selftest `fn` cases, or keep it in `ci.yml` and have the guard extract it. Local `jq` 1.8.2 exists; CI `ubuntu-latest` has jq.

---

### `scripts/guards/__selftest__/ci-gate/*` (fixtures)

**Analog:** `scripts/guards/__selftest__/parity/bad/.github/workflows/ci.yml` (fixture root containing `.github/workflows/`). Make `good/` plus one `bad-*` dir per rule (`bad-paths-filter`, `bad-missing-need`, `bad-duplicate-ci-ok`). No manifest renaming needed (unlike parity's `package.fixture.json` trick, selftest.mjs lines 100-114), since no `package.json` is involved; pass the fixture dir straight to `--root`.

---

### `scripts/guards/selftest.mjs` (modify)

**Constant + fixture helper pattern** (lines 38-54):
```js
const PARITY = path.join(here, 'check-install-parity.mjs');
const si = (name) => path.join(fixtures, 'served-images', name);
```
Add `const CI_GATE = path.join(here, 'check-ci-gate.mjs'); const cig = (name) => path.join(fixtures, 'ci-gate', name);` and for G5/G6 `const PHOTO_DATA = path.join(repoRoot, 'scripts','photos','build-photo-data.mjs')`, `PHOTO_DERIVE = ...build-derivatives.mjs`.

**Spawned case with temp root, setup and check** (lines 186-216):
```js
{
  name: 'test-count: --update with a lower total fails and leaves the baseline unchanged',
  guard: TEST_COUNT,
  args: [...],
  setup: () => { lowerUpdateBaseline = tempBaseline('baseline-91.json'); return ['--baseline', lowerUpdateBaseline]; },
  expectExit: 1,
  expectOutput: ['rewrite tests, never delete'],
  check: () => fs.readFileSync(lowerUpdateBaseline, 'utf-8') === fs.readFileSync(tc('baseline-91.json'), 'utf-8')
      ? null : 'baseline copy was modified by a refused --update',
},
```
G6's "every pre-existing file byte-identical" check follows this `check:` shape exactly.

**Temp-root helper** (lines 107-114 `tempParityRoot`): `fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'))` then nest a `root` dir one level down and `fs.cpSync(...)`. For G5 copy the real `data/photos/exif-sidecar.json`, `data/photos/corrections.json`, `data/terrain/source/*`, `data/generated/photos.ts` into the temp root and mutate one field. For G6 generate tiny JPEGs with sharp in `setup` (no committed binaries).

**Pure-helper case** (header lines 11-12): `{ name, fn }` returning error string or null — use for jq `CI OK` expression cases.

**Cleanup** (lines ~838-840): every new temp root variable must be added to the list
```js
for (const file of [lowerUpdateBaseline, raiseUpdateBaseline, raisePaletteRatchet, lowerPaletteRatchet, parityGoodRoot, parityBadRoot]) {
  if (file) fs.rmSync(path.dirname(file), { recursive: true, force: true });
}
```
Note: `setup` is called synchronously (`c.setup() ?? []`), so sharp's async JPEG generation must be done before the case loop (top-level `await`, file is ESM) or via `spawnSync`.

---

### `scripts/photos/build-photo-data.mjs` and `build-derivatives.mjs` (`--root`)

**Current code to change:** `build-photo-data.mjs:59` / `build-derivatives.mjs:74`
```js
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
```
and arg checks `build-photo-data.mjs:301-306` / `build-derivatives.mjs:422-427`:
```js
const args = process.argv.slice(2);
const unknown = args.filter((a) => a !== '--check');
if (unknown.length > 0) {
  console.log(`${NAME}: unknown argument(s) ${unknown.join(' ')}; the only flag is --check`);
  process.exit(1);
}
```
**Pattern to apply:** the `parseArgs` loop from `check-install-parity.mjs:39-56`, default root unchanged. Args must be parsed before `ROOT`-derived constants (`OUT_PATH` :64, `ORIGINALS_DIR`/`SIDECAR_PATH`/`OUT_DIR`/`MANIFEST_PATH` :79-82) are computed. Keep schema imports relative to the script file. Update the "the only flag is --check" message. Error output uses `console.log(\`${NAME}: ...\`)` (lines 308-317) — G5 assertions match those strings.

---

### `.github/workflows/ci.yml` (modify)

**Job skeleton to keep** (lines 74-101): `name:`, `runs-on`, `timeout-minutes`, `permissions: contents: read`, container comment referencing the parity guard, checkout → setup-node with `node-version-file: .node-version` → `npm ci` → `npm ls --depth=0`. The parity guard (rule 3) fails any literal `node-version:` and any `npm install` in a run step — the `changes` and `ci-ok` jobs need no setup-node at all.

**Existing conditional + needs to imitate** (lines 172-175, 212-215):
```yaml
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, unit-tests]
  ...
  dependency-review:
    name: Dependency Review
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
```
Heavy jobs gain `needs: [changes]` and `if: needs.changes.outputs.docs_only != 'true'`; `build` becomes `needs: [changes, lint-and-typecheck, unit-tests]`. `changes` + `ci-ok` bodies: RESEARCH Pattern 1 (lines 271-332).

**Triggers** (lines 3-7): add `workflow_dispatch:`; no `paths:`.
**Removals:** lines 103-105 and 194-196 (CLEAN-01). **Tag bumps:** lines 85, 138 (DEPS-06, same commit as lockfile + visual-baselines.yml 32, 71).
**Name constraint:** `Visual Regression` (line 130) is looked up by `scripts/ci/check-visual-run.mjs` and selftest line 59 — do not rename.

---

### `.github/workflows/ci-skip-relay.yml` and `upstash-keepalive.yml` (NEW)

**Analog:** `.github/workflows/visual-baselines.yml`
**Header comment style** (lines 1-5): a `# ...` paragraph stating what it does and what it never does.
**Minimal permissions** (lines 21-22): top-level `permissions:` block; for these new files use `permissions: {}` at top and grant per job.
**Untrusted input via env only** (lines 50-57):
```yaml
      # Inputs reach the shell only through env, never through ${{ }} in run.
      - name: Generate visual baselines
        run: npx playwright test --project=visual-dark --update-snapshots="$UPDATE_MODE"
        env:
          UPDATE_MODE: ${{ inputs.update_mode }}
```
Apply to `head.ref`, commit message, secrets. Bodies: RESEARCH Pattern 2 (lines 336-402) and keep-alive example (lines 693-713). Neither file uses setup-node, so the parity guard's setup-node count check passes trivially; check-ci-gate must treat the relay's dynamic `name:` as the allowed `CI OK` exception.

---

### `lib/rate-limit.ts` (service)

**Current file** (52 lines): `createRateLimiter()` reads `process.env` at lines 24-25, returns `new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(5, '1 h'), analytics: true, prefix: 'ratelimit:feedback' })` (28-33), else allow-all mock with warn-once (36-49); `export const feedbackRateLimit = createRateLimiter()` (52). Keep the `RateLimitResult`/`RateLimiter` interfaces (12-21) and the export name (the route and `feedback.test.ts` line 23-25 mock depend on `feedbackRateLimit.limit`). Change: export `createRateLimiter(env = process.env)` and `upstashCredentials(env)` for testability; replace `Redis.fromEnv()` with `new Redis({ url, token })`; add `timeout`; refuse in `limit()` (never throw at module load). Full sketch: RESEARCH Pattern 3 (lines 406-465).

**Log line shape to match** (`app/api/feedback/route.ts:37-44`):
```ts
const entry = { event: 'feedback', outcome, ip, timestamp: new Date().toISOString() };
console.warn('[feedback]', entry);
```
Refusal line: `console.error('[rate-limit]', { event: 'rate-limit', outcome: 'refused', reason, timestamp })` — tag string first, object second, no visitor data.

---

### `app/api/feedback/route.ts` + `lib/contact/api-contract.ts`

**Insert beside the existing branch** (route.ts lines 90-96):
```ts
    // Rate limit check: persistent via Upstash Redis
    const { success, reset } = await feedbackRateLimit.limit(ip);
    if (!success) {
      const retryAfterS = retryAfterSeconds(reset, Date.now());
      logFeedback('rate-limited', ip);
      return respond({ code: 'rate-limited', retryAfterS }, 429, { 'Retry-After': String(retryAfterS) });
    }
```
Add the `unavailable` check before `!success`: `logFeedback('limiter-unavailable', ip); return respond({ code: 'server-error' }, 503);`. Destructure `unavailable` too.
**Contract** (api-contract.ts lines 52-58): add `| 'limiter-unavailable'` to `FeedbackOutcome`. `FEEDBACK_CODES` (25-32) stays unchanged — reusing `server-error` keeps `SummitRegister.tsx` `outcomeOf` (224-232) mapping to the `send` copy, so no UI change.

---

### `lib/__tests__/rate-limit.test.ts` (NEW test)

**Env docblock** (from `lib/__tests__/proxy.test.ts` lines 1-3 and `feedback.test.ts` 1-3):
```ts
/**
 * @jest-environment node
 */
```
followed by a requirement-tagged doc comment (GUARD-09, D-11, D-12) as proxy.test.ts lines 5-24 does.

**Module mock before imports** (`feedback.test.ts` lines 14-31):
```ts
// Mocks must be declared before imports
jest.mock('@/lib/rate-limit', () => ({
  feedbackRateLimit: { limit: jest.fn() },
}));
import { feedbackRateLimit } from '@/lib/rate-limit';
```
Here mock `@upstash/ratelimit` (a `Ratelimit` class with static `slidingWindow` and a `limit` jest.fn) and `@upstash/redis` (`Redis` constructor jest.fn to assert `{ url, token }` from one pair). Pass an explicit env object to `createRateLimiter(env)` instead of mutating `process.env` (next/jest does not load `.env.local`).

**Console spy pattern** (`feedback.test.ts` lines 33-38, 66-70):
```ts
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
const feedbackLogs = () => consoleSpies.flatMap((spy) => spy.mock.calls)
  .filter((args) => args[0] === '[feedback]').map((args) => args[1] as Record<string, unknown>);
```
Reuse with `'[rate-limit]'` to assert one refusal line per refusal with `reason`.

Cases: prod + no creds → refused `unconfigured`; prod + `limit` rejects → `error`; prod + resolves `{ success: true, reason: 'timeout' }` → `timeout`; preview/dev + no creds → allow + one warn; UPSTASH pair wins; KV pair accepted; mixed pair (UPSTASH url + KV token) → treated as unconfigured.

### `app/api/__tests__/feedback.test.ts` (extend)
Default mock at lines 82-83 (`mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 0 })`); new case sets `{ success: false, ..., unavailable: 'error' }` and expects 503 `{ code: 'server-error' }`, outcome `limiter-unavailable` via `outcomes()` (line 72). The `afterEach` VISITOR_TEXT check (86-90) covers log privacy automatically.

---

### `e2e/routes.ts` + `e2e/audit.spec.ts` (VERIFY-05)

**Current index-based entry to replace** (routes.ts line 17):
```ts
  ['/photos/' + buildPhotoViews()[0].slug, 'Photographs'],
```
**Data source** (`app/sitemap.ts` lines 15-21):
```ts
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...site.nav.map((n) => ({ url: n.href === '/' ? site.url : `${site.url}${n.href}` })),
    ...photoSlugs.map((slug) => ({ url: `${site.url}/photos/${slug}` })),
    ...projects.map((p) => ({ url: `${site.url}/projects/${p.slug}` })),
  ];
}
```
routes.ts already imports via `@/` aliases (lines 1-2) so `import sitemap from '@/app/sitemap'` fits. `SITEMAP_PATHS`/`AUDIT_SWEEP`: RESEARCH Pattern 4 (lines 471-482).

**Audit loop to copy for the sweep test** (audit.spec.ts lines 113-157): `test.setTimeout(180000); await installAuditProbes(page); const failures = collectFailures(page); const findings: string[] = [];` → per path `await openSettled(page, path, 1440)`, `expect(response?.status(), label).toBeLessThan(400)`, `findings.push(...(await audit(page, request, failures, browserName, label)))` → one `expectClean(findings)`. One `test()` total (ratchet, Pitfall 11), title tagged `@chromium-only`; check how existing engine tags are filtered in `playwright.config.ts` (`grep`/`grepInvert`) before relying on the tag. `test.skip` is banned (12-23). Also drop the `buildPhotoViews` import at audit.spec.ts line 2 if it becomes unused.

### Template-coverage jest test (NEW)
**Analog:** `lib/__tests__/photos-view-model.test.ts` lines 269-288 — recursive `fs.readdirSync(dir, { withFileTypes: true })` walk from `process.cwd()`, sanity `expect(files.length).toBeGreaterThan(...)`, then `expect(missing).toEqual([])`. Walk `app/(site)/**/page.tsx`, map each to a route pattern (`[slug]` → any concrete path), assert each has a `ROUTES` entry. Importing `e2e/routes.ts` from jest relies on the `@/` alias (jest.config.js moduleNameMapper) — confirm `e2e/` is not in `testPathIgnorePatterns`-style module exclusions.

---

### `package.json`
Lines 10, 21-27: add `"guard:ci": "node scripts/guards/check-ci-gate.mjs"` and insert `npm run guard:ci` into `lint` (after `guard:parity`, before `guard:selftest`).

### `e2e/prod/contact-form.prod.ts`
Edit only the two message strings at :106 and :168 (RESEARCH Pitfall 5) to name 503 = limiter unavailable.

## Shared Patterns

### Guard CLI contract
**Source:** `scripts/guards/check-install-parity.mjs` lines 39-60, 232-237
**Apply to:** `check-ci-gate.mjs`, both photo scripts' `--root`
`--root <dir>` defaulting to cwd (photo scripts: default to the script-relative ROOT), unknown args exit 1, `fail(file, message)` accumulation, `<name>: FAIL ...` lines then `<name>: OK`.

### Selftest proof that a check can fail
**Source:** `scripts/guards/selftest.mjs` header lines 3-23, runner lines ~797-822
**Apply to:** ci-gate guard, G5, G6, ledger guard fixes (07 WR-01..04, IN-06, 12 IN-12)
Every new failure mode gets a `bad` fixture with `expectExit: 1` and an `expectOutput` fragment; temp roots under `os.tmpdir()` and added to the cleanup list.

### Untrusted values only through `env:`
**Source:** `.github/workflows/visual-baselines.yml` lines 50-57
**Apply to:** `ci.yml` `changes` job, relay, keep-alive.

### Least-privilege permissions
**Source:** `ci.yml` lines 9-10 and per-job `permissions: contents: read` (41-42, 78-79)
**Apply to:** every new job (`ci-ok: permissions: {}`, relay `actions: write` only on the relay job). Never `checks: write`.

### Metadata-only structured logs
**Source:** `app/api/feedback/route.ts` lines 36-44, 138-147
**Apply to:** `lib/rate-limit.ts` refusal line, route `limiter-unavailable` outcome.

### Jest test file header
**Source:** `lib/__tests__/proxy.test.ts` lines 1-24
**Apply to:** all new jest files: `@jest-environment node` docblock, then a doc comment naming the requirement IDs and decisions under test.

## No Analog Found

| File | Role | Reason |
|---|---|---|
| `.planning/phases/13-repo-safety-test-debt/main-ruleset.json` | settings payload | No ruleset JSON in the repo; use RESEARCH "Code Examples" lines 669-690 verbatim (bypass_actors empty) |
| `.planning/phases/13-repo-safety-test-debt/automated-actions-10401314.json` | export | Raw `gh api` output saved as-is |
| `.planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md` | doc | Use RESEARCH VERIFY-07 table (lines 572-623) as the starting content; archived `*-REVIEW-DISPOSITION.md` rows are edited in place |

CLEAN-01 removals have no analog by nature; follow the RESEARCH removal table (lines 559-570). Keep `request.destination === 'image'` in `public/service-worker.js` (relied on by `lib/__tests__/service-worker-media.test.ts:161`), and keep the 12 IN-09 `storeCopy` fix in a separate commit from the SW removal.

## Metadata

**Analog search scope:** `scripts/guards/`, `scripts/photos/`, `.github/workflows/`, `lib/__tests__/`, `app/api/`, `lib/contact/`, `e2e/`, `app/sitemap.ts`, `package.json`
**Files scanned:** ~20
**Pattern extraction date:** 2026-11-12
