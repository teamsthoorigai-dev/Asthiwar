import type { Metadata } from 'next';
import { CalculatorWizard } from '@/components/calculator/CalculatorWizard';
import styles from './cost-calculator.module.css';

export const metadata: Metadata = {
  title: 'Cost Planning & Calculator',
  description:
    "Explore ASTHIWAR's transparent construction pricing with our real-time interactive cost planning calculator.",
  openGraph: {
    title: 'Cost Planning & Calculator — ASTHIWAR',
    description:
      "Explore ASTHIWAR's transparent construction pricing with our real-time interactive cost planning calculator.",
    url: '/cost-calculator',
  },
  alternates: {
    canonical: '/cost-calculator',
  },
};

export default function CostCalculatorPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-label="Cost planning hero">
        <div className={styles.heroLinework} aria-hidden="true" />
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Cost Calculator</p>
          <h1 className={styles.title}>
            A number is useful only when calculated with <em className={styles.titleAccent}>zero assumptions</em>.
          </h1>
          
        </div>
      </section>

      <section id="cost-calculator" className={styles.calculatorSection} aria-label="Interactive Construction Cost Calculator">
        <div className={styles.calculatorInner}>
          <CalculatorWizard />
        </div>
      </section>
    </div>
  );
}
