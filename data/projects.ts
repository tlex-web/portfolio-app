import { Project } from './types';

/**
 * The site's two projects, box then coin-flip (D-22; ENG-01 order).
 *
 * Every string is a fact settled in 11-CONTEXT (names per default.N1, slugs,
 * kicker versions, trail ids, the box repository URL) or a value Tim approved
 * on 2026-11-01, copied from a 'supplied' row of 11-02-SUMMARY.md "Resolved
 * values" (D-16, D-21). An element without an approved value is left out,
 * never filled. Captures (the terminal commands and the Safety preview) are
 * copied byte for byte from "Approved captures (verbatim)"; nothing in them
 * is trimmed or reworded (08 D-22). Prose keeps Tim's wording and, in box's
 * Problem paragraph, Output stage, Safety intro and --force line, the review
 * copy's inline-code backticks exactly as drafted: InlineCode sets each
 * backticked token as code and never shows the backticks (11-14, Tim's "yes",
 * 2026-11-01). Backticks appear nowhere else in the prose (data test).
 *
 * coin-flip's repository is private (D-12, D-23): its entry carries only
 * approved public wording, no link and nothing copied from the repository.
 */

/** copy.projects-intro: the paragraph under the /projects h1. */
export const projectsIntro =
  'Two things I build: box, a command-line toolkit for PowerShell 7 written in Rust, and coin-flip, an Android app that tosses a fair 3D coin. Each route opens a case study.';

