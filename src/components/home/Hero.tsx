'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { SplitHeading } from '@/components/ui/SplitHeading';
import { homeHero } from '@/data/home';
import { gsap, MOTION, REDUCED } from '@/lib/gsap';
import styles from './Hero.module.css';

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const scaleLayerRef = useRef<HTMLDivElement>(null);
  const parallaxLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const body = bodyRef.current;
    const actions = actionsRef.current;
    const media = mediaRef.current;
    const scaleLayer = scaleLayerRef.current;
    const parallaxLayer = parallaxLayerRef.current;

    if (
      REDUCED() ||
      !section ||
      !body ||
      !actions ||
      !media ||
      !scaleLayer ||
      !parallaxLayer
    ) {
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        [body, actions],
        { y: MOTION.riseY, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: MOTION.riseStagger,
          delay: 0.4,
          clearProps: 'transform,opacity',
        },
      );

      gsap.fromTo(
        scaleLayer,
        { scale: 1.06 },
        {
          scale: 1,
          duration: 1.4,
          ease: 'power3.out',
          clearProps: 'transform',
        },
      );

      gsap.fromTo(
        parallaxLayer,
        { yPercent: 0 },
        {
          yPercent: -8,
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
    }, section);

    return () => context.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.hero} aria-labelledby="home-hero-title">
      <div className={styles.copy}>
        <SplitHeading as="h1" id="home-hero-title" className={styles.heading}>
          {homeHero.heading}
        </SplitHeading>

        <p ref={bodyRef} className={styles.body}>
          {homeHero.body}
        </p>

        <div ref={actionsRef} className={styles.actions}>
          <Button href={homeHero.primaryCta.href}>{homeHero.primaryCta.label}</Button>
          <Button href={homeHero.secondaryCta.href} variant="ghost">
            {homeHero.secondaryCta.label}
          </Button>
        </div>
      </div>

      <div ref={mediaRef} className={styles.media}>
        <div ref={scaleLayerRef} className={styles.scaleLayer}>
          <div ref={parallaxLayerRef} className={styles.parallaxLayer}>
            <Image
              src={homeHero.image.src}
              alt={homeHero.image.alt}
              fill
              sizes="100vw"
              preload
              className={styles.image}
            />
          </div>
        </div>

        <div className={styles.floatingDatum} aria-hidden="true">
          <svg
            className={styles.compassIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.2" />
          </svg>
          <div className={styles.datumText}>
            <span className={styles.datumCoords}>11°00&apos;N 76°57&apos;E • DATUM +411M</span>
            <span className={styles.datumMeta}>Climate Responsive • Coimbatore Atelier</span>
          </div>
        </div>
      </div>
    </section>
  );
}
