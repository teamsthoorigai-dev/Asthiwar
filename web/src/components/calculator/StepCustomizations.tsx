'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import React from 'react';
import { Check, ArrowRight, ArrowLeft, Loader2, Sliders } from 'lucide-react';
import type {
  EstimateFormState,
  PackageConfigResponse,
  SpecificationItem,
  OptionItem,
} from '@/lib/calculator/types';

interface StepCustomizationsProps {
  formData: EstimateFormState;
  packageConfig: PackageConfigResponse | null;
  configLoading: boolean;
  onChange: (fields: Partial<EstimateFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepCustomizations({
  formData,
  packageConfig,
  configLoading,
  onChange,
  onNext,
  onBack,
}: StepCustomizationsProps) {
  // Collect customizable items across categories
  const customizableItems: SpecificationItem[] =
    packageConfig?.specifications.flatMap((cat) =>
      cat.items.filter((item) => item.isCustomizable && item.options.length > 1)
    ) || [];

  const handleOptionChange = (itemSlug: string, optionSlug: string) => {
    const existing = formData.customizations.filter((c) => c.itemSlug !== itemSlug);
    onChange({
      customizations: [...existing, { itemSlug, optionSlug }],
    });
  };

  if (configLoading) {
    return (
      <div className="calculator-step py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted" />
        <p className="text-sm text-muted">Loading specification brand upgrades...</p>
      </div>
    );
  }

  return (
    <div className="calculator-step animate-fade-in">
      <div className="calculator-step__header">
        <span className="calculator-step__badge">Step 4 of 5 • Material Customisations</span>
        <h2 className="calculator-step__title">Brand Upgrades & Specifications</h2>
        <p className="calculator-step__intro">
          Personalize structural materials, sanitary ware, flooring, and finishing brands.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {customizableItems.length === 0 ? (
          <div className="calculator-card text-center py-8 text-muted">
            No optional brand upgrades required for this tier. Standard inclusions apply.
          </div>
        ) : (
          customizableItems.map((item) => {
            const packageDefault =
              item.options.find((o) => o.isPackageDefault) || item.options[0];
            const selectedOptionSlug =
              formData.customizations.find((c) => c.itemSlug === item.slug)?.optionSlug ||
              packageDefault?.slug;

            return (
              <div key={item.id} className="calculator-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs text-muted">{item.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted">
                    Included: <strong className="text-foreground">{packageDefault?.brandName}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {item.options.map((opt: OptionItem) => {
                    const isSelected = selectedOptionSlug === opt.slug;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleOptionChange(item.slug, opt.slug)}
                        aria-pressed={isSelected}
                        data-selected={isSelected || undefined}
                        className={`calculator-choice p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'border-foreground bg-surface-active shadow-sm font-semibold'
                            : 'border-border bg-surface hover:border-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{opt.brandName}</span>
                          {isSelected && <Check size={14} className="text-foreground" />}
                        </div>
                        <div className="text-[11px] text-muted">
                          {opt.priceDelta > 0
                            ? `+₹${opt.priceDelta}/sq.ft`
                            : opt.priceDelta < 0
                            ? `-₹${Math.abs(opt.priceDelta)}/sq.ft`
                            : 'Included in package'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
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
          <span>Select Add-Ons</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
