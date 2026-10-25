/**
 * HOME-02, HOME-07 (D-18, D-21; 09-RESEARCH Pattern 2): the client store
 * behind the capability gate. 'pending' on the server, the device's mode after
 * hydration, one released WebGL2 probe per page view, reduced motion read
 * live, and a sticky runtime downgrade.
 */
import { act, render, renderHook, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { downgradeAscent, resetAscentModeForTests, useAscentMode } from '../useAscentMode';

function ModeProbe() {
  return <span data-testid="mode">{useAscentMode()}</span>;
}

describe('useAscentMode', () => {
  let reduce: boolean;
  let changeListeners: Array<(event: MediaQueryListEvent) => void>;
  let getContext: jest.SpyInstance;
  let loseContext: jest.Mock;
  let mark: jest.Mock;
  const originalMark = performance.mark;

  beforeEach(() => {
    resetAscentModeForTests();
    reduce = false;
    changeListeners = [];
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        get matches() {
          return query === '(prefers-reduced-motion: reduce)' && reduce;
        },
        media: query,
        onchange: null,
        addEventListener: jest.fn((type: string, listener: (e: MediaQueryListEvent) => void) => {
          if (type === 'change') changeListeners.push(listener);
        }),
        removeEventListener: jest.fn((type: string, listener: (e: MediaQueryListEvent) => void) => {
          if (type === 'change') changeListeners = changeListeners.filter((l) => l !== listener);
        }),
        dispatchEvent: jest.fn(),
      })),
    });

    loseContext = jest.fn();
    const gl = {
      getParameter: jest.fn(() => 16384),
      getExtension: jest.fn((name: string) => (name === 'WEBGL_lose_context' ? { loseContext } : null)),
    };
    getContext = jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation((() => gl) as unknown as HTMLCanvasElement['getContext']);

    mark = jest.fn();
    Object.defineProperty(performance, 'mark', { configurable: true, writable: true, value: mark });
  });

  afterEach(() => {
    getContext.mockRestore();
    Object.defineProperty(performance, 'mark', { configurable: true, writable: true, value: originalMark });
    Reflect.deleteProperty(navigator, 'connection');
    Reflect.deleteProperty(navigator, 'deviceMemory');
  });

  const setReduce = (value: boolean) =>
    act(() => {
      reduce = value;
      changeListeners.forEach((listener) => listener({ matches: value } as MediaQueryListEvent));
    });

  it("renders 'pending' on the server", () => {
    expect(renderToString(<ModeProbe />)).toContain('pending');
  });

  it("returns 'eligible' on a capable client", () => {
    const { result } = renderHook(() => useAscentMode());
    expect(result.current).toBe('eligible');
  });

  it("returns 'static-reduced' after a reduced-motion change event", () => {
    const { result } = renderHook(() => useAscentMode());
    expect(result.current).toBe('eligible');
    setReduce(true);
    expect(result.current).toBe('static-reduced');
  });

  it('probes WebGL2 once across renders and releases the probe context', () => {
    const { rerender } = render(<ModeProbe />);
    rerender(<ModeProbe />);
    rerender(<ModeProbe />);
    renderHook(() => useAscentMode());

    expect(screen.getByTestId('mode')).toHaveTextContent('eligible');
    expect(getContext).toHaveBeenCalledTimes(1);
    expect(getContext).toHaveBeenCalledWith('webgl2', { failIfMajorPerformanceCaveat: true });
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it("returns 'static' without a WebGL2 context", () => {
    getContext.mockImplementation((() => null) as unknown as HTMLCanvasElement['getContext']);
    const { result } = renderHook(() => useAscentMode());
    expect(result.current).toBe('static');
  });

  it("returns 'static' for Save-Data without probing WebGL", () => {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
    const { result } = renderHook(() => useAscentMode());
    expect(result.current).toBe('static');
    expect(getContext).not.toHaveBeenCalled();
  });

  it("returns 'static' for deviceMemory 2", () => {
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 2 });
    const { result } = renderHook(() => useAscentMode());
    expect(result.current).toBe('static');
  });

  it('a downgrade is sticky: static from then on, a second call changes nothing', () => {
    const { result } = renderHook(() => useAscentMode());
    expect(result.current).toBe('eligible');

    act(() => downgradeAscent('context-lost'));
    expect(result.current).toBe('static');
    expect(mark).toHaveBeenCalledTimes(1);
    expect(mark).toHaveBeenCalledWith('ascent-downgrade', { detail: { reason: 'context-lost' } });

    act(() => downgradeAscent('frame-budget'));
    expect(result.current).toBe('static');
    expect(mark).toHaveBeenCalledTimes(1);
  });

  it("reads 'static-reduced' under reduced motion after a downgrade", () => {
    const { result } = renderHook(() => useAscentMode());
    act(() => downgradeAscent('load-error'));
    setReduce(true);
    expect(result.current).toBe('static-reduced');
    setReduce(false);
    expect(result.current).toBe('static');
  });
});
