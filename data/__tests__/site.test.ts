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

const ORIGIN_SHAPE = /^https:\/\/[a-z0-9.-]+[a-z0-9]$/;

describe('site.url (D-13)', () => {
  it('is an https origin with no trailing slash, path or port', () => {
    expect(site.url).toMatch(ORIGIN_SHAPE);
  });

  it('names neither localhost nor example.com', () => {
    expect(site.url).not.toMatch(/localhost/i);
    expect(site.url).not.toMatch(/example\.com/i);
  });
});
