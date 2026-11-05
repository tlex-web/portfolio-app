---
phase: 12-contact-edge-pages-cleanup-verification
plan: 01
subsystem: content
tags: [copy, content-packet, metadata, og, contact, edge-pages, roadmap-data, ci]

# Dependency graph
requires:
  - phase: 11
    provides: "approved coin-flip clip description (data/projects.ts:222) and the 11-08 Q3 route-log carry-over"
provides:
  - "12-CONTENT-PACKET.md with Tim's verbatim answers (2026-11-02)"
  - "## Resolved values table: 52 keyed rows (51 supplied, 1 not supplied) that plans 12-07 to 12-16, 12-19 and 12-22 to 12-26 grep"
affects: [12-07, 12-08, 12-09, 12-10, 12-11, 12-12, 12-13, 12-14, 12-15, 12-16, 12-19, 12-22, 12-23, 12-24, 12-25, 12-26]

# Actuals (#2632) — estimateTokens scale (chars/4 over the realized diff)
actuals:
  tokens: 8000
  tasks: 2
  # Measured: git rev-list 8363f1f..HEAD restricted to this plan's own commits
  # (git log --grep='(12-01)'). The unrestricted range count is 8 because plan 12-02
  # ran and committed (31daaf9..8bf4aa7) between Task 1 and Task 2; those are not 12-01's.
  # This SUMMARY's own commit follows plan_head_after.
  commits: 2
plan_head_before: 8363f1f23256ed5eb184abd1754d97db488f007c
plan_head_after: 4a627d845894fa9c1bd2151d2540399cbfd29c58

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Keyed content packet: later plans read only '| <key> | supplied | ... |' rows; a 'not supplied' row carries its UI-SPEC Content Gates fallback"

key-files:
  created:
    - .planning/phases/12-contact-edge-pages-cleanup-verification/12-CONTENT-PACKET.md
  modified: []

key-decisions:
  - "Tim approved every section-A Contact string with form lead option 2 (no claim): \"Your name, your email and a message.\""
  - "Tim confirmed geo.location 47.37 N · 8.54 E · Zürich (Wikipedia infobox 47.37444 N 8.54111 E, 2 decimals)"
  - "Tim declined the D-24 HEADS sentence (\"heads skip\"); the coin-flip figcaption stays as approved"
  - "Route log: Phase 11 completed 2026-11-02, Phase 12 in-progress, surveyedAt 2026-11-02 (Tim: \"log ok\")"
  - "UI-SPEC defaults #1-#14 all take the default column (Tim: \"F: defaults\")"
  - "sw.reload-once yes; docs.stale-refs fix in 12-22; Vercel plan Hobby; ci.push yes (plain pushes to ci/12-NN, never force); info.csp acknowledged without veto"

patterns-established:
  - "Content gate: copy ships only from a 'supplied' row in 12-01-SUMMARY.md '## Resolved values'"

requirements-completed: [CONTACT-01, CONTACT-02, EDGE-01, EDGE-02, SEO-01, SEO-02]

coverage:
  - id: D1
    description: "Content packet with one keyed row per Phase 12 input only Tim can give (52 keys)"
    verification:
      - kind: other
        ref: "grep -cE \"^\\| (copy|geo|meta|og|log|default|sw|docs|vercel|ci|info)\\.\" 12-CONTENT-PACKET.md (52 above the answers; 104 total with Resolved values)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Tim's reply recorded verbatim with date, and a Resolved values table with exactly one row per key"
    verification:
      - kind: other
        ref: "key-set diff packet rows vs Resolved values rows (52 = 52, each key once); grep -cxF of Tim's reply = 1"
        status: pass
    human_judgment: false

# Metrics
duration: 25min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 01: Content Packet Summary

