/**
 * DATA-01 contour serialisation: open runs that never stroke the raster border
 * (RESEARCH Pitfall 1), half-pixel rounding, index contours and a deterministic,
 * script-free SVG (UI-SPEC "Contour band" line styling; threat T-08-02).
 */
import {
  contourSvg,
  isIndexLevel,
  onEdge,
  openRuns,
  roundHalf,
  runToPath,
  type Pt,
} from '@/lib/terrain/contour-paths';

const W = 10;
const H = 6;

/**
 * True when some segment of some run has both endpoints on the same border.
 * Written independently of onEdge, so a broken onEdge cannot hide a frame.
 */
const hasBorderSegment = (runs: Pt[][]) =>
  runs.some((run) =>
    run.some((q, i) => {
      if (i === 0) return false;
      const p = run[i - 1];
      return (
        [0, W].some((b) => p[0] === b && q[0] === b) || [0, H].some((b) => p[1] === b && q[1] === b)
      );
    })
  );

describe('onEdge', () => {
  test.each([
    ['x = 0', [0, 1], [0, 2], true],
    ['x = W', [W, 1], [W, 2], true],
    ['y = 0', [3, 0], [4, 0], true],
    ['y = H', [3, H], [4, H], true],
    ['one endpoint on the border', [0, 1], [1, 2], false],
    ['two different borders (corner cut)', [0, 1], [1, 0], false],
    ['interior', [2, 2], [3, 3], false],
  ] as [string, Pt, Pt, boolean][])('%s -> %s', (_name, p, q, expected) => {
    expect(onEdge(p, q, W, H)).toBe(expected);
  });
});

describe('openRuns (Pitfall 1: no frame round the asset)', () => {
  // d3-contour rings repeat their first point at the end.
  test.each([
    [
      'x = 0',
      [
        [0, 1],
        [0, 3],
        [2, 4],
        [3, 2],
        [0, 1],
      ],
    ],
    [
      'x = W',
      [
        [W, 1],
        [W, 3],
        [8, 4],
        [7, 2],
        [W, 1],
      ],
    ],
    [
      'y = 0',
      [
        [2, 0],
        [5, 0],
        [6, 2],
        [3, 3],
        [2, 0],
      ],
    ],
    [
      'y = H',
      [
        [2, H],
        [5, H],
        [6, 4],
        [3, 3],
        [2, H],
      ],
    ],
    [
      'two borders with a corner',
      [
        [0, 2],
        [0, 0],
        [3, 0],
        [3, 2],
        [0, 2],
      ],
    ],
  ] as [string, Pt[]][])('a ring along %s yields runs with no border segment', (_name, ring) => {
    const { runs, closed } = openRuns(ring, W, H);
    expect(runs.length).toBeGreaterThan(0);
    expect(hasBorderSegment(runs)).toBe(false);
    expect(closed).toBe(false);
  });

  test('a ring that never touches the border stays one closed run', () => {
    const ring: Pt[] = [
      [2, 2],
      [4, 2],
      [4, 4],
      [2, 4],
      [2, 2],
    ];
    expect(openRuns(ring, W, H)).toEqual({ runs: [ring], closed: true });
  });

  test('a ring made only of border segments yields no runs', () => {
    const ring: Pt[] = [
      [0, 0],
      [W, 0],
      [W, H],
      [0, H],
      [0, 0],
    ];
    expect(openRuns(ring, W, H)).toEqual({ runs: [], closed: false });
  });
});

describe('roundHalf', () => {
  test.each([
    [3.26, 3.5],
    [3.24, 3],
    [-0.26, -0.5],
    [7, 7],
    [7.75, 8],
  ])('roundHalf(%s) === %s', (v, expected) => {
    expect(roundHalf(v)).toBe(expected);
  });
});

