import SiteChrome from '@/components/site/SiteChrome';

/**
 * Route-group layout for every content route (SHELL-01; UI-SPEC "Shell Contract").
 * The group adds no URL segment; it only puts the pages inside the one shell:
 * skip link, Primary nav, main#main-content and the identity footer.
 * error.tsx in this group renders inside this chrome (an error boundary does not
 * wrap the layout of its own segment).
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteChrome>{children}</SiteChrome>;
}
