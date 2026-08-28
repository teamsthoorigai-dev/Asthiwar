import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { JourneyPage } from '@/components/JourneyPage';
import { faqs } from '@/data/site';
import { getFaqJsonLd } from '@/lib/jsonld';

export const metadata: Metadata = {
  title: 'Field Record',
  description:
    'Follow ASTHIWAR’s fixed-camera construction record from red earth foundations to completed handover in Coimbatore.',
  openGraph: {
    title: 'Field Record — ASTHIWAR',
    description:
      'Follow ASTHIWAR’s fixed-camera construction record from red earth foundations to completed handover.',
    url: '/journey',
    images: [
      {
        url: '/images/asthivar-villa.jpg',
        width: 2000,
        height: 1414,
        alt: 'ASTHIWAR Field Record',
      },
    ],
  },
  alternates: {
    canonical: '/journey',
  },
};

export default function JourneyRoute() {
  return (
    <>
      <JsonLd data={getFaqJsonLd(faqs)} />
      <JourneyPage />
    </>
  );
}
