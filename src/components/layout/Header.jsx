'use client';
import { useUIStore } from '@/store/ui-store';
import { Menu, RefreshCw, WifiOff, Clock, LogOut } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import FairSelector from '@/components/ui/FairSelector';

export default function Header({ title }) {
  const { toggleSidebar, lastSyncAt, syncStatus } = useUIStore();
  const router = useRouter();
  const isErpLive = Boolean(process.env.NEXT_PUBLIC_ERP_POLL_INTERVAL);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <header
      className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 gap-4"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Left: mobile menu button + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>
        <div>
          {/* <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title || process.env.NEXT_PUBLIC_EDITION || 'IHGF Delhi Fair 2026'}
          </h1> */}
          {/* <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            India Expo Center &amp; Mart, Greater Noida
          </p> */}
        </div>
      </div>

      {/* Centre: fair selector */}
      <div className="flex-1 flex justify-center px-4">
        <FairSelector />
      </div>

      {/* Right: sync indicator + logout */}
      <div className="flex items-center gap-3">
        {/* ERP sync badge */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{
            background: isErpLive ? 'rgba(0,212,170,0.08)' : 'rgba(71,85,105,0.12)',
            border: `1px solid ${isErpLive ? 'rgba(0,212,170,0.25)' : 'rgba(71,85,105,0.3)'}`,
            color: isErpLive ? 'var(--status-available)' : 'var(--text-muted)',
          }}
        >
          {syncStatus === 'syncing' ? (
            <RefreshCw size={11} className="animate-spin" />
          ) : isErpLive ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
          ) : (
            <WifiOff size={11} />
          )}
          <span>{isErpLive ? 'ERP Live' : 'ERP Pending'}</span>
        </div>

        {/* Last sync time */}
        {lastSyncAt && (
          <div className="hidden md:flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Clock size={11} />
            <span>Synced {timeAgo(lastSyncAt)}</span>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign out"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-red-50"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
