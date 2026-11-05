# Phase 11: Engineering & Roadmap - Research

**Researched:** 2026-11-01 (re-research for the box + coin-flip swap; replaces the CLI_X version of this file wholesale)
**Domain:** Next.js 16.4 Server Components + small client islands; typed project/roadmap data; a build-time DEM trail-profile generator; a same-origin muted video asset with a pure-Node guard; real captured CLI output from box v2.0
**Confidence:** HIGH for the stack, patterns, Next.js APIs, box facts and the video pipeline (each probed this session); MEDIUM for the Zmutt via-point routing and the final clip size (depend on inputs not yet in hand)

> **Privacy (D-23).** This file is committed to a public repo. Everything about `tlex-web/coin-flip` (private) below is a summary in my own words of a read-only `gh` look at its planning record. No source, file path, identifier, defect or backlog ID, test evidence or internal measurement is reproduced. box is public; its README and `.planning/` are cited and linked.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
(Copied verbatim from `11-CONTEXT.md` `## Implementation Decisions`.)

Decision IDs from the first pass are kept, so 11-01's code comments and SUMMARY (D-02, D-03) stay valid. A retired ID is never reused. New decisions start at D-22.

#### Project swap
- **D-22: box and coin-flip replace clix-cli and clix-website entirely** (Tim, 2026-11-01, at the 11-02 checkpoint: "Both CLI_X projects out"). box is github.com/tlex-web/box: public, Rust, a CLI toolkit for Windows PowerShell 7 with 23 tools in one binary. coin-flip is github.com/tlex-web/coin-flip: private, a native Android app (Kotlin) built around a 3D coin toss. The slugs are `box` and `coin-flip`. The old `cli-*` and `webshop-*` roadmap rows, CLI_X demo commands, fixtures and tests leave. Tests that referenced them are rewritten for the new projects and never deleted (test-count ratchet). The visual baseline folders `clix-cli` and `clix-website` are replaced by `box` and `coin-flip` in the phase re-baseline. — **Reversibility:** costly — once shipped, the slugs are shared URLs and visual-baseline folder names.
- **D-23: The private-repo constraint now covers coin-flip** (it carries forward D-11's rule, which originally covered CLI_X). Research may read `tlex-web/coin-flip` read-only through Tim's authenticated `gh`. The portfolio repo and its `.planning/` docs are **public**, so RESEARCH.md, plans, commits and the site summarise in Claude's own words. They must not copy source, file paths, identifiers, defect or backlog IDs, test evidence or internal measurements. The site may state, in approved wording, what the app is, its sourced feature facts (zero permissions, fully offline, no ads, trackers or accounts, a cryptographic 50/50 result decided before the toss, TalkBack support, reduced-motion support, system font scaling) and its milestone dates. box is public, so its README and `.planning/` docs may be cited and linked.

#### Safety slot (ENG-03 retired)
- **D-04: Retired** (the CLI_X risk badge in the terminal). D-26's optional note line takes its place.
- **D-10: Retired** (CLI_X Medium/High demo commands).
- **D-11: Retired** (CLI_X per-grade behaviour lines). Its privacy rule lives on in D-23.
- **D-24: ENG-03 is retired, because CLI_X is discontinued.** REQUIREMENTS.md marks ENG-03 as dropped with the reason. The ROADMAP Phase 11 goal and success criterion 3 are rewritten without risk bands, and the traceability row is updated. No `RiskScale` component is built. Trail grades appear only as the real SAC badges of the panel and trailhead trails (D-06), so the grade vocabulary has one meaning across the site. The CLI_X-only code goes: the score-band logic in `lib/trail-grade.ts` (`RISK_BANDS` score ranges, `bandFor`, `isScoreInLevel`), and `RiskLevel`, `RiskScaleBlock` and `riskLevel`/`riskScore` in `data/schemas/project.ts`. The marker-glyph vocabulary the badges need stays: T1 yellow, T2–T3 white-red-white, T4–T5 white-blue-white, T6 unmarked. Which plan edits REQUIREMENTS.md and ROADMAP.md is the planner's call; it should be early. — **Reversibility:** reversible — a planning-doc change, plus code that is not yet shipped in its v2 form.
- **D-25: The safety slot keeps its position, and its heading is set per project:** "Safety" for box, "Privacy" for coin-flip.
  - **box Safety:** two or three sentences of prose about the gate: destructive commands preview by default, nothing is written without `--force`, and every check passes before any write. Then one static block of **real** preview output. Claude captures it with the locally installed box 0.1.0, running a destructive command in preview mode (e.g. `box dupes`) against a throwaway folder in the scratchpad. A line follows it saying what `--force` would do. Tim approves the capture at the copy checkpoint.
  - **coin-flip Privacy:** zero permissions (checked on the release APK), fully offline, no ads, trackers or accounts.
  - **Fairness goes in coin-flip's Pipeline, not under Privacy:** a cryptographic 50/50 draw decides the result before the toss, and the animation is choreographed to land on it.

#### Demos (ENG-05)
- **D-01: Kept** (flat token terminal; three.js never loads on project pages; built in 11-01). The terminal heading copy is rewritten for box under D-16.
- **D-02: Amended. Releasing the Pause toggle now resumes at once.** Tim chose option B for the 11-01 open question. Hover and focus-within still pause temporarily, and leaving resumes. Pressing Pause is still sticky. When the visitor releases the toggle, it clears the current hover and focus pauses until the pointer or focus next enters the terminal (the WAI carousel's explicit start). Offscreen (IntersectionObserver) and hidden-tab (`visibilitychange`) pauses are unchanged. Reduced motion still starts paused with full text. The UI-SPEC, `lib/demo-terminal.ts`, its Jest suite, `DemoTerminal.test.tsx` and `e2e/case-study.spec.ts` (including its `leaveTerminal()` helper assumptions) change together. Tests assert state (`aria-pressed`, `data-playback`), not classes.
- **D-03: Kept** (per-command selector dots, restyled; already built in 11-01).
- **D-26: The box terminal loop shows box as a scriptable toolkit, with real captured output.** It has 4–5 commands that show what v2.0 is about. Examples: `box hash <file>` (BLAKE3 by default), `box uuid --json`, `box epoch …`, and a `box du --json | ConvertFrom-Json` style pipeline line. Claude captures them with the installed `box 0.1.0` (`%LOCALAPPDATA%\Programs\box\box.exe`):
  - with `NO_COLOR` set;
  - read-only commands only, with inputs in the scratchpad;
  - no home-directory paths, no network (`weather` is excluded), and no `--version` (D-29).

  The exact command lines go in the SUMMARY, and Tim approves the transcript at the copy checkpoint. Output is captured once and frozen (a random value such as a UUID stays as captured), so nothing is invented (08 D-22). Each command may carry an optional one-line note under its output, in place of the D-04 badge line. `DemoCommandSchema` drops `riskLevel` and `riskScore` and gains the optional note field.
- **D-27: coin-flip's Demo is a short, muted clip.** It is a 5–10 s device screen recording of one flip, served same-origin. The `<video>` element:
  - is muted, does not loop, shows controls and has a poster frame;
  - never autoplays, so the visitor clicks to play. Under reduced motion the poster stays until the visitor plays it.

  Metadata is stripped, and the size budget is about 1.5 MB. Formats and encoding are research's call. Visual tests capture the poster, so screenshots are deterministic. The app is silent, so the clip has no audio track. It gets an accessible name and a short text description of what happens.

  **Source:** Tim records a fresh, clean clip on the device at a human-action checkpoint (no debug overlays; the finish is his pick) and drops the file in a folder the plan names. Claude trims, encodes, strips metadata and extracts the poster. If no clip arrives, coin-flip ships **without** a Demo section, never with a placeholder (10 D-07).

  Video is a new served-asset type. The CSP has no `media-src`, so `default-src 'self'` already allows same-origin video. The served-asset guard (`guard:images`) does not yet check video for metadata, size or hash names, so research decides how to extend it.

#### Route panels (ENG-01)
- **D-05: Kept** (a build-time DEM trail-profile glyph with an offline `--check`, `aria-hidden`, and its meaning carried by the caption).
- **D-06: Kept.** A project's badge is the real SAC grade of the trail its glyph draws. With ENG-03 retired, the grade vocabulary means only "trail grade" everywhere on the site.
- **D-07: Answered for the new pair** (Tim, this discussion). **box → Hörnliweg No. 27**, Schwarzsee → Hörnlihütte, **T4** (white-blue-white). **coin-flip → Zmutt path No. 2**, Zermatt → Zmutt, **T1** (yellow). The sources are the official zermatt.swiss listings quoted in `11-CONTENT-PACKET.md` §A. The captions are `Schwarzsee 2,587 m → Hörnlihütte 3,262 m · T4` and `Zermatt 1,606 m → Zmutt 1,934 m · T1`, with place names as shown. The final heights come from the generator's DEM endpoints (08 D-17). The Zmutt line needs 1–2 via points to stay within 10% of the official 4.3 km, and the plan records them in its SUMMARY. No trail checkpoint is needed: Tim sees the glyphs in the visual review.
- **D-08: Replaced by D-28** (the clix-website metric strip).
- **D-28: Metric strips use the proposed sets.** box: **23 tools · 507 tests · 1 binary**, sourced from box `.planning/MILESTONES.md` (v2.0 stats) and the README. coin-flip: **0 permissions · 50/50 · 0 network calls**, sourced from coin-flip's project record: the permission count is asserted on the release APK, there is no internet permission and no remote services, and the result is an exact 50/50. The context line names the release (e.g. "measured at v2.0"). Every value still goes through the D-09 audit; the audit may soften "0 network calls" to "Offline". Values are in tabular numerals, render final at once, and have no count-up.
- **D-29: Version and status words.** box's kicker shows **v2.0**, matching the git tag and milestone a visitor finds on GitHub. The binary prints `box 0.1.0` because Cargo.toml was never bumped, so the terminal loop never shows `--version`. box's status word is drafted under D-16 (e.g. "Shipped"). coin-flip's status is **"v1 · on device"**, and its repo shows as text under D-12.
- **D-30: coin-flip candor is honest, in general terms.** v1 runs on Tim's device but is not finished: smoothing the toss and the camera follow, and then a Play Store release, are still ahead. Next steps and the route log name that work in plain words, without defect or backlog IDs, internals or test evidence (D-23). Nothing on the page claims the app is finished, polished or store-ready.

#### Claims & case-study content (ENG-02, ENG-04)
- **D-09: Kept, with a new claim list.** Claude drafts the audit table (claim · where it appears · current wording · proposed soft wording · source). box claims: 23 tools, 507 tests, "single static binary", "safe by default", "BLAKE3 by default", "built for Windows PowerShell 7", and any LOC or timeline figure used. coin-flip claims: zero permissions, cryptographic randomness, exactly 50/50, fully offline, ad- and tracker-free, TalkBack, system font scaling. Tim marks each row `source`, `soften` or `cut`. The CLI_X claims list is void.
- **D-12: Kept.** `github.com/tlex-web/box` is public (checked with `gh repo view` on 2026-11-01) and renders as a link. coin-flip is private and shows as "Source: private repository · Ask for a walkthrough →" (to `/contact`). The data-level check (no network calls in CI) stops a known-dead or private URL from rendering as a link. Every CLI_X URL leaves with the data. — **Reversibility:** reversible — each link is a data edit once its target goes public.
- **D-13 and D-14: Retired** (pricing; clix-website is gone).
- **D-15: Kept.** The new project data is written without a `features` field, `FeatureShowcase` retires, and the schema drops `features`. Tests that read it are rewritten, not deleted.
- **D-16: Kept.** Claude drafts all new copy, and Tim approves it before it ships (first person, short, factual). It covers:
  - for both projects: problem and outcome statements, the panel pitches, and the section intros, including Safety and Privacy;
  - the box terminal heading;
  - coin-flip's Pipeline: fair draw → choreographed toss with the camera following → landing and settle → haptic pulse and a TalkBack announcement;
  - the route-log row titles and page copy;
  - the rewritten Home About sentence (D-33).

#### Route log (ROUTE-01 to ROUTE-03)
- **D-17: Amended. Claude drafts every row from documented sources, and Tim confirms them at the checkpoint.**
  - **Portfolio:** the `11-CONTENT-PACKET.md` §G1 rows, which are git-verified: v1.0 completed 2026-03-12, and v2.0 in progress with Phases 7–10 completed 2026-10-24, 2026-10-24, 2026-10-25 and 2026-10-26.
  - **box:** "v1.0 Full toolbox", completed 2026-06-24; "v2.0 Toolbox → toolkit", completed 2026-07-14 (box `.planning/MILESTONES.md`).
  - **coin-flip:** "v1.0 First release on device", completed 2026-08-09 (its milestone record).
  - Titles are drafts for Tim's approval. Only confirmed rows and dates ship.
- **D-31: box and coin-flip get one row per milestone.** They sit at the same level as portfolio v1.0 and v2.0, so the three projects read evenly. Only portfolio v2.0 keeps a phase disclosure (D-18).
- **D-32: The Summit holds only what the repos record.** coin-flip: "v1.1 Smoother toss" and "Play Store release", both planned. box gets no planned row, because its next milestone is not yet defined. The stale portfolio rows are **retired**: `portfolio-3d-gallery` (Phase 10 shipped that work) and `portfolio-blog` (no plan behind it). The Summit will be sparse, and that is honest.
- **D-18: Kept** (v1.0 completed 2026-03-12; "v2.0 Topographic Identity" at the current camp with Phases 7–12 in its disclosure).
- **D-19: Kept** (three labelled bands, order ticks, no metre figures, DOM order equals visual order).
- **D-20: Kept** (a manual `surveyedAt` labelled "Route log surveyed <date>", unit-tested to be neither in the future nor earlier than the newest `completedAt`; Tim sets it at the checkpoint).
- **Data shape:** `RoadmapItem.area` becomes `'portfolio' | 'box' | 'coin-flip'`, and `'other'`, `'cli'` and `'webshop'` go. Portfolio v2.0 is the only in-progress row, so box or coin-flip combined with "In progress" yields zero items. The existing discretion rule applies (disabled with `aria-disabled` and still announced, or hidden).

#### Cross-phase copy
- **D-33: Home's About copy loses its CLI_X sentence.** `data/home.ts` (approved in Phase 9) says Tim builds "CLI_X, a command-line tool that turns plain language into safe shell commands". CLI_X is discontinued, so the sentence is rewritten under D-16 to name box and/or coin-flip, and Tim approves it with the other copy. The `home` visual baselines re-baseline in the phase re-baseline. `components/Footer.tsx` still links to `/projects/clix-*`. It is a v1 legacy file with no importer, and Phase 12 deletes it. Leave it unless a guard flags it.

#### Checkpoints (gating inputs)
- **D-21: Amended. The remaining inputs from Tim, grouped into as few checkpoints as possible:**
  1. the claims audit (D-09);
  2. the copy (D-16), including the box terminal transcript (D-26), the box dry-run capture (D-25) and the Home sentence (D-33);
  3. route-log confirmation and `surveyedAt` (D-17, D-20, D-32);
  4. the unanswered UI-SPEC defaults from packet §I that still apply: #1 roadmap h1, #2 priority, #3 descriptions, #5 panel walkthrough link, #6 primary CTA, #7 external-link behaviour, #8 pause-toggle label, #9 trail red and blue paint, #10 filter counts, #11 copy button (#4 risk-scale ticks is void);
  5. the coin-flip clip (D-27), a separate human-action checkpoint because it needs the device. Only the Demo section depends on it, so it can arrive late.

  Already answered in this discussion, so not re-asked: the trail pair and assignment (D-07), the metric picks (D-28, still audited), the box version (D-29), coin-flip candor (D-30), and the stale rows (D-32). Each input arrives as quoted text in a SUMMARY before its consumer runs, so nothing ships invented.

### Claude's Discretion
(Copied verbatim from `11-CONTEXT.md` `### Claude's Discretion`.)

- Whether box gets a Pipeline section, built from public facts. One example is config precedence (CLI › env › config › built-in) feeding the command, then human output, `--json` or `--clip`. Include it only if the drafted copy is factual and Tim approves it at the copy checkpoint; otherwise the section is left out.
- Stack groups: box from its public `Cargo.toml` and README (Rust 2021 and the main crates). coin-flip in Claude's own words from its project record (Kotlin, native Android, the renderer as Tim approves). Only approved wording ships.
- Which box command the Safety dry-run uses, and how the transcript is trimmed for narrow screens.
- The order of the 4–5 terminal commands and the wording of each optional note.
- Panel order on `/projects` (box first is the natural default: public, larger, linkable).
- The URL parameter names and values for the route-log filter (`router.replace`, no history entries, `{ scroll: false }`; 10 D-14). Use stable names, since the URLs become shareable.
- Segment counts and the disabling logic, as before. "Other" is removed, and zero-result combinations are disabled (`aria-disabled`) or hidden, with a polite live region for the count.
- The marker glyph set, as before. Trail yellow is painted only through `bg-trail` and `--trail-yellow`, outside `--color-*`. T4 white-blue-white needs the trail blue paint (§I #9).
- Clip encoding (codecs, bitrate, poster frame choice) within the ~1.5 MB budget, and how the asset guard is extended for video.
- Terminal layout details: wrapping long output on narrow screens, live-region wording, and the optional copy button (§I #11).

### Deferred Ideas (OUT OF SCOPE)
(Copied verbatim from `11-CONTEXT.md` `<deferred>`.)

- **Terminal step controls and static transcript (ENG-F1):** still deferred.
- **Bump box's `Cargo.toml` version to match the v2.0 tag:** Tim's work in the box repo, outside this codebase. Once done, the terminal could show `--version`.
- **A defined next box milestone:** if Tim defines one, adding a planned route-log row is a data edit.
- **Making coin-flip public:** once the repo is public, enabling its link is a data edit under D-12.
- **OG images for project pages (SEO-02):** Phase 12, using the `generateMetadata` export already added in 11-01.
- **Deleting `components/Footer.tsx`** (v1 legacy, still links to `/projects/clix-*`, no importer): Phase 12 dead-code cleanup.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (REQUIREMENTS.md) | Research Support |
|----|-------------------------------|------------------|
| ENG-01 | `/projects` shows each project as a full-width route panel (name, pitch, metric strip, trail-grade badge, elevation-profile glyph); the hexagon cards and hex-grid code are removed | Pattern 4 (trail-profile generator, geo.admin.ch layer re-probed live), Pattern 5 (schema), removal map (§CLI_X and v1 removal map), `TrailGradeMark` marker map kept in `lib/trail-grade.ts` |
| ENG-02 | Project pages follow a case-study structure (problem, pipeline diagram, safety, metrics, demo, stack, next steps) and omit any section that has no data | Pattern 2 (slot-keyed sections + exhaustive switch), Pattern 5 (schema), existing 11-01 server route kept |
| ENG-03 | CLI_X's four risk bands as Swiss trail grades | **Retired by D-24.** Addressed by: (1) REQUIREMENTS.md marks ENG-03 dropped with the reason, ROADMAP goal and SC3 rewritten, traceability row updated; (2) the score-band code leaves `lib/trail-grade.ts` and `data/schemas/project.ts`; (3) no `RiskScale` component. Verification is a doc check plus `git grep` (Validation Architecture) |
| ENG-04 | Metrics display as an instrument panel with tabular numerals and a context line, and every claim is either sourced or softened | §Claims audit seed (box sources verified; coin-flip summarised), "context line required" schema rule, Pitfalls 4, 5, 9 |
| ENG-05 | The terminal demo uses tokens v2, stops auto-playing on focus, hover and under reduced motion, and has a pause button | 11-01 island kept; Pattern 3 (D-02 amendment, with the focus-entry subtlety); §box capture procedure (v2.0 build, verified commands) |
| ROUTE-01 | Vertical elevation axis: completed below, in progress at the current camp, planned above | Pattern 6 (route-log pure functions), §Route-log draft rows |
| ROUTE-02 | Segmented project and status filter; filter in the URL; empty filters removed or disabled | Pattern 1 (server-parsed `searchParams` + optimistic island), Next.js citations re-verified |
| ROUTE-03 | Order and completion dates; v2.0 in progress; "last surveyed" date | Pattern 6, roadmap zod schema, D-20 test (must include v2.0 phase dates) |
</phase_requirements>

## Project Constraints (from AGENTS.md / global CLAUDE.md / PROJECT.md / memory)

| Source | Directive | Effect on plans |
|--------|-----------|-----------------|
| `AGENTS.md` | "This is NOT the Next.js you know … Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices." The block is re-added by `next dev`; committing it keeps the tree clean | Executors read the guides cited in §Next.js 16.4 specifics before writing pages or the clip element. If `AGENTS.md` appears in a diff, commit it |
| Global `CLAUDE.md` | Options as comparison tables, Tim decides; diagnose before fixing; flag regression risks explicitly; lead with working examples | Checkpoints present choices as tables (e.g. Open Question 1). Plans carry a test-contract table |
| Memory: ui-ux-pro-max | Required for all UI/UX work | **Every UI executor (RoutePanel, RouteProfile, TrailGradeMark, CaseStudy sections, DemoTerminal retarget, clip figure, RouteLog, RouteLogFilters, RouteIndex) invokes `.claude/skills/ui-ux-pro-max` before writing markup** |
| `PROJECT.md` §Constraints | Dark only; same-origin assets; ui-ux-pro-max | No `dark:` variants; the clip and poster are committed same-origin files |
| Memory: visual re-baseline via gh | Claude dispatches the CI visual workflow, downloads, compares; **Tim commits and pushes PNGs**; threshold 0.01 | Re-baseline is a human-action checkpoint. Deleting the `clix-cli`/`clix-website` snapshot folders is also a PNG change, so Tim does it in his PNG commit |
| Memory: CI push approval | Standing approval for `ci/<phase>-NN` branch pushes and baseline dispatches; force, phase or main pushes and PNG commits excluded | Visual runs go through a `ci/11-NN` branch |
| Memory: verify approval before briefing | Never tell a subagent "Tim approved X" without his literal reply | Every D-21 input is recorded as Tim's quoted text in a SUMMARY before its consumer runs |
| Memory: Phase 07 worktrees | Phases sequential; force isolation "none" before each executor dispatch | Phase 11 stays on `gsd/phase-11-engineering-roadmap` |
| `eslint.config.mjs` | React Compiler rules are errors outside `LEGACY_COMPILER_FILES`; never add a file to that list | `DemoTerminal`, `RouteIndex`, `RouteLogFilters` pass at error level |
| Guards | GUARD-03 ratchet (baseline file total 1300; 1349 after 11-01); GUARD-04 palette; GUARD-05 contrast; identity; served images | See Validation Architecture. Policy: never let the count fall below the current 1349, even though the guard's floor is 1300 |

## Summary

Phase 11 is a rewrite of v1 surfaces onto patterns Phases 8–10 already proved: `/photos` (server page reads `searchParams`, import-free whitelist parser, small `'use client'` segmented control calling `router.replace(href, { scroll: false })`), `/photos/[slug]` (`generateStaticParams` + `dynamicParams = false` + `generateMetadata`, which 11-01 already applied to `/projects/[slug]`), the Phase 8 terrain pipeline (committed source, offline `--check` in `data:check`), and the Phase 8 photo-derivative pattern (gitignored originals, local derive script, committed hashed files, `--check` in CI). No npm package is added. The one new tool is the system `ffmpeg` (9.0.1, already installed) used only in the clip's local write mode.

This session's probes changed four things the plans must reflect. (1) **The installed box binary is not v2.0.** `%LOCALAPPDATA%\Programs\box\box.exe` (dated 25 Jun) lacks `config`, `completions` and `dupes --delete`, and ignores `--json` on `epoch`. I built the `v2.0` tag into the scratchpad (`cargo build --release --locked`, 1 min 26 s, prints `box 0.1.0`) and it has the full v2.0 surface. D-25/D-26 name the installed binary, so this is Open Question 1 for Tim. (2) **`box dupes --delete` previews print absolute paths** (the scratchpad path under `C:\Users\…\AppData`), even for a relative argument. That breaks the UI-SPEC capture rule, and the output may not be edited. `box bulk-rename` previews print relative names and end with "Re-run with --force to apply", so it is the Safety capture to use. `flatten --move` and `flatten --dry-run` previews **create the empty output folder**, so "writes nothing" needs softening in the audit. (3) **The site's service worker would mishandle video.** It caches any `response.ok` response, which includes 206 partial responses, and a cached 200 served to a Range request breaks playback in Safari. The worker must bypass media requests. (4) **React's client renderer sets `muted` as a property, not an attribute** (verified with jsdom), so component tests assert `video.muted`, not the attribute.

The coin-flip clip pipeline is settled: a single H.264 MP4 at 512 px wide, made with `ffmpeg` flags verified this session to leave no metadata (no format tags, no encoder string, zeroed `mvhd`/`tkhd`/`mdhd` timestamps, `moov` before `mdat`), plus a WebP poster from the encoded clip. A synthetic 8 s high-entropy 540×1200 clip came out at 594 KB, so the 1.5 MB budget has room, probably even at 60 fps. The guard extension needs no ffprobe in CI: a ~80-line ISO-BMFF box walker whitelists the box tree, requires one video track and no audio, and checks size, hash names and the manifest.

**Primary recommendation:** Plan an early content wave that rewrites REQUIREMENTS/ROADMAP for D-24 and collects every Tim input (claims audit, copy, the box captures from a v2.0 build, route-log rows + `surveyedAt`, §I defaults) at one checkpoint. Then build data/schemas (with the CLI_X data and tests rewritten in the same commits) → trail generator → server components → islands (D-02 amendment) → route log → clip pipeline (independent; its human-action checkpoint can land late) → visual re-baseline. Delete or overwrite the stale `11-02`…`11-15-PLAN.md` files, which embed CLI_X content.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route panels, case studies, route log, profile SVGs, trail badges | Frontend Server (RSC) | — | Static typed data and zero JS (UI-SPEC "Server boundaries") |
| Trail profile geometry and DEM heights | Build time (`scripts/terrain/*`, committed output) | RSC renders inline SVG | D-05: deterministic, offline `--check`, never at request time |
| Trail geometry acquisition | Manual networked script (once, like `fetch-dem.mjs`) | — | CI and Vercel never touch the network (T-08-09) |
| Terminal autoplay and pause state | Browser (client island `DemoTerminal`) | RSC (first command server-rendered complete) | Timers, IntersectionObserver, `visibilitychange`, matchMedia |
| coin-flip clip playback | Browser native `<video>` (no island) | CDN/Static (committed hashed MP4 + poster) | Click-to-play with native controls; RSC renders the element |
| Clip encoding, trimming, metadata stripping | Build time, local only (`ffmpeg` write mode) | CI runs a pure-Node `--check` | Mirrors `photos:derive`; ffmpeg is not in CI |
| Media request handling offline | Browser service worker (bypass) | — | Range/206 requests must go to the network untouched |
| Route-log filter state | URL (`searchParams`, parsed on the server) | Browser (`RouteLogFilters` optimistic `aria-pressed`) | ROUTE-02: the URL is the only state |
| Scroll-spy current section | Browser (tiny island) | RSC renders the index | Works without JS |
| Claim, link, date, privacy and captured-path checks | Data tests (jest, no network) | zod schemas | D-09, D-12, D-20, D-23 data-level checks |
| Page metadata (SEO-02 hook) | RSC (`metadata` / `generateMetadata`) | — | Phase 12 attaches OG images |

## Standard Stack

No new npm dependency. Everything below is already installed.

### Core
| Library | Version (installed) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.4.2 (`node -p "require('next/package.json').version"`) [VERIFIED: local install] | App Router, RSC, `generateMetadata`, `generateStaticParams` | The project framework |
| react / react-dom | 19.3.1 [VERIFIED: local install] | `useOptimistic`, `startTransition`, `useSyncExternalStore` | `useOptimistic` present in `node_modules/react/cjs/react.production.js` [VERIFIED: grep] |
| zod | ^4.4.3 [VERIFIED: package.json] | Project and roadmap contracts (`z.strictObject`, discriminated union) | Existing DATA-07 pattern |
| tailwindcss | 4.3.0 [VERIFIED: local install] | `wrap-anywhere`, `target:` variant both present in `dist/lib.js` [VERIFIED: grep] | Existing design system |
| @phosphor-icons/react | 2.1.10 (`dist/ssr` only) | Icons listed in UI-SPEC | DSGN-10 lint rule |

### Supporting (build-time / test / system)
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| sharp | ^0.35.5 | DEM decode in the trail generator (as `build-terrain.mjs`); poster WebP encode | Build scripts only |
| ffmpeg / ffprobe (system) | 9.0.1 essentials build (Gyan, via winget) with libx264, libvpx, libaom [VERIFIED: `ffmpeg -version`] | Trim, scale, encode, strip metadata, extract poster frame | `clip:derive` write mode on Tim's machine only; never in CI |
| cargo / rustc | 1.98.1, `stable-x86_64-pc-windows-msvc` [VERIFIED: `cargo --version`] | Build box at the `v2.0` tag for the captures | Capture task only (scratchpad) |
| PowerShell | 7.6.9 [VERIFIED: `pwsh -v`] | The `ConvertFrom-Json` pipeline capture | Capture task only |
| Node built-in `fetch` | Node 24 (engines) | One-off trail geometry fetch from geo.admin.ch | `scripts/terrain/fetch-trails.mjs`, manual |
| jest 30, RTL 16, user-event 14, Playwright 1.64, @axe-core/playwright 4.13.0 | installed | Unit, component, e2e, a11y | Every new lib, component, route |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| One H.264 MP4 (`<source type="video/mp4">`) | AV1 or VP9 WebM first + H.264 fallback | ~30–50% smaller, but two files to encode, guard and keep in step; the single MP4 already fits the budget. Safari needs the H.264 fallback anyway |
| Pure-Node ISO-BMFF walker in the guard | ffprobe in the guard | ffprobe is not in CI (`.github/workflows/ci.yml` has no ffmpeg step) [VERIFIED: grep]; adding it means an apt step and a new trust surface |
| `public/media/` for the clip and poster | `public/images/projects/` | `/images/` already has the immutable header and proxy exclusion, but the name misleads and the service-worker rule still has to change. `/media/` costs two one-line config edits |
| Build box `v2.0` in the scratchpad for captures | Capture with the installed pre-v2.0 binary (D-26 literal) | The installed build lacks the v2.0 features the kicker claims; see Open Question 1 |
| Server-parsed `searchParams` as props | `useSearchParams()` in the island | A prerendered page using `useSearchParams` needs `<Suspense>` or the build fails [CITED: use-search-params.md:181]; props avoid it, as in Phase 10 |

**Installation:** none (no npm changes). ffmpeg is already on Tim's PATH.

## Package Legitimacy Audit

No external packages are installed in this phase. ffmpeg is a system binary already installed from the Gyan build via winget, and cargo builds Tim's own public repo with its committed `Cargo.lock` (`--locked`).

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none new) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 TIM'S MACHINE (manual, once)                                CI / every lint (offline)
 ┌──────────────────────────────┐   geo.admin.ch            ┌───────────────────────────────────────────┐
 │ fetch-trails.mjs             │──identify API───────────▶│ build-trails.mjs --check                   │
 │ (Hörnliweg 27, Zmutt 2 +vias)│  (Wanderwege LineStrings) │  dem-10m.png (sha256) + trails.json        │
 └──────────────────────────────┘                           │  → data/generated/trail-profiles.ts        │
 ┌──────────────────────────────┐                           └───────────────────────────────────────────┘
 │ box v2.0 built in scratchpad │──NO_COLOR captures──▶ SUMMARY quote ──Tim approves──▶ data/projects.ts
 │ (bulk-rename preview; hash,  │                                                     (demo commands,
 │  uuid --json, du | pwsh)     │                                                      safety capture)
 └──────────────────────────────┘
 ┌──────────────────────────────┐   ffmpeg (write mode)     ┌───────────────────────────────────────────┐
 │ assets/clips-original/*.mp4  │──trim/scale/strip/H.264──▶│ public/media/coin-flip-toss.<hash>.mp4     │
 │ (gitignored device capture)  │──frame → sharp WebP──────▶│ public/media/coin-flip-toss-poster.<h>.webp│
 └──────────────────────────────┘                           │ data/generated/media-manifest.ts           │
                                                             │ clip:derive --check + guard:images (MP4    │
                                                             │ box walker: no metadata, 1 video trak,     │
                                                             │ no audio, size, hash name, manifest)       │
                                                             └───────────────────────────────────────────┘
 REQUEST TIME
 Visitor ─▶ /projects ──RSC──▶ projects data ─▶ RoutePanel ×2 (kicker, h2 link, pitch, strip, links, RouteProfile + TrailGradeMark)
        ─▶ /projects/box | /projects/coin-flip ─(static params; anything else, incl. clix-*, → designed 404)─▶ CaseStudy
               SECTION_ORDER.map(slot) → render if data present:
               problem │ pipeline │ safety(box: prose + <pre> capture + --force line) | privacy(coin-flip facts)
               │ metrics (tiles need a context line) │ demo: box → DemoTerminal island ; coin-flip → <video> (no island)
               │ stack │ next-steps ─▶ /roadmap?project=coin-flip#coin-flip-v1-1
               └── RouteIndex island (scroll-spy → aria-current) ; end block (Next route sign, walkthrough CTA)
        ─▶ /roadmap?project=&status= ─▶ RSC: await searchParams → parseProject/parseStatus (whitelist)
               → filter + counts (pure) → bands Summit / Current camp / Base (order desc)
               → RouteLogFilters island: press → startTransition{ setOptimistic; router.replace(href,{scroll:false}) }
                                                └──▶ RSC re-render ─▶ role=status line announces once
 Media fetch (play pressed) ─▶ service worker: Range/video ⇒ return (no respondWith) ─▶ network 206 (send supports Range)
```

### Recommended Project Structure
```
app/(site)/projects/page.tsx            # RSC, metadata { title: 'Engineering' }
app/(site)/projects/[slug]/page.tsx     # RSC (11-01): generateStaticParams, dynamicParams=false, generateMetadata (+ description)
app/(site)/roadmap/page.tsx             # RSC, metadata { title: 'Roadmap' }, awaits searchParams
components/projects/RoutePanel.tsx      # Server
components/projects/RouteProfile.tsx    # Server, inline SVG from generated data
components/projects/TrailGradeMark.tsx  # Server, waymark glyph
components/projects/CaseStudy.tsx       # Server, SECTION_ORDER + exhaustive switch
components/projects/sections/*.tsx      # Problem, Pipeline, Safety, Privacy, Metrics, Demo (terminal | clip), Stack, NextSteps
components/projects/DemoTerminal.tsx    # 'use client' (11-01; retarget + D-02 amendment)
components/projects/DemoClip.tsx        # Server: <figure><video …></figure> from the media manifest
components/projects/RouteIndex.tsx      # 'use client' (scroll-spy only)
components/roadmap/RouteLog.tsx         # Server
components/roadmap/RouteRow.tsx         # Server (variant "compact" shared with Next steps)
components/roadmap/RouteLogFilters.tsx  # 'use client'
lib/trail-grade.ts                      # marker map only (score bands leave, D-24), import-free
lib/demo-terminal.ts                    # + releaseSticky() for D-02 (pure, import-free)
lib/route-log.ts                        # parseProject/parseStatus, filter, counts, bands, href, newestCompletedAt
lib/log-date.ts                         # formatLogDate('2026-10-24') → '24 Oct 2026'
lib/trail-profile.ts                    # resample, normalise, profilePath()
scripts/terrain/fetch-trails.mjs        # manual, networked (COVERAGE.md matrix stays valid)
scripts/terrain/build-trails.mjs        # offline, --check; added to data:check
scripts/media/build-clip.mjs            # write (ffmpeg, local) / --check (pure Node); added to data:check
scripts/guards/lib/mp4-boxes.mjs        # pure ISO-BMFF walker, imported by the guard and the selftest
data/terrain/source/trails.json         # spec + committed polylines + provenance
data/media/clips.json                   # sidecar: id, source sha256, trim start/duration, poster time
data/generated/trail-profiles.ts        # generated; RSC-only import
data/generated/media-manifest.ts        # generated; src/type/width/height/duration/bytes + poster
data/schemas/project.ts                 # box | coin-flip union
data/schemas/roadmap.ts                 # new zod contract
data/roadmap.ts                         # 7 rows + surveyedAt
assets/clips-original/                  # gitignored (device recording may carry metadata)
```
Pure `lib/*.ts` modules follow the repo's "import-free, erasable TypeScript" rule (see the `lib/demo-terminal.ts` and `lib/photos/view-param.ts` headers), so scripts can type-strip them and jest tests them directly.

### Pattern 1: Server page + whitelist parser + optimistic segmented island (ROUTE-02)
**What:** The page awaits `searchParams`, parses both params through exact-match whitelists (unknown, empty, wrong-case or array → All), computes the filtered list and counts on the server, and passes `project`, `status` and counts to the island. The island never reads the URL.
**When:** `/roadmap`. It mirrors `/photos` + `ViewSwitcher` + `lib/photos/view-param.ts` [VERIFIED: read this session], with the UI-SPEC's optimistic `aria-pressed`.
```tsx
// app/(site)/roadmap/page.tsx — repo precedent app/(site)/photos/page.tsx; NEXT 03-file-conventions/page.md
export const metadata: Metadata = { title: 'Roadmap' };
export default async function RoadmapPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const filter = { project: parseProject(sp.project), status: parseStatus(sp.status) }; // 'all' | enum values
  const view = routeLogView(roadmapItems, filter); // bands, counts, shown, total
  return (/* header band … */ <RouteLogFilters filter={filter} counts={view.counts} />);
}

// components/roadmap/RouteLogFilters.tsx
'use client';
export default function RouteLogFilters({ filter, counts }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(filter);
  const press = (next: Filter, disabled: boolean) => {
    if (disabled || sameFilter(next, optimistic)) return;   // zero-count and pressed segments do nothing
    startTransition(() => {
      setOptimistic(next);                                  // aria-pressed flips at once
      router.replace(routeLogHref(next), { scroll: false }); // no history entry, scroll kept
    });
  };
  /* groups: aria-pressed={optimistic.project === v}; zero count → aria-disabled="true" (never on the pressed one) */
}
```
`routeLogHref` builds URLs only from whitelisted enum values in canonical order (`?project=…&status=…`) and drops a param set to All, so no visitor string reaches `router.replace` (the docs' XSS warning, quoted below).

### Pattern 2: Fixed slot order with omit-if-empty (ENG-02)
**What:** The project schema holds one optional field per slot. `CaseStudy` maps a constant `SECTION_ORDER` through an exhaustive `switch (slot)` with a `never` check; each renderer returns `null` when its data is absent. Order lives in code, never in data; each slot appears at most once. This meets the UI-SPEC's intent ("one section renderer per block kind behind an exhaustive switch … with a never check").
```ts
// components/projects/CaseStudy.tsx
const SECTION_ORDER = ['problem', 'pipeline', 'safety', 'metrics', 'demo', 'stack', 'next-steps'] as const;
type Slot = (typeof SECTION_ORDER)[number];
function renderSlot(slot: Slot, p: Project): ReactNode | null {
  switch (slot) {
    case 'problem': return p.problem?.length ? <Problem paragraphs={p.problem} /> : null;
    case 'pipeline': return p.pipeline ? <Pipeline block={p.pipeline} name={p.name} /> : null;
    case 'safety': return p.slug === 'box' ? (p.safety ? <Safety block={p.safety} /> : null)
                                           : (p.privacy ? <Privacy block={p.privacy} /> : null);
    case 'metrics': { const tiles = p.metrics?.tiles.filter((t) => t.context) ?? []; return tiles.length ? <Metrics tiles={tiles} /> : null; }
    case 'demo': return renderDemo(p);          // box: terminal if commands; coin-flip: clip if manifest entry + description
    case 'stack': return p.stack ? <Stack block={p.stack} /> : null;
    case 'next-steps': return nextStepRows(p).length ? <NextSteps rows={nextStepRows(p)} slug={p.slug} /> : null;
    default: { const never: never = slot; return never; }
  }
}
// sections = SECTION_ORDER.map((s) => [s, renderSlot(s, project)]).filter(([, n]) => n); RouteIndex gets the ids (hidden if < 2, G6)
```
The third slot's id and label come from the project (`safety`/`Safety` on box, `privacy`/`Privacy` on coin-flip), per D-25.

### Pattern 3: DemoTerminal retarget + D-02 amendment (ENG-05)
The 11-01 machine and island stay: one pending timeout, `isPlaying` over five pause sources, `override ?? reduced` for the sticky toggle [VERIFIED: lib/demo-terminal.ts:113-124 `export interface PauseSources { sticky: boolean; hover: boolean; focusWithin: boolean; offscreen: boolean; hidden: boolean; }` and `return count >= 2 && !p.sticky && !p.hover && !p.focusWithin && !p.offscreen && !p.hidden;`]. Timings stay [VERIFIED: lib/demo-terminal.ts:37-42 `inputCharMs: 50, gapMs: 500, outputCharMs: 10, holdMs: 3000`].

**Retarget:** the machine types `input` then `output` [VERIFIED: lib/demo-terminal.ts:31-34 `export interface TerminalCommand { input: string; output: string; }`]. For box, `input` is the command line (typed at 50 ms after `❯`) and `output` is the captured output (10 ms per character). Keep the field names so `TerminalCommand` still matches structurally and the 11 lib tests need no rename; document "input = the command line" in the schema JSDoc. `CommandLines` drops the "Request" label line, the warning and the explanation, and adds the optional `note` line once complete. `spokenCommand` becomes "Command {n} of {total}. Command: {input}. Output: {output}. {note}". The region's name becomes `box demo` and the title bar text `box`.

**Amendment (D-02 option B), two changes:**
1. **Release clears the temporary hover and focus pauses.** Pressing the toggle while it is pressed sets `override = false` **and** `hover = false`, `focusWithin = false` in the same handler. The pointer is still inside, but `pointerenter` does not refire until it leaves and re-enters, so playback starts at once. Add a pure helper so the rule is unit-tested without React:
   ```ts
   // lib/demo-terminal.ts
   /** D-02 (amended): releasing the sticky Pause also drops the hover and focus pauses until the next entry. */
   export function releaseSticky(p: PauseSources): PauseSources {
     return { ...p, sticky: false, hover: false, focusWithin: false }; // offscreen and hidden survive
   }
   ```
2. **Focus counts only when it enters from outside.** Today `onFocus={() => setFocusWithin(true)}` fires for every focus move inside the region [VERIFIED: components/projects/DemoTerminal.tsx:181]. After a release, Tab from the toggle to a dot would re-pause, which the UI-SPEC forbids ("Moving focus between the region's own controls does not count as entering"). Mirror the existing `onBlur` check:
   ```tsx
   function onFocus(e: FocusEvent<HTMLDivElement>) {
     if (e.currentTarget.contains(e.relatedTarget as Node | null)) return; // moving between its own controls
     setFocusWithin(true);
   }
   ```
Tests (state only): after a mouse release with the pointer still inside and focus on the button, `data-playback="playing"` immediately; a fresh `pointerenter` (leave, then enter) pauses again; Shift+Tab out and Tab back in pauses again; Tab from the toggle to a dot after a release stays playing; offscreen and `document.hidden` still pause after a release. In e2e, the `leaveTerminal()` helper is no longer needed after a *release* click, but is still needed after a *dot* click (a dot press does not clear hover/focus).

### Pattern 4: Trail profile generator (D-05, D-07) — project-agnostic, re-verified
The layer `ch.swisstopo.swisstlm3d-wanderwege` still returns LV95 LineStrings through `api3.geo.admin.ch/rest/services/api/MapServer/identify` (probed live 2026-11-01: an envelope near the Hörnli path returned `"layerBodId": "ch.swisstopo.swisstlm3d-wanderwege"` with `paths` in EPSG:2056) [VERIFIED: live probe]. The sheet extent and DEM are unchanged [VERIFIED: data/terrain/source/source.json:12-23 `"west": 2616000, "south": 1088000, "east": 2627000, "north": 1099000`, `"cellM": 10`, `"width": 1100`, `"height": 1100`, `"heightScale": 0.1`, `"file": "dem-10m.png"`]. `COVERAGE.md` in this phase directory already records the API surface decision and stays valid.
1. **Source (committed):** `data/terrain/source/trails.json`: per trail `{ id: 'hoernliweg-27' | 'zmutt-2', name, number, listingUrl, sacGrade, start:{name,lv95}, end:{name,lv95}, via:[lv95…], polyline:[[e,n]…], provenance:{ layer, featureIds, fetchedAt }, polylineSha256 }`. Only `fetch-trails.mjs` writes it (manual, networked, never in CI).
2. **Build (offline):** decode the DEM like `build-terrain.mjs` (sharp grey16 raw, × `heightScale`, sha256 checked against `source.json`). Resample at 128 equal arc-length stations and sample each with `sampleAtLv95(grid, W, H, extent, p)` [VERIFIED: lib/terrain/dem-sample.ts:48-58 signature `sampleAtLv95(grid: ArrayLike<number>, W: number, H: number, extent: Bbox, p: Lv95): number`]. Fail when a station leaves the extent. Normalise `x = s/L`, `y = (h − min)/(max − min)`, 3 dp. Endpoint heights = rounded samples at the first/last vertex.
3. **Output:** `data/generated/trail-profiles.ts` with an AUTO-GENERATED header; `{ id, name, number, sacGrade, start:{name,heightM}, end:{name,heightM}, lengthM, points }`. Do **not** add path data to `data/generated/terrain.ts` (its test caps it at 4 KB with no path data). Import only from Server Components; a test asserts no `'use client'` module imports it.
4. **`--check`:** regenerate in memory, byte-compare, fail on polyline or DEM sha256 mismatch; print `trails: OK`. Add `npm run trails:build -- --check` to `data:check`.
5. **Path:** pure `profilePath(points, { w: 320, h: 96, inset: 8 })` in `lib/trail-profile.ts` returns line and area `d` strings, unit-tested.
6. **Lengths:** Hörnliweg routes to 4,316 m with no via points (official 4.3 km); Zmutt's shortest path is 3,645 m and needs 1–2 via points to land within 10% of 4.3 km [CITED: 11-CONTENT-PACKET.md §A, probe of the first research pass; geometry not re-fetched this session]. The SUMMARY records the via points and the routed length.

### Pattern 5: Project schema for box | coin-flip (D-15, D-24–D-29)
Current shape to replace [VERIFIED: data/schemas/project.ts:91-98 `export const DemoCommandSchema = z.strictObject({ input: z.string(), output: z.string(), riskLevel: RiskLevel, riskScore: z.number().min(0).max(1), warning: z.string().optional(), explanation: z.string().optional(), });`] and [VERIFIED: data/schemas/project.ts:120-135 `slug: z.literal('clix-cli')` … `slug: z.literal('clix-website')` … `export const ProjectSchema = z.discriminatedUnion('slug', [ClixCli, ClixWebsite]);`].

Recommended (sketch; names are Claude's design, values only from approved inputs):
```ts
export const DemoCommandSchema = z.strictObject({
  input: z.string(),                 // the command line as typed after ❯ (captured verbatim)
  output: z.string(),                // captured output, unedited
  note: z.string().optional(),       // D-26, Tim-approved one-liner
});
const MetricTile = z.strictObject({ key: z.string(), label: z.string(), value: z.string(),
  context: z.string(), sourceUrl: z.url().optional() });           // no context → no tile (ENG-04, D-09)
const TrailId = z.enum(['hoernliweg-27', 'zmutt-2']);
const Base = z.strictObject({
  name: z.string(), pitch: z.string().optional(), outcome: z.string().optional(),
  kicker: z.strictObject({ version: z.string(), status: z.string().optional() }),
  route: TrailId.optional(),
  problem: z.array(z.string()).optional(),
  pipeline: z.strictObject({ intro: z.string().optional(), in: z.string().optional(), out: z.string().optional(),
    stages: z.array(z.strictObject({ name: z.string(), description: z.string().optional() })).min(1) }).optional(),
  metrics: z.strictObject({ releaseLine: z.string().optional(), tiles: z.array(MetricTile).min(1) }).optional(),
  stack: z.strictObject({ groups: z.array(z.strictObject({ label: z.string(), items: z.array(z.string()).min(1) })).min(1) }).optional(),
  nextSteps: z.array(z.string()).optional(),                         // RoadmapItem ids (planned/in-progress only)
});
const Box = Base.extend({
  slug: z.literal('box'),
  links: z.strictObject({ github: z.literal('https://github.com/tlex-web/box') }),
  safety: z.strictObject({ intro: z.string().optional(),
    capture: z.strictObject({ command: z.string(), input: z.string(), output: z.string() }).optional(),
    forceLine: z.string().optional() }).optional(),
  demo: z.strictObject({ intro: z.string().optional(), commands: z.array(DemoCommandSchema).min(1) }).optional(),
});
const CoinFlip = Base.extend({
  slug: z.literal('coin-flip'),
  repository: z.literal('private'),                                  // D-12: never a link
  privacy: z.strictObject({ intro: z.string().optional(), facts: z.array(z.string()).min(1) }).optional(),
  clip: z.strictObject({ id: z.literal('coin-flip-toss'), intro: z.string().optional(), description: z.string() }).optional(),
});
export const ProjectSchema = z.discriminatedUnion('slug', [Box, CoinFlip]);
```
Rules this encodes: no `features`, `riskLevel`, `riskScore`, `RiskScaleBlock`, `PricingBlock` (D-15, D-24); unapproved content is simply absent, so there are no "approved" flags that could leak a draft; the clip renders only when the manifest has the id **and** the description exists (UI-SPEC "the clip does not ship without it"); coin-flip cannot carry a link field at all. `lib/trail-grade.ts` keeps only the grade → marker map (`T1 → yellow`, `T2/T3 → white-red-white`, `T4/T5 → white-blue-white`, `T6 → unmarked`); the bands to remove are [VERIFIED: lib/trail-grade.ts:28-33 `{ level: 'low', min: 0.0, max: 0.3, grade: 'T1', marker: 'yellow' }`, `{ level: 'medium', min: 0.3, max: 0.6, grade: 'T2–T3', marker: 'white-red-white' }`, `{ level: 'high', min: 0.6, max: 0.8, grade: 'T4–T5', marker: 'white-blue-white' }`, `{ level: 'critical', min: 0.8, max: 1.0, grade: 'T6', marker: 'unmarked' }`] plus `bandFor` and `isScoreInLevel`.

### Pattern 6: Route-log pure functions and schema (ROUTE-01, ROUTE-03)
Current type [VERIFIED: data/types.ts:26 `area: 'portfolio' | 'cli' | 'webshop' | 'other'; // Categorization`]. New contract in `data/schemas/roadmap.ts` (zod, mirrors project.ts): `area: z.enum(['portfolio', 'box', 'coin-flip'])` (CONTEXT keeps the field name `area`; the URL param is `project`), `status`, `order: z.number().int()` (unique, rising bottom → top), `completedAt?: ISO date` (only on completed rows, and only when Tim confirmed it), `targetRelease?`, `phases?` (portfolio v2.0 only, `{ n, name, status, completedAt? }`), `description`. `priority` leaves (UI-SPEC default #2). `export const surveyedAt = 'YYYY-MM-DD'` is required.
`lib/route-log.ts`: `parseProject`, `parseStatus`, `filterItems`, `countsFor(items, filter)` (each segment counted under the *other* group's current value), `bands(items)` (Summit = planned, Current camp = in-progress, Base = completed, each sorted by `order` descending), `routeLogHref`, `newestCompletedAt(items)` **including nested phase dates**.

### Anti-Patterns to Avoid
- **`next/dynamic(..., { ssr: false })` in a Server Component.** Import `DemoTerminal` directly (11-01 does).
- **Computed Tailwind classes** (`md:grid-cols-${n}`). Use literal class maps (UI-SPEC G1, G11).
- **Colour-class assertions in tests.** Assert `aria-pressed`, `data-playback`, `aria-current`, `aria-disabled`, text, and `video.muted`.
- **Profile, roadmap or claim provenance inside `'use client'` modules** (bundle growth; breaks T-08-12 discipline).
- **"Approved" booleans in data.** Write only approved text into data; drafts live in the content packet.
- **Editing captured output** to remove a path or shorten it. Pick a different command or input instead (UI-SPEC N2).
- **Committing the raw device recording.** It goes in a gitignored folder; only the derived, metadata-free MP4 is committed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DEM sampling | a new sampler | `sampleAtLv95` (`lib/terrain/dem-sample.ts`) | Pixel-centre correct; reproduced the committed summit height in the first pass |
| DEM decoding | geotiff/resize in the new script | the `build-terrain.mjs` grey16 decode | Same bytes, same heights |
| Generated-data checks | ad-hoc diffs | the `--check` structure of `build-terrain.mjs` / `build-derivatives.mjs` | CI parity with `data:check` |
| Video encoding and metadata stripping | a JS encoder or manual atom editing | ffmpeg with `-map_metadata -1 -map_chapters -1 -fflags +bitexact -flags:v +bitexact -metadata:s:v:0 encoder=` (verified) | Strips container and stream tags and the encoder string; timestamps come out 0 |
| Video verification in CI | ffprobe | the pure-Node box walker (Code Examples) | No new CI dependency; whitelist is stricter than a tag check |
| Range requests for video | custom route handlers | Next's static serving (`next/dist/compiled/send`, which emits `Accept-Ranges`) and Vercel's CDN | Already supports 206 [VERIFIED: `serve-static.js` uses `send`; `Accept-Ranges` present in `compiled/send/index.js`] |
| Count nouns | template strings | `countLabel` (`lib/home-format.ts:121`) | `0` → `''`, matching the Home trail sign |
| Heights | `toLocaleString` | `formatMetres` (`lib/photo-format.ts:108`) | No locale APIs; U+00A0 before `m` |
| Dates | `Intl.DateTimeFormat` | new pure `formatLogDate` (month-table pattern) | Deterministic SSR/CSR |
| Segment styling | new classes | `ViewSwitcher`'s `SEGMENT`/`SELECTED`/`UNSELECTED` constants | Already contrast-checked |
| Disclosures | a JS accordion | native `<details>` | Works without JS, instant |
| Player controls | a custom player | native `<video controls>` | Keyboard and screen-reader support built in [CITED: videos.md:65] |

**Key insight:** every new module has a twin from Phases 8–10. Copy their structure, including the header comments that explain the rules; that is what keeps `data:check`, palette, contrast, served-asset and ratchet guards green on the first CI run.

## Runtime State Inventory

This phase removes a project (CLI_X) and renames data values (`area` values, slugs), so the inventory applies.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None. Project and roadmap data are committed TS modules; no database, CMS or KV holds slugs. Upstash Redis is used only for contact rate limiting [VERIFIED: package.json deps; no project keys] | Code edit only |
| Live service config | Search engines and visitors may hold `/projects/clix-cli` and `/projects/clix-website` URLs. D-22 says designed 404, no redirects. Vercel Analytics keeps historical paths (read-only, harmless) | None beyond the 404 e2e. No redirect config |
| OS-registered state | None in the portfolio. Note: Tim's machine has a **pre-v2.0** `box.exe` in `%LOCALAPPDATA%\Programs\box` on his PATH [VERIFIED: `box dupes --help` shows no `--delete`; no `config` subcommand]. Not a portfolio artifact, but it decides what the captures show (Open Question 1) | Capture from a v2.0 build; reinstalling is Tim's choice |
| Secrets/env vars | None reference project or roadmap names | None |
| Build artifacts | `.next/` (regenerated). Visitors' service-worker caches are keyed by build hash and purged on activate [VERIFIED: public/service-worker.js:95-103], so old CLI_X HTML clears on the next deploy. Visual snapshot folders `e2e/visual/routes.spec.ts-snapshots/clix-cli` and `clix-website` go stale [VERIFIED: ls]. `graphify-out/` (untracked) lists old components | Re-baseline through CI; Tim's PNG commit deletes the two `clix-*` folders and adds `box`/`coin-flip`. Graphify rebuild optional |

**Shareable URL contracts created by this phase:** `/projects/box`, `/projects/coin-flip`, `/roadmap?project=portfolio|box|coin-flip&status=planned|in-progress|completed`, section anchors (`#problem` … `#next-steps`, `#safety`/`#privacy`) and route-log row ids. Pick ids once (§Route-log draft rows).

## Common Pitfalls

### Pitfall 1: Capturing "v2.0" output from a pre-v2.0 binary
**What goes wrong:** D-26 names the installed `box.exe`, but that build predates most of v2.0: no `config`/`completions`, no `dupes --delete`, and `epoch 0 --json` prints human text [VERIFIED: probes this session]. The kicker says v2.0, so the transcript would misrepresent the release.
**How to avoid:** build the tag: `gh repo clone tlex-web/box <scratch>/box -- --branch v2.0 --depth 1`, then `cargo build --release --locked` with `CARGO_TARGET_DIR` in the scratchpad (verified: 1 m 26 s, `box 0.1.0`, `config` and `completions` present, `dupes --delete/--force` present). Capture through a session alias so the typed line reads `box …`. Tim confirms this route (Open Question 1).
**Warning signs:** `box --help` lacks `config` and `completions`.

### Pitfall 2: Preview output that leaks absolute paths
**What goes wrong:** `box dupes --delete ./sample` prints `keep C:\Users\…\AppData\Local\Temp\…\sample\hut.txt` (canonicalised paths) even with a relative argument [VERIFIED: probe]. The UI-SPEC bans absolute, home and `AppData` paths, and the output may not be edited.
**How to avoid:** use `box bulk-rename ./sample '<regex>' '<replacement>'` for the Safety block. Its preview prints relative names and ends `Dry run: 2 to rename, 0 unchanged, 1 skipped. Re-run with --force to apply.` [VERIFIED: probe]. `hash`, `hash --json`, `uuid --json`, `du`, `du --json` print the relative path as given or names only [VERIFIED: probes]. A data test rejects absolute paths anyway (Code Examples).
**Warning signs:** a colon after a drive letter, `\Users\`, `AppData` in any captured string.

### Pitfall 3: "Writes nothing" is not true for every preview
**What goes wrong:** `box flatten --move ./sample ./out` (preview) and `box flatten --dry-run …` both **create the empty output directory** [VERIFIED: ran twice in the scratchpad; the folder appeared with 0 entries]. The UI-SPEC Safety draft says "writes nothing", and the README says destructive tools "only write with `--force`".
**How to avoid:** add a D-09 row for the "writes nothing" wording. A safe soft form is "renames, moves or deletes nothing until you add `--force`" (true for `bulk-rename`, `dupes --delete` and `flatten --move`, all verified). Do not use `flatten` for the capture. Mention the empty-folder behaviour to Tim as a box issue (his repo, outside scope).

### Pitfall 4: Frozen output that goes stale
**What goes wrong:** `box epoch <ts>` prints a relative age ("3 months ago") and the capturing machine's local offset [VERIFIED: probe]. Frozen in the transcript, the age becomes false within weeks.
**How to avoid:** choose time-independent commands: `box hash <file>` (BLAKE3, shows `--json`'s `"algo": "blake3"` if wanted), `box uuid --json`, `box du ./sample --json | ConvertFrom-Json | …` (PowerShell 7 with `$PSStyle.OutputRendering='PlainText'`, verified to emit no ANSI), `box color '#70d5ed'`, `box json --sort-keys`. If Tim insists on `epoch`, it needs his approval with the staleness stated.

### Pitfall 5: "23 tools" versus what `box --help` lists
**What goes wrong:** the v2.0 binary lists 25 subcommands plus `help` (the 23 tools, `config`, `completions`) [VERIFIED: v2.0 build]. The README frames it as "23 command-line tools" with `config`/`completions` under "Meta" [CITED: github.com/tlex-web/box README]. A visitor who counts the help output sees 25.
**How to avoid:** keep the tile's context line explicit, e.g. "Tools in the README at v2.0, plus config and completions" (D-16 draft), and list it as a D-09 row.

### Pitfall 6: Service worker vs video
**What goes wrong:** the worker's `cacheFirst`/`networkFirst` call `cache.put` whenever `response.ok` [VERIFIED: public/service-worker.js:24-26 and 70-72 `if (response && response.ok) { … cache.put(request, response.clone()); }`]. A 206 is "ok", and `Cache.put` rejects partial responses, which logs an unhandled rejection [ASSUMED: Cache API spec behaviour]. Worse, a cached full 200 answering a later Range request is a known way to break Safari playback [ASSUMED]. `/images/` paths are cache-first [VERIFIED: :134], and anything else falls to `networkFirst`.
**How to avoid:** early in the fetch handler: `if (request.headers.has('range') || request.destination === 'video' || request.destination === 'audio') return;` (no `respondWith`, so the browser fetches natively). The poster is an `image` request and keeps its image caching. The worker registers only in production [VERIFIED: components/ServiceWorkerRegistration.tsx `process.env.NODE_ENV === 'production'`], so test with `PW_PROD=1`.

### Pitfall 7: `muted` is a property on client renders
**What goes wrong:** React SSR emits `muted=""` [VERIFIED: `renderToString` gives `<video controls="" muted="" playsInline="" preload="none" …>`], but a client render sets only the property (jsdom: `hasAttribute('muted')` is false) [VERIFIED: jsdom probe]. A component test asserting the attribute fails.
**How to avoid:** component tests assert `(video as HTMLVideoElement).muted === true` or render with `renderToString`; Playwright uses `toHaveJSProperty('muted', true)`. Write `muted` as a bare attribute so `jsx-a11y/media-has-caption` passes (the rule accepts a literal-true `muted`) [VERIFIED: node_modules/eslint-plugin-jsx-a11y/lib/rules/media-has-caption.js:60-62].

### Pitfall 8: Playwright's Chromium cannot play H.264
**What goes wrong:** the bundled Chromium lacks proprietary codecs; Playwright points to stock Chrome or Edge for those [CITED: node_modules/playwright-core/types/types.d.ts:17598 "Stock browsers like Google Chrome and Microsoft Edge are suitable for tests that require proprietary media codecs"]. An e2e that plays the clip fails in the `chromium` and visual projects.
**How to avoid:** e2e asserts attributes, the poster URL, `preload="none"`, no `autoplay`/`loop`, and that **no `.mp4` request happens before play** (`page.on('request')`). Never press play in CI. The visual run shows the poster; warm it first (`new Image()` load in `page.evaluate`) so the screenshot never races it [ASSUMED: poster paint timing].

### Pitfall 9: Overclaiming coin-flip's toss
**What goes wrong:** the UI-SPEC's Pipeline stages name "Choreographed toss (the camera follows the coin)" and "Landing and settle". coin-flip's project record lists the camera follow and the final landing-and-settle polish among the work still open after v1, which D-30 already says ("smoothing the toss and the camera follow … still ahead").
**How to avoid:** add the two stage descriptions to the D-09 audit as claims. Describe the design ("the animation is choreographed to land on the drawn result") and leave polish words out. Never write "smooth", "seamless" or "stutter-free".

### Pitfall 10: The test-filler scan versus real output
**What goes wrong:** the UI-SPEC's e2e scans route text for `—`, `N/A`, `TBD`, `undefined`, `null`, `NaN`, "coming soon". Real captured JSON can legitimately contain `null`; a preview might contain an em dash.
**How to avoid:** scope the scan to exclude `pre` and the terminal region, or verify each approved capture contains none of the tokens (the probed `du --json` and `hash --json` outputs contain none).

### Pitfall 11: Ratchet drops when a component and its tests leave in different commits
**How to avoid:** each successor test lands in the commit that deletes its predecessor (test-contract table below). `npm run guard:tests` needs `npx jest --json --outputFile=jest-results.json` first. The guard counts Playwright tests once per file + title path, not per project.

### Pitfall 12: `generateStaticParams` and slugs must match exactly
`dynamicParams = false` makes any slug outside `generateStaticParams` a 404 [CITED: dynamicParams.md:17]. The 11-01 route already maps `projects.map((p) => ({ slug: p.slug }))`; the e2e must cover `/projects/box`, `/projects/coin-flip`, `/projects/clix-cli`, `/projects/clix-website` and `/projects/BOX` (case).

### Pitfall 13: The route log goes stale at phase close
**What goes wrong:** the v2.0 disclosure says `Phase 11 · Engineering & roadmap · In progress`. When Phase 11 merges, that line is already false.
**How to avoid:** the last data task (or phase transition) sets Phase 11's completion date, and `surveyedAt` moves to that date or later (the D-20 test enforces `surveyedAt ≥ newestCompletedAt`, which must include phase dates). Open Question 3.

### Pitfall 14: Stale plan files in the phase directory
**What goes wrong:** `11-02-PLAN.md` … `11-15-PLAN.md` still exist and embed CLI_X slugs, commands and fixtures [VERIFIED: ls of the phase directory]. `execute-phase` would pick them up.
**How to avoid:** the planner deletes or overwrites all of them. Also close the two 11-01 stubs in `.planning/WINDOWS.md` (rows 4 and 5); the "D-04 risk badge … 11-03 adds both" stub is void under D-04's retirement [VERIFIED: .planning/WINDOWS.md:21-22].

## Research Focus Answers

### A. box capture procedure (D-25, D-26)

Run in a fresh scratchpad folder with small, neutral inputs (no personal file names). Proven this session with the v2.0 build:
```powershell
# Session setup (PowerShell 7.6.9). $BoxV2 = the v2.0 build in the scratchpad (see Pitfall 1)
$env:NO_COLOR = '1'; $PSStyle.OutputRendering = 'PlainText'
Set-Alias box $BoxV2
Set-Location <scratchpad>\cap           # contains .\sample\ with 2–3 tiny text files, one duplicate
# Safety (preview, writes nothing):
box bulk-rename ./sample '^(.*)\.txt$' '$1.md'
# Terminal loop candidates (read-only, no network, no --version):
box hash sample/hut.txt
box uuid --json
box du ./sample --json | ConvertFrom-Json | Select-Object -ExpandProperty results | Sort-Object size -Descending | Select-Object -First 3 name, size
box color '#70d5ed'
```
Observed outputs (shape only; the plan captures fresh and Tim approves): `bulk-rename` lists `~ hut.txt -> hut.md`, a skipped directory line and the summary `Dry run: … Re-run with --force to apply.`; `hash` prints `<64 hex>  sample/hut.txt`; `uuid --json` prints `{ "results": [ { "uuid": …, "version": "v4" } ], "count": 1 }`; the pipeline prints a three-row `name size` table; `color` prints Hex, RGB, Tuple, HSL and Name lines [VERIFIED: probes]. All are under 12 lines (UI-SPEC N2) and contain no absolute path.

Box config: the v2.0 binary reads `%APPDATA%\box\config.toml`; Tim's effective config is `hash.default_algo = blake3`, `weather.location = (not set)`, `weather.units = metric` [VERIFIED: `box config show`], so outputs match built-in defaults. Never capture `box config path` (it prints the home path).

`--force` line for the Safety block, from this capture: "With `--force`, box would rename `hut.txt` to `hut.md` and `zmutt.txt` to `zmutt.md`." (D-16 draft, rewritten from whatever capture Tim approves.)

### B. coin-flip clip pipeline (D-27)

**Format decision:** one MP4, H.264 High profile, `yuv420p`, no audio, `+faststart`. Every target browser plays it natively, it is one file to guard, and it fits the budget. Width 512 px (2× the 256 px CSS frame), height from the recording's aspect ratio rounded to even (`scale=512:-2`). Keep the source frame rate (≤ 60 fps) because smoothness is the product, and drop to 30 fps only if the file exceeds the budget. Start at CRF 26, `-preset slow`.

**Verified flags** (synthetic 8 s source with planted `creation_time`, `location` and `title` tags plus an audio track): the output had no format tags beyond brands, stream tags only `language=und` and `handler_name=VideoHandler`, no `Lavf`/`Lavc`/`x264` strings, `mvhd`/`tkhd`/`mdhd` creation and modification times `0`, box order `ftyp, moov, free, mdat`, one video track, 594,360 bytes at 540×1200/30 fps/CRF 26 [VERIFIED: ffprobe + box dump this session]. A real dark-background screen recording compresses far better than `testsrc2`.

**Poster:** extract from the *encoded* clip (same size and colours), `ffmpeg -ss <t> -i out.mp4 -frames:v 1 -f image2pipe -c:v png -`, then sharp → WebP quality 82 (sharp's default output keeps no metadata, as in `photos:derive`). Poster time is in the sidecar (Discretion: a frame with the coin at rest and the result visible reads best as a still).

**Files and names:** `public/media/coin-flip-toss.<10 hex>.mp4` and `public/media/coin-flip-toss-poster.<10 hex>.webp` (first 10 hex of sha256 over bytes, the existing convention [VERIFIED: scripts/guards/check-served-images.mjs:66 `const HASH_NAME = /^[a-z0-9-]+\.([0-9a-f]{10})\.(png|svg|avif|webp|jpg)$/;`]). Manifest `data/generated/media-manifest.ts`. Sidecar `data/media/clips.json` `{ id, sourceSha256, start, duration, posterAt, crf, fps }`. Raw input folder `assets/clips-original/` added to `.gitignore` next to `assets/photos-original/`.

**Script modes** (`scripts/media/build-clip.mjs`, `npm run clip:derive`): write mode needs ffmpeg and the original (sha256 must equal the sidecar), encodes to memory/temp, validates (box walker, size, 5–10 s duration from `mvhd`), then writes and deletes stale files. `--check` needs neither: it rebuilds the manifest from disk and fails on a missing file, a hash mismatch, a size over budget, a duration outside 5–10 s, an audio track or a box-walker violation. Add `npm run clip:derive -- --check` to `data:check`. With no clip yet, the manifest exports an empty object and `--check` passes, so the pipeline can land before the clip.

**Serving:** CSP already allows it [VERIFIED: proxy.ts:7-10 `default-src 'self';` … `img-src 'self' blob: data:;` and no `media-src`]. Add `media/` to the proxy matcher exclusion next to `images/|terrain/` [VERIFIED: proxy.ts:49 `'/((?!api|_next/static|_next/image|favicon.ico|service-worker.js|images/|terrain/).*)'`] and a `/media/:path*` `Cache-Control: public, max-age=31536000, immutable` header in `next.config.ts` (the `/terrain/:path*` precedent). Service-worker bypass per Pitfall 6. Do not add the clip to `precache.json`.

**Element** (Server Component, UI-SPEC "Demo — coin-flip"): `controls muted preload="none" playsInline`, `poster`, `width`/`height` from the manifest, `aria-label`, `aria-describedby`, one `<source type="video/mp4">`, a fallback `<p>`; no `autoPlay`, no `loop`, no `<track>` (video-only clip, text description is the alternative) [CITED: node_modules/next/dist/docs/01-app/02-guides/videos.md:61-65 "Dimensions", "Poster Image", "Fallback Content", "Accessible Controls"].

### C. Guard extension for video (D-27)

Extend `scripts/guards/check-served-images.mjs` (one served-asset guard, already in `lint` and the selftest) rather than adding a second guard:
- Scope: add `.mp4 .m4v .mov .webm .mkv .3gp` to the tracked-file pathspecs, so a raw recording committed anywhere fails (the photo-original precedent) [current set VERIFIED: :62 `const IMAGE_EXT = new Set(['.jpg', … '.svg']);`].
- Hashed dirs: add `public/media/` [VERIFIED current: :65 `const HASHED_DIRS = ['public/terrain/', 'public/images/photos/'];`]; widen `HASH_NAME`'s extension group to include `mp4`.
- Manifests: add `{ file: 'data/generated/media-manifest.ts', regex: /(?<=['"])\/media\/[^'"]+(?=['"])/g }` [current list VERIFIED: :69-72].
- Video rule (via `scripts/guards/lib/mp4-boxes.mjs`): `.mov/.webm/.mkv/.3gp/.m4v` anywhere → `video-format: only MP4 is served`; for MP4: box-tree whitelist (top level `ftyp, moov, free, mdat` with `moov` before `mdat`; inside `moov` only `mvhd, trak, udta`; `udta` may hold only `meta → hdlr + empty ilst`), no `uuid`/`XMP_`/`©xyz`/`loci` boxes anywhere, zero creation/modification times, exactly one `trak` whose `hdlr` is `vide` and none `soun`, a byte scan for the XMP markers already listed, and under `public/` a size budget (1,572,864 bytes = 1.5 MiB; Tim can set the exact number).
- Selftest: fixtures `scripts/guards/__selftest__/served-images/` gain a clean 0.2 s 64×64 MP4 (passes) and dirty ones (planted `creation_time`/`location`, an audio track, `mdat` before `moov`), each a few KB, generated once with ffmpeg and committed. The size rule is tested as a pure `{ name, fn }` case calling the walker with a tiny budget (the selftest supports pure-helper cases [VERIFIED: scripts/guards/selftest.mjs header "or { name, fn } for pure helpers"]).
- Principle carried from the photo pipeline: verify the artifact, not the script's flags.

### D. Claims audit seed (D-09) — for the content checkpoint

| # | Claim | Where it would appear | Source found | Proposed handling |
|---|-------|----------------------|--------------|-------------------|
| 1 | 23 tools | box strip, tile, pitch | README "One tiny binary. 23 command-line tools." [CITED: github.com/tlex-web/box]; MILESTONES v2.0 "the shipped 23-command `box` binary" [CITED: box .planning/MILESTONES.md] | `source`, with Pitfall 5's context line |
| 2 | 507 tests | box strip, tile | MILESTONES v2.0 Stats "Tests: 507 passing, 0 failed" [CITED] | `source` (context: "At the v2.0 milestone"). Not re-run here: the suite may touch the clipboard |
| 3 | 1 binary / single static binary | strip, pitch, tile | README badge "single static .exe" and install notes "static, MSVC release binary"; MILESTONES v1.0 "`crt-static` `box.exe`" [CITED] | `source` |
| 4 | Safe by default / writes nothing without `--force` | Safety intro, pitch | README "Safe by default — every destructive tool (`flatten --move`, `dupes --delete`, `bulk-rename`) previews as a dry-run first and only writes with `--force`"; MILESTONES "dry-run default, `--force`, abort-all-before-any pre-flight" [CITED]; flatten preview creates an empty output folder [VERIFIED] | `soften` to "renames, moves or deletes nothing without `--force`" (Pitfall 3) |
| 5 | BLAKE3 by default | terminal note | `box hash … --json` → `"algo": "blake3"` on the v2.0 build [VERIFIED]; MILESTONES "BLAKE3-default `hash`" [CITED] | `source` |
| 6 | Built for Windows PowerShell 7 | pitch, stack | README "built for **Windows PowerShell 7**" [CITED] | `source` |
| 7 | LOC (15,649), timeline (~20 days), commit counts | — | MILESTONES [CITED] | Banned unless Tim sources them (UI-SPEC voice rule); recommend `cut` |
| 8 | 0 permissions | coin-flip strip, tile, Privacy | Project record: asserted on the built release APK (summarised) | `source`; context line without a link |
| 9 | Cryptographic draw / exactly 50/50 | strip, Pipeline intro | Project record: a cryptographic random source decides each result before the animation, exactly 50/50 (summarised) | `source` |
| 10 | 0 network calls | strip, tile | Project record: no internet permission and no remote services (summarised). "0 calls" is a measurement the record does not state as such | `soften` to "No internet permission" / "Offline" (D-28 allows) |
| 11 | Fully offline; no ads, trackers or accounts | Privacy facts | Project record (summarised); also stated in the app's own About screen per the record | `source` |
| 12 | TalkBack; reduced motion; system font scaling | Problem prose | Project record lists all three as delivered in v1 (summarised) | `source` |
| 13 | Camera follows the coin; landing and settle | Pipeline stage descriptions | Project record lists both among open work after v1 | `soften` (Pitfall 9) |

### E. Route-log draft rows (D-17, D-31, D-32) — for the route-log checkpoint

| id (proposed, stable) | Title (draft) | area | status | completedAt | order | Evidence |
|---|---|---|---|---|---|---|
| `coin-flip-play-store` | Play Store release | coin-flip | planned | — | 7 | Record: store release is a separate later milestone (summarised) |
| `coin-flip-v1-1` | v1.1 Smoother toss | coin-flip | planned | — | 6 | Record: a v1.1 follow-up carries the remaining toss work (summarised) |
| `portfolio-v2` | v2.0 Topographic Identity | portfolio | in-progress | — | 5 | `383a4f9` 2026-10-10 "docs: start milestone v2.0 Topographic Identity" [VERIFIED: git log] |
| `coin-flip-v1` | v1.0 First release on device | coin-flip | completed | 2026-08-09 | 4 | Record: v1.0 closed 2026-08-09 (summarised); repo tag `v1.0` [VERIFIED: `gh api …/tags`] |
| `box-v2` | v2.0 Toolbox → toolkit | box | completed | 2026-07-14 | 3 | MILESTONES "Shipped: 2026-07-14"; tag `v2.0` at commit dated 2026-07-14 [VERIFIED: gh + clone] |
| `box-v1` | v1.0 Full toolbox | box | completed | 2026-06-24 | 2 | MILESTONES "Shipped: 2026-06-24" [CITED] |
| `portfolio-v1` | v1.0 Stabilization & Visual Identity | portfolio | completed | 2026-03-12 | 1 | `1cb6e91` 2026-03-12 "v1.0"; `.planning/MILESTONES.md:3` [VERIFIED] |

v2.0 phases (D-18): 7 → 2026-10-24 (`b147f20`), 8 → 2026-10-24 (`a413b69`), 9 → 2026-10-25 (`6500ae2`), 10 → 2026-10-26 (`ae887f0`) [VERIFIED: git log], 11 in progress, 12 planned. Expected counts: All 7; Project (status All) Portfolio 2, box 2, coin-flip 3; Status (project All) Planned 2, In progress 1, Completed 4. Zero combinations: box + Planned, box + In progress, coin-flip + In progress, Portfolio + Planned. coin-flip's Next steps = `coin-flip-v1-1`, `coin-flip-play-store`; box has none (section omitted, UI-SPEC N4).

### F. CLI_X and v1 removal map

`git grep -i -E "clix|cli_x|cli-x"` finds 27 tracked files in app, components, lib, data, e2e and README [VERIFIED: this session].

| File / CSS | Action |
|------------|--------|
| `data/projects.ts`, `data/schemas/project.ts`, `data/types.ts` | Rewrite for box/coin-flip (Pattern 5); `DemoCommand` type follows the schema |
| `data/roadmap.ts`, `RoadmapItem` | Rewrite (Pattern 6, §E) |
| `data/home.ts:21` About body | D-33 sentence (Tim approves) |
| `lib/trail-grade.ts` + `lib/__tests__/trail-grade.test.ts` (6 tests) | Keep the marker map; rewrite band tests as marker tests (≥ 6) |
| `lib/demo-terminal.ts` header comment | "CLI_X" → box wording; add `releaseSticky` |
| `components/projects/DemoTerminal.tsx` + test (13) | Retarget and amend (Pattern 3) |
| `lib/legacy-highlights.ts`, `components/ProjectHighlights.tsx`, `components/FeatureShowcase.tsx`, `components/TechStackDisplay.tsx`, `data/__tests__/fixtures/legacy-highlights.json` | Delete; their tests in `data/__tests__/projects.test.ts` (12) are rewritten |
| `components/ProjectCard.tsx` + test (8), `lib/useHexGrid.ts`, `.hex-grid`/`.hex-clip` CSS | Delete with RoutePanel + its test in the same commit |
| `components/RoadmapFilters.tsx` (8), `RoadmapTimeline.tsx` (11), `RoadmapProgress.tsx` | Delete with RouteLogFilters/RouteLog tests |
| `app/(site)/projects/page.tsx`, `app/(site)/roadmap/page.tsx` | Drop `'use client'`; Server Components with metadata |
| `e2e/case-study.spec.ts` (10), `e2e/projects.spec.ts` (7), `e2e/shell.spec.ts:27`, `e2e/no-webgl.spec.ts`, `components/site/__tests__/SiteChrome.test.tsx:82` | Rewrite against `/projects/box` (shell's nav-current row becomes `['/projects/box', 'Engineering']`) |
| `e2e/visual/routes.spec.ts:39-40`, `e2e/visual/README.md:16` | `['box', '/projects/box'], ['coin-flip', '/projects/coin-flip']` |
| `app/globals.css:50` comment ("Phase 11's T1 "Low risk" reads the same primitive") | Reword (CLI_X wording) |
| `components/Footer.tsx` | Leave (legacy dead file, Phase 12) [VERIFIED: scripts/guards/lib/legacy-dead-files.mjs:16 lists `'components/Footer.tsx'`] |
| `README.md` | Leave for the Phase 12 README pass (deferred-items precedent) |

**Test-contract table (rewrite, never delete; current total 1349):**

| Today (count) | Successor (same commit as the deletion) |
|---------------|------------------------------------------|
| `ProjectCard.test.tsx` (8) | `components/projects/__tests__/RoutePanel.test.tsx`: kicker units, h2 link name = project name, href, strip items (only tiles with context), links row (box GitHub link; coin-flip text, never a link), figure caption text and sr text |
| `RoadmapFilters.test.tsx` (8) | `components/roadmap/__tests__/RouteLogFilters.test.tsx`: two named groups, optimistic `aria-pressed`, `router.replace` with canonical href and `{ scroll: false }`, zero-count `aria-disabled` no-op, pressed-pressed no-op, pressed never disabled |
| `RoadmapTimeline.test.tsx` (11) | `components/roadmap/__tests__/RouteLog.test.tsx`: band order, order desc in bands, `Completed 24 Oct 2026`, missing date → `Completed`, empty band omitted, v2.0 `<details>` lines, row ids |
| `data/__tests__/projects.test.ts` (12) | Schema parse per slug; `features`/`riskScore` keys rejected (strict); coin-flip has no link; every `nextSteps` id exists and is not completed; no absolute path in captures; coin-flip copy passes the privacy patterns; tile without context is rejected or filtered |
| `lib/__tests__/trail-grade.test.ts` (6) | Marker for T1–T6; unknown grade throws; every marker drawn by `TrailGradeMark` |
| `e2e/case-study.spec.ts` (10) | Same route contract on `/projects/box`; the 4 removed-slug 404s; terminal behaviour incl. the D-02 release; coin-flip clip attributes and no media request before play |
| `e2e/projects.spec.ts` (7) | Heading `Engineering`, panels by name, no `hex-` class on any route, no `three` request on either case study, 375 px overflow |
| New | `lib/__tests__/{route-log,log-date,trail-profile}.test.ts`, `data/__tests__/{roadmap,trail-profiles,media-manifest}.test.ts`, component tests for TrailGradeMark, RouteProfile, CaseStudy (omit rules, index numbering), Metrics (G1 columns), DemoClip (`muted` property, no autoplay/loop), `e2e/roadmap.spec.ts` |

### G. Planning-doc rewrite (D-24)
REQUIREMENTS.md:89 ENG-03 → marked dropped with the reason; traceability row (`| ENG-03 | Phase 11 | Pending |`) → Dropped. ROADMAP.md:38 summary line, :385 goal, :387 requirement list, :391 SC3, the plan list (:416-419) and the inputs block (:446) name CLI_X [VERIFIED: grep]. PROJECT.md:20 and :62 mention CLI_X risk bands (the :62 entry records Phase 8 history; leave history, update the Active line). Do this in the first plan so later plans reference the new text.

### H. Next.js 16.4 specifics (read from `node_modules/next/dist/docs/` this session)
- `searchParams` is a Promise: "`searchParams: Promise<{ [key: string]: string | string[] | undefined }>`" and "`const filters = (await searchParams).filters`" [CITED: 03-api-reference/03-file-conventions/page.md:75-83]. Using it "will opt the page into dynamic rendering" [CITED: page.md:119]. That costs nothing here: the nonce CSP already forces dynamic rendering ("you must use dynamic rendering to add nonces") [CITED: 02-guides/content-security-policy.md:38].
- `useSearchParams` in a prerendered client component "must be wrapped in a `Suspense` boundary, otherwise the build fails" and dev "may appear to work" [CITED: 04-functions/use-search-params.md:180-181]. Pass props instead.
- `router.replace(href, { scroll })`: "without adding a new entry into the browser's history stack"; `scroll: false` keeps the position; "You must not send untrusted or unsanitized URLs to `router.push` or `router.replace`" [CITED: 04-functions/use-router.md:45, 54, 120].
- `dynamicParams = false`: "Dynamic route segments not included in `generateStaticParams` will return a 404" [CITED: 02-route-segment-config/dynamicParams.md:17].
- `title.template` "applies to **child** route segments"; the root layout's template yields `box · Tim Lui` [CITED: 04-functions/generate-metadata.md:243, 285-288].
- Videos guide: dimensions, poster, fallback, accessible native controls [CITED: 02-guides/videos.md:61-65]. `useOptimistic` appears in `02-guides/forms.md:386` [CITED].

## Code Examples

### MP4 box walker (guard + `clip:derive --check`)
```js
// scripts/guards/lib/mp4-boxes.mjs — pure, no imports; verified against ffmpeg 9.0.1 output this session
const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'udta', 'edts', 'dinf']);
export function boxes(buf, start = 0, end = buf.length, depth = 0, out = []) {
  let o = start;
  while (o + 8 <= end) {
    let size = buf.readUInt32BE(o); const type = buf.toString('latin1', o + 4, o + 8); let header = 8;
    if (size === 1) { size = Number(buf.readBigUInt64BE(o + 8)); header = 16; } else if (size === 0) size = end - o;
    if (size < header || o + size > end) { out.push({ type: '!bad', offset: o, depth }); break; }
    out.push({ type, offset: o, size, header, depth });
    if (CONTAINERS.has(type)) boxes(buf, o + header, o + size, depth + 1, out);
    if (type === 'meta') boxes(buf, o + header + 4, o + size, depth + 1, out); // FullBox: skip version+flags
    o += size;
  }
  return out;
}
/** Violations for a served MP4: metadata boxes, timestamps, tracks, order, budget. */
export function checkMp4(buf, { maxBytes } = {}) {
  const v = []; const all = boxes(buf); const top = all.filter((b) => b.depth === 0).map((b) => b.type);
  if (top.indexOf('moov') === -1 || top.indexOf('moov') > top.indexOf('mdat')) v.push('moov must precede mdat (+faststart)');
  for (const b of all) {
    if (['uuid', 'XMP_', '\u00a9xyz', 'loci', '!bad'].includes(b.type)) v.push(`forbidden box ${b.type}`);
    if (b.type === 'ilst' && b.size > 8) v.push('metadata items in ilst');
    if (['mvhd', 'tkhd', 'mdhd'].includes(b.type)) {
      const p = b.offset + b.header; const ver = buf[p];
      const ct = ver === 1 ? buf.readBigUInt64BE(p + 4) : BigInt(buf.readUInt32BE(p + 4));
      const mt = ver === 1 ? buf.readBigUInt64BE(p + 12) : BigInt(buf.readUInt32BE(p + 8));
      if (ct !== 0n || mt !== 0n) v.push(`${b.type} timestamps not zero`);
    }
  }
  const handlers = all.filter((b) => b.type === 'hdlr' && b.depth === 3) // moov>trak>mdia>hdlr
    .map((b) => buf.toString('latin1', b.offset + b.header + 8, b.offset + b.header + 12));
  if (handlers.filter((h) => h === 'vide').length !== 1 || handlers.some((h) => h !== 'vide')) v.push(`tracks: ${handlers.join(',') || 'none'} (need exactly one video track, no audio)`);
  if (maxBytes && buf.length > maxBytes) v.push(`size ${buf.length} B over ${maxBytes} B`);
  return v;
}
```

### Encode and poster (write mode core)
```js
// scripts/media/build-clip.mjs (write mode; ffmpeg flags verified this session). execFileSync: no shell.
const args = ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(start), '-t', String(duration), '-i', original,
  '-map', '0:v:0', '-an', '-sn', '-dn', '-map_metadata', '-1', '-map_chapters', '-1',
  '-vf', 'scale=512:-2:flags=lanczos,format=yuv420p',           // add fps=30 only if over budget
  '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', String(crf),
  '-bsf:v', 'filter_units=remove_types=6',                       // drop SEI (encoder info)
  '-movflags', '+faststart', '-fflags', '+bitexact', '-flags:v', '+bitexact', '-metadata:s:v:0', 'encoder=', tmpMp4];
