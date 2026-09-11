'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import React from 'react';
import { Check, ArrowRight, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
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

/** Quantity captions per pricing unit — the unit itself is backend data. */
const QUANTITY_LABELS: Record<string, string> = {
  per_litre: 'Capacity (Litres)',
  per_sqft: 'Area (Sq.Ft)',
  per_sqft_terrace: 'Terrace Area (Sq.Ft)',
  per_sqft_gate: 'Gate Area (Sq.Ft)',
  per_rft: 'Running Feet (R.Ft)',
};

/**
 * Anything that is not a fixed price is charged per unit, so anything that is not
 * a fixed price needs a quantity from the customer.
 *
 * Deriving it that way rather than from the caption map matters: the map only
 * supplies nicer wording, and a unit it has not caught up with still gets an
 * input. 'per_sqft' was missing from the map, so the box never rendered, no
 * quantity was ever sent, and the add-on was priced as a single unit.
 */
function quantityCaption(pricingUnit: string): string | null {
  if (pricingUnit === 'fixed') return null;
  return QUANTITY_LABELS[pricingUnit] ?? 'Quantity';
}

function unitBadgeLabel(pricingUnit: string): string {
  return pricingUnit.replace(/_/g, ' ').toUpperCase();
}

export function StepAddons({
  formData,
  packageConfig,
  configLoading,
  previewResult,
  previewLoading,
  onChange,
  onBack,
  onNext,
}: StepAddonsProps) {
  /**
   * Most add-ons are either/or — picking a second variant replaces the first.
   * Where the catalogue marks `allowsMultiple` (motor automation fits the
   * bore-water and corporation-water tanks independently) both can be held.
   */
  const toggleAddon = (addon: AddonItem, variantSlug: string) => {
    const isSelected = formData.addons.some(
      (a) => a.addonSlug === addon.slug && a.variantSlug === variantSlug
    );

    if (isSelected) {
      onChange({
        addons: formData.addons.filter(
          (a) => !(a.addonSlug === addon.slug && a.variantSlug === variantSlug)
        ),
      });
      return;
    }

    // Never start below the add-on's minimum. Every seeded default already clears
    // its minimum, but an add-on configured with a minimum and no default would
    // otherwise open at 1 and be refused by the backend the moment it is selected.
    const quantity = Math.max(
      Number(addon.defaultQuantity ?? 1),
      addon.minQuantity != null ? Number(addon.minQuantity) : 1
    );
    const kept = addon.allowsMultiple
      ? formData.addons
      : formData.addons.filter((a) => a.addonSlug !== addon.slug);

    onChange({ addons: [...kept, { addonSlug: addon.slug, variantSlug, quantity }] });
  };

  const addonBounds = (addon: AddonItem) => ({
    min: addon.minQuantity != null ? Number(addon.minQuantity) : 1,
    max: addon.maxQuantity != null ? Number(addon.maxQuantity) : Number.POSITIVE_INFINITY,
  });

  /**
   * Accept what is being typed. Do not clamp yet.
   *
   * Clamping on every keystroke made these boxes impossible to type into: on a
   * sump (minimum 1,000) selecting the value and typing `8` snapped the field
   * straight back to 1000, so reaching 8000 by keyboard could not be done. The
   * value is held as the customer is entering it and settled on blur instead.
   *
   * The backend enforces the same bounds and refuses anything outside them, so
   * nothing can be quoted from an out-of-range figure in the meantime.
   */
  const setAddonQty = (addon: AddonItem, qty: number) => {
    onChange({
      addons: formData.addons.map((a) =>
        a.addonSlug === addon.slug ? { ...a, quantity: qty } : a
      ),
    });
  };

  /**
   * Settle the value once the customer leaves the field: clamp into the add-on's
   * own limits so what is submitted is always something the catalogue can price.
   */
  const commitAddonQty = (addon: AddonItem, qty: number) => {
    const { min, max } = addonBounds(addon);
    const settled = Number.isFinite(qty) ? Math.min(Math.max(qty, min), max) : min;
    setAddonQty(addon, settled);
  };

  // Rule #5: the authoritative add-on subtotal is returned by the backend preview engine.
  const backendAddonsCost = previewResult?.breakdown?.addonsCost ?? 0;
  const selectedCount = formData.addons.length;

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
      <div className="calculator-step__header text-center">
        <span className="calculator-step__badge">Step 4 of 5 • Additional Add-Ons</span>
        <h2 className="calculator-step__title">
          {packageConfig?.addons.length ?? 15} Add-Ons &amp; Infrastructure Catalog
        </h2>
        <p className="calculator-step__intro">
          Elevate your home with sustainable energy, water management, perimeter security,
          and luxury convenience systems.
        </p>
      </div>

      {/* Selection Counter & Backend Subtotal */}
      <div className="calculator-card p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-active flex items-center justify-center text-foreground shrink-0">
            <Sparkles size={16} aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-bold">
              {selectedCount === 0
                ? 'No Add-Ons Selected (Optional)'
                : `${selectedCount} Add-On${selectedCount > 1 ? 's' : ''} Selected`}
            </div>
            <div className="text-xs text-muted">
              {selectedCount === 0
                ? 'Select any items below or click continue to skip.'
                : 'Included in your comprehensive civil construction estimate.'}
            </div>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-border sm:pl-5">
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Add-Ons Investment
          </div>
          <div
            className={`text-lg tabular-nums font-bold transition-opacity ${
              previewLoading ? 'opacity-60' : 'opacity-100'
            }`}
          >
            ₹{backendAddonsCost.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Add-Ons Catalog Grid */}
      <div className="calculator-addon-grid mb-6">
        {packageConfig?.addons.map((addon: AddonItem) => {
          const selections = formData.addons.filter((a) => a.addonSlug === addon.slug);
          const isChecked = selections.length > 0;
          const quantityLabel = quantityCaption(addon.pricingUnit);
          const showQuantity = isChecked && quantityLabel !== null;

          return (
            <div
              key={addon.id}
              data-has-selection={isChecked || undefined}
              className="calculator-addon-card p-4 rounded-lg border transition-all"
            >
              <div className="calculator-addon-card__head">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold">{addon.name}</h3>
                    {addon.description && (
                      <p className="text-xs text-muted mt-0.5">{addon.description}</p>
                    )}
                  </div>
                  <span className="calculator-unit-badge">
                    {unitBadgeLabel(addon.pricingUnit)}
                  </span>
                </div>

                {addon.allowsMultiple && (
                  <p className="text-[11px] text-muted mt-1.5">Select one or both.</p>
                )}
              </div>

              <div className="calculator-addon-card__variants space-y-1.5">
                  {Array.from(
                    new Map(addon.variants.map((v) => [v.variantSlug, v])).values()
                  ).map((v: AddonVariantItem) => {
                    const isVarSelected = selections.some(
                      (a) => a.variantSlug === v.variantSlug
                    );
                    const price = Number(v.price);
                    return (
                      <button
                        key={v.variantSlug}
                        type="button"
                        onClick={() => toggleAddon(addon, v.variantSlug)}
                        role={addon.allowsMultiple ? 'checkbox' : undefined}
                        aria-checked={addon.allowsMultiple ? isVarSelected : undefined}
                        aria-pressed={addon.allowsMultiple ? undefined : isVarSelected}
                        data-selected={isVarSelected || undefined}
                        className="calculator-choice calculator-variant-row w-full p-2.5 rounded border text-left text-xs flex items-center justify-between gap-3"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`calculator-tick calculator-tick--sm ${
                              addon.allowsMultiple ? 'calculator-tick--checkbox' : ''
                            }`}
                          >
                            <Check size={10} strokeWidth={3} aria-hidden="true" />
                          </span>
                          <span>{v.variantName}</span>
                        </span>
                        <span className="calculator-addon-price tabular-nums whitespace-nowrap">
                          {price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'Custom Quote'}
                        </span>
                      </button>
                    );
                  })}
              </div>

              {/* Quantity for everything not priced as a flat lump sum. The row is
                  always rendered — an empty one still holds its place, so a card
                  with a quantity control cannot pull its neighbour out of step. */}
              <div className="calculator-addon-card__foot">
                {showQuantity && (
                  <div className="calculator-addon-qty">
                    <label className="text-muted" htmlFor={`addon-qty-${addon.slug}`}>
                      {quantityLabel}
                    </label>
                    <input
                      id={`addon-qty-${addon.slug}`}
                      type="number"
                      min={Number(addon.minQuantity ?? 1)}
                      max={Number(addon.maxQuantity ?? 100000)}
                      step="1"
                      className="form-input calculator-addon-qty__input"
                      value={selections[0]?.quantity ?? Number(addon.defaultQuantity ?? 1)}
                      onChange={(e) => {
                        // An empty box is a value being replaced, not a zero.
                        const raw = e.target.value;
                        if (raw === '') return;
                        const parsed = parseFloat(raw);
                        if (Number.isFinite(parsed)) setAddonQty(addon, parsed);
                      }}
                      onBlur={(e) => commitAddonQty(addon, parseFloat(e.target.value))}
                    />
                  </div>
                )}
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
          <span>Back to Customisations</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          className="button button--solid flex items-center gap-2"
        >
          <span>Continue to Contact Details</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
