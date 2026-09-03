'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Pause } from 'lucide-react';
import type { Project } from '@/data/site';

/* Hold on a card and the images advance on their own; click to freeze one. */
const ADVANCE_MS = 1500;

export function ProjectGalleryFigure({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  const images = project.gallery?.length ? project.gallery : [project.image];
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!active || paused || images.length < 2) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [active, paused, images.length]);

  const stop = () => {
    setActive(false);
    setPaused(false);
    setIndex(0);
  };

  /* Touch has no hover, so the first tap starts the run and the next one freezes it. */
  const toggle = () => {
    if (!active) {
      setActive(true);
      setPaused(false);
      return;
    }
    setPaused((current) => !current);
  };

  return (
    <figure
      className="project-card__figure"
      data-paused={paused || undefined}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={stop}
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

      <button
        type="button"
        className="project-card__viewer"
        onClick={toggle}
        onFocus={() => setActive(true)}
        onBlur={stop}
        aria-label={
          paused
            ? `${project.title} — image ${index + 1} of ${images.length}, paused. Activate to resume.`
            : `${project.title} — image ${index + 1} of ${images.length}. Activate to pause on this image.`
        }
      />

      <span className="project-card__paused" aria-hidden="true">
        <Pause size={12} />
        Paused
      </span>

      {images.length > 1 ? (
        <span className="project-card__dots" aria-hidden="true">
          {images.map((src, position) => (
            <span key={`${src}-${position}`} data-active={position === index || undefined} />
          ))}
        </span>
      ) : null}

      <figcaption>
        {project.status} · {project.year}
      </figcaption>
    </figure>
  );
}
