'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  FileText,
  IndianRupee,
  Loader2,
  Percent,
  MapPin,
  Clock,
  Ruler,
  CheckCircle2,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { getDashboardAnalytics, DashboardAnalytics } from '@/lib/api/admin';

function formatINR(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num) || num === 0) return '₹0';
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} Lakh`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

export function AdminDashboardOverview() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardAnalytics()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to fetch dashboard metrics';
        setError(msg);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted mx-auto mb-3" />
        <p className="text-xs text-muted">Loading live analytics from PostgreSQL...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
        {error}
      </div>
    );
  }

  const kpis = data?.kpis || data?.metrics || {
    totalPipelineValue: 0,
    totalEstimates: 0,
    totalEnquiries: 0,
    newEnquiriesCount: 0,
    avgProjectValue: 0,
    avgBuiltupArea: 0,
    closedWonCount: 0,
    conversionRate: 0,
  };

  const totalEstimates = kpis.totalEstimates || 0;
  const totalEnquiries = kpis.totalEnquiries || 0;
  const recentEnquiries = data?.recentEnquiries || [];
  const recentEstimates = data?.recentEstimates || [];
  const estimatesByPackage = data?.estimatesByPackage || [];
  const estimatesByLocation = data?.estimatesByLocation || [];
  const enquiriesByStatus = data?.enquiriesByStatus || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="calculator-card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
              Total Pipeline Value
            </span>
            <div className="w-6 h-6 rounded bg-surface-active text-foreground flex items-center justify-center">
              <IndianRupee size={13} className="text-primary" />
            </div>
          </div>
          <div className="text-xl font-extrabold font-mono text-foreground">
            {formatINR(kpis.totalPipelineValue)}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
            <TrendingUp size={11} /> Cumulative Estimates
          </span>
        </div>

        <div className="calculator-card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
              Total Estimates
            </span>
            <div className="w-6 h-6 rounded bg-surface-active text-foreground flex items-center justify-center">
              <FileText size={13} />
            </div>
          </div>
          <div className="text-xl font-extrabold font-mono text-foreground">{totalEstimates}</div>
          <span className="text-[10px] text-muted flex items-center gap-1 mt-1 font-mono">
            {kpis.avgBuiltupArea ? `Avg ${kpis.avgBuiltupArea} sq.ft` : 'Active engine'}
          </span>
        </div>

        <div className="calculator-card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
              Avg Project Value
            </span>
            <div className="w-6 h-6 rounded bg-surface-active text-foreground flex items-center justify-center">
              <Ruler size={13} />
            </div>
          </div>
          <div className="text-xl font-extrabold font-mono text-foreground">
            {formatINR(kpis.avgProjectValue)}
          </div>
          <span className="text-[10px] text-muted block mt-1">
            Mean residential cost
          </span>
        </div>

        <div className="calculator-card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
              Total Leads
            </span>
            <div className="w-6 h-6 rounded bg-surface-active text-foreground flex items-center justify-center">
              <Users size={13} />
            </div>
          </div>
          <div className="text-xl font-extrabold font-mono text-foreground">{totalEnquiries}</div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-1">
            {kpis.newEnquiriesCount || 0} requiring follow-up
          </span>
        </div>

        <div className="calculator-card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
              Converted Deals
            </span>
            <div className="w-6 h-6 rounded bg-surface-active text-foreground flex items-center justify-center">
              <CheckCircle2 size={13} className="text-emerald-500" />
            </div>
          </div>
          <div className="text-xl font-extrabold font-mono text-foreground">
            {kpis.closedWonCount || 0}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
            Closed Won Projects
          </span>
        </div>

        <div className="calculator-card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
              Lead Conversion
            </span>
            <div className="w-6 h-6 rounded bg-surface-active text-foreground flex items-center justify-center">
              <Percent size={13} />
            </div>
          </div>
          <div className="text-xl font-extrabold font-mono text-foreground">
            {kpis.conversionRate ? `${kpis.conversionRate}%` : '0%'}
          </div>
          <span className="text-[10px] text-muted block mt-1">
            Won / Total consultations
          </span>
        </div>
      </div>

      {/* Row 2: Distribution by Package & Geographic Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estimates by Package */}
        <div className="calculator-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <PieChart size={16} /> Estimates by Package Tier
            </h2>
            <span className="text-[10px] text-muted uppercase tracking-wider font-mono">
              Tier Breakdown
            </span>
          </div>
          {estimatesByPackage.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center">No estimate data recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {estimatesByPackage.map((p) => (
                <div
                  key={p.packageSlug}
                  className="p-3 rounded border border-border bg-surface flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold capitalize text-foreground">
                      {p.packageSlug} Package
                    </span>
                    <span className="text-muted block text-[11px] mt-0.5">
                      {p.count} estimates created
                    </span>
                  </div>
                  <div className="font-mono font-bold text-foreground">
                    {formatINR(p.totalValue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Geographic Demand by Location */}
        <div className="calculator-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <BarChart3 size={16} /> Regional City Demand
            </h2>
            <span className="text-[10px] text-muted uppercase tracking-wider font-mono">
              Geographic Spread
            </span>
          </div>
          {estimatesByLocation.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center">No location metrics available yet.</p>
          ) : (
            <div className="space-y-2.5">
              {estimatesByLocation.map((loc) => (
                <div
                  key={loc.location}
                  className="p-3 rounded border border-border bg-surface flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-muted" />
                    <div>
                      <span className="font-bold text-foreground capitalize">
                        {loc.location}
                      </span>
                      <span className="text-muted block text-[11px] mt-0.5">
                        {loc.count} project estimates
                      </span>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-foreground">
                    {formatINR(loc.totalValue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Pipeline Status Funnel */}
      <div className="calculator-card p-5">
        <h2 className="text-sm font-bold mb-3">Enquiry & Consultation Pipeline Funnel</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: 'NEW', label: 'New Leads', color: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400' },
            { key: 'CONTACTED', label: 'Contacted', color: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
            { key: 'MEETING_SCHEDULED', label: 'Site Visit / Meet', color: 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400' },
            { key: 'QUOTATION_SENT', label: 'Quote Sent', color: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
            { key: 'CLOSED_WON', label: 'Closed Won', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
            { key: 'CLOSED_LOST', label: 'Closed Lost', color: 'border-gray-500/30 bg-gray-500/10 text-muted' },
          ].map((statusItem) => (
            <div
              key={statusItem.key}
              className={`p-3 rounded border ${statusItem.color} text-center space-y-1`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block">
                {statusItem.label}
              </span>
              <span className="text-lg font-extrabold font-mono block">
                {enquiriesByStatus[statusItem.key] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Recent Enquiries & Recent Estimates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Consultation Leads */}
        <div className="calculator-card p-5">
          <h2 className="text-sm font-bold mb-4">Recent Consultation Requests</h2>
          {recentEnquiries.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center">No enquiries recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentEnquiries.slice(0, 5).map((enq) => (
                <div
                  key={enq.id}
                  className="p-3 rounded border border-border bg-surface flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-foreground">{enq.fullName}</div>
                    <div className="text-muted text-[11px] flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <MapPin size={11} /> {enq.plotLocation}
                      </span>
                      <span>•</span>
                      <span>{enq.phone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted/20 text-foreground">
                      {enq.status}
                    </span>
                    <span className="text-muted text-[10px] block mt-1 flex items-center justify-end gap-0.5">
                      <Clock size={10} />
                      {new Date(enq.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Generated Estimates */}
        <div className="calculator-card p-5">
          <h2 className="text-sm font-bold mb-4">Recent Generated Estimates</h2>
          {recentEstimates.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center">No estimate snapshots yet.</p>
          ) : (
            <div className="space-y-3">
              {recentEstimates.slice(0, 5).map((est) => (
                <div
                  key={est.id}
                  className="p-3 rounded border border-border bg-surface flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-foreground">{est.estimateNumber}</div>
                    <div className="text-muted text-[11px] flex items-center gap-2 mt-0.5">
                      <span>{est.customerName}</span>
                      <span>•</span>
                      <span className="capitalize">{est.packageSlug}</span>
                      <span>•</span>
                      <span>{est.plotLocation}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-foreground block">
                      {formatINR(est.totalProjectCost)}
                    </span>
                    <span className="text-muted text-[10px] block mt-1 flex items-center justify-end gap-0.5">
                      <Clock size={10} />
                      {new Date(est.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
