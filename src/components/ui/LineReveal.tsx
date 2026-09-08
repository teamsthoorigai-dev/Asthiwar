'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, FLOAT, REDUCED, revealTrigger } from '@/lib/gsap';
import styles from './LineReveal.module.css';

type Props = {
  children: string;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  /** Seconds to wait after the trigger fires. */
  delay?: number;
  className?: string;
  id?: string;
};

/**
 * Motion F2 — per-line mask reveal.
 *
 * Deliberately not SplitHeading. That splits to chars (M1), which at display
 * size reads as a gimmick; the float language reveals whole lines instead, so
 * the heading arrives as language rather than as an effect.
 *
 * Mechanics follow SplitHeading: the split runs only after the webfont has
 * loaded (otherwise lines are measured against fallback metrics and re-wrap),
 * the real string stays on aria-label so screen readers announce the heading
 * once, and the hidden state is set explicitly rather than relying on
 * gsap.from's immediateRender, which races the async font wait.
 */
export function LineReveal({ children, as: Tag = 'h2', delay = 0, className, id }: Props) {
  const ref = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED()) return;

    let split: SplitText | null = null;
    let ctx: gsap.Context | null = null;
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled || !ref.current) return;

      ctx = gsap.context(() => {
        split = new SplitText(el, {
          type: 'lines',
          // GSAP wraps each line in its own overflow-hidden element, so the
          // line can translate out of view without a wrapper per call site.
          mask: 'lines',
          // span, not GSAP's default div — a heading may only contain phrasing content
          tag: 'span',
          linesClass: styles.line,
        });

        const lines = split.lines;
        gsap.set(lines, { yPercent: 100 });

        gsap.to(lines, {
          yPercent: 0,
          duration: FLOAT.lineDuration,
          ease: FLOAT.ease,
          stagger: FLOAT.lineStagger,
          delay,
          scrollTrigger: revealTrigger(el),
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
      className={[styles.reveal, className].filter(Boolean).join(' ')}
    >
      {children}
    </Tag>
  );
}
