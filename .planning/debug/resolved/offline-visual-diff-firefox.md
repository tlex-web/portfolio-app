---
status: resolved
trigger: "offline visual diff + firefox contact-form E2E after 07-06 platform bump"
created: 2026-10-11T00:00:00Z
updated: 2026-10-11T13:50:00Z
---

## Current Focus

bug_class: Bohrbug (both failures deterministic, identical across 2 CI runs)
user_decision (2026-10-11): Q1 = Option C (explicit {' '} after </strong> in app/offline/page.tsx + commit the 6 working-tree offline PNGs as a documented exception to the zero-diff gate, 07-05 pattern). Q2 = fix B (8d37032, SafeCanvas) accepted incl. trade-off (scene errors -> blank canvas instead of full-page error).
status_A (visual): RESOLVED - e72c661 (Option C); CI run 38134022192 Visual 72/72.
status_B (firefox): RESOLVED - user-accepted and CI-confirmed (run 38132996185 on 8d37032; again green in 38134022192, E2E 58/58).
fix_A_plan: |
  1. app/offline/page.tsx:39 -> `<strong>Good news!</strong>{' '}` at end of line, text continues on next line (leading newline+indent trimmed by JSX spec in every compiler); drop the trailing space after "content." (non-last-line trailing whitespace is trimmed by spec anyway).
  2. Verify compiled chunk: jsx("strong",...)," ","This site ..." (exactly one " " separator, no leading space in the text) with Next 16.4.0; also with 16.2.6 SWC (scratchpad swc-jsx.cjs) to prove compiler independence.
  3. Verify sha1 of the 6 working-tree PNGs == CI actuals recorded at 11:15; commit page.tsx + 6 PNGs in one commit (exception documented, 07-05 pattern).
  4. Local gates (tsc, lint, jest, guard selftest, test-count); force-push ci/07-06; CI must be Visual 72/72, E2E 58/58, others green. Else STOP + checkpoint (no re-baseline).

reasoning_checkpoint:
  hypothesis: "Firefox E2E fails because R3F >= 9.8.0 reports the WebGLRenderer-construction error (CI firefox has no WebGL) via setError -> render-time throw, and no React error boundary sits between <Canvas> and app/error.tsx, so the whole route is replaced by the error page."
  confirming_evidence:
    - "CI traces of all 12 failures: 'Error creating WebGL context' -> 'Application error: Error', page = app/error.tsx"
    - "R3F 9.6.1/9.7.0 source: async run() without catch; 9.8.0/9.8.1: configure().catch(setError) + `if (error) throw error`"
    - "Local bisect: 73880a2 passes 10/10 on firefox-nowebgl; 73880a2 + only R3F 9.8.1 fails 7 with the error page; firefox with WebGL passes"
  falsification_test: "If wrapping each <Canvas> in an error boundary does NOT make contact/homepage render on firefox-nowebgl at a3c2b81, or reverting the boundary does not bring the error page back, the hypothesis is wrong."
  fix_rationale: "The error is now (intentionally upstream) delivered through React; the app must contain it at the canvas. SafeCanvas = R3F Canvas inside an error boundary whose fallback is the inert DOM R3F < 9.8 left behind without WebGL (wrapper div with the caller className/style > div > empty canvas). That restores the pre-9.8 result (blank 3D area, page intact, same box, canvas element still attached) without pinning R3F, and works for any later Next/R3F version."
  blind_spots: "Errors thrown by scene children (texture load etc.) previously also reached app/error.tsx via R3F internal ErrorBoundary -> setError; they are now contained to the canvas too (behaviour change, flagged). Chromium visual baselines should be unaffected since the boundary adds no DOM while WebGL works - confirmed only by CI visual run."
  candidate_causes:
    - "code: R3F 9.8 configure().catch(setError) rethrow (confirmed)"
    - "code: HologramTerminal portal change in a3c2b81 (eliminated - bisect reproduces with R3F 9.8.1 only, /contact and / do not use HologramTerminal)"
    - "environment: CI firefox lacks WebGL (necessary condition, pre-existing and unchanged)"
    - "dependency: Next 16.4 / React 19.3 (eliminated for B - not needed to reproduce)"
  and_gate: "yes - requires BOTH (a) a browser without WebGL (pre-existing CI firefox condition, also real users with HW accel disabled / webgl.disabled) AND (b) R3F >= 9.8 rethrow with no app-level boundary. Fix targets (b); (a) is environment."
