---
phase: 11-engineering-roadmap
plan: 02
subsystem: content
tags: [content-gate, box, coin-flip, captures, claims-audit, route-log, planning-docs]

# Dependency graph
requires:
  - phase: 11-engineering-roadmap
    provides: "11-CONTEXT.md D-07, D-09, D-16..D-34 (box + coin-flip re-plan), 11-UI-SPEC copy contract and defaults, 11-RESEARCH sections A, D, E"
provides:
  - "ENG-03 retired in REQUIREMENTS, ROADMAP and PROJECT (D-24, documentation half)"
  - "box v2.0 built from its tag (61afb3d) and its real terminal and Safety output captured unedited (D-25, D-26, D-34)"
  - "11-CONTENT-PACKET.md: key index, sections A-H, Tim's verbatim answers and 65 resolved values"
  - "Tim-approved values for every consumer plan, read with grep from the Resolved values rows below"
affects: [11-03, 11-07, 11-08, 11-10, 11-11, 11-12, 11-13, 11-14, 11-15, 11-17]

# Actuals (#2632): chars/4 over 11-02's own commits plus this SUMMARY
actuals:
  tokens: 26467
  tasks: 3
  commits: 22
  # Measured: git rev-list --count cb68590..24d82e8 = 22. That range also holds 18 commits of
  # 11-04, 11-05 and 11-06, which ran while 11-02 waited at its checkpoint. 11-02's own commits
  # in the range are 4: 059294a, 15ca22d, 5267f43, 24d82e8.
plan_head_before: cb68590aab1fd9282dbc6156fcdb57199cb0ce9f
plan_head_after: 24d82e8c9d999fa7cd67c9e63b3e50ccd4503986

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Content gate: consumer plans read only '| key | value | status | quoted from |' rows in this SUMMARY; a key that is not 'supplied' is left out, never filled"
    - "Captures come from a tag build in the scratchpad (never the installed tool), on neutral inputs with relative paths, and are never edited"

key-files:
  created:
    - .planning/phases/11-engineering-roadmap/11-02-SUMMARY.md
  modified:
    - .planning/phases/11-engineering-roadmap/11-CONTENT-PACKET.md
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/PROJECT.md
    - .planning/phases/11-engineering-roadmap/11-04-SUMMARY.md

key-decisions:
  - "Section B: Tim accepted the Proposed column for all 19 claims (\"Accept all, preflight soft (Recommended)\"); box-preflight softened, box-loc-timeline cut, cf-network-calls softened (no tile, fact kept in Privacy), cf-reduced-motion and cf-font-scaling unused"
  - "Section C: the box terminal replays C1.1 hash, C1.2 uuid --json, C1.3 the du pipeline and C1.4 color with their notes (\"1–4, notes ok (Recommended)\"); the Safety block is the bulk-rename preview with the drafted --force line (\"Approve both (Recommended)\")"
  - "Section D: every draft approved (\"approve-all\"); the coin-flip Rendering stack group is not supplied and is left out"
  - "Sections E-G: 7 route-log rows, v2.0 phase lines and descriptions as drafted, surveyedAt 2026-11-01, every UI-SPEC default, and the ci/11-17 go-ahead for 11-17"
  - "11-04 coverage D4: Tim chose A, Zmutt 56 as the Zmutt path end point (quote \"1. B 2. A\")"

patterns-established:
  - "Resolved values: one physical line per key, status 'supplied' only next to a literal quote"

requirements-completed: [ENG-03, ENG-04]  # copied from the plan; both stay Pending in REQUIREMENTS.md (shared-ID gate: 11-07 and later plans also declare them)

coverage:
  - id: D1
    description: "ENG-03 retired in REQUIREMENTS, ROADMAP and PROJECT (D-24); the Phase 11 section and summary line no longer name the retired scale"
    requirement: "ENG-03"
    verification:
      - kind: other
        ref: "Task 1 verify (node check of the ROADMAP Phase 11 section and the REQUIREMENTS ENG-03 row) -> D-24 docs OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "box v2.0 built from tag v2.0 (61afb3d) in the scratchpad; four terminal captures and the bulk-rename Safety preview captured unedited and approved by Tim"
    requirement: "ENG-04"
    verification:
      - kind: other
        ref: "Task 2 verify (packet sections present, no absolute path) -> packet OK; finalize.js byte comparison of the Approved captures against the raw capture files"
        status: pass
      - kind: manual_procedural
        ref: "Tim's Reply 3, 2026-11-01: \"1–4, notes ok (Recommended)\" and \"Approve both (Recommended)\""
        status: pass
    human_judgment: false
  - id: D3
    description: "Tim's five replies recorded verbatim; 65 resolved values (62 supplied, 3 not supplied), one physical line per key-index key; reproduced byte for byte here"
    requirement: "ENG-04"
    verification:
      - kind: other
        ref: "splice.js check: 65 index keys, 65 rows, no missing, extra or malformed rows; finalize.js: SUMMARY contains the packet's Answers and Resolved values sections byte for byte"
        status: pass
    human_judgment: false

