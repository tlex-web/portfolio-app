'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <h1 className="text-4xl font-bold mb-4 text-ink">
        Something went wrong!
      </h1>
      <p className="text-lg text-ink mb-8">
        We apologize for the inconvenience. An error occurred while rendering this page.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={reset}
          className="px-6 py-3 bg-accent text-ink-inverse rounded-md hover:bg-accent-hover transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 border-2 border-line-strong rounded-md hover:bg-surface-raised transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}

