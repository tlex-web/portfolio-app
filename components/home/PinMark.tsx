import type { CSSProperties, Ref } from 'react';

/**
 * A waypoint pin and the summit mark (HOME-05; D-09; 09-UI-SPEC "Pins (D-09)"
 * and UI Considerations E7). Server-safe: no directive, no hooks, ref as a
 * prop, so the same marks render on the server poster and in the client 3D
 * layer (09-10).
 *
 * The mark is translated so the stem's foot sits on the anchor given by
 * `style` (left/top). Its states are attributes set from outside by
 * AscentController, never React state: `data-active` lights the head (accent,
 * 11.29:1 numeral), shows the label and draws the pin above the others;
 * `data-label` says where the label sits around the head (G-09-3 a, 09-19;
 * placePinLabel in lib/ascent/framing.ts): right of the head when absent or
 * 'right', 'left' of it, 'above' or 'below' the mark (left edge at
 * `--pin-label-dx` from the mark's left edge), or 'none' (invisible, never
 * 'visible', so the 3D layer's inherited visibility still applies). The lit
 * state is a colour swap with no transition.
 *
 * An approximate position (the hand-placed film scan) draws a 2 px dashed head
 * border and a dashed stem: shape, not colour, carries the difference (08 D-02).
 * Decorative: it lives in the aria-hidden stage and takes no pointer events.
 */
export default function PinMark({
  k,
  label,
  approximate,
  u,
  v,
  style,
  ref,
}: {
  k: number;
  label: string;
  approximate: boolean;
  /** The anchor's u and v on the poster sheet, for the label placement (poster layer only). */
  u?: number;
  v?: number;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      data-pin={k}
      data-u={u}
      data-v={v}
      style={style}
      className="group/pin absolute flex w-6 -translate-x-1/2 -translate-y-full flex-col items-center data-[active]:z-10"
    >
      <span
        data-pin-head
        className={`flex size-6 items-center justify-center rounded-full bg-surface-raised font-mono text-sm leading-none text-ink tabular-nums group-data-[active]/pin:border-ink-inverse group-data-[active]/pin:bg-accent group-data-[active]/pin:text-ink-inverse ${
          approximate ? 'border-2 border-dashed border-ink-muted' : 'border border-ink-muted'
        }`}
      >
        {k}
      </span>
      <span
        data-pin-stem
        className={
          approximate ? 'h-4 w-0 border-l border-dashed border-ink-muted' : 'h-4 w-px bg-ink-muted'
        }
      />
      <span
        data-pin-label
        className="absolute top-3 left-full ml-2 hidden -translate-y-1/2 rounded-sm border border-line bg-surface-raised px-2 py-1 font-body text-sm whitespace-nowrap text-ink group-data-[active]/pin:block group-data-[label=left]/pin:right-full group-data-[label=left]/pin:left-auto group-data-[label=left]/pin:mr-2 group-data-[label=left]/pin:ml-0 group-data-[label=above]/pin:top-auto group-data-[label=above]/pin:bottom-full group-data-[label=above]/pin:left-(--pin-label-dx) group-data-[label=above]/pin:mb-1 group-data-[label=above]/pin:ml-0 group-data-[label=above]/pin:translate-y-0 group-data-[label=below]/pin:top-full group-data-[label=below]/pin:left-(--pin-label-dx) group-data-[label=below]/pin:mt-1 group-data-[label=below]/pin:ml-0 group-data-[label=below]/pin:translate-y-0 group-data-[label=none]/pin:invisible"
      >
        {label}
      </span>
    </div>
  );
}

/** The summit: a 12 px triangle whose base centre sits on the anchor, no label. */
export function SummitMark({ style, ref }: { style?: CSSProperties; ref?: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      data-summit-mark
      style={style}
      className="absolute size-3 -translate-x-1/2 -translate-y-full bg-ink-muted [clip-path:polygon(50%_0,100%_100%,0_100%)]"
    />
  );
}
