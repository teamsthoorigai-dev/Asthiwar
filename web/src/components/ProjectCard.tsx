import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Project } from '@/data/site';

export function ProjectCard({
  project,
  index,
  featured = false,
}: {
  project: Project;
  index: number;
  featured?: boolean;
}) {
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
