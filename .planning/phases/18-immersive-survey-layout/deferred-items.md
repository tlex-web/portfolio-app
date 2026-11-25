# Phase 18 deferred items

Out-of-scope discoveries logged by executors. Not fixed by the plan that found them.

## From 18-06 (2026-11-25)

- **Firefox audit flake on /offline.** `e2e/audit.spec.ts` "/offline: axe, CLS, links, images, CSP, console" failed twice in one local Firefox run on a production build: once at a `toBeVisible()` assertion, once with `frame.evaluate: Page crashed` inside AxeBuilder.analyze. Two later Firefox runs of the whole audit spec passed 16/16. 18-06 does not touch /offline or the audit helper, and the region-page audit rows passed every time. Worth watching in CI. If it recurs there, look at Firefox memory under axe on the offline page.