describe('runToPath', () => {
  test('rounds to half pixels and joins with L', () => {
    expect(
      runToPath(
        [
          { x: 0, y: 0 },
          { x: 1.26, y: 2 },
        ],
        false
      )
    ).toBe('M0 0L1.5 2');
  });

  test('the closed form ends with Z', () => {
    expect(
      runToPath(
        [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 0 },
        ],
        true
      )
    ).toBe('M0 0L1 1L2 0Z');
  });

  test('negative zero prints as 0', () => {
    expect(
      runToPath(
        [
          { x: -0.2, y: 1 },
          { x: 1, y: -0.1 },
        ],
        false
      )
    ).toBe('M0 1L1 0');
  });

  test('fewer than two points draw nothing', () => {
    expect(runToPath([{ x: 1, y: 1 }], false)).toBe('');
    expect(runToPath([], true)).toBe('');
  });
});

describe('isIndexLevel (every 5th interval)', () => {
  test.each([
    [500, 100, 5, true],
    [400, 100, 5, false],
    [2500, 50, 5, true],
    [2550, 50, 5, false],
    [4450, 50, 5, false],
    [4499.9999, 100, 5, true],
    [4500.0000001, 100, 5, true],
  ])('isIndexLevel(%s, %s, %s) === %s', (level, interval, every, expected) => {
    expect(isIndexLevel(level, interval, every)).toBe(expected);
  });
});

describe('contourSvg', () => {
  const input = {
    width: 1100,
    height: 220,
    paths: [
      { d: 'M0 0L1.5 2', index: true },
      { d: 'M3 3L4 4.5Z', index: false },
    ],
  };
  const svg = contourSvg(input);

  test('root element carries the namespace and the viewBox', () => {
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 220">')).toBe(
      true
    );
  });

  test('is exactly the expected serialisation (no whitespace between elements, trailing newline)', () => {
    expect(svg).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 220">' +
        '<g fill="none" stroke="#000" stroke-width="1">' +
        '<path d="M0 0L1.5 2" vector-effect="non-scaling-stroke"/>' +
        '<path d="M3 3L4 4.5Z" vector-effect="non-scaling-stroke" stroke-opacity="0.6"/>' +
        '</g></svg>\n'
    );
  });

  test('contains only svg, g and path elements', () => {
    const tags = new Set([...svg.matchAll(/<\/?([a-zA-Z][\w:-]*)/g)].map((m) => m[1]));
    expect([...tags].sort()).toEqual(['g', 'path', 'svg']);
  });

  test('every path is non-scaling; only non-index paths carry stroke-opacity 0.6', () => {
    const paths = svg.match(/<path [^>]*\/>/g) ?? [];
    expect(paths).toHaveLength(2);
    for (const p of paths) expect(p).toContain('vector-effect="non-scaling-stroke"');
    expect(paths[0]).not.toContain('stroke-opacity');
    expect(paths[1]).toContain('stroke-opacity="0.6"');
  });

  test('has no script, href or on* attribute (T-08-02)', () => {
    expect(svg).not.toMatch(/<script/i);
    expect(svg).not.toMatch(/href/i);
    expect(svg).not.toMatch(/\son[a-z]+\s*=/i);
  });

  test('is byte-identical across two calls with the same input', () => {
    expect(contourSvg(input)).toBe(svg);
  });

  test.each([
    ['a quote', 'M0 0" onload="alert(1)'],
    ['markup', 'M0 0<script>'],
    ['a letter other than M, L or Z', 'M0 0C1 1 2 2 3 3'],
  ])('rejects path data containing %s', (_name, d) => {
    expect(() => contourSvg({ width: 4, height: 2, paths: [{ d, index: true }] })).toThrow(
      TypeError
    );
  });

  test.each([
    [0, 2],
    [4, -1],
    [Number.NaN, 2],
  ])('rejects a %s x %s canvas', (width, height) => {
    expect(() => contourSvg({ width, height, paths: [] })).toThrow(RangeError);
  });
});
