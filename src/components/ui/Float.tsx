'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { gsap, ScrollTrigger, FLOAT, REDUCED, revealTrigger } from '@/lib/gsap';
import styles from './Float.module.css';

type Props = {
  children: ReactNode;
  as?: ElementType;
  /** Seconds to wait after the trigger fires. */
  delay?: number;
  /** Override the sibling stagger. 0 moves every child together. */
  stagger?: number;
  className?: string;
};

/**
 * Motion F1 — float rise.
 *
 * Entry only, never scrubbed: the block settles once and is then left alone.
 * Scrubbing this is what makes a page feel dragged rather than alive, so the
 * timeline is deliberately not attached to scroll position.
 *
 * Animates its own direct children so a section can stagger without every
 * call site wrapping each line in its own component.
 */
export function Float({
  children,
  as: Tag = 'div',
  delay = 0,
  stagger = FLOAT.riseStagger,
  className,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED()) return;

    const targets = Array.from(el.children);
    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(targets, { y: FLOAT.riseY, opacity: 0 });

      gsap.to(targets, {
        y: 0,
        opacity: 1,
        duration: FLOAT.riseDuration,
        ease: FLOAT.ease,
        stagger,
        delay,
        // Transforms left on the element would fight F3's scrubbed drift
        clearProps: 'transform,opacity,willChange',
        scrollTrigger: revealTrigger(el),
      });
    }, el);

    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [delay, stagger]);

  return (
    <Tag ref={ref} className={[styles.float, className].filter(Boolean).join(' ')}>
      {children}
    </Tag>
  );
}
