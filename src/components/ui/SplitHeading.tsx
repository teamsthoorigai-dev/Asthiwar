'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, MOTION, REDUCED, revealTrigger } from '@/lib/gsap';
import styles from './SplitHeading.module.css';

type Props = {
  children: string;
  as?: 'h1' | 'h2' | 'h3';
  /** Seconds to wait after the trigger fires. */
  delay?: number;
  className?: string;
  id?: string;
};

/**
 * Motion M1 — per-letter reveal on scroll into view.
 *
 * The visible text is split into aria-hidden spans and the real string stays on
 * aria-label, so screen readers announce the heading normally.
 * Under reduced motion nothing is split and the text renders plainly.
 *
 * The hidden state is set explicitly with gsap.set rather than relying on
 * gsap.from's immediateRender, which races with the async font wait below.
 */
export function SplitHeading({ children, as: Tag = 'h2', delay = 0, className, id }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED()) return;

    let split: SplitText | null = null;
    let ctx: gsap.Context | null = null;
    let cancelled = false;

    // Split only once the webfont is in, or the split measures fallback metrics.
    document.fonts.ready.then(() => {
      if (cancelled || !ref.current) return;

      ctx = gsap.context(() => {
        split = new SplitText(el, {
          type: 'words,chars',
          // span, not GSAP's default div — a heading may only contain phrasing content
          tag: 'span',
          wordsClass: styles.word,
          charsClass: styles.char,
        });

        const chars = split.chars;
        gsap.set(chars, { yPercent: 100, opacity: 0 });

        gsap.to(chars, {
          yPercent: 0,
          opacity: 1,
          duration: MOTION.splitDuration,
          ease: 'power3.out',
          stagger: MOTION.splitStagger,
          delay,
          scrollTrigger: revealTrigger(el, MOTION.startPct),
        });
      }, el);

      // Triggers were created after load, so positions must be recomputed —
      // this also fires any trigger whose start point has already passed.
      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      split?.revert();
      ctx?.revert();
    };
  }, [children, delay]);

  return (
    <Tag
      ref={ref}
      id={id}
      aria-label={children}
      className={[styles.heading, className].filter(Boolean).join(' ')}
    >
      {children}
    </Tag>
  );
}
