'use client';

import { useEffect, useState } from 'react';
import { PauseIcon, WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { DemoCommand } from '@/data/types';
import {
  delayFor,
  initialState,
  isPlaying,
  tick,
  visibleLines,
  type TerminalState,
} from '@/lib/demo-terminal';
import { useReducedMotion } from '@/lib/useReducedMotion';

/** The Pause toggle (11-UI-SPEC "Pause toggle"); pressed is ink on ink-inverse. */
const TOGGLE =
  'inline-flex min-h-11 cursor-pointer touch-manipulation items-center gap-2 rounded-sm border border-line-strong px-4 text-base font-semibold text-ink transition-colors duration-(--duration-fast) ease-erosion hover:bg-surface-overlay aria-pressed:bg-ink aria-pressed:text-ink-inverse aria-pressed:hover:bg-ink';

/** The static 8 x 16 px block caret beside the line that is typing; it does not blink. */
function Caret() {
  return <span aria-hidden="true" className="ml-1 inline-block h-4 w-2 bg-ink-muted align-text-bottom" />;
}

/**
 * The CLI_X demo as a flat token terminal (ENG-05; 11 D-01, D-02; 11-UI-SPEC
 * "Demo — DemoTerminal"). A client island fed by the server page's props: it
 * imports only the DemoCommand type, the pure state machine in
 * lib/demo-terminal.ts, the reduced-motion hook and icons, never
 * data/projects (T-11-01). three.js and R3F never load on project pages.
 *
 * One effect schedules a single timeout of `delayFor(state)` that applies
 * `tick`, and clears it in cleanup, so exactly one timer is pending at any time
 * (11-RESEARCH Pitfall 1). State changes only inside that timer callback and
 * in event handlers, never synchronously in an effect body.
 *
 * The Pause toggle is sticky (D-02): after a press nothing resumes until it
 * is pressed again. It starts pressed under reduced motion (`override ??
 * reduced`, the v1 playOverride pattern); the server renders it unpressed and
 * the client flips it after hydration, before anything can advance, because
 * the first command is server-rendered complete and holds for 3000 ms
 * (11-RESEARCH Pitfall 3). The label never changes with state; aria-pressed
 * carries it. `data-playback` reports the effective state and `data-command`
 * the 1-based current command, for tests.
 */
export default function DemoTerminal({ commands }: { commands: readonly DemoCommand[] }) {
  const [state, setState] = useState<TerminalState>(initialState);
  const reduced = useReducedMotion();
  const [override, setOverride] = useState<boolean | null>(null);
  const sticky = override ?? reduced;
  const playing = isPlaying(
    { sticky, hover: false, focusWithin: false, offscreen: false, hidden: false },
    commands.length
  );

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setState((s) => tick(s, commands, reduced)), delayFor(state));
    return () => window.clearTimeout(id);
  }, [state, playing, reduced, commands]);

  const command = commands[state.index];
  const lines = visibleLines(reduced ? { ...state, phase: 'shown' } : state, command);

  return (
    <div
      role="region"
      aria-label="CLI_X demo"
      data-playback={playing ? 'playing' : 'paused'}
      data-command={state.index + 1}
      className="mt-6 rounded-lg border border-line bg-surface-raised"
    >
      <div className="flex h-12 items-center justify-between gap-4 border-b border-line px-4">
        <p className="font-mono text-sm text-ink-muted">
          CLI_X{' '}
          <span aria-hidden="true">
            · {state.index + 1} / {commands.length}
          </span>
        </p>
        <button
          type="button"
          aria-pressed={sticky}
          aria-label="Pause demo"
          className={TOGGLE}
          onClick={() => setOverride(!sticky)}
        >
          <PauseIcon size={20} aria-hidden="true" />
          Pause
        </button>
      </div>

      <div className="p-4 font-mono text-sm">
        <p className="wrap-anywhere">
          <span className="mr-2 font-sans text-ink-muted">Request</span>
          <span className="text-ink">{lines.input}</span>
          {lines.typing === 'input' && <Caret />}
        </p>
        <p className="mt-1 flex gap-2">
          <span aria-hidden="true" className="text-ink-muted">
            ❯
          </span>
          <span className="min-w-0 whitespace-pre-wrap wrap-anywhere text-ink">
            {lines.output}
            {lines.typing === 'output' && <Caret />}
          </span>
        </p>
        {lines.complete && command.warning && (
          <p className="mt-1 flex items-start gap-2 text-ink">
            <WarningIcon size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span className="min-w-0 wrap-anywhere">{command.warning}</span>
          </p>
        )}
        {lines.complete && command.explanation && (
          <p className="mt-1 wrap-anywhere text-ink-muted">{command.explanation}</p>
        )}
      </div>
    </div>
  );
}
