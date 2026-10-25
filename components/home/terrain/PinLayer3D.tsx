'use client';

import { useEffectEvent, useLayoutEffect, type CSSProperties, type RefObject } from 'react';
import { useAscent } from '@/components/home/AscentController';
import PinMark, { SummitMark } from '@/components/home/PinMark';
import type { PinAnchor } from '@/lib/ascent/route';

/**
 * The 3D pins (HOME-05; D-09; corrections C3 and C5; 09-UI-SPEC "Pins (D-09)"
 * and UI Considerations E7). One DOM layer over the canvas with the same
 * PinMark and SummitMark as the poster, so the marks, labels (short place and
 * DEM height) and the dashed approximate state are identical. No drei Html and
 * no portal per pin: CameraRig projects each anchor (the decoded mesh height,
 * not the DEM value) every rendered frame and writes the mark's transform,
 * visibility and data-flip through the refs this layer hands it.
 *
 * Every mark starts hidden at the stage origin until the rig places it. The
 * layer is invisible until the stage reads '3d', and the poster pin layer is
 * hidden by the same attribute, so the two sets swap in the same frame as the
 * canvas reveal: no frame shows zero pins or both. The rig shows a placed mark
 * by clearing its own visibility (inherit), never by setting 'visible', which
 * would override the layer's.
 *
 * Lighting stays with AscentController: it toggles data-active on every
 * [data-pin] under the root. Once these pins are in the DOM (a layout effect,
 * before the browser paints) the layer calls syncPins(), so the current
 * stage's 3D pin is already lit when the canvas reveals, even if the visitor
 * has not scrolled since the canvas started loading.
 *
 * Decorative: the stage is aria-hidden and the layer takes no pointer events.
 */

/** Unplaced: hidden, anchored at the stage origin (the rig translates from here). */
const UNPLACED: CSSProperties = { left: 0, top: 0, visibility: 'hidden' };

export default function PinLayer3D({
  pins,
  pinsRef,
}: {
  /** The waypoint anchors, in ascent order. */
  pins: readonly PinAnchor[];
  /** Filled with the waypoint marks (index k - 1), then the summit mark (index n). */
  pinsRef: RefObject<(HTMLDivElement | null)[]>;
}) {
  const { syncPins } = useAscent();
  const lightCurrentPin = useEffectEvent(() => syncPins());

  useLayoutEffect(() => {
    lightCurrentPin();
  }, []);

  return (
    <div
      data-pin-layer="3d"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 invisible group-data-[ascent-mode=3d]/stage:visible"
    >
      {pins.map((pin, i) => (
        <PinMark
          key={pin.k}
          k={pin.k}
          label={pin.label}
          approximate={pin.approximate}
          style={UNPLACED}
          ref={(el) => {
            pinsRef.current[i] = el;
          }}
        />
      ))}
      <SummitMark
        style={UNPLACED}
        ref={(el) => {
          pinsRef.current[pins.length] = el;
        }}
      />
    </div>
  );
}
