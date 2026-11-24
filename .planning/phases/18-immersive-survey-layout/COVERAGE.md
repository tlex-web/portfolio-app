# API Coverage — browser Web Share API and Clipboard API (PHOTO-07)

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Phase 18 calls no external service; the only API surface it integrates is the browser's Web Share and Clipboard APIs for the Share / Copy link button (18-07, 18-18).

| capability | decision | reason |
|---|---|---|
| navigator.share url | INTEGRATE | |
| navigator.share title | INTEGRATE | |
| navigator.share text | OPT-OUT | not needed: the title and the canonical URL carry the share; a text field would repeat the title |
| navigator.share files | OPT-OUT | explicitly out of scope: PHOTO-07 shares links, and sharing image files would hand out photo files outside the derivative-only rule |
| navigator.canShare | INTEGRATE | |
| clipboard.writeText | INTEGRATE | |
| clipboard.write | OPT-OUT | not needed: the copied value is a plain-text URL |
| clipboard.readText | OPT-OUT | not needed: the site never reads the clipboard, and reading would prompt for a permission |
| clipboard.read | OPT-OUT | not needed: the site never reads the clipboard |
