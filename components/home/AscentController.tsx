'use client';

import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { useMotionValueEvent, useScroll, useSpring, type MotionValue } from 'motion/react';
import { DURATION } from '@/lib/animations';
import {
  placePinLabel,
  railObstaclesAt,
  type Box,
  type RailGeometry,
  type Size,
  type StageGeometry,
} from '@/lib/ascent/framing';
import { posterFrame } from '@/lib/ascent/poster-frame';
import {
  activePin,
  arrivalsFromBlocks,
  mapProgress,
  shouldSnap,
  type AscentLayout,
} from '@/lib/ascent/progress';
import type { AscentMode } from '@/lib/ascent/capability';
import { useAscentMode } from '@/lib/useAscentMode';
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
 * depends on when it mounted. Under reduced motion no pin is lit.
 *
 * Label placement (G-09-3 a, 09-19; D-07, D-09 and its amendment): each layout
 * measurement also reads the stage geometry (lib/ascent/framing.ts
 * StageGeometry: every waypoint card's box at its arrival, every poster label's
 * size, the rail's tick rows, line and readout) and shares it through the
 * context as `geometry` for the 3D rig. Each poster pin's label is then placed
 * by placePinLabel: anchor from posterFrame and the pin's `data-u`/`data-v`,
 * obstacles its own card and the rail marks at its plateau, cover its card,
 * bounds the stage. The result is written as `data-label` and
 * `--pin-label-dx` on the pin (PinMark). Measurement only, never per frame.
 *
 * Focus contract (D-08): when keyboard focus (`:focus-visible`) enters a
 * waypoint or summit block, the block is scrolled to the centre with
 * scrollIntoView({ block: 'center', behavior: 'auto' }); the spring snaps if
 * that is more than one leg. Skipped under reduced motion (natural layout).
 *
 * Mode (HOME-02, D-18, D-19, D-21; 09-UI-SPEC "Modes"): the capability gate's
 * mode (lib/useAscentMode.ts) and a `revealed` flag the terrain mesh sets after
 * its first drawn frame (markRevealed) are shared through the context.
 * AscentStageFrame writes them to the stage as `data-ascent-mode`: 'pending'
 * in server HTML, then 'static-reduced', 'static', 'eligible', or '3d' once an
 * eligible canvas has revealed. The geometry never depends on it: only the
 * reduced-motion media query (known at first paint) compacts the layout.
 * `revealed` belongs to one mounted canvas: it resets whenever the mode leaves
 * 'eligible' (the canvas unmounts), so a canvas mounted again after reduced
 * motion is turned off loads under the poster and fades in again instead of
 * showing an undrawn canvas at once (09-11).
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
  /** The capability gate's mode; 'pending' until hydration. */
  mode: AscentMode | 'pending';
  /** True once the canvas has drawn its first frame (09-08 sets it). */
  revealed: boolean;
  /** Called by the terrain mesh after its first drawn frame: the stage becomes '3d'. */
  markRevealed: () => void;
  /** The stage element (AscentStageFrame). */
  stageRef: RefObject<HTMLDivElement | null>;
  /** The stage geometry from the last layout measurement (G-09-3 a), or null. */
  geometry: RefObject<StageGeometry | null>;
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

const prefersReducedMotion = () => window.matchMedia(REDUCED).matches;

/**
 * Reads the ascent layout from the DOM, or null when there is no sticky
 * distance. Also measures the stage geometry into `geometry` (null when there
 * is no layout) and places the poster labels from it.
 */
function measureLayout(
  root: HTMLElement,
  geometry: { current: StageGeometry | null }
): AscentLayout | null {
  geometry.current = null;
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

  geometry.current = measureGeometry(root, stage);
  if (geometry.current) placePosterLabels(root, geometry.current);

  return {
    start: trackRect.top + window.scrollY - stickyTop,
    distance,
    arrivals: arrivalsFromBlocks(blocks, stageHeight, distance),
  };
}

/** A DOM rect as a Box relative to `origin` (the stage's rect). */
const boxIn = (r: DOMRect, origin: DOMRect): Box => ({
  x0: r.left - origin.left,
  y0: r.top - origin.top,
  x1: r.right - origin.left,
  y1: r.bottom - origin.top,
});

/**
 * Each waypoint card's box at its arrival, in stage px (index k - 1). At its
 * arrival a block's centre meets the stage centre, so its top is at
 * (stageH - blockH) / 2. A static card (md and up) keeps its offset in the
 * block; a sticky docked card (below 768 px) sits at the bottom of its block,
 * held inside the stage by its sticky bottom.
 */
function measureCards(root: HTMLElement, stageRect: DOMRect): (Box | null)[] {
  const blocks = [...root.querySelectorAll<HTMLElement>('li[data-ascent-block="waypoint"]')];
  blocks.sort((a, b) => Number(a.dataset.k) - Number(b.dataset.k));
  return blocks.map((block) => {
    const card = block.querySelector<HTMLElement>('section');
    if (!card) return null;
    const blockRect = block.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const blockTop = (stageRect.height - blockRect.height) / 2;
    const x0 = cardRect.left - stageRect.left;
    const x1 = cardRect.right - stageRect.left;
    if (getComputedStyle(card).position === 'sticky') {
      const y1 = Math.min(blockTop + blockRect.height, stageRect.height);
      return { x0, y0: y1 - cardRect.height, x1, y1 };
    }
    const y0 = blockTop + (cardRect.top - blockRect.top);
    return { x0, y0, x1, y1: y0 + cardRect.height };
  });
}

/**
 * Every poster label's size (index k - 1). The labels are display: none until
 * lit, so each is shown as a block for the read and restored in the same task:
 * all writes, one read pass, all restores, so the reads share one layout.
 */
function measureLabels(root: HTMLElement): (Size | null)[] {
  const pins = [...root.querySelectorAll<HTMLElement>('[data-pin-layer="poster"] [data-pin]')];
  pins.sort((a, b) => Number(a.dataset.pin) - Number(b.dataset.pin));
  const labels = pins.map((pin) => pin.querySelector<HTMLElement>('[data-pin-label]'));
  const saved = labels.map((label) => label?.style.display ?? '');
  labels.forEach((label) => label?.style.setProperty('display', 'block'));
  const sizes = labels.map((label) =>
    label && label.offsetWidth > 0 ? { w: label.offsetWidth, h: label.offsetHeight } : null
  );
  labels.forEach((label, i) => {
    if (label) label.style.display = saved[i];
  });
  return sizes;
}

/**
 * The rail in stage px: tick rows, the line (the rail box's right 1 px
 * column), the readout's size, the rail's right edge and the tick centres.
 * Empty when the rail box has no size (below 768 px, where it is hidden).
 */
function measureRail(root: HTMLElement, stageRect: DOMRect): RailGeometry {
  const empty: RailGeometry = {
    ticks: [],
    line: null,
    readout: null,
    railRight: null,
    tickCentres: [],
  };
  const rail = root.querySelector<HTMLElement>('[data-ascent-rail-layer] [data-ascent-rail]');
  if (!rail) return empty;
  const railRect = rail.getBoundingClientRect();
  if (!(railRect.width > 0 && railRect.height > 0)) return empty;
  const box = boxIn(railRect, stageRect);
  const ticks = [...rail.querySelectorAll<HTMLElement>('[data-rail-tick]')]
    .sort((a, b) => Number(a.dataset.railTick) - Number(b.dataset.railTick))
    .map((tick) => boxIn(tick.getBoundingClientRect(), stageRect));
  const readout = rail.querySelector<HTMLElement>('[data-ascent-readout]');
  return {
    ticks,
    line: { x0: box.x1 - 1, y0: box.y0, x1: box.x1, y1: box.y1 },
    readout:
      readout && readout.offsetWidth > 0
        ? { w: readout.offsetWidth, h: readout.offsetHeight }
        : null,
    railRight: box.x1,
    tickCentres: ticks.map((t) => (t.y0 + t.y1) / 2),
  };
}

/** The stage geometry for label placement (G-09-3 a), or null for an empty stage. */
function measureGeometry(root: HTMLElement, stage: HTMLElement): StageGeometry | null {
  const stageRect = stage.getBoundingClientRect();
  if (!(stageRect.width > 0 && stageRect.height > 0)) return null;
  return {
    width: stageRect.width,
    height: stageRect.height,
    cards: measureCards(root, stageRect),
    labels: measureLabels(root),
    rail: measureRail(root, stageRect),
  };
}

/**
 * Places each poster pin's label with placePinLabel and writes `data-label`
 * and `--pin-label-dx`. The anchor comes from posterFrame and the pin's
 * `data-u`/`data-v`; the obstacles are its card and the rail marks at its
 * plateau, the cover its card, the bounds the stage.
 */
function placePosterLabels(root: HTMLElement, geometry: StageGeometry): void {
  const frame = posterFrame(geometry.width, geometry.height);
  const bounds: Box = { x0: 0, y0: 0, x1: geometry.width, y1: geometry.height };
  root
    .querySelectorAll<HTMLElement>('[data-pin-layer="poster"] [data-pin][data-u][data-v]')
    .forEach((pin) => {
      const k = Number(pin.dataset.pin);
      const label = geometry.labels[k - 1];
      if (!label) return;
      const card = geometry.cards[k - 1];
      const cards = card ? [card] : [];
      const { side, dx } = placePinLabel({
        anchor: {
          x: frame.left + Number(pin.dataset.u) * frame.side,
          y: frame.top + Number(pin.dataset.v) * frame.side,
        },
        label,
        obstacles: [...cards, ...railObstaclesAt(geometry.rail, k)],
        covers: cards,
        bounds,
      });
      pin.dataset.label = side;
      pin.style.setProperty('--pin-label-dx', `${dx}px`);
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
  const stageRef = useRef<HTMLDivElement | null>(null);
  const mode = useAscentMode();
  const [revealed, setRevealed] = useState(false);
  const markRevealed = () => setRevealed(true);
  // The canvas unmounts whenever the mode leaves 'eligible'; its reveal goes with it.
  if (revealed && mode !== 'eligible') setRevealed(false);
  const layout = useRef<AscentLayout | null>(null);
  const geometry = useRef<StageGeometry | null>(null);
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
    layout.current = root ? measureLayout(root, geometry) : null;
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
    <AscentContext.Provider
      value={{
        progress,
        layout,
        n,
        heights,
        rootRef,
        syncPins,
        mode,
        revealed,
        markRevealed,
        stageRef,
        geometry,
      }}
    >
      <div ref={rootRef} data-ascent-root>
        {children}
      </div>
    </AscentContext.Provider>
  );
}

/**
 * The sticky stage (09-UI-SPEC "Stage: Poster, Sheet Box and Canvas"):
 * decorative and aria-hidden, one stage tall under the nav, a size container
 * for the poster sheet box, and the `group/stage` the poster pins and the
 * canvas read `data-ascent-mode` from. Server children (PosterSheet, the rail)
 * pass straight through.
 */
export function AscentStageFrame({ children }: { children: ReactNode }) {
  const { mode, revealed, stageRef } = useAscent();
  return (
    <div
      ref={stageRef}
      data-ascent-stage
      data-ascent-mode={revealed && mode === 'eligible' ? '3d' : mode}
      aria-hidden="true"
      className="group/stage sticky top-(--nav-h) col-start-1 row-start-1 h-[calc(100svh-var(--nav-h))] self-start overflow-hidden bg-surface [container-type:size]"
    >
      {children}
    </div>
  );
}
