'use client';

import { useEffect, useRef, useState } from 'react';
import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { processReveal } from '@/data/home';
import styles from './ProcessReveal.module.css';

/**
 * Homepage section 07. Novascape's blur-to-reveal, applied to the difference
 * between a split-contract route and one coordinated process.
 *
 * The ASTHIWAR column starts blurred and reveals on click or on scroll into
 * view. Under reduced motion it renders revealed from the start and the
 * click prompt is hidden — the content is never gated behind an interaction.
 */
export function ProcessReveal() {
  const [revealed, setRevealed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reduced motion is handled in CSS: the blur is removed and the prompt hidden,
  // so no state change is needed here.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Section aria-labelledby="reveal-title">
      <SectionHeader
        id="reveal-title"
        eyebrow={processReveal.eyebrow}
        title={processReveal.title}
      />

      <div className={styles.panels}>
        <div className={`${styles.panel} ${styles.conventional}`}>
          <p className={styles.panelHead}>{processReveal.columns.conventional}</p>
          <ul className={styles.list}>
            {processReveal.rows.map((row) => (
              <li className={styles.row} key={row.conventional}>
                {row.conventional}
              </li>
            ))}
          </ul>
        </div>

        <div
          ref={panelRef}
          className={[
            styles.panel,
            styles.asthiwar,
            revealed ? styles.revealed : styles.veiled,
          ].join(' ')}
        >
          {!revealed ? (
            <button
              type="button"
              className={styles.trigger}
              onClick={() => setRevealed(true)}
            >
              {processReveal.prompt}
            </button>
          ) : null}

          {/* Never aria-hidden: the blur is decorative, the content is always readable. */}
          <div className={styles.inner}>
            <p className={styles.panelHead}>{processReveal.columns.asthiwar}</p>
            <ul className={styles.list}>
              {processReveal.rows.map((row) => (
                <li className={styles.row} key={row.asthiwar}>
                  {row.asthiwar}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
