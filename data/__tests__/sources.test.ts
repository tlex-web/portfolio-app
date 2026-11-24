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
 *   of the import path.
 * - Licences link to their official text over https; "Used on" links only to
 *   /photos or a registry region page, region pages west to east (D-01).
 */
import fs from 'node:fs';
import path from 'node:path';
import { GLO90_LIABILITY, GLO90_NOTICE } from '@/data/schemas/overview';
import { site } from '@/data/site';
import { SHORT_CREDIT, SOURCE_IDS, SOURCES_PAGE, sourceHref } from '@/data/source-credits';
import { SOURCES, SOURCES_INTRO, type SourceEntry } from '@/data/sources';
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
  it('swissALTIRegio prints site.attribution.terrain, the same string', () => {
    expect(entry('swissaltiregio').credit).toStrictEqual([site.attribution.terrain]);
    expect(site.attribution.terrain).toContain('Institut National de l’information');
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
    expect(entry('copernicus-glo-90').usedOn).toEqual([{ label: 'Alps overview', href: '/photos' }]);
  });

  it('states that the BEV edition is a creation date, not a survey date', () => {
    expect(entry('bev-als-dtm').changes).toContain(
      'Edition 15 September 2025, the date BEV created the dataset, not a survey date.'
    );
  });
});
