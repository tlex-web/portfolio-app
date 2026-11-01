# Phase 11: Engineering & Roadmap - Research

**Researched:** 2026-11-01
**Domain:** Next 16.4 Server Components with small client islands; typed project/roadmap data (zod 4); a build-time DEM trail-profile generator; content gating (claims, dates, CLI_X behaviour)
**Confidence:** HIGH for the codebase map, the Next patterns and the trail data. MEDIUM for the CLI_X behaviour lines (they come from reading code and need Tim's confirmation). The route-log dates and the claim dispositions depend on Tim by design.

> **PUBLIC-REPO NOTICE.** This file is committed to a public repository. The CLI_X sections below are written in my own words from a read-only look at the private `tlex-web/cli_x` repo through `gh`. They contain no source code, file paths, identifiers, rule IDs, weights or configuration names from that repo. Version numbers and release dates are included only as evidence for Tim to confirm or strike before they become site data.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Terminal demo (ENG-05)
- **D-01: Flat token terminal; the 3D laptop is retired.** The terminal becomes a 2D panel: mono text in a `surface-raised` frame with a title bar. `HologramTerminal.tsx` (R3F laptop, drei `<Html>`, `ParticleField`) and `HologramTerminalDemo.tsx` are replaced by a `DemoTerminal` client island. three.js and R3F never load on project pages. The heading "Experience CLI_X in 3D" and its copy are rewritten under the copy checkpoint (D-21).
- **D-02: Pause behaviour.** Hover and focus-within pause autoplay *temporarily*, and leaving resumes it. The Pause/Play button (`aria-pressed`) is *sticky*: after the visitor presses Pause, nothing resumes until they press Play. Autoplay also pauses offscreen (IntersectionObserver) and when the tab is hidden (`visibilitychange`). Under reduced motion there is no typing animation and the demo starts paused with full text, as it does today. Tests assert state (`aria-pressed`, the paused/playing state), not classes.
- **D-03: Keep the existing per-command selector dots** (`aria-label="Go to command N"`), restyled. They are current functionality, and removing them would be a regression. Previous/next step buttons and the transcript remain ENG-F1 (deferred).
- **D-04: Risk badge = marker glyph + grade + level + score**, e.g. `[yellow marker] T1 · Low · 0.05`, followed by the command's `explanation` or `warning` line. It uses the same wording, glyphs and order as the risk scale and its table (D-11), so the terminal and the safety section read as one system. It replaces the `riskColors` pills.

#### Route panels (ENG-01)
- **D-05: The glyph is a real DEM trail profile.** It is a build-time SVG elevation profile sampled from the Phase 8 heightmap along a real marked trail inside the 11 km sheet extent (08 D-14), with zero client JS and deterministic output. Generate it in the terrain or data pipeline, with an offline `--check` like the other generated data, rather than at request time. The glyph is decorative (`aria-hidden`), and its meaning is carried by the caption text (D-07). No screenshots (this answers the roadmap's "Inputs from Tim" glyph question).
- **D-06: A project's trail-grade badge is the real SAC grade of the trail its glyph draws.** The profile and the badge describe one real route, so nothing is invented, and the badge makes no claim about the code. It therefore cannot collide with CLI_X's command-risk meaning of the same scale. The badge uses the same marker glyph set as D-04 and D-11.
- **D-07: Claude proposes the two trails, and Tim approves them at a checkpoint.** Research picks two real marked hiking trails inside the sheet. Each needs a sourced SAC grade (swisstopo, SAC, or the official Zermatt trail listings, with the URL quoted) and start and end heights sampled from the DEM (D-17 rule from Phase 8: DEM heights, not brochure heights). Tim approves the pair and the project-to-trail assignment, like the Riffelsee pin at 08-10. Each glyph gets a caption in the form `Start 2,583 m → End 3,260 m · T3`. These numbers are illustrative only; research supplies the real ones.
- **D-08: The website panel's metric strip uses countable facts already in the data**, e.g. version, number of platforms and number of technologies, in the same tabular-numeral style as CLI_X's strip (startup, tests, providers). No new claims, and no input from Tim. If D-15 removes the `features` field, the counts must come from fields that remain, or from a small typed field added for the purpose.

#### Claims & case-study content (ENG-02, ENG-04)
- **D-09: Claims audit at a checkpoint.** Claude drafts a table: claim · where it appears · current wording · proposed soft wording · what would source it. It covers at least "95% accuracy", "~90ms (40% faster)", "40-60% API cost reduction", "<100ms startup", "enterprise-grade safety", "ML-inspired", "Accessibility compliant (WCAG 2.1)", "PCI-compliant payments", "850+ tests / 100% pass rate" and the docs line counts. Tim marks each row `source: <link or how measured>`, `soften` or `cut`. A context line such as "measured on v2.4.0" appears only where Tim confirms it, so no provenance is invented. Values render final immediately, with no count-up.
- **D-10: Medium and High demo commands come from Tim at a human-action checkpoint**, following the 08-03 pattern. The real scores are 0.05, 0.15, 0.29 (all Low) and 0.87 (Critical), so T2–T3 and T4–T5 have no example. (The roadmap's "Medium and Critical" wording predates 08-03's rescoring: Critical is already covered by `pkill -f chrome`, and the gap is Medium and High.) Tim runs one medium-risk and one high-risk request through CLI_X and pastes the input, output, `riskScore` and the warning or explanation verbatim. The new commands join the scale ticks, the table and the terminal loop. Nothing is invented (08 D-22). If Tim cannot supply one, its band shows range and label with no tick.
- **D-11: Per-grade behaviour lines are drafted from the CLI_X source and confirmed by Tim.** Research reads the private `tlex-web/cli_x` repo through Tim's authenticated `gh` (read-only) to learn what CLI_X does at each band (e.g. runs, warns, asks for confirmation, blocks) and how the 11 rules feed the score. It drafts one line per grade, and Tim corrects them at the same checkpoint as D-10. **Constraint:** the portfolio repo and its `.planning/` docs are **public**. Research must summarise behaviour in its own words and must not paste private CLI_X source, file paths or internals into RESEARCH.md, plans or commits. Only the Tim-approved lines ship.
- **D-12: Links render only if Tim has verified them; a private repo is shown as text.** On 2026-11-01 all four project URLs were dead to the public: `github.com/tlex-web/cli_x` returned 404 (the repo is private), `github.com/tlex-web/cli_x-website` doesn't exist, and `cli-x.com` and `docs.cli-x.com` did not resolve. At the checkpoint, Tim confirms which URLs are live, and only those render, on the trailhead and the panels. A private repo shows as plain text, "Source: private repository", with an "Ask for a walkthrough →" link to `/contact`. A data-level check (a unit test or schema, with no network calls in CI) stops a known-dead URL coming back by accident. — **Reversibility:** reversible — each link is a data edit once its target goes live.
- **D-13: Pricing becomes one line in the Problem copy, with no price figures.** For example: "a free bring-your-own-key tier and a Pro subscription, sold through Stripe". The `$9.99/mo`, `$99/yr` and `10/day` figures are dropped, because they go stale, they are sales copy for another site, and with cli-x.com down there is nothing to link them to. The `pricing` block leaves the website case study, and the schema tuple changes to match.
- **D-14: Pricing is not a case-study section.** The ENG-02 order is fixed: problem → pipeline → safety → metrics → demo → stack → next steps. For clix-website, the `security` list maps to Safety and the `techStack` groups map to Stack. Pipeline and Demo appear only if the data supports them (see Claude's Discretion).
- **D-15: The 14-item `features` lists are folded into their sections, and the rest is cut.** Each feature that matters moves into its section: the 4 pipeline stages into Pipeline, the 11 rules into Safety, caching into Metrics, providers into Stack. Duplicates and unbacked claims go through the D-09 audit. No separate features list remains, `FeatureShowcase` is retired, and the `features` field leaves the data and schema. Tests that read it are rewritten, not deleted.
- **D-16: Claude drafts all new copy and Tim approves it** before it ships (carried forward from 08 D-05). The copy is first person, short and factual. It covers the problem/outcome statements for both projects, the section intros, the terminal heading, the panel pitches, and the route-log page copy.

#### Route log (ROUTE-01 to ROUTE-03)
- **D-17: Claude drafts the portfolio entries, and Tim fills in CLI_X and the website at a checkpoint.** Claude drafts the portfolio rows from git, `.planning/MILESTONES.md` and `.planning/PROJECT.md`, with real `completedAt` dates: v1.0 shipped 2026-03-12, and Phases 7 and 8 completed on 2026-10-24, Phase 9 on 2026-10-25 and Phase 10 on 2026-10-26, according to their completion and transition commits. Claude also proposes keeping, rewriting or retiring each stale item (e.g. "3D Image Gallery Enhancement v1.1.0", which Phase 10 effectively shipped, and "Photography Blog v1.2.0"). Tim confirms, and supplies status, order and `completedAt` for the CLI_X and website items, which only he knows (whether the current "in progress" items are still in progress, and when the "completed" v2.4.0 items shipped). Only Tim-confirmed dates ship.
- **D-18: v2.0 is one in-progress entry with its phases inside it.** v1.0 is a completed entry dated 2026-03-12. "v2.0 Topographic Identity" sits at the current camp, and its disclosure lists Phases 7–12, each with its completion date or status. This keeps the log balanced across the three projects while still showing dated progress.
- **D-19: The axis has three labelled bands and order ticks, with no metre figures.** The bands are Base (completed, at the bottom), Current camp (in progress, in the middle, emphasised) and Summit (planned, at the top). Each item gets one tick in data order, and completed items show their completion dates. There are no altitude numbers (false precision, against the real-data rule), no Gantt or time scale, and no percent bars. DOM order equals visual order (planned → in progress → completed, top to bottom; research FEATURES §ROUTE).
- **D-20: "Last surveyed" is a manual `surveyedAt` constant in the roadmap data**, labelled "Route log surveyed <date>", so it can't be confused with the footer's terrain "Last surveyed" date (Phase 8). A unit test fails if it is in the future or earlier than the newest `completedAt`. Tim sets the value at the D-17 checkpoint.

#### Checkpoints (gating inputs)
- **D-21: Tim's content inputs gate planning output, so collect them early and in as few checkpoints as possible.** They are: the D-10 demo commands, the D-11 behaviour lines, the D-09 claims audit, the D-12 link verification, the D-17 and D-20 route-log data and `surveyedAt`, the D-07 trail pair, and the D-16 copy. Before execution reaches each consumer, its input arrives as quoted text in a SUMMARY, so nothing ships invented. Grouping and order are the planner's call.

### Claude's Discretion
- Whether clix-website gets a Pipeline section (e.g. checkout → Stripe webhook → licence signing → download) built from its existing data. Include it only if the drafted copy is factual, and Tim approves it at the D-16 copy checkpoint; otherwise the section is left out.
- The URL parameter names and values for the route-log filter (research used `?area=cli`; the requirement says "project and status"), using `router.replace` with no history entries and `{ scroll: false }` (10 D-14 pattern). The "Next steps" rows on the case study link to the filtered log and to `#<item-id>` anchors. Once shipped these URLs are shareable, so pick stable names.
- Segment counts and the disabling logic. "Other" (zero items) is removed. Segments that would return zero items under the other filter's current value are disabled (`aria-disabled`, still announced) or hidden. A polite live region announces the result count.
- The marker glyph set (yellow T1, white-red-white, white-blue-white, unmarked as a dashed outline that doesn't look broken). Trail yellow is painted only through the existing `bg-trail` utility and `--trail-yellow`, which stays outside `--color-*` (09-UI-SPEC "Trail yellow"). Extending `bg-trail` beyond the Phase 9 trail-sign tip is allowed and should be recorded in the UI-SPEC.
- The risk scale form (a horizontal 0–1 bar split into bands with demo ticks that are keyboard-focusable, per research FEATURES §RISK), the on-page route index or scroll-spy, the trailhead block, the "Next route" link and the contact CTA. These go to the UI-SPEC.
- Which 2–3 CLI_X metrics go in its panel strip (after the D-09 audit).
- Terminal layout details: wrapping long output on narrow screens, the live-region wording and the copy button (optional).

### Deferred Ideas (OUT OF SCOPE)
- **Terminal step controls and static transcript (ENG-F1):** these were already deferred and stay that way.
- **Fixing the project link targets** (making the `cli_x` repo public, publishing a website repo, getting `cli-x.com` and `docs.cli-x.com` live): Tim's own work outside this codebase. Once a target is live, enabling its link is a data edit under D-12.
- **OG images for project pages (SEO-02):** Phase 12, which needs the `generateMetadata` export added here.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENG-01 | `/projects` shows each project as a full-width route panel (name, pitch, metric strip, trail-grade badge, elevation-profile glyph); the hexagon cards and hex-grid code are removed | §Codebase Map (hex retire list), §D-07 Trail Proposal + Generator, Pattern 1 (Server page), Pattern 4 (profile glyph), D-08 strip sources |
| ENG-02 | Project pages follow a case-study structure (problem, pipeline diagram, safety, metrics, demo, stack, next steps) and omit any section that has no data | Pattern 2 (schema changes + exhaustive section map), §Codebase Map (`[slug]` conversion), Pitfalls 4, 7 |
| ENG-03 | CLI_X's four risk bands are shown as Swiss trail grades, each with its marker glyph, text label and score range, plus an equivalent data table | `lib/trail-grade.ts` quote, §D-11 Behaviour Lines, D-10 command suggestions, Pitfall 9 |
| ENG-04 | Metrics display as an instrument panel with tabular numerals and a context line, and every claim is either sourced or softened | §D-09 Claims Audit Draft (17 rows, with where each claim came from), schema `context` field |
| ENG-05 | The terminal demo uses tokens v2, stops auto-playing on focus, hover and under reduced motion, and has a pause button | Pattern 3 (DemoTerminal reducer), Pitfalls 1, 2, 3 (v1 timer leak, React Compiler lint, hydration of reduced motion) |
| ROUTE-01 | The roadmap shows items on a vertical elevation axis: completed below, in-progress at the current camp, planned above | Pattern 5 (sort/band pure functions), §D-17 Route-Log Draft |
| ROUTE-02 | A visitor can filter by project and status with a segmented control; the filter lives in the URL, and filters with no items are removed or disabled | Pattern 1 (`searchParams` on the server + `useOptimistic` island), Next docs quotes, Pitfall 5 |
| ROUTE-03 | Roadmap data includes an order and completion dates, lists v2.0 as in progress, and shows a "last surveyed" date | §D-17 Route-Log Draft (git-verified portfolio dates), new `RoadmapItem` shape, the `surveyedAt` test |
</phase_requirements>

## Project Constraints (from CLAUDE.md / AGENTS.md / PROJECT.md / memory)

| Source | Directive | Effect on plans |
|--------|-----------|-----------------|
| `AGENTS.md` | "This is NOT the Next.js you know … Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices." The block is re-added by `next dev`; committing it keeps the tree clean | Executors read the guides cited in §Next.js 16.4 Specifics before writing pages. If `AGENTS.md` shows up in a diff, commit it |
| Global `CLAUDE.md` (developer profile) | Present options in comparison tables and let Tim choose; diagnose before fixing; flag regression risks explicitly; lead with working examples | Checkpoints present options as tables (trail pair, stale-item dispositions). Plans carry a test-contract table (Pitfall 6) |
| Memory: ui-ux-pro-max | Tim requires the `ui-ux-pro-max` skill for all UI/UX work | **Every executor of a UI task (RoutePanel, CaseStudy blocks, TrailGradeMark, RiskScale, DemoTerminal, RouteLog, RouteLogFilters) must invoke the `ui-ux-pro-max` skill (`.claude/skills/ui-ux-pro-max/`) before writing markup** |
| `PROJECT.md` §Constraints | Dark only; same-origin assets; ui-ux-pro-max for all UI | No `dark:` variants; the trail profile is inline SVG, with no external asset |
| Memory: visual re-baseline via gh | Claude dispatches the CI visual workflow, downloads the results and compares them; **Tim commits and pushes the PNGs**; threshold 0.01 | Re-baselining the 12 PNGs is a human-action checkpoint (see §Codebase Map) |
| Memory: Phase 07 worktrees / branching | Phases run sequentially and stack on the previous tip; force isolation "none" before each executor dispatch | Phase 11 builds on `gsd/phase-10-photography`, the current branch |
| Memory: CI push approval | Standing approval for plan-commit pushes to `ci/<phase>-NN` branches; force pushes and main pushes excluded | Visual baseline runs go through a `ci/11-NN` branch |
| Memory: verify approval before briefing | Never tell a subagent "Tim approved X" without his literal reply | Each D-21 input is recorded as Tim's quoted text in a SUMMARY |
| `eslint.config.mjs` | React Compiler rules (`react-hooks/purity`, `immutability`, `set-state-in-effect`, `refs`) are errors for every file not in `LEGACY_COMPILER_FILES`; never add a file to that list | `DemoTerminal`, `RouteIndex` and `RouteLogFilters` must pass at error level (Pitfall 2) |
| Guards | GUARD-03 ratchet (jest 942, e2e 358, total 1300); GUARD-04 palette (no stock colours, no `dark:`); GUARD-05 contrast pairs; identity guard | See §Validation Architecture |

## Summary

Phase 11 is mostly a rewrite of existing v1 surfaces onto patterns this repo has already proven. `/photos` (Phase 10) shows how a Server page reads `searchParams`, parses them through an import-free whitelist module and hands the result to a small `'use client'` segmented control that calls `router.replace(href, { scroll: false })`. `/photos/[slug]` shows `generateStaticParams` + `dynamicParams = false` + `generateMetadata`. The Phase 8 terrain pipeline shows how to build data from a committed source with an offline `--check`. Phase 11 reuses all three without change. It adds no npm packages.

The hard parts are content and two pieces of new engineering. **Content:** almost every CLI_X metric on the site traces back to the author's own README and CHANGELOG in the private CLI_X repo, with no stated method. One claim is misattributed: the site says "95% accuracy" for plain-English-to-command conversion, but the CLI_X docs give ~95% only for one *parsing stage*. Several figures are stale: the site says 850+ tests and v2.4.0, while CLI_X's changelog has a later v2.4.1 with 900+. These go to Tim through the D-09 table. CLI_X's real behaviour also differs from its own docs. In the run path I read, nothing is hard-blocked: at Medium and above CLI_X warns, lists the matched rules and defaults the "Execute?" prompt to **No**, and High and Critical behave the same. The D-11 lines must therefore not say "blocks". **Engineering:** (1) a deterministic trail-profile generator that turns committed swisstopo trail geometry into DEM-sampled profiles, and (2) a `DemoTerminal` whose pause logic (sticky toggle + temporary hover/focus/offscreen/hidden) must be written so that it passes the React Compiler lint rules and does not repeat the v1 timer leak.

I probed the trail data live. The swisstopo `ch.swisstopo.swisstlm3d-wanderwege` layer returns LV95 LineStrings through the geo.admin.ch identify API. Stitching them and routing between the stations reproduces the official Hörnliweg length (4,316 m vs 4.3 km listed), and the project's own DEM sampler reproduces the committed Matterhorn `demM` (4,473 m). The pipeline works end to end. Note that the CONTEXT example caption ("Start 2,583 m → End 3,260 m · T3") is the Hörnliweg, but the official Zermatt listing grades it **T4**, not T3.

**Primary recommendation:** Collect every Tim input at one early content checkpoint (trail pair, claims table, behaviour lines, Medium/High commands, link verification, route-log rows + `surveyedAt`, copy). Then build in this order: data and schemas → pure libs + generator → Server components → islands → the e2e/visual rewrite. Every v1 test is rewritten in the same commit that deletes its component.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route panels, case study, risk scale, tables, route log | Frontend Server (RSC) | — | Static typed data and zero JS (UI-SPEC "Server boundaries") |
| Trail profile geometry and DEM heights | Build time (`scripts/terrain/*`, committed output) | Frontend Server (renders inline SVG) | D-05: deterministic, offline `--check`, never at request time |
| Trail geometry acquisition | Manual networked script (one-off, like `fetch-dem.mjs`) | — | T-08-09 pattern: CI and Vercel never touch the network |
| Terminal autoplay and pause state | Browser (client island `DemoTerminal`) | RSC (first command server-rendered complete) | Timers, IntersectionObserver, `visibilitychange`, matchMedia |
| Route-log filter state | URL (`searchParams`, parsed on the server) | Browser (`RouteLogFilters` optimistic `aria-pressed`) | ROUTE-02: the URL is the only state; the server filters and counts |
| Scroll-spy current section | Browser (tiny island) | RSC renders the index list | Works without JS; only `aria-current` needs the client |
| Claim/link/date honesty checks | Data tests (jest, no network) | zod schemas | D-12 and D-20 data-level checks |
| Page metadata (titles, SEO-02 hook) | Frontend Server (`metadata` / `generateMetadata`) | — | Phase 12 attaches OG images |

## Standard Stack

No new dependency. Everything below is already installed and pinned in `package.json` [VERIFIED: package.json read this session].

### Core
| Library | Version (installed) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.4.2 (`node -p "require('next/package.json').version"`) | App Router, RSC, `generateMetadata`, `generateStaticParams` | The project framework |
| react / react-dom | ^19.3.1 | `useOptimistic`, `startTransition`, `useSyncExternalStore` | `useOptimistic` is present in `node_modules/react` [VERIFIED: grep of react.production.js] |
| zod | ^4.4.3 | Project and roadmap data contracts (`z.strictObject`, discriminated union) | Existing DATA-07 pattern |
| tailwindcss | 4.3.0 | CSS-first tokens; `target:` and `wrap-anywhere` exist [VERIFIED: grep `node_modules/tailwindcss/dist/lib.js` for `"target",["&:target"]` and `wrap-anywhere`] | Existing design system |
| @phosphor-icons/react | 2.1.10 (`dist/ssr` only) | Icons listed in UI-SPEC | DSGN-10 lint rule |

### Supporting (build-time / test)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | ^0.35.5 | Decode the committed 16-bit DEM PNG in the trail generator, exactly as `build-terrain.mjs` does | Trail profile build only (scripts/**) |
| Node built-in `fetch` | Node 24 (engines) | One-off trail geometry fetch from geo.admin.ch | `scripts/terrain/fetch-trails.mjs` only, manual |
| jest 30 + @testing-library/react 16 + user-event 14 | installed | Unit/component tests | Every pure lib and component |
| @playwright/test 1.64.0 | installed | e2e, visual (CI container only) | Route, a11y, overflow, no-three checks |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| swisstopo swissTLM3D Wanderwege geometry | Hand-digitised waypoints, a zermatt.swiss GPX, OpenStreetMap | Hand points are not "a real marked trail". The GPX licence is unclear. OSM adds an ODbL attribution. swisstopo is already credited in the footer and is the same authority as the DEM |
| Server-parsed `searchParams` passed as props | `useSearchParams()` in the island | `useSearchParams` makes a prerendered route need a `<Suspense>` boundary and client-renders the subtree (docs quote below). Props avoid both, as in the Phase 10 precedent |
| Reducer + one timeout per step for the terminal | v1 nested `setInterval`/`setTimeout` chain | v1 leaks timers (Pitfall 1) |

**Installation:** none.

## Package Legitimacy Audit

No external packages are installed in this phase. All libraries above are existing dependencies (`package.json`), so the legitimacy gate does not apply.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none new) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 BUILD TIME (manual, networked, once)              BUILD TIME (offline, CI --check)
 ┌──────────────────────────────┐                  ┌───────────────────────────────────────────┐
 │ trails spec (committed):     │   geo.admin.ch   │ build-trails.mjs                          │
 │ id, zermatt.swiss URL, SAC   │──identify API──▶│  dem-10m.png (sha256 ✓) ──decode──┐       │
 │ grade, start/end + via pts   │  (Wanderwege     │  trail polyline (committed) ──────┤       │
 └──────────────────────────────┘   LineStrings)   │  resample N stations → sampleAtLv95│      │
        fetch-trails.mjs: stitch segments,         │  normalise 0–1, 3 dp ──────────────┘      │
        shortest path via waypoints → polyline ──▶ │  → data/generated/trail-profiles.ts       │
                                                    │  --check: regenerate + byte compare       │
                                                    └──────────────────┬────────────────────────┘
                                                                       │ imported by RSC only
 REQUEST TIME                                                          ▼
 Visitor ─▶ /projects ───────────────▶ RSC page ── projects data ── RoutePanel ×2 (RouteProfile SVG, TrailGradeMark)
        ─▶ /projects/[slug] ─(static params; unknown → 404)─▶ CaseStudy
               │   sections = map(blocks) in fixed order, omit empty ──▶ Problem │ Pipeline │ Safety(RiskScale+tables)
               │                                                        │ Metrics │ Demo ◀── DemoTerminal island
               │                                                        │ Stack │ Next steps ─▶ /roadmap?project=…#id
               └── RouteIndex island (scroll-spy → aria-current)
        ─▶ /roadmap?project=&status= ─▶ RSC: await searchParams → parseProject/parseStatus (whitelist)
               → filter + counts (pure) → bands Summit / Current camp / Base (order desc)
               → RouteLogFilters island ── press ─▶ startTransition{ setOptimistic; router.replace(href,{scroll:false}) }
                                                         └──▶ RSC re-render with new searchParams ─▶ status line announces
```

### Recommended Project Structure
```
app/(site)/projects/page.tsx            # RSC, metadata { title: 'Engineering' }
app/(site)/projects/[slug]/page.tsx     # RSC, generateStaticParams, dynamicParams=false, generateMetadata
app/(site)/roadmap/page.tsx             # RSC, metadata { title: 'Roadmap' }, awaits searchParams
components/projects/RoutePanel.tsx      # Server
components/projects/RouteProfile.tsx    # Server, inline SVG from generated data
components/projects/TrailGradeMark.tsx  # Server, waymark glyph
components/projects/CaseStudy.tsx       # Server, section map
components/projects/sections/*.tsx      # Problem, Pipeline, Safety (RiskScale, tables), Metrics, Demo, Stack, NextSteps
components/projects/RiskScale.tsx       # Server
components/projects/DemoTerminal.tsx    # 'use client'
components/projects/RouteIndex.tsx      # 'use client' (scroll-spy only)
components/roadmap/RouteLog.tsx         # Server
components/roadmap/RouteRow.tsx         # Server (variant "compact" shared with Next steps)
components/roadmap/RouteLogFilters.tsx  # 'use client'
lib/trail-grade.ts                      # + markerForGrade(), stays import-free
lib/risk-scale.ts                       # pure: band widths, tick lanes (first-fit), axis label offsets
lib/demo-terminal.ts                    # pure reducer + timings
lib/route-log.ts                        # pure: parseProject/parseStatus, filter, counts, band sort, href builder
lib/log-date.ts                         # formatLogDate('2026-10-24') → '24 Oct 2026'
lib/trail-profile.ts                    # pure: resample polyline, normalise, SVG path builder
scripts/terrain/fetch-trails.mjs        # manual, networked
scripts/terrain/build-trails.mjs        # offline, --check; added to data:check
data/terrain/source/trails.json         # spec + committed polylines + provenance
data/generated/trail-profiles.ts        # generated; RSC-only import
data/roadmap.ts                         # new RoadmapItem shape + surveyedAt
data/schemas/roadmap.ts                 # zod contract (recommended, mirrors project.ts)
```
Pure `lib/*.ts` modules follow the repo's "import-free, erasable TypeScript" rule (`lib/geo.ts` header), so scripts can type-strip them and jest can test them directly.

### Pattern 1: Server page + whitelist parser + optimistic segmented island (ROUTE-02)
**What:** The page awaits `searchParams`, parses both params through exact-match whitelists (unknown → All), computes the filtered list and the counts on the server, and passes `project`, `status` and the counts to the island. The island never reads the URL itself.
**When:** `/roadmap`. It mirrors `/photos` + `ViewSwitcher` + `lib/photos/view-param.ts` [VERIFIED: read this session], with UI-SPEC's optimistic `aria-pressed` change.
```tsx
// app/(site)/roadmap/page.tsx — Source: repo precedent app/(site)/photos/page.tsx; NEXT 03-file-conventions/page.md
export const metadata: Metadata = { title: 'Roadmap' };
export default async function RoadmapPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const project = parseProject(sp.project); // 'all' | 'portfolio' | 'clix-cli' | 'clix-website'
  const status = parseStatus(sp.status);    // 'all' | 'planned' | 'in-progress' | 'completed'
  const view = routeLogView(roadmapItems, { project, status }); // bands, counts, total
  return (/* header band */ <RouteLogFilters project={project} status={status} counts={view.counts} />);
}

// components/roadmap/RouteLogFilters.tsx
'use client';
export default function RouteLogFilters({ project, status, counts }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic({ project, status });
  const press = (next: Filter) => {
    if (sameFilter(next, optimistic)) return;              // pressing the pressed segment does nothing
    startTransition(() => {
      setOptimistic(next);                                  // aria-pressed flips at once
      router.replace(routeLogHref(next), { scroll: false }); // no history entry, scroll kept
    });
  };
  /* render groups with aria-pressed={optimistic.project === v}; zero-count → aria-disabled, no-op */
}
```
`routeLogHref` builds the URL only from whitelisted values, in canonical order (`?project=…&status=…`), and drops a param when it is All. This keeps any untrusted string away from `router.replace`, as the docs warn (see the Next.js quotes).

### Pattern 2: Typed project data → fixed section order with omit-if-empty (ENG-02)
**What:** Replace `features`/`pricing`/legacy adapter with typed blocks the CaseStudy maps to its seven fixed sections; each section function returns `null` when it has nothing.
Recommended schema deltas (`data/schemas/project.ts`; the current shape is quoted below):

> [VERIFIED: data/schemas/project.ts:101-133] `const ProjectBase = z.strictObject({ name: z.string(), tagline: z.string(), shortDescription: z.string(), longDescription: z.string(), techStack: z.array(z.string()), links: z.strictObject({ github: z.string().optional(), demo: z.string().optional(), docs: z.string().optional(), }), status: z.enum(['active', 'beta', 'complete', 'archived']), featured: z.boolean(), thumbnailImage: z.string().optional(), roadmapItems: z.array(z.string()).optional(), version: z.string().optional(), features: z.array(z.string()).optional(), });` … `highlights: z.tuple([MetricsBlock, MetricsBlock, RiskScaleBlock, MetricsBlock]),` … `highlights: z.tuple([PricingBlock, ListBlock, StackBlock]),`

| Change | Why | Decision |
|--------|-----|----------|
| Remove `features` | D-15 | locked |
| Remove `PricingBlock` from the website tuple and from the union (it has no other user) | D-13, D-14 | locked |
| Add `PipelineBlock { kind:'pipeline', stages: [{ name, description? }] }` (CLI_X: the 4 stages named at `data/projects.ts:32`) | D-15 → Pipeline | locked by D-15; descriptions are D-16 copy |
| Add `StackBlock` to the CLI_X tuple (providers folded in, D-15) | Stack section | locked by D-15 |
| `MetricsBlock.metrics[]` gains `context?: string` and `source?: string` (URL); renderer drops a tile with no `context` | ENG-04 / D-09 | Claude's design |
| Add `pitch`, `outcome`, `problem: string[]` (D-16 copy) | Panel and trailhead | Claude's design |
| Add `route?: TrailId` (the D-07 assignment) | Profile + badge | Claude's design |
| `links` → keep the keys; add `repository?: 'private'` | D-12 private note | Claude's design |
| Website countable fields for D-08: `platforms: string[]` (from `data/projects.ts:167` "Windows, macOS, Linux") | `features` leaves | D-08 permits a small typed field |
| Drop the `Features` MetricsBlock (`key: 'features'`), or keep only the audited counts | D-09 audit | Tim |

Render map (exhaustive, with a `never` check):
```ts
// components/projects/CaseStudy.tsx — Source: ARCHITECTURE.md §CaseStudy composition
const SECTION_ORDER = ['problem', 'pipeline', 'safety', 'metrics', 'demo', 'stack', 'next-steps'] as const;
function sectionOf(block: HighlightBlock): SectionId {
  switch (block.kind) {
    case 'pipeline': return 'pipeline';
    case 'risk-scale': return 'safety';
    case 'list': return 'safety';      // website security list (D-14)
    case 'metrics': return 'metrics';
    case 'stack': return 'stack';
    default: { const _exhaustive: never = block; return _exhaustive; }
  }
}
// sections = SECTION_ORDER.map(id => render(id, project)).filter(Boolean); RouteIndex gets the rendered ids (G6: hide if < 2)
```

### Pattern 3: DemoTerminal as a pure reducer plus one timer per step (ENG-05)
**What:** `lib/demo-terminal.ts` exports `initial(commands, reduced)`, `reducer(state, action)` and `delayFor(state)`. The island holds `{ index, phase: 'input'|'gap'|'output'|'shown', chars }` and `stickyPaused`. The temporary pause sources (`hover`, `focusWithin`, `offscreen`, `hidden`) are kept separately, and `playing = !stickyPaused && !hover && !focusWithin && !offscreen && !hidden && commands.length > 1`.
One effect, keyed on `[state, playing]`, schedules a single `setTimeout(() => dispatch({type:'tick'}), delayFor(state))` and clears it in cleanup. `setState`/`dispatch` therefore runs only inside timer and event callbacks, never synchronously in an effect body, which is the `react-hooks/set-state-in-effect` rule.
Timings, unchanged from v1 [VERIFIED: components/HologramTerminalDemo.tsx read this session]: input 50 ms/char, 500 ms gap, output 10 ms/char, 3000 ms before the next command. Under reduced motion `tick` jumps straight to `shown` and waits 3000 ms between commands.
Sticky toggle: `aria-pressed={stickyPaused}` with a constant label (UI-SPEC). Initial `stickyPaused = null → reduced` (the v1 `playOverride ?? …` pattern). `data-playback` reports the effective state.
Dots: `dispatch({ type: 'goto', index })` sets `phase: 'shown'` (complete text) and leaves `stickyPaused` alone.
Observers: `IntersectionObserver` (threshold 0) sets `offscreen`; `document.addEventListener('visibilitychange')` sets `hidden`; region `onPointerEnter/Leave` and `onFocus/onBlur` set the hover and focus flags. For `onBlur`, check `e.currentTarget.contains(e.relatedTarget)` so moving focus inside the region does not resume.

### Pattern 4: Trail profile generator (D-05, D-07)
See §D-07 for the data. Generator rules:
1. **Source (committed):** `data/terrain/source/trails.json`, holding per trail `{ id, name, number, listingUrl, sacGrade, start:{name,lv95}, end:{name,lv95}, via:[lv95…], polyline:[[e,n]…], provenance:{ layer:'ch.swisstopo.swisstlm3d-wanderwege', featureIds:[…], fetchedAt } }`, plus a sha256 of the polyline. Only `fetch-trails.mjs` (manual, networked, never in CI) writes it.
2. **Build (offline):** decode the DEM exactly like `build-terrain.mjs` (`sharp(png).toColourspace('grey16').raw({ depth: 'ushort' })`, ×`heightScale`, sha256 checked against `source.json`). Resample the polyline at `N = 128` equal arc-length stations and sample each with `sampleAtLv95(metres, W, H, extent, p)` from `lib/terrain/dem-sample.ts`. Fail if any station falls outside `source.json` `extent`. Normalise to `x = s/L`, `y = (h − min)/(max − min)` and round to 3 dp. Start/end heights are `Math.round(sampleAtLv95(first/last vertex))`.
3. **Output:** `data/generated/trail-profiles.ts` with a header `// AUTO-GENERATED by scripts/terrain/build-trails.mjs … Do not edit.` and, per trail, `{ id, name, number, sacGrade, start:{name,heightM}, end:{name,heightM}, lengthM, points }`. **Do not add path data to `data/generated/terrain.ts`**: its test asserts no path data and a size under 4 KB (T-08-12) [VERIFIED: .planning/phases/08-data-terrain-pipeline/08-SECURITY.md:60 "Module holds only scalars and URLs; test asserts no import, no path data, size under 4 KB"]. Import `trail-profiles.ts` only from Server Components, and add a test that no `'use client'` file imports it.
4. **`--check`:** regenerate in memory and compare bytes. Fail on a polyline whose sha256 does not match, and on a DEM sha256 mismatch. Print `trails: OK` or `trails: N stale` (the `terrain:` output convention). Add `npm run trails:build -- --check` to the `data:check` chain in `package.json`.
5. **Path drawing:** a pure `profilePath(points, { w: 320, h: 96, inset: 8 })` in `lib/trail-profile.ts` returns the line `d` and the area `d`, and is unit-tested. The SVG holds no text or circles (UI-SPEC).
6. **Marker for a single grade:** add `markerForGrade('T4') → 'white-blue-white'` to `lib/trail-grade.ts` and keep the file import-free. A test asserts it agrees with `RISK_BANDS` for T1, T2, T3, T4, T5 and T6.

### Pattern 5: Route-log pure functions (ROUTE-01/03)
`lib/route-log.ts` provides `parseProject`, `parseStatus`, `filterItems`, `countsFor(items, filter)` (each segment counted under the *other* group's value), `bands(items)` (Summit = planned, Current camp = in-progress, Base = completed, each sorted by `order` descending), `routeLogHref`, and `newestCompletedAt(items)`, which includes the nested v2.0 phase dates. All are unit-tested, so the RSC page stays thin.

New `RoadmapItem` (the current shape is quoted below):
> [VERIFIED: data/types.ts:22-30] `export interface RoadmapItem { id: string; … area: 'portfolio' | 'cli' | 'webshop' | 'other'; status: 'planned' | 'in-progress' | 'completed'; targetRelease?: string; priority?: 'low' | 'medium' | 'high'; }`

Recommended: `project: 'portfolio' | 'clix-cli' | 'clix-website'` (renames `area`, removes `'other'`, matching the UI-SPEC URL values), `order: number` (unique, rising from bottom to top), `completedAt?: string` (ISO date, required when `status === 'completed'` only if Tim supplied it; otherwise absent and rendered as "Completed" with no date), `phases?: { n: number; name: string; status; completedAt? }[]` (v2.0 only), and `priority` dropped from the UI (UI-SPEC default 2). Keep the `cli-*`/`webshop-*` ids stable, because `data/projects.ts` `roadmapItems` references them. Add `export const surveyedAt = 'YYYY-MM-DD'` (required). Validate with a zod schema `data/schemas/roadmap.ts`.

### Anti-Patterns to Avoid
- **`next/dynamic(..., { ssr: false })` inside a Server Component.** It is not allowed in RSC. Import `DemoTerminal` directly; it is a client module with its own `'use client'`.
- **Computed Tailwind classes** (`md:grid-cols-${n}`). Tailwind cannot detect them. Use literal class maps (UI-SPEC G1, G11).
- **Colour-class assertions in tests.** Assert `aria-pressed`, `data-playback`, `aria-current`, `aria-disabled` and text instead (ROADMAP scope note).
- **Putting the profile, roadmap or claim provenance into `'use client'` modules.** It grows the client bundle and breaks the T-08-12 discipline.
- **Writing "blocks" for Critical** (see §D-11). It is false in the current CLI_X run path.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DEM sampling | a new bilinear sampler | `lib/terrain/dem-sample.ts` `sampleAtLv95` | Already pixel-centre correct; it reproduced the committed `demM` 4,473 in this session's probe |
| DEM decoding | geotiff/sharp resize in the new script | the `decodeGrey16` approach from `build-terrain.mjs` (sharp grey16 raw) | Same bytes give the same heights; resizing a float raster with sharp is banned (build-terrain header) |
| Generated-data check | an ad-hoc diff | the `--check` structure of `build-terrain.mjs` (regenerate in memory, byte compare, one line per problem) | CI parity with `data:check` |
| Count nouns | template strings | `countLabel` (`lib/home-format.ts:121`) | Zero returns `''`, as the Home trail sign does |
| Heights | `toLocaleString` | `formatMetres` from **`lib/photo-format.ts`** (the UI-SPEC's "[08]" tag points there; it is imported by `components/home/AltimeterRail.tsx:7`) | No locale APIs (UI-SPEC typography) |
| Dates | `Intl.DateTimeFormat` | new pure `formatLogDate` (the `formatCaptureMonth` month-table pattern) | Deterministic SSR/CSR output |
| Segmented control styling | new classes | the `ViewSwitcher` `SEGMENT`/`SELECTED`/`UNSELECTED` constants pattern | Phase 10 precedent, already contrast-checked |
| Trail geometry | hand-digitised points | swisstopo `swisstlm3d-wanderwege` via identify API + shortest path | "Real marked trail" (D-05); authoritative |
| Disclosure (v2.0 phases, mobile route index) | a JS accordion | native `<details>` | Works without JS, instant (UI-SPEC) |

**Key insight:** every new module here has a twin in Phases 8–10. Copying their structure, including the header comments that explain the rules, is what keeps the guards (`data:check`, palette, contrast, ratchet) passing on the first CI run.

## Runtime State Inventory

This phase renames data fields (`area` → `project`, `webshop`/`cli` values → slugs) and retires components, so this section is included.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None. Roadmap and project data are committed TS modules; no database or CMS | Code edit only |
| Live service config | None found. No external service stores these names (Vercel analytics records URLs, and the old `/roadmap` URL with no params still works) | None |
| OS-registered state | None (no tasks or services reference these files) | None |
| Secrets/env vars | None reference project/roadmap names | None |
| Build artifacts | `.next/` caches the old routes (regenerated on build). The 12 committed visual PNGs for `projects`, `clix-cli`, `clix-website`, `roadmap` go stale by design. `graphify-out/` (untracked) still lists the old components until it is rebuilt | Re-baseline the PNGs through CI (Tim commits). Rebuilding graphify is optional |

**Shareable URLs:** v1 `/roadmap` had no params, so no shipped URL breaks. The new `?project=&status=` names become a public contract once shipped (UI-SPEC "stable once shipped").

## Common Pitfalls

### Pitfall 1: Porting the v1 terminal's timer chain leaks timers
**What goes wrong:** in v1 the effect cleanup clears only the input `setInterval`. The nested output interval and the two `setTimeout`s keep running after an index change or unmount, so commands can double-advance and text can type into a stale command [VERIFIED: components/HologramTerminalDemo.tsx read this session, cleanup is `return () => { clearInterval(inputInterval); };`].
**How to avoid:** use Pattern 3, one pending timer that the effect cleanup always clears.
**Warning signs:** a jest fake-timer test that presses a dot during typing and then advances 10 s sees the index skip.

### Pitfall 2: React Compiler lint errors in new islands
**What goes wrong:** `react-hooks/set-state-in-effect`, `refs` and `purity` are errors outside `LEGACY_COMPILER_FILES`. The v1 terminal only passes because it is on that list.
> [VERIFIED: eslint.config.mjs:9-15] `const LEGACY_COMPILER_FILES = [ 'components/HologramTerminal.tsx', 'components/HologramTerminalDemo.tsx', 'components/AnimatedGradientMesh.tsx', 'components/GlassmorphismNav.tsx', 'lib/useProgressiveTextures.ts', ];`
**How to avoid:** call `dispatch` only inside callbacks; derive values instead of storing them; read refs only in effects and handlers. When the two terminal files are deleted, remove both entries in the same commit; the comment says "never add a new file".

### Pitfall 3: Reduced-motion hydration flip
**What goes wrong:** `useReducedMotion` uses `useSyncExternalStore` with `getServerSnapshot() → false` [VERIFIED: lib/useReducedMotion.ts read this session]. The server renders `aria-pressed="false"` and the client flips it to `"true"` after hydration. A test that reads `aria-pressed` immediately can see `false`.
**How to avoid:** autoplay advances only after 3000 ms, so nothing types before the flip. In e2e use `await expect(toggle).toHaveAttribute('aria-pressed','true')` (auto-retry), never a one-shot read.

### Pitfall 4: The no-WebGL e2e waits for a WebGL failure that no longer happens
**What goes wrong:** `e2e/no-webgl.spec.ts` "project detail keeps its content" does `const failed = webglFailure(page); … await failed;` and asserts the heading `/Experience CLI_X in 3D/i` [VERIFIED: e2e/no-webgl.spec.ts:60-68 read this session]. Once D-01 removes the canvas, no WebGL failure is logged, so the test hangs or times out, and the heading is gone.
**How to avoid:** rewrite it like the Home case in the same spec: no `webglFailure`, assert `canvas` count 0, `expectNoErrorPage`, and the new Demo h2 plus the terminal region.

### Pitfall 5: `useSearchParams` without Suspense breaks the production build
**What goes wrong:** the build fails for a prerendered page whose client island calls `useSearchParams` outside `<Suspense>` (docs quote below), even though dev mode "may appear to work".
**How to avoid:** pass the parsed values as props (Pattern 1) and never call `useSearchParams` in `RouteLogFilters`.

### Pitfall 6: Ratchet drops when a component and its tests leave in different commits
**What goes wrong:** deleting `ProjectCard.tsx` with its test before `RoutePanel.test` exists drops jest below 942 for that commit.
**How to avoid:** the plan carries the test-contract table in §Codebase Map. Each row's successor test lands in the commit that deletes the predecessor. `npm run guard:tests` needs `jest --json --outputFile=jest-results.json` first.

### Pitfall 7: `generateStaticParams` + `dynamicParams=false` must match the data slugs exactly
**What goes wrong:** with `dynamicParams = false`, a slug missing from `generateStaticParams` returns 404 (the docs at `03-file-conventions/02-route-segment-config/dynamicParams.md`). `e2e/shell.spec.ts` already asserts that `/projects/no-such-slug` renders the designed 404.
**How to avoid:** `generateStaticParams = () => projects.map(p => ({ slug: p.slug }))`, plus `notFound()` on an exact match, as the photo page does.

### Pitfall 8: Profile data into `terrain.ts`, or the generator touching the network in CI
**How to avoid:** use a separate generated module and a separate manual fetch script, and never run the fetch in `prebuild`/`lint`/CI (T-08-09).

### Pitfall 9: Overclaiming in the behaviour lines and the scale copy
**What goes wrong:** CLI_X's own safety doc says Critical commands are "BLOCKED". The run path I read does not block. It warns, lists the rules and defaults the prompt to No, and an opt-in flag skips the prompt entirely.
**How to avoid:** ship only Tim-approved lines (D-11). The drafts below are already written to match the code.

### Pitfall 10: Two different "technologies" counts on the website panel
**What goes wrong:** the flat `techStack` has 12 entries [VERIFIED: data/projects.ts:141-154], while the stack block groups hold 5 + 5 + 3 = 13 [VERIFIED: data/projects.ts:224-231 `{ key: 'frontend', items: ['Next.js 14', 'React 18', 'TypeScript', 'Tailwind CSS', 'shadcn/ui'] }`, `{ key: 'backend', items: ['Next.js API Routes', 'NextAuth.js', 'Prisma', 'PostgreSQL', 'Stripe'] }`, `{ key: 'deployment', items: ['Vercel', 'Edge Network', 'Serverless Functions'] }`], and the two lists differ (the groups add "Next.js API Routes", "Edge Network" and "Serverless Functions"; the flat list adds "Zod" and "React Hook Form", and spells two entries differently: "Prisma ORM" vs "Prisma", "NextAuth.js v5" vs "NextAuth.js"). A strip count could disagree with the Stack section.
**How to avoid:** derive the D-08 count from the one source the Stack section renders (the groups, deduplicated), and test that the strip equals the rendered chip count.

### Pitfall 11: Contrast/palette guards on new trail primitives
**How to avoid:** add `--trail-blaze`, `--trail-mountain`, `--trail-alpine` and the three utilities in the commit that adds the `TRAIL` list to `check-contrast.mjs` (UI-SPEC). The names avoid `red`/`blue`/`white` (palette stock regex).

## Research Focus Answers

### D-07 Trail Proposal (for Tim's checkpoint)

**Sheet extent** [VERIFIED: data/terrain/source/source.json:12-17] `"extent": { "west": 2616000, "south": 1088000, "east": 2627000, "north": 1099000 }` (LV95, 10 m cells, `"heightScale": 0.1`).

All four candidates are official Zermatt Tourism trail listings. Every endpoint lies inside the extent. DEM heights were sampled this session with `lib/terrain/dem-sample.ts` `sampleAtLv95` on the committed `dem-10m.png`, decoded the way `build-terrain.mjs` decodes it. The probe reproduced the committed summit `demM` 4,473, which validates the method. Coordinates come from the swisstopo gazetteer and stop search (`api3.geo.admin.ch SearchServer`); "trail node" means the snapped end vertex of the stitched swisstopo trail geometry.

| Trail (official) | SAC grade (sourced) | Waymark | Official start → end | DEM start → end (station coord / trail node) | Trail geometry probe |
|------------------|--------------------|---------|----------------------|----------------------------------------------|---------------------|
| **Hörnliweg (No. 27)**: Schwarzsee → Hörnlihütte | **T4** "Alpine Hiking Trail", "Demanding" [CITED: https://zermatt.swiss/en/p/hoernliweg-no-27-01tVj000005EwSkIAK]; the Zermatters guided-hike page also says "T4 – Alpine hike" [CITED: https://zermatt.swiss/en/p/hike-to-the-hoernli-hut-01tVj000004sJoIIAU] | white-blue-white | 2,583 m → 3,260 m, 4.3 km, ↑693 m | 2,583 / 2,587 m → 3,262 / 3,262 m | 13 segments, 5 edges, **4,316 m** (matches 4.3 km with no via points) |
| **Zmutt path (No. 2)**: Zermatt station → Zmutt | **T1** "Hiking trail", "Easy" [CITED: https://zermatt.swiss/en/p/zmuttweg-no-2-01tVj00000H69zjIAB] | yellow | 1,620 m → 1,937 m, 4.3 km, ↑339 m | 1,605 / 1,606 m → 1,924 / 1,934 m | 109 segments, 3,645 m shortest path (**needs via points** to follow the official 4.3 km line) |
| **Riffelseeweg (No. 21)**: Rotenboden → Riffelberg (past Riffelsee, the Home photo waypoint) | **T2** "Mountain Hiking Trail", "Moderate" [CITED: https://zermatt.swiss/en/p/riffelseeweg-no-21-01tVj000005Ew9KIAS] | white-red-white | 2,815 m → 2,582 m, 2.9 km, ↓267 m | 2,816 / 2,806 m → 2,582 / 2,582 m | 2.2 km via the lake shore (**needs via points**; official 2.9 km). The trail descends |
| **Matterhorn Glacier Trail (No. 26)**: Trockener Steg → Schwarzsee | **T3** "Thematic trail", "Moderate" [CITED: https://zermatt.swiss/en/Media/Planning-hikes-tours/Matterhorn-Glacier-Trail-Nr.-26]; the page showed "Closed" (seasonal) on 2026-11-01 | white-red-white | 2,939 m → 2,583 m, 6.6 km | 2,926 m (station) → 2,583 m | not probed |

Grade disagreement noted: some third-party sites list the Hörnliweg as T3 and the Glacier Trail as T2 (a 2020 Atupri factsheet). The official zermatt.swiss listings above are the source of record, as D-07 allows.

**Recommended pairs (Tim chooses):**

| Option | CLI_X | Website | Pros | Cons |
|--------|-------|---------|------|------|
| **A (recommended)** | Hörnliweg No. 27, T4 | Zmutt path No. 2, T1 | The most distinct glyphs (bars vs diamond); both trails climb; Hörnliweg geometry already matches the official length; the trail to the Matterhorn's base suits the larger project | The CLI_X badge shows white-blue-white, the same paint as the High band in its own risk scale (D-06 says these cannot collide, but a skim reader may link them). The Zmutt line needs 1–2 via points |
| B | Riffelseeweg No. 21, T2 | Zmutt path No. 2, T1 | Ties CLI_X to the Riffelsee photo waypoint; no glyph shares a paint with a High/Critical band | The Riffelseeweg descends (the profile falls left to right); both routes need via points |
| C | Hörnliweg No. 27, T4 | Riffelseeweg No. 21, T2 | Both are mountain/alpine trails near the summit | The website glyph descends; both routes use bar waymarks |

**Caption with real numbers (Option A, final numbers come from the generator's end vertices):** `Schwarzsee 2,587 m → Hörnlihütte 3,262 m · T4` and `Zermatt 1,606 m → Zmutt 1,934 m · T1`. The DEM values differ from the brochure (3,262 vs 3,260; 1,606 vs 1,620) by design (08 D-17). Note: the CONTEXT example caption `Start 2,583 m → End 3,260 m · T3` is this Hörnliweg, with the brochure heights and an unofficial grade.

**Checkpoint asks:** (1) pick a pair and the assignment; (2) approve the via points the fetch script uses (shown as a list of named LV95 points); (3) confirm the place names in the caption.

### D-11 Behaviour Lines (drafted from a read-only reading of the CLI_X source)

**What I found, in my own words:**
- After CLI_X writes a command, it prints the command and its explanation and then asks whether to run it. Nothing runs without that prompt unless the user passes an explicit opt-in flag that skips it. A dry-run mode never runs anything.
- The score runs from 0 to 1 and is made of three parts. The most severe of the 11 rules the command matches counts most. Next comes the context it would run in (elevated privileges, a sensitive system folder, little free disk space). Last comes the command's shape (risky words such as force, recursive or delete, chained commands, piping into a shell, wildcards). The result is clamped to 0–1. The 11 rules fall into four severities.
- **Below 0.3:** no warning, and the prompt's default answer is *yes*.
- **0.3 up to 0.6:** with the shipped default setting (confirmation required), the command counts as not safe. CLI_X prints a warning with the message of every rule it matched, and the prompt's default answer becomes *no*. A user setting can turn this off, and then Medium behaves like Low.
- **0.6 and above:** always counts as not safe, whatever the settings: the same warning, the matched rules and a default of *no*. **In this code path High and Critical are handled identically, and nothing is hard-blocked.** CLI_X's own safety document describes Critical as blocked; the code does not.
- At any grade, a command judged destructive gets a "back up first" recommendation, and a safer alternative is suggested when CLI_X knows one.

**Draft lines for the grade table's "What CLI_X does" column (Tim edits or approves):**

| Grade | Score | Draft line |
|-------|-------|-----------|
| T1 · Low | 0–0.3 | Shows the command and asks before running it; the answer defaults to yes. |
| T2–T3 · Medium | 0.3–0.6 | Warns, lists the rules the command matched, and asks you to confirm; the answer defaults to no. |
| T4–T5 · High | 0.6–0.8 | Warns, lists the matched rules and suggests a safer command when it knows one; the answer defaults to no. |
| T6 · Critical | 0.8–1.0 | Same as High: a warning and a default of no. It does not block the command outright. |

**Decision for Tim:** the code gives High and Critical the same behaviour. Either (a) ship two near-identical lines as drafted, (b) change CLI_X first (out of scope for this repo), or (c) word the Critical line to stress *why* it is graded higher without promising a different action. The Safety intro's draft "against 11 rules" is accurate.

**D-10 helper (suggested requests for Tim to run, not data):** plain-English requests likely to land in the missing bands, for example "delete the build folder in this project and everything in it" (Medium territory) and "make this script readable and writable by everyone" (High territory). Only the real output, `riskScore` and warning/explanation Tim pastes may ship [ASSUMED: band placement depends on Tim's context; the prediction is mine].

### D-17 Route-Log Draft

**Portfolio rows (git-verified, ready to ship once Tim confirms):**

| id (proposed) | Title | Status | completedAt | Evidence |
|---------------|-------|--------|-------------|----------|
| `portfolio-v1` | v1.0 Stabilization & Visual Identity | completed | 2026-03-12 | `.planning/MILESTONES.md` "## v1.0 Stabilization & Visual Identity (Shipped: 2026-03-12)"; commit `1cb6e91 v1.0` dated 2026-03-12 [VERIFIED: git log] |
| `portfolio-v2` | v2.0 Topographic Identity | in-progress | — | Milestone started 2026-10-10 (`383a4f9 docs: start milestone v2.0 Topographic Identity`) [VERIFIED: git log] |
| ↳ phase 7 | Foundation & guardrails | completed | 2026-10-24 | `b147f20 docs(07): complete phase 07 after UAT and transition to phase 8` |
| ↳ phase 8 | Data & terrain pipeline | completed | 2026-10-24 | `a413b69 docs(phase-08): complete phase execution` |
| ↳ phase 9 | Home ascent | completed | 2026-10-25 | `6500ae2 docs(09): complete phase 09 after UAT round 2, transition to phase 10` |
| ↳ phase 10 | Photography | completed | 2026-10-26 | `ae887f0 docs(10): complete phase 10 after UAT 7/7, transition to phase 11` |
| ↳ phase 11 | Engineering & roadmap | in-progress | — | current phase |
| ↳ phase 12 | Contact, edge pages & cleanup | planned | — | `.planning/ROADMAP.md` line 39 |

Phase names are shortened from ROADMAP.md lines 34–39 to fit the disclosure lines. Tim approves the wording (D-16).

**Stale portfolio items (proposal):**

| Current item | Proposal | Reason |
|--------------|----------|--------|
| `portfolio-3d-gallery` "3D Image Gallery Enhancement" (planned, v1.1.0) | **Retire** (alternative: keep as completed 2026-10-26, rewritten to describe the 3D carousel) | Phase 10 shipped the 3D carousel, map and grid; parallax was dropped by design. A separate row would duplicate the v2.0 Phase 10 line. No project links to this id |
| `portfolio-blog` "Photography Blog" (planned, v1.2.0) | **Tim decides:** keep as planned with the target removed (v1.x is over), or retire | No evidence either way in git or `.planning/` |

**CLI_X rows (NEED TIM).** Evidence from the private CLI_X changelog and roadmap, for confirmation only:

| id | Current data | What the CLI_X repo suggests | Tim supplies |
|----|--------------|------------------------------|--------------|
| `cli-conversation-mode`, `cli-ollama-integration`, `cli-template-analytics` | completed, v2.4.0, no date | The changelog dates v2.4.0 **2025-11-11** and lists these features | Confirm `completedAt` = 2025-11-11 (or the real ship date) |
| `cli-conversation-export` | in-progress, v2.5.0 | v2.4.1 (**2025-12-18**) added export to text, Markdown and JSON; PDF and syntax highlighting are not mentioned | Split, or mark completed 2025-12-18 with the description rewritten to what shipped; or keep in progress for PDF |
| `cli-workflow-scheduling` | in-progress, v2.5.0 | v2.4.1 added persistent workflows and schedules, file-watch triggers and new conditions; cron with timezones and retries is unclear | Status + date |
| `cli-plugin-system` (v3.0.0), `cli-autocomplete` (v2.6.0), `cli-collaborative-commands` (v3.0.0), `cli-web-interface` (v3.1.0) | planned | CLI_X's own roadmap places collaboration and a plugin system in a later "future" major version than the portfolio data does | Keep, retarget or retire; order |
| Project kicker `version: 'v2.4.0'` | v2.4.0 | The changelog's latest entry is **v2.4.1**; the repo was last pushed 2026-06-08 | Confirm the version and whether the "in progress" items are still active |

**Website rows (NEED TIM):** `webshop-team-management` (v1.1.0), `webshop-analytics` (v1.2.0), `webshop-api-marketplace` (v1.3.0) and `webshop-mobile-app` (v2.0.0) are all planned. There is no website repo, and `cli-x.com` does not resolve (CONTEXT). Tim confirms status `active`, whether each item is still planned, and the order.

**Order proposal (global, rising from bottom to top; final after Tim):** completed items oldest to newest (CLI_X v2.4.0 items → v2.4.1 items if completed → portfolio v1.0); then in-progress (CLI_X items Tim keeps → v2.0 at the top of the camp); then planned (the next likely item just above the camp, the most speculative at the summit).

**`surveyedAt`:** Tim sets it at the checkpoint. The D-20 test compares it against `newestCompletedAt`, which **must include the nested v2.0 phase dates** (2026-10-26 today); otherwise a stale survey date could pass.

### D-09 Claims Audit Draft

"Origin" = where the figure first appears. Every CLI_X figure below comes from the author's own README/CHANGELOG in the private repo, none with a stated method or environment. Tim marks each row `source: …`, `soften` or `cut`.

| # | Claim | Where (portfolio) | Current wording | Origin / finding | Proposed soft wording | What would source it |
|---|-------|-------------------|-----------------|------------------|-----------------------|----------------------|
| 1 | 95% accuracy | `data/projects.ts:31` features | "Natural language to shell command conversion (95% accuracy)" | **Misattributed:** CLI_X docs give "~95% accuracy" for its *response-parsing* stage, not for end-to-end conversion | "Turns plain-English requests into commands for PowerShell, Bash, sh and cmd." (no figure) | An evaluation set (N requests, a correctness rule, model, version) |
| 2 | ~90ms (40% faster) | `data/projects.ts:52` Performance; `:10` longDescription "a 90ms startup" | "~90ms (40% faster)" | README "~90ms (40% faster than baseline)"; the baseline is unnamed | Drop "40% faster". Keep ~90 ms only with Tim's measurement | e.g. `hyperfine` on a named version, machine and OS |
| 3 | 40-60% API cost reduction | `:42` features | "Intelligent caching (40-60% API cost reduction)" | CLI_X docs give 40–60% as a *typical cache hit rate* and derive cost "based on hit rate", an estimate | "Caches responses, so a repeated request skips the API call." (Metrics prose, D-15) | Hit-rate logs over a stated period |
| 4 | <100ms startup | `:43` features | "Async context loading (<100ms startup)" | Changelog: "Startup latency: <100ms (from ~2s)" after async loading; overlaps #2 | "Loads project context in the background, so the prompt appears straight away." | Same measurement as #2 |
| 5 | enterprise-grade safety | `:9` shortDescription | "…using LLM technology with enterprise-grade safety." | No standard behind it | "…and scores every command for risk before it runs." | Not sourceable, cut the phrase |
| 6 | ML-inspired | `:10` longDescription; `:34` features | "an ML-inspired risk scorer"; "ML-inspired safety system with 11 comprehensive rules" | CLI_X's README uses the phrase, but the scorer is a weighted, rule-based formula with no learned model | "a rule-based risk score built from 11 rules" | — (soften) |
| 7 | Accessibility compliant (WCAG 2.1) | `:177` website features | "Accessibility compliant (WCAG 2.1)" | No audit evidence; the site is offline | Cut | An audit report. (Also: the portfolio's own `README.md:31,405` claims WCAG 2.1 AA; not shipped on the site, flag for Phase 12) |
| 8 | PCI-compliant payments | `:214` security list | "PCI-compliant payments" | PCI scope sits with Stripe when hosted Checkout/Elements is used [ASSUMED] | "Card payments run through Stripe; card details never reach my server." (only if true) | Tim confirms the Stripe integration type |
| 9 | 850+ tests / 100% pass rate | `:64-65` Testing; `:10` "Over 850 tests" | "850+", "100%" | v2.4.0 changelog figure; **stale**: v2.4.1 says 900+ | "{N} automated tests, run in CI on every push" (CLI_X has a CI workflow file; Tim confirms it runs) | `cargo test` count on a tagged version; drop "100% pass rate" (a moment-in-time state) |
| 10 | +90 new tests | `:66` | "+90 from v2.3.0" | Changelog trivia | Cut | — |
| 11 | Docs line counts | `:67-68` | "6,700+ lines", "3,200+ for v2.4.0" | Changelog | Cut (vanity; the docs site is offline) | — |
| 12 | Memory / binary / cache / overhead | `:53-56`; `:10` "36MB footprint" | "~36MB typical", "4-6MB stripped", "~1.5ms lookup", "~28ms" | README performance list / changelog, no method | Keep only those Tim measures | A measurement each, with version |
| 13 | Feature counts | `:93-97` Features block | Providers 4, Templates 60+, Commands 40+, Intent types 17, Context sources 5 | Docs counts; the README lists 5 providers (including "Local") | Providers is derivable from the Stack data; others only if Tim confirms | Count from the code at a version |
| 14 | "safe" commands | `:7` tagline "safe, executable shell commands"; also `data/home.ts:21` (Phase 9-approved Home copy) "turns plain language into safe shell commands" | as quoted | CLI_X grades risk; it does not guarantee safety | "…graded for risk before you run it" (the UI-SPEC pitch draft already does this). Home copy: flag only, it needs Tim's say-so | — |
| 15 | Website security list | `:212-217` | Bcrypt, signed licences, input sanitisation, rate limiting, HTTPS/TLS 1.3 | Not verifiable (no repo, site down). TLS 1.3 would be the host's default [ASSUMED] | Keep the items Tim confirms, without "HTTPS/TLS 1.3" | Tim |
| 16 | Model versions | `:10` "GPT-4, Claude…"; `:14-16` techStack "OpenAI GPT-4", "Anthropic Claude 3.5", "Groq Llama 3.3" | as quoted | Model names date quickly | Stack lists providers (OpenAI, Anthropic, Groq, Ollama), not models | — |
| 17 | Website platform claims | `:136-140` short/longDescription ("interactive demo playground", "try CLI_X in-browser", "Next.js 14") | as quoted | Site offline; cannot be checked | Past-tense or cut, per Tim | Tim |

The UI-SPEC already bans the unsourced wording until Tim sources it (Copywriting "Banned unless Tim sources them at D-09"). Note that `lib/__tests__/ascent-summit.test.ts:58` already asserts that "850+" never appears on Home.

### Codebase Map for the Rewrite

**Files to retire (delete) and their consumers** [VERIFIED: `git grep` this session]:

| File / CSS | Consumers today | Successor |
|------------|-----------------|-----------|
| `components/ProjectCard.tsx` | `app/(site)/projects/page.tsx` | `components/projects/RoutePanel.tsx` |
| `lib/useHexGrid.ts` | projects page | — (deleted) |
| `app/globals.css` `.hex-clip`, `.hex-clip:focus-visible`, `.hex-grid` (+ `> *`, `> .hex-offset`, the `@media (max-width: 767px)` block), lines ~504–549 | ProjectCard, projects page | — |
| `components/ProjectHighlights.tsx` + `lib/legacy-highlights.ts` + `data/__tests__/fixtures/legacy-highlights.json` | `[slug]` page; `data/__tests__/projects.test.ts` | CaseStudy sections |
| `components/FeatureShowcase.tsx` | `[slug]` page | folded into sections (D-15) |
| `components/ProjectDetailClient.tsx` | `[slug]` page | CaseStudy (RSC) + DemoTerminal island |
| `components/HologramTerminal.tsx`, `components/HologramTerminalDemo.tsx` | ProjectDetailClient; `eslint.config.mjs` LEGACY list | `components/projects/DemoTerminal.tsx` |
| `app/globals.css` `.hologram-content` (~399–445) | HologramTerminal only | — (delete with the terminal) |
| `components/TechStackDisplay.tsx` | `[slug]` page | Stack section |
| `components/RoadmapFilters.tsx`, `RoadmapTimeline.tsx`, `RoadmapProgress.tsx` | roadmap page | `RouteLogFilters`, `RouteLog`, `RouteRow` |
| `--text-shadow-glow*` usages on `/projects` | projects page h1/h2 | removed (tokens stay until Phase 12) |

`SafeCanvas` stays: Home, the Photo carousel and `AnimatedGradientMesh` still use it. After this phase, no import path from the project routes reaches `three`/`@react-three/*`.

**`LEGACY_COMPILER_FILES` after the phase:** remove `'components/HologramTerminal.tsx'` and `'components/HologramTerminalDemo.tsx'`, leaving `AnimatedGradientMesh`, `GlassmorphismNav`, `useProgressiveTextures` for Phase 12.

**Test-contract table (rewrite, never delete; ratchet total ≥ 1300)** [VERIFIED: baseline `scripts/guards/test-count.baseline.json:2-4` `"jest": 942, "e2e": 358, "total": 1300`]:

| Test file (count today) | What it asserts today | Successor (same commit as the deletion) |
|-------------------------|-----------------------|------------------------------------------|
| `components/__tests__/ProjectCard.test.tsx` (8) | name/tagline text, tech badges, status text, link indicators, href, `aria-label "View details for …"` | `components/projects/__tests__/RoutePanel.test.tsx`: kicker `{Status} · {version}`, h2 link name = project name, href, strip items, links row (dead URLs absent, private note text), figure caption text |
| `components/__tests__/RoadmapFilters.test.tsx` (8) | renders area/status filters, callbacks, `toHaveClass` highlights, icons | `components/roadmap/__tests__/RouteLogFilters.test.tsx`: two groups by name, `aria-pressed` after a press (optimistic), `router.replace` called with canonical href and `{ scroll:false }`, zero-count `aria-disabled` no-op, pressed-pressed no-op |
| `components/__tests__/RoadmapTimeline.test.tsx` (11) | items, descriptions, status badges, area labels, target releases, priority, icons, empty | `components/roadmap/__tests__/RouteLog.test.tsx`: band order Summit → Current camp → Base, order desc inside bands, completed meta `Completed 24 Oct 2026`, missing date → `Completed`, band omitted at zero, v2.0 `<details>` lines, ids on rows |
| `data/__tests__/projects.test.ts` (11; 3 depend on the legacy fixture) | schema parse, tuple order, demo risk, `toLegacyHighlights` byte-identical | Keep the 8 schema/risk tests (update tuples). Replace the 3 legacy tests with: section map per slug (CLI_X 7, website ≥ 4), `features` key rejected by the strict schema, dead-URL rejection (D-12), every `roadmapItems` id exists in the roadmap data |
| `e2e/projects.spec.ts` (7) | heading `/Programming Projects/i`, links `/View details for/i`, tech text, optional filter, GitHub/demo links | Heading `Engineering`, panel links by project name, navigate to the case study, section headings present, no `hex-` class, no dead URLs, private-repo text, no `three` chunk requested on `/projects/clix-cli` |
| `e2e/no-webgl.spec.ts` "project detail keeps its content" (1) | waits for a WebGL failure; heading "Experience CLI_X in 3D" | Pitfall 4 rewrite |
| New (adds to the ratchet) | — | `lib/__tests__/route-log.test.ts`, `log-date.test.ts`, `risk-scale.test.ts` (lanes incl. a 3-tick cluster), `demo-terminal.test.ts` (reducer + fake timers), `trail-profile.test.ts`, `trail-grade.test.ts` (+ markerForGrade), `data/__tests__/roadmap.test.ts` (`surveyedAt` rule, unique `order`, completed needs no invented date), `data/__tests__/trail-profiles.test.ts` (not imported by a client module, ≥ 64 points, 3 dp), component tests for DemoTerminal (pause sources, sticky, dots, reduced motion) and TrailGradeMark/RiskScale/tables, e2e `e2e/roadmap.spec.ts` (URL round trip, Back does not undo filters, `#id` anchors, 375 overflow) |

Other specs that touch these routes and should keep passing unchanged: `e2e/shell.spec.ts` (menu tests on `/roadmap`, nav-current on `/projects`, 404 on `/projects/no-such-slug`), `e2e/design-system.spec.ts` (CLS on `/projects` < 0.1), `e2e/home-ascent.spec.ts` and `e2e/homepage.spec.ts` (`countLabel(projects.length, 'route', 'routes')`).

**Visual baselines that re-baseline** [VERIFIED: `e2e/visual/routes.spec.ts:38-41` `['projects', '/projects'], ['clix-cli', '/projects/clix-cli'], ['clix-website', '/projects/clix-website'], ['roadmap', '/roadmap'],`]: 12 PNGs, `e2e/visual/routes.spec.ts-snapshots/{projects,clix-cli,clix-website,roadmap}/{375,768,1440}-reduced-visual-dark-linux.png`. The terminal is deterministic under the visual run because it is reduced-motion (paused, command 1 complete). Re-baseline through the CI `workflow_dispatch`; Tim commits the PNGs (human-action checkpoint).

**Server Component conversions:**
- `app/(site)/projects/page.tsx`: drop `'use client'`, `useRef`, `useHexGrid`, the featured/other split (both projects are featured) and the glow h1. Export `metadata = { title: 'Engineering' }`. The root template `title: { default: 'Tim Lui · Developer & photographer', template: '%s · Tim Lui' }` [VERIFIED: app/layout.tsx:32] yields "Engineering · Tim Lui".
- `app/(site)/projects/[slug]/page.tsx`: already async RSC. Add `dynamicParams = false`, `generateStaticParams`, `generateMetadata({ params })` → `{ title: project.name, description: pitch }`; replace the body with `<CaseStudy project={project} />`.
- `app/(site)/roadmap/page.tsx`: drop `'use client'`, `useState` and all `motion` imports (banned on this page by the UI-SPEC). Make it `async` with `searchParams`; `metadata = { title: 'Roadmap' }`.

### Next.js 16.4 Specifics (read from `node_modules/next/dist/docs/` this session)

- **`searchParams` is a Promise** on a page: "`searchParams: Promise<{ [key: string]: string | string[] | undefined }>`" … "`const filters = (await searchParams).filters`" [CITED: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md:73-83]. `params` is also a Promise; the synchronous access "will be deprecated in the future" [same file:65]. Always `await`.
- **`useSearchParams` needs Suspense when prerendered:** "During production builds, a static page that calls `useSearchParams` from a Client Component must be wrapped in a `Suspense` boundary, otherwise the build fails" and "In development … things may appear to work without `Suspense`" [CITED: 04-functions/use-search-params.md:180-181]. The docs also recommend reading the page's `searchParams` prop and passing it down [same file:75]. Use props (Pattern 1).
- **`router.replace`:** "Perform a client-side navigation to the provided route without adding a new entry into the browser's history stack"; `{ scroll: false }` disables scroll-to-top [CITED: 04-functions/use-router.md:45, 118-120]. Security note: "You must not send untrusted or unsanitized URLs to `router.push` or `router.replace`" [same file:54].
- **`generateMetadata`** can read `params` and the `parent` metadata (`ResolvingMetadata`). A page `title` "will augment `title.template` from the closest parent segment" [CITED: 04-functions/generate-metadata.md:44-60, 338-343]. Phase 12 extends `openGraph.images` from `parent` (lines 68-69 example).
- **`generateStaticParams` + `dynamicParams`:** "To statically render all paths at build time, supply the full list of paths"; `dynamicParams = false` controls unknown segments [CITED: 04-functions/generate-static-params.md:56, 211-265]. Repo precedent: `app/(site)/photos/[slug]/page.tsx` (works with this repo's nonce CSP proxy).
- **Server/Client boundary:** client islands are separate `'use client'` modules imported into RSC; `next/dynamic` with `ssr:false` is a Client-Component-only tool [CITED: 01-getting-started/05-server-and-client-components.md, `02-guides/server-and-client-boundary.md` exist in this install; consult them before writing the islands].
- **CSP:** `proxy.ts` sets `style-src 'self' 'unsafe-inline'` [VERIFIED: proxy.ts:9], so inline `style={{ left: … }}` for scale ticks is allowed; scripts are nonce-based (no inline scripts added here).
- No `cacheComponents` in `next.config.ts` [VERIFIED: next.config.ts read], so the cache-components guides do not apply.

## Code Examples

### formatLogDate (pure, import-free)
```ts
// lib/log-date.ts — pattern: lib/home-format.ts formatCaptureMonth (fixed month table)
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;
/** '2026-10-24' -> '24 Oct 2026'. @throws RangeError for anything but a valid YYYY-MM-DD. */
export function formatLogDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new RangeError(`formatLogDate: expected YYYY-MM-DD, got ${iso}`);
  const [, y, mo, d] = m;
  const month = MONTHS[Number(mo) - 1];
  if (!month || Number(d) < 1 || Number(d) > 31) throw new RangeError(`formatLogDate: invalid date ${iso}`);
  return `${Number(d)} ${month} ${y}`;
}
```

### First-fit tick lanes (UI-SPEC G4)
```ts
// lib/risk-scale.ts
export function assignLanes(scores: readonly number[], minGap = 0.09): number[] {
  const order = scores.map((s, i) => [s, i] as const).sort((a, b) => a[0] - b[0]);
  const lastInLane: number[] = [];
  const lane = new Array<number>(scores.length);
  for (const [s, i] of order) {
    let l = lastInLane.findIndex((last) => s - last >= minGap);
    if (l === -1) { l = lastInLane.length; lastInLane.push(s); } else lastInLane[l] = s;
    lane[i] = l;
  }
  return lane; // today's 0.05/0.15/0.29/0.87 -> all lane 0
}
```

### D-20 survey-date test
```ts
// data/__tests__/roadmap.test.ts
test('surveyedAt is not in the future and not before the newest completedAt', () => {
  const today = new Date().toISOString().slice(0, 10);
  expect(surveyedAt <= today).toBe(true);               // ISO dates compare lexically
  expect(surveyedAt >= newestCompletedAt(roadmapItems)).toBe(true); // includes v2.0 phase dates
});
```

### Dead-link data check (D-12, no network)
```ts
const DEAD = ['github.com/tlex-web/cli_x', 'github.com/tlex-web/cli_x-website', 'cli-x.com', 'docs.cli-x.com'];
test.each(projects)('$slug ships no known-dead URL', (p) => {
  const urls = Object.values(p.links).filter(Boolean) as string[];
  for (const u of urls) for (const d of DEAD) expect(new URL(u).host + new URL(u).pathname).not.toContain(d);
});
```
Tim's verification at the checkpoint removes an entry from `DEAD` in the commit that re-adds that link.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Synchronous `params`/`searchParams` | Promise props, awaited | Next 15 (deprecation pending) | Always `await` |
| `useSearchParams` in client filters | Server-parsed props + `router.replace` | App Router guidance | No Suspense/CSR bailout |
| `framer-motion` page fades | No entrance motion (UI-SPEC) | v2.0 | Drop `motion` from `/roadmap` |
| 3D hologram terminal | Flat token terminal island | D-01 | three.js leaves project bundles |

**Deprecated/outdated in this repo:** `toLegacyHighlights` (a Phase 8 bridge, retires now); `RoadmapItem.area`/`'other'`; `PricingBlock`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | swisstopo's open-data terms cover the Wanderwege geometry with the existing "Bundesamt für Landestopografie swisstopo" footer credit | Standard Stack / D-07 | An extra attribution string may be needed (data edit) |
| A2 | Hosted Stripe Checkout/Elements puts PCI scope on Stripe, which backs the soft wording for claim #8 | D-09 #8 | The soft line would be wrong; Tim confirms the integration |
| A3 | TLS 1.3 is the hosting default, not an app feature | D-09 #15 | Minor; the row is Tim's call anyway |
| A4 | The suggested D-10 requests land in the Medium and High bands | D-11 helper | None ships unless Tim's real run supplies it |
| A5 | The via points needed for the Zmutt path and Riffelseeweg can reproduce the official lines within about 10% of the listed length | D-07 | More via points, or choose Option C/the Hörnliweg-heavy pair |
| A6 | The CLI_X behaviour summary reflects the shipped binary (I read the main branch HEAD, last pushed 2026-06-08) | D-11 | Tim corrects the lines at the checkpoint (already gated) |

## Open Questions

1. **High vs Critical behaviour is identical in CLI_X.** What we know: the run path treats ≥ 0.6 the same. What's unclear: whether Tim wants the site to say so plainly. Recommendation: ship the drafted honest lines, or let Tim reword Critical without promising a block.
2. **Is CLI_X still in active development?** The last push was 2026-06-08, and the "in progress" items may have stalled or partly shipped in v2.4.1. Tim decides at D-17.
3. **The website project's status** (no repo, no live site): `active` may need to become `archived`/`complete`. Tim decides, and it affects the kicker text only.
4. **Via points for the chosen trails:** the fetch script needs a small named list per trail. Present them at the D-07 checkpoint with the resulting length beside the official length.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build scripts, jest, next | ✓ | local v26.13.0 (engines `24.x`; CI pins via `.node-version`, guarded by `guard:parity`) | — |
| sharp | trail generator DEM decode | ✓ | ^0.35.5 (used by build-terrain) | — |
| geo.admin.ch API (network) | one-off `fetch-trails.mjs` | ✓ (probed this session: SearchServer + identify returned LV95 LineStrings) | — | Hand-entered polyline from map.geo.admin.ch (worse) |
| gh CLI (authenticated `tlex-web`, scopes include `repo`, `workflow`) | read-only CLI_X look-up; visual baseline dispatch | ✓ | 2.103.3 | — |
| Playwright | e2e | ✓ | 1.64.0 | — |
| Visual baselines | GUARD-02 | CI container only | — | none locally (by policy) |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30 (jsdom, `next/jest`) + Playwright 1.64 (chromium, firefox, webkit; visual-* in CI) |
| Config file | `jest.config.js`, `playwright.config.ts` |
| Quick run command | `npx jest --silent` plus `npm run lint && npm run type-check` (lint runs every guard and `data:check`) |
| Full suite command | `npm run lint && npm run type-check && npm test && npx playwright test --project=chromium --project=firefox` (`PW_PROD=1` for production parity, as CI runs) |
| Ratchet | `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENG-01 | Route panels render name link, kicker, pitch, strip, links, figure; no hex anywhere | component + e2e | `npx jest components/projects/__tests__/RoutePanel.test.tsx --silent && npx playwright test e2e/projects.spec.ts --project=chromium` | ❌ Wave 0 (RoutePanel test new; projects.spec rewritten) |
| ENG-01 | Profile data deterministic, inside extent, ≥ 64 points, not client-imported | build check + unit | `npm run data:check && npx jest data/__tests__/trail-profiles.test.ts lib/__tests__/trail-profile.test.ts --silent` | ❌ Wave 0 |
| ENG-01 | Hex code gone | grep in e2e + lint | `npx playwright test e2e/projects.spec.ts --project=chromium -g "hex"` | ❌ Wave 0 |
| ENG-02 | Section map per project; omit empty sections; index hidden below 2 | unit + e2e | `npx jest components/projects/__tests__/CaseStudy.test.tsx data/__tests__/projects.test.ts --silent && npx playwright test e2e/projects.spec.ts --project=chromium -g "Case study"` | ❌ Wave 0 |
| ENG-02 | Unknown slug → designed 404 | e2e | `npx playwright test e2e/shell.spec.ts --project=chromium -g "no-such-slug"` | ✅ |
| ENG-02 | Metadata titles | e2e | `npx playwright test e2e/projects.spec.ts --project=chromium -g "title"` (expects `CLI_X … · Tim Lui`) | ❌ Wave 0 |
| ENG-03 | Bands from RISK_BANDS, glyph + grade + level + range text; tables; lanes | unit + component | `npx jest lib/__tests__/trail-grade.test.ts lib/__tests__/risk-scale.test.ts components/projects/__tests__/RiskScale.test.tsx --silent` | ✅ trail-grade / ❌ others |
| ENG-03 | Trail contrast pairs | guard | `npm run guard:contrast && npm run guard:palette` | ✅ (TRAIL list added) |
| ENG-04 | Tiles need a context line; claims dispositions applied; no count-up; banned phrases absent | unit + e2e | `npx jest components/projects/__tests__/Metrics.test.tsx data/__tests__/projects.test.ts --silent && npx playwright test e2e/projects.spec.ts --project=chromium -g "claims"` | ❌ Wave 0 |
| ENG-05 | Hover/focus temporary pause, sticky toggle, offscreen/hidden, reduced motion starts paused, dots | unit (reducer, fake timers) + component + e2e | `npx jest lib/__tests__/demo-terminal.test.ts components/projects/__tests__/DemoTerminal.test.tsx --silent && npx playwright test e2e/projects.spec.ts --project=chromium -g "Demo"` | ❌ Wave 0 |
| ENG-05 | No three.js on project pages; no-WebGL page intact | e2e | `npx playwright test e2e/no-webgl.spec.ts e2e/projects.spec.ts --project=chromium -g "project detail\|three"` | ✅ rewrite |
| ROUTE-01 | Band order, order-desc sort, DOM = visual order, dates formatted | unit + component | `npx jest lib/__tests__/route-log.test.ts lib/__tests__/log-date.test.ts components/roadmap/__tests__/RouteLog.test.tsx --silent` | ❌ Wave 0 |
| ROUTE-02 | URL round trip, optimistic `aria-pressed`, no history entry, zero-count disabled, unknown → All, 375 no overflow | component + e2e | `npx jest components/roadmap/__tests__/RouteLogFilters.test.tsx --silent && npx playwright test e2e/roadmap.spec.ts --project=chromium --project=firefox` | ❌ Wave 0 |
| ROUTE-03 | `order` unique, v2.0 in progress with phases 7–12, `surveyedAt` rule, ids referenced by projects exist | unit | `npx jest data/__tests__/roadmap.test.ts data/__tests__/projects.test.ts --silent` | ❌ Wave 0 |
| All | Ratchet ≥ 1300, no skip/only | guard | `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` | ✅ |
| All | Visual baselines (12 PNGs) | visual (CI) | `gh workflow run` visual dispatch on `ci/11-NN`, download, compare; Tim commits | ✅ (re-baseline) |
| All | axe on the three routes | e2e | extend the existing axe usage (`@axe-core/playwright`) in `e2e/projects.spec.ts` / `e2e/roadmap.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run lint && npm run type-check && npx jest <touched paths> --silent`
- **Per wave merge:** `npx jest --silent && npx playwright test e2e/projects.spec.ts e2e/roadmap.spec.ts e2e/no-webgl.spec.ts e2e/shell.spec.ts --project=chromium`
- **Phase gate:** full suite + `npm run guard:tests` green, then the visual re-baseline is accepted, before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `lib/__tests__/{route-log,log-date,risk-scale,demo-terminal,trail-profile}.test.ts`
- [ ] `data/__tests__/{roadmap,trail-profiles}.test.ts`
- [ ] `components/projects/__tests__/{RoutePanel,CaseStudy,RiskScale,Metrics,DemoTerminal,TrailGradeMark}.test.tsx`
- [ ] `components/roadmap/__tests__/{RouteLog,RouteLogFilters}.test.tsx` (successors of the v1 tests)
- [ ] `e2e/roadmap.spec.ts` (new); `e2e/projects.spec.ts` and `e2e/no-webgl.spec.ts` rewritten
- [ ] `scripts/terrain/build-trails.mjs --check` wired into `data:check`

## Security Domain

`security_enforcement` is absent from `.planning/config.json`, so it is treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — (all public, static data) |
| V5 Input Validation | yes | Exact-match whitelists for `?project`/`?status` (the `parseView` pattern); slugs matched exactly, then `notFound()`; zod strict schemas for data |
| V6 Cryptography | no | — (sha256 integrity of committed sources reuses Node `crypto`) |
| V12/V14 Files & Config | yes | Generator never networked in CI; committed sources sha256-checked |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Visitor-controlled URL reaches `router.replace` (e.g. `javascript:`) | Tampering / XSS | Build hrefs only from whitelisted enum values (`routeLogHref`); never echo raw params |
| Reflected param text in the page (empty-state copy names the filters) | XSS | Render labels from the enum → label map, never the raw value; React escapes text |
| Private CLI_X internals leaking into the public repo | Information disclosure | Only Tim-approved behaviour lines ship; no code, paths, identifiers or weights in data, plans or commits; reviewers grep the diffs for rule-ID-like strings |
| Dead or hijackable external links (expired domains `cli-x.com`) | Spoofing | D-12 data test rejects known-dead hosts; links only after Tim verifies |
| Network fetch in CI (supply chain / nondeterminism) | Tampering | Manual `fetch-trails.mjs` only; `build-trails --check` offline with sha256 |
| Large generated data in client bundles | Information disclosure / perf | `trail-profiles.ts` imported only by RSC; test enforces it |

## Sources

### Primary (HIGH confidence)
- Repo files read this session: `lib/trail-grade.ts`, `data/schemas/project.ts`, `data/types.ts`, `data/projects.ts`, `data/roadmap.ts`, `app/(site)/{projects,projects/[slug],roadmap,photos,photos/[slug]}/page.tsx`, `components/HologramTerminalDemo.tsx`, `components/ProjectDetailClient.tsx`, `components/photos/ViewSwitcher.tsx`, `lib/photos/view-param.ts`, `lib/terrain/dem-sample.ts`, `lib/geo.ts`, `lib/useReducedMotion.ts`, `scripts/terrain/build-terrain.mjs`, `scripts/terrain/fetch-dem.mjs`, `eslint.config.mjs`, `scripts/guards/test-count.mjs` + baseline, `e2e/{projects,no-webgl,shell,design-system}.spec.ts`, `e2e/visual/routes.spec.ts`, `proxy.ts`, `next.config.ts`, `app/globals.css`
- Next 16.4.2 docs in `node_modules/next/dist/docs/01-app/`: `03-api-reference/03-file-conventions/page.md`, `04-functions/use-search-params.md`, `use-router.md`, `generate-metadata.md`, `generate-static-params.md`, `02-route-segment-config/dynamicParams.md`
- swisstopo geo.admin.ch API (SearchServer, MapServer identify on `ch.swisstopo.swisstlm3d-wanderwege`), probed live this session
- Official Zermatt Tourism trail listings: [Hörnliweg No. 27](https://zermatt.swiss/en/p/hoernliweg-no-27-01tVj000005EwSkIAK), [Zmutt path No. 2](https://zermatt.swiss/en/p/zmuttweg-no-2-01tVj00000H69zjIAB), [Riffelseeweg No. 21](https://zermatt.swiss/en/p/riffelseeweg-no-21-01tVj000005Ew9KIAS), [Matterhorn Glacier Trail No. 26](https://zermatt.swiss/en/Media/Planning-hikes-tours/Matterhorn-Glacier-Trail-Nr.-26), [Hike to the Hörnli hut (Zermatters)](https://zermatt.swiss/en/p/hike-to-the-hoernli-hut-01tVj000004sJoIIAU)
- Private `tlex-web/cli_x` (read-only via `gh api`, summarised in my own words only)

### Secondary (MEDIUM confidence)
- [matterhornparadise.ch Hörnlihütte](https://matterhornparadise.ch/en/experience/hiking/hoernlihuette) ("Advanced", 8.5 km round trip, 2 h 15)
- [wandersite.ch Oberwallis](https://wandersite.ch/Tageswanderung/621_Oberwallis.html) (T4 for Hörnli)

### Tertiary (LOW confidence, not relied on)
- deine-berge.de (T3 Hörnli), Atupri 2020 factsheet (T2 Glacier Trail), Trailforks (T1 Z'Mutt), blog guides

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (no new packages; versions read from the install)
- Architecture: HIGH (every pattern has an in-repo precedent from Phases 8–10)
- Trail data: HIGH for grades (official listings) and DEM heights (probe reproduces the committed summit); MEDIUM for the via-point routing of the Zmutt path and Riffelseeweg
- CLI_X behaviour: MEDIUM (read from source; Tim confirms)
- Pitfalls: HIGH (each one observed in the code)

**Research date:** 2026-11-01
**Valid until:** 2026-12-01 (Next minor releases and the zermatt.swiss listings can change; re-check the grade URLs at the checkpoint)
