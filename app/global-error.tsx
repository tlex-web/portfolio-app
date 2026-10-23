'use client';

/** RED stub (07-23 Task 3): the interface only; the root fallback lands in the GREEN commit. */
export default function GlobalError(_props: {
  error: Error & { digest?: string };
  retry: () => void;
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body />
    </html>
  );
}
