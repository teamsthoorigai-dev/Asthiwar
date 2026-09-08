'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import React, { useState } from 'react';
import {
  Download,
  Share2,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Clock,
  Sparkles,
  Calculator,
  Shield,
  Phone,
  Mail,
  User,
  MapPin,
  Check,
} from 'lucide-react';
import type { CalculationResult } from '@/lib/calculator/types';
import { getEstimatePdfUrl } from '@/lib/api/calculator';
import { submitEnquiry } from '@/lib/api/enquiries';

interface StepEstimateReportProps {
  result: CalculationResult;
  onReset: () => void;
}

function formatINR(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function StepEstimateReport({ result, onReset }: StepEstimateReportProps) {
  const breakdown = result.breakdown;
  const customer = result.customer;
  const dimensions = result.dimensions;
  const pkg = result.package;
  const milestones = result.milestones || [];

  const totalCost = Number(breakdown?.totalProjectCost || 0);
  const builtupArea = Number(dimensions?.totalBuiltupAreaSqft || 0);
  const effectiveRate = Number(
    breakdown?.effectiveTotalCostPerSqft ||
      pkg?.effectiveRatePerSqft ||
      (builtupArea > 0 ? totalCost / builtupArea : 0)
  );

  // EMI Calculator State
  const [loanPercent, setLoanPercent] = useState<number>(80);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);

  // Lead Booking Modal State
  const [showConsultModal, setShowConsultModal] = useState<boolean>(false);
  const [preferredTime, setPreferredTime] = useState<string>('Morning (9 AM - 12 PM)');
  const [notes, setNotes] = useState<string>('');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Compute EMI
  const loanAmount = (totalCost * loanPercent) / 100;
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  const emi =
    loanAmount > 0 && monthlyRate > 0
      ? Math.round(
          (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1)
        )
      : 0;

  const handleBookConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setSubmitting(true);
    try {
      await submitEnquiry({
        fullName: customer.name,
        phone: customer.phone,
        email: customer.email || undefined,
        plotLocation: customer.location,
        estimateNumber: result.estimateNumber,
        preferredContactTime: preferredTime,
        requirementNotes: notes || 'Booked site assessment via web calculator report',
      });
      setBookingSuccess(true);
      setSubmitting(false);
    } catch (err) {
      console.error('Enquiry submission failed:', err);
      setSubmitting(false);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `ASTHIWAR Construction Estimate (${result.estimateNumber || 'Ref'})\nTotal Cost: ${formatINR(
        totalCost
      )}\nBuilt-up Area: ${builtupArea} sq.ft\nLocation: ${customer?.location || 'Tamil Nadu'}\nVerified PDF: ${window.location.origin}/api/v1/calculator/estimate/${result.estimateNumber}/pdf`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const pdfDownloadUrl = getEstimatePdfUrl(result.estimateNumber);

  return (
    <div className="calculator-report animate-fade-in space-y-6">
      {/* Top Banner Card */}
      <div className="calculator-card p-6 border-foreground/30 bg-surface">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted/20 text-foreground">
                <Sparkles size={12} aria-hidden="true" /> Authoritative Snapshot
              </span>
              <span className="text-xs tabular-nums text-muted">
                {result.estimateNumber || 'EST-SNAPSHOT'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight">
              {formatINR(totalCost)}
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Estimated Total Investment • Effective Rate:{' '}
              <strong className="text-foreground tabular-nums">
                {formatINR(effectiveRate)} / Sq.Ft
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <a
              href={pdfDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button button--solid flex items-center gap-2 text-xs py-2.5 px-4"
            >
              <Download size={15} aria-hidden="true" />
              <span>Download PDF</span>
            </a>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="button button--ghost flex items-center gap-2 text-xs py-2.5 px-4"
            >
              <Share2 size={15} aria-hidden="true" />
              <span>Share WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setShowConsultModal(true)}
              className="button button--solid flex items-center gap-2 text-xs py-2.5 px-4"
            >
              <Calendar size={15} aria-hidden="true" />
              <span>Book Consultation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Grid (Customer, Package, Timeline) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="calculator-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
            Project & Site
          </div>
          <div className="text-sm font-bold">{customer?.name}</div>
          <div className="text-xs text-muted mt-0.5 flex items-center gap-1">
            <MapPin size={12} /> {customer?.location}
          </div>
          <div className="text-xs text-muted mt-2">
            Plot: <strong>{dimensions?.plotAreaSqft} sq.ft</strong> • Built-up:{' '}
            <strong>{dimensions?.totalBuiltupAreaSqft} sq.ft</strong>
          </div>
        </div>

        <div className="calculator-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
            Package Tier
          </div>
          <div className="text-sm font-bold">{pkg?.name} Specification</div>
          <div className="text-xs text-muted mt-0.5">{pkg?.tagline}</div>
          <div className="text-xs text-muted mt-2">
            Base Rate: <strong>₹{pkg?.baseRatePerSqft}/sq.ft</strong>
          </div>
        </div>

        <div className="calculator-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
            Estimated Timeline
          </div>
          <div className="text-sm font-bold flex items-center gap-1.5">
            <Clock size={15} />
            <span>{result.duration?.estimatedMonthsRange || '6 - 9 Months'}</span>
          </div>
          <div className="text-xs text-muted mt-0.5">
            From foundation mobilization to handover
          </div>
          <div className="text-xs text-muted mt-2">
            Phased across <strong>{milestones.length} milestones</strong>
          </div>
        </div>
      </div>

      {/* Cost Breakdown Table */}
      <div className="calculator-card p-5">
        <h2 className="text-base font-bold mb-4">Detailed Financial Breakdown</h2>
        <div className="space-y-2.5 text-xs sm:text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted">
              Base Civil & Structural Construction ({builtupArea} sq.ft @ ₹{pkg?.baseRatePerSqft}/sq.ft)
            </span>
            <span className="tabular-nums font-medium">
              {formatINR(breakdown?.baseConstructionCost)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted">
              Material & Brand Customizations ({result.customizations?.length || 0} upgrades)
            </span>
            <span className="tabular-nums font-medium">
              {formatINR(breakdown?.upgradesCost)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted">
              Specialized Add-Ons & Infrastructure ({result.addons?.length || 0} items)
            </span>
            <span className="tabular-nums font-medium">
              {formatINR(breakdown?.addonsCost)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border font-semibold">
            <span>Subtotal (Excl. Taxes)</span>
            <span className="tabular-nums">{formatINR(breakdown?.subtotalCost)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border text-muted">
            <span>GST ({breakdown?.gstPercentage || 18}%)</span>
            <span className="tabular-nums">{formatINR(breakdown?.gstAmount)}</span>
          </div>
          <div className="flex justify-between py-3 text-base sm:text-lg font-bold border-t-2 border-foreground">
            <span>Total Authoritative Project Cost</span>
            <span className="tabular-nums">{formatINR(breakdown?.totalProjectCost)}</span>
          </div>
        </div>
      </div>

      {/* Standard Exclusions & Disclaimers */}
      {result.disclaimers && result.disclaimers.length > 0 && (
        <div className="calculator-card p-5 bg-surface/50">
          <h3 className="text-xs uppercase tracking-wider text-muted font-bold mb-2">
            Standard Exclusions & Disclaimers
          </h3>
          <p className="text-[11px] text-muted mb-3">
            This estimate provides an indicative project budget based on the selected specifications. The following scope items are excluded from the base package rate and quoted separately during detailed planning:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted list-disc list-inside">
            {result.disclaimers.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Milestone Payment Schedule */}
      {milestones.length > 0 && (
        <div className="calculator-card p-5">
          <h2 className="text-base font-bold mb-3">Construction Milestone Payment Schedule</h2>
          <p className="text-xs text-muted mb-4">
            Payments are released strictly against site verification of completion milestones.
          </p>
          <div className="space-y-2.5">
            {milestones.map((m) => (
              <div
                key={m.stageNumber}
                className="p-3 rounded border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-surface-active tabular-nums font-bold flex items-center justify-center text-[11px] shrink-0">
                    {m.stageNumber}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{m.stageName}</div>
                    <div className="text-muted text-[11px]">{m.keyDeliverables}</div>
                  </div>
                </div>
                <div className="sm:text-right tabular-nums shrink-0">
                  <span className="text-muted text-[11px] mr-2">({m.percentage}%)</span>
                  <span className="font-bold text-foreground">{formatINR(m.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Construction Loan & EMI Estimator */}
      <div className="calculator-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator size={18} />
          <h2 className="text-base font-bold">Construction Loan & EMI Estimator</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="form-label" htmlFor="loan-percent">
              Loan Coverage: {loanPercent}% ({formatINR(loanAmount)})
            </label>
            <input
              id="loan-percent"
              type="range"
              min={10}
              max={90}
              step={5}
              value={loanPercent}
              onChange={(e) => setLoanPercent(Number(e.target.value))}
              className="w-full mt-1"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="interest-rate">
              Interest Rate: {interestRate}% p.a.
            </label>
            <input
              id="interest-rate"
              type="range"
              min={6}
              max={14}
              step={0.25}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full mt-1"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="tenure-years">
              Tenure: {tenureYears} Years
            </label>
            <input
              id="tenure-years"
              type="range"
              min={5}
              max={30}
              step={1}
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full mt-1"
            />
          </div>
        </div>

        <div className="p-3 rounded border border-border bg-surface flex items-center justify-between">
          <span className="text-xs font-semibold">Estimated Monthly EMI</span>
          <span className="text-xl font-bold tabular-nums">
            {formatINR(emi)}{' '}
            <span className="text-xs font-normal text-muted">/ month</span>
          </span>
        </div>
      </div>

      {/* Booking Consultation Modal / Dialog */}
      {showConsultModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="calculator-card max-w-lg w-full p-6 relative border-foreground shadow-2xl animate-fade-in">
            {bookingSuccess ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
                <h3 className="text-xl font-bold">Consultation Confirmed!</h3>
                <p className="text-xs text-muted">
                  Our principal architect will review your estimate snapshot{' '}
                  <strong className="text-foreground">{result.estimateNumber}</strong> and
                  call you during your preferred slot ({preferredTime}).
                </p>
                <button
                  type="button"
                  onClick={() => setShowConsultModal(false)}
                  className="button button--solid py-2 px-6 text-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookConsultation} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">Book Free Site Assessment</h3>
                  <button
                    type="button"
                    onClick={() => setShowConsultModal(false)}
                    className="text-muted hover:text-foreground text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-muted">
                  Schedule an on-site visit with our architectural and engineering team in{' '}
                  {customer?.location || 'Coimbatore'}.
                </p>

                <div className="form-group">
                  <label className="form-label text-xs" htmlFor="pref-time">
                    Preferred Time Slot
                  </label>
                  <select
                    id="pref-time"
                    className="form-select text-xs"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                  >
                    <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                    <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                    <option value="Evening (4 PM - 7 PM)">Evening (4 PM - 7 PM)</option>
                    <option value="Weekend (Saturday/Sunday)">Weekend (Saturday/Sunday)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs" htmlFor="notes">
                    Project Notes / Special Requirements
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="form-input text-xs"
                    placeholder="e.g. Seeking vastu consultation, specific courtyard orientation, or sustainable lime plaster..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConsultModal(false)}
                    className="button button--ghost text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="button button--solid text-xs py-2 px-5"
                  >
                    {submitting ? 'Submitting...' : 'Confirm Consultation Booking'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="p-4 rounded border border-border bg-surface flex items-center justify-between">
        <button
          type="button"
          onClick={onReset}
          className="button button--ghost flex items-center gap-2"
        >
          <RefreshCw size={16} aria-hidden="true" />
          <span>New Calculation</span>
        </button>
        <button
          type="button"
          onClick={() => setShowConsultModal(true)}
          className="button button--solid flex items-center gap-2"
        >
          <Calendar size={16} aria-hidden="true" />
          <span>Book Site Assessment</span>
        </button>
      </div>
    </div>
  );
}
