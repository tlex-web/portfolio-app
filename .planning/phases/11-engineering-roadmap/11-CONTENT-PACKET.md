# Phase 11 Content Packet (D-21)

Drafts for Tim's approval. Nothing here ships until Tim's answer is recorded below.

This packet collects every input that only Tim can give for Phase 11, in one checkpoint: the trail pair (D-07), the Medium and High demo commands (D-10), the behaviour lines (D-11), the claims audit (D-09), the links (D-12), the new copy (D-16), the route log, its dates, order and survey date (D-17, D-18, D-20), the project facts, and the UI-SPEC defaults. Claude drafted everything that could be drafted. For each item Tim can approve, edit, choose an option, or decline. Anything he does not answer is recorded as "not supplied". The "If not supplied" line in each section says what the site does in that case: the element is left out, never filled with a draft.

How to answer: reply per section, for example "A: option A, names approved. B: medium = … D: 1 cut, 2 soften, …". Short answers work. "approve" means the draft ships word for word.

Privacy note: the portfolio repo is public. The CLI_X behaviour below is a summary in Claude's own words from a read-only reading during research. No code, file paths, identifiers or configuration names from the private repo appear here.

## Key index

- `trail.clix-cli` (A)
- `trail.clix-website` (A)
- `trail.caption-names` (A)
- `demo.medium` (B)
- `demo.high` (B)
- `demo.explanations` (B)
- `behaviour.low` (C)
- `behaviour.medium` (C)
- `behaviour.high` (C)
- `behaviour.critical` (C)
- `capabilities` (C)
- `claim.1` (D)
- `claim.2` (D)
- `claim.3` (D)
- `claim.4` (D)
- `claim.5` (D)
- `claim.6` (D)
- `claim.7` (D)
- `claim.8` (D)
- `claim.9` (D)
- `claim.10` (D)
- `claim.11` (D)
- `claim.12` (D)
- `claim.13` (D)
- `claim.14` (D)
- `claim.15` (D)
- `claim.16` (D)
- `claim.17` (D)
- `strip.clix-cli` (D)
- `home.line` (D)
- `link.clix-cli.github` (E)
- `link.clix-cli.docs` (E)
- `link.clix-website.demo` (E)
- `link.clix-website.github` (E)
- `link.clix-website.docs` (E)
- `repo.clix-cli` (E)
- `repo.clix-website` (E)
- `copy.projects-intro` (F)
- `copy.pitch.clix-cli` (F)
- `copy.pitch.clix-website` (F)
- `copy.outcome.clix-cli` (F)
- `copy.outcome.clix-website` (F)
- `copy.problem.clix-cli` (F)
- `copy.problem.clix-website` (F)
- `copy.pipeline.clix-cli` (F)
- `copy.pipeline.clix-website` (F)
- `copy.safety-intro` (F)
- `copy.demo-intro` (F)
- `copy.metrics-prose` (F)
- `stack.clix-cli` (F)
- `copy.roadmap-intro` (F)
- `copy.log-entries` (F)
- `fold.features` (F)
- `log.portfolio` (G)
- `log.stale` (G)
- `log.clix-cli` (G)
- `log.clix-website` (G)
- `log.order` (G)
- `log.surveyedAt` (G)
- `fact.clix-cli.version` (H)
- `fact.clix-cli.active` (H)
- `fact.clix-website.status` (H)
- `fact.clix-website.version` (H)
- `default.1` (I)
- `default.2` (I)
- `default.3` (I)
- `default.4` (I)
- `default.5` (I)
- `default.6` (I)
- `default.7` (I)
- `default.8` (I)
- `default.9` (I)
- `default.10` (I)
- `default.11` (I)

## A. Trail pair (D-07)

Keys: `trail.clix-cli`, `trail.clix-website`, `trail.caption-names`.

Each project panel and case-study trailhead gets an elevation profile of one real marked trail inside the 11 km map sheet. Its badge is that trail's real SAC grade (D-05, D-06). Research checked four official Zermatt listings. Every endpoint lies inside the sheet. The DEM heights were sampled from the committed heightmap (08 D-17: DEM heights, not brochure heights).

