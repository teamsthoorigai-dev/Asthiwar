'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { disciplines } from '@/data/home';
import { services } from '@/data/site';
import { gsap, ScrollTrigger, REDUCED } from '@/lib/gsap';
import styles from './DisciplinesSticky.module.css';

/**
 * Homepage section 08 — motion M3, and the closest 1:1 mapping on the page:
 * Novascape's five amenities become ASTHIWAR's five disciplines.
 *
 * Desktop: the list sticks while a tall track scrolls past, and scroll progress
 * drives the active index; the image stack cross-fades to match. Hover and
 * keyboard focus also set the active index.
 *
 * Below lg, and under reduced motion, it degrades to a plain list with each
 * image inline — no stickiness, no scroll driving.
 */
export function DisciplinesSticky() {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || REDUCED()) return;

    // Only drive from scroll where the sticky layout is actually in play.
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      const trigger = ScrollTrigger.create({
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const next = Math.min(
            services.length - 1,
            Math.floor(self.progress * services.length),
          );
          setActive(next);
        },
      });

      return () => trigger.kill();
    });

    return () => mm.revert();
  }, []);

  return (
    <Section width="large" aria-labelledby="disciplines-title">
      <SectionHeader
        id="disciplines-title"
        eyebrow={disciplines.eyebrow}
        title={disciplines.title}
        body={disciplines.body}
        action={
          <Button href={disciplines.cta.href} variant="ghost">
            {disciplines.cta.label}
          </Button>
        }
      />

      <div className={styles.track} ref={trackRef}>
        <div className={styles.sticky}>
          <div className={styles.grid}>
            <ol className={styles.list}>
              {services.map((service, i) => (
                <li
                  className={[styles.row, i === active && styles.active]
                    .filter(Boolean)
                    .join(' ')}
                  key={service.slug}
                  onMouseEnter={() => setActive(i)}
                >
                  <div className={styles.inlineMedia}>
                    <Image
                      src={service.image.src}
                      alt={service.image.alt}
                      fill
                      sizes="100vw"
                      className={styles.image}
                    />
                  </div>

                  <Link
                    href={`/services#${service.slug}`}
                    className={styles.link}
                    onFocus={() => setActive(i)}
                  >
                    <span className={styles.index}>{service.index}</span>
                    <h3 className={styles.title}>{service.title}</h3>
                    <p className={styles.short}>{service.short}</p>
                  </Link>
                </li>
              ))}
            </ol>

            <div className={styles.media}>
              {services.map((service, i) => (
                <div
                  key={service.slug}
                  className={[styles.layer, i === active && styles.layerActive]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden="true"
                >
                  <Image
                    src={service.image.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className={styles.image}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
