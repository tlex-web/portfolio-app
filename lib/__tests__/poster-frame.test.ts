/**
 * HOME-02 (D-16; 09-UI-SPEC "Stage: Poster, Sheet Box and Canvas", "Why 0.64"
 * and UI Considerations E1 populated): the one poster-frame rule shared by the
 * poster CSS and the 3D camera at scroll 0.
 *
 * The visible UV window must contain every photo anchor at the three baseline
 * stage sizes (375 x 603, 768 x 960, 1440 x 836) and the summit on landscape.
 */
import fs from 'node:fs';
import path from 'node:path';
import { POSTER_X_BIAS, posterFrame } from '@/lib/ascent/poster-frame';
import { photos } from '@/data/generated/photos';
import { terrain } from '@/data/generated/terrain';

const STAGES = [
  [375, 603],
  [768, 960],
  [1440, 836],
] as const;

const anchored = photos.filter((p) => p.uv !== null);

describe('posterFrame', () => {
  it('uses the 0.64 horizontal bias', () => {
    expect(POSTER_X_BIAS).toBe(0.64);
  });

  it('crops a portrait phone stage horizontally: 375 x 603', () => {
    const f = posterFrame(375, 603);
    expect(f.side).toBe(603);
    expect(f.uMin).toBeCloseTo(0.242, 3);
    expect(f.uMax).toBeCloseTo(0.864, 3);
    expect(f.vMin).toBeCloseTo(0, 3);
    expect(f.vMax).toBeCloseTo(1, 3);
  });

  it('crops a tablet stage horizontally: 768 x 960', () => {
    const f = posterFrame(768, 960);
    expect(f.uMin).toBeCloseTo(0.128, 3);
    expect(f.uMax).toBeCloseTo(0.928, 3);
  });

  it('crops a landscape stage vertically and centred: 1440 x 836', () => {
    const f = posterFrame(1440, 836);
    expect(f.side).toBe(1440);
    expect(f.left).toBeCloseTo(0, 6);
    expect(f.uMin).toBeCloseTo(0, 3);
    expect(f.uMax).toBeCloseTo(1, 3);
    expect(f.vMin).toBeCloseTo(0.21, 3);
    expect(f.vMax).toBeCloseTo(0.79, 3);
  });

  it('throws a RangeError for a non-positive size', () => {
    expect(() => posterFrame(0, 10)).toThrow(RangeError);
    expect(() => posterFrame(10, -1)).toThrow(RangeError);
  });

  it.each(STAGES)('keeps every photo anchor inside the window at %i x %i', (w, h) => {
    const f = posterFrame(w, h);
    expect(anchored.length).toBeGreaterThan(0);
    for (const p of anchored) {
      expect(p.uv.u).toBeGreaterThanOrEqual(f.uMin);
      expect(p.uv.u).toBeLessThanOrEqual(f.uMax);
      expect(p.uv.v).toBeGreaterThanOrEqual(f.vMin);
      expect(p.uv.v).toBeLessThanOrEqual(f.vMax);
    }
  });

  it('keeps the summit inside the window on the 1440 x 836 landscape stage', () => {
    const f = posterFrame(1440, 836);
    const { u, v } = terrain.summit.uv;
    expect(u).toBeGreaterThanOrEqual(f.uMin);
    expect(u).toBeLessThanOrEqual(f.uMax);
    expect(v).toBeGreaterThanOrEqual(f.vMin);
    expect(v).toBeLessThanOrEqual(f.vMax);
  });
});

describe('lib/ascent/poster-frame.ts source rules', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'lib/ascent/poster-frame.ts'), 'utf8');

  it('has no imports and no locale APIs', () => {
    expect(source).not.toMatch(/^import /m);
    expect(source).not.toMatch(/Intl|toLocale/);
  });
});
