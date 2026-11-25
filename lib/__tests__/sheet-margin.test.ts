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
import { SHEET_TITLES, sheetMargin } from '@/lib/sheet-margin';

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

describe('sheetMargin: unknown ids', () => {
  it('throws a RangeError for an id that is neither a plate nor the overview', () => {
    expect(() => sheetMargin('zermatt')).toThrow(RangeError);
    expect(() => sheetMargin('')).toThrow(RangeError);
  });
});
