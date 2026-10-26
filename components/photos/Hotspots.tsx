'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowSquareOutIcon } from '@phosphor-icons/react/dist/ssr';
import { GUTTER_GAP, GUTTER_LABEL_HEIGHT, gutterStack } from '@/lib/photos/hotspot-layout';
import type { HotspotView, PhotoView } from '@/lib/photos/view-model';

/**
 * The hotspot callouts (LBOX-05; D-09, D-10, D-11; 10-UI-SPEC "Hotspots"),
 * read like peak labels on a panorama. Three parts, one per place they draw:
 *
 * - HotspotMarks, inside the photo box (so they follow the photo, its swipe
 *   included): on the gutter tier a 12 px glyph per hotspot (a triangle for a
 *   peak, a circle for the rest; ink with a 2 px gallery casing, accent when
 *   expanded), decorative and pointer-events none, because a click on the
 *   photo zooms. On the key and scroll tiers a 24 px numbered dot (ink with
 *   gallery text, accent when expanded) in a 44 px hit area. The dots are
 *   pointer-only (tabIndex -1, aria-hidden): the key rows are the keyboard
 *   path, and a tap on a dot opens its row.
 * - HotspotOverlay, a layer over the whole stage (gutter tier only): the
 *   192 px labels in the side gutters (x < 50 left, else right), 16 px from
 *   the outer edge, stacked by gutterStack from the measured stage and photo
 *   box (ResizeObserver), with the expanded panel directly under its label,
 *   and the leaders (1 px ink over a 3 px gallery casing, accent when
 *   expanded) from each label's inner edge to its marker. Panels stay in the
 *   gutter, so they never cover the photo; a gutter whose stack cannot fit
 *   scrolls (the UI-SPEC's last resort).
 * - HotspotKey, the strip's row 4 on the key and scroll tiers: a list named
 *   'Labels' of key rows '{n} {title} · {height}', each expanding in place.
 *
 * Marks and overlay draw nothing while labels are hidden (D-10) or the photo
 * is zoomed (D-06); the key ignores labelsOn, so the text stays (CONTEXT
 * default). A photo without annotations draws nothing at all (E7 empty).
 * Every label and row is a button with aria-expanded and aria-controls; one
 * hotspot is open at a time (PhotoViewer owns expandedId). Fact sources are
 * 'Wikipedia' prose links that open a new tab with rel 'noopener noreferrer'
 * and say so to screen readers (T-10-23), or plain 'Source: …' text. Nothing
 * truncates: titles and facts wrap inside the plate, the panel or the row.
 */

type HotspotProps = {
  view: PhotoView;
  labelsOn: boolean;
  zoomed: boolean;
  expandedId: string | null;
  onToggle(id: string): void;
};

/** The panel's id for one place a hotspot is shown (gutter or key), for aria-controls. */
const panelId = (h: HotspotView, where: 'gutter' | 'key') => `hotspot-${h.id}-${where}`;

/** The gutter plate's outer inset from the stage edge and its width, px (16 + 192). */
const GUTTER_INSET = 16;
const GUTTER_WIDTH = 192;
/** The marker's radius plus its casing: the leader stops there instead of crossing the glyph, px. */
const MARKER_CLEARANCE = 8;

const position = (h: HotspotView): CSSProperties => ({ left: `${h.x}%`, top: `${h.y}%` });

