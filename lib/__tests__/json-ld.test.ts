/**
 * @jest-environment node
 */
/**
 * JSON-LD (SEO-04; 17 D-16, D-17, D-18, D-20, D-21). The Wave 0 test every later
 * JSON-LD block extends (17-13 photo and region pages, 17-14 case studies).
 *
 * - jsonLdHtml is the one serializer: it escapes every '<' as \u003c, changes no
 *   other character, and JSON.parse of its output returns the original data. A
 *   fixture name holding a </script><script> breakout round-trips with no raw '<'
 *   and stays inside one ld+json block (T-17-06).
 * - siteGraph is a schema.org Graph with one Person and one WebSite. The Person
 *   holds name, role, site URL and the two profile links only (D-20, T-17-07).
 *   The WebSite refers to the Person by @id, credits site.name (D-18) and carries
 *   the footer's printed rights line as its copyrightNotice (D-16, D-17).
 * - Per-node rule (D-16, Person exemption): every node that is not a Person has
 *   non-empty creator, copyrightNotice and creditText; the Person has none of the
 *   three, because schema.org defines them on CreativeWork and a Person is not a
 *   CreativeWork.
 * - No JSON-LD object at any depth carries license or acquireLicensePage (the
 *   2026-11-12 decision), email, address or homeLocation; the serialized text holds
 *   neither site.email nor site.location.name.
 * - Source assertions: lib/json-ld.ts imports schema-dts through `import type`
 *   only (D-21, 0 runtime bytes), and the (site) layout renders a native data
 *   block with no nonce attribute and no next/script (D-16, T-17-08).
 *
 * keysDeep and blocksOf are the helpers 17-13 and 17-14 reuse in this file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { site } from '@/data/site';
import { PERSON_ID, WEBSITE_ID, jsonLdHtml, siteGraph, siteRights } from '@/lib/json-ld';

type Node = Record<string, unknown>;

/** Every object key at any depth (arrays are walked, their indices are not keys). */
export function keysDeep(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => keysDeep(item));
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Node).flatMap(([key, child]) => [key, ...keysDeep(child)]);
  }
  return [];
}

/** The parsed body of every <script type="application/ld+json"> in an HTML string. */
export function blocksOf(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern = /<script\b[^>]*\btype="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  for (const match of html.matchAll(pattern)) blocks.push(JSON.parse(match[1]));
  return blocks;
}

const BREAKOUT = '</script><script>alert(1)</script>';
const fixture = { '@context': 'https://schema.org', '@type': 'Person', name: BREAKOUT } as const;

function graphNodes(): Node[] {
  return siteGraph()['@graph'] as unknown as Node[];
}

function nodeOfType(type: string): Node {
  const nodes = graphNodes().filter((node) => node['@type'] === type);
  expect(nodes).toHaveLength(1);
  return nodes[0];
}

const read = (...segments: string[]) =>
  fs.readFileSync(path.join(process.cwd(), ...segments), 'utf8');

describe('jsonLdHtml, the one serializer (D-16, T-17-06)', () => {
  it.each([
    ['the </script> breakout fixture', fixture],
    ['siteGraph()', siteGraph()],
  ])('escapes every "<" in %s and parses back to the same data', (_label, data) => {
    const html = jsonLdHtml(data);
    expect(html).not.toContain('<');
    expect(JSON.parse(html)).toEqual(data);
  });

  it('changes no character except "<" (to \\u003c)', () => {
    const html = jsonLdHtml(fixture);
    expect(html).toContain('\\u003c/script>');
    expect(html.replace(/\\u003c/g, '<')).toBe(JSON.stringify(fixture));
  });

  it('keeps the breakout inside one ld+json block in the page HTML', () => {
    const page = `<body><script type="application/ld+json">${jsonLdHtml(fixture)}</script><p>after</p></body>`;
    const blocks = blocksOf(page);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual(fixture);
    expect((blocks[0] as Node).name).toBe(BREAKOUT);
  });
});

