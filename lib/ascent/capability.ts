/** RED stub: signatures only (09-07 Task 1). */
export type AscentSignals = {
  reducedMotion: boolean;
  saveData: boolean | undefined;
  deviceMemory: number | undefined;
  webgl2: boolean;
  maxTextureSize: number;
};

export type AscentMode = 'static-reduced' | 'static' | 'eligible';

export function decideAscentMode(_signals: AscentSignals): AscentMode {
  return 'static';
}
