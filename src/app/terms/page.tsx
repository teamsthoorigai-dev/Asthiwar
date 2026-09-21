import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { termsPage } from '@/data/terms';

const DESCRIPTION =
  'The terms that apply when you use the ASTHIWAR website, including how our cost estimates and quotations work.';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: DESCRIPTION,
  openGraph: {
    title: 'Terms & Conditions — ASTHIWAR',
    description: DESCRIPTION,
    url: '/terms',
  },
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return <LegalDocument page={termsPage} />;
}
