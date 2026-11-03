#!/usr/bin/env node

/**
 * Trail geometry fetch (ENG-01, D-05, D-07): swisstopo hiking-trail network ->
 * the committed data/terrain/source/trails.json.
 *
 * MANUAL AND NETWORKED. Never run it in prebuild, lint or CI (T-08-09): CI and
 * Vercel re-derive the trail profiles offline from what this writes, with
 * `npm run trails:build -- --check`.
 *
 * geo.admin.ch capabilities used (.planning/phases/11-engineering-roadmap/COVERAGE.md):
 *   - SearchServer location search (type=locations, sr=2056): named places -> LV95.
 *   - MapServer identify on ch.swisstopo.swisstlm3d-wanderwege (envelope query):
 *     the official Wanderwege LineStrings with their feature ids.
 *   Nothing else: heights come from the committed DEM (08 D-17), never a live
 *   height or profile service.
 *
 * Steps:
 *   1. Resolve each trail's start, via points and end to LV95 with the
 *      SearchServer (first result whose label contains the spec's `pick`; fail
 *      when none does).
 *   2. Identify every Wanderwege LineString in the envelope of those points
 *      plus a 300 m margin, paging with `offset` until a page comes back short.
 *   3. Build a graph from the LineString vertices: endpoints within 1 m are one
 *      node, and an interior vertex within 1 m of an endpoint joins it (a trail
 *      junction); every other vertex is its own node.
 *   4. Snap each named point to its nearest node and route start -> via... ->
 *      end with Dijkstra on segment length.
 *   5. Round the vertices to 0.1 m, drop repeats, reject any vertex outside the
 *      source.json extent, hash `JSON.stringify(polyline)` (polylineSha256).
 *   6. Print each routed length beside the listing's length; exit 1 when one
 *      differs by more than 10 percent (nothing is written then).
 *   7. Parse `{ trails }` with TrailsFile and write trails.json (2-space JSON,
 *      trailing newline).
 *
 * Usage: npm run trails:fetch   (no flags)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TerrainSource } from '../../data/schemas/terrain.ts';
import { TrailsFile } from '../../data/schemas/trail.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE_DIR = path.join(ROOT, 'data', 'terrain', 'source');
const OUT_FILE = path.join(SOURCE_DIR, 'trails.json');
const NAME = 'trails:fetch';

const API = 'https://api3.geo.admin.ch/rest/services/api';
const LAYER = 'ch.swisstopo.swisstlm3d-wanderwege';
const MARGIN_M = 300;
const PAGE = 200;
const MAX_PAGES = 50;
const JOIN_M = 1;
const MAX_LENGTH_DEVIATION = 0.1;

/**
 * The two profile trails (D-07, decided in 11-CONTEXT and packet §A). Names are
 * NFC. Listing URLs, grades and official lengths are from the zermatt.swiss
 * listings (the source of record). `search` is the SearchServer text and `pick`
 * a substring of the wanted result's label.
 *
 * Point choices (checked once against each listing's own "GPS-track (GPX)"
 * download, which is not fetched here):
 *   - Hörnliweg starts at the Schwarzsee lift station, where the listing's track
 *     starts (routed 4,316 m; the hotel 150 m away routes 4,220 m and leaves the
 *     track by 71 m).
 *   - Zmutt path: the directions read "Zermatt train station - Zen Stecken -
 *     Zmutt", so the route is forced through Zen Stecken. The listing's 4.3 km
 *     track runs on through the hamlet to its western edge; ending at the
 *     gazetteer's "Zmutt" point (the hamlet centre) routes only 3,614 m (-16 %),
 *     so the end is the hamlet's western address, Zmutt 56.
 */
