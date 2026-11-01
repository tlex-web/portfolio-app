/**
 * Project data (DATA-07; Phase 11 D-12, D-15, D-22, D-23, D-24, D-26, D-30;
 * ENG-01, ENG-03, ENG-04).
 *
 * `data/projects.ts` holds box then coin-flip and parses against
 * `ProjectSchema`, a strict discriminated union on `slug`. The retired v1
 * fields (features, highlights, pricing, risk level and score) fail a
 * strict parse. The captured strings carry no machine paths or escapes, and
 * coin-flip's public copy reveals nothing from its private repository.
 */
import { projects } from '@/data/projects';
import { roadmapItems } from '@/data/roadmap';
import { DemoCommandSchema, ProjectSchema } from '@/data/schemas/project';

const box = projects.find((p) => p.slug === 'box');
const coinFlip = projects.find((p) => p.slug === 'coin-flip');
if (!box || box.slug !== 'box') throw new Error('no box project');
if (!coinFlip || coinFlip.slug !== 'coin-flip') throw new Error('no coin-flip project');

/** Drive letters, UNC prefixes, home directories and AppData (RESEARCH "Data tests"). */
const ABSOLUTE = /[A-Za-z]:[\\/]|\\\\|\/Users\/|AppData|%USERPROFILE%|~[\\/]/;

