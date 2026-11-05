# Open Graph fonts (SEO-02, 12-10)

Static TTF instances read from disk by `ogFonts()` in `lib/og/template.tsx` when
the Open Graph cards render (at build, for the prerendered image routes). They are
never served to browsers and never fetched at build or request time: the site's own
pages load the same families through `next/font`, which serves WOFF2, a format
Satori cannot read (12-UI-SPEC "Open Graph Template").

Downloaded once on 2026-11-02 over HTTPS. The `fonts.gstatic.com` URLs were listed by
`https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@600&family=Inter:wght@400&family=JetBrains+Mono:wght@400`
when requested with the user agent `Wget/1.21` (a client without WOFF2 support, so
the API answers with `format('truetype')`). Each file starts with the TrueType magic
bytes `00 01 00 00` and carries no `fvar` table (a static instance, not a variable
font). The full instances are kept rather than Google's `latin` subset because that
subset lacks U+2192 (the arrow in the project caption, D-15).

| File | Family | Weight | Source URL | SHA-256 |
|------|--------|--------|------------|---------|
| `SchibstedGrotesk-SemiBold.ttf` | Schibsted Grotesk | 600 | https://fonts.gstatic.com/s/schibstedgrotesk/v7/JqzK5SSPQuCQF3t8uOwiUL-taUTtarVKQ9vZ6pJJWlMN_MYATw.ttf | `5ae8a45dcff8a321e7866fc7b38d31bd9f209bfb20df63272bdff14b5235af18` |
| `Inter-Regular.ttf` | Inter | 400 | https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf | `1b08e7fc267a5c7e1d614100f604b83e7e8a0be241f0f288faa2b3ac93a683ba` |
| `JetBrainsMono-Regular.ttf` | JetBrains Mono | 400 | https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPQ.ttf | `44ce4a84f20d60f24539bd0cef11f79c29e38609e0f8adf18551c9794a5d9dc3` |

## Licences

All three families are under the SIL Open Font License 1.1. Each licence text is
copied unchanged from the family's directory in https://github.com/google/fonts.

| File | Source URL | SHA-256 |
|------|------------|---------|
| `OFL-SchibstedGrotesk.txt` | https://github.com/google/fonts/raw/main/ofl/schibstedgrotesk/OFL.txt | `3b4f3063b6ac7c1e403e2c4a5e8ef3a58190ff83ed7b15af66511858699139ce` |
| `OFL-Inter.txt` | https://github.com/google/fonts/raw/main/ofl/inter/OFL.txt | `5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57` |
| `OFL-JetBrainsMono.txt` | https://github.com/google/fonts/raw/main/ofl/jetbrainsmono/OFL.txt | `b2fe5e8987594e9ffd1d2ca52a2f5d73eb8335243893c5d6254b5ad69269591d` |

`.gitattributes` keeps these bytes exact on every checkout (TTF as binary, the
licence texts with LF), so `sha256sum lib/og/fonts/*` reproduces the table.

## Updating

Repeat the request above, save each file under the same name, check the first four
bytes (`00 01 00 00` or `OTTO`), and update both tables. A file that is WOFF2, a
variable font, or not TTF/OTF must not be committed.