const TRAIL_SPECS = [
  {
    id: 'hoernliweg-27',
    name: 'Hörnliweg',
    number: 27,
    listingUrl: 'https://zermatt.swiss/en/p/hoernliweg-no-27-01tVj000005EwSkIAK',
    sacGrade: 'T4',
    officialLengthM: 4300,
    start: {
      name: 'Schwarzsee',
      search: 'Schwarzsee Zermatt',
      pick: 'Other transport Zermatt Schwarzsee (VS) - Zermatt',
    },
    via: [],
    end: { name: 'Hörnlihütte', search: 'Hörnlihütte', pick: 'Hörnlihütte (VS) - Zermatt' },
  },
  {
    id: 'zmutt-2',
    name: 'Zmutt path',
    number: 2,
    listingUrl: 'https://zermatt.swiss/en/p/zmuttweg-no-2-01tVj00000H69zjIAB',
    sacGrade: 'T1',
    officialLengthM: 4300,
    start: {
      name: 'Zermatt',
      search: 'Bahnhofplatz 1 Zermatt',
      pick: 'Bahnhofplatz 1 3920 Zermatt',
    },
    via: [{ name: 'Zen Stecken', search: 'Zen Stecken', pick: 'Part of a ward Zen Stecken' }],
    end: { name: 'Zmutt', search: 'Zmutt 56', pick: 'Zmutt 56 3920 Zermatt' },
  },
];

function fail(msg) {
  throw new Error(msg);
}

const round1 = (v) => Math.round(v * 10) / 10;
const stripTags = (s) => s.replace(/<[^>]+>/g, '');

/** Step 1: one named place -> LV95 via the SearchServer. */
async function locate({ name, search, pick }) {
  const url = new URL(`${API}/SearchServer`);
  url.search = new URLSearchParams({
    searchText: search,
    type: 'locations',
    sr: '2056',
    limit: '20',
  });
  const res = await fetch(url);
  if (!res.ok) fail(`SearchServer ${res.status} for "${search}"`);
  const body = await res.json();
  const hit = (body.results ?? []).find((r) => stripTags(r.attrs?.label ?? '').includes(pick));
  if (!hit) fail(`SearchServer: no result for "${search}" whose label contains "${pick}"`);
  // With sr=2056 the SearchServer returns y = easting and x = northing (Swiss convention).
  const e = Number(hit.attrs.y);
  const n = Number(hit.attrs.x);
  if (!Number.isFinite(e) || !Number.isFinite(n))
    fail(`SearchServer: no coordinates for "${search}"`);
  console.log(`${NAME}: ${name} <- "${stripTags(hit.attrs.label)}" E ${round1(e)} N ${round1(n)}`);
  return { name: name.normalize('NFC'), lv95: { e: round1(e), n: round1(n) } };
}

/** Step 2: every Wanderwege LineString in the envelope, paged. */
async function identify(env) {
  const byId = new Map();
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`${API}/MapServer/identify`);
    url.search = new URLSearchParams({
      geometryType: 'esriGeometryEnvelope',
      geometry: [env.west, env.south, env.east, env.north].join(','),
      layers: `all:${LAYER}`,
      sr: '2056',
      tolerance: '0',
      returnGeometry: 'true',
      geometryFormat: 'geojson',
      limit: String(PAGE),
      offset: String(page * PAGE),
    });
    const res = await fetch(url);
    if (!res.ok) fail(`identify ${res.status} at offset ${page * PAGE}`);
    const results = (await res.json()).results ?? [];
    for (const f of results) {
      if (f.layerBodId !== LAYER) fail(`identify: unexpected layer ${f.layerBodId}`);
      const g = f.geometry;
      const parts =
        g?.type === 'LineString'
          ? [g.coordinates]
          : g?.type === 'MultiLineString'
            ? g.coordinates
            : [];
      if (parts.length === 0) fail(`identify: feature ${f.featureId} has no line geometry`);
      byId.set(String(f.featureId), parts);
    }
    if (results.length < PAGE) return byId;
  }
  fail(`identify: more than ${MAX_PAGES * PAGE} features in the envelope`);
}

