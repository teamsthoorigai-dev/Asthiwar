import type { Metadata } from 'next';
import { LogoReveal } from '@/components/home/LogoReveal';
import { PrinciplesMarquee } from '@/components/home/PrinciplesMarquee';
import { WorkGallery } from '@/components/home/WorkGallery';
import { EstimateBand } from '@/components/home/EstimateBand';
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
 * agreed order: the four principles, the work, then what it costs, then how the
 * practice thinks, then what it covers, then the questions people actually ask.
 * The footer, from SiteChrome, closes it.
 *
 * The principles band takes the place v1 gave it — the first thing after the
 * opening viewport — since this page has no photographic hero to weld it to.
 *
 * DisciplinesSticky is the one sticky set-piece left on the page; everything
 * below the hero otherwise scrolls at its natural rate.
 */
export default function HomePage() {
  return (
    <>
      <LogoReveal />
      <PrinciplesMarquee />
      <WorkGallery content={workGallery} />
      <EstimateBand />
      <LastingCards />
      <DisciplinesSticky />
      <Faq content={faqContent} />
      <SocialDock />
    </>
  );
}
