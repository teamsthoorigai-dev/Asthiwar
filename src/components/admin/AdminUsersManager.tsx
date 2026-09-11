'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Plus, UserCog, X } from 'lucide-react';
import {
  listAdminAccounts,
  createAdminAccount,
  updateAdminAccount,
  AdminAccount,
  AdminRole,
  AdminUser,
} from '@/lib/api/admin';

interface AdminUsersManagerProps {
  /** The signed-in operator, so their own row can be labelled and guarded. */
  currentUser: AdminUser;
}

const ROLE_OPTIONS: Array<{ value: AdminRole; label: string; detail: string }> = [
  { value: 'viewer', label: 'Viewer', detail: 'Read-only. Sees the pipeline and rate card.' },
  { value: 'admin', label: 'Admin', detail: 'Edits pricing and works the pipeline.' },
  {
    value: 'super_admin',
    label: 'Super Admin',
    detail: 'Everything, plus deletions and account management.',
  },
];

const MIN_PASSWORD_LENGTH = 8;

/**
 * Create and retire admin accounts.
 *
 * Roles existed in the database and were enforced nowhere, and accounts could
 * only be made by running the seed — so in practice there was one login, shared.
 * Neither half is useful without the other: enforcing roles means nothing if
 * everyone signs in as the same super admin.
 */
export function AdminUsersManager({ currentUser }: AdminUsersManagerProps) {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [creating, setCreating] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'admin' as AdminRole,
  });

  const show = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      setAccounts(await listAdminAccounts());
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      show('error', `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setSaving(true);
    try {
      const created = await createAdminAccount({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        password: form.password,
        role: form.role,
      });
      show('success', `Account created for ${created.email}. Share the password separately.`);
      setForm({ email: '', fullName: '', password: '', role: 'admin' });
      setCreating(false);
      await fetchAccounts();
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Failed to create the account');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (
    account: AdminAccount,
    changes: { role?: AdminRole; isActive?: boolean }
  ) => {
    setBusyId(account.id);
    try {
      await updateAdminAccount(account.id, changes);
      show('success', `${account.email} updated.`);
      await fetchAccounts();
    } catch (err: unknown) {
      show('error', err instanceof Error ? err.message : 'Failed to update the account');
      // Re-fetch so a rejected change does not leave the row showing a value the
      // server refused.
      await fetchAccounts();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserCog className="w-4 h-4 text-muted" aria-hidden="true" />
          <h3 className="text-sm font-extrabold">Admin Accounts</h3>
          <span className="text-[11px] text-muted">{accounts.length}</span>
        </div>
        <button
          type="button"
          onClick={() => setCreating((open) => !open)}
          className="button button--ghost text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
        >
          {creating ? <X size={13} /> : <Plus size={13} />}
          <span>{creating ? 'Cancel' : 'Add account'}</span>
        </button>
      </div>

      {notice && (
        <div
          className={`p-3 rounded border text-xs flex items-center gap-2 ${
            notice.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 size={14} className="shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {creating && (
        <form onSubmit={handleCreate} className="calculator-card p-4 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-muted block mb-1" htmlFor="new-admin-name">
                Full name
              </label>
              <input
                id="new-admin-name"
                type="text"
                required
                minLength={2}
                className="form-input text-xs w-full"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div>
              <label className="font-bold text-muted block mb-1" htmlFor="new-admin-email">
                Email
              </label>
              <input
                id="new-admin-email"
                type="email"
                required
                autoComplete="off"
                className="form-input text-xs w-full"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="font-bold text-muted block mb-1" htmlFor="new-admin-password">
                Initial password
              </label>
              <input
                id="new-admin-password"
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                className="form-input text-xs w-full"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <span className="text-[10px] text-muted block mt-1">
                At least {MIN_PASSWORD_LENGTH} characters. Send it to them by a separate
                channel; they can change it once signed in.
              </span>
            </div>
            <div>
              <label className="font-bold text-muted block mb-1" htmlFor="new-admin-role">
                Role
              </label>
              <select
                id="new-admin-role"
                className="form-select text-xs w-full"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as AdminRole }))}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-muted block mt-1">
                {ROLE_OPTIONS.find((o) => o.value === form.role)?.detail}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="button button--solid text-xs py-2 px-4 disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {saving && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
              <span>{saving ? 'Creating…' : 'Create account'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="calculator-card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted mx-auto" aria-hidden="true" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted">
                  <th className="py-2 px-3 font-bold">Name</th>
                  <th className="py-2 px-3 font-bold">Email</th>
                  <th className="py-2 px-3 font-bold">Role</th>
                  <th className="py-2 px-3 font-bold text-right">Access</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => {
                  const isSelf = account.id === currentUser.id;
                  const busy = busyId === account.id;
                  return (
                    <tr key={account.id} className="border-b border-border last:border-0">
                      <td className="py-2 px-3 font-semibold">
                        {account.fullName}
                        {isSelf && <span className="text-muted font-normal"> (you)</span>}
                      </td>
                      <td className="py-2 px-3 text-muted">{account.email}</td>
                      <td className="py-2 px-3">
                        <select
                          aria-label={`Role for ${account.email}`}
                          className="form-select text-xs py-1"
                          value={account.role}
                          // Your own role is fixed here: this console has no
                          // recovery path, so demoting yourself out of account
                          // management would lock everyone out.
                          disabled={busy || isSelf}
                          onChange={(e) => patch(account, { role: e.target.value as AdminRole })}
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {busy ? (
                          <Loader2
                            size={13}
                            className="animate-spin text-muted inline"
                            aria-hidden="true"
                          />
                        ) : (
                          <label className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                            <input
                              type="checkbox"
                              checked={account.isActive}
                              disabled={isSelf}
                              onChange={(e) => patch(account, { isActive: e.target.checked })}
                            />
                            <span>{account.isActive ? 'Enabled' : 'Disabled'}</span>
                          </label>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
