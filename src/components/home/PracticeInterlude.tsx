'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { Section } from '@/components/ui/Section';
import { SplitHeading } from '@/components/ui/SplitHeading';
import { Button } from '@/components/ui/Button';
import { practiceInterlude } from '@/data/home';
import { gsap, REDUCED } from '@/lib/gsap';
import styles from './PracticeInterlude.module.css';

/**
 * Homepage section 06. The first of two full-bleed accent interludes — these
 * are what give the page its rhythm, so the ground colour change is the point.
 */
export function PracticeInterlude() {
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || REDUCED()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        `.${styles.image}`,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: media,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    }, media);

    return () => ctx.revert();
  }, []);

  return (
    <Section background="accent" aria-labelledby="practice-title">
      <div className={styles.grid}>
        <div className={styles.media} ref={mediaRef}>
          <Image
            src={practiceInterlude.image.src}
            alt={practiceInterlude.image.alt}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className={styles.image}
          />
        </div>

        <div className={styles.copy}>
          <p className={styles.eyebrow}>{practiceInterlude.eyebrow}</p>

          <SplitHeading as="h2" id="practice-title" className={styles.title}>
            {practiceInterlude.title}
          </SplitHeading>

          {practiceInterlude.paragraphs.map((paragraph) => (
            <p className={styles.paragraph} key={paragraph.slice(0, 32)}>
              {paragraph}
            </p>
          ))}

          <div className={styles.cta}>
            <Button href={practiceInterlude.cta.href} variant="white">
              {practiceInterlude.cta.label}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
