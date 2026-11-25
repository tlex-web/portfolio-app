'use client';

import {
  ViewTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  CaretLeftIcon,
  CaretRightIcon,
  EyeSlashIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  XIcon,
} from '@phosphor-icons/react/dist/ssr';
import EndCard, { type EndCardProps } from '@/components/photos/EndCard';
import type { BreadcrumbItem } from '@/components/photos/Breadcrumb';
import ExifStrip from '@/components/photos/ExifStrip';
import { HotspotKey, HotspotMarks, HotspotOverlay } from '@/components/photos/Hotspots';
import { useLightbox } from '@/components/photos/LightboxDialog';
import StagePhoto from '@/components/photos/StagePhoto';
import ZoomStage from '@/components/photos/ZoomStage';
import { keyBelongsToChrome } from '@/components/site/SiteNav';
import { site } from '@/data/site';
import { isEditable } from '@/lib/dom/editable';
import { cssEscape } from '@/lib/photos/css-escape';
import { useLabelsOn } from '@/lib/photos/hotspot-pref';
import { photoHref } from '@/lib/photos/routes';
import { slugFromPath, stepWithEnd, swipeStep } from '@/lib/photos/stepping';
import type { PhotoView } from '@/lib/photos/view-model';

/**
 * The one photo viewer for both surfaces (D-05, D-08; LBOX-01, LBOX-04,
 * LBOX-07; 10-UI-SPEC "Photo Viewer"): `page` is the full photo page inside
 * the shell (title as h1, 'Back to {region}' leading link), `modal` the
 * lightbox inside the dialog (title as h2#photo-title, used from 10-05).
 *
 * Layout tiers (10-UI-SPEC "Layout tiers"; the lb-* variants in
 * app/globals.css, mirrored in lib/photos/lightbox-tiers.ts):
 * - lb-scroll (below 768 px wide or 640 px tall): the surface scrolls as one
 *   column. On the page the 'Back to {region}' link takes its own row, then the
 *   chrome bar, sticky under the nav; the photo at full width and true ratio,
 *   capped at 70svh; the strip in one column.
 * - lb-key (768 to below 1280 px, at least 640 px tall): the page viewer fills
 *   calc(100svh - nav): the 56 px chrome bar (the link first in its left
 *   group), the stage (flex-1, a size container) and the strip in two columns.
 * - lb-gutter (from 1280 px, at least 640 px tall): as key, and the stage
 *   reserves a 216 px gutter on each side (px-54) for the hotspot callouts,
 *   whether or not labels show, so the photo never resizes on toggle.
 *
 * The photo box is the largest box at the photo's ratio inside the stage
 * (`--ar` = w / h; width min(100cqw, 100cqh * ar)), drawn object-fit: contain,
 * never cropped, on gallery black, never tinted by the map palette. StagePhoto
 * fills it: the opener derivative first, the large one on top once loaded,
 * and the slow-load and load-error states with Retry (10-UI-SPEC E5). The server
 * HTML already holds the layout, the title and the strip before the photo
 * decodes. Below the stage, ExifStrip carries the title, place and date,
 * story, EXIF, position and the rights line (D-05). Only the content-hashed
 * manifest derivatives (AVIF and WebP at 1024, 1600 and 2560 px) are
 * referenced: no original, no download control and no right-click or drag
 * blocking (LBOX-07, T-10-03).
 *
 * The surface comes from the variant and, for the modal, from useLightbox():
 * inside the LightboxDialog the viewer fills the dialog (h-full on key and
 * gutter, so the size-container stage has a height), the chrome is sticky at
 * the dialog's top on the scroll tier, and Close is the last control of the
 * chrome's right group (accessible name 'Close photo', visible text 'Close'
 * from 768 px), closing through router.back() (LBOX-01).
 *
 * Escape (D-08; 10-UI-SPEC "Focus", Escape layers): in the modal the dialog
 * owns the key and runs the layers registered through useLightbox()
 * .registerEscape, closing last. On the page a document keydown listener does
 * the same job: a layer that consumes Escape calls preventDefault, and when
 * none has, Escape navigates to the `back` page (the photo's region page, 18
 * D-09), never a blind browser Back, because a directly loaded page may have
 * nothing behind it. On the page every
 * viewer key (Escape, ← →, Z, H, the zoomed pan) skips a press that belongs
 * to the site chrome (keyBelongsToChrome: the open mobile menu, or focus in
 * the nav, skip link or footer); the open menu also takes Escape first and
 * prevents it (10-REVIEW CR-01).
 *
 * Moving between photos (LBOX-02; 10-UI-SPEC "Moving between photos"): the
 * chrome's left group holds 'Previous photo', the counter 'n / N' (mono,
 * aria-hidden; the status line says it in words) and 'Next photo'. The
 * buttons, the ← and → keys and a horizontal swipe on the fitted photo move
 * through the canonical order without wrapping (UI-SPEC OQ4): at either end
 * the control is aria-disabled, stays focusable and does nothing. A step
 * writes '/photos/{slug}' with history.replaceState on both surfaces (D-08 as
 * amended at OQ1, Tim's answer "A: replaceState both (Recommended)",
 * 2026-10-26), so no history entry is added, the page is never intercepted
 * into a dialog (10-RESEARCH Pitfall 1) and the viewer is never remounted
 * (Pitfall 2): focus stays on the pressed control and the dialog stays open.
 * The slug shown starts from slugFromPath(usePathname()) (Next keeps the
 * pathname in sync with replaceState; the segment params keep the stale slug)
 * and is then owned by the viewer: every real navigation to another photo
 * remounts it, and the steps themselves are the only other change. A step
 * reads the last slug it wrote from a ref, not from the rendered props: while
 * a view transition runs (the open morph) React holds commits back, and a
 * second click in that window would otherwise replay the first step. Each step updates
 * a polite status line inside the viewer ('Photo 2 of 7: {title}') and the
 * document title. Once the current photo's large derivative loads, the
 * neighbours' stage derivatives are fetched at low priority, once per slug.
 *
 * The stepping set and the way back (LBOX-09, 18 D-12; 17 D-09; PHOTO-05):
 * `photos` is the shown photo's region series in sequence order, built on the
 * server (regionViewerSet in lib/regions.ts) and passed as props. A one-photo
 * set (a one-photo region) keeps its rule: with fewer than two photos the
 * left group renders no Previous, counter or Next, so the viewer offers no
 * control that does nothing; the arrows and the swipe already do nothing there
 * (stepIndex returns null). The page surface requires `back` ({ href, name }),
 * built on the server by photoBack from the region registry (regionHref and
 * the bare region name) for every photo, the v2.0 four included (18 D-09):
 * both back links read 'Back to {name}' and, with the page Escape, lead to the
 * region page that lists the photo, and the strip's legend reads 'Esc back to
 * {name}'. A page render without `back` throws a RangeError; no gallery-wide
 * way back remains in the viewer. The lightbox shows no back link (D-09 is
 * page-only) and ignores `back`. This file imports no region data; the region
 * reaches the client only through the serialisable prop.
 *
 * The trail (18 D-10; 18-UI-SPEC Contract 6): the page passes `breadcrumb`,
 * photoBreadcrumb's 'Photographs / {region} / {title}' built on the server, and
 * ExifStrip renders it above the h1. The current crumb follows the shown photo:
 * after a step its name is the shown photo's title (a step stays inside the
 * region, so the other crumbs hold). The end card replaces the strip, so it
 * shows no trail; the lightbox shows none (the region page behind it has its own).
 *
 * The end-of-series card (LBOX-09, 18 D-12; 18-UI-SPEC Contract 3): after the
 * series' last photo comes one extra step (stepWithEnd), the `endCard` props
 * built on the server by regionEndCard, rendered by EndCard in place of the
 * stage and the strip. The counter reads 'End' there; Next and Zoom are
 * aria-disabled (focusable, no action, Z does nothing), Previous, ← and a swipe
 * right return to the last photo, Hide labels and Close are unchanged. The card
 * is a viewer state, not a page: no replaceState, so the URL, the document
 * title and the lightbox's shown slug stay on the last photo, a reload shows
 * the last photo and a close returns focus to its figure (14 LBOX-08). The
 * status line reads the card's announcement. When the swap removes the
 * focused element (focus in the stage, strip or card), focus moves to the step
 * button of the direction taken. A one-photo set has no card (no steps at all).
 *
 * Open morph (LBOX-06; UI-SPEC "Open and close motion"): the photo box is
 * the lightbox half of the photo-{slug} pair (the morph share class, default none;
 * TileTransition is the grid half, named only while no photo is open). The
 * name follows the shown photo (the boundary is keyed by slug), so after
 * steps the box carries the current slug; a step forms no pair, because the
 * grid has no names then. The name is dropped as soon as the pathname stops
 * naming a photo, so it is never mounted twice (Pitfall 6).
 * Close is instant (popstate starts no view transition).
 *
 * Zoom (D-06; 10-UI-SPEC "Chrome bar", Zoom row, and "Stage and photo", Zoom
 * row): the viewer owns `zoomed`, and ZoomStage renders the stage around the
 * photo box (fit, or 1:1 of the 2560 px derivative in a scroll box). The
 * chrome's right group holds the Zoom toggle before Close: constant name
 * 'Zoom photo', visible text 'Zoom' from 768 px, aria-pressed (pressed:
 * bg-ink text-gallery), aria-keyshortcuts 'z', MagnifyingGlassPlusIcon fitted
 * and MagnifyingGlassMinusIcon zoomed. The Z key (no modifier held, not in a
 * text field) toggles it too. Z and the button centre the photo; a click on
 * the photo zooms in at that point. While zoomed, ZoomStage claims the arrow
 * keys (they pan, so the stepping listener below skips them) and the first
 * Escape (an Escape layer in the lightbox; on the page a prevented press the
 * page handler skips); the swipe is off. Every step resets zoom to fit.
 *
 * Hotspots (LBOX-05; D-09, D-10, D-11; 10-UI-SPEC "Hotspots"): HotspotMarks
 * draws the glyphs (gutter tier) and the numbered dots (key and scroll tiers)
 * inside the photo box, HotspotOverlay the gutter labels and leaders over the
 * stage, and HotspotKey the strip's 'Labels' key. The viewer owns expandedId
 * (one callout open at a time, collapsed on every step) and the global label
 * preference (useLabelsOn: one localStorage value, on by default). The
 * chrome's right group starts with 'Hide labels' (constant name, aria-pressed
 * while hidden, aria-keyshortcuts 'h', EyeSlashIcon, visible text from
 * 768 px); the H key toggles it too. Hidden labels and zoom both remove
 * everything drawn on or around the photo; the key stays.
 *
 * The callout is the first Escape layer (10-UI-SPEC "Focus": callout, then
 * zoom, then close): it collapses the open hotspot and returns focus to its
 * gutter label or key row, whichever is shown. In the lightbox it registers
 * through registerEscape after ZoomStage (a child, whose layout effect runs
 * first), so it runs first; on the page it listens on window in the capture
 * phase, ahead of ZoomStage's document capture listener, and prevents the
 * press so the later layers skip it.
 */

