'use client';

import { useReducedMotion } from '@/lib/useReducedMotion';

interface ContourBackgroundProps {
  opacity: number;
  className?: string;
}

/**
 * SVG topographic contour lines component for nav and mobile overlay backgrounds.
 *
 * Renders 7 inline SVG bezier paths that mimic topographic contour lines.
 * The SVG is 200% wide with a CSS translateX animation (contour-drift) that
 * creates an infinite scrolling effect. Reduced-motion users see static lines.
 */
export default function ContourBackground({ opacity, className }: ContourBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <svg
      className={`absolute inset-0 w-[200%] h-full pointer-events-none ${className ?? ''}`}
      viewBox="0 0 800 80"
      preserveAspectRatio="none"
      style={{ opacity }}
      aria-hidden="true"
    >
      <g className={prefersReducedMotion ? undefined : 'contour-animate'}>
        {/* Contour line 1 - upper, gentle undulation */}
        <path
          d="M0,12 Q50,8 100,14 T200,10 T300,16 T400,11 T500,15 T600,9 T700,13 T800,12"
          fill="none"
          stroke="var(--color-frost-500)"
          strokeWidth="0.5"
          strokeOpacity="0.25"
        />
        {/* Contour line 2 - upper-mid */}
        <path
          d="M0,22 C40,18 80,28 120,20 S200,26 240,22 S320,18 360,24 S440,20 480,26 S560,22 600,18 S680,24 720,20 S780,22 800,22"
          fill="none"
          stroke="var(--color-frost-500)"
          strokeWidth="0.4"
          strokeOpacity="0.2"
        />
        {/* Contour line 3 - mid, wider curves */}
        <path
          d="M0,34 Q100,28 200,38 T400,30 T600,36 T800,34"
          fill="none"
          stroke="var(--color-frost-500)"
          strokeWidth="0.6"
          strokeOpacity="0.3"
        />
        {/* Contour line 4 - center, prominent */}
        <path
          d="M0,42 C60,38 120,48 180,40 S300,46 360,42 S480,38 540,44 S660,40 720,46 S780,42 800,42"
          fill="none"
          stroke="var(--color-frost-500)"
          strokeWidth="0.8"
          strokeOpacity="0.35"
        />
        {/* Contour line 5 - mid-lower */}
        <path
          d="M0,52 Q80,48 160,56 T320,50 T480,54 T640,48 T800,52"
          fill="none"
          stroke="var(--color-frost-500)"
          strokeWidth="0.5"
          strokeOpacity="0.2"
        />
        {/* Contour line 6 - lower */}
        <path
          d="M0,62 C50,58 100,66 150,60 S250,64 300,60 S400,56 450,62 S550,58 600,64 S700,60 750,66 S800,62 800,62"
          fill="none"
          stroke="var(--color-frost-500)"
          strokeWidth="0.3"
          strokeOpacity="0.15"
        />
        {/* Contour line 7 - bottom, subtle */}
        <path
          d="M0,72 Q120,68 240,74 T480,70 T720,74 T800,72"
          fill="none"
          stroke="var(--color-frost-500)"
          strokeWidth="0.4"
          strokeOpacity="0.1"
        />
      </g>
    </svg>
  );
}
