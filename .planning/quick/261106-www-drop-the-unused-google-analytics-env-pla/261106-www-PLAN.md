---
phase: quick-261106-www
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .env.example
  - .planning/codebase/INTEGRATIONS.md
  - .planning/codebase/STACK.md
autonomous: true
requirements: [USER-A]

estimate:
  tokens: 6000
  raw_tokens: 6000
  tasks: 1
  confidence: low

must_haves:
  truths:
    - "No tracked file outside .planning/quick and .planning/milestones names NEXT_PUBLIC_GA_ID"
    - "The env template and both codebase docs still name NEXT_PUBLIC_VERCEL_ANALYTICS_ID, each exactly as before except that STACK.md now reads in the singular"
    - "The change is three lines in three files: one deletion in .env.example, one deletion in INTEGRATIONS.md, one replaced line in STACK.md"
    - "No source file, test, historical record or earlier quick-task directory changed"
    - ".env.local was not read, searched, edited or staged"
  artifacts:
    - path: .env.example
      provides: "Env template whose analytics section holds only the Vercel placeholder"
      contains: "# NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_vercel_analytics_id"
    - path: .planning/codebase/INTEGRATIONS.md
      provides: "Optional env var list without the Google Analytics bullet"
      contains: "`NEXT_PUBLIC_VERCEL_ANALYTICS_ID` - Vercel Analytics ID (auto-configured on Vercel)"
    - path: .planning/codebase/STACK.md
      provides: "Configuration list naming the one remaining optional analytics variable"
      contains: "- Optional analytics variable: `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`"
  key_links:
    - from: .planning/codebase/STACK.md
      to: .env.example
      via: "STACK.md points readers at .env.example, so both must name the same analytics variable"
      pattern: "NEXT_PUBLIC_VERCEL_ANALYTICS_ID"
    - from: .planning/codebase/INTEGRATIONS.md
      to: .env.example
      via: "INTEGRATIONS.md lists the optional variables that .env.example documents"
      pattern: "NEXT_PUBLIC_VERCEL_ANALYTICS_ID"
---

<objective>
Remove the Google Analytics variable from the env template and from the two codebase docs that name it.

Purpose: Tim asked whether the Google Analytics ID he added works. It cannot: no code reads the variable and the live site serves no GA tag. Offered three options, he replied "A": "Keep Vercel Analytics, drop the ID. Remove the placeholder and the variable." So GA is not being installed, and the tracked files should stop implying it is supported.

Output: One commit on the current branch that changes three lines in three files.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.env.example
@.planning/codebase/INTEGRATIONS.md
@.planning/codebase/STACK.md

<planning_observations>
Measured at planning time, at commit 94d79c4 (HEAD, `main` and `origin/main` are all this commit):

- The tracked references outside the archives are exactly `.env.example:24`, `.planning/codebase/INTEGRATIONS.md:139` and `.planning/codebase/STACK.md:93`. One more sits in `.planning/milestones/v2.0-phases` and stays, because it is a historical record.
- No test or script parses `.env.example`, so this change cannot affect a build or a test run, and no test suite is part of this plan's verification.
- `core.autocrlf` is `true`: these files are LF in the index and CRLF in the working tree. Git normalizes this, so the diff shows only the intended lines.
- The repository has no commit hooks and no lint-staged config, so nothing reformats these files at commit.
- The Read tool opens `.env.example` normally. Only `.env.local` is guarded.
- This task is `type="tracer"` under the tracer-first default, and the whole change is that one slice. There are no layers to wire and no expansion tasks, because splitting three line edits would only add commits.
</planning_observations>

<run_rules>
- `.env.local` is off limits. Never read, search, edit or stage it. A secret-read guard protects it. Tim removes his own value there.
- Any repo search uses `git grep`, which covers tracked files only. A recursive `grep` over the working tree reaches `.env.local`.
- Stay on `chore/drop-ga-placeholder`. Do not switch branches, push or open a PR.
- Leave `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` in place in all three files. Nothing reads it either, but Tim has not decided on it, and the orchestrator flags it to him.
- Leave untouched: `app/layout.tsx`, `proxy.ts` and its CSP, `lib/__tests__/proxy.test.ts`, every other source file, `.planning/milestones/**`, phase archives and earlier quick-task directories.
</run_rules>

<commit_rules>
The tree has unrelated untracked paths (`.claude/`, `.planning/state.json`, `.planning/ui-reviews/`, `graphify-out/`) that must never be staged. Do not use `git add -A` or `git add .`. Stage by exact path: `git add .env.example .planning/codebase/INTEGRATIONS.md .planning/codebase/STACK.md`.

Commit message: `chore(quick-261106-www): drop the unused Google Analytics env placeholder`, ending with exactly this line:

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

Do not commit this PLAN.md, the SUMMARY.md or STATE.md. The quick-task orchestrator commits those.
</commit_rules>

<source_audit>
| Source | ID | Item | Task | Status | Notes |
|--------|----|------|------|--------|-------|
| GOAL | - | Drop the unused Google Analytics env placeholder | 1 | COVERED | |
| GOAL | - | Correct the codebase docs that name it | 1 | COVERED | |
| REQ | USER-A | Tim's reply "A": keep Vercel Analytics, drop the ID, remove the placeholder and the variable | 1 | COVERED | Tim removes his own value from `.env.local` himself, by instruction |
| RESEARCH | - | None: quick task with no research phase | - | N/A | |
| CONTEXT | Scope | Keep the Vercel variable in each file; edit STACK.md:93 rather than delete it | 1 | COVERED | |
| CONTEXT | Constraint | `.env.local` off limits, `git grep` only, no branch switch, push or PR | 1 | COVERED | `run_rules` and `commit_rules` |
| CONTEXT | Out of scope | The Vercel variable's future, source files, historical records | - | N/A | Excluded by instruction |
</source_audit>
</context>

