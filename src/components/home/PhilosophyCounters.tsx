import { Section } from '@/components/ui/Section';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Odometer } from '@/components/ui/Odometer';
import { philosophy } from '@/data/home';
import styles from './PhilosophyCounters.module.css';

/**
 * Homepage section 03. Mirrors Novascape's philosophy block and counter row —
 * "0 Handoffs" is the direct analogue of their "0 Shared Walls".
 */
export function PhilosophyCounters() {
  return (
    <Section aria-labelledby="philosophy-title">
      <SectionHeader
        id="philosophy-title"
        eyebrow="Process"
        title={philosophy.title}
        body={philosophy.body}
      />

      <div className={styles.cta}>
        <Button href={philosophy.cta.href} variant="ghost">
          {philosophy.cta.label}
        </Button>
      </div>

      <div className={styles.counters}>
        {philosophy.counters.map((counter) => (
          <Odometer
            key={counter.label}
            value={counter.value}
            label={counter.label}
            sublabel={'sublabel' in counter ? counter.sublabel : undefined}
          />
        ))}
      </div>
    </Section>
  );
}
