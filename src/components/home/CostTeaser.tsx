import { Section } from '@/components/ui/Section';
import { SplitHeading } from '@/components/ui/SplitHeading';
import { Button } from '@/components/ui/Button';
import { Odometer } from '@/components/ui/Odometer';
import { costTeaser } from '@/data/home';
import { PACKAGES } from '@/data/pricing';
import styles from './CostTeaser.module.css';

/**
 * Homepage section 04. Novascape's sticky-left pricing layout, with ASTHIWAR's
 * four package tiers in place of their two flat unit prices.
 */
export function CostTeaser() {
  return (
    <Section aria-labelledby="cost-title">
      <div className={styles.grid}>
        <div className={styles.left}>
          <SplitHeading as="h2" id="cost-title">
            {costTeaser.title}
          </SplitHeading>
          <p className={styles.body}>{costTeaser.body}</p>
          <div className={styles.cta}>
            <Button href={costTeaser.cta.href}>{costTeaser.cta.label}</Button>
          </div>
        </div>

        <div>
          <div className={styles.rows}>
            {PACKAGES.map((pkg) => (
              <div className={styles.row} key={pkg.key}>
                <p className={styles.name}>{pkg.name}</p>
                <div className={styles.rate}>
                  <span className={styles.from}>from</span>
                  <Odometer
                    value={pkg.standardRate}
                    prefix="₹"
                    suffix=" / sqft"
                    label={pkg.name}
                    hideLabel
                    size="inline"
                    group
                  />
                </div>
              </div>
            ))}
          </div>

          <ul className={styles.smallPrint}>
            {costTeaser.smallPrint.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
