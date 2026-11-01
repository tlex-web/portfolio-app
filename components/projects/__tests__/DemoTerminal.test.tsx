/**
 * The CLI_X demo terminal island (ENG-05; 11 D-02 pause sources, D-03
 * selector dots; 11-UI-SPEC "Demo — DemoTerminal", G2 one command, G3 seven
 * or more; 11-RESEARCH Pitfall 1 single timer).
 *
 * Fake timers drive the one pending timeout. State is read from
 * `data-playback` / `data-command` on the region, `aria-pressed` on the Pause
 * toggle, `aria-current` on the dots, `aria-live` on the screen-reader text
 * and the text itself, never from colour classes. Each command is rendered in
 * its own `data-cell` of one shared grid cell, so the current one is read
 * through its cell.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DemoTerminal from '@/components/projects/DemoTerminal';
import type { DemoCommand } from '@/data/types';

const COMMANDS: DemoCommand[] = [
  { input: 'list files', output: 'ls', riskLevel: 'low', riskScore: 0.05, explanation: 'Read-only listing' },
  { input: 'show disk', output: 'df -h', riskLevel: 'low', riskScore: 0.15 },
  {
    input: 'archive docs',
    output: 'tar -czf docs.tgz docs',
    riskLevel: 'low',
    riskScore: 0.29,
    explanation: 'Safe backup',
  },
  {
    input: 'kill chrome',
    output: 'pkill -f chrome',
    riskLevel: 'critical',
    riskScore: 0.87,
    warning: 'This command terminates running processes',
    explanation: 'High-risk operation',
  },
];

/** IntersectionObserver instances created by the island, so a test can report visibility. */
let observers: { callback: IntersectionObserverCallback; disconnected: boolean }[] = [];
const OriginalIO = window.IntersectionObserver;

class CapturingIntersectionObserver {
  record: { callback: IntersectionObserverCallback; disconnected: boolean };
  constructor(callback: IntersectionObserverCallback) {
    this.record = { callback, disconnected: false };
    observers.push(this.record);
  }
  observe() {}
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
  return screen.getByRole('region', { name: 'CLI_X demo' });
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

function setup(commands: readonly DemoCommand[] = COMMANDS) {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const view = render(
    <>
      <DemoTerminal commands={commands} />
      <button type="button">Outside</button>
    </>
  );
  return { user, ...view };
}

beforeEach(() => {
  jest.useFakeTimers();
  observers = [];
  window.IntersectionObserver = CapturingIntersectionObserver as unknown as typeof IntersectionObserver;
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
    expect(cell(1)).toHaveTextContent('list files');
    expect(cell(1)).toHaveTextContent('ls');

    advance(3000);
    expect(region()).toHaveAttribute('data-command', '2');
    advance(50 * 3);
    // Three characters of 'show disk' typed, the command line still empty.
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

  it('advances one complete command per 3000 ms once un-pressed', () => {
    setReducedMotion(true);
    setup();
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
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
    expect(cell(1)).toHaveTextContent('list files');
  });

  it('gives seven commands seven dots in a wrapping bar', () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({ ...COMMANDS[i % 4], input: `request ${i + 1}` }));
    setup(seven);
    const bar = within(region()).getByRole('group', { name: 'Commands' });
    expect(within(bar).getAllByRole('button', { name: /^Go to command/ })).toHaveLength(7);
    expect(bar).toHaveClass('flex-wrap');
  });
});

describe('DemoTerminal screen-reader text', () => {
  it('holds the full current command, silent while playing and polite while paused', () => {
    setup();
    const text = screen.getByText('Command 1 of 4. Request: list files. Command: ls. Read-only listing.');
    expect(text.closest('[aria-live]')).toHaveAttribute('aria-live', 'off');

    fireEvent.click(toggle());
    expect(text.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
  });

  it('adds the warning and the explanation when both exist', () => {
    setup();
    fireEvent.click(within(region()).getByRole('button', { name: 'Go to command 4' }));
    expect(
      screen.getByText(
        'Command 4 of 4. Request: kill chrome. Command: pkill -f chrome. This command terminates running processes. High-risk operation.'
      )
    ).toBeInTheDocument();
  });
});
