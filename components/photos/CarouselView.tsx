'use client';

import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import CarouselControls from '@/components/photos/CarouselControls';
import CarouselStepper from '@/components/photos/CarouselStepper';
import { LIGHTBOX_CLOSE_EVENT } from '@/components/photos/LightboxDialog';
import { slugFromPath, stepIndex } from '@/lib/photos/stepping';
import type { PhotoView } from '@/lib/photos/view-model';
import { useAscentMode } from '@/lib/useAscentMode';

/** The index of `slug` in `photos`, or -1. */
function indexOf(photos: readonly PhotoView[], slug: string | null): number {
  return slug === null ? -1 : photos.findIndex((p) => p.slug === slug);
}

/**
 * The Carousel view at /photos?view=carousel (PHOTO-02, PHOTO-03, PHOTO-04;
 * D-12, D-13; 10-UI-SPEC "Carousel View"; 10-RESEARCH Pattern 7, Pitfall 7).
 *
 * - Gate (D-13): reads the Home capability gate, useAscentMode(). 'pending'
 *   and every static result render the flat stepper.
 * - Order (PHOTO-03): the photos arrive in the one canonical order
 *   (buildPhotoViews) and are never re-sorted; `index` starts at the first.
 * - No auto-advance (PHOTO-04): `index` changes only on a step the visitor
 *   asks for (a button or ← →) or when the lightbox shows another photo.
 *   There is no timer, and nothing reacts to hover, scroll or visibility.
 * - Keys (Pitfall 7): ← and → are handled by the region's own onKeyDown, so
 *   they act only while focus is inside it, and never while a dialog is open.
 *   No window listener: the lightbox over this view keeps its keys.
 * - Following the lightbox ("Return on close"): while the pathname names a
 *   photo (the lightbox is open over this view, stepping with replaceState),
 *   the front photo follows it, adjusted during render (the SiteNav menuPath
 *   pattern). On close the pathname is /photos again and the front photo
 *   stays, so "Open photo" carries the data-photo-id of the photo shown at
 *   close and the lightbox returns focus there. usePathname can trail a
 *   replaceState step by a few hundred ms (Chromium), so the lightbox's
 *   close event (LIGHTBOX_CLOSE_EVENT, the slug in the URL at close) sets
 *   the front photo too; it is a document listener for that event only.
 * - Live region: the status line reads 'Photo {n} of {total}: {title}' after
 *   a step, never on mount or when following the lightbox.
 *
 * The region carries `data-active-slug` and `data-carousel-mode`
 * ('stepper' | '3d') for tests.
 */
export default function CarouselView({ photos }: { photos: readonly PhotoView[] }) {
  const mode = useAscentMode();
  const pathSlug = slugFromPath(usePathname());
  const [index, setIndex] = useState(() => Math.max(0, indexOf(photos, pathSlug)));
  const [announce, setAnnounce] = useState('');

  // The front photo follows the lightbox: adjusted while rendering, not in an effect.
  const [followedSlug, setFollowedSlug] = useState(pathSlug);
  if (pathSlug !== followedSlug) {
    setFollowedSlug(pathSlug);
    const followed = indexOf(photos, pathSlug);
    if (followed >= 0 && followed !== index) setIndex(followed);
  }

  useEffect(() => {
    const onLightboxClose = (event: Event) => {
      const closed = indexOf(photos, (event as CustomEvent<string>).detail);
      if (closed >= 0) setIndex(closed);
    };
    document.addEventListener(LIGHTBOX_CLOSE_EVENT, onLightboxClose);
    return () => document.removeEventListener(LIGHTBOX_CLOSE_EVENT, onLightboxClose);
  }, [photos]);

  const step = (dir: -1 | 1) => {
    const target = stepIndex(index, dir, photos.length);
    if (target === null) return;
    setIndex(target);
    setAnnounce(`Photo ${target + 1} of ${photos.length}: ${photos[target].title}`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    if (document.querySelector('dialog[open]')) return;
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1);
  };

  const photo = photos[index];
  // Task 1 of 10-07: every gate result renders the stepper; `mode` picks the 3D branch in Task 2.
  void mode;

  return (
    // A named <section> is a region (jsx-a11y/no-redundant-roles: no explicit role).
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- ← → are a shortcut scoped to the region (Pitfall 7); the buttons are the primary path
    <section
      aria-roledescription="carousel"
      aria-label="Photographs"
      data-active-slug={photo.slug}
      data-carousel-mode="stepper"
      onKeyDown={onKeyDown}
    >
      <CarouselStepper photo={photo} />
      <CarouselControls photos={photos} index={index} onStep={step} announce={announce} />
    </section>
  );
}
