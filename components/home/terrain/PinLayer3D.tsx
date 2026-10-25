'use client';

import type { RefObject } from 'react';
import type { PinAnchor } from '@/lib/ascent/route';

/** Signature-only stub (09-10 RED): the 3D pin layer. */
export default function PinLayer3D(_props: {
  pins: readonly PinAnchor[];
  pinsRef: RefObject<(HTMLDivElement | null)[]>;
}) {
  return null;
}
