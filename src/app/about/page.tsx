import type { Metadata } from 'next';
import { PageHero } from '@/components/ui/PageHero';
import { aboutHero } from '@/data/about';
import { AboutClient } from './AboutClient';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'Studio',
  description:
    'Inside ASTHIWAR, where architecture, structural thinking, interiors and construction stay in one coordinated practice in Coimbatore, Tamil Nadu.',
  openGraph: {
    title: 'Studio — ASTHIWAR',
    description:
      'Inside ASTHIWAR, where architecture, structural thinking, interiors and construction stay in one coordinated practice.',
    url: '/about',
  },
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      {/* 1. Hero */}
      <PageHero
        eyebrow={aboutHero.eyebrow}
        title={aboutHero.title}
        body={aboutHero.body}
        image={aboutHero.image}
        imageAlt={aboutHero.imageAlt}
        imageCaption={aboutHero.imageCaption}
        meta={
          <>
            {aboutHero.meta.map((item) => (
              <span key={item} className={styles.metaItem}>
                {item}
              </span>
            ))}
          </>
        }
      />

      {/* 2 - 5. Content sections (Duality, Principles, Seven Stages, Studio) */}
      <AboutClient />
    </div>
  );
}
