'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import React from 'react';
import { ArrowLeft, ArrowRight, Building2, Car, Layers, Ruler } from 'lucide-react';
import type { AreaUnit, EstimateFormState } from '@/lib/calculator/types';
import { SQFT_PER_CAR } from '@/lib/calculator';
import { convertAreaToDisplaySqft, plotAreaConversions } from '@/lib/calculator/units';

interface StepDimensionsProps {
  formData: EstimateFormState;
  stepErrors: Record<string, string>;
  onChange: (fields: Partial<EstimateFormState>) => void;
  onNext: () => void;
}

const AREA_UNITS: { value: AreaUnit; label: string }[] = [
  { value: 'sqft', label: 'Sq.Ft' },
  { value: 'cents', label: 'Cents' },
  { value: 'sqyards', label: 'Sq.Yards' },
  { value: 'sqm', label: 'Sq.Meter' },
];

const MAX_FLOORS_ABOVE_GROUND = 10;

const CAR_PRESETS = [1, 2, 3, 4];

function floorLabel(index: number): string {
  return index === 0 ? 'Ground Floor' : `Floor ${index}`;
}

/** Grows or trims the per-floor list so it always matches the storey count. */
function resizeBreakdown(breakdown: number[], length: number, fallback: number): number[] {
  const next = breakdown.slice(0, length);
  while (next.length < length) {
    next.push(next[next.length - 1] ?? fallback);
  }
  return next;
}

