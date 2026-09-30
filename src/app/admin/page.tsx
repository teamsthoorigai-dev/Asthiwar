'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminGetMe, adminLogout, AdminUser } from '@/lib/api/admin';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { AdminChangePasswordDialog } from '@/components/admin/AdminChangePasswordDialog';
import { AdminLayout, AdminTab } from '@/components/admin/AdminLayout';
import { AdminDashboardOverview } from '@/components/admin/AdminDashboardOverview';
import { AdminEnquiriesManager } from '@/components/admin/AdminEnquiriesManager';
import { AdminEstimatesExplorer } from '@/components/admin/AdminEstimatesExplorer';
import { AdminPricingConfigManager } from '@/components/admin/AdminPricingConfigManager';
import { AdminAuditLogViewer } from '@/components/admin/AdminAuditLogViewer';
import { AdminUsersManager } from '@/components/admin/AdminUsersManager';
import { useAdminRoute, writeAdminHash } from '@/lib/useAdminRoute';
import './admin.css';

const ADMIN_TABS: readonly AdminTab[] = [
  'dashboard',
  'enquiries',
  'estimates',
  'pricing',
  'audit',
  'users',
] as const;

function isAdminTab(value: string): value is AdminTab {
  return (ADMIN_TABS as readonly string[]).includes(value);
}

export default function AdminPortalPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  // The address bar is the source of truth, so a refresh, a bookmark and
  // back/forward all restore the same tab. An unrecognised hash falls back to
  // the dashboard rather than blanking the console.
  const route = useAdminRoute();
  const activeTab: AdminTab = isAdminTab(route.tab) ? route.tab : 'dashboard';

  const handleTabChange = useCallback((tab: AdminTab) => {
    // Drop any sub-section: it belongs to the tab being left, not this one.
    writeAdminHash(tab, null, 'push');
  }, []);

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
      <div className="admin-console min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-muted mx-auto mb-3" />
          <p className="text-xs text-muted">Verifying secure admin session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-console min-h-screen flex items-center justify-center bg-background">
        <AdminLoginForm
          notice={loginNotice}
          onSuccess={(signedIn) => {
            setLoginNotice(null);
            setUser(signedIn);
          }}
        />
      </div>
    );
  }

  // Still on the published default password: the server refuses everything but
  // changing it, so that is all this screen offers.
  if (user.mustChangePassword) {
    return (
      <div className="admin-console min-h-screen bg-background">
        <AdminChangePasswordDialog
          required
          onChanged={() => {
            setLoginNotice('Password changed. Sign in with your new password.');
            setUser(null);
          }}
          onClose={() => {
            adminLogout()
              .catch((err) => console.error('Logout error:', err))
              .finally(() => setUser(null));
          }}
        />
      </div>
    );
  }

  return (
    <AdminLayout
      user={user}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={() => setUser(null)}
    >
      {activeTab === 'dashboard' && <AdminDashboardOverview />}
      {activeTab === 'enquiries' && <AdminEnquiriesManager />}
      {activeTab === 'estimates' && <AdminEstimatesExplorer />}
      {activeTab === 'pricing' && <AdminPricingConfigManager />}
      {activeTab === 'audit' && <AdminAuditLogViewer />}
      {activeTab === 'users' && <AdminUsersManager currentUser={user} />}
    </AdminLayout>
  );
}
