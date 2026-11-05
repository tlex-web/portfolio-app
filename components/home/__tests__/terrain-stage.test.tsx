/**
 * The Home canvas arm order (D-25, HOME-08; 09-RESEARCH Pattern 3).
 *
 * The idle arm (requestIdleCallback, or the 2000 ms timer where it is missing)
 * starts only after the window load event, so the three/R3F chunk no longer
 * holds back `loadEventStart` on a slow phone. The first passive scroll still
 * arms the stage at once, and an ineligible stage never arms.
 */
import { act, render, screen } from '@testing-library/react';
import TerrainStage from '../TerrainStage';
import { terrain } from '@/data/generated/terrain';
import type { AscentMode } from '@/lib/ascent/capability';

let mockMode: AscentMode | 'pending' = 'eligible';
const mockStageRef = { current: null };
jest.mock('@/components/home/AscentController', () => ({
  useAscent: () => ({ mode: mockMode, stageRef: mockStageRef }),
}));

// The canvas chunk itself is out of scope here: a stub stands in for the
// next/dynamic component so a render proves the stage armed.
jest.mock('next/dynamic', () => () => {
  function TerrainCanvasStub({ gridSize }: { gridSize: number }) {
    return <div data-testid="terrain-canvas" data-grid={gridSize} />;
  }
  return TerrainCanvasStub;
});

let readyState: DocumentReadyState = 'complete';
const idleCallbacks: IdleRequestCallback[] = [];
const requestIdle = jest.fn((cb: IdleRequestCallback) => {
  idleCallbacks.push(cb);
  return idleCallbacks.length;
});
const cancelIdle = jest.fn();

function fireIdle() {
  const cb = idleCallbacks.at(-1);
  if (!cb) throw new Error('no idle callback was scheduled');
  act(() => cb({ didTimeout: false, timeRemaining: () => 50 }));
}

function setIdleApi(present: boolean) {
  if (present) {
    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      writable: true,
      value: requestIdle,
    });
    Object.defineProperty(window, 'cancelIdleCallback', {
      configurable: true,
      writable: true,
      value: cancelIdle,
    });
  } else {
    delete (window as Partial<Window>).requestIdleCallback;
    delete (window as Partial<Window>).cancelIdleCallback;
  }
}

const pins = [] as const;
const canvas = () => screen.queryByTestId('terrain-canvas');

beforeAll(() => {
  Object.defineProperty(document, 'readyState', { configurable: true, get: () => readyState });
});

afterAll(() => {
  delete (document as { readyState?: DocumentReadyState }).readyState;
  setIdleApi(false);
});

beforeEach(() => {
  mockMode = 'eligible';
  readyState = 'loading';
  idleCallbacks.length = 0;
  requestIdle.mockClear();
  cancelIdle.mockClear();
  setIdleApi(true);
});

describe('TerrainStage arm order (D-25, HOME-08)', () => {
  it('schedules no idle callback while the document is still loading', () => {
    render(<TerrainStage pins={pins} />);

    expect(requestIdle).not.toHaveBeenCalled();
    expect(canvas()).toBeNull();
  });

  it('schedules the idle callback on the window load event, and the canvas renders when it fires', () => {
    render(<TerrainStage pins={pins} />);
    expect(requestIdle).not.toHaveBeenCalled();

    readyState = 'complete';
    act(() => {
      window.dispatchEvent(new Event('load'));
    });
    expect(requestIdle).toHaveBeenCalledTimes(1);
    expect(requestIdle).toHaveBeenCalledWith(expect.any(Function), { timeout: 4000 });
    expect(canvas()).toBeNull();

    fireIdle();
    expect(canvas()).toHaveAttribute('data-grid', String(terrain.grids.desktop));
  });

  it('schedules the idle callback at once when the page has already loaded', () => {
    readyState = 'complete';
    render(<TerrainStage pins={pins} />);

    expect(requestIdle).toHaveBeenCalledTimes(1);
    fireIdle();
    expect(canvas()).not.toBeNull();
  });

  it('arms at once on a passive scroll before the load event, and the later load schedules nothing', () => {
    render(<TerrainStage pins={pins} />);

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(canvas()).not.toBeNull();

    readyState = 'complete';
    act(() => {
      window.dispatchEvent(new Event('load'));
    });
    expect(requestIdle).not.toHaveBeenCalled();
  });

  it('starts the 2000 ms fallback timer only after the load event when requestIdleCallback is missing', () => {
    jest.useFakeTimers();
    try {
      setIdleApi(false);
      render(<TerrainStage pins={pins} />);

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(canvas()).toBeNull();

      readyState = 'complete';
      act(() => {
        window.dispatchEvent(new Event('load'));
      });
      act(() => {
        jest.advanceTimersByTime(1999);
      });
      expect(canvas()).toBeNull();
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(canvas()).not.toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('removes its load listener on unmount', () => {
    const { unmount } = render(<TerrainStage pins={pins} />);
    unmount();

    readyState = 'complete';
    act(() => {
      window.dispatchEvent(new Event('load'));
    });
    expect(requestIdle).not.toHaveBeenCalled();
  });

  it.each(['static', 'static-reduced', 'pending'] as const)(
    'never arms a %s stage, on load or on scroll',
    (mode) => {
      mockMode = mode;
      render(<TerrainStage pins={pins} />);

      readyState = 'complete';
      act(() => {
        window.dispatchEvent(new Event('load'));
        window.dispatchEvent(new Event('scroll'));
      });
      expect(requestIdle).not.toHaveBeenCalled();
      expect(canvas()).toBeNull();
    }
  );
});
