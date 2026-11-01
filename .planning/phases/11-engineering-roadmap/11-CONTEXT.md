# Phase 11: Engineering & Roadmap - Context

**Gathered:** 2026-11-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Tim's engineering work reads as surveyed routes, and his roadmap reads as a route log:

- **`/projects`:** full-width `RoutePanel`s (name, pitch, metric strip, trail-grade badge, elevation-profile glyph). The hex cards, `useHexGrid`, the `hex-grid` CSS and `hex-clip` are removed everywhere (ENG-01).
- **`/projects/[slug]`:** a `CaseStudy` template with fixed section order (problem, pipeline diagram, safety, metrics, demo, stack, next steps), driven by the Phase 8 typed highlight blocks. Any section without data is left out (ENG-02). Metrics form an instrument panel in tabular numerals with a context line, and every claim is sourced or softened (ENG-04).
- **Safety:** CLI_X's four risk bands appear as Swiss trail grades, built on `lib/trail-grade.ts`. Each band has its marker glyph, text label and score range, followed by an equivalent data table (ENG-03).
- **Terminal:** the demo terminal is restyled to tokens v2, stops auto-playing on focus, on hover and under reduced motion, and has a pause button (ENG-05).
- **`/roadmap`:** a `RouteLog` on a vertical elevation axis (completed below, in progress at the current camp, planned above). A segmented project and status filter lives in the URL, and filters with no items are removed or disabled. Items carry order and completion dates, v2.0 is listed as in progress, and the page shows a "last surveyed" date (ROUTE-01 to ROUTE-03).
- Project routes stay Server Components that export metadata, so Phase 12 can attach OG images (SEO-02).

Requirements: ENG-01 to ENG-05 and ROUTE-01 to ROUTE-03. Out of scope here: terminal step controls and a static transcript (ENG-F1, deferred), OG images (SEO-02, Phase 12), the summit-register contact page and dead-code cleanup (Phase 12).

</domain>

<decisions>
## Implementation Decisions

### Terminal demo (ENG-05)
- **D-01: Flat token terminal; the 3D laptop is retired.** The terminal becomes a 2D panel: mono text in a `surface-raised` frame with a title bar. `HologramTerminal.tsx` (R3F laptop, drei `<Html>`, `ParticleField`) and `HologramTerminalDemo.tsx` are replaced by a `DemoTerminal` client island. three.js and R3F never load on project pages. The heading "Experience CLI_X in 3D" and its copy are rewritten under the copy checkpoint (D-21).
- **D-02: Pause behaviour.** Hover and focus-within pause autoplay *temporarily*, and leaving resumes it. The Pause/Play button (`aria-pressed`) is *sticky*: after the visitor presses Pause, nothing resumes until they press Play. Autoplay also pauses offscreen (IntersectionObserver) and when the tab is hidden (`visibilitychange`). Under reduced motion there is no typing animation and the demo starts paused with full text, as it does today. Tests assert state (`aria-pressed`, the paused/playing state), not classes.
- **D-03: Keep the existing per-command selector dots** (`aria-label="Go to command N"`), restyled. They are current functionality, and removing them would be a regression. Previous/next step buttons and the transcript remain ENG-F1 (deferred).
- **D-04: Risk badge = marker glyph + grade + level + score**, e.g. `[yellow marker] T1 · Low · 0.05`, followed by the command's `explanation` or `warning` line. It uses the same wording, glyphs and order as the risk scale and its table (D-11), so the terminal and the safety section read as one system. It replaces the `riskColors` pills.

