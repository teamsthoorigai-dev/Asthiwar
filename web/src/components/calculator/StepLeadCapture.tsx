'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import React from 'react';
import { User, Phone, Mail, MapPin, ArrowRight, ArrowLeft, Shield, Loader2 } from 'lucide-react';
import type { EstimateFormState, LocationItem } from '@/lib/calculator/types';

interface StepLeadCaptureProps {
  formData: EstimateFormState;
  locations: LocationItem[];
  calculating: boolean;
  stepErrors: Record<string, string>;
  error: string | null;
  onChange: (fields: Partial<EstimateFormState>) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function StepLeadCapture({
  formData,
  locations,
  calculating,
  stepErrors,
  error,
  onChange,
  onSubmit,
  onBack,
}: StepLeadCaptureProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="calculator-step animate-fade-in">
      <div className="calculator-step__header text-center">
        <span className="calculator-step__badge">Step 5 of 5 • Contact Details</span>
        <h2 className="calculator-step__title">Almost Done!</h2>
        <p className="calculator-step__intro">
          Enter your details to view your instant, 100% authoritative construction budget and
          milestone schedule.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="calculator-card space-y-5">
        {error && (
          <div className="p-3 rounded border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label flex items-center gap-1.5" htmlFor="customer-name">
            <User size={16} aria-hidden="true" />
            <span>Full Name</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            id="customer-name"
            type="text"
            required
            placeholder="e.g. Anand Sundaram"
            className="form-input"
            value={formData.customerName}
            onChange={(e) => onChange({ customerName: e.target.value })}
          />
          {stepErrors.customerName && (
            <p className="form-error">{stepErrors.customerName}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label flex items-center gap-1.5" htmlFor="customer-phone">
              <Phone size={16} aria-hidden="true" />
              <span>Mobile Number</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              id="customer-phone"
              type="tel"
              required
              maxLength={15}
              placeholder="10-digit mobile (e.g. 9876543210)"
              className="form-input"
              value={formData.customerPhone}
              onChange={(e) =>
                onChange({ customerPhone: e.target.value.replace(/[^\d+ -]/g, '') })
              }
            />
            {stepErrors.customerPhone && (
              <p className="form-error">{stepErrors.customerPhone}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-1.5" htmlFor="customer-email">
              <Mail size={16} aria-hidden="true" />
              <span>Email Address (Optional)</span>
            </label>
            <input
              id="customer-email"
              type="email"
              placeholder="name@example.com"
              className="form-input"
              value={formData.customerEmail}
              onChange={(e) => onChange({ customerEmail: e.target.value })}
            />
            {stepErrors.customerEmail && (
              <p className="form-error">{stepErrors.customerEmail}</p>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label flex items-center gap-1.5" htmlFor="summary-location">
            <MapPin size={16} aria-hidden="true" />
            <span>Plot Location (Tamil Nadu)</span>
            <span className="text-red-500">*</span>
          </label>
          <select
            id="summary-location"
            className="form-select"
            value={formData.plotLocation}
            onChange={(e) => {
              const loc = locations.find((l) => l.name === e.target.value);
              onChange({
                plotLocation: e.target.value,
                locationId: loc ? loc.id : undefined,
              });
            }}
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>
          {stepErrors.plotLocation && (
            <p className="form-error">{stepErrors.plotLocation}</p>
          )}
        </div>

        <div className="calculator-actions pt-4 border-t border-border flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={calculating}
            className="button button--ghost flex items-center gap-2"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back</span>
          </button>
          <button
            type="submit"
            disabled={calculating}
            className="button button--solid flex items-center gap-2"
          >
            {calculating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Computing Estimate...</span>
              </>
            ) : (
              <>
                <span>View Estimate</span>
                <ArrowRight size={16} aria-hidden="true" />
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-muted">
          <Shield size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span className="calculator-privacy-message">
            <strong className="calculator-privacy-emphasis">Your information</strong> is strictly
            protected and never shared with 3rd parties.
          </span>
        </div>
      </form>
    </div>
  );
}
