---
phase: quick-261106-joo
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .github/dependabot.yml
  - scripts/guards/selftest.mjs
  - scripts/guards/__selftest__/parity/good/package.fixture.json
  - scripts/guards/__selftest__/parity/good/package-lock.fixture.json
  - scripts/guards/__selftest__/parity/bad/package.fixture.json
  - scripts/guards/__selftest__/parity/bad/package-lock.fixture.json
  - e2e/visual/routes.spec.ts
  - playwright.config.ts
  - e2e/visual/README.md
  - .planning/STATE.md
  - .planning/debug/knowledge-base.md
  - .planning/debug/resolved/12-slug-script-data.md
  - .planning/debug/resolved/e2e-test-ci-failures.md
  - .planning/debug/resolved/eslint10-ci-failures.md
  - .planning/debug/resolved/hero-scrim-over-rail.md
  - .planning/debug/resolved/hidden-tab-burst-decline.md
  - .planning/debug/resolved/summit-pins-under-plaque.md
  - .planning/debug/resolved/waypoint2-label-and-kicker.md
autonomous: true
requirements: [USER-A, USER-D]

estimate:
  tokens: 70000
  raw_tokens: 70000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "Dependabot no longer proposes ESLint or TypeScript majors, tailwindcss and @tailwindcss/postcss move in one group PR for every semver level, and @playwright/test opens on its own"
    - "No package.json or package-lock.json remains under scripts/guards/__selftest__/parity, so GitHub's dependency graph has nothing to scan there"
    - "Every existing parity selftest case passes with its expected output unchanged, and check-install-parity.mjs is byte-identical to HEAD"
    - "Only the 1440 + waypoint-2 ascent shot has a pixel tolerance; SCREENSHOT and every other shot keep threshold 0.01 and zero differing pixels"
    - "Each debug session moved to .planning/debug/resolved/ has evidence behind its status; eslint10-ci-failures says superseded and claims no verified fix"
    - "STATE.md no longer calls the real send unconfirmed, keeps the Upstash concern, and its Deferred Items rows match what was closed"
    - "Nothing was pushed, no PNG was committed, and no .claude settings file or production app code changed"
  artifacts:
    - path: .github/dependabot.yml
      provides: "Major ignores, tailwind group, Playwright exclusion, each with its reason"
      contains: "exclude-patterns"
    - path: scripts/guards/selftest.mjs
      provides: "tempParityRoot materialises a parity fixture under its real manifest names in a temp dir"
      contains: "tempParityRoot"
    - path: scripts/guards/__selftest__/parity/good/package-lock.fixture.json
      provides: "Fixture lockfile under a name GitHub does not scan (same in bad/, and package.fixture.json in both)"
    - path: e2e/visual/routes.spec.ts
      provides: "maxDiffPixels 3 on home/1440-ascent-waypoint-2 only, with the evidence at the call site"
      contains: "maxDiffPixels: 3"
    - path: .planning/debug/knowledge-base.md
      provides: "GSD knowledge base, one entry per closed session"
      contains: "GSD Debug Knowledge Base"
  key_links:
    - from: scripts/guards/selftest.mjs
      to: scripts/guards/check-install-parity.mjs
      via: "case setup() returns --root pointing at the temp copy holding the real manifest names"
      pattern: "tempParityRoot"
    - from: .github/dependabot.yml
      to: .github/workflows/ci.yml
      via: "the comment on the @playwright/test exclusion names the container tags the parity guard compares"
      pattern: "visual-baselines"
    - from: e2e/visual/routes.spec.ts
      to: playwright.config.ts
      via: "the per-call option merges over SCREENSHOT, so threshold 0.01 stays in force; the policy comment records the exception"
      pattern: "1440-ascent-waypoint-2"
---

<objective>
Ship Tim's approved options A and D on the current branch as commits for one PR, which the orchestrator opens later.

Purpose: remove 40 of 60 Dependabot alerts and all 10 criticals (every one comes from stale parity fixture manifests), stop Dependabot proposing bumps known to fail, stop the 2 px flake that keeps failing Visual Regression, and bring the planning state in line with the evidence.
Output: updated `.github/dependabot.yml`, renamed fixtures with a materialising selftest, a one-shot visual tolerance, and seven closed debug sessions.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@AGENTS.md

Branch `chore/dependabot-config-fixtures`, forked from origin/main at 8270572. Do not push. Do not merge. Do not edit any `.claude` settings file, commit any PNG, or change production app code.

Commit rules. Use plain `git add <explicit paths>` and `git commit`: `gsd query commit` omits the trailer. Every commit message ends with this line:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Never stage `.claude/`, `.planning/state.json`, `.planning/ui-reviews/` or `graphify-out/`, and never use `git add -A`, `git add .` or a directory-level add under `.planning/`.

