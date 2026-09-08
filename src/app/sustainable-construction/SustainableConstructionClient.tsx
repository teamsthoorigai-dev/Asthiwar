'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { sustainablePage } from '@/data/sustainability';
import { gsap, MOTION, REDUCED, revealTrigger } from '@/lib/gsap';
import { SunWindSimulator } from '@/components/sustainable/SunWindSimulator';
import { CarbonComparisonGauge } from '@/components/sustainable/CarbonComparisonGauge';
import styles from './sustainable-construction.module.css';

/** Three editorial pillars, animated only with the approved M5 rise reveal. */
export function SustainableConstructionClient() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root || REDUCED()) {
      return;
    }

    const context = gsap.context(() => {
      const pillars = root.querySelectorAll<HTMLElement>('[data-sustainability-pillar]');

      pillars.forEach((pillar) => {
        const blocks = pillar.querySelectorAll('[data-sustainability-reveal]');

        if (blocks.length === 0) {
          return;
        }

        gsap.fromTo(
          blocks,
          { y: MOTION.riseY, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
            stagger: MOTION.riseStagger,
            scrollTrigger: revealTrigger(pillar),
          },
        );
      });
    }, root);

    return () => context.revert();
  }, []);

  return (
    <div ref={rootRef} className={styles.pillars}>
      {sustainablePage.pillars.map((pillar, index) => (
        <section
          key={pillar.slug}
          className={styles.pillar}
          id={pillar.slug}
          aria-labelledby={`${pillar.slug}-title`}
          data-sustainability-pillar
        >
          <div className={styles.inner}>
            <div className={styles.pillarGrid}>
              <figure className={styles.media} data-sustainability-reveal>
                <Image
                  alt={pillar.image.alt}
                  className={styles.image}
                  fill
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  src={pillar.image.src}
                />
              </figure>

              <div className={styles.content} data-sustainability-reveal>
                <p className={styles.index}>{String(index + 1).padStart(2, '0')}</p>
                <h2 className={styles.title} id={`${pillar.slug}-title`}>
                  {pillar.title}
                </h2>
                {pillar.statement ? <p className={styles.statement}>{pillar.statement}</p> : null}
                <p className={styles.body}>{pillar.body}</p>
              </div>
            </div>

            {pillar.slug === 'natural-cooling' && (
              <div data-sustainability-reveal style={{ marginTop: '2.5rem' }}>
                <SunWindSimulator />
              </div>
            )}

            {pillar.slug === 'low-cement-construction' && (
              <div data-sustainability-reveal style={{ marginTop: '2.5rem' }}>
                <CarbonComparisonGauge />
              </div>
            )}
          </div>
        </section>
      ))}

      <section className={styles.noteSection} aria-label="Sustainability scope">
        <div className={styles.inner}>
          <p className={styles.note}>{sustainablePage.note}</p>
        </div>
      </section>
    </div>
  );
}
