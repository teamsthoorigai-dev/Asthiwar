'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { gsap, MOTION, REDUCED, revealTrigger } from '@/lib/gsap';
import { PrinciplesMarquee } from './PrinciplesMarquee';
import styles from './SustainabilityHero.module.css';

/**
 * Photographic sustainability section.
 * Combines the earthen masonry statement with the moving principles marquee
 * welded to its foot, fitting the entire composition into a single page scroll.
 */
export function SustainabilityHero() {
  const copyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = copyRef.current;
    if (!el || REDUCED()) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        y: MOTION.riseY,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: revealTrigger(el),
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section className={styles.container} aria-labelledby="sustainability-hero-title">
      <div className={styles.hero}>
        <Image
          src="/images/sustainable.jpg"
          alt="Earthen masonry and a perforated screen shown in direct sunlight"
          fill
          sizes="100vw"
          className={styles.image}
        />
        <div className={styles.scrim} aria-hidden="true" />

        <div className={styles.inner}>
          <div className={styles.copy} ref={copyRef}>
            <p className={styles.eyebrow}>Sustainable Construction</p>
            <h2 id="sustainability-hero-title" className={styles.title}>
              Where cement ends, nature begins; Walls breathe and energy flows like air, unspent.
            </h2>
            <p className={styles.intro}>
              Natural cooling, lower-carbon material choices, and healthier spaces are considered
              before mechanical energy is added.
            </p>
            <div className={styles.actions}>
              <Button href="/sustainable-construction" variant="white" className={styles.cta}>
                Walk with Nature
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.marqueeBand}>
        <PrinciplesMarquee />
      </div>
    </section>
  );
}