export const projects: Project[] = [
  {
    slug: 'box',
    name: 'box',
    pitch:
      'Twenty-three command-line tools in one Rust binary, built for PowerShell 7. Anything destructive previews first.',
    outcome:
      'v2.0 shipped on 14 July 2026: 23 tools in one binary, JSON output for scripts, and a preview before anything destructive.',
    kicker: { version: 'v2.0', status: 'shipped' },
    route: 'hoernliweg-27',
    links: { github: 'https://github.com/tlex-web/box' },
    problem: [
      'box gathers the small jobs I do in PowerShell 7 on Windows into one command: hashing a file, making a UUID, flattening a folder, renaming a batch of files. v1.0 put 23 tools in one Rust binary. v2.0 made them scriptable: JSON output that `ConvertFrom-Json` reads, `--clip` for the clipboard, and defaults in a config file.',
    ],
    pipeline: {
      stages: [
        {
          name: 'Settings',
          description:
            'A flag beats an environment variable, which beats the config file, which beats the built-in default.',
        },
        { name: 'Command', description: 'One of the 23 tools runs with those settings.' },
        {
          name: 'Output',
          description:
            'Plain text for people, `--json` for the next command, `--clip` for the clipboard.',
        },
      ],
    },
    safety: {
      intro:
        'Commands that delete, move or rename files run as a preview by default: box shows what it would do and renames, moves or deletes nothing until you add `--force`. box checks the whole job before it changes the first file.',
      capture: {
        command: 'bulk-rename',
        input: "box bulk-rename ./sample '^(.*)\\.txt$' '$1.md'",
        output: [
          '  - copies (skipped: directory)',
          '  ~ hut.txt   -> hut.md',
          '  ~ zmutt.txt -> zmutt.md',
          '',
          'Dry run: 2 to rename, 0 unchanged, 1 skipped. Re-run with --force to apply.',
        ].join('\n'),
      },
      forceLine:
        'With `--force`, box would rename `hut.txt` to `hut.md` and `zmutt.txt` to `zmutt.md`, and leave the `copies` folder alone.',
    },
    metrics: {
      releaseLine: 'Measured at v2.0',
      tiles: [
        {
          key: 'tools',
          label: 'Tools',
          value: '23',
          context: 'Tools in the README at v2.0, plus config and completions',
          sourceUrl: 'https://github.com/tlex-web/box#readme',
        },
        {
          key: 'tests',
          label: 'Tests',
          value: '507',
          context: 'At the v2.0 milestone',
          sourceUrl: 'https://github.com/tlex-web/box/blob/main/.planning/MILESTONES.md',
        },
        {
          key: 'binary',
          label: 'Binary',
          value: '1',
          context: 'All tools ship in one executable',
          sourceUrl: 'https://github.com/tlex-web/box#readme',
        },
      ],
    },
    demo: {
      intro: 'Four commands I ran with box, replayed with the output they returned.',
      commands: [
        {
          input: 'box hash sample/hut.txt',
          output:
            'a113912ef20f332e35c86601e1c90df90a110e260827f0ae9f861611927ecf1d  sample/hut.txt',
          note: 'BLAKE3 is the default hash.',
        },
        {
          input: 'box uuid --json',
          output: [
            '{',
            '  "results": [',
            '    {',
            '      "uuid": "e8487bbf-77c8-4aa7-86c6-76bf11e8c9e2",',
            '      "version": "v4"',
            '    }',
            '  ],',
            '  "count": 1',
            '}',
          ].join('\n'),
          note: 'With --json, a command prints one JSON document and nothing else.',
        },
        {
          input:
            'box du ./sample --json | ConvertFrom-Json | Select-Object -ExpandProperty results | Sort-Object size -Descending | Select-Object -First 3 name, size',
          output: [
            '',
            'name      size',
            '----      ----',
            'copies      20',
            'hut.txt     20',
            'zmutt.txt   14',
            '',
          ].join('\n'),
          note: 'ConvertFrom-Json reads it, so the rest is plain PowerShell.',
        },
        {
          input: "box color '#70d5ed'",
          output: [
            '  Hex   : #70D5ED',
            '  RGB   : rgb(112, 213, 237)',
            '  Tuple : 112 213 237',
            '  HSL   : hsl(192, 78%, 68%)',
            '  Name  : ~skyblue',
            '',
            '  ██████████',
          ].join('\n'),
          note: 'Hex in; RGB, HSL and a color name out.',
        },
      ],
    },
    stack: {
      groups: [
        { label: 'Language', items: ['Rust 2021'] },
        {
          label: 'Crates',
          items: ['clap', 'serde_json', 'blake3', 'regex', 'rayon', 'chrono', 'image', 'crossterm'],
        },
        { label: 'Platform', items: ['Windows', 'PowerShell 7'] },
      ],
    },
  },
  {
    slug: 'coin-flip',
    name: 'coin-flip',
    pitch:
      'A 3D coin toss for Android that settles a fair result before the coin leaves your hand, with no permissions and no network.',
    outcome:
      'v1.0 has run on my own device since 9 August 2026. A smoother toss and a Play Store release come next.',
    kicker: { version: 'v1', status: 'on device' },
    route: 'zmutt-2',
    repository: 'private',
    problem: [
      'coin-flip is an Android app for one job: settling a call with a coin toss you can trust. The result is drawn first, and the 3D toss is choreographed to land on it. It asks for no permissions and works offline, and the result is announced to TalkBack. v1 runs on my own device, but it is not done: smoothing the toss and the camera follow, and then a Play Store release, are still ahead.',
    ],
    pipeline: {
      intro:
        'The result is decided first. A cryptographic 50/50 draw picks heads or tails before the toss, and the animation is choreographed to land on it.',
      in: 'a tap',
      out: 'a fair result, felt and announced',
      stages: [
        { name: 'Fair draw', description: 'A cryptographic 50/50 draw picks heads or tails.' },
        {
          name: 'Choreographed toss',
          description: 'The 3D toss is choreographed to land on the drawn result.',
        },
        { name: 'Landing and settle', description: 'The coin comes to rest on the drawn face.' },
        {
          name: 'Haptic pulse and announcement',
          description: 'A short pulse, and TalkBack announces the result.',
        },
      ],
    },
    privacy: {
      intro: 'coin-flip keeps everything on the device.',
      facts: [
        'No permissions: the release build asks for none.',
        'Fully offline: no internet permission and no remote services.',
        'No ads, no trackers, no accounts.',
      ],
    },
    metrics: {
      releaseLine: 'Checked on the v1.0 release build',
      tiles: [
        {
          key: 'permissions',
          label: 'Permissions',
          value: '0',
          context: 'Checked on the release APK',
        },
        {
          key: 'result-split',
          label: 'Result split',
          value: '50/50',
          context: 'A cryptographic draw decides each result',
        },
      ],
    },
    clip: {
      id: 'coin-flip-toss',
      intro: 'One toss, recorded from the screen of my own device.',
      description:
        'A coin lies flat on a dark screen. About a second and a half in, it is flipped: it rises toward the viewer, turns over several times, then drops back and lands flat. It comes to rest face up, and the word HEADS appears below it.',
    },
    stack: {
      groups: [
        { label: 'Language', items: ['Kotlin'] },
        { label: 'Platform', items: ['native Android'] },
      ],
    },
    nextSteps: ['coin-flip-v1-1', 'coin-flip-play-store'],
  },
];
