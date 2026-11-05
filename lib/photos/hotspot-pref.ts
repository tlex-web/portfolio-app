'use client';

import { useSyncExternalStore } from 'react';

/**
 * The hotspot label preference (LBOX-05; D-10; 10-UI-SPEC "Hotspots" shared
 * rules and E7 error).
 *
 * Labels are on by default. "Hide labels" turns them off for every photo and
 * every later visit, so the choice is stored, and it is the only thing about
 * the visitor this site ever stores: one 'on' or 'off' value under one
 * localStorage key, never sent anywhere and never tied to an identifier (the
 * 10-11 privacy prohibition, T-10-25).
 *
 * Every localStorage read and write sits in try/catch (T-10-24): with storage
 * blocked or unavailable (private modes, a policy, a full quota) labels are
 * on, and a toggle still holds for the rest of the visit in memory. Another
 * tab's change arrives through the window 'storage' event.
 *
 * useLabelsOn reads this through useSyncExternalStore with a server snapshot
 * of true, so the server HTML always shows the labels and a stored 'off'
 * applies right after hydration without a mismatch.
 */

/** The one storage key; its values are 'on' and 'off'. */
export const HOTSPOT_PREF_KEY = 'photos.labels';

/** The visit's choice when storage refused the write; null while storage works. */
let visitOnly: boolean | null = null;

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** True unless 'off' is stored (or this visit turned labels off with storage blocked). */
export function readLabelsOn(): boolean {
  if (visitOnly !== null) return visitOnly;
  try {
    return window.localStorage.getItem(HOTSPOT_PREF_KEY) !== 'off';
  } catch {
    return true;
  }
}

/** Store the choice; never throws. With storage blocked it holds for this visit only. */
export function writeLabelsOn(on: boolean): void {
  try {
    window.localStorage.setItem(HOTSPOT_PREF_KEY, on ? 'on' : 'off');
    visitOnly = null;
  } catch {
    visitOnly = on;
  }
  notify();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  // key is null when another tab clears the whole storage area.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== HOTSPOT_PREF_KEY && event.key !== null) return;
    visitOnly = null;
    callback();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

const serverSnapshot = (): boolean => true;

/** [labelsOn, setLabelsOn]: the global preference, shared by every viewer on the page. */
export function useLabelsOn(): readonly [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, readLabelsOn, serverSnapshot);
  return [on, writeLabelsOn] as const;
}
