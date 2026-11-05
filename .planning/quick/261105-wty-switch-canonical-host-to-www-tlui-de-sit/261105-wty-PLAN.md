---
phase: quick-261105-wty
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/__tests__/proxy.test.ts
  - data/site.ts
  - proxy.ts
  - data/__tests__/site.test.ts
  - .planning/PROJECT.md
  - .planning/milestones/v2.0-phases/12-contact-edge-pages-cleanup-verification/deferred-items.md
autonomous: true
requirements: [SEO-01, SEO-02, SEO-03, EDGE-01]

estimate:
  tokens: 40000
  raw_tokens: 40000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "site.url is https://www.tlui.de (D-13), so on a production build every canonical, the sitemap and the robots Sitemap line name that host"
    - "canFetchNeutral returns true for the hostname of site.url, in any letter case, with no VERCEL_* variable set (T-12-03)"
    - "A miss on the canonical host is answered from a neutral fetch of /{section}/_ on that same host, with status 404 and no x-middleware-rewrite"
    - "tlui.de, evil-www.tlui.de, www.tlui.de.evil.com and sub.www.tlui.de get no fetch and the plain rewrite: exact matches only (T-12-03)"
    - "Loopback and VERCEL_* behaviour is unchanged: every existing proxy test passes with its assertions and request URLs untouched"
    - "The seo, og and not-found specs pass on chromium, firefox and webkit against a fresh production build"
    - "The deferred row stays acknowledged and states the live retest as pending, with the exact commands"
    - "The GitHub repo homepage, Vercel and Strato settings and the visual baselines are untouched, and nothing is pushed"
  artifacts:
    - path: data/site.ts
      provides: "The one canonical-host constant (D-13), now on www.tlui.de"
      contains: "url: 'https://www.tlui.de',"
    - path: proxy.ts
      provides: "canFetchNeutral allows the exact hostname of site.url"
      contains: "new URL(site.url).hostname"
    - path: lib/__tests__/proxy.test.ts
      provides: "Canonical-host allowance, www miss, no self-fetch of the neutral slug, near-miss rejection"
      contains: "the canonical host self-fetches"
    - path: .planning/milestones/v2.0-phases/12-contact-edge-pages-cleanup-verification/deferred-items.md
      provides: "Outcome note with the pending live retest; status stays acknowledged"
      contains: "261105-wty (executor outcome)"
  key_links:
    - from: proxy.ts CANONICAL_HOST
      to: data/site.ts site.url
      via: "new URL(site.url).hostname, compared exactly in canFetchNeutral"
      pattern: "host === CANONICAL_HOST"
    - from: app/layout.tsx metadataBase, app/robots.ts, app/sitemap.ts
      to: data/site.ts site.url
      via: "existing imports; no edit needed, proved by e2e/seo.spec.ts, which asserts against site.url"
      pattern: "site\\.url"
---

<objective>
Make `https://www.tlui.de` the canonical host now that the domain is live: set `site.url` (D-13), let `canFetchNeutral` allow that exact host so misses on www get the neutral render (T-12-03), and re-run the seo, og and not-found specs.

Purpose: canonicals, OG URLs and the sitemap still name the vercel.app host, and a 404 on www carries the requested slug in its flight data.
Output: one code commit pair (RED, then the fix), a three-engine spec result, and a docs commit that records the live retest as pending.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/quick/261105-wlf-verify-unknown-slug-miss-path-returns-40/261105-wlf-SUMMARY.md
@proxy.ts
@data/site.ts
@lib/__tests__/proxy.test.ts
@data/__tests__/site.test.ts

<design_decision>
How `canFetchNeutral` learns the host. Chosen: accept the hostname of `site.url`, exact match.

| Option | For | Against | Verdict |
|--------|-----|---------|---------|
| Hostname of `site.url`, exact | One host constant (D-13); a later host change follows by itself; needs no environment setup | `proxy.ts` gains one import | Chosen |
| A second `'www.tlui.de'` literal in `proxy.ts` | No import | Two host constants that can drift, against D-13 | Rejected |
| Rely on `VERCEL_PROJECT_PRODUCTION_URL` or a new env var | No code | Its value cannot be read from outside and may name another domain; Vercel settings are out of scope | Rejected |

