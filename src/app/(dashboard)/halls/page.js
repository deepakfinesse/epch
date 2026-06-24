'use client';
import { useHalls } from '@/hooks/useHall';
import Link from 'next/link';
import { ArrowRight, Building2, MapPin, RefreshCw } from 'lucide-react';
import { BLOCK_GROUPS, HALL_LIST } from '@/lib/hall-config';
import { pct, formatNumber } from '@/lib/utils';

export default function HallsPage() {
  const { data, isLoading, isFetching, refetch } = useHalls();
  const halls = data?.halls || HALL_LIST.map((h) => ({ ...h, stats: { total: h.totalStalls, available: 0, allotted: 0, reserved: 0, occupiedPct: 0 } }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Hall Maps</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {HALL_LIST.length} Halls 
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Halls by block */}
      {BLOCK_GROUPS.map((group) => {
        const groupHalls = halls.filter((h) => group.halls.includes(h.id));
        return (
          <section key={group.block}>
            {/* Block header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ background: group.color }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{group.label}</h3>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs mono px-2 py-0.5 rounded"
                style={{ background: `${group.color}18`, color: group.color, border: `1px solid ${group.color}30` }}>
                Block {group.block}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {groupHalls.map((hall) => (
                <HallCard key={hall.id} hall={hall} isLoading={isLoading} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function HallCard({ hall, isLoading }) {
  const s = hall.stats || {};
  const total = s.total || hall.totalStalls;
  const occupied = (s.allotted || 0) + (s.reserved || 0);
  const occupiedPct = pct(occupied, total);

  return (
    <Link
      href={`/halls/${hall.id}`}
      className="block rounded-xl p-4 transition-all hover:scale-[1.01] group"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border)`,
        '--tw-shadow': `0 0 0 0 ${hall.blockColor}`,
      }}
    >
      {/* Hall header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: hall.blockColor }} />
            <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{hall.name}</h4>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{hall.description}</p>
        </div>
        <ArrowRight
          size={14}
          className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
          style={{ color: hall.blockColor }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {formatNumber(total)} stalls
        </span>
        <span className="text-xs font-medium mono" style={{ color: hall.blockColor }}>
          {occupiedPct}%
        </span>
      </div>

      {/* Mini occupancy bar */}
      {isLoading ? (
        <div className="h-2 rounded-full animate-pulse" style={{ background: 'var(--border)' }} />
      ) : (
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
          <div
            className="h-full rounded-full flex overflow-hidden"
            style={{ width: '100%' }}
          >
            {[
              { key: 'allotted', color: '#ff6b35', val: s.allotted || 0 },
              { key: 'reserved', color: '#f59e0b', val: s.reserved || 0 },
              { key: 'available', color: '#00d4aa', val: s.available || 0 },
            ].map(({ key, color, val }) => {
              const w = pct(val, total);
              return w > 0 ? (
                <div key={key} style={{ width: `${w}%`, background: color, minWidth: 2 }} />
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Status chips */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {[
          { label: 'Allotted', color: '#ff6b35', val: s.allotted || 0 },
          { label: 'Reserved', color: '#f59e0b', val: s.reserved || 0 },
          { label: 'Available', color: '#00d4aa', val: s.available || 0 },
        ].map(({ label, color, val }) => (
          <span key={label} className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
            {label} {val}
          </span>
        ))}
      </div>

      {/* Floor label */}
      <div className="flex items-center gap-1 mt-3">
        <MapPin size={10} style={{ color: 'var(--text-muted)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{hall.floorLabel}</span>
      </div>
    </Link>
  );
}
