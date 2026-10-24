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
import { DemoCommandSchema, ProjectSchema } from '@/data/schemas/project';
import { toLegacyHighlights } from '@/lib/legacy-highlights';
import { RISK_BANDS, isScoreInLevel } from '@/lib/trail-grade';

const fixture = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'data/__tests__/fixtures/legacy-highlights.json'),
    'utf8'
  )
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

/**
 * D-22: every CLI_X demo command carries the riskScore Tim read off real CLI_X
 * output at the 08-03 checkpoint. His reply gave scores only, so each level is
 * the band his confirmed rule puts the score in.
 */
describe('CLI_X demo command risk (D-22)', () => {
  const demoCommands = () => {
    const p = bySlug('clix-cli');
    if (p.slug !== 'clix-cli') throw new Error('expected clix-cli');
    return p.demoCommands;
  };
  const without = (o: object, key: string) =>
    Object.fromEntries(Object.entries(o).filter(([k]) => k !== key));

  test('clix-cli demo commands carry the riskScores Tim reported', () => {
    expect(demoCommands().map((c) => [c.output, c.riskScore, c.riskLevel])).toEqual([
      ['find . -name "*.py" -size +1M -ls', 0.05, 'low'],
      ['df -h', 0.15, 'low'],
      ['tar -czf documents_backup_$(date +%Y%m%d).tar.gz ~/Documents/', 0.29, 'low'],
      ['pkill -f chrome', 0.87, 'critical'],
    ]);
  });

  test("every demo command's riskScore lies in [0, 1] and in its riskLevel band", () => {
    for (const c of demoCommands()) {
      expect(c.riskScore).toBeGreaterThanOrEqual(0);
      expect(c.riskScore).toBeLessThanOrEqual(1);
      expect(isScoreInLevel(c.riskScore, c.riskLevel)).toBe(true);
    }
  });

  test('DemoCommandSchema rejects a command without riskScore', () => {
    expect(DemoCommandSchema.safeParse(without(demoCommands()[0], 'riskScore')).success).toBe(
      false
    );
  });

  test('DemoCommandSchema rejects a command without riskLevel', () => {
    expect(DemoCommandSchema.safeParse(without(demoCommands()[0], 'riskLevel')).success).toBe(
      false
    );
  });

  test('DemoCommandSchema rejects a riskScore outside [0, 1]', () => {
    const c = demoCommands()[0];
    expect(DemoCommandSchema.safeParse({ ...c, riskScore: 1.01 }).success).toBe(false);
    expect(DemoCommandSchema.safeParse({ ...c, riskScore: -0.01 }).success).toBe(false);
  });

  test("the risk-scale block's bands equal RISK_BANDS", () => {
    const block = bySlug('clix-cli').highlights.find((b) => b.kind === 'risk-scale');
    if (!block || block.kind !== 'risk-scale') throw new Error('no risk-scale block');
    expect(block.bands).toEqual(RISK_BANDS.map(({ level, min, max }) => ({ level, min, max })));
  });
});

describe('toLegacyHighlights', () => {
  test.each(['clix-cli', 'clix-website'])(
    '%s reproduces the HEAD highlights literal, key order included',
    (slug) => {
      const p = bySlug(slug);
      expect(JSON.stringify(toLegacyHighlights(p.highlights))).toBe(JSON.stringify(fixture[slug]));
    }
  );
});