The import is safe, checked at planning: `proxy.ts:4` imports `lib/photos/view-model.ts`, whose line 7 already imports `@/data/site`, so the proxy bundle holds that module today. `data/site.ts` is one type import and a literal object, with no side effects. Next 16 runs the proxy on Node by default (proxy.md "Runtime"). The docs' warning about shared modules concerns state shared with render code; a constant shares no state. Importing it directly states the dependency.

The apex stays out. `https://tlui.de/photos/nope`, pinned to the published A record, 308s to www at Vercel before any proxy runs (261105-wlf evidence table). If that ever changed, the apex would get the plain rewrite: a correct 404 with the slug in the flight data, which fails safe.

Why the cause stays unconfirmed: the `VERCEL_*` values cannot be read from outside. Do not write in code, comments or docs that those variables are why www is rejected today. Allowing the host by name fixes the host check whichever value they hold; the live retest shows whether that was the whole cause.
</design_decision>

<planning_observations>
Measured or read on 2026-11-05 about 22:45 UTC.

- Live: `/` on www answers 200; `/photos/nope` answers 404 and its body holds `nope` once, as `\":[\"\",\"photos\",\"nope\"],\"q\`; `/photos/_` answers 404 with `nope` absent. So `grep -c nope` separates the two states.
- The local router's stale AAAA record, seen while planning, had cleared by 22:51 UTC: plain curl reaches both tlui.de and www.tlui.de on IPv4 addresses. No `-4` is needed.
- `site.url` reaches only `app/layout.tsx:35` (metadataBase), `app/robots.ts:14` and `app/sitemap.ts:17-19`. No component reads it. `lib/og/template.tsx` and `app/(site)/photos/[slug]/opengraph-image.tsx` read `site.name` and `site.role` only. So it reaches no visible text and no OG image bytes: no visual baseline risk, and no re-baseline in this plan.
- `next start` builds `request.url` from its own hostname, not the Host header (`node_modules/next/dist/server/lib/router-utils/resolve-routes.js:118`), so a local server cannot reach the www branch. e2e/not-found.spec.ts goes through the loopback branch. The www branch is proved locally by the unit test driving `proxy()` with a real `NextRequest`, and on production by the live retest.
- At HEAD (7859178): `npm run lint` exits 0 in about 33 s; `npx jest lib/__tests__/proxy.test.ts data/__tests__/site.test.ts` gives 58 passed.
- Beyond the two stale-text spots named in the brief, `.planning/PROJECT.md:22` and `:212` also describe the switch as future. Task 3 covers all three PROJECT.md lines.
- The guard selftest fixtures under `scripts/guards/__selftest__/identity/*/data/site.ts` hold the old host, but `guard:identity` checks shape only. They stay as they are unless a guard fails because of this change.
</planning_observations>

<regression_risks>
1. If the neutral fetch fails or hangs on www on production, each miss waits up to `NEUTRAL_TIMEOUT_MS` (5 s) before the plain rewrite. It is bounded, unit-tested and still a correct 404, but no local run can reach it. The live retest therefore also reads `time_total`.
2. On deploy every canonical and OG URL moves host. This is what D-13 calls costly to undo once indexed. Tim chose www.tlui.de on 2026-11-02, and the old hosts already 308 to it.
3. The allowance alone would break existing tests: while `site.url` still names the vercel.app host, the tests at `lib/__tests__/proxy.test.ts:189-205` would start fetching. The flip and the allowance must land in one commit.
4. The GitHub repo homepage still names the vercel.app host. It keeps working through the 308. Out of scope: Tim did not approve changing it.
</regression_risks>

<run_rules>
Production Playwright runs (`PW_PROD=1`):

- `npm run build` runs `postbuild`, which rewrites the tracked file `public/service-worker.js` by injecting the build hash, and a second build fails at `postbuild` until that file is restored. After every run: `git checkout -- public/service-worker.js`. Never commit that file. The verify commands below already restore it.
- `playwright.config.ts` does not reuse a server under `PW_PROD`, so port 3000 must be free before each run. Check with `netstat -ano | grep ':3000 .*LISTENING'`. A leftover `next start` from an earlier run is a known Windows orphan: stop that PID with `taskkill //PID {pid} //F`. If anything else holds the port, stop and report it.
- The Bash tool caps a foreground command at 10 minutes. Set a long `timeout` or use `run_in_background`.
- Use `PW_PROD=1`, never the dev server: `next dev` rewrites `AGENTS.md`.
</run_rules>

<commit_rules>
Stay on `chore/canonical-host-www`. The tree has unrelated untracked paths (`.claude/`, `.planning/debug/*`, `.planning/state.json`, `.planning/ui-reviews/`, `graphify-out/`) that must never be staged: `git add` named files only, never `-A` or `.`. Use plain `git commit`, because `gsd query commit` drops the trailers. Do not push. Do not commit SUMMARY.md, STATE.md or PLAN.md; the quick workflow's orchestrator commits those and updates STATE.md.

Every commit message ends with exactly these two lines:

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Dq2i8BuAd6DEpZPQxEVyqk
```
</commit_rules>

<out_of_scope>
GitHub repo homepage; Vercel or Strato settings; pushing; visual baseline PNGs; guard selftest fixtures; the live retest itself (it needs the production deploy that follows Tim's merge to main).
</out_of_scope>

<source_audit>
| Source | ID | Item | Task | Status | Notes |
|--------|----|------|------|--------|-------|
| GOAL | - | `site.url` is `https://www.tlui.de` | 1 | COVERED | |
| GOAL | - | `canFetchNeutral` allows www.tlui.de, so www misses use the neutral render | 1 | COVERED | Live effect proved only after deploy; retest recorded by Task 3 |
| GOAL | - | Re-run the seo, og and not-found specs | 2 | COVERED | |
| REQ | SEO-01, SEO-02, SEO-03, EDGE-01 | v2.0 IDs these specs pin; no new requirement | 1, 2 | COVERED | |
| RESEARCH | - | None: quick task with no research phase | - | N/A | |
| CONTEXT | D-13 | One canonical-host constant | 1 | COVERED | |
| CONTEXT | T-12-03 | Exact host matches only, VERCEL_* and loopback checks unchanged | 1 | COVERED | |
| CONTEXT | Deferred row | Redirect tlui.de and the vercel.app host to www | - | COVERED | Already live at Vercel, measured; no code needed |
| CONTEXT | Deferred row | Live retest stays pending, status stays acknowledged | 3 | COVERED | |
| CONTEXT | Tim, 2026-11-02 | www.tlui.de is canonical | 1 | COVERED | Settled, so no new checkpoint |
</source_audit>
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: End-to-end "www.tlui.de is the canonical host": site.url, the proxy allowance and a www miss</name>
  <precondition>On branch chore/canonical-host-www, and `curl -s -o /dev/null -w '%{http_code}' https://www.tlui.de/` prints 200 (the domain is live)</precondition>
  <reversibility rating="costly">Every canonical, OG URL and sitemap entry moves host on deploy, so undoing it once indexed needs a redirect or canonical plan; settled by Tim on 2026-11-02 (deferred row), so flagged only.</reversibility>
  <files>lib/__tests__/proxy.test.ts, data/site.ts, proxy.ts, data/__tests__/site.test.ts</files>
  <read_first>node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md (AGENTS.md: this Next differs from training data), proxy.ts, data/site.ts, lib/__tests__/proxy.test.ts, data/__tests__/site.test.ts</read_first>
  <behavior>
    - canFetchNeutral(hostname of site.url) is true with no VERCEL_* set, also upper-cased (D-13, T-12-03)
    - A miss at `https://{canonical host}/photos/nf-token` and `/projects/nf-token` fetches `/{section}/_` on that host once, answers 404 with the neutral body and has no x-middleware-rewrite
    - `https://{canonical host}/photos/_` rewrites without fetching, so the neutral slug can never fetch itself
    - tlui.de, evil-www.tlui.de, www.tlui.de.evil.com and sub.www.tlui.de: no fetch, rewrite to /__missing, x-edge-section photos
  </behavior>
  <action>
    RED. In lib/__tests__/proxy.test.ts, import `site` from `@/data/site`. After the last describe block add one describe titled `proxy(): the canonical host self-fetches with no Vercel variable set (T-12-03, D-13)`, with `const CANONICAL_HOST = new URL(site.url).hostname` inside it. The file's top-level beforeEach already clears all three VERCEL_* variables and makes fetch reject. Use the file's `run`, `forwarded`, `fetchMock` and `NEUTRAL_SLUG`. Add these tests, deriving the host from `site.url` wherever the intent is "the canonical host":
    (a) `canFetchNeutral(CANONICAL_HOST)` and `canFetchNeutral(CANONICAL_HOST.toUpperCase())` are true.
    (b) `it.each(['photos', 'projects'])`: mock fetch to resolve one `new Response(html, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } })`, then `run` a miss on `https://${CANONICAL_HOST}/${section}/nf-token`. Assert one fetch to `https://${CANONICAL_HOST}/${section}/${NEUTRAL_SLUG}`, status 404, the body equal to the html, and a null `x-middleware-rewrite`.
    (c) `run` `https://${CANONICAL_HOST}/photos/${NEUTRAL_SLUG}`: no fetch, and the rewrite ends in /__missing.
    (d) `it.each` over the literals `tlui.de`, `evil-www.tlui.de`, `www.tlui.de.evil.com` and `sub.www.tlui.de`. Each case first asserts `canFetchNeutral('www.tlui.de')` is true, a literal control that stops the case passing vacuously and fails if the host moves again, so that the list gets revisited. Then it runs a miss on the near-miss host: no fetch, the rewrite ends in /__missing, and forwarded x-edge-section is photos. A one-line comment says the apex is listed because it must not be allowed: it redirects to www at Vercel before the proxy runs.

    Do not rewrite the existing tests. Those sending the vercel.app host with no variable set keep expecting the plain rewrite and still pass, because after the flip that host no longer equals site.url's host. Change only text that would become false, and no assertion, request URL or the `PROD_HOST` value: the header comment's list of allowed hosts (lines 21-23) gains the canonical host; the `PROD_HOST` comment (line 52) calls it the vercel.app host, a Vercel-named host only where a test sets a variable; the comment at lines 187-188 says the vercel.app host, not site.url's host; and the describe title at line 394 becomes `proxy(): the neutral fetch runs only on loopback, the canonical host and Vercel hosts (T-12-03)`.

    Run `npx jest lib/__tests__/proxy.test.ts -t "canonical host self-fetches"`. Expect (a), (b) and (d) to fail; (c) passes at HEAD only because no host is allowed yet. Commit that file alone as `test(quick-261105-wty): pin the canonical host allowance in the proxy`.

    GREEN. These edits land in one commit, because the allowance without the flip breaks the existing vercel.app tests (regression risk 3):
    - data/site.ts, per D-13: set the `url` value to `https://www.tlui.de`. Replace the three comment lines above it with: `// D-13: the canonical host. Tim chose www.tlui.de on 2026-11-02; tlui.de and`, `// the vercel.app host redirect here at Vercel. No trailing slash. Costly to`, `// change once indexed (it needs a redirect or a canonical plan on the old host).` The clause about the GitHub repository goes, because that homepage is not being changed. Do not write the key followed by a colon and a quote in the comment: `check-identity.mjs` reads the first such match.
    - proxy.ts, per T-12-03: add `import { site } from '@/data/site';` between the projects and edge-section imports. After `LOOPBACK` add `const CANONICAL_HOST = new URL(site.url).hostname;` with a doc comment saying: the canonical host (D-13), allowed by name so the neutral 404 does not depend on which production domain the Vercel variables hold; domains that redirect to it at Vercel never reach the proxy, so only this one is listed. In `canFetchNeutral`, change the first check to `if (LOOPBACK.has(host) || host === CANONICAL_HOST) return true;` and leave the VERCEL_* array and `envHostname` exactly as they are. Update its doc comment: the fetch runs only on loopback, on the canonical host or on a hostname Vercel names for this deployment; exact matches only, never a suffix or a subdomain, because the fetch forwards the visitor's cookies. Do not claim why www is rejected today.
    - data/__tests__/site.test.ts: make line 7 read ` *   later switch to another domain still passes;`, removing the parenthetical that names a pending switch. No assertion changes; the shape stays host-agnostic.

    Commit the three source files plus any remaining test edits as `fix(quick-261105-wty): make www.tlui.de the canonical host and allow its neutral 404`. The commit body should say that the live retest follows the deploy after merge. Restore `public/service-worker.js` after the Playwright run (see run_rules).
  </action>
  <verify>
    <automated>npx jest lib/__tests__/proxy.test.ts data/__tests__/site.test.ts && test "$(grep -c "url: 'https://www.tlui.de'," data/site.ts)" = 1 && test "$(grep -v '^ *//' data/site.ts | grep -c 'mocha-three')" = 0 && test "$(grep -c 'D-13: the canonical host. Tim chose www.tlui.de' data/site.ts)" = 1 && test "$(grep -c "from '@/data/site'" proxy.ts)" = 1 && test "$(grep -c 'new URL(site.url).hostname' proxy.ts)" = 1 && test "$(grep -c 'host === CANONICAL_HOST' proxy.ts)" = 1 && test "$(grep -c 'the canonical host self-fetches' lib/__tests__/proxy.test.ts)" = 1 && test "$(grep -c 'later switch to another domain still passes;' data/__tests__/site.test.ts)" = 1 && DIFF="$(git diff 7859178..HEAD -- lib/__tests__/proxy.test.ts)" && test -n "$DIFF" && test -z "$(printf '%s\n' "$DIFF" | grep '^-' | grep -vE '^---|^-\s*(//|\*|/\*\*)|^-describe\(')" && PW_PROD=1 npx playwright test e2e/seo.spec.ts --project=chromium; RC=$?; git checkout -- public/service-worker.js; test "$RC" = 0</automated>
    Baselines at HEAD 7859178: the `url:` gate 0, the old-host gate 1, the comment gate 0, the import gate 0, the `new URL` gate 0, the `host ===` gate 0, the describe gate 0, the site.test gate 0. Run this after both commits. The range gate needs a non-empty diff (empty, so failing, at HEAD), and removed lines in the test file may only be comment lines or a describe title. The seo spec asserts against `site.url`, so together with the `url:` gate it proves www in the rendered canonicals, sitemap and robots on a production build.
  </verify>
  <done>Canonical-host tests pass together with every existing proxy test (58 existing plus 8 new is 66 in the two files). `site.url` is `https://www.tlui.de`. e2e/seo.spec.ts passes on chromium against a production build. `public/service-worker.js` is clean. Two commits exist (RED, fix), naming their files.</done>
</task>

<task type="auto">
  <name>Task 2: Prove it on all three engines, with lint, types and the full unit suite</name>
  <files>none: nothing is committed unless a failure traces to Task 1's files</files>
  <action>
    Follow run_rules, then run the verify command. Keep the passed, failed and flaky counts from the Playwright output for Task 3 and the SUMMARY; do not guess them.

    If anything fails, diagnose before fixing. If the failure traces to Task 1's change, fix it in Task 1's files, rerun, and commit under the commit_rules as `fix(quick-261105-wty): ...`. If it does not, run that one test alone to classify it, then record it with its evidence in the SUMMARY and report it instead of editing the test. Do not weaken a spec, add a retry or tag, update snapshots or touch a baseline PNG. Stop before Task 3 while a failure traced to this change is open.

    Do not edit the guard selftest fixtures unless `npm run lint` fails on one because of this change; if it does, name that output in the SUMMARY.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run lint && npx jest && PW_PROD=1 npx playwright test e2e/seo.spec.ts e2e/og.spec.ts e2e/not-found.spec.ts --project=chromium --project=firefox --project=webkit; RC=$?; git checkout -- public/service-worker.js; test "$RC" = 0 && test -z "$(git status --porcelain public/service-worker.js)"</automated>
  </verify>
  <done>Type-check, lint with guards and the full Jest suite exit 0. The seo, og and not-found specs report 0 failed and 0 flaky on chromium, firefox and webkit against a fresh build. Port 3000 is free and `public/service-worker.js` is clean. The counts are noted for Task 3.</done>
</task>

<task type="auto">
  <name>Task 3: Record the outcome: the deferred row stays open with the live retest, and PROJECT.md stops calling the switch future</name>
  <files>.planning/milestones/v2.0-phases/12-contact-edge-pages-cleanup-verification/deferred-items.md, .planning/PROJECT.md</files>
  <read_first>The row titled "Switch the canonical host" in deferred-items.md (lines 20-22), and .planning/PROJECT.md lines 22, 111 and 212 (use grep and offset reads; both files are long)</read_first>
  <action>
    In deferred-items.md, keep that row's `status: acknowledged` line as it is, and add one line directly after its `**What:**` line, with the same two-space indent as the other outcome notes. Fill `{fix sha}` and `{n}` from Tasks 1 and 2, and keep the inner backticks:
    **261105-wty (executor outcome): code done, live check pending.** D-13's `site.url` is `https://www.tlui.de` and `canFetchNeutral` allows that exact hostname (`{fix sha}`). `PW_PROD=1 npx playwright test e2e/seo.spec.ts e2e/og.spec.ts e2e/not-found.spec.ts --project=chromium --project=firefox --project=webkit` gave {n} passed, 0 failed, 0 flaky. The redirects needed no code: tlui.de, http://www.tlui.de and the vercel.app host already 308 to www at Vercel. The status stays acknowledged because the www miss path runs only on production, and a production deploy happens only after Tim merges to main, so the live check has not run. Retest after that deploy: `curl -sS -o /dev/null -w '%{http_code} %{time_total}\n' https://www.tlui.de/photos/nope` must print 404 and well under 5 s, and `curl -sS https://www.tlui.de/photos/nope | grep -c nope` must print 0 (it printed 1 on 2026-11-05, before this change). If `nope` is still there, the host check was not the whole cause: find out whether the neutral fetch fails or times out on www before changing anything else. Close this row when both checks hold. The GitHub repo homepage still names the vercel.app host and keeps working through the 308; Tim has not asked to change it.

    In .planning/PROJECT.md:
    - Line 22: delete the next-milestone candidate bullet about switching the canonical host, since the switch ships with this branch and the deferred row tracks the retest.
    - Line 111: replace the last sentence, about the canonical host staying on the old URL, with: The canonical host is `https://www.tlui.de`; tlui.de and the vercel.app host redirect to it at Vercel.
    - Line 212, last cell: replace the text after `✓ Good — ` with: `https://www.tlui.de` (in backticks) since quick 261105-wty; Tim chose "www.tlui.de" on 2026-11-02; the live miss-path retest is pending in the Phase 12 deferred-items.md row.

    Commit exactly these two files as `docs(quick-261105-wty): record the canonical host switch and its pending live retest`. Do not edit STATE.md: the orchestrator owns it and the row is still open.
  </action>
  <verify>
    <automated>D=.planning/milestones/v2.0-phases/12-contact-edge-pages-cleanup-verification/deferred-items.md; test -f "$D" && test "$(grep -c '261105-wty (executor outcome)' "$D")" = 1 && test "$(grep -c 'www.tlui.de/photos/nope' "$D")" = 1 && test "$(grep -A1 'Switch the canonical host' "$D" | grep -c 'status: acknowledged')" = 1 && test "$(grep -c 'The canonical host is .https://www.tlui.de' .planning/PROJECT.md)" = 1 && test "$(grep -v '^#' .planning/PROJECT.md | grep -c 'mocha-three')" = 0 && test "$(grep -v '^#' .planning/PROJECT.md | grep -c 'once DNS resolves')" = 0</automated>
    Baselines at HEAD 7859178: outcome note 0, retest URL 0, the new PROJECT.md sentence 0, old host in PROJECT.md 2, DNS candidate bullet 1. The `status: acknowledged` gate is an invariant: it is 1 at HEAD and must stay 1.
  </verify>
  <done>The deferred row still reads `status: acknowledged` and its new note names the fix commit, the three-engine result and the exact pending retest. PROJECT.md no longer describes the switch as future. One docs commit holds exactly those two files.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Visitor to proxy | The requested path, headers and cookies are untrusted; the host in `request.url` decides whether a fetch runs |
| Proxy to neutral render | An outbound fetch that forwards the visitor's `cookie`, `accept`, `accept-language` and `user-agent` to the request's own origin |

## STRIDE Threat Register

Task-local IDs: this quick task has no phase number. T-12-03 is the Phase 12 threat this work restores on www.

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-wty-01 | I | `canFetchNeutral` canonical allowance | high | mitigate | A loose match would send visitors' cookies to a look-alike host. `host === CANONICAL_HOST` is an exact comparison after lower-casing, with no suffix or subdomain logic. Task 1 tests (d) assert no fetch for tlui.de, evil-www.tlui.de, www.tlui.de.evil.com and sub.www.tlui.de |
| T-wty-02 | S | A deployment whose `request.url` follows a forged Host | low | accept | The allowed target is fixed to this site's own host and returns the public 404 page, which any visitor can already request. The existing test "compares the host the fetch targets" stays |
| T-wty-03 | D | Self-fetch on every www miss | low | accept | Each miss costs one extra render, bounded by `NEUTRAL_TIMEOUT_MS`, the cost Phase 12 designed for Vercel-named hosts. The neutral slug never fetches itself (Task 1 test (c)) |
| T-wty-04 | I | Requested slug in flight data on www | low | accept | Remains until the deploy, and on the documented fallback. It is a correct 404 with no secret in it. Task 3 keeps the row open with the exact retest |
| T-wty-05 | T | `new URL(site.url)` at module load | low | mitigate | The value is a repository constant whose shape `data/__tests__/site.test.ts` and `guard:identity` pin, so a malformed value fails before deploy; `app/layout.tsx` already parses it the same way |
| T-wty-SC | T | npm/pip/cargo installs | low | accept | This plan installs nothing, so no legitimacy gate applies |

Blocking threshold is high (ASVS level 1). The one high threat is mitigated in Task 1.
</threat_model>

<verification>
- `npx tsc --noEmit`, `npm run lint` and `npx jest` exit 0.
- `PW_PROD=1 npx playwright test e2e/seo.spec.ts e2e/og.spec.ts e2e/not-found.spec.ts --project=chromium --project=firefox --project=webkit` reports 0 failed and 0 flaky.
- `git status --short` shows only the untracked paths that were there before this plan, plus any SUMMARY the orchestrator has yet to commit. `public/service-worker.js` is clean.
- `git log` shows the RED, fix and docs commits, each ending with the two trailer lines, and nothing has been pushed.
</verification>

<success_criteria>
- `site.url` is `https://www.tlui.de` (D-13), and production-build canonicals, sitemap and robots name it.
- `canFetchNeutral` allows that exact host and rejects the near-miss hosts, with the loopback and VERCEL_* checks unchanged (T-12-03).
- The seo, og and not-found specs pass on three engines.
- The deferred row stays acknowledged with the exact pending retest, and nothing in the out-of-scope list changed.
</success_criteria>

<output>
Create `.planning/quick/261105-wty-switch-canonical-host-to-www-tlui-de-sit/261105-wty-SUMMARY.md` when done. It must state plainly that the live retest has not run, give the exact retest commands, and say the cause of today's www behaviour remains unconfirmed until that retest passes.
</output>
