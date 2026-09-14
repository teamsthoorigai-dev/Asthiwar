'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { gsap, MOTION, REDUCED, revealTrigger } from '@/lib/gsap';
import styles from './WorkGallery.module.css';

export type WorkGalleryImage = {
  src: string;
  alt: string;
  /** 'contain' shows the photo at its full, uncropped proportions. Defaults to 'cover'. */
  fit?: 'cover' | 'contain';
};

export type WorkGalleryItem = {
  id: string;
  href: `/projects/${string}`;
  title: string;
  location: string;
  year: string;
  image: WorkGalleryImage;
};

export type WorkGalleryContent = {
  eyebrow: string;
  title: string;
  labels: {
    location: string;
    year: string;
  };
  cta: {
    label: string;
    href: string;
  };
  tiles: readonly WorkGalleryItem[];
};

export type WorkGalleryProps = {
  content: WorkGalleryContent;
};

const imageSizes = [
  '(max-width: 767px) 100vw, (max-width: 1439px) 58vw, 840px',
  '(max-width: 767px) 100vw, (max-width: 1439px) 42vw, 600px',
  '(max-width: 767px) 100vw, (max-width: 1439px) 42vw, 600px',
  '(max-width: 767px) 100vw, (max-width: 1439px) 58vw, 840px',
  '(max-width: 767px) 100vw, (max-width: 1439px) 67vw, 960px',
  '(max-width: 767px) 100vw, (max-width: 1439px) 33vw, 480px',
] as const;

const fallbackImageSize = '(max-width: 767px) 100vw, 50vw';

/**
 * Homepage section 15. Six image-led work placeholders, deliberately kept
 * separate from project facts until verified project records are available.
 */
export function WorkGallery({ content }: WorkGalleryProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || REDUCED()) return;

    const tiles = Array.from(grid.querySelectorAll<HTMLElement>('[data-work-tile]'));
    if (tiles.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from(tiles, {
        y: MOTION.riseY,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: MOTION.riseStagger,
        scrollTrigger: revealTrigger(grid),
      });
    }, grid);

    return () => ctx.revert();
  }, []);

  return (
    <Section width="large" aria-labelledby="work-gallery-title">
      <SectionHeader
        id="work-gallery-title"
        eyebrow={content.eyebrow}
        title={content.title}
      />

      <div className={styles.grid} ref={gridRef}>
        {content.tiles.map((tile, index) => (
          <article className={styles.tile} data-work-tile key={tile.id}>
            <Link href={tile.href} className={styles.link}>
              {tile.image.fit === 'contain' ? (
                <span className={styles.mediaNatural}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- natural aspect ratio, unknown at build time */}
                  <img
                    src={tile.image.src}
                    alt={tile.image.alt}
                    className={styles.imageNatural}
                  />
                </span>
              ) : (
                <span className={styles.media}>
                  <Image
                    src={tile.image.src}
                    alt={tile.image.alt}
                    fill
                    sizes={imageSizes[index] ?? fallbackImageSize}
                    className={styles.image}
                  />
                </span>
              )}

              <span className={styles.caption}>
                <span className={styles.projectTitle}>{tile.title}</span>
                <span className={styles.meta}>
                  <span>
                    {content.labels.location}: {tile.location}
                  </span>
                  <span>
                    {content.labels.year}: {tile.year}
                  </span>
                </span>
              </span>
            </Link>
          </article>
        ))}
      </div>

      <div className={styles.cta}>
        <Button href={content.cta.href} variant="ghost">
          {content.cta.label}
        </Button>
      </div>
    </Section>
  );
}