# Metrics
duration: 2h 3m
completed: 2026-11-01
status: complete
---

# Phase 11 Plan 02: Content gate for box and coin-flip Summary

**ENG-03 retired in the planning docs, box built from its v2.0 tag with five real captures, and Tim's 2026-11-01 answers turned into 65 quoted resolved values: four terminal commands and the bulk-rename preview approved, 19 claims settled (one cut, two unused), every copy draft approved except the coin-flip Rendering group, 7 route-log rows with surveyedAt 2026-11-01, all UI-SPEC defaults, and the ci/11-17 go-ahead.**

## Performance

- **Duration:** 2h 3m (wall clock, including the checkpoint wait while 11-04, 11-05 and 11-06 ran)
- **Started:** 2026-11-01T18:17:26Z
- **Completed:** 2026-11-01T20:20:31Z
- **Tasks:** 3 of 3
- **Files modified:** 6 (REQUIREMENTS.md, ROADMAP.md, PROJECT.md, 11-CONTENT-PACKET.md, 11-04-SUMMARY.md, this SUMMARY), plus STATE.md

## Accomplishments

- ENG-03 is dropped in REQUIREMENTS.md with its reason. The ROADMAP Phase 11 goal, success criterion 3, scope notes and "Inputs from Tim" now describe box and coin-flip. PROJECT.md's forward-looking lines no longer promise risk bands (D-24).
- box v2.0 was built in the scratchpad from the tag. Tim's installed box was not touched. Six read-only candidates were captured; one (`box dupes`) was rejected because it prints absolute paths.
- The content packet was rewritten for box and coin-flip (sections A to H). Tim answered B to G in five replies. All 65 keys are resolved with a quote: 62 supplied, 3 not supplied.
- Tim's "2. A" also closes 11-04's coverage item D4 (Zmutt 56). It is recorded in 11-04-SUMMARY.md and STATE.md.

## Task Commits

1. **Task 1: Retire ENG-03 in REQUIREMENTS, ROADMAP and PROJECT (D-24)** - `059294a` (docs)
2. **Task 2: Build box v2.0, capture the terminal candidates and the Safety preview, write the content packet** - `15ca22d` (docs)
   - Checkpoint position recorded in STATE.md - `5267f43` (docs)
3. **Task 3: Tim answers the packet** - `24d82e8` (docs: Answers (verbatim), Resolved values, 11-04 D4 line)

**Plan metadata:** this SUMMARY commit, then a STATE and ROADMAP progress commit.

## Files Created/Modified

- `.planning/REQUIREMENTS.md` - ENG-03 struck and marked dropped (D-24), traceability row `Dropped (D-24)`, coverage footer note
- `.planning/ROADMAP.md` - Phase 11 summary line, goal, SC3, scope notes and "Inputs from Tim" rewritten for box and coin-flip
- `.planning/PROJECT.md` - two forward-looking lines reworded; the Phase 8 history entry left as written
- `.planning/phases/11-engineering-roadmap/11-CONTENT-PACKET.md` - rewritten packet (key index, A-H), then Tim's verbatim answers and the resolved values
- `.planning/phases/11-engineering-roadmap/11-04-SUMMARY.md` - one `resolved:` line on coverage D4
- `.planning/phases/11-engineering-roadmap/11-02-SUMMARY.md` - this file

## D-34 build record

| Item | Value |
|------|-------|
| Repository | github.com/tlex-web/box (public) |
| Tag | `v2.0` |
| Commit | `61afb3d9fb73647e991ab5f4a0322dddbc9ee98f` |
| Clone | `gh repo clone tlex-web/box <scratchpad>/box -- --branch v2.0 --depth 1` |
| Build | `CARGO_TARGET_DIR=<scratchpad>/box-target cargo build --release --locked` (run inside `<scratchpad>/box`; cargo 1.98.1, 1 m 05 s) |
| Pre-capture check | `box --help` lists `config` and `completions` (Pitfall 1 passed) |
| Binary | `<scratchpad>/box-target/release/box.exe` (reports `box 0.1.0`, so no capture runs `--version`) |
| Tim's installed box | not run, not updated, not touched |

Capture session: one `pwsh -NoProfile` session per capture (PowerShell 7.6.9), `$env:NO_COLOR = '1'`, `$PSStyle.OutputRendering = 'PlainText'`, `Set-Alias box <scratchpad>/box-target/release/box.exe`, working directory a fresh `<scratchpad>/cap` holding only `sample/hut.txt`, `sample/zmutt.txt` and `sample/copies/hut.txt` (an exact copy).

