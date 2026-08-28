'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import React from 'react';
import { ArrowRight, MapPin, Ruler, Car } from 'lucide-react';
import type { AreaUnit, EstimateFormState, LocationItem } from '@/lib/calculator/types';
import { convertAreaToDisplaySqft } from '@/lib/calculator/units';

interface StepDimensionsProps {
  formData: EstimateFormState;
  locations: LocationItem[];
  stepErrors: Record<string, string>;
  onChange: (fields: Partial<EstimateFormState>) => void;
  onNext: () => void;
}

const PRESET_AREAS = [800, 1000, 1200, 1500, 1800, 2400, 3000];

export function StepDimensions({
  formData,
  locations,
  stepErrors,
  onChange,
  onNext,
}: StepDimensionsProps) {
  // Convert plot area to equivalent sqft for display and boundary enforcement
  const plotSqft = convertAreaToDisplaySqft(formData.plotArea, formData.plotAreaUnit);

  const handlePlotAreaChange = (val: number) => {
    const calculatedPlotSqft = convertAreaToDisplaySqft(val, formData.plotAreaUnit);
    const updates: Partial<EstimateFormState> = { plotArea: val };
    if (calculatedPlotSqft > 0 && formData.builtupAreaPerFloor > calculatedPlotSqft) {
      updates.builtupAreaPerFloor = calculatedPlotSqft;
    }
    onChange(updates);
  };

  const handleUnitChange = (newUnit: AreaUnit) => {
    const newPlotSqft = convertAreaToDisplaySqft(formData.plotArea, newUnit);
    const updates: Partial<EstimateFormState> = { plotAreaUnit: newUnit };
    if (newPlotSqft > 0 && formData.builtupAreaPerFloor > newPlotSqft) {
      updates.builtupAreaPerFloor = newPlotSqft;
    }
    onChange(updates);
  };

  const isFootprintExceeded = plotSqft > 0 && formData.builtupAreaPerFloor > plotSqft;

  return (
    <div className="calculator-step animate-fade-in">
      <div className="calculator-step__header">
        <span className="calculator-step__badge">Step 1 of 5 • Site & Dimensions</span>
        <h2 className="calculator-step__title">Plot Details & Footprint</h2>
        <p className="calculator-step__intro">
          Select your project location and specify your plot dimensions.
        </p>
      </div>

      <div className="calculator-card space-y-6">
        {/* Location Selection */}
        <div className="form-group">
          <label className="form-label flex items-center gap-1.5" htmlFor="plot-location">
            <MapPin size={16} aria-hidden="true" />
            <span>Plot Location (Tamil Nadu & Kerala)</span>
            <span className="text-red-500">*</span>
          </label>
          <select
            id="plot-location"
            className="form-select"
            value={formData.plotLocation}
            onChange={(e) => {
              const selected = locations.find((l) => l.name === e.target.value);
              onChange({
                plotLocation: e.target.value,
                locationId: selected ? selected.id : undefined,
              });
            }}
          >
            <option value="">Select your site location...</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.name}>
                {loc.name} {Number(loc.priceMultiplier) !== 1.0 ? `(${loc.priceMultiplier}x rate index)` : ''}
              </option>
            ))}
          </select>
          {stepErrors.plotLocation && (
            <p className="form-error">{stepErrors.plotLocation}</p>
          )}
        </div>

        {/* Total Plot Area */}
        <div className="form-group">
          <div className="flex items-center justify-between mb-1.5">
            <label className="form-label flex items-center gap-1.5" htmlFor="plot-area">
              <Ruler size={16} aria-hidden="true" />
              <span>Total Plot Area</span>
              <span className="text-red-500">*</span>
            </label>
            {formData.plotAreaUnit !== 'sqft' && (
              <span className="text-xs text-muted">
                ≈ {plotSqft.toLocaleString('en-IN')} Sq.Ft
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <input
                id="plot-area"
                type="number"
                min={100}
                max={100000}
                step="1"
                className="form-input text-lg font-bold"
                value={formData.plotArea || ''}
                onChange={(e) => handlePlotAreaChange(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 2400"
              />
            </div>
            <div>
              <select
                className="form-select font-semibold"
                value={formData.plotAreaUnit}
                onChange={(e) => handleUnitChange(e.target.value as AreaUnit)}
                aria-label="Plot area unit"
              >
                <option value="sqft">Sq.Ft</option>
                <option value="cents">Cents</option>
                <option value="sqyards">Sq.Yards</option>
                <option value="sqm">Sq.M</option>
              </select>
            </div>
          </div>
          {stepErrors.plotArea && (
            <p className="form-error">{stepErrors.plotArea}</p>
          )}

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {PRESET_AREAS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={formData.plotArea === preset && formData.plotAreaUnit === 'sqft'}
                data-selected={
                  formData.plotArea === preset && formData.plotAreaUnit === 'sqft' || undefined
                }
                className={`button button--ghost calculator-choice calculator-choice--compact text-xs ${
                  formData.plotArea === preset && formData.plotAreaUnit === 'sqft'
                    ? 'button--active'
                    : ''
                }`}
                onClick={() => {
                  onChange({ plotArea: preset, plotAreaUnit: 'sqft' });
                }}
              >
                {preset} sq.ft
              </button>
            ))}
          </div>
        </div>

        {/* Built-up Area per floor */}
        <div className="form-group">
          <label className="form-label flex items-center justify-between mb-1.5" htmlFor="builtup-area">
            <span className="flex items-center gap-1.5">
              <Ruler size={16} aria-hidden="true" />
              <span>Ground Floor Built-up Footprint</span>
              <span className="text-red-500">*</span>
            </span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <input
                id="builtup-area"
                type="number"
                min={100}
                max={plotSqft > 0 ? plotSqft : 50000}
                step="10"
                className="form-input text-lg font-bold"
                value={formData.builtupAreaPerFloor || ''}
                onChange={(e) => onChange({ builtupAreaPerFloor: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 1500"
              />
            </div>
            <div>
              <select
                className="form-select font-semibold"
                value={formData.builtupAreaUnit || 'sqft'}
                onChange={(e) => onChange({ builtupAreaUnit: e.target.value as AreaUnit })}
                aria-label="Built-up area unit"
              >
                <option value="sqft">Sq.Ft</option>
                <option value="cents">Cents</option>
                <option value="sqyards">Sq.Yards</option>
                <option value="sqm">Sq.M</option>
              </select>
            </div>
          </div>
          {isFootprintExceeded && (
            <p className="form-warning">
              Ground footprint ({formData.builtupAreaPerFloor} sq.ft) exceeds total plot area ({plotSqft} sq.ft).
            </p>
          )}
          {stepErrors.builtupAreaPerFloor && (
            <p className="form-error">{stepErrors.builtupAreaPerFloor}</p>
          )}
        </div>

        {/* Parking Area & Car Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label flex items-center gap-1.5" htmlFor="car-parking-area">
              <Car size={16} aria-hidden="true" />
              <span>Car Parking Area (Sq.Ft)</span>
            </label>
            <input
              id="car-parking-area"
              type="number"
              min={0}
              max={5000}
              step="50"
              className="form-input"
              value={formData.carParkingAreaSqft ?? 0}
              onChange={(e) => onChange({ carParkingAreaSqft: parseFloat(e.target.value) || 0 })}
              placeholder="e.g. 200"
            />
          </div>
          <div className="form-group">
            <label className="form-label flex items-center gap-1.5" htmlFor="car-count">
              <Car size={16} aria-hidden="true" />
              <span>Number of Cars</span>
            </label>
            <select
              id="car-count"
              className="form-select"
              value={formData.carCount ?? 1}
              onChange={(e) => onChange({ carCount: parseInt(e.target.value, 10) || 0 })}
            >
              {[0, 1, 2, 3, 4, 5].map((cnt) => (
                <option key={cnt} value={cnt}>
                  {cnt} {cnt === 1 ? 'Car' : 'Cars'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="calculator-actions pt-4 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onNext}
            className="button button--solid flex items-center gap-2"
          >
            <span>Configure Floors</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
