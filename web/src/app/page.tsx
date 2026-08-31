import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { AssemblySequence } from '@/components/AssemblySequence';
import { HomeProjectsSection } from '@/components/HomeProjectsSection';
import { HomeSocialDock } from '@/components/HomeSocialDock';
import {
  EstimateSection,
  NotesAndQuestions,
  ServicesSection,
  SustainabilitySection,
} from '@/components/JourneyPage';
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
        url: '/images/hero.jpg',
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
    <div className="home-page home-page--assembly">
      <JsonLd data={getFaqJsonLd(faqs)} />
      <SiteHeader />
      <main id="main-content">
        <AssemblySequence />
        <SustainabilitySection />
        <EstimateSection />
        <HomeProjectsSection />
        <ServicesSection />
        <JourneyHandoff />
        <NotesAndQuestions />
      </main>
      <SiteFooter cta="land" />
      <HomeSocialDock />
    </div>
  );
}

function JourneyHandoff() {
  return (
    <section
      className="home-passage section section--mineral"
      aria-labelledby="journey-handoff-title"
    >
      <div className="shell home-passage__grid">
        <div className="home-passage__marker">
          <span>05</span>
          <p>Field record / 300 frames</p>
        </div>
        <div className="home-passage__statement">
          <h2 id="journey-handoff-title">First inspect the assembly. Then follow the build.</h2>
          <div>
            <p>
              The model reveals how every layer belongs together. Continue into the field record to
              watch the same promise move from groundwork to handover.
            </p>
            <div className="home-passage__actions">
              <Link href="/journey" className="button button--oxide">
                Enter the field record <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
