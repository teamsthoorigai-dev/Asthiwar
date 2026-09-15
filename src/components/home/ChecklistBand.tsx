import styles from './ChecklistBand.module.css';

/**
 * Compact proof band between cost and work.
 */
export function ChecklistBand() {
  return (
    <section className={styles.section} aria-label="750 plus checklist">
      <div className={styles.inner}>
        <p className={styles.label}>750+ Checklist</p>
      </div>
    </section>
  );
}
