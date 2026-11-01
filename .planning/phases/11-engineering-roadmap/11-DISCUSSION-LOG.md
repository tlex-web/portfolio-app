# Phase 11: Engineering & Roadmap - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-01
**Phase:** 11-engineering-roadmap
**Areas discussed:** Terminal demo form, Route panel glyph + grade, Claims & CLI_X content, Route log content & axis

---

## Terminal demo form

**Form of the restyled terminal**

| Option | Description | Selected |
|--------|-------------|----------|
| Flat token terminal | 2D panel with a title bar and trail-marker badges; three.js never loads on project pages; deterministic screenshots | ✓ |
| Keep 3D laptop, restyled | Token colours on the laptop scene; keeps the three.js chunk, needs the static-fallback gate, and drei `<Html>` text is harder to make accessible | |
| Flat terminal on contour art | Flat terminal on a static band of the contour SVG | |

**Pause behaviour**

| Option | Description | Selected |
|--------|-------------|----------|
| Hover/focus pause briefly | Leaving resumes; the Pause button is sticky; also pauses offscreen and in a hidden tab | ✓ |
| Any pause is sticky | Stays paused after any hover or focus until Play | |
| Start paused, Play to run | No autoplay at all | |

**Risk badge content**

| Option | Description | Selected |
|--------|-------------|----------|
| Glyph + grade + level + score | e.g. T1 · Low · 0.05 plus the explanation line; same wording as the scale and table | ✓ |
| Glyph + grade only | e.g. T1 | |
| Glyph + level word | e.g. Low risk | |

**Notes:** Tim was not asked about this. Claude kept the existing dot selectors (D-03) so nothing regresses. ENG-F1 stays deferred.

---

## Route panel glyph + grade

**Glyph source**

| Option | Description | Selected |
|--------|-------------|----------|
| Real DEM trail profile | Build-time SVG from the Phase 8 heightmap along a real trail in the 11 km sheet | ✓ |
| Pipeline-shaped profile | Abstract rises per project stage; invented elevations | |
| Screenshots | Real UI images; maintenance and off-metaphor | |

**Meaning of the trail-grade badge**

| Option | Description | Selected |
|--------|-------------|----------|
| Real grade of the drawn trail | Badge = the real SAC grade of the trail in the glyph; decorative, no claim about the code | ✓ |
| Build difficulty, assigned by Tim | Subjective; collides with CLI_X's command-risk meaning | |
| Highest risk the project handles | Only one project has real risk data | |

**Which trails**

| Option | Description | Selected |
|--------|-------------|----------|
| Claude proposes, Tim approves | Research picks two real trails with sourced grades and DEM heights; checkpoint approval; signpost caption | ✓ |
| Trails past the photo waypoints | Links to Photographs; constrains choices, low grades | |
| Tim names them now | Tim supplies the trails | |

**Website metric strip**

| Option | Description | Selected |
|--------|-------------|----------|
| Facts derived from data | Version, platforms and technology count; no new claims | ✓ |
| Tim supplies real metrics | Lighthouse, uptime and similar figures, with sources | |
| Omit the strip there | No strip on the website panel | |

---

## Claims & CLI_X content

**Unsourced claims**

| Option | Description | Selected |
|--------|-------------|----------|
| Claims audit at a checkpoint | Table of claims; Tim marks each source / soften / cut; context lines only where Tim confirms them | ✓ |
| Tim gives sources now | Links pasted up front | |
| Soften all, no checkpoint | Drop every comparative or unbacked number | |

**Missing Medium/High demo commands**

| Option | Description | Selected |
|--------|-------------|----------|
| Tim runs 2 more at a checkpoint | One medium and one high command, verbatim from CLI_X | ✓ |
| Ship with the four we have | Empty bands show range and label only | |
| Tim pastes them now | Supplied up front | |

**Per-grade behaviour**

| Option | Description | Selected |
|--------|-------------|----------|
| Draft from source, Tim confirms | Research reads the private cli_x repo via gh (read-only); Tim corrects the lines | ✓ |
| Tim writes them at the checkpoint | No repo access | |
| Leave behaviour out | Glyph, label, range and table only | |

**Dead project links** (found during discussion: all four URLs dead to the public)

| Option | Description | Selected |
|--------|-------------|----------|
| Only verified links + private note | Tim-verified links only; "Source: private repository" + contact link; a data-level check | ✓ |
| Keep them, Tim fixes targets | Tim makes the repos and domains live before ship | |
| Drop external links entirely | Contact CTA only | |

**Pricing tiers**

| Option | Description | Selected |
|--------|-------------|----------|
| One line in Problem, no prices | Mention the business model and drop the figures | ✓ |
| Keep a compact pricing block | Extra section outside the ENG-02 structure | |
| Remove pricing entirely | No mention | |

**14-item feature lists**

