import type { Metadata, Viewport } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { getLocalBusinessJsonLd } from '@/lib/jsonld';
import { env } from '@/lib/env';
import { satoshi } from './fonts';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: 'ASTHIWAR — Architecture & Construction',
    template: '%s — ASTHIWAR',
  },
  description:
    'Integrated architecture, engineering, interiors, and construction in Coimbatore, Tamil Nadu.',
  authors: [{ name: 'ASTHIWAR' }],
  openGraph: {
    title: 'ASTHIWAR — Architecture & Construction',
    description: 'Architecture revealed from red earth to handover.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'ASTHIWAR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASTHIWAR — Architecture & Construction',
    description: 'Architecture revealed from red earth to handover.',
  },
  icons: {
    icon: '/favicon.ico',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={satoshi.variable}>
      <body>
        <JsonLd data={getLocalBusinessJsonLd()} />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
