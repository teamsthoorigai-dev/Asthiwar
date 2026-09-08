'use client';

import { useEffect, useRef } from 'react';
import { Section } from '@/components/ui/Section';
import { SplitHeading } from '@/components/ui/SplitHeading';
import { Button } from '@/components/ui/Button';
import { sustainabilityInterlude } from '@/data/home';
import { gsap, MOTION, REDUCED, revealTrigger } from '@/lib/gsap';
import styles from './SustainabilityInterlude.module.css';

/**
 * Homepage section 11 · Sustainable construction.
 * Full-bleed accent interlude featuring three typographic principle statements separated by hairlines.
 */
export function SustainabilityInterlude() {
  const itemsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = itemsRef.current;
    if (!el || REDUCED()) return;

    const ctx = gsap.context(() => {
      gsap.from(`.${styles.item}`, {
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
    <Section background="accent" aria-labelledby="sustainability-title">
      <header className={styles.header}>
        <SplitHeading as="h2" id="sustainability-title" className={styles.title}>
          {sustainabilityInterlude.title}
        </SplitHeading>
        <p className={styles.body}>{sustainabilityInterlude.body}</p>
      </header>

      <div className={styles.items} ref={itemsRef}>
        {sustainabilityInterlude.items.map((item) => (
          <article className={styles.item} key={item.title}>
            <h3 className={styles.itemTitle}>{item.title}</h3>
            <p className={styles.itemDescription}>{item.description}</p>
          </article>
        ))}
      </div>

      <div className={styles.cta}>
        <Button href={sustainabilityInterlude.cta.href} variant="white">
          {sustainabilityInterlude.cta.label}
        </Button>
      </div>
    </Section>
  );
}
