---
schema_version: 1
wave: 9
outcome: verified
reason: ok
checked: 4
passed: 3
failed: 0
needs_review: 1
---

Browser: claude-in-chrome. Target: production `next start` on http://localhost:3000, built from the branch HEAD (includes the 11-19 commits). Viewport: 2560 px wide only.

- C1 passed: on /projects/box, section#metrics holds exactly 3 links. Their text content is `Source (Tools)`, `Source (Tests)` and `Source (Binary)`, matching the dt labels `Tools`, `Tests` and `Binary`. The hrefs are `https://github.com/tlex-web/box#readme`, `.../box/blob/main/.planning/MILESTONES.md` and `.../box#readme`. None has a target or an aria-label, and none is named the bare `Source`.
- C2 passed: each link holds exactly one `span.sr-only`, with text `" (Tools)"`, `" (Tests)"` and `" (Binary)"`. Each starts with a space, and each is computed `position: absolute`.
- C3 needs_review: at 2560 px every suffix rect is 1x1. I removed all 3 .sr-only elements in one script run, and the rects of the dl, the tiles, the dds and the links were identical before and after. scrollWidth/scrollHeight stayed at 2550/3497. After removal each context dd reads `{context} Source`, for example `At the v2.0 milestone Source`. The criterion names 375, 768 and 1440 px, but I could not resize the viewport to those widths here. The plan's Playwright e2e covers them.
- C4 passed: /projects/coin-flip section#metrics has 2 tiles, 0 links and 0 .sr-only elements.

Separate observation, not part of the 11-19 criteria: coin-flip renders 2 metric tiles, while the UI-SPEC lists three (0 permissions, 50/50, 0 network calls). A human should confirm this is intended.
