import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter, JetBrains_Mono, Schibsted_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
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
  title: 'Portfolio | Landscape Photography & Projects',
  description:
    'Personal portfolio showcasing landscape photography and programming projects',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read headers to force dynamic rendering so Next.js can auto-inject
  // nonces from middleware.ts into all framework scripts
  await headers();

  return (
    <html lang="en" className={`dark ${schibsted.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Resource Hints for Performance */}
        <link rel="dns-prefetch" href="https://vercel.com" />

        {/* Prefetch Common Routes */}
        <link rel="prefetch" href="/projects" />
        <link rel="prefetch" href="/photos" />
      </head>
      <body className="font-body antialiased">
        <ServiceWorkerRegistration />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
