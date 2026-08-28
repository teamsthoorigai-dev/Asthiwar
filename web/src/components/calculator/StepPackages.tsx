'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import React from 'react';
import { Check, ArrowRight, ArrowLeft, Shield, Sparkles } from 'lucide-react';
import type { EstimateFormState, PackageItem, PackageSlug } from '@/lib/calculator/types';

interface StepPackagesProps {
  formData: EstimateFormState;
  packages: PackageItem[];
  onChange: (fields: Partial<EstimateFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PACKAGE_HIGHLIGHTS: Record<string, string[]> = {
  basic: [
    'ISI Fe 550D TMT Steel & ISI 53 Grade Cement',
    'Solid Concrete Blocks / Red Brick Masonry',
    '1 Putnam + 2 ISI Premium Emulsion Paint',
    "2'x2' Vitrified Flooring (Rs. 45/sq.ft)",
    'Standard UPVC Sliding Windows',
    '10-Year Structural Warranty',
  ],
  standard: [
    'Vizag / JSW Fe 550D Steel & Ramco/Ultratech Cement',
    'Engineered Fly Ash / AAC Blocks Masonry',
    'Parryware / Hindware Sanitary Fittings',
    "4'x2' Vitrified Tiles (Rs. 55/sq.ft)",
    'Dr. Fixit Waterproofing & Anti-Termite Treatment',
    'Readymade Teak Main Door (5"x4")',
  ],
  premium: [
    'ARS / Suryadev Fe 550D & Ultratech Super Cement',
    'Jaquar / Kohler Premium Sanitary Collection',
    'Granite Staircase Flooring (Rs. 120/sq.ft)',
    "1st Quality Teak Main Door (3.5'x7')",
    'Asian Apex Weatherproof Exterior Silicone Emulsion',
    'Soil Testing & Architect Site Supervision Included',
  ],
  luxury: [
    'JSW / TATA Fe 550D & Ultratech WeatherPlus Cement',
    '100% Solid Wire-Cut Red Bricks & RCC Basement',
    'Toto / Kohler Luxury Collection Bathrooms',
    "1st Quality Burma Teak Doors (3.5'x8')",
    'Italian Marble / Large-Format Slabs (Rs. 120+/sq.ft)',
    'Full VR 3D Walkthrough & Dedicated Resident Engineer',
  ],
};

export function StepPackages({
  formData,
  packages,
  onChange,
  onNext,
  onBack,
}: StepPackagesProps) {
  const totalFloors = (formData.floorCount || 0) + 1;
  const totalBuiltup = formData.isVariableArea && formData.floorBreakdown
    ? formData.floorBreakdown.reduce((sum, val) => sum + (val || 0), 0) + (formData.headRoomAreaSqft || 0)
    : formData.builtupAreaPerFloor * totalFloors + (formData.headRoomAreaSqft || 0);

  return (
    <div className="calculator-step animate-fade-in">
      <div className="calculator-step__header">
        <span className="calculator-step__badge">Step 3 of 5 • Specification Tier</span>
        <h2 className="calculator-step__title">Choose Construction Package</h2>
        <p className="calculator-step__intro">
          Transparent rates per sq.ft with zero hidden escalation clauses.
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
            <div
              key={pkg.id}
              onClick={() => onChange({ packageSlug: pkg.slug as PackageSlug })}
              data-selected={isSelected || undefined}
              className={`calculator-choice calculator-choice--package package-card p-5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-foreground bg-surface-active shadow-md ring-1 ring-foreground/20'
                  : 'border-border bg-surface hover:border-muted'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">{pkg.name}</h3>
                    {isPopular && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-muted/20 text-foreground">
                        <Sparkles size={10} aria-hidden="true" /> Popular
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors ${
                      isSelected
                        ? 'bg-foreground text-background font-bold'
                        : 'border border-border text-transparent'
                    }`}
                  >
                    <Check size={12} strokeWidth={3} aria-hidden="true" />
                  </div>
                </div>

                <p className="text-xs text-muted font-medium mb-4">{pkg.tagline}</p>

                {/* Rate Display */}
                <div className="calculator-choice__inset p-3 rounded border border-border bg-background mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-muted">₹</span>
                    <span className="text-2xl font-bold font-mono">
                      {rate.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-muted">/ sq.ft</span>
                  </div>
                  {isVolumeForPkg && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                      Volume discount applied (&gt;{threshold.toLocaleString('en-IN')} sq.ft)
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

              <button
                type="button"
                className={`button calculator-package-select w-full text-xs py-2 ${
                  isSelected ? 'button--solid' : 'button--ghost'
                }`}
              >
                {isSelected ? 'Selected Tier' : 'Select Package'}
              </button>
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
          <span>Explore Customizations</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