<approval>
Tim's selection, as quoted by the orchestrator:
- A: "One PR updates dependabot.yml (ignore ESLint 10 and TypeScript 7 majors, keep the Tailwind pair together, take Playwright out of the group) and renames the parity fixture lockfiles, removing 40 of 60 alerts and all 10 criticals."
- D: "Correct the stale STATE.md blocker (real send is confirmed), close the finished debug session files, and add a small tolerance for the 2 px flake on home/1440-ascent-waypoint-2, which also caused #103's only failure."
No other approval exists. Do not write in any record that Tim confirmed a session, a fix or a check.
</approval>

<dependabot_semantics>
Verified 2026-11-06 against the options reference (https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference) and, where the docs are silent, dependabot-core source.

| Question | Finding | Source |
|----------|---------|--------|
| Group precedence | "If a dependency matches more than one rule, it's included in the first group that it matches." So `tailwind` goes first. | Docs |
| Ungrouped result | "Any outdated dependencies that do not match a rule are updated in individual pull requests." So an excluded `@playwright/test` opens alone. | Docs |
| Multi-type group | "By default, a group will include all types of dependencies." So no `dependency-type` on `tailwind`. | Docs |
| `update-types` on `tailwind` | Omit it. "By default, a group will include updates for all semantic versions." With `[minor, patch]`, a major would fall out of the group and split the pair again. | Docs |
| `exclude-patterns` with `dependency-type`, no `patterns` | The docs do not say how they combine. Core's `DependencyGroup#contains?` returns false on an excluded name first, then requires `matches_pattern?` (true when no patterns are set) and `matches_dependency_type?`. So it works. The schemastore schema also allows it. | `common/lib/dependabot/dependency_group.rb` |
| Why exclude Tailwind as well as ordering it first | Core's `assign_dependency_to_matching_groups` pushes a dependency into every matching group, and `dependency_belongs_to_more_specific_group?` returns false for a group with no patterns, so the pattern-less dev and prod groups would still collect it. Excluding the pair from both makes it belong to one group under either reading. | `updater/lib/dependabot/dependency_group_engine.rb`, `pattern_specificity_calculator.rb` |
| `ignore` form | `update-types: ["version-update:semver-major"]`, as the `next` and `react` rules already use. The docs do not describe an `ignore`/`groups` interaction. | Docs, existing file |

Checked live 2026-11-06: eslint-plugin-jsx-a11y 6.10.2, eslint-plugin-react 7.37.5 and eslint-plugin-import 2.32.0 all cap their eslint peer at 9; @typescript-eslint/eslint-plugin 8.72.1 peers typescript `>=4.8.4 <6.1.0`.
</dependabot_semantics>

<dependabot_target>
The `groups` and `ignore` keys of the npm block should read as follows. Keep every other key in the file as it is.

```yaml
    # Group minor and patch updates together. A dependency goes in the first
    # group it matches, so tailwind comes first.
    groups:
      # tailwindcss is a dev dependency and @tailwindcss/postcss a production one,
      # and the two versions must move together. No dependency-type and no
      # update-types on purpose: the group spans both types, and a major arrives
      # as one PR too.
      tailwind:
        patterns:
          - "tailwindcss"
          - "@tailwindcss/postcss"
      development-dependencies:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"
        exclude-patterns:
          - "tailwindcss"
          - "@tailwindcss/postcss"
          # Playwright opens on its own: the parity guard requires the
          # mcr.microsoft.com/playwright:vX.Y.Z-noble tags in ci.yml and
          # visual-baselines.yml to equal the lockfile version, so a lone bump
          # is red until those tags change in the same PR.
          - "@playwright/test"
      production-dependencies:
        dependency-type: "production"
        update-types:
          - "minor"
          - "patch"
        exclude-patterns:
          - "tailwindcss"
          - "@tailwindcss/postcss"
    # Ignore specific packages if needed
    ignore:
      # Major version updates for these packages require manual review
      - dependency-name: "next"
        update-types: ["version-update:semver-major"]
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]
      - dependency-name: "react-dom"
        update-types: ["version-update:semver-major"]
      # ESLint 10: the latest eslint-plugin-jsx-a11y, eslint-plugin-react and
      # eslint-plugin-import all cap their eslint peer at 9.
      - dependency-name: "eslint"
        update-types: ["version-update:semver-major"]
      - dependency-name: "@eslint/js"
        update-types: ["version-update:semver-major"]
      # TypeScript 7: the latest typescript-eslint (8.72.1) needs typescript below 6.1.0.
      - dependency-name: "typescript"
        update-types: ["version-update:semver-major"]
```
</dependabot_target>

