'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import { useState, useEffect, useCallback, useRef } from 'react';
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
  floorsStepSchema,
  packageStepSchema,
  leadCaptureStepSchema,
} from './schema';

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
    if (!formData.packageSlug) return;
    let mounted = true;
    setConfigLoading(true);
    getPackageConfig(formData.packageSlug)
      .then((cfg) => {
        if (!mounted) return;
        setPackageConfig(cfg);
        setConfigLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Failed to fetch package configuration:', err);
        setConfigLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [formData.packageSlug]);

  // 3. Debounced running preview from backend (/preview)
  useEffect(() => {
    // Only query live preview if minimum dimensions and package are available
    if (
      !formData.plotLocation ||
      !formData.plotArea ||
      formData.plotArea <= 0 ||
      !formData.builtupAreaPerFloor ||
      formData.builtupAreaPerFloor <= 0 ||
      !formData.packageSlug
    ) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const previewPayload: CalculatorInput = {
          customerName: formData.customerName?.trim() || 'Preview User',
          customerPhone: formData.customerPhone?.trim() || '9999999999',
          customerEmail: formData.customerEmail?.trim() || 'preview@example.com',
          plotLocation: formData.plotLocation,
          locationId: formData.locationId,
          plotArea: formData.plotArea,
          plotAreaUnit: formData.plotAreaUnit,
          builtupAreaPerFloor: formData.builtupAreaPerFloor,
          builtupAreaUnit: formData.builtupAreaUnit || 'sqft',
          carParkingAreaSqft: formData.carParkingAreaSqft ?? 0,
          carCount: formData.carCount ?? 1,
          floorCount: formData.floorCount ?? 0,
          floorBreakdown: formData.floorBreakdown,
          headRoomAreaSqft: formData.headRoomAreaSqft ?? 0,
          packageSlug: formData.packageSlug,
          customizations: formData.customizations || [],
          addons: formData.addons || [],
        };

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
  }, [
    formData.plotLocation,
    formData.locationId,
    formData.plotArea,
    formData.plotAreaUnit,
    formData.builtupAreaPerFloor,
    formData.builtupAreaUnit,
    formData.carParkingAreaSqft,
    formData.carCount,
    formData.floorCount,
    formData.floorBreakdown,
    formData.headRoomAreaSqft,
    formData.packageSlug,
    formData.customizations,
    formData.addons,
    formData.customerName,
    formData.customerPhone,
    formData.customerEmail,
  ]);

  const updateForm = useCallback((fields: Partial<EstimateFormState>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
    setStepErrors({});
  }, []);

  const validateCurrentStep = useCallback((): boolean => {
    setStepErrors({});
    let result;
    if (currentStep === 0) {
      result = dimensionsStepSchema.safeParse({
        plotLocation: formData.plotLocation,
        locationId: formData.locationId,
        plotArea: formData.plotArea,
        plotAreaUnit: formData.plotAreaUnit,
        builtupAreaPerFloor: formData.builtupAreaPerFloor,
        builtupAreaUnit: formData.builtupAreaUnit || 'sqft',
        carParkingAreaSqft: formData.carParkingAreaSqft,
        carCount: formData.carCount,
      });
    } else if (currentStep === 1) {
      result = floorsStepSchema.safeParse({
        floorCount: formData.floorCount,
        floorBreakdown: formData.floorBreakdown,
        headRoomAreaSqft: formData.headRoomAreaSqft,
      });
    } else if (currentStep === 2) {
      result = packageStepSchema.safeParse({
        packageSlug: formData.packageSlug,
      });
    } else if (currentStep === 4) {
      result = leadCaptureStepSchema.safeParse({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
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
      setCurrentStep((prev) => Math.min(5, prev + 1));
      setError(null);
    }
  }, [validateCurrentStep]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    setError(null);
    setStepErrors({});
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step <= 5) {
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
      const result = await createEstimate(formData);
      setEstimateResult(result);
      setCurrentStep(5);
      setCalculating(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Calculation error occurred.';
      setError(message);
      setCalculating(false);
    }
  }, [formData, validateCurrentStep]);

  const reset = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
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