function FactSource({ source }: { source: HotspotView['facts'][number]['source'] }) {
  if (source.kind === 'text') return <span>{source.label}</span>;
  return (
    <a
      href={source.href}
      target="_blank"
      rel="noopener noreferrer"
      className="prose-link inline-flex items-center gap-1 whitespace-nowrap"
    >
      {source.label}
      <ArrowSquareOutIcon size={16} aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** The expanded details: the description, then the facts with their sources. Hidden while collapsed. */
function Panel({ hotspot, id, open }: { hotspot: HotspotView; id: string; open: boolean }) {
  return (
    <div
      id={id}
      hidden={!open}
      className="mt-2 rounded-sm bg-gallery p-2 text-sm text-ink-muted ring-1 ring-line ring-inset"
    >
      <p>{hotspot.description}</p>
      {hotspot.facts.length > 0 && (
        <ul>
          {hotspot.facts.map((fact) => (
            <li key={fact.text} className="mt-2">
              {fact.text} <FactSource source={fact.source} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The 24 px numbered badge of a dot and a key row. */
function Badge({ n, accent }: { n: number; accent: boolean }) {
  return (
    <span
      className={`flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-sm ring-2 ring-gallery ${
        accent ? 'bg-accent text-ink-inverse' : 'bg-ink text-gallery'
      }`}
    >
      {n}
    </span>
  );
}

/** Glyphs and numbered dots on the photo (inside [data-photo-box]). */
export function HotspotMarks({ view, labelsOn, zoomed, expandedId, onToggle }: HotspotProps) {
  if (!labelsOn || zoomed || view.hotspots.length === 0) return null;
  return (
    <div data-hotspot-marks="" className="pointer-events-none absolute inset-0">
      {view.hotspots.map((h) => {
        const open = h.id === expandedId;
        return (
          <svg
            key={`marker-${h.id}`}
            data-hotspot-marker=""
            aria-hidden="true"
            viewBox="0 0 16 16"
            className={`absolute hidden size-4 -translate-x-1/2 -translate-y-1/2 stroke-gallery lb-gutter:block ${
              open ? 'fill-accent' : 'fill-ink'
            }`}
            style={position(h)}
          >
            {h.glyph === 'peak' ? (
              <polygon
                points="8,2 14,14 2,14"
                strokeWidth={4}
                strokeLinejoin="round"
                paintOrder="stroke"
              />
            ) : (
              <circle cx="8" cy="8" r="6" strokeWidth={4} paintOrder="stroke" />
            )}
          </svg>
        );
      })}
      {view.hotspots.map((h) => {
        const open = h.id === expandedId;
        return (
          <button
            key={`dot-${h.id}`}
            type="button"
            data-hotspot-dot=""
            data-expanded={open ? '' : undefined}
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-auto absolute hidden size-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation items-center justify-center lb-key:flex lb-scroll:flex"
            style={position(h)}
            // A dot is not a swipe or a zoom target, and it never takes focus.
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onToggle(h.id)}
          >
            <Badge n={h.n} accent={open} />
          </button>
        );
      })}
    </div>
  );
}

type Geometry = {
  stage: { w: number; h: number };
  box: { x: number; y: number; w: number; h: number };
  heights: Record<string, number>;
};

const sameGeometry = (a: Geometry | null, b: Geometry) =>
  a !== null && JSON.stringify(a) === JSON.stringify(b);

/** The gutter labels, their panels and the leaders, over the stage (gutter tier only). */
export function HotspotOverlay({ view, labelsOn, zoomed, expandedId, onToggle }: HotspotProps) {
  const shown = labelsOn && !zoomed && view.hotspots.length > 0;
  const layerRef = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  // Measure the stage, the photo box and every label (with its panel), and
  // again whenever one of them changes size. A layout effect, so the first
  // paint already has the labels in place.
  useLayoutEffect(() => {
    const layer = layerRef.current;
    const stage = layer?.closest<HTMLElement>('[data-viewer-stage]');
    const box = stage?.querySelector<HTMLElement>('[data-photo-box]');
    if (!shown || !layer || !box) return;
    const measure = () => {
      const s = layer.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const heights: Record<string, number> = {};
      for (const el of layer.querySelectorAll<HTMLElement>('[data-hotspot-item]')) {
        heights[el.dataset.hotspotItem!] = el.offsetHeight;
      }
      const next: Geometry = {
        stage: { w: s.width, h: s.height },
        box: { x: b.left - s.left, y: b.top - s.top, w: b.width, h: b.height },
        heights,
      };
      setGeometry((prev) => (sameGeometry(prev, next) ? prev : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(layer);
    observer.observe(box);
    for (const el of layer.querySelectorAll('[data-hotspot-item]')) observer.observe(el);
    return () => observer.disconnect();
  }, [shown, view, expandedId]);

  if (!shown) return null;

  const g = geometry;
  const markerAt = (h: HotspotView) =>
    g ? { x: g.box.x + (h.x / 100) * g.box.w, y: g.box.y + (h.y / 100) * g.box.h } : { x: 0, y: 0 };
  const items = view.hotspots.map((h) => ({
    id: h.id,
    side: h.side,
    anchorY: markerAt(h).y,
    height: g?.heights[h.id] ?? GUTTER_LABEL_HEIGHT,
  }));
  const tops = g ? gutterStack(items, g.stage.h) : {};
  const overflows = (side: 'left' | 'right') =>
    g !== null &&
    items.some(
      (it) => it.side === side && (tops[it.id]?.top ?? 0) + it.height > g.stage.h - GUTTER_GAP
    );

  const column = (side: 'left' | 'right') => (
    <div
      key={side}
      className={`absolute inset-y-0 w-48 ${side === 'left' ? 'left-4' : 'right-4'} ${
        overflows(side) ? 'pointer-events-auto overflow-y-auto' : 'pointer-events-none'
      }`}
    >
      {view.hotspots
        .filter((h) => h.side === side)
        .map((h) => {
          const open = h.id === expandedId;
          return (
            <div
              key={h.id}
              data-hotspot-item={h.id}
              className="pointer-events-auto absolute inset-x-0"
              style={{ top: tops[h.id]?.top ?? 0 }}
            >
              <button
                type="button"
                data-hotspot-label={h.id}
                aria-expanded={open}
                aria-controls={panelId(h, 'gutter')}
                className="flex min-h-12 w-48 cursor-pointer touch-manipulation flex-col justify-center rounded-sm bg-gallery px-2 py-1 text-left ring-1 ring-line-strong ring-inset hover:ring-ink-muted"
                onClick={() => onToggle(h.id)}
              >
                <span className="text-sm font-semibold text-ink">{h.title}</span>
                {h.heightLabel && (
                  <span className="font-mono text-sm text-ink-muted">{h.heightLabel}</span>
                )}
              </button>
              <Panel hotspot={h} id={panelId(h, 'gutter')} open={open} />
            </div>
          );
        })}
    </div>
  );

  return (
    <div
      ref={layerRef}
      data-hotspot-gutters=""
      className={`pointer-events-none absolute inset-0 hidden lb-gutter:block ${g ? '' : 'invisible'}`}
    >
      {g && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
          width={g.stage.w}
          height={g.stage.h}
        >
          {view.hotspots.map((h) => {
            const top = tops[h.id]?.top ?? 0;
            const m = markerAt(h);
            const x1 =
              h.side === 'left'
                ? GUTTER_INSET + GUTTER_WIDTH
                : g.stage.w - GUTTER_INSET - GUTTER_WIDTH;
            const y1 = Math.min(
              Math.max(m.y, top + GUTTER_GAP),
              top + GUTTER_LABEL_HEIGHT - GUTTER_GAP
            );
            const len = Math.hypot(m.x - x1, m.y - y1);
            const k = len > MARKER_CLEARANCE ? (len - MARKER_CLEARANCE) / len : 0;
            const x2 = x1 + (m.x - x1) * k;
            const y2 = y1 + (m.y - y1) * k;
            const open = h.id === expandedId;
            return (
              <g key={h.id} data-hotspot-leader="">
                <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={3} className="stroke-gallery" />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  strokeWidth={1}
                  className={open ? 'stroke-accent' : 'stroke-ink'}
                />
              </g>
            );
          })}
        </svg>
      )}
      {column('left')}
      {column('right')}
    </div>
  );
}

/** The strip key (row 4) on the key and scroll tiers; it stays when labels are hidden. */
export function HotspotKey({
  view,
  expandedId,
  onToggle,
}: Omit<HotspotProps, 'zoomed' | 'labelsOn'> & {
  labelsOn?: boolean;
}) {
  if (view.hotspots.length === 0) return null;
  return (
    <ul aria-label="Labels" data-hotspot-key="" className="mt-4 lb-gutter:hidden">
      {view.hotspots.map((h) => {
        const open = h.id === expandedId;
        return (
          <li key={h.id}>
            <button
              type="button"
              data-hotspot-row={h.id}
              aria-expanded={open}
              aria-controls={panelId(h, 'key')}
              className="group flex min-h-11 w-full cursor-pointer touch-manipulation items-center gap-2 text-left"
              onClick={() => onToggle(h.id)}
            >
              <Badge n={h.n} accent={false} />{' '}
              <span className="min-w-0">
                <span className="text-sm font-semibold text-ink">{h.title}</span>
                {h.heightLabel && (
                  <span className="font-mono text-sm whitespace-nowrap text-ink-muted group-hover:text-ink">
                    {' · '}
                    {h.heightLabel}
                  </span>
                )}
              </span>
            </button>
            <Panel hotspot={h} id={panelId(h, 'key')} open={open} />
          </li>
        );
      })}
    </ul>
  );
}
