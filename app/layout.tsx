import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import './globals.css';

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
  // Read nonce from proxy.ts x-nonce header -- forces dynamic rendering
  // so Next.js can auto-inject nonces into all framework scripts
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
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
