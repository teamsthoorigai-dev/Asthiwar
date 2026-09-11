import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { PageHero } from '@/components/ui/PageHero';
import { services } from '@/data/site';
import { getServicesJsonLd } from '@/lib/jsonld';
import { ServicesClient } from './ServicesClient';
import styles from './services.module.css';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Real estate, architecture, interior, construction, structural engineering and green building by ASTHIWAR in Coimbatore, Tamil Nadu. Six disciplines coordinated through one process.',
  openGraph: {
    title: 'Services — ASTHIWAR',
    description:
      'Six disciplines. One continuous process. Real estate, architecture, interior, construction, structural engineering and green building.',
    url: '/services',
  },
  alternates: {
    canonical: '/services',
  },
};

export default function ServicesPage() {
  return (
    <div className={styles.page}>
      <JsonLd data={getServicesJsonLd(services)} />

      <PageHero
        eyebrow="Services"
        title="Six disciplines. One continuous process."
        body="ASTHIWAR brings real estate, architecture, interior, engineering and construction together through one coordinated process."
        className={styles.servicesHero}
      />

      <ServicesClient />
    </div>
  );
}
