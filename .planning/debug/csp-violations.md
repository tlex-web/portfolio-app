---
status: diagnosed
trigger: "CSP too strict - blocks inline styles from React/Three.js and connect-src blocks HDRI loading"
created: 2026-02-16T00:00:00Z
updated: 2026-02-16T00:00:00Z
---

## Current Focus

hypothesis: CSP directives in proxy.ts are too restrictive for the React/Three.js runtime requirements
test: Trace each CSP violation to its source in the codebase
expecting: Specific directives and domains needed
next_action: Document root causes and exact changes needed

## Symptoms

expected: No CSP violations; all inline styles render; HDRI environment maps load; 3D components function
actual: style-src blocks all inline styles from React DOM, Three.js/R3F, and component style props; connect-src blocks HDRI fetch from raw.githack.com crashing 3D components; report-only violations for script-src-elem and unsafe-eval
errors: CSP violations for style-src, connect-src, script-src-elem, unsafe-eval
reproduction: Load any page with 3D components or inline style props
started: Since CSP was added in proxy.ts

## Eliminated

(none - direct investigation)

## Evidence

- timestamp: 2026-02-16T00:01:00Z
  checked: proxy.ts lines 6-19
  found: style-src is `'self' 'nonce-${nonce}'` - only allows self-hosted stylesheets and nonce-tagged style elements
  implication: React's style prop (style={{ ... }}) generates inline style *attributes*, not style *elements* - nonces cannot be applied to style attributes per the CSP spec

- timestamp: 2026-02-16T00:02:00Z
  checked: @react-three/fiber Canvas component (react-three-fiber.esm.js lines 125-149)
  found: Canvas renders divs with inline style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', pointerEvents, ...style }} and nested divs/canvas with inline styles
  implication: R3F Canvas injects inline style attributes on DOM elements - cannot use nonces for these

- timestamp: 2026-02-16T00:03:00Z
  checked: 10 component files for style={{ ... }} usage
  found: 25 occurrences of inline style attributes across AnimatedGradientMesh, Hero3DMountain, Hero3DSection, HologramTerminal, InteractiveHotspot, ParticleButton, PhotoCarousel3D, TransitionShowcase, ZoomableImage, ImageDetailModal
  implication: Pervasive use of React inline styles - cannot nonce these; need 'unsafe-inline'

- timestamp: 2026-02-16T00:04:00Z
  checked: @react-three/drei useEnvironment.js line 8
  found: CUBEMAP_ROOT = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/'
  implication: All Environment preset= components fetch .hdr files from raw.githack.com

- timestamp: 2026-02-16T00:05:00Z
  checked: environment-assets.js and component usage
  found: Presets used are "night" (HologramTerminal, MountainTerrain3D), "city" (PhotoCarousel3D), "sunset" (TransitionShowcase) - all resolve to .hdr files fetched from raw.githack.com
  implication: connect-src must include https://raw.githack.com

- timestamp: 2026-02-16T00:06:00Z
  checked: @react-three/drei Cloud.js, NormalTexture.js
  found: Additional CDN domains used: rawcdn.githack.com (Cloud, NormalTexture), cdn.jsdelivr.net (Ktx2, MatcapTexture, NormalTexture)
  implication: While not currently used by this app's components, raw.githack.com covers the Environment preset usage

- timestamp: 2026-02-16T00:07:00Z
  checked: proxy.ts line 8
  found: script-src already includes 'unsafe-eval' - Three.js/WebGL shader compilation may use eval-like patterns
  implication: unsafe-eval is already handled for script-src; the report-only violations for script-src-elem 'none' are separate

- timestamp: 2026-02-16T00:08:00Z
  checked: HologramTerminal.tsx line 365
  found: Uses <style jsx global> which is styled-jsx (Next.js built-in CSS-in-JS) - injects style elements at runtime
  implication: styled-jsx runtime style injection also needs CSP accommodation; Next.js should auto-inject nonces into styled-jsx if the nonce is properly propagated, but style *attributes* still need 'unsafe-inline'

## Resolution

root_cause: Three distinct CSP issues in proxy.ts:
  1. style-src 'self' 'nonce-${nonce}' blocks inline style *attributes* - React's style prop, R3F Canvas, drei Html, and 25+ component inline styles all use style attributes which CANNOT receive nonces per the CSP specification. Only style *elements* (<style>) can use nonces. Adding 'unsafe-inline' is the only solution.
  2. connect-src 'self' blocks fetch requests to raw.githack.com - @react-three/drei Environment component fetches HDRI .hdr files from https://raw.githack.com/pmndrs/drei-assets/... for all preset environments (night, city, sunset used in this app).
  3. script-src-elem is not explicitly set, so it falls back to script-src which includes nonce - report-only violations for inline scripts are expected behavior of the report-only policy.

fix: (not yet applied)
verification: (not yet verified)
files_changed: []