| Option | Description | Selected |
|--------|-------------|----------|
| Fold into sections, cut the rest | Features move into Pipeline, Safety, Metrics and Stack; the field leaves the data | ✓ |
| Top 5 + "All features" disclosure | Extra section | |
| Keep all 14 as a list | Restyled FeatureShowcase | |

---

## Route log content & axis

**Who writes the route log**

| Option | Description | Selected |
|--------|-------------|----------|
| Claude drafts, Tim fills CLI_X at a checkpoint | Portfolio rows from git, MILESTONES and PROJECT with real dates; Tim supplies the CLI_X and website status, order and dates | ✓ |
| Tim supplies the whole list | Fully manual | |
| Patch the existing items | Keep the stale entries, add fields only | |

**Portfolio granularity**

| Option | Description | Selected |
|--------|-------------|----------|
| v2.0 one entry, phases inside | v1.0 completed; v2.0 at camp with Phases 7–12 in its disclosure | ✓ |
| Each phase as its own entry | Six portfolio rows | |
| v2.0 one entry, no phases | Simplest | |

**Axis content**

| Option | Description | Selected |
|--------|-------------|----------|
| Band labels + order ticks | Base / Current camp / Summit; no metres | ✓ |
| Altitudes like Home's rail | Metres mapped from item order | |
| Time as the axis | Planned items have no dates | |

**"Last surveyed" source**

| Option | Description | Selected |
|--------|-------------|----------|
| Manual date in roadmap data | `surveyedAt` constant with a staleness test, labelled "Route log surveyed" | ✓ |
| Last git commit to roadmap data | Automatic; shallow-clone and typo-fix problems | |
| Build date | False freshness | |

---

## Claude's Discretion

- Whether clix-website gets a Pipeline section (only with factual copy that Tim approves)
- Route-log URL parameter names, segment counts and disabling logic
- The marker glyph set and extending `bg-trail` beyond the Phase 9 trail-sign tip
- The risk-scale form, the route index, the trailhead, the "Next route" link and the contact CTA (UI-SPEC)
- Which CLI_X metrics go in the panel strip (after the audit)
- Terminal layout details (wrapping, live-region wording, copy button)
- How Tim's content checkpoints are grouped and ordered

## Deferred Ideas

