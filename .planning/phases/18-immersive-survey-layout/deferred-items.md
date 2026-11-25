# Phase 18 deferred items

Out-of-scope discoveries logged by executors. Not fixed by the plan that found them.

## From 18-06 (2026-11-25)

- **Firefox audit flake on /offline.** `e2e/audit.spec.ts` "/offline: axe, CLS, links, images, CSP, console" failed twice in one local Firefox run on a production build: once at a `toBeVisible()` assertion, once with `frame.evaluate: Page crashed` inside AxeBuilder.analyze. Two later Firefox runs of the whole audit spec passed 16/16. 18-06 does not touch /offline or the audit helper, and the region-page audit rows passed every time. Worth watching in CI. If it recurs there, look at Firefox memory under axe on the offline page.

## From 18-08 (2026-11-25)

- **The /offline Firefox audit flake came back once.** Same symptom as above (`frame.evaluate: Page crashed` in AxeBuilder.analyze), on one full audit + keyboard run on a production build. The Firefox audit spec then passed 16/16 on its own. 18-08 does not touch /offline.
- **Portrait srcset descriptors overstate the file width (13 #34, for 18-19).** `imageSet` in `lib/photos/view-model.ts` (lines 203-204) writes each candidate's `w` descriptor as the variant's **long edge**. For a landscape photo that is its width. For a portrait (3:4) it is the height, so the descriptor claims 4/3 of the file's real width. The browser then picks a candidate that is too small: at DPR 2, a portrait figure 483 px wide needs 966 px, takes the "1024w" file, and gets a file 768 px wide. At DPR 1, the width every local and CI project uses, nothing is under-fetched. The 18-08 e2e decodes each chosen file and checks its pixel width against rendered width × DPR, and it passes. The fix is to use `v.width` as the descriptor. That changes the srcset on the grid tiles and the lightbox stage, which are baselined pages, so it belongs with 18-19's stage `sizes` work and its re-baseline, not with 18-08.
