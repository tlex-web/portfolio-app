/**
 * The frame-budget policy under automation (D-18; Tim's 09-11 "A: measure-only
 * flag (Recommended)", extended to phones by his 09-13 "B1: extend option A
 * (Recommended)").
 *
 * CI's SwiftShader measures the 50 ms budget as noise (the 412 x 839 verdict
 * went 'ok' at 41.1 ms in one 09-13 run and 'decline' at 80.7 ms in the next),
 * so a test that needs the canvas in '3d' opts into the measure-only flag
 * (e2e/helpers/webgl.ts budgetMeasureOnly): the verdict is still measured and
 * marked, a decline acts on nothing (since 09-15 also the context-loss and
 * hidden-tab burst tests, WR-02 and WR-01). Only the tests that are about the
 * budget keep it real: both 'records the frame-budget verdict' tests and 'a slow
 * device declines to the poster'. The HOME-08 perf contexts opt in, so their
 * mode '3d' means the stage stayed 3D. Real visitors never set the flag, and
 * FRAME_BUDGET_DEFAULTS stays at 50 ms (lib/__tests__/frame-budget.test.ts).
 *
 * This reads the spec sources, so a new e2e in e2e/home-canvas.spec.ts has to
 * be classified here: a deliberate choice between the real budget and
 * measure-only, never an accident of which machine ran it.
 */
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

type Classified = { title: string; measureOnly: boolean };

/**
 * Every Playwright `test(...)` in a spec source, in order: its title (without
 * the project tag) and whether its body awaits budgetMeasureOnly(page) as a
 * statement of its own, so a conditional call (a table row that may skip it)
 * does not count. A body runs to the next `test(` or `test.describe(`.
 */
function classify(source: string): Classified[] {
  const starts = [...source.matchAll(/(?<![.\w])test(?:\.describe)?\(\s*(`[^`]*`|'[^']*')/g)];
  return starts.flatMap((match, i) => {
    if (match[0].includes('.describe')) return [];
    const end = i + 1 < starts.length ? starts[i + 1].index : source.length;
    const body = source.slice(match.index, end);
    return [
      {
        title: match[1].slice(1, -1).replace(/ @chromium-only$/, ''),
        measureOnly: /^\s*await budgetMeasureOnly\(page\);/m.test(body),
      },
    ];
  });
}

const canvasTests = classify(read('e2e/home-canvas.spec.ts'));
const flagOf = (title: string) =>
  canvasTests.filter((t) => t.title === title).map((t) => t.measureOnly);

/**
 * The 412 x 839 3D tests that opt into measure-only: those CI run 40190531971
 * declined to the poster (09-13), the context-loss test (WR-02, 09-15: a
 * decline would race its loseContext()) and the hidden-tab burst test (WR-01,
 * 09-15: its marks are the proof, a decline must not act).
 */
const PHONE_3D = [
  'contour lines are drawn',
  'smoke at three ascent positions',
  'waypoint 2 lights its 3D pin',
  'at ${width} x ${height}', // summit frame shows every waypoint, and summit pins clear the plaque
  'a canvas revealed while stationary lights its 3D pin',
  'lights a clear 3D pin beside its card at ${width} x ${height}', // md stages (G-09-3 a, 09-21)
  'context loss falls back to the poster',
  'draws nothing at rest',
  'draws nothing off-screen',
  'pauses while the tab is hidden',
  'a tab hidden during the reveal burst restarts it at device scale ${scale}',
  'a remount returns to 3D',
];

/** The tests that are about the budget: they must see the real one. */
const REAL_BUDGET = [
  'a slow device declines to the poster',
  'records the frame-budget verdict at ${width} x ${height}',
];

describe('frame-budget policy under automation (B1)', () => {
  it.each(PHONE_3D)('"%s" opts into measure-only', (title) => {
    const flags = flagOf(title);
    expect(flags.length).toBeGreaterThan(0);
    expect(flags).toEqual(flags.map(() => true));
  });

  it.each(REAL_BUDGET)('"%s" keeps the real budget', (title) => {
    expect(flagOf(title)).toEqual([false]);
  });

  it('classifies every home-canvas test, in order', () => {
    expect(canvasTests).toEqual([
      { title: 'canvas fades in over the poster at p = 0', measureOnly: true },
      { title: 'contour lines are drawn', measureOnly: true },
      { title: '${width} px loads the ${grid} heightmap', measureOnly: false },
      { title: 'no worker and no CSP violation', measureOnly: true },
      { title: 'reveal keeps the layout', measureOnly: true },
      { title: 'a load abandoned for reduced motion reveals nothing', measureOnly: false },
      { title: 'a late canvas reveals at the current progress', measureOnly: true },
      { title: 'smoke at three ascent positions', measureOnly: true },
      { title: 'pins hand over at the reveal', measureOnly: true },
      { title: 'waypoint 2 lights its 3D pin', measureOnly: true },
      { title: 'at ${width} x ${height}', measureOnly: true }, // summit frame shows every waypoint
      { title: 'at ${width} x ${height}', measureOnly: true }, // summit pins clear the plaque
      { title: 'route clears the terrain', measureOnly: false },
      { title: 'a canvas revealed while stationary lights its 3D pin', measureOnly: true },
      { title: 'lights a clear 3D pin beside its card at ${width} x ${height}', measureOnly: true },
      { title: 'context loss falls back to the poster', measureOnly: true },
      { title: 'draws nothing at rest', measureOnly: true },
      { title: 'draws nothing off-screen', measureOnly: true },
      { title: 'pauses while the tab is hidden', measureOnly: true },
      {
        title: 'a tab hidden during the reveal burst restarts it at device scale ${scale}',
        measureOnly: true,
      },
      { title: 'a remount returns to 3D', measureOnly: true },
      { title: 'a slow device declines to the poster', measureOnly: false },
      { title: 'records the frame-budget verdict at ${width} x ${height}', measureOnly: false },
    ]);
  });

  it('opts every HOME-08 perf context in before its first page', () => {
    const perf = read('e2e/perf/home-baseline.spec.ts');
    const flag = perf.search(
      /await context\.addInitScript\(\(\) => \{\s*\(window as Window & \{ __ascentBudgetMeasureOnly\?: boolean \}\)\.__ascentBudgetMeasureOnly = true;\s*\}\);/
    );
    const created = perf.indexOf('await browser.newContext(');
    const firstPage = perf.indexOf('await context.newPage()');
    expect(flag).toBeGreaterThan(created);
    expect(flag).toBeLessThan(firstPage);
  });
});