/** D-23: issue-style IDs, constant identifiers, method calls and source paths. */
const PRIVATE_PATTERNS = [
  /\b[A-Z][A-Z0-9]{0,5}-\d{1,3}\b/,
  /\b[A-Z][A-Z0-9]+_[A-Z0-9_]+\b/,
  /\b[a-z]+[A-Z]\w*\(/,
  /[\w-]+\/[\w./-]+\.(kt|kts|java|xml|gradle|sh|py)\b/,
];

/** D-30: coin-flip is never described as finished or downloadable. */
const D30_WORDS = ['finished', 'polished', 'store-ready', 'available on Google Play', 'download'];

/** UI-SPEC voice rules: phrases no project copy may use. */
const VOICE_BANNED = ['enterprise-grade', 'blazing fast', '100% pass rate', 'WCAG compliant'];

/** Every captured string on box: terminal lines and outputs, the Safety preview. */
const capturedStrings = (): string[] => [
  ...(box.demo?.commands ?? []).flatMap((c) => [c.input, c.output]),
  ...(box.safety?.capture ? [box.safety.capture.input, box.safety.capture.output] : []),
];

const wordBounded = (phrase: string) =>
  new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

describe('ProjectSchema', () => {
  test('both projects parse against ProjectSchema', () => {
    for (const p of projects) expect(() => ProjectSchema.parse(p)).not.toThrow();
  });

  test('the projects are box then coin-flip (ENG-01 order)', () => {
    expect(projects.map((p) => p.slug)).toEqual(['box', 'coin-flip']);
  });

  test.each(['features', 'highlights', 'pricing'])(
    'a project carrying %s fails the strict parse (D-15)',
    (key) => {
      for (const p of projects) {
        expect(ProjectSchema.safeParse({ ...p, [key]: [] }).success).toBe(false);
      }
    }
  );

  test.each([
    ['riskScore', 0.05],
    ['riskLevel', 'low'],
  ])('a demo command carrying %s fails the strict parse (D-24)', (key, value) => {
    const command = box.demo?.commands[0];
    if (!command) throw new Error('box has no demo command');
    expect(DemoCommandSchema.safeParse({ ...command, [key]: value }).success).toBe(false);
    const demo = { ...box.demo, commands: [{ ...command, [key]: value }] };
    expect(ProjectSchema.safeParse({ ...box, demo }).success).toBe(false);
  });

  test('a demo block on coin-flip fails the strict parse', () => {
    expect(ProjectSchema.safeParse({ ...coinFlip, demo: box.demo }).success).toBe(false);
  });
});

describe('Repository links (D-12)', () => {
  test('box links to its public repository and nothing else', () => {
    expect(box.links).toEqual({ github: 'https://github.com/tlex-web/box' });
  });

  test('coin-flip has no links key, a private repository and no link to it', () => {
    expect('links' in coinFlip).toBe(false);
    expect(coinFlip.repository).toBe('private');
    expect(JSON.stringify(coinFlip)).not.toContain('github.com/tlex-web/coin-flip');
    expect(
      ProjectSchema.safeParse({ ...coinFlip, links: { github: 'https://example.com' } }).success
    ).toBe(false);
  });
});

describe('Captured strings (D-25, D-26, 08 D-22)', () => {
  test('box has at least two demo commands, each with a note', () => {
    const commands = box.demo?.commands ?? [];
    expect(commands.length).toBeGreaterThanOrEqual(2);
    for (const c of commands) expect(c.note?.trim()).toBeTruthy();
  });

  test('no captured string carries an absolute or home path', () => {
    const strings = capturedStrings();
    expect(strings.length).toBeGreaterThan(0);
    for (const s of strings) expect(s).not.toMatch(ABSOLUTE);
  });

  test('no captured string carries an ANSI escape', () => {
    for (const s of capturedStrings()) expect(s).not.toContain('\u001b');
  });
});

/**
 * Tim's approved box copy as the 11-02 packet drafted it, inline-code
 * backticks included (11-02-SUMMARY "Resolved values": copy.problem-box,
 * copy.pipeline-box stage 3, copy.safety-intro-box, copy.force-line). The
 * renderers set each backticked span as code (orchestrator-added task in
 * 11-14, Tim's "yes", 2026-11-01); the wording is unchanged.
 */
const APPROVED_BOX_CODE_COPY = {
  problem:
    'box gathers the small jobs I do in PowerShell 7 on Windows into one command: hashing a file, making a UUID, flattening a folder, renaming a batch of files. v1.0 put 23 tools in one Rust binary. v2.0 made them scriptable: JSON output that `ConvertFrom-Json` reads, `--clip` for the clipboard, and defaults in a config file.',
  output: 'Plain text for people, `--json` for the next command, `--clip` for the clipboard.',
  safetyIntro:
    'Commands that delete, move or rename files run as a preview by default: box shows what it would do and renames, moves or deletes nothing until you add `--force`. box checks the whole job before it changes the first file.',
  forceLine:
    'With `--force`, box would rename `hut.txt` to `hut.md` and `zmutt.txt` to `zmutt.md`, and leave the `copies` folder alone.',
};

/** Every string in a value, depth first. */
const stringsIn = (value: unknown): string[] =>
  typeof value === 'string'
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(stringsIn)
      : value && typeof value === 'object'
        ? Object.values(value).flatMap(stringsIn)
        : [];

describe('Inline code in approved copy (11-02 packet, 11-14)', () => {
  test("box's code-bearing copy is byte-identical to the approved packet drafts", () => {
    expect(box.problem).toEqual([APPROVED_BOX_CODE_COPY.problem]);
    expect(box.pipeline?.stages.find((s) => s.name === 'Output')?.description).toBe(
      APPROVED_BOX_CODE_COPY.output
    );
    expect(box.safety?.intro).toBe(APPROVED_BOX_CODE_COPY.safetyIntro);
    expect(box.safety?.forceLine).toBe(APPROVED_BOX_CODE_COPY.forceLine);
  });

  test('backticks appear only in the copy the renderers set as code, always paired', () => {
    // The verbatim captures (terminal and preview) are printed as captured,
    // never tokenized, so they are left out.
    const coded = projects.flatMap((p) => [
      ...(p.problem ?? []),
      ...(p.pipeline?.stages ?? []).flatMap((s) => (s.description ? [s.description] : [])),
      ...(p.slug === 'box' ? [p.safety?.intro, p.safety?.forceLine] : []).filter(
        (t): t is string => Boolean(t)
      ),
    ]);
    for (const text of coded) expect((text.match(/`/g) ?? []).length % 2).toBe(0);

    const rest = projects.flatMap((p) =>
      stringsIn({
        ...p,
        problem: undefined,
        pipeline: p.pipeline && { ...p.pipeline, stages: p.pipeline.stages.map((s) => s.name) },
        demo: undefined,
        safety: undefined,
      })
    );
    for (const text of rest) expect(text).not.toContain('`');
  });
});

describe('Copy (D-09, D-23, D-30, ENG-04)', () => {
  test('coin-flip copy reveals no internals (D-23)', () => {
    const text = JSON.stringify(coinFlip);
    for (const re of PRIVATE_PATTERNS) expect(text).not.toMatch(re);
  });

  test.each(D30_WORDS)('coin-flip never says "%s" (D-30)', (word) => {
    expect(JSON.stringify(coinFlip)).not.toMatch(wordBounded(word));
  });

  test('no project uses a voice-banned phrase', () => {
    for (const p of projects) {
      const text = JSON.stringify(p).toLowerCase();
      for (const phrase of VOICE_BANNED) expect(text).not.toContain(phrase.toLowerCase());
    }
  });

  test('every metric tile has a non-empty context line (D-28)', () => {
    for (const p of projects) {
      for (const tile of p.metrics?.tiles ?? []) expect(tile.context.trim()).not.toBe('');
    }
  });

  test('the softened and cut claims never appear as figures (D-09)', () => {
    // claim.cf-network-calls is softened: no tile; claim.box-loc-timeline is cut.
    const labels = projects.flatMap(
      (p) => p.metrics?.tiles.map((t) => t.label.toLowerCase()) ?? []
    );
    expect(labels).not.toContain('network calls');
    expect(JSON.stringify(projects)).not.toMatch(/\blines of code\b|\bLOC\b|\bcommits\b/i);
  });

  test('a metric tile without a context line fails the parse', () => {
    const tiles = [{ key: 'x', label: 'X', value: '1', context: '' }];
    expect(ProjectSchema.safeParse({ ...box, metrics: { tiles } }).success).toBe(false);
  });

  test('no coin-flip metric tile links to a source (D-23)', () => {
    expect(coinFlip.metrics?.tiles.length).toBeGreaterThan(0);
    for (const tile of coinFlip.metrics?.tiles ?? []) expect(tile.sourceUrl).toBeUndefined();
  });
});

describe('Next steps against the route log (N4, D-30, D-32)', () => {
  const steps = projects.flatMap((p) => (p.nextSteps ?? []).map((id) => [p.slug, id] as const));

  test('coin-flip names its remaining work as next steps (D-30)', () => {
    expect(coinFlip.nextSteps?.length).toBeGreaterThan(0);
  });

  test.each(steps)(
    '%s next step %s is a planned or in-progress row of that project in roadmapItems',
    (slug, id) => {
      const row = roadmapItems.find((r) => r.id === id);
      expect(row).toBeDefined();
      expect(['planned', 'in-progress']).toContain(row?.status);
      expect(row?.area).toBe(slug);
    }
  );

  test('box lists no next step while it has no planned row, so the section is omitted (N4)', () => {
    const ahead = roadmapItems.filter((r) => r.area === 'box' && r.status !== 'completed');
    expect(box.nextSteps ?? []).toHaveLength(ahead.length);
  });
});
