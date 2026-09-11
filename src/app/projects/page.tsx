import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProjectsHeroSequence } from '@/components/projects/ProjectsHeroSequence';
import { Section } from '@/components/ui/Section';
import { ProjectsArchive } from '@/components/projects/ProjectsArchive';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'A collection of spaces shaped by context, material and intent by ASTHIWAR.',
  openGraph: {
    title: 'Projects — ASTHIWAR',
    description:
      'A collection of spaces shaped by context, material and intent.',
    url: '/projects',
  },
  alternates: { canonical: '/projects' },
};

export default function ProjectsPage() {
  return (
    <>
      <ProjectsHeroSequence />

      <div id="project-archive">
        <Section className={styles.archiveSection}>
          <Suspense fallback={null}>
            <ProjectsArchive />
          </Suspense>
        </Section>
      </div>
    </>
  );
}
