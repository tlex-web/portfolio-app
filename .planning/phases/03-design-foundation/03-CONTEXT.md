# Phase 3: Design Foundation - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Custom color palette, typography system, and accessibility-verified design tokens that express the organic-meets-digital aesthetic. This phase defines the visual language via Tailwind `@theme` tokens — colors, fonts, and contrast-verified combinations. It does NOT build components (Phase 4) or add animations/interactions (Phase 4-5).

</domain>

<decisions>
## Implementation Decisions

### Overall Mood & Aesthetic
- Tech-dominant forest aesthetic — futuristic dark base with nature-colored accents and organic geometric shapes
- Swiss Alps inspiration — deep pine forests and granite mountain tones as the nature foundation
- Geometric nature patterns — hexagons, fractals, leaf vein networks abstracted into geometric line art (relevant for Phase 4 components, but informs color choices here)
- Multi-color contextual glow — different accent colors serve different purposes (interactive, highlight, success)
- Balanced visual density — comfortable spacing, neither sparse nor packed
- Professional edge — polished, confident, corporate-friendly, impressive without being wild

### Color Palette
- **Base tones:** Swiss Alps palette — deep pine greens and granite/slate grays
- **Primary accent:** Cyan/teal — keeps existing hologram terminal aesthetic, cold digital light against alpine nature
- **Secondary accent:** Amber/gold — warm counterpoint for highlights and emphasis, sunrise-over-mountains feel
- **Vibrancy:** Moderate glow — accents are clear and noticeable but not neon-loud, refined
- **Semantic colors:** Organic semantic palette — success=forest green, error=rusty red, warning=golden amber (nature-derived, not standard conventions)

### Typography
- **Headings:** Monospace/technical display font — leans into the tech/hologram terminal side of the aesthetic
- **Body:** Clean sans-serif — modern, neutral, lets headings be the personality
- **Weight hierarchy:** Medium contrast — page titles bold, sections semi-bold, subsections regular (clear but not extreme)
- **Text effects:** Subtle cyan/accent glow (text-shadow) on page-level headings — connects headings to the digital side

### Dark Mode Strategy
- **Dark only** — no light mode variant. The glow effects, alpine night feel, and hologram terminal all require dark to shine
- **Layered dark backgrounds** — multiple dark shades for depth: darkest background, slightly lighter surfaces, card elevations visible through shade differences
- **Green-tinted layers** — dark background shades carry subtle forest green undertones, even backgrounds feel 'alpine'
- **Body text:** Warm off-white — slightly warm/cream tone, softer on eyes, feels natural against forest tones

### Claude's Discretion
- Specific font family choices (which monospace, which sans-serif) — research should identify options that fit
- Exact color hex values — derive from the described palette direction, verify WCAG compliance
- Number of shade steps in the layered dark system
- Heading glow intensity and spread values
- Caption and small text styling

</decisions>

<specifics>
## Specific Ideas

- Swiss Alps as the nature reference point — not tropical forest or generic woodland, specifically deep pine forests and granite/stone mountain tones
- Existing hologram terminal cyan glow should be the anchor for the primary accent — the new palette should feel like a natural evolution, not a replacement
- Multi-color glow is contextual, not decorative: cyan=interactive elements, amber=highlights/emphasis, green=success states
- Geometric nature patterns (hexagons, fractals, vein networks) inform how the color system will be used in Phase 4 components — the palette should support these patterns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-design-foundation*
*Context gathered: 2026-02-17*
