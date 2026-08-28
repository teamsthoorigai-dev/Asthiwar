'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminGetMe, AdminUser } from '@/lib/api/admin';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { AdminLayout, AdminTab } from '@/components/admin/AdminLayout';
import { AdminDashboardOverview } from '@/components/admin/AdminDashboardOverview';
import { AdminEnquiriesManager } from '@/components/admin/AdminEnquiriesManager';
import { AdminEstimatesExplorer } from '@/components/admin/AdminEstimatesExplorer';
import { AdminPricingConfigManager } from '@/components/admin/AdminPricingConfigManager';

export default function AdminPortalPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  useEffect(() => {
    adminGetMe()
      .then((me) => {
        setUser(me);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-muted mx-auto mb-3" />
          <p className="text-xs text-muted">Verifying secure admin session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AdminLoginForm onSuccess={setUser} />
      </div>
    );
  }

  return (
    <AdminLayout
      user={user}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={() => setUser(null)}
    >
      {activeTab === 'dashboard' && <AdminDashboardOverview />}
      {activeTab === 'enquiries' && <AdminEnquiriesManager />}
      {activeTab === 'estimates' && <AdminEstimatesExplorer />}
      {activeTab === 'pricing' && <AdminPricingConfigManager />}
    </AdminLayout>
  );
}
