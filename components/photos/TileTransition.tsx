'use client';

import { ViewTransition } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { slugFromPath } from '@/lib/photos/stepping';

/**
 * The grid tile's half of the open morph (LBOX-06; 10-UI-SPEC "Open and close
 * motion"; 10-RESEARCH Spike Results, Pitfalls 3 and 6). While no photo is
 * open, the tile's image box is a `photo-{slug}` ViewTransition with
 * the morph share class and default none (keep the share with default none, or
 * the pair silently stops morphing). Opening the lightbox is a navigation
 * transition: the old state holds the tile's name, the new state holds the
 * lightbox photo's, so the pair forms and the thumbnail morphs into the stage.
 *
 * While any photo is open (the pathname names /photos/{slug}), every tile
 * renders without a name, so only the lightbox carries `photo-{slug}`. A step
 * between photos therefore never forms a pair with the grid behind the dialog
 * (no cross-morph, Pitfall 3) and no name is ever duplicated (Pitfall 6).
 * Where View Transitions are missing, or under reduced motion (the
 * ::view-transition-* rule in app/globals.css), the open is instant.
 */
export default function TileTransition({ slug, children }: { slug: string; children: ReactNode }) {
  const open = slugFromPath(usePathname()) !== null;
  if (open) return children;
  return (
    <ViewTransition name={`photo-${slug}`} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}
