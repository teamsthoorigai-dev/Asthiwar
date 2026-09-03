'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getLocations,
  getPackages,
  getPackageConfig,
  previewEstimate,
  createEstimate,
} from '@/lib/api/calculator';
import type {
  LocationItem,
  PackageItem,
  PackageConfigResponse,
  EstimateFormState,
  CalculationResult,
  CalculatorInput,
} from './types';
import { INITIAL_FORM_STATE } from './index';
import {
  dimensionsStepSchema,
  packageStepSchema,
  leadCaptureStepSchema,
} from './schema';

/** Step 0 dimensions → 1 package → 2 customise → 3 add-ons → 4 contact details. */
export const LAST_FORM_STEP = 4;

/** Builds the API payload from the wizard state. */
function buildPayload(formData: EstimateFormState): CalculatorInput {
  return {
    ...formData,
    builtupAreaUnit: formData.builtupAreaUnit || 'sqft',
    carParkingAreaSqft: formData.carParkingAreaSqft ?? 0,
    carCount: formData.carCount ?? 1,
    floorCount: formData.floorCount ?? 0,
    headRoomAreaSqft: formData.headRoomAreaSqft ?? 0,
    customizations: formData.customizations || [],
    addons: formData.addons || [],
  };
}

export function useCalculatorWizard() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<EstimateFormState>(INITIAL_FORM_STATE);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [packageConfig, setPackageConfig] = useState<PackageConfigResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [configLoading, setConfigLoading] = useState<boolean>(false);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [estimateResult, setEstimateResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Running preview states
  const [previewResult, setPreviewResult] = useState<CalculationResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // 1. Initial load of locations and packages
  useEffect(() => {
    let mounted = true;
    Promise.all([getLocations(), getPackages()])
      .then(([locs, pkgs]) => {
        if (!mounted) return;
        setLocations(locs);
        setPackages(pkgs);
        if (locs.length > 0) {
          setFormData((prev) => ({
            ...prev,
            plotLocation: prev.plotLocation || locs[0].name,
            locationId: prev.locationId || locs[0].id,
          }));
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Failed to load calculator metadata:', err);
        setError('Unable to load location pricing and package rates from the backend.');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Load package configurations (specs & addons) when package selection changes
  useEffect(() => {
    const packageSlug = formData.packageSlug;
    if (!packageSlug) return;
    let mounted = true;

    const loadConfig = async () => {
      setConfigLoading(true);
      try {
        const cfg = await getPackageConfig(packageSlug);
        if (mounted) setPackageConfig(cfg);
      } catch (err) {
        console.error('Failed to fetch package configuration:', err);
      } finally {
        if (mounted) setConfigLoading(false);
      }
    };

    void loadConfig();

    return () => {
      mounted = false;
    };
  }, [formData.packageSlug]);

  // The running preview only needs the priced fields — contact details are placeholders.
  const previewPayload = useMemo<CalculatorInput | null>(() => {
    if (
      !formData.plotLocation ||
      !formData.plotArea ||
      formData.plotArea <= 0 ||
      !formData.builtupAreaPerFloor ||
      formData.builtupAreaPerFloor <= 0 ||
      !formData.packageSlug
    ) {
      return null;
    }

    return {
      ...buildPayload(formData),
      customerName: formData.customerName?.trim() || 'Preview User',
      customerPhone: formData.customerPhone?.trim() || '9999999999',
      customerEmail: formData.customerEmail?.trim() || 'preview@example.com',
    };
  }, [formData]);

  // 3. Debounced running preview from backend (/preview)
  useEffect(() => {
    if (!previewPayload) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const result = await previewEstimate(previewPayload, { signal: controller.signal });
        setPreviewResult(result);
        setPreviewError(null);
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
          return;
        }
        console.warn('Preview estimate error:', err);
        setPreviewError('Unable to update live running preview.');
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [previewPayload]);

  const updateForm = useCallback((fields: Partial<EstimateFormState>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
    setStepErrors({});
  }, []);

  const validateCurrentStep = useCallback((): boolean => {
    setStepErrors({});
    let result;
    if (currentStep === 0) {
      result = dimensionsStepSchema.safeParse({
        plotArea: formData.plotArea,
        plotAreaUnit: formData.plotAreaUnit,
        floorCount: formData.floorCount,
        builtupAreaPerFloor: formData.builtupAreaPerFloor,
        builtupAreaUnit: formData.builtupAreaUnit || 'sqft',
        floorBreakdown: formData.isVariableArea ? formData.floorBreakdown : undefined,
        carParkingAreaSqft: formData.carParkingAreaSqft,
        headRoomAreaSqft: formData.headRoomAreaSqft,
      });
    } else if (currentStep === 1) {
      result = packageStepSchema.safeParse({
        packageSlug: formData.packageSlug,
      });
    } else if (currentStep === LAST_FORM_STEP) {
      result = leadCaptureStepSchema.safeParse({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        plotLocation: formData.plotLocation,
      });
    }

    if (result && !result.success) {
      const errMap: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        errMap[fieldName] = issue.message;
      });
      setStepErrors(errMap);
      return false;
    }

    return true;
  }, [currentStep, formData]);

  const nextStep = useCallback(() => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(LAST_FORM_STEP, prev + 1));
      setError(null);
    }
  }, [validateCurrentStep]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    setError(null);
    setStepErrors({});
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step <= LAST_FORM_STEP) {
      setCurrentStep(step);
      setError(null);
      setStepErrors({});
    }
  }, []);

  const calculate = useCallback(async () => {
    if (!validateCurrentStep()) return;
    setCalculating(true);
    setError(null);

    try {
      const result = await createEstimate(buildPayload(formData));
      setEstimateResult(result);
      setCalculating(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Calculation error occurred.';
      setError(message);
      setCalculating(false);
    }
  }, [formData, validateCurrentStep]);

  const reset = useCallback(() => {
    setFormData((prev) => ({
      ...INITIAL_FORM_STATE,
      plotLocation: prev.plotLocation,
      locationId: prev.locationId,
    }));
    setEstimateResult(null);
    setPreviewResult(null);
    setCurrentStep(0);
    setError(null);
    setStepErrors({});
  }, []);

  return {
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
  };
}