<flake_evidence>
Live from `gh run view --log-failed` and the `visual-diff` artifacts, 2026-11-06. The logs have not expired.

| Run | Commit | Project | Reported |
|-----|--------|---------|----------|
| 42105785881 | PR #103 latest | visual-dark | 2 pixels |
| 42127714611 | main a50956e | visual-light | 2 pixels |
| 42149842086 | main 8270572 | visual-light | 2 pixels |

Comparing each run's actual PNG with its baseline gives the same result in all three: 107 raw-different pixels with identical coordinates and deltas, 10 of them above a delta of 2, the largest at x 137-141, y 710-717 (deltas of 5-8 per channel). That is the slanted right edge of the poster's triangle mark. The shot therefore renders in two stable states, and the diff does not grow. Both projects hit it, so the option must apply to both, and a per-call option does.

Tolerance: `maxDiffPixels: 3`, the observed 2 plus a margin of 1. Playwright fails on `count > maxDiffPixels` (`playwright-core` `coreBundle.js` comparator), and `SnapshotHelper` merges per-call options over the project's `toHaveScreenshot` config, so `threshold: 0.01` stays in force.

No guard or test forbids the option: `maxDiffPixels` appears only in `playwright.config.ts:27` and `e2e/visual/README.md:35`. Both are comments stating the policy, so both get the exception.
</flake_evidence>

<session_evidence>
Observed at planning time on 8270572. Re-check the commands in Task 3 before closing; a session whose evidence no longer holds stays open and gets reported.

| Session | Closing status | Fixed by | Evidence |
|---------|---------------|----------|----------|
| hidden-tab-burst-decline | resolved | 09-15: 450b2a6, 9f35845, 49a3dac | `burstPaused` in `components/home/terrain/CameraRig.tsx`; test "a tab hidden during the reveal burst restarts it" in `e2e/home-canvas.spec.ts`; 09-VERIFICATION `gaps_closed` and "VERIFIED (behavioral)"; CI run 40232792001 |
| hero-scrim-over-rail | resolved | 09-17: 1da76cd, fc54409 | G-09-4 N1 rail layer in `components/home/AscentHero.tsx`; `composedContrast` in `e2e/home-modes.spec.ts`; 09-VERIFICATION `gaps_closed`, "VERIFIED", noted there as not pixel-measured |
| summit-pins-under-plaque | resolved | 09-18: d4fc6c7, dd7c5aa, 3799586; 09-20: 3a8f228, bcdb0fe, 8798b71 | `lib/ascent/summit-layout.ts`, `summit-compact` in `app/globals.css`; describe "Summit plaque clears the poster pins (G-09-2, static)"; 09-VERIFICATION "VERIFIED for the 11 sizes". Remaining overlaps were put to Tim in 09-UAT round 2 as accept-or-route items, and each result is `pass`: test 1 (phone summit crop), test 2 (reduced motion at 375x667), test 3 (landscape phones). Name these as accepted residue; do not call the overlap gone at every size |
| waypoint2-label-and-kicker | resolved | 09-16: d307211, d4ed0b3; 09-19: 7ef7ea2, ce1b985, 68fd6d5; 09-21: 40c50f9, e8c85f8 | `waypointKickerParts`, `data-kicker-part`, `placePinLabel`, `waypointTarget`; describes "Card line breaks (G-09-3 b, G-09-4 N2)", "Lit poster label clears its card and the rail (G-09-3 a)", "md stages keep the lit 3D pin and its label clear of the card (G-09-3 a)"; 09-VERIFICATION `gaps_closed`. Accepted residue: waypoint 3's label is hidden in the static poster at about 768-1090 px (D-09 amendment, Tim's literal "Accept, amend D-09", `deferred-items.md`) |
| 12-slug-script-data | resolved | Phase 12 (`proxy.ts`, `components/SpeedInsightsRoute.tsx`) plus quick task 261105-wty, which made www.tlui.de eligible for the neutral render | The session's open item was a self-fetch check on a Vercel preview. Production is the stronger environment, because its blind spot was Vercel-only: 261105-wty's live retest passed 2026-11-05 23:42 UTC with `"c":["","photos","_"]`, and a fresh-token probe at planning time returned 404 and 0 token occurrences on `/photos/` and `/projects/`, with "All photographs" in the `/photos/` body. State that the preview itself was not checked, and that an agent ran these checks, not Tim. The prefetch gap it logged is closed in `12/deferred-items.md` (12-29) |
| e2e-test-ci-failures | resolved | 241cbbf (2026-03-12) | `playwright.config.ts:39` sets `prod` from `CI`, and `:162` runs `npm run build && npm run start`; `git grep networkidle -- e2e` finds nothing; `E2E Tests` job success on main in runs 42142874586 (98d7b6c), 42131108792 (8cc1df4), 42127714611 (a50956e). Run 42149842086 (8270572) shows the job `cancelled` at its 60-minute timeout after 42 minutes in "Install Playwright browsers": a separate infrastructure symptom with no test failure, so note it and do not count it as a pass |
| eslint10-ci-failures | superseded | Its fix was b4e0cbb. 5deb55c (2026-04-02, "downgrade ESLint to 9.x for TS6 compat") took main back to ESLint 9, and e649f92 (07-02) removed the `@eslint/js` devDependency | `package.json` at HEAD declares `eslint` `^9.28.0` and no `@eslint/js`. The ESLint 10 fix can no longer be checked on main, so the record must not call it verified. The `jest.setup.js` mocks from b4e0cbb are still present (grep count 8) |
</session_evidence>

