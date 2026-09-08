import type { ReactNode } from 'react';
import styles from './Section.module.css';

type Props = {
  children: ReactNode;
  /** Container max-width. */
  width?: 'regular' | 'large' | 'small';
  /** Ground colour. Use 'accent' for the two full-bleed interludes. */
  background?: 'bg' | 'surface' | 'accent' | 'ink';
  /** Use the smaller vertical rhythm. */
  tight?: boolean;
  id?: string;
  className?: string;
  'aria-labelledby'?: string;
};

/**
 * Section wrapper: full-bleed ground colour, contained content, standard
 * vertical rhythm from --section-y.
 */
export function Section({
  children,
  width = 'regular',
  background = 'bg',
  tight = false,
  id,
  className,
  ...rest
}: Props) {
  return (
    <section
      id={id}
      aria-labelledby={rest['aria-labelledby']}
      className={[styles.section, styles[background], tight && styles.tight, className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={`${styles.container} ${styles[width]}`}>{children}</div>
    </section>
  );
}
