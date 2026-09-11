'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  Phone,
  MapPin,
  Clock,
  Loader2,
  Trash2,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Tag,
  FileSpreadsheet,
} from 'lucide-react';
import {
  getAdminEnquiries,
  updateAdminEnquiry,
  deleteAdminEnquiry,
  sendLeadNotification,
  AdminEnquiry,
  EnquiryStatus,
  EnquiryPriority,
} from '@/lib/api/admin';
import { getAdminEstimatePdfUrl } from '@/lib/api/calculator';
import { CsvColumn, downloadCsv, timestampedFilename, toCsv } from '@/lib/csv';

const STATUS_FILTERS = [
  { label: 'ALL STATUS', value: 'ALL' },
  { label: 'NEW', value: 'NEW' },
  { label: 'CONTACTED', value: 'CONTACTED' },
  { label: 'MEETING SCHEDULED', value: 'MEETING_SCHEDULED' },
  { label: 'QUOTATION SENT', value: 'QUOTATION_SENT' },
  { label: 'CLOSED WON', value: 'CLOSED_WON' },
  { label: 'CLOSED LOST', value: 'CLOSED_LOST' },
];

const PRIORITY_FILTERS = [
  { label: 'ALL PRIORITIES', value: 'ALL' },
  { label: 'URGENT', value: 'URGENT' },
  { label: 'HIGH', value: 'HIGH' },
  { label: 'MEDIUM', value: 'MEDIUM' },
  { label: 'LOW', value: 'LOW' },
];

const PAGE_LIMIT_OPTIONS = [
  { label: '5 per page', value: 5 },
  { label: '10 per page', value: 10 },
  { label: '25 per page', value: 25 },
  { label: '50 per page', value: 50 },
];

