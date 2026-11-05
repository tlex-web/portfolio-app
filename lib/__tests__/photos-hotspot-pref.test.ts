/**
 * The label preference (LBOX-05; D-10; 10-UI-SPEC "Hotspots" shared rules,
 * E7 error): labels are on by default, one 'on'/'off' value under one
 * localStorage key, every read and write in try/catch so blocked storage
 * means labels on, another tab's change arrives through the storage event,
 * and nothing else about the visitor is stored (the plan's privacy
 * prohibition). Each case starts from a working write, so no visit-only value leaks.
 */
import { act, renderHook } from '@testing-library/react';
import * as prefModule from '@/lib/photos/hotspot-pref';

/** The module under test; a working write at the start of each case clears any visit-only value. */
const load = () => prefModule;

beforeEach(() => {
  jest.restoreAllMocks();
  prefModule.writeLabelsOn(true);
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('hotspot label preference (D-10)', () => {
  it("uses the one key 'photos.labels'", () => {
    expect(load().HOTSPOT_PREF_KEY).toBe('photos.labels');
  });

  it('is on when nothing is stored', () => {
    expect(load().readLabelsOn()).toBe(true);
  });

  it("writing false stores 'off' and reads back false; writing true stores 'on'", () => {
    const pref = load();
    pref.writeLabelsOn(false);
    expect(window.localStorage.getItem('photos.labels')).toBe('off');
    expect(pref.readLabelsOn()).toBe(false);
    pref.writeLabelsOn(true);
    expect(window.localStorage.getItem('photos.labels')).toBe('on');
    expect(pref.readLabelsOn()).toBe(true);
  });

  it('writing the same value twice leaves one identical stored value (idempotent)', () => {
    const pref = load();
    pref.writeLabelsOn(false);
    pref.writeLabelsOn(false);
    expect(window.localStorage.length).toBe(1);
    expect(window.localStorage.getItem('photos.labels')).toBe('off');
    expect(pref.readLabelsOn()).toBe(false);
  });

  it('reads a stored value written on an earlier visit', () => {
    window.localStorage.setItem('photos.labels', 'off');
    expect(load().readLabelsOn()).toBe(false);
  });

  it('with getItem and setItem throwing, labels are on and a write does not throw', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    const pref = load();
    expect(pref.readLabelsOn()).toBe(true);
    expect(() => pref.writeLabelsOn(false)).not.toThrow();
    // The choice still holds for this visit.
    expect(pref.readLabelsOn()).toBe(false);
  });

  it('stores nothing else: no other key, no session storage, no cookie', () => {
    const pref = load();
    pref.writeLabelsOn(false);
    pref.writeLabelsOn(true);
    expect(Object.keys(window.localStorage)).toEqual(['photos.labels']);
    expect(window.sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
  });
});

describe('useLabelsOn (D-10)', () => {
  it('is on by default and toggling twice returns to the original state', () => {
    const { useLabelsOn } = load();
    const { result } = renderHook(() => useLabelsOn());
    expect(result.current[0]).toBe(true);
    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
    expect(window.localStorage.getItem('photos.labels')).toBe('on');
  });

  it('notifies subscribers when another tab changes the key (storage event)', () => {
    const { useLabelsOn } = load();
    const { result } = renderHook(() => useLabelsOn());
    expect(result.current[0]).toBe(true);
    act(() => {
      window.localStorage.setItem('photos.labels', 'off');
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'photos.labels', newValue: 'off', oldValue: null })
      );
    });
    expect(result.current[0]).toBe(false);
  });

  it('with storage throwing, the hook shows labels and still toggles for the visit', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    const { useLabelsOn } = load();
    const { result } = renderHook(() => useLabelsOn());
    expect(result.current[0]).toBe(true);
    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
  });
});
