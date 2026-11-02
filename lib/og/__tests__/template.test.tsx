/**
 * @jest-environment node
 */
/**
 * The shared Open Graph template's element trees (SEO-02; D-14, D-15, D-16;
 * 12-UI-SPEC "Open Graph Template"; UI-SPEC E12 empty, overflow and long text).
 *
 * OgFrame returns host elements only, so walking `props.children` yields every
 * string the card draws, the font it is set in, and every image. The cases run
 * over every photo view and every project (data-driven, no literal slugs):
 * - each variant prints its approved facts and nothing reads 'undefined' or 'NaN';
 * - a line whose data is missing is left out, never filled;
 * - ogPhotoFit contain-fits each manifest JPEG into the 768 x 630 slot, never cropping;
 * - the longest texts fit their boxes, measured with the advance widths of the
 *   committed TTFs (hmtx), a closer estimate than a flat em ratio;
 * - every drawn character exists in its font's cmap, so Satori never reaches for
 *   a fallback font, which next/og would fetch from a third-party origin.
 *
 * No pixel snapshot: e2e/og.spec.ts checks the rendered PNGs' status, type and size.
 */
import fs from 'node:fs';
import path from 'node:path';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { imageManifest } from '@/data/generated/image-manifest';
import { trailProfiles } from '@/data/generated/trail-profiles';
import { projects } from '@/data/projects';
import { sheet } from '@/data/sheet';
import { site } from '@/data/site';
import { terrain } from '@/data/generated/terrain';
import { lv95ToWgs84 } from '@/lib/geo';
import { formatLatLon } from '@/lib/home-format';
import { OG_SIZE, OgFrame, ogPhotoFit } from '@/lib/og/template';
import { formatMetres } from '@/lib/photo-format';
import { photoViews, type PhotoView } from '@/lib/photos/view-model';

const CONTOUR = 'data:image/svg+xml;base64,PHN2Zy8+';
const JPEG = 'data:image/jpeg;base64,/9j/';

// ---- element tree walk ---------------------------------------------------------

type Run = { text: string; font: string | undefined };
type Img = { src: string; width: number; height: number; style: Record<string, unknown> };
type Collected = { runs: Run[]; images: Img[]; svgs: number };

function collect(node: ReactNode, font: string | undefined = undefined, out?: Collected): Collected {
  const acc = out ?? { runs: [], images: [], svgs: 0 };
  if (node === null || node === undefined || typeof node === 'boolean') return acc;
  if (typeof node === 'string' || typeof node === 'number') {
    acc.runs.push({ text: String(node), font });
    return acc;
  }
  if (Array.isArray(node)) {
    for (const child of node) collect(child, font, acc);
    return acc;
  }
  if (!isValidElement(node)) return acc;
  const props = (node as ReactElement<Record<string, unknown>>).props;
  const style = (props.style ?? {}) as Record<string, unknown>;
  const own = typeof style.fontFamily === 'string' ? style.fontFamily : font;
  if (node.type === 'img') {
    acc.images.push({
      src: String(props.src),
      width: Number(props.width),
      height: Number(props.height),
      style,
    });
  }
  if (node.type === 'svg') {
    acc.svgs += 1;
    return acc; // drawing only: its attributes are not card text
  }
  collect(props.children as ReactNode, own, acc);
  return acc;
}

const texts = (c: Collected) => c.runs.map((r) => r.text);

function photoProps(view: PhotoView) {
  const jpeg = imageManifest[view.id as keyof typeof imageManifest].jpeg;
  return { src: JPEG, width: jpeg.width, height: jpeg.height };
}

const photoCard = (view: PhotoView) =>
  collect(OgFrame({ variant: 'photo', contour: CONTOUR, view, photo: photoProps(view) }));
const projectCard = (project: (typeof projects)[number]) =>
  collect(OgFrame({ variant: 'project', contour: CONTOUR, project }));
const defaultCard = () => collect(OgFrame({ variant: 'default', contour: CONTOUR }));

const profileFor = (project: (typeof projects)[number]) =>
  trailProfiles.find((p) => p.id === project.route);

// ---- font metrics from the committed TTFs --------------------------------------

type Metrics = { has: (cp: number) => boolean; width: (s: string, px: number) => number };

