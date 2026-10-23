'use client';

import { useEffect } from 'react';
import ErrorBody from '@/components/site/ErrorBody';

/**
 * Section error boundary (SHELL-05). Renders inside the (site) group chrome.
 * Try again calls `retry()`, Next 16.4's documented recovery API (user-approved
 * deviation from the UI-SPEC's `reset()` wording, 2026-10-10); `reset` stays in
 * the props signature but is not used. The error is logged, never rendered.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return <ErrorBody variant="section" onRetry={retry} />;
}
