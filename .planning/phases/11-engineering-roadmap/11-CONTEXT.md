# Phase 11: Engineering & Roadmap - Context

**Gathered:** 2026-11-01 (first pass); **updated 2026-11-01** for the project swap: CLI_X is discontinued, and box and coin-flip replace both CLI_X projects
**Status:** Ready for planning (re-plan: 11-01 is complete and kept; 11-02 to 11-15 are superseded)

<domain>
## Phase Boundary

Tim's engineering work reads as surveyed routes, and his roadmap reads as a route log. The two engineering projects are now **box** and **coin-flip** (D-22):

- **`/projects`:** full-width `RoutePanel`s for box and coin-flip, each with name, pitch, metric strip, trail-grade badge and elevation-profile glyph. The hex cards, `useHexGrid`, the `hex-grid` CSS and `hex-clip` are removed everywhere (ENG-01).
- **`/projects/box` and `/projects/coin-flip`:** a `CaseStudy` template with fixed section slots in this order: problem, pipeline diagram, safety, metrics, demo, stack, next steps. The safety slot's heading is set per project (D-25). Any section without data is left out (ENG-02). Metrics form an instrument panel in tabular numerals with a context line, and every claim is sourced or softened (ENG-04).
- **Terminal:** the flat `DemoTerminal` built in 11-01 is retargeted to box (ENG-05). coin-flip has no terminal: its Demo is a muted clip that never autoplays (D-27).
- **`/roadmap`:** a `RouteLog` on a vertical elevation axis for portfolio, box and coin-flip (completed below, in progress at the current camp, planned above). A segmented project and status filter lives in the URL, and filters with no items are removed or disabled. Items carry order and completion dates, v2.0 is listed as in progress, and the page shows a "last surveyed" date (ROUTE-01 to ROUTE-03).
- **ENG-03 is retired** (D-24): CLI_X's risk bands have no counterpart in either new project. REQUIREMENTS.md and the ROADMAP Phase 11 goal and success criteria are updated to match.
- **CLI_X leaves the site entirely:** project data, slugs, route-log rows, fixtures, tests and baselines, plus the CLI_X sentence in Home's About copy (D-22, D-33). `/projects/clix-cli` and `/projects/clix-website` return the designed 404, with no redirects.
- Project routes stay Server Components that export metadata (already true since 11-01), so Phase 12 can attach OG images (SEO-02).

Requirements: ENG-01, ENG-02, ENG-04, ENG-05 and ROUTE-01 to ROUTE-03. ENG-03 is dropped. Out of scope here: terminal step controls and a static transcript (ENG-F1, deferred), OG images (SEO-02, Phase 12), the summit-register contact page and dead-code cleanup (Phase 12).

**Plan state:** 11-01 (flat DemoTerminal, server-rendered case-study route, every pause source) is complete and stays. 11-02 to 11-15 embed CLI_X content, slugs and fixtures, so they are re-planned from this context. `11-CONTENT-PACKET.md` is superseded: its §A trail table, §G1 portfolio rows and §I UI-SPEC defaults are reused in the new packet (D-21). `11-RESEARCH.md`, `11-PATTERNS.md`, `11-VALIDATION.md` and `11-UI-SPEC.md` are CLI_X-heavy and must be refreshed (see Next steps in the discussion summary).

</domain>

<decisions>
## Implementation Decisions

Decision IDs from the first pass are kept, so 11-01's code comments and SUMMARY (D-02, D-03) stay valid. A retired ID is never reused. New decisions start at D-22.

