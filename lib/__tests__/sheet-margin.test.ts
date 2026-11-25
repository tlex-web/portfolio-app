/**
 * @jest-environment node
 */
/**
 * The sheet margins (REGION-06; 18 D-16..D-19; 18-UI-SPEC Contract 7
 * "SheetMargin"): the server-only margin model under every map sheet.
 *
 * Strings are typed literally, as Tim approved them at the D-20 checkpoint
 * (18-03, "approve-G1 (Recommended)", 2026-11-25), so any drift from his
 * wording or from the footer's extent format fails here. The extent corners
 * are sheet corners, not photo positions (D-25 does not apply).
 */
import { plates } from '@/data/generated/plates';
import { GLO90_LIABILITY, GLO90_NOTICE } from '@/data/schemas/overview';
import { SOURCE_IDS } from '@/data/source-credits';
import { SOURCES } from '@/data/sources';
import { SHEET_TITLES, type SheetMarginModel, sheetMargin } from '@/lib/sheet-margin';

const NBSP = ' ';

describe('sheetMargin: Zermatt – Matterhorn (the Swiss sheet, D-19)', () => {
  const m = sheetMargin('matterhorn');

  it('titles the sheet as the footer does, with its 100 m hero interval', () => {
    expect(m.title).toBe('Zermatt – Matterhorn');
    expect(SHEET_TITLES.matterhorn).toBe('Zermatt – Matterhorn');
    expect(m.interval).toBe(`100${NBSP}m`);
  });

  it("keeps 'Extent (LV95)' with the footer's corner format", () => {
    expect(m.extent).toStrictEqual({
      label: 'Extent (LV95)',
      parts: ['SW 2’616’000, 1’088’000', 'NE 2’627’000, 1’099’000'],
    });
  });

  it('gives the terrain edition as Last surveyed (D-18)', () => {
    expect(m.lastSurveyed).toBe('May 2026');
  });

  it('links the approved short credit to /sources#swissaltiregio (D-17)', () => {
    expect(m.source).toStrictEqual({
      kind: 'link',
      text: 'swissALTIRegio, swisstopo',
      href: '/sources#swissaltiregio',
    });
  });

  it('has no Summits row (UI E9/partial: only the overview has one)', () => {
    expect(m.summits).toBeUndefined();
  });
});

describe('sheetMargin: Ortler (an LV95 sheet outside Switzerland, D-19)', () => {
  const m = sheetMargin('ortler');

  it('titles the sheet with the approved title and its 100 m interval', () => {
    expect(m.title).toBe('Ortler');
    expect(m.interval).toBe(`100${NBSP}m`);
  });

  it("prints 'Extent' with the WGS84 SW and NE corners at 4 decimals (lv95ToWgs84)", () => {
    expect(m.extent.label).toBe('Extent');
    expect(m.extent.parts).toStrictEqual([
      `SW 46.4604${NBSP}N 10.4854${NBSP}E`,
      `NE 46.5640${NBSP}N 10.6479${NBSP}E`,
    ]);
  });

  it('gives its edition and the swissALTIRegio credit', () => {
    expect(m.lastSurveyed).toBe('May 2026');
    expect(m.source).toStrictEqual({
      kind: 'link',
      text: 'swissALTIRegio, swisstopo',
      href: '/sources#swissaltiregio',
    });
  });
});

describe('sheetMargin: Saalfelden (an EPSG:3035 sheet, corners from the build, D-19)', () => {
  // Built inside each test, so a missing margin fails that test, not the whole file.
  let m: SheetMarginModel;
  beforeEach(() => {
    m = sheetMargin('saalfelden');
  });

  it('titles the sheet with the approved title and its 100 m interval', () => {
    expect(m.title).toBe('Saalfelden');
    expect(m.interval).toBe(`100${NBSP}m`);
  });

  it("prints 'Extent' with plates.saalfelden.extent.wgs84 at 4 decimals", () => {
    expect(m.extent.label).toBe('Extent');
    expect(m.extent.parts).toStrictEqual([
      `SW 47.3878${NBSP}N 12.7536${NBSP}E`,
      `NE 47.4916${NBSP}N 12.9183${NBSP}E`,
    ]);
  });

  it("gives BEV's edition and links the BEV credit to /sources#bev-als-dtm", () => {
    expect(m.lastSurveyed).toBe('Sep 2025');
    expect(m.source).toStrictEqual({
      kind: 'link',
      text: 'ALS DTM, BEV, CC BY 4.0',
      href: '/sources#bev-als-dtm',
    });
  });
});

