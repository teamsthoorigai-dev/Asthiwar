'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Project } from '@/data/site';

export function ProjectGalleryFigure({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  const images = project.gallery?.length ? project.gallery : [project.image];
  const [index, setIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((current) => (current - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((current) => (current + 1) % images.length);
  };

  return (
    <figure className="project-card__figure">
      {project.hasPage ? (
        <Link
          href={`/projects/${project.slug}`}
          className="project-card__figure-link"
          aria-label={`View ${project.title}`}
        >
          {images.map((src, position) => (
            <Image
              key={`${src}-${position}`}
              src={src}
              alt={position === 0 ? project.imageAlt : ''}
              width={1200}
              height={900}
              priority={priority && position === 0}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="project-card__frame"
              data-visible={position === index || undefined}
              aria-hidden={position === index ? undefined : true}
            />
          ))}
        </Link>
      ) : (
        <div className="project-card__figure-link project-card__figure-link--static">
          {images.map((src, position) => (
            <Image
              key={`${src}-${position}`}
              src={src}
              alt={position === 0 ? project.imageAlt : ''}
              width={1200}
              height={900}
              priority={priority && position === 0}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="project-card__frame"
              data-visible={position === index || undefined}
              aria-hidden={position === index ? undefined : true}
            />
          ))}
        </div>
      )}

      {images.length > 1 ? (
        <>
          <button
            type="button"
            className="project-gallery__arrow project-gallery__arrow--prev"
            onClick={handlePrev}
            aria-label={`Previous image of ${project.title}`}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="project-gallery__arrow project-gallery__arrow--next"
            onClick={handleNext}
            aria-label={`Next image of ${project.title}`}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>

          <div className="project-card__dots" aria-label="Image indicators">
            {images.map((src, position) => (
              <button
                key={`${src}-${position}`}
                type="button"
                className="project-card__dot"
                data-active={position === index || undefined}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndex(position);
                }}
                aria-label={`Go to image ${position + 1} of ${images.length}`}
              />
            ))}
          </div>
        </>
      ) : null}

      <span className="project-card__open" aria-hidden="true">
        <ArrowUpRight size={19} />
      </span>

      <figcaption>
        {project.status} · {project.year}
      </figcaption>
    </figure>
  );
}

