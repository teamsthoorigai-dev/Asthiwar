'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import React from 'react';
import { Check, ArrowRight, ArrowLeft, Star } from 'lucide-react';
import type {
  CalculationResult,
  EstimateFormState,
  PackageItem,
  PackageSlug,
} from '@/lib/calculator/types';

interface StepPackagesProps {
  formData: EstimateFormState;
  packages: PackageItem[];
  previewResult?: CalculationResult | null;
  onChange: (fields: Partial<EstimateFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PACKAGE_HIGHLIGHTS: Record<string, string[]> = {
  basic: [
    'ISI Fe 550D TMT Steel & ISI Cement',
    'Solid Concrete Blocks Masonry',
    '1 Putnam + 2 ISI Emulsion Paint',
    "2'x2' Vitrified Flooring (Rs. 45/sqft)",
    'Standard UPVC Sliding Windows',
    '10-Year Structural Warranty',
  ],
  standard: [
    'SPA / Vizag Steel & JSW / Ramco Cement',
    'Fly Ash / AAC Blocks Masonry',
    'Parryware Sanitary Fittings (Rs. 20,000/bath)',
    "4'x2' Vitrified Tiles (Rs. 50/sqft)",
    'Dr. Fixit Waterproofing Included',
    'Readymade Teak Main Door (5"x4")',
  ],
  premium: [
    'ARS / Suryadev Fe 550D & Ultratech Cement',
    'Jaquar Premium Sanitary (Rs. 30,000/bath)',
    'Granite Staircase Flooring (Rs. 120/sqft)',
    "1st Quality Teak Main Door (3.5'x7')",
    'Asian Apex Weatherproof Exterior Paint',
    'Soil Testing & Architect Site Visits Included',
  ],
  luxury: [
    'JSW / TATA Fe 550D & Ultratech Cement',
    '100% Solid Red Bricks & RCC Basement',
    'Toto / Kohler Luxury Bathrooms (Rs. 45,000/bath)',
    "1st Quality Burma Teak Doors (3.5'x8')",
    'Italian / Premium Tiles (Rs. 100/sqft)',
    'VR 3D Walkthrough & Full Dedicated Site Engineer',
  ],
};

export function StepPackages({
  formData,
  packages,
  previewResult,
  onChange,
  onNext,
  onBack,
}: StepPackagesProps) {
  // The volume threshold is measured against the engine's own total built-up area
  // (floors + car parking). Fall back to the same sum locally until the preview lands.
  const localTotalBuiltup =
    (formData.floorBreakdown ?? [formData.builtupAreaPerFloor]).reduce(
      (sum, area) => sum + (area || 0),
      0
    ) + (formData.carParkingAreaSqft || 0);
  const totalBuiltup =
    previewResult?.dimensions?.totalBuiltupAreaSqft ?? localTotalBuiltup;

  return (
    <div className="calculator-step animate-fade-in">
      <div className="calculator-step__header text-center">
        <span className="calculator-step__badge">Step 2 of 5 • Package Selection</span>
        <h2 className="calculator-step__title">Choose Your Construction Package</h2>
        <p className="calculator-step__intro">
          Transparent per sq.ft rates with zero hidden escalation clauses.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {packages.map((pkg) => {
          const isSelected = formData.packageSlug === pkg.slug;
          const threshold =
            pkg.volumeDiscountThresholdSqft ??
            pkg.pricing?.volumeDiscountThresholdSqft ??
            null;
          const isVolumeForPkg = threshold !== null && totalBuiltup > threshold;
          const stdRate = Number(
            pkg.standardPricePerSqft ?? pkg.pricing?.standardRatePerSqft ?? 0
          );
          const volRate = Number(
            pkg.volumePricePerSqft ?? pkg.pricing?.volumeRatePerSqft ?? stdRate
          );
          const rate = isVolumeForPkg ? volRate : stdRate;
          const highlights = PACKAGE_HIGHLIGHTS[pkg.slug] || [];
          const isPopular = pkg.slug === 'premium';

          return (
            <div key={pkg.id} className="calculator-package-slot">
              <div
                onClick={() => onChange({ packageSlug: pkg.slug as PackageSlug })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onChange({ packageSlug: pkg.slug as PackageSlug });
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Select ${pkg.name}`}
                aria-pressed={isSelected}
                data-selected={isSelected || undefined}
                className={`calculator-choice calculator-choice--package package-card p-5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between h-full ${
                  isSelected
                    ? 'border-foreground bg-surface-active'
                    : 'border-border bg-surface hover:border-muted'
                }`}
              >
                {/* Straddles the card's own top edge, so the recommended tier
                    reads as lifted out of the row. Inside the card (not the slot)
                    so it rides the 1.05 scale when the card is selected. */}
                {isPopular && (
                  <span className="calculator-package-ribbon">
                    <Star size={11} strokeWidth={3} aria-hidden="true" />
                    Most Popular
                    <Star size={11} strokeWidth={3} aria-hidden="true" />
                  </span>
                )}

                <div>
                  {/* Reserved on every card, popular or not, so the names and
                      rates below stay on one line across the grid. */}
                  <div className="calculator-package-head">
                    <span aria-hidden="true" />
                    <span className="calculator-tick">
                      <Check size={12} strokeWidth={3} aria-hidden="true" />
                    </span>
                  </div>

                  <h3 className="text-base font-bold mb-2">{pkg.name}</h3>

                  <p className="calculator-package-tagline text-xs text-muted font-medium">
                    {pkg.tagline}
                  </p>

                  {/* Rate Display */}
                  <div className="calculator-choice__inset p-3 rounded border border-border bg-background mb-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-xs text-muted">₹</span>
                      <span className="text-2xl font-bold tabular-nums">
                        {rate.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-muted">/ sq.ft</span>
                    </div>
                    {isVolumeForPkg && (
                      <div className="calculator-volume-note">
                        Volume Discount Applied (&gt;{threshold.toLocaleString('en-IN')} sqft)
                      </div>
                    )}
                  </div>

                  {/* Specification Highlights */}
                  <ul className="space-y-2 text-xs text-muted mb-6">
                    {highlights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="text-foreground shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="calculator-actions p-4 rounded border border-border bg-surface flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="button button--ghost flex items-center gap-2"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          className="button button--solid flex items-center gap-2"
        >
          <span>Customize &amp; Add-Ons</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