reasoning_checkpoint_A:
  hypothesis: "The 6 offline reduced shots fail because the HEAD baselines were rendered from Next 16.2.6 SWC output that dropped the space after </strong> (SWC bug on multi-line JSX text with an entity); 16.4.0 emits the space, so the CI render differs only on that line."
  confirming_evidence:
    - "SWC per-file comparison 16.2.6 vs 16.4.0 over all 41 app/components .tsx: only app/offline/page.tsx:39 differs"
    - "visual-diff: only the 'Good news! This site' line differs; expected = no space, actual = one space"
    - "minimal SWC repro: 16.2.6 drops the space only for multi-line text + entity"
  falsification_test: "If CI with Option C + the 6 committed PNGs still reports any offline diff (Visual != 72/72), the committed PNGs do not represent the 16.4.0 render (or the text-node split changes pixels) and the hypothesis/fix is wrong."
  fix_rationale: "Baselines must encode the spec-correct render; the explicit {' '} at end of line makes the separator independent of compiler JSX-whitespace handling (both 16.2.6 and 16.4.0 now emit [strong,' ','This site ...']), so a future SWC regression in this area cannot silently move the text again."
  blind_spots: "Local Windows renders are not pixel-comparable to the Linux baselines; the text-node split ([' ', <!-- -->, 'This site']) was shown pixel-neutral only on local chromium/firefox - CI Linux is the oracle."
  candidate_causes:
    - "code/dependency: Next 16.2.6 bundled SWC JSX-whitespace bug fixed in 16.4.0 (confirmed)"
    - "environment: font/rasterizer change in the CI container (eliminated - playwright:v1.60.0-noble unchanged, 66 other shots byte-identical)"
    - "data: baseline PNG generated from a different tree (eliminated - HEAD PNGs byte-identical to CI 'expected', working-tree PNGs to CI 'actual')"
  and_gate: "no - the single compiler output change is sufficient; nothing else differs in the 66 other shots."
commit_A: e72c661 (on top of 8d37032) - app/offline/page.tsx + 6 offline PNGs; check-snapshot-commit --sha HEAD --some --allow offline -> OK (6 changed)
ci_confirmation_run: 38134022192 (CI, push of e72c661 to ci/07-06, started 2026-10-11T11:01:00Z)
next_action: none - session resolved and archived to .planning/debug/resolved/. Session manager commits the debug doc (gsd_run query commit, respects commit_docs) and appends the knowledge-base entry (not written here: orchestrator constraint limits this agent to the debug session doc).

## Symptoms

expected: Platform commit a3c2b81 (07-06: next 16.2.6->16.4.0, eslint-config-next 16.4.0, react/react-dom 19.2.6->19.3.0, @types/react* 19.3.0, @react-three/fiber 9.6.1->9.8.1, @react-three/drei 10.7.7->10.7.9) is zero-diff - CI Visual Regression and E2E Tests green, as they were on ci/07-05 (73880a2).
actual: |
  Visual Regression fails 6/72 - only the `offline` route, reduced-motion variant, all of dark+light x 375/768/1440 (1380-3713 px differ, ratio 0.01). The other 66 shots pass at zero tolerance.
  E2E Tests fail 12/50 - all in e2e/contact-form.spec.ts on the firefox project only (chromium passes). 3 retries each fail.
errors: |
  Visual: "N pixels (ratio 0.01 of all image pixels) are different" vs e2e/visual/routes.spec.ts-snapshots/offline/{375,768,1440}-reduced-visual-{dark,light}-linux.png (routes.spec.ts:89).
  E2E (firefox): contact-form.spec.ts:4 "should display contact form" - expect(locator).toBeVisible() failed, element(s) not found; specs at :14/:22/:34/:46/:59 - locator.click / locator.fill Test timeout of 30000ms exceeded; :77 "should toggle collaboration checkbox" - expect(locator).not.toBeChecked() failed.
  CI runs: 38100593022 and 38103119437 (both on a3c2b81, branch ci/07-06, identical failures). Green baseline run: latest CI run on ci/07-05.
reproduction: |
  CI: push a3c2b81 to ci/07-06. Locally: `npx playwright test e2e/contact-form.spec.ts --project=firefox` and the visual spec for the offline route (visual-dark / visual-light projects; Linux baselines come from the playwright:v1.60.0-noble container, so local Windows renders are not pixel-comparable - compare against a local pre-bump render or use the CI container/artifacts).
started: First seen at a3c2b81. ci/07-05 (73880a2, motion 14.1.0) was green on every job. Both runs on a3c2b81 fail identically - not a flake.

## Constraints

