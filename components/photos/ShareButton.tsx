'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CheckIcon, LinkIcon, ShareNetworkIcon } from '@/components/icons/inline-phosphor';
import { COPIED_MS } from '@/lib/copy-feedback';
import { useShareMode } from '@/lib/photos/share-mode';

/**
 * The 12 secondary button (CopyEmailButton's SECONDARY) at min-w-42 (168 px),
 * label centred: 'Share region' measures 160.08 px in Chromium on Windows, so
 * 42 leaves room for every platform's font rendering.
 */
const BASE =
  'inline-flex min-h-11 min-w-42 items-center justify-center gap-2 rounded-sm border border-line-strong px-4 text-base font-semibold text-ink cursor-pointer touch-manipulation transition-colors duration-(--duration-fast) ease-erosion';

/**
 * The viewer bar's look (18-20; PhotoViewer's CHROME_BUTTON): regular weight,
 * md:px-4, the label from lg only. lg:min-w-40 (160 px) holds the longest label,
 * 'Share photo' (91.83 px in Inter in Chromium, Firefox and WebKit, so the
 * button is 153.83 px), so the copy-to-share swap shifts nothing in the bar.
 */
const CHROME =
  'inline-flex min-h-11 min-w-11 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-sm border border-line-strong text-ink hover:border-ink-muted md:px-4 lg:min-w-40';

/** Hover per background: the 12 overlay fill on surface, the viewer chrome border on gallery. */
const HOVER = {
  surface: 'hover:bg-surface-overlay',
  gallery: 'hover:border-ink-muted',
} as const;

const FAILED_STATUS = "Couldn't copy the link. It's selected below.";

/** A cancelled share sheet; matched by name so a DOMException from any realm counts. */
function isAbort(err: unknown): boolean {
  return (
    typeof err === 'object' && err !== null && (err as { name?: unknown }).name === 'AbortError'
  );
}

export type ShareButtonProps = {
  /** The canonical absolute URL, built on the server (site.url + photoHref / regionHref). */
  url: string;
  /** The share sheet title, '{heading} · Tim Lui'. */
  title: string;
  subject: 'photo' | 'region';
  surface: 'surface' | 'gallery';
  /**
   * Where a failed copy shows the URL. 'below' (the default, for a standalone
   * use such as the viewer strip) puts the line under the button, as wide as
   * the button. 'row' is for a flex-wrap parent such as the region header
   * band: the component renders two flex items, the button group and, after a
   * failure, the line with `basis-full`, which takes its own full-width row at
   * the end of the parent, so the parent only grows downward and nothing
   * before it moves. The button group carries `shrink-0` in that mode.
   * 'overlay' is for a fixed-height bar (the viewer's top bar, 18-20): the line
   * is an absolute panel at `top-full right-4` of the nearest positioned
   * ancestor (the bar, `relative`), over the content below, so nothing in the
   * bar or under it moves. The button group is not positioned in that mode.
   */
  failurePlacement?: 'below' | 'row' | 'overlay';
  /**
   * 'button' (the default): the secondary button with its visible label (the
   * strip on the scroll tier, the region band). 'chrome' (the viewer's top bar,
   * 18-20): the bar's look, icon-only below lg with the label from lg, and an
   * aria-label in both modes so the icon-only button keeps its name.
   */
  appearance?: 'button' | 'chrome';
};

/**
 * Share / Copy link (PHOTO-07, D-13; 18-UI-SPEC Contract 4), one client island
 * for the region header band and the photo viewer (its top bar from the key
 * tier, its strip on the scroll tier; 18-20). It takes strings only: the
 * URL is the server-built canonical `url` prop and never the window's address,
 * so a query or hash on the current page can't leak (T-18-18).
 *
 * The server renders copy mode (visible 'Copy link', named 'Copy link to this
 * region' / '... photo', which starts with the visible words, WCAG 2.5.3);
 * useShareMode switches to share mode after hydration where the browser can
 * share the URL. min-w-42 holds every label, so the swap shifts nothing.
 *
 * In share mode a press calls navigator.share({ title, url }) first, with no
 * await before it, so the call keeps the click's transient activation (18
 * Pitfall 6). A cancelled sheet (AbortError) does nothing; any other rejection
 * runs the copy path. Presses while a share is pending are ignored, since a
 * second share would reject with InvalidStateError (T-18-19).
 *
 * Copy follows CopyEmailButton: when the write resolves the label reads 'Link
 * copied' with a check for COPIED_MS and the polite status says 'Link copied';
 * a repeat press restarts the window. When the write fails (no Clipboard API,
 * an insecure origin, a denied permission) a line shows the URL (under the
 * button, in its own row with failurePlacement 'row', or as a panel under the
 * viewer bar with 'overlay'), selected through a
 * Range so Ctrl/Cmd+C copies it, and the status says so; the line stays until
 * the next press. Unmounting clears the timer, and a
 * write or share that settles after unmount starts none. A new url does the
 * same for the old one: its timer is cleared, and a write or share started for
 * it that settles later is dropped, so the next photo never reads 'Link copied'
 * for the last photo's link.
 */