<source_audit>
| Source | ID | Item | Task | Status | Notes |
|--------|----|------|------|--------|-------|
| GOAL | A | Ignore ESLint 10 and TypeScript 7 majors | 1 | COVERED | |
| GOAL | A | Keep the Tailwind pair together | 1 | COVERED | |
| GOAL | A | Take Playwright out of the group | 1 | COVERED | `@playwright/test` only; `@axe-core/playwright` stays grouped because the parity guard does not read it |
| GOAL | A | Rename the parity manifests | 1 | COVERED | Both manifests in both fixtures; the alert drop can only be proved after merge |
| GOAL | D | Correct the stale STATE.md blocker | 3 | COVERED | Already correct at HEAD (9d87fe8); Task 3 asserts it and edits nothing on that line |
| GOAL | D | Close the finished debug sessions | 3 | COVERED | Evidence per session above |
| GOAL | D | Tolerance for the 2 px flake | 2 | COVERED | |
| REQ | - | No ROADMAP IDs: this is a quick task. USER-A and USER-D name Tim's two options | 1-3 | COVERED | |
| RESEARCH | - | None: no research phase | - | N/A | |
| CONTEXT | - | No CONTEXT.md | - | N/A | |
</source_audit>
</context>

<tasks>

<task type="tracer">
  <name>Task 1: Parity fixtures reach the guard under names GitHub does not scan, and dependabot.yml gets its rules</name>
  <files>scripts/guards/__selftest__/parity/good/package.fixture.json, scripts/guards/__selftest__/parity/good/package-lock.fixture.json, scripts/guards/__selftest__/parity/bad/package.fixture.json, scripts/guards/__selftest__/parity/bad/package-lock.fixture.json, scripts/guards/selftest.mjs, .github/dependabot.yml</files>
  <read_first>scripts/guards/selftest.mjs, scripts/guards/check-install-parity.mjs, .github/dependabot.yml</read_first>
  <action>
    Part 1, one end-to-end path: fixture on disk to selftest harness to production guard. In each of `scripts/guards/__selftest__/parity/good` and `.../bad`, use `git mv` to rename `package.json` to `package.fixture.json` and `package-lock.json` to `package-lock.fixture.json`, with content unchanged. GitHub's dependency graph scans package.json as a manifest as well as the lockfile, so both must go.

    Do not touch `scripts/guards/check-install-parity.mjs`, and add no test-only flag to it: it reads fixed names via `--root`.

    In `scripts/guards/selftest.mjs`, next to `tempBaseline` and `tempRatchet` and in the same style, add `tempParityRoot(fixtureName)`. It does `fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'))`, sets `root` to `path.join(dir, 'root')`, runs `fs.cpSync(path.join(fixtures, 'parity', fixtureName), root, { recursive: true })` (this keeps `.github`, `.node-version`, `scripts/` and `vercel.json`), renames the two `*.fixture.json` files inside `root` back to `package.json` and `package-lock.json`, and returns `root`. Give it a short comment: the fixtures are stored under other names because GitHub's dependency graph scans every manifest in the repository, and the guard reads the real names. Add `let parityGoodRoot = null;` and `let parityBadRoot = null;` beside the helper.

    Change the two parity cases to the existing `setup` pattern: `args: []`, plus `setup: () => { parityGoodRoot = tempParityRoot('good'); return ['--root', parityGoodRoot]; }`, and the same for `bad`. Leave their names, `expectExit` and every `expectOutput` line exactly as they are. Add both variables to the array in the final cleanup loop; its `path.dirname(file)` removes the mkdtemp directory, which is why the helper nests `root` one level down.

    Run `npm run guard:selftest` before moving on.

    Part 2: edit `.github/dependabot.yml` so the npm block's `groups` and `ignore` match the `dependabot_target` block in the context above, including the comments. This covers Tim's approval A. Keep every other key, and leave the github-actions block alone.

    Check other readers before committing. Planning found none: `.gitattributes` scopes only served-images, `eslint.config.mjs:105` and `tsconfig.json:45` ignore all of `__selftest__`, no parity README exists, and the `.planning/milestones` mentions are historical and stay as they are. Re-run `git grep -n -E "parity/(good|bad)" -- . ':!.planning'` and handle any new hit. `identity/*/package.json` declare only `private`, `description` and `author`, with no dependencies, so they are out of scope; report that in the SUMMARY.

    Commit twice: one `test(guards):` commit for the renames and selftest, one `chore(deps):` commit for dependabot.yml.
  </action>
  <verify>
    <!-- Baselines at HEAD: yaml check exit 1 (no tailwind group); the real-name listing has 4 paths, so test -z fails; error-unmatch fails (no fixture names yet); selftest 87/87 and the unchanged guard are no-change gates. -->
    <automated>node -e "const y=require('js-yaml'),fs=require('fs');const n=y.load(fs.readFileSync('.github/dependabot.yml','utf8')).updates.find(u=>u['package-ecosystem']==='npm');const g=n.groups,tw=['tailwindcss','@tailwindcss/postcss'],d=g['development-dependencies'],p=g['production-dependencies'],t=g.tailwind;const ok=Object.keys(g)[0]==='tailwind'&&tw.every(x=>t.patterns.includes(x))&&!t['update-types']&&!t['dependency-type']&&d['exclude-patterns'].includes('@playwright/test')&&tw.every(x=>d['exclude-patterns'].includes(x)&&p['exclude-patterns'].includes(x))&&['eslint','@eslint/js','typescript'].every(x=>n.ignore.some(i=>i['dependency-name']===x&&String(i['update-types'])==='version-update:semver-major'));process.exit(ok?0:1)" && test -z "$(git ls-files 'scripts/guards/__selftest__/parity/*/package.json' 'scripts/guards/__selftest__/parity/*/package-lock.json')" && git ls-files --error-unmatch scripts/guards/__selftest__/parity/good/package.fixture.json scripts/guards/__selftest__/parity/good/package-lock.fixture.json scripts/guards/__selftest__/parity/bad/package.fixture.json scripts/guards/__selftest__/parity/bad/package-lock.fixture.json > /dev/null && npm run -s guard:selftest | grep -qF 'selftest: 87/87 cases passed' && git diff --quiet origin/main -- scripts/guards/check-install-parity.mjs</automated>
  </verify>
  <done>
    The four manifests exist only under their `*.fixture.json` names, with `git log --follow` history intact. The selftest reports 87/87 with the parity cases' expected output unchanged, and leaves no `guard-selftest-*` directory it created behind. `check-install-parity.mjs` is unchanged. `dependabot.yml` matches the target, with a stated reason on each new rule.
  </done>
