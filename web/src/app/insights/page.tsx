import type { Metadata } from 'next';
import { InsightsClient } from './InsightsClient';

export const metadata: Metadata = {
  title: 'Insights',
  description:
    'Working notes, material observations, and project field records from the ASTHIWAR studio and building sites.',
  openGraph: {
    title: 'Insights — ASTHIWAR',
    description:
      'Working notes, material observations, and project field records from the ASTHIWAR studio and building sites.',
    url: '/insights',
    images: [{ url: '/images/materials.jpg', width: 1600, height: 1000, alt: 'ASTHIWAR Insights' }],
  },
  alternates: {
    canonical: '/insights',
  },
};

export default function InsightsPage() {
  return <InsightsClient />;
}