execFileSync('ffmpeg', args);
const png = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-ss', String(posterAt), '-i', tmpMp4,
  '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', '-']);
const poster = await sharp(png).webp({ quality: 82 }).toBuffer();  // sharp default output keeps no metadata
```

### Service-worker bypass
```js
// public/service-worker.js, in the fetch handler right after the non-GET check
// Media goes straight to the network: Range requests need real 206 responses, and Cache.put rejects partial responses.
if (request.headers.has('range') || request.destination === 'video' || request.destination === 'audio') {
  return;
}
```

### Clip figure (Server Component)
```tsx
// components/projects/DemoClip.tsx — NEXT 02-guides/videos.md; UI-SPEC "Demo — coin-flip"
export function DemoClip({ clip, media }: { clip: CoinFlipClip; media: ClipManifestEntry }) {
  return (
    <figure className="mt-6 grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)] md:items-start">
      <div className="w-full max-w-64 overflow-hidden rounded-lg border border-line bg-surface-raised">
        <video controls muted preload="none" playsInline poster={media.poster.src}
          width={media.width} height={media.height}
          aria-label="coin-flip: one coin toss, screen recording" aria-describedby="demo-clip-description"
          className="block h-auto w-full">
          <source src={media.src} type="video/mp4" />
          <p>This browser cannot play the clip. The description says what it shows.</p>
        </video>
      </div>
      <figcaption id="demo-clip-description" className="max-w-prose text-base text-ink-muted">{clip.description}</figcaption>
    </figure>
  );
}
```

### Data tests: captured paths and coin-flip privacy
```ts
// data/__tests__/projects.test.ts
const ABSOLUTE = /[A-Za-z]:[\\/]|\\\\|\/Users\/|AppData|%USERPROFILE%|~[\\/]/;
test('captured strings carry no absolute or home path', () => {
  const box = projects.find((p) => p.slug === 'box')!;
  const strings = [...(box.demo?.commands ?? []).flatMap((c) => [c.input, c.output]),
    box.safety?.capture?.input, box.safety?.capture?.output].filter(Boolean) as string[];
  for (const s of strings) expect(s).not.toMatch(ABSOLUTE);
});
// D-23: no backlog/requirement-style IDs, code identifiers or file paths in coin-flip copy
const PRIVATE_PATTERNS = [/\b[A-Z][A-Z0-9]{0,5}-\d{1,3}\b/, /\b[A-Z][A-Z0-9]+_[A-Z0-9_]+\b/,
  /\b[a-z]+[A-Z]\w*\(/, /[\w-]+\/[\w./-]+\.(kt|kts|java|xml|gradle|sh|py)\b/];
test('coin-flip copy reveals no internals', () => {
  const text = JSON.stringify(projects.find((p) => p.slug === 'coin-flip'));
  for (const re of PRIVATE_PATTERNS) expect(text).not.toMatch(re);
});
```

### formatLogDate and the D-20 test
```ts
// lib/log-date.ts — month-table pattern of lib/home-format.ts formatCaptureMonth
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;
export function formatLogDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new RangeError(`formatLogDate: expected YYYY-MM-DD, got ${iso}`);
  const month = MONTHS[Number(m[2]) - 1];
  if (!month || Number(m[3]) < 1 || Number(m[3]) > 31) throw new RangeError(`formatLogDate: invalid date ${iso}`);
  return `${Number(m[3])} ${month} ${m[1]}`;
}
// data/__tests__/roadmap.test.ts
test('surveyedAt is not in the future and not before the newest completedAt (incl. phase dates)', () => {
  const today = new Date().toISOString().slice(0, 10);
  expect(surveyedAt <= today).toBe(true);
  expect(surveyedAt >= newestCompletedAt(roadmapItems)).toBe(true);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Synchronous `params`/`searchParams` | Promise props, awaited | Next 15+ | Always `await` |
| `useSearchParams` in client filters | Server-parsed props + `router.replace` | App Router guidance | No Suspense/CSR bailout |
| `framer-motion` page fades on `/roadmap` | No entrance motion (UI-SPEC) | v2.0 | Drop `motion` from the page |
| Autoplaying muted background video | Click-to-play with poster, `preload="none"` | UI-SPEC ux #96 | No bytes until play; reduced motion needs no special case |
| CLI_X risk scale | Retired (D-24); grade vocabulary = real trail grades only | 2026-11-01 | No `RiskScale` component |

**Deprecated/outdated in this repo:** `toLegacyHighlights` and its fixture; `RoadmapItem.area` values `cli`/`webshop`/`other`; `PricingBlock`, `RiskScaleBlock`, `RiskLevel`; `bandFor`, `isScoreInLevel`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Cache.put` rejects 206 responses, and a cached 200 served to a Range request can break Safari video | Pitfall 6 | Low: the bypass is harmless either way |
| A2 | Warming the poster with `new Image()` before the screenshot makes the visual poster capture deterministic | Pitfall 8 | A flaky first visual run; fix by waiting for the poster request |
| A3 | Without the INTERNET permission an Android app cannot open network sockets, which is why "No internet permission" is the safe wording for "0 network calls" | §D row 10 | Wording only; Tim decides at the audit |
| A4 | swisstopo's open-data terms cover the Wanderwege geometry under the existing footer credit | Pattern 4 | An extra attribution string (data edit) |
| A5 | Zmutt via points can bring the routed line within 10% of 4.3 km | Pattern 4 | More via points needed |
| A6 | A real dark screen recording at 512 px wide and 60 fps fits 1.5 MiB at CRF 26 for 5–10 s | §B | Drop to 30 fps or raise CRF (both in the sidecar) |
| A7 | The box README's "23 tools" framing (excluding `config`/`completions`) is how Tim wants the count read | Pitfall 5 | Context-line wording only |

## Open Questions (RESOLVED)

1. **Which box binary produces the captures?** (D-25/D-26 say "the installed box 0.1.0"; the installed build is pre-v2.0.) **RESOLVED:** option A, by D-34 (Tim, 2026-11-01): every capture uses a scratchpad build of the `v2.0` tag (`cargo build --release --locked`); 11-02 Task 2 builds it and its SUMMARY records the tag, commit and command.

   | Option | Pros | Cons |
   |--------|------|------|
   | A: Build the `v2.0` tag in the scratchpad and capture with it (recommended; verified to work) | Output matches the v2.0 kicker; `dupes --delete`, `config`, `--json` everywhere | Deviates from the literal D-26 path; Tim approves |
   | B: Tim reinstalls box from the `v2.0` tag (`install.ps1`), then capture with the installed binary | Literal D-26 path; Tim's own box is current | Changes his machine; his action, not Claude's |
   | C: Capture with the installed pre-v2.0 build | Literal D-26 | Shows a build that is not the release named on the page; misses v2.0 features |

2. **Safety capture command:** `bulk-rename` (recommended, relative output) vs `dupes --delete` (absolute paths, unusable unedited). Tim approves at the copy checkpoint. **RESOLVED:** 11-02 recommends `bulk-rename` in packet §C and explains in words (never pasting the output) why the delete preview is unusable; Tim makes the final call at the 11-02 checkpoint and only his quoted choice ships.
3. **When does Phase 11's own completion date enter the route log?** Recommendation: the final data task before verification sets it with `surveyedAt`, or Phase 12's first task does; either way the D-20 test guards it. **RESOLVED (11-08):** Phase 11's completion date is not written during Phase 11 (a date before verify-work would claim unverified completion); Phase 12's first data edit or the v2.0 milestone close records it and moves `surveyedAt`, with Tim's confirmation, and 11-17 lists it as a Phase 12 carry-over.
4. **Exact size budget** for the clip guard: 1.5 MiB (1,572,864 B) recommended; Tim may prefer 1,500,000 B. **RESOLVED (11-09):** 1,572,864 B (1.5 MiB), within D-27's "about 1.5 MB", recorded as `MAX_CLIP_BYTES`; the 11-02 clip brief states it.
5. **Whether to report the `flatten` empty-folder behaviour** to Tim as a box issue (outside this repo). **RESOLVED:** yes, as a note for Tim in 11-02-SUMMARY.md (an issue for his box repository); no work is planned in this repo.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | scripts, jest, next | ✓ | local v26.13.0 (engines `24.x`; CI pins `.node-version` 24) | — |
| ffmpeg / ffprobe | `clip:derive` write mode | ✓ | 9.0.1 essentials (libx264, libvpx, libaom) | none needed in CI (`--check` is pure Node) |
| cargo / rustc (MSVC) | box v2.0 build for captures | ✓ | 1.98.1 | Tim reinstalls box (Open Question 1, B) |
| box v2.0 binary | D-25/D-26 captures | ✓ built in scratchpad (session-only; the plan rebuilds) | prints `box 0.1.0` | — |
| Installed box | (literal D-26) | ✓ but pre-v2.0 | `box 0.1.0` | see above |
| PowerShell 7 | pipeline capture | ✓ | 7.6.9 | — |
| gh (authenticated `tlex-web`, scopes `repo`, `workflow`) | box clone, private read, visual dispatch | ✓ | 2.103.3 | — |
| geo.admin.ch API (network) | one-off `fetch-trails.mjs` | ✓ (probed 2026-11-01) | — | hand-entered polyline (worse) |
| sharp | DEM decode, poster | ✓ | ^0.35.5 | — |
| Playwright | e2e | ✓ | 1.64.0 | — |
| Android device + Tim | the clip (D-27) | human-action | — | coin-flip ships without a Demo section |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** the clip (human input; the page omits Demo without it).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30 (jsdom, `next/jest`) + Playwright 1.64 (chromium, firefox; visual-* in CI) + @axe-core/playwright 4.13.0 |
| Config file | `jest.config.js`, `playwright.config.ts` |
| Quick run command | `npm run lint && npm run type-check` then `npx jest <paths> --silent` (lint runs every guard, `data:check` and `guard:images`) |
| Full suite command | `npm run lint && npm run type-check && npx jest --silent && npx playwright test --project=chromium --project=firefox` (`PW_PROD=1` for production parity, as CI) |
| Guards | `npm run data:check`; `npm run guard:selftest && npm run guard:images`; `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENG-01 | Panels: kicker, h2 link, pitch, strip (context-gated), links (box link, coin-flip text), figure | component + e2e | `npx jest components/projects/__tests__/RoutePanel.test.tsx --silent && npx playwright test e2e/projects.spec.ts --project=chromium` | ❌ Wave 0 (RoutePanel new; projects.spec rewritten) |
| ENG-01 | Profiles deterministic, in extent, ≥ 64 points, RSC-only | build check + unit | `npm run data:check && npx jest data/__tests__/trail-profiles.test.ts lib/__tests__/trail-profile.test.ts --silent` | ❌ Wave 0 |
| ENG-01 | Trail marker map T1–T6; badge text + sr waymark name | unit + component | `npx jest lib/__tests__/trail-grade.test.ts components/projects/__tests__/TrailGradeMark.test.tsx --silent` | ✅ rewrite / ❌ new |
| ENG-01 | No `hex-` class on any route; hex code deleted | e2e + grep | `npx playwright test e2e/projects.spec.ts --project=chromium -g "hex"` and `git grep -n "useHexGrid\|hex-grid\|hex-clip"` returns nothing | ❌ Wave 0 |
| ENG-01 | Trail paint contrast and palette | guard | `npm run guard:contrast && npm run guard:palette` | ✅ (TRAIL list added) |
| ENG-02 | Slot order, omit-if-empty, index hidden below 2, numbering from rendered order | component | `npx jest components/projects/__tests__/CaseStudy.test.tsx --silent` | ❌ Wave 0 |
| ENG-02 | `/projects/box`, `/projects/coin-flip` render; `clix-cli`, `clix-website`, `BOX`, `no-such-slug` → designed 404; titles `box · Tim Lui` | e2e | `npx playwright test e2e/case-study.spec.ts e2e/shell.spec.ts --project=chromium` | ✅ rewrite |
| ENG-03 | Retired: REQUIREMENTS marks it dropped; no `RISK_BANDS`/`bandFor`/`RiskScale`/`riskScore` in source | doc check + grep | `git grep -n -E "RISK_BANDS\|bandFor\|isScoreInLevel\|RiskScale\|riskScore" -- app components lib data` returns nothing; `grep -n "ENG-03" .planning/REQUIREMENTS.md` shows Dropped | ❌ (manual-free check) |
| ENG-04 | Tiles need a context line; G1 column count; no count-up; banned phrases absent; claims as audited | unit + e2e | `npx jest components/projects/__tests__/Metrics.test.tsx data/__tests__/projects.test.ts --silent && npx playwright test e2e/case-study.spec.ts --project=chromium -g "Metrics"` | ❌ Wave 0 |
| ENG-04 | No absolute paths in captures; coin-flip copy passes privacy patterns; coin-flip never a link | unit | `npx jest data/__tests__/projects.test.ts --silent` | ✅ rewrite |
| ENG-05 | D-02 amended: release resumes at once; re-entry re-pauses; internal focus moves don't; offscreen/hidden survive release; reduced motion starts paused | unit + component + e2e | `npx jest lib/__tests__/demo-terminal.test.ts components/projects/__tests__/DemoTerminal.test.tsx --silent && npx playwright test e2e/case-study.spec.ts --project=chromium -g "Demo"` | ✅ rewrite |
| ENG-05 | No three.js on either case study; no-WebGL page intact | e2e | `npx playwright test e2e/no-webgl.spec.ts e2e/projects.spec.ts --project=chromium` | ✅ rewrite |
| D-27 | Clip: `muted` property, `preload="none"`, no autoplay/loop, poster, no `.mp4` request before play | component + e2e | `npx jest components/projects/__tests__/DemoClip.test.tsx --silent && npx playwright test e2e/case-study.spec.ts --project=chromium -g "clip"` | ❌ Wave 0 |
| D-27 | Served MP4: no metadata, one video track, no audio, budget, hash name, manifest; guard can fail | guard + selftest | `npm run guard:selftest && npm run guard:images && npm run clip:derive -- --check` | ❌ Wave 0 (fixtures + walker) |
| ROUTE-01 | Band order, order desc, DOM = visual order, dates formatted, v2.0 disclosure | unit + component | `npx jest lib/__tests__/route-log.test.ts lib/__tests__/log-date.test.ts components/roadmap/__tests__/RouteLog.test.tsx --silent` | ❌ Wave 0 |
| ROUTE-02 | URL round trip, optimistic `aria-pressed`, Back does not undo filters, zero-count disabled, unknown → All, `#id` anchors, 375 px no overflow, axe clean | component + e2e | `npx jest components/roadmap/__tests__/RouteLogFilters.test.tsx --silent && npx playwright test e2e/roadmap.spec.ts --project=chromium --project=firefox` | ❌ Wave 0 |
| ROUTE-03 | Unique `order`, v2.0 in progress with phases 7–12, `surveyedAt` rule incl. phase dates, next-step ids exist and are not completed | unit | `npx jest data/__tests__/roadmap.test.ts data/__tests__/projects.test.ts --silent` | ❌ Wave 0 |
| All | Ratchet ≥ 1349 (policy; guard floor 1300), no skip/only | guard | `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` | ✅ |
| All | Visual baselines `projects`, `box`, `coin-flip`, `roadmap`, `home` | visual (CI) | `gh workflow run` visual dispatch on `ci/11-NN`; download; compare; Tim commits PNGs and removes `clix-*` folders | ✅ (re-baseline) |
| Manual | Glyph look, terminal and clip visual quality, copy tone | human | visual review + copy checkpoint | — (judgement) |

### Sampling Rate
- **Per task commit:** `npm run lint && npm run type-check && npx jest <touched paths> --silent`
- **Per wave merge:** `npx jest --silent && npx playwright test e2e/projects.spec.ts e2e/case-study.spec.ts e2e/roadmap.spec.ts e2e/no-webgl.spec.ts e2e/shell.spec.ts --project=chromium`
- **Phase gate:** full suite (chromium + firefox, `PW_PROD=1`) + `npm run guard:tests` green, then the visual re-baseline accepted, before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `lib/__tests__/{route-log,log-date,trail-profile}.test.ts`
- [ ] `data/__tests__/{roadmap,trail-profiles,media-manifest}.test.ts`
- [ ] `components/projects/__tests__/{RoutePanel,RouteProfile,TrailGradeMark,CaseStudy,Metrics,DemoClip}.test.tsx`
- [ ] `components/roadmap/__tests__/{RouteLog,RouteLogFilters}.test.tsx` (successors of the v1 tests)
- [ ] `e2e/roadmap.spec.ts` (new); `e2e/projects.spec.ts`, `e2e/case-study.spec.ts` rewritten
- [ ] `scripts/guards/__selftest__/served-images/` MP4 fixtures + selftest cases; `scripts/guards/lib/mp4-boxes.mjs`
- [ ] `scripts/terrain/build-trails.mjs --check` and `scripts/media/build-clip.mjs --check` wired into `data:check`

## Security Domain

`security_enforcement` is absent from `.planning/config.json`, so it is treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | All public, static data |
| V5 Input Validation | yes | Exact-match whitelists for `?project`/`?status` (the `parseView` pattern); exact slug match then `notFound()`; zod strict schemas |
| V6 Cryptography | no | sha256 integrity of committed sources via Node `crypto` |
| V8 Data Protection | yes | Metadata stripped from the clip and poster (device recordings can carry creation time and location); raw recording gitignored; guard verifies the artifact |
| V12/V14 Files & Config | yes | Generators never networked in CI; committed sources sha256-checked; `execFileSync` with arg arrays (no shell) for ffmpeg |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Visitor-controlled URL reaches `router.replace` (`javascript:`) | Tampering / XSS | Hrefs built only from enum values (`routeLogHref`) |
| Reflected filter text in the empty state | XSS | Labels from an enum → label map, never raw params |
| coin-flip internals leaking into the public repo, plans or commits | Information disclosure | Summaries in own words; privacy-pattern data test; reviewers grep diffs; Tim approves all copy (D-23) |
| Device or encoder metadata in the served clip (location, creation time, device) | Information disclosure | ffmpeg strip flags + box-walker guard + gitignored originals |
| Home-directory paths in captured CLI output | Information disclosure | Relative inputs, `bulk-rename` not `dupes --delete`, absolute-path data test |
| Private repo rendered as a link | Information disclosure / broken trust | Schema gives coin-flip no link field; data test (D-12) |
| Network fetch in CI | Tampering | Manual `fetch-trails.mjs`; offline `--check` with sha256 |
| Large generated data in client bundles | Perf / disclosure | `trail-profiles.ts` RSC-only, test-enforced |

## Sources

### Primary (HIGH confidence)
- Repo files read this session: `lib/demo-terminal.ts`, `components/projects/DemoTerminal.tsx`, `lib/trail-grade.ts`, `data/schemas/project.ts`, `data/types.ts`, `proxy.ts`, `next.config.ts`, `public/service-worker.js`, `scripts/guards/check-served-images.mjs`, `scripts/guards/test-count.mjs` + baseline, `scripts/guards/selftest.mjs`, `scripts/guards/lib/legacy-dead-files.mjs`, `scripts/photos/build-derivatives.mjs` (header), `lib/photos/view-param.ts`, `components/photos/ViewSwitcher.tsx`, `lib/terrain/dem-sample.ts`, `data/terrain/source/source.json`, `app/(site)/projects/[slug]/page.tsx`, `package.json`, `app/globals.css`, `.gitignore`, `e2e/visual/routes.spec.ts`, `.planning/WINDOWS.md`
- Next 16.4.2 docs in `node_modules/next/dist/docs/01-app/`: `02-guides/videos.md`, `02-guides/content-security-policy.md`, `02-guides/forms.md`, `03-api-reference/03-file-conventions/page.md`, `02-route-segment-config/dynamicParams.md`, `04-functions/use-router.md`, `use-search-params.md`, `generate-metadata.md`
- Probes this session: box v2.0 build from tag `v2.0` (commit `61afb3d`, 2026-07-14) and the installed build; ffmpeg 9.0.1 encode + ffprobe + box dump; React 19.3.1 `renderToString` and jsdom client render; geo.admin.ch identify on `ch.swisstopo.swisstlm3d-wanderwege`; `gh repo view` for both repos; git log dates
- github.com/tlex-web/box: [README](https://github.com/tlex-web/box), [.planning/MILESTONES.md](https://github.com/tlex-web/box/blob/main/.planning/MILESTONES.md), `Cargo.toml` (version 0.1.0, edition 2021)
- `tlex-web/coin-flip` (private, read-only via `gh`; summarised only): project record, roadmap, state, tags

### Secondary (MEDIUM confidence)
- `11-CONTENT-PACKET.md` §A (official zermatt.swiss trail listings and the first-pass geometry probe), §G1, §I
- Playwright type docs on proprietary codecs (`node_modules/playwright-core/types/types.d.ts:17598`)

### Tertiary (LOW confidence, not relied on)
- General knowledge on Cache API 206 handling and Safari Range behaviour (A1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (no new packages; versions read from the install; ffmpeg and cargo probed)
- Architecture: HIGH (every pattern has an in-repo precedent; the clip pipeline mirrors `photos:derive`)
- box facts and captures: HIGH (public sources plus a working v2.0 build)
- coin-flip facts: MEDIUM-HIGH (private record read directly; wording gated by Tim)
- Pitfalls: HIGH (1–4, 6–8, 14 observed directly this session)
- Trail geometry: HIGH for grades and DEM method; MEDIUM for Zmutt via points

**Research date:** 2026-11-01
**Valid until:** 2026-12-01 (stable stack); re-check box if Tim tags a new release