### Route panels (ENG-01)
- **D-05: The glyph is a real DEM trail profile.** It is a build-time SVG elevation profile sampled from the Phase 8 heightmap along a real marked trail inside the 11 km sheet extent (08 D-14), with zero client JS and deterministic output. Generate it in the terrain or data pipeline, with an offline `--check` like the other generated data, rather than at request time. The glyph is decorative (`aria-hidden`), and its meaning is carried by the caption text (D-07). No screenshots (this answers the roadmap's "Inputs from Tim" glyph question).
- **D-06: A project's trail-grade badge is the real SAC grade of the trail its glyph draws.** The profile and the badge describe one real route, so nothing is invented, and the badge makes no claim about the code. It therefore cannot collide with CLI_X's command-risk meaning of the same scale. The badge uses the same marker glyph set as D-04 and D-11.
- **D-07: Claude proposes the two trails, and Tim approves them at a checkpoint.** Research picks two real marked hiking trails inside the sheet. Each needs a sourced SAC grade (swisstopo, SAC, or the official Zermatt trail listings, with the URL quoted) and start and end heights sampled from the DEM (D-17 rule from Phase 8: DEM heights, not brochure heights). Tim approves the pair and the project-to-trail assignment, like the Riffelsee pin at 08-10. Each glyph gets a caption in the form `Start 2,583 m → End 3,260 m · T3`. These numbers are illustrative only; research supplies the real ones.
- **D-08: The website panel's metric strip uses countable facts already in the data**, e.g. version, number of platforms and number of technologies, in the same tabular-numeral style as CLI_X's strip (startup, tests, providers). No new claims, and no input from Tim. If D-15 removes the `features` field, the counts must come from fields that remain, or from a small typed field added for the purpose.

### Claims & case-study content (ENG-02, ENG-04)
- **D-09: Claims audit at a checkpoint.** Claude drafts a table: claim · where it appears · current wording · proposed soft wording · what would source it. It covers at least "95% accuracy", "~90ms (40% faster)", "40-60% API cost reduction", "<100ms startup", "enterprise-grade safety", "ML-inspired", "Accessibility compliant (WCAG 2.1)", "PCI-compliant payments", "850+ tests / 100% pass rate" and the docs line counts. Tim marks each row `source: <link or how measured>`, `soften` or `cut`. A context line such as "measured on v2.4.0" appears only where Tim confirms it, so no provenance is invented. Values render final immediately, with no count-up.
- **D-10: Medium and High demo commands come from Tim at a human-action checkpoint**, following the 08-03 pattern. The real scores are 0.05, 0.15, 0.29 (all Low) and 0.87 (Critical), so T2–T3 and T4–T5 have no example. (The roadmap's "Medium and Critical" wording predates 08-03's rescoring: Critical is already covered by `pkill -f chrome`, and the gap is Medium and High.) Tim runs one medium-risk and one high-risk request through CLI_X and pastes the input, output, `riskScore` and the warning or explanation verbatim. The new commands join the scale ticks, the table and the terminal loop. Nothing is invented (08 D-22). If Tim cannot supply one, its band shows range and label with no tick.
- **D-11: Per-grade behaviour lines are drafted from the CLI_X source and confirmed by Tim.** Research reads the private `tlex-web/cli_x` repo through Tim's authenticated `gh` (read-only) to learn what CLI_X does at each band (e.g. runs, warns, asks for confirmation, blocks) and how the 11 rules feed the score. It drafts one line per grade, and Tim corrects them at the same checkpoint as D-10. **Constraint:** the portfolio repo and its `.planning/` docs are **public**. Research must summarise behaviour in its own words and must not paste private CLI_X source, file paths or internals into RESEARCH.md, plans or commits. Only the Tim-approved lines ship.
- **D-12: Links render only if Tim has verified them; a private repo is shown as text.** On 2026-11-01 all four project URLs were dead to the public: `github.com/tlex-web/cli_x` returned 404 (the repo is private), `github.com/tlex-web/cli_x-website` doesn't exist, and `cli-x.com` and `docs.cli-x.com` did not resolve. At the checkpoint, Tim confirms which URLs are live, and only those render, on the trailhead and the panels. A private repo shows as plain text, "Source: private repository", with an "Ask for a walkthrough →" link to `/contact`. A data-level check (a unit test or schema, with no network calls in CI) stops a known-dead URL coming back by accident. — **Reversibility:** reversible — each link is a data edit once its target goes live.
- **D-13: Pricing becomes one line in the Problem copy, with no price figures.** For example: "a free bring-your-own-key tier and a Pro subscription, sold through Stripe". The `$9.99/mo`, `$99/yr` and `10/day` figures are dropped, because they go stale, they are sales copy for another site, and with cli-x.com down there is nothing to link them to. The `pricing` block leaves the website case study, and the schema tuple changes to match.
- **D-14: Pricing is not a case-study section.** The ENG-02 order is fixed: problem → pipeline → safety → metrics → demo → stack → next steps. For clix-website, the `security` list maps to Safety and the `techStack` groups map to Stack. Pipeline and Demo appear only if the data supports them (see Claude's Discretion).
- **D-15: The 14-item `features` lists are folded into their sections, and the rest is cut.** Each feature that matters moves into its section: the 4 pipeline stages into Pipeline, the 11 rules into Safety, caching into Metrics, providers into Stack. Duplicates and unbacked claims go through the D-09 audit. No separate features list remains, `FeatureShowcase` is retired, and the `features` field leaves the data and schema. Tests that read it are rewritten, not deleted.
- **D-16: Claude drafts all new copy and Tim approves it** before it ships (carried forward from 08 D-05). The copy is first person, short and factual. It covers the problem/outcome statements for both projects, the section intros, the terminal heading, the panel pitches, and the route-log page copy.

### Route log (ROUTE-01 to ROUTE-03)
- **D-17: Claude drafts the portfolio entries, and Tim fills in CLI_X and the website at a checkpoint.** Claude drafts the portfolio rows from git, `.planning/MILESTONES.md` and `.planning/PROJECT.md`, with real `completedAt` dates: v1.0 shipped 2026-03-12, and Phases 7 and 8 completed on 2026-10-24, Phase 9 on 2026-10-25 and Phase 10 on 2026-10-26, according to their completion and transition commits. Claude also proposes keeping, rewriting or retiring each stale item (e.g. "3D Image Gallery Enhancement v1.1.0", which Phase 10 effectively shipped, and "Photography Blog v1.2.0"). Tim confirms, and supplies status, order and `completedAt` for the CLI_X and website items, which only he knows (whether the current "in progress" items are still in progress, and when the "completed" v2.4.0 items shipped). Only Tim-confirmed dates ship.
- **D-18: v2.0 is one in-progress entry with its phases inside it.** v1.0 is a completed entry dated 2026-03-12. "v2.0 Topographic Identity" sits at the current camp, and its disclosure lists Phases 7–12, each with its completion date or status. This keeps the log balanced across the three projects while still showing dated progress.
- **D-19: The axis has three labelled bands and order ticks, with no metre figures.** The bands are Base (completed, at the bottom), Current camp (in progress, in the middle, emphasised) and Summit (planned, at the top). Each item gets one tick in data order, and completed items show their completion dates. There are no altitude numbers (false precision, against the real-data rule), no Gantt or time scale, and no percent bars. DOM order equals visual order (planned → in progress → completed, top to bottom; research FEATURES §ROUTE).
- **D-20: "Last surveyed" is a manual `surveyedAt` constant in the roadmap data**, labelled "Route log surveyed <date>", so it can't be confused with the footer's terrain "Last surveyed" date (Phase 8). A unit test fails if it is in the future or earlier than the newest `completedAt`. Tim sets the value at the D-17 checkpoint.

### Checkpoints (gating inputs)
- **D-21: Tim's content inputs gate planning output, so collect them early and in as few checkpoints as possible.** They are: the D-10 demo commands, the D-11 behaviour lines, the D-09 claims audit, the D-12 link verification, the D-17 and D-20 route-log data and `surveyedAt`, the D-07 trail pair, and the D-16 copy. Before execution reaches each consumer, its input arrives as quoted text in a SUMMARY, so nothing ships invented. Grouping and order are the planner's call.

### Claude's Discretion
- Whether clix-website gets a Pipeline section (e.g. checkout → Stripe webhook → licence signing → download) built from its existing data. Include it only if the drafted copy is factual, and Tim approves it at the D-16 copy checkpoint; otherwise the section is left out.
- The URL parameter names and values for the route-log filter (research used `?area=cli`; the requirement says "project and status"), using `router.replace` with no history entries and `{ scroll: false }` (10 D-14 pattern). The "Next steps" rows on the case study link to the filtered log and to `#<item-id>` anchors. Once shipped these URLs are shareable, so pick stable names.
- Segment counts and the disabling logic. "Other" (zero items) is removed. Segments that would return zero items under the other filter's current value are disabled (`aria-disabled`, still announced) or hidden. A polite live region announces the result count.
- The marker glyph set (yellow T1, white-red-white, white-blue-white, unmarked as a dashed outline that doesn't look broken). Trail yellow is painted only through the existing `bg-trail` utility and `--trail-yellow`, which stays outside `--color-*` (09-UI-SPEC "Trail yellow"). Extending `bg-trail` beyond the Phase 9 trail-sign tip is allowed and should be recorded in the UI-SPEC.
- The risk scale form (a horizontal 0–1 bar split into bands with demo ticks that are keyboard-focusable, per research FEATURES §RISK), the on-page route index or scroll-spy, the trailhead block, the "Next route" link and the contact CTA. These go to the UI-SPEC.
- Which 2–3 CLI_X metrics go in its panel strip (after the D-09 audit).
- Terminal layout details: wrapping long output on narrow screens, the live-region wording and the copy button (optional).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 11: Engineering & Roadmap": goal, success criteria 1–5, scope notes, inputs from Tim (all of them answered or routed to checkpoints by D-07, D-09 to D-12, D-17 and D-20)
- `.planning/REQUIREMENTS.md`: ENG-01 to ENG-05, ROUTE-01 to ROUTE-03, ENG-F1 (deferred step controls and transcript), SEO-02 (Phase 12)
- `.planning/PROJECT.md` §Constraints (dark-only, ui-ux-pro-max required for all UI work, same-origin assets) and §Key Decisions ("Retire hex project cards", "Defer … terminal step controls/transcript")

### Research (milestone-level, already done)
- `.planning/research/FEATURES.md` §PROJ, §CASE, §RISK, §TERM, §ROUTE (lines ~177–279): expected behaviour, table stakes and anti-features for every Phase 11 surface. D-01 to D-20 refine or override it: the website strip (D-08), pricing (D-13 overrides "link to cli-x.com"), features (D-15 overrides "top 5 + disclosure"), and the axis (D-19). The status filter stays, because ROUTE-02 requires it, even though FEATURES calls it redundant.
- `.planning/research/ARCHITECTURE.md` §component table (lines ~92–95), §file tree (~123–135), §CaseStudy composition (~406–407), §replaced and renamed list (~484–494): `RoutePanel`, `CaseStudy` + `blocks/*`, `TrailGradeMark`, `DemoTerminal`, `RouteLog`, and which v1 components retire
- `.planning/research/PITFALLS.md` (line ~155): the test-contract table; a component and its tests are rewritten in the same commit (ProjectCard → RoutePanel)
- `.planning/research/SUMMARY.md` (lines ~74, 122–125, 155–156): data gaps G9, G10, G11 and the Phase 11 deliverables

### Prior phase decisions that bind this phase
- `.planning/phases/08-data-terrain-pipeline/08-CONTEXT.md`: D-14 (11 km sheet extent), D-17 (DEM heights), D-22 (real riskScores only), D-05 (Claude drafts copy, Tim approves)
- `.planning/phases/08-data-terrain-pipeline/08-03-SUMMARY.md`: Tim's riskScores and the confirmed band boundary rule; no Medium example was supplied
- `.planning/phases/10-photography/10-CONTEXT.md`: D-07 (missing fields left out, never filler), D-14 (segmented control with `router.replace`, no history entries)

### Design system & UI contracts
- `.planning/phases/07-foundation-guardrails/07-UI-SPEC.md`: tokens v2, spacing, typography roles, the single-primary-action rule, motion rules
- `.planning/phases/09-home-ascent/09-UI-SPEC.md` §"Trail yellow" (line ~136): the `bg-trail` utility, and trail yellow kept outside `--color-*`
- `.planning/phases/08-data-terrain-pipeline/08-UI-SPEC.md`: the footer legend glyphs (dashed "approx." tick) and the footer "Last surveyed" (D-20 must not be confused with it)
- `.planning/phases/10-photography/10-UI-SPEC.md`: segmented-control styling precedent

### Guardrails & process
- `e2e/visual/README.md`: visual baselines (the `projects`, `clix-cli`, `clix-website` and `roadmap` shots re-baseline; only Tim commits PNGs)
- `scripts/guards/check-palette.mjs`, `scripts/guards/check-contrast.mjs`, `scripts/guards/test-count.mjs`, `scripts/guards/check-identity.mjs`: no stock palette or `dark:`, every new text/background pair must pass contrast, tests are rewritten and never deleted (ratchet: jest 942, e2e 358)

### External
- SAC hiking scale (T1–T6) and the swisstopo/Zermatt trail listings: research quotes the source URL for each trail grade it proposes (D-07)
- Private `tlex-web/cli_x` repo, read-only through `gh` (D-11): its contents must not be copied into public planning docs

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/trail-grade.ts`: `RISK_BANDS` (T1 yellow / T2–T3 white-red-white / T4–T5 white-blue-white / T6 unmarked), `bandFor(score)`, `isScoreInLevel`. Zero imports; build `RiskScale`, the badges and the table on it.
- `data/schemas/project.ts`: a zod discriminated union on `slug` with highlight tuples (`MetricsBlock`, `RiskScaleBlock`, `PricingBlock`, `ListBlock`, `StackBlock`) and `DemoCommandSchema` with a required `riskScore`. It changes under D-13 (the website tuple loses pricing) and D-15 (`features` removed).
- `lib/legacy-highlights.ts`: the Phase 8 adapter back to the v1 record for `ProjectHighlights`. It goes away once `CaseStudy` reads the blocks directly.
- `lib/terrain/dem-sample.ts`, `lib/terrain/heightmap.ts`, `lib/geo.ts` and `scripts/terrain/build-terrain.mjs` (`--check`): DEM sampling and the generated-data pattern for the D-05 profile glyphs.
- `app/globals.css`: `--trail-yellow` and `@utility bg-trail` (lines ~48–51 and ~328–331).
- `components/HologramTerminalDemo.tsx`: the existing typing loop, the reduced-motion start-paused logic (`playOverride`) and the dot selectors. Port the behaviour into `DemoTerminal`; drop the motion `AnimatePresence` if the token design doesn't need it.
- `components/RoadmapFilters.tsx`, `RoadmapTimeline.tsx`, `RoadmapProgress.tsx`: v1 logic to fold into `RouteLog` and the filter island (remove the emoji icons).

### Established Patterns
- Tests are rewritten, never deleted: `components/__tests__/ProjectCard.test.tsx` → RoutePanel, `RoadmapFilters.test.tsx` and `RoadmapTimeline.test.tsx` → RouteLog and filters, `e2e/projects.spec.ts` (accessible names "Programming Projects" and "View details for", which you either keep or update together with the test).
- Visual baselines come only from the CI `workflow_dispatch` container; Tim commits the PNGs. The terminal must be deterministic in screenshots (paused or full-text state under the visual run).
- Segmented controls in the URL use `router.replace(..., { scroll: false })` and add no history entries (Phase 10).
- Generated data is committed and checked offline in lint (`--check`), never computed at request time.

### Integration Points
- `app/(site)/projects/page.tsx` and `app/(site)/roadmap/page.tsx` are `'use client'` today. They must become Server Components (with client islands only for the terminal and the filter) and export metadata. `app/(site)/projects/[slug]/page.tsx` has no `generateMetadata` yet; add it for SEO-02 (Phase 12).
- `data/types.ts` `RoadmapItem` (area `'portfolio' | 'cli' | 'webshop' | 'other'`, no `order`, `completedAt` or phases). It needs `order`, `completedAt` and nested phases for the v2.0 entry (D-18), and `surveyedAt` lives alongside it (D-20).
- `data/projects.ts` `roadmapItems` ids (`cli-*`, `webshop-*`) link the case-study "Next steps" to route-log rows; keep the ids stable or update both sides.
- The v1 code to retire: `components/ProjectCard.tsx`, `lib/useHexGrid.ts`, `.hex-grid`/`hex-clip` in `app/globals.css`, `ProjectHighlights`, `FeatureShowcase`, `ProjectDetailClient`, `HologramTerminal`, `HologramTerminalDemo`, and `RoadmapProgress`/`RoadmapTimeline` once folded in. `TechStackDisplay` is restyled or folded into the Stack block. Update `LEGACY_COMPILER_FILES` as files leave.

### Verified facts (2026-11-01)
- The tlex-web/cli_x repo is PRIVATE (`gh repo view`); `tlex-web/cli_x-website` does not exist; `cli-x.com` and `docs.cli-x.com` did not resolve.
- The roadmap data has no v2.0 entry and no dates; "Other" has zero items.

</code_context>

<specifics>
## Specific Ideas

- The trail-grade vocabulary is the same everywhere: the terminal badge, the risk scale, the table and the panel badge all use the marker glyph + "T1 · Low · 0.05" style, so the site reads as one signage system.
- The glyph caption reads like a trail signpost: `Start · height → End · height · grade`.
- The route log reads as a climb, from Base up through Current camp to Summit. Label its date "Route log surveyed <date>" so it can't be confused with the map sheet's terrain survey.
- The private repo note is honest: "Source: private repository · Ask for a walkthrough →".

</specifics>

<deferred>
## Deferred Ideas

- **Terminal step controls and static transcript (ENG-F1):** these were already deferred and stay that way.
- **Fixing the project link targets** (making the `cli_x` repo public, publishing a website repo, getting `cli-x.com` and `docs.cli-x.com` live): Tim's own work outside this codebase. Once a target is live, enabling its link is a data edit under D-12.
- **OG images for project pages (SEO-02):** Phase 12, which needs the `generateMetadata` export added here.

</deferred>

---

*Phase: 11-engineering-roadmap*
*Context gathered: 2026-11-01*
