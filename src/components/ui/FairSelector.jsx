'use client';
import { useFairs } from '@/hooks/useFairs';
import { useUIStore } from '@/store/ui-store';
import { CalendarDays, ChevronDown } from 'lucide-react';

export default function FairSelector() {
  const { data, isLoading, error } = useFairs();
  const { fairId, setFairId } = useUIStore();
  const fairs = data?.fairs || [];

  if (isLoading) {
    return (
      <div className="h-8 w-56 animate-pulse rounded-lg"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }} />
    );
  }

  if (error) {
    return (
      <span className="text-xs px-3 py-1.5 rounded-lg"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
        Fair API unavailable
      </span>
    );
  }

  return (
    <div className="relative flex items-center">
      <CalendarDays size={13} className="absolute left-2.5 pointer-events-none"
        style={{ color: 'var(--text-muted)' }} />
      <select
        value={fairId || ''}
        onChange={(e) => setFairId(e.target.value || null)}
        className="text-xs pl-8 pr-7 py-2 rounded-lg appearance-none outline-none cursor-pointer"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          color: fairId ? 'var(--text-primary)' : 'var(--text-muted)',
          minWidth: 220,
          maxWidth: 320,
        }}
      >
        {!fairId && <option value="">— Select Fair —</option>}
        {fairs.map((f) => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 pointer-events-none"
        style={{ color: 'var(--text-muted)' }} />
    </div>
  );
}
