'use client';

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
} from 'react';
import { PauseIcon } from '@phosphor-icons/react/dist/ssr';
import {
  delayFor,
  goTo,
  initialState,
  isPlaying,
  releaseSticky,
  tick,
  visibleLines,
  type TerminalCommand,
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

/**
 * The full current command for screen readers (11-UI-SPEC "Screen readers"):
 * 'Command {n} of {total}. Command: {input}. Output: {output}.' and the note
 * after it only when the command has one.
 */
function spokenCommand(command: TerminalCommand, n: number, total: number): string {
  return [
    `Command ${n} of ${total}.`,
    `Command: ${sentence(command.input)}`,
    `Output: ${sentence(command.output)}`,
    command.note && sentence(command.note),
  ]
    .filter(Boolean)
    .join(' ');
}

/** The static 8 x 16 px block caret beside the line that is typing; it does not blink. */
function Caret() {
  return (
    <span aria-hidden="true" className="ml-1 inline-block h-4 w-2 bg-ink-muted align-text-bottom" />
  );
}

/**
 * One command's lines in DOM = visual order (11-UI-SPEC "Lines", D-26): the
 * prompt and the command line, the captured output, then the note once the
 * command is complete (only when it has one; it replaces the retired risk
 * badge line and reads as Inter commentary, not output).
 */
function CommandLines({ command, lines }: { command: TerminalCommand; lines: VisibleLines }) {
  return (
    <>
      <p className="flex gap-2">
        <span className="text-ink-muted">❯</span>
        <span className="min-w-0 whitespace-pre-wrap wrap-anywhere text-ink">
          {lines.input}
          {lines.typing === 'input' && <Caret />}
        </span>
      </p>
      <p className="mt-1 whitespace-pre-wrap wrap-anywhere text-ink-muted">
        {lines.output}
        {lines.typing === 'output' && <Caret />}
      </p>
      {lines.complete && command.note && (
        <p data-note className="mt-2 font-sans text-sm text-ink">
          {command.note}
        </p>
      )}
    </>
  );
}

/**
 * A project's demo as a flat token terminal, box first (ENG-05; 11 D-01,
 * D-02 amended, D-03, D-26; 11-UI-SPEC "Demo — box: DemoTerminal", G2, G3).
 * A client island fed by the server page's props, `name` and `commands`
 * only: it imports the pure state machine in lib/demo-terminal.ts (and its
 * TerminalCommand type), the reduced-motion hook and an icon, never a data
 * module (T-11-01, T-11-07). The region is named '{name} demo' and the title
 * bar reads '{name}'. three.js and R3F never load on project pages.
 *
 * Timer: one effect schedules a single timeout of `delayFor(state)` that
 * applies `tick`, and clears it in cleanup, so exactly one timer is pending
 * at any time, a dot press mid-typing cannot double-advance and an unmount
 * leaves nothing running (11-RESEARCH Pitfall 1). State changes only in that
 * timer callback, the observer callback and event handlers.
 *
 * Pausing (D-02 amended): autoplay runs only when no pause source is set.
 * The Pause toggle is sticky: after a press nothing resumes until it is
 * released. Releasing it resumes at once: it also clears the current hover
 * and focus pauses (releaseSticky), although the pointer is still over the
 * region and focus is still on the button; those re-arm only on the next
 * pointerenter or the next time focus enters the region from outside.
 * It starts pressed under reduced motion (`override ?? reduced`); the server
 * renders it unpressed and the client flips it after hydration, before
 * anything can advance, because the first command is server-rendered complete
 * and holds for 3000 ms (11-RESEARCH Pitfall 3). Its label never changes;
 * aria-pressed carries the state. The temporary sources clear on their own:
 * the pointer entering the region, focus entering it from outside (moving
 * between its own controls is not an entry), the region offscreen
 * (IntersectionObserver, threshold 0) and a hidden tab (visibilitychange);
 * a release never clears the last two. A pause mid-line freezes it, and
 * resuming continues from the same character.
 *
 * Layout (12-UI-SPEC D-24, E13): every command's full text is rendered in one
 * shared grid cell (`[grid-area:1/1]`), the others `invisible`, so the body
 * has no fixed height: it is as tall as the tallest command wraps at the
 * current width, nothing below moves when commands change, and the inactive
 * entries add height but no scroll width. While the current command types,
 * an invisible complete copy of it (note included) holds its full height in
 * the same cell. With one command (G2) only the body
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
export default function DemoTerminal({
  name,
  commands,
}: {
  name: string;
  commands: readonly TerminalCommand[];
}) {
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
    const id = window.setTimeout(
      () => setState((s) => tick(s, commands, reduced)),
      delayFor(state)
    );
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

  function onFocus(e: FocusEvent<HTMLDivElement>) {
    // Focus moving between the toggle and the dots is not an entry (D-02 amended).
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setFocusWithin(true);
  }

  /** Press: sticky pause. Release: releaseSticky's rule, in this one handler. */
  function onToggle() {
    if (!sticky) {
      setOverride(true);
      return;
    }
    const released = releaseSticky({ sticky, hover, focusWithin, offscreen, hidden });
    setOverride(released.sticky);
    setHover(released.hover);
    setFocusWithin(released.focusWithin);
  }

  function onBlur(e: FocusEvent<HTMLDivElement>) {
    // Focus moving between the toggle and the dots stays inside: keep the pause.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setFocusWithin(false);
  }

  if (state.index >= count) {
    // An empty list renders nothing; a shrunken one restarts on command 1 (11 IN-01).
    if (count > 0) setState(initialState());
    return null;
  }

  const shownState: TerminalState = reduced ? { ...state, phase: 'shown' } : state;
  const current = commands[state.index];

  return (
    <div
      ref={regionRef}
      role="region"
      aria-label={`${name} demo`}
      data-playback={playing ? 'playing' : 'paused'}
      data-command={state.index + 1}
      className="mt-6 rounded-lg border border-line bg-surface-raised"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {count > 1 && (
        <div className="flex h-12 items-center justify-between gap-4 border-b border-line px-4">
          <p className="font-mono text-sm text-ink-muted">
            {name}{' '}
            <span aria-hidden="true">
              · {state.index + 1} / {count}
            </span>
          </p>
          <button
            type="button"
            aria-pressed={sticky}
            aria-label="Pause demo"
            className={TOGGLE}
            onClick={onToggle}
          >
            <PauseIcon size={20} aria-hidden="true" />
            Pause
          </button>
        </div>
      )}

      <div className="grid p-4 font-mono text-sm">
        {commands.map((command, i) => {
          const isCurrent = i === state.index;
          const complete = visibleLines({ index: i, phase: 'shown', chars: 0 }, command);
          const lines = isCurrent ? visibleLines(shownState, command) : complete;
          return (
            <Fragment key={i}>
              <div
                data-cell={i + 1}
                aria-hidden="true"
                className={`min-w-0 [grid-area:1/1]${isCurrent ? '' : ' invisible'}`}
              >
                <CommandLines command={command} lines={lines} />
              </div>
              {isCurrent && !lines.complete && (
                <div aria-hidden="true" className="invisible min-w-0 [grid-area:1/1]">
                  <CommandLines command={command} lines={complete} />
                </div>
              )}
            </Fragment>
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
