'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type FocusEvent } from 'react';
import { PauseIcon, WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { DemoCommand } from '@/data/types';
import {
  delayFor,
  goTo,
  initialState,
  isPlaying,
  tick,
  visibleLines,
  type TerminalState,
  type VisibleLines,
} from '@/lib/demo-terminal';
import { useReducedMotion } from '@/lib/useReducedMotion';

/** The Pause toggle (11-UI-SPEC "Pause toggle"); pressed is ink on ink-inverse. */
const TOGGLE =
  'inline-flex min-h-11 cursor-pointer touch-manipulation items-center gap-2 rounded-sm border border-line-strong px-4 text-base font-semibold text-ink transition-colors duration-(--duration-fast) ease-erosion hover:bg-surface-overlay aria-pressed:bg-ink aria-pressed:text-ink-inverse aria-pressed:hover:bg-ink';

/** One selector dot: a 44 x 44 px hit area around the drawn dot (11-UI-SPEC "Selector dots"). */
const DOT =
  'group inline-flex size-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-sm';

/** document.hidden as an external store, so no state is set in an effect body. */
function subscribeVisibility(callback: () => void): () => void {
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
}
const getHidden = () => document.hidden;
const getServerHidden = () => false;

/** Ends a fragment with a full stop unless it already ends a sentence. */
function sentence(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/** The full current command for screen readers (11-UI-SPEC "Screen readers"). */
function spokenCommand(command: DemoCommand, n: number, total: number): string {
  return [
    `Command ${n} of ${total}.`,
    `Request: ${sentence(command.input)}`,
    `Command: ${sentence(command.output)}`,
    command.warning && sentence(command.warning),
    command.explanation && sentence(command.explanation),
  ]
    .filter(Boolean)
    .join(' ');
}

/** The static 8 x 16 px block caret beside the line that is typing; it does not blink. */
function Caret() {
  return <span aria-hidden="true" className="ml-1 inline-block h-4 w-2 bg-ink-muted align-text-bottom" />;
}

/**
 * One command's lines in DOM = visual order (11-UI-SPEC "Lines"): the
 * request, the command, then the warning and the explanation once the
 * command is complete (each only when present, both when both exist).
 */
function CommandLines({ command, lines }: { command: DemoCommand; lines: VisibleLines }) {
  return (
    <>
      <p className="wrap-anywhere">
        <span className="mr-2 font-sans text-ink-muted">Request</span>
        <span className="text-ink">{lines.input}</span>
        {lines.typing === 'input' && <Caret />}
      </p>
      <p className="mt-1 flex gap-2">
        <span className="text-ink-muted">❯</span>
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
    </>
  );
}

/**
 * The CLI_X demo as a flat token terminal (ENG-05; 11 D-01, D-02, D-03;
 * 11-UI-SPEC "Demo — DemoTerminal", G2, G3). A client island fed by the
 * server page's props: it imports only the DemoCommand type, the pure state
 * machine in lib/demo-terminal.ts, the reduced-motion hook and icons, never
 * data/projects (T-11-01). three.js and R3F never load on project pages.
 *
 * Timer: one effect schedules a single timeout of `delayFor(state)` that
 * applies `tick`, and clears it in cleanup, so exactly one timer is pending
 * at any time, a dot press mid-typing cannot double-advance and an unmount
 * leaves nothing running (11-RESEARCH Pitfall 1). State changes only in that
 * timer callback, the observer callback and event handlers.
 *
 * Pausing (D-02): autoplay runs only when no pause source is set. The Pause
 * toggle is sticky: after a press nothing resumes until it is pressed again.
 * It starts pressed under reduced motion (`override ?? reduced`); the server
 * renders it unpressed and the client flips it after hydration, before
 * anything can advance, because the first command is server-rendered complete
 * and holds for 3000 ms (11-RESEARCH Pitfall 3). Its label never changes;
 * aria-pressed carries the state. The temporary sources clear on their own:
 * the pointer over the region, focus anywhere inside it (moving between its
 * controls keeps it), the region offscreen (IntersectionObserver, threshold
 * 0) and a hidden tab (visibilitychange). A pause mid-line freezes it, and
 * resuming continues from the same character.
 *
 * Layout: every command is rendered in one shared grid cell, the others
 * `invisible`, so the body is as tall as the tallest command and nothing
 * below moves when commands change. With one command (G2) only the body
 * renders: no toggle, counter, dots or timer. With seven or more (G3) the
 * dot bar wraps.
 *
 * Screen readers: the drawn lines are aria-hidden, so a command is never
 * read twice or half-typed; an sr-only block always holds the full current
 * command. Its container is aria-live 'off' while playing, so autoplay never
 * chatters, and 'polite' while paused, so a dot press is announced (the WAI
 * carousel pattern). `data-playback` reports the effective state and
 * `data-command` the 1-based current command, for tests.
 */
export default function DemoTerminal({ commands }: { commands: readonly DemoCommand[] }) {
  const count = commands.length;
  const regionRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<TerminalState>(initialState);
  const reduced = useReducedMotion();
  const [override, setOverride] = useState<boolean | null>(null);
  const [hover, setHover] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const hidden = useSyncExternalStore(subscribeVisibility, getHidden, getServerHidden);

  const sticky = override ?? reduced;
  const playing = isPlaying({ sticky, hover, focusWithin, offscreen, hidden }, count);

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setState((s) => tick(s, commands, reduced)), delayFor(state));
    return () => window.clearTimeout(id);
  }, [state, playing, reduced, commands]);

  useEffect(() => {
    const region = regionRef.current;
    if (!region || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setOffscreen(!entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(region);
    return () => observer.disconnect();
  }, []);

  function onBlur(e: FocusEvent<HTMLDivElement>) {
    // Focus moving between the toggle and the dots stays inside: keep the pause.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setFocusWithin(false);
  }

  const shownState: TerminalState = reduced ? { ...state, phase: 'shown' } : state;
  const current = commands[state.index];

  return (
    <div
      ref={regionRef}
      role="region"
      aria-label="CLI_X demo"
      data-playback={playing ? 'playing' : 'paused'}
      data-command={state.index + 1}
      className="mt-6 rounded-lg border border-line bg-surface-raised"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={onBlur}
    >
      {count > 1 && (
        <div className="flex h-12 items-center justify-between gap-4 border-b border-line px-4">
          <p className="font-mono text-sm text-ink-muted">
            CLI_X{' '}
            <span aria-hidden="true">
              · {state.index + 1} / {count}
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
      )}

      <div className="grid p-4 font-mono text-sm">
        {commands.map((command, i) => {
          const isCurrent = i === state.index;
          const lines = visibleLines(isCurrent ? shownState : { index: i, phase: 'shown', chars: 0 }, command);
          return (
            <div
              key={i}
              data-cell={i + 1}
              aria-hidden="true"
              className={`col-start-1 row-start-1 min-w-0${isCurrent ? '' : ' invisible'}`}
            >
              <CommandLines command={command} lines={lines} />
            </div>
          );
        })}
      </div>

      <div aria-live={playing ? 'off' : 'polite'} aria-atomic="true" className="sr-only">
        <p>{spokenCommand(current, state.index + 1, count)}</p>
      </div>

      {count > 1 && (
        <div
          role="group"
          aria-label="Commands"
          className={`flex items-center gap-2 border-t border-line px-4 ${count >= 7 ? 'min-h-12 flex-wrap' : 'h-12'}`}
        >
          {commands.map((_, i) => {
            const isCurrent = i === state.index;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Go to command ${i + 1}`}
                aria-current={isCurrent ? 'true' : undefined}
                className={DOT}
                onClick={() => setState(goTo(i, count))}
              >
                <span
                  aria-hidden="true"
                  className={
                    isCurrent
                      ? 'h-2 w-6 rounded-full bg-ink'
                      : 'size-2 rounded-full bg-line-strong transition-colors duration-(--duration-fast) ease-erosion group-hover:bg-ink-muted'
                  }
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
