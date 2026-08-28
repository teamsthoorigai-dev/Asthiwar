import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { PageHero } from '@/components/PageHero';
import { ProjectCard } from '@/components/ProjectCard';
import { SectionHeading, SiteLayout } from '@/components/SiteShell';
import { projects } from '@/data/site';
import { getProjectJsonLd } from '@/lib/jsonld';

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) {
    return {
      title: 'Project Not Found',
    };
  }
  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: `${project.title} — ASTHIWAR`,
      description: project.summary,
      url: `/projects/${project.slug}`,
      type: 'article',
      images: [
        {
          url: project.image,
          width: 1200,
          height: 900,
          alt: project.imageAlt || project.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title} — ASTHIWAR`,
      description: project.summary,
      images: [project.image],
    },
    alternates: {
      canonical: `/projects/${project.slug}`,
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    return (
      <SiteLayout>
        <PageHero
          eyebrow="Project record not found"
          title="This project is not in the current archive."
          intro="Return to the projects page to explore the available ASTHIWAR project records."
        >
          <Link href="/projects" className="button button--light page-hero__action">
            <ArrowLeft size={16} aria-hidden="true" /> Back to projects
          </Link>
        </PageHero>
      </SiteLayout>
    );
  }

  const related = projects.filter((item) => item.slug !== project.slug).slice(0, 2);
  const gallery = [project, ...projects.filter((item) => item.slug !== project.slug).slice(0, 2)];

  return (
    <SiteLayout>
      <JsonLd data={getProjectJsonLd(project)} />
      <PageHero
        eyebrow={`${project.type} / ${project.status}`}
        title={project.title}
        intro={project.summary}
        image={project.image}
        imageAlt={project.imageAlt}
        imageCaption={['ASTHIWAR / PROJECT RECORD', 'LOCATION TO BE CONFIRMED']}
        meta={
          <>
            <span>{project.location}</span>
            <span>{project.area}</span>
            <span>{project.year}</span>
          </>
        }
      />

      <section className="project-story section section--paper">
        <div className="shell project-story__grid">
          <p className="eyebrow">Project record / approved information pending</p>
          <div className="project-story__lead">
            <h2>{project.overview}</h2>
          </div>
          <div className="project-story__chapters">
            <article>
              <span>01 / Challenge</span>
              <p>{project.challenge}</p>
            </article>
            <article>
              <span>02 / Approach</span>
              <p>{project.approach}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="project-drawing section section--carbon">
        <div className="shell project-drawing__grid">
          <div>
            <p className="eyebrow eyebrow--light">Design and engineering approach</p>
            <h2>Project approach to be confirmed.</h2>
            <p>
              Verified architectural, structural and environmental information will be added when
              available.
            </p>
          </div>
          <svg viewBox="0 0 760 460" role="img" aria-label="Conceptual project section placeholder">
            <path d="M60 370H700M110 370V150H330V245H650V370M110 150L330 80L650 170" />
            <path className="accent" d="M330 80V370M420 245V370M520 245V370" />
            <path
              className="air"
              d="M150 310C230 250 270 260 335 200M430 320C500 250 565 245 625 205"
            />
            <circle cx="610" cy="86" r="34" />
            <text x="78" y="405">
              SITE
            </text>
            <text x="326" y="405">
              PROJECT
            </text>
            <text x="570" y="405">
              CONTEXT
            </text>
          </svg>
        </div>
      </section>

      <section className="project-materials section section--mineral">
        <div className="shell">
          <SectionHeading
            eyebrow="Materials / to be confirmed"
            title="Material information will be added after approval."
            body="Verified material specifications and construction information will be published when available."
          />
          <ol>
            {project.materials.map((material, index) => (
              <li key={material}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{material}</h3>
                <p>Specification pending approval</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="project-timeline section section--paper">
        <div className="shell">
          <SectionHeading
            eyebrow="Timeline / to be confirmed"
            title="Project stages and timeline will be added after approval."
            body="No programme or completion dates are published until the project information is verified."
          />
          <ol>
            {project.timeline.map((item, index) => (
              <li key={item.phase}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{item.phase}</h3>
                <strong>{item.duration}</strong>
                <p>{item.note}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="project-gallery section section--carbon">
        <div className="shell">
          <p className="eyebrow eyebrow--light">Project imagery / visual placeholders</p>
          <div className="project-gallery__grid">
            {gallery.map((item, index) => (
              <figure key={`${item.slug}-${index}`}>
                <Image
                  src={item.image}
                  alt={
                    index === 0
                      ? item.imageAlt
                      : 'Architectural reference from the ASTHIWAR project archive'
                  }
                  width={1200}
                  height={900}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <figcaption>
                  {String(index + 1).padStart(2, '0')} /{' '}
                  {index === 0 ? 'Project image' : 'Archive image'}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="related-projects section section--paper">
        <div className="shell">
          <SectionHeading
            eyebrow="Continue through the archive"
            title="Explore more project records."
          />
          <div className="related-projects__grid">
            {related.map((item, index) => (
              <ProjectCard key={item.slug} project={item} index={index} />
            ))}
          </div>
          <Link href="/projects" className="text-link related-projects__all">
            All projects <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
