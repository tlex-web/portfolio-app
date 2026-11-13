import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter, JetBrains_Mono, Schibsted_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import SpeedInsightsRoute from '@/components/SpeedInsightsRoute';
import { site } from '@/data/site';
import { SITE_DESCRIPTION } from '@/lib/metadata';
import './globals.css';

// Display face (DSGN-07): h1, h2 and the wordmark. Variable wght 400-900;
// adjustFontFallback size-adjusts the local fallback so a late swap stays CLS-safe.
const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-schibsted',
  display: 'swap',
  adjustFontFallback: true,
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  // D-13: every relative URL field (each page's canonical, OG images) resolves
  // against the one canonical host in data/site.ts.
  metadataBase: new URL(site.url),
  // SHELL-03: identity from data/site.ts (name, role); child segments render "<page> · Tim Lui"
  title: { default: 'Tim Lui · Developer & photographer', template: '%s · Tim Lui' },
  description: SITE_DESCRIPTION,
  // Inherited by every route: pages set no openGraph or twitter of their own
  // (lib/metadata.ts), so these and the file-based OG images survive the
  // shallow merge. No canonical here: every route would inherit it (SEO-01).
  openGraph: { type: 'website', siteName: site.name, locale: 'en_GB' },
  twitter: { card: 'summary_large_image' },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read headers to force dynamic rendering so Next.js can auto-inject the
  // per-request nonce that proxy.ts sets into all framework scripts
  await headers();

  return (
    <html lang="en" className={`dark ${schibsted.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Prefetch Common Routes */}
        <link rel="prefetch" href="/projects" />
        <link rel="prefetch" href="/photos" />
      </head>
      <body className="font-body antialiased">
        <ServiceWorkerRegistration />
        {children}
        <Analytics />
        <SpeedInsightsRoute />
      </body>
    </html>
  );
}
