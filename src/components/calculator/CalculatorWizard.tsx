'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Ruler,
  Package as PackageIcon,
  SlidersHorizontal,
  Sparkles,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useCalculatorWizard, LAST_FORM_STEP } from '@/lib/calculator/useCalculatorWizard';
import { getLenis } from '@/lib/lenis';
import { StepDimensions } from './StepDimensions';
import { StepPackages } from './StepPackages';
import { StepCustomizations } from './StepCustomizations';
import { StepAddons } from './StepAddons';
import { StepLeadCapture } from './StepLeadCapture';
import { StepEstimateReport } from './StepEstimateReport';
import './calculator.css';

const STEP_TABS = [
  { step: 0, label: 'Dimensions', icon: Ruler },
  { step: 1, label: 'Package', icon: PackageIcon },
  { step: 2, label: 'Customise', icon: SlidersHorizontal },
  { step: 3, label: 'Add-Ons', icon: Sparkles },
  { step: 4, label: 'Details', icon: User },
];

export function CalculatorWizard() {
  const wizardRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

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

  const scrollToWizardTop = useCallback((immediate = true) => {
    const el = wizardRef.current || document.getElementById('cost-calculator');
    if (!el) {
      window.scrollTo({ top: 0, behavior: immediate ? 'instant' : 'smooth' });
      return;
    }

    const rect = el.getBoundingClientRect();
    const currentY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const targetY = Math.max(0, rect.top + currentY - 90);

    const lenis = getLenis();
    if (lenis) {
      lenis.resize();
      lenis.scrollTo(targetY, { immediate, force: true });
    }
    window.scrollTo({
      top: targetY,
      behavior: immediate ? 'instant' : 'smooth',
    });
  }, []);

  const handleNextStep = useCallback(() => {
    const ok = nextStep();
    if (ok) {
      scrollToWizardTop(true);
    }
  }, [nextStep, scrollToWizardTop]);

  const handlePrevStep = useCallback(() => {
    prevStep();
    scrollToWizardTop(true);
  }, [prevStep, scrollToWizardTop]);

  const handleGoToStep = useCallback((step: number) => {
    goToStep(step);
    scrollToWizardTop(true);
  }, [goToStep, scrollToWizardTop]);

  const handleReset = useCallback(() => {
    reset();
    scrollToWizardTop(true);
  }, [reset, scrollToWizardTop]);

  const prevStepRef = useRef(currentStep);
  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      prevStepRef.current = currentStep;
      scrollToWizardTop(true);
    }
  }, [currentStep, scrollToWizardTop]);

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
    <div ref={wizardRef} className="calculator-wizard max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Stepper Progress Tabs */}
      {!estimateResult && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center">
            {STEP_TABS.map((s) => {
              const Icon = s.icon;
              const isCompleted = currentStep > s.step;
              const isActive = currentStep === s.step;

              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    if (isCompleted) handleGoToStep(s.step);
                  }}
                  disabled={!isCompleted && !isActive}
                  className="calculator-step-tab flex flex-col items-center group cursor-pointer disabled:cursor-not-allowed transition-all min-w-0"
                  data-active={isActive || undefined}
                  data-completed={isCompleted || undefined}
                >
                  <div
                    className={`calculator-step-tab__icon w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1 ${
                      isCompleted
                        ? 'bg-foreground text-background font-bold shadow-sm'
                        : isActive
                        ? 'bg-surface-active border-2 border-foreground text-foreground font-bold'
                        : 'bg-surface text-muted border border-border'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span
                    className={`text-[9px] sm:text-[11px] leading-tight block truncate max-w-full ${
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
              style={{ width: `${((currentStep + 1) / STEP_TABS.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && !calculating && !estimateResult && (
        <div className="mb-6 p-4 rounded border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 max-w-xl mx-auto">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {previewError && !error && currentStep >= 1 && !estimateResult && (
        <div className="mb-4 text-center text-xs text-muted">
          <span>{previewError}</span>
        </div>
      )}

      {/* Step Renderings */}
      {!estimateResult && currentStep === 0 && (
        <StepDimensions
          formData={formData}
          stepErrors={stepErrors}
          onChange={updateForm}
          onNext={handleNextStep}
        />
      )}

      {!estimateResult && currentStep === 1 && (
        <StepPackages
          formData={formData}
          packages={packages}
          previewResult={previewResult}
          onChange={updateForm}
          onNext={handleNextStep}
          onBack={handlePrevStep}
        />
      )}

      {!estimateResult && currentStep === 2 && (
        <StepCustomizations
          formData={formData}
          packageConfig={packageConfig}
          configLoading={configLoading}
          previewResult={previewResult}
          previewLoading={previewLoading}
          previewError={previewError}
          onChange={updateForm}
          onNext={handleNextStep}
          onBack={handlePrevStep}
        />
      )}

      {!estimateResult && currentStep === 3 && (
        <StepAddons
          formData={formData}
          packageConfig={packageConfig}
          configLoading={configLoading}
          previewResult={previewResult}
          previewLoading={previewLoading}
          onChange={updateForm}
          onNext={handleNextStep}
          onBack={handlePrevStep}
        />
      )}

      {!estimateResult && currentStep === LAST_FORM_STEP && (
        <StepLeadCapture
          formData={formData}
          locations={locations}
          calculating={calculating}
          stepErrors={stepErrors}
          error={error}
          onChange={updateForm}
          onSubmit={calculate}
          onBack={handlePrevStep}
        />
      )}

      {estimateResult && (
        <StepEstimateReport result={estimateResult} onReset={handleReset} />
      )}
    </div>
  );
}
