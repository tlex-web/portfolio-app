/**
 * SHELL-03, D-13, D-01: the identity record in data/site.ts.
 *
 * - D-13: site.url is the canonical base URL that metadataBase, page canonicals,
 *   sitemap.xml and robots.txt build on. It is an https origin with no trailing
 *   slash and never a local or placeholder host. The shape is host-agnostic so a
 *   later switch to another domain (deferred: www.tlui.de) still passes;
 *   guard:identity enforces the same rule at lint time.
 * - D-01: the contact location is published at 2 decimals at most (about 1 km)
 *   and only as Tim confirmed it (12-01 `## Resolved values`, geo.location).
 */
import { site } from '@/data/site';
import type { Site } from '@/data/types';

const ORIGIN_SHAPE = /^https:\/\/[a-z0-9.-]+[a-z0-9]$/;

/** Read through the Site type, so the optional key is what the Contact panel sees. */
const record: Site = site;

/** True when x carries at most 2 decimal places (about 1 km of latitude). */
const atMostTwoDecimals = (x: number) => Math.round(x * 100) / 100 === x;

describe('site.url (D-13)', () => {
  it('is an https origin with no trailing slash, path or port', () => {
    expect(site.url).toMatch(ORIGIN_SHAPE);
  });

  it('names neither localhost nor example.com', () => {
    expect(site.url).not.toMatch(/localhost/i);
    expect(site.url).not.toMatch(/example\.com/i);
  });
});

describe('site.location (D-01, CONTACT-01)', () => {
  // 12-01 `## Resolved values`, geo.location: supplied,
  // `47.37 N · 8.54 E · Zürich` (Wikipedia "Zurich" infobox, rounded to 2 decimals).
  it('is present, because Tim confirmed the Zürich location', () => {
    expect(record.location).toBeDefined();
    expect(record.location?.name).toBe('Zürich');
  });

  it('stores lat and lon at 2 decimals at most, never more precisely than about 1 km', () => {
    const location = record.location;
    if (!location) return; // absent key: 12-16 leaves out the Location row
    expect(atMostTwoDecimals(location.lat)).toBe(true);
    expect(atMostTwoDecimals(location.lon)).toBe(true);
  });

  it('holds the confirmed coordinates, 47.37 N and 8.54 E', () => {
    expect(record.location?.lat).toBe(47.37);
    expect(record.location?.lon).toBe(8.54);
  });

  it('names a place and cites its source in non-empty strings', () => {
    const location = record.location;
    if (!location) return;
    expect(location.name.trim()).not.toBe('');
    expect(location.source.trim()).not.toBe('');
  });
});
