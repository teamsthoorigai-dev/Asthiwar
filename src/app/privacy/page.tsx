import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { privacyPage } from '@/data/privacy';

const DESCRIPTION =
  'How ASTHIWAR collects, uses, shares and protects the personal information you give us through this website.';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: DESCRIPTION,
  openGraph: {
    title: 'Privacy Policy — ASTHIWAR',
    description: DESCRIPTION,
    url: '/privacy',
  },
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return <LegalDocument page={privacyPage} />;
}
