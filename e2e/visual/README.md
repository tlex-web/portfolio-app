# Visual regression baselines (GUARD-02)

`routes.spec.ts` screenshots every route at 375, 768 and 1440 px in the
`visual-dark` and `visual-light` Playwright projects, plus Home at 0 / 50 /
100 % scroll with motion enabled: 36 tests per scheme, 72 PNGs. Every later
Phase 7 plan is judged against these files.

## Rules

- Comparison is zero tolerance: `threshold: 0`, no `maxDiffPixels`. One
  differing pixel fails the run, however small its colour change. Playwright's
  default per-pixel threshold (0.2) hides token-level colour shifts.
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

### With the GitHub CLI (optional, replaces steps 3-4)

The browser dialog defaults to `main` and Windows "Extract all" adds a wrapper
folder; both went wrong once in 07-04. `gh` avoids both, because `--ref` is
explicit and `-D` extracts the artifact's contents with no wrapper:

```bash
gh workflow run visual-baselines.yml --ref ci/07-NN -f suite=visual -f update_mode=changed
gh run list --workflow visual-baselines.yml --branch ci/07-NN --limit 1   # note the run id; gh run watch <id> to follow it
gh run download <id> -n visual-baselines -D e2e/visual/routes.spec.ts-snapshots
```

If `gh run download` refuses to overwrite existing files, download to a temp
folder and copy only the changed PNGs into place. The workflow uploads the
whole `routes.spec.ts-snapshots/` folder, so a stray subfolder committed there
comes back in the artifact; check `git status --short e2e/visual` for anything
outside the expected list.

## Running locally

`npx playwright test --project=visual-dark --list` lists the matrix. A local
run uses the dev server unless `PW_PROD=1` is set, and writes `-win32.png`
files on Windows. Use a local run only to debug a spec, never to produce or
update baselines, and do not commit what it writes.
