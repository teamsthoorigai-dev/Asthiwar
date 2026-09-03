import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ProjectGalleryFigure } from '@/components/ProjectGalleryFigure';
import type { Project } from '@/data/site';

export function ProjectCard({
  project,
  index,
  featured = false,
  hoverGallery = false,
}: {
  project: Project;
  index: number;
  featured?: boolean;
  /** Archive grid: hold to advance the frames, click to freeze one. The card no
      longer navigates, so the title carries the link to the project page. */
  hoverGallery?: boolean;
}) {
  if (hoverGallery) {
    return (
      <article
        className={`project-card project-card--gallery${featured ? ' project-card--featured' : ''}`}
      >
        <ProjectGalleryFigure project={project} priority={index < 2} />
        <div className="project-card__body">
          <p className="project-card__index">{String(index + 1).padStart(2, '0')}</p>
          <div>
            <h2>
              <Link href={`/projects/${project.slug}`} className="project-card__title-link">
                {project.title}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </h2>
            <p>
              {project.location} · {project.type} · {project.area}
            </p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`project-card${featured ? ' project-card--featured' : ''}`}>
      <Link href={`/projects/${project.slug}`} className="project-card__link">
        <figure className="project-card__figure">
          <Image
            src={project.image}
            alt={project.imageAlt}
            width={1200}
            height={900}
            priority={index < 2}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <span className="project-card__open" aria-hidden="true">
            <ArrowUpRight size={19} />
          </span>
          <figcaption>
            {project.status} · {project.year}
          </figcaption>
        </figure>
        <div className="project-card__body">
          <p className="project-card__index">{String(index + 1).padStart(2, '0')}</p>
          <div>
            <h2>{project.title}</h2>
            <p>
              {project.location} · {project.type} · {project.area}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
