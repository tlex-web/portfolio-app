import { render, screen } from '@testing-library/react';
// eslint-disable-next-line no-restricted-imports -- the control case needs the bare Canvas
import { Canvas } from '@react-three/fiber';
import SafeCanvas from '../SafeCanvas';

let mockCanvasError: Error | null = null;
let mockCanvasProps: Record<string, unknown> | null = null;

// Stands in for R3F's <Canvas>. Since 9.8 it rethrows a WebGLRenderer that could not be created
// (no WebGL) from its own render; the error case reproduces exactly that.
jest.mock('@react-three/fiber', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  return {
    Canvas: (props: Record<string, unknown>) => {
      mockCanvasProps = props;
      if (mockCanvasError) throw mockCanvasError;
      return createElement('canvas', { 'data-testid': 'r3f-canvas' });
    },
  };
});

describe('SafeCanvas', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    mockCanvasError = null;
    mockCanvasProps = null;
    // React reports every caught render error through console.error
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renders the canvas when WebGL is available', () => {
    render(<SafeCanvas />);

    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
  });

  it('control: a bare Canvas without WebGL throws out of the tree', () => {
    mockCanvasError = new Error('Error creating WebGL context.');

    expect(() => render(<Canvas />)).toThrow('Error creating WebGL context.');
  });

  it('keeps the rest of the page when the WebGL context cannot be created', () => {
    mockCanvasError = new Error('Error creating WebGL context.');

    const { container } = render(
      <main>
        <h1>Scene fallback</h1>
        <SafeCanvas className="absolute inset-0" style={{ opacity: 0.5 }} />
        <label htmlFor="name">Name</label>
        <input id="name" />
      </main>
    );

    expect(screen.getByRole('heading', { name: 'Scene fallback' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.queryByTestId('r3f-canvas')).not.toBeInTheDocument();
    // An empty canvas in the same wrapper box remains, as with R3F < 9.8
    const inert = container.querySelector('canvas');
    expect(inert).toBeInTheDocument();
    expect(inert?.parentElement?.parentElement).toHaveClass('absolute', 'inset-0');
    expect(inert?.parentElement?.parentElement).toHaveStyle({ opacity: '0.5', height: '100%' });
  });

  describe('onCanvasError (D-18: a failed canvas turns Home static)', () => {
    it('is called once with the error when the canvas throws, and the inert canvas renders', () => {
      const error = new Error('Error creating WebGL context.');
      mockCanvasError = error;
      const onCanvasError = jest.fn();

      const { container } = render(<SafeCanvas className="absolute inset-0" onCanvasError={onCanvasError} />);

      expect(onCanvasError).toHaveBeenCalledTimes(1);
      expect(onCanvasError).toHaveBeenCalledWith(error);
      expect(screen.queryByTestId('r3f-canvas')).not.toBeInTheDocument();
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('is not called while the canvas renders', () => {
      const onCanvasError = jest.fn();

      render(<SafeCanvas onCanvasError={onCanvasError} />);

      expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
      expect(onCanvasError).not.toHaveBeenCalled();
    });

    it('is not forwarded to the R3F Canvas', () => {
      render(<SafeCanvas frameloop="demand" onCanvasError={jest.fn()} />);

      expect(mockCanvasProps).not.toBeNull();
      expect(mockCanvasProps).toHaveProperty('frameloop', 'demand');
      expect(mockCanvasProps).not.toHaveProperty('onCanvasError');
    });

    it('without the prop, a throwing canvas still falls back to the inert canvas', () => {
      mockCanvasError = new Error('Error creating WebGL context.');

      const { container } = render(<SafeCanvas />);

      expect(container.querySelector('canvas')).toBeInTheDocument();
      expect(screen.queryByTestId('r3f-canvas')).not.toBeInTheDocument();
    });
  });

  // 07 WR-07: the boundary used to swallow every error below it. A scene bug (anything but
  // the expected no-WebGL failure) is now logged once, and still reaches onCanvasError.
  describe('logging (07 WR-07)', () => {
    /** The boundary's own console.error calls (React logs caught errors separately). */
    const ownLogs = () => consoleError.mock.calls.filter((args) => args[0] === '[SafeCanvas]');

    it('logs a non-WebGL error once and still forwards it to onCanvasError', () => {
      const error = new TypeError("Cannot read properties of undefined (reading 'position')");
      mockCanvasError = error;
      const onCanvasError = jest.fn();

      const { container } = render(<SafeCanvas onCanvasError={onCanvasError} />);

      expect(ownLogs()).toEqual([['[SafeCanvas]', error]]);
      expect(onCanvasError).toHaveBeenCalledTimes(1);
      expect(onCanvasError).toHaveBeenCalledWith(error);
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it.each([
      'THREE.WebGLRenderer: Error creating WebGL context.',
      'THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.',
    ])('stays silent for the expected no-WebGL failure: %s', (message) => {
      const error = new Error(message);
      mockCanvasError = error;
      const onCanvasError = jest.fn();

      render(<SafeCanvas onCanvasError={onCanvasError} />);

      expect(ownLogs()).toEqual([]);
      expect(onCanvasError).toHaveBeenCalledWith(error);
    });
  });
});
