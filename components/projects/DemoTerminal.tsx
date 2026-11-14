'use client';

import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type FocusEvent,
} from 'react';
import {
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  PauseIcon,
} from '@phosphor-icons/react/dist/ssr';
import {
  delayFor,
  goTo,
  initialState,
  isPlaying,
  releaseSticky,
  stepTo,
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

/**
 * Previous and Next command (14-UI-SPEC Contract 1): the CarouselControls
 * STEP_BUTTON string verbatim, one look for every ‹ › on the site; at an end
 * aria-disabled, dimmed, hover off.
 */
const STEP =
  'inline-flex size-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-sm border border-line-strong text-ink transition-colors duration-(--duration-fast) ease-erosion hover:bg-surface-overlay aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent';

/**
 * The transcript summary (14-UI-SPEC Contract 2): a 48 px row named
 * 'Transcript', the caret on the right, no native marker.
 */
const SUMMARY =
  'flex min-h-12 cursor-pointer touch-manipulation list-none items-center justify-between gap-4 rounded-lg px-4 text-base font-semibold text-ink transition-colors duration-(--duration-fast) ease-erosion hover:bg-surface-raised group-open:rounded-b-none [&::-webkit-details-marker]:hidden';

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
        <p data-note className="mt-2 font-body text-sm text-ink">
          {command.note}
        </p>
      )}
    </>
  );
}

/**
 * A project's demo as a flat token terminal, box first (ENG-05, ENG-06; 11
 * D-01, D-02 amended, D-26; 14 D-01 to D-03; 11-UI-SPEC "Demo — box:
 * DemoTerminal", G2, G3; 14-UI-SPEC Contract 1).
 * A client island fed by the server page's props, `name` and `commands`
 * only: it imports the pure state machine in lib/demo-terminal.ts (and its
 * TerminalCommand type), the reduced-motion hook and an icon, never a data
 * module (T-11-01, T-11-07). The region is named '{name} demo' and the title
 * bar reads '{name}'. three.js and R3F never load on project pages.
 *
 * Timer: one effect schedules a single timeout of `delayFor(state)` that
 * applies `tick`, and clears it in cleanup, so exactly one timer is pending
 * at any time, a step or dot press mid-typing cannot double-advance and an
 * unmount leaves nothing running (11-RESEARCH Pitfall 1). State changes only in that
 * timer callback, the observer callback and event handlers.
 *
 * Pausing (D-02 amended): autoplay runs only when no pause source is set.
 * The Pause toggle is sticky: after a press nothing resumes until it is
 * released. A step or a dot press presses it too (14 D-02, `show`): the
 * target command shows complete at once, with no typing replay, and the demo
 * holds there until Pause is released. Releasing it resumes at once: it also
 * clears the current hover and focus pauses (releaseSticky), although the
 * pointer is still over the region and focus is still on the button; those
 * re-arm only on the next pointerenter or the next time focus enters the
 * region from outside.
 * It starts pressed under reduced motion (`override ?? reduced`); the server
 * renders it unpressed and the client flips it after hydration, before
 * anything can advance, because the first command is server-rendered complete
 * and holds for 3000 ms (11-RESEARCH Pitfall 3). Its label never changes;
 * aria-pressed carries the state. The temporary sources clear on their own:
 * the pointer entering the region, focus entering it from outside (moving
 * between its own controls is not an entry), the region offscreen
 * (IntersectionObserver, threshold 0, attached through the `observeRegion`
 * callback ref so it follows the region node; 12-31 WR-02) and a hidden tab
 * (visibilitychange);
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
 * renders: no toggle, counter, step buttons, dots or timer; with none,
 * nothing renders (11 IN-01).
 *
 * Command bar (14-UI-SPEC Contract 1): `[‹] dots [›]`, a left-aligned
 * cluster in the 'Commands' group, so DOM = visual = Tab order is Pause,
 * Previous, dot 1 to n, Next. The ends never wrap (14 D-03): on command 1
 * Previous, and on the last Next, is aria-disabled, stays focusable, and a
 * press changes nothing and presses nothing; autoplay still loops from the
 * last command to the first. The bar is one 48 px row (four commands fit
 * at 375 px); when the dots outgrow it (G3) only the inner dot row wraps,
 * and Previous and Next stay beside it, vertically centred.
 *
 * Transcript (ENG-06; 14 D-04; 14-UI-SPEC Contract 2): the island returns a
 * fragment, the region and then a native `<details data-transcript>` below
 * it, outside the region, so it is server-rendered and opens without
 * JavaScript. It lists every command in order in an `<ol>`: the prompt glyph
 * (aria-hidden, select-none) and the command, the output in `pre > samp`
 * exactly as captured (11 D-26: real output is the proof; the `<samp>` keeps
 * a leading newline the parser would drop right after `<pre>`), then the
 * note when there is one. Plain selectable text, never aria-live. One
 * command renders no transcript (G2 already shows it whole); none renders
 * nothing.
 *
 * Screen readers: the drawn lines are aria-hidden, so a command is never
 * read twice or half-typed; an sr-only block always holds the full current
 * command. Its container is aria-live 'off' while playing, so autoplay never
 * chatters, and 'polite' while paused, so a step or dot press is announced
 * (the WAI carousel pattern; no new live region). `data-playback` reports
 * the effective state and `data-command` the 1-based current command, for
 * tests.
 */
