import { render, screen } from '@testing-library/react';
// eslint-disable-next-line no-restricted-imports -- the control case needs the bare Canvas
import { Canvas } from '@react-three/fiber';
import SafeCanvas from '../SafeCanvas';

let mockCanvasError: Error | null = null;

// Stands in for R3F's <Canvas>. Since 9.8 it rethrows a WebGLRenderer that could not be created
// (no WebGL) from its own render; the error case reproduces exactly that.
jest.mock('@react-three/fiber', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  return {
    Canvas: () => {
      if (mockCanvasError) throw mockCanvasError;
      return createElement('canvas', { 'data-testid': 'r3f-canvas' });
    },
  };
});

describe('SafeCanvas', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    mockCanvasError = null;
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
        <h1>Get in Touch</h1>
        <SafeCanvas className="absolute inset-0" style={{ opacity: 0.5 }} />
        <label htmlFor="name">Name</label>
        <input id="name" />
      </main>
    );

    expect(screen.getByRole('heading', { name: 'Get in Touch' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.queryByTestId('r3f-canvas')).not.toBeInTheDocument();
    // An empty canvas in the same wrapper box remains, as with R3F < 9.8
    const inert = container.querySelector('canvas');
    expect(inert).toBeInTheDocument();
    expect(inert?.parentElement?.parentElement).toHaveClass('absolute', 'inset-0');
    expect(inert?.parentElement?.parentElement).toHaveStyle({ opacity: '0.5', height: '100%' });
  });
});
