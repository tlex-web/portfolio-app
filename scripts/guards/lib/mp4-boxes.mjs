/**
 * MP4 box walker (D-27): the served-asset guard and `clip:derive` check a clip
 * by walking its ISO-BMFF boxes. Verify the artifact, not the script's flags: a
 * phone recording carries its creation time, its location (`©xyz`, `loci`) and
 * device tags, and only the bytes that ship say whether any of it survived.
 *
 * Pure on purpose (no imports): scripts/guards/check-served-images.mjs and
 * scripts/media/build-clip.mjs share it, and the selftest calls it directly.
 * Rules match 11-RESEARCH "C. Guard extension for video" and were checked against
 * ffmpeg 9.0.1 output (scripts/guards/__selftest__/served-images/*-mp4/).
 */

/** Boxes whose payload is a list of child boxes. */
const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'udta', 'edts', 'dinf']);

/** Box types that only carry metadata a served clip must not have. */
const FORBIDDEN = new Set(['uuid', 'XMP_', '©xyz', 'loci', '!bad']);

/** Allowed children per parent ('' is the top level): the box-tree whitelist. */
const ALLOWED_CHILDREN = {
  '': ['ftyp', 'moov', 'free', 'mdat'],
  moov: ['mvhd', 'trak', 'udta'],
  udta: ['meta'],
  meta: ['hdlr', 'ilst'],
};

/**
 * Flat, depth-first list of boxes: { type, offset, size, header, depth, parent }.
 * A size that runs past its parent ends the walk with a '!bad' entry.
 */
export function boxes(buf, start = 0, end = buf.length, depth = 0, out = [], parent = '') {
  let o = start;
  while (o + 8 <= end) {
    let size = buf.readUInt32BE(o);
    const type = buf.toString('latin1', o + 4, o + 8);
    let header = 8;
    if (size === 1) {
      if (o + 16 > end) {
        out.push({ type: '!bad', offset: o, size: 0, header: 0, depth, parent });
        break;
      }
      size = Number(buf.readBigUInt64BE(o + 8));
      header = 16;
    } else if (size === 0) {
      size = end - o;
    }
    if (size < header || o + size > end) {
      out.push({ type: '!bad', offset: o, size: 0, header: 0, depth, parent });
      break;
    }
    out.push({ type, offset: o, size, header, depth, parent });
    if (CONTAINERS.has(type)) boxes(buf, o + header, o + size, depth + 1, out, type);
    // `meta` is a FullBox: skip its version and flags before the children.
    if (type === 'meta') boxes(buf, o + header + 4, o + size, depth + 1, out, type);
    o += size;
  }
  return out;
}

/** Version-aware [creation, modification] times of an mvhd, tkhd or mdhd box. */
function times(buf, b) {
  const p = b.offset + b.header;
  if (buf[p] === 1) return [buf.readBigUInt64BE(p + 4), buf.readBigUInt64BE(p + 12)];
  return [BigInt(buf.readUInt32BE(p + 4)), BigInt(buf.readUInt32BE(p + 8))];
}

/** Handler type of every track (`hdlr` directly inside `mdia`), e.g. ['vide']. */
function trackHandlers(buf, all) {
  return all
    .filter((b) => b.type === 'hdlr' && b.parent === 'mdia')
    .map((b) => buf.toString('latin1', b.offset + b.header + 8, b.offset + b.header + 12));
}

/**
 * Violations for a served MP4 (empty when clean): box order, forbidden or
 * unexpected boxes, metadata items, non-zero timestamps, anything but exactly
 * one video track, and the byte budget when `maxBytes` is given.
 */
export function checkMp4(buf, { maxBytes } = {}) {
  const v = [];
  const all = boxes(buf);
  const top = all.filter((b) => b.depth === 0).map((b) => b.type);
  const moov = top.indexOf('moov');
  const mdat = top.indexOf('mdat');
  if (moov === -1 || (mdat !== -1 && moov > mdat)) v.push('moov must precede mdat (+faststart)');
  for (const b of all) {
    if (FORBIDDEN.has(b.type)) {
      v.push(`forbidden box ${b.type}`);
      continue;
    }
    const allowed = ALLOWED_CHILDREN[b.parent];
    if (allowed && !allowed.includes(b.type)) v.push(`unexpected box ${b.type} in ${b.parent || 'top level'}`);
    if (b.type === 'ilst' && b.size > b.header) v.push('metadata items in ilst');
    if (b.type === 'mvhd' || b.type === 'tkhd' || b.type === 'mdhd') {
      const [ct, mt] = times(buf, b);
      if (ct !== 0n || mt !== 0n) v.push(`${b.type} timestamps not zero`);
    }
  }
  const handlers = trackHandlers(buf, all);
  if (handlers.length !== 1 || handlers[0] !== 'vide') {
    v.push(`tracks: ${handlers.join(',') || 'none'} (need exactly one video track, no audio)`);
  }
  if (maxBytes && buf.length > maxBytes) v.push(`size ${buf.length} B over ${maxBytes} B`);
  return v;
}

/**
 * Duration (seconds, from mvhd) and display size (pixels, from the video
 * track's tkhd) of an MP4; null fields when the boxes are missing.
 */
export function mp4Info(buf) {
  const all = boxes(buf);
  let durationS = null;
  const mvhd = all.find((b) => b.type === 'mvhd' && b.parent === 'moov');
  if (mvhd) {
    const p = mvhd.offset + mvhd.header;
    const v1 = buf[p] === 1;
    const timescale = buf.readUInt32BE(p + (v1 ? 20 : 12));
    const duration = v1 ? Number(buf.readBigUInt64BE(p + 24)) : buf.readUInt32BE(p + 16);
    if (timescale > 0) durationS = duration / timescale;
  }
  let width = null;
  let height = null;
  for (const trak of all.filter((b) => b.type === 'trak')) {
    const inside = (b) => b.offset > trak.offset && b.offset < trak.offset + trak.size;
    const hdlr = all.find((b) => b.type === 'hdlr' && b.parent === 'mdia' && inside(b));
    const tkhd = all.find((b) => b.type === 'tkhd' && inside(b));
    if (!hdlr || !tkhd) continue;
    if (buf.toString('latin1', hdlr.offset + hdlr.header + 8, hdlr.offset + hdlr.header + 12) !== 'vide') continue;
    const p = tkhd.offset + tkhd.header;
    const w = p + (buf[p] === 1 ? 88 : 76);
    width = buf.readUInt32BE(w) >>> 16;
    height = buf.readUInt32BE(w + 4) >>> 16;
    break;
  }
  return { durationS, width, height };
}