/** Step 3: graph nodes and weighted edges. */
function buildGraph(features) {
  const nodes = []; // [e, n]
  const adj = []; // [{ to, w, fid }]
  const endpointCells = new Map(); // "cx,cy" -> node indices of endpoint nodes
  const cellKey = (e, n) => `${Math.floor(e / JOIN_M)},${Math.floor(n / JOIN_M)}`;
  const nearEndpoint = (e, n) => {
    const cx = Math.floor(e / JOIN_M);
    const cy = Math.floor(n / JOIN_M);
    let best = -1;
    let bestD = JOIN_M;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const i of endpointCells.get(`${cx + dx},${cy + dy}`) ?? []) {
          const d = Math.hypot(nodes[i][0] - e, nodes[i][1] - n);
          if (d <= bestD) {
            bestD = d;
            best = i;
          }
        }
      }
    }
    return best;
  };
  const addNode = (e, n) => {
    nodes.push([e, n]);
    adj.push([]);
    return nodes.length - 1;
  };
  // Endpoints first, so interior vertices can join them.
  const ids = [...features.keys()].sort((a, b) => Number(a) - Number(b));
  for (const fid of ids) {
    for (const part of features.get(fid)) {
      for (const [e, n] of [part[0], part[part.length - 1]]) {
        if (nearEndpoint(e, n) === -1) {
          const i = addNode(e, n);
          const k = cellKey(e, n);
          endpointCells.set(k, [...(endpointCells.get(k) ?? []), i]);
        }
      }
    }
  }
  for (const fid of ids) {
    for (const part of features.get(fid)) {
      let prev = -1;
      part.forEach(([e, n], k) => {
        const isEnd = k === 0 || k === part.length - 1;
        let i = nearEndpoint(e, n);
        if (i === -1) {
          if (isEnd) fail(`graph: endpoint of ${fid} lost`);
          i = addNode(e, n);
        }
        if (prev !== -1 && prev !== i) {
          const w = Math.hypot(nodes[i][0] - nodes[prev][0], nodes[i][1] - nodes[prev][1]);
          adj[prev].push({ to: i, w, fid });
          adj[i].push({ to: prev, w, fid });
        }
        prev = i;
      });
    }
  }
  return { nodes, adj };
}

function nearestNode(nodes, p) {
  let best = -1;
  let bestD = Infinity;
  nodes.forEach(([e, n], i) => {
    const d = Math.hypot(e - p.e, n - p.n);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return { node: best, distM: bestD };
}

/** Step 4: Dijkstra on segment length; returns node and feature id sequences. */
function shortestPath({ nodes, adj }, from, to) {
  const dist = new Float64Array(nodes.length).fill(Infinity);
  const prev = new Int32Array(nodes.length).fill(-1);
  const prevFid = new Array(nodes.length).fill(null);
  const heap = [[0, from]];
  dist[from] = 0;
  const push = (item) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  while (heap.length > 0) {
    const [d, u] = pop();
    if (d > dist[u]) continue;
    if (u === to) break;
    for (const { to: v, w, fid } of adj[u]) {
      if (d + w < dist[v]) {
        dist[v] = d + w;
        prev[v] = u;
        prevFid[v] = fid;
        push([dist[v], v]);
      }
    }
  }
  if (!Number.isFinite(dist[to])) fail('routing: no path between two route points');
  const seq = [];
  const fids = [];
  for (let v = to; v !== -1; v = prev[v]) {
    seq.push(v);
    if (prevFid[v] !== null) fids.push(prevFid[v]);
  }
  return { seq: seq.reverse(), fids: fids.reverse() };
}

function lineLength(pl) {
  let L = 0;
  for (let i = 1; i < pl.length; i++)
    L += Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]);
  return L;
}

