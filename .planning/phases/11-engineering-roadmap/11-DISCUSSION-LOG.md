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
