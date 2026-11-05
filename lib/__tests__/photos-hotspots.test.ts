/**
 * Hotspot data and gutter stacking (LBOX-05; D-09; 10-UI-SPEC "Hotspots"; 08
 * IN-02). Every view carries its annotations in reading order (y, then x),
 * numbered from 1, with a glyph, a gutter side, an honest height from the
 * elevation reference and the fact sources as the strip prints them. The
 * gutter stacker is a pure function: centred on the marker, 8 px apart, 8 px
 * inside the stage, an expanded panel counting in the stack.
 */
import { imageManifest } from '@/data/generated/image-manifest';
import { photos } from '@/data/generated/photos';
import { editorial } from '@/data/photos/editorial';
import { gutterStack } from '@/lib/photos/hotspot-layout';
import { buildPhotoViews, photoViews, type PhotoViewInput } from '@/lib/photos/view-model';

/** formatMetres keeps the unit on its number with U+00A0. */
const NBSP = ' ';

const viewOf = (id: string, views = photoViews) => views.find((v) => v.id === id)!;
const committed: PhotoViewInput = { photos, editorial, imageManifest };

describe('hotspot view-model (D-09, IN-02)', () => {
  it('img-0662: the summit first, then the trail, numbered, with glyphs, sides and heights', () => {
    const { hotspots } = viewOf('img-0662');
    expect(hotspots.map((h) => [h.n, h.title, h.y, h.glyph, h.side, h.heightLabel])).toEqual([
      [1, 'Matterhorn summit', 18, 'peak', 'right', `4,478${NBSP}m`],
      [2, 'Matterhorn Glacier Trail', 92, 'dot', 'right', `2,585${NBSP}m`],
    ]);
    expect(hotspots[0].facts).toEqual([
      {
        text: "First climbed on 14 July 1865 by Edward Whymper's party, by the Hörnli ridge.",
        source: {
          kind: 'link',
          href: 'https://en.wikipedia.org/wiki/Matterhorn',
          label: 'Wikipedia',
        },
      },
    ]);
    expect(hotspots[1].facts).toEqual([
      {
        text: "Height from the swissALTIRegio terrain model at the camera's GPS position.",
        source: { kind: 'text', label: 'Source: swissALTIRegio terrain model' },
      },
    ]);
    expect(hotspots[0].description).toBe('The top of the mountain, above the cloud on its flanks.');
    expect(hotspots[0].id).toBe('summit-from-glacier-trail');
  });

  it('r004-011: reading order puts the summit before the lake, whose height says approx.', () => {
    const view = viewOf('r004-011');
    expect(view.hotspots.map((h) => [h.n, h.title, h.side])).toEqual([
      [1, 'Matterhorn summit', 'left'],
      [2, 'Riffelsee', 'left'],
    ]);
    const lake = view.hotspots[1];
    expect(lake.heightLabel).toBe(`2,760${NBSP}m approx.`);
    expect(lake.heightLabel).toBe(view.altitudeLabel);
    // The summit annotation has no facts: it expands to its description only (UI-SPEC E7 partial).
    expect(view.hotspots[0].facts).toEqual([]);
  });

  it("img-0629's third fact is plain text 'Source: Tim'; every Wikipedia fact is a 'Wikipedia' link", () => {
    expect(viewOf('img-0629').hotspots[0].facts[2].source).toEqual({
      kind: 'text',
      label: 'Source: Tim',
    });
    const sources = photoViews.flatMap((v) =>
      v.hotspots.flatMap((h) => h.facts.map((f) => f.source))
    );
    const wiki = sources.filter((s) => s.kind === 'link' && s.href.includes('wikipedia.org'));
    expect(wiki.length).toBeGreaterThan(0);
    for (const s of wiki) expect(s).toMatchObject({ kind: 'link', label: 'Wikipedia' });
  });

  it('carries every committed annotation exactly once, in its own photo', () => {
    for (const v of photoViews) {
      const ids = editorial[v.id as keyof typeof editorial].annotations.map((a) => a.id);
      expect(v.hotspots.map((h) => h.id).sort()).toEqual([...ids].sort());
      expect(v.hotspots.map((h) => h.n)).toEqual(v.hotspots.map((_, i) => i + 1));
    }
  });

  it('a photo with no annotations has no hotspots; equal y is ordered by the smaller x', () => {
    const base = editorial['img-0605'];
    const annotation = base.annotations[0];
    const fixture = (annotations: typeof base.annotations) =>
      viewOf(
        'img-0605',
        buildPhotoViews({
          ...committed,
          editorial: { ...editorial, 'img-0605': { ...base, annotations } },
        })
      );
    expect(fixture([]).hotspots).toEqual([]);
    const tied = fixture([
      { ...annotation, id: 'east', position: { x: 70, y: 40 } },
      { ...annotation, id: 'west', position: { x: 20, y: 40 } },
    ]).hotspots;
    expect(tied.map((h) => [h.id, h.n, h.side])).toEqual([
      ['west', 1, 'left'],
      ['east', 2, 'right'],
    ]);
  });

  it('an annotation without an elevation reference has no height, and exif facts name the camera', () => {
    const base = editorial['img-0605'];
    const view = viewOf(
      'img-0605',
      buildPhotoViews({
        ...committed,
        editorial: {
          ...editorial,
          'img-0605': {
            ...base,
            annotations: [
              {
                id: 'no-height',
                title: 'Larches',
                description: 'Trees.',
                position: { x: 10, y: 80 },
                icon: 'trail',
                details: { facts: [{ text: 'Shot at 105 mm.', source: 'exif' }] },
              },
            ],
          },
        },
      })
    );
    expect(view.hotspots[0].heightLabel).toBeNull();
    expect(view.hotspots[0].facts[0].source).toEqual({
      kind: 'text',
      label: 'Source: camera EXIF',
    });
  });

  it('never re-sorts the photos themselves', () => {
    expect(photoViews.map((v) => v.slug)).toEqual(buildPhotoViews().map((v) => v.slug));
  });
});

