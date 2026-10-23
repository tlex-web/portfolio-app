'use client';

import { Component, type ReactNode } from 'react';
// eslint-disable-next-line no-restricted-imports -- the one wrapper; everything else uses SafeCanvas
import { Canvas, type CanvasProps } from '@react-three/fiber';

interface CanvasErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface CanvasErrorBoundaryState {
  failed: boolean;
}

/** Renders `fallback` once anything below it throws. Exported for tests; use SafeCanvas. */
export class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * The DOM R3F's <Canvas> leaves in the page when it cannot render: its wrapper divs and an
 * empty <canvas>. Same box as the live canvas, so the layout does not change.
 */
function InertCanvas({
  className,
  style,
  fallback,
}: Pick<CanvasProps, 'className' | 'style' | 'fallback'>) {
  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}
    >
      <div style={{ width: '100%', height: '100%' }}>
        <canvas style={{ display: 'block' }}>{fallback}</canvas>
      </div>
    </div>
  );
}

/**
 * Drop-in replacement for react-three-fiber's <Canvas> that cannot take down the route.
 *
 * Since @react-three/fiber 9.8 a WebGLRenderer that cannot be created (no WebGL: hardware
 * acceleration off, webgl.disabled, headless Firefox on CI) is rethrown through React
 * (`configure().catch(setError)`, then `throw error` in the Canvas render). Without a boundary
 * that error reaches app/(site)/error.tsx and replaces the whole page. Here the canvas turns into an
 * empty one instead, which is what users without WebGL got before 9.8: a blank 3D area on an
 * intact page.
 */
export default function SafeCanvas(props: CanvasProps) {
  return (
    <CanvasErrorBoundary
      fallback={
        <InertCanvas className={props.className} style={props.style} fallback={props.fallback} />
      }
    >
      <Canvas {...props} />
    </CanvasErrorBoundary>
  );
}
