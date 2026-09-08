import { Button } from '@/components/ui/Button';
import styles from './route-status.module.css';

export default function NotFound() {
  return (
    <section className={styles.status} aria-labelledby="not-found-title">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>404</p>
        <h1 className={styles.title} id="not-found-title">
          Page not found.
        </h1>
        <p className={styles.body}>The page you are looking for is not available.</p>
        <div className={styles.actions}>
          <Button href="/">Return home</Button>
        </div>
      </div>
    </section>
  );
}