function formatINR(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function AdminEnquiriesManager() {
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedEnquiry, setSelectedEnquiry] = useState<AdminEnquiry | null>(null);

  // Editable Admin Notes state
  const [adminNotesDraft, setAdminNotesDraft] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sendingAlert, setSendingAlert] = useState<boolean>(false);
  // Deleting a lead is irreversible, so it is confirmed in-app rather than
  // through window.confirm(), which is unstyled and easy to dismiss blind.
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);
  const [deletingLead, setDeletingLead] = useState<boolean>(false);

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  const fetchLeads = (targetPage = page, targetLimit = limit) => {
    setLoading(true);
    getAdminEnquiries({
      page: targetPage,
      limit: targetLimit,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
      search: search || undefined,
    })
      .then((res) => {
        setEnquiries(res.items || []);
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
    fetchLeads(1, limit);
  }, [statusFilter, priorityFilter, limit]);

  useEffect(() => {
    setConfirmingDelete(false);
    if (selectedEnquiry) {
      setAdminNotesDraft(selectedEnquiry.adminNotes || '');
    }
  }, [selectedEnquiry?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads(1, limit);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    fetchLeads(newPage, limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleStatusChange = async (id: string, newStatus: EnquiryStatus) => {
    try {
      const updated = await updateAdminEnquiry(id, { status: newStatus });
      showAlert('success', `Status updated to ${newStatus}`);
      fetchLeads(page, limit);
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status: updated.status });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      showAlert('error', msg);
    }
  };

  const handlePriorityChange = async (id: string, newPriority: EnquiryPriority) => {
    try {
      const updated = await updateAdminEnquiry(id, { priority: newPriority });
      showAlert('success', `Priority set to ${newPriority}`);
      fetchLeads(page, limit);
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, priority: updated.priority });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update priority';
      showAlert('error', msg);
    }
  };

  const handleSaveAdminNotes = async () => {
    if (!selectedEnquiry) return;
    setSavingNotes(true);
    try {
      const updated = await updateAdminEnquiry(selectedEnquiry.id, {
        adminNotes: adminNotesDraft.trim(),
      });
      setSelectedEnquiry({ ...selectedEnquiry, adminNotes: updated.adminNotes });
      fetchLeads(page, limit);
      showAlert('success', 'Admin follow-up notes saved successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save admin notes';
      showAlert('error', msg);
    } finally {
      setSavingNotes(false);
    }
  };

  /**
   * Export what is on screen.
   *
   * Built from the rows already fetched rather than a new endpoint, so the export
   * matches the filters and sort the operator is actually looking at. Only the
   * current page: the list is paginated and pulling every lead silently would be
   * a different, much larger action than the button appears to offer.
   */
  const handleExportCsv = () => {
    const columns: Array<CsvColumn<AdminEnquiry>> = [
      { header: 'Received', value: (r) => new Date(r.createdAt).toISOString() },
      { header: 'Name', value: (r) => r.fullName },
      { header: 'Phone', value: (r) => r.phone },
      { header: 'Email', value: (r) => r.email ?? '' },
      { header: 'Location', value: (r) => r.plotLocation },
      { header: 'Status', value: (r) => r.status },
      { header: 'Priority', value: (r) => r.priority },
      { header: 'Quotation', value: (r) => r.estimateNumber ?? '' },
      { header: 'Quoted Total (INR)', value: (r) => r.estimateTotalCost ?? '' },
      { header: 'Package', value: (r) => r.estimatePackageSlug ?? '' },
      { header: 'Built-up Area (sq.ft)', value: (r) => r.estimateBuiltupArea ?? '' },
      { header: 'Preferred Contact Time', value: (r) => r.preferredContactTime ?? '' },
      { header: 'Requirement Notes', value: (r) => r.requirementNotes ?? '' },
      { header: 'Admin Notes', value: (r) => r.adminNotes ?? '' },
    ];

    downloadCsv(timestampedFilename('asthiwar-leads'), toCsv(enquiries, columns));
    showAlert('success', `Exported ${enquiries.length} lead${enquiries.length === 1 ? '' : 's'}.`);
  };

  const handleDeleteLead = async () => {
    if (!selectedEnquiry) return;
    setDeletingLead(true);
    try {
      await deleteAdminEnquiry(selectedEnquiry.id);
      showAlert('success', `Lead '${selectedEnquiry.fullName}' deleted.`);
      setSelectedEnquiry(null);
      setConfirmingDelete(false);
      fetchLeads(page, limit);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete the lead';
      showAlert('error', msg);
    } finally {
      setDeletingLead(false);
    }
  };

  const handleSendLeadAlert = async (id: string) => {
    setSendingAlert(true);
    try {
      await sendLeadNotification(id);
      showAlert('success', 'Admin lead alert dispatched via notifications engine');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dispatch lead alert';
      showAlert('error', msg);
    } finally {
      setSendingAlert(false);
    }
  };

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalRecords);

  const getPriorityBadgeClass = (p: string) => {
    switch (p) {
      case 'URGENT':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-surface-active text-muted border-border';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Leads & Enquiries CRM</h2>
          <p className="text-xs text-muted">
            Track customer consultations, assign priorities, record internal notes, and link project estimates
          </p>
        </div>

        {/* Search Bar & Page Limit Select */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:w-56">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search client, phone, city..."
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

          {/* Export what is listed. Placed beside the page-size control because
              both act on the current view rather than on a single record. */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={enquiries.length === 0}
            className="button button--ghost text-xs py-1.5 px-3 shrink-0 inline-flex items-center gap-1.5 disabled:opacity-40"
            title="Download the rows currently listed as a CSV file"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
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

      {/* Filter Tabs (Status and Priority) */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                statusFilter === tab.value
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-surface border border-border text-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-bold text-muted uppercase flex items-center gap-1 mr-1">
            <Tag size={11} /> Priority:
          </span>
          {PRIORITY_FILTERS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriorityFilter(p.value)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                priorityFilter === p.value
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-surface border border-border text-muted hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table & Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="py-20 text-center calculator-card">
              <Loader2 className="w-8 h-8 animate-spin text-muted mx-auto mb-2" />
              <p className="text-xs text-muted">Fetching consultation records...</p>
            </div>
          ) : enquiries.length === 0 ? (
            <div className="py-20 text-center calculator-card">
              <FileText className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
              <p className="text-xs text-muted">No enquiry records found matching filters.</p>
            </div>
          ) : (
            <div className="calculator-card overflow-hidden">
              <div className="divide-y divide-border">
                {enquiries.map((lead) => {
                  const isSelected = selectedEnquiry?.id === lead.id;
                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedEnquiry(lead)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-surface-active' : 'hover:bg-surface'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{lead.fullName}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase tracking-wider ${getPriorityBadgeClass(
                                lead.priority || 'MEDIUM'
                              )}`}
                            >
                              {lead.priority || 'MEDIUM'}
                            </span>
                          </div>
                          <div className="text-xs text-muted flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone size={12} /> {lead.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {lead.plotLocation}
                            </span>
                          </div>
                          {lead.estimateNumber && (
                            <div className="text-[11px] text-muted flex items-center gap-2 mt-1.5">
                              <span className="font-mono text-foreground font-semibold">
                                Ref: {lead.estimateNumber}
                              </span>
                              {lead.estimateTotalCost && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono font-bold text-foreground">
                                    {formatINR(lead.estimateTotalCost)}
                                  </span>
                                </>
                              )}
                              {lead.estimatePackageSlug && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{lead.estimatePackageSlug}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted/20 text-foreground">
                            {lead.status}
                          </span>
                          <span className="text-[10px] text-muted block mt-1 flex items-center justify-end gap-1">
                            <Clock size={10} />
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination Navigation Bar */}
          {!loading && totalRecords > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 py-1 text-xs text-muted">
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

        {/* Lead Detail & Follow-Up Panel */}
        <div>
          {selectedEnquiry ? (
            <div className="calculator-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="font-bold text-sm">Lead Details</h3>
                <button
                  type="button"
                  disabled={sendingAlert}
                  onClick={() => handleSendLeadAlert(selectedEnquiry.id)}
                  className="button button--ghost text-[10px] py-1 px-2.5 inline-flex items-center gap-1"
                  title="Dispatch lead alert notification"
                >
                  <Send size={11} />
                  <span>{sendingAlert ? 'Sending...' : 'Alert Sales'}</span>
                </button>
              </div>

              {/* Customer Contact Card */}
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">Client Name</span>
                  <span className="text-sm font-semibold">{selectedEnquiry.fullName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted block">Phone</span>
                    <a
                      href={`tel:${selectedEnquiry.phone}`}
                      className="text-xs text-foreground hover:underline font-mono"
                    >
                      {selectedEnquiry.phone}
                    </a>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted block">City / Site</span>
                    <span className="text-xs font-medium">{selectedEnquiry.plotLocation}</span>
                  </div>
                </div>

                {selectedEnquiry.email && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted block">Email</span>
                    <a
                      href={`mailto:${selectedEnquiry.email}`}
                      className="text-xs text-foreground hover:underline font-mono"
                    >
                      {selectedEnquiry.email}
                    </a>
                  </div>
                )}

                {selectedEnquiry.preferredContactTime && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted block">Preferred Contact Slot</span>
                    <span className="text-xs">{selectedEnquiry.preferredContactTime}</span>
                  </div>
                )}

                {selectedEnquiry.requirementNotes && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted block">Customer Request Notes</span>
                    <p className="text-xs text-muted mt-1 p-2 rounded bg-surface border border-border leading-relaxed">
                      {selectedEnquiry.requirementNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Linked Estimate Mini-Card */}
              {selectedEnquiry.estimateNumber && (
                <div className="p-3 rounded border border-border bg-surface-active/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted flex items-center gap-1">
                      <FileSpreadsheet size={12} /> Linked Estimate
                    </span>
                    <a
                      href={getAdminEstimatePdfUrl(selectedEnquiry.estimateNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
                    >
                      <span>PDF</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-foreground">
                      {selectedEnquiry.estimateNumber}
                    </span>
                    {selectedEnquiry.estimateTotalCost && (
                      <span className="font-mono font-bold text-foreground">
                        {formatINR(selectedEnquiry.estimateTotalCost)}
                      </span>
                    )}
                  </div>
                  {(selectedEnquiry.estimatePackageSlug || selectedEnquiry.estimateBuiltupArea) && (
                    <div className="text-[11px] text-muted flex items-center gap-2">
                      {selectedEnquiry.estimatePackageSlug && (
                        <span className="capitalize">{selectedEnquiry.estimatePackageSlug} Package</span>
                      )}
                      {selectedEnquiry.estimateBuiltupArea && (
                        <span>• {selectedEnquiry.estimateBuiltupArea} sq.ft</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Status & Priority Selectors */}
              <div className="pt-2 border-t border-border space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted block mb-1">
                      Pipeline Status
                    </label>
                    <select
                      className="form-select text-xs w-full"
                      value={selectedEnquiry.status}
                      onChange={(e) => handleStatusChange(selectedEnquiry.id, e.target.value as EnquiryStatus)}
                    >
                      <option value="NEW">New Lead</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="MEETING_SCHEDULED">Meeting / Site Visit</option>
                      <option value="QUOTATION_SENT">Quotation Sent</option>
                      <option value="CLOSED_WON">Closed Won (Won)</option>
                      <option value="CLOSED_LOST">Closed Lost</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted block mb-1">
                      Lead Priority
                    </label>
                    <select
                      className="form-select text-xs w-full"
                      value={selectedEnquiry.priority || 'MEDIUM'}
                      onChange={(e) => handlePriorityChange(selectedEnquiry.id, e.target.value as EnquiryPriority)}
                    >
                      <option value="URGENT">Urgent (Immediate)</option>
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                  </div>
                </div>

                {/* Admin Follow-Up Notes Editor */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted block mb-1">
                    Internal Admin Follow-up Notes
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotesDraft}
                    onChange={(e) => setAdminNotesDraft(e.target.value)}
                    placeholder="Log client phone discussion, site visit notes, budget expectations..."
                    className="form-input text-xs w-full leading-relaxed"
                  />
                  <button
                    type="button"
                    disabled={savingNotes}
                    onClick={handleSaveAdminNotes}
                    className="button button--solid w-full text-xs py-2 mt-2 flex items-center justify-center gap-1.5"
                  >
                    {savingNotes ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Saving Notes...</span>
                      </>
                    ) : (
                      <>
                        <Save size={12} />
                        <span>Save Follow-up Notes</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Removing the lead entirely. Kept visually quiet and behind a
                    confirmation: it is the only destructive action on this panel. */}
                <div className="pt-3 border-t border-border">
                  {confirmingDelete ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-muted leading-relaxed">
                        Delete <strong className="text-foreground">{selectedEnquiry.fullName}</strong>{' '}
                        from the pipeline? This cannot be undone.
                        {selectedEnquiry.estimateNumber
                          ? ' Their quotation and its PDF are kept.'
                          : ''}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(false)}
                          className="button button--ghost flex-1 text-xs py-1.5"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={deletingLead}
                          onClick={handleDeleteLead}
                          className="button button--solid flex-1 text-xs py-1.5 inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
                        >
                          {deletingLead && <Loader2 size={12} className="animate-spin" />}
                          <span>{deletingLead ? 'Deleting…' : 'Delete lead'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      className="button button--ghost w-full text-xs py-1.5 text-red-600 dark:text-red-400 inline-flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={12} />
                      <span>Delete Lead</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="calculator-card p-8 text-center text-xs text-muted">
              Select an enquiry from the list to view customer information, save follow-up notes, and advance status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
