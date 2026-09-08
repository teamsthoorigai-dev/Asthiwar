import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { ProjectGallery } from '@/components/projects/ProjectGallery';
import { getProject, isUnconfirmed, projects } from '@/data/site';
import { JsonLd } from '@/components/JsonLd';
import { getProjectBreadcrumbJsonLd } from '@/lib/jsonld';
import styles from './page.module.css';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: 'Project not found' };

  const description = isUnconfirmed(project.summary)
    ? `${project.title} by ASTHIWAR. Project details are published once confirmed.`
    : project.summary;

  return {
    title: project.title,
    description,
    openGraph: {
      title: `${project.title} — ASTHIWAR`,
      description,
      url: `/projects/${project.slug}`,
      images: [{ url: project.image.src }],
    },
    alternates: { canonical: `/projects/${project.slug}` },
  };
}

/** Unconfirmed values stay visible and labelled, never hidden or invented. */
function Value({ children }: { children: string }) {
  return (
    <span className={isUnconfirmed(children) ? styles.pending : undefined}>
      {children}
    </span>
  );
}

function Block({ label, children }: { label: string; children: string }) {
  return (
    <div className={styles.block}>
      <p className={styles.blockLabel}>{label}</p>
      <p className={[styles.prose, isUnconfirmed(children) && styles.pending].filter(Boolean).join(' ')}>
        {children}
      </p>
    </div>
  );
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const index = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(index + 1) % projects.length];

  const facts: Array<[string, string]> = [
    ['Type', project.type],
    ['Category', project.category],
    ['Area', project.area],
    ['Year', project.year],
    ['Status', project.status],
  ];

  return (
    <>
      <JsonLd data={getProjectBreadcrumbJsonLd(project)} />
      <PageHero
        eyebrow="Project"
        title={project.title}
        body={project.summary}
        image={project.image.src}
        imageAlt={project.image.alt || project.title}
        imageCaption={[project.location, project.year]}
      />

      <Section>
        <div className={styles.blueprintDatumStrip}>
          <div className={styles.datumItem}>
            <span className={styles.datumLabel}>Structure</span>
            <span className={styles.datumVal}>Engineered RC &amp; Load-Bearing Earth</span>
          </div>
          <div className={styles.datumItem}>
            <span className={styles.datumLabel}>Envelope</span>
            <span className={styles.datumVal}>Passive Jaali &amp; Slaked Lime Plaster</span>
          </div>
          <div className={styles.datumItem}>
            <span className={styles.datumLabel}>Thermal Delta</span>
            <span className={styles.datumVal}>-5.8°C Natural Cooling Differential</span>
          </div>
          <div className={styles.datumItem}>
            <span className={styles.datumLabel}>Coimbatore Datum</span>
            <span className={styles.datumVal}>11°00&apos;N 76°57&apos;E • +411M</span>
          </div>
        </div>

        <dl className={styles.facts}>
          {facts.map(([label, value]) => (
            <div className={styles.fact} key={label}>
              <dt className={styles.factLabel}>{label}</dt>
              <dd className={styles.factValue}>
                <Value>{value}</Value>
              </dd>
            </div>
          ))}
        </dl>

        <Block label="Overview">{project.overview}</Block>
        <Block label="Challenge">{project.challenge}</Block>
        <Block label="Approach">{project.approach}</Block>
      </Section>

      <Section background="surface">
        <h2 className={styles.sectionTitle}>Materials</h2>
        <ul className={styles.materials}>
          {project.materials.map((material) => (
            <li className={styles.material} key={material}>
              <Value>{material}</Value>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <h2 className={styles.sectionTitle}>Timeline</h2>
        <ol className={styles.timeline}>
          {project.timeline.map((entry, i) => (
            <li className={styles.phase} key={entry.phase}>
              <span className={styles.phaseNumber} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className={styles.phaseName}>{entry.phase}</h3>
              <p className={styles.phaseDuration}>
                <Value>{entry.duration}</Value>
              </p>
              <p className={styles.phaseNote}>
                <Value>{entry.note}</Value>
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <h2 className={styles.sectionTitle}>Gallery</h2>
        <ProjectGallery shots={project.gallery} title={project.title} />

        <Link href={`/projects/${next.slug}`} className={styles.nextLink}>
          <div className={styles.next}>
            <div>
              <p className={styles.nextLabel}>Next project</p>
              <p className={styles.nextTitle}>{next.title}</p>
            </div>
            <span aria-hidden="true">&rarr;</span>
          </div>
        </Link>
      </Section>
    </>
  );
}