Exact command lines of all six captures (typed as shown, relative paths only):

- C1.1 `box hash sample/hut.txt` (approved)
- C1.2 `box uuid --json` (approved)
- C1.3 `box du ./sample --json | ConvertFrom-Json | Select-Object -ExpandProperty results | Sort-Object size -Descending | Select-Object -First 3 name, size` (approved)
- C1.4 `box color '#70d5ed'` (approved)
- C1.5 `box tree ./sample` (captured, not chosen)
- `box dupes ./sample` (rejected: its output carries absolute home paths, so it is not reproduced anywhere)
- C2 `box bulk-rename ./sample '^(.*)\.txt$' '$1.md'` (approved Safety preview)

## Decisions Made

- Every value below is Tim's, quoted in `## Answers (verbatim)`. Claude's only interpretation is applying his "accept the Proposed column" reply row by row. Both of its consequences were shown to him before he answered: the `Network calls` tile is dropped from `copy.tiles-cf`, and the coin-flip `Rendering` group is left out.
- `claim.box-loc-timeline` (cut), `claim.cf-reduced-motion` and `claim.cf-font-scaling` (unused) are recorded as `not supplied`, so no consumer can render them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PROJECT.md: two forward-looking lines reworded, not one**
- **Found during:** Task 1
- **Issue:** The plan named only the Active requirement line, but the Target-features bullet (about line 20) also promised CLI_X risk bands.
- **Fix:** Both lines now name the route panels and case studies for box and coin-flip. The Phase 8 Key Decisions history entry is left as written.
- **Files modified:** .planning/PROJECT.md
- **Committed in:** 059294a

**2. [Rule 3 - Blocking] Scratchpad subfolder `11-02`**
- **Found during:** Task 2
- **Issue:** The session scratchpad is shared by several plans.
- **Fix:** The clone, target, capture folder and raw capture files live under `<scratchpad>/11-02/` (the `<scratchpad>/box` paths above are relative to that subfolder).
- **Committed in:** 15ca22d (recorded in the packet)

**3. [Rule 2 - Missing critical] Fifth terminal candidate is `box tree`; `box dupes` rejected**
- **Found during:** Task 2
- **Issue:** The read-only `box dupes ./sample` prints absolute paths that run through the home folder (T-11-04, UI-SPEC N2).
- **Fix:** It was rejected without being reproduced, and `box tree ./sample` was captured instead. Tim did not choose `tree`.
- **Committed in:** 15ca22d

**4. [Rule 2 - Missing critical] box README source caveat**
- **Found during:** Task 2
- **Issue:** The README stored at the `v2.0` tag is the older one ("~23 command-line tools", stale status line). `main` is 3 docs-only commits ahead.
- **Fix:** Claims cite and link `main`'s README and MILESTONES. The packet's section B states why.
- **Committed in:** 15ca22d

**5. [Rule 1 - Bug] Packet splice anchored to a line start**
- **Found during:** Task 3
- **Issue:** The first splice of the answers matched the text `## Answers (verbatim)` inside the packet's status line and truncated the packet in the working tree.
- **Fix:** The file was restored from HEAD, and the splice was redone anchored to the line-start heading. A diff check confirmed that only the status line and the empty placeholder line were replaced. Nothing truncated was committed.
- **Committed in:** 24d82e8

---

**Total deviations:** 5 auto-fixed (2 bug, 2 missing critical, 1 blocking)
**Impact on plan:** No scope creep. No application code changed (`git status --porcelain -- app components lib data e2e scripts` is empty).

## Issues Encountered

- The ledger range `cb68590..HEAD` includes 18 commits of 11-04, 11-05 and 11-06, which ran during the checkpoint wait. Only the four commits listed above belong to 11-02. The measured count is kept in `actuals.commits`, with that note.
- The C1.3 output was printed with Windows line ends by PowerShell's table formatter. It is stored with LF in the packet and below, as the packet's format note states.

## Note for Tim: box issue (RESEARCH Q5)

`box flatten` in its default preview (dry-run) mode creates the empty output folder, even though the preview should write nothing. This is worth an issue in the box repository (github.com/tlex-web/box): a dry run should not create directories. Because of it, the site says "renames, moves or deletes nothing until you add `--force`" rather than "writes nothing" (`claim.box-safe-default`). No work on it is planned in this portfolio.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Every consumer plan reads values with `grep -E '^\| <key> \|'` from the rows below. `status` must be `supplied`; anything else is left out.
- 11-07 has four approved terminal commands (at least two are needed), so box ships a Demo section.
- 11-03 reads `default.8`, and 11-11 reads `default.11` (both default).
- 11-08 has `log.rows`, `log.descriptions` and `log.surveyedAt` = 2026-11-01.
- 11-17 has `ci.approval` = approve, so it pushes `ci/11-17` and dispatches the baselines without a new gate. PNG commits stay Tim's.
- 11-15 still asks Tim for the coin-flip clip (section H brief).

