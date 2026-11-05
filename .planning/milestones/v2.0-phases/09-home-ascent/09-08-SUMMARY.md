---
phase: 09-home-ascent
plan: 08
subsystem: ui
tags: [three, react-three-fiber, webgl, glsl, fast-png, heightmap, shader, fwidth-contours, playwright, swiftshader]

requires:
  - phase: 09-07
    provides: "TerrainCanvas chunk entry (SafeCanvas, demand frameloop, flat, opacity 0 until '3d'), useAscent() mode/markRevealed/stageRef, downgradeAscent('load-error'), TerrainStage gridSize 256/512"
  - phase: 09-04
    provides: "data/generated/tokens.ts: srgb night950/firn50, contourAlpha 0.14, contourMinorAlpha 0.084, reliefOpacity 0.32, hex night950"
  - phase: 09-06
    provides: "AscentController progress spring (useAscent().progress), e2e/helpers/ascent.ts"
  - phase: 08
    provides: "content-hashed /terrain/heightmap-256|512 PNGs, hillshade AVIF/WebP, lib/terrain/dem-sample.ts sampleBilinear"
provides:
  - "fast-png 8.0.0 (exact) runtime dependency, imported only by components/home/terrain/TerrainMesh.tsx and e2e specs"
  - "lib/terrain/heightmap.ts: DecodedPngLike, validateHeightmap, toMetres, vertexUv, uvToWorld, planeSize, meshHeightAtUv"
  - "components/home/terrain/terrain-shader.ts: terrainVertexShader, terrainFragmentShader, createTerrainUniforms (uHill, uSurface, uLine, uReliefOpacity, uInterval, uIndexEvery, uWidthPx, uIndexAlpha, uMinorAlpha, uRelief, uExaggeration, uEdgeFade), EDGE_FADE"
  - "components/home/terrain/TerrainMesh.tsx (default, props gridSize, onMetres): fetch/decode/validate/build, poster-texture, first-frame reveal, abort-safe load, GPU disposal"
  - "components/home/terrain/CameraRig.tsx (default): plan view of posterFrame at p = 0, demand invalidation from the progress spring"
  - "Performance mark 'ascent-canvas-ready' with detail { p, gridSize }"
  - "e2e/home-canvas.spec.ts: 8 @chromium-only SwiftShader checks"
affects: [09-10, 09-11, 09-13, 09-14]

actuals:
  tokens: 10200
  tasks: 3
  commits: 4
plan_head_before: 814ba97ce855191fdc2b2f5a7cf07e271effd02e
plan_head_after: 58b71a556a92f26f46f659433dda77f95d9d3462

tech-stack:
  added: ["fast-png 8.0.0 (exact; transitive fflate 0.8.2 already in the tree, iobuffer 6.0.1)"]
  patterns:
    - "Poster-parity shading: raw ShaderMaterial (no colorspace/tonemapping chunk), toneMapped false, flat canvas, NoColorSpace texture, sRGB Vector3 uniforms from generated tokens; output equals the CSS composite"
    - "Pixel-centre registered terrain plane: side W(N-1)/N, N-1 segments, rotateX(-pi/2), uv overridden to pixel centres, metres in position.y scaled by uRelief in the vertex shader"
    - "Texture from a DOM image: use a detached copy (intrinsic width/height), never the rendered <img>, because three sizes texture storage from image.width"
    - "Lazy-load lifecycle: AbortController + signal check after every await; resources created after the cleanup are disposed on the spot; reveal via requestAnimationFrame after the first useFrame that has the mesh, cancelled on unmount"

key-files:
  created:
    - lib/terrain/heightmap.ts
    - lib/__tests__/heightmap.test.ts
    - components/home/terrain/terrain-shader.ts
    - components/home/terrain/TerrainMesh.tsx
    - components/home/terrain/CameraRig.tsx
    - e2e/home-canvas.spec.ts
  modified:
    - components/home/terrain/TerrainCanvas.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "The hillshade texture is a detached copy of the poster image's currentSrc, not the rendered <img>: three r184 allocates texture storage from image.width (getMipLevels, texStorage2D), which is the layout width (1430) for a rendered 1100 px image, leaving the texels in one corner of a black texture. The copy is served from the image already loaded, so nothing downloads twice"
  - "The bounding sphere covers relief 0 to 1 (box min.y forced to 0), so frustum culling stays on through the tilt-in; 09-10 must widen it if uExaggeration goes above 1"
  - "uWidthPx follows R3F's viewport.dpr through a material ref (the React Compiler lint forbids mutating a useState value), so contours stay 1 CSS px on zoom or a screen change"
  - "CameraRig applies the D-06 epsilon rule against the progress applied in the previous frame: it keeps invalidating while p moved by more than 1e-4 since then, plus every spring change event"
  - "Heightmap helper tests are characterisation tests: the plan orders the helpers into the Task 1 tracer, so a mutation probe stands in for RED (see TDD Gate Compliance)"