describe('gutterStack (D-09, UI-SPEC "Stacking")', () => {
  const label = (id: string, anchorY: number, side: 'left' | 'right' = 'right', height = 48) => ({
    id,
    side,
    anchorY,
    height,
  });

  it('centres a label on its marker and pushes the next one 8 px clear', () => {
    expect(gutterStack([label('a', 100), label('b', 110)], 600)).toEqual({
      a: { top: 76 },
      b: { top: 132 },
    });
  });

  it('counts an expanded panel in the stack: 76 + 48 + 8 + 120 + 8 = 260', () => {
    const tops = gutterStack([label('a', 100, 'right', 48 + 8 + 120), label('b', 110)], 600);
    expect(tops.a.top).toBe(76);
    expect(tops.b.top).toBe(260);
  });

  it('stacks each gutter on its own', () => {
    expect(gutterStack([label('l', 100, 'left'), label('r', 100, 'right')], 600)).toEqual({
      l: { top: 76 },
      r: { top: 76 },
    });
  });

  it('keeps labels 8 px inside the stage at the top and pushes them up from the bottom', () => {
    expect(gutterStack([label('top', 2)], 400).top.top).toBe(8);
    const tops = gutterStack([label('a', 390), label('b', 395)], 400);
    expect(tops.b.top).toBe(400 - 8 - 48);
    expect(tops.a.top).toBe(tops.b.top - 8 - 48);
  });

  it('ten labels in a 400 px stage stay within [8, 392], 8 px apart, in their order', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      label(`h${i}`, 20 + i * 36, i % 2 === 0 ? 'left' : 'right')
    );
    const tops = gutterStack(items, 400);
    for (const side of ['left', 'right'] as const) {
      const stack = items.filter((it) => it.side === side);
      stack.forEach((it, i) => {
        const top = tops[it.id].top;
        expect(top).toBeGreaterThanOrEqual(8);
        expect(top + it.height).toBeLessThanOrEqual(392);
        if (i > 0) {
          const prev = stack[i - 1];
          expect(top).toBeGreaterThanOrEqual(tops[prev.id].top + prev.height + 8);
        }
      });
    }
  });

  it('a gutter whose stack exceeds the stage starts 8 px down and keeps order (it scrolls)', () => {
    const items = Array.from({ length: 10 }, (_, i) => label(`h${i}`, 20 + i * 36));
    const tops = gutterStack(items, 400);
    expect(tops.h0.top).toBe(8);
    items.forEach((it, i) => {
      if (i > 0) expect(tops[it.id].top).toBe(tops[items[i - 1].id].top + 48 + 8);
    });
  });

  it('returns nothing for no labels', () => {
    expect(gutterStack([], 600)).toEqual({});
  });
});