export default function ShareButton({
  url,
  title,
  subject,
  surface,
  failurePlacement = 'below',
  appearance = 'button',
}: ShareButtonProps) {
  const mode = useShareMode(url);
  const [copied, setCopied] = useState(false);
  const [failure, setFailure] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const failures = useRef(0);
  const pending = useRef(false);
  /** Bumped on each url change; a write or share whose generation is stale is dropped. */
  const generation = useRef(0);
  const urlRef = useRef<HTMLSpanElement>(null);

  // A new url starts clean (18-18): in the viewer strip the url follows each step, and
  // the last photo's 'Link copied' or failure line must not stand beside the next one.
  // Reset during render (React's "adjusting state on a prop change"), not by a key: the
  // button stays mounted, so focus on it survives an arrow-key step.
  const [shownUrl, setShownUrl] = useState(url);
  if (shownUrl !== url) {
    setShownUrl(url);
    setCopied(false);
    setFailure(0);
    setAnnouncement('');
  }
  // The reset above clears the state; this drops what is still bound to the old url
  // (WR-01): its copied-label timer, and any write or share in flight for it. A layout
  // effect, so it commits with the reset, before a settling promise can run.
  useLayoutEffect(
    () => () => {
      generation.current += 1;
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
    },
    [url]
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
    };
  }, []);

  // Each failure selects the shown URL once it is in the DOM.
  useEffect(() => {
    const target = urlRef.current;
    const selection = window.getSelection();
    if (failure === 0 || !target || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
  }, [failure]);

  async function copy() {
    const gen = generation.current;
    const stale = () => !mounted.current || gen !== generation.current;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(url);
    } catch {
      if (stale()) return;
      // A running copied window must not empty the failure announcement.
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
      setCopied(false);
      failures.current += 1;
      setFailure(failures.current);
      setAnnouncement(FAILED_STATUS);
      return;
    }
    if (stale()) return;
    if (timer.current !== null) clearTimeout(timer.current);
    setCopied(true);
    setAnnouncement('Link copied');
    timer.current = setTimeout(() => {
      timer.current = null;
      setCopied(false);
      setAnnouncement('');
    }, COPIED_MS);
  }

  function onClick() {
    if (pending.current) return;
    setAnnouncement('');
    setFailure(0);
    if (mode !== 'share') {
      void copy();
      return;
    }
    const gen = generation.current;
    let shared: Promise<void>;
    try {
      shared = navigator.share({ title, url });
    } catch (err) {
      shared = Promise.reject(err);
    }
    pending.current = true;
    shared.then(
      () => {
        pending.current = false;
      },
      (err: unknown) => {
        pending.current = false;
        if (!mounted.current || gen !== generation.current || isAbort(err)) return;
        void copy();
      }
    );
  }

  const shareLabel = subject === 'photo' ? 'Share photo' : 'Share region';
  const sharing = mode === 'share' && !copied;
  const Icon = copied ? CheckIcon : sharing ? ShareNetworkIcon : LinkIcon;
  const label = copied ? 'Link copied' : sharing ? shareLabel : 'Copy link';

  const row = failurePlacement === 'row';
  const chrome = appearance === 'chrome';
  const placement = {
    below: 'mt-2 w-0 min-w-full',
    row: 'basis-full',
    overlay:
      'absolute top-full right-4 z-10 mt-1 w-[min(28rem,calc(100%-2rem))] rounded-sm border border-line-strong bg-gallery p-3',
  }[failurePlacement];
  const failed =
    failure > 0 ? (
      <p data-share-failure className={`${placement} text-sm text-ink-muted`}>
        Couldn&apos;t copy the link. It&apos;s selected here:{' '}
        <span ref={urlRef} className="font-mono text-ink wrap-anywhere">
          {url}
        </span>
      </p>
    ) : null;
  // In 'row' mode the line leaves the button group and follows it as a sibling.
  const group = (
    <div className={row ? 'shrink-0' : undefined}>
      <button
        type="button"
        onClick={onClick}
        aria-label={
          mode === 'copy' ? `Copy link to this ${subject}` : chrome ? shareLabel : undefined
        }
        data-share-mode={mode}
        className={chrome ? CHROME : `${BASE} ${HOVER[surface]}`}
      >
        <Icon size={20} aria-hidden="true" />
        {chrome ? <span className="hidden lg:inline">{label}</span> : label}
      </button>
      {row ? null : failed}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </span>
    </div>
  );

  return row ? (
    <>
      {group}
      {failed}
    </>
  ) : (
    group
  );
}
