'use client';

import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { adminLogin, AdminUser } from '@/lib/api/admin';

interface AdminLoginFormProps {
  onSuccess: (user: AdminUser) => void;
}

export function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [email, setEmail] = useState<string>('admin@asthiwar.com');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await adminLogin({ email, password });
      onSuccess(res.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please check credentials.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-foreground/10 border border-border flex items-center justify-center mx-auto mb-4 text-foreground shadow-lg">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">
          ASTHIWAR Admin Portal
        </h1>
        <p className="text-xs text-muted">
          Executive control center • Pricing matrix, estimates, & enquiries
        </p>
      </div>

      <div className="calculator-card p-6">
        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label flex items-center gap-1.5" htmlFor="admin-email">
              <Mail className="w-4 h-4 text-muted" />
              <span>Admin Email</span>
            </label>
            <input
              id="admin-email"
              type="email"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@asthiwar.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-1.5" htmlFor="admin-password">
              <Lock className="w-4 h-4 text-muted" />
              <span>Password</span>
            </label>
            <input
              id="admin-password"
              type="password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button button--solid w-full py-3 text-xs flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-center space-y-1.5">
          <span className="text-[11px] text-muted block">
            Default seed credentials: <code className="text-foreground font-mono">admin@asthiwar.com</code> / <code className="text-foreground font-mono">ChangeMe@2026!</code>
          </span>
          <span className="text-[10px] text-muted block">
            Protected by bcrypt hashing & secure HttpOnly cookie sessions.
          </span>
        </div>
      </div>
    </div>
  );
}
