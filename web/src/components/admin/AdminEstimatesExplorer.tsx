'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  Download,
  Loader2,
  FileSpreadsheet,
  Building2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { getAdminEstimates, AdminEstimate } from '@/lib/api/admin';
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
  { label: 'No Limit (100)', value: 100 },
];

export function AdminEstimatesExplorer() {
  const [estimates, setEstimates] = useState<AdminEstimate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [packageFilter, setPackageFilter] = useState<string>('ALL');

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchEstimates = (targetPage = page, targetLimit = limit) => {
    setLoading(true);
    getAdminEstimates({
      page: targetPage,
      limit: targetLimit,
      packageSlug: packageFilter === 'ALL' ? undefined : packageFilter,
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
  }, [packageFilter, limit]);

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

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalRecords);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Estimates Explorer</h2>
          <p className="text-xs text-muted">
            Browse, inspect snapshots, and download verified PDF estimates
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

      {/* Filter Tabs */}
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
                  <th className="p-3.5 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {estimates.map((est) => (
                  <tr key={est.id} className="hover:bg-surface transition-colors">
                    <td className="p-3.5 font-mono font-bold text-foreground">
                      {est.estimateNumber}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{est.customerName}</div>
                      <div className="text-[11px] text-muted">{est.plotLocation} • {est.customerPhone}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="capitalize font-semibold">{est.packageSlug}</span>
                    </td>
                    <td className="p-3.5 font-mono">
                      {est.totalBuiltupAreaSqft} sq.ft
                    </td>
                    <td className="p-3.5 font-mono font-bold">
                      {formatINR(est.totalProjectCost)}
                    </td>
                    <td className="p-3.5 text-right">
                      <a
                        href={getEstimatePdfUrl(est.estimateNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button button--ghost p-1.5 inline-flex items-center gap-1 text-[11px]"
                        title="Download PDF"
                      >
                        <Download size={13} />
                        <span>PDF</span>
                      </a>
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
    </div>
  );
}