<tasks>

<task type="tracer">
  <name>Task 1: Remove the Google Analytics variable from the env template and both codebase docs</name>
  <files>.env.example, .planning/codebase/INTEGRATIONS.md, .planning/codebase/STACK.md</files>
  <read_first>.env.example, .planning/codebase/INTEGRATIONS.md, .planning/codebase/STACK.md</read_first>
  <action>
    Make exactly these three edits with the Edit tool. Do not use `sed -i` or rewrite whole files.

    1. In `.env.example`, delete the whole comment line whose placeholder value is `your_google_analytics_id` (line 24 at planning time). Keep the `# Analytics (Optional)` heading above it and the Vercel placeholder line below it, so the Vercel line now sits directly under the heading.

    2. In `.planning/codebase/INTEGRATIONS.md`, under `**Optional env vars:**`, delete the whole bullet described as "Google Analytics tracking ID" (line 139 at planning time). Keep the Vercel bullet and the rest of the list unchanged.

    3. In `.planning/codebase/STACK.md`, under `**Environment:**`, replace the whole "Optional analytics variables" line (line 93 at planning time) with exactly this text, noting the singular "variable": - Optional analytics variable: `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`

    Add nothing else: no replacement note, no comment saying the Vercel variable is unused, and no other wording changes. Then run the verify command, and commit as `commit_rules` describes. Follow `run_rules` throughout.
  </action>
  <verify>
    <automated>git grep -n NEXT_PUBLIC_GA_ID -- . ':!.planning/quick' ':!.planning/milestones'; test $? -eq 1 && test "$(git diff --numstat 94d79c4 -- . ':!.planning/quick/261106-www-drop-the-unused-google-analytics-env-pla' ':!.planning/STATE.md')" = "$(printf '0\t1\t.env.example\n0\t1\t.planning/codebase/INTEGRATIONS.md\n1\t1\t.planning/codebase/STACK.md')" && git grep -q -F 'Optional analytics variable: `NEXT_PUBLIC_VERCEL_ANALYTICS_ID`' -- .planning/codebase/STACK.md</automated>
    The command has three gates, and each one fails at HEAD 94d79c4:
    - The first `git grep` prints 3 matches at baseline. It exits 1 on no match, so `test $? -eq 1` turns that into success, and exit 128 from a git error still fails.
    - The numstat is empty at baseline. It proves exactly three paths changed with the stated line counts, so no value was added to the template, and it fails on any fourth path, including `.env.local`. It compares against the fixed commit 94d79c4, so it gives the same result before and after the task commit.
    - The last `git grep` matches nothing at baseline, because the line still reads in the plural.
  </verify>
  <done>The verify command exits 0, and one commit on `chore/drop-ga-placeholder` holds the three edits. The Vercel variable is still named once in each file.</done>
</task>

</tasks>

<threat_model>
Configured level: ASVS 1, blocking on `high`. T-www-01 is the only high-severity threat, and it is mitigated.

## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Local secrets to git history | Tim's own value lives in the gitignored `.env.local`. Anything committed leaves the machine once the branch is pushed. |
| Env template to its readers | Anyone setting up the project copies `.env.example`, so it must only ever hold placeholders. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-www-01 | I | `.env.local` during the edit and commit | high | mitigate | `run_rules` forbids reading, searching, editing or staging it. Searches are `git grep` only, which skips untracked and ignored files. `commit_rules` stages three exact paths, and the numstat gate fails on any fourth path. |
| T-www-02 | T | `.env.example` content | low | mitigate | The edit only deletes a line. The numstat gate requires `0 1` for this file, so no real ID or other added text can enter the template. |
| T-www-03 | T | Source files and historical records | low | mitigate | `run_rules` lists them as untouched. The numstat gate excludes only this task's own directory and `.planning/STATE.md`, so a change anywhere else fails it. |
| T-www-SC | T | npm/pip/cargo installs | low | accept | This plan installs nothing, so no legitimacy gate applies. |
</threat_model>

<verification>
After the task commit:

- Re-run the task's `<automated>` command. It must still exit 0.
- `git diff --name-only 94d79c4 HEAD -- . ':!.planning/quick/261106-www-drop-the-unused-google-analytics-env-pla' ':!.planning/STATE.md'` lists exactly `.env.example`, `.planning/codebase/INTEGRATIONS.md` and `.planning/codebase/STACK.md`, which proves the commit holds the edits and not only the working tree. Baseline at HEAD 94d79c4: empty.
- `git status --short` shows only the untracked paths named in `commit_rules` and this task's directory.
</verification>

<success_criteria>
- The tracked tree, outside the archives, no longer names the Google Analytics variable.
- `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` remains in all three files.
- The diff is three lines in three files, in one commit, on the current branch, and unpushed.
- `.env.local` was never touched.
</success_criteria>

<output>
Create `.planning/quick/261106-www-drop-the-unused-google-analytics-env-pla/261106-www-SUMMARY.md` when done, with `status: complete` in its frontmatter. It must state these two open items for Tim: he removes his own value from `.env.local`, and `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` was left in place undecided, although nothing reads it.
</output>
