import SiteChrome from '@/components/site/SiteChrome';
import NotFoundBody from '@/components/site/NotFoundBody';

/**
 * Root not-found (SHELL-05): handles every unmatched URL, including the three
 * deleted playground routes, with HTTP 404 and no forwarding (e2e/shell.spec.ts
 * "Shell 404" lists them). It is wrapped only by the root layout, which has no
 * shell, so it renders the chrome itself. notFound() inside the (site) group
 * uses app/(site)/not-found.tsx.
 */
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundBody />
    </SiteChrome>
  );
}
