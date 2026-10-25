---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-10-25T01:10:40.435Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 09 | stub | components/home/terrain/TerrainCanvas.tsx |  | TerrainCanvas renders no scene until 09-08 adds the terrain mesh as children (intentional, plan-stated) | open |  | 2026-10-25T01:10:40.435Z |  |

````json
[
  {
    "id": 1,
    "kind": "stub",
    "phase": "09",
    "file": "components/home/terrain/TerrainCanvas.tsx",
    "line": null,
    "description": "TerrainCanvas renders no scene until 09-08 adds the terrain mesh as children (intentional, plan-stated)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-25T01:10:40.435Z",
    "resolved_at": null,
    "milestone": "v2.0"
  }
]
````
