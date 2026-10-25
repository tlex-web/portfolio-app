'use client';

import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { useMotionValueEvent, useScroll, useSpring, type MotionValue } from 'motion/react';
import { DURATION } from '@/lib/animations';
import {
  arrivalsFromBlocks,
  mapProgress,
  shouldSnap,
  type AscentLayout,
} from '@/lib/ascent/progress';

/**
 * The one ascent progress value (HOME-03, HOME-04; D-01, D-06; 09-UI-SPEC
 * "Ascent Mapping"; 09-RESEARCH Pattern 4). Client island around the Server
 * AscentHero grid.
 *
 * Page scroll (Motion useScroll() with no target: target mode runs on a native
 * ViewTimeline whose inset follows scroll-padding, STATE 07-21) is mapped to p
 * over a measured layout and fed into ONE spring (DURATION.panel, no bounce).
 * The rail, the lit pin and the 3D camera all read that spring, so they never
 * disagree. The spring is set by hand: a jump of more than one leg snaps
 * (spring.jump) so the visitor never watches a fast fly-through (D-06).
 *
 * Scrolling stays native: no wheel or touch listener, no scroll snapping, no
 * smooth scrolling. Per-frame work writes refs and the DOM, never React state.
 *
 * Measured on mount, on window resize and through a ResizeObserver on the
 * track: `[data-ascent-track]`, `[data-ascent-stage]` (its computed sticky top
 * gives the nav offset) and every waypoint and summit block. A layout with no
 * sticky distance (nothing to scroll through) leaves the layout null and the
 * progress at 0.
 */

type AscentContextValue = {
  /** The damped progress value p in [0, 1]. */
  progress: MotionValue<number>;
  /** The measured layout, or null before the first measurement. */
  layout: RefObject<AscentLayout | null>;
  /** Number of waypoints. */
  n: number;
  /** Waypoint heights in ascent order, then the summit height (length n + 1). */
  heights: readonly number[];
  rootRef: RefObject<HTMLDivElement | null>;
};

const AscentContext = createContext<AscentContextValue | null>(null);

/** The ascent context; throws outside an AscentController. */
export function useAscent(): AscentContextValue {
  const value = useContext(AscentContext);
  if (!value) throw new Error('useAscent must be used inside <AscentController>');
  return value;
}

const BLOCKS = '[data-ascent-block="waypoint"], [data-ascent-block="summit"]';

/** Reads the ascent layout from the DOM, or null when there is no sticky distance. */
function measureLayout(root: HTMLElement): AscentLayout | null {
  const track = root.querySelector<HTMLElement>('[data-ascent-track]');
  const stage = root.querySelector<HTMLElement>('[data-ascent-stage]');
  if (!track || !stage) return null;

  const trackRect = track.getBoundingClientRect();
  const stageHeight = stage.getBoundingClientRect().height;
  const distance = trackRect.height - stageHeight;
  if (!(distance > 0)) return null;

  const stickyTop = Number.parseFloat(getComputedStyle(stage).top) || 0;
  const blocks = Array.from(track.querySelectorAll<HTMLElement>(BLOCKS), (block) => {
    const rect = block.getBoundingClientRect();
    return { offset: rect.top - trackRect.top, height: rect.height };
  });

  return {
    start: trackRect.top + window.scrollY - stickyTop,
    distance,
    arrivals: arrivalsFromBlocks(blocks, stageHeight, distance),
  };
}

export default function AscentController({
  children,
  n,
  heights,
}: {
  children: ReactNode;
  n: number;
  heights: readonly number[];
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const layout = useRef<AscentLayout | null>(null);
  const { scrollY } = useScroll();
  const progress = useSpring(0, { visualDuration: DURATION.panel, bounce: 0 });

  /** Moves the spring towards the progress at scroll offset y (snap on a jump of more than one leg). */
  const follow = (y: number, snap: boolean) => {
    const current = layout.current;
    if (!current) return;
    const p = mapProgress(y, current);
    if (snap || shouldSnap(progress.get(), p, n)) progress.jump(p);
    else progress.set(p);
  };

  useMotionValueEvent(scrollY, 'change', (y) => follow(y, false));

  /** Re-reads the layout; returns true once there is one. The first one lands without animating. */
  const measure = useEffectEvent((snap: boolean): boolean => {
    const root = rootRef.current;
    layout.current = root ? measureLayout(root) : null;
    follow(window.scrollY, snap);
    return layout.current !== null;
  });

  useEffect(() => {
    let measured = measure(true);
    const remeasure = () => {
      measured = measure(!measured) || measured;
    };

    window.addEventListener('resize', remeasure);
    const track = rootRef.current?.querySelector('[data-ascent-track]');
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(remeasure);
    if (observer && track) observer.observe(track);
    return () => {
      window.removeEventListener('resize', remeasure);
      observer?.disconnect();
    };
  }, []);

  return (
    <AscentContext.Provider value={{ progress, layout, n, heights, rootRef }}>
      <div ref={rootRef} data-ascent-root>
        {children}
      </div>
    </AscentContext.Provider>
  );
}