- Plan 07-06 Task 3 is a zero-diff gate: "On failure do NOT re-baseline." Do NOT commit or stage the 6 locally modified e2e/visual/routes.spec.ts-snapshots/offline/*-linux.png files (downloaded from an "Update visual baselines" dispatch on ci/07-06); leave them untouched in the working tree for the user to decide.
- Do not touch the uncommitted .planning/config.json change.
- Reproduce locally first. Bisect individual packages (next / react+react-dom / R3F / drei / eslint-config-next) in a separate git worktree based on 73880a2, not in the main working tree.
- CI is only for confirmation: pushing to the scratch branch ci/07-06 (`git push --force origin HEAD:refs/heads/ci/07-06`) is allowed for confirmation runs (~18 min each). Never push to main, develop or the phase branch.
- Commit a3c2b81 also changed HologramTerminal (pinned drei <Html> portal target to gl.domElement.parentElement) to fix an R3F 9.8 synchronous-mount regression - consider it a candidate cause too.
- Plan 07-07 must bump Next to the 2026-10-14 security patch afterwards; prefer a fix that does not depend on staying at exactly 16.4.0.
- The two failures may or may not share a root cause - investigate both; report them separately if they differ.

## Eliminated

## Evidence

- timestamp: 2026-10-11T00:00:00Z
  checked: GitHub Actions jobs for a3c2b81 (runs 38100593022, 38103119437) vs ci/07-05
  found: On a3c2b81, Lint/Type, Unit, Build and Security pass; E2E (12 failed / 38 passed, all firefox contact-form) and Visual Regression (6 failed / 66 passed, all offline reduced) fail. All jobs pass on ci/07-05.
  implication: Regression introduced by the 07-06 dependency bump commit; deterministic across two runs.

- timestamp: 2026-10-11T10:00:00Z
  checked: gh run view 38103119437 --log-failed (full failure list)
  found: The 12 firefox failures are NOT all contact-form - 7 are e2e/contact-form.spec.ts and 5 are e2e/homepage.spec.ts (:4 load, :12 nav menu, :21 nav photos, :29 nav projects, :37 stats). photos.spec and projects.spec pass on firefox; all chromium pass.
  implication: Symptom is per-route (/ and /contact), not per-spec. Something those two routes render breaks in firefox.

- timestamp: 2026-10-11T10:05:00Z
  checked: error-context.md + trace console events of all 12 firefox failures (playwright-report artifact)
  found: Every failing page shows app/error.tsx ("Something went wrong!"). Console sequence on every failure - "THREE.WebGLRenderer: A WebGL context could not be created. Reason: WebGL creation failed: AllowWebgl2:false restricts context creation on this system." -> "THREE.WebGLRenderer: Error creating WebGL context." -> "Error" -> "Application error: Error". Firefox on the CI runner (headless, no GPU) cannot create WebGL; Chromium (SwiftShader) can.
  implication: In firefox, three.js WebGLRenderer constructor throws, and on a3c2b81 that throw now reaches the React error boundary and replaces the whole page. On 73880a2 the same WebGL failure must have been swallowed (tests were green), so the change is in how R3F surfaces renderer-creation errors.

- timestamp: 2026-10-11T10:10:00Z
  checked: visual-diff artifact, offline 1440-reduced-visual-dark actual/expected/diff PNGs
  found: Only diff pixels are on the one line "Good news! This site uses service workers to cache content. Pages and images". Expected (baseline from 73880a2) renders "Good news!This site" (no space after </strong>); actual (a3c2b81) renders "Good news! This site" (space present). Line shifts ~3px left, hence 1380-3713 px differ at all widths.
  implication: Visual failure is a whitespace difference in JSX text after </strong> in app/offline/page.tsx. Not WebGL-related (offline page has no canvas). Two failures have different root causes.

- timestamp: 2026-10-11T10:15:00Z
  checked: current .next build (16.4.0) compiled chunks for app/offline/page.tsx (server ssr chunk + client static chunk)
  found: Both contain children:[jsx("strong",{children:"Good news!"})," This site uses ..."] - leading space present, which is the spec-correct JSX whitespace result for `</strong> This site ...` on the same line.
  implication: New output is spec-correct; old baseline lacked the space. Need the 73880a2 build output to see whether old compiler stripped it (compiler bug fixed by Next bump) or something else.

- timestamp: 2026-10-11T10:30:00Z
  checked: worktree C:/Users/tim/AppData/Local/Temp/pf-bisect at 73880a2 (next 16.2.6, react 19.2.6, R3F 9.6.1, drei 10.7.7), npm ci + next build, grep compiled offline chunks
  found: 16.2.6 build emits children:[jsx("strong",...),"This site uses ..."] - NO leading space (both ssr and client chunk).
  implication: The space difference is produced by the compiler, not by React/CSS/fonts.

- timestamp: 2026-10-11T10:35:00Z
  checked: minimal repro - next/dist/build/swc transform() of 6 JSX snippets with each version's bundled SWC (scratchpad/scripts/swc-jsx.cjs)
  found: 16.2.6 drops the leading space only when the JSX text after </strong> is multi-line AND contains an HTML entity (&apos;) - cases "orig" and "noTrailing" lose the space; "noEntity", single-line, single-line+entity keep it. 16.4.0 keeps the space in all 6 cases (= Babel cleanJSXElementLiteralChild semantics).
  implication: Next 16.2.6's SWC had a JSX-whitespace bug (multi-line text + entity); 16.4.0 fixed it. Old baseline encodes the bug ("Good news!This site").

- timestamp: 2026-10-11T10:40:00Z
  checked: SWC output of all 41 app/**/*.tsx + components/**/*.tsx compiled with 16.2.6 vs 16.4.0 SWC (scratchpad/scripts/swc-dump.cjs + swc-cmp.cjs)
  found: exactly 1 differing file / 1 differing line - app/offline/page.tsx, "This site..." -> " This site...". grep for `</tag> text` patterns also finds only app/offline/page.tsx:39.
  implication: Visual root cause fully explained and isolated to the Next (bundled SWC) bump; no other route is affected; R3F/drei/React/HologramTerminal change are not involved in the visual failure.