- ENG-F1, terminal step controls and transcript (already deferred)
- Fixing the project link targets (Tim's own work outside this repo)
- SEO-02 OG images (Phase 12)

---
---

# Second pass (2026-11-01): box + coin-flip replace both CLI_X projects

> Tim discontinued CLI_X at the 11-02 checkpoint ("Both CLI_X projects out"; "Pause and re-plan"). This pass updates CONTEXT.md for the new pair. 11-01 stays complete; 11-02 to 11-15 are re-planned. Mode: update existing context (the intent was recorded in STATE.md, so the Update/View/Skip and plans-exist prompts were not shown).

**Areas discussed:** Safety section & ENG-03, Demos: box terminal & coin-flip, Panels: trails, metrics & status, Route log rows

**Defaults stated, not asked:** slugs `box` and `coin-flip`; `/projects/clix-*` return the designed 404 with no redirects (Phase 10 precedent).

---

## Safety section & ENG-03

**What happens to ENG-03 (risk bands as trail grades)?**

| Option | Description | Selected |
|--------|-------------|----------|
| Retire it; plain Safety (Recommended) | Mark ENG-03 dropped and remove SC3; box Safety describes its real preview/--force gate; trail grades keep one meaning | ✓ |
| Re-grade box's commands | Sort the 23 commands by what they can change on disk onto the trail-grade scale; a classification of our own, with 3 natural levels against 4 bands | |
| Retire it; Safety as a diagram | Same, but a preview → review → --force → write step diagram | |

**What fills coin-flip's Safety slot?**

| Option | Description | Selected |
|--------|-------------|----------|
| Same slot, "Privacy" heading (Recommended) | Heading per project; zero permissions, offline, no trackers; fairness moves to Pipeline | ✓ |
| Omit Safety for coin-flip | ENG-02 omit rule; privacy facts go to Problem and Metrics | |
| "Safety" heading for both | Literal heading on both pages | |

**How does box's Safety section show the gate?**

| Option | Description | Selected |
|--------|-------------|----------|
| Prose + one real dry-run (Recommended) | Claude captures a preview run against a scratch folder with the local box; Tim approves | ✓ |
| Prose + the three gated commands | A list, no captured output | |
| Prose; the dry-run lives in the demo | The gate shows only while the loop is on that command | |

---

## Demos: box terminal & coin-flip

**How is the box terminal output captured?**

| Option | Description | Selected |
|--------|-------------|----------|
| I capture from local box (Recommended) | Read-only commands, scratch inputs, NO_COLOR, no home paths or network; Tim approves the transcript | ✓ |
| You run them and paste | As in 08-03; costs Tim a session | |

**What story does the loop tell?**

| Option | Description | Selected |
|--------|-------------|----------|
| Scriptable toolkit (Recommended) | 4–5 commands: BLAKE3 hash, uuid --json, epoch, a --json pipeline; optional one-line note per command | ✓ |
| Breadth across categories | One command from each README group | |
| You decide | Claude picks | |

**What does coin-flip's Demo show?**

| Option | Description | Selected |
|--------|-------------|----------|
| Short muted clip (Recommended) | 5–10 s same-origin video, never autoplays, poster frame, ~1.5 MB | ✓ |
| Three stills | Rest → mid-toss → result screenshots | |
| No Demo section | ENG-02 omit rule | |

**Where does the clip come from?**

| Option | Description | Selected |
|--------|-------------|----------|
| You record a fresh one (Recommended) | Human-action checkpoint; no clip means no Demo section | ✓ |
| I pick from the repo's evidence | Existing QA recordings; may show debug layers | |

**11-01 open question: resuming by mouse while hovered**

| Option | Description | Selected |
|--------|-------------|----------|
| Press resumes at once (B) | Releasing the toggle clears the current hover/focus pauses until next enter (WAI explicit start) | ✓ |
| Keep as built (A) | D-02 literal; looks unresponsive until the pointer leaves | |

---

## Panels: trails, metrics & status

**Which trail goes with which project?**

| Option | Description | Selected |
|--------|-------------|----------|
| box Hörnliweg T4, coin Zmutt T1 (Recommended) | Most distinct glyphs; both climb; the Hörnliweg line matches its official length | ✓ |
| box Zmutt T1, coin Hörnliweg T4 | Swapped | |
| box Riffelseeweg T2, coin Zmutt T1 | Ties to the Riffelsee waypoint; the profile descends | |

**What goes in the metric strips?**

| Option | Description | Selected |
|--------|-------------|----------|
| Proposed sets (Recommended) | box 23 tools · 507 tests · 1 binary; coin-flip 0 permissions · 50/50 · 0 network calls | ✓ |
| Engineering-effort sets | LOC, plans, phases, days | |
| You decide | Claude picks; the audit approves | |

**Which box version does the kicker show?**

| Option | Description | Selected |
|--------|-------------|----------|
| v2.0, the release tag (Recommended) | Matches the GitHub tag and milestone; the loop avoids --version | ✓ |
| 0.1.0, what the binary says | Literal binary version | |
| No version | Sidesteps the mismatch | |

**How candid is coin-flip's page about unfinished v1 work?**

| Option | Description | Selected |
|--------|-------------|----------|
| Honest, in general terms (Recommended) | "v1 · on device"; remaining work named in plain words; no internals | ✓ |
| Show only what works | Next steps reads only "Play Store release" | |
| Full candor | Names the unmet criterion on the page | |

---

## Route log rows

**At what level do box and coin-flip appear?**

| Option | Description | Selected |
|--------|-------------|----------|
| One row per milestone (Recommended) | box v1.0, v2.0; coin-flip v1.0; only portfolio v2.0 has a disclosure | ✓ |
| Feature rows | Like the old CLI_X rows | |
| Milestones with disclosures | Phase lists on every row | |

**What sits at the Summit?**

| Option | Description | Selected |
|--------|-------------|----------|
| Only what the repos record (Recommended) | coin-flip v1.1 and Play Store release; no box row (next milestone undefined) | ✓ |
| You add box plans at the checkpoint | Same, plus Tim names box items | |
| No planned rows for either | History only | |

**Stale portfolio rows (3D gallery, photography blog)**

| Option | Description | Selected |
|--------|-------------|----------|
| Retire gallery, retire blog (Recommended) | Gallery shipped as Phase 10; no plan behind the blog | ✓ |
| Retire gallery, keep blog | Blog stays planned with no target | |
| Keep gallery as completed, keep blog | Repeats the Phase 10 line | |

---

## Found during the pass (not asked)

- `data/home.ts` (Phase 9 Home About copy) names CLI_X, so it is rewritten under D-16 (D-33).
- `components/Footer.tsx` still links to `/projects/clix-*`, but it is v1 legacy with no importer (Phase 12 deletes it).

## Claude's Discretion (second pass)

- Whether box gets a Pipeline section (public facts only, Tim approves)
- Stack groups for both projects; the dry-run command; the terminal command order and notes; panel order (box first)
- Clip encoding and the video extension of the asset guard
- Route-log URL parameters, counts and disabling logic; the marker glyph set (unchanged)

## Deferred Ideas (second pass)

- Bump box's Cargo.toml to match the v2.0 tag (Tim, box repo)
- A defined next box milestone; making coin-flip public (data edits when they happen)
- Delete components/Footer.tsx (Phase 12)
