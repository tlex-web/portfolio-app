'use client';

import { MotionConfig } from 'motion/react';
import { DURATION, EASING } from '@/lib/animations';

/**
 * App-wide motion safety net (DSGN-08).
 *
 * `reducedMotion="user"` makes every motion/react animation honour the OS
 * prefers-reduced-motion setting (transform and layout animations settle to
 * their final state), and the default transition uses the shared motion tokens.
 * Plan 07-22 moves this mount from the root layout into SiteChrome.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: DURATION.enter, ease: [...EASING.geological] }}
    >
      {children}
    </MotionConfig>
  );
}