- timestamp: 2026-10-11T10:45:00Z
  checked: R3F Canvas source, 9.6.1 (worktree) vs 9.8.1 (main) dist/react-three-fiber.esm.js CanvasImpl
  found: 9.6.1 - layout effect calls `async function run(){ await root.configure({...}); root.render(...) } run();` with no catch, so a WebGLRenderer constructor throw inside configure() becomes an unhandled promise rejection and the React tree keeps rendering. 9.8.1 - `root.current.configure({...}).catch(setError)`; setError -> next render hits `if (error) throw error` in CanvasImpl -> error propagates to nearest React error boundary.
  implication: In 9.8.x a failed WebGL context creation is thrown into React. With no boundary around <Canvas>, app/error.tsx replaces the route. Pages with a Canvas: / (MountainTerrain3D, DualParticleSystem via Hero3DMountain), /contact (AnimatedGradientMesh), /photos 3D view (PhotoCarousel3D), /projects/[slug] (HologramTerminal). photos/projects specs pass only because they assert URL / canvas attached, not content.

- timestamp: 2026-10-11T11:00:00Z
  checked: npm pack @react-three/fiber 9.7.0 and 9.8.0, grep CanvasImpl
  found: 9.7.0 still has `async function run(){...}; run();` (no catch); 9.8.0 introduces `}).catch(setError);`.
  implication: Behaviour change introduced in R3F 9.8.0 (intentional upstream - renderer errors are now reported through React).

- timestamp: 2026-10-11T11:10:00Z
  checked: local firefox repro. Scratch config C:/Users/tim/AppData/Local/Temp/pf-bisect/playwright.debug.config.ts with project firefox-nowebgl (firefoxUserPrefs webgl.disabled=true); verified via scratchpad/scripts/ff-webgl.cjs that the pref makes getContext('webgl'/'webgl2') return null (= CI runner condition).
  found: 73880a2 (R3F 9.6.1): contact-form + homepage (minus submit/reset) 10/10 pass on firefox-nowebgl. 73880a2 + ONLY @react-three/fiber@9.8.1 (next 16.2.6, react 19.2.6, drei 10.7.7 unchanged): 7 fail on firefox-nowebgl (all 5 contact tests run, homepage :21 :29), error-context shows "Something went wrong!"; firefox WITH WebGL and chromium: all pass.
  implication: Bisect confirms R3F 9.8.x alone is sufficient to cause the firefox failure; Next/React/drei/HologramTerminal change not required. Homepage :4/:12/:37 pass locally only because the assertion beats the async throw (race), they fail on the slower CI runner.

