import type { Metadata } from 'next';
import { LogoReveal } from '@/components/home/LogoReveal';
import { SustainabilityHero } from '@/components/home/SustainabilityHero';
import { WorkGallery } from '@/components/home/WorkGallery';
import { EstimateBand } from '@/components/home/EstimateBand';
import { ChecklistBand } from '@/components/home/ChecklistBand';
import { LastingCards } from '@/components/home/LastingCards';
import { DisciplinesSticky } from '@/components/home/DisciplinesSticky';
import { Faq } from '@/components/home/Faq';
import { SocialDock } from '@/components/layout/SocialDock';
import { faqContent, workGallery } from '@/data/home';

export const metadata: Metadata = {
  title: 'Architecture & Construction in Coimbatore',
  description:
    'Architecture, engineering and construction in Coimbatore — coordinated through one process, from the first site walk to the first monsoon.',
  openGraph: {
    title: 'ASTHIWAR — Architecture & Construction in Coimbatore',
    description:
      'Architecture, engineering and construction in Coimbatore — coordinated through one process, from the first site walk to the first monsoon.',
    url: '/',
    siteName: 'ASTHIWAR Design & Build',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
};

/**
 * Homepage — proof first.
 *
 * The opening viewport is the logo reveal and nothing else. What follows is the
 * agreed order: the work, then the sustainability photographic statement with
 * its integrated principles marquee, then what it costs, then how the practice thinks,
 * then what it covers, then the questions people actually ask. The footer,
 * from SiteChrome, closes it.
 *
 * DisciplinesSticky is the one sticky set-piece left on the page; everything
 * below the hero otherwise scrolls at its natural rate.
 */
export default function HomePage() {
  return (
    <>
      <LogoReveal />
      <EstimateBand />
      <ChecklistBand />
      <WorkGallery content={workGallery} />
      <SustainabilityHero />
      <LastingCards />
      <DisciplinesSticky />
      <Faq content={faqContent} />
      <SocialDock />
    </>
  );
}
