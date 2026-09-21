import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { PageHero } from '@/components/ui/PageHero';
import { Section } from '@/components/ui/Section';
import { ProjectGallery } from '@/components/projects/ProjectGallery';
import { galleryStages, getProject, isUnconfirmed, projects } from '@/data/site';
import { JsonLd } from '@/components/JsonLd';
import { getProjectBreadcrumbJsonLd } from '@/lib/jsonld';
import styles from './page.module.css';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  const base = projects.map((p) => ({ slug: p.slug }));
  return [...base, { slug: 'ather' }, { slug: 'trevea' }];
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

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.block}>
      <h2 className={styles.blockLabel}>{label}</h2>
      <div className={styles.blockBody}>{children}</div>
    </div>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  if (slug === 'ather') redirect('/projects/aether');
  if (slug === 'trevea') redirect('/projects/trivara');

  const project = getProject(slug);
  if (!project) notFound();

  const index = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(index + 1) % projects.length];

  const facts: ReadonlyArray<readonly [string, string]> = [
    ['Location', project.location],
    ['Typology', project.type],
    ['Built-up Area', project.area],
    ['Year', project.year],
    ['Status', project.status],
  ];

  return (
    <div className={styles.page}>
      <JsonLd data={getProjectBreadcrumbJsonLd(project)} />
      <PageHero
        eyebrow="Project"
        title={project.title}
        body={project.summary}
        image={project.image}
        imageCaption={[project.location, project.year]}
        video={project.video}
        imageFit="contain"
        className={styles.projectHero}
      />

      <Section className={styles.firstSection}>
        <div className={styles.blueprintDatumStrip}>
          <div className={styles.datumItem}>
            <span className={styles.datumLabel}>Structure</span>
            <span className={styles.datumVal}>
              {project.datum?.structure ?? 'Engineered RC & Load-Bearing Earth'}
            </span>
          </div>
          <div className={styles.datumItem}>
            <span className={styles.datumLabel}>Envelope</span>
            <span className={styles.datumVal}>
              {project.datum?.envelope ?? 'Passive Jaali & Slaked Lime Plaster'}
            </span>
          </div>
          <div className={styles.datumItem}>
            <span className={styles.datumLabel}>Thermal Delta</span>
            <span className={styles.datumVal}>
              {project.datum?.thermalDelta ?? '-5.8°C Natural Cooling Differential'}
            </span>
          </div>
          <div className={styles.datumItem}>
            <span className={styles.datumLabel}>Site Datum</span>
            <span className={styles.datumVal}>
              {project.datum?.coordinates ?? '11°00\'N 76°57\'E • Coimbatore'}
            </span>
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
        {galleryStages(project).map(({ stage, label, shots }, i) => (
          <section key={stage} id={stage} className={styles.stage} aria-labelledby={`${stage}-title`}>
            <header className={styles.stageHeader}>
              <span className={styles.stageNumber} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 id={`${stage}-title`} className={styles.stageTitle}>
                {label}
              </h3>
              <span className={styles.stageCount}>
                {shots.length} {shots.length === 1 ? 'image' : 'images'}
              </span>
            </header>
            <ProjectGallery shots={shots} title={`${project.title.trim()} — ${label}`} />
          </section>
        ))}

        <div className={styles.nextRow}>
          <Link href={`/projects/${next.slug}`} className={styles.nextTextLink}>
            <p className={styles.nextLabel}>Next project</p>
            <p className={styles.nextTitle}>{next.title}</p>
          </Link>
          <Button href={`/projects/${next.slug}`} variant="primary" className={styles.nextCtaBtn}>
            Next Project
          </Button>
        </div>
      </Section>
    </div>
  );
}
