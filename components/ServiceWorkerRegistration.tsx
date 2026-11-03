'use client';

import { useEffect } from 'react';
import {
  SW_RELOAD_KEY,
  SW_UPDATE_INTERVAL_MS,
  hasDirtyField,
  shouldReloadOnControllerChange,
  startUpdateChecks,
} from '@/lib/sw-update';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }

    // Read before registering: a controller at load means a later
    // controllerchange is an update, not the first install.
    const hadController = Boolean(navigator.serviceWorker.controller);

    // Register and check hourly for a new worker; the cleanup stops the checks
    // and a rejected update() is caught (12-31 IN-04).
    const stopUpdateChecks = startUpdateChecks(
      navigator.serviceWorker,
      '/service-worker.js',
      SW_UPDATE_INTERVAL_MS
    );

    // A new worker took control (EDGE-02, PITFALLS #17). Tim's sw.reload-once
    // answer is yes: reload once so a tab open during a deploy gets the new
    // build, but never on a first install, never twice in one tab, and never
    // while a visitor has typed into a field. Otherwise the next in-site
    // navigation fetches the new build anyway (network-first worker).
    const onControllerChange = () => {
      let alreadyReloaded: boolean;
      try {
        alreadyReloaded = sessionStorage.getItem(SW_RELOAD_KEY) === '1';
      } catch {
        return; // No sessionStorage, so no once-per-tab guard: do not reload.
      }
      if (
        !shouldReloadOnControllerChange({
          hadController,
          alreadyReloaded,
          dirty: hasDirtyField(document),
        })
      ) {
        return;
      }
      try {
        sessionStorage.setItem(SW_RELOAD_KEY, '1');
      } catch {
        return;
      }
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      stopUpdateChecks();
    };
  }, []);

  return null; // This component doesn't render anything
}