</task>

<task type="auto">
  <name>Task 2: One-shot tolerance for home/1440-ascent-waypoint-2</name>
  <files>e2e/visual/routes.spec.ts, playwright.config.ts, e2e/visual/README.md</files>
  <read_first>e2e/visual/routes.spec.ts, playwright.config.ts, e2e/visual/README.md</read_first>
  <action>
    In `e2e/visual/routes.spec.ts`, at the `toHaveScreenshot` call inside the ascent loop (currently line 184), keep `stylePath` and `animations: 'allow'` and add a conditional spread as the last entry of the options object, which applies `maxDiffPixels: 3` only when `w === 1440 && shot === 'waypoint-2'` and adds nothing otherwise. Every other shot stays exactly as it is, and no module-level constant or helper is needed.

    Above the call, add a comment naming the evidence from `flake_evidence` in the context: this one shot renders in two stable states; runs 42105785881 (PR #103, visual-dark), 42127714611 (a50956e, visual-light) and 42149842086 (8270572, visual-light) each reported exactly 2 pixels, at identical coordinates on the slanted edge of the poster's triangle mark at about x 137-141, y 710-717. So 3 is the observed 2 plus a margin of 1, and no other shot gets a tolerance. In that comment, write the project as `visual-dark`, and never put a bare `dark` directly before a colon, because `guard:palette` scans `e2e/` and rejects that token. This comment must not repeat the option as `key: value`, because the spec's count gate reads that literal.

    In `playwright.config.ts`, add one line to the policy comment above `SCREENSHOT`, recording the single exception by name: `home/1440-ascent-waypoint-2` allows maxDiffPixels 3 at its call site in `e2e/visual/routes.spec.ts`. Do not change the `SCREENSHOT` constant.

    In `e2e/visual/README.md`, the first bullet under Rules states the same policy and would otherwise become false. Add the exception to that bullet in one short sentence, naming `home/1440-ascent-waypoint-2` once and saying it allows 3 differing pixels because that shot has two stable renders (see the comment in `routes.spec.ts`).

    No baseline changes. `git status` must show no PNG, and no PNG may be staged. Commit once as `test(visual):`.
  </action>
  <verify>
    <!-- Baselines at HEAD: the first four checks fail (none of that text exists yet); the SCREENSHOT line, list total 48 and empty snapshot status are no-change gates. tsconfig excludes e2e, so type-check does not cover this spec: playwright list and eslint are the local load checks, and CI's Visual Regression job is the real proof. -->
    <automated>grep -qF "w === 1440 && shot === 'waypoint-2'" e2e/visual/routes.spec.ts && node -e "const s=require('fs').readFileSync('e2e/visual/routes.spec.ts','utf8');process.exit((s.match(/maxDiffPixels: 3/g)||[]).length===1?0:1)" && grep -qF 'home/1440-ascent-waypoint-2' playwright.config.ts && grep -qF 'home/1440-ascent-waypoint-2' e2e/visual/README.md && grep -qF "const SCREENSHOT = { animations: 'disabled', caret: 'hide', threshold: 0.01 } as const;" playwright.config.ts && npx playwright test --list --project=visual-dark e2e/visual/routes.spec.ts | grep -qF 'Total: 48 tests in 1 file' && test -z "$(git status --short -- e2e/visual/routes.spec.ts-snapshots)"</automated>
  </verify>
  <done>
    Only 1440 + waypoint-2 carries `maxDiffPixels`, in both visual projects, and the evidence sits at the call site. Both policy statements name the single exception. No PNG changed, and the spec still lists 48 tests.
  </done>
</task>

<task type="auto">
  <name>Task 3: Close the finished debug sessions and align STATE.md</name>
  <files>.planning/STATE.md, .planning/debug/knowledge-base.md, .planning/debug/resolved/12-slug-script-data.md, .planning/debug/resolved/e2e-test-ci-failures.md, .planning/debug/resolved/eslint10-ci-failures.md, .planning/debug/resolved/hero-scrim-over-rail.md, .planning/debug/resolved/hidden-tab-burst-decline.md, .planning/debug/resolved/summit-pins-under-plaque.md, .planning/debug/resolved/waypoint2-label-and-kicker.md</files>
  <read_first>.planning/STATE.md, .planning/debug/resolved/offline-visual-diff-firefox.md (frontmatter, Resolution, Prevention only), each of the seven session files once, ~/.claude/agents/gsd-debugger.md lines 947-1021</read_first>
  <action>
    Step 1, the blocker. Blocker line 53 of `.planning/STATE.md` was already corrected at HEAD by 9d87fe8: it keeps the Upstash concern and records the 2026-11-06 send. Make no edit there, and leave the other two blockers alone. Report this no-op in the SUMMARY.

    Step 2, re-check evidence, read-only, before closing anything:
    - `git grep -n networkidle -- e2e` prints nothing.
    - `grep -c burstPaused components/home/terrain/CameraRig.tsx`, `grep -c placePinLabel components/home/AscentController.tsx`, `grep -c summitLayoutAt lib/ascent/summit-layout.ts`, `grep -c data-kicker-part components/home/WaypointCard.tsx`, `grep -c waypointTarget lib/ascent/framing.ts` and `grep -c composedContrast e2e/home-modes.spec.ts` are each above 0.
    - `gh run view 42142874586 --json jobs --jq '.jobs[] | select(.name=="E2E Tests") | .conclusion'` prints `success`.
    - The live miss path: set `T="nf-check-$(date +%s)"`, then for each of `https://www.tlui.de/photos/$T` and `https://www.tlui.de/projects/$T` confirm `curl -sS -o /dev/null -w '%{http_code}'` prints 404 and `curl -sS <url> | grep -c "$T"` prints 0. Also confirm the `/photos/` body contains `All photographs`.
    A failed check keeps the affected session open: leave its file in `.planning/debug/`, keep its STATE.md row, name it in the STATE sentence, and report it. If the live site cannot be reached, that counts as unverified for `12-slug-script-data` only.

    Step 3, safety scan. `e2e-test-ci-failures.md` and `eslint10-ci-failures.md` are untracked, so this is their first commit. Planning read both: they hold no secret, and the only credential-like text is the variable name `RESEND_API_KEY`. Re-run `grep -n -E 'ghp_|github_pat_|re_[A-Za-z0-9]{16,}|BEGIN (RSA|OPENSSH)' <file>` on both, and stop and report if anything matches.

    Step 4, close each session using `session_evidence` in the context. Read the file once. Set the frontmatter `status` (`resolved`, or `superseded` for eslint10-ci-failures), set `updated` to the current UTC time, and delete the `audit_acknowledged` block, as the precedent has none. Keep `goal` and everything else in the frontmatter. In `## Current Focus`, set `next_action` to none, closed 2026-11-06, see Resolution. Keep Symptoms, Eliminated and Evidence as written. In `## Resolution`, fill `fix`, `verification` and `files_changed` where the session left them empty, or extend what is there, citing the commit SHAs and evidence from the table, with `files_changed` taken from `git show --name-only` on those commits. Do not overwrite the recorded root cause. Add a final `## Prevention` section in the precedent's shape holding `why_not_caught` and `recurrence_guard`, using only what the file records (several sessions have a "Test gap" line) plus test names that exist at HEAD, and add `blameless_5_whys: not produced (retroactive closure)`.

    The record for `eslint10-ci-failures` must open its Resolution with a line saying it is superseded: 5deb55c took main back to ESLint 9.x, e649f92 removed `@eslint/js`, and the b4e0cbb fix was verified locally under ESLint 10.0.3 but never on CI, so it cannot be verified now. Its `recurrence_guard` is the new ESLint major ignore in `.github/dependabot.yml`.

    Then move each file. For the five tracked sessions, use `git mv .planning/debug/<slug>.md .planning/debug/resolved/<slug>.md`. For the two untracked sessions, use `mv`, then `git add` the new path.

    Step 5, knowledge base. `.planning/debug/knowledge-base.md` does not exist, and GSD's archive step creates it. Write it with the header from `gsd-debugger.md` lines 993-998, then one entry per session closed here in the shape from lines 1003-1012, with entries for sessions left open omitted. The eslint10 entry says superseded in its Fix line. Do not add an entry for `resolved/offline-visual-diff-firefox.md` and do not edit that file; it is outside this task.

    Step 6, STATE.md. In the Deferred Items table, change only the Status cell of the seven `debug_sessions` rows, following the existing `resolved` row: `resolved`, and `superseded` for eslint10-ci-failures. Then replace the last sentence of the paragraph below the table, the one about the four Phase 9 sessions, with this, keeping the two sentences before it: "The seven debug sessions were closed on 2026-11-06 and moved to `.planning/debug/resolved/`: the four Phase 9 ones were fixed by plans 09-15 to 09-21, `12-slug-script-data` by Phase 12 and 261105-wty, `e2e-test-ci-failures` by 241cbbf, and `eslint10-ci-failures` is superseded, because 5deb55c took ESLint back to 9.x." The orchestrator's quick workflow handles the Quick Tasks table and the frontmatter, so leave both alone.

    Commit once as `docs(debug):`, staging only `.planning/STATE.md`, `.planning/debug/knowledge-base.md` and the seven `.planning/debug/resolved/<slug>.md` paths named in this task's files list, plus the deletions `git mv` already staged.
  </action>
  <verify>
    <!-- Baselines at HEAD: resolved 1; open sessions 7; the two untracked sessions not in the index; knowledge base absent; open rows 7; stale sentence 1; Upstash line present (no-change gate). If a session stays open, lower the resolved count of 8 and the knowledge-base count of 7 and raise 0 by that number, drop it from the error-unmatch list if it is one of those two, and say so in the SUMMARY. -->
    <automated>test "$(ls .planning/debug/resolved/*.md | wc -l)" = 8 && git ls-files --error-unmatch .planning/debug/resolved/e2e-test-ci-failures.md .planning/debug/resolved/eslint10-ci-failures.md > /dev/null && test "$(ls .planning/debug/*.md | grep -vc 'knowledge-base\.md$')" = 0 && test "$(awk '/^## /{n++} END{print n+0}' .planning/debug/knowledge-base.md)" = 7 && grep -q '^status: superseded' .planning/debug/resolved/eslint10-ci-failures.md && test "$(grep -v '^#' .planning/STATE.md | grep -cE '^\| debug_sessions .*\| (awaiting_human_verify|diagnosed) \|')" = 0 && test "$(grep -v '^#' .planning/STATE.md | grep -c 'but their files were never closed')" = 0 && grep -qF 'The production Upstash variables are not confirmed' .planning/STATE.md</automated>
  </verify>
  <done>
    Every session the evidence supports is in `resolved/` with its status, fix commits, evidence and accepted residue on record, and each session left open is reported with its failed check. `eslint10-ci-failures` says superseded. The knowledge base exists. STATE.md's rows and sentence match the moves, and no other line of it changed. The stale real-send claim stays absent, and Upstash stays open.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Local files to public repository | The two untracked debug sessions become public once the PR is pushed |
| CI visual gate to `main` | `main` has no required checks, so the visual job's verdict is the only warning before a deploy |
| Dependabot config to the supply chain | Ignore rules decide which updates never reach review |

## STRIDE Threat Register

Task-local IDs: this quick task has no phase number.

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-joo-01 | I | First commit of the two untracked debug sessions | medium | mitigate | Read at planning (only the variable name `RESEND_API_KEY`); Task 3 step 3 re-scans and stops on any match |
| T-joo-02 | T | Visual gate weakened by the tolerance | medium | mitigate | Conditional on `w === 1440 && shot === 'waypoint-2'`, sized from three runs at 2 px; `SCREENSHOT` unchanged and gated; a real change to this shot above 3 px still fails |
| T-joo-03 | R | A closing record overstates what was verified | medium | mitigate | Each record cites commits and runs, names accepted residue, says which checks an agent ran, and eslint10 says superseded; no record attributes confirmation to Tim |
| T-joo-04 | I | Renaming fixtures hides a real vulnerability | low | accept | The fixtures are never installed; their locks hold only version keys. Root `package-lock.json` stays scanned, and its 20 alerts are unaffected |
| T-joo-05 | E | Major ignores suppress a security fix for ESLint or TypeScript | low | accept | Build-time tools only, and alerts still appear because they come from the dependency graph, not this config; only the automatic major PR is withheld |
| T-joo-06 | D | Selftest temp directories leak on a crash | low | accept | Same exposure as the existing `tempBaseline` helpers, under `os.tmpdir()` with unique names |
| T-joo-SC | T | npm/pip/cargo installs | low | accept | This plan installs nothing, so no legitimacy gate applies |

Blocking threshold is high (ASVS level 1). No threat here is high.
</threat_model>

<verification>
- `npm run lint` exits 0. It runs ESLint and `guard:selftest`. Baseline at HEAD: exit 0.
- `npm run type-check` exits 0. Baseline at HEAD: exit 0. It excludes `e2e/**`.
- `npm test -- --json --outputFile=jest-results.json` then `npm run guard:tests` both exit 0. `guard:tests` is the test-count ratchet, not the selftest; it needs that file and is not part of lint. `jest-results.json` is gitignored.
- Do not run the full E2E or visual suite locally. CI covers them.
- `git ls-files scripts/guards/__selftest__/parity | grep -E 'package(-lock)?\.json$'` prints nothing.
- `git status --short` shows only `.claude/`, `.planning/state.json`, `.planning/ui-reviews/`, `graphify-out/` and this quick task's directory.
- `git log origin/main..HEAD --grep='Co-Authored-By: Claude Opus 5.5' --invert-grep --format=%h` prints nothing, so every commit carries the trailer, and no push has been made.
</verification>

<success_criteria>
- Dependabot config changes match `dependabot_target`, with reasons in comments and the semantics above recorded.
- Parity fixtures carry no GitHub-recognised manifest name, and the selftest still proves the guard both passes and fails.
- Only home/1440-ascent-waypoint-2 tolerates up to 3 differing pixels.
- All seven sessions are closed on evidence, or reported as open with the check that failed.
- STATE.md is accurate for what was closed, with nothing else changed.
</success_criteria>

<output>
Create `.planning/quick/261106-joo-dependabot-cleanup-a-d-dependabot-yml-fi/261106-joo-SUMMARY.md` when done. It must report these as not changed, because they are outside the approval:
- `.planning/PROJECT.md:15` still lists the real send as unconfirmed.
- The STATE.md blocker about run 42105427622 looks stale, because that run now reads `success`.
- The E2E job on main hit its 60-minute timeout on 8270572 after 42 minutes installing browsers.
- A TypeScript 6.1 minor would pass the major ignore and break typescript-eslint's peer range.
- `@eslint/js` is not a direct dependency at HEAD, so its ignore rule is precautionary.
It must also report: the identity fixtures declare no dependencies; the blocker step was a no-op; and the alert drop and Dependabot config take effect only after merge to main, so the orchestrator needs a post-merge check of `gh api repos/tlex-web/portfolio-app/dependabot/alerts` by manifest path.
</output>
