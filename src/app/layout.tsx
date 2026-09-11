import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { getOrganizationJsonLd } from '@/lib/jsonld';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://asthiwar.com'),
  title: {
    default: 'ASTHIWAR — Architecture & Construction in Coimbatore',
    template: '%s — ASTHIWAR',
  },
  description:
    'A building practice, not a relay race. Architecture, engineering and construction in Coimbatore, coordinated through one process.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'ASTHIWAR Design & Build',
    title: 'ASTHIWAR — Architecture & Construction',
    description:
      'Architecture, engineering and construction in Coimbatore, coordinated through one process.',
    url: '/',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      {/* Browser extensions commonly stamp attributes onto <body> before React
          hydrates (ColorZilla's `cz-shortcut-listen`, password managers, dark-
          mode injectors), which React reports as a hydration mismatch the app
          cannot cause or fix. Suppression applies to this element's own
          attributes and text only — mismatches in any descendant are still
          reported, so real bugs continue to surface. */}
      <body suppressHydrationWarning>
        <JsonLd data={getOrganizationJsonLd()} />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