### Project swap
- **D-22: box and coin-flip replace clix-cli and clix-website entirely** (Tim, 2026-11-01, at the 11-02 checkpoint: "Both CLI_X projects out"). box is github.com/tlex-web/box: public, Rust, a CLI toolkit for Windows PowerShell 7 with 23 tools in one binary. coin-flip is github.com/tlex-web/coin-flip: private, a native Android app (Kotlin) built around a 3D coin toss. The slugs are `box` and `coin-flip`. The old `cli-*` and `webshop-*` roadmap rows, CLI_X demo commands, fixtures and tests leave. Tests that referenced them are rewritten for the new projects and never deleted (test-count ratchet). The visual baseline folders `clix-cli` and `clix-website` are replaced by `box` and `coin-flip` in the phase re-baseline. — **Reversibility:** costly — once shipped, the slugs are shared URLs and visual-baseline folder names.
- **D-23: The private-repo constraint now covers coin-flip** (it carries forward D-11's rule, which originally covered CLI_X). Research may read `tlex-web/coin-flip` read-only through Tim's authenticated `gh`. The portfolio repo and its `.planning/` docs are **public**, so RESEARCH.md, plans, commits and the site summarise in Claude's own words. They must not copy source, file paths, identifiers, defect or backlog IDs, test evidence or internal measurements. The site may state, in approved wording, what the app is, its sourced feature facts (zero permissions, fully offline, no ads, trackers or accounts, a cryptographic 50/50 result decided before the toss, TalkBack support, reduced-motion support, system font scaling) and its milestone dates. box is public, so its README and `.planning/` docs may be cited and linked.

### Safety slot (ENG-03 retired)
- **D-04: Retired** (the CLI_X risk badge in the terminal). D-26's optional note line takes its place.
- **D-10: Retired** (CLI_X Medium/High demo commands).
- **D-11: Retired** (CLI_X per-grade behaviour lines). Its privacy rule lives on in D-23.
- **D-24: ENG-03 is retired, because CLI_X is discontinued.** REQUIREMENTS.md marks ENG-03 as dropped with the reason. The ROADMAP Phase 11 goal and success criterion 3 are rewritten without risk bands, and the traceability row is updated. No `RiskScale` component is built. Trail grades appear only as the real SAC badges of the panel and trailhead trails (D-06), so the grade vocabulary has one meaning across the site. The CLI_X-only code goes: the score-band logic in `lib/trail-grade.ts` (`RISK_BANDS` score ranges, `bandFor`, `isScoreInLevel`), and `RiskLevel`, `RiskScaleBlock` and `riskLevel`/`riskScore` in `data/schemas/project.ts`. The marker-glyph vocabulary the badges need stays: T1 yellow, T2–T3 white-red-white, T4–T5 white-blue-white, T6 unmarked. Which plan edits REQUIREMENTS.md and ROADMAP.md is the planner's call; it should be early. — **Reversibility:** reversible — a planning-doc change, plus code that is not yet shipped in its v2 form.
- **D-25: The safety slot keeps its position, and its heading is set per project:** "Safety" for box, "Privacy" for coin-flip.
  - **box Safety:** two or three sentences of prose about the gate: destructive commands preview by default, nothing is written without `--force`, and every check passes before any write. Then one static block of **real** preview output. Claude captures it with box 0.1.0 (the v2.0-tag build, D-34), running a destructive command in preview mode (e.g. `box dupes`) against a throwaway folder in the scratchpad. A line follows it saying what `--force` would do. Tim approves the capture at the copy checkpoint.
  - **coin-flip Privacy:** zero permissions (checked on the release APK), fully offline, no ads, trackers or accounts.
  - **Fairness goes in coin-flip's Pipeline, not under Privacy:** a cryptographic 50/50 draw decides the result before the toss, and the animation is choreographed to land on it.

### Demos (ENG-05)
- **D-01: Kept** (flat token terminal; three.js never loads on project pages; built in 11-01). The terminal heading copy is rewritten for box under D-16.
- **D-02: Amended. Releasing the Pause toggle now resumes at once.** Tim chose option B for the 11-01 open question. Hover and focus-within still pause temporarily, and leaving resumes. Pressing Pause is still sticky. When the visitor releases the toggle, it clears the current hover and focus pauses until the pointer or focus next enters the terminal (the WAI carousel's explicit start). Offscreen (IntersectionObserver) and hidden-tab (`visibilitychange`) pauses are unchanged. Reduced motion still starts paused with full text. The UI-SPEC, `lib/demo-terminal.ts`, its Jest suite, `DemoTerminal.test.tsx` and `e2e/case-study.spec.ts` (including its `leaveTerminal()` helper assumptions) change together. Tests assert state (`aria-pressed`, `data-playback`), not classes.
- **D-03: Kept** (per-command selector dots, restyled; already built in 11-01).
- **D-26: The box terminal loop shows box as a scriptable toolkit, with real captured output.** It has 4–5 commands that show what v2.0 is about. Examples: `box hash <file>` (BLAKE3 by default), `box uuid --json`, `box epoch …`, and a `box du --json | ConvertFrom-Json` style pipeline line. Claude captures them with `box 0.1.0` built from the v2.0 tag (D-34; originally the installed `%LOCALAPPDATA%\Programs\box\box.exe`):
  - with `NO_COLOR` set;
  - read-only commands only, with inputs in the scratchpad;
  - no home-directory paths, no network (`weather` is excluded), and no `--version` (D-29).

  The exact command lines go in the SUMMARY, and Tim approves the transcript at the copy checkpoint. Output is captured once and frozen (a random value such as a UUID stays as captured), so nothing is invented (08 D-22). Each command may carry an optional one-line note under its output, in place of the D-04 badge line. `DemoCommandSchema` drops `riskLevel` and `riskScore` and gains the optional note field.
  **Binary amended by D-34:** the captures use a v2.0-tag build, not the installed binary.
- **D-34: The D-25 and D-26 captures use a box binary built from the `v2.0` tag** (Tim, 2026-11-01, during plan-phase research). Research found that the installed `%LOCALAPPDATA%\Programs\box\box.exe` (dated 25 Jun) predates v2.0. It has no `config` or `completions`, no `dupes --delete`, and `epoch` ignores `--json`. A plan step clones `tlex-web/box` at the `v2.0` tag into the scratchpad and builds it with `cargo build --release --locked` (about 1.5 min, verified in research). All captures run with that binary. It still prints `box 0.1.0`, so the `--version` exclusion (D-29) stands. Tim's installed box is not touched. The SUMMARY records the tag, the commit hash and the build command next to the captured command lines. — **Reversibility:** reversible — captured output is data and can be re-captured.
- **D-27: coin-flip's Demo is a short, muted clip.** It is a 4–10 s device screen recording of one flip, served same-origin (changed 2026-11-01, Tim, 11-15; it was 5–10 s). The `<video>` element:
  - is muted, does not loop, shows controls and has a poster frame;
  - never autoplays, so the visitor clicks to play. Under reduced motion the poster stays until the visitor plays it.

  Metadata is stripped, and the size budget is about 1.5 MB. Formats and encoding are research's call. Visual tests capture the poster, so screenshots are deterministic. The app is silent, so the clip has no audio track. It gets an accessible name and a short text description of what happens.

  **Source:** Tim records a fresh, clean clip on the device at a human-action checkpoint (no debug overlays; the finish is his pick) and drops the file in a folder the plan names. Claude trims, encodes, strips metadata and extracts the poster. If no clip arrives, coin-flip ships **without** a Demo section, never with a placeholder (10 D-07).

  Video is a new served-asset type. The CSP has no `media-src`, so `default-src 'self'` already allows same-origin video. The served-asset guard (`guard:images`) does not yet check video for metadata, size or hash names, so research decides how to extend it.

### Route panels (ENG-01)
- **D-05: Kept** (a build-time DEM trail-profile glyph with an offline `--check`, `aria-hidden`, and its meaning carried by the caption).
- **D-06: Kept.** A project's badge is the real SAC grade of the trail its glyph draws. With ENG-03 retired, the grade vocabulary means only "trail grade" everywhere on the site.
- **D-07: Answered for the new pair** (Tim, this discussion). **box → Hörnliweg No. 27**, Schwarzsee → Hörnlihütte, **T4** (white-blue-white). **coin-flip → Zmutt path No. 2**, Zermatt → Zmutt, **T1** (yellow). The sources are the official zermatt.swiss listings quoted in `11-CONTENT-PACKET.md` §A. The captions are `Schwarzsee 2,587 m → Hörnlihütte 3,262 m · T4` and `Zermatt 1,606 m → Zmutt 1,934 m · T1`, with place names as shown. The final heights come from the generator's DEM endpoints (08 D-17). The Zmutt line needs 1–2 via points to stay within 10% of the official 4.3 km, and the plan records them in its SUMMARY. No trail checkpoint is needed: Tim sees the glyphs in the visual review.
- **D-08: Replaced by D-28** (the clix-website metric strip).
- **D-28: Metric strips use the proposed sets.** box: **23 tools · 507 tests · 1 binary**, sourced from box `.planning/MILESTONES.md` (v2.0 stats) and the README. coin-flip: **0 permissions · 50/50 · 0 network calls**, sourced from coin-flip's project record: the permission count is asserted on the release APK, there is no internet permission and no remote services, and the result is an exact 50/50. The context line names the release (e.g. "measured at v2.0"). Every value still goes through the D-09 audit; the audit may soften "0 network calls" to "Offline". Values are in tabular numerals, render final at once, and have no count-up.
- **D-29: Version and status words.** box's kicker shows **v2.0**, matching the git tag and milestone a visitor finds on GitHub. The binary prints `box 0.1.0` because Cargo.toml was never bumped, so the terminal loop never shows `--version`. box's status word is drafted under D-16 (e.g. "Shipped"). coin-flip's status is **"v1 · on device"**, and its repo shows as text under D-12.
- **D-30: coin-flip candor is honest, in general terms.** v1 runs on Tim's device but is not finished: smoothing the toss and the camera follow, and then a Play Store release, are still ahead. Next steps and the route log name that work in plain words, without defect or backlog IDs, internals or test evidence (D-23). Nothing on the page claims the app is finished, polished or store-ready.

### Claims & case-study content (ENG-02, ENG-04)
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

### Route log (ROUTE-01 to ROUTE-03)
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

### Cross-phase copy
- **D-33: Home's About copy loses its CLI_X sentence.** `data/home.ts` (approved in Phase 9) says Tim builds "CLI_X, a command-line tool that turns plain language into safe shell commands". CLI_X is discontinued, so the sentence is rewritten under D-16 to name box and/or coin-flip, and Tim approves it with the other copy. The `home` visual baselines re-baseline in the phase re-baseline. `components/Footer.tsx` still links to `/projects/clix-*`. It is a v1 legacy file with no importer, and Phase 12 deletes it. Leave it unless a guard flags it.

### Checkpoints (gating inputs)
- **D-21: Amended. The remaining inputs from Tim, grouped into as few checkpoints as possible:**
  1. the claims audit (D-09);
  2. the copy (D-16), including the box terminal transcript (D-26), the box dry-run capture (D-25) and the Home sentence (D-33);
  3. route-log confirmation and `surveyedAt` (D-17, D-20, D-32);
  4. the unanswered UI-SPEC defaults from packet §I that still apply: #1 roadmap h1, #2 priority, #3 descriptions, #5 panel walkthrough link, #6 primary CTA, #7 external-link behaviour, #8 pause-toggle label, #9 trail red and blue paint, #10 filter counts, #11 copy button (#4 risk-scale ticks is void);
  5. the coin-flip clip (D-27), a separate human-action checkpoint because it needs the device. Only the Demo section depends on it, so it can arrive late.

  Already answered in this discussion, so not re-asked: the trail pair and assignment (D-07), the metric picks (D-28, still audited), the box version (D-29), coin-flip candor (D-30), and the stale rows (D-32). Each input arrives as quoted text in a SUMMARY before its consumer runs, so nothing ships invented.

### Claude's Discretion
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 11: Engineering & Roadmap": goal, success criteria and inputs from Tim. The goal still names CLI_X and SC3 is the retired ENG-03; both are rewritten under D-24.
- `.planning/REQUIREMENTS.md`: ENG-01, ENG-02, ENG-04, ENG-05 and ROUTE-01 to ROUTE-03; ENG-03 is dropped (D-24); ENG-F1 stays deferred; SEO-02 is Phase 12.
- `.planning/PROJECT.md` §Constraints (dark-only, ui-ux-pro-max required for all UI work, same-origin assets) and §Key Decisions ("Retire hex project cards", "Defer … terminal step controls/transcript").
- `.planning/STATE.md` §Blockers/Concerns: the 2026-11-01 project swap, with Tim's literal reply at the 11-02 checkpoint.

### The two projects (external repos)
- `github.com/tlex-web/box` (public): `README.md` (the 23 tools, safe-by-default gate, `--json`/`--clip`, install); `.planning/MILESTONES.md` (v1.0 shipped 2026-06-24; v2.0 shipped 2026-07-14 with 507 tests, 15,649 Rust LOC and the three gated destructive flags); `.planning/ROADMAP.md` (next milestone undefined); `Cargo.toml` (version 0.1.0, the crates for Stack).
- `github.com/tlex-web/coin-flip` (**private**, read-only via `gh`; D-23 applies): `.planning/PROJECT.md` (what the app is, validated features, out of scope, constraints); `.planning/ROADMAP.md` (v1 phases; a later Play Store milestone); `.planning/STATE.md` (v1.0 closed 2026-08-09). Nothing from these files is pasted into public docs.

### Carried-over phase artifacts
- `.planning/phases/11-engineering-roadmap/11-01-SUMMARY.md`: what 11-01 built (`lib/demo-terminal.ts`, `components/projects/DemoTerminal.tsx`, the server route) and the open question that D-02 now answers (option B).
- `.planning/phases/11-engineering-roadmap/11-CONTENT-PACKET.md`: **superseded**, except §A (trail table: official listings, SAC grades, DEM heights, via-point note), §G1 (git-verified portfolio rows) and §I (UI-SPEC defaults, still unanswered).
- `.planning/phases/11-engineering-roadmap/11-UI-SPEC.md`: **needs revision.** Remove RiskScale, risk badges, pricing and clix-website. Add the clip Demo, the per-project Safety/Privacy heading, the dry-run block, the terminal note line and the D-02 amendment.
- `.planning/phases/11-engineering-roadmap/11-RESEARCH.md`, `11-PATTERNS.md`, `11-VALIDATION.md`: CLI_X-specific in parts, so refresh them in re-planning (`--research`).
- `.planning/phases/11-engineering-roadmap/deferred-items.md`: the dev-server flakes logged by 11-01.

### Research (milestone-level)
- `.planning/research/FEATURES.md` §PROJ, §CASE, §TERM, §ROUTE (lines ~177–279): expected behaviour and anti-features. §RISK is void with ENG-03 retired.
- `.planning/research/ARCHITECTURE.md` §component table (~92–95), §file tree (~123–135), §CaseStudy composition (~406–407), §replaced/renamed (~484–494): `RoutePanel`, `CaseStudy` + `blocks/*`, `TrailGradeMark`, `DemoTerminal`, `RouteLog`. `RiskScale` is no longer built.
- `.planning/research/PITFALLS.md` (line ~155): the test-contract table; a component and its tests are rewritten in the same commit.

### Prior phase decisions that bind this phase
- `.planning/phases/08-data-terrain-pipeline/08-CONTEXT.md`: D-14 (11 km sheet extent), D-17 (DEM heights), D-22 (real output only, never invented), D-05 (Claude drafts copy, Tim approves).
- `.planning/phases/10-photography/10-CONTEXT.md`: D-07 (missing fields are left out, never filled), D-14 (segmented control with `router.replace`, no history entries).
- `.planning/phases/09-home-ascent/09-CONTEXT.md` and `data/home.ts`: the approved Home About copy that D-33 rewrites.

### Design system & UI contracts
- `.planning/phases/07-foundation-guardrails/07-UI-SPEC.md`: tokens v2, spacing, typography roles, the single-primary-action rule, motion rules.
- `.planning/phases/09-home-ascent/09-UI-SPEC.md` §"Trail yellow" (line ~136): `bg-trail`, with trail yellow kept outside `--color-*`.
- `.planning/phases/08-data-terrain-pipeline/08-UI-SPEC.md`: the footer legend glyphs and the footer "Last surveyed" (D-20 must not be confused with it).
- `.planning/phases/10-photography/10-UI-SPEC.md`: segmented-control styling precedent.

### Guardrails & process
- `e2e/visual/README.md`: visual baselines. `clix-cli` and `clix-website` are replaced by `box` and `coin-flip`; `projects`, `roadmap` and `home` (D-33) re-baseline. Only Tim commits PNGs.
- `scripts/guards/check-palette.mjs`, `check-contrast.mjs`, `test-count.mjs`, `check-identity.mjs`, and the served-image guard (`guard:images`; extend it for video, D-27). Tests are rewritten, never deleted; the ratchet stands at jest 973 + e2e 376 = 1349 after 11-01.
- `proxy.ts`: the CSP has `default-src 'self'` and no `media-src`, so same-origin video is allowed.

### External
- SAC hiking scale (T1–T6) and the official zermatt.swiss listings for Hörnliweg No. 27 and Zmutt path No. 2, with URLs quoted in packet §A.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/demo-terminal.ts` and `components/projects/DemoTerminal.tsx` (11-01): a pure state machine and a client island with all pause sources, dots, reduced motion and sr-only text. Retarget them to box commands and apply the D-02 amendment. The island takes only `demoCommands` props.
- `app/(site)/projects/[slug]/page.tsx` (11-01): a Server Component with `dynamicParams = false`, `generateStaticParams` and `generateMetadata`. The new slugs flow through it unchanged.
- `lib/trail-grade.ts`: keep the marker-glyph vocabulary for the badges and drop the score bands (D-24). It is imported only by `data/schemas/project.ts` and the tests (`lib/__tests__/trail-grade.test.ts`, `data/__tests__/projects.test.ts`).
- `data/schemas/project.ts`: a zod discriminated union on `slug`. It becomes `box` and `coin-flip` schemas. It loses `RiskLevel`, `RiskScaleBlock`, `PricingBlock` (unless reused), `features`, `riskLevel` and `riskScore`, and gains the optional terminal note (D-26) and the clip block or fields (D-27).
- `lib/terrain/dem-sample.ts`, `lib/terrain/heightmap.ts`, `lib/geo.ts` and `scripts/terrain/build-terrain.mjs` (`--check`): DEM sampling and the generated-data pattern for the D-05 profile glyphs.
- `app/globals.css`: `--trail-yellow` and `@utility bg-trail`.
- `components/RoadmapFilters.tsx`, `RoadmapTimeline.tsx`, `RoadmapProgress.tsx`: v1 logic to fold into `RouteLog` and the filter island (drop the emoji-era icons).
- The local box binary at `%LOCALAPPDATA%\Programs\box\box.exe` (box 0.1.0) predates v2.0, so it is not used for captures. The D-25 and D-26 output comes from a scratchpad build of the `v2.0` tag with `cargo` 1.98.1 (D-34).

### Established Patterns
- Tests are rewritten, never deleted: `components/__tests__/ProjectCard.test.tsx` → RoutePanel; `RoadmapFilters.test.tsx` and `RoadmapTimeline.test.tsx` → RouteLog and filters; `e2e/projects.spec.ts`. `e2e/case-study.spec.ts` currently finds the CLI_X `pkill` command by its output, so rewrite it against box. `e2e/shell.spec.ts` (`/projects/clix-cli` → Engineering), `e2e/no-webgl.spec.ts`, `components/site/__tests__/SiteChrome.test.tsx` and `data/__tests__/fixtures/legacy-highlights.json` all reference CLI_X slugs.
- Visual baselines come only from the CI `workflow_dispatch` container, and Tim commits the PNGs. The terminal is paused or shows full text under the visual run, and the clip shows its poster.
- Segmented controls in the URL use `router.replace(..., { scroll: false })` and add no history entries (Phase 10).
- Generated data is committed and checked offline in lint (`--check`), never computed at request time.
- Media derivatives are produced locally by a script and committed (the Phase 8 `photos:derive` pattern), with metadata stripped and content-hashed names. The clip should follow this pattern.

### Integration Points
- `app/(site)/projects/page.tsx` and `app/(site)/roadmap/page.tsx` are still `'use client'`. Both become Server Components, with client islands only for the filter (and the terminal on case studies), and export metadata.
- `data/types.ts` `RoadmapItem`: area changes to `'portfolio' | 'box' | 'coin-flip'`, and it gains `order`, `completedAt`, nested phases for v2.0 (D-18) and `surveyedAt` alongside it (D-20).
- `data/projects.ts` and `data/roadmap.ts` are rewritten for the new projects. Case-study "Next steps" link to route-log row ids, so keep both sides in step.
- `data/home.ts` About body: the CLI_X sentence goes (D-33).
- The v1 code to retire is unchanged from the first pass, minus what 11-01 already deleted (`ProjectDetailClient`, `HologramTerminal`, `HologramTerminalDemo`): `components/ProjectCard.tsx`, `lib/useHexGrid.ts`, `.hex-grid`/`hex-clip`, `ProjectHighlights`, `FeatureShowcase`, `lib/legacy-highlights.ts`, and `RoadmapProgress`/`RoadmapTimeline` once folded in. `LEGACY_COMPILER_FILES` (3 entries left) shrinks as files leave.

### Verified facts (2026-11-01)
- `tlex-web/box` is PUBLIC (Rust; v2.0 tag; last push 2026-07-14; no GitHub release object). Its `Cargo.toml` version and the binary's `--version` both read 0.1.0.
- `tlex-web/coin-flip` is PRIVATE (Kotlin, Python and shell; v1.0 tag; last push 2026-08-10).
- The local box binary runs (`box 0.1.0`).
- `proxy.ts` CSP: `default-src 'self'`, no `media-src`.
- CLI_X references (`git grep -i -E "clix|cli_x|cli-x"`) appear in 26 tracked files under app, components, lib, data and e2e, including `e2e/visual/routes.spec.ts` (the visual route list) and `lib/demo-terminal.ts`.

</code_context>

<specifics>
## Specific Ideas

- One signage system, simpler now: the marker glyph plus grade appears only on real trails (panel and trailhead badges), with captions like a trail signpost, e.g. `Schwarzsee 2,587 m → Hörnlihütte 3,262 m · T4`.
- box shows rather than tells: real captured output in the terminal and in the Safety dry-run block. The terminal loop makes the case for "a scriptable toolkit": BLAKE3, `--json` and a PowerShell pipeline.
- coin-flip's story is "fair by construction": the draw happens first and the animation lands on it. That is the Pipeline. Privacy (zero permissions, offline, no trackers) is the safety slot.
- Honest framing for unfinished work: "v1 · on device", with the remaining polish named in plain words.
- The private-repo note stays honest: "Source: private repository · Ask for a walkthrough →".
- The route log reads as a climb from Base through Current camp to Summit. Its date reads "Route log surveyed <date>", which can't be confused with the map sheet's terrain survey.

</specifics>

<deferred>
## Deferred Ideas

- **Terminal step controls and static transcript (ENG-F1):** still deferred.
- **Bump box's `Cargo.toml` version to match the v2.0 tag:** Tim's work in the box repo, outside this codebase. Once done, the terminal could show `--version`.
- **A defined next box milestone:** if Tim defines one, adding a planned route-log row is a data edit.
- **Making coin-flip public:** once the repo is public, enabling its link is a data edit under D-12.
- **OG images for project pages (SEO-02):** Phase 12, using the `generateMetadata` export already added in 11-01.
- **Deleting `components/Footer.tsx`** (v1 legacy, still links to `/projects/clix-*`, no importer): Phase 12 dead-code cleanup.

</deferred>

---

*Phase: 11-engineering-roadmap*
*Context gathered: 2026-11-01 (updated 2026-11-01 for the box + coin-flip swap)*
