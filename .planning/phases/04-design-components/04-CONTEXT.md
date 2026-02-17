# Phase 4: Design Components - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Distinctive visual identity for the portfolio — custom navigation, project cards, organic micro-interactions, and glowing accents that bridge the 2D UI to the existing 3D mountain/particle components. Uses the Phase 3 design tokens (alpine colors, frost/ember accents, JetBrains Mono headings, Inter body). Does NOT add new pages, routes, or content — reshapes existing components into a cohesive visual identity.

</domain>

<decisions>
## Implementation Decisions

### Navigation pattern
- Keep top bar position but reimagine the visual treatment
- Organic glass morphing: nav background has flowing organic shapes (topographic contour lines or aurora-like effects) that shift subtly on scroll
- Progressive reveal on scroll: starts transparent over the 3D hero, organic glass effect intensifies as user scrolls into content sections
- Mobile: full-screen overlay with large touch targets and organic background effects — immersive feel, not a simple dropdown
- Active/hover states should use frost glow from design tokens

### Card & tile style
- Hexagonal / crystalline shape language — angular, crystal-like shapes with faceted edges
- Connects to the digital/mineral side of the organic-meets-digital aesthetic
- Keep current information density (title, description, status badge, tech pills, feature count, version) — restyle in crystalline shell
- Hover interaction: combined tilt/parallax (3D perspective toward cursor) + facet reveal (light catching crystalline edges with frost glow)
- Layout: hex-tiled mosaic arrangement — honeycomb/hex pattern, fully committing to crystalline theme
- Responsive: hex pattern adapts gracefully to mobile (likely single column with crystalline card shapes preserved)

### Micro-interactions
- Nature theme: geological / mineral — crystal formation, stone erosion, tectonic shifts. Slow, weighty, revealing
- Easing curves: weighty and deliberate — slow start, heavy settle, like stone shifting into place. Longer durations (300-500ms), custom cubic-bezier curves
- Prominence: subtle and refined — effects are there but understated, noticed after a moment, professional feel
- Buttons/clickable elements: replace current ParticleButton effects with geological effects — crystal fracture lines, mineral dust, tectonic ripple. Replace existing sparkle/explosion particle styles
- All micro-interactions must respect prefers-reduced-motion (existing pattern in codebase)

### Glow & accent system
- Primary glow color: frost (cyan/teal) — matches existing 3D wireframe and holographic feel. Ember used sparingly for highlights
- Glow placement: always-on ambient glow on key elements (card edges, nav active state) that intensifies on hover. Persistent atmosphere
- 2D-3D bridge: glow intensity responds to proximity to 3D scene — elements near the hero/3D section glow brighter, fading as user scrolls into pure 2D content. Creates a gradient of 3D influence
- Depth effects: stratified geological layers — elements feel like geological strata at different depths, shadows cast between rock layers rather than floating in air

### Claude's Discretion
- Exact contour line / aurora pattern for nav background
- Hex tile sizing and responsive breakpoint behavior
- Specific cubic-bezier values for geological easing
- Crystal fracture animation implementation details
- How ambient glow intensity maps to scroll position
- Stratified shadow values and layer offsets
- How existing ParticleButton effects get reworked vs replaced

</decisions>

<specifics>
## Specific Ideas

- Geological/mineral theme is cohesive across ALL areas: crystalline cards, geological micro-interactions, stratified depth, mineral-inspired effects
- The 3D terrain (MountainTerrain3D) already uses cyan wireframes — frost glow on 2D elements creates natural continuity
- Glow intensity gradient tied to scroll is a distinctive touch — makes the 3D hero "radiate" influence into the 2D UI below
- Hex mosaic + crystalline cards = fully committed crystalline identity, not a half-measure

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-design-components*
*Context gathered: 2026-02-17*
