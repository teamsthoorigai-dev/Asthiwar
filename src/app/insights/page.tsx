import type { Metadata } from 'next';
import { insightsPage } from '@/data/insights';
import { InsightsClient } from './InsightsClient';
import styles from './insights.module.css';

export const metadata: Metadata = {
  title: 'Architectural Monograph & Insights',
  description:
    'Rigorous engineering inquiries, material physics, and vernacular climatic research from the ASTHIWAR Coimbatore Atelier.',
  openGraph: {
    title: 'Architectural Monograph & Insights — ASTHIWAR',
    description:
      'Rigorous engineering inquiries, material physics, and vernacular climatic research from the ASTHIWAR Coimbatore Atelier.',
    url: '/insights',
  },
  alternates: {
    canonical: '/insights',
  },
};

export default function InsightsPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="insights-title">
        <div className={styles.inner}>
          <p className={styles.eyebrow}>RESEARCH &amp; MONOGRAPHS</p>
          <h1 className={styles.title} id="insights-title">
            {insightsPage.title}
          </h1>
          <p className={styles.subtitle}>
            {insightsPage.subtitle}
          </p>
        </div>
      </section>
      <InsightsClient />
    </div>
  );
}
