/**
 * @jest-environment node
 */
/**
 * The /sources entries (REGION-06; 18 D-20; T-18-06).
 *
 * - Order and anchors: SOURCES lists one entry per SOURCE_IDS id, in that
 *   order; every id has a short credit and the anchor `/sources#<id>`.
 * - Verbatim credits (16 D-21): each Credit equals its data source's own
 *   string by strict equality, so one changed code point fails (the U+2122 in
 *   WorldDEM™, the U+2019 apostrophes in the swisstopo reference, the U+2013
 *   dash in the BEV credit). The data files are read from disk here, not
 *   through the modules data/sources.ts imports, so the check is independent
 *   of the import path. swissALTIRegio's reference has no data file: it
 *   lives in data/sources.ts itself (18 D-16), so it is pinned to the sha256
 *   and length of its v2.0 text (08 D-15) and can never change by a move.
 * - Licences link to their official text over https; "Used on" links only to
 *   /photos or a registry region page, region pages west to east (D-01).
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { GLO90_LIABILITY, GLO90_NOTICE } from '@/data/schemas/overview';
import { SHORT_CREDIT, SOURCE_IDS, SOURCES_PAGE, sourceHref } from '@/data/source-credits';
import { SOURCES, SOURCES_INTRO, SWISSALTIREGIO_CREDIT, type SourceEntry } from '@/data/sources';
import { regionHref } from '@/lib/photos/routes';
import { regionIds } from '@/lib/regions';

const readJson = (rel: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), 'utf8')) as Record<string, unknown>;

const BEV = readJson('data/terrain/plates/saalfelden/source.json');
const GLO90 = readJson('data/terrain/overview/source.json');

function entry(id: string): SourceEntry {
  const found = SOURCES.find((s) => s.id === id);
  if (!found) throw new Error(`sources.test: no entry ${id}`);
  return found;
}

const hrefs = (e: SourceEntry) => e.usedOn.flatMap((u) => ('href' in u ? [u.href] : []));

describe('order and anchors (REGION-06 ordering)', () => {
  it('lists one entry per SOURCE_IDS id, in that order', () => {
    expect(SOURCES.map((s) => s.id)).toEqual([...SOURCE_IDS]);
  });

  it('gives every id a short credit and the anchor /sources#<id>', () => {
    expect(Object.keys(SHORT_CREDIT).sort()).toEqual([...SOURCE_IDS].sort());
    for (const id of SOURCE_IDS) {
      expect(SHORT_CREDIT[id].trim()).not.toBe('');
      expect(sourceHref(id)).toBe('/sources#' + id);
    }
    expect(SOURCES_PAGE).toEqual({ href: '/sources', title: 'Data sources' });
  });

  it('has a name, a credit, a licence, changes and a use for every entry, and an intro', () => {
    expect(SOURCES_INTRO.trim()).not.toBe('');
    for (const s of SOURCES) {
      expect(s.name.trim()).not.toBe('');
      expect(s.credit.length).toBeGreaterThan(0);
      expect(s.licence.name.trim()).not.toBe('');
      expect(s.changes.length).toBeGreaterThan(0);
      expect(s.usedOn.length).toBeGreaterThan(0);
    }
  });
});

describe('verbatim credits (16 D-21, T-18-06; REGION-06 encoding)', () => {
  it('swissALTIRegio prints SWISSALTIREGIO_CREDIT, byte-identical to its v2.0 text (08 D-15, 18 D-16)', () => {
    expect(entry('swissaltiregio').credit).toStrictEqual([SWISSALTIREGIO_CREDIT]);
    expect(SWISSALTIREGIO_CREDIT).toHaveLength(631);
    expect(createHash('sha256').update(SWISSALTIREGIO_CREDIT, 'utf8').digest('hex')).toBe(
      'bb9aae2fda067c1337d3dde7cd31223ea425286b4c81eaeadf8c1a8d158f19ea'
    );
    expect(SWISSALTIREGIO_CREDIT).toContain('Institut National de l’information');
  });

  it("BEV ALS DTM prints the Saalfelden plate's source.json credit", () => {
    expect(typeof BEV.credit).toBe('string');
    expect(entry('bev-als-dtm').credit).toStrictEqual([BEV.credit]);
    expect(BEV.credit).toContain('© BEV – Bundesamt');
  });

  it('Copernicus DEM GLO-90 prints the notice, then the liability sentence, as in the overview source.json', () => {
    expect(entry('copernicus-glo-90').credit).toStrictEqual([GLO90_NOTICE, GLO90_LIABILITY]);
    expect(entry('copernicus-glo-90').credit).toStrictEqual([GLO90.notice, GLO90.liability]);
    expect(GLO90_NOTICE).toContain('WorldDEM™-90');
  });

  it('fails on one changed code point (the check is not vacuous)', () => {
    const credit = entry('copernicus-glo-90').credit;
    const retyped = [credit[0].replace('™', 'TM'), credit[1]];
    expect(retyped).not.toStrictEqual(credit);
  });
});

describe('licences and uses', () => {
  it('links every licence over https, BEV to its source.json licenceUrl', () => {
    for (const s of SOURCES) expect(s.licence.href).toMatch(/^https:\/\//);
    expect(entry('bev-als-dtm').licence.href).toBe(BEV.licenceUrl);
    expect(entry('bev-als-dtm').licence.name).toBe(BEV.licence);
  });

  it('links only to /photos or a registry region page', () => {
    const allowed = new Set(['/photos', ...regionIds.map((id) => regionHref(id))]);
    for (const s of SOURCES) {
      expect(hrefs(s).filter((h) => !allowed.has(h))).toEqual([]);
    }
  });

  it('lists each source’s region pages west to east, from the plate products', () => {
    expect(hrefs(entry('swissaltiregio'))).toEqual([
      '/photos/regions/zermatt',
      '/photos/regions/ortler',
    ]);
    expect(entry('swissaltiregio').usedOn.at(-1)).toEqual({ label: 'The footer of every page' });
    expect(hrefs(entry('bev-als-dtm'))).toEqual(['/photos/regions/saalfelden']);
    expect(entry('copernicus-glo-90').usedOn).toEqual([
      { label: 'Alps overview', href: '/photos' },
    ]);
  });

  it('states that the BEV edition is a creation date, not a survey date', () => {
    expect(entry('bev-als-dtm').changes).toContain(
      'Edition 15 September 2025, the date BEV created the dataset, not a survey date.'
    );
  });
});

/*
 * Tim's D-20 copy (18-03 Task 2, "approve-G1 (Recommended)", 2026-11-25): the
 * proposed finals of the packet, typed literally here as seo.spec types its
 * descriptions, so any drift from the approved wording fails. The row numbers
 * are the packet's (18-03-SUMMARY "D-20 copy (Tim's reply, verbatim)").
 */