function loadFont(file: string): Metrics {
  const b = fs.readFileSync(path.join(process.cwd(), 'lib/og/fonts', file));
  const tables: Record<string, number> = {};
  for (let i = 0; i < b.readUInt16BE(4); i++) {
    const r = 12 + 16 * i;
    tables[b.toString('latin1', r, r + 4)] = b.readUInt32BE(r + 8);
  }
  const upm = b.readUInt16BE(tables.head + 18);
  const hMetrics = b.readUInt16BE(tables.hhea + 34);
  const cmap = new Map<number, number>();
  const base = tables.cmap;
  for (let i = 0; i < b.readUInt16BE(base + 2); i++) {
    const st = base + b.readUInt32BE(base + 4 + 8 * i + 4);
    const format = b.readUInt16BE(st);
    if (format === 4) {
      const segX2 = b.readUInt16BE(st + 6);
      const ends = st + 14;
      const starts = ends + segX2 + 2;
      const deltas = starts + segX2;
      const offsets = deltas + segX2;
      for (let s = 0; s < segX2 / 2; s++) {
        const end = b.readUInt16BE(ends + 2 * s);
        const start = b.readUInt16BE(starts + 2 * s);
        const delta = b.readInt16BE(deltas + 2 * s);
        const ro = b.readUInt16BE(offsets + 2 * s);
        if (start === 0xffff) continue;
        for (let c = start; c <= end; c++) {
          // idRangeOffset 0: glyph = c + delta; else read glyphIdArray (0 stays 0, "missing")
          const raw = ro === 0 ? c : b.readUInt16BE(offsets + 2 * s + ro + 2 * (c - start));
          const glyph = ro !== 0 && raw === 0 ? 0 : (raw + delta) & 0xffff;
          if (glyph !== 0 && !cmap.has(c)) cmap.set(c, glyph);
        }
      }
    } else if (format === 12) {
      for (let g = 0; g < b.readUInt32BE(st + 12); g++) {
        const start = b.readUInt32BE(st + 16 + 12 * g);
        const end = b.readUInt32BE(st + 20 + 12 * g);
        const first = b.readUInt32BE(st + 24 + 12 * g);
        for (let c = start; c <= end; c++) if (!cmap.has(c)) cmap.set(c, first + c - start);
      }
    }
  }
  const advance = (glyph: number) => b.readUInt16BE(tables.hmtx + 4 * Math.min(glyph, hMetrics - 1));
  return {
    has: (cp) => cmap.has(cp),
    width: (s, px) =>
      ([...s].reduce((sum, ch) => sum + advance(cmap.get(ch.codePointAt(0)!) ?? 0), 0) / upm) * px,
  };
}

const FONTS: Record<string, Metrics> = {
  'Schibsted Grotesk': loadFont('SchibstedGrotesk-SemiBold.ttf'),
  Inter: loadFont('Inter-Regular.ttf'),
  'JetBrains Mono': loadFont('JetBrainsMono-Regular.ttf'),
};

/** Greedy word wrap with the font's advance widths: the number of lines `s` takes in `box` px. */
function lineCount(font: Metrics, s: string, px: number, box: number): number {
  let lines = 1;
  let current = '';
  for (const word of s.split(' ')) {
    const next = current ? `${current} ${word}` : word;
    if (current && font.width(next, px) > box) {
      lines += 1;
      current = word;
    } else current = next;
  }
  return lines;
}

// ---- cases ---------------------------------------------------------------------

describe('ogPhotoFit (UI-SPEC E12 overflow: contain, never crop)', () => {
  it('fits a 3:2 photo to 768 x 512 with 59 px mats and the film scan to 768 x 524', () => {
    expect(ogPhotoFit(1200, 800)).toEqual({ width: 768, height: 512, matX: 0, matY: 59 });
    expect(ogPhotoFit(1200, 818).height).toBe(524);
  });

  it.each(photoViews.map((v) => [v.slug, v] as const))(
    '%s: its manifest JPEG fills the slot on one axis, keeps its ratio and is centred',
    (_slug, view) => {
      const { width, height } = photoProps(view);
      const fit = ogPhotoFit(width, height);
      expect(fit.width).toBeLessThanOrEqual(768);
      expect(fit.height).toBeLessThanOrEqual(OG_SIZE.height);
      expect(fit.width === 768 || fit.height === OG_SIZE.height).toBe(true);
      expect(Math.abs(fit.width / fit.height - width / height)).toBeLessThan(0.01);
      expect(fit.matX).toBe(Math.floor((768 - fit.width) / 2));
      expect(fit.matY).toBe(Math.floor((OG_SIZE.height - fit.height) / 2));
    }
  );
});

describe('photo variant (D-14)', () => {
  it.each(photoViews.map((v) => [v.slug, v] as const))(
    '%s: title, place, altitude and the year line, over the contain-fitted JPEG',
    (_slug, view) => {
      const card = photoCard(view);
      const all = texts(card);
      expect(all).toContain(view.title);
      expect(all).toContain(view.place);
      expect(all).toContain(view.altitudeLabel);
      expect(view.altitudeLabel.endsWith(' approx.')).toBe(view.approximate);
      expect(all).toContain(`© ${view.years} ${site.name}`);

      const { width, height } = photoProps(view);
      const fit = ogPhotoFit(width, height);
      const photo = card.images.find((img) => img.src === JPEG);
      expect(photo).toMatchObject({ width: fit.width, height: fit.height });
    }
  );

  it("the film scan reads its scan year in the © line (the strip's 'Film scan · {year}')", () => {
    const scans = photoViews.filter((v) => v.strip.filmLine !== null);
    expect(scans.length).toBeGreaterThan(0);
    for (const view of scans) {
      const year = view.strip.filmLine!.split(' · ')[1];
      expect(texts(photoCard(view))).toContain(`© ${year} ${site.name}`);
    }
  });

  it('leaves out the place line when the place is missing (SEO-02 empty)', () => {
    const view = { ...photoViews[0], place: '' };
    const all = texts(photoCard(view));
    expect(all).toContain(view.title);
    expect(all.filter((t) => t.trim() === '')).toEqual([]);
    expect(all).toHaveLength(texts(photoCard(photoViews[0])).length - 1);
  });
});

