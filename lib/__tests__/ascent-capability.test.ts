/**
 * HOME-02, HOME-08 (D-18, D-21; 09-RESEARCH Pattern 2 "Capability gate"): the
 * pure decision between the 3D ascent and the static poster. Reduced motion
 * wins over everything (the compact static layout); Save-Data, low memory, no
 * WebGL2 (with failIfMajorPerformanceCaveat) or a small MAX_TEXTURE_SIZE give
 * the tall static layout. Signals a browser does not expose (undefined) pass.
 * The viewport width is not a signal at all.
 */
import { decideAscentMode, type AscentSignals } from '@/lib/ascent/capability';

/** Every signal passing: a capable desktop Chromium. */
const capable: AscentSignals = {
  reducedMotion: false,
  saveData: false,
  deviceMemory: 8,
  webgl2: true,
  maxTextureSize: 16384,
};

const decide = (overrides: Partial<AscentSignals>) =>
  decideAscentMode({ ...capable, ...overrides });

describe('decideAscentMode (D-18)', () => {
  it('is eligible when every signal passes', () => {
    expect(decideAscentMode(capable)).toBe('eligible');
  });

  it('returns static-reduced under reduced motion even when every other signal passes', () => {
    expect(decide({ reducedMotion: true })).toBe('static-reduced');
  });

  it('returns static-reduced under reduced motion even when another static trigger is set', () => {
    expect(decide({ reducedMotion: true, saveData: true, webgl2: false })).toBe('static-reduced');
  });

  it('returns static for Save-Data', () => {
    expect(decide({ saveData: true })).toBe('static');
  });

  it('passes an undefined saveData (non-Chromium browsers)', () => {
    expect(decide({ saveData: undefined })).toBe('eligible');
  });

  it('returns static for deviceMemory 2', () => {
    expect(decide({ deviceMemory: 2 })).toBe('static');
  });

  it('is eligible at deviceMemory 4 (the threshold is "below 4")', () => {
    expect(decide({ deviceMemory: 4 })).toBe('eligible');
  });

  it('passes an undefined deviceMemory (Firefox, Safari)', () => {
    expect(decide({ deviceMemory: undefined })).toBe('eligible');
  });

  it('returns static without a WebGL2 context', () => {
    expect(decide({ webgl2: false, maxTextureSize: 0 })).toBe('static');
  });

  it('returns static for MAX_TEXTURE_SIZE 1024', () => {
    expect(decide({ maxTextureSize: 1024 })).toBe('static');
  });

  it('is eligible at MAX_TEXTURE_SIZE 2048 with everything else passing', () => {
    expect(decide({ maxTextureSize: 2048 })).toBe('eligible');
  });
});