patterns-established:
  - "09-10 replaces CameraRig's planView pose with the route and raises uRelief; the progress subscription and the epsilon invalidation stay"
  - "Anything anchored on the 3D terrain uses meshHeightAtUv on the metres TerrainMesh passes to onMetres, not the DEM value (Pitfall 2)"
  - "Canvas pixel checks hide everything but the canvas (body * hidden, canvas visible) before screenshotting, so overlaid hero text never reads as contour pixels"

requirements-completed: [HOME-02]

coverage:
  - id: D1
    description: "Canvas fades in over the poster at p = 0 with no visible change: stage '3d', canvas opacity 1, mean absolute RGB difference 0.49-0.58 levels between the stage with and without the canvas at 1440 x 900 (limit 3)"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#canvas fades in over the poster at p = 0 @chromium-only"
        status: pass
    human_judgment: false
  - id: D2
    description: "The canvas draws terrain with contour lines at 412 x 839 (luminance std 19.3 > 4, contour-coloured share 0.046 > 0.003)"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#contour lines are drawn @chromium-only"
        status: pass
    human_judgment: false
  - id: D3
    description: "Mesh size follows the stage width: 256 heightmap at 412 px, 512 at 1440 px, never the other (D-18)"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#mesh size follows the stage width (D-18) (2 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "No Worker, no CSP violation, no pageerror through the reveal (correction C2: precache.json and service-worker.js unchanged)"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#no worker and no CSP violation @chromium-only"
        status: pass
    human_judgment: false
  - id: D5
    description: "Reveal keeps the layout: CLS 0.0002 from load to '3d' + 1 s, track height unchanged, canvas opacity 0 while 'eligible', no 'loading' text in the stage"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#reveal keeps the layout @chromium-only"
        status: pass
    human_judgment: false
  - id: D6
    description: "Abandoned and late loads: reduced motion during a held heightmap leaves no canvas, no 'ascent-canvas-ready' mark and no pageerror; a late load reveals at the current progress (p 0.398 vs waypoint 2 arrival 0.400)"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#a load abandoned for reduced motion reveals nothing @chromium-only"
        status: pass
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#a late canvas reveals at the current progress @chromium-only"
        status: pass
    human_judgment: false
  - id: D7
    description: "Pure heightmap helpers: format guard (width, height, depth, channels, sample count, grid size), metres, pixel-centre UVs, world axes, plane size and first/last vertex, bilinear mesh heights"
    requirement: HOME-02
    verification:
      - kind: unit
        ref: "lib/__tests__/heightmap.test.ts (16 tests)"
        status: pass
    human_judgment: false
  - id: D8
    description: "The look of the live canvas: the fade itself (500 ms, ease-geological), contour legibility on steep faces at 375-412 px where the merge fade thins lines, and the edge-of-world fade (only visible once 09-10 raises uRelief)"
    verification: []
    human_judgment: true
    rationale: "The pixel checks prove parity and presence, not taste; the fade timing and the contour density on phones are judged at the 09-14 visual review"

duration: 18min
completed: 2026-10-25
status: complete
---

# Phase 9 Plan 08: Terrain mesh, poster-parity shader and plan-view reveal Summary

**The lazy canvas now draws the real Matterhorn terrain. TerrainMesh fetches the 256² or 512² heightmap, decodes it on the main thread with fast-png 8.0.0 and validates it before building a pixel-centre-registered plane. The plane is textured with the poster's own hillshade and drawn with the CSS composite formula plus 1 CSS px `fwidth` contour lines in firn-50. CameraRig frames `posterFrame()` in plan view at p = 0. After its first drawn frame the canvas fades in over the poster: the mean difference is 0.49 levels at 1440 px (the limit is 3).**

## Performance

- **Duration:** 18 min
- **Started:** 2026-10-25T01:12:51Z
- **Completed:** 2026-10-25T01:31:00Z
- **Tasks:** 3
- **Files modified:** 9 (6 created, 3 modified)