/** The stage `sizes`: the gutter tier takes 2 x 216 px from the viewport width. */
const STAGE_SIZES = '(min-width: 1280px) calc(100vw - 432px), 100vw';

const BACK_LINK =
  'min-h-11 items-center gap-2 text-base font-semibold text-ink-muted hover:text-ink';

/**
 * The chrome bar buttons (10-UI-SPEC "Chrome bar", Interaction States):
 * icon-only below 768 px, icon + text from 768 px; cursor-pointer and
 * touch-action: manipulation on every button.
 */
const CHROME_BUTTON =
  'inline-flex min-h-11 min-w-11 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-sm border border-line-strong text-ink hover:border-ink-muted md:px-4';

/** The ‹ › buttons: icon-only at every width; at an end aria-disabled, dimmed and inert to hover. */
const STEP_BUTTON =
  'inline-flex min-h-11 min-w-11 cursor-pointer touch-manipulation items-center justify-center rounded-sm border border-line-strong text-ink hover:border-ink-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:border-line-strong';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** Fetch a photo's stage derivative at low priority, so a step finds it in the cache. */
function preloadStage(view: PhotoView): void {
  const img = new Image();
  img.fetchPriority = 'low';
  img.decoding = 'async';
  img.sizes = STAGE_SIZES;
  img.srcset = view.stage.srcSetAvif;
  img.src = view.stage.src;
}

