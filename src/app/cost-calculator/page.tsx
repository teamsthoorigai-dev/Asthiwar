import type { Metadata } from 'next';
import { CalculatorWizard } from '@/components/calculator/CalculatorWizard';

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
    <div className="min-h-screen bg-bg text-ink">
      <section className="pt-28 pb-6 px-4 text-center max-w-4xl mx-auto">
        <p className="text-xs uppercase tracking-widest font-bold text-muted mb-2">
          Cost planning / indicative only
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
          A number is useful only when its assumptions stay visible.
        </h1>
        <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto leading-relaxed">
          Square-foot rates help with early planning, but they are not a substitute for site conditions,
          coordinated drawings, specifications, and an agreed scope.
        </p>
      </section>

      <section id="cost-calculator" className="pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <CalculatorWizard />
        </div>
      </section>
    </div>
  );
}
