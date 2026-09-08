'use client';

import { useEffect, useRef } from 'react';
import { Button } from './Button';
import { SplitHeading } from './SplitHeading';
import { gsap, MOTION, REDUCED } from '@/lib/gsap';
import styles from './CtaBand.module.css';

export type CtaBandProps = {
  title: string;
  body?: string;
  buttonLabel?: string;
  buttonHref?: string;
  secondaryButton?: {
    label: string;
    href: string;
  };
  className?: string;
};

export function CtaBand({
  title,
  body,
  buttonLabel = 'Start a project',
  buttonHref = '/contact',
  secondaryButton,
  className,
}: CtaBandProps) {
  const bandRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const band = bandRef.current;
    const content = contentRef.current;
    if (REDUCED() || !band || !content) return;

    const ctx = gsap.context(() => {
      const items = content.querySelectorAll('[data-cta-item]');
      if (!items.length) return;

      gsap.fromTo(
        items,
        { y: MOTION.riseY, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: MOTION.riseStagger,
          scrollTrigger: {
            trigger: band,
            start: MOTION.start,
            once: true,
          },
        },
      );
    }, band);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={bandRef}
      className={[styles.ctaBand, className].filter(Boolean).join(' ')}
      aria-labelledby="cta-band-title"
    >
      <div ref={contentRef} className={styles.inner}>
        <SplitHeading as="h2" id="cta-band-title" className={styles.title}>
          {title}
        </SplitHeading>

        {body ? (
          <p data-cta-item className={styles.body}>
            {body}
          </p>
        ) : null}

        <div data-cta-item className={styles.actions}>
          <Button href={buttonHref} variant="primary">
            {buttonLabel}
          </Button>
          {secondaryButton ? (
            <Button href={secondaryButton.href} variant="ghost">
              {secondaryButton.label}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
