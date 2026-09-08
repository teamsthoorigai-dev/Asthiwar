'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef } from 'react';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Accordion, type AccordionEntry } from '@/components/ui/Accordion';
import { scopeColumns } from '@/data/home';
import { gsap, MOTION, REDUCED, revealTrigger } from '@/lib/gsap';
import styles from './ScopeColumns.module.css';

/**
 * Homepage section 10 · What one process covers.
 * Four discipline capability columns on desktop/tablet, collapsing to an accordion on mobile.
 */
export function ScopeColumns() {
  const desktopGridRef = useRef<HTMLDivElement>(null);

  const accordionItems = useMemo<AccordionEntry[]>(
    () =>
      scopeColumns.columns.map((col) => ({
        q: col.title,
        a: (
          <ul className={styles.accordionList}>
            {col.capabilities.map((cap) => (
              <li key={cap} className={styles.capabilityItem}>
                {cap}
              </li>
            ))}
          </ul>
        ),
      })),
    [],
  );

  useEffect(() => {
    const el = desktopGridRef.current;
    if (!el || REDUCED()) return;

    const ctx = gsap.context(() => {
      gsap.from(`.${styles.column}`, {
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
    <Section background="surface" className={styles.section} aria-labelledby="scope-title">
      <div className={styles.bgWrapper} aria-hidden="true">
        <Image
          src={scopeColumns.backgroundImage.src}
          alt={scopeColumns.backgroundImage.alt}
          fill
          sizes="100vw"
          className={styles.bgImage}
        />
        <div className={styles.scrim} />
      </div>

      <SectionHeader
        id="scope-title"
        eyebrow={scopeColumns.eyebrow}
        title={scopeColumns.title}
      />

      <div className={styles.mobileAccordion}>
        <Accordion items={accordionItems} initialOpen={0} />
      </div>

      <div className={styles.desktopGrid} ref={desktopGridRef}>
        {scopeColumns.columns.map((col) => (
          <div key={col.title} className={styles.column}>
            <h3 className={styles.columnTitle}>{col.title}</h3>
            <ul className={styles.capabilityList}>
              {col.capabilities.map((cap) => (
                <li key={cap} className={styles.capabilityItem}>
                  {cap}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={styles.cta}>
        <Button href={scopeColumns.cta.href} variant="primary">
          {scopeColumns.cta.label}
        </Button>
      </div>
    </Section>
  );
}