| Trail (official listing) | SAC grade (source) | Waymark | Official start → end | DEM start → end | Geometry check |
|--------------------------|--------------------|---------|----------------------|-----------------|----------------|
| Hörnliweg No. 27: Schwarzsee → Hörnlihütte | T4 "Alpine Hiking Trail" ([listing](https://zermatt.swiss/en/p/hoernliweg-no-27-01tVj000005EwSkIAK)) | white-blue-white | 2,583 m → 3,260 m, 4.3 km, ↑693 m | 2,587 m → 3,262 m | 4,316 m routed, matches 4.3 km with no via points |
| Zmutt path No. 2: Zermatt station → Zmutt | T1 "Hiking trail" ([listing](https://zermatt.swiss/en/p/zmuttweg-no-2-01tVj00000H69zjIAB)) | yellow | 1,620 m → 1,937 m, 4.3 km, ↑339 m | 1,606 m → 1,934 m | 3,645 m shortest path; needs 1–2 via points to follow the official 4.3 km line |
| Riffelseeweg No. 21: Rotenboden → Riffelberg | T2 "Mountain Hiking Trail" ([listing](https://zermatt.swiss/en/p/riffelseeweg-no-21-01tVj000005Ew9KIAS)) | white-red-white | 2,815 m → 2,582 m, 2.9 km, ↓267 m | 2,806 m → 2,582 m | 2.2 km via the lake shore; needs via points; the trail descends |
| Matterhorn Glacier Trail No. 26: Trockener Steg → Schwarzsee | T3 "Thematic trail" ([listing](https://zermatt.swiss/en/Media/Planning-hikes-tours/Matterhorn-Glacier-Trail-Nr.-26)) | white-red-white | 2,939 m → 2,583 m, 6.6 km | 2,926 m → 2,583 m | not probed; listing showed "Closed" (seasonal) on 2026-11-01 |

Some third-party sites list the Hörnliweg as T3 and the Glacier Trail as T2. The official zermatt.swiss listings above are the source of record.

Options (choose one, or name another pair from the table):

| Option | CLI_X | Website | Pros | Cons |
|--------|-------|---------|------|------|
| Option A (recommended) | Hörnliweg No. 27, T4 | Zmutt path No. 2, T1 | The most distinct glyphs (bars vs diamond); both trails climb; the Hörnliweg line already matches its official length; the trail to the Matterhorn's base suits the larger project | The CLI_X badge is white-blue-white, the same paint as the High band in its own risk scale (D-06 keeps the meanings apart, but a skim reader may link them); the Zmutt line needs 1–2 via points |
| Option B | Riffelseeweg No. 21, T2 | Zmutt path No. 2, T1 | Ties CLI_X to the Riffelsee photo waypoint on Home; neither glyph shares a paint with a High or Critical band | The Riffelseeweg descends (the profile falls left to right); both lines need via points |
| Option C | Hörnliweg No. 27, T4 | Riffelseeweg No. 21, T2 | Both are mountain or alpine trails near the summit | The website glyph descends; both badges use bar waymarks |

Caption place names (Option A, final heights come from the generator's end points):

- `Schwarzsee 2,587 m → Hörnlihütte 3,262 m · T4`
- `Zermatt 1,606 m → Zmutt 1,934 m · T1`

For Option B or C the names would be `Rotenboden … → Riffelberg …` for the Riffelseeweg. Tim can rename any place (for example "Zermatt station" instead of "Zermatt").

Notes:
- The CONTEXT example caption `Start 2,583 m → End 3,260 m · T3` is this Hörnliweg, with brochure heights and an unofficial T3. The DEM heights above replace it.
- Plan 11-04 chooses the via points so that the routed length is within 10 percent of the official length, and records them in its SUMMARY. Tim sees the resulting glyphs in the visual review, so no via-point approval is needed now.

Questions: (1) Which pair? (2) Which project gets which trail? (3) Are the caption place names right?

Reply: "A: option A / B / C (or name the pair and assignment); names approve, or the names to use"
If not supplied: no profile glyph and no grade badge are rendered for that project, on the panel or the trailhead; the panel ships complete without them, with no placeholder line and no generic mountain (UI-SPEC "Input absent (D-07 not approved)").

## B. Medium and High demo commands (D-10)

Keys: `demo.medium`, `demo.high`, `demo.explanations`.

Why this is needed: the four demo commands you supplied at 08-03 score 0.05, 0.15 and 0.29 (all Low) and 0.87 (Critical). The Medium band (0.3 up to 0.6) and the High band (0.6 up to 0.8) have no example. Only a real CLI_X run can fill them (08 D-22: nothing invented).

Please run one request you expect to land in each band, and paste these five things verbatim for each: the request, the command CLI_X returned, the riskScore (two decimals), the warning (if any) and the explanation.

Suggested requests (suggestions only, research's guess at the band; your real output decides where each lands):

| Band | Suggested request |
|------|-------------------|
| Medium (0.3 ≤ score < 0.6) | "delete the build folder in this project and everything in it" |
| High (0.6 ≤ score < 0.8) | "make this script readable and writable by everyone" |

If a score lands in a different band, it is recorded under the band it falls in, with a note.

The existing explanation lines (`demo.explanations`): keep or edit each.

| # | Request | Command | Score | Current explanation | Note |
|---|---------|---------|-------|---------------------|------|
| 1 | show me all Python files larger than 1MB | `find . -name "*.py" -size +1M -ls` | 0.05 | Safe file search operation with no modifications | Uses "Safe"; fine if this is CLI_X's own output |
| 2 | check how much disk space is available | `df -h` | 0.15 | Read-only system information query | — |
| 3 | create a backup of my documents folder | `tar -czf documents_backup_$(date +%Y%m%d).tar.gz ~/Documents/` | 0.29 | Safe backup operation with timestamped filename | Uses "Safe" |
| 4 | kill all Chrome processes | `pkill -f chrome` | 0.87 | High-risk operation - requires explicit confirmation | Says "High-risk", but 0.87 shows as T6 Critical; consider "Critical-risk operation: requires explicit confirmation" or keep if it is CLI_X's verbatim output |

Warning line for #4 (kept as is unless you edit it): "This command terminates running processes".

Reply: "B: medium = request / command / score / warning / explanation; high = …; explanations keep, or edits per #"
If not supplied: the Medium or High band shows its stripe, grade and score range with no example tick, it gets no row in the examples table and no step in the terminal loop, and nothing says "no example" (UI-SPEC "Medium/High examples (D-10)"). Unanswered explanation lines ship unchanged as they are in the data today.

## C. Behaviour lines (D-11)

Keys: `behaviour.low`, `behaviour.medium`, `behaviour.high`, `behaviour.critical`, `capabilities`.

What research found (its own words, from CLI_X main at its last push, 2026-06-08; RESEARCH A6, please correct anything that has changed):
- After CLI_X writes a command, it prints the command and its explanation and asks whether to run it. Nothing runs without that prompt unless the user passes an explicit opt-in flag that skips it. A dry-run mode never runs anything.
- The score runs from 0 to 1 and has three parts. The most severe of the 11 rules the command matches counts most. Next comes the context it would run in (elevated privileges, a sensitive system folder, little free disk space). Last comes the command's shape (risky words such as force, recursive or delete, chained commands, piping into a shell, wildcards). The 11 rules fall into four severities.
- Below 0.3: no warning, and the prompt's default answer is yes.
- 0.3 up to 0.6: with the shipped default setting (confirmation required), CLI_X prints a warning with the message of every rule it matched, and the prompt's default answer becomes no. A user setting can turn this off, and then Medium behaves like Low.
- 0.6 and above: always treated as not safe, whatever the settings: the same warning, the matched rules and a default of no.
- **High and Critical behave the same in the current CLI_X run path, and nothing is hard-blocked.** CLI_X's own safety document describes Critical as blocked; the code does not (RESEARCH Pitfall 9).
- At any grade, a command judged destructive gets a "back up first" recommendation, and a safer alternative is suggested when CLI_X knows one.

Draft lines for the grade table's "What CLI_X does" column:

| Grade | Score | Draft line |
|-------|-------|-----------|
| T1 · Low | 0–0.3 | Shows the command and asks before running it; the answer defaults to yes. |
| T2–T3 · Medium | 0.3–0.6 | Warns, lists the rules the command matched, and asks you to confirm; the answer defaults to no. |
| T4–T5 · High | 0.6–0.8 | Warns, lists the matched rules and suggests a safer command when it knows one; the answer defaults to no. |
| T6 · Critical | 0.8–1.0 | Option (a) or (c) below. |

Decision for the Critical line (High and Critical behave the same):

| Option | Critical line | Pros | Cons |
|--------|---------------|------|------|
| (a) Ship both near-identical lines | "Same as High: a warning and a default of no. It does not block the command outright." | Exactly matches the code; honest | Two adjacent rows say almost the same thing; a reader may ask why the grade exists |
| (b) Change CLI_X first | (Critical gets a real block or a typed confirmation in CLI_X, then the line says so) | The scale would mean something different at T6 | Outside this repo's scope; delays the line until CLI_X ships the change |
| (c) Word Critical to say why it is graded higher, without promising another action | "Matches the most severe rules. CLI_X warns, lists them and defaults to no; the final decision stays with you." | Explains the higher grade; promises nothing the code does not do | Still no different action, just stated more gently |

Optional wording tweak for Medium: append "(with the default settings)", because a user setting can turn the Medium warning off.

Capability sentences (`capabilities`, these replace the v1 true/false flags "Context aware", "Impact analysis" and "Alternatives"; keep, edit or cut each):

1. "The context a command would run in, such as elevated privileges, a sensitive system folder or low free disk space, raises its score."
2. "A command judged destructive comes with a recommendation to back up first."
3. "When CLI_X knows a safer command for the same task, it suggests it."
4. (optional) "A dry run shows the command and its score without running anything."

Reply: "C: low approve/edit; medium approve/edit (with or without the settings note); high approve/edit; critical (a)/(b)/(c) or your line; capabilities keep 1–4 / edits / cut n"
If not supplied: the "What CLI_X does" column is not rendered at all (no empty cells) and the grade table shows grade and score only (UI-SPEC grade table "Lines not approved"); capability sentences that are not kept are not rendered, and the v1 true/false flags never render.

## D. Claims audit (D-09)

Keys: `claim.1` to `claim.17`, `strip.clix-cli`, `home.line`.

Every CLI_X figure below comes from the author's own README or CHANGELOG in the private repo, none with a stated method or environment. Mark each row **source: <link or how measured>**, **soften** or **cut**. A softened claim ships as the soft wording, with no figure. A sourced metric also needs its context line (see below the table).

| # | Claim | Where it appears | Current wording | Finding | Proposed soft wording | What would source it | Tim: source / soften / cut |
|---|-------|------------------|-----------------|---------|-----------------------|----------------------|----------------------------|
| 1 | 95% accuracy | data/projects.ts:31 features | "Natural language to shell command conversion (95% accuracy)" | Misattributed: CLI_X docs give "~95% accuracy" for the response-parsing stage, not end-to-end conversion | "Turns plain-English requests into commands for PowerShell, Bash, sh and cmd." | An evaluation set (N requests, a correctness rule, model, version) | |
| 2 | ~90ms (40% faster) | :52 Performance tile; :10 longDescription "a 90ms startup" | "~90ms (40% faster)" | README "~90ms (40% faster than baseline)"; the baseline is unnamed | Drop "40% faster"; keep ~90 ms only with your measurement | e.g. hyperfine on a named version, machine and OS | |
| 3 | 40-60% API cost reduction | :42 features | "Intelligent caching (40-60% API cost reduction)" | CLI_X docs give 40–60% as a typical cache hit rate and estimate cost from it | "Caches responses, so a repeated request skips the API call." (Metrics prose) | Hit-rate logs over a stated period | |
| 4 | <100ms startup | :43 features | "Async context loading (<100ms startup)" | Changelog "Startup latency: <100ms (from ~2s)"; overlaps #2 | "Loads project context in the background, so the prompt appears straight away." | Same measurement as #2 | |
| 5 | enterprise-grade safety | :9 shortDescription | "…using LLM technology with enterprise-grade safety." | No standard behind it | "…and scores every command for risk before it runs." | Not sourceable; cut the phrase | |
| 6 | ML-inspired | :10 longDescription; :34 features | "an ML-inspired risk scorer"; "ML-inspired safety system with 11 comprehensive rules" | The scorer is a weighted, rule-based formula with no learned model | "a rule-based risk score built from 11 rules" | — (soften) | |
| 7 | Accessibility compliant (WCAG 2.1) | :177 website features | "Accessibility compliant (WCAG 2.1)" | No audit evidence; the site is offline | Cut | An audit report | |
| 8 | PCI-compliant payments | :214 website security list | "PCI-compliant payments" | PCI scope sits with Stripe when hosted Checkout or Elements is used (research assumption A2) | "Card payments run through Stripe; card details never reach my server." (only if true) | You confirm the Stripe integration type | |
| 9 | 850+ tests / 100% pass rate | :64-65 Testing tiles; :10 "Over 850 tests" | "850+", "100%" | v2.4.0 changelog figure; stale: v2.4.1 says 900+ | "{N} automated tests, run in CI on every push" (only if CI runs them) | A test count on a tagged version; drop "100% pass rate" (a moment-in-time state) | |
| 10 | +90 new tests | :66 Testing tile | "+90 from v2.3.0" | Changelog trivia | Cut | — | |
| 11 | Docs line counts | :67-68 Testing tiles | "6,700+ lines", "3,200+ for v2.4.0" | Changelog; the docs site is offline | Cut | — | |
| 12 | Memory / binary / cache / overhead | :53-56 Performance tiles; :10 "36MB footprint" | "~36MB typical", "4-6MB stripped", "~1.5ms lookup", "~28ms" | README performance list and changelog, no method | Keep only those you measure (mark each of the four) | A measurement each, with version | |
| 13 | Feature counts | :93-97 Features tiles | Providers 4, Templates 60+, Commands 40+, Intent types 17, Context sources 5 | Docs counts; the README lists 5 providers (including "Local") | Providers is derived from the Stack data; the others only if you confirm them | A count from the code at a version | |
| 14 | "safe" commands | :7 tagline "safe, executable shell commands" | "Transform natural language into safe, executable shell commands" | CLI_X grades risk; it does not guarantee safety | "…graded for risk before you run it" (the panel pitch draft already says this) | — | |
| 15 | Website security list | :212-217 | Bcrypt password hashing, Cryptographically signed licenses, PCI-compliant payments (#8), Input sanitization, Rate limiting, HTTPS/TLS 1.3 | Not verifiable (no repo, site down); TLS 1.3 would be the host's default (assumption A3) | Keep the items you confirm, without "HTTPS/TLS 1.3" | You (mark each item) | |
| 16 | Model versions | :10 "GPT-4, Claude…"; :14-16 techStack "OpenAI GPT-4", "Anthropic Claude 3.5", "Groq Llama 3.3" | as quoted | Model names date quickly | The Stack lists providers (OpenAI, Anthropic, Groq, Ollama), not models | — | |
| 17 | Website platform claims | :136-140 short and longDescription | "interactive demo playground", "try CLI_X in-browser", "Next.js 14" | The site is offline; cannot be checked | Past tense or cut, your call | You | |

Context lines (only you can supply them): for every metric you mark **source**, give the context line that sits under its tile, for example "Measured on v2.4.1, release build" or "Counted on v2.4.1". A tile without an approved context line does not ship (UI-SPEC Metrics "Context line (required)").

CLI_X panel strip (`strip.clix-cli`, 2–3 items, no context line on the panel):

| Option | Items | When it applies |
|--------|-------|-----------------|
| Proposed | Startup (~90 ms) · Tests ({N}) · Providers (4) | Startup and Tests only if #2 and #9 are sourced; Providers is derived from the Stack providers group |
| Fallback | Providers (4) | Neither Startup nor Tests is sourced |

Home line (`home.line`): the Phase 9-approved Home copy (data/home.ts) says CLI_X "turns plain language into safe shell commands". That is the same "safe" wording as claim #14.

| Option | What happens | Pros | Cons |
|--------|--------------|------|------|
| now | Change it in Phase 11, for example to "turns plain language into shell commands and grades their risk" | One consistent claim across the site, sooner | Touches approved Phase 9 copy and its baselines in this phase |
| Phase 12 | Leave it now and fix it in the Phase 12 cleanup | Keeps Phase 11 to its own pages | The Home and project pages disagree until Phase 12 |
| keep | Leave it as is | No change | Overclaims compared with claim #14 |

Phase 12 note (no answer needed now): the portfolio's own README.md (lines 31 and 405) claims WCAG 2.1 AA. That is not on the site; it is logged for the Phase 12 audit.

Reply: "D: 1 cut/soften/source …; 2 …; … 17 …; context lines for sourced rows; strip proposed/fallback/your items; home now/Phase 12/keep"
If not supplied: an unanswered claim is treated as not sourced: its figure and phrase do not ship anywhere (panel strip, prose, tiles, tables or chips). Its soft wording also does not ship unless you approve it, because softening is a choice only you can make (UI-SPEC Metrics "Claim states"; a Metrics group with no shippable tile is not rendered). If `strip.clix-cli` is not supplied, the strip uses the fallback (Providers alone). If `home.line` is not supplied, the Home copy stays unchanged.

## E. Links (D-12)

Keys: `link.clix-cli.github`, `link.clix-cli.docs`, `link.clix-website.demo`, `link.clix-website.github`, `link.clix-website.docs`, `repo.clix-cli`, `repo.clix-website`.

Finding on 2026-11-01: all four project URLs were dead to the public.

| Key | URL | 2026-11-01 finding | Tim: live / not live |
|-----|-----|--------------------|----------------------|
| `link.clix-cli.github` | https://github.com/tlex-web/cli_x | 404 to the public: the repo is private | |
| `link.clix-cli.docs` | https://docs.cli-x.com | Did not resolve | |
| `link.clix-website.demo` | https://cli-x.com | Did not resolve | |
| `link.clix-website.github` | https://github.com/tlex-web/cli_x-website | Does not exist | |
| `link.clix-website.docs` | https://docs.cli-x.com | Did not resolve (same URL as the CLI_X docs link) | |

Please open each URL in a private browser window and answer "live" or "not live". Only live links render.

Source repository note (`repo.*`): is each project's source repository private? A private repository renders as plain text "Source: private repository" plus an "Ask for a walkthrough →" link to /contact on the trailhead.

| Key | Question | Options |
|-----|----------|---------|
| `repo.clix-cli` | Is the CLI_X source private? | private (shows the note) / public (then the GitHub link must be live) / no note |
| `repo.clix-website` | Is there a website source repository, and is it private? | private (shows the note) / no repository, no note |

Reply: "E: each URL live / not live; repo.clix-cli private/public/no note; repo.clix-website private/no note"
If not supplied: the link is treated as dead and is not rendered, and a data-level test keeps the four known-dead URLs out. An unanswered repo question shows no repository note; if a project then has no link and no note, its links row is not rendered (UI-SPEC links row "No link and no repo note").

## F. Copy (D-16)

Keys: `copy.projects-intro`, `copy.pitch.clix-cli`, `copy.pitch.clix-website`, `copy.outcome.clix-cli`, `copy.outcome.clix-website`, `copy.problem.clix-cli`, `copy.problem.clix-website`, `copy.pipeline.clix-cli`, `copy.pipeline.clix-website`, `copy.safety-intro`, `copy.demo-intro`, `copy.metrics-prose`, `stack.clix-cli`, `copy.roadmap-intro`, `copy.log-entries`, `fold.features`.

Rules every draft follows: first person, short, factual, sentence case, no exclamation marks, no figure you have not sourced in D, and none of the UI-SPEC banned phrases ("95% accuracy", "40% faster", "40-60% API cost reduction", "enterprise-grade", "ML-inspired", "WCAG 2.1 compliant", "PCI-compliant", "100% pass rate", docs line counts, "Experience CLI_X in 3D", "holographic", "Programming Projects").

### F1. UI-SPEC drafts (verbatim from the UI-SPEC Copywriting Contract)

| Key | Where | Draft |
|-----|-------|-------|
| `copy.projects-intro` | /projects intro | "Two things I build and maintain: CLI_X, a command-line tool that turns plain English into shell commands, and the website that licenses and ships it. Each route opens a case study." |
| `copy.pitch.clix-cli` | CLI_X panel pitch | "Type what you want in plain English and get a command for your shell, graded for risk before you run it." |
| `copy.pitch.clix-website` | Website panel pitch | "Licences, payments and downloads for CLI_X, in one Next.js app." |
| `copy.safety-intro` | CLI_X Safety intro | "CLI_X scores every command it writes from 0 to 1 against 11 rules. I show the score as a Swiss hiking grade: the higher the grade, the more care the route needs." |
| `copy.demo-intro` | Demo intro (replaces "Experience CLI_X in 3D") | "Four requests I ran through CLI_X, replayed with the commands and scores it returned." (the count follows the data: "Six requests…" if B adds two) |
| `copy.roadmap-intro` | /roadmap intro | "What I've finished, what I'm working on and what comes next, for this site, CLI_X and its website." |

Note on `copy.projects-intro`: "build and maintain" depends on H (is CLI_X still active, is the website still running). If the website is archived, a variant: "Two things I built: CLI_X, a command-line tool that turns plain English into shell commands, and the website that licensed and shipped it. Each route opens a case study."

### F2. Outcome lines (one line under each case-study title)

| Key | Draft |
|-----|-------|
| `copy.outcome.clix-cli` | "Describe a task in plain English; CLI_X writes the shell command, explains it and grades its risk before it runs." |
| `copy.outcome.clix-website` | "A Next.js app I built to sell CLI_X licences and ship its downloads for Windows, macOS and Linux." |

### F3. Problem sections

`copy.problem.clix-cli` (three short paragraphs):

> Shell syntax is a second language I keep half-forgetting: the flags for find, the quoting rules in PowerShell, the one option that makes a command destructive. I built CLI_X so I could say what I want in plain English and get a command for the shell I'm in, whether that is PowerShell, Bash, sh or cmd.
>
> A request passes through four stages on its way to a language model and back. CLI_X is written in Rust and works with OpenAI, Anthropic and Groq, or with local models through Ollama.
>
> A generated command can still do damage. So by default CLI_X shows the command, explains it, scores it from 0 to 1 against 11 rules and asks before it runs anything.

`copy.problem.clix-website` (three short paragraphs; the second is the one pricing sentence, no figures, D-13):

> CLI_X needed somewhere to be sold and downloaded. I built one Next.js app that handles accounts, payments, licence keys and downloads for Windows, macOS and Linux.
>
> There are two ways to use CLI_X: a free bring-your-own-key tier and a Pro subscription, sold through Stripe.
>
> Sign-in runs through NextAuth.js with OAuth, data lives in PostgreSQL through Prisma, and the sensitive logic stays in server-side route handlers.

(If H says the website is archived, the tense moves to the past: "There were two ways…", "Sign-in ran through…".)

### F4. Pipelines

`copy.pipeline.clix-cli`: stage names are fixed from the data (Intent analysis, Context enrichment, Prompt optimisation, Response parsing). Descriptions and the In and Out lines are drafts:

| # | Stage | Draft description |
|---|-------|-------------------|
| 01 | Intent analysis | "Works out what kind of task the request describes." |
| 02 | Context enrichment | "Adds details about where the command will run, such as the shell and the operating system." |
| 03 | Prompt optimisation | "Builds the prompt the model receives from the request and that context." |
| 04 | Response parsing | "Pulls the command and its explanation out of the model's reply." |

Optional endpoint lines: "In: a plain-English request" and "Out: a shell command and its risk score".

`copy.pipeline.clix-website` (Claude's discretion: offered because every step is a fact already in data/projects.ts: Stripe subscriptions, payment webhook processing, signed licence keys, licence emails, cross-platform downloads from the dashboard):

| # | Stage | Draft description |
|---|-------|-------------------|
| 01 | Checkout | "A visitor picks a plan and pays through Stripe." |
| 02 | Payment webhook | "Stripe tells the server the payment went through." |
| 03 | Licence signing | "The server signs a licence key and emails it to the buyer." |
| 04 | Download | "The dashboard offers the build for Windows, macOS or Linux." |

| Option | Pros | Cons |
|--------|------|------|
| ship the website pipeline | Gives the website case study a real section between Problem and Safety; every step is in the data | Describes a flow nobody can try while the site is down |
| omit | Shorter, safer page | The website case study is mostly prose and lists |

### F5. Metrics prose and Stack

`copy.metrics-prose` (only for claims you mark **soften** in D; each sentence ships only if its claim is softened):

> CLI_X caches model responses, so a repeated request skips the API call. It loads project context in the background, so the prompt appears straight away.

(First sentence = claim #3, second = claim #4.)

`stack.clix-cli` (groups from the data's techStack; providers named without model versions, claim #16):

| Group label | Items |
|-------------|-------|
| Core | Rust, Tokio, Clap, Serde |
| LLM providers | OpenAI, Anthropic, Groq, Ollama |
| Storage | SQLite |
| Tooling | Docker |

Alternative: merge Storage and Tooling into one group "Storage and tooling: SQLite, Docker".

### F6. Route-log entry texts (`copy.log-entries`)

| Entry | Title draft | Description draft |
|-------|-------------|-------------------|
| v1.0 | v1.0 Stabilization & Visual Identity | "Fixed the dependency tree, hardened security with a nonce-based CSP and persistent rate limiting, and gave the site its first design system." |
| v2.0 | v2.0 Topographic Identity | "Rebuilding the site around real terrain data from the Matterhorn: a new shell, a scroll ascent on Home, photographs placed on the map, and this route log." |

v2.0 disclosure lines (format `Phase {n} · {name} · {date | In progress | Planned}`; names shortened from ROADMAP.md):

| Phase | Short name |
|-------|-----------|
| 7 | Foundation & guardrails |
| 8 | Data & terrain pipeline |
| 9 | Home ascent |
| 10 | Photography |
| 11 | Engineering & roadmap |
| 12 | Contact, edge pages & cleanup |

### F7. Features fold map (`fold.features`, D-15)

The `features` lists leave the data. Each line either moves into a section or is cut. Approve the map or change rows.

CLI_X:

| # | Feature line today | Proposed destination |
|---|--------------------|---------------------|
| 1 | Natural language to shell command conversion (95% accuracy) | Problem, without the figure (claim #1) |
| 2 | 4-stage intelligence pipeline (…) | Pipeline |
| 3 | Multi-provider LLM support (OpenAI, Anthropic, Groq, Ollama) | Stack (LLM providers group) |
| 4 | ML-inspired safety system with 11 comprehensive rules | Safety intro ("11 rules"), without "ML-inspired" (claim #6) |
| 5 | Cross-platform command generation (PowerShell, Bash, Sh, Cmd) | Problem |
| 6 | Conversation mode with persistent context retention | Route log (cli-conversation-mode, completed) |
| 7 | Workflow automation with pattern detection and recommendations | Cut (scheduling is on the route log as cli-workflow-scheduling) |
| 8 | Template system with 60+ pre-built templates and interactive TUI | Cut (count is claim #13) |
| 9 | Ollama integration for complete local model management | Route log (cli-ollama-integration) and Stack (Ollama) |
| 10 | Template analytics with usage tracking and effectiveness scoring | Route log (cli-template-analytics) |
| 11 | Command suggestions with proactive assistance | Cut |
| 12 | Intelligent caching (40-60% API cost reduction) | Metrics prose, without the figure (claim #3) |
| 13 | Async context loading (<100ms startup) | Metrics prose or a tile (claim #4) |
| 14 | Comprehensive audit logging and command history | Cut (alternative: one Safety sentence "Every command it runs is logged.", only if you confirm it) |

Website:

| # | Feature line today | Proposed destination |
|---|--------------------|---------------------|
| 1 | Interactive demo playground with live command generation | Cut (claim #17; the site is offline) |
| 2 | Subscription management with Stripe integration | Problem (pricing sentence) and Pipeline 01 |
| 3 | Secure license key generation and validation | Pipeline 03 |
| 4 | Cross-platform binary distribution (Windows, macOS, Linux) | Pipeline 04, Problem, and the panel strip fact "Platforms 3" |
| 5 | User authentication with NextAuth.js and OAuth | Problem and Stack |
| 6 | PostgreSQL database with Prisma ORM | Stack |
| 7 | Responsive, modern UI with dark theme | Cut |
| 8 | Rate limiting and abuse prevention | Safety (already in the security list, claim #15) |
| 9 | Download analytics and tracking | Cut |
| 10 | Email notifications for licenses | Pipeline 03 |
| 11 | User dashboard for license management | Pipeline 04 |
| 12 | Real-time payment webhook processing | Pipeline 02 |
| 13 | SEO optimized with meta tags and sitemaps | Cut |
| 14 | Accessibility compliant (WCAG 2.1) | Cut (claim #7) |

If you omit the website pipeline, lines 2, 3, 10, 11 and 12 move to Problem prose where the approved Problem copy already covers them, and are cut otherwise.

Reply: "F: approve all, or per key: approve / edit (your text) / omit"
If not supplied: unapproved copy does not ship. An unapproved intro, pitch or outcome line is left out, and its element ships complete without it. An unapproved Problem section means the section is not rendered. A pipeline stage without an approved description shows its name only, and the In and Out lines are left out. An unapproved website pipeline is omitted. Unapproved metrics prose is left out. If the CLI_X stack groups are not approved, the flat stack list renders as one group with no heading (UI-SPEC Stack "Flat list only"). If the log entry texts are not approved, the v1.0 and v2.0 entries keep only their titles, which come from MILESTONES.md and ROADMAP.md. If the fold map is not approved, every feature line is cut, except the four stages, the 11 rules, caching and the providers, which D-15 already places.

## G. Route log (D-17, D-18, D-20)

Keys: `log.portfolio`, `log.stale`, `log.clix-cli`, `log.clix-website`, `log.order`, `log.surveyedAt`.

### G1. Portfolio rows (`log.portfolio`, git-verified; confirm)

| id (proposed) | Title | Status | completedAt | Evidence |
|---------------|-------|--------|-------------|----------|
| portfolio-v1 | v1.0 Stabilization & Visual Identity | completed | 2026-03-12 | MILESTONES.md "Shipped: 2026-03-12"; commit 1cb6e91 "v1.0" dated 2026-03-12 |
| portfolio-v2 | v2.0 Topographic Identity | in-progress | — | commit 383a4f9 "docs: start milestone v2.0 Topographic Identity", 2026-10-10 |
| ↳ Phase 7 | Foundation & guardrails | completed | 2026-10-24 | commit b147f20, 2026-10-24 |
| ↳ Phase 8 | Data & terrain pipeline | completed | 2026-10-24 | commit a413b69, 2026-10-24 |
| ↳ Phase 9 | Home ascent | completed | 2026-10-25 | commit 6500ae2, 2026-10-25 |
| ↳ Phase 10 | Photography | completed | 2026-10-26 | commit ae887f0, 2026-10-26 |
| ↳ Phase 11 | Engineering & roadmap | in-progress | — | current phase |
| ↳ Phase 12 | Contact, edge pages & cleanup | planned | — | ROADMAP.md |

### G2. Stale portfolio items (`log.stale`)

| Current item | Proposal | Alternative | Reason |
|--------------|----------|-------------|--------|
| portfolio-3d-gallery "3D Image Gallery Enhancement" (planned, v1.1.0) | Retire | Keep as completed 2026-10-26, rewritten: "3D carousel, map and grid for the photographs" | Phase 10 shipped the 3D carousel, map and grid (parallax was dropped by design); a separate row would repeat the v2.0 Phase 10 line; no project links to this id |
| portfolio-blog "Photography Blog" (planned, v1.2.0) | You decide | Keep as planned with the target removed (v1.x is over), or retire | No evidence either way in git or the planning docs |

### G3. CLI_X rows (`log.clix-cli`, needs you)

Evidence from the CLI_X changelog and roadmap, for confirmation only:

| id | Current data | What the CLI_X repo suggests | You supply |
|----|--------------|------------------------------|------------|
| cli-conversation-mode, cli-ollama-integration, cli-template-analytics | completed, v2.4.0, no date | The changelog dates v2.4.0 2025-11-11 and lists these features | completedAt = 2025-11-11, or the real ship date |
| cli-conversation-export | in-progress, v2.5.0 | v2.4.1 (2025-12-18) added export to text, Markdown and JSON; PDF and syntax highlighting are not mentioned | (a) completed 2025-12-18 with the description "Export conversations to text, Markdown and JSON."; (b) split into a completed row and an in-progress PDF row; (c) keep in progress |
| cli-workflow-scheduling | in-progress, v2.5.0 | v2.4.1 added persistent workflows and schedules, file-watch triggers and new conditions; cron with timezones and retries is unclear | Status, and date if completed |
| cli-plugin-system (v3.0.0), cli-autocomplete (v2.6.0), cli-collaborative-commands (v3.0.0), cli-web-interface (v3.1.0) | planned | CLI_X's own roadmap puts collaboration and a plugin system in a later major version than the portfolio data does | Keep, retarget (new version) or retire, each |

### G4. Website rows (`log.clix-website`, needs you)

webshop-team-management (v1.1.0), webshop-analytics (v1.2.0), webshop-api-marketplace (v1.3.0) and webshop-mobile-app (v2.0.0) are all planned. There is no website repository and cli-x.com does not resolve. For each: still planned (keep), retarget, or retire.

### G5. Order (`log.order`)

Proposal, read from the bottom of the climb (Base) to the top (Summit). Completed items run oldest to newest, then in-progress items with v2.0 at the top of the camp, then planned items from the next likely one upward:

1. Base (completed): cli-conversation-mode → cli-ollama-integration → cli-template-analytics (2025-11-11, if confirmed) → cli-conversation-export / cli-workflow-scheduling (2025-12-18, only if you mark them completed) → portfolio-v1 (2026-03-12)
2. Current camp (in progress): any CLI_X items you keep in progress → portfolio-v2 (top of the camp)
3. Summit (planned, lowest first): portfolio-blog (if kept) → cli-autocomplete → webshop-team-management → webshop-analytics → cli-plugin-system → cli-collaborative-commands → webshop-api-marketplace → cli-web-interface → webshop-mobile-app

### G6. Survey date (`log.surveyedAt`)

The /roadmap kicker reads "Route log surveyed {date}". Rule (D-20, unit-tested): it must not be in the future, and it must not be earlier than the newest completedAt, including the v2.0 phase dates (today 2026-10-26). Proposal: 2026-11-01, the date of this survey.

Reply: "G: portfolio approve/edits; 3d-gallery retire/keep; blog keep/retire; CLI_X rows status + dates + keep/retarget/retire; website rows …; order approve/edits; surveyedAt YYYY-MM-DD"
If not supplied: the portfolio rows ship only as you confirm them. A CLI_X or website row without a confirmed status keeps its current data and shows no date: a completed row without a confirmed date reads "{Project} · Completed" (UI-SPEC row meta). An unanswered stale item keeps its current row. Without an approved order, the log keeps the current data order inside each band; the proposal above ships only if you approve it. surveyedAt is a required field: without it the route-log build fails, so the /roadmap rewrite cannot ship until you give a date (UI-SPEC E16).

## H. Project facts

Keys: `fact.clix-cli.version`, `fact.clix-cli.active`, `fact.clix-website.status`, `fact.clix-website.version`.

| Key | Question | Current data | Evidence | Options |
|-----|----------|--------------|----------|---------|
| `fact.clix-cli.version` | Which version does the CLI_X kicker show? | v2.4.0 | The changelog's latest entry is v2.4.1 (2025-12-18) | v2.4.0 / v2.4.1 / other |
| `fact.clix-cli.active` | Is CLI_X still in active development? | status active | The repo was last pushed 2026-06-08 (RESEARCH open question 2) | yes (kicker "Active") / no (give the status word) |
| `fact.clix-website.status` | What is the website's status? | active | No repository found and cli-x.com does not resolve (RESEARCH open question 3) | active / complete / archived |
| `fact.clix-website.version` | Which version does the website kicker show? | v1.0.0 | No evidence either way | v1.0.0 / other / none |

Reply: "H: CLI_X version …; active yes/no; website status …; website version …"
If not supplied: the kicker keeps the current status word, and the version is left out (the kicker drops " · {version}", UI-SPEC E1/E4). The website panel strip then has no Version item.

## I. UI-SPEC defaults

Keys: `default.1` to `default.11`.

| # | Default (researcher) | Alternative |
|---|----------------------|-------------|
| 1 | /roadmap h1 "Roadmap" (nav label); "Route log" lives in the kicker "Route log surveyed …" | h1 "Route log" (stronger metaphor, differs from the nav label) |
| 2 | Priority is not shown on route-log rows; order carries it | Keep priority as text ("High priority") in the meta line |
| 3 | Row descriptions always visible; only v2.0 has a disclosure | Every description behind a disclosure (shorter page, 16 more controls) |
| 4 | Risk-scale ticks are numbered links to their table rows, no hover popover | Hover and focus popovers with Escape to dismiss (needs a client island and WCAG 1.4.13 handling) |
| 5 | Panels show verified links and the "Source: private repository" text; "Ask for a walkthrough" is on the trailhead only | Also put "Ask for a walkthrough" on each panel |
| 6 | Primary CTA on the case study: "Ask for a walkthrough" → /contact | "Get in touch", or no primary fill |
| 7 | External project links open in the same tab, with an external-link icon | Open in a new tab with sr-only "(opens in a new tab)" (the Phase 10 hotspot-source pattern) |
| 8 | Pause toggle: constant label "Pause" with aria-pressed | Label swaps between "Pause" and "Play" without aria-pressed |
| 9 | Trail red oklch(0.60 0.20 27) and blue oklch(0.55 0.17 255); T1 stays the current trail yellow (Home unchanged) | Retune T1 to a more saturated signage yellow (changes Home's sign tips and baselines) |
| 10 | Filter tracks show counts and become 2 × 2 below 640 px | No counts (narrower, one row at 375 px), or a native select on phones |
| 11 | No terminal copy button | Copy button announcing "Copied" |

Reply: "I: accept all, or per row: n default / n alternative"
If not supplied: the row is recorded as not supplied, and the UI-SPEC default in the left column applies, as the approved UI-SPEC already specifies. These are design choices, not content, so no wording or figure is invented.
