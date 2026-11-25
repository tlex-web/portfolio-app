'use client';

import { useEffect, useRef, useState } from 'react';
import { railCurrent, type RailTick } from '@/lib/photos/region-rail';

/**
 * The region altimeter rail (REGION-05; D-07; 18-UI-SPEC Contract 2
 * "Altimeter rail"). Its own component: Home's AltimeterRail is unchanged
 * (DATA-09); only the anatomy is shared (a 1 px ink-muted line at the right
 * edge, one w-4 tick per photo with its label to the left, the accent marker).
 *
 * Decorative: aria-hidden, no pointer events, hidden below 768 px, where each
 * caption carries 'n / N' (18-08). The ticks are evenly spaced from photo 1 at
 * the bottom to photo N at the top (a route profile, not a linear altimeter).
 * Props are labels and booleans only (T-18-29): the server page builds them.
 *
 * The current photo (railCurrent, lib/photos/region-rail.ts) comes from two
 * IntersectionObservers over the sequence's li[data-sequence-item] elements:
 * the line observer (a zero-height root at the viewport's centre: an item
 * intersects while its box contains the line) and the above observer
 * (everything above the line: an item intersects once its top has reached the
 * line). Each reports only the items whose state changed, so both states are
 * kept per item in refs; the decision runs once both have delivered their first
 * batch (which reports every item), then after every batch. A jump (Skip to
 * next region, a plate badge, Home, End) crosses at least one item's top, so
 * the above observer always reports it. No scroll listener and no layout read
 * (T-18-28); state is set only inside the observer callbacks.
 *
 * The server HTML marks photo 1 (data-rail-current="1"); if the observers never
 * run, it stays there. data-rail-current is the e2e settle signal and 18-14's
 * mid-sequence baseline signal. The marker moves by transform over
 * --duration-panel ease-erosion (a new target retargets the running
 * transition), instantly under reduced motion; the label switches instantly.
 */
export default function RegionRail({ ticks, head }: { ticks: readonly RailTick[]; head: string }) {
  const [current, setCurrent] = useState(1);
  const rootRef = useRef<HTMLDivElement>(null);
  const last = ticks.length - 1;
  /** A tick's height on the rail as a fraction from the bottom (a single tick sits at the bottom). */
  const at = (k: number) => (last > 0 ? k / last : 0);

  useEffect(() => {
    const sequence = rootRef.current?.closest('[data-region-sequence]');
    if (!sequence || typeof IntersectionObserver === 'undefined') return;
    const items = [...sequence.querySelectorAll('li[data-sequence-item]')];
    if (items.length === 0) return;
    const index = new Map(items.map((el, i) => [el, i]));
    const containing = items.map(() => false);
    const reached = items.map(() => false);
    const ready = { line: false, above: false };
    let marked = 1;

    const observe =
      (which: 'line' | 'above', states: boolean[]) => (entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          const i = index.get(entry.target);
          if (i !== undefined) states[i] = entry.isIntersecting;
        }
        ready[which] = true;
        if (!ready.line || !ready.above) return;
        marked = railCurrent({ containing, reached, previous: marked });
        setCurrent(marked);
      };

    const line = new IntersectionObserver(observe('line', containing), {
      rootMargin: '-50% 0px -50% 0px',
    });
    const above = new IntersectionObserver(observe('above', reached), {
      rootMargin: '10000% 0px -50% 0px',
    });
    for (const item of items) {
      line.observe(item);
      above.observe(item);
    }
    return () => {
      line.disconnect();
      above.disconnect();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-region-rail=""
      data-rail-current={current}
      aria-hidden="true"
      className="pointer-events-none sticky top-[calc(var(--nav-h)+24px)] hidden h-[calc(100svh-var(--nav-h)-48px)] md:block"
    >
      <div className="flex h-full flex-col">
        {/* The head label wraps at its space: 'Ground altitude' is wider than the 96 px column on one line. */}
        <p data-rail-head="" className="text-right font-mono text-sm text-ink-muted">
          {head}
        </p>
        {/* The tick area: under the head label (the top tick's label clears it) to 12 px above the box's foot. */}
        <div data-rail-ticks="" className="relative mt-6 mb-3 flex-1">
          <div className="absolute inset-y-0 right-0 w-px bg-ink-muted" />
          <ol>
            {ticks.map((tick, k) => {
              const isCurrent = k + 1 === current;
              return (
                <li
                  key={k}
                  data-rail-tick={k + 1}
                  data-current={isCurrent ? '' : undefined}
                  className="absolute right-0 flex translate-y-1/2 items-center gap-2"
                  style={{ bottom: `${at(k) * 100}%` }}
                >
                  <span
                    data-tick-label=""
                    className={`font-mono text-sm whitespace-nowrap tabular-nums ${
                      isCurrent ? 'font-semibold text-ink' : 'text-ink-muted'
                    }`}
                  >
                    {tick.label}
                  </span>
                  <span
                    data-tick-mark=""
                    className={
                      tick.approximate
                        ? 'w-4 border-t border-dashed border-ink-muted'
                        : 'h-px w-4 bg-ink-muted'
                    }
                  />
                </li>
              );
            })}
          </ol>
          {/* The marker's track spans the tick area, so a percentage of its own height is a tick's height. */}
          <div
            data-rail-marker=""
            className="absolute inset-0 transition-transform duration-(--duration-panel) ease-erosion motion-reduce:transition-none motion-reduce:duration-0"
            style={{ transform: `translateY(${-at(current - 1) * 100}%)` }}
          >
            <span
              data-rail-marker-bar=""
              className="absolute -right-3 bottom-0 h-0.5 w-6 translate-y-1/2 bg-accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