## Accomplishments
- `lib/terrain/heightmap.ts` holds the pure registration rules. Its only import is the one DEM sampler, so Jest tests it without three or fast-png.
- `terrain-shader.ts` reproduces poster layers 1-3: `ground = mix(surface, texel, 0.32)` (correction C1), plus index and minor contours at alphas 0.14 and 0.084. Lines fade where they would merge, index lines on their own lower frequency. The edge-of-world fade is scaled by uRelief. Every value comes from the generated tokens and terrain modules, with no literal colour.
- `TerrainMesh` follows the D-18/T-09-12 path. It fetches same-origin, decodes, validates and builds the mesh, yielding between the steps. The material is a ShaderMaterial with toneMapped false. Any failure calls `downgradeAscent('load-error')`. An unmount aborts the load, triggers no state update, log or reveal, and disposes the geometry, material and texture.
- `CameraRig` places the camera at the poster window's centre. Its altitude is `(vSpan/2)/tan(fov/2)`, with up set to north before `lookAt`. It invalidates on spring changes and keeps going until p settles within 1e-4.
- The reveal works. The first frame that has the mesh calls `markRevealed()` in the following rAF, the stage reads `3d` and the canvas fades in over `--duration-settle`. A late load reveals at the current progress.
- `e2e/home-canvas.spec.ts` adds 8 SwiftShader checks: parity, contours, grid size ×2, CSP/Worker, layout stability, abandoned load and late load.

## Task Commits

1. **Task 1 (tracer): fast-png decode -> registered mesh -> poster-texture shader -> plan-view camera -> fade-in**: `b101a0c` (feat)
2. **Task 2 test commit: heightmap helper tests**: `c8b9990` (test)
3. **Task 2: contour fade, edge fade, DPR-following line width, abort-safe loading**: `a642b39` (feat)
4. **Task 3: SwiftShader canvas checks**: `58b71a5` (test)

## Tracer gate
This was an interactive run (`_auto_chain_active` false), with `human_verify_mode` end-of-phase and an automated-only `<verify>`. After the commit I re-ran `guard:parity` (OK), `type-check` (0 errors) and `home-canvas.spec.ts` in Chromium (1 passed), then continued to Task 2.

## TDD Gate Compliance
- **RED (`c8b9990`):** this is a characterisation commit, not a failing run. The plan builds `lib/terrain/heightmap.ts` in the Task 1 tracer, which comes before Task 2's tests, so the 16 tests passed on their first run (unexpected GREEN, investigated). The helpers already met the behavior block. To show the tests can fail, I ran a mutation probe: PlaneGeometry-style `i/(N-1)` UVs and no sample-count check. With it, **3 of 16 failed on their assertions** (two `toEqual` UV mismatches and "Received function did not throw" on 15 samples), with no load or import fault. I then reverted the mutation with `git checkout`. The `check tdd-red-evidence` classifier was not run, because no genuine pre-implementation RED exists for this task order.
- **GREEN (`a642b39`):** the behaviour Task 2 adds is in the shader and the mesh lifecycle (edge fade, DPR width, abort path), which Jest cannot reach. It is proven by the Chromium e2e: parity still holds and the abandoned and late load tests pass.
- No REFACTOR commit.

## Files Created/Modified
- `lib/terrain/heightmap.ts`: the pure helpers.
- `lib/__tests__/heightmap.test.ts`: 16 unit tests.
- `components/home/terrain/terrain-shader.ts`: the GLSL and the uniform factory.
- `components/home/terrain/TerrainMesh.tsx`: the load, build, texture, reveal and disposal.
- `components/home/terrain/CameraRig.tsx`: the plan-view camera and demand invalidation.
- `components/home/terrain/TerrainCanvas.tsx`: camera props (fov 40, near 10, far 100000), the night-950 clear colour in `onCreated`, and the mesh and rig in the scene. `children` stays available for the 3D pins.
- `e2e/home-canvas.spec.ts`: the canvas checks.
- `package.json`, `package-lock.json`: `fast-png` `8.0.0` (exact).