describe("approved copy (D-20, Tim's reply 2026-11-25)", () => {
  it('pins the short credits the footer and the margins link with (rows 3a-3c)', () => {
    expect(SHORT_CREDIT).toStrictEqual({
      swissaltiregio: 'swissALTIRegio, swisstopo',
      'bev-als-dtm': 'ALS DTM, BEV, CC BY 4.0',
      'copernicus-glo-90': 'Copernicus DEM GLO-90',
    });
  });

  it('pins the /sources intro (row 5b)', () => {
    expect(SOURCES_INTRO).toBe(
      'The maps on this site are drawn from three elevation models. Each entry gives the credit exactly as its licence asks, the licence itself, what was done to the data and the maps that use it.'
    );
  });

  it("names swissALTIRegio's licence as approved and links swisstopo's terms (rows 6a, 6b)", () => {
    expect(entry('swissaltiregio').licence).toStrictEqual({
      name: 'swisstopo terms of use for free geodata and geoservices (OGD)',
      href: 'https://www.swisstopo.admin.ch/en/conditions-geodata',
    });
  });

  it("states swissALTIRegio's changes as approved: cut at its native 10 m grid, not resampled (row 6c)", () => {
    expect(entry('swissaltiregio').changes).toStrictEqual([
      "Cut to each map's extent at its native 10 m grid; contours every 100 m and a hillshade derived; modified.",
    ]);
  });

  it("pins BEV's licence and changes (rows 6d, 6e)", () => {
    expect(entry('bev-als-dtm').licence).toStrictEqual({
      name: 'CC BY 4.0',
      href: 'https://creativecommons.org/licenses/by/4.0/',
    });
    expect(entry('bev-als-dtm').changes).toStrictEqual([
      'Resampled to a 10 m grid; contours every 100 m and a hillshade derived; modified.',
      'Edition 15 September 2025, the date BEV created the dataset, not a survey date.',
    ]);
  });

  it("pins GLO-90's licence and changes (rows 6f, 6g)", () => {
    expect(entry('copernicus-glo-90').licence).toStrictEqual({
      name: 'Licence for COP-DEM-GLO-90-F Global 90m Full, Free & Open',
      href: 'https://dataspace.copernicus.eu/sites/default/files/media/files/2025-06/copernicus_contributing_mission_data_access_v2_cop_dem_licenses.pdf',
    });
    expect(entry('copernicus-glo-90').changes).toStrictEqual([
      'Resampled to a coarser grid covering the Alps; contours every 1,000 m derived; modified.',
    ]);
  });

  it('pins the Used on labels that are not region headings (row 6h)', () => {
    const isRegionPage = (u: SourceEntry['usedOn'][number]) =>
      'href' in u && u.href.startsWith('/photos/regions/');
    const plain = SOURCES.flatMap((s) => s.usedOn.filter((u) => !isRegionPage(u)));
    expect(plain.map((u) => u.label)).toStrictEqual(['The footer of every page', 'Alps overview']);
  });
});
