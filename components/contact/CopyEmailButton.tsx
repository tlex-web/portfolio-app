'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon } from '@phosphor-icons/react/dist/ssr';

/** How long the button reads 'Copied' after a successful copy (D-06). */
export const COPIED_MS = 2000;

/** The 07 secondary button at px-4 (12-UI-SPEC "Direct contact panel"). */
const SECONDARY =
  'inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-strong px-4 text-base font-semibold text-ink cursor-pointer touch-manipulation transition-colors duration-(--duration-fast) ease-erosion hover:bg-surface-overlay';

/**
 * Copy for the Direct contact panel's address (CONTACT-01, D-06; 12-UI-SPEC
 * "Direct contact panel", Copy behaviour), the only client code in the panel.
 * The server renders it with its final label, so it never shifts the layout.
 *
 * A press writes exactly `email` to the clipboard. When the write resolves, the
 * label swaps to a check and 'Copied' for COPIED_MS (instant, no motion) and the
 * persistent polite status reads 'Copied'; both revert together. A press inside
 * that window restarts it: the old timer is cleared first, so timers never
 * stack. The status is emptied as each press starts, so every successful press
 * is a fresh text change and is announced once.
 *
 * Where the Clipboard API is missing or rejects (an insecure origin, a denied
 * permission), the button stays quiet: nothing is announced, the label stays,
 * and the address element `targetId` is selected through a Range so Ctrl/Cmd+C
 * copies it by hand (12-01 default.3). Unmounting clears the timer, and a write
 * that resolves after unmount starts none.
 */
export default function CopyEmailButton({ email, targetId }: { email: string; targetId: string }) {
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
    };
  }, []);

  function selectAddress() {
    const target = document.getElementById(targetId);
    const selection = window.getSelection();
    if (!target || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function copy() {
    setAnnouncement('');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(email);
    } catch {
      if (mounted.current) selectAddress();
      return;
    }
    if (!mounted.current) return;
    if (timer.current !== null) clearTimeout(timer.current);
    setCopied(true);
    setAnnouncement('Copied');
    timer.current = setTimeout(() => {
      timer.current = null;
      setCopied(false);
      setAnnouncement('');
    }, COPIED_MS);
  }

  return (
    <>
      <button type="button" onClick={copy} aria-label="Copy email address" className={SECONDARY}>
        {copied ? (
          <CheckIcon size={20} aria-hidden="true" />
        ) : (
          <CopyIcon size={20} aria-hidden="true" />
        )}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
