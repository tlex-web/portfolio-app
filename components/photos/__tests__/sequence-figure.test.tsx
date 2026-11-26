/**
 * The region sequence figure in place of the Phase 10 grid (PHOTO-06, D-27;
 * 18-24). The successors of the retired components/__tests__/GalleryGrid.test.tsx
 * (14 rows) and lib/__tests__/photos-justify.test.ts (20 rows): one row per
 * former test, each asserting on the rendered SequenceFigure (or the
 * RegionSequence that lists it) what the grid's row asserted on a tile.
 *
 * The justified rows had breakpoint row heights (224 px from 640, 280 px from
 * 1024; the 13 #37 drift guard). The sequence has none: one figure per line,
 * its width `min(100%, max(16rem, (100svh - nav - 12rem) * ar))`, so the
 * row-height rows become rows on the figure's width box and its `sizes`
 * (figureSizes), evaluated here at real viewports against the width the CSS
 * renders. 13 #37 is retired with the grid.
 *
 * The per-view contract (collar, ticks, link name, lazy uncropped image,
 * caption text) stays in components/photos/region/__tests__/SequenceFigure.test.tsx
 * and lib/__tests__/image-sizes.test.ts; nothing here repeats those
 * assertions. Rendered from real registry data; nothing is mocked.
 */
import { render, within } from '@testing-library/react';
import RegionSequence from '@/components/photos/region/RegionSequence';
import SequenceFigure from '@/components/photos/region/SequenceFigure';
import { FIGURE_CHROME_PX, FIGURE_MIN_PX, NAV_PX, figureSizes } from '@/lib/photos/image-sizes';
import { photoHref } from '@/lib/photos/routes';
import { publishedViews, type PhotoView } from '@/lib/photos/view-model';
import { regionById, regionIds, regionPhotoViews } from '@/lib/regions';

const NBSP = String.fromCharCode(0xa0);

const ALL: readonly PhotoView[] = regionIds.flatMap((id) => regionPhotoViews(id));

function view(slug: string): PhotoView {
  const found = ALL.find((v) => v.slug === slug);
  if (!found) throw new Error(`no published view ${slug}`);
  return found;
}

/** One figure in an ol, as RegionSequence lists it; returns its li. */
function renderFigure(v: PhotoView, n = 1, N = 1): HTMLElement {
  const { container } = render(
    <ol>
      <SequenceFigure view={v} n={n} N={N} />
    </ol>
  );
  return container.querySelector('li') as HTMLElement;
}

/** A region's sequence band and its figure items in DOM order. */
function renderSequence(id: string) {
  const { container } = render(<RegionSequence id={id} />);
  const band = container.querySelector('section[data-region-sequence]') as HTMLElement;
  const list = band.querySelector('ol[aria-label]') as HTMLOListElement;
  const items = [...list.querySelectorAll(':scope > li')] as HTMLElement[];
  return { band, list, items };
}

/** Split a sizes or CSS value at its top-level commas. */
function splitTop(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) {
      out.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(value.slice(start).trim());
  return out;
}

