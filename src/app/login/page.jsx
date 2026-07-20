'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setError('Invalid username or password.');
        return;
      }
      router.replace(params.get('from') || '/');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
      {error && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
          style={{
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.25)',
            color: '#dc2626',
          }}
        >
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Username
        </label>
        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            autoComplete="username"
            required
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            placeholder="Enter username"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
            onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Password
        </label>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Enter password"
            className="w-full pl-9 pr-10 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
            onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff' }}
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div
        className="w-full max-w-sm rounded-2xl shadow-lg overflow-hidden "
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Header band */}
        <div className="px-8 pt-8 pb-6 text-center bg-[#742574] text-center" style={{ borderBottom: '1px solid var(--border)' }}>
          <img src="/logo.png" alt="EPCH" className="h-14 text-center" />
          {/* <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
          >
            <Building2 size={22} color="#fff" />
          </div> */}
          {/* <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            EPCH
          </h1> */}
          {/* <p className="text-xs mt-0.5" style={{ color: 'var(--text-white)' }}>
            Dashboard
          </p> */}
        </div>

        <Suspense fallback={<div className="px-8 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>}>
          <LoginForm />
        </Suspense>

        {/* <p className="text-center text-xs pb-5" style={{ color: 'var(--text-muted)' }}>
          India Expo Center &amp; Mart, Greater Noida
        </p> */}
      </div>
    </div>
  );
}
