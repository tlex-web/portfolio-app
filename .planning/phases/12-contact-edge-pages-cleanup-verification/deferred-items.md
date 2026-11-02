## Deferred Items

- `.github/copilot-instructions.md:88` still describes the deleted glassmorphism navigation component (found by 12-04)
  status: open
  **What:** a doc line names a component VERIFY-01 deleted in 12-04. Out of 12-04's file list; README.md gets the same cleanup in 12-22, and this line can go with it.
- `e2e/design-system.spec.ts:20` comment lists `text-shadow-glow*` among the utilities it covers (found by 12-04)
  status: open
  **What:** 12-04 deleted the glow text-shadow tokens, so that utility no longer exists. Comment only (no assertion depends on it); out of 12-04's file list.
