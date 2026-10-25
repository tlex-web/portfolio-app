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
import { posterFrame } from '@/lib/ascent/poster-frame';
import {
  activePin,
  arrivalsFromBlocks,
  mapProgress,
  shouldSnap,
  type AscentLayout,
} from '@/lib/ascent/progress';
import { useReducedMotion } from '@/lib/useReducedMotion';

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
 *
 * Pins (D-09): the active pin (activePin over the measured arrivals) is kept in
 * a ref and written as `data-active` on every `[data-pin]` under the root, so
 * the poster layer and the 3D layer (09-10) light the same stage. `syncPins()`
 * re-applies it; a pin layer that mounts later calls it, so its lit state never
 * depends on when it mounted. Under reduced motion no pin is lit. Each layout
 * measurement sets `data-flip` on poster pins whose head is within 240 px of
 * the clear stage's right edge (from posterFrame and the pin's `data-u`; the
 * rail scrim is excluded from 768 px).
 *
 * Focus contract (D-08): when keyboard focus (`:focus-visible`) enters a
 * waypoint or summit block, the block is scrolled to the centre with
 * scrollIntoView({ block: 'center', behavior: 'auto' }); the spring snaps if
 * that is more than one leg. Skipped under reduced motion (natural layout).
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
  /** Applies the current active pin (or none) to every `[data-pin]` under the root. */
  syncPins: () => void;
};

const AscentContext = createContext<AscentContextValue | null>(null);

/** The ascent context; throws outside an AscentController. */
export function useAscent(): AscentContextValue {
  const value = useContext(AscentContext);
  if (!value) throw new Error('useAscent must be used inside <AscentController>');
  return value;
}

const BLOCKS = '[data-ascent-block="waypoint"], [data-ascent-block="summit"]';
const REDUCED = '(prefers-reduced-motion: reduce)';
/** A pin head this close to the stage's right edge shows its label on the left. */
const FLIP_PX = 240;

const prefersReducedMotion = () => window.matchMedia(REDUCED).matches;

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

  flipPinLabels(root, stage);

  return {
    start: trackRect.top + window.scrollY - stickyTop,
    distance,
    arrivals: arrivalsFromBlocks(blocks, stageHeight, distance),
  };
}

/**
 * Sets data-flip on each poster pin whose head is within FLIP_PX of the right
 * edge of the clear stage: the stage's right edge, or from 768 px the left edge
 * of the rail scrim, so an active label never runs under the rail.
 */
function flipPinLabels(root: HTMLElement, stage: HTMLElement): void {
  const { width, height } = stage.getBoundingClientRect();
  if (!(width > 0 && height > 0)) return;
  const frame = posterFrame(width, height);
  const railZone = stage.querySelector<HTMLElement>('[data-ascent-rail-scrim]')?.offsetWidth ?? 0;
  const edge = width - railZone;
  root.querySelectorAll<HTMLElement>('[data-pin][data-u]').forEach((pin) => {
    const x = frame.left + Number(pin.dataset.u) * frame.side;
    pin.toggleAttribute('data-flip', edge - x < FLIP_PX);
  });
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
  const active = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  /** Writes the current active pin to every pin layer under the root. */
  const syncPins = () => {
    const k = active.current === null ? null : String(active.current);
    rootRef.current?.querySelectorAll<HTMLElement>('[data-pin]').forEach((pin) => {
      pin.toggleAttribute('data-active', pin.dataset.pin === k);
    });
  };

  /** Recomputes the lit pin at p and syncs the pins when it changes. */
  const light = (p: number) => {
    const arrivals = layout.current?.arrivals;
    const k = arrivals && !prefersReducedMotion() ? activePin(p, arrivals) : null;
    if (k === active.current) return;
    active.current = k;
    syncPins();
  };

  useMotionValueEvent(progress, 'change', light);

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
    light(progress.get());
    return layout.current !== null;
  });

  /** Reduced motion turned on mid-visit clears the lit pin; turned off, it relights. */
  const relight = useEffectEvent(() => light(progress.get()));
  useEffect(() => {
    relight();
  }, [reducedMotion]);

  /** D-08: keyboard focus entering a block brings that block's stage to the centre. */
  const onFocusIn = useEffectEvent((event: FocusEvent) => {
    const target = event.target;
    if (!(target instanceof Element) || prefersReducedMotion()) return;
    if (!target.matches(':focus-visible')) return;
    target.closest(BLOCKS)?.scrollIntoView({ block: 'center', behavior: 'auto' });
  });

  useEffect(() => {
    const track = rootRef.current?.querySelector('[data-ascent-track]');
    const listener = (event: Event) => onFocusIn(event as FocusEvent);
    track?.addEventListener('focusin', listener);
    return () => track?.removeEventListener('focusin', listener);
  }, []);

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
    <AscentContext.Provider value={{ progress, layout, n, heights, rootRef, syncPins }}>
      <div ref={rootRef} data-ascent-root>
        {children}
      </div>
    </AscentContext.Provider>
  );
}
