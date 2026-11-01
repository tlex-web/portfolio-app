/**
 * The route-log filter island (ROUTE-02, 10 D-14; 11-UI-SPEC "RouteLogFilters";
 * RESEARCH Pattern 1). The rewrite of the v1 RoadmapFilters tests: two toggle
 * groups, 'Project' and 'Status', each a role=group named by its visible label
 * and holding four aria-pressed buttons. A press flips aria-pressed at once
 * (useOptimistic inside a transition) and replaces the URL with
 * routeLogHref(next) and scrolling off, so the filter lives only in the URL and
 * adds no history entry. Zero-count segments are aria-disabled but stay
 * focusable; the pressed segment is never disabled.
 *
 * The navigation harness stands in for the Next router: the mocked replace sets
 * state inside the island's transition and that state suspends, so the
 * transition stays pending the way a real navigation does while the server
 * render is on its way. That is what keeps the optimistic aria-pressed on
 * screen before any rerender with new props.
 */
import { Suspense, use, useLayoutEffect, useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RouteLogFilters from '@/components/roadmap/RouteLogFilters';
import type { LogCounts, LogFilter } from '@/lib/route-log';

let navigate: (href: string) => void = () => {};
const replace = jest.fn((href: string) => navigate(href));
const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push, back: jest.fn() }),
}));

const pendingServerRender = new Promise<never>(() => {});

function Navigation({ href }: { href: string | null }) {
  if (href !== null) use(pendingServerRender);
  return null;
}

function Harness(props: { filter: LogFilter; counts: LogCounts }) {
  const [href, setHref] = useState<string | null>(null);
  useLayoutEffect(() => {
    navigate = setHref;
  }, []);
  return (
    <>
      <RouteLogFilters {...props} />
      <Suspense fallback={null}>
        <Navigation href={href} />
      </Suspense>
    </>
  );
}

const ALL: LogFilter = { project: 'all', status: 'all' };

/** Counts as the page computes them for {all, all} with the shipped rows. */
const COUNTS: LogCounts = {
  project: { all: 7, portfolio: 2, box: 2, 'coin-flip': 3 },
  status: { all: 7, planned: 2, 'in-progress': 1, completed: 4 },
};

/** Counts under {box, all}: box has no planned and no in-progress entry. */
const BOX_COUNTS: LogCounts = {
  project: { all: 7, portfolio: 2, box: 2, 'coin-flip': 3 },
  status: { all: 2, planned: 0, 'in-progress': 0, completed: 2 },
};

function group(name: 'Project' | 'Status') {
  return screen.getByRole('group', { name });
}

function segments(name: 'Project' | 'Status') {
  return within(group(name)).getAllByRole('button');
}

function segment(name: 'Project' | 'Status', label: string) {
  return within(group(name)).getByRole('button', { name: new RegExp(`^${label} \\d+ entries$`) });
}

/**
 * A press that navigates suspends the harness, so it runs inside an awaited
 * act (React asks for that whenever a component suspends inside act).
 */
async function press(button: HTMLElement) {
  await act(async () => {
    fireEvent.click(button);
  });
}

beforeEach(() => {
  replace.mockClear();
  push.mockClear();
  navigate = () => {};
});