type Swipe = { id: number; x: number; y: number; follow: boolean };

export default function PhotoViewer({
  variant,
  photos,
  initialSlug,
  back,
  breadcrumb,
  endCard,
}: {
  variant: 'page' | 'modal';
  photos: readonly PhotoView[];
  initialSlug: string;
  /** The region's end-of-series card (18 D-12), built on the server by regionEndCard. */
  endCard: EndCardProps;
  /**
   * The page surface's way back (18 D-09): the photo's region page and its bare
   * name, built on the server by photoBack. Required on the page; the lightbox ignores it.
   */
  back?: { href: string; name: string };
  /**
   * The page's trail (18 D-10), built on the server by photoBreadcrumb, the last
   * crumb (the photo at load) without href. The lightbox ignores it.
   */
  breadcrumb?: readonly BreadcrumbItem[];
}) {
  if (!photos.some((p) => p.slug === initialSlug)) {
    throw new RangeError(`PhotoViewer: no photo with slug ${initialSlug}`);
  }
  const isPage = variant === 'page';
  if (isPage && !back) {
    throw new RangeError(
      `PhotoViewer: the page variant needs back (18 D-09), none for ${initialSlug}`
    );
  }
  const backHref = back?.href;
  const lightbox = useLightbox();
  const router = useRouter();
  const pathname = usePathname();

  // The photo shown, seeded from the pathname (it names this photo on mount).
  // While the route leaves (close, Escape on the page) the pathname no longer
  // names a photo, and the viewer keeps showing the last one until it unmounts.
  const [shownSlug, setShownSlug] = useState(() => {
    const fromPath = slugFromPath(pathname);
    return fromPath && photos.some((p) => p.slug === fromPath) ? fromPath : initialSlug;
  });
  const lastWritten = useRef(shownSlug);
  // On the end card (18 D-12): a viewer state, not a page. The shown slug, the
  // URL and the lightbox's shown slug all stay on the last photo meanwhile.
  const [onCard, setOnCard] = useState(false);
  const onCardRef = useRef(false);
  const index = photos.findIndex((p) => p.slug === shownSlug);
  const current = photos[index];
  const { aspect, prevSlug, nextSlug } = current;
  // The position among the steps: 0 … N - 1 the photos, N the card. The step
  // buttons' ends derive from it (stepWithEnd), not from the neighbour slugs.
  const position = onCard ? photos.length : index;
  const canStep = (dir: -1 | 1) =>
    photos.length > 1 && stepWithEnd(position, dir, photos.length) !== null;
  const [announcement, setAnnouncement] = useState('');
  // Fit (false) or 1:1 (true); every step starts fitted (D-06).
  const [zoomed, setZoomed] = useState(false);
  const toggleZoom = useCallback(() => setZoomed((z) => !z), []);
  // The open hotspot (one at a time) and the global label preference (D-10).
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleHotspot = useCallback(
    (id: string) => setExpandedId((open) => (open === id ? null : id)),
    []
  );
  const [labelsOn, setLabelsOn] = useLabelsOn();
  const viewerRef = useRef<HTMLDivElement>(null);
  const onZoomChange = useCallback((z: boolean) => setZoomed(z), []);

  // Where focus goes when a step swaps the stage and strip for the card or
  // back: set by step, applied once the swap has committed (below).
  const focusAfterSwap = useRef<-1 | 1 | null>(null);

  // One step: the target is the neighbour in the committed view-model's
  // canonical order (T-10-14), never input; past either end nothing happens
  // (no wrap); the URL is replaced, never pushed; zoom resets to fit. After the
  // last photo comes one extra step, the end card (18 D-12): it writes no URL
  // and no history entry and leaves the lightbox's shown slug on the last
  // photo, so a close returns focus to that photo's figure. A one-photo set
  // keeps its rule (no controls, no steps), so it never reaches the card.
  const step = useCallback(
    (dir: -1 | 1) => {
      const n = photos.length;
      if (n < 2) return;
      const from = onCardRef.current ? n : photos.findIndex((p) => p.slug === lastWritten.current);
      const to = stepWithEnd(from, dir, n);
      if (from < 0 || to === null) return;
      // A step across the card swaps out the stage and the strip, so focus
      // that sat in them would fall to the body: it moves to the step button
      // of the direction taken (a pressed Next or Previous keeps it anyway).
      if (to === n || from === n) {
        const viewer = viewerRef.current;
        const active = document.activeElement;
        const chrome = viewer?.querySelector('[data-viewer-chrome]');
        const swappedOut =
          !!viewer && !!active && viewer.contains(active) && !chrome?.contains(active);
        focusAfterSwap.current = swappedOut ? dir : null;
      }
      setZoomed(false);
      setExpandedId(null);
      if (to === n) {
        onCardRef.current = true;
        setOnCard(true);
        setAnnouncement(endCard.announcement);
        return;
      }
      onCardRef.current = false;
      setOnCard(false);
      const { slug, title } = photos[to];
      lastWritten.current = slug;
      window.history.replaceState(null, '', photoHref(slug));
      // The lightbox learns the step at once: a browser Back close returns
      // focus by it, and usePathname can lag the replaceState (10-REVIEW WR-01).
      lightbox?.setShown(slug);
      setShownSlug(slug);
      setAnnouncement(`Photo ${to + 1} of ${n}: ${title}`);
    },
    [lightbox, photos, endCard.announcement]
  );

  // The focus move a card swap asked for, once the new content has committed.
  useLayoutEffect(() => {
    const dir = focusAfterSwap.current;
    if (dir === null) return;
    focusAfterSwap.current = null;
    const name = dir === 1 ? 'Next photo' : 'Previous photo';
    viewerRef.current
      ?.querySelector<HTMLButtonElement>(`[data-viewer-chrome] button[aria-label="${name}"]`)
      ?.focus();
  }, [onCard]);

  // The document title follows the shown photo (the metadata only sets it on
  // load). The route's own <title> can still be written after hydration (WebKit
  // rewrites it for ~350 ms after the viewer appears, 12-23), which would undo
  // a step taken in that window, so a head mutation re-applies the shown
  // photo's title. Only while the URL names that photo: once the route leaves,
  // the next page's title is left alone, even before this effect is cleaned up.
  useEffect(() => {
    const wanted = `${current.title} · ${site.name}`;
    const path = photoHref(current.slug);
    const keep = () => {
      if (window.location.pathname === path && document.title !== wanted) document.title = wanted;
    };
    document.title = wanted;
    const observer = new MutationObserver(keep);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [current.title, current.slug]);

  // Page surface only: Escape is the last layer and goes to the `back` page,
  // the photo's region page (18 D-09; was /photos, D-08).
  // The zoom layer runs first (ZoomStage, capture phase): while zoomed it
  // prevents the press and leaves zoom, and this handler skips it.
  useEffect(() => {
    if (!isPage || backHref === undefined) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (keyBelongsToChrome(event)) return;
      event.preventDefault();
      router.push(backHref);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPage, router, backHref]);

  // ← and → step on both surfaces (the page behind a modal dialog is inert, so
  // only the lightbox's viewer is reachable then). A layer that uses the
  // arrows itself (10-10 zoomed pan) calls preventDefault first; modified
  // presses are left alone (Alt+← is the browser's Back). A layout effect, so
  // the keys work during the open morph: React runs passive effects only once
  // the view transition has finished.
  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.shiftKey || isEditable(event.target)) return;
      if (isPage && keyBelongsToChrome(event)) return;
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? -1 : 1);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPage, step]);

  // Z toggles zoom on both surfaces (the button declares it as its keyboard shortcut):
  // only with no modifier held and outside text fields. A layout effect for
  // the same reason as the arrows.
  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'z' && event.key !== 'Z') return;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.shiftKey || event.repeat || isEditable(event.target)) return;
      if (isPage && keyBelongsToChrome(event)) return;
      event.preventDefault();
      // Nothing to zoom on the end card: Zoom is aria-disabled there.
      if (onCardRef.current) return;
      toggleZoom();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPage, toggleZoom]);

  // Every labels toggle (the 'Hide labels' button and H) goes through here:
  // hiding also collapses the open callout, so a hidden callout never holds
  // the first Escape and showing labels again starts collapsed (D-12, ledger
  // 10 IN-01). Not an effect on labelsOn: the preference is a cross-tab store,
  // and another tab's change must not collapse a callout being read here.
  function setLabels(on: boolean) {
    setLabelsOn(on);
    if (!on) setExpandedId(null);
  }

  // H toggles Hide labels on both surfaces, under the same rules as Z.
  const toggleLabels = useEffectEvent(() => setLabels(!labelsOn));
  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'h' && event.key !== 'H') return;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.shiftKey || event.repeat || isEditable(event.target)) return;
      if (isPage && keyBelongsToChrome(event)) return;
      event.preventDefault();
      toggleLabels();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPage]);

  // The callout Escape layer: collapse the open hotspot and return focus to
  // its gutter label or key row, whichever is rendered and shown. The callout
  // is the first Escape layer (10-UI-SPEC order: callout, zoom, close) only
  // while that label or row is visible. A hidden callout (zoomed, labels
  // hidden, or any later hide path) is cleared without taking the press, so
  // the next layer handles it: a key press never acts on something the
  // visitor cannot see (D-22, ledger 10 IN-01).
  const collapseCallout = useEffectEvent((): boolean => {
    if (expandedId === null) return false;
    const id = cssEscape(expandedId);
    setExpandedId(null);
    const candidates = viewerRef.current?.querySelectorAll<HTMLElement>(
      `[data-hotspot-label="${id}"], [data-hotspot-row="${id}"]`
    );
    const shown = [...(candidates ?? [])].find((el) => el.getClientRects().length > 0);
    if (!shown) return false;
    shown.focus();
    return true;
  });
  useLayoutEffect(() => lightbox?.registerEscape(() => collapseCallout()), [lightbox]);
  useLayoutEffect(() => {
    if (lightbox) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (keyBelongsToChrome(event)) return;
      if (collapseCallout()) event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [lightbox]);

  // Neighbour preload, once per slug, after the current photo's large layer loads.
  const preloaded = useRef(new Set<string>());
  const preloadNeighbours = useCallback(() => {
    for (const slug of [prevSlug, nextSlug]) {
      if (!slug || preloaded.current.has(slug)) continue;
      const view = photos.find((p) => p.slug === slug);
      if (!view) continue;
      preloaded.current.add(slug);
      preloadStage(view);
    }
  }, [photos, prevSlug, nextSlug]);

  // Swipe on the fitted photo (touch or pen): the box follows the finger, and
  // on release a long horizontal drag steps; anything else springs back over
  // --duration-fast. Under reduced motion the box does not follow and nothing
  // springs. Vertical drags stay with the browser (touch-action: pan-y
  // pinch-zoom), which cancels the pointer when it scrolls.
  const boxRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<Swipe | null>(null);

  function setOffset(dx: number, animate: boolean) {
    const box = boxRef.current;
    if (!box) return;
    box.style.transition = animate ? 'translate var(--duration-fast) var(--ease-erosion)' : 'none';
    box.style.translate = dx === 0 ? '' : `${dx}px 0`;
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    // Fitted only: zoomed, a touch drag pans the stage natively.
    if (zoomed) return;
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    if (!event.isPrimary) return;
    swipe.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      follow: !window.matchMedia(REDUCED_MOTION).matches,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // An inactive pointer (a synthetic event) cannot be captured; the swipe still works.
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = swipe.current;
    if (!start || start.id !== event.pointerId || !start.follow) return;
    setOffset(event.clientX - start.x, false);
  }

  function endSwipe(event: ReactPointerEvent<HTMLDivElement>, released: boolean) {
    const start = swipe.current;
    if (!start || start.id !== event.pointerId) return;
    swipe.current = null;
    const dir = released ? swipeStep(event.clientX - start.x, event.clientY - start.y) : 0;
    if (dir !== 0 && canStep(dir)) {
      setOffset(0, false);
      step(dir);
    } else {
      setOffset(0, start.follow);
    }
  }

  // The lightbox half of the open morph. Named only while the pathname names a
  // photo (the complement of TileTransition's condition, read from the same
  // pathname in the same commit), so on close the viewer drops its name before
  // the grid tiles take theirs, and the copy Next keeps in a hidden Activity
  // for Forward carries none. Keyed by slug: a step unmounts the old name and
  // mounts the new one, because React tracks names per boundary at mount and
  // a renamed boundary would leave the old name registered.
  const named = slugFromPath(pathname) !== null;
  const boxStyle = {
    aspectRatio: `${aspect.w} / ${aspect.h}`,
    '--ar': aspect.w / aspect.h,
  } as CSSProperties;

  const box = (
    <div
      ref={boxRef}
      data-photo-box=""
      className="relative mx-auto bg-gallery [touch-action:pan-y_pinch-zoom] lb-scroll:w-[min(100%,calc(70svh*var(--ar)))] lb-key:w-[min(100cqw,calc(100cqh*var(--ar)))] lb-gutter:w-[min(100cqw,calc(100cqh*var(--ar)))]"
      style={boxStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => endSwipe(event, true)}
      onPointerCancel={(event) => endSwipe(event, false)}
    >
      <StagePhoto view={current} sizes={STAGE_SIZES} onLargeLoad={preloadNeighbours} />
      <HotspotMarks
        view={current}
        labelsOn={labelsOn}
        zoomed={zoomed}
        expandedId={expandedId}
        onToggle={toggleHotspot}
      />
    </div>
  );
  const photoBox = named ? (
    <ViewTransition key={current.slug} name={`photo-${current.slug}`} share="morph" default="none">
      {box}
    </ViewTransition>
  ) : (
    box
  );

  return (
    <div
      ref={viewerRef}
      data-photo-viewer=""
      className={
        isPage
          ? 'flex flex-col bg-gallery text-ink lb-key:h-[calc(100svh-var(--nav-h))] lb-gutter:h-[calc(100svh-var(--nav-h))]'
          : 'flex flex-col bg-gallery text-ink lb-key:h-full lb-gutter:h-full'
      }
    >
      {isPage && back && (
        <div data-viewer-back="" className="px-4 pt-2 lb-key:hidden lb-gutter:hidden">
          <Link href={back.href} className={`inline-flex ${BACK_LINK}`}>
            <ArrowLeftIcon size={20} aria-hidden="true" />
            Back to {back.name}
          </Link>
        </div>
      )}
      <div
        data-viewer-chrome=""
        className={
          isPage
            ? 'flex h-14 shrink-0 items-center justify-between gap-2 bg-gallery px-4 lb-scroll:sticky lb-scroll:top-(--nav-h)'
            : 'flex h-14 shrink-0 items-center justify-between gap-2 bg-gallery px-4 lb-scroll:sticky lb-scroll:top-0'
        }
      >
        <div data-chrome-left="" className="flex items-center gap-2">
          {isPage && back && (
            <Link
              href={back.href}
              className={`hidden lb-key:inline-flex lb-gutter:inline-flex ${BACK_LINK}`}
            >
              <ArrowLeftIcon size={20} aria-hidden="true" />
              Back to {back.name}
            </Link>
          )}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                aria-disabled={canStep(-1) ? undefined : 'true'}
                className={STEP_BUTTON}
                onClick={() => step(-1)}
              >
                <CaretLeftIcon size={24} aria-hidden="true" />
              </button>
              <span
                data-photo-counter=""
                aria-hidden="true"
                className="font-mono text-sm text-ink-muted tabular-nums"
              >
                {onCard ? 'End' : `${index + 1} / ${photos.length}`}
              </span>
              <button
                type="button"
                aria-label="Next photo"
                aria-disabled={canStep(1) ? undefined : 'true'}
                className={STEP_BUTTON}
                onClick={() => step(1)}
              >
                <CaretRightIcon size={24} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
        <div data-chrome-right="" className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Hide labels"
            aria-pressed={!labelsOn}
            aria-keyshortcuts="h"
            className={`${CHROME_BUTTON} aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-gallery aria-pressed:hover:border-ink`}
            onClick={() => setLabels(!labelsOn)}
          >
            <EyeSlashIcon size={24} aria-hidden="true" className="md:size-5" />
            <span className="hidden md:inline">Hide labels</span>
          </button>
          <button
            type="button"
            aria-label="Zoom photo"
            aria-pressed={zoomed}
            aria-keyshortcuts="z"
            aria-disabled={onCard ? 'true' : undefined}
            className={`${CHROME_BUTTON} aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-gallery aria-pressed:hover:border-ink aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:border-line-strong`}
            onClick={onCard ? undefined : toggleZoom}
          >
            {zoomed ? (
              <MagnifyingGlassMinusIcon size={24} aria-hidden="true" className="md:size-5" />
            ) : (
              <MagnifyingGlassPlusIcon size={24} aria-hidden="true" className="md:size-5" />
            )}
            <span className="hidden md:inline">Zoom</span>
          </button>
          {lightbox && (
            <button
              type="button"
              aria-label="Close photo"
              className={CHROME_BUTTON}
              onClick={lightbox.close}
            >
              <XIcon size={24} aria-hidden="true" />
              <span className="hidden md:inline">Close</span>
            </button>
          )}
        </div>
      </div>
      {onCard ? (
        // The end card replaces the stage and the strip (the strip describes a
        // photo; the card shows none). A swipe right on it returns to the last photo.
        <div
          data-end-card-stage=""
          className="flex flex-1 items-center justify-center bg-gallery py-12 [touch-action:pan-y_pinch-zoom]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => endSwipe(event, true)}
          onPointerCancel={(event) => endSwipe(event, false)}
        >
          <EndCard card={endCard} headingLevel={isPage ? 1 : 2} />
        </div>
      ) : (
        <>
          <ZoomStage view={current} zoomed={zoomed} onZoomChange={onZoomChange}>
            {photoBox}
            <HotspotOverlay
              view={current}
              labelsOn={labelsOn}
              zoomed={zoomed}
              expandedId={expandedId}
              onToggle={toggleHotspot}
            />
          </ZoomStage>
          <ExifStrip
            view={current}
            headingLevel={isPage ? 1 : 2}
            backName={isPage ? back?.name : undefined}
            breadcrumb={
              isPage && breadcrumb && breadcrumb.length > 0
                ? [...breadcrumb.slice(0, -1), { name: current.title }]
                : undefined
            }
            hotspotKey={
              <HotspotKey view={current} expandedId={expandedId} onToggle={toggleHotspot} />
            }
          />
        </>
      )}
      <p role="status" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
