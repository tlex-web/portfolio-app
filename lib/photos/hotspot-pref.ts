'use client';

/** RED stub (10-11 Task 1): replaced by the real store in the GREEN commit. */
export const HOTSPOT_PREF_KEY = '';
export function readLabelsOn(): boolean {
  return true;
}
export function writeLabelsOn(_on: boolean): void {}
export function useLabelsOn(): readonly [boolean, (on: boolean) => void] {
  return [true, () => {}];
}
