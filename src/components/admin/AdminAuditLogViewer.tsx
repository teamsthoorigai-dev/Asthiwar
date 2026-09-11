'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ScrollText,
  Search,
  SearchX,
  X,
} from 'lucide-react';
import {
  getAdminAuditLogs,
  getAdminAuditLogById,
  AdminAuditLog,
  AdminAuditLogDetail,
} from '@/lib/api/admin';

/**
 * The read side of `audit_logs`, which had three writers and no reader.
 *
 * Every intercepted API error, every pricing change and every calculator
 * submission has been recorded since the table was created. An endpoint to fetch
 * it was added and never called by anything, so none of it could be seen through
 * the product — which makes it storage rather than an audit trail.
 */

const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  HIGH: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  MEDIUM: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
  LOW: 'bg-surface-active text-muted border-border',
  INFO: 'bg-surface-active text-muted border-border',
};

const EVENT_TYPES = [
  { label: 'All events', value: '' },
  { label: 'Admin changes', value: 'ADMIN_MUTATION' },
  { label: 'Calculator', value: 'CALCULATOR_SUBMISSION' },
  { label: 'Errors', value: 'ERROR' },
  { label: 'Warnings', value: 'WARN' },
];

function severityClass(severity: string): string {
  return SEVERITY_STYLES[severity?.toUpperCase()] ?? SEVERITY_STYLES.LOW;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminAuditLogViewer() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>('');
  const [eventType, setEventType] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(25);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [selected, setSelected] = useState<AdminAuditLogDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAuditLogs({
        page,
        limit,
        search: search.trim() || undefined,
        eventType: eventType || undefined,
        severity: severity || undefined,
      });
      setLogs(res.items ?? []);
      setTotalRecords(res.pagination?.total ?? res.items?.length ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load the audit trail');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, eventType, severity]);

  // Debounced so typing in the search box does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  // Any filter change restarts the listing; staying on page 7 of a narrower
  // result set shows an empty table that looks like a failure.
  useEffect(() => {
    setPage(1);
  }, [search, eventType, severity]);

  const openDetail = async (id: number) => {
    setLoadingDetail(true);
    try {
      const detail = await getAdminAuditLogById(id);
      setSelected(detail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load that entry');
    } finally {
      setLoadingDetail(false);
    }
  };

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalRecords);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <ScrollText className="w-4 h-4 text-muted" aria-hidden="true" />
        <h2 className="text-sm font-extrabold">Audit Trail</h2>
        <span className="text-[11px] text-muted">
          {totalRecords.toLocaleString('en-IN')} recorded
        </span>
      </div>

      {/* Filters */}
      <div className="calculator-card p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, endpoint, error or actor…"
            aria-label="Search the audit trail"
            className="form-input text-xs w-full pl-7"
          />
        </div>

        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          aria-label="Filter by event type"
          className="form-select text-xs sm:w-44"
        >
          {EVENT_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          aria-label="Filter by severity"
          className="form-select text-xs sm:w-36"
        >
          <option value="">All severities</option>
          {SEVERITY_ORDER.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3 rounded border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Listing */}
      <div className="calculator-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted mx-auto mb-2" aria-hidden="true" />
            <p className="text-xs text-muted">Loading the audit trail…</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <SearchX className="w-6 h-6 text-muted mx-auto mb-2" aria-hidden="true" />
            <p className="text-xs text-muted">No entries match these filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted">
                  <th className="py-2 px-3 font-bold">When</th>
                  <th className="py-2 px-3 font-bold">Severity</th>
                  <th className="py-2 px-3 font-bold">Action</th>
                  <th className="py-2 px-3 font-bold">Actor</th>
                  <th className="py-2 px-3 font-bold">Endpoint</th>
                  <th className="py-2 px-3 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => openDetail(log.id)}
                    className="border-b border-border last:border-0 hover:bg-surface-active/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3 whitespace-nowrap text-muted tabular-nums">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${severityClass(
                          log.severity
                        )}`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-semibold">{log.action}</td>
                    <td className="py-2 px-3 text-muted truncate max-w-[12rem]">
                      {log.actorId || log.actorType}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-muted truncate max-w-[16rem]">
                      {log.httpMethod} {log.endpoint}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">{log.statusCode ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalRecords > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">
            {startRecord.toLocaleString('en-IN')}–{endRecord.toLocaleString('en-IN')} of{' '}
            {totalRecords.toLocaleString('en-IN')}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="button button--ghost text-xs py-1 px-2 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-muted tabular-nums px-1">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="button button--ghost text-xs py-1 px-2 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Detail */}
      {(selected || loadingDetail) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Audit entry detail"
        >
          <div className="calculator-card w-full max-w-2xl max-h-[85vh] overflow-y-auto p-5">
            {loadingDetail || !selected ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted mx-auto" aria-hidden="true" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold">{selected.action}</h3>
                    <p className="text-[11px] text-muted">
                      {formatTimestamp(selected.createdAt)} · {selected.eventType}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="text-muted hover:text-foreground transition-colors"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-xs mb-4">
                  {[
                    ['Severity', selected.severity],
                    ['Actor', selected.actorId || selected.actorType],
                    ['Endpoint', `${selected.httpMethod ?? ''} ${selected.endpoint ?? '—'}`],
                    ['Status', String(selected.statusCode ?? '—')],
                    ['IP address', selected.ipAddress ?? '—'],
                    ['User agent', selected.userAgent ?? '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-[10px] uppercase font-bold text-muted tracking-wider">
                        {label}
                      </dt>
                      <dd className="break-words">{value}</dd>
                    </div>
                  ))}
                </dl>

                {selected.errorMessage && (
                  <div className="mb-4">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1">
                      Message
                    </span>
                    <p className="text-xs break-words">{selected.errorMessage}</p>
                  </div>
                )}

                {selected.metadata != null && (
                  <div className="mb-4">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1">
                      Recorded request
                    </span>
                    {/* Passwords, tokens and secrets are redacted before this is
                        written, so what is shown here is safe to read on screen. */}
                    <pre className="text-[11px] font-mono bg-surface border border-border rounded p-2.5 overflow-x-auto leading-relaxed">
                      {JSON.stringify(selected.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {selected.errorStack && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1">
                      Stack
                    </span>
                    <pre className="text-[11px] font-mono bg-surface border border-border rounded p-2.5 overflow-x-auto leading-relaxed">
                      {selected.errorStack}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
