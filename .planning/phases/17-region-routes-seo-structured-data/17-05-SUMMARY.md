---
phase: 17-region-routes-seo-structured-data
plan: 05
subsystem: routing
tags: [nextjs, app-router, generateStaticParams, proxy, seo, og-image, jest, playwright]

requires:
  - phase: 17-region-routes-seo-structured-data
    provides: 17-01 region routes tracer, regionHref, Tim's D-14 copy (the aerial description)
  - phase: 16-new-region-data
    provides: the eleven generated photos with editorial copy and image manifest entries
provides:
  - publishedViews / publishedSlugs (every generated photo, buildWaypoints' order) in lib/photos/view-model.ts
  - viewerPhotos(view) (the four for a v2.0 photo, a one-photo set with null neighbours otherwise)
  - photoBySlug light-table first, then published
  - photoRouteSlugs over every editorial slug (proxy admits the published set), still pure-annotated
  - /photos/<slug> static params over publishedSlugs; seven new photo pages and OG cards answer 200
  - Tim's approved aerial meta description for the two Saalfelden photos
  - the v2.0 identity capture script, base JSON (phase base 285b6d5), control run and result-line format that 17-06, 17-07, 17-12, 17-13 and 17-15 re-check
affects: [17-06, 17-07, 17-10, 17-11, 17-12, 17-13, 17-15, 18]

actuals:
  tokens: 3297     # chars/4 over the added lines of 2ba1389..940c245
  tasks: 2
  commits: 5       # MEASURED: git rev-list --count 2ba1389..HEAD at SUMMARY write
plan_head_before: 2ba1389d4a7f7a9a4f282bb8abd742b2943696c6
plan_head_after: 940c24590747259090a1fefbb71d7db9617cafd2

tech-stack:
  added: []
  patterns:
    - "The published set (publishedViews/publishedSlugs) is the route set; the light table (photoViews/photoSlugs) is one curated view of it for /photos and the four's stepping set"
    - "photoBySlug resolves the light-table view first, so the v2.0 four keep k, n, prevSlug and nextSlug among the four (and their OG PNG bytes)"
    - "The v2.0 identity is a fixed-shape capture (4 slugs x 10 keys) compared on 9 keys, with a 36-mutant control run proving it can fail"

key-files:
  created: []
  modified:
    - lib/photos/view-model.ts
    - lib/photos/routes.ts
    - app/(site)/photos/[slug]/page.tsx
    - app/(site)/photos/@modal/(.)[slug]/page.tsx
    - lib/__tests__/photo-routes.test.ts
    - lib/__tests__/region-series.test.ts
    - lib/__tests__/photos-view-model.test.ts
    - lib/og/__tests__/routes.test.ts

key-decisions:
  - "17-05 D-07: the photo route set (static params, proxy KNOWN slugs, per-slug OG card) is the eleven published photos; photoViews/photoSlugs stay the four-photo light table (Phase 18 renames them)"
  - "17-05 D-14: the aerial meta description ships as Tim approved it: '{title}: an aerial photograph by Tim Lui over {short place}, {altitudeLabel}, {captureMonth}.'; ground photos keep the v2.0 template"
  - "17-05 identity: htmlSha256 also replaces every nonce=\"…\" attribute value with one token, because Next puts the per-request CSP nonce on <link> elements outside <script>; without it two captures of one build differed"

patterns-established:
  - "Re-check the v2.0 four with: node <scratchpad>/v20-identity.mjs http://localhost:3017 <scratchpad>/v20-base.json, recreated byte for byte from this SUMMARY; paste its stdout ending in the v20-identity: result line"

requirements-completed: [PHOTO-05]

coverage:
  - id: D1
    description: "The proxy, the static params and the per-photo OG card route cover all eleven published photos; photoRouteSlugs equals publishedSlugs as a set (11, no duplicates, every light-table slug in it)"
    requirement: PHOTO-05
    verification:
      - kind: unit
        ref: "lib/__tests__/photo-routes.test.ts#proxy slugs and static photo pages (F5)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/region-series.test.ts#keeps a Zermatt photo that is not in lightTableIds off the light table, and publishes it"
        status: pass
    human_judgment: false
  - id: D2
    description: "The seven new photo pages and their og:image URLs answer 200 in a production build; unknown and wrong-case slugs answer 404"
    requirement: PHOTO-05
    verification:
      - kind: other
        ref: "next start -p 3017 on 940c245, scratchpad/new-pages.mjs (statuses recorded in this SUMMARY)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The v2.0 four's status, title, head tags, og:image URL, OG PNG SHA-256, main markup (ld+json stripped) and stripped HTML are identical to the phase base 285b6d5 on two production builds"
    requirement: PHOTO-05
    verification:
      - kind: other
        ref: "node v20-identity.mjs http://localhost:3017 v20-base.json -> exit=0 differing=0 compared=36"
        status: pass
      - kind: other
        ref: "v20-control.mjs -> v20-control: mutants=36 caught=36 uncompared-exit=0 self-exit=0"
        status: pass
    human_judgment: false
  - id: D4
    description: "viewerPhotos gives the four their light-table set and every other photo a one-photo set with null neighbours; both photo routes pass it"
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-view-model.test.ts#the published set and the viewer set (17 D-07, D-08, PHOTO-05)"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts (PW_PROD=1, chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Tim's approved aerial description ships verbatim on the two aerial photo pages; the nine ground descriptions are unchanged"
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-view-model.test.ts#aerial photo description (17 D-14, Tim approved as drafted)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The Zermatt region page passes the production audit gate (axe, CLS, links, images, CSP, console) at 375, 768 and 1440 in Chromium and Firefox"
    verification:
      - kind: e2e
        ref: "e2e/audit.spec.ts#/photos/regions/zermatt: axe, CLS, links, images, CSP, console (PW_PROD=1, chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Client JS stays at 1,851,685 B (cap 1,855,781 B) and no client chunk holds a new photo's slug, title or registry facts"
    verification:
      - kind: other
        ref: "rm -rf .next/static && npm run build; byte-sum one-liner; grep over .next/static/chunks"
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-11-23
status: complete
---

# Phase 17 Plan 05: Publish Every Photo Summary

**All eleven photos are now deep-linkable: `generateStaticParams`, the proxy's known slugs and the per-photo OG card run over `publishedSlugs`. The four v2.0 photos keep their light-table views, stepping set and every measured byte of their pages and cards (identical to the phase base 285b6d5 on 36 of 36 compared fields, with a 36-mutant control run). The two aerial photos carry Tim's approved description.**

## Performance

- **Duration:** about 14 min wall clock (by `date`; most of it went to the base worktree's `npm ci` and the two production builds)
- **Started:** 2026-11-23T23:02:45Z
- **Completed:** 2026-11-23T23:17Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- `publishedViews` and `publishedSlugs` cover every generated photo, in buildWaypoints' order (DEM height ascending, ties broken by id). `viewerPhotos(view)` returns the four for a v2.0 photo and a one-photo set with null neighbours for any other photo. `photoBySlug` returns the light-table view first.
- `photoRouteSlugs = /* @__PURE__ */ Object.values(editorial).map((e) => e.slug)`, so `proxy.ts` now admits exactly the published set. The light-table import is gone and the pure annotation stays.
- Both photo routes pass `viewerPhotos(view)`. `[slug]/page.tsx` lists `publishedSlugs`. `opengraph-image.tsx` is byte-identical to 285b6d5.
- The aerial description from Tim's 17-01 reply ships verbatim on the two Saalfelden photo pages.
- The v2.0 identity record (capture script, base JSON, control run, after-plan compare) is below for 17-06, 17-07, 17-12, 17-13 and 17-15 to re-check.

## v2.0 identity (phase base 285b6d5)

Captured with the script below against a `next start -p 3017` of a production build of 285b6d5, made in a disposable `git worktree` at `<scratchpad>/v20-base` with a bundled-npm `npm ci`. The worktree was removed afterwards (`git worktree remove --force`, then `rm -rf` of the leftover directory, which hit Windows' path-length limit, then `git worktree prune`; `git worktree list` shows only the main tree).

| Slug | Status | Title | Head-tag SHA-256 | og:image path and query | OG status / type | OG PNG SHA-256 | Main SHA-256 (after ld+json strip) | ld+json removed | Stripped-HTML SHA-256 |
|---|---|---|---|---|---|---|---|---|---|
| matterhorn-from-zermatt | 200 | Matterhorn from Zermatt · Tim Lui | 4868b48d8ef93534090dc2b0c04965124eeaa9f8822dc6dc774ec6751ef7bd03 | /photos/matterhorn-from-zermatt/opengraph-image-126xvw/card?1bf973d7cc2e42c4 | 200 image/png | 97b39bbd632f09b6180704b9aacc23f90be1bc46ce0fb28048b4c6eeb3e6eddd | ec228fa5dacca7f46baf1424aa012fd339b9d100a5243829676bdaf630146cb8 | 0 | 7e1d643c7032d1d8903a937bc51aea8813e20b1c336e36daf36086412e15b89f |
| gornerschlucht-waterfall | 200 | Waterfall in the Gornerschlucht · Tim Lui | 0d92b2bc161c2d217ce5f55881b19f309b1bb96865fabc09f55f81c1ae8400e8 | /photos/gornerschlucht-waterfall/opengraph-image-126xvw/card?1bf973d7cc2e42c4 | 200 image/png | 487ad9f9ba923e050d87c79b22602f0802b026f736089ad3672255ab09cbea8f | 37f5fd119dcb94d4760a499221677927944e1bf8049d4cceeaae8b4c2a614f1c | 0 | b5f1e26c47219f009436b38f3a5a2849ab5475bbb327b27f2e7042d10068a599 |
| matterhorn-glacier-trail | 200 | Matterhorn from the Glacier Trail · Tim Lui | 7a52a3cdfde991a5031fa77b8388a9a27ff4949c368acca8ed81b23961295667 | /photos/matterhorn-glacier-trail/opengraph-image-126xvw/card?1bf973d7cc2e42c4 | 200 image/png | c3aef530bdcb3b795f1d7cf3bfc645dadeadbce382fbb453e372fc03051eb9de | 798262590faac36ba288ff480745a72d18a3dee60aa8a51f8436884d72e960ef | 0 | c160ed163607a7e138caf87ba4d2e00476cdb3a8409a447824a20172ea97b5c7 |
| riffelsee-reflection | 200 | Matterhorn in the Riffelsee · Tim Lui | 2047c67a86942c9fb5a9ee2c5925335b71e39946e5aed45d4eaf102b244c710f | /photos/riffelsee-reflection/opengraph-image-126xvw/card?1bf973d7cc2e42c4 | 200 image/png | 5c920bd1e95a829b49444e6b406f0cb8859d57bd492b788a13bac66f47654108 | 6c276ad6f9c2497cbb7bf9d7b75a8a9fef59bff6b9dafa4612601f957e8c01c2 | 0 | 6f73fcecef2e21938e375342fae3442351c40e60f9e1b7da0747bc936cf92b5e |

The four OG PNG hashes match the 17-RESEARCH spike prefixes (`97b39bbd…`, `487ad9f9…`, `c3aef530…`, `5c920bd1…`).

## v2.0 identity base JSON

Saved as `<scratchpad>/v20-base.json`: the capture-mode stdout of the script below against the base server, verbatim (file SHA-256 `be3ad3b82fd3f659b8fc5084a28099fe239cd1d3958b57052fbda3b3b99f200a`, with a trailing newline).

```json
{
  "matterhorn-from-zermatt": {
    "status": 200,
    "title": "Matterhorn from Zermatt · Tim Lui",
    "headSha256": "4868b48d8ef93534090dc2b0c04965124eeaa9f8822dc6dc774ec6751ef7bd03",
    "ogImage": "/photos/matterhorn-from-zermatt/opengraph-image-126xvw/card?1bf973d7cc2e42c4",
    "ogStatus": 200,
    "ogContentType": "image/png",
    "ogSha256": "97b39bbd632f09b6180704b9aacc23f90be1bc46ce0fb28048b4c6eeb3e6eddd",
    "mainSha256": "ec228fa5dacca7f46baf1424aa012fd339b9d100a5243829676bdaf630146cb8",
    "ldJsonRemoved": 0,
    "htmlSha256": "7e1d643c7032d1d8903a937bc51aea8813e20b1c336e36daf36086412e15b89f"
  },
  "gornerschlucht-waterfall": {
    "status": 200,
    "title": "Waterfall in the Gornerschlucht · Tim Lui",
    "headSha256": "0d92b2bc161c2d217ce5f55881b19f309b1bb96865fabc09f55f81c1ae8400e8",
    "ogImage": "/photos/gornerschlucht-waterfall/opengraph-image-126xvw/card?1bf973d7cc2e42c4",
    "ogStatus": 200,
    "ogContentType": "image/png",
    "ogSha256": "487ad9f9ba923e050d87c79b22602f0802b026f736089ad3672255ab09cbea8f",
    "mainSha256": "37f5fd119dcb94d4760a499221677927944e1bf8049d4cceeaae8b4c2a614f1c",
    "ldJsonRemoved": 0,
    "htmlSha256": "b5f1e26c47219f009436b38f3a5a2849ab5475bbb327b27f2e7042d10068a599"
  },
  "matterhorn-glacier-trail": {
    "status": 200,
    "title": "Matterhorn from the Glacier Trail · Tim Lui",
    "headSha256": "7a52a3cdfde991a5031fa77b8388a9a27ff4949c368acca8ed81b23961295667",
    "ogImage": "/photos/matterhorn-glacier-trail/opengraph-image-126xvw/card?1bf973d7cc2e42c4",
    "ogStatus": 200,
    "ogContentType": "image/png",
    "ogSha256": "c3aef530bdcb3b795f1d7cf3bfc645dadeadbce382fbb453e372fc03051eb9de",
    "mainSha256": "798262590faac36ba288ff480745a72d18a3dee60aa8a51f8436884d72e960ef",
    "ldJsonRemoved": 0,
    "htmlSha256": "c160ed163607a7e138caf87ba4d2e00476cdb3a8409a447824a20172ea97b5c7"
  },
  "riffelsee-reflection": {
    "status": 200,
    "title": "Matterhorn in the Riffelsee · Tim Lui",
    "headSha256": "2047c67a86942c9fb5a9ee2c5925335b71e39946e5aed45d4eaf102b244c710f",
    "ogImage": "/photos/riffelsee-reflection/opengraph-image-126xvw/card?1bf973d7cc2e42c4",
    "ogStatus": 200,
    "ogContentType": "image/png",
    "ogSha256": "5c920bd1e95a829b49444e6b406f0cb8859d57bd492b788a13bac66f47654108",
    "mainSha256": "6c276ad6f9c2497cbb7bf9d7b75a8a9fef59bff6b9dafa4612601f957e8c01c2",
    "ldJsonRemoved": 0,
    "htmlSha256": "6f73fcecef2e21938e375342fae3442351c40e60f9e1b7da0747bc936cf92b5e"
  }
}
```

base=51b7f4d9b291

## v2.0 identity capture script

`<scratchpad>/v20-identity.mjs` (file SHA-256 `b722b56559399d47fbee6408e7d29bed2f4f7daef51486bee6212949290f2dd6`, LF line endings, trailing newline). Run it from the repo root so `head=` is the tree's HEAD.

- Capture: `node v20-identity.mjs <origin> > v20-base.json`
- Compare: `node v20-identity.mjs <origin> <base.json>`

```js
// v2.0 identity capture and compare (17-05, D-07 amendment).
//
//   node v20-identity.mjs <origin>               capture: prints the capture JSON to stdout
//   node v20-identity.mjs <origin> <base.json>   compare: prints each differing field, then the result line
//
// Capture shape (fixed): an object keyed by the four slugs in SLUGS order, each holding exactly
// the KEYS below and nothing else (no timestamp, origin or build id).
// Compare mode walks SLUGS x COMPARED (every key but ldJsonRemoved), never the keys it finds in
// the base file, and counts a missing slug or key as a difference, so an empty or truncated base
// cannot read as identical. Its last line is the result line:
//   v20-identity: exit=<0|1> differing=<n> compared=<n> removed=<a,b,c,d> base=<12 hex> head=<12 hex>
// base= is the first 12 hex digits of sha256(JSON.stringify(JSON.parse(base file text))), so it
// ignores whitespace. Capture mode exits 2 when a page or card does not answer 200.
// htmlSha256 hashes the whole HTML with every <script> element removed, every /_next/static URL
// replaced by one token and every nonce="…" attribute value replaced by one token.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SLUGS = [
  'matterhorn-from-zermatt',
  'gornerschlucht-waterfall',
  'matterhorn-glacier-trail',
  'riffelsee-reflection',
];
const KEYS = [
  'status',
  'title',
  'headSha256',
  'ogImage',
  'ogStatus',
  'ogContentType',
  'ogSha256',
  'mainSha256',
  'ldJsonRemoved',
  'htmlSha256',
];
const COMPARED = KEYS.filter((k) => k !== 'ldJsonRemoved');

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

/** Removes every <script type="application/ld+json">…</script> element; jsonLdHtml escapes every '<' in the body, so the first </script> ends the block. */
function stripLdJson(markup) {
  let removed = 0;
  const out = markup.replace(
    /<script\b[^>]*\btype="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,
    () => {
      removed += 1;
      return '';
    }
  );
  return { out, removed };
}

async function captureSlug(origin, slug) {
  const rec = Object.fromEntries(KEYS.map((k) => [k, null]));
  const res = await fetch(`${origin}/photos/${slug}`, { redirect: 'manual' });
  rec.status = res.status;
  const html = await res.text();

  const title = html.match(/<title>([^<]*)<\/title>/);
  rec.title = title ? title[1] : null;

  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/);
  if (head) {
    const tags = [
      ...(head[1].match(/<meta\b[^>]*>/g) ?? []),
      ...(head[1].match(/<link\b[^>]*\brel="canonical"[^>]*>/g) ?? []),
    ].sort();
    rec.headSha256 = sha256(tags.join('\n'));

    const og = head[1].match(/<meta\b[^>]*\bproperty="og:image"[^>]*\bcontent="([^"]*)"[^>]*>/);
    if (og) {
      rec.ogImage = og[1].replace(/^https?:\/\/[^/]+/, '');
      const ogRes = await fetch(origin + rec.ogImage.replace(/&amp;/g, '&'), { redirect: 'manual' });
      rec.ogStatus = ogRes.status;
      rec.ogContentType = ogRes.headers.get('content-type');
      rec.ogSha256 = sha256(Buffer.from(await ogRes.arrayBuffer()));
    }
  }

  const main = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/);
  if (main) {
    const { out, removed } = stripLdJson(main[0]);
    rec.mainSha256 = sha256(out);
    rec.ldJsonRemoved = removed;
  }

  // Per-request and per-build noise only: every script element (nonces, flight data), every
  // /_next/static URL (build hashes) and the per-request CSP nonce Next puts on <link> elements.
  const stripped = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/\/_next\/static\/[^"'\s)]*/g, '/_next/static/TOKEN')
    .replace(/\snonce="[^"]*"/g, ' nonce="NONCE"');
  rec.htmlSha256 = sha256(stripped);
  return rec;
}

async function capture(origin) {
  const out = {};
  for (const slug of SLUGS) {
    try {
      out[slug] = await captureSlug(origin, slug);
    } catch (err) {
      console.error(`capture failed for ${slug}: ${err.message}`);
      out[slug] = Object.fromEntries(KEYS.map((k) => [k, null]));
    }
  }
  return out;
}

const [origin, basePath] = process.argv.slice(2);
if (!origin) {
  console.error('usage: node v20-identity.mjs <origin> [base.json]');
  process.exit(2);
}

const current = await capture(origin);

if (!basePath) {
  process.stdout.write(JSON.stringify(current, null, 2) + '\n');
  const bad = SLUGS.filter((s) => current[s].status !== 200 || current[s].ogStatus !== 200);
  if (bad.length > 0) {
    console.error(`capture: not 200 for ${bad.join(', ')}`);
    process.exit(2);
  }
  process.exit(0);
}

const baseText = readFileSync(basePath, 'utf8');
let base;
try {
  base = JSON.parse(baseText);
} catch {
  base = null;
}
const baseHash = base === null ? 'unparseable' : sha256(JSON.stringify(base)).slice(0, 12);

let differing = 0;
let compared = 0;
for (const slug of SLUGS) {
  for (const key of COMPARED) {
    compared += 1;
    const has =
      base !== null &&
      typeof base === 'object' &&
      Object.hasOwn(base, slug) &&
      base[slug] !== null &&
      typeof base[slug] === 'object' &&
      Object.hasOwn(base[slug], key);
    const b = has ? base[slug][key] : undefined;
    const c = current[slug][key];
    if (!has) {
      differing += 1;
      console.log(`DIFF ${slug}.${key}: base=<missing> current=${JSON.stringify(c)}`);
    } else if (JSON.stringify(b) !== JSON.stringify(c)) {
      differing += 1;
      console.log(`DIFF ${slug}.${key}: base=${JSON.stringify(b)} current=${JSON.stringify(c)}`);
    }
  }
}

let head = 'unknown';
try {
  head = execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' }).trim();
} catch {
  /* not a git checkout */
}
const exit = differing === 0 ? 0 : 1;
const removed = SLUGS.map((s) => current[s].ldJsonRemoved).join(',');
console.log(
  `v20-identity: exit=${exit} differing=${differing} compared=${compared} removed=${removed} base=${baseHash} head=${head}`
);
process.exit(exit);
```

## v2.0 identity control run

The harness ran against the base server (`http://localhost:3017`, the 285b6d5 build) before any code edit. Its complete output, verbatim:

```text
self       (unchanged base)                          exit=0 differing=0
mutant     matterhorn-from-zermatt.status             exit=1 differing=1 named=yes caught
mutant     matterhorn-from-zermatt.title              exit=1 differing=1 named=yes caught
mutant     matterhorn-from-zermatt.headSha256         exit=1 differing=1 named=yes caught
mutant     matterhorn-from-zermatt.ogImage            exit=1 differing=1 named=yes caught
mutant     matterhorn-from-zermatt.ogStatus           exit=1 differing=1 named=yes caught
mutant     matterhorn-from-zermatt.ogContentType      exit=1 differing=1 named=yes caught
mutant     matterhorn-from-zermatt.ogSha256           exit=1 differing=1 named=yes caught
mutant     matterhorn-from-zermatt.mainSha256         exit=1 differing=1 named=yes caught
mutant     matterhorn-from-zermatt.htmlSha256         exit=1 differing=1 named=yes caught
mutant     gornerschlucht-waterfall.status            exit=1 differing=1 named=yes caught
mutant     gornerschlucht-waterfall.title             exit=1 differing=1 named=yes caught
mutant     gornerschlucht-waterfall.headSha256        exit=1 differing=1 named=yes caught
mutant     gornerschlucht-waterfall.ogImage           exit=1 differing=1 named=yes caught
mutant     gornerschlucht-waterfall.ogStatus          exit=1 differing=1 named=yes caught
mutant     gornerschlucht-waterfall.ogContentType     exit=1 differing=1 named=yes caught
mutant     gornerschlucht-waterfall.ogSha256          exit=1 differing=1 named=yes caught
mutant     gornerschlucht-waterfall.mainSha256        exit=1 differing=1 named=yes caught
mutant     gornerschlucht-waterfall.htmlSha256        exit=1 differing=1 named=yes caught
mutant     matterhorn-glacier-trail.status            exit=1 differing=1 named=yes caught
mutant     matterhorn-glacier-trail.title             exit=1 differing=1 named=yes caught
mutant     matterhorn-glacier-trail.headSha256        exit=1 differing=1 named=yes caught
mutant     matterhorn-glacier-trail.ogImage           exit=1 differing=1 named=yes caught
mutant     matterhorn-glacier-trail.ogStatus          exit=1 differing=1 named=yes caught
mutant     matterhorn-glacier-trail.ogContentType     exit=1 differing=1 named=yes caught
mutant     matterhorn-glacier-trail.ogSha256          exit=1 differing=1 named=yes caught
mutant     matterhorn-glacier-trail.mainSha256        exit=1 differing=1 named=yes caught
mutant     matterhorn-glacier-trail.htmlSha256        exit=1 differing=1 named=yes caught
mutant     riffelsee-reflection.status                exit=1 differing=1 named=yes caught
mutant     riffelsee-reflection.title                 exit=1 differing=1 named=yes caught
mutant     riffelsee-reflection.headSha256            exit=1 differing=1 named=yes caught
mutant     riffelsee-reflection.ogImage               exit=1 differing=1 named=yes caught
mutant     riffelsee-reflection.ogStatus              exit=1 differing=1 named=yes caught
mutant     riffelsee-reflection.ogContentType         exit=1 differing=1 named=yes caught
mutant     riffelsee-reflection.ogSha256              exit=1 differing=1 named=yes caught
mutant     riffelsee-reflection.mainSha256            exit=1 differing=1 named=yes caught
mutant     riffelsee-reflection.htmlSha256            exit=1 differing=1 named=yes caught
uncompared matterhorn-from-zermatt.ldJsonRemoved      exit=0 differing=0
v20-control: mutants=36 caught=36 uncompared-exit=0 self-exit=0
```

Harness source, `<scratchpad>/v20-control.mjs` (file SHA-256 `18f5279b39a1e4c0e8289247467fc7ccce3c956a3622490304d748079ad38d9c`). Command: `node v20-control.mjs http://localhost:3017 v20-identity.mjs v20-base.json <scratchpad>/v20-control-work`.

```js
// v2.0 identity control run (17-05, D-07 amendment): shows v20-identity.mjs can fail.
//
//   node v20-control.mjs <origin> <v20-identity.mjs> <v20-base.json> <work dir>
//
// Spawns the real script as a child process in compare mode and judges each run only by the
// child's exit code and its result line (never by anything else the script says):
//   - once against the base unchanged                      (expect exit 0)
//   - once per mutant: one compared value altered, for each of the four slugs x nine compared keys
//     (string + 'x', number + 1, null -> 'x')               (expect exit 1, differing=1, field named)
//   - once with only the first slug's ldJsonRemoved altered (expect exit 0: recorded, not compared)
// Prints one row per run and ends with:
//   v20-control: mutants=<n> caught=<n> uncompared-exit=<code> self-exit=<code>
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [origin, script, basePath, work] = process.argv.slice(2);
if (!origin || !script || !basePath || !work) {
  console.error('usage: node v20-control.mjs <origin> <v20-identity.mjs> <v20-base.json> <work dir>');
  process.exit(2);
}
mkdirSync(work, { recursive: true });

const SLUGS = [
  'matterhorn-from-zermatt',
  'gornerschlucht-waterfall',
  'matterhorn-glacier-trail',
  'riffelsee-reflection',
];
const COMPARED = [
  'status',
  'title',
  'headSha256',
  'ogImage',
  'ogStatus',
  'ogContentType',
  'ogSha256',
  'mainSha256',
  'htmlSha256',
];

const base = JSON.parse(readFileSync(basePath, 'utf8'));

const mutate = (v) => (v === null ? 'x' : typeof v === 'number' ? v + 1 : `${v}x`);

function run(file) {
  const child = spawnSync(process.execPath, [script, origin, file], { encoding: 'utf8' });
  const lines = (child.stdout ?? '').trim().split('\n');
  const result = lines[lines.length - 1] ?? '';
  const differing = result.startsWith('v20-identity: ')
    ? (result.match(/\bdiffering=(\d+)/)?.[1] ?? '?')
    : '?';
  return { exit: child.status, differing, stdout: child.stdout ?? '' };
}

const selfRun = run(basePath);
console.log(`self       (unchanged base)                          exit=${selfRun.exit} differing=${selfRun.differing}`);

let mutants = 0;
let caught = 0;
for (const slug of SLUGS) {
  for (const key of COMPARED) {
    mutants += 1;
    const copy = structuredClone(base);
    copy[slug][key] = mutate(copy[slug][key]);
    const file = join(work, `mutant-${slug}-${key}.json`);
    writeFileSync(file, JSON.stringify(copy, null, 2) + '\n');
    const r = run(file);
    const named = r.stdout.includes(`DIFF ${slug}.${key}:`);
    const ok = r.exit === 1 && r.differing === '1' && named;
    if (ok) caught += 1;
    console.log(
      `mutant     ${`${slug}.${key}`.padEnd(42)} exit=${r.exit} differing=${r.differing} named=${named ? 'yes' : 'no'} ${ok ? 'caught' : 'MISSED'}`
    );
  }
}

const uncompared = structuredClone(base);
uncompared[SLUGS[0]].ldJsonRemoved = mutate(uncompared[SLUGS[0]].ldJsonRemoved);
const uFile = join(work, 'uncompared-ldJsonRemoved.json');
writeFileSync(uFile, JSON.stringify(uncompared, null, 2) + '\n');
const uRun = run(uFile);
console.log(
  `uncompared ${`${SLUGS[0]}.ldJsonRemoved`.padEnd(42)} exit=${uRun.exit} differing=${uRun.differing}`
);

console.log(
  `v20-control: mutants=${mutants} caught=${caught} uncompared-exit=${uRun.exit} self-exit=${selfRun.exit}`
);
```

## v2.0 identity (after 17-05)

On this tree (HEAD 940c245) the build was `rm -rf .next/static && npm run build` (then `git restore public/service-worker.js`) and the server `node node_modules/next/dist/bin/next start -p 3017`. The command was `node <scratchpad>/v20-identity.mjs http://localhost:3017 <scratchpad>/v20-base.json`. Complete stdout:

```text
v20-identity: exit=0 differing=0 compared=36 removed=0,0,0,0 base=51b7f4d9b291 head=940c24590747
```

Exit code: 0.

| Field | matterhorn-from-zermatt | gornerschlucht-waterfall | matterhorn-glacier-trail | riffelsee-reflection |
|---|---|---|---|---|
| status | identical | identical | identical | identical |
| title | identical | identical | identical | identical |
| headSha256 | identical | identical | identical | identical |
| ogImage | identical | identical | identical | identical |
| ogStatus | identical | identical | identical | identical |
| ogContentType | identical | identical | identical | identical |
| ogSha256 | identical | identical | identical | identical |
| mainSha256 | identical | identical | identical | identical |
| htmlSha256 | identical | identical | identical | identical |
| ldJsonRemoved (recorded, not compared) | 0 | 0 | 0 | 0 |

The ld+json strip pattern matches real output: on this build each photo page's whole HTML holds one `<script type="application/ld+json">` block, the site graph from `app/(site)/layout.tsx`. It sits outside `<main>`, so `removed` stays 0 until 17-13 adds the ImageObject block inside `<main>`.

## New photo pages (production build, 940c245)

| Slug | Page | og:image | og:image path |
|---|---|---|---|
| castle-below-limestone-peaks | 200 | 200 image/png | /photos/castle-below-limestone-peaks/opengraph-image-126xvw/card?1bf973d7cc2e42c4 |
| saalfelden-valley-from-the-air | 200 | 200 image/png | /photos/saalfelden-valley-from-the-air/opengraph-image-126xvw/card?1bf973d7cc2e42c4 |
| mirrored-snow-peaks | 200 | 200 image/png | /photos/mirrored-snow-peaks/opengraph-image-126xvw/card?1bf973d7cc2e42c4 |
| butterfly-on-a-thistle | 200 | 200 image/png | /photos/butterfly-on-a-thistle/opengraph-image-126xvw/card?1bf973d7cc2e42c4 |
| meadow-stream-below-the-peaks | 200 | 200 image/png | /photos/meadow-stream-below-the-peaks/opengraph-image-126xvw/card?1bf973d7cc2e42c4 |
| forested-valley-below-the-peaks | 200 | 200 image/png | /photos/forested-valley-below-the-peaks/opengraph-image-126xvw/card?1bf973d7cc2e42c4 |
| matterhorn-wrapped-in-cloud | 200 | 200 image/png | /photos/matterhorn-wrapped-in-cloud/opengraph-image-126xvw/card?1bf973d7cc2e42c4 |

`/photos/no-such-photo` and `/photos/Matterhorn-From-Zermatt` answer 404. The two aerial pages print the approved descriptions (U+00A0 after "ground" and before "m", from `altitudeLabel`):

- `Saalfelden valley from the air: an aerial photograph by Tim Lui over Saalfelden, ground 820 m approx., Sep 2026.`
- `Castle below limestone peaks: an aerial photograph by Tim Lui over Saalfelden, ground 880 m approx., Sep 2026.`

## Client JS

`rm -rf .next/static && npm run build` on 940c245: **1,851,685 B in 24 files**. That equals the phase base measured in 17-RESEARCH; the cap is 1,855,781 B. A grep of `.next/static/chunks` for `castle-below-limestone-peaks`, `Castle below limestone peaks`, `Steinernen`, `saalfelden-valley-from-the-air`, `meadow-stream-below-the-peaks` and `mirrored-snow-peaks` found no file.

## Task Commits

1. **Task 1: Measure the v2.0 four on the phase base, then move the route set to the published photos**
   - `f370570` (test, RED): published route set, light-table-first lookup, injected-photo publication
   - `0a640da` (feat, GREEN): publishedViews/publishedSlugs/viewerPhotos, photoRouteSlugs over editorial, both photo routes
   - `274b8e9` (refactor): dropped the RED-only `?? []` fallback from the published-view test
2. **Task 2: The approved aerial description, published-set unit tests, and the production checks**
   - `1930b9d` (test, RED): aerial description pins, published-set and viewer-set rows, OG route cases over publishedViews
   - `940c245` (feat, GREEN): the `view.aerial` branch in photoMetadata

## TDD Gate Compliance

- **Task 1 RED (`f370570`):** `npx jest lib/__tests__/photo-routes.test.ts lib/__tests__/region-series.test.ts` exited 1 with 4 failed and 55 passed. All four failures were assertions on the planned behaviour:
  - the proxy/static-params equality threw its designed "Admitted without a page" error;
  - "is the published set" got 4 of the expected 11 slugs;
  - "every other published photo" got length 0 where 7 was expected;
  - the injected-photo row's `photoRouteSlugs` held only the four.

  There were no load, import or syntax errors: next/jest uses SWC, so a missing export is simply `undefined`. The Jest default reporter is not one of the `tdd-red-evidence` classifier formats, so I did not run the classifier. Judging the RED valid rests on reading the output (saved to the git-ignored `.gsd/tdd-evidence/17-05/red-t1.txt`).
- **Task 1 GREEN (`0a640da`):** the five verify suites passed 177/177.
- **Task 2 RED (`1930b9d`):** `npx jest lib/__tests__/photos-view-model.test.ts lib/og/__tests__/routes.test.ts` exited 1 with 2 failed and 89 passed. Both failures were the aerial-description rows. Expected `…: an aerial photograph by Tim Lui over Saalfelden, ground 820 m approx., Sep 2026.`; received the v2.0 template, `…: a photograph by Tim Lui from Saalfelden at ground 820 m approx., Sep 2026.` The published-set, viewer-set and OG rows already passed, because Task 1 had implemented their behaviour. They extend coverage and are not RED targets (`red-t2.txt`).
- **Task 2 GREEN (`940c245`):** 153/153 across the three Task 2 suites.

## Files Created/Modified

- `lib/photos/view-model.ts`: `publishedViews`, `publishedSlugs`, `viewerPhotos`, light-table-first `photoBySlug`, aerial branch in `photoMetadata`; doc lines for `photoViews`, `photoSlugs` and `lightTableInput` updated
- `lib/photos/routes.ts`: `photoRouteSlugs` over every editorial slug, still `/* @__PURE__ */`; no light-table import; doc block rewritten
- `app/(site)/photos/[slug]/page.tsx`: static params over `publishedSlugs`, `photos={viewerPhotos(view)}`
- `app/(site)/photos/@modal/(.)[slug]/page.tsx`: `photos={viewerPhotos(view)}`
- `lib/__tests__/photo-routes.test.ts`: published route set pins, reserved-segment row, photoBySlug rows
- `lib/__tests__/region-series.test.ts`: the injected img-9001 (with editorial and manifest copies) stays off the light table but is published
- `lib/__tests__/photos-view-model.test.ts`: published-set, order, viewer-set and aerial description rows
- `lib/og/__tests__/routes.test.ts`: all photo cases over `publishedSlugs` / `publishedViews`

## Decisions Made

- The aerial branch keys on `view.aerial`, so a future aerial photo gets the approved wording automatically. The literal pin in `photos-view-model.test.ts` holds the two shipped strings exactly as Tim approved them.
- `photoRouteSlugs` keeps editorial order, not canonical order. The proxy only needs the set, and the test compares sets.
- I added a row asserting no published slug equals the proxy's neutral slug `_` or the `regions` segment (17-RESEARCH Pattern 3 "none equal to a reserved word").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The stripped-HTML hash picked up the per-request CSP nonce on `<link>` elements**
- **Found during:** Task 1, Step 0. The first self-comparison against the base server failed `htmlSha256` on all four slugs.
- **Issue:** Next puts the request's nonce on `<link rel="stylesheet">` and `<link rel="preload">` as well as on scripts. Stripping `<script>` elements and `/_next/static` URLs (the plan's rule, from the spike's wording) left the nonce in, so two captures of one build differed.
- **Fix:** `htmlSha256` also replaces every `nonce="…"` value with one fixed token. I fixed the script, never the base. I then recaptured, ran three self-comparisons (all exit 0) and ran the control (36/36).
- **Files modified:** `<scratchpad>/v20-identity.mjs` only (not committed; the source is in this SUMMARY)
- **Verification:** self-exit 0 three times; control `mutants=36 caught=36 uncompared-exit=0 self-exit=0`.

**2. [Rule 3 - Blocking] The injected-photo test needed editorial and manifest mocks**
- **Found during:** Task 1 RED.
- **Issue:** The plan wants img-9001 in `photoRouteSlugs`. That set is every editorial slug, so a photo with no editorial entry can never be in it. Also, `publishedViews` builds every generated photo at load, which throws for a photo with no manifest entry.
- **Fix:** The test also mocks `@/data/photos/editorial` (a copy of img-0605's entry with slug `injected-zermatt-photo`) and `@/data/generated/image-manifest` (img-0605's variants). It asserts that slug is in both `photoRouteSlugs` and `publishedSlugs`, and stays off `buildPhotoViews()` and `photoSlugs`.
- **Files modified:** `lib/__tests__/region-series.test.ts`
- **Committed in:** `f370570`

---

**Total deviations:** 2 auto-fixed (1 bug in the scratchpad script, 1 blocking test fixture). **Impact on plan:** none on scope. The identity rule is now precise about what it treats as per-request noise.

## Issues Encountered

- `git worktree remove --force` could not delete the base worktree's `node_modules`: "Filename too long" under the scratchpad path. The worktree was already unregistered. `rm -rf` removed the directory and `git worktree prune` cleaned up.

## Verification

- Jest: the Task 1 verify suites (photo-routes, region-series, photos-view-model, proxy, client-graph) passed 177/177. The Task 2 suites passed 153/153. The full suite passed: 117 suites, 2,143 tests.
- `npm run type-check` (three configs) and `npm run lint` (including the served-images and test-count scans) exit 0.
- `git diff --quiet 285b6d5 -- "app/(site)/photos/[slug]/opengraph-image.tsx"` exits 0.
- `PW_PROD=1 npx playwright test e2e/audit.spec.ts e2e/photos-region.spec.ts e2e/photos-lightbox.spec.ts -g "(/photos/regions/zermatt: axe|photos-region|photos-lightbox)" --project=chromium --project=firefox`: **137 passed**, 0 failed, 0 flaky. This includes `/photos/regions/zermatt: axe, CLS, links, images, CSP, console` in both engines. `public/service-worker.js` was restored afterwards.
- `node scripts/ci/check-snapshot-commit.mjs --none` passed on every commit; no PNG was staged.
- Acceptance greps: `publishedViews` in view-model.ts 5; `viewerPhotos` in `[slug]/page.tsx` 3; `^import .*lightTableIds` in routes.ts 0; `@__PURE__` in routes.ts 1.
- No server was left running on :3000 or :3017.

## Known Stubs

None.

## Threat Flags

None. The new public surface is the seven photo URLs, which T-17-13 accepted. T-17-11 is mitigated by the photo-routes equality test, and T-17-12 by the unchanged card file plus the identity compare and its control run.

## User Setup Required

None.

## Next Phase Readiness

- 17-06 (PhotoViewer D-08/D-09) reads `viewerPhotos` and reruns the identity compare from this SUMMARY. 17-07, 17-12, 17-13 and 17-15 rerun it too.
- Consumers still on the light table, owned by later plans: `app/sitemap.ts` and the `/offline` catalog (`photoSlugs` / `photoViews`), plus the `e2e/seo.spec.ts`, `e2e/og.spec.ts` and `lib/__tests__/audit-routes.test.ts` route lists. 17-RESEARCH Pattern 3 lists them as route-set consumers to move to the published set (17-10 / 17-11).
- New photo pages render the four-photo viewer chrome around a one-photo set (counter "1 / 1", step buttons present but inert) until 17-06 hides stepping for a set under two.

## Self-Check: PASSED

All eight modified files exist. Commits f370570, 0a640da, 274b8e9, 1930b9d and 940c245 are ancestors of HEAD. The TDD gate commits are present: test(17-05) f370570 and 1930b9d, each followed by feat(17-05) 0a640da and 940c245.

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-23*
