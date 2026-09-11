import type { Metadata } from 'next';
import { StudioClient } from './StudioClient';

export const metadata: Metadata = {
  title: 'Studio — ASTHIWAR',
  description:
    'Designing with Purpose. Rooted in Context. Evolving with Time. Inside ASTHIWAR architecture, structural engineering, and construction practice in Coimbatore and Virudhunagar, Tamil Nadu.',
  openGraph: {
    title: 'Studio — ASTHIWAR',
    description:
      'Designing with Purpose. Rooted in Context. Evolving with Time. Integrated Architecture, Structural Engineering, and Construction practice.',
    url: '/studio',
  },
  alternates: {
    canonical: '/studio',
  },
};

export default function StudioPage() {
  return <StudioClient />;
}
