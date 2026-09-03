import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { HomeProjectsSection } from '@/components/HomeProjectsSection';
import {
  EstimateSection,
  NotesAndQuestions,
  ServicesSection,
  SustainabilitySection,
} from '@/components/HomeSections';
import { HomeSocialDock } from '@/components/HomeSocialDock';
import { SiteFooter, SiteHeader } from '@/components/SiteShell';
import { faqs } from '@/data/site';
import { getFaqJsonLd } from '@/lib/jsonld';

export const metadata: Metadata = {
  title: 'ASTHIWAR — Architecture & Construction in Coimbatore',
  description:
    'See architecture, engineering and construction come together through one coordinated ASTHIWAR process in Coimbatore, Tamil Nadu.',
  openGraph: {
    title: 'ASTHIWAR — Architecture & Construction',
    description:
      'See architecture, engineering and construction come together through one coordinated ASTHIWAR process.',
    url: '/',
    images: [
      {
        url: '/images/sustainable.jpg',
        width: 1600,
        height: 1000,
        alt: 'ASTHIWAR Architecture & Construction',
      },
    ],
  },
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <div className="home-page">
      <JsonLd data={getFaqJsonLd(faqs)} />
      <SiteHeader />
      <main id="main-content">
        <SustainabilitySection />
        <EstimateSection />
        <HomeProjectsSection />
        <ServicesSection />
        <NotesAndQuestions />
      </main>
      <SiteFooter cta="land" />
      <HomeSocialDock />
    </div>
  );
}
