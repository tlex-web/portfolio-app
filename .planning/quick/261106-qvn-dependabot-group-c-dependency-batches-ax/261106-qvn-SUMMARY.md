---
phase: quick-261106-qvn
plan: 01
status: complete
subsystem: dependencies
tags: [dependabot, tailwind, axe, playwright, a11y]
requires: [quick-261106-mzc]
provides:
  - "All planned dependency batches on main, each proven in its own CI run"
  - "axe 4.14 in the gate with no exceptions"
  - "Grid tile names that carry the place, altitude and date"
key-decisions:
  - "Ten of the 14 flagged names were already correct: a space between adjacent spans clears the rule with no name or pixel change"
  - "The terminal note uses font-body, because font-sans was never this project's Inter and followed Tailwind's default stack"
  - "Playwright 1.65 stays out: it changes all three browser revisions and needs a full re-baseline"
completed: 2026-11-06
---

# Quick task 261106-qvn: Dependabot group C

**The dependency backlog is on main in small PRs, and open Dependabot alerts went from 60 to 2.**

## Findings worth keeping

- **Box snapshots.** Splitting the Tailwind pair did not cause the failures, as I first thought. `components/projects/DemoTerminal.tsx` used `font-sans`, and Tailwind 4.3.3 changed that default stack, moving exactly 1025 pixels in all six box tests.
- **Axe label rule.** axe reads adjacent spans with no separator, so `Photographs` and `4 waypoints` became `Photographs4 waypoints`. The audit counted 13 elements; the real number is 14, including the end block on `/projects/coin-flip`.
- **Waypoint-2 flake.** It belongs to the poster's triangle mark, which is also in the summit shot, so the first tolerance was too narrow.
- **Contact form.** `PROD_FORM_SEND=1 npm run test:prod-form` passed 5 of 5 on production with the new `resend`, and Tim confirmed the email arrived.

## Traps

- `npm install pkg@^x` picks the newest in range and gave Tailwind 4.3.5 and Playwright 1.65.0. `pkg@x.y.z` still saves a caret and keeps the lockfile exact.
- `next start` locks native binaries, so `npm ci` fails while it runs, and the `npm install` after it prunes `@emnapi` lockfile entries.
- `gh api .../jobs/N/logs` needs `--allow-escape-sequences`, or it returns nothing.

## Remaining

- Two alerts, both development-only: `minimatch` (the fix needs a major bump) and `deepmerge` (no fix yet).
- Playwright 1.65 needs its own PR and a full re-baseline.
