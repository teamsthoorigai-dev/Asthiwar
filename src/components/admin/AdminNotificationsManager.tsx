'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sliders,
  X,
  Eye,
} from 'lucide-react';
import {
  getAdminNotifications,
  resendNotification,
  NotificationLog,
} from '@/lib/api/admin';

const CHANNEL_FILTERS = ['ALL', 'EMAIL', 'WHATSAPP', 'SMS'];
const TEMPLATE_FILTERS = ['ALL', 'ESTIMATE_QUOTATION', 'NEW_LEAD_ALERT', 'FOLLOW_UP'];

const PAGE_LIMIT_OPTIONS = [
  { label: '10 per page', value: 10 },
  { label: '25 per page', value: 25 },
  { label: '50 per page', value: 50 },
];

export function AdminNotificationsManager() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [templateFilter, setTemplateFilter] = useState<string>('ALL');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  const fetchLogs = (targetPage = page, targetLimit = limit) => {
    setLoading(true);
    getAdminNotifications({
      page: targetPage,
      limit: targetLimit,
      channel: channelFilter,
      template: templateFilter,
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
  }, [channelFilter, templateFilter, limit]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    fetchLogs(newPage, limit);
  };

  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      await resendNotification(id);
      showAlert('success', 'Notification redelivery initiated successfully.');
      fetchLogs(page, limit);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend notification';
      showAlert('error', msg);
    } finally {
      setResendingId(null);
    }
  };

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalRecords);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'FAILED':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
      default:
        return 'bg-surface-active text-muted border-border';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Notification & Dispatch Logs</h2>
          <p className="text-xs text-muted">
            Monitor outbound quotation emails, WhatsApp alerts, lead notifications, and retry failed dispatches
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

      {/* Filter Tabs */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CHANNEL_FILTERS.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannelFilter(ch)}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                channelFilter === ch
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-surface border border-border text-muted hover:text-foreground'
              }`}
            >
              {ch === 'ALL' ? 'All Channels' : ch}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {TEMPLATE_FILTERS.map((tmpl) => (
            <button
              key={tmpl}
              type="button"
              onClick={() => setTemplateFilter(tmpl)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                templateFilter === tmpl
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-surface border border-border text-muted hover:text-foreground'
              }`}
            >
              {tmpl.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Table */}
      {loading ? (
        <div className="py-20 text-center calculator-card">
          <Loader2 className="w-8 h-8 animate-spin text-muted mx-auto mb-2" />
          <p className="text-xs text-muted">Fetching dispatch audit logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-20 text-center calculator-card">
          <Bell className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
          <p className="text-xs text-muted">No notification logs found matching filter criteria.</p>
        </div>
      ) : (
        <div className="calculator-card overflow-hidden space-y-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-active text-muted uppercase font-bold text-[10px] tracking-wider">
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">Recipient</th>
                  <th className="p-3.5">Template</th>
                  <th className="p-3.5">Subject / Reference</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Sent At</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface transition-colors">
                    <td className="p-3.5">
                      <span className="flex items-center gap-1.5 font-bold">
                        {log.channel === 'EMAIL' ? (
                          <Mail size={13} className="text-blue-500" />
                        ) : log.channel === 'WHATSAPP' ? (
                          <MessageSquare size={13} className="text-emerald-500" />
                        ) : (
                          <Send size={13} className="text-purple-500" />
                        )}
                        <span>{log.channel}</span>
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-medium text-foreground">
                      {log.recipient}
                    </td>
                    <td className="p-3.5 text-[11px] text-muted font-mono">
                      {log.template}
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-foreground block truncate max-w-xs">
                        {log.subject || '—'}
                      </span>
                      {log.errorMessage && (
                        <span className="text-[10px] text-red-500 block truncate max-w-xs mt-0.5">
                          Error: {log.errorMessage}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getStatusBadge(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-muted text-[11px]">
                      {log.sentAt ? new Date(log.sentAt).toLocaleString() : '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="button button--ghost p-1.5 text-[11px] inline-flex items-center gap-1"
                          title="View Payload"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          disabled={resendingId === log.id}
                          onClick={() => handleResend(log.id)}
                          className="button button--ghost p-1.5 text-[11px] inline-flex items-center gap-1 text-primary"
                          title="Resend Notification"
                        >
                          <RefreshCw size={12} className={resendingId === log.id ? 'animate-spin' : ''} />
                          <span>Resend</span>
                        </button>
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

      {/* DETAIL MODAL: VIEW PAYLOAD */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="calculator-card p-6 w-full max-w-xl space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base">Notification Delivery Details</h3>
                <span className="text-[11px] font-mono text-muted">{selectedLog.id}</span>
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
                  <span className="text-[10px] uppercase font-bold text-muted block">Channel</span>
                  <span className="font-bold text-foreground">{selectedLog.channel}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">Status</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getStatusBadge(
                      selectedLog.status
                    )}`}
                  >
                    {selectedLog.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">Recipient</span>
                  <span className="font-mono text-foreground">{selectedLog.recipient}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">Template</span>
                  <span className="font-mono text-foreground">{selectedLog.template}</span>
                </div>
              </div>

              {selectedLog.subject && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">Subject</span>
                  <span className="font-semibold text-foreground">{selectedLog.subject}</span>
                </div>
              )}

              {selectedLog.errorMessage && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
                  <span className="font-bold block">Delivery Error:</span>
                  <span className="font-mono">{selectedLog.errorMessage}</span>
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-bold text-muted block mb-1">Payload JSON</span>
                <pre className="p-3 rounded bg-surface border border-border font-mono text-[10px] overflow-x-auto max-h-60 leading-relaxed text-foreground">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>
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