## Answers (verbatim)

Tim answered sections B to G on 2026-11-01 in five replies: two typed chat messages and three question-dialog selections. Each reply is quoted exactly as he typed or selected it, in a fenced block, under the question it answered. The questions are quoted as they were shown to him; where a dialog showed an option description, that is quoted too, because it states what the selection approves. Section A was answered earlier (D-07), and section H asks nothing.

### Reply 1 · chat message · 2026-11-01 · section B (and 11-04's Zmutt end point)

Asked: "1. 11-02 section B (claims audit) … Reply `B: accept the proposed column` or a per-key list" and "2. Zmutt end point: A 'Zmutt 56' (recommended, 4,291 m) or B hamlet centre".

Tim's reply:
```text
1. B 2. A
```

"1. B" answers section B and is confirmed by Reply 2. "2. A" is not a packet key: it answers 11-04's coverage item D4 (the Zmutt end point is "Zmutt 56", as 11-04 built it) and is recorded in 11-04-SUMMARY.md and STATE.md.

### Reply 2 · question dialog · 2026-11-01 · section B, confirmation

Question: "For 11-02 section B (the claims audit), I read your "1. B" as accepting the proposed column for all 19 claims. Is that right? One row is conditional. box-preflight ("every check passes before the first write") stays as sourced only if you confirm it holds for every destructive box command; otherwise it's softened to "box checks the whole job before it changes the first file"."

Option description shown: "Proposed column for all 19 rows. box-preflight softened (no claim about every command). Safe default: the record only covers the 3 destructive flags."

Tim's selection:
```text
Accept all, preflight soft (Recommended)
```

Meaning: every `claim.*` row takes the value in its "Proposed" column in section B, and `claim.box-preflight` is softened to "box checks the whole job before it changes the first file".

### Reply 3 · question dialog · 2026-11-01 · section C

Question C1: "11-02 section C1: which captured box commands should the terminal on the box case study replay, and in what order? (11-07 needs at least 2. With fewer, box ships with no Demo section.)"

Option description shown: "hash, uuid --json, the du pipeline, color, in that order, each with its drafted note. Shows BLAKE3 by default, JSON for scripts, a real PowerShell pipeline and a human view." The preview showed the C1.1 to C1.4 typed lines and outputs exactly as captured, each followed by its note draft.

Tim's selection:
```text
1–4, notes ok (Recommended)
```

Question C2: "11-02 section C2: the Safety preview on the box case study. The capture is `box bulk-rename` in its default dry-run mode. It changed no file. The delete-duplicates preview can't be used because it prints absolute home paths."

Option description shown: "Ship the preview block with the caption "Preview run · box bulk-rename" and the drafted --force line."

Tim's selection:
```text
Approve both (Recommended)
```

### Reply 4 · chat message · 2026-11-01 · section D

Asked: every section D draft was shown as in this packet, with `copy.tiles-cf` already without the `Network calls` tile (the section B soften) and the `copy.stack-cf` Rendering group marked as needing his words ("Name it, or the group is left out"), followed by: "Reply for D, for example: `D: approve all, Rendering: <renderer>`, or `D: approve all except <key> (edit: "…"), <key> decline`. If you don't name the renderer, the Rendering group is left out."

Tim's reply:
```text
approve-all
```

Meaning: every section D key is approved as drafted. No renderer was named, so the coin-flip `Rendering` Stack group is not supplied and is left out.

### Reply 5 · question dialog · 2026-11-01 · sections E, F and G

Question E1: "11-02 section E1: do the 7 route-log rows on /roadmap, with their titles, statuses, dates and descriptions, look right? Every CLI_X and webshop row, portfolio-3d-gallery and portfolio-blog are retired. box gets no planned row until its next milestone exists."

Option description shown: "All 7 rows, the v2.0 phase lines 7–12 and every description ship as drafted."

Tim's selection:
```text
Rows + descriptions ok (Recommended)
```

Question E2: "11-02 section E2: what "Route log surveyed" date should /roadmap show? It can't be in the future or earlier than the newest completedAt (2026-10-26). Without a date the build fails, so this is the one input with no fallback. Pick Other to give a specific YYYY-MM-DD."

Option description shown: "The kicker reads "Route log surveyed 1 Nov 2026"."

