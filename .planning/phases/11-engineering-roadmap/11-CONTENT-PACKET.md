# Phase 11 Content Packet: box and coin-flip (D-21)

**Prepared:** 2026-11-01 by the 11-02 executor. This packet replaces the first-pass CLI_X packet (commit 911a044) entirely. Only the trail table (old §A), the portfolio rows (old §G1) and the UI-SPEC defaults (old §I) are carried over.
**Status:** answered by Tim on 2026-11-01 (sections B to G). A value counts as approved only when Tim's literal reply is quoted under `## Answers (verbatim)` and the key reads `supplied` under `## Resolved values`; the drafts in sections B to G are kept exactly as they were shown to him.

**What this checkpoint collects (D-21 items 1 to 4, plus one CI go-ahead):**
1. The claims audit (D-09), section B.
2. The copy (D-16): the box terminal transcript and the box Safety preview (D-25, D-26, D-34) in section C, and every other draft line, including the Home About sentence (D-33), in section D.
3. Route-log confirmation and `surveyedAt` (D-17, D-20, D-31, D-32), section E.
4. The UI-SPEC defaults, section F.
5. The CI go-ahead for the phase re-baseline branch `ci/11-17`, section G.

The coin-flip clip (D-27, item 5) is not collected here. Section H is the brief for it; plan 11-15 asks for the file. Section I (added by 11-15) holds the clip's description draft, which 11-16 puts to Tim.

**Privacy note (D-23, T-11-03).** This repository and its `.planning/` folder are public. coin-flip is a private repository, and it was not opened for this packet. Every coin-flip line below is written in Claude's own words from the phase research summaries and the D-23 fact list. Nothing in it is copied from the coin-flip repository: no source, file paths, identifiers, defect or backlog IDs, test evidence or internal measurements. box is public, so its README and milestone record are cited and linked.

**Path note.** `<scratchpad>` stands for the session scratch folder used for the build and the captures. No absolute, home-directory or user path appears in this file or in any capture.

**How to reply.** Answer section by section, in any order, in your own words. Short forms work, for example:
`B: tools source, tests source, loc cut, network-calls soften "Offline" …` · `C: commands 1, 2, 3, 4 in that order, notes ok; safety approve` · `D: approve all except problem-box (my edit: "…")` · `E: rows ok, descriptions ok, surveyedAt 2026-11-02` · `F: defaults` · `G: approve`.
Anything you do not answer is recorded as **not supplied**, and the consequence stated next to it applies: the element is left out, never filled with something invented (UI-SPEC "Content Gates, Both Cases"). "content done" closes the packet with every open item marked not supplied.

---

## Key index

Every key that later plans read from 11-02-SUMMARY.md, with the section that asks for it.

