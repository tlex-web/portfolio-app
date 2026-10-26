'use client';

import { CardsThreeIcon, MapTrifoldIcon, SquaresFourIcon } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from 'next/navigation';
import { VIEWS, VIEW_LABELS, viewHref, type GalleryView } from '@/lib/photos/view-param';

const ICONS: Record<GalleryView, typeof MapTrifoldIcon> = {
  map: MapTrifoldIcon,
  grid: SquaresFourIcon,
  carousel: CardsThreeIcon,
};

/** Every segment (UI-SPEC View switcher "Segment"); 44 px tall, 20 px icon before the text. */
const SEGMENT =
  'relative inline-flex min-h-11 cursor-pointer touch-manipulation items-center gap-2 rounded-sm px-4 text-base font-semibold transition-colors duration-(--duration-fast) ease-erosion';

/** Unselected: muted ink on the raised track; hover lifts it to the overlay and ink. */
const UNSELECTED = 'text-ink-muted hover:bg-surface-overlay hover:text-ink';

/** Selected: overlay and ink plus the 2 px accent bar, so the state never rests on colour alone. */
const SELECTED =
  'bg-surface-overlay text-ink after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:bg-accent';

/**
 * The Map · Grid · Carousel switcher in the /photos header band (PHOTO-02,
 * D-14; 10-UI-SPEC "Header Band (D-14)", View switcher table, Interaction
 * States "View segment", Copywriting "View switcher").
 *
 * A toggle group, not a radiogroup: `role="group"` named 'View' holding three
 * `aria-pressed` buttons in VIEWS order, so Tab reaches each segment and
 * Enter or Space presses it; there is no arrow-key roving and no roving
 * tabindex (UI-SPEC Keyboard row). Exactly one segment is pressed: the `view`
 * the page parsed from the URL.
 *
 * The URL is the only source of view state (locked): pressing a segment calls
 * the router's replace with the view's href and scrolling off, so switching adds no
 * history entry, the scroll position stays put and the button keeps focus
 * (the header is outside the keyed view region, so React keeps this element).
 * Pressing the pressed segment returns early and changes nothing. The view
 * region crossfades through the page's `photos-view` ViewTransition.
 */
export default function ViewSwitcher({ view }: { view: GalleryView }) {
  const router = useRouter();

  return (
    <div
      role="group"
      aria-label="View"
      className="inline-flex gap-1 rounded-sm border border-line-strong bg-surface-raised p-1"
    >
      {VIEWS.map((v) => {
        const SegmentIcon = ICONS[v];
        const pressed = v === view;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={pressed}
            className={`${SEGMENT} ${pressed ? SELECTED : UNSELECTED}`}
            onClick={() => {
              if (pressed) return;
              router.replace(viewHref(v), { scroll: false });
            }}
          >
            <SegmentIcon size={20} aria-hidden="true" />
            {VIEW_LABELS[v]}
          </button>
        );
      })}
    </div>
  );
}