export function StepDimensions({
  formData,
  stepErrors,
  onChange,
  onNext,
}: StepDimensionsProps) {
  // Display-only conversion so the customer can sanity-check a non-sqft entry.
  const plotSqft = convertAreaToDisplaySqft(formData.plotArea, formData.plotAreaUnit);
  const plotConversions = plotAreaConversions(formData.plotArea, formData.plotAreaUnit);
  const totalFloors = (formData.floorCount || 0) + 1;
  const isVariable = Boolean(formData.isVariableArea);
  const sliderMax = plotSqft > 0 ? plotSqft : 10000;

  const breakdown = resizeBreakdown(
    formData.floorBreakdown ?? [formData.builtupAreaPerFloor],
    totalFloors,
    formData.builtupAreaPerFloor
  );
  const totalBuiltupArea = breakdown.reduce((sum, area) => sum + (area || 0), 0);

  const handleUnitChange = (unit: AreaUnit) => {
    onChange({ plotAreaUnit: unit });
  };

  const handleFloorCountChange = (rawValue: number) => {
    const floorCount = Math.min(
      MAX_FLOORS_ABOVE_GROUND,
      Math.max(0, Math.floor(rawValue || 0))
    );
    onChange({
      floorCount,
      floorBreakdown: resizeBreakdown(
        breakdown,
        floorCount + 1,
        formData.builtupAreaPerFloor
      ),
    });
  };

  const handleVariableToggle = (variable: boolean) => {
    onChange({
      isVariableArea: variable,
      floorBreakdown: variable
        ? breakdown
        : Array(totalFloors).fill(formData.builtupAreaPerFloor),
    });
  };

  /** Uniform mode: one number drives every storey. */
  const handleUniformAreaChange = (area: number) => {
    onChange({
      builtupAreaPerFloor: area,
      floorBreakdown: Array(totalFloors).fill(area),
    });
  };

  /** Variable mode: the ground floor stays the per-floor figure the engine falls back to. */
  const handleFloorAreaChange = (index: number, area: number) => {
    const next = [...breakdown];
    next[index] = area;
    onChange({
      floorBreakdown: next,
      ...(index === 0 ? { builtupAreaPerFloor: area } : {}),
    });
  };

  const floorRows = isVariable
    ? breakdown.map((area, index) => ({
        key: `floor-${index}`,
        label: floorLabel(index),
        value: area,
        onValueChange: (next: number) => handleFloorAreaChange(index, next),
      }))
    : [
        {
          key: 'uniform',
          label: totalFloors > 1 ? 'All Floors (each)' : 'Ground Floor',
          value: formData.builtupAreaPerFloor,
          onValueChange: handleUniformAreaChange,
        },
      ];

  return (
    <div className="calculator-step animate-fade-in">
      <div className="calculator-step__header text-center">
        <span className="calculator-step__badge">Step 1 of 5 • Dimensions &amp; Floors</span>
        <h2 className="calculator-step__title">Dimensions &amp; Floor Configuration</h2>
        <p className="calculator-step__intro">
          Specify your plot size, floor layout, and other areas.
        </p>
      </div>

      <div className="calculator-card p-5 sm:p-6 space-y-6">
        {/* Total Plot Area */}
        <div className="form-group">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <label className="form-label flex items-center gap-1.5 mb-0" htmlFor="plot-area">
              <Ruler size={16} aria-hidden="true" />
              <span>Total Plot Area</span>
              <span className="text-red-500">*</span>
            </label>
            {plotConversions.length > 0 && (
              <span className="text-xs font-semibold text-muted">
                ≈{plotConversions.join(' • ')}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <input
                id="plot-area"
                type="number"
                min={1}
                max={100000}
                step="1"
                className="form-input text-lg font-bold"
                value={formData.plotArea || ''}
                onChange={(e) => onChange({ plotArea: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 2400"
              />
            </div>
            <select
              className="form-select font-semibold"
              value={formData.plotAreaUnit}
              onChange={(e) => handleUnitChange(e.target.value as AreaUnit)}
              aria-label="Plot area unit"
            >
              {AREA_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>
          {stepErrors.plotArea && <p className="form-error">{stepErrors.plotArea}</p>}
        </div>

        {/* Number of Floors */}
        <div className="form-group calculator-field-divider">
          <label className="form-label flex items-center gap-1.5" htmlFor="floor-count">
            <Building2 size={16} aria-hidden="true" />
            <span>Number of Floors</span>
            <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <div className="calculator-stepper">
              <span className="calculator-stepper__prefix" aria-hidden="true">
                G +
              </span>
              <input
                id="floor-count"
                type="number"
                min={0}
                max={MAX_FLOORS_ABOVE_GROUND}
                step="1"
                className="calculator-stepper__input"
                value={formData.floorCount ?? 0}
                onChange={(e) => handleFloorCountChange(parseInt(e.target.value, 10))}
                aria-label="Floors above ground"
              />
            </div>
            <span className="text-sm text-muted">
              {formData.floorCount > 0
                ? `Ground + ${formData.floorCount} ${formData.floorCount === 1 ? 'Floor' : 'Floors'}`
                : 'Ground Floor Only'}
            </span>
          </div>
          {stepErrors.floorCount && <p className="form-error">{stepErrors.floorCount}</p>}
        </div>

        {/* Built-up Area */}
        <div className="form-group calculator-field-divider">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="form-label flex items-center gap-1.5 mb-0">
              <Layers size={16} aria-hidden="true" />
              <span>Built-up Area</span>
              <span className="text-red-500">*</span>
            </span>
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                className="calculator-checkbox"
                checked={isVariable}
                onChange={(e) => handleVariableToggle(e.target.checked)}
                disabled={totalFloors < 2}
              />
              <span className={totalFloors < 2 ? 'text-muted' : undefined}>
                Different Area Per Floor
              </span>
            </label>
          </div>

          <div className="space-y-2.5">
            {floorRows.map((row) => (
              <div key={row.key} className="calculator-floor-row">
                <span className="calculator-floor-row__label">{row.label}</span>
                <input
                  type="range"
                  min={100}
                  max={sliderMax}
                  step="10"
                  className="calculator-range"
                  value={Math.min(Math.max(row.value || 100, 100), sliderMax)}
                  onChange={(e) => row.onValueChange(parseFloat(e.target.value) || 0)}
                  aria-label={`${row.label} built-up area slider`}
                />
                <input
                  type="number"
                  min={0}
                  max={100000}
                  step="10"
                  className="form-input calculator-floor-row__input"
                  value={row.value || ''}
                  onChange={(e) => row.onValueChange(parseFloat(e.target.value) || 0)}
                  aria-label={`${row.label} built-up area`}
                />
                <span className="calculator-floor-row__unit">Sq.Ft</span>
              </div>
            ))}
          </div>

          <div className="calculator-total-row">
            <span>Total Built-up Area:</span>
            <strong>{totalBuiltupArea.toLocaleString('en-IN')} Sq.Ft</strong>
          </div>

          {stepErrors.builtupAreaPerFloor && (
            <p className="form-error">{stepErrors.builtupAreaPerFloor}</p>
          )}
          {stepErrors.floorBreakdown && (
            <p className="form-error">{stepErrors.floorBreakdown}</p>
          )}
          {plotSqft > 0 && (formData.floorBreakdown?.[0] ?? 0) > plotSqft && (
            <p className="form-warning">
              Ground floor footprint exceeds the total plot area of{' '}
              {plotSqft.toLocaleString('en-IN')} Sq.Ft.
            </p>
          )}
        </div>

        {/* Additional Areas */}
        <div className="form-group calculator-field-divider">
          <span className="form-label flex items-center gap-1.5 mb-2">
            <Car size={16} aria-hidden="true" />
            <span>Additional Areas (Sq.Ft)</span>
            <span className="text-red-500">*</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label text-xs" htmlFor="car-parking-area">
                Car Parking Area (Sq.Ft)
              </label>
              <input
                id="car-parking-area"
                type="number"
                min={0}
                max={5000}
                step="10"
                className="form-input"
                value={formData.carParkingAreaSqft || ''}
                onChange={(e) =>
                  onChange({ carParkingAreaSqft: parseFloat(e.target.value) || 0 })
                }
                placeholder="e.g. 200"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {CAR_PRESETS.map((cars) => {
                  const area = cars * SQFT_PER_CAR;
                  const isSelected = formData.carParkingAreaSqft === area;
                  return (
                    <button
                      key={cars}
                      type="button"
                      aria-pressed={isSelected}
                      data-selected={isSelected || undefined}
                      onClick={() =>
                        onChange({ carParkingAreaSqft: area, carCount: cars })
                      }
                      className={`button button--ghost calculator-choice calculator-choice--compact text-xs ${
                        isSelected ? 'button--active' : ''
                      }`}
                    >
                      {cars} {cars === 1 ? 'Car' : 'Cars'} ≈ {area}
                    </button>
                  );
                })}
              </div>
              {stepErrors.carParkingAreaSqft && (
                <p className="form-error">{stepErrors.carParkingAreaSqft}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label text-xs" htmlFor="headroom-area">
                Head Room Area (Sq.Ft)
              </label>
              <input
                id="headroom-area"
                type="number"
                min={0}
                max={2000}
                step="10"
                className="form-input"
                value={formData.headRoomAreaSqft || ''}
                onChange={(e) =>
                  onChange({ headRoomAreaSqft: parseFloat(e.target.value) || 0 })
                }
                placeholder="e.g. 100"
              />
              {stepErrors.headRoomAreaSqft && (
                <p className="form-error">{stepErrors.headRoomAreaSqft}</p>
              )}
            </div>
          </div>

          <p className="calculator-field-note">
            <strong>Car parking:</strong> enter this only when the parking is a separate
            structure, outside the building. Parking inside the building is already counted
            in the built-up area above — leave it blank. Allow roughly {SQFT_PER_CAR} Sq.Ft
            per car.
          </p>
        </div>

        <div className="calculator-actions pt-4 border-t border-border flex items-center justify-between">
          <button
            type="button"
            disabled
            title="This is the first step"
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
