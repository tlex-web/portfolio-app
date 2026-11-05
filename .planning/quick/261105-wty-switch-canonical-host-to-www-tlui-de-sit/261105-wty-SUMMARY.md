---
quick_id: 261105-wty
slug: switch-canonical-host-to-www-tlui-de-sit
phase: quick-261105-wty
plan: 01
subsystem: seo, edge
tags: [canonical-host, D-13, T-12-03, proxy, seo]
status: complete
date: 2026-11-05
dependency_graph:
  requires: [261105-wlf]
  provides: [site.url on www.tlui.de, canFetchNeutral allows the canonical host]
  affects: [metadataBase, page canonicals, sitemap.xml, robots.txt, OG URLs, 404 on www]
tech_stack:
  added: []
  patterns: [one host constant (D-13) read by the proxy, exact hostname match]
key_files:
  created: []
  modified:
    - data/site.ts
    - proxy.ts
    - lib/__tests__/proxy.test.ts
    - data/__tests__/site.test.ts
    - .planning/PROJECT.md
    - .planning/milestones/v2.0-phases/12-contact-edge-pages-cleanup-verification/deferred-items.md
decisions:
  - canFetchNeutral allows the hostname of site.url by exact match; no second host literal and no environment variable (chosen in the plan's design table)
  - The apex stays out of the allowance; a miss there would get the plain rewrite, a correct 404
metrics:
  duration: 258 s, from the recorded start to the docs commit
  completed: 2026-11-05
actuals:
  tokens: 4432
  tasks: 3
  commits: 3
plan_head_before: 7859178ae4f06a1bdc9755a47a87b356fa6c138e
plan_head_after: 2b923714ef3fe1f3a3cb1606fa366e08e1933b11
---

# Quick Task 261105-wty: Switch the canonical host to www.tlui.de

`site.url` is now `https://www.tlui.de`, and `canFetchNeutral` allows exactly that hostname, read from `site.url`, so a miss on www can get the neutral 404. The code is done and tested locally. **The live retest passed after the deploy (see the next section).**

## Live retest: passed on 2026-11-05 at 23:42 UTC

PR #113 merged as `8cc1df4` and production picked it up 107 s later. `/photos/nope` answered 404 in 0.41 to 0.79 s on three runs and `/projects/nope` answered 404 in 0.20 s, with `nope` absent from both bodies. The flight data reads `"c":["","photos","_"]`, also through the service worker in Edge. robots, the 11 sitemap URLs and the canonicals name www, and the home and project HTML hold no old host. The host allowance and the redeploy landed together, so this run cannot separate them as the cause of the earlier behaviour. The text below is the plan as it stood before the deploy.

## Live retest: the plan

The www miss path runs only on production, and a production deploy happens only after Tim merges to main. No local run can reach it, because `next start` builds `request.url` from its own hostname. Locally, that branch is proved only by the unit tests, which drive `proxy()` with a real `NextRequest` and a mocked fetch.

**The cause of today's www behaviour remains unconfirmed until this retest passes.** The `VERCEL_*` values cannot be read from outside, so nothing here shows that they are why www is rejected today.

Run after the deploy:

```bash
curl -sS -o /dev/null -w '%{http_code} %{time_total}\n' https://www.tlui.de/photos/nope
curl -sS https://www.tlui.de/photos/nope | grep -c nope
```

The first must print 404 and well under 5 s. The second must print 0 (it printed 1 on 2026-11-05, before this change). If `nope` is still there, the host check was not the whole cause: find out whether the neutral fetch fails or times out on www before changing anything else. The Phase 12 deferred row stays `status: acknowledged` until both checks hold.

## Results

| Check | Result |
|-------|--------|
| RED, `npx jest lib/__tests__/proxy.test.ts -t "canonical host self-fetches"` | 7 failed, 1 passed, 52 skipped by the filter. Test (c) passed at HEAD, as the plan predicted |
| GREEN, `npx jest lib/__tests__/proxy.test.ts data/__tests__/site.test.ts` | 66 passed (58 existing, 8 new) |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint`, guards included | exit 0 |
| `npx jest` | 102 suites, 1702 tests passed |
| `PW_PROD=1`, e2e/seo.spec.ts, chromium | 14 passed |
| `PW_PROD=1`, seo, og and not-found specs, chromium, firefox and webkit | 126 passed, 0 failed, 0 flaky, 0 skipped. Local retries are 0 (`playwright.config.ts:86`) |
| Fresh build output, `.next/server/app` | robots names `https://www.tlui.de/sitemap.xml`; all 11 sitemap URLs use www; no built `.html` or `.body` file holds the old host |

Port 3000 was free after each Playwright run, and `public/service-worker.js` is clean.

## Tasks

| Task | Commit | What |
|------|--------|------|
| 1, RED | `945a8c5` | 8 canonical-host tests. Existing tests changed only in comments and one describe title |
| 1, fix | `ce4c99c` | `site.url` flip, proxy allowance and the site.test comment, in one commit (regression risk 3) |
| 2 | none | Verification only; nothing failed, so nothing was committed |
| 3 | `2b92371` | Deferred row outcome note, status still acknowledged; three PROJECT.md lines updated |

## Deviations from Plan

None in behaviour or scope. Two comments in `lib/__tests__/proxy.test.ts` differ slightly in wording, to keep them short:

- The apex comment reads "The apex is listed because it must not be allowed: Vercel redirects it to www first."
- The `PROD_HOST` comment became a three-line block comment.

The requirement IDs in the plan (SEO-01, SEO-02, SEO-03, EDGE-01) are v2.0 IDs with no new requirement, and REQUIREMENTS.md was removed at the v2.0 close, so nothing was marked complete.

## Risks still open

1. If the neutral fetch fails or hangs on www on production, each miss waits up to `NEUTRAL_TIMEOUT_MS` (5 s) before the plain rewrite. It is still a correct 404. The retest's `time_total` reads this.
2. On deploy every canonical and OG URL moves host, which D-13 calls costly to undo once indexed. Tim chose www.tlui.de on 2026-11-02.
3. The GitHub repo homepage still names the vercel.app host and keeps working through the 308. It was left alone because Tim has not asked to change it.

## Not touched

The GitHub repo homepage, Vercel and Strato settings, visual baseline PNGs and guard selftest fixtures. Nothing was pushed.

## Known Stubs

None.

## Self-Check: PASSED

- All six modified files are in `git diff --name-only 7859178..HEAD`, and that list holds no other file.
- `945a8c5`, `ce4c99c` and `2b92371` are ancestors of HEAD, and each ends with the two trailer lines.
- `git rev-list --count 7859178..HEAD` is 3.