**Phase 12 content packet answered by Tim on 2026-11-02: 51 of 52 keys supplied (all Contact, edge, metadata and OG copy; Zürich 47.37 N · 8.54 E; route log dated 2026-11-02; UI-SPEC defaults #1-#14; reload-once, stale-refs fix, Hobby, ci push yes), HEADS sentence declined.**

## Performance

- **Duration:** about 25 min wall clock (Task 1 commit 2026-11-02T16:16:24Z to SUMMARY 2026-11-02T16:42Z; includes the checkpoint wait and plan 12-02's run in between)
- **Started:** 2026-11-02 (Task 1, prior executor)
- **Completed:** 2026-11-02T16:42Z
- **Tasks:** 2 of 2
- **Files modified:** 1 (12-CONTENT-PACKET.md), plus this SUMMARY

## Accomplishments

- 12-CONTENT-PACKET.md carries every Draft string of 12-UI-SPEC.md, the Zürich reference point with its source, the route-log dates, the 14 UI-SPEC defaults and the four open decisions, each as one keyed row (Task 1).
- Tim's reply is recorded byte for byte with its date under `## Answers (verbatim)` (Task 2).
- `## Resolved values` maps the reply literally onto all 52 keys: 51 `supplied`, 1 `not supplied` (copy.heads-sentence, with its Content Gates fallback).

## Task Commits

1. **Task 1: Write the Phase 12 content packet** - `d10173e` (docs)
2. **Task 2: Tim answers the packet** - `4a627d8` (docs)

**Plan metadata:** recorded in the final `docs(12-01)` metadata commit.

## Files Created/Modified

- `.planning/phases/12-contact-edge-pages-cleanup-verification/12-CONTENT-PACKET.md` - keyed drafts and decisions, Tim's answers, Resolved values table

## Decisions Made

All decisions are Tim's, quoted in `## Answers (verbatim)` below; the mapping onto keys is in `## Resolved values`. Mapping notes:

- "A: approve all, lead option 2": every section-A key takes the packet's proposed text; copy.form-lead is option 2. Tim did not ask for visible nouns on the `Retry` / `Copy` labels, so the proposed text stands.
- "E: heads skip": copy.heads-sentence is `not supplied`; the figcaption stays as approved and the item stays open. Tim gave no further reason.
- "F: defaults": default.1 to default.14 each take the DEFAULT column, not the alternative.
- "H: ok": info.csp acknowledged without veto.

No packet key was left uncovered by Tim's reply.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Plan 12-02 ran between Task 1 and Task 2 (commits 31daaf9..8bf4aa7); its commits are excluded from this plan's commit list.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 12-07 to 12-16, 12-19 and 12-22 to 12-26 can grep `| <key> |` rows below.
- ci.push = yes: the round plans (12-11, 12-19, 12-23) may push plain `ci/12-NN` branches, never force.
- The HEADS item (D-24) stays open: Tim declined the sentence and gave no further reason.
- Requirements CONTACT-01, CONTACT-02, EDGE-01, EDGE-02, SEO-01 and SEO-02 are copied from the plan frontmatter as required; this plan supplies their inputs only, and the implementing plans complete them.

## Answers (verbatim)

Tim, 2026-11-02:

A: approve all, lead option 2; B: confirm; C: approve; D: approve; E: heads skip, log ok; F: defaults; G: reload-once yes, stale refs fix, Hobby, ci push yes; H: ok

## Resolved values

One line per packet key (52). `supplied` rows carry the final value; the one `not supplied` row carries its UI-SPEC Content Gates fallback.

| Key | Status | Value |
|-----|--------|-------|
| copy.contact-kicker | supplied | `Summit register` |
| copy.contact-h1 | supplied | `Contact` |
| copy.contact-intro | supplied | "Write a line in the register. I read every entry and reply by email." |
| copy.form-h2 | supplied | `Sign the register` |
| copy.form-lead | supplied | "Your name, your email and a message." (option 2, no claim) |
| copy.checkbox-label | supplied | `I'd like to talk about working together` |
| copy.field-errors | supplied | Name empty: `Enter your name.` Email empty: `Enter your email address.` Email invalid: `Enter a full email address, with an @ and a domain.` Message empty: `Write a message.` Too short: `Write at least 10 characters (now {n}).` Too long: `Shorten the message to 2,000 characters (now {formatCount(n)}).` |
| copy.summary-title | supplied | `Check 1 field` / `Check {n} fields` |
| copy.fail-send | supplied | title `Couldn't send.`; body "Your message is still here. Try again, or email me at {email}."; button `Retry` (name `Retry sending`) |
| copy.fail-network | supplied | title `Couldn't reach the server.`; body "Check your connection. Your message is still here. Try again, or email me at {email}."; `Retry` |
| copy.fail-429 | supplied | title `Too many attempts.`; body "This connection has sent too many entries in the last hour. Try again in {m} minutes, or email me at {email}." (`{m}` = ceil(`Retry-After` / 60), minimum 1, `1 minute` singular; header missing → "Try again later, or email me at {email}.") |
| copy.fail-403 | supplied | title `Couldn't verify this page.`; body "Copy your message, reload the page and send it again, or email me at {email}." |
| copy.panel-h2 | supplied | `Direct contact` |
| geo.location | supplied | `47.37 N · 8.54 E · Zürich` (source: Wikipedia "Zurich" infobox, 47.37444 N 8.54111 E, rounded to 2 decimals) |
| copy.404-body | supplied | "There's no page at this address; the link may be mistyped or out of date." |
| copy.404-photo | supplied | "No photograph at this address." + `All photographs` |
| copy.404-project | supplied | "No project at this address." + `All routes` |
| copy.error-report | supplied | `Report this error` |
| copy.offline-h1 | supplied | `You're offline` |
| copy.offline-body | supplied | "This page needs a connection and reloads by itself when you're back online." |
| copy.offline-h2 | supplied | `Saved on this device` |
| copy.offline-empty | supplied | "No pages are saved on this device yet." |
| copy.offline-unsupported | supplied | "This browser can't list saved pages." |
| meta.photos | supplied | title `Photographs` · description "Landscape photographs from around Zermatt, each placed on the terrain where Tim took it." |
| meta.photo-slug | supplied | title `{title}` · description "{title}: a photograph by Tim Lui from {short place} at {altitude}[ approx.], {Mon YYYY \| YYYY}." |
| meta.projects | supplied | title `Engineering` · description "What Tim builds: box, a command-line toolkit for PowerShell, and coin-flip, a fair 3D coin toss for Android." |
| meta.roadmap | supplied | title `Roadmap` · description "What Tim has finished, is working on and plans next for this site, box and coin-flip." |
| meta.contact | supplied | title `Contact` · description "Write to Tim Lui. Messages go straight to his inbox, and he usually replies within a few days." |
| og.alt-default | supplied | `Tim Lui, developer and photographer, over a contour map of the Matterhorn` |
| og.alt-photo | supplied | `{title}, a photograph by Tim Lui. {short place}, {altitude}[ approx.]` |
| og.alt-project | supplied | `{name}: {pitch}` |
| copy.heads-sentence | not supplied | The figcaption stays as approved; the item stays open with Tim's reason (Tim's reply: "heads skip"; no further reason given) |
| log.phase11 | supplied | Phase 11 `completed`, completedAt `2026-11-02`; Phase 12 `in-progress`; `surveyedAt` `2026-11-02` |
| default.1 | supplied | Default: Contact on plain `surface` |
| default.2 | supplied | Default: DOM order form → panel; panel `order-first` below 1024 |
| default.3 | supplied | Default: Copy failure: select the address silently |
| default.4 | supplied | Default: Kicker `Summit register` + h1 `Contact` |
| default.5 | supplied | Default: Inline errors without a live role; summary `role="alert"` + focus |
| default.6 | supplied | Default: Error copy rewritten to cause + fix (`Enter your name.`) |
| default.7 | supplied | Default: Edge art: square sheet, max 448 px |
| default.8 | supplied | Default: OG photo: contain-fit in a 768 slot with mats |
| default.9 | supplied | Default: HEADS fix via a figcaption sentence |
| default.10 | supplied | Default: Hero scrim: amend the 09 spec to `lg:` |
| default.11 | supplied | Default: Summit dark wedge: close as terrain |
| default.12 | supplied | Default: Rail tick 4.81:1: accept, B8 keeps the floor |
| default.13 | supplied | Default: `Send Message` kept exactly |
| default.14 | supplied | Default: Honeypot `trail_note`, label `Leave this field empty` |
| sw.reload-once | supplied | yes: reload once on `controllerchange` only when no form field is dirty; otherwise the next in-site navigation is a hard navigation (12-08 builds the guarded reload) |
| docs.stale-refs | supplied | fix: update `.github/copilot-instructions.md` in the README pass (12-22); `project_concept/` is gitignored (`.gitignore:90`) and stays unchanged |
| vercel.plan | supplied | Hobby (Skew Protection is Pro/Enterprise, so not available; the SW reload guard works either way) |
| ci.push | supplied | yes: plain pushes only, never force, of `ci/12-NN` branches for this phase's CI and re-baseline runs |
| info.csp | supplied | acknowledged, no veto: 12-02 drops the GitHub raw-content origin and keeps `'unsafe-eval'` only under `next dev` |

## Self-Check: PASSED

- FOUND: .planning/phases/12-contact-edge-pages-cleanup-verification/12-CONTENT-PACKET.md
- FOUND: d10173e, 4a627d8 (ancestors of HEAD)
- Resolved values: 52 rows, 52 unique keys, key set equal to the packet's 52 keys; 51 supplied, 1 not supplied
- `## Answers (verbatim)` and `## Resolved values` match the packet byte for byte (diffed at commit time)

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*
