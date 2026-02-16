'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          // Listen for new service worker installing
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  // New version active -- next navigation will use fresh assets
                }
              });
            }
          });

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch(() => {
          // Registration failed -- silent in production
        });

      // Listen for controller changes (new service worker took over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New service worker has taken over -- content will be fresh on next navigation
        // Silent refresh: no user prompt, no forced reload
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
