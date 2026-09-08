import type { Metadata } from 'next';
import { PageHero } from '@/components/ui/PageHero';
import { sustainablePage } from '@/data/sustainability';
import { SustainableConstructionClient } from './SustainableConstructionClient';
import styles from './sustainable-construction.module.css';

export const metadata: Metadata = {
  title: 'Sustainable construction',
  description:
    'Natural cooling, lower-cement construction and green-building methods considered together by ASTHIWAR.',
  openGraph: {
    title: 'Sustainable construction — ASTHIWAR',
    description:
      'Natural cooling, lower-cement construction and green-building methods considered together by ASTHIWAR.',
    url: '/sustainable-construction',
  },
  alternates: {
    canonical: '/sustainable-construction',
  },
};

export default function SustainableConstructionPage() {
  return (
    <div className={styles.page}>
      <PageHero
        body={sustainablePage.hero.body}
        eyebrow={sustainablePage.hero.eyebrow}
        image={sustainablePage.hero.image}
        title={sustainablePage.hero.title}
      />
      <SustainableConstructionClient />
    </div>
  );
}
