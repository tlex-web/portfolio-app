# API Coverage — Google Fonts css2 API (one-time OG font download)

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Scope: plan 12-10 Task 1 downloads three static TTF files once (Schibsted Grotesk 600, Inter 400, JetBrains Mono 400)
> through the Google Fonts css2 stylesheet and fonts.gstatic.com, and commits them under `lib/og/fonts/` with their OFL
> licences and SHA-256 hashes. The OG renderer reads them from disk at build; the site never calls Google at build or
> request time.
> The api-coverage detector's only signal for Phase 12 (2026-11-02) was the browser Clipboard API on the Contact panel,
> which is a browser API, not an external service. The feedback route's Resend and Upstash integrations are existing
> and kept unchanged (CONTEXT carried forward: data path, CSRF check and rate limit unchanged). This matrix records the
> one new external use anyway, so the seal-time gate has a decided surface.

| capability | decision | reason |
|---|---|---|
| css2 stylesheet, one family + weight, static TTF | INTEGRATE | static TTF: the request comes from a client without WOFF2 support |
| fonts.gstatic.com font file download | INTEGRATE | |
| `text=` glyph subsetting | OPT-OUT | not needed: OG strings come from data that can change; a fixed glyph subset would break on a new character |
| variable-axis ranges (for example `wght@400..700`) | OPT-OUT | explicitly out of scope: Satori needs static instances (`04-functions/image-response.md`) |
| `display=` (font-display) | OPT-OUT | not applicable: the files are read from disk at build, never loaded by a browser |
| Developer API (webfonts list, API key) | OPT-OUT | not needed: three known families; no listing or key |
| icon fonts and Material Symbols | OPT-OUT | not needed: icons come from `@phosphor-icons/react` (DSGN-10) |
