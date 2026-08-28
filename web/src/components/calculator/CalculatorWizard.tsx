'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import React from 'react';
import {
  Ruler,
  Layers,
  Package as PackageIcon,
  Sliders,
  Sparkles,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useCalculatorWizard } from '@/lib/calculator/useCalculatorWizard';
import { StepDimensions } from './StepDimensions';
import { StepFloors } from './StepFloors';
import { StepPackages } from './StepPackages';
import { StepCustomizations } from './StepCustomizations';
import { StepAddons } from './StepAddons';
import { StepLeadCapture } from './StepLeadCapture';
import { StepEstimateReport } from './StepEstimateReport';

const STEP_TABS = [
  { step: 0, label: 'Dimensions', icon: Ruler },
  { step: 1, label: 'Floors', icon: Layers },
  { step: 2, label: 'Package', icon: PackageIcon },
  { step: 3, label: 'Brands', icon: Sliders },
  { step: 4, label: 'Add-Ons', icon: Sparkles },
  { step: 5, label: 'Authorize', icon: User },
];

export function CalculatorWizard() {
  const {
    currentStep,
    formData,
    locations,
    packages,
    packageConfig,
    loading,
    configLoading,
    calculating,
    estimateResult,
    previewResult,
    previewLoading,
    previewError,
    error,
    stepErrors,
    updateForm,
    nextStep,
    prevStep,
    goToStep,
    calculate,
    reset,
  } = useCalculatorWizard();

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-muted" />
        <h3 className="font-bold text-lg mb-1">Loading ASTHIWAR Engine</h3>
        <p className="text-xs text-muted">
          Fetching live package rates and regional city pricing multipliers...
        </p>
      </div>
    );
  }

  return (
    <div className="calculator-wizard max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Stepper Progress Tabs */}
      {currentStep < 5 && !estimateResult && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="grid grid-cols-5 gap-2 text-center">
            {STEP_TABS.slice(0, 5).map((s) => {
              const Icon = s.icon;
              const isCompleted = currentStep > s.step;
              const isActive = currentStep === s.step;

              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    if (isCompleted) goToStep(s.step);
                  }}
                  disabled={!isCompleted && !isActive}
                  className="calculator-step-tab flex flex-col items-center group cursor-pointer disabled:cursor-not-allowed transition-all"
                  data-active={isActive || undefined}
                  data-completed={isCompleted || undefined}
                >
                  <div
                    className={`calculator-step-tab__icon w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1 ${
                      isCompleted
                        ? 'bg-foreground text-background font-bold shadow-sm'
                        : isActive
                        ? 'bg-surface-active border-2 border-foreground text-foreground font-bold'
                        : 'bg-surface text-muted border border-border'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <span
                    className={`text-[11px] ${
                      isActive
                        ? 'font-bold text-foreground'
                        : isCompleted
                        ? 'font-medium text-foreground'
                        : 'text-muted'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full bg-border h-1 rounded-full overflow-hidden mt-3">
            <div
              className="bg-foreground h-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && !calculating && currentStep < 5 && (
        <div className="mb-6 p-4 rounded border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 max-w-xl mx-auto">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {previewError && !error && currentStep >= 2 && currentStep < 5 && (
        <div className="mb-4 text-center text-xs text-muted">
          <span>{previewError}</span>
        </div>
      )}

      {/* Step Renderings */}
      {currentStep === 0 && (
        <StepDimensions
          formData={formData}
          locations={locations}
          stepErrors={stepErrors}
          onChange={updateForm}
          onNext={nextStep}
        />
      )}

      {currentStep === 1 && (
        <StepFloors
          formData={formData}
          stepErrors={stepErrors}
          onChange={updateForm}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}

      {currentStep === 2 && (
        <StepPackages
          formData={formData}
          packages={packages}
          onChange={updateForm}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}

      {currentStep === 3 && (
        <StepCustomizations
          formData={formData}
          packageConfig={packageConfig}
          configLoading={configLoading}
          onChange={updateForm}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}

      {currentStep === 4 && (
        <StepAddons
          formData={formData}
          packageConfig={packageConfig}
          configLoading={configLoading}
          previewResult={previewResult}
          previewLoading={previewLoading}
          onChange={updateForm}
          onNext={() => goToStep(5)}
          onBack={prevStep}
        />
      )}

      {currentStep === 5 && !estimateResult && (
        <StepLeadCapture
          formData={formData}
          locations={locations}
          calculating={calculating}
          stepErrors={stepErrors}
          error={error}
          onChange={updateForm}
          onSubmit={calculate}
          onBack={() => goToStep(4)}
        />
      )}

      {estimateResult && (
        <StepEstimateReport result={estimateResult} onReset={reset} />
      )}
    </div>
  );
}