export default function DemoTerminal({
  name,
  commands,
}: {
  name: string;
  commands: readonly TerminalCommand[];
}) {
  const count = commands.length;
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

  // A callback ref, not a mount-only effect (12-31 WR-02): React calls it with
  // each new region node and runs its cleanup when that node goes, so the
  // observer follows the region through an empty list and a late first command.
  const observeRegion = useCallback((node: HTMLDivElement | null) => {
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setOffscreen(!entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function onFocus(e: FocusEvent<HTMLDivElement>) {
    // Focus moving between the region's own controls is not an entry (D-02 amended).
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

  /**
   * A manual move (a step or a dot): show the target complete and press the
   * sticky Pause (D-02). A null target is an end press: nothing changes and
   * nothing is pressed (D-03).
   */
  function show(target: TerminalState | null) {
    if (target === null) return;
    setState(target);
    setOverride(true);
  }

  function onBlur(e: FocusEvent<HTMLDivElement>) {
    // Focus moving between the region's own controls stays inside: keep the pause.
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
    <>
      <div
        ref={observeRegion}
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
            className="flex min-h-12 items-center gap-2 border-t border-line px-4"
          >
            <button
              type="button"
              aria-label="Previous command"
              aria-disabled={state.index === 0 ? 'true' : undefined}
              className={STEP}
              onClick={() => {
                if (state.index > 0) show(stepTo(state.index, -1, count));
              }}
            >
              <CaretLeftIcon size={24} aria-hidden="true" />
            </button>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {commands.map((_, i) => {
                const isCurrent = i === state.index;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to command ${i + 1}`}
                    aria-current={isCurrent ? 'true' : undefined}
                    className={DOT}
                    onClick={() => show(goTo(i, count))}
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
            <button
              type="button"
              aria-label="Next command"
              aria-disabled={state.index === count - 1 ? 'true' : undefined}
              className={STEP}
              onClick={() => {
                if (state.index < count - 1) show(stepTo(state.index, 1, count));
              }}
            >
              <CaretRightIcon size={24} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {count > 1 && (
        <details data-transcript className="group mt-4 rounded-lg border border-line">
          <summary className={SUMMARY}>
            Transcript
            <CaretDownIcon
              size={20}
              aria-hidden="true"
              className="shrink-0 group-open:rotate-180"
            />
          </summary>
          <ol className="divide-y divide-line border-t border-line px-4">
            {commands.map((command, i) => (
              <li key={i} className="py-4 text-sm">
                <p className="flex gap-2 font-mono">
                  <span aria-hidden="true" className="select-none text-ink-muted">
                    ❯
                  </span>
                  <code className="min-w-0 font-mono whitespace-pre-wrap wrap-anywhere text-ink">
                    {command.input}
                  </code>
                </p>
                <pre className="mt-1 font-mono whitespace-pre-wrap wrap-anywhere text-ink-muted">
                  <samp>{command.output}</samp>
                </pre>
                {command.note && <p className="mt-2 font-body text-ink">{command.note}</p>}
              </li>
            ))}
          </ol>
        </details>
      )}
    </>
  );
}
