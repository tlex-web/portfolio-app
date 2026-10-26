---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 2
total_count: 3
last_updated: 2026-10-26T15:49:04.457Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 09 | stub | components/home/terrain/TerrainCanvas.tsx |  | TerrainCanvas renders no scene until 09-08 adds the terrain mesh as children (intentional, plan-stated) | fixed |  | 2026-10-25T01:10:40.435Z | 2026-10-25T01:29:53.825Z |
| 2 | 10 | stub | components/photos/PhotoViewer.tsx |  | Viewer chrome groups data-chrome-left/right are empty (only the page's 'All photographs' link from 768 px) until 10-05 (Close), 10-06 (stepping, counter) and 10-10/10-11 (Zoom, Hide labels) fill them; the 56 px bar shows blank meanwhile (intentional, plan-stated) | fixed |  | 2026-10-26T11:09:20.392Z | 2026-10-26T15:26:25.274Z |
| 3 | 10 | unrun-verify | e2e/photos-sweep.spec.ts |  | 10-12 E5 composite: the Tab-wrap leg was not run in local WebKit (CSP upgrade-insecure-requests blocks localhost hydration, 10 deferred item); Chromium and Firefox pass, Tim's real-Safari UAT covers it | open |  | 2026-10-26T15:49:04.457Z |  |

````json
[
  {
    "id": 1,
    "kind": "stub",
    "phase": "09",
    "file": "components/home/terrain/TerrainCanvas.tsx",
    "line": null,
    "description": "TerrainCanvas renders no scene until 09-08 adds the terrain mesh as children (intentional, plan-stated)",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-10-25T01:10:40.435Z",
    "resolved_at": "2026-10-25T01:29:53.825Z",
    "milestone": "v2.0"
  },
  {
    "id": 2,
    "kind": "stub",
    "phase": "10",
    "file": "components/photos/PhotoViewer.tsx",
    "line": null,
    "description": "Viewer chrome groups data-chrome-left/right are empty (only the page's 'All photographs' link from 768 px) until 10-05 (Close), 10-06 (stepping, counter) and 10-10/10-11 (Zoom, Hide labels) fill them; the 56 px bar shows blank meanwhile (intentional, plan-stated)",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-10-26T11:09:20.392Z",
    "resolved_at": "2026-10-26T15:26:25.274Z",
    "milestone": "v2.0"
  },
  {
    "id": 3,
    "kind": "unrun-verify",
    "phase": "10",
    "file": "e2e/photos-sweep.spec.ts",
    "line": null,
    "description": "10-12 E5 composite: the Tab-wrap leg was not run in local WebKit (CSP upgrade-insecure-requests blocks localhost hydration, 10 deferred item); Chromium and Firefox pass, Tim's real-Safari UAT covers it",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-26T15:49:04.457Z",
    "resolved_at": null,
    "milestone": "v2.0"
  }
]
````