describe("sheetMargin('overview'): The Alps (18-23 renders it)", () => {
  // Built inside each test, so a missing margin fails that test, not the whole file.
  let m: SheetMarginModel;
  beforeEach(() => {
    m = sheetMargin('overview');
  });

  it('titles the sheet The Alps with its 1,000 m interval', () => {
    expect(m.title).toBe('The Alps');
    expect(SHEET_TITLES.overview).toBe('The Alps');
    expect(m.interval).toBe(`1,000${NBSP}m`);
  });

  it('prints the projection window in whole degrees', () => {
    expect(m.extent).toStrictEqual({
      label: 'Extent',
      parts: ['SW 43° N 5° E', 'NE 49° N 17° E'],
    });
  });

  it('gives the GLO-90 release year alone as Last surveyed (D-18)', () => {
    expect(m.lastSurveyed).toBe('2021');
  });

  it("links 'Copernicus DEM GLO-90' to /sources#copernicus-glo-90 (Tim's G1, 18-03)", () => {
    expect(m.source).toStrictEqual({
      kind: 'link',
      text: 'Copernicus DEM GLO-90',
      href: '/sources#copernicus-glo-90',
    });
  });

  it("lists the summits west to east, Triglav's stored height printed plainly (P6)", () => {
    expect(m.summits).toStrictEqual([
      `Mont Blanc 4,806${NBSP}m`,
      `Dufourspitze 4,634${NBSP}m`,
      `Zugspitze 2,962${NBSP}m`,
      `Grossglockner 3,798${NBSP}m`,
      `Triglav 2,864${NBSP}m`,
    ]);
  });
});

describe('every margin (UI E9/empty backstop; T-18-25)', () => {
  const ids = ['overview', ...Object.keys(plates)];
  const margins = () => ids.map((id) => [id, sheetMargin(id)] as const);

  it('covers the overview and every plate', () => {
    expect(ids).toEqual(['overview', 'matterhorn', 'ortler', 'saalfelden']);
  });

  it.each(ids)('%s: no field is empty', (id) => {
    const m = sheetMargin(id);
    expect(m.title.trim()).not.toBe('');
    expect(m.interval.trim()).not.toBe('');
    expect(m.extent.parts.length).toBe(2);
    for (const part of m.extent.parts) expect(part.trim()).not.toBe('');
    expect(m.lastSurveyed.trim()).not.toBe('');
    if (m.source.kind === 'link') expect(m.source.text.trim()).not.toBe('');
    else {
      expect(m.source.paragraphs.length).toBeGreaterThan(0);
      for (const p of m.source.paragraphs) expect(p.trim()).not.toBe('');
    }
    for (const s of m.summits ?? []) expect(s.trim()).not.toBe('');
  });

  it.each(ids)('%s: the source links to an anchor with an entry on /sources', (id) => {
    const m = sheetMargin(id);
    const anchor = /^\/sources#([a-z0-9-]+)$/.exec(m.source.href)?.[1];
    expect(anchor).toBeDefined();
    expect(SOURCE_IDS).toContain(anchor);
    expect(SOURCES.map((s) => s.id)).toContain(anchor);
  });

  it('only the overview has a Summits row (UI E9/partial)', () => {
    expect(
      margins()
        .filter(([, m]) => m.summits !== undefined)
        .map(([id]) => id)
    ).toEqual(['overview']);
  });

  // 16 D-21: a margin that ever carries the GLO-90 notice carries it verbatim. With
  // Tim's G1 no margin does: the overview credits GLO-90 by link.
  it('never shortens GLO90_NOTICE or GLO90_LIABILITY', () => {
    for (const [, m] of margins()) {
      if (m.source.kind === 'notice')
        expect(m.source.paragraphs).toStrictEqual([GLO90_NOTICE, GLO90_LIABILITY]);
    }
    expect(margins().every(([, m]) => m.source.kind === 'link')).toBe(true);
  });
});

describe('sheetMargin: unknown ids', () => {
  it('throws a RangeError for an id that is neither a plate nor the overview', () => {
    expect(() => sheetMargin('zermatt')).toThrow(RangeError);
    expect(() => sheetMargin('')).toThrow(RangeError);
    expect(() => sheetMargin('toString')).toThrow(RangeError);
  });
});