describe('siteGraph: the site-wide Person and WebSite (D-16, D-18, D-20)', () => {
  it('is a schema.org Graph with exactly one Person and one WebSite', () => {
    const graph = siteGraph();
    expect(graph['@context']).toBe('https://schema.org');
    expect(
      graphNodes()
        .map((node) => node['@type'])
        .sort()
    ).toEqual(['Person', 'WebSite']);
  });

  it('describes the Person by name, role, site and the two profiles only', () => {
    expect(nodeOfType('Person')).toEqual({
      '@type': 'Person',
      '@id': PERSON_ID,
      name: site.name,
      jobTitle: site.role,
      url: site.url,
      sameAs: [site.links.github, site.links.linkedin],
    });
    expect(PERSON_ID).toBe(site.url + '/#person');
  });

  it('names the WebSite and refers its author and creator to the Person by @id', () => {
    const website = nodeOfType('WebSite');
    expect(website['@id']).toBe(WEBSITE_ID);
    expect(WEBSITE_ID).toBe(site.url + '/#website');
    expect(website.name).toBe(site.name);
    expect(website.url).toBe(site.url);
    expect(website.author).toEqual({ '@id': PERSON_ID });
    expect(website.creator).toEqual({ '@id': PERSON_ID });
  });

  it("credits the WebSite to the Person's name, which is site.name (D-18)", () => {
    const website = nodeOfType('WebSite');
    expect(website.creditText).toBe(nodeOfType('Person').name);
    expect(website.creditText).toBe(site.name);
  });

  it('carries the footer rights line as the copyrightNotice (D-16, D-17)', () => {
    const footerLine = '© ' + new Date().getFullYear() + ' ' + site.name + '. All rights reserved.';
    expect(siteRights()).toBe(footerLine);
    expect(nodeOfType('WebSite').copyrightNotice).toBe(footerLine);
  });
});

describe('per-node rule: creator, copyrightNotice and creditText (D-16, Person exemption)', () => {
  const RIGHTS_KEYS = ['creator', 'copyrightNotice', 'creditText'] as const;

  it('has at least one non-Person node to check', () => {
    expect(graphNodes().filter((node) => node['@type'] !== 'Person').length).toBeGreaterThan(0);
  });

  it.each(RIGHTS_KEYS.map((key) => [key]))('every non-Person node has a non-empty %s', (key) => {
    for (const node of graphNodes().filter((n) => n['@type'] !== 'Person')) {
      const value = node[key];
      expect(value).toBeTruthy();
      if (typeof value === 'string') expect(value.trim()).not.toBe('');
    }
  });

  it.each(RIGHTS_KEYS.map((key) => [key]))(
    'the Person node has no %s (not a CreativeWork)',
    (key) => {
      expect(Object.keys(nodeOfType('Person'))).not.toContain(key);
    }
  );
});

describe('disclosure: no license, no email, no location (D-20, the 2026-11-12 decision)', () => {
  it.each(
    ['license', 'acquireLicensePage', 'email', 'address', 'homeLocation'].map((key) => [key])
  )('siteGraph holds no %s key at any depth', (key) => {
    expect(keysDeep(siteGraph())).not.toContain(key);
  });

  it('keysDeep finds a key nested in an array (the walk reaches every depth)', () => {
    expect(keysDeep({ a: [{ b: { license: 'x' } }] })).toEqual(['a', 'b', 'license']);
  });

  it('serializes neither site.email nor site.location.name', () => {
    const html = jsonLdHtml(siteGraph());
    expect(html).not.toContain(site.email);
    expect(html).not.toContain(site.location.name);
  });
});

describe('source rules (D-16, D-21)', () => {
  it('imports schema-dts through import type only', () => {
    const lines = read('lib', 'json-ld.ts').split('\n');
    expect(lines.some((line) => /^import type .*from 'schema-dts'/.test(line))).toBe(true);
    expect(lines.filter((line) => /^import (?!type).*schema-dts/.test(line))).toEqual([]);
  });

  it('renders the site graph in the (site) layout as a native data block with no nonce and no next/script', () => {
    const layout = read('app', '(site)', 'layout.tsx');
    expect(layout).toContain('type="application/ld+json"');
    expect(layout).toContain('jsonLdHtml(siteGraph())');
    expect(layout).not.toMatch(/\bnonce\s*=/);
    expect(layout).not.toMatch(/from ['"]next\/script['"]/);
  });
});
