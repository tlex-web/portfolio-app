'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import EdgeLayout from '@/components/site/EdgeLayout';

type ErrorBodyVariant = 'section' | 'root';

const BODY_COPY: Record<ErrorBodyVariant, string> = {
  section: 'This page hit an unexpected error. Try again, or go back to the homepage.',
  root: 'The site failed to load. Try again, or reload the page.',
};

const PRIMARY =
  'inline-flex items-center gap-2 min-h-11 px-6 rounded-sm bg-accent text-ink-inverse font-semibold text-base hover:bg-accent-hover transition-colors duration-(--duration-fast) ease-erosion cursor-pointer touch-manipulation';
const SECONDARY =
  'inline-flex items-center gap-2 min-h-11 px-6 rounded-sm border border-line-strong text-ink font-semibold text-base hover:bg-surface-raised transition-colors duration-(--duration-fast) ease-erosion';
/** The 07 prose link style, as NotFoundBody's text links. */
const TEXT_LINK = 'text-accent underline underline-offset-[0.2em] min-h-11 inline-flex items-center';

/** copy.error-report (12-01 "Resolved values", supplied). */
const REPORT_LABEL = 'Report this error';

/**
 * Error body (SHELL-05, EDGE-01; D-09; 12-UI-SPEC "Per-page content").
 * `section` renders inside the group chrome from app/(site)/error.tsx; `root` renders inside
 * the static chrome from app/global-error.tsx. The text block sits in the shared EdgeLayout
 * beside the same contour sheet as the 404 (EdgeLayout and EdgeArt are hook-free, so they
 * render inside this client component). On mount focus moves to the h1 so the failure is
 * announced. The thrown error is never passed in, so no exception detail or digest can be
 * rendered (T-12-29). Try again calls onRetry (Next 16.4 `retry()`) once per press, with no
 * pending state: a retry that throws again lands back on this same body.
 *
 * Report this error goes to /contact: a router link in the section variant, a plain anchor
 * in the root variant, because global-error must not depend on the router.
 */
export default function ErrorBody({
  variant,
  onRetry,
}: {
  variant: ErrorBodyVariant;
  onRetry: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <EdgeLayout
      text={
        <>
          <p className="mb-4 font-mono text-sm text-ink-muted tabular-nums">Error</p>
          <h1 ref={headingRef} tabIndex={-1} className="mb-4 text-balance">
            Something went wrong
          </h1>
          <p className="mb-8 text-base text-ink-muted">{BODY_COPY[variant]}</p>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={onRetry} className={PRIMARY}>
              Try again
            </button>
            {variant === 'section' ? (
              <>
                <Link href="/" className={SECONDARY}>
                  Go to the homepage
                </Link>
                <Link href="/contact" className={TEXT_LINK}>
                  {REPORT_LABEL}
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className={`${SECONDARY} cursor-pointer touch-manipulation`}
                >
                  Reload page
                </button>
                {/* Plain anchor on purpose: the global-error fallback must not depend on the router */}
                <a href="/contact" className={TEXT_LINK}>
                  {REPORT_LABEL}
                </a>
              </>
            )}
          </div>
        </>
      }
    />
  );
}
