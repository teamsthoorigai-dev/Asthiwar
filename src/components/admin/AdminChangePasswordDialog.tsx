'use client';

import React, { useState } from 'react';
import { KeyRound, Loader2, ShieldAlert, X } from 'lucide-react';
import { adminChangePassword } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';

interface AdminChangePasswordDialogProps {
  /** Called once the password is changed — every session is gone, so sign out. */
  onChanged: () => void;
  onClose: () => void;
}

/** Mirrors changePasswordSchema on the server, so the rule is stated once here. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Changing an admin password had no route and no screen.
 *
 * The controller and service were written and never wired up, so the only way to
 * change one was to reach into the database by hand — while the login screen
 * printed the seeded default for anyone who loaded it. Both halves of that are
 * now closed: the credentials are off the login form, and this is the screen.
 */
export function AdminChangePasswordDialog({ onChanged, onClose }: AdminChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The two new passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('The new password must differ from the current one.');
      return;
    }

    setSaving(true);
    try {
      await adminChangePassword({ currentPassword, newPassword });
      // The server drops every session for this account, this one included.
      onChanged();
    } catch (err: unknown) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Could not change the password.'
      );
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-change-password-title"
    >
      <div className="calculator-card w-full max-w-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-muted" aria-hidden="true" />
            <h2 id="admin-change-password-title" className="text-sm font-extrabold">
              Change Password
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-[11px] flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-muted block mb-1" htmlFor="admin-current-password">
              Current password
            </label>
            <input
              id="admin-current-password"
              type="password"
              required
              autoComplete="current-password"
              className="form-input text-xs w-full"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="font-bold text-muted block mb-1" htmlFor="admin-new-password">
              New password
            </label>
            <input
              id="admin-new-password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              className="form-input text-xs w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <span className="text-[10px] text-muted block mt-1">
              At least {MIN_PASSWORD_LENGTH} characters.
            </span>
          </div>

          <div>
            <label className="font-bold text-muted block mb-1" htmlFor="admin-confirm-password">
              Confirm new password
            </label>
            <input
              id="admin-confirm-password"
              type="password"
              required
              autoComplete="new-password"
              className="form-input text-xs w-full"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <p className="text-[10px] text-muted leading-relaxed pt-1">
            Every signed-in session for this account is ended, on every device. You
            will be asked to sign in again.
          </p>

          <div className="pt-2 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="button button--ghost text-xs py-2 px-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="button button--solid text-xs py-2 px-4 disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {saving && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
              <span>{saving ? 'Saving…' : 'Change password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