Tim's selection:
```text
2026-11-01, today (Recommended)
```

Question F: "11-02 section F: keep the UI-SPEC defaults? (#4 is void with ENG-03.) Defaults #5 and #7 are already built by 11-06, and any alternative there would be applied in 11-12. Pick Other to list exceptions, e.g. "defaults except 7 alternative, N3 alternative"."

Option description shown: "Every row uses the default shown in the preview." The preview listed #1 to #3, #5 to #11 and N1 to N4 with their defaults and alternatives as in section F.

Tim's selection:
```text
All defaults (Recommended)
```

Question G: "11-02 section G: for Phase 11's re-baseline (plan 11-17), may the executor plain-push the phase HEAD to a new ci/11-17 branch, push fast-forward CI-fix commits there, dispatch one visual-baselines run (then download and compare the PNGs for you), and re-run CI once on your baseline commit? Force pushes, pushes to the phase branch or main, and PNG commits are excluded either way."

Option description shown: "11-17 does those four things without asking again. You still commit and push the baseline PNGs."

Tim's selection:
```text
Approve (Recommended)
```

## Resolved values

One physical line per key from the key index. `supplied` means a quoted reply above backs the value; `not supplied` means the element is left out. Multi-line values are joined with `<br>`. The exact capture text for `capture.*` is in `## Approved captures (verbatim)` in 11-02-SUMMARY.md.

