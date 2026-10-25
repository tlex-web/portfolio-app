'use client';

import { useSyncExternalStore } from 'react';
import { decideAscentMode, type AscentMode } from '@/lib/ascent/capability';

/**
 * The client side of the capability gate (HOME-02, HOME-07, HOME-08; D-18,
 * D-21; 09-RESEARCH Pattern 2). A useSyncExternalStore store, like
 * lib/useReducedMotion.ts:
 *
 * - The server snapshot is 'pending', which renders exactly like the static
 *   poster, so hydration never mismatches.
 * - Save-Data and deviceMemory are read once per page view, and the WebGL2
 *   probe runs at most once, only when the cheap signals pass: a detached
 *   canvas asks for `webgl2` with failIfMajorPerformanceCaveat, reads
 *   MAX_TEXTURE_SIZE and releases the context with WEBGL_lose_context. The
 *   renderer string is never read (no fingerprinting, and SwiftShader in CI
 *   keeps 3D). Nothing leaves module memory (T-09-09).
 * - Reduced motion is read live on every snapshot and its `change` event
 *   notifies subscribers, so turning it on mid-visit unmounts the canvas.
 * - downgradeAscent(reason) lasts the session: a frame-budget decline, a lost
 *   context or a canvas that failed to load turns 'eligible' into 'static'
 *   (reduced motion still reads 'static-reduced'). `downgraded` is module
 *   state, so it survives client-side navigation and holds until a full
 *   reload (IN-05, Tim: "Keep sticky, document"). It leaves one local
 *   performance mark, 'ascent-downgrade', with the reason.
 */

export type AscentDowngradeReason = 'frame-budget' | 'context-lost' | 'load-error';

const REDUCED = '(prefers-reduced-motion: reduce)';
/** MAX_TEXTURE_SIZE enum value (WebGL2RenderingContext.MAX_TEXTURE_SIZE). */
const GL_MAX_TEXTURE_SIZE = 0x0d33;

type NavigatorSignals = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

type CheapSignals = { saveData: boolean | undefined; deviceMemory: number | undefined };
type WebGLSignals = { webgl2: boolean; maxTextureSize: number };

let cheap: CheapSignals | null = null;
let webgl: WebGLSignals | null = null;
let downgraded = false;
const listeners = new Set<() => void>();

function readCheapSignals(): CheapSignals {
  const nav = navigator as NavigatorSignals;
  const saveData = nav.connection?.saveData;
  const deviceMemory = nav.deviceMemory;
  return {
    saveData: typeof saveData === 'boolean' ? saveData : undefined,
    deviceMemory: typeof deviceMemory === 'number' ? deviceMemory : undefined,
  };
}

function probeWebGL2(): WebGLSignals {
  try {
    const gl = document
      .createElement('canvas')
      .getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return { webgl2: false, maxTextureSize: 0 };
    const maxTextureSize = Number(gl.getParameter(GL_MAX_TEXTURE_SIZE)) || 0;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { webgl2: true, maxTextureSize };
  } catch {
    return { webgl2: false, maxTextureSize: 0 };
  }
}

function getSnapshot(): AscentMode {
  const reducedMotion = window.matchMedia(REDUCED).matches;
  cheap ??= readCheapSignals();
  // Decide on the cheap signals first; only a device that passes them is probed.
  const early = decideAscentMode({ reducedMotion, ...cheap, webgl2: true, maxTextureSize: Infinity });
  if (early !== 'eligible') return early;
  webgl ??= probeWebGL2();
  const mode = decideAscentMode({ reducedMotion, ...cheap, ...webgl });
  return downgraded && mode === 'eligible' ? 'static' : mode;
}

function getServerSnapshot(): 'pending' {
  return 'pending';
}

function subscribe(callback: () => void): () => void {
  const mediaQuery = window.matchMedia(REDUCED);
  listeners.add(callback);
  mediaQuery.addEventListener('change', callback);
  return () => {
    listeners.delete(callback);
    mediaQuery.removeEventListener('change', callback);
  };
}

/** The ascent mode: 'pending' until hydration, then the device's mode. */
export function useAscentMode(): AscentMode | 'pending' {
  return useSyncExternalStore<AscentMode | 'pending'>(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Turns Home static for the rest of the session. `downgraded` is module state,
 * so the downgrade survives client-side navigation (a later visit to Home stays
 * static) and holds until a full reload (IN-05). Later calls change nothing.
 */
export function downgradeAscent(reason: AscentDowngradeReason): void {
  if (downgraded) return;
  downgraded = true;
  try {
    performance.mark('ascent-downgrade', { detail: { reason } });
  } catch {
    // performance.mark with options is unavailable: the downgrade still applies.
  }
  listeners.forEach((listener) => listener());
}

/** Clears the cached signals and the downgrade (unit tests only). */
export function resetAscentModeForTests(): void {
  cheap = null;
  webgl = null;
  downgraded = false;
  listeners.clear();
}
