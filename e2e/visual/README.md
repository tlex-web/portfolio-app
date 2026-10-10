# Visual regression baselines (GUARD-02)

`routes.spec.ts` screenshots every route at 375, 768 and 1440 px in the
`visual-dark` and `visual-light` Playwright projects, plus Home at 0 / 50 /
100 % scroll with motion enabled: 36 tests per scheme, 72 PNGs. Every later
Phase 7 plan is judged against these files.

## Rules

- Comparison is zero tolerance: default threshold, no `maxDiffPixels`. One
  differing pixel fails the run.
- Baselines are captured only from a production build inside
  `mcr.microsoft.com/playwright:v<lockfile @playwright/test version>-noble`,
  by the **Update visual baselines** workflow (`workflow_dispatch`, read-only
  token, artifact upload only). The parity guard keeps the container tag equal
  to the lockfile version.
- Only `-linux.png` files are ever committed. Never run `--update-snapshots`
  locally on Windows. `.gitignore` ignores `-win32.png` and `-darwin.png`
  files under `e2e/`, and `check-snapshot-commit.mjs` rejects any non-Linux
  PNG in a commit.
- The CI compare job never uses `--update-snapshots=missing` or `all`. Under CI
  the config sets `updateSnapshots: 'none'`, so a missing PNG fails the run.
- Snapshot names are explicit arrays (`['photos', '375-reduced.png']`), stored
  as `routes.spec.ts-snapshots/<route>/<width>-<mode>-<project>-linux.png`.
  Retitling or reordering tests does not orphan files.
- Canvases (WebGL, random particles) are hidden through `hide-canvas.css`
  (`stylePath`), never masked. A mask would paint over the full-bleed canvases
  and the content above them. Infinite JS-driven animations that Playwright's
  `animations: 'disabled'` cannot reach are pinned in the same file; a new one
  shows up as "Failed to take two consecutive stable screenshots".

`<NN>` below is the plan number (`ci/07-05` for plan 07-05). `ci/**` pushes run
the CI workflow.

## Zero-diff gate

For a plan whose change must not move a single pixel:

1. The executor commits.
2. Tim pushes from the executor's working directory:
   `git push --force origin HEAD:refs/heads/ci/07-NN`
3. The executor runs
   `node scripts/ci/check-visual-run.mjs --sha <HEAD> --wait 30`
   and needs exit 0 (`PASS <job url>`). Exit 1 is a pixel diff; exit 2 means
   the job is still pending, missing, or the API could not be read. Set
   `GITHUB_TOKEN` for long waits (the anonymous API allows 60 requests/hour).
4. The executor also runs
   `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --none`
   to prove no PNG changed.

A failure is never re-baselined in a zero-diff step. The code is fixed until
the pixels match.

## Intentional re-baseline

For a plan that is meant to change some screenshots:

1. The executor commits, with the reason for the visual change in the commit
   body and the expected PNG list in the plan.
2. Tim pushes to `ci/07-NN`:
   `git push --force origin HEAD:refs/heads/ci/07-NN`
3. Tim runs **Actions -> Update visual baselines -> Run workflow** on
   `ci/07-NN` with suite `visual` (update_mode `changed`, or `all` for a full
   regeneration).
4. Tim downloads the `visual-baselines` artifact and unzips it into
   `e2e/visual/routes.spec.ts-snapshots/`, overwriting existing files. The
   zip's contents (the route folders `home/`, `photos/`, ...) go directly into
   that folder. Windows "Extract all" adds a wrapper folder named after the
   zip (`visual-baselines/`); do not keep it.
5. Tim reviews `git status --short e2e/visual` against the plan's expected
   list and opens the changed PNGs.
6. Tim commits by hand:
   `git add e2e/visual && git commit --amend --no-edit`
   then force-pushes to `ci/07-NN` again.
7. The executor verifies the changed set, for example
   `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some --allow photos`
   (add `--allow-deletions` only when the plan deletes PNGs), and the green CI
   run with `node scripts/ci/check-visual-run.mjs --sha <HEAD> --wait 30`.

## Running locally

`npx playwright test --project=visual-dark --list` lists the matrix. A local
run uses the dev server unless `PW_PROD=1` is set, and writes `-win32.png`
files on Windows. Use a local run only to debug a spec, never to produce or
update baselines, and do not commit what it writes.
