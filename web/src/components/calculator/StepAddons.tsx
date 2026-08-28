'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import React from 'react';
import { Check, ArrowRight, ArrowLeft, Loader2, Sparkles, Plus, Minus } from 'lucide-react';
import type {
  EstimateFormState,
  PackageConfigResponse,
  AddonItem,
  AddonVariantItem,
  CalculationResult,
} from '@/lib/calculator/types';

interface StepAddonsProps {
  formData: EstimateFormState;
  packageConfig: PackageConfigResponse | null;
  configLoading: boolean;
  previewResult?: CalculationResult | null;
  previewLoading?: boolean;
  onChange: (fields: Partial<EstimateFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepAddons({
  formData,
  packageConfig,
  configLoading,
  previewResult,
  previewLoading,
  onChange,
  onNext,
  onBack,
}: StepAddonsProps) {
  const toggleAddon = (
    addonSlug: string,
    variantSlug: string,
    defaultQty: number = 1
  ) => {
    const exists = formData.addons.some(
      (a) => a.addonSlug === addonSlug && a.variantSlug === variantSlug
    );
    if (exists) {
      onChange({
        addons: formData.addons.filter(
          (a) => !(a.addonSlug === addonSlug && a.variantSlug === variantSlug)
        ),
      });
    } else {
      const filtered = formData.addons.filter((a) => a.addonSlug !== addonSlug);
      onChange({
        addons: [...filtered, { addonSlug, variantSlug, quantity: defaultQty }],
      });
    }
  };

  const updateAddonQty = (addonSlug: string, qty: number) => {
    onChange({
      addons: formData.addons.map((a) =>
        a.addonSlug === addonSlug ? { ...a, quantity: Math.max(1, qty) } : a
      ),
    });
  };

  // Rule #5: The authoritative add-on subtotal is returned directly by the backend preview engine
  const backendAddonsCost = previewResult?.breakdown?.addonsCost ?? 0;

  if (configLoading) {
    return (
      <div className="calculator-step py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted" />
        <p className="text-sm text-muted">Loading add-ons and infrastructure catalog...</p>
      </div>
    );
  }

  return (
    <div className="calculator-step animate-fade-in">
      <div className="calculator-step__header">
        <span className="calculator-step__badge">Step 5 of 5 • Infrastructure & Add-Ons</span>
        <h2 className="calculator-step__title">Specialized Add-Ons & Infrastructure</h2>
        <p className="calculator-step__intro">
          Elevate your home with sustainable energy, rainwater management, and security infrastructure.
        </p>
      </div>

      {/* Selected Add-Ons Counter & Backend Subtotal */}
      <div className="p-4 mb-6 rounded-lg border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-active flex items-center justify-center text-foreground shrink-0">
            <Sparkles size={16} aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-bold">
              {formData.addons.length === 0
                ? 'No Add-Ons Selected (Optional)'
                : `${formData.addons.length} Add-On${formData.addons.length > 1 ? 's' : ''} Selected`}
            </div>
            <div className="text-xs text-muted">
              {formData.addons.length === 0
                ? 'Select any items below or click continue to proceed.'
                : 'Included in your comprehensive civil construction estimate.'}
            </div>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-border sm:pl-5">
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Add-Ons Subtotal
          </div>
          <div
            className={`text-lg font-mono font-bold transition-opacity ${
              previewLoading ? 'opacity-60' : 'opacity-100'
            }`}
          >
            ₹{backendAddonsCost.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Add-Ons Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {packageConfig?.addons.map((addon: AddonItem) => {
          const selectedVariant = formData.addons.find((a) => a.addonSlug === addon.slug);
          const isChecked = Boolean(selectedVariant);

          return (
            <div
              key={addon.id}
              data-has-selection={isChecked || undefined}
              className={`calculator-addon-card p-4 rounded-lg border transition-all flex flex-col justify-between ${
                isChecked
                  ? 'border-foreground bg-surface-active shadow-sm'
                  : 'border-border bg-surface'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold">{addon.name}</h3>
                    {addon.description && (
                      <p className="text-xs text-muted mt-0.5">{addon.description}</p>
                    )}
                  </div>
                </div>

                {/* Variant Radio Buttons */}
                <div className="space-y-1.5 mt-3 mb-4">
                  {addon.variants.map((v: AddonVariantItem) => {
                    const isVarSelected =
                      selectedVariant?.variantSlug === v.variantSlug;
                    return (
                      <button
                        key={v.variantSlug}
                        type="button"
                        onClick={() =>
                          toggleAddon(
                            addon.slug,
                            v.variantSlug,
                            addon.defaultQuantity ?? 1
                          )
                        }
                        aria-pressed={isVarSelected}
                        data-selected={isVarSelected || undefined}
                        className={`calculator-choice w-full p-2.5 rounded border text-left text-xs flex items-center justify-between transition-all ${
                          isVarSelected
                            ? 'border-foreground bg-background font-semibold text-foreground'
                            : 'border-border/50 bg-background/50 text-muted hover:border-border'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                              isVarSelected
                                ? 'bg-foreground text-background font-bold'
                                : 'border border-border'
                            }`}
                          >
                            {isVarSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                          <span>{v.variantName}</span>
                        </div>
                        <span className="font-mono">
                          ₹{v.price.toLocaleString('en-IN')}{' '}
                          {addon.pricingUnit && addon.pricingUnit !== 'lumpsum'
                            ? `/${addon.pricingUnit}`
                            : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Adjuster if applicable */}
              {isChecked && addon.pricingUnit && addon.pricingUnit !== 'lumpsum' && (
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted">
                    Quantity ({addon.pricingUnit}):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="button button--ghost p-1 h-7 w-7 flex items-center justify-center rounded"
                      onClick={() =>
                        updateAddonQty(
                          addon.slug,
                          (selectedVariant?.quantity || 1) - 1
                        )
                      }
                      aria-label="Decrease quantity"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="font-bold font-mono px-2">
                      {selectedVariant?.quantity || 1}
                    </span>
                    <button
                      type="button"
                      className="button button--ghost p-1 h-7 w-7 flex items-center justify-center rounded"
                      onClick={() =>
                        updateAddonQty(
                          addon.slug,
                          (selectedVariant?.quantity || 1) + 1
                        )
                      }
                      aria-label="Increase quantity"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              )}
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
          <span>Contact Details</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
