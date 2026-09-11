import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { estimateBand } from '@/data/home';
import styles from './EstimateBand.module.css';

/**
 * Homepage section 04 — the cost band, ported from asthiwar-v1.
 *
 * Three rows that look like a form and behave like links: each one opens the
 * real wizard rather than collecting an answer here, because a partial answer
 * on the homepage cannot be priced. The figure holds an em dash for the same
 * reason — the page never shows a number it has not actually computed.
 */
export function EstimateBand() {
  return (
    <section className={styles.section} aria-labelledby="estimate-title">
      <div className={styles.grid}>
        <div>
          <p className={styles.eyebrow}>{estimateBand.eyebrow}</p>
          <h2 className={styles.title} id="estimate-title">
            {estimateBand.title}
          </h2>
        </div>

        <div className={styles.panel}>
          <ul className={styles.fields}>
            {estimateBand.fields.map((field) => (
              <li key={field.label}>
                <Link href={estimateBand.cta.href} className={styles.field}>
                  <span className={styles.fieldLabel}>{field.label}</span>
                  <span className={styles.fieldAction}>
                    {field.action}
                    <ArrowDownRight size={13} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className={styles.figure}>
            <p className={styles.number}>
              <span>₹</span>
              <strong>&mdash;</strong>
            </p>
            <p className={styles.figureLabel}>{estimateBand.figureLabel}</p>
            <p className={styles.note}>{estimateBand.note}</p>
            <Button href={estimateBand.cta.href} className={styles.cta}>
              {estimateBand.cta.label}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
