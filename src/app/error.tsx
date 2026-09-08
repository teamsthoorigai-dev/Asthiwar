'use client';

import { Button } from '@/components/ui/Button';
import styles from './route-status.module.css';

type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  return (
    <section className={styles.status} aria-labelledby="error-title">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Unexpected error</p>
        <h1 className={styles.title} id="error-title">
          Something interrupted the process.
        </h1>
        <p className={styles.body}>Please try again. If the issue continues, return home.</p>
        {error.digest ? <p className={styles.reference}>Reference: {error.digest}</p> : null}
        <div className={styles.actions}>
          <Button onClick={retry}>Try again</Button>
          <Button href="/" variant="ghost">
            Return home
          </Button>
        </div>
      </div>
    </section>
  );
}
