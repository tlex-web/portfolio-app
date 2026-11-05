import NotFoundBody from '@/components/site/NotFoundBody';

/**
 * Group not-found (SHELL-05): renders for notFound() thrown inside app/(site),
 * where app/(site)/layout.tsx already provides the shell. Unmatched URLs use
 * the root app/not-found.tsx, which renders the chrome itself.
 */
export default function NotFound() {
  return <NotFoundBody />;
}