async function fetchTrail(spec, extent, fetchedAt) {
  const start = await locate(spec.start);
  const via = [];
  for (const v of spec.via) via.push(await locate(v));
  const end = await locate(spec.end);
  const stops = [start, ...via, end];
  const env = {
    west: Math.floor(Math.min(...stops.map((s) => s.lv95.e)) - MARGIN_M),
    south: Math.floor(Math.min(...stops.map((s) => s.lv95.n)) - MARGIN_M),
    east: Math.ceil(Math.max(...stops.map((s) => s.lv95.e)) + MARGIN_M),
    north: Math.ceil(Math.max(...stops.map((s) => s.lv95.n)) + MARGIN_M),
  };
  const features = await identify(env);
  const graph = buildGraph(features);
  console.log(
    `${NAME}: ${spec.id}: ${features.size} Wanderwege features, ${graph.nodes.length} nodes`
  );

  const snapped = stops.map((s) => {
    const hit = nearestNode(graph.nodes, s.lv95);
    console.log(`${NAME}: ${spec.id}: ${s.name} snaps to the trail ${hit.distM.toFixed(1)} m away`);
    return hit.node;
  });
  const seq = [snapped[0]];
  const fids = [];
  for (let i = 1; i < snapped.length; i++) {
    const leg = shortestPath(graph, snapped[i - 1], snapped[i]);
    seq.push(...leg.seq.slice(1));
    fids.push(...leg.fids);
  }

  // Step 5: 0.1 m vertices, no repeats, inside the sheet.
  const polyline = [];
  for (const i of seq) {
    const v = [round1(graph.nodes[i][0]), round1(graph.nodes[i][1])];
    const last = polyline[polyline.length - 1];
    if (!last || last[0] !== v[0] || last[1] !== v[1]) polyline.push(v);
  }
  const outside = polyline.find(
    ([e, n]) => e < extent.west || e > extent.east || n < extent.south || n > extent.north
  );
  if (outside) fail(`${spec.id}: vertex ${outside.join(', ')} lies outside the source.json extent`);
  const featureIds = [...new Set(fids)];
  const polylineSha256 = crypto.createHash('sha256').update(JSON.stringify(polyline)).digest('hex');

  return {
    id: spec.id,
    name: spec.name.normalize('NFC'),
    number: spec.number,
    listingUrl: spec.listingUrl,
    sacGrade: spec.sacGrade,
    officialLengthM: spec.officialLengthM,
    start,
    end,
    via: via.map((v) => v.lv95),
    polyline,
    provenance: { layer: LAYER, featureIds, fetchedAt },
    polylineSha256,
  };
}

async function main() {
  // Parsed like build-trails does, so a malformed extent is a schema error (11 IN-10).
  const source = TerrainSource.parse(
    JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'source.json'), 'utf8'))
  );
  const fetchedAt = new Date().toISOString();
  const trails = [];
  for (const spec of TRAIL_SPECS) trails.push(await fetchTrail(spec, source.extent, fetchedAt));

  // Step 6: routed length beside the listing's length.
  let bad = 0;
  for (const t of trails) {
    const L = lineLength(t.polyline);
    const off = (L - t.officialLengthM) / t.officialLengthM;
    const ok = Math.abs(off) <= MAX_LENGTH_DEVIATION;
    if (!ok) bad++;
    console.log(
      `${NAME}: ${t.id}: routed ${Math.round(L)} m, official ${t.officialLengthM} m (${(off * 100).toFixed(1)} %)${ok ? '' : ' -- more than 10 %'}`
    );
  }
  if (bad > 0)
    fail(`${bad} trail(s) differ from the official length by more than 10 %; nothing written`);

  // Step 7: parse before write.
  const file = TrailsFile.parse({ trails });
  // 2-space JSON with one `[e, n]` vertex per line (a vertex over four lines
  // would quadruple the file for no reader's benefit).
  const json = JSON.stringify(file, null, 2).replace(
    /\[\n\s+(-?[\d.]+),\n\s+(-?[\d.]+)\n\s+\]/g,
    '[$1, $2]'
  );
  if (JSON.stringify(JSON.parse(json)) !== JSON.stringify(file))
    fail('formatting changed the data');
  fs.writeFileSync(OUT_FILE, `${json}\n`);
  console.log(`${NAME}: wrote ${path.relative(ROOT, OUT_FILE).split(path.sep).join('/')}`);
}

main().catch((e) => {
  console.error(`${NAME}: ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
