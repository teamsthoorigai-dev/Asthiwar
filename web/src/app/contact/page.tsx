import type { Metadata } from 'next';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Tell ASTHIWAR about your project, your site and what you want to build in Coimbatore or Tamil Nadu.',
  openGraph: {
    title: 'Contact — ASTHIWAR',
    description: 'Tell ASTHIWAR about your project, your site and what you want to build.',
    url: '/contact',
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  return <ContactForm />;
}
