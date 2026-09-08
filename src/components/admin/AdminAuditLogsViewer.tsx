'use client';

import React, { useEffect, useState } from 'react';
import {
  ScrollText,
  Shield,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sliders,
  X,
  Code2,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { getAdminAuditLogs, AuditLogItem } from '@/lib/api/admin';

const EVENT_TYPE_FILTERS = [
  'ALL',
  'ADMIN_MUTATION',
  'CALCULATOR_SUBMISSION',
  'NOTIFICATION_DISPATCH',
  'ERROR',
  'WARN',
  'INFO',
];

const SEVERITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

const PAGE_LIMIT_OPTIONS = [
  { label: '10 per page', value: 10 },
  { label: '25 per page', value: 25 },
  { label: '50 per page', value: 50 },
];

export function AdminAuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchLogs = (targetPage = page, targetLimit = limit) => {
    setLoading(true);
    getAdminAuditLogs({
      page: targetPage,
      limit: targetLimit,
      eventType: eventTypeFilter,
      severity: severityFilter,
    })
      .then((res) => {
        setLogs(res.items || []);
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
    fetchLogs(1, limit);
  }, [eventTypeFilter, severityFilter, limit]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    fetchLogs(newPage, limit);
  };

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalRecords);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40 font-extrabold';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 font-bold';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-surface-active text-muted border-border';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Security & Audit Activity Logs</h2>
          <p className="text-xs text-muted">
            Immutable records of price mutations, administrative actions, system exceptions, and API transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchLogs(page, limit)}
            className="button button--ghost text-xs py-1.5 px-3 flex items-center gap-1"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>

          <div className="flex items-center gap-1.5 bg-surface border border-border rounded px-2.5 py-1">
            <Sliders size={12} className="text-muted" />
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
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
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {EVENT_TYPE_FILTERS.map((ev) => (
            <button
              key={ev}
              type="button"
              onClick={() => setEventTypeFilter(ev)}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                eventTypeFilter === ev
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-surface border border-border text-muted hover:text-foreground'
              }`}
            >
              {ev === 'ALL' ? 'All Event Types' : ev.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {SEVERITY_FILTERS.map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                severityFilter === sev
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-surface border border-border text-muted hover:text-foreground'
              }`}
            >
              {sev === 'ALL' ? 'All Severity' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      {loading ? (
        <div className="py-20 text-center calculator-card">
          <Loader2 className="w-8 h-8 animate-spin text-muted mx-auto mb-2" />
          <p className="text-xs text-muted">Reading immutable audit records from PostgreSQL...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-20 text-center calculator-card">
          <ScrollText className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
          <p className="text-xs text-muted">No audit events found matching filters.</p>
        </div>
      ) : (
        <div className="calculator-card overflow-hidden space-y-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-active text-muted uppercase font-bold text-[10px] tracking-wider">
                  <th className="p-3.5">Severity</th>
                  <th className="p-3.5">Action / Event</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Endpoint</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface transition-colors">
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[9px] border uppercase tracking-wider ${getSeverityBadge(
                          log.severity
                        )}`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-foreground block font-mono text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-muted font-mono">{log.eventType}</span>
                    </td>
                    <td className="p-3.5 text-[11px]">
                      <span className="font-semibold text-foreground block">
                        {log.actorId || log.actorType}
                      </span>
                      {log.ipAddress && (
                        <span className="text-[10px] font-mono text-muted">{log.ipAddress}</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">
                      {log.httpMethod && (
                        <span className="font-bold mr-1 text-muted">{log.httpMethod}</span>
                      )}
                      <span className="text-foreground">{log.endpoint || '—'}</span>
                    </td>
                    <td className="p-3.5 font-mono">
                      {log.statusCode ? (
                        <span
                          className={`font-bold ${
                            log.statusCode >= 400
                              ? 'text-red-500'
                              : log.statusCode >= 300
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {log.statusCode}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-muted text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="button button--ghost p-1.5 text-[11px] inline-flex items-center gap-1"
                        title="View Sanitized Event JSON"
                      >
                        <Code2 size={12} />
                        <span>Inspect</span>
                      </button>
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

      {/* DETAIL MODAL: INSPECT AUDIT METADATA */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="calculator-card p-6 w-full max-w-xl space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base font-mono">{selectedLog.action}</h3>
                <span className="text-[11px] font-mono text-muted">
                  Log ID: {selectedLog.id} • {selectedLog.eventType}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">Severity</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[9px] border uppercase tracking-wider ${getSeverityBadge(
                      selectedLog.severity
                    )}`}
                  >
                    {selectedLog.severity}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">Actor</span>
                  <span className="font-mono text-foreground font-semibold">
                    {selectedLog.actorId || selectedLog.actorType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">IP Address</span>
                  <span className="font-mono text-foreground">{selectedLog.ipAddress || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">Endpoint</span>
                  <span className="font-mono text-foreground">
                    {selectedLog.httpMethod} {selectedLog.endpoint || '—'}
                  </span>
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
                  <span className="font-bold block">Error Message:</span>
                  <span className="font-mono">{selectedLog.errorMessage}</span>
                </div>
              )}

              {selectedLog.errorStack && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block mb-1">Stack Trace</span>
                  <pre className="p-3 rounded bg-surface border border-border font-mono text-[10px] overflow-x-auto max-h-40 leading-relaxed text-red-400">
                    {selectedLog.errorStack}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block mb-1">Sanitized Metadata</span>
                  <pre className="p-3 rounded bg-surface border border-border font-mono text-[10px] overflow-x-auto max-h-60 leading-relaxed text-foreground">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="button button--solid text-xs py-2 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