/** Evaluate one sizes length (px, vw, vh, calc, min, max) at a viewport. */
function evalLength(expr: string, vw: number, vh: number): number {
  const js = expr
    .replace(/(\d+(?:\.\d+)?)vw/g, (_, n: string) => String((Number(n) * vw) / 100))
    .replace(/(\d+(?:\.\d+)?)vh/g, (_, n: string) => String((Number(n) * vh) / 100))
    .replace(/px/g, '')
    .replace(/\bcalc\(/g, '(')
    .replace(/\b(min|max)\(/g, 'Math.$1(');
  if (!/^[\d\s.+\-*/(),Mathminx]+$/.test(js)) throw new Error(`unexpected sizes term: ${expr}`);
  return Function(`"use strict"; return (${js});`)() as number;
}

/** The width a `sizes` string selects at a viewport (the first matching min-width term). */
function sizesWidth(sizes: string, vw: number, vh: number): number {
  for (const term of splitTop(sizes)) {
    const m = /^\(min-width: (\d+)px\) (.+)$/.exec(term);
    if (!m) return evalLength(term, vw, vh);
    if (vw >= Number(m[1])) return evalLength(m[2], vw, vh);
  }
  throw new Error('sizes has no default term');
}

/**
 * The width the CSS renders a figure at, modelled from the page layout
 * independently of image-sizes.ts: the max-w-6xl container (1152 px) less its
 * px-4 / sm:px-6 / lg:px-8 gutters, less the 6rem rail column and its gap-6
 * from 768 px; then the figure box min(100%, max(16rem, (100svh - 4rem nav -
 * 12rem) * ar)).
 */
function renderedWidth(ar: number, vw: number, vh: number): number {
  const gutter = vw >= 1024 ? 32 : vw >= 640 ? 24 : 16;
  const container = Math.min(vw, 1152) - 2 * gutter;
  const column = vw >= 768 ? container - 96 - 24 : container;
  return Math.min(column, Math.max(16 * 16, (vh - 4 * 16 - 12 * 16) * ar));
}

const ar = (v: PhotoView) => v.aspect.w / v.aspect.h;

/** A copy of a view with another aspect, for the RangeError rows. */
function withAspect(v: PhotoView, w: number, h: number): PhotoView {
  return { ...v, aspect: { ...v.aspect, w, h } };
}

describe('the sequence in place of the grid (successors of GalleryGrid.test.tsx)', () => {
  it('shows every published photo as a figure in exactly one region sequence (none dropped with the grid)', () => {
    const seen: string[] = [];
    for (const id of regionIds) {
      const { items } = renderSequence(id);
      for (const li of items) {
        const img = li.querySelector('[data-figure-box] img') as HTMLImageElement;
        expect(img.getAttribute('alt')).toBeTruthy();
        expect(li.querySelector('figcaption p')?.textContent).toBeTruthy();
        seen.push(li.getAttribute('data-sequence-item') as string);
      }
    }
    expect(new Set(seen).size).toBe(seen.length);
    expect([...seen].sort()).toEqual(publishedViews.map((v) => v.slug).sort());
  });

  it("captions the film scan '4 / 7 · Riffelsee · 2,760 m approx. · 2019' with its film line, and Gornerschlucht's EXIF date", () => {
    const { items } = renderSequence('zermatt');
    const line = (slug: string) =>
      items
        .find((li) => li.getAttribute('data-sequence-item') === slug)
        ?.querySelector('[data-figure-data]')?.textContent;
    expect(line('riffelsee-reflection')).toBe(`4 / 7 · Riffelsee · 2,760${NBSP}m approx. · 2019`);
    expect(line('gornerschlucht-waterfall')).toBe(
      `2 / 7 · Gornerschlucht · 1,668${NBSP}m · Sep 2021`
    );
    const riffelsee = items.find((li) => li.id === 'photo-riffelsee-reflection') as HTMLElement;
    expect(riffelsee.querySelector('[data-figure-film]')?.textContent).toBe('Film scan · 2019');
  });

  it('shows no hotspot count, no hover overlay and no button on a figure', () => {
    for (const v of ALL) {
      const li = renderFigure(v);
      expect(li.textContent).not.toMatch(/hotspot|View details|Click to explore/i);
      expect(li.querySelector('button, [role="button"]')).toBeNull();
      expect(li.querySelector('figcaption')?.innerHTML).not.toMatch(/opacity-0|group-hover:/);
      li.remove();
    }
  });

  it("links each figure to its own photo page, a sequence's links covering exactly its region's photos", () => {
    for (const id of regionIds) {
      const { list } = renderSequence(id);
      const hrefs = [...list.querySelectorAll('a[data-photo-id]')].map((a) =>
        a.getAttribute('href')
      );
      expect(hrefs).toEqual(regionPhotoViews(id).map((v) => photoHref(v.slug)));
    }
  });

  it('holds exactly one data-photo-id opener per item, the link itself (the focus-restore target)', () => {
    for (const id of regionIds) {
      const { items } = renderSequence(id);
      for (const li of items) {
        const openers = li.querySelectorAll('[data-photo-id]');
        expect(openers).toHaveLength(1);
        expect(openers[0].tagName).toBe('A');
      }
    }
  });

  it('lists each region lowest first: DEM heights ascend down the sequence', () => {
    for (const id of regionIds) {
      const { items } = renderSequence(id);
      const heights = items.map(
        (li) => view(li.getAttribute('data-sequence-item') as string).altitudeM
      );
      expect(heights).toEqual([...heights].sort((a, b) => a - b));
    }
  });

  it("names each sequence list '{region} photographs, lowest first' and each link by an aria-label attribute", () => {
    for (const id of regionIds) {
      const { list, items } = renderSequence(id);
      expect(list).toHaveAttribute(
        'aria-label',
        `${regionById(id)?.name} photographs, lowest first`
      );
      for (const li of items) {
        const v = view(li.getAttribute('data-sequence-item') as string);
        expect(within(li).getByRole('link')).toHaveAttribute(
          'aria-label',
          `${v.alt}, open in the photo viewer`
        );
      }
    }
  });

  it('opens the data line with the short place from 768 px: the first part after the phone-only counter', () => {
    for (const v of ALL) {
      const li = renderFigure(v, 1, 3);
      const line = li.querySelector('[data-figure-data]') as HTMLElement;
      const [counter, first] = [...line.children] as HTMLElement[];
      expect(counter).toHaveAttribute('data-figure-counter');
      expect(counter).toHaveClass('md:hidden');
      expect(first.textContent).toBe(v.shortPlace);
      li.remove();
    }
  });

  it('gives every figure across all regions a unique data-photo-id and li id', () => {
    const ids: string[] = [];
    const openers: string[] = [];
    for (const id of regionIds) {
      const { items } = renderSequence(id);
      for (const li of items) {
        ids.push(li.id);
        openers.push(li.querySelector('[data-photo-id]')?.getAttribute('data-photo-id') as string);
      }
    }
    expect(new Set(ids).size).toBe(ALL.length);
    expect(new Set(openers).size).toBe(ALL.length);
  });

  it("makes every data part nowrap, with the ' · ' separators outside them", () => {
    for (const v of ALL) {
      const li = renderFigure(v, 2, 5);
      const line = li.querySelector('[data-figure-data]') as HTMLElement;
      expect(line).toHaveClass('font-mono', 'text-sm', 'text-ink-muted', 'tabular-nums');
      const parts = [...line.querySelectorAll('.whitespace-nowrap')].map((s) => s.textContent);
      expect(parts).toEqual(['2 / 5', v.shortPlace, v.altitudeLabel, v.captureMonth]);
      for (const part of line.querySelectorAll('.whitespace-nowrap')) {
        expect(part.textContent).not.toContain(' · ');
      }
      li.remove();
    }
  });

  it("lists AVIF before WebP, each the view's stage derivatives with content-hashed names", () => {
    const entry = /^\/images\/photos\/[a-z0-9-]+-(1024|1600|2560)\.[0-9a-f]{10}\.(avif|webp) \d+w$/;
    for (const v of ALL) {
      const li = renderFigure(v);
      const sources = li.querySelectorAll('picture > source');
      expect(sources).toHaveLength(2);
      expect(sources[0]).toHaveAttribute('type', 'image/avif');
      expect(sources[0]).toHaveAttribute('srcset', v.stage.srcSetAvif);
      expect(sources[1]).toHaveAttribute('type', 'image/webp');
      expect(sources[1]).toHaveAttribute('srcset', v.stage.srcSetWebp);
      for (const [i, source] of [...sources].entries()) {
        const entries = (source.getAttribute('srcset') as string).split(', ');
        expect(entries).toHaveLength(3);
        for (const e of entries) {
          expect(e).toMatch(entry);
          expect(e).toContain(i === 0 ? '.avif ' : '.webp ');
        }
      }
      const img = li.querySelector('img') as HTMLImageElement;
      expect(img).toHaveAttribute('src', v.stage.src);
      expect(img.getAttribute('src')).toMatch(/-1600\.[0-9a-f]{10}\.webp$/);
      li.remove();
    }
  });

  it('keeps every sequence image lazy with no fetch priority: the header slot cover owns the LCP', () => {
    for (const id of regionIds) {
      const { list } = renderSequence(id);
      const imgs = [...list.querySelectorAll('img')];
      expect(imgs).toHaveLength(regionPhotoViews(id).length);
      for (const img of imgs) {
        expect(img).toHaveAttribute('loading', 'lazy');
        expect(img).not.toHaveAttribute('fetchpriority');
      }
    }
  });

  it("reserves each image box at the view's true ratio over surface-overlay", () => {
    for (const v of ALL) {
      const li = renderFigure(v);
      const figure = li.querySelector('figure') as HTMLElement;
      expect(Number(figure.style.getPropertyValue('--ar'))).toBeCloseTo(ar(v), 10);
      const box = li.querySelector('[data-figure-box]') as HTMLElement;
      expect(box).toHaveClass('aspect-[var(--ar)]', 'w-full', 'bg-surface-overlay');
      li.remove();
    }
  });

  it('has no breakpoint row heights: the list is one flex column with no --row-h, no wrap and no filler (13 #37 retired)', () => {
    for (const id of regionIds) {
      const { list, items } = renderSequence(id);
      expect(list).toHaveClass('flex', 'flex-col');
      expect(list.className).not.toMatch(/--row-h|flex-wrap|flex-row|after:/);
      expect(items).toHaveLength(regionPhotoViews(id).length);
      for (const li of items) expect(li.getAttribute('style')).toBeNull();
    }
  });
});

describe('the figure box in place of justified rows (successors of photos-justify.test.ts)', () => {
  it('spells the 16rem floor and the 12rem chrome in the rendered width class (256 px and 192 px)', () => {
    const figure = renderFigure(ALL[0]).querySelector('figure') as HTMLElement;
    expect(figure.className).toContain('max(16rem,calc((100svh-var(--nav-h)-12rem)*var(--ar)))');
    expect(FIGURE_MIN_PX).toBe(16 * 16);
    expect(FIGURE_CHROME_PX).toBe(12 * 16);
  });

  it('centres each figure in its column with mx-auto, so a line needs no filler', () => {
    for (const v of ALL) {
      const li = renderFigure(v);
      expect(li.querySelector('figure')).toHaveClass('mx-auto');
      expect(li.className).not.toMatch(/grow|flex-/);
      li.remove();
    }
  });

  it('gives the 2560 x 1707 Matterhorn from Zermatt figure --ar 2560/1707 and sizes at 1.4997', () => {
    const li = renderFigure(view('matterhorn-from-zermatt'));
    const img = li.querySelector('img') as HTMLImageElement;
    expect(img).toHaveAttribute('width', '2560');
    expect(img).toHaveAttribute('height', '1707');
    expect(Number(li.querySelector('figure')?.style.getPropertyValue('--ar'))).toBe(2560 / 1707);
    expect(img.getAttribute('sizes')).toContain('* 1.4997)');
  });

  it('rounds the film scan (2560 x 1745) to four decimals in its sizes', () => {
    const img = renderFigure(view('riffelsee-reflection')).querySelector('img') as HTMLImageElement;
    expect(img).toHaveAttribute('width', '2560');
    expect(img).toHaveAttribute('height', '1745');
    expect(img.getAttribute('sizes')).toContain('* 1.4670)');
    expect(img.getAttribute('sizes')).not.toMatch(/\d\.\d{5}/);
  });

  it.each([
    [0, 10],
    [10, 0],
    [-1, 10],
    [Number.NaN, 10],
    [10, Number.POSITIVE_INFINITY],
  ])('throws a RangeError rendering a figure whose aspect is %p x %p', (w, h) => {
    expect(() => renderFigure(withAspect(ALL[0], w, h))).toThrow(RangeError);
  });

  it('gives figures of one ratio identical sizes (one image height at any viewport)', () => {
    const same = ALL.filter((v) => v.aspect.w === 2560 && v.aspect.h === 1707);
    expect(same.length).toBeGreaterThanOrEqual(2);
    const sizes = same.map((v) => {
      const li = renderFigure(v);
      const s = li.querySelector('img')?.getAttribute('sizes');
      li.remove();
      return s;
    });
    expect(new Set(sizes).size).toBe(1);
  });

  it('gives every figure, whatever its ratio, the same width class: only --ar differs', () => {
    const classes = new Set<string>();
    const ratios = new Set<string>();
    for (const v of ALL) {
      const li = renderFigure(v);
      const figure = li.querySelector('figure') as HTMLElement;
      classes.add(figure.className);
      ratios.add(figure.style.getPropertyValue('--ar'));
      li.remove();
    }
    expect(classes.size).toBe(1);
    expect(ratios.size).toBeGreaterThan(1);
  });

  it('shrinks a figure to its column when the column is narrower than the height cap (320 x 900)', () => {
    const v = view('matterhorn-from-zermatt');
    const figure = renderFigure(v).querySelector('figure') as HTMLElement;
    expect(figure.className).toContain('w-[min(100%,');
    expect(sizesWidth(figureSizes(ar(v)), 320, 900)).toBe(320 - 32);
    expect(renderedWidth(ar(v), 320, 900)).toBe(320 - 32);
  });

  it('renders no sequence for an id that is not a registry region (RangeError)', () => {
    expect(() => render(<RegionSequence id="nowhere" />)).toThrow(RangeError);
  });

  it("numbers each region's figures 1..N in order, N the sequence length", () => {
    for (const id of regionIds) {
      const { items } = renderSequence(id);
      const counters = items.map((li) => li.querySelector('[data-figure-counter]')?.textContent);
      expect(counters).toEqual(items.map((_, i) => `${i + 1} / ${items.length} · `));
    }
  });

  it.each([
    [375, 812],
    [768, 1024],
    [1024, 768],
    [1440, 900],
  ])(
    "at %i x %i px each figure's sizes covers its rendered width and over-fetches by at most one gutter",
    (vw, vh) => {
      for (const v of ALL) {
        const li = renderFigure(v);
        const sizes = li.querySelector('img')?.getAttribute('sizes') as string;
        li.remove();
        const selected = sizesWidth(sizes, vw, vh);
        const rendered = renderedWidth(ar(v), vw, vh);
        expect(selected).toBeGreaterThanOrEqual(rendered - 0.5);
        expect(selected - rendered).toBeLessThanOrEqual(16 + 0.5);
      }
    }
  );

  it('keeps a portrait figure at the 16rem floor on a landscape phone (844 x 390)', () => {
    const v = view('meadow-stream-below-the-peaks');
    expect(ar(v)).toBeLessThan(1);
    const sizes = renderFigure(v).querySelector('img')?.getAttribute('sizes') as string;
    expect(sizesWidth(sizes, 844, 390)).toBe(FIGURE_MIN_PX);
    expect(renderedWidth(ar(v), 844, 390)).toBe(FIGURE_MIN_PX);
  });

  it('gives a 3:2 and a 3:4 figure one image height at 1440 x 900 (the viewport cap, 644 px)', () => {
    const cap = 900 - NAV_PX - FIGURE_CHROME_PX;
    for (const slug of ['matterhorn-from-zermatt', 'meadow-stream-below-the-peaks']) {
      const v = view(slug);
      const sizes = renderFigure(v).querySelector('img')?.getAttribute('sizes') as string;
      expect(sizesWidth(sizes, 1440, 900) / ar(v)).toBeCloseTo(cap, 0);
      expect(renderedWidth(ar(v), 1440, 900) / ar(v)).toBeCloseTo(cap, 6);
    }
  });

  it('renders no collar line for a view without a Position row (nothing reserved)', () => {
    const v = ALL[0];
    const noPosition: PhotoView = {
      ...v,
      strip: {
        ...v.strip,
        positionRows: v.strip.positionRows.filter((r) => r.term !== 'Position'),
      },
    };
    const li = renderFigure(noPosition);
    expect(li.querySelector('[data-figure-collar]')).toBeNull();
    expect(li.querySelector('figure')?.firstElementChild).toHaveAttribute('data-neatline');
  });
});
