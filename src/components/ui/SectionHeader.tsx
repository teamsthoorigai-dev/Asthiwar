import type { ReactNode } from 'react';
import { SplitHeading } from './SplitHeading';
import styles from './SectionHeader.module.css';

type Props = {
  eyebrow?: string;
  title: string;
  body?: ReactNode;
  align?: 'left' | 'center';
  /** Optional CTA / action placed opposite or below the header copy. */
  action?: ReactNode;
  /** Heading level. The homepage uses h2 throughout; the hero uses h1. */
  as?: 'h1' | 'h2';
  /** Set when the parent section uses aria-labelledby. */
  id?: string;
  className?: string;
};

/** Eyebrow, headline (motion M1) and optional standfirst. Used by most sections. */
export function SectionHeader({
  eyebrow,
  title,
  body,
  align = 'left',
  action,
  as = 'h2',
  id,
  className,
}: Props) {
  if (action) {
    return (
      <header
        className={[
          styles.header,
          styles.withAction,
          align === 'center' && styles.center,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={styles.textGroup}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <SplitHeading as={as} id={id} className={styles.title}>
            {title}
          </SplitHeading>
          {body ? <p className={styles.body}>{body}</p> : null}
        </div>
        <div className={styles.action}>{action}</div>
      </header>
    );
  }

  return (
    <header
      className={[
        styles.header,
        align === 'center' && styles.center,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <SplitHeading as={as} id={id} className={styles.title}>
        {title}
      </SplitHeading>
      {body ? <p className={styles.body}>{body}</p> : null}
    </header>
  );
}