describe('project variant (D-15)', () => {
  it.each(projects.map((p) => [p.slug, p] as const))(
    '%s: kicker, name, pitch, the route caption from the profile ends and the grade',
    (_slug, project) => {
      const card = projectCard(project);
      const all = texts(card);
      const profile = profileFor(project);
      expect(profile).toBeDefined();
      expect(all).toContain(`${project.kicker.version} · ${project.kicker.status}`);
      expect(all).toContain(project.name);
      expect(all).toContain(project.pitch);
      expect(all).toContain(`${profile!.start.name} ${formatMetres(profile!.start.heightM)}`);
      expect(all).toContain(`→ ${profile!.end.name} ${formatMetres(profile!.end.heightM)}`);
      expect(all).toContain(profile!.sacGrade);
      expect(profile!.sacGrade).toMatch(/^T[1-6]$/);
      expect(all).toContain(site.name);
      expect(card.svgs).toBe(2); // the profile and the waymark glyph
    }
  );

  it('leaves out the profile, caption and grade for a route with no committed profile (SEO-02 empty)', () => {
    const project = { ...projects[0], route: 'no-such-trail' };
    const card = projectCard(project);
    const all = texts(card);
    expect(card.svgs).toBe(0);
    expect(all.some((t) => t.startsWith('→'))).toBe(false);
    expect(all).toContain(project.pitch);
    expect(all.filter((t) => t.trim() === '')).toEqual([]);
  });
});

describe('default variant (D-16)', () => {
  it('prints the name, role, summit, height, coordinates and sheet title, all derived', () => {
    const all = texts(defaultCard());
    const { summit } = terrain;
    expect(all).toEqual([
      site.name,
      site.role,
      summit.name,
      formatMetres(summit.officialM),
      formatLatLon(lv95ToWgs84(summit.lv95)),
      sheet.title,
    ]);
  });
});

const everyCard = (): [string, Collected][] => [
  ['default', defaultCard()],
  ...photoViews.map((v): [string, Collected] => [`photo ${v.slug}`, photoCard(v)]),
  ...projects.map((p): [string, Collected] => [`project ${p.slug}`, projectCard(p)]),
];

describe('every card (SEO-02 empty, prohibition: no third-party font fetch)', () => {
  it('no drawn string contains undefined or NaN, and none is empty', () => {
    for (const [name, card] of everyCard()) {
      for (const t of texts(card)) {
        expect(`${name}: ${t}`).not.toMatch(/undefined|NaN/);
        expect(t.trim()).not.toBe('');
      }
    }
  });

  it('every drawn character is in the cmap of the committed font it is set in', () => {
    for (const [name, card] of everyCard()) {
      for (const { text, font } of card.runs) {
        expect(font && FONTS[font] ? font : `${name}: no OG font for "${text}"`).toBe(font);
        const missing = [...text].filter((ch) => !FONTS[font!].has(ch.codePointAt(0)!));
        expect(`${name} ${font}: ${missing.join('')}`).toBe(`${name} ${font}: `);
      }
    }
  });
});

describe('long text fits its box (UI-SPEC E12 long text, backstop)', () => {
  it.each(photoViews.map((v) => [v.slug, v.title] as const))(
    '%s: the title takes at most 3 lines of 336 px at 32 px Schibsted',
    (_slug, title) => {
      expect(lineCount(FONTS['Schibsted Grotesk'], title, 32, 336)).toBeLessThanOrEqual(3);
    }
  );

  it.each(projects.map((p) => [p.slug, p] as const))(
    '%s: the pitch wraps in 640 px at 32 px Inter and the text block fits the slot',
    (_slug, project) => {
      const lines = lineCount(FONTS.Inter, project.pitch, 32, 640);
      // kicker 32 + name 76 + 16 + pitch lines x 40, inside the slot's 630 - 2 x 64 px
      expect(32 + 76 + 16 + lines * 40).toBeLessThanOrEqual(OG_SIZE.height - 2 * 64);
      expect(lines).toBeLessThanOrEqual(4);
      expect(FONTS['Schibsted Grotesk'].width(project.name, 72)).toBeLessThanOrEqual(640);
    }
  );

  it('every plate line set in Mono fits 336 px on one line unit (caption units, coordinates)', () => {
    for (const [name, card] of everyCard()) {
      for (const { text, font } of card.runs) {
        if (font !== 'JetBrains Mono') continue;
        expect(`${name}: ${text} ${FONTS[font].width(text, 24) <= 336}`).toBe(`${name}: ${text} true`);
      }
    }
  });
});
