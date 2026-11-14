---
phase: "14"
slug: "ui-fixes-terminal-controls"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
created: "2026-11-14"
---

# Phase 14 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

The register was written at plan time. All 8 PLAN files have a `<threat_model>` block, with 20 entries in total: T-14-01 to T-14-12, plus one T-14-SC supply-chain row per plan. The audit checked the planned mitigations at ASVS L1 depth and did not look for new threats. The evidence for each control is a file:line, the test that asserts it, or the CI record. No SUMMARY raised a threat flag.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Visitor input → client navigation | A click on a menu link decides whether the browser or Next navigates (14-01) | click modifiers, href, pathname, query |
| Test gate → merge | The B8 and 375 px rows decide whether a contrast or overflow regression can merge (14-02) | rendered pixels, scroll widths |
| URL → DOM selector | The shown slug from the photo route goes into a `[data-photo-id]` selector (14-03) | photo slug |
| Keyboard input → hidden UI state | Escape presses are routed through the viewer's layers (14-04) | key events |
| Visitor input → island state | Button presses, including on aria-disabled buttons, drive the terminal state machine (14-05) | step index |
| Committed data → rendered HTML | Demo command text and captured output from `data/projects.ts` render as page text (14-06) | command, output and note strings |
| Planning records → later audits | Later audits read the ledger and disposition files as the truth about review findings (14-07) | dispositions, commit SHAs |
| Local branch → origin | Pushing publishes the branch and starts CI (14-08) | branch tip |
| CI artifact → committed baselines | Downloaded PNGs become the new visual truth (14-08) | screenshot PNGs |
| npm registry → repository | Third-party packages would enter the build (every plan) | packages, lockfile |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-14-01 | Tampering | SiteNav panel Link `onClick` (default prevented) | low | mitigate | `components/site/SiteNav.tsx:230-234` treats only a plain primary activation as eligible (`button === 0`, none of meta, ctrl, shift or alt). `:132` prevents the default only for the current-page href with an empty query. Covered by Jest `components/site/__tests__/SiteNav.test.tsx:213` (plain tap closes and prevents navigation) and `:230` (a Ctrl or Shift click keeps the panel open), and by e2e `e2e/shell.spec.ts:332` | closed |
| T-14-02 | Tampering | B8 gate in `e2e/home-modes.spec.ts` | medium | mitigate | The threshold stays at 4.5 (`e2e/home-modes.spec.ts:565`, `:624`, `:649`, `:709`, `:719`) and each failing value is annotated. The `guard:tests` ratchet ran in CI's Unit Tests "Test-count ratchet" step on run 43596110950 and passed on 43600436335 | closed |
| T-14-03 | Tampering | `restoreFocus` selector built from the slug | low | mitigate | `components/photos/LightboxDialog.tsx:164` builds the selector through `cssEscape(slug)` (imported at `:7`, T-10-12). `revealTrigger(el: HTMLElement)` at `:127` takes an element, never a string | closed |
| T-14-04 | Denial of service | `revealTrigger` re-reveal | low | mitigate | `components/photos/LightboxDialog.tsx:168-170` makes one immediate call and one `requestAnimationFrame` call, guarded by `document.activeElement === mark`. The file adds no scroll listener, `setTimeout` or `setInterval` | closed |
| T-14-05 | Tampering | `collapseCallout` Escape layer | low | mitigate | `components/photos/PhotoViewer.tsx:353-360` lets a press be consumed only by a candidate with client rects, i.e. a visible label or key row. Covered by the 14-04 D-12 and D-22 Jest rows and by the `e2e/photos-lightbox.spec.ts` D-12 rows | closed |
| T-14-06 | Denial of service | `DemoTerminal` step handlers and `goTo` RangeError | low | mitigate | `lib/demo-terminal.ts:109-111` makes `stepTo` return `null` outside `[0, count)`. `components/projects/DemoTerminal.tsx:390` and `:425` check the end before calling it, so `goTo` never sees -1 or `count`. The 14-05 end-press Jest rows prove both ends | closed |
| T-14-07 | Tampering | Transcript output rendering in `DemoTerminal` | low | mitigate | `components/projects/DemoTerminal.tsx` has no `dangerouslySetInnerHTML` (0 matches). The transcript (`data-transcript`, `:436`) renders output as React text children inside `<samp>`, and the data stays zod-validated in `data/projects.ts` | closed |
| T-14-08 | Repudiation | 13-LEDGER-TRIAGE.md and the archived disposition files | low | mitigate | Append-only write-back in `d78c251`. The SHAs it cites (`49b8fe1`, `d6873c8`, `945d235`) all resolve with `git cat-file -t` as commits | closed |
| T-14-09 | Tampering | GUARD-03 test ratchet | medium | mitigate | `npm run guard:tests` runs in CI's Unit Tests job ("Test-count ratchet" step), which succeeded on 43596110950 (79def47) and 43600436335 (55160a4). Local Jest is 1795/1795 | closed |
| T-14-10 | Tampering | Re-baseline absorbing an unintended visual change | high | mitigate | One `update_mode=changed` dispatch, run 43599067566, after the functional jobs passed. Its 11 changed PNGs and 1 new one all fall inside the declared `menu/`, `home/` and `box/` set, and no `home/375-*` changed. Tim reviewed and committed `55160a4`. `check-snapshot-commit --some --allow menu --allow home --allow box` printed `snapshot-commit: OK (12 changed)` and exited 0 (14-08-SUMMARY) | closed |
| T-14-11 | Tampering | Downloaded artifact contents | low | mitigate | The artifact was downloaded into a new, empty scratch directory outside the repo. Only the 12 changed or new `-linux.png` files were copied, and each is byte-identical to the artifact by `git hash-object`. The orchestrator re-downloaded it into a second fresh scratch directory and confirmed the match (14-08-SUMMARY:119) | closed |
| T-14-12 | Elevation of privilege | Pushes and dispatches without consent | medium | mitigate | Tim's D-19 reply "approve (Recommended)" came before any push or dispatch and is quoted in 14-08-SUMMARY:93. `ci/14-08` moved only by fast-forward (79def47 is an ancestor of 55160a4), and nothing was force-pushed. No `gsd/phase-14*` branch exists on origin, and the PNG commit and its push were Tim's own | closed |
| T-14-SC | Tampering | npm/pip/cargo installs (one row per plan, 8 plans) | low | accept | No package was installed in Phase 14: `package.json` and `package-lock.json` are unchanged from `e6ffce1` to HEAD. CI installs the committed lockfile with `npm ci` | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-14-01 | T-14-SC | No package is installed by any Phase 14 plan, so there is no new supply-chain surface. The accept disposition comes from planning (RESEARCH "Package Legitimacy Audit": not applicable) | plan-time disposition (14-01 to 14-08) | 2026-11-14 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-14 | 13 (T-14-01 to T-14-12, T-14-SC) | 13 | 0 | /gsd-secure-phase 14 (orchestrator, L1 grep depth; auditor skipped by the short-circuit rule) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-14
