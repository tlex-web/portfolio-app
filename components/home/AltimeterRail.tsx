'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import { useMotionValueEvent } from 'motion/react';
import { useAscent } from '@/components/home/AscentController';
import { altitudeAt, railFraction } from '@/lib/ascent/progress';
import { formatMetres } from '@/lib/photo-format';

/**
 * The altimeter rail (HOME-04; D-01, D-05; 09-UI-SPEC "Altimeter Rail").
 *
 * Decorative: it lives inside the aria-hidden stage, takes no pointer events,
 * has no focusable descendant and no live region, and is hidden below 768 px.
 * The n + 1 ticks are server-rendered and evenly spaced (a route profile from
 * the first waypoint to the summit, not a linear altimeter); the approximate
 * waypoint's tick is dashed (08 D-02).
 *
 * The marker and the readout follow the one damped progress value from
 * AscentController: on every spring change they move by transform only and the
 * readout text is written through a ref (no React state, no CSS transition on
 * top of the spring). Under reduced motion the rail is a static profile: ticks
 * and labels, no marker, no readout.
 */
export default function AltimeterRail({
  ticks,
}: {
  ticks: readonly { label: string; approximate: boolean }[];
}) {
  const { progress, layout, heights } = useAscent();
  const boxRef = useRef<HTMLDivElement>(null);
  const boxHeight = useRef(0);
  const cursorRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const last = ticks.length - 1;

  const draw = (p: number) => {
    const arrivals = layout.current?.arrivals;
    const cursor = cursorRef.current;
    const readout = readoutRef.current;
    if (!arrivals || !cursor || !readout || arrivals.length !== heights.length) return;
    cursor.style.transform = `translateY(${-railFraction(p, arrivals) * boxHeight.current}px)`;
    readout.textContent = formatMetres(altitudeAt(p, arrivals, heights));
  };

  useMotionValueEvent(progress, 'change', draw);

  /** Caches the rail box height (read once per resize, not per frame) and redraws. */
  const resize = useEffectEvent(() => {
    boxHeight.current = boxRef.current?.clientHeight ?? 0;
    draw(progress.get());
  });

  useEffect(() => {
    resize();
    const box = boxRef.current;
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => resize());
    if (observer && box) observer.observe(box);
    return () => observer?.disconnect();
  }, []);

  return (
    <>
      <div
        data-ascent-rail-scrim
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-56 bg-linear-to-l from-surface/85 from-0% via-surface/60 via-70% to-transparent md:block"
      />
      <div
        ref={boxRef}
        data-ascent-rail
        className="pointer-events-none absolute top-12 right-8 bottom-12 hidden w-40 md:block"
      >
        <div className="absolute inset-y-0 right-0 w-px bg-ink-muted" />
        <ol>
          {ticks.map((tick, k) => (
            <li
              key={k}
              data-rail-tick={k}
              className="absolute right-0 flex translate-y-1/2 items-center gap-2"
              style={{ bottom: `${(k / last) * 100}%` }}
            >
              <span
                data-tick-label
                className="font-mono text-sm whitespace-nowrap text-ink-muted tabular-nums"
              >
                {tick.label}
              </span>
              <span
                className={
                  tick.approximate
                    ? 'w-4 border-t border-dashed border-ink-muted'
                    : 'h-px w-4 bg-ink-muted'
                }
              />
            </li>
          ))}
        </ol>
        <div
          ref={cursorRef}
          data-ascent-cursor
          className="absolute right-0 bottom-0 h-0 w-full motion-reduce:hidden"
        >
          <span
            ref={readoutRef}
            data-ascent-readout
            className="absolute right-6 bottom-0 translate-y-1/2 rounded-sm motion-reduce:hidden border border-line bg-surface-raised px-2 py-1 font-mono text-base font-semibold whitespace-nowrap text-ink tabular-nums"
          >
            {formatMetres(heights[0])}
          </span>
          <span
            data-ascent-marker
            className="absolute -right-3 bottom-0 h-0.5 w-6 translate-y-1/2 bg-accent motion-reduce:hidden"
          />
        </div>
      </div>
    </>
  );
}
