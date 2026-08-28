import type { Metadata } from 'next';
import { ProjectsClient } from './ProjectsClient';

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'A collection of residential, commercial, and institutional spaces shaped by context, material and intent by ASTHIWAR.',
  openGraph: {
    title: 'Projects — ASTHIWAR',
    description: 'A collection of spaces shaped by context, material and intent.',
    url: '/projects',
    images: [
      {
        url: '/images/courtyard.jpg',
        width: 1200,
        height: 900,
        alt: 'ASTHIWAR Projects Archive',
      },
    ],
  },
  alternates: {
    canonical: '/projects',
  },
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
