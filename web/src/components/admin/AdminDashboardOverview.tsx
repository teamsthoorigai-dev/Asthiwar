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
        <p className="text-xs text-muted">Loading live analytics from Neon PostgreSQL...</p>
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
  };

  const totalEstimates = kpis.totalEstimates || 0;
  const totalEnquiries = kpis.totalEnquiries || 0;
  const conversionRate =
    totalEstimates > 0 ? ((totalEnquiries / totalEstimates) * 100).toFixed(1) : '0.0';

  const recentEnquiries = data?.recentEnquiries || [];
  const estimatesByPackage = data?.estimatesByPackage || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="calculator-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Total Pipeline Value
            </span>
            <div className="w-7 h-7 rounded bg-surface-active text-foreground flex items-center justify-center">
              <IndianRupee size={16} className="text-primary" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono">
            {formatINR(kpis.totalPipelineValue)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
            <TrendingUp size={13} /> Active pipeline estimates
          </span>
        </div>

        <div className="calculator-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Total Estimates
            </span>
            <div className="w-7 h-7 rounded bg-surface-active text-foreground flex items-center justify-center">
              <FileText size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono">{totalEstimates}</div>
          <span className="text-[11px] text-muted flex items-center gap-1 mt-1">
            Generated via engine
          </span>
        </div>

        <div className="calculator-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Consultation Leads
            </span>
            <div className="w-7 h-7 rounded bg-surface-active text-foreground flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono">{totalEnquiries}</div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
            {kpis.newEnquiriesCount || 0} requiring follow-up
          </span>
        </div>

        <div className="calculator-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Conversion Rate
            </span>
            <div className="w-7 h-7 rounded bg-surface-active text-foreground flex items-center justify-center">
              <Percent size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono">{conversionRate}%</div>
          <span className="text-[11px] text-muted flex items-center gap-1 mt-1">
            Estimates to consultation leads
          </span>
        </div>
      </div>

      {/* Breakdown by Package & Recent Enquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estimates by Package */}
        <div className="calculator-card p-5">
          <h2 className="text-base font-bold mb-4">Estimates by Package Tier</h2>
          {estimatesByPackage.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center">No estimate data recorded yet.</p>
          ) : (
            <div className="space-y-3">
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

        {/* Recent Enquiries */}
        <div className="calculator-card p-5">
          <h2 className="text-base font-bold mb-4">Recent Consultation Requests</h2>
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
      </div>
    </div>
  );
}
