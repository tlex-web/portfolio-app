/**
 * The CLI_X demo terminal's state machine (ENG-05; 11 D-01, D-02, D-03;
 * 11-RESEARCH Pattern 3 and Pitfall 1; 11-UI-SPEC "Demo — DemoTerminal").
 * Pure and import-free: keep it to erasable TypeScript and never add an import.
 *
 * The island holds one TerminalState and schedules exactly one timer at a
 * time: `setTimeout(() => tick(...), delayFor(state))`, cleared by the effect
 * cleanup. That single pending timer is the fix for the v1 terminal's leak,
 * whose nested interval and timeout chain kept running after an index change
 * or an unmount (Pitfall 1). Every transition is a pure function here, so the
 * timings and the walk through a command are unit-tested without React.
 *
 * Phases of one command: 'input' types the request one character per tick,
 * 'gap' is the pause before the command, 'output' types the command, and
 * 'shown' holds the complete command before the next one starts. The timings
 * are the v1 ones (TIMINGS). Under reduced motion `tick` skips typing and
 * moves from one complete command straight to the next.
 */

export type TerminalPhase = 'input' | 'gap' | 'output' | 'shown';

export interface TerminalState {
  /** 0-based index of the current command. */
  index: number;
  phase: TerminalPhase;
  /** Characters typed so far in the line of the current phase ('input' or 'output'). */
  chars: number;
}

/** The two strings the terminal types; DemoCommand satisfies it structurally. */
export interface TerminalCommand {
  input: string;
  output: string;
}

/** v1 timings, unchanged (11-UI-SPEC "Typing"). */
export const TIMINGS = {
  inputCharMs: 50,
  gapMs: 500,
  outputCharMs: 10,
  holdMs: 3000,
} as const;

/**
 * The first command, complete. It is what the server renders, so hydration
 * never blanks text; autoplay first advances to command 2 after holdMs.
 */
export function initialState(): TerminalState {
  return { index: 0, phase: 'shown', chars: 0 };
}

/** The next state after one timer step. */
export function tick(
  state: TerminalState,
  commands: readonly TerminalCommand[],
  reduced: boolean
): TerminalState {
  const count = commands.length;
  if (count === 0) return state;

  if (state.phase === 'shown') {
    const next = (state.index + 1) % count;
    return { index: next, phase: reduced ? 'shown' : 'input', chars: 0 };
  }
  // Reduced motion requested mid-typing: finish the command at once.
  if (reduced) return { index: state.index, phase: 'shown', chars: 0 };

  const command = commands[state.index];
  switch (state.phase) {
    case 'input':
      return state.chars < command.input.length
        ? { ...state, chars: state.chars + 1 }
        : { index: state.index, phase: 'gap', chars: 0 };
    case 'gap':
      return { index: state.index, phase: 'output', chars: 0 };
    case 'output':
      return state.chars < command.output.length
        ? { ...state, chars: state.chars + 1 }
        : { index: state.index, phase: 'shown', chars: 0 };
  }
}

/**
 * Jump to a command, complete (the selector dots, D-03). Throws a RangeError
 * for anything but an integer in [0, count).
 */
export function goTo(index: number, count: number): TerminalState {
  if (!Number.isInteger(index) || index < 0 || index >= count) {
    throw new RangeError(`goTo: index ${index} is outside [0, ${count})`);
  }
  return { index, phase: 'shown', chars: 0 };
}

/** How long the state lasts before the next tick, in ms. */
export function delayFor(state: TerminalState): number {
  switch (state.phase) {
    case 'input':
      return TIMINGS.inputCharMs;
    case 'gap':
      return TIMINGS.gapMs;
    case 'output':
      return TIMINGS.outputCharMs;
    case 'shown':
      return TIMINGS.holdMs;
  }
}

/**
 * Everything that can stop autoplay (D-02). `sticky` is the Pause toggle and
 * only the toggle clears it; the other four are temporary and clear on their
 * own (pointer leaves, focus leaves, scrolled back into view, tab visible).
 */
export interface PauseSources {
  sticky: boolean;
  hover: boolean;
  focusWithin: boolean;
  offscreen: boolean;
  hidden: boolean;
}

/** Autoplay runs only with two or more commands and no pause source set. */
export function isPlaying(p: PauseSources, count: number): boolean {
  return count >= 2 && !p.sticky && !p.hover && !p.focusWithin && !p.offscreen && !p.hidden;
}

export interface VisibleLines {
  input: string;
  output: string;
  /** Both lines are complete (the warning and explanation may show). */
  complete: boolean;
  /** The line that is typing right now, which carries the caret. */
  typing: 'input' | 'output' | null;
}

/** The text on screen for a state of the given command. */
export function visibleLines(state: TerminalState, command: TerminalCommand): VisibleLines {
  switch (state.phase) {
    case 'input':
      return { input: command.input.slice(0, state.chars), output: '', complete: false, typing: 'input' };
    case 'gap':
      return { input: command.input, output: '', complete: false, typing: null };
    case 'output':
      return {
        input: command.input,
        output: command.output.slice(0, state.chars),
        complete: false,
        typing: 'output',
      };
    case 'shown':
      return { input: command.input, output: command.output, complete: true, typing: null };
  }
}
