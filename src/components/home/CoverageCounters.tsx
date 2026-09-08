'use client';

import { useEffect, useRef } from 'react';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Odometer } from '@/components/ui/Odometer';
import { coverage } from '@/data/home';
import { LOCATIONS } from '@/data/pricing';
import { gsap, MOTION, REDUCED, revealTrigger } from '@/lib/gsap';
import styles from './CoverageCounters.module.css';

/**
 * Homepage section 09 · Where we build.
 * Three odometer counters and seven location pills read from pricing data.
 */
export function CoverageCounters() {
  const pillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pillsRef.current;
    if (!el || REDUCED()) return;

    const ctx = gsap.context(() => {
      gsap.from(`.${styles.pill}`, {
        y: MOTION.riseY,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: MOTION.riseStagger,
        scrollTrigger: revealTrigger(el),
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <Section aria-labelledby="coverage-title">
      <SectionHeader
        id="coverage-title"
        eyebrow={coverage.eyebrow}
        title={coverage.title}
        body={coverage.body}
      />

      <div className={styles.counters}>
        {coverage.counters.map((c) => (
          <Odometer key={c.label} value={c.value} label={c.label} />
        ))}
      </div>

      <div
        className={styles.pills}
        ref={pillsRef}
        aria-label="Locations served across Tamil Nadu"
      >
        {LOCATIONS.map((loc) => (
          <span key={loc.slug} className={styles.pill}>
            {loc.name}
          </span>
        ))}
      </div>
    </Section>
  );
}
