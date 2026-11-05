/**
 * The capability decision behind Home's two faces (HOME-02, HOME-08; D-18,
 * D-21; 09-RESEARCH Pattern 2; 09-UI-SPEC "Modes"). Pure and import-free so it
 * is unit-tested without a browser; lib/useAscentMode.ts gathers the signals.
 *
 * - Reduced motion wins over everything: 'static-reduced' (the compact stacked
 *   layout CSS already shows at first paint).
 * - Save-Data, navigator.deviceMemory below 4, no WebGL2 context (requested
 *   with failIfMajorPerformanceCaveat) or a MAX_TEXTURE_SIZE below 2048 give
 *   'static': the tall layout over the poster, no canvas code fetched.
 * - A signal the browser does not expose (saveData and deviceMemory are
 *   Chromium-only) passes.
 * - The viewport width never decides 3D: capable phones get the 256² mesh.
 */

/** What the client probe reads once per page view (reduced motion is live). */
export type AscentSignals = {
  reducedMotion: boolean;
  /** navigator.connection?.saveData; undefined outside Chromium. */
  saveData: boolean | undefined;
  /** navigator.deviceMemory in GB; undefined outside Chromium. */
  deviceMemory: number | undefined;
  /** getContext('webgl2', { failIfMajorPerformanceCaveat: true }) returned a context. */
  webgl2: boolean;
  /** MAX_TEXTURE_SIZE of that context; 0 without one. */
  maxTextureSize: number;
};

export type AscentMode = 'static-reduced' | 'static' | 'eligible';

/** The smallest MAX_TEXTURE_SIZE the terrain textures fit in (hillshade 1100 px, heightmap 512 px). */
const MIN_TEXTURE_SIZE = 2048;
/** Devices reporting less memory (GB) than this keep the poster. */
const MIN_DEVICE_MEMORY_GB = 4;

export function decideAscentMode(s: AscentSignals): AscentMode {
  if (s.reducedMotion) return 'static-reduced';
  if (s.saveData === true) return 'static';
  if (s.deviceMemory !== undefined && s.deviceMemory < MIN_DEVICE_MEMORY_GB) return 'static';
  if (!s.webgl2 || s.maxTextureSize < MIN_TEXTURE_SIZE) return 'static';
  return 'eligible';
}
