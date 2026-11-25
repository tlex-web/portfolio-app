'use client';

import { useSyncExternalStore } from 'react';

/**
 * Which action the Share button offers (PHOTO-07, D-13; 18-UI-SPEC Contract 4
 * "Mode"): 'share' opens the system share sheet, 'copy' writes the link to the
 * clipboard.
 *
 * The server snapshot is 'copy', so the server HTML, a no-JS visit and the
 * hydration pass all render copy mode and hydration never mismatches. The
 * client snapshot then decides once: 'share' only where `navigator.share` is a
 * function and `navigator.canShare?.({ url })` is not false (a browser without
 * canShare is trusted). Support never changes during a visit, so the store has
 * nothing to subscribe to.
 */
export type ShareMode = 'copy' | 'share';

const subscribe = (): (() => void) => () => {};

const serverSnapshot = (): ShareMode => 'copy';

/** The mode this browser supports for `url`; 'copy' wherever navigator is missing. */
export function clientShareMode(url: string): ShareMode {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return 'copy';
  return navigator.canShare?.({ url }) === false ? 'copy' : 'share';
}

/** The hydration-safe mode for `url`: 'copy' on the server, the browser's mode after hydration. */
export function useShareMode(url: string): ShareMode {
  return useSyncExternalStore(subscribe, () => clientShareMode(url), serverSnapshot);
}
