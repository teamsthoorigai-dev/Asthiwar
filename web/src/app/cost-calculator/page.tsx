import type { Metadata } from 'next';
import { CalculatorWizard } from '@/components/calculator/CalculatorWizard';
import { PageHero } from '@/components/PageHero';
import { SectionHeading, SiteLayout } from '@/components/SiteShell';

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
    <SiteLayout footerCta="land">
      <PageHero
        className="pricing-hero"
        eyebrow="Cost planning / indicative only"
        title="A number is useful only when its assumptions stay visible."
        intro="Square-foot rates help with early planning, but they are not a substitute for site conditions, coordinated drawings, specifications, and an agreed scope."
      />

      <section
        id="cost-calculator"
        className="pricing-calculator section section--paper"
        aria-label="Interactive Construction Cost Calculator"
      >
        <div className="shell">
          
          <CalculatorWizard />
        </div>
      </section>
    </SiteLayout>
  );
}
