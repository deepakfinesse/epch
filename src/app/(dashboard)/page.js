'use client';
import { useUpdates } from '@/hooks/useUpdates';
import KPICard from '@/components/ui/KPICard';
import { Building2, CheckCircle, Clock, Layers, RefreshCw, ArrowRight, Activity } from 'lucide-react';
import { timeAgo, formatNumber, pct } from '@/lib/utils';
import Link from 'next/link';
import { HALL_LIST } from '@/lib/hall-config';

export default function DashboardPage() {
  const { data, isLoading, isFetching, refetch } = useUpdates(25);

  const stats = data?.stats || {};
  const logs  = data?.logs  || [];

  const occupancyPct = pct((stats.allotted || 0) + (stats.reserved || 0), stats.total);

  const kpis = [
    {
      label: 'Total Stalls',
      value: stats.total || '—',
      icon: Building2,
      color: '#38bdf8',
      sub: `Across ${HALL_LIST.length} halls`,
    },
    {
      label: 'Allotted',
      value: stats.allotted || 0,
      icon: CheckCircle,
      color: '#ff6b35',
      sub: `${pct(stats.allotted, stats.total)}% of total`,
    },
    {
      label: 'Reserved',
      value: stats.reserved || 0,
      icon: Clock,
      color: '#f59e0b',
      sub: `${pct(stats.reserved, stats.total)}% of total`,
    },
    {
      label: 'Available',
      value: stats.available || 0,
      icon: Layers,
      color: '#00d4aa',
      sub: `${pct(stats.available, stats.total)}% of total`,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Dashboard Overview
          </h2>
          {/* <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            61st IHGF Delhi Fair · Feb 14–18, 2026 · India Expo Center, Greater Noida
          </p> */}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => <KPICard key={kpi.label} {...kpi} />)}
      </div>

      {/* Overall occupancy bar */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Overall Occupancy</p>
          <span className="text-sm font-bold mono" style={{ color: 'var(--accent-blue)' }}>{occupancyPct}%</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
          {[
            { key: 'allotted', color: '#ff6b35' },
            { key: 'reserved', color: '#f59e0b' },
            { key: 'available', color: '#00d4aa' },
          ].map(({ key, color }) => {
            const w = pct(stats[key] || 0, stats.total || 1);
            return w > 0 ? (
              <div key={key} style={{ width: `${w}%`, background: color, minWidth: 3 }} title={`${key}: ${w}%`} />
            ) : null;
          })}
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-2.5">
          {[
            { label: 'Allotted', color: '#ff6b35', key: 'allotted' },
            { label: 'Reserved', color: '#f59e0b', key: 'reserved' },
            { label: 'Available', color: '#00d4aa', key: 'available' },
          ].map(({ label, color, key }) => (
            <div key={key} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              {label} · {formatNumber(stats[key] || 0)}
            </div>
          ))}
        </div>
      </div>

      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <Activity size={15} style={{ color: 'var(--accent-blue)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
            </div>
            {isFetching && <RefreshCw size={12} className="animate-spin" style={{ color: 'var(--text-muted)' }} />}
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {isLoading
              ? <ActivitySkeleton />
              : logs.length === 0
                ? <EmptyState message="No activity yet. Upload CSV data to get started." />
                : logs.slice(0, 12).map((log, i) => (
                    <div key={log._id || i} className="px-4 py-2.5 flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ background: log.source === 'erp' ? '#38bdf8' : '#a78bfa' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                          {log.description || log.action}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {timeAgo(log.createdAt)}
                          {log.source && (
                            <span className="ml-2 uppercase px-1.5 py-0.5 rounded"
                              style={{
                                background: log.source === 'erp' ? 'rgba(56,189,248,0.1)' : 'rgba(167,139,250,0.1)',
                                color: log.source === 'erp' ? '#38bdf8' : '#a78bfa',
                                fontSize: 9,
                              }}>
                              {log.source}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))
            }
          </div>
        </div>

        
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <Building2 size={15} style={{ color: 'var(--accent-blue)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Quick Access</h3>
            </div>
            <Link href="/halls" className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: 'var(--accent-blue)' }}>
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="p-3 grid grid-cols-3 gap-2">
            {HALL_LIST.slice(0, 12).map((hall) => (
              <Link key={hall.id} href={`/halls/${hall.id}`}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg text-center transition-colors hover:bg-white/5"
                style={{ border: '1px solid var(--border)' }}>
                <span className="text-xs font-bold mono" style={{ color: hall.blockColor }}>{hall.name}</span>
                <span className="mt-0.5" style={{ color: 'var(--text-muted)', fontSize: 10 }}>Block {hall.block}</span>
              </Link>
            ))}
          </div>
          <div className="px-3 pb-3">
            <Link href="/halls"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs transition-colors hover:bg-white/5"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              View all 17 halls <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div> */}
    </div>
  );
}

function ActivitySkeleton() {
  return Array.from({ length: 6 }).map((_, i) => (
    <div key={i} className="px-4 py-2.5 flex gap-3">
      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--border)' }} />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 rounded animate-pulse w-3/4" style={{ background: 'var(--border)' }} />
        <div className="h-2 rounded animate-pulse w-1/3" style={{ background: 'var(--bg-secondary)' }} />
      </div>
    </div>
  ));
}

function EmptyState({ message }) {
  return (
    <div className="px-4 py-8 text-center">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
}
