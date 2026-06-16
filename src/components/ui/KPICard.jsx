'use client';
import { cn, formatNumber } from '@/lib/utils';

export default function KPICard({ label, value, sub, icon: Icon, color = '#38bdf8', trend }) {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-4 transition-colors hover:border-opacity-60"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      {Icon && (
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}1a`, border: `1px solid ${color}30` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs mb-1 truncate" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-2xl font-bold mono leading-none" style={{ color: 'var(--text-primary)' }}>
          {formatNumber(value)}
        </p>
        {sub && (
          <p className="text-xs mt-1.5 truncate" style={{ color: 'var(--text-secondary)' }}>{sub}</p>
        )}
      </div>
      {trend !== undefined && (
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded self-start"
          style={{
            background: trend >= 0 ? 'rgba(0,212,170,0.1)' : 'rgba(255,107,53,0.1)',
            color: trend >= 0 ? '#00d4aa' : '#ff6b35',
          }}
        >
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
  );
}