- timestamp: 2026-10-11T11:15:00Z
  checked: sha1 of the 6 modified working-tree offline/*-linux.png vs CI run 38103119437 actual/expected PNGs; 375-light diff image
  found: working-tree PNGs are byte-identical to the CI "actual" renders of a3c2b81; HEAD PNGs are byte-identical to CI "expected". 375 diff shows the same single changed line (no rewrap).
  implication: The pending re-baseline candidates contain exactly and only the one-space change.

- timestamp: 2026-10-11T12:00:00Z
  checked: fix v1 (SafeCanvas = error boundary rendering null around R3F Canvas; 5 call sites; eslint no-restricted-imports for bare Canvas + selftest probe; jest unit test; e2e/no-webgl.spec.ts with getContext('webgl*') -> null init script) in worktree at a3c2b81
  found: with fix - no-webgl spec 8/8, contact+homepage pass on firefox-nowebgl/firefox/chromium. fix reverted at the 5 call sites - no-webgl spec 24/24 FAIL (4 routes x chromium+firefox x 3 repeats), error page shown on /photos 3D view and /projects/clix-cli too. Full non-visual suite with fix: 86 pass, 1 FAIL - photos.spec.ts:54 "should switch to 3D carousel view" on firefox-nowebgl (expects a <canvas> attached; boundary rendered null so no canvas element).
  implication: v1 would turn CI firefox red on photos.spec:54 (CI firefox has no WebGL). The boundary fallback must keep the DOM R3F < 9.8 left behind without WebGL (wrapper div > div > empty canvas), not null. Revising to an inert-canvas fallback instead of editing the existing test.

- timestamp: 2026-10-11T12:45:00Z
  checked: fix v2 (SafeCanvas fallback = inert R3F DOM) in worktree at a3c2b81; jest mutation (SafeCanvas returning bare Canvas); full non-visual e2e on firefox-nowebgl/firefox/chromium; stability repeat
  found: unit test - mutant without boundary fails 1/3, real code 3/3. Full non-visual suite 87/87 (incl. photos.spec:54 on firefox-nowebgl). no-webgl + photos + contact + homepage specs x3 projects x --repeat-each 5 = 330/330 pass. Main tree: tsc 0, jest 69/69, eslint 0 errors / 54 warnings (same 54 as a3c2b81), guard selftest 25/25 (new probe 'bare R3F Canvas import probe' passes), test-count jest 69 + e2e 65 >= baseline 91.
  implication: Fix verified locally against the CI condition; regression test fails without the fix (24/24) and passes with it.

- timestamp: 2026-10-11T11:15:00Z
  checked: commit 8d37032 (fix) on gsd/phase-07-foundation-guardrails, force-pushed to ci/07-06 -> CI run 38132996185
  found: Lint/Type, Unit, Build, Security, E2E all success. E2E 58 passed / 0 failed / 0 flaky (50 previous + 8 new no-webgl runs). Visual 66 passed / 6 failed - exactly the 6 offline reduced shots (cause A, untouched). The 6 offline actual PNGs of this run are byte-identical to the working-tree re-baseline candidates.
  implication: CI confirms fix B and that SafeCanvas changes no chromium render on any route. Remaining red = cause A only, which needs the user's re-baseline decision.

- timestamp: 2026-10-11T13:00:00Z
  checked: user checkpoint response + orchestrator verification of CI run 38132996185 (8d37032)
  found: User accepted fix B (SafeCanvas, 8d37032) including the trade-off that scene errors leave a blank canvas instead of the full-page error. Orchestrator confirmed run 38132996185 - E2E, Lint/Type, Unit, Build, Security green; Visual 66 passed / 6 failed (only offline reduced). User chose Option C for A - explicit {' '} after </strong> in app/offline/page.tsx plus committing the 6 working-tree offline PNGs as a documented exception to the zero-diff gate (07-05 motion-14 pattern), justified by the Next 16.2.6 SWC whitespace bug fixed in 16.4.0.
  implication: B is closed (user-accepted + CI-confirmed). A proceeds with the code hardening + documented re-baseline.

- timestamp: 2026-10-11T13:10:00Z
  checked: Option C edit of app/offline/page.tsx (`<strong>Good news!</strong>{' '}` at end of line 39, text on the next line, trailing space after "content." dropped) compiled with each bundled SWC (scratchpad/scripts/swc-optc.cjs; Next 16.2.6 installed in isolated scratchpad/next1626) + full `npx next build` (16.4.0, no npm hooks)
  found: |
    HEAD form:   16.2.6 -> [strong, "This site ..."] (bug, no space) ; 16.4.0 -> [strong, " This site ..."]
    Option C:    16.2.6 -> [strong, ' ', "This site ..."] ; 16.4.0 -> [strong, ' ', "This site ..."]  (identical)
    next build 16.4.0, both .next/server/chunks/ssr/app_offline_page_tsx_*.js and the client static chunk: children:"Good news!"})," ","This site uses service workers to cache content. Pages and images you've visited before should still be available."]
  implication: The space is now compiler-independent - even the buggy 16.2.6 SWC emits exactly one " " separator and the text has no leading space.

- timestamp: 2026-10-11T13:20:00Z
  checked: `next start` (16.4.0 build with Option C) /offline - SSR HTML, hydrated DOM in chromium + firefox (scratchpad/scripts/offline-text.cjs), and a differential paragraph screenshot (scratchpad/scripts/offline-nodesplit.cjs) - as served [strong, " ", <!-- -->, "This site..."] vs children rewritten in place to the pre-hardening 16.4.0 shape [strong, " This site..."], reduced motion, light+dark x 375/768/1440, both browsers
  found: SSR `<strong>Good news!</strong> <!-- -->This site ...`; textContent and innerText "Good news! This site uses ..." (exactly one space) in both browsers. Paragraph screenshots byte-equal in 12/12 combinations. Sensitivity check (mutant rewrite without the space): 12/12 differ, so the oracle detects the one-space change.
  implication: Rendered text is unchanged vs the CI actuals ("Good news! This site", one space); the extra text-node/comment boundary is not visible locally. CI (Linux container) remains the pixel oracle.

- timestamp: 2026-10-11T13:25:00Z
  checked: sha1 of the 6 working-tree offline PNGs vs HEAD and the CI actuals of runs 38132996185 and 38103119437 (scratchpad/ci-*)
  found: |
    working tree == CI actual (both runs), != HEAD:
    1440-dark  b13d679e1715b2640727ea7e81edfbef3f496b49 (HEAD d9d3b6fd0c3b24e556d7e6815915089b2e62dbc3)
    1440-light 02b3652dda95d98e6e21b66c3a3aabc69b69c03b (HEAD a033d769c084c0b126b3eabc0bc74256220ba47c)
    375-dark   5863f0a64240a83cf462e7aaa942fbbc02cf7ca5 (HEAD b5042bbae8a28f8b4a231eb9add2b3de80539288)
    375-light  b1a5c307a37fefb6c5147017779525edb012e87b (HEAD a433043647e76879adeb7a602d4efc48fd7dcebe)
    768-dark   ea04ab92c1fecef0ff9e50477502bb2318addcc1 (HEAD a8af670555388f06608d9ae12b4030dda00871ab)
    768-light  2ce24197532783f31b35a04723353841900c36c7 (HEAD dca08ca5b41ecedba25806a88937a81d2a9d0aad)
  implication: The re-baseline candidates are still exactly the CI renders of the 16.4.0 tree; safe to commit as-is.

- timestamp: 2026-10-11T13:35:00Z
  checked: local non-visual gates on the main tree with Option C applied
  found: npm run lint exit 0 (eslint 0 errors / 54 warnings = same as before, parity OK, guard selftest 25/25); tsc --noEmit exit 0; jest 69/69 (8 suites); guard:tests jest 69 + e2e 65 = 134 >= baseline 91 OK; same-classnames HEAD OK (className literals identical). No non-visual test references the offline text (only e2e/visual/routes.spec.ts).
  implication: No local regression from the one-line JSX change.

- timestamp: 2026-10-11T13:45:00Z
  checked: commit e72c661 (fix A, on top of 8d37032) force-pushed to ci/07-06 -> CI run 38134022192 (gh run watch --exit-status rc 0; job logs)
  found: run conclusion success. Lint and Type Check success; Unit Tests success (69/69, test-count jest 69 + e2e 65 = 134 >= 91 OK); Security Audit success; Build Application success; E2E Tests success "58 passed"; Visual Regression success "72 passed"; Dependency Review skipped (as on every push run). scripts/ci/check-visual-run.mjs --sha e72c661 -> PASS (job 114454066197). check-snapshot-commit --sha e72c661 --some --allow offline -> OK (6 changed).
  implication: Falsification test for A not triggered - the committed PNGs equal the Linux CI render of the hardened page, and the text-node split is pixel-neutral on CI too. A and B both confirmed fixed in CI; every job green.

## Resolution

root_cause: |
  Two independent causes.
  (A) Visual, offline x6: Next 16.2.6's bundled SWC dropped the leading space of a multi-line JSX text containing an HTML entity (app/offline/page.tsx:39 '</strong> This site ... you&apos;ve'), so the 73880a2 baselines show 'Good news!This site'. Next 16.4.0's SWC emits the spec-correct ' This site'. The new render is correct; the baseline encodes a compiler bug. Only this one string in app/ + components/ compiles differently between the two versions.
  (B) Firefox E2E x12: @react-three/fiber 9.8.0 changed Canvas to configure().catch(setError) + throw in render, so a WebGLRenderer that cannot be created (CI headless firefox has no WebGL) is rethrown through React. No <Canvas> had an error boundary, so app/error.tsx replaced / and /contact (also /photos 3D view and /projects/[slug], untested). In 9.6.1/9.7.0 the same failure was an unhandled promise rejection and the page stayed intact. Affects real users without WebGL too.
fix: |
  (B) components/SafeCanvas.tsx - R3F Canvas inside CanvasErrorBoundary whose fallback is the inert wrapper + empty <canvas> that R3F < 9.8 left behind; the 5 Canvas call sites use SafeCanvas. Recurrence guards: eslint no-restricted-imports bans importing Canvas from @react-three/fiber (selftest probe added); jest components/__tests__/SafeCanvas.test.tsx; e2e/no-webgl.spec.ts (getContext('webgl*') -> null, all 4 canvas routes, chromium + firefox).
  (A) commit e72c661 (user-approved Option C, 2026-10-11): app/offline/page.tsx ends line 39 with `<strong>Good news!</strong>{' '}` and continues the text on the next line, so the separator is an explicit JSX expression (both the buggy 16.2.6 and the fixed 16.4.0 SWC emit [strong, " ", "This site ..."]); the 6 offline/{375,768,1440}-reduced-visual-{dark,light}-linux.png baselines are replaced by the working-tree files byte-identical to the CI actuals of runs 38103119437 and 38132996185, as a documented exception to the 07-06 zero-diff gate (07-05 motion-14 pattern; cause, evidence and approval in the commit body).
commits: [8d37032 (B, SafeCanvas), e72c661 (A, offline {' '} + 6 PNG re-baseline)]
verification: |
  B - local (worktree a3c2b81 + fix): 87/87 non-visual e2e on chromium, firefox, firefox-nowebgl; 330/330 on 5x repeat; fix reverted -> no-webgl spec 24/24 fail; jest mutation killed. CI run 38132996185 on 8d37032: E2E 58/58, Visual 66/72 (only cause A). User accepted B incl. the blank-canvas-on-scene-error trade-off.
  A - SWC compile of the hardened page with 16.2.6 and 16.4.0 bindings: identical [strong, ' ', "This site ..."]; next build 16.4.0 ssr + client chunks: ...children:"Good news!"})," ","This site ..."; next start /offline: SSR '<strong>Good news!</strong> <!-- -->This site', hydrated textContent/innerText 'Good news! This site' (one space) in chromium + firefox; split vs single text node paragraph screenshots byte-equal 12/12 (chromium+firefox x light/dark x 375/768/1440), mutant without the space differs 12/12. Committed PNG blobs sha1-equal to the CI actuals. Local gates: lint exit 0 (0 errors / 54 warnings, unchanged), selftest 25/25, tsc 0, jest 69/69, test-count OK, same-classnames OK, check-snapshot-commit --some --allow offline OK (6 changed).
  Final CI run 38134022192 on e72c661 (ci/07-06): Lint and Type Check, Unit Tests (69/69, test-count OK), Security Audit, Build Application, E2E Tests (58 passed), Visual Regression (72 passed) all success; Dependency Review skipped (push run). check-visual-run --sha e72c661 PASS.
guardrail_verdict: accepted
files_changed: [components/SafeCanvas.tsx, components/__tests__/SafeCanvas.test.tsx, e2e/no-webgl.spec.ts, components/AnimatedGradientMesh.tsx, components/DualParticleSystem.tsx, components/HologramTerminal.tsx, components/MountainTerrain3D.tsx, components/PhotoCarousel3D.tsx, eslint.config.mjs, scripts/guards/selftest.mjs, app/offline/page.tsx, e2e/visual/routes.spec.ts-snapshots/offline/375-reduced-visual-dark-linux.png, e2e/visual/routes.spec.ts-snapshots/offline/375-reduced-visual-light-linux.png, e2e/visual/routes.spec.ts-snapshots/offline/768-reduced-visual-dark-linux.png, e2e/visual/routes.spec.ts-snapshots/offline/768-reduced-visual-light-linux.png, e2e/visual/routes.spec.ts-snapshots/offline/1440-reduced-visual-dark-linux.png, e2e/visual/routes.spec.ts-snapshots/offline/1440-reduced-visual-light-linux.png]
oracle_type: |
  B - specified (route content visible and app/error.tsx heading absent without WebGL).
  A - specified (zero-tolerance pixel comparison of the Linux CI render against the committed baseline; the expected text "Good news! This site" with one space is the spec-correct JSX whitespace result).

## Prevention

blameless_5_whys:
  A (visual, offline):
    - "code/dependency branch: why did the offline shots change on a zero-diff platform bump? -> Next 16.4.0's SWC emits a space that 16.2.6 dropped. Why did the baseline lack it? -> the baselines were generated while the buggy 16.2.6 compiler was in use, so they recorded the compiler bug as the expected render. Why was that possible? -> the space depended on implicit JSX-text whitespace rules (multi-line text + entity), an area where compilers have diverged; nothing made the separator explicit."
    - "process/gate branch: why was the bug not noticed when the baselines were made? -> a missing space after a bold run is hard to see in review, and no gate compares compiler output across Next upgrades; baselines only prove 'same as last time', not 'correct'."
  B (firefox, no WebGL):
    - "code branch: why did / and /contact show the error page? -> R3F 9.8 rethrows renderer-creation errors through React and no <Canvas> had a boundary. Why no boundary? -> under R3F <= 9.7 the error was an unhandled promise rejection, so the gap was invisible."
    - "environment branch: why only firefox? -> the CI firefox has no WebGL (pre-existing); chromium uses SwiftShader. No test simulated a browser without WebGL on purpose, so the coverage depended on an accidental CI property."
why_not_caught: |
  A - no gate existed that compares compiled JSX text across compiler upgrades; the baselines were generated under the buggy Next 16.2.6 SWC and so encoded its output. The zero-tolerance Visual Regression gate is what caught the change at the first compiler upgrade (working as designed).
  B - no test deliberately ran the canvas routes without WebGL; firefox E2E only caught it because the CI runner happens to lack WebGL, and the routes' tests passed under R3F <= 9.7 because the failure was swallowed as an unhandled rejection.
recurrence_guard: |
  A - explicit `{' '}` at the </strong> boundary in app/offline/page.tsx:39 (compiler-independent; verified with the 16.2.6 and 16.4.0 SWC), plus the existing zero-tolerance Visual Regression gate e2e/visual/routes.spec.ts (offline route x 6 shots) and the per-slug exception check scripts/ci/check-snapshot-commit.mjs --some --allow <slug>. The SWC per-file compare scripts (scratchpad swc-dump/swc-cmp) are not in the repo; adding a cross-version compile diff to dependency-bump plans is a candidate for 07-07 (Next security patch).
  B - components/SafeCanvas.tsx used at all 5 call sites; eslint no-restricted-imports bans importing Canvas from @react-three/fiber (eslint.config.mjs, selftest probe 'bare R3F Canvas import probe' in scripts/guards/selftest.mjs); jest components/__tests__/SafeCanvas.test.tsx; e2e/no-webgl.spec.ts (getContext('webgl*') -> null, 4 canvas routes, chromium + firefox).
knowledge_base_entry_draft: |
  ## offline-visual-diff-firefox - 07-06 platform bump: offline visual diff (Next SWC JSX space) + firefox error page without WebGL (R3F 9.8)
  - **Date:** 2026-10-11
  - **Error patterns:** visual regression, offline, "pixels (ratio 0.01) are different", missing space after </strong>, JSX whitespace, HTML entity, SWC, Next 16.2.6 -> 16.4.0, firefox, "Error creating WebGL context", "Application error: Error", app/error.tsx, "Something went wrong!", R3F 9.8, setError, no WebGL
  - **Root cause(s):** Next 16.2.6 bundled SWC dropped the leading space of multi-line JSX text containing an entity, so the offline baselines encoded "Good news!This site" and 16.4.0 (fixed) moved the line; R3F >= 9.8.0 rethrows WebGLRenderer-creation failure through React (configure().catch(setError)) and no <Canvas> had an error boundary, so browsers without WebGL got app/error.tsx
  - **Fix:** e72c661 - explicit {' '} after </strong> in app/offline/page.tsx + documented re-baseline of 6 offline reduced PNGs; 8d37032 - SafeCanvas (Canvas inside an error boundary with inert canvas fallback) at all 5 call sites
  - **Files changed:** app/offline/page.tsx, e2e/visual/routes.spec.ts-snapshots/offline/*-reduced-*-linux.png (6), components/SafeCanvas.tsx, components/__tests__/SafeCanvas.test.tsx, e2e/no-webgl.spec.ts, components/{AnimatedGradientMesh,DualParticleSystem,HologramTerminal,MountainTerrain3D,PhotoCarousel3D}.tsx, eslint.config.mjs, scripts/guards/selftest.mjs
  - **Why not caught:** A - no gate compared compiled JSX across compiler upgrades and the baselines were generated under the buggy compiler (the zero-diff visual gate caught it at the upgrade); B - no test ran the canvas routes without WebGL on purpose, and R3F <= 9.7 swallowed the error
  - **Recurrence guard:** explicit {' '} at the JSX boundary (app/offline/page.tsx:39) + zero-tolerance e2e/visual/routes.spec.ts; eslint no-restricted-imports on @react-three/fiber Canvas + selftest probe, components/__tests__/SafeCanvas.test.tsx, e2e/no-webgl.spec.ts
  ---
