'use client';

import { ViewTransition } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { slugFromPath } from '@/lib/photos/stepping';

/**
 * The sequence figure's half of the open morph (LBOX-06; P4 default: the morph
 * is kept; 18-UI-SPEC Contract 2 "Opening" and Motion Summary). While no
 * photo is open, the figure's image box is a `photo-{slug}` ViewTransition
 * with the morph share class and default none (keep the share with default
 * none, or the pair silently stops morphing). Opening the lightbox over the
 * region page is a navigation transition: the old state holds the figure's
 * name, the new state the lightbox photo's, so the pair forms and the photo
 * morphs into the stage over --duration-settle ease-geological.
 *
 * While any photo is open (the pathname names /photos/{slug}), every figure
 * renders without a name, so only the lightbox carries `photo-{slug}`: a step
 * never forms a pair with the page behind the dialog, and no name is ever
 * mounted twice. The region's header cover never takes a name for the same
 * reason. Where View Transitions are missing, or under reduced motion (the
 * ::view-transition-* rule in app/globals.css), the open is instant.
 */
export default function FigureTransition({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const open = slugFromPath(usePathname()) !== null;
  if (open) return children;
  return (
    <ViewTransition name={`photo-${slug}`} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}