| key | value | status | quoted from |
|-----|-------|--------|-------------|
| claim.box-tools | source: "23" tools; tile context line "Tools in the README at v2.0, plus config and completions" | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.box-tests | source: "507" tests; tile context line "At the v2.0 milestone" | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.box-binary | source: one binary ("1" / "in one Rust binary") | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.box-safe-default | soften: "renames, moves or deletes nothing until you add `--force`" (never "writes nothing") | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.box-preflight | soften: "box checks the whole job before it changes the first file" (no claim about every destructive command) | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.box-blake3 | source: "BLAKE3 is the default hash." | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.box-ps7 | source: "built for PowerShell 7" | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.box-loc-timeline | cut: no LOC, timeline or commit figure appears anywhere | not supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.cf-permissions | source: "0" permissions / "No permissions: the release build asks for none."; tile context line "Checked on the release APK" | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.cf-crypto | source: "A cryptographic 50/50 draw picks heads or tails before the toss" | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.cf-5050 | source: "50/50"; tile context line "A cryptographic draw decides each result" | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.cf-offline | source: "Fully offline: no internet permission and no remote services." | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.cf-network-calls | soften: no "0 network calls" figure anywhere (no tile, no strip item; N3 default); the fact is carried only by Privacy fact 2 (claim.cf-offline) | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.cf-no-ads | source: "No ads, no trackers, no accounts." | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.cf-talkback | source: the result is announced by TalkBack ("a TalkBack announcement of the result") | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.cf-reduced-motion | unused: in no approved draft, so it is shown nowhere | not supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.cf-font-scaling | unused: in no approved draft, so it is shown nowhere | not supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.cf-stage-toss | soften: "The 3D toss is choreographed to land on the drawn result." | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| claim.cf-stage-landing | soften: "The coin comes to rest on the drawn face." | supplied | Reply 1 "1. B 2. A" and Reply 2 "Accept all, preflight soft (Recommended)", 2026-11-01 |
| capture.box-terminal | four commands in this order: C1.1 `box hash sample/hut.txt`, C1.2 `box uuid --json`, C1.3 the `box du ./sample --json` PowerShell pipeline, C1.4 `box color '#70d5ed'`; C1.5 `tree` is not used. Exact typed lines and outputs: `## Approved captures (verbatim)` in 11-02-SUMMARY.md | supplied | Reply 3 C1 "1–4, notes ok (Recommended)", 2026-11-01 |
| copy.terminal-notes | C1.1 "BLAKE3 is the default hash."<br>C1.2 "With --json, a command prints one JSON document and nothing else."<br>C1.3 "ConvertFrom-Json reads it, so the rest is plain PowerShell."<br>C1.4 "Hex in; RGB, HSL and a color name out." | supplied | Reply 3 C1 "1–4, notes ok (Recommended)", 2026-11-01 |
| capture.box-safety | caption `Preview run · box bulk-rename`; typed line `box bulk-rename ./sample '^(.*)\.txt$' '$1.md'` and its 5-line output exactly as in `## Approved captures (verbatim)` in 11-02-SUMMARY.md | supplied | Reply 3 C2 "Approve both (Recommended)", 2026-11-01 |
| copy.force-line | "With `--force`, box would rename `hut.txt` to `hut.md` and `zmutt.txt` to `zmutt.md`, and leave the `copies` folder alone." | supplied | Reply 3 C2 "Approve both (Recommended)", 2026-11-01 |
| copy.projects-intro | "Two things I build: box, a command-line toolkit for PowerShell 7 written in Rust, and coin-flip, an Android app that tosses a fair 3D coin. Each route opens a case study." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.pitch-box | "Twenty-three command-line tools in one Rust binary, built for PowerShell 7. Anything destructive previews first." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.pitch-cf | "A 3D coin toss for Android that settles a fair result before the coin leaves your hand, with no permissions and no network." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.status-box | `shipped` (kicker `v2.0 · shipped`) | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.release-box | "Measured at v2.0" | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.release-cf | "Checked on the v1.0 release build" | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.outcome-box | "v2.0 shipped on 14 July 2026: 23 tools in one binary, JSON output for scripts, and a preview before anything destructive." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.outcome-cf | "v1.0 has run on my own device since 9 August 2026. A smoother toss and a Play Store release come next." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.problem-box | "box gathers the small jobs I do in PowerShell 7 on Windows into one command: hashing a file, making a UUID, flattening a folder, renaming a batch of files. v1.0 put 23 tools in one Rust binary. v2.0 made them scriptable: JSON output that `ConvertFrom-Json` reads, `--clip` for the clipboard, and defaults in a config file." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.problem-cf | "coin-flip is an Android app for one job: settling a call with a coin toss you can trust. The result is drawn first, and the 3D toss is choreographed to land on it. It asks for no permissions and works offline, and the result is announced to TalkBack. v1 runs on my own device, but it is not done: smoothing the toss and the camera follow, and then a Play Store release, are still ahead." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.safety-intro-box | "Commands that delete, move or rename files run as a preview by default: box shows what it would do and renames, moves or deletes nothing until you add `--force`. box checks the whole job before it changes the first file." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.privacy-intro-cf | "coin-flip keeps everything on the device." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.privacy-facts-cf | 1. "No permissions: the release build asks for none."<br>2. "Fully offline: no internet permission and no remote services."<br>3. "No ads, no trackers, no accounts." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.pipeline-intro-cf | "The result is decided first. A cryptographic 50/50 draw picks heads or tails before the toss, and the animation is choreographed to land on it." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.pipeline-stages-cf | 1. `Fair draw`: "A cryptographic 50/50 draw picks heads or tails."<br>2. `Choreographed toss`: "The 3D toss is choreographed to land on the drawn result."<br>3. `Landing and settle`: "The coin comes to rest on the drawn face."<br>4. `Haptic pulse and announcement`: "A short pulse, and TalkBack announces the result." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.pipeline-endpoints-cf | "In: a tap"<br>"Out: a fair result, felt and announced" | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.pipeline-box | 1. `Settings`: "A flag beats an environment variable, which beats the config file, which beats the built-in default."<br>2. `Command`: "One of the 23 tools runs with those settings."<br>3. `Output`: "Plain text for people, `--json` for the next command, `--clip` for the clipboard." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.tiles-box | `Tools` `23` "Tools in the README at v2.0, plus config and completions" ([Source](https://github.com/tlex-web/box#readme))<br>`Tests` `507` "At the v2.0 milestone" ([Source](https://github.com/tlex-web/box/blob/main/.planning/MILESTONES.md))<br>`Binary` `1` "All tools ship in one executable" ([Source](https://github.com/tlex-web/box#readme)) | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.tiles-cf | `Permissions` `0` "Checked on the release APK"<br>`Result split` `50/50` "A cryptographic draw decides each result"<br>No `Network calls` tile (claim.cf-network-calls is softened; N3 default) | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.stack-box | `Language`: Rust 2021<br>`Crates`: clap, serde_json, blake3, regex, rayon, chrono, image, crossterm<br>`Platform`: Windows, PowerShell 7 | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.stack-cf | `Language`: Kotlin<br>`Platform`: native Android<br>`Rendering`: not supplied (no renderer named), so that group is left out | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.demo-intro-box | "Four commands I ran with box, replayed with the output they returned." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.roadmap-intro | "What I've finished, what I'm working on and what comes next, for this site, box and coin-flip." | supplied | Reply 4 "approve-all", 2026-11-01 |
| copy.home-about | "I'm {name}, a developer and photographer. I build software in Rust, TypeScript and Kotlin, including box, a command-line toolkit for PowerShell, and coin-flip, an Android app that tosses a fair 3D coin. I photograph the mountains around Zermatt, and this site puts each photograph back on the terrain where I took it." | supplied | Reply 4 "approve-all", 2026-11-01 |
| log.rows | id · title · area · status · order · completedAt:<br>`coin-flip-play-store` · Play Store release · coin-flip · planned · 7 · none<br>`coin-flip-v1-1` · v1.1 Smoother toss · coin-flip · planned · 6 · none<br>`portfolio-v2` · v2.0 Topographic Identity · portfolio · in-progress · 5 · none<br>`coin-flip-v1` · v1.0 First release on device · coin-flip · completed · 4 · 2026-08-09<br>`box-v2` · v2.0 Toolbox → toolkit · box · completed · 3 · 2026-07-14<br>`box-v1` · v1.0 Full toolbox · box · completed · 2 · 2026-06-24<br>`portfolio-v1` · v1.0 Stabilization & Visual Identity · portfolio · completed · 1 · 2026-03-12<br>v2.0 phase lines (phase · name · status · completedAt): 7 · Foundation & guardrails · completed · 2026-10-24; 8 · Data & terrain pipeline · completed · 2026-10-24; 9 · Home ascent · completed · 2026-10-25; 10 · Photography · completed · 2026-10-26; 11 · Engineering & roadmap · in-progress · none; 12 · Contact, edge pages & cleanup · planned · none<br>Retired ids: `portfolio-3d-gallery`, `portfolio-blog`, `cli-conversation-export`, `cli-workflow-scheduling`, `cli-plugin-system`, `cli-autocomplete`, `cli-collaborative-commands`, `cli-web-interface`, `cli-conversation-mode`, `cli-ollama-integration`, `cli-template-analytics`, `webshop-team-management`, `webshop-analytics`, `webshop-api-marketplace`, `webshop-mobile-app`; box has no planned row | supplied | Reply 5 E1 "Rows + descriptions ok (Recommended)", 2026-11-01 |
| log.descriptions | `coin-flip-play-store` "Releasing the app through the Play Store."<br>`coin-flip-v1-1` "Smoothing the toss and the camera follow."<br>`portfolio-v2` "This redesign: the whole site rebuilt around the real Matterhorn terrain."<br>`coin-flip-v1` "The first release, running on my own device: a fair draw, a 3D toss, no permissions and no network."<br>`box-v2` "The tools became scriptable: JSON output, `--clip`, config-file defaults, BLAKE3 hashing and previews before destructive changes."<br>`box-v1` "All 23 tools in one Rust binary, installed from PowerShell 7."<br>`portfolio-v1` "The first version of this site, stabilized and given its own visual identity." | supplied | Reply 5 E1 "Rows + descriptions ok (Recommended)", 2026-11-01 |
| log.surveyedAt | 2026-11-01 (kicker "Route log surveyed 1 Nov 2026") | supplied | Reply 5 E2 "2026-11-01, today (Recommended)", 2026-11-01 |
| default.1 | default: `/roadmap` h1 `Roadmap` (the nav label); "Route log" lives in the kicker `Route log surveyed …` | supplied | Reply 5 F "All defaults (Recommended)", 2026-11-01 |
| default.2 | default: priority is not shown on route-log rows; `order` carries it | supplied | Reply 5 F "All defaults (Recommended)", 2026-11-01 |
| default.3 | default: row descriptions always visible; only v2.0 has a disclosure | supplied | Reply 5 F "All defaults (Recommended)", 2026-11-01 |
| default.5 | default: panels show the verified link (box) and the "Source: private repository" text (coin-flip); "Ask for a walkthrough" is on the trailhead only (already built by 11-06) | supplied | Reply 5 F "All defaults (Recommended)", 2026-11-01 |
| default.6 | default: primary CTA on the case study is `Ask for a walkthrough` → `/contact` | supplied | Reply 5 F "All defaults (Recommended)", 2026-11-01 |
| default.7 | default: external project links open in the same tab, with `ArrowSquareOutIcon` (already built by 11-06) | supplied | Reply 5 F "All defaults (Recommended)", 2026-11-01 |
| default.8 | default: pause toggle with the constant label `Pause` and `aria-pressed` | supplied | Reply 5 F "All defaults (Recommended)", 2026-11-01 |
| default.9 | default: trail red `oklch(0.60 0.20 27)` and blue `oklch(0.55 0.17 255)`; T1 stays `--trail-yellow` (Home unchanged) | supplied | Reply 5 F "All defaults (Recommended)", 2026-11-01 |
| default.10 | default: filter tracks show counts and become 2 × 2 below 640 px | supplied | Reply 5 F "All defaults (Recommended)", 2026-11-01 |
| default.11 | default: no copy button on the terminal or the preview block | supplied | Reply 5 F "All defaults (Recommended)", 2026-11-01 |
| default.N1 | default: project names as the repos spell them, `box` and `coin-flip` (also the h1 and titles) | supplied | Reply 5 F "All defaults (Recommended)", 2026-11-01 |
| default.N2 | default: terminal and preview outputs at most 12 lines, by the choice of input and flags; output text never edited | supplied | Reply 5 F "All defaults (Recommended)", 2026-11-01 |
| default.N3 | default: a metric the audit softens leaves the strip and the panel; its wording lives in the Privacy facts | supplied | Reply 5 F "All defaults (Recommended)", 2026-11-01 |
| default.N4 | default: "Next steps" lists only planned or in-progress rows, so box has no Next steps section until a next milestone exists | supplied | Reply 5 F "All defaults (Recommended)", 2026-11-01 |
| ci.approval | approve: 11-17 may (1) plain-push the phase HEAD to a new `ci/11-17`, (2) push fast-forward CI-fix commits there, (3) dispatch one visual-baselines run on it and download and compare the PNGs, (4) re-run CI once on Tim's baseline commit. Excluded: force pushes, pushes to the phase branch or `main`, and PNG commits (Tim commits the baselines) | supplied | Reply 5 G "Approve (Recommended)", 2026-11-01 |

## Approved captures (verbatim)

Approved by Tim on 2026-11-01: the terminal set by Reply 3 C1 ("1–4, notes ok (Recommended)") and the Safety preview by Reply 3 C2 ("Approve both (Recommended)"). Each typed line and output below is exactly what the v2.0 build printed, compared byte for byte against the raw capture files (`<scratchpad>/11-02/caps/t1` to `t4` and `safety`, `.line` and `.out`). There is one stated exception: PowerShell printed the C1.3 output with Windows line ends, and it is stored here with LF like the rest of this file. Its blank first and last lines are kept. Nothing is trimmed, redacted or reworded.

### Terminal command 1 of 4 (C1.1 `hash`)

Typed line:
```text
box hash sample/hut.txt
```
Output:
```text
a113912ef20f332e35c86601e1c90df90a110e260827f0ae9f861611927ecf1d  sample/hut.txt
```
Note: "BLAKE3 is the default hash."

### Terminal command 2 of 4 (C1.2 `uuid --json`)

Typed line:
```text
box uuid --json
```
Output:
```text
{
  "results": [
    {
      "uuid": "e8487bbf-77c8-4aa7-86c6-76bf11e8c9e2",
      "version": "v4"
    }
  ],
  "count": 1
}
```
Note: "With --json, a command prints one JSON document and nothing else."

### Terminal command 3 of 4 (C1.3 `du` into a PowerShell pipeline)

Typed line:
```text
box du ./sample --json | ConvertFrom-Json | Select-Object -ExpandProperty results | Sort-Object size -Descending | Select-Object -First 3 name, size
```
Output:
```text

name      size
----      ----
copies      20
hut.txt     20
zmutt.txt   14

```
Note: "ConvertFrom-Json reads it, so the rest is plain PowerShell."

### Terminal command 4 of 4 (C1.4 `color`)

Typed line:
```text
box color '#70d5ed'
```
Output:
```text
  Hex   : #70D5ED
  RGB   : rgb(112, 213, 237)
  Tuple : 112 213 237
  HSL   : hsl(192, 78%, 68%)
  Name  : ~skyblue

  ██████████
```
Note: "Hex in; RGB, HSL and a color name out."

### Safety preview (C2)

Caption: `Preview run · box bulk-rename`

Typed line:
```text
box bulk-rename ./sample '^(.*)\.txt$' '$1.md'
```
Output:
```text
  - copies (skipped: directory)
  ~ hut.txt   -> hut.md
  ~ zmutt.txt -> zmutt.md

Dry run: 2 to rename, 0 unchanged, 1 skipped. Re-run with --force to apply.
```
`--force` line: "With `--force`, box would rename `hut.txt` to `hut.md` and `zmutt.txt` to `zmutt.md`, and leave the `copies` folder alone."

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-01*

## Self-Check: PASSED

- FOUND: .planning/phases/11-engineering-roadmap/11-CONTENT-PACKET.md, .planning/REQUIREMENTS.md, .planning/ROADMAP.md, .planning/PROJECT.md, .planning/phases/11-engineering-roadmap/11-04-SUMMARY.md
- FOUND commits on this branch: 059294a, 15ca22d, 5267f43, 24d82e8
- Task 1 verify: D-24 docs OK. Task 2 verify: packet OK. Acceptance: 38 `| claim.` lines (at least 15), 0 version or network typed lines in section C, 2 lines with a 40-character hash in section C
- Resolved values: 65 keys, 65 rows, no missing or malformed rows. This SUMMARY reproduces the packet's `## Answers (verbatim)` and `## Resolved values` byte for byte, and `## Approved captures (verbatim)` matches the raw capture files (finalize.js)
- `git status --porcelain -- app components lib data e2e scripts` is empty
