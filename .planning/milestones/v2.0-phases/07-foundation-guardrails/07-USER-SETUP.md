# Phase 7: User Setup Required

**Generated:** 2026-10-10
**Phase:** 07-foundation-guardrails
**Status:** Incomplete

Complete these items to confirm the production build matches CI and that CI actually gates merges. Claude automated everything it could; these items need access to the Vercel dashboard and the GitHub repository settings.

## Environment Variables

None. No new variables are needed.

## Dashboard Configuration

- [ ] **Confirm Vercel builds on Node 24.x with `npm ci`** (from plan 07-01)
  - Location: Vercel -> Project -> Deployments -> latest -> Build Logs
  - Check: the log shows Node `24.x` and the install step runs `npm ci`
  - Why: `package.json` `engines.node` is now `24.x`, which overrides the dashboard Node version. The guard checks committed files only. It does not query the live Vercel project setting, so the first build log is the proof.
  - When: after the first push of branch `gsd/phase-07-foundation-guardrails` (preview deploy) or its merge to `main`
  - If it still shows Node 20: Vercel -> Project -> Settings -> Build and Deployment -> Node.js Version. Set it to 24.x, or clear any override so it follows `engines`.

- [ ] **Require the CI jobs on `main`** (from plan 07-04; Tim was told on 2026-10-11, not yet confirmed done)
  - Location: GitHub -> tlex-web/portfolio-app -> Settings -> Branches -> Branch protection rules -> `main` (or Rules -> Rulesets, if `main` uses a ruleset)
  - Add as required status checks: `Visual Regression`, `Lint and Type Check`, `Unit Tests`
  - Why: CI runs these jobs on every push and PR, but a job only blocks a merge if it is a required status check. Without this, a red visual diff can still be merged.
  - When: any time. GitHub only offers a check name in the picker after the job has run once in the last week; `Visual Regression` first ran on `ci/07-04` (run 38095944534), so all three names are available.
  - Check: open a PR into `main`; its merge box lists the three checks as "Required"

## Verification

Run locally before pushing (Claude already ran these on 2026-10-10, and all exited 0):

```bash
npm ci && npm ls --depth=0
npm run guard:parity
npm run guard:selftest
```

Expected results:
- `parity: OK`
- `selftest: 9/9 cases passed`
- The Vercel build log shows Node 24.x and `npm ci`

---

**Once all items are complete:** Mark the status at the top of this file as "Complete".
