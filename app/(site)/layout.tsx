import SiteChrome from '@/components/site/SiteChrome';
import { jsonLdHtml, siteGraph } from '@/lib/json-ld';

/**
 * Route-group layout for every content route (SHELL-01; UI-SPEC "Shell Contract").
 * The group adds no URL segment; it only puts the pages inside the one shell:
 * skip link, Primary nav, main#main-content and the identity footer.
 * error.tsx in this group renders inside this chrome (an error boundary does not
 * wrap the layout of its own segment).
 *
 * It also renders the site-wide JSON-LD (SEO-04, 17 D-16): one Person and WebSite
 * graph from lib/json-ld.ts, serialized by jsonLdHtml. It lives here, not in the
 * root layout, so it reaches every content page and nothing else: the root
 * not-found and global-error render SiteChrome themselves outside this group, so
 * a 404 or a crash page carries no identity markup. The script is a native
 * JSON-LD data block. The browser never executes it and does not
 * check it against script-src, so it carries no CSP nonce and is not a
 * next/script (the Next json-ld guide; 17-RESEARCH measured zero CSP violations).
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(siteGraph()) }}
      />
      <SiteChrome>{children}</SiteChrome>
    </>
  );
}
