'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cardShots, isUnconfirmed, type Project } from '@/data/site';
import { PROJECT_SHOT_SIZES } from '@/lib/imageSizes';
import styles from './ProjectCard.module.css';

const CYCLE_MS = 700;

/**
 * Archive card with Novascape's hover gallery: the project's frames cycle while
 * the pointer is over the card. Devices without hover show the first frame only,
 * so a touch user never gets an animation they cannot stop.
 */
export function ProjectCard({
  project,
  index,
  total,
}: {
  project: Project;
  index?: number;
  total?: number;
}) {
  const [frame, setFrame] = useState(0);
  const [hovering, setHovering] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const frames = cardShots(project);

  useEffect(() => {
    if (!hovering || frames.length < 2) return;

    const canHover =
      typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canHover || reduced) return;

    timer.current = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, CYCLE_MS);

    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [hovering, frames.length]);

  const startHover = () => {
    setHovering(true);
    if (project.video && typeof document !== 'undefined') {
      const linkId = `preload-video-${project.slug}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'preload';
        link.as = 'video';
        link.href = project.video;
        document.head.appendChild(link);
      }
    }
  };

  const stop = () => {
    setHovering(false);
    setFrame(0);
  };

  const meta: Array<[string, string]> = [
    ['Location', project.location],
    ['Type', project.type],
    ['Area', project.area],
    ['Year', project.year],
    ['Status', project.status],
  ];

  return (
    <article className={styles.card} data-project-card>
      <div className={styles.cardHeader}>
        {typeof index === 'number' && (
          <span className={styles.cardIndex}>
            PROJECT {String(index + 1).padStart(2, '0')}
            {typeof total === 'number' ? ` / ${String(total).padStart(2, '0')}` : ''}
          </span>
        )}
        <span className={styles.cardCategory}>{project.category}</span>
      </div>

      <Link
        href={`/projects/${project.slug}`}
        className={styles.link}
        onMouseEnter={startHover}
        onMouseLeave={stop}
        onFocus={startHover}
        onBlur={stop}
      >
        <div className={styles.media}>
          {frames.map((shot, i) => (
            <div
              key={`${shot.src}-${i}`}
              className={[styles.frame, i === frame && styles.frameActive]
                .filter(Boolean)
                .join(' ')}
              aria-hidden={i !== frame}
            >
              <Image
                src={shot.src}
                alt={i === 0 ? shot.alt || `${project.title}` : ''}
                fill
                sizes={PROJECT_SHOT_SIZES}
                className={styles.image}
              />
            </div>
          ))}
        </div>

        <h2 className={styles.title}>{project.title}</h2>
      </Link>

      <ul className={styles.meta}>
        {meta.map(([label, value]) => (
          <li className={styles.metaItem} key={label}>
            <span className={styles.metaLabel}>{label}</span>
            <span
              className={[styles.metaValue, isUnconfirmed(value) && styles.pending]
                .filter(Boolean)
                .join(' ')}
            >
              {value}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
