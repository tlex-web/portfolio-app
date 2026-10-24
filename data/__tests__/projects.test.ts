/**
 * DATA-07: typed per-project highlights with zero visual change.
 *
 * `data/projects.ts` parses against `ProjectSchema`, a discriminated union on
 * `slug` whose `highlights` are fixed tuples of typed blocks. The page still
 * renders the v1 `ProjectHighlights`, fed by `toLegacyHighlights`; the
 * fixture is today's highlights literal captured from HEAD, and the adapter
 * must reproduce it byte for byte, key order included (RESEARCH Pitfall 13),
 * so /projects/clix-cli and /projects/clix-website render unchanged.
 */
import fs from 'node:fs';
import path from 'node:path';
import { projects } from '@/data/projects';
import { ProjectSchema } from '@/data/schemas/project';
import { toLegacyHighlights } from '@/lib/legacy-highlights';

const fixture = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'data/__tests__/fixtures/legacy-highlights.json'), 'utf8'),
) as Record<string, unknown>;

const bySlug = (slug: string) => {
  const p = projects.find((x) => x.slug === slug);
  if (!p) throw new Error(`no project ${slug}`);
  return p;
};

describe('legacy highlights fixture', () => {
  test('holds exactly the clix-cli and clix-website literals', () => {
    expect(Object.keys(fixture)).toEqual(['clix-cli', 'clix-website']);
  });
});

describe('ProjectSchema', () => {
  test('both projects parse against ProjectSchema', () => {
    for (const p of projects) expect(() => ProjectSchema.parse(p)).not.toThrow();
  });

  test('clix-cli highlights in a different tuple order fail', () => {
    const p = bySlug('clix-cli');
    const [a, b, c, d] = p.highlights as unknown[];
    expect(ProjectSchema.safeParse({ ...p, highlights: [a, c, b, d] }).success).toBe(false);
  });

  test('clix-website with demoCommands fails', () => {
    const cli = bySlug('clix-cli') as { demoCommands?: unknown };
    const web = bySlug('clix-website');
    expect(ProjectSchema.safeParse({ ...web, demoCommands: cli.demoCommands }).success).toBe(false);
  });

  test('clix-cli without demo commands fails', () => {
    const p = bySlug('clix-cli');
    expect(ProjectSchema.safeParse({ ...p, demoCommands: [] }).success).toBe(false);
  });
});

describe('toLegacyHighlights', () => {
  test.each(['clix-cli', 'clix-website'])(
    '%s reproduces the HEAD highlights literal, key order included',
    (slug) => {
      const p = bySlug(slug);
      expect(JSON.stringify(toLegacyHighlights(p.highlights))).toBe(JSON.stringify(fixture[slug]));
    },
  );
});
