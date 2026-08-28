'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { getAdminEnquiries, updateAdminEnquiry, AdminEnquiry } from '@/lib/api/admin';

const STATUS_FILTERS = [
  { label: 'ALL', value: 'ALL' },
  { label: 'NEW', value: 'NEW' },
  { label: 'CONTACTED', value: 'CONTACTED' },
  { label: 'MEETING SCHEDULED', value: 'MEETING_SCHEDULED' },
  { label: 'QUOTATION SENT', value: 'QUOTATION_SENT' },
  { label: 'CLOSED WON', value: 'CLOSED_WON' },
  { label: 'CLOSED LOST', value: 'CLOSED_LOST' },
];

const PAGE_LIMIT_OPTIONS = [
  { label: '5 per page', value: 5 },
  { label: '10 per page', value: 10 },
  { label: '25 per page', value: 25 },
  { label: '50 per page', value: 50 },
  { label: 'No Limit (100)', value: 100 },
];

export function AdminEnquiriesManager() {
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEnquiry, setSelectedEnquiry] = useState<AdminEnquiry | null>(null);

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchLeads = (targetPage = page, targetLimit = limit) => {
    setLoading(true);
    getAdminEnquiries({
      page: targetPage,
      limit: targetLimit,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
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
  }, [statusFilter, limit]);

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

  const handleStatusChange = async (id: string | number, newStatus: string) => {
    try {
      await updateAdminEnquiry(id, { status: newStatus });
      fetchLeads(page, limit);
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status: newStatus as AdminEnquiry['status'] });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalRecords);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Leads & Enquiries CRM</h2>
          <p className="text-xs text-muted">Manage customer consultations and follow-up pipelines</p>
        </div>

        {/* Search Bar & Page Limit Select */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:w-56">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone..."
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

      {/* Leads Table & Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="py-20 text-center calculator-card">
              <Loader2 className="w-8 h-8 animate-spin text-muted mx-auto mb-2" />
              <p className="text-xs text-muted">Fetching enquiry records...</p>
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
                          <div className="font-bold text-sm text-foreground">{lead.fullName}</div>
                          <div className="text-xs text-muted flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1">
                              <Phone size={12} /> {lead.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {lead.plotLocation}
                            </span>
                          </div>
                          {lead.estimateNumber && (
                            <span className="text-[11px] font-mono text-muted block mt-1">
                              Ref: {lead.estimateNumber}
                            </span>
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

        {/* Lead Detail Panel */}
        <div>
          {selectedEnquiry ? (
            <div className="calculator-card p-5 space-y-4">
              <h3 className="font-bold text-sm border-b border-border pb-2">Enquiry Details</h3>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted block">Client Name</span>
                <span className="text-sm font-semibold">{selectedEnquiry.fullName}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted block">Phone</span>
                <a href={`tel:${selectedEnquiry.phone}`} className="text-xs text-foreground hover:underline font-mono">
                  {selectedEnquiry.phone}
                </a>
              </div>

              {selectedEnquiry.email && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">Email</span>
                  <a href={`mailto:${selectedEnquiry.email}`} className="text-xs text-foreground hover:underline font-mono">
                    {selectedEnquiry.email}
                  </a>
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-bold text-muted block">Location</span>
                <span className="text-xs">{selectedEnquiry.plotLocation}</span>
              </div>

              {selectedEnquiry.preferredContactTime && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">Preferred Contact Slot</span>
                  <span className="text-xs">{selectedEnquiry.preferredContactTime}</span>
                </div>
              )}

              {selectedEnquiry.requirementNotes && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">Notes</span>
                  <p className="text-xs text-muted mt-1 p-2 rounded bg-surface border border-border">
                    {selectedEnquiry.requirementNotes}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-border">
                <label className="text-[10px] uppercase font-bold text-muted block mb-1.5">
                  Update Lead Pipeline Status
                </label>
                <select
                  className="form-select text-xs"
                  value={selectedEnquiry.status}
                  onChange={(e) => handleStatusChange(selectedEnquiry.id, e.target.value)}
                >
                  <option value="NEW">New Lead</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="MEETING_SCHEDULED">Meeting / Site Visit Scheduled</option>
                  <option value="QUOTATION_SENT">Quotation Sent</option>
                  <option value="CLOSED_WON">Closed Won (Converted)</option>
                  <option value="CLOSED_LOST">Closed Lost</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="calculator-card p-8 text-center text-xs text-muted">
              Select an enquiry from the list to inspect details and advance status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
