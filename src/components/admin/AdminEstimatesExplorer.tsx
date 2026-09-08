'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  Download,
  Loader2,
  FileSpreadsheet,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sliders,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Wrench,
  CheckSquare,
  Building,
} from 'lucide-react';
import {
  getAdminEstimates,
  getAdminEstimateById,
  updateAdminEstimate,
  sendEstimateNotification,
  AdminEstimate,
  AdminEstimateDetail,
  EstimateStatus,
} from '@/lib/api/admin';
import { getEstimatePdfUrl } from '@/lib/api/calculator';

function formatINR(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

const PAGE_LIMIT_OPTIONS = [
  { label: '5 per page', value: 5 },
  { label: '10 per page', value: 10 },
  { label: '25 per page', value: 25 },
  { label: '50 per page', value: 50 },
];

const STATUS_FILTERS = [
  { label: 'ALL STATUS', value: 'ALL' },
  { label: 'DRAFT', value: 'DRAFT' },
  { label: 'GENERATED', value: 'GENERATED' },
  { label: 'DOWNLOADED', value: 'DOWNLOADED' },
  { label: 'SENT', value: 'SENT' },
];

export function AdminEstimatesExplorer() {
  const [estimates, setEstimates] = useState<AdminEstimate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [packageFilter, setPackageFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Estimate Detail Drawer State
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
  const [estimateDetail, setEstimateDetail] = useState<AdminEstimateDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sendingQuotation, setSendingQuotation] = useState<boolean>(false);

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  const fetchEstimates = (targetPage = page, targetLimit = limit) => {
    setLoading(true);
    getAdminEstimates({
      page: targetPage,
      limit: targetLimit,
      packageSlug: packageFilter === 'ALL' ? undefined : packageFilter,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      search: search || undefined,
    })
      .then((res) => {
        setEstimates(res.items || []);
        if (res.pagination) {
          setTotalRecords(res.pagination.total);
          setTotalPages(Math.max(1, res.pagination.totalPages));
          setPage(res.pagination.page);
        } else {
          setTotalRecords(res.items?.length || 0);
          setTotalPages(1);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    setPage(1);
    fetchEstimates(1, limit);
  }, [packageFilter, statusFilter, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEstimates(1, limit);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    fetchEstimates(newPage, limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleSelectEstimate = async (id: string) => {
    setSelectedEstimateId(id);
    setLoadingDetail(true);
    try {
      const detail = await getAdminEstimateById(id);
      setEstimateDetail(detail);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Failed to load estimate full breakdown');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: EstimateStatus) => {
    try {
      await updateAdminEstimate(id, { status: newStatus });
      showAlert('success', `Estimate status updated to ${newStatus}`);
      fetchEstimates(page, limit);
      if (estimateDetail && estimateDetail.id === id) {
        setEstimateDetail({ ...estimateDetail, status: newStatus });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      showAlert('error', msg);
    }
  };

  const handleSendQuotation = async (id: string) => {
    setSendingQuotation(true);
    try {
      await sendEstimateNotification(id, ['EMAIL', 'WHATSAPP']);
      showAlert('success', 'Quotation dispatched to customer via Email & WhatsApp');
      // Update estimate status to SENT
      await updateAdminEstimate(id, { status: 'SENT' });
      fetchEstimates(page, limit);
      if (estimateDetail && estimateDetail.id === id) {
        setEstimateDetail({ ...estimateDetail, status: 'SENT' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dispatch quotation';
      showAlert('error', msg);
    } finally {
      setSendingQuotation(false);
    }
  };

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalRecords);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'DOWNLOADED':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'GENERATED':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-surface-active text-muted border-border';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Estimates Explorer</h2>
          <p className="text-xs text-muted">
            Inspect line-item calculation breakdowns, floor schedules, client specs, and dispatch official quotations
          </p>
        </div>

        {/* Search Bar & Page Limit Select */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:w-56">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search estimate #, client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-9 text-xs py-1.5"
              />
            </div>
            <button type="submit" className="button button--solid text-xs py-1.5 px-3">
              Search
            </button>
          </form>

          {/* Page Records Filter Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0 bg-surface border border-border rounded px-2.5 py-1">
            <Sliders size={12} className="text-muted" />
            <select
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-foreground cursor-pointer focus:outline-none"
            >
              {PAGE_LIMIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface text-foreground">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {alertMsg && (
        <div
          className={`p-3 rounded border text-xs flex items-center gap-2 ${
            alertMsg.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {alertMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Filter Tabs (Package and Status) */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['ALL', 'basic', 'standard', 'premium', 'luxury'].map((pkg) => (
            <button
              key={pkg}
              type="button"
              onClick={() => setPackageFilter(pkg)}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                packageFilter === pkg
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-surface border border-border text-muted hover:text-foreground'
              }`}
            >
              {pkg === 'ALL' ? 'All Packages' : `${pkg} Package`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setStatusFilter(st.value)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                statusFilter === st.value
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-surface border border-border text-muted hover:text-foreground'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Estimates Table */}
      {loading ? (
        <div className="py-20 text-center calculator-card">
          <Loader2 className="w-8 h-8 animate-spin text-muted mx-auto mb-2" />
          <p className="text-xs text-muted">Fetching calculation snapshots...</p>
        </div>
      ) : estimates.length === 0 ? (
        <div className="py-20 text-center calculator-card">
          <FileSpreadsheet className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
          <p className="text-xs text-muted">No estimate snapshots found matching query.</p>
        </div>
      ) : (
        <div className="calculator-card overflow-hidden space-y-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-active text-muted uppercase font-bold text-[10px] tracking-wider">
                  <th className="p-3.5">Estimate Ref</th>
                  <th className="p-3.5">Client & Site</th>
                  <th className="p-3.5">Package</th>
                  <th className="p-3.5">Area</th>
                  <th className="p-3.5">Total Cost</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {estimates.map((est) => (
                  <tr
                    key={est.id}
                    onClick={() => handleSelectEstimate(est.id)}
                    className="hover:bg-surface transition-colors cursor-pointer"
                  >
                    <td className="p-3.5 font-mono font-bold text-foreground">
                      {est.estimateNumber}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{est.customerName}</div>
                      <div className="text-[11px] text-muted font-mono">
                        {est.plotLocation} • {est.customerPhone}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="capitalize font-semibold">{est.packageSlug}</span>
                    </td>
                    <td className="p-3.5 font-mono">
                      {est.totalBuiltupAreaSqft} sq.ft
                    </td>
                    <td className="p-3.5 font-mono font-bold text-foreground">
                      {formatINR(est.totalProjectCost)}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getStatusBadge(
                          est.status || 'GENERATED'
                        )}`}
                      >
                        {est.status || 'GENERATED'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={getEstimatePdfUrl(est.estimateNumber)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="button button--ghost p-1.5 inline-flex items-center gap-1 text-[11px]"
                          title="Download Verified PDF"
                        >
                          <Download size={13} />
                          <span>PDF</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Navigation Footer */}
          {totalRecords > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-border text-xs text-muted bg-surface/40">
              <div>
                Showing <strong className="text-foreground">{startRecord}</strong> to{' '}
                <strong className="text-foreground">{endRecord}</strong> of{' '}
                <strong className="text-foreground">{totalRecords}</strong> records
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="px-2.5 py-1.5 rounded border border-border bg-surface text-foreground disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 hover:bg-surface-active transition-colors text-xs font-bold"
                >
                  <ChevronLeft size={13} />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && p - prev > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <span className="px-1 text-muted">...</span>}
                          <button
                            type="button"
                            onClick={() => handlePageChange(p)}
                            className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                              page === p
                                ? 'bg-foreground text-background font-mono'
                                : 'border border-border bg-surface text-foreground hover:bg-surface-active'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="px-2.5 py-1.5 rounded border border-border bg-surface text-foreground disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 hover:bg-surface-active transition-colors text-xs font-bold"
                >
                  <span>Next</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ESTIMATE DETAIL SLIDE-OVER DRAWER */}
      {selectedEstimateId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-surface border-l border-border h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold text-foreground">
                    {estimateDetail?.estimateNumber || 'Loading...'}
                  </span>
                  {estimateDetail?.status && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                        estimateDetail.status
                      )}`}
                    >
                      {estimateDetail.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Complete construction calculation snapshot & material specifications
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedEstimateId(null);
                  setEstimateDetail(null);
                }}
                className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-active transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {loadingDetail || !estimateDetail ? (
              <div className="py-24 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted mx-auto mb-2" />
                <p className="text-xs text-muted">Loading calculation breakdown...</p>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Action Bar (Status Update & Notify) */}
                <div className="p-3.5 rounded border border-border bg-surface-active/40 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-muted">Status:</span>
                    <select
                      className="form-select text-xs py-1"
                      value={estimateDetail.status}
                      onChange={(e) => handleStatusChange(estimateDetail.id, e.target.value as EstimateStatus)}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="GENERATED">Generated</option>
                      <option value="DOWNLOADED">Downloaded</option>
                      <option value="SENT">Sent to Customer</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={sendingQuotation}
                      onClick={() => handleSendQuotation(estimateDetail.id)}
                      className="button button--solid text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Send size={12} />
                      <span>{sendingQuotation ? 'Dispatching...' : 'Email & WhatsApp Quote'}</span>
                    </button>

                    <a
                      href={getEstimatePdfUrl(estimateDetail.estimateNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button--ghost text-xs py-1.5 px-3 inline-flex items-center gap-1"
                    >
                      <Download size={12} />
                      <span>PDF</span>
                    </a>
                  </div>
                </div>

                {/* Client & Dimensions Card */}
                <div className="calculator-card p-4 space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-muted border-b border-border pb-1.5">
                    1. Client & Site Dimensions
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-muted block">Client Name</span>
                      <span className="font-bold text-foreground">{estimateDetail.customerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block">Phone</span>
                      <span className="font-mono text-foreground">{estimateDetail.customerPhone}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block">City / Site</span>
                      <span className="text-foreground">{estimateDetail.plotLocation}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block">Plot Area</span>
                      <span className="font-mono text-foreground">
                        {estimateDetail.plotAreaSqft} {estimateDetail.plotAreaUnit || 'sqft'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block">Elevation / Floors</span>
                      <span className="font-semibold text-foreground">
                        {estimateDetail.floorCount} ({estimateDetail.numberOfFloors} floors)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block">Total Built-up Area</span>
                      <span className="font-mono font-bold text-foreground">
                        {estimateDetail.totalBuiltupAreaSqft} sq.ft
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary Card */}
                <div className="calculator-card p-4 space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-muted border-b border-border pb-1.5">
                    2. Cost & Budget Breakdown
                  </h3>
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted">
                        Base Construction ({estimateDetail.packageSlug.toUpperCase()} @ ₹{estimateDetail.packageRatePerSqft}/sqft):
                      </span>
                      <span className="font-bold text-foreground">{formatINR(estimateDetail.baseConstructionCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Brand Customization Upgrades:</span>
                      <span className="font-bold text-foreground">+{formatINR(estimateDetail.upgradesCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Selected Add-ons & Utility Systems:</span>
                      <span className="font-bold text-foreground">+{formatINR(estimateDetail.addonsCost)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border">
                      <span className="text-muted">Subtotal:</span>
                      <span className="font-bold text-foreground">{formatINR(estimateDetail.subtotalCost)}</span>
                    </div>
                    <div className="flex justify-between text-muted text-[11px]">
                      <span>GST ({estimateDetail.gstPercentage || 0}%):</span>
                      <span>+{formatINR(estimateDetail.gstAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border text-sm font-extrabold text-foreground">
                      <span>Total Project Cost:</span>
                      <span className="text-primary">{formatINR(estimateDetail.totalProjectCost)}</span>
                    </div>
                  </div>
                </div>

                {/* Customized Items Specifications */}
                {estimateDetail.items && estimateDetail.items.length > 0 && (
                  <div className="calculator-card p-4 space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted border-b border-border pb-1.5 flex items-center gap-1.5">
                      <Layers size={13} /> 3. Selected Material Customizations ({estimateDetail.items.length})
                    </h3>
                    <div className="space-y-2">
                      {estimateDetail.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded bg-surface border border-border flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-foreground block">{item.itemName}</span>
                            <span className="text-[11px] text-muted font-mono">{item.selectedOptionName}</span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="font-bold text-foreground">+{formatINR(item.calculatedPrice)}</span>
                            {Number(item.unitPriceDelta) > 0 && (
                              <span className="text-[10px] text-muted block">
                                (+₹{item.unitPriceDelta}/sqft)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Add-ons */}
                {estimateDetail.addons && estimateDetail.addons.length > 0 && (
                  <div className="calculator-card p-4 space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted border-b border-border pb-1.5 flex items-center gap-1.5">
                      <Wrench size={13} /> 4. Selected Add-ons & Utilities ({estimateDetail.addons.length})
                    </h3>
                    <div className="space-y-2">
                      {estimateDetail.addons.map((addon) => (
                        <div
                          key={addon.id}
                          className="p-2 rounded bg-surface border border-border flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-foreground block">{addon.addonName}</span>
                            <span className="text-[11px] text-muted">
                              Variant: {addon.selectedVariant} • {addon.quantity} {addon.unit}
                            </span>
                          </div>
                          <div className="text-right font-mono font-bold text-foreground">
                            {formatINR(addon.totalPrice)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Milestone Schedule Snapshot */}
                {estimateDetail.milestoneBreakdownJson && (
                  <div className="calculator-card p-4 space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted border-b border-border pb-1.5 flex items-center gap-1.5">
                      <CheckSquare size={13} /> 5. 10-Stage Milestone Payment Schedule
                    </h3>
                    <div className="space-y-1.5">
                      {(Array.isArray(estimateDetail.milestoneBreakdownJson)
                        ? estimateDetail.milestoneBreakdownJson
                        : []
                      ).map((m: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-surface border border-border flex items-center justify-between text-[11px]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-surface-active font-mono font-bold flex items-center justify-center text-[10px]">
                              {m.stageNumber || idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-foreground">{m.stageName}</span>
                              {m.keyDeliverables && (
                                <span className="text-muted block text-[10px] truncate max-w-xs">
                                  {m.keyDeliverables}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="font-bold text-foreground block">
                              {formatINR(m.stageAmount || m.amount)}
                            </span>
                            <span className="text-[10px] text-muted">{m.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
