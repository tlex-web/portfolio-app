'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

type ErrorBodyVariant = 'section' | 'root';

const BODY_COPY: Record<ErrorBodyVariant, string> = {
  section: 'This page hit an unexpected error. Try again, or go back to the homepage.',
  root: 'The site failed to load. Try again, or reload the page.',
};

const PRIMARY =
  'inline-flex items-center gap-2 min-h-11 px-6 rounded-sm bg-accent text-ink-inverse font-semibold text-base hover:bg-accent-hover transition-colors duration-(--duration-fast) ease-erosion cursor-pointer touch-manipulation';
const SECONDARY =
  'inline-flex items-center gap-2 min-h-11 px-6 rounded-sm border border-line-strong text-ink font-semibold text-base hover:bg-surface-raised transition-colors duration-(--duration-fast) ease-erosion';

/**
 * Error body (SHELL-05; UI-SPEC "Edge Pages Inside the Shell", "Copywriting Contract").
 * `section` renders inside the group chrome from app/(site)/error.tsx; `root` renders inside
 * the static chrome from app/global-error.tsx. Same layout as NotFoundBody. On mount focus
 * moves to the h1 so the failure is announced. The thrown error is never passed in, so no
 * exception detail can be rendered. Try again calls onRetry (Next 16.4 `retry()`).
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
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-16">
      <div className="max-w-prose">
        <p className="font-mono text-sm text-ink-muted tabular-nums mb-4">Error</p>
        <h1 ref={headingRef} tabIndex={-1} className="mb-4 text-balance">
          Something went wrong
        </h1>
        <p className="text-base text-ink-muted mb-8">{BODY_COPY[variant]}</p>
        <div className="flex flex-wrap gap-4">
          <button type="button" onClick={onRetry} className={PRIMARY}>
            Try again
          </button>
          {variant === 'section' ? (
            <Link href="/" className={SECONDARY}>
              Go to the homepage
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`${SECONDARY} cursor-pointer touch-manipulation`}
            >
              Reload page
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