| Key | Section | What it decides |
|-----|---------|-----------------|
| `claim.box-tools` | B | "23 tools" |
| `claim.box-tests` | B | "507 tests" |
| `claim.box-binary` | B | "single static binary" / "1 binary" |
| `claim.box-safe-default` | B | "safe by default" / preview before any destructive write |
| `claim.box-preflight` | B | "every check passes before the first write" |
| `claim.box-blake3` | B | "BLAKE3 by default" |
| `claim.box-ps7` | B | "built for Windows PowerShell 7" |
| `claim.box-loc-timeline` | B | LOC, timeline and commit figures |
| `claim.cf-permissions` | B | "zero permissions" |
| `claim.cf-crypto` | B | "cryptographic randomness" |
| `claim.cf-5050` | B | "exactly 50/50" |
| `claim.cf-offline` | B | "fully offline" |
| `claim.cf-network-calls` | B | "0 network calls" (the metric tile) |
| `claim.cf-no-ads` | B | "no ads, no trackers, no accounts" |
| `claim.cf-talkback` | B | "TalkBack support" |
| `claim.cf-reduced-motion` | B | "reduced-motion support" |
| `claim.cf-font-scaling` | B | "system font scaling" |
| `claim.cf-stage-toss` | B | the "Choreographed toss" stage description |
| `claim.cf-stage-landing` | B | the "Landing and settle" stage description |
| `capture.box-terminal` | C1 | which captured commands the box terminal replays, and in what order |
| `copy.terminal-notes` | C1 | the optional one-line note under each terminal command |
| `capture.box-safety` | C2 | the Safety preview block (`box bulk-rename`) |
| `copy.force-line` | C2 | the sentence after the preview saying what `--force` would do |
| `copy.projects-intro` | D | `/projects` intro |
| `copy.pitch-box` | D | box panel pitch |
| `copy.pitch-cf` | D | coin-flip panel pitch |
| `copy.status-box` | D | box status word in the kicker |
| `copy.release-box` | D | box release line |
| `copy.release-cf` | D | coin-flip release line |
| `copy.outcome-box` | D | box outcome line |
| `copy.outcome-cf` | D | coin-flip outcome line |
| `copy.problem-box` | D | box Problem paragraph |
| `copy.problem-cf` | D | coin-flip Problem paragraph |
| `copy.safety-intro-box` | D | box Safety intro |
| `copy.privacy-intro-cf` | D | coin-flip Privacy intro (optional) |
| `copy.privacy-facts-cf` | D | coin-flip Privacy facts (three lines) |
| `copy.pipeline-intro-cf` | D | coin-flip Pipeline intro |
| `copy.pipeline-stages-cf` | D | coin-flip stage names and descriptions |
| `copy.pipeline-endpoints-cf` | D | coin-flip "In:" and "Out:" lines (optional) |
| `copy.pipeline-box` | D | box Pipeline (optional, Discretion) |
| `copy.tiles-box` | D | box metric tiles with context lines |
| `copy.tiles-cf` | D | coin-flip metric tiles with context lines |
| `copy.stack-box` | D | box Stack groups |
| `copy.stack-cf` | D | coin-flip Stack groups |
| `copy.demo-intro-box` | D | box Demo intro |
| `copy.roadmap-intro` | D | `/roadmap` intro |
| `copy.home-about` | D | Home About sentence (D-33) |
| `log.rows` | E | the seven route-log rows, their status, order and dates, and the v2.0 phase lines |
| `log.descriptions` | E | the one-line description of each row |
| `log.surveyedAt` | E | the "Route log surveyed" date |
| `default.1` to `default.3`, `default.5` to `default.11` | F | UI-SPEC defaults (#4 is void) |
| `default.N1` to `default.N4` | F | UI-SPEC defaults added in the re-plan |
| `ci.approval` | G | the `ci/11-17` push and visual-baselines dispatch |

---

## A. Trail pair (D-07, answered)

Recorded for reference. Tim answered this in the phase discussion (D-07), so it is not asked again. The official zermatt.swiss listings are the source of record; the DEM heights were sampled from the committed heightmap (08 D-17).

| Project | Trail (official listing) | SAC grade (source) | Waymark | Official start → end | DEM start → end | Geometry check |
|---------|--------------------------|--------------------|---------|----------------------|-----------------|----------------|
| box | Hörnliweg No. 27: Schwarzsee → Hörnlihütte | T4 "Alpine Hiking Trail" ([listing](https://zermatt.swiss/en/p/hoernliweg-no-27-01tVj000005EwSkIAK)) | white-blue-white | 2,583 m → 3,260 m, 4.3 km, ↑693 m | 2,587 m → 3,262 m | 4,316 m routed, matches 4.3 km with no via points |
| coin-flip | Zmutt path No. 2: Zermatt station → Zmutt | T1 "Hiking trail" ([listing](https://zermatt.swiss/en/p/zmuttweg-no-2-01tVj00000H69zjIAB)) | yellow | 1,620 m → 1,937 m, 4.3 km, ↑339 m | 1,606 m → 1,934 m | 3,645 m shortest path; needs 1–2 via points to follow the official 4.3 km line |

Captions (D-07; the final heights come from the generator's DEM endpoints):

- `Schwarzsee 2,587 m → Hörnlihütte 3,262 m · T4`
- `Zermatt 1,606 m → Zmutt 1,934 m · T1`

Plan 11-04 picks the Zmutt via points so the routed line stays within 10 percent of 4.3 km and records them in its SUMMARY. Tim sees the glyphs in the visual review. No reply needed.

---

## B. Claims audit (D-09)

Mark each row `source` (shown as drafted), `soften` (your wording, no figure) or `cut` (removed everywhere it appears). A softened claim never keeps a figure. Under the default for N3 (section F), a softened metric leaves the strip and the panel, and its wording lives in prose.

**About the box sources.** The README cited here is the one on box's `main` branch, which is what a visitor sees on GitHub. `main` is three commits ahead of the `v2.0` tag, and those commits change only documentation (the README rewrite for v2.0 and the human-UAT records under `.planning/`), so the v2.0 build in section C runs the same code. The README stored at the `v2.0` tag is the older one ("~23 command-line tools" and a stale Phase 1 status line), so the links point at `main`. Links: [README](https://github.com/tlex-web/box#readme), [MILESTONES](https://github.com/tlex-web/box/blob/main/.planning/MILESTONES.md).

| Key | Claim | Where it appears | Current wording (draft) | Proposed soft wording | Source | Proposed | Reply |
|-----|-------|------------------|-------------------------|-----------------------|--------|----------|-------|
| claim.box-tools | 23 tools | box strip and tile, pitch, Problem, route-log row | "23" / "Twenty-three command-line tools in one Rust binary" | "A few dozen command-line tools in one binary" | README "One tiny binary. 23 command-line tools."; MILESTONES v2.0 "the shipped 23-command `box` binary". `box --help` on the v2.0 build lists 25 subcommands: the 23 tools plus `config` and `completions` (research found the README lists those two apart, under "Meta"). The tile's context line says so (D-28, Pitfall 5) | source, with the context line "Tools in the README at v2.0, plus config and completions" | `source` / `soften` / `cut` |
| claim.box-tests | 507 tests | box strip and tile | "507" | "A test suite that passed at release" | MILESTONES v2.0 Stats: "Tests: 507 passing, 0 failed". Not re-run for this packet | source, context "At the v2.0 milestone" | `source` / `soften` / `cut` |
| claim.box-binary | single static binary / 1 binary | box strip and tile, pitch | "1" / "in one Rust binary" | "One executable" (no "static") | README badge "single static .exe" and install notes "a static, MSVC release binary"; MILESTONES v1.0 "A single Rust binary bundling all 23 command-line tools". The v2.0 build here produced one `box.exe` | source | `source` / `soften` / `cut` |
| claim.box-safe-default | safe by default; writes nothing without `--force` | Safety intro, pitch, box Pipeline | "box shows what it would do and writes nothing" (UI-SPEC draft) | "renames, moves or deletes nothing until you add `--force`" | README "Safe by default: every destructive tool (`flatten --move`, `dupes --delete`, `bulk-rename`) previews as a dry-run first and only writes with `--force`". The `bulk-rename` preview in C2 changed no file. Research found that a `flatten` preview creates its empty output folder, so "writes nothing" is not true of every preview (Pitfall 3) | soften, to the wording on the left | `source` / `soften` / `cut` |
| claim.box-preflight | every check passes before the first write | Safety intro | "every check has to pass before the first write" | "box checks the whole job before it changes the first file" | MILESTONES v2.0: the three destructive flags (`flatten --move`, `dupes --delete`, `bulk-rename --backup`) share "dry-run default, `--force`, abort-all-before-any pre-flight". Recorded for those flags; not checked separately for a plain `bulk-rename --force` | source if you confirm it holds for every destructive command, else soften | `source` / `soften` / `cut` |
| claim.box-blake3 | BLAKE3 by default | terminal note under `box hash` | "BLAKE3 is the default hash." | "box hashes with BLAKE3 unless told otherwise" | MILESTONES v2.0 "BLAKE3-default `hash`"; the v2.0 build's `box hash sample/hut.txt --json` reports `"algo": "blake3"` | source | `source` / `soften` / `cut` |
| claim.box-ps7 | built for Windows PowerShell 7 | pitch, Problem, Stack | "built for PowerShell 7" | "made for PowerShell on Windows" | README "built for **Windows PowerShell 7**"; install steps run in PowerShell 7 | source | `source` / `soften` / `cut` |
| claim.box-loc-timeline | LOC, timeline, commit counts | nowhere in the drafts | not used | none | MILESTONES v2.0 Stats: 15,649 Rust LOC, 2026-06-25 → 2026-07-14 (about 20 days), 198 commits. The UI-SPEC voice rule bans these unless you source them | cut (not used anywhere) | `source` / `cut` |
| claim.cf-permissions | zero permissions | coin-flip strip and tile, pitch, Privacy fact 1, route-log row | "0" / "No permissions: the release build asks for none." | "Asks for no special permissions" | Project record, summarised: the permission count is checked on the built release APK (D-23 fact list, D-28) | source, context "Checked on the release APK" | `source` / `soften` / `cut` |
| claim.cf-crypto | cryptographic randomness | Pipeline intro, stage 1, tile context | "A cryptographic 50/50 draw picks heads or tails before the toss" | "A random draw picks the result before the toss" | Project record, summarised: a cryptographic random source decides each result before the animation starts (D-23 fact list) | source | `source` / `soften` / `cut` |
| claim.cf-5050 | exactly 50/50 | coin-flip strip and tile, Pipeline intro | "50/50" | "An even draw between heads and tails" | Project record, summarised: the draw is an exact 50/50 (D-23 fact list, D-28) | source, context "A cryptographic draw decides each result" | `source` / `soften` / `cut` |
| claim.cf-offline | fully offline | Privacy fact 2, pitch ("no network"), coin-flip-v1 description | "Fully offline: no internet permission and no remote services." | "Works without a connection" | Project record, summarised: no internet permission and no remote services (D-23 fact list) | source | `source` / `soften` / `cut` |
| claim.cf-network-calls | 0 network calls | coin-flip strip and tile | "0" with "No internet permission, no remote services" | "Offline" (as a word, under N3) or left to Privacy fact 2 | The record states no internet permission and no remote services. "0 calls" is a measurement the record does not state as such. Without the internet permission an Android app cannot open network sockets (research assumption A3) | soften: drop the tile, keep the fact under Privacy | `source` / `soften` / `cut` |
| claim.cf-no-ads | no ads, trackers or accounts | Privacy fact 3 | "No ads, no trackers, no accounts." | "No ads and no sign-in" | Project record, summarised; the app's own About screen says the same, per the record (D-23 fact list) | source | `source` / `soften` / `cut` |
| claim.cf-talkback | TalkBack support | Pipeline stage 4, Problem | "a TalkBack announcement of the result" | "the result is announced to screen readers" | Project record, summarised: delivered in v1 (D-23 fact list) | source | `source` / `soften` / `cut` |
| claim.cf-reduced-motion | reduced-motion support | not in the drafts; available for Problem | not used | "respects the system's reduce-motion setting" | Project record, summarised: delivered in v1 (D-23 fact list) | source if you want it in the Problem paragraph, else leave unused | `source` / `cut` |
| claim.cf-font-scaling | system font scaling | not in the drafts; available for Problem | not used | "text follows the system font size" | Project record, summarised: delivered in v1 (D-23 fact list) | source if you want it in the Problem paragraph, else leave unused | `source` / `cut` |
| claim.cf-stage-toss | "Choreographed toss (the camera follows the coin)" | Pipeline stage 2 description | "The coin is tossed in 3D and the camera follows it." | "The 3D toss is choreographed to land on the drawn result." | Project record, summarised: the toss is choreographed to the drawn result; the camera follow is among the work still open after v1 (D-30, Pitfall 9) | soften, to the wording on the left (no polish words) | `source` / `soften` / `cut` |
| claim.cf-stage-landing | "Landing and settle" | Pipeline stage 3 description | "The coin lands and settles on the drawn face." | "The coin comes to rest on the drawn face." | Project record, summarised: the landing-and-settle polish is among the work still open after v1 (Pitfall 9) | soften, to the wording on the left | `source` / `soften` / `cut` |

**If not supplied:** the claim is left out wherever it appears (strip item, tile, prose sentence, chip). A sentence that needs an unsupplied claim is left out with it.

Reply: `B: <key> source|soften "<your wording>"|cut, …` or `B: accept the proposed column`.

---

## C. Captures (D-25, D-26, D-34)

### Build record (D-34)

| Item | Value |
|------|-------|
| Repository | github.com/tlex-web/box (public) |
| Tag | `v2.0` |
| Commit | `61afb3d9fb73647e991ab5f4a0322dddbc9ee98f` (2026-07-14, "chore: remove REQUIREMENTS.md for v2.0 milestone") |
| Clone | `gh repo clone tlex-web/box <scratchpad>/box -- --branch v2.0 --depth 1` |
| Build | `CARGO_TARGET_DIR=<scratchpad>/box-target cargo build --release --locked` (run inside `<scratchpad>/box`) |
| Toolchain | cargo 1.98.1; finished in 1 m 05 s |
| Check before capturing | `box --help` lists `config` and `completions` (Pitfall 1 passed) |
| Binary | `<scratchpad>/box-target/release/box.exe`; it reports `box 0.1.0`, so no capture runs `--version` (D-29) |
| Tim's installed box | not run, not updated, not touched |

**Capture session.** Each capture ran in its own `pwsh -NoProfile` session (PowerShell 7.6.9) with `$env:NO_COLOR = '1'`, `$PSStyle.OutputRendering = 'PlainText'`, `Set-Alias box <scratchpad>/box-target/release/box.exe` and the working directory `<scratchpad>/cap`. That folder was created fresh for these captures and holds only:

- `sample/hut.txt` (20 bytes, the text `Hoernli hut, 3260 m`)
- `sample/zmutt.txt` (14 bytes, the text `Zmutt, 1936 m`)
- `sample/copies/hut.txt` (an exact copy of `sample/hut.txt`)

Every typed line below is the exact line that ran. Every output is exactly what box printed: nothing was trimmed, redacted or reworded. All commands are read-only, use relative paths, make no network call and do not run `--version`. Each output is at most 12 lines (N2). Research recorded that Tim's box config matches the built-in defaults; no capture prints the config.

### C1. Terminal candidates (D-26)

Five read-only, time-independent candidates. The UUID in C1.2 is random and stays exactly as captured.

**C1.1 `hash`** (1 line)

Typed line:
```text
box hash sample/hut.txt
```
Output:
```text
a113912ef20f332e35c86601e1c90df90a110e260827f0ae9f861611927ecf1d  sample/hut.txt
```
Note draft: "BLAKE3 is the default hash." (needs `claim.box-blake3`)

**C1.2 `uuid --json`** (9 lines)

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
Note draft: "With --json, a command prints one JSON document and nothing else."

**C1.3 `du` into a PowerShell pipeline** (7 lines)

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
Note draft: "ConvertFrom-Json reads it, so the rest is plain PowerShell."
Format note: PowerShell's table formatter printed one blank line before and one after the table, and wrote Windows line ends. The blank lines are kept as captured; the line ends are stored as plain newlines like the rest of this file. The typed line is long and wraps over several lines in the terminal on a phone (about 37 characters per line at 375 px).

**C1.4 `color`** (7 lines)

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
Note draft: "Hex in; RGB, HSL and a color name out."
Format note: the last line is a swatch of ten block characters. With `NO_COLOR` set it has no color, so on the site it renders as a solid bar in the terminal's text color.

**C1.5 `tree`** (7 lines; Claude's extra read-only pick)

Typed line:
```text
box tree ./sample
```
Output:
```text
./sample
├── copies
│   └── hut.txt
├── hut.txt
└── zmutt.txt

1 directories, 3 files
```
Note draft: "tree only reads; it changes nothing."

Rejected candidate (not shown): `box dupes ./sample` (the read-only duplicate finder). Its output names each file by its full absolute path from the drive root, which includes the home folder, so it cannot ship unedited (same reason as C3).

**Proposed transcript:** four commands in this order: C1.1 `hash`, C1.2 `uuid --json`, C1.3 the `du` pipeline, C1.4 `color`. Together they show what v2.0 is about: BLAKE3 by default, JSON for scripts, a real PowerShell pipeline and a plain human view. C1.5 `tree` can be a fifth if you want five.

11-07 needs at least two approved commands. With fewer, box ships with no Demo section, and 11-07 stops to ask how to keep the terminal end-to-end suite.

**If not supplied:** box ships with **no Demo section**; no invented command or output. A command without an approved note has no note line.

Reply: `C1: commands 1, 2, 3, 4 (in that order), notes ok` or name the commands, the order and any note edits.

### C2. Safety preview (D-25)

Recommended (open question Q2): `box bulk-rename` in its default preview mode. It prints names relative to the folder, so it can ship unedited, and the run changed no file (checked after the capture: all three files kept their names).

Caption: `Preview run · box bulk-rename`

Typed line:
```text
box bulk-rename ./sample '^(.*)\.txt$' '$1.md'
```
Output (5 lines):
```text
  - copies (skipped: directory)
  ~ hut.txt   -> hut.md
  ~ zmutt.txt -> zmutt.md

Dry run: 2 to rename, 0 unchanged, 1 skipped. Re-run with --force to apply.
```

`--force` line draft (`copy.force-line`), written from exactly this run:
"With `--force`, box would rename `hut.txt` to `hut.md` and `zmutt.txt` to `zmutt.md`, and leave the `copies` folder alone."

**If not supplied:** no preview block and no `--force` line. The approved Safety intro renders on its own; with no approved intro, the Safety section is omitted.

Reply: `C2: approve` (capture and `--force` line), or `C2: capture approve, force line "<your wording>"`, or `C2: decline`.

### C3. Why the delete-duplicates preview is not used

D-25 suggested a duplicate-deletion preview (`box dupes --delete`). Research ran it and found that box resolves every file it lists to a full absolute path, starting at the drive root and running through the user's home folder and its temporary-files folder, even when the command is given a relative folder. The read-only `box dupes ./sample` run for this packet prints the same kind of path. The site may not show home or absolute paths, and captured output may not be edited to remove them (UI-SPEC N2, 08 D-22). So the preview cannot ship, and `bulk-rename` is recommended instead. The output itself is deliberately not reproduced here.

---

## D. Copy (D-16)

First person, short, factual, sentence case, no exclamation marks. Each row: approve, edit (give your wording) or decline. The "Needs" column names claims from section B; if one of them is cut, the line is reworded or left out.

| Key | Element | Draft | Needs | If not supplied |
|-----|---------|-------|-------|-----------------|
| copy.projects-intro | `/projects` intro | "Two things I build: box, a command-line toolkit for PowerShell 7 written in Rust, and coin-flip, an Android app that tosses a fair 3D coin. Each route opens a case study." | box-ps7 | The intro paragraph is left out |
| copy.pitch-box | box panel pitch | "Twenty-three command-line tools in one Rust binary, built for PowerShell 7. Anything destructive previews first." | box-tools, box-binary, box-ps7, box-safe-default | The panel shows no pitch |
| copy.pitch-cf | coin-flip panel pitch | "A 3D coin toss for Android that settles a fair result before the coin leaves your hand, with no permissions and no network." | cf-crypto, cf-permissions, cf-offline | The panel shows no pitch |
| copy.status-box | box status word | `shipped` (kicker `v2.0 · shipped`) | none | Kicker reads `v2.0` |
| copy.release-box | box release line | "Measured at v2.0" | none | Release line left out |
| copy.release-cf | coin-flip release line | "Checked on the v1.0 release build" | none | Release line left out |
| copy.outcome-box | box outcome line | "v2.0 shipped on 14 July 2026: 23 tools in one binary, JSON output for scripts, and a preview before anything destructive." | box-tools, box-binary, box-safe-default | Outcome line left out |
| copy.outcome-cf | coin-flip outcome line | "v1.0 has run on my own device since 9 August 2026. A smoother toss and a Play Store release come next." | none | Outcome line left out |
| copy.problem-box | box Problem paragraph | "box gathers the small jobs I do in PowerShell 7 on Windows into one command: hashing a file, making a UUID, flattening a folder, renaming a batch of files. v1.0 put 23 tools in one Rust binary. v2.0 made them scriptable: JSON output that `ConvertFrom-Json` reads, `--clip` for the clipboard, and defaults in a config file." | box-tools, box-binary, box-ps7 | Problem section omitted for box |
| copy.problem-cf | coin-flip Problem paragraph | "coin-flip is an Android app for one job: settling a call with a coin toss you can trust. The result is drawn first, and the 3D toss is choreographed to land on it. It asks for no permissions and works offline, and the result is announced to TalkBack. v1 runs on my own device, but it is not done: smoothing the toss and the camera follow, and then a Play Store release, are still ahead." | cf-crypto, cf-permissions, cf-offline, cf-talkback | Problem section omitted for coin-flip |
| copy.safety-intro-box | box Safety intro | "Commands that delete, move or rename files run as a preview by default: box shows what it would do and renames, moves or deletes nothing until you add `--force`. box checks the whole job before it changes the first file." (softened from the UI-SPEC draft, which said "writes nothing") | box-safe-default, box-preflight | Intro left out; with no approved preview either, the Safety section is omitted |
| copy.privacy-intro-cf | coin-flip Privacy intro (optional) | "coin-flip keeps everything on the device." | cf-offline | No intro; the facts list stands alone |
| copy.privacy-facts-cf | coin-flip Privacy facts | 1. "No permissions: the release build asks for none." 2. "Fully offline: no internet permission and no remote services." 3. "No ads, no trackers, no accounts." | cf-permissions, cf-offline, cf-no-ads | Unapproved facts left out; with none, the Privacy section is omitted |
| copy.pipeline-intro-cf | coin-flip Pipeline intro | "The result is decided first. A cryptographic 50/50 draw picks heads or tails before the toss, and the animation is choreographed to land on it." | cf-crypto, cf-5050 | Intro left out |
| copy.pipeline-stages-cf | coin-flip stages (name, then description) | 1. `Fair draw`: "A cryptographic 50/50 draw picks heads or tails." 2. `Choreographed toss`: "The 3D toss is choreographed to land on the drawn result." 3. `Landing and settle`: "The coin comes to rest on the drawn face." 4. `Haptic pulse and announcement`: "A short pulse, and TalkBack announces the result." | cf-crypto, cf-5050, cf-stage-toss, cf-stage-landing, cf-talkback | An unapproved description shows the stage name only; unapproved stage names omit the Pipeline section |
| copy.pipeline-endpoints-cf | coin-flip "In:" and "Out:" lines (optional) | "In: a tap" / "Out: a fair result, felt and announced" | cf-talkback | Not rendered |
| copy.pipeline-box | box Pipeline (optional, Discretion, 3 stages) | 1. `Settings`: "A flag beats an environment variable, which beats the config file, which beats the built-in default." 2. `Command`: "One of the 23 tools runs with those settings." 3. `Output`: "Plain text for people, `--json` for the next command, `--clip` for the clipboard." Source: README "precedence is CLI › env › config › built-in" | box-tools | box has no Pipeline section |
| copy.tiles-box | box metric tiles (label, value, context line) | `Tools` `23` "Tools in the README at v2.0, plus config and completions" ([Source](https://github.com/tlex-web/box#readme)) · `Tests` `507` "At the v2.0 milestone" ([Source](https://github.com/tlex-web/box/blob/main/.planning/MILESTONES.md)) · `Binary` `1` "All tools ship in one executable" ([Source](https://github.com/tlex-web/box#readme)) | box-tools, box-tests, box-binary | A tile without an approved context line does not ship; with no tile, the Metrics section is omitted |
| copy.tiles-cf | coin-flip metric tiles (no links, private repo) | `Permissions` `0` "Checked on the release APK" · `Result split` `50/50` "A cryptographic draw decides each result" · `Network calls` `0` "No internet permission, no remote services" (B proposes softening this one; under the N3 default it then leaves the strip) | cf-permissions, cf-5050, cf-crypto, cf-network-calls | Same as box |
| copy.stack-box | box Stack groups | `Language`: Rust 2021 · `Crates`: clap, serde_json, blake3, regex, rayon, chrono, image, crossterm · `Platform`: Windows, PowerShell 7. Source: the public Cargo.toml at v2.0 and the README badges | box-ps7 | Unapproved group left out; with none, Stack is omitted |
| copy.stack-cf | coin-flip Stack groups | `Language`: Kotlin · `Platform`: native Android · `Rendering`: **your words needed**. Claude did not name the 3D renderer, because that would mean reading the private repository; name it, or leave the group out | none | Unapproved group left out; with none, Stack is omitted |
| copy.demo-intro-box | box Demo intro | "Four commands I ran with box, replayed with the output they returned." (the number follows the commands you approve in C1) | none | Intro left out; the terminal still renders if C1 is approved |
| copy.roadmap-intro | `/roadmap` intro | "What I've finished, what I'm working on and what comes next, for this site, box and coin-flip." | none | Intro left out |
| copy.home-about | Home About body (D-33) | "I'm {name}, a developer and photographer. I build software in Rust, TypeScript and Kotlin, including box, a command-line toolkit for PowerShell, and coin-flip, an Android app that tosses a fair 3D coin. I photograph the mountains around Zermatt, and this site puts each photograph back on the terrain where I took it." | none | The CLI_X clause is removed and nothing replaces it: "I'm {name}, a developer and photographer. I build software in Rust and TypeScript. I photograph the mountains around Zermatt, …" |

Fixed interface copy (labels, headings, the clip fallback sentence, document titles) is set by the UI-SPEC and is not asked here.

Reply: `D: approve all`, or `D: approve all except <key> (edit: "…"), <key> decline`.

---

## E. Route log (D-17, D-18, D-20, D-31, D-32)

### E1. Rows (`log.rows`, `log.descriptions`)

Seven rows: two for this site, two for box, three for coin-flip (one row per milestone, D-31). `order` runs from the bottom of the climb (1) to the top (7). The id is stable once shipped, because it appears in shareable URLs and in the case-study Next steps links.

| id | Title (draft) | area | status | order | completedAt | Description (draft, `log.descriptions`) | Evidence |
|----|---------------|------|--------|-------|-------------|------------------------------------------|----------|
| `coin-flip-play-store` | Play Store release | coin-flip | planned | 7 | — | "Releasing the app through the Play Store." | coin-flip's record has the store release as a separate later milestone (summarised) |
| `coin-flip-v1-1` | v1.1 Smoother toss | coin-flip | planned | 6 | — | "Smoothing the toss and the camera follow." | coin-flip's record has a v1.1 follow-up for the remaining toss work (summarised) |
| `portfolio-v2` | v2.0 Topographic Identity | portfolio | in-progress | 5 | — | "This redesign: the whole site rebuilt around the real Matterhorn terrain." | commit 383a4f9, 2026-10-10, "docs: start milestone v2.0 Topographic Identity" |
| `coin-flip-v1` | v1.0 First release on device | coin-flip | completed | 4 | 2026-08-09 | "The first release, running on my own device: a fair draw, a 3D toss, no permissions and no network." | coin-flip's record closes v1.0 on 2026-08-09 (summarised); the repository has a `v1.0` tag |
| `box-v2` | v2.0 Toolbox → toolkit | box | completed | 3 | 2026-07-14 | "The tools became scriptable: JSON output, `--clip`, config-file defaults, BLAKE3 hashing and previews before destructive changes." | box MILESTONES "Shipped: 2026-07-14"; tag `v2.0` on a commit dated 2026-07-14 |
| `box-v1` | v1.0 Full toolbox | box | completed | 2 | 2026-06-24 | "All 23 tools in one Rust binary, installed from PowerShell 7." | box MILESTONES "Shipped: 2026-06-24" |
| `portfolio-v1` | v1.0 Stabilization & Visual Identity | portfolio | completed | 1 | 2026-03-12 | "The first version of this site, stabilized and given its own visual identity." | `.planning/MILESTONES.md` "Shipped: 2026-03-12"; commit 1cb6e91 "v1.0", 2026-03-12 |

The coin-flip-v1 description needs `claim.cf-crypto`, `claim.cf-permissions` and `claim.cf-offline`; box-v2 needs `claim.box-blake3` and `claim.box-safe-default`; box-v1 needs `claim.box-tools` and `claim.box-ps7`. A description whose claim is cut is reworded or left out.

v2.0 phase lines inside the `portfolio-v2` disclosure (D-18, git-verified, carried over from the first-pass packet):

| Phase | Name | Status | completedAt | Evidence |
|-------|------|--------|-------------|----------|
| 7 | Foundation & guardrails | completed | 2026-10-24 | commit b147f20, 2026-10-24 |
| 8 | Data & terrain pipeline | completed | 2026-10-24 | commit a413b69, 2026-10-24 |
| 9 | Home ascent | completed | 2026-10-25 | commit 6500ae2, 2026-10-25 |
| 10 | Photography | completed | 2026-10-26 | commit ae887f0, 2026-10-26 |
| 11 | Engineering & roadmap | in-progress | — | current phase |
| 12 | Contact, edge pages & cleanup | planned | — | ROADMAP.md |

Phase 11's own completion date is not written during Phase 11 (decided in 11-08): Phase 12's first data edit or the v2.0 milestone close records it, with your confirmation.

Retired rows (D-32): `portfolio-3d-gallery` (Phase 10 shipped that work), `portfolio-blog` (no plan behind it), and every CLI_X and webshop row now in `data/roadmap.ts`: `cli-conversation-export`, `cli-workflow-scheduling`, `cli-plugin-system`, `cli-autocomplete`, `cli-collaborative-commands`, `cli-web-interface`, `cli-conversation-mode`, `cli-ollama-integration`, `cli-template-analytics`, `webshop-team-management`, `webshop-analytics`, `webshop-api-marketplace`, `webshop-mobile-app`. box gets no planned row, because its next milestone is not defined yet.

Expected filter counts with these rows: All 7; Portfolio 2, box 2, coin-flip 3; Planned 2, In progress 1, Completed 4. Combinations with no entries: box with Planned, box with In progress, coin-flip with In progress, Portfolio with Planned. coin-flip's Next steps are `coin-flip-v1-1` and `coin-flip-play-store`; box has none, so its Next steps section is omitted (N4 default).

**If not supplied:** an unconfirmed row does not ship. A confirmed row without a confirmed date reads `Completed` with no date. An unapproved description is left out (the title stands alone).

Reply: `E1: rows ok, descriptions ok`, or name the rows, titles, dates or descriptions to change.

### E2. surveyedAt (`log.surveyedAt`)

Proposed: **2026-11-01** (today). It renders as the `/roadmap` kicker "Route log surveyed 1 Nov 2026".
Rule (D-20, unit-tested): the date may not be in the future and may not be earlier than the newest `completedAt` in the data (now 2026-10-26, Phase 10). You may prefer the date the new `/roadmap` ships.

**If not supplied:** the build fails (`surveyedAt` is required), so the new `/roadmap` cannot ship. This is the one input with no fallback.

Reply: `E2: surveyedAt YYYY-MM-DD`.

---

## F. UI-SPEC defaults

From the UI-SPEC "Defaults to Confirm at Plan Review". Numbering is kept from the first-pass packet. **#4 (risk-scale ticks) is void** with ENG-03 and is not asked.

| # | Key | Default | Alternative | Applied by |
|---|-----|---------|-------------|------------|
| 1 | `default.1` | `/roadmap` h1 `Roadmap` (the nav label); "Route log" lives in the kicker `Route log surveyed …` | h1 `Route log` (stronger metaphor, differs from the nav label) | the route-log plans |
| 2 | `default.2` | Priority is not shown on route-log rows; `order` carries it | Keep priority as text (`High priority`) in the meta line | the route-log plans |
| 3 | `default.3` | Row descriptions always visible; only v2.0 has a disclosure | Every description behind a `<details>` (shorter page, 7 more controls) | the route-log plans |
| 5 | `default.5` | Panels show the verified link (box) and the "Source: private repository" text (coin-flip); "Ask for a walkthrough" is on the trailhead only | Also put "Ask for a walkthrough" on the coin-flip panel | **already built to the default by 11-06**; the alternative is applied in 11-12 |
| 6 | `default.6` | Primary CTA on the case study: `Ask for a walkthrough` → `/contact` | `Get in touch`, or no primary fill | the case-study end-block plan |
| 7 | `default.7` | External project links open in the same tab, with `ArrowSquareOutIcon` | `target="_blank"` with sr-only "(opens in a new tab)" (the Phase 10 hotspot-source pattern) | **already built to the default by 11-06**; the alternative is applied in 11-12 |
| 8 | `default.8` | Pause toggle: constant label `Pause` with `aria-pressed` | Label swaps between `Pause` and `Play`, without `aria-pressed` | 11-03 reads this answer |
| 9 | `default.9` | Trail red `oklch(0.60 0.20 27)` and blue `oklch(0.55 0.17 255)`; T1 stays `--trail-yellow` (Home unchanged) | Retune T1 to a more saturated signage yellow (changes Home's sign tips and baselines) | the trail-paint plan |
| 10 | `default.10` | Filter tracks show counts and become 2 × 2 below 640 px | No counts (narrower, one row at 375 px), or a native `<select>` on phones | the filter plan |
| 11 | `default.11` | No copy button on the terminal or the preview block | Copy button announcing "Copied" | 11-11 reads this answer |
| N1 | `default.N1` | Project names as the repos spell them: `box`, `coin-flip` (also the h1 and titles) | Title case `Box`, `Coin Flip` | the data plan |
| N2 | `default.N2` | Terminal and preview outputs kept to 12 lines or fewer by the choice of input and flags; output text never edited (every capture in section C follows this) | Allow longer outputs (taller terminal, more empty space on short commands) | the captures above |
| N3 | `default.N3` | A metric the audit softens (for example "0 network calls" → "Offline") leaves the strip and the panel; the word lives in the Privacy facts | Show it as a word value in the strip (`Network` / `Offline`, Inter 600), breaking the Mono-is-data rule once | the metrics plans |
| N4 | `default.N4` | "Next steps" lists only planned or in-progress rows, so box has no Next steps section until a next milestone exists | List box's completed milestones under a different label (for example "Route so far") | the Next steps plan |

**If not supplied:** the row is recorded as not supplied and the default applies, as the approved UI-SPEC already specifies. These are design choices, not content, so nothing is invented.

Reply: `F: defaults`, or `F: defaults except 7 alternative, N3 alternative`.

---

## G. CI go-ahead (`ci.approval`)

The standing CI approvals end at `ci/10-13` and are given phase by phase, so this asks once for Phase 11's re-baseline, which plan 11-17 runs.

May the executor of 11-17:
1. push the phase HEAD to a **new** branch `ci/11-17` (plain push, not a force push);
2. push fast-forward commits to `ci/11-17` that fix CI on that branch;
3. dispatch **one** visual-baselines run on `ci/11-17`, then download and compare its PNGs for you;
4. re-run the CI run on your baseline commit **once**?

Excluded either way: force pushes, pushes to the phase branch or to `main`, and committing PNGs (only you commit baselines).

**If not supplied:** 11-17 does not push or dispatch anything. It hands you the exact commands to run yourself.

Reply: `G: approve` or `G: decline`.

---

## H. Clip brief (D-27)

Not asked now. Plan 11-15 asks for the file at its own checkpoint. This is so you can record it when convenient.

- **What:** one coin flip on the device, 5 to 10 seconds, screen recording. No debug overlays, no notifications in view. How it ends (which face, how long it rests) is your pick. The app is silent, so the clip has no audio track.
- **Where:** drop the original file in `assets/clips-original/` in this repository. That folder is gitignored; the original never enters git or the site.
- **What happens next:** Claude trims, encodes, strips the metadata and extracts the poster frame. The served clip must fit **1,572,864 bytes (1.5 MiB)**. It is muted, never autoplays, does not loop, shows controls and has a poster.
- **If no clip arrives:** coin-flip ships with **no Demo section**: no placeholder, no still, no "coming soon".

No reply needed here.

---

## I. Clip description draft (D-16, D-27)

Added by the 11-15 executor on 2026-11-01. **Nothing here is approved yet.** Plan 11-16 asks Tim to approve, edit or reject the clip, its poster and these words together. Until then `data/projects.ts` has no coin-flip clip block, so coin-flip shows no Demo section, even though the encoded clip and poster are committed.

**The recording.** Tim's final one-flip screen recording, `assets/clips-original/coin-flip-toss.mp4` (gitignored, never committed): 4.4209 s, 1066 x 2102, about 108 fps on average (120 fps nominal), with an audio track that the encode drops. D-27's length rule became 4–10 s for this clip (Tim, 2026-11-01, in 11-15). The footage ships as recorded: no trim, no padding and no held frames.

**What the frames show** (viewed from the encoded clip at 0.5, 1.3, 1.5, 1.7, 1.9, 2.1, 2.3, 2.6, 3.5 and 4.3 s, plus a 10 fps contact sheet): a coin lies flat on a dark screen with only a small settings gear in the top corner. At about 1.5 s it is flipped. It rises toward the viewer and turns over several times, showing both faces, then drops back and lands flat at about 2.4 s. From about 2.5 s it rests face up and the word HEADS appears below it, until the clip ends.

**Description draft** (`clip.description`, the figcaption):

> A coin lies flat on a dark screen. About a second and a half in, it is flipped: it rises toward the viewer, turns over several times, then drops back and lands flat. It comes to rest face up, and the word HEADS appears below it.

**Intro draft, optional** (`clip.intro`, the sentence above the clip):

> One toss, recorded from the screen of my own device.

The wording follows the claims audit: no polish words, and nothing about the camera following the coin (claim.cf-stage-toss, claim.cf-stage-landing, Pitfall 9). It describes only what the clip shows.

**Encode record**

| Setting | Value |
|---------|-------|
| Source sha256 | `9445ed117114ed0c51c8322ee544900ed48d2c70602e03b56809143d993970f3` |
| start | 0 s (the whole recording) |
| duration | 4.421 s in the sidecar; the encoded clip runs 4.417 s (mvhd) |
| posterAt | 3.5 s: the coin at rest with HEADS shown |
| frame rate | 60 fps (`fps: 60`, the source rate capped at 60) |
| CRF | 26 |
| Clip | `public/media/coin-flip-toss.9b55947b70.mp4`, 512 x 1010, **211,784 bytes** (budget 1,572,864), H.264, one video track, no audio, metadata stripped |
| Poster | `public/media/coin-flip-toss-poster.8519b0dca7.webp`, 512 x 1010, 6,604 bytes |

Checks: `npm run clip:derive -- --check` prints `clips: OK` and `npm run guard:images` prints `served-images: OK`.

Reply (in 11-16): approve, edit the words, ask for a different poster time, or reject the clip.

**Status (11-16, 2026-11-01):** approved as drafted, poster at 3.5 s, description and intro unchanged (Reply 6 in the answers log). The drafts above now ship in `data/projects.ts`.

---

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

### Reply 6 · chat message · 2026-11-01 · section I (plan 11-16)

Question: "Should coin-flip ship this clip, poster and description?" Shown with it: the served clip `public/media/coin-flip-toss.9b55947b70.mp4` (4.4 s, 512x1010, no audio, no metadata, 212 KB, untrimmed), the poster (the frame at 3.5 s, coin at rest with HEADS below), the contact sheet, and the description and intro drafts of section I, word for word. Options offered: "approve" (clip, poster, description and intro ship as above), "edit: …", "edit: no intro", "edit: poster at X s", "reject".

Tim's message:
```text
approve
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
