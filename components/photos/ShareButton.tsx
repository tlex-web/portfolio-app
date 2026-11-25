'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckIcon, LinkIcon, ShareNetworkIcon } from '@phosphor-icons/react/dist/ssr';
import { COPIED_MS } from '@/lib/copy-feedback';
import { useShareMode } from '@/lib/photos/share-mode';

/**
 * The 12 secondary button (CopyEmailButton's SECONDARY) at min-w-42 (168 px),
 * label centred: 'Share region' measures 160.08 px in Chromium on Windows, so
 * 42 leaves room for every platform's font rendering.
 */
const BASE =
  'inline-flex min-h-11 min-w-42 items-center justify-center gap-2 rounded-sm border border-line-strong px-4 text-base font-semibold text-ink cursor-pointer touch-manipulation transition-colors duration-(--duration-fast) ease-erosion';

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
   */
  failurePlacement?: 'below' | 'row';
};

/**
 * Share / Copy link (PHOTO-07, D-13; 18-UI-SPEC Contract 4), one client island
 * for the region header band and the viewer strip. It takes strings only: the
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
 * button, or in its own row with failurePlacement 'row'), selected through a
 * Range so Ctrl/Cmd+C copies it, and the status says so; the line stays until
 * the next press. Unmounting clears the timer, and a
 * write or share that settles after unmount starts none.
 */
export default function ShareButton({
  url,
  title,
  subject,
  surface,
  failurePlacement = 'below',
}: ShareButtonProps) {
  const mode = useShareMode(url);
  const [copied, setCopied] = useState(false);
  const [failure, setFailure] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const failures = useRef(0);
  const pending = useRef(false);
  const urlRef = useRef<HTMLSpanElement>(null);

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
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(url);
    } catch {
      if (!mounted.current) return;
      failures.current += 1;
      setFailure(failures.current);
      setAnnouncement(FAILED_STATUS);
      return;
    }
    if (!mounted.current) return;
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
        if (!mounted.current || isAbort(err)) return;
        void copy();
      }
    );
  }

  const shareLabel = subject === 'photo' ? 'Share photo' : 'Share region';
  const sharing = mode === 'share' && !copied;
  const Icon = copied ? CheckIcon : sharing ? ShareNetworkIcon : LinkIcon;
  const label = copied ? 'Link copied' : sharing ? shareLabel : 'Copy link';

  const row = failurePlacement === 'row';
  const failed =
    failure > 0 ? (
      <p
        data-share-failure
        className={`${row ? 'basis-full' : 'mt-2 w-0 min-w-full'} text-sm text-ink-muted`}
      >
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
        aria-label={mode === 'copy' ? `Copy link to this ${subject}` : undefined}
        data-share-mode={mode}
        className={`${BASE} ${HOVER[surface]}`}
      >
        <Icon size={20} aria-hidden="true" />
        {label}
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
