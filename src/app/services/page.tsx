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
    'Architecture, interior, construction, structural engineering and green building by ASTHIWAR in Coimbatore, Tamil Nadu. Five disciplines coordinated through one process.',
  openGraph: {
    title: 'Services — ASTHIWAR',
    description:
      'Five disciplines. One continuous process. Architecture, interior, construction, structural engineering and green building.',
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
        title="Five disciplines. One continuous process."
        body="ASTHIWAR brings architecture, engineering and execution together through one coordinated process."
      />

      <ServicesClient />
    </div>
  );
}
