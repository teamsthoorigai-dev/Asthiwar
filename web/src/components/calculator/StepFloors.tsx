'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import React from 'react';
import { ArrowLeft, ArrowRight, Building, Layers } from 'lucide-react';
import type { EstimateFormState } from '@/lib/calculator/types';

interface StepFloorsProps {
  formData: EstimateFormState;
  stepErrors: Record<string, string>;
  onChange: (fields: Partial<EstimateFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const FLOOR_OPTIONS = [
  { value: 0, label: 'Ground Floor Only (G)', description: 'Single level residence' },
  { value: 1, label: 'G + 1 Floor', description: 'Duplex / 2-level build' },
  { value: 2, label: 'G + 2 Floors', description: 'Triplex / Multi-unit' },
  { value: 3, label: 'G + 3 Floors', description: 'Apartment / Stilt+3' },
  { value: 4, label: 'G + 4 Floors', description: 'Commercial / Multi-floor' },
];

export function StepFloors({
  formData,
  stepErrors,
  onChange,
  onNext,
  onBack,
}: StepFloorsProps) {
  const totalFloors = (formData.floorCount || 0) + 1;

  const handleFloorCountSelect = (aboveGroundCount: number) => {
    const newTotal = aboveGroundCount + 1;
    const currentBreakdown = formData.floorBreakdown || [formData.builtupAreaPerFloor];
    let newBreakdown = [...currentBreakdown];

    if (newTotal > newBreakdown.length) {
      const lastArea = newBreakdown[newBreakdown.length - 1] || formData.builtupAreaPerFloor;
      const extra = Array(newTotal - newBreakdown.length).fill(lastArea);
      newBreakdown = [...newBreakdown, ...extra];
    } else if (newTotal < newBreakdown.length) {
      newBreakdown = newBreakdown.slice(0, newTotal);
    }

    onChange({
      floorCount: aboveGroundCount,
      floorBreakdown: newBreakdown,
    });
  };

  const handleVariableToggle = (isVariable: boolean) => {
    let newBreakdown = [...(formData.floorBreakdown || [formData.builtupAreaPerFloor])];
    if (!isVariable) {
      newBreakdown = Array(totalFloors).fill(formData.builtupAreaPerFloor);
    }
    onChange({ isVariableArea: isVariable, floorBreakdown: newBreakdown });
  };

  const handleFloorAreaChange = (index: number, area: number) => {
    const newBreakdown = [...(formData.floorBreakdown || [formData.builtupAreaPerFloor])];
    newBreakdown[index] = area;
    onChange({ floorBreakdown: newBreakdown });
  };

  const totalBuiltupArea = formData.isVariableArea && formData.floorBreakdown
    ? formData.floorBreakdown.reduce((sum, val) => sum + (val || 0), 0)
    : formData.builtupAreaPerFloor * totalFloors;

  return (
    <div className="calculator-step animate-fade-in">
      <div className="calculator-step__header">
        <span className="calculator-step__badge">Step 2 of 5 • Floor Levels</span>
        <h2 className="calculator-step__title">Floor Configuration & Total Area</h2>
        <p className="calculator-step__intro">
          Choose the number of storeys and customize individual floor footprints.
        </p>
      </div>

      <div className="calculator-card space-y-6">
        {/* Floor Count Selection Cards */}
        <div className="form-group">
          <label className="form-label mb-2 flex items-center gap-1.5">
            <Building size={16} aria-hidden="true" />
            <span>Storey Elevation</span>
            <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FLOOR_OPTIONS.map((opt) => {
              const isSelected = formData.floorCount === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleFloorCountSelect(opt.value)}
                  aria-pressed={isSelected}
                  data-selected={isSelected || undefined}
                  className={`calculator-choice floor-card text-left p-4 rounded border transition-all ${
                    isSelected
                      ? 'border-foreground bg-surface-active shadow-sm font-semibold'
                      : 'border-border bg-surface hover:border-muted'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-muted mt-0.5">{opt.description}</div>
                </button>
              );
            })}
          </div>
          {stepErrors.floorCount && (
            <p className="form-error">{stepErrors.floorCount}</p>
          )}
        </div>

        {/* Variable Area per floor toggle */}
        {totalFloors > 1 && (
          <div className="p-4 rounded border border-border bg-surface/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Variable Floor Sizes?</span>
                <p className="text-xs text-muted">
                  Enable if upper floors have cantilever balconies, terraces, or smaller footprints.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(formData.isVariableArea)}
                onClick={() => handleVariableToggle(!formData.isVariableArea)}
                data-selected={formData.isVariableArea || undefined}
                className={`button button--ghost calculator-choice calculator-choice--compact text-xs px-3 py-1.5 ${
                  formData.isVariableArea ? 'button--active' : ''
                }`}
              >
                {formData.isVariableArea ? 'Custom per floor' : 'Uniform area'}
              </button>
            </div>

            {formData.isVariableArea && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
                {Array.from({ length: totalFloors }).map((_, idx) => {
                  const floorLabel = idx === 0 ? 'Ground Floor' : `Floor ${idx} (L${idx + 1})`;
                  const currentVal = formData.floorBreakdown?.[idx] ?? formData.builtupAreaPerFloor;
                  return (
                    <div key={idx} className="form-group">
                      <label className="form-label text-xs" htmlFor={`floor-area-${idx}`}>
                        {floorLabel} Area (Sq.Ft)
                      </label>
                      <input
                        id={`floor-area-${idx}`}
                        type="number"
                        min={50}
                        max={50000}
                        step="10"
                        className="form-input text-sm"
                        value={currentVal}
                        onChange={(e) =>
                          handleFloorAreaChange(idx, parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Headroom / Staircase Cover */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label flex items-center gap-1.5" htmlFor="headroom-area">
              <Layers size={16} aria-hidden="true" />
              <span>Head Room / Staircase Cover (Sq.Ft)</span>
            </label>
            <input
              id="headroom-area"
              type="number"
              min={0}
              max={1000}
              step="10"
              className="form-input"
              value={formData.headRoomAreaSqft ?? 0}
              onChange={(e) => onChange({ headRoomAreaSqft: parseFloat(e.target.value) || 0 })}
              placeholder="e.g. 120"
            />
          </div>

          {/* Live Built-up Rollup */}
          <div className="p-3 rounded border border-border bg-surface flex flex-col justify-center">
            <span className="text-xs text-muted uppercase tracking-wider">
              Total Built-up Area
            </span>
            <span className="text-xl font-bold font-mono mt-0.5">
              {(totalBuiltupArea + (formData.headRoomAreaSqft || 0)).toLocaleString('en-IN')}{' '}
              <span className="text-sm font-normal text-muted">sq.ft</span>
            </span>
          </div>
        </div>

        <div className="calculator-actions pt-4 border-t border-border flex items-center justify-between">
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
            <span>Select Package</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
