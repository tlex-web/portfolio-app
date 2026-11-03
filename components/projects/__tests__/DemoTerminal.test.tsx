/**
 * The project demo terminal island (ENG-05; 11 D-02 amended pause sources and
 * release, D-03 selector dots, D-26 note line; 11-UI-SPEC "Demo — box:
 * DemoTerminal", G2 one command, G3 seven or more; 11-RESEARCH Pattern 3 and
 * Pitfall 1 single timer).
 *
 * Fake timers drive the one pending timeout. State is read from
 * `data-playback` / `data-command` on the region, `aria-pressed` on the Pause
 * toggle, `aria-current` on the dots, `aria-live` on the screen-reader text,
 * `data-note` on the note line and the text itself, never from colour
 * classes. Each command is rendered in its own `data-cell` of one shared grid
 * cell, so the current one is read through its cell; the body-height tests
 * may assert that layout contract (`grid`, `[grid-area:1/1]`, `invisible`;
 * 12-UI-SPEC D-24). The island is rendered
 * with the name 'box', so its region is 'box demo'.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DemoTerminal from '@/components/projects/DemoTerminal';
import type { TerminalCommand } from '@/lib/demo-terminal';

const NOTE = 'BLAKE3 is the default hash.';

const COMMANDS: TerminalCommand[] = [
  { input: 'box hash notes.txt', output: 'notes.txt af1349b9', note: NOTE },
  { input: 'show disk', output: 'df -h' },
  { input: 'archive docs', output: 'tar -czf docs.tgz docs' },
  { input: 'box epoch 0', output: '1970-01-01T00:00:00Z' },
];

/**
 * IntersectionObserver instances created by the island, so a test can report
 * visibility, with the elements each one observes (12-31 WR-02).
 */
type ObserverRecord = {
  callback: IntersectionObserverCallback;
  disconnected: boolean;
  targets: Element[];
};
let observers: ObserverRecord[] = [];
const OriginalIO = window.IntersectionObserver;

class CapturingIntersectionObserver {
  record: ObserverRecord;
  constructor(callback: IntersectionObserverCallback) {
    this.record = { callback, disconnected: false, targets: [] };
    observers.push(this.record);
  }
  observe(target: Element) {
    this.record.targets.push(target);
  }
  unobserve() {}
  disconnect() {
    this.record.disconnected = true;
  }
  takeRecords() {
    return [];
  }
}

function reportVisibility(isIntersecting: boolean) {
  const live = observers.filter((o) => !o.disconnected);
  act(() => {
    for (const o of live) {
      o.callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        {} as unknown as IntersectionObserver
      );
    }
  });
}