## Decisions Made
See key-decisions. The most important is the detached image copy for the texture, which Deviation 1 below covers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Poster `<img>` as texture source gave a 1430² texture with the hillshade in one corner**
- **Found during:** Task 1 (first parity run: mean difference 11.76 levels)
- **Issue:** The plan says to build the texture from `img[data-poster-img]` itself. three r184 sizes texture storage from `image.width` (`getMipLevels`, `texStorage2D`; three.module.js:11292, 12230). For a rendered `<img>` that is its layout width (1430 px at 1440), while the file is 1100 px. The upload therefore filled 1100 of 1430 texels, and the canvas showed the hillshade scaled about 1.3× into the south-west, with black ground and contours over the rest.
- **Fix:** `posterImage()` waits for the poster's `decode()`, then decodes a detached `new Image()` with the poster's `currentSrc`. Its `width` is the intrinsic size, and the browser serves it from the image it already loaded. The poster `<img>` is still never touched or disposed.
- **Files modified:** components/home/terrain/TerrainMesh.tsx
- **Verification:** a side-by-side screenshot shows the canvas matching the poster, and the parity check went from 11.76 to 0.488 levels.
- **Committed in:** `b101a0c`

**2. [Rule 1 - Bug] A texture finishing after the cleanup would leak**
- **Found during:** Task 1 (reviewing the abort path)
- **Issue:** If the unmount cleanup ran while `loadHillshade` was awaiting, the texture it then returned was never seen by the cleanup.
- **Fix:** after that await, an aborted load disposes the new texture at once.
- **Files modified:** components/home/terrain/TerrainMesh.tsx
- **Committed in:** `b101a0c`

**3. [Rule 3 - Blocking] React Compiler lint rejected mutating the `useState` material for the DPR update**
- **Found during:** Task 2
- **Fix:** the live material and the creation-time DPR are kept in refs, and the DPR effect writes `uWidthPx` through the ref.
- **Files modified:** components/home/terrain/TerrainMesh.tsx
- **Committed in:** `a642b39`

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** all three are correctness fixes inside the plan's files. There is no scope change.

## Issues Encountered
- `npm install` reported 10 audit findings. They are pre-existing apart from what fast-png shares: fflate 0.8.2, which was already in the tree through `@types/three`. Its moderate advisory concerns `unzipSync` on ZIP64, which fast-png never imports. I logged it in deferred-items.md for a dependency decision.
- One combined Chromium + Firefox run hit 15 s timeouts in two `no-webgl` tests on `/contact` and `/projects/clix-cli` while the dev server compiled those routes for the first time. The spec passed 8/8 on its own right after (logged in deferred-items.md). A first `home-canvas` + `home-modes` run reported only 2 of 30 run, also during dev-server warm-up. Two reruns passed 30/30.
- R3F logs a `THREE.Clock` deprecation warning on every canvas mount. It comes from the library, not a project file (logged).

## Verification
- `npm run guard:parity`: OK. `npm ls fast-png`: exactly 8.0.0. `npm run lint`: exit 0 (0 errors; the 24 warnings are the pre-existing legacy ones), with `tokens: OK` and `terrain: OK`. `npm run type-check`: no errors. `npm run build`: exit 0, then `git checkout -- public/service-worker.js`.
- Jest: heightmap (16), dem-sample and the Home boundary test pass. The full suite has 43 suites and 590 tests, all passing. `guard:tests`: jest 590 + e2e 168 = 758 (baseline 533), OK.
- Playwright Chromium: `home-canvas` + `home-modes` pass 30/30 (twice). `home-ascent`, `no-webgl`, `homepage` and `design-system` pass in Chromium and Firefox (70 passed; the two no-webgl timeouts above passed on rerun). `home-canvas --list`: 8 Chromium tests, all titled `@chromium-only`, and 0 in Firefox.
- Acceptance greps: `git grep -l "from 'fast-png'" -- app components lib ":!**/__tests__/**"` lists only TerrainMesh.tsx. NoColorSpace appears 2 times and `tokens.srgb` 2 times. `smoothstep` appears 3 times in the shader, `.dispose()` 5 times and AbortController once in TerrainMesh. `git diff` on data/generated/precache.json and public/service-worker.js is empty (C2). There is no `.skip`, `.only` or `.fixme`.
- The broken-windows ledger entry 1 (the TerrainCanvas scene stub) is marked fixed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 09-10: replace `planView` in CameraRig with the route, raise `uRelief` (and the edge fade with it), and anchor the 3D pins with `meshHeightAtUv` on the metres from `onMetres`. Widen the bounding sphere if `uExaggeration` goes above 1.
- 09-11: the frame-budget sampler and the context-loss listener can rely on the `ascent-canvas-ready` mark and on the cleanup disposing everything.
- 09-14: review the fade and the contour density on phones (coverage D8), and recheck B8 now that a live canvas sits behind the rail.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*

## Self-Check: PASSED

All 6 created files exist. Commits b101a0c, c8b9990, a642b39 and 58b71a5 are ancestors of HEAD (`git rev-list --count 814ba97..HEAD` = 4).
