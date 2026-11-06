---
phase: quick-261106-qvn
plan: 01
type: execute
wave: 1
depends_on: [quick-261106-mzc]
autonomous: false
must_haves:
  truths:
    - "Each dependency batch lands in its own PR, so a failure points at one change"
    - "axe 4.14 runs with no exceptions in the gate"
    - "Only Tim commits baseline PNGs"
---

# Quick task 261106-qvn: Dependabot group C

Tim approved four batches instead of the two big group PRs (#110 and #111), and later chose to fix all axe 4.14 names rather than configure or disable the rule. Done inline rather than through gsd-planner and gsd-executor, because those two cost about 480k tokens on 261106-joo.

| PR | Contents |
|----|----------|
| #128 | next and eslint-config-next 16.4.5, resend 6.37.0, `@upstash/ratelimit` 2.2.0, `@upstash/redis` 1.41.0 |
| #129 | tailwindcss and `@tailwindcss/postcss` 4.3.4, terminal note in `font-body`, three box baselines |
| #130 | three 0.187.0, `@react-three/fiber` 9.8.2, `@react-spring/three` 10.1.2, motion 14.10.0, Jest handling for three's ES module |
| #131 | `@playwright/test` 1.64.1 and all four image tags |
| #132 | `@axe-core/playwright` 4.14.0 and the 14 flagged link names |
| #133 | The 3 pixel tolerance extended from the 1440 waypoint-2 shot to the 1440 summit shot |
