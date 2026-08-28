'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Sliders,
  LogOut,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { AdminUser, adminLogout } from '@/lib/api/admin';

export type AdminTab = 'dashboard' | 'enquiries' | 'estimates' | 'pricing';

interface AdminLayoutProps {
  user: AdminUser;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AdminLayout({
  user,
  activeTab,
  onTabChange,
  onLogout,
  children,
}: AdminLayoutProps) {
  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    onLogout();
  };

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }> = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'enquiries', label: 'Enquiries & Leads', icon: Users },
    { id: 'estimates', label: 'Estimates Explorer', icon: FileSpreadsheet },
    { id: 'pricing', label: 'Pricing Matrix Config', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-surface p-4 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-6 px-2">
            <Building2 className="w-6 h-6 text-foreground" />
            <div>
              <span className="font-bold text-sm tracking-wide block">ASTHIWAR</span>
              <span className="text-[10px] text-muted uppercase tracking-wider block font-mono">
                Admin Console
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold transition-colors text-left ${
                    isActive
                      ? 'bg-foreground text-background font-bold shadow-sm'
                      : 'text-muted hover:text-foreground hover:bg-surface-active'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-4 mt-4 border-t border-border">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
            >
              <span>↗ View Public Website</span>
            </Link>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-border mt-6">
          <div className="flex items-center gap-2 px-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div className="overflow-hidden">
              <span className="text-xs font-bold block truncate">{user.fullName || user.email}</span>
              <span className="text-[10px] text-muted block capitalize">{user.role} role</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="button button--ghost w-full flex items-center justify-center gap-2 text-xs py-2 text-red-600 dark:text-red-400"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
