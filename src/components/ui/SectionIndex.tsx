'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import styles from './SectionIndex.module.css';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Motion F5 — the quiet index.
 *
 * The only persistent chrome the float language allows: a hairline and a
 * two-digit number at one viewport edge. No pills, no progress bar, no
 * "scroll to advance" copy — the scrollbar already says that.
 *
 * aria-hidden, because it restates the section headings a screen reader has
 * already been given. IntersectionObserver rather than ScrollTrigger: this is
 * state, not motion, and it should cost nothing while the section is off screen.
 */
export function SectionIndex({ scopeRef }: { scopeRef: RefObject<HTMLElement | null> }) {
  const [active, setActive] = useState(0);
  const [total, setTotal] = useState(0);
  const [visible, setVisible] = useState(false);
  const ratios = useRef(new Map<Element, number>());

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const sections = Array.from(
      scope.querySelectorAll<HTMLElement>('[data-float-section]'),
    );
    if (sections.length === 0) return;

    setTotal(sections.length);

    // Whichever section owns the most of the viewport wins the number.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => ratios.current.set(e.target, e.intersectionRatio));

        let best = -1;
        let bestRatio = 0;
        sections.forEach((section, i) => {
          const ratio = ratios.current.get(section) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = i;
          }
        });

        setVisible(bestRatio > 0.1);
        if (best >= 0) setActive(best);
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );

    sections.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, [scopeRef]);

  if (total === 0) return null;

  return (
    <div
      className={`${styles.index} ${visible ? styles.visible : ''}`}
      aria-hidden="true"
    >
      <span className={styles.current}>{pad(active + 1)}</span>
      <span className={styles.rule} />
      <span className={styles.total}>{pad(total)}</span>
    </div>
  );
}