function setReducedMotion(reduce: boolean) {
  (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

function region() {
  return screen.getByRole('region', { name: 'box demo' });
}

function toggle() {
  return within(region()).getByRole('button', { name: 'Pause demo' });
}

function cell(n: number) {
  const el = region().querySelector(`[data-cell="${n}"]`);
  if (!el) throw new Error(`no cell ${n}`);
  return el as HTMLElement;
}

/**
 * Advances in 10 ms steps, one act each: the island schedules its next
 * timeout from an effect, which React only runs when an act flushes, so one
 * long advance would fire a single tick (10 ms is the shortest step).
 */
function advance(ms: number) {
  for (let t = 0; t < ms; t += 10) {
    act(() => {
      jest.advanceTimersByTime(Math.min(10, ms - t));
    });
  }
}

function setup(commands: readonly TerminalCommand[] = COMMANDS) {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const view = render(
    <>
      <DemoTerminal name="box" commands={commands} />
      <button type="button">Outside</button>
    </>
  );
  return { user, ...view };
}

/**
 * Presses Pause and releases it with the mouse, so the pointer stays over the
 * region and focus stays on the toggle (the D-02 amendment's case).
 */
async function pressAndRelease(user: ReturnType<typeof userEvent.setup>) {
  await user.hover(region());
  await user.click(toggle());
  expect(toggle()).toHaveAttribute('aria-pressed', 'true');
  expect(region()).toHaveAttribute('data-playback', 'paused');
  await user.click(toggle());
  expect(toggle()).toHaveFocus();
}

beforeEach(() => {
  jest.useFakeTimers();
  observers = [];
  window.IntersectionObserver =
    CapturingIntersectionObserver as unknown as typeof IntersectionObserver;
  setReducedMotion(false);
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
});

afterEach(() => {
  jest.useRealTimers();
  window.IntersectionObserver = OriginalIO;
});

describe('DemoTerminal autoplay', () => {
  it('shows the first command complete, then types command 2 after 3000 ms', () => {
    setup();
    expect(region()).toHaveAttribute('data-command', '1');
    expect(region()).toHaveAttribute('data-playback', 'playing');
    expect(cell(1)).toHaveTextContent('box hash notes.txt');
    expect(cell(1)).toHaveTextContent('notes.txt af1349b9');

    advance(3000);
    expect(region()).toHaveAttribute('data-command', '2');
    advance(50 * 3);
    // Three characters of 'show disk' typed, the output still empty.
    expect(cell(2)).toHaveTextContent('sho');
    expect(cell(2)).not.toHaveTextContent('show disk');
    expect(cell(2)).not.toHaveTextContent('df -h');
    // The typing lines are hidden from screen readers.
    expect(cell(2)).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('DemoTerminal temporary pause sources (D-02)', () => {
  it('pauses while the pointer is over the region and resumes when it leaves', async () => {
    const { user } = setup();
    await user.hover(region());
    expect(region()).toHaveAttribute('data-playback', 'paused');
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');

    advance(5000);
    expect(region()).toHaveAttribute('data-command', '1');

    await user.unhover(region());
    expect(region()).toHaveAttribute('data-playback', 'playing');
    advance(3000);
    expect(region()).toHaveAttribute('data-command', '2');
  });

  it('pauses while focus is inside, stays paused as focus moves between dots, resumes when it leaves', async () => {
    const { user } = setup();
    const dots = within(region()).getAllByRole('button', { name: /^Go to command/ });

    act(() => dots[0].focus());
    expect(region()).toHaveAttribute('data-playback', 'paused');
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');

    await user.tab();
    expect(dots[1]).toHaveFocus();
    expect(region()).toHaveAttribute('data-playback', 'paused');

    act(() => screen.getByRole('button', { name: 'Outside' }).focus());
    expect(region()).toHaveAttribute('data-playback', 'playing');
  });

  it('pauses while the region is offscreen and resumes when it is back', () => {
    setup();
    reportVisibility(false);
    expect(region()).toHaveAttribute('data-playback', 'paused');
    advance(5000);
    expect(region()).toHaveAttribute('data-command', '1');

    reportVisibility(true);
    expect(region()).toHaveAttribute('data-playback', 'playing');
  });

  it('pauses while the tab is hidden and resumes when it is visible', () => {
    setup();
    setHidden(true);
    expect(region()).toHaveAttribute('data-playback', 'paused');
    advance(5000);
    expect(region()).toHaveAttribute('data-command', '1');

    setHidden(false);
    expect(region()).toHaveAttribute('data-playback', 'playing');
  });
});

describe('DemoTerminal sticky Pause and its release (D-02 amended)', () => {
  it('keeps Pause pressed and paused after the pointer and focus leave', async () => {
    const { user } = setup();
    await user.click(toggle());
    await user.unhover(region());
    act(() => screen.getByRole('button', { name: 'Outside' }).focus());
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(region()).toHaveAttribute('data-playback', 'paused');
    advance(5000);
    expect(region()).toHaveAttribute('data-command', '1');
  });

  it('resumes at once on release with the pointer still over the region and focus on the toggle', async () => {
    const { user } = setup();
    await pressAndRelease(user);
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(region()).toHaveAttribute('data-playback', 'playing');
    advance(3000);
    expect(region()).toHaveAttribute('data-command', '2');
  });

  it('pauses again after a release when the pointer leaves and re-enters', async () => {
    const { user } = setup();
    await pressAndRelease(user);
    expect(region()).toHaveAttribute('data-playback', 'playing');

    await user.unhover(region());
    expect(region()).toHaveAttribute('data-playback', 'playing');
    await user.hover(region());
    expect(region()).toHaveAttribute('data-playback', 'paused');
  });

  it('pauses again after a release when focus leaves the region and enters it from outside', async () => {
    const { user } = setup();
    await pressAndRelease(user);
    await user.unhover(region());
    expect(region()).toHaveAttribute('data-playback', 'playing');

    act(() => screen.getByRole('button', { name: 'Outside' }).focus());
    expect(region()).toHaveAttribute('data-playback', 'playing');
    await user.tab({ shift: true });
    expect(region()).toContainElement(document.activeElement as HTMLElement);
    expect(region()).toHaveAttribute('data-playback', 'paused');
  });

  it('keeps playing after a release when Tab moves from the toggle to a dot inside', async () => {
    const { user } = setup();
    await pressAndRelease(user);
    await user.unhover(region());

    await user.tab();
    expect(within(region()).getByRole('button', { name: 'Go to command 1' })).toHaveFocus();
    expect(region()).toHaveAttribute('data-playback', 'playing');
  });

  it('stays paused after a release while the region is offscreen, until it is back in view', () => {
    setup();
    reportVisibility(false);
    fireEvent.click(toggle());
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(region()).toHaveAttribute('data-playback', 'paused');

    reportVisibility(true);
    expect(region()).toHaveAttribute('data-playback', 'playing');
  });

  it('stays paused after a release while the tab is hidden, until it is visible', () => {
    setup();
    setHidden(true);
    fireEvent.click(toggle());
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(region()).toHaveAttribute('data-playback', 'paused');

    setHidden(false);
    expect(region()).toHaveAttribute('data-playback', 'playing');
  });
});

describe('DemoTerminal selector dots (D-03)', () => {
  it('shows the pressed command complete at once without touching the toggle, and runs one timer', async () => {
    const { user } = setup();
    advance(3000 + 100); // command 2 is typing
    expect(region()).toHaveAttribute('data-command', '2');

    await user.click(within(region()).getByRole('button', { name: 'Go to command 3' }));
    expect(region()).toHaveAttribute('data-command', '3');
    expect(cell(3)).toHaveTextContent('archive docs');
    expect(cell(3)).toHaveTextContent('tar -czf docs.tgz docs');
    expect(within(region()).getByRole('button', { name: 'Go to command 3' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');

    // Pointer and focus leave, so autoplay runs again; record every command shown.
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(region()).toHaveAttribute('data-playback', 'playing');
    const seen = ['3'];
    for (let t = 0; t < 10000; t += 10) {
      advance(10); // one step at a time, recording the command after each
      const now = region().getAttribute('data-command') ?? '';
      if (now !== seen[seen.length - 1]) seen.push(now);
    }
    expect(seen).toEqual(['3', '4', '1']);
  });

  it('clears the pending timer on unmount', () => {
    const { unmount } = setup();
    expect(jest.getTimerCount()).toBe(1);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('DemoTerminal reduced motion', () => {
  it('starts pressed with every command complete and nothing advancing', () => {
    setReducedMotion(true);
    setup();
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(region()).toHaveAttribute('data-playback', 'paused');
    COMMANDS.forEach((c, i) => {
      expect(cell(i + 1)).toHaveTextContent(c.input);
      expect(cell(i + 1)).toHaveTextContent(c.output);
    });
    advance(10000);
    expect(region()).toHaveAttribute('data-command', '1');
  });

  it('resumes at once on release and advances one complete command per 3000 ms', async () => {
    setReducedMotion(true);
    const { user } = setup();
    await user.hover(region());
    await user.click(toggle());
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(region()).toHaveAttribute('data-playback', 'playing');
    advance(3000);
    expect(region()).toHaveAttribute('data-command', '2');
    expect(cell(2)).toHaveTextContent('show disk');
    expect(cell(2)).toHaveTextContent('df -h');
  });
});

describe('DemoTerminal one and many commands (G2, G3)', () => {
  it('is static with one command: no toggle, no dots, no counter, no timer', () => {
    setup([COMMANDS[0]]);
    expect(within(region()).queryByRole('button', { name: 'Pause demo' })).toBeNull();
    expect(within(region()).queryAllByRole('button', { name: /^Go to command/ })).toHaveLength(0);
    expect(region()).not.toHaveTextContent('1 / 1');
    expect(jest.getTimerCount()).toBe(0);
    expect(cell(1)).toHaveTextContent('box hash notes.txt');
  });

  it('renders nothing with no commands, and restarts on command 1 when the list shrinks (11 IN-01)', async () => {
    const { container } = render(<DemoTerminal name="box" commands={[]} />);
    expect(container).toBeEmptyDOMElement();

    const { user, rerender } = setup();
    await user.click(within(region()).getByRole('button', { name: 'Go to command 4' }));
    expect(region()).toHaveAttribute('data-command', '4');
    rerender(
      <>
        <DemoTerminal name="box" commands={COMMANDS.slice(0, 2)} />
        <button type="button">Outside</button>
      </>
    );
    expect(region()).toHaveAttribute('data-command', '1');
    expect(cell(1)).toHaveTextContent('box hash notes.txt');
  });

  it('keeps observing the region in the document after the list shrinks, so visibility still pauses and resumes it (WR-02)', () => {
    const { rerender } = setup();
    // fireEvent, not user: no hover or focus pause, so only visibility decides.
    fireEvent.click(within(region()).getByRole('button', { name: 'Go to command 4' }));
    expect(region()).toHaveAttribute('data-command', '4');
    rerender(
      <>
        <DemoTerminal name="box" commands={COMMANDS.slice(0, 2)} />
        <button type="button">Outside</button>
      </>
    );
    expect(region()).toHaveAttribute('data-command', '1');

    const live = observers.filter((o) => !o.disconnected);
    expect(live.flatMap((o) => o.targets)).toContain(region());
    for (const o of observers) {
      if (o.targets.some((t) => !document.contains(t))) expect(o.disconnected).toBe(true);
    }
    expect(region()).toHaveAttribute('data-playback', 'playing');
    reportVisibility(false);
    expect(region()).toHaveAttribute('data-playback', 'paused');
    reportVisibility(true);
    expect(region()).toHaveAttribute('data-playback', 'playing');
  });

  it('follows the region when the list empties and grows again: the removed node is let go and the new one observed (WR-02)', () => {
    const { rerender } = setup();
    const first = region();
    const list = (commands: readonly TerminalCommand[]) => (
      <>
        <DemoTerminal name="box" commands={commands} />
        <button type="button">Outside</button>
      </>
    );
    rerender(list([]));
    expect(document.contains(first)).toBe(false);
    rerender(list(COMMANDS.slice(0, 2)));

    const live = observers.filter((o) => !o.disconnected);
    expect(live.flatMap((o) => o.targets)).toContain(region());
    for (const o of live) {
      for (const t of o.targets) expect(document.contains(t)).toBe(true);
    }
    reportVisibility(false);
    expect(region()).toHaveAttribute('data-playback', 'paused');
    reportVisibility(true);
    expect(region()).toHaveAttribute('data-playback', 'playing');
  });

  it('observes the region when its first commands arrive after an empty list (WR-02)', () => {
    const { rerender } = setup([]);
    expect(observers.filter((o) => !o.disconnected)).toHaveLength(0);
    rerender(
      <>
        <DemoTerminal name="box" commands={COMMANDS.slice(0, 2)} />
        <button type="button">Outside</button>
      </>
    );

    const live = observers.filter((o) => !o.disconnected);
    expect(live).toHaveLength(1);
    expect(live[0].targets).toContain(region());
    expect(region()).toHaveAttribute('data-playback', 'playing');
    reportVisibility(false);
    expect(region()).toHaveAttribute('data-playback', 'paused');
    reportVisibility(true);
    expect(region()).toHaveAttribute('data-playback', 'playing');
  });

  it('gives seven commands seven dots in a wrapping bar', () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({
      ...COMMANDS[i % 4],
      input: `box uuid ${i + 1}`,
    }));
    setup(seven);
    const bar = within(region()).getByRole('group', { name: 'Commands' });
    expect(within(bar).getAllByRole('button', { name: /^Go to command/ })).toHaveLength(7);
    expect(bar).toHaveClass('flex-wrap');
  });
});

describe('DemoTerminal lines (D-26)', () => {
  it('names the region and the title bar after the project, with no Request label', () => {
    setup();
    expect(region()).toBeInTheDocument();
    expect(
      within(region()).getByText((_, el) => el?.tagName === 'P' && el.textContent === 'box · 1 / 4')
    ).toBeInTheDocument();
    expect(region()).not.toHaveTextContent('Request');
    // The Pause icon is the only drawn icon: no warning icon line.
    expect(region().querySelectorAll('svg')).toHaveLength(1);
  });

  it('draws a note once, under its output, in the hidden body', () => {
    setup();
    const notes = region().querySelectorAll('[data-note]');
    expect(notes).toHaveLength(1);
    expect(notes[0]).toHaveTextContent(NOTE);
    expect(cell(1)).toContainElement(notes[0] as HTMLElement);
    expect(cell(1)).toHaveAttribute('aria-hidden', 'true');
    expect(cell(1).textContent?.indexOf(NOTE)).toBeGreaterThan(
      cell(1).textContent?.indexOf('notes.txt af1349b9') ?? Infinity
    );
  });

  it('draws no note element for a command without a note', () => {
    setup();
    expect(cell(2).querySelector('[data-note]')).toBeNull();
    expect(cell(3).querySelector('[data-note]')).toBeNull();
  });
});

describe('DemoTerminal body height (12-UI-SPEC D-24, E13)', () => {
  /** Every drawn cell of the body: the commands and the typing command's reservation copy. */
  function drawnCells(): HTMLElement[] {
    const body = cell(1).parentElement as HTMLElement;
    return Array.from(body.children) as HTMLElement[];
  }

  it('renders every command in one shared grid cell, only the current one visible', () => {
    setup();
    const body = cell(1).parentElement as HTMLElement;
    // The layout contract: a grid body, each entry placed in grid-area 1 / 1.
    expect(body).toHaveClass('grid');
    const cells = drawnCells();
    expect(cells).toHaveLength(COMMANDS.length);
    cells.forEach((el) => expect(el).toHaveClass('[grid-area:1/1]'));
    COMMANDS.forEach((c, i) => {
      // Every entry's full text is present, so the tallest one sizes the body.
      expect(cell(i + 1)).toHaveTextContent(c.input);
      expect(cell(i + 1)).toHaveTextContent(c.output);
      expect(cell(i + 1)).toHaveAttribute('aria-hidden', 'true');
      if (i === 0) expect(cell(i + 1)).not.toHaveClass('invisible');
      else expect(cell(i + 1)).toHaveClass('invisible');
    });
  });

  it('holds the typing command at full height in the same cell, so typing shifts nothing', () => {
    setup();
    advance(3000 + 50 * 3); // command 2 is typing
    const cells = drawnCells();
    // The commands plus one invisible complete copy of the typing command.
    expect(cells).toHaveLength(COMMANDS.length + 1);
    cells.forEach((el) => expect(el).toHaveClass('[grid-area:1/1]'));
    const copy = cells.find((el) => !el.hasAttribute('data-cell')) as HTMLElement;
    expect(copy).toHaveClass('invisible');
    expect(copy).toHaveAttribute('aria-hidden', 'true');
    expect(copy).toHaveTextContent('show disk');
    expect(copy).toHaveTextContent('df -h');
  });
});

describe('DemoTerminal screen-reader text', () => {
  it('holds the full current command, silent while playing and polite while paused', () => {
    setup();
    const text = screen.getByText(
      `Command 1 of 4. Command: box hash notes.txt. Output: notes.txt af1349b9. ${NOTE}`
    );
    expect(text.closest('[aria-live]')).toHaveAttribute('aria-live', 'off');

    fireEvent.click(toggle());
    expect(text.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
  });

  it('ends at the output when the command has no note', () => {
    setup();
    fireEvent.click(within(region()).getByRole('button', { name: 'Go to command 4' }));
    expect(
      screen.getByText('Command 4 of 4. Command: box epoch 0. Output: 1970-01-01T00:00:00Z.')
    ).toBeInTheDocument();
  });
});