describe('RouteLogFilters (ROUTE-02)', () => {
  it("renders the 'Project' and 'Status' groups, each named by its visible label, in segment order", () => {
    render(<Harness filter={ALL} counts={COUNTS} />);
    for (const name of ['Project', 'Status'] as const) {
      const labelId = group(name).getAttribute('aria-labelledby');
      expect(labelId).toBeTruthy();
      expect(document.getElementById(labelId as string)).toHaveTextContent(name);
    }
    expect(segments('Project').map((b) => b.textContent)).toEqual([
      'All 7 entries',
      'Portfolio 2 entries',
      'box 2 entries',
      'coin-flip 3 entries',
    ]);
    expect(segments('Status').map((b) => b.textContent)).toEqual([
      'All 7 entries',
      'Planned 2 entries',
      'In progress 1 entries',
      'Completed 4 entries',
    ]);
    for (const button of [...segments('Project'), ...segments('Status')]) {
      expect(button).toHaveAttribute('type', 'button');
    }
  });

  it('with filter {all, all} only the two All segments are pressed', () => {
    render(<Harness filter={ALL} counts={COUNTS} />);
    expect(segments('Project').map((b) => b.getAttribute('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);
    expect(segments('Status').map((b) => b.getAttribute('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);
  });

  it("names each segment '{label} {count} entries' from the counts prop", () => {
    render(<Harness filter={ALL} counts={COUNTS} />);
    expect(screen.getByRole('button', { name: 'coin-flip 3 entries' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'In progress 1 entries' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Completed 4 entries' })).toBeInTheDocument();
    expect(
      within(group('Project')).getByRole('button', { name: 'All 7 entries' })
    ).toBeInTheDocument();
  });

  it("pressing 'box' presses it at once and replaces the URL with scrolling off, never pushing", async () => {
    render(<Harness filter={ALL} counts={COUNTS} />);
    await press(segment('Project', 'box'));
    expect(segment('Project', 'box')).toHaveAttribute('aria-pressed', 'true');
    expect(segment('Project', 'All')).toHaveAttribute('aria-pressed', 'false');
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/roadmap?project=box', { scroll: false });
    expect(push).not.toHaveBeenCalled();
  });

  it("with filter {box, all}, pressing 'Planned' keeps the project in the href", async () => {
    const counts: LogCounts = { ...BOX_COUNTS, status: { ...BOX_COUNTS.status, planned: 1 } };
    render(<Harness filter={{ project: 'box', status: 'all' }} counts={counts} />);
    await press(segment('Status', 'Planned'));
    expect(replace).toHaveBeenCalledWith('/roadmap?project=box&status=planned', { scroll: false });
  });

  it('pressing All in a group drops that parameter from the href', async () => {
    const counts: LogCounts = {
      project: { all: 2, portfolio: 0, box: 0, 'coin-flip': 2 },
      status: { all: 2, planned: 0, 'in-progress': 0, completed: 2 },
    };
    render(<Harness filter={{ project: 'box', status: 'completed' }} counts={counts} />);
    await press(segment('Project', 'All'));
    expect(replace).toHaveBeenCalledWith('/roadmap?status=completed', { scroll: false });
  });

  it('pressing the pressed segment does nothing', async () => {
    const user = userEvent.setup();
    render(<Harness filter={{ project: 'box', status: 'all' }} counts={BOX_COUNTS} />);
    await user.click(segment('Project', 'box'));
    await user.click(segment('Status', 'All'));
    expect(replace).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(segment('Project', 'box')).toHaveAttribute('aria-pressed', 'true');
  });

  it('a zero-count segment is aria-disabled, stays in the tab order and ignores presses', async () => {
    const user = userEvent.setup();
    render(<Harness filter={{ project: 'box', status: 'all' }} counts={BOX_COUNTS} />);
    const planned = segment('Status', 'Planned');
    expect(planned).toHaveAttribute('aria-disabled', 'true');
    expect(planned).not.toBeDisabled();
    expect(segment('Status', 'In progress')).toHaveAttribute('aria-disabled', 'true');
    expect(segment('Status', 'Completed')).not.toHaveAttribute('aria-disabled');

    let reached = false;
    for (let i = 0; i < 8 && !reached; i++) {
      await user.tab();
      reached = document.activeElement === planned;
    }
    expect(reached).toBe(true);

    await user.click(planned);
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(replace).not.toHaveBeenCalled();
    expect(planned).toHaveAttribute('aria-pressed', 'false');
  });

  it('the pressed segment is never disabled, even when a hand-typed URL selects zero entries', () => {
    const counts: LogCounts = {
      project: { all: 1, portfolio: 1, box: 0, 'coin-flip': 0 },
      status: { all: 2, planned: 0, 'in-progress': 0, completed: 2 },
    };
    render(<Harness filter={{ project: 'box', status: 'in-progress' }} counts={counts} />);
    const box = segment('Project', 'box');
    const inProgress = segment('Status', 'In progress');
    expect(box).toHaveAttribute('aria-pressed', 'true');
    expect(box).not.toHaveAttribute('aria-disabled');
    expect(inProgress).toHaveAttribute('aria-pressed', 'true');
    expect(inProgress).not.toHaveAttribute('aria-disabled');
    expect(segment('Project', 'coin-flip')).toHaveAttribute('aria-disabled', 'true');
  });

  it('Enter or Space on a focused enabled segment presses it like a click', async () => {
    const user = userEvent.setup();
    render(<Harness filter={ALL} counts={COUNTS} />);
    segment('Status', 'Completed').focus();
    await act(async () => {
      await user.keyboard('{Enter}');
    });
    expect(segment('Status', 'Completed')).toHaveAttribute('aria-pressed', 'true');
    expect(replace).toHaveBeenCalledWith('/roadmap?status=completed', { scroll: false });
  });
});
