'use client';
import { use, useEffect } from 'react';
import { useHallDetail } from '@/hooks/useHall';
import { useUIStore } from '@/store/ui-store';
import HallMap from '@/components/hall/HallMap';
import FilterBar from '@/components/hall/FilterBar';
import { HALL_CONFIGS } from '@/lib/hall-config';
import { ArrowLeft, Building2, Layers, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { formatNumber, pct } from '@/lib/utils';

export default function HallDetailPage({ params }) {
  const { hallId } = use(params);
  const id = parseInt(hallId, 10);
  const hallConfig = HALL_CONFIGS[id];

  const { data, isLoading, isFetching, refetch, error } = useHallDetail(id);
  const clearFilters = useUIStore((s) => s.clearFilters);

  // Clear filters when navigating to a new hall
  useEffect(() => {
    clearFilters();
  }, [id, clearFilters]);

  if (!hallConfig) {
    return (
      <div className="p-6 text-center">
        <p style={{ color: 'var(--text-muted)' }}>Hall {hallId} not found.</p>
        <Link href="/halls" className="text-sm mt-2 block" style={{ color: 'var(--accent-blue)' }}>
          ← Back to halls
        </Link>
      </div>
    );
  }

  const hall   = data?.hall || hallConfig;
  const stalls = data?.stalls || [];
  const stats  = data?.stats || {};
  const cats   = data?.categories || [];

  return (
    <div className="p-6 max-w-full space-y-4">
      {/* Breadcrumb + header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/halls"
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {hall.name}
              </h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium mono"
                style={{
                  background: `${hallConfig.blockColor}18`,
                  color: hallConfig.blockColor,
                  border: `1px solid ${hallConfig.blockColor}35`,
                }}
              >
                Block {hall.block}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {hall.floorLabel} · {hall.aisleCount} Aisles · {hall.aisles?.[0]} to {hall.aisles?.[hall.aisles?.length - 1]}
            </p>
          </div>
        </div>

        {/* Hall stats pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Total', val: stats.total || hallConfig.totalStalls, color: '#38bdf8' },
            { label: 'Allotted', val: stats.allotted || 0, color: '#ff6b35' },
            { label: 'Reserved', val: stats.reserved || 0, color: '#f59e0b' },
            { label: 'Available', val: stats.available || 0, color: '#00d4aa' },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
              style={{ background: `${color}12`, color, border: `1px solid ${color}28` }}>
              <span className="font-bold mono">{formatNumber(val)}</span>
              <span style={{ opacity: 0.8 }}>{label}</span>
            </div>
          ))}

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar categories={cats} stats={stats} />

      {/* Hall map */}
      {error ? (
        <div className="p-8 rounded-xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: '#f87171' }}>Failed to load hall data: {error.message}</p>
          <button onClick={() => refetch()} className="mt-3 text-sm" style={{ color: 'var(--accent-blue)' }}>
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <MapSkeleton />
      ) : (
        <div data-hall-container style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          <HallMap hall={hall} stalls={stalls} />
        </div>
      )}

      {/* Stall count summary footer */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{formatNumber(stalls.length)} stalls shown (filtered)</span>
        <span>
          Occupancy: {pct((stats.allotted || 0) + (stats.reserved || 0), stats.total || hallConfig.totalStalls)}%
        </span>
      </div>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div
      className="rounded-xl animate-pulse"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        height: 'calc(100vh - 280px)',
        minHeight: '500px',
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Layers size={28} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading hall map…</p>
        </div>
      </div>
    </div>
  );
}
