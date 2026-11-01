/**
 * The demo terminal's pure state machine (ENG-05; 11 D-02, D-03; 11-RESEARCH
 * Pattern 3 and Pitfall 1): the walk through one command, the reduced-motion
 * jump, the v1 timings, the dot jump, the pause sources and the visible text.
 */
import {
  TIMINGS,
  delayFor,
  goTo,
  initialState,
  isPlaying,
  tick,
  visibleLines,
  type PauseSources,
  type TerminalState,
} from '@/lib/demo-terminal';

/** Input length 3, output length 2, as the behaviour list specifies. */
const COMMANDS = [
  { input: 'abc', output: 'xy' },
  { input: 'def', output: 'zw' },
];

const NONE: PauseSources = { sticky: false, hover: false, focusWithin: false, offscreen: false, hidden: false };

function walk(from: TerminalState, steps: number, reduced = false): TerminalState[] {
  const out: TerminalState[] = [];
  let s = from;
  for (let i = 0; i < steps; i++) {
    s = tick(s, COMMANDS, reduced);
    out.push(s);
  }
  return out;
}

describe('demo terminal state machine', () => {
  it('starts on the first command, complete', () => {
    expect(initialState()).toEqual({ index: 0, phase: 'shown', chars: 0 });
  });

  it('walks shown -> input -> gap -> output -> shown through the next command', () => {
    expect(walk(initialState(), 9)).toEqual([
      { index: 1, phase: 'input', chars: 0 },
      { index: 1, phase: 'input', chars: 1 },
      { index: 1, phase: 'input', chars: 2 },
      { index: 1, phase: 'input', chars: 3 },
      { index: 1, phase: 'gap', chars: 0 },
      { index: 1, phase: 'output', chars: 0 },
      { index: 1, phase: 'output', chars: 1 },
      { index: 1, phase: 'output', chars: 2 },
      { index: 1, phase: 'shown', chars: 0 },
    ]);
  });

  it('wraps from the last command to the first', () => {
    expect(tick({ index: 1, phase: 'shown', chars: 0 }, COMMANDS, false)).toEqual({
      index: 0,
      phase: 'input',
      chars: 0,
    });
  });

  it('skips typing under reduced motion: shown(0) -> shown(1) -> shown(0)', () => {
    expect(walk(initialState(), 2, true)).toEqual([
      { index: 1, phase: 'shown', chars: 0 },
      { index: 0, phase: 'shown', chars: 0 },
    ]);
  });

  it('keeps the v1 timings: 50, 500, 10 and 3000 ms', () => {
    expect(delayFor({ index: 0, phase: 'input', chars: 0 })).toBe(50);
    expect(delayFor({ index: 0, phase: 'gap', chars: 0 })).toBe(500);
    expect(delayFor({ index: 0, phase: 'output', chars: 0 })).toBe(10);
    expect(delayFor({ index: 0, phase: 'shown', chars: 0 })).toBe(3000);
    expect(TIMINGS).toEqual({ inputCharMs: 50, gapMs: 500, outputCharMs: 10, holdMs: 3000 });
  });

  it('jumps to a command, complete', () => {
    expect(goTo(2, 4)).toEqual({ index: 2, phase: 'shown', chars: 0 });
  });

  it.each([4, -1, 1.5])('throws a RangeError for goTo(%p, 4)', (index) => {
    expect(() => goTo(index, 4)).toThrow(RangeError);
  });

  it.each(['sticky', 'hover', 'focusWithin', 'offscreen', 'hidden'] as const)(
    'is not playing while %s is set',
    (source) => {
      expect(isPlaying({ ...NONE, [source]: true }, 4)).toBe(false);
    }
  );

  it('plays with no pause source and two or more commands, never with one or none', () => {
    expect(isPlaying(NONE, 2)).toBe(true);
    expect(isPlaying(NONE, 1)).toBe(false);
    expect(isPlaying(NONE, 0)).toBe(false);
  });

  it('shows the typed part of the input while it types', () => {
    expect(visibleLines({ index: 1, phase: 'input', chars: 2 }, COMMANDS[1])).toEqual({
      input: 'de',
      output: '',
      complete: false,
      typing: 'input',
    });
  });

  it('shows both lines complete once shown', () => {
    expect(visibleLines({ index: 1, phase: 'shown', chars: 0 }, COMMANDS[1])).toEqual({
      input: 'def',
      output: 'zw',
      complete: true,
      typing: null,
    });
  });
});
