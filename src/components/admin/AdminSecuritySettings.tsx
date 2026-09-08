'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  User,
} from 'lucide-react';
import { changeAdminPassword, AdminUser } from '@/lib/api/admin';

interface AdminSecuritySettingsProps {
  user: AdminUser;
  onLogout: () => void;
}

export function AdminSecuritySettings({ user, onLogout }: AdminSecuritySettingsProps) {
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await changeAdminPassword({
        currentPassword,
        newPassword,
      });
      setSuccess(
        res.message || 'Password changed successfully! All sessions invalidated. Please sign in with your new password.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Force relogin after 3 seconds
      setTimeout(() => {
        onLogout();
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password. Please check your current password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h2 className="text-xl font-bold">Admin Account & Security Settings</h2>
        <p className="text-xs text-muted">
          Manage your executive credentials, cryptographic keys, and active session authentication
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="calculator-card p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2 border-b border-border pb-2">
          <User size={16} />
          <span>Active Administrator Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted block">Full Name</span>
            <span className="font-bold text-foreground">{user.fullName || 'Asthiwar Admin'}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-muted block">Email Address</span>
            <span className="font-mono text-foreground">{user.email}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-muted block">Role / Privileges</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 capitalize">
              <ShieldCheck size={14} />
              <span>{user.role} Privilege</span>
            </span>
          </div>
        </div>
      </div>

      {/* Password Change Card */}
      <div className="calculator-card p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2 border-b border-border pb-2">
          <KeyRound size={16} />
          <span>Update Security Password</span>
        </h3>

        {success && (
          <div className="p-3 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs max-w-md">
          <div className="space-y-1">
            <label className="font-bold text-muted block flex items-center gap-1.5">
              <Lock size={13} />
              <span>Current Password</span>
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="form-input text-xs w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-muted block flex items-center gap-1.5">
              <KeyRound size={13} />
              <span>New Password (min 8 characters)</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="form-input text-xs w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-muted block flex items-center gap-1.5">
              <KeyRound size={13} />
              <span>Confirm New Password</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="form-input text-xs w-full"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="button button--solid text-xs py-2.5 px-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Shield size={13} />
                  <span>Change Password</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-border text-[11px] text-muted space-y-1">
          <p>
            🔒 Password change automatically invalidates all other active session cookies and tokens across devices.
          </p>
          <p>
            Hashed using bcrypt with high salt work factors and stored in secure PostgreSQL storage.
          </p>
        </div>
      </div>
    </div>
  );
}
