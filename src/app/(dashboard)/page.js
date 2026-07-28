'use client';
'use client';
import { useState, useRef, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useUIStore } from '@/store/ui-store';
import KPICard from '@/components/ui/KPICard';
import { Building2, CheckCircle, Layers, RefreshCw, BarChart2, Tag, Download, ChevronDown } from 'lucide-react';
import { formatNumber, pct } from '@/lib/utils';
import Link from 'next/link';
import { BLOCK_GROUPS } from '@/lib/hall-config';

export default function DashboardPage() {
  const { data, isLoading, isFetching, refetch } = useAnalytics();
  const fairId = useUIStore((s) => s.fairId);

  const overall    = data?.overall    || {};
  const hallStats  = data?.hallStats  || [];
  const categories = data?.categories || [];

  const total    = overall.total    || 0;
  const allotted = overall.allotted || 0;
  const available = overall.available || 0;
  const occupancyPct = pct(allotted, total);

  const kpis = [
    { label: 'Total Stalls',  value: total,        icon: Building2,   color: '#38bdf8', sub: '17 halls · 6 blocks' },
    { label: 'Allotted',      value: allotted,      icon: CheckCircle, color: '#ff6b35', sub: `${pct(allotted, total)}% occupied` },
    { label: 'Available',     value: available,     icon: Layers,      color: '#00d4aa', sub: `${pct(available, total)}% remaining` },
    // { label: 'Occupancy',     value: `${occupancyPct}%`, icon: TrendingUp, color: '#a78bfa', sub: `${formatNumber(allotted)} of ${formatNumber(total)} filled` },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard Overview</h2>
        <div className="flex items-center gap-2">
          <DownloadMenu fairId={fairId} />
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => <KPICard key={k.label} {...k} />)}
      </div>

      {/* Overall occupancy bar */}
      <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Overall Occupancy</p>
          <span className="text-sm font-bold mono" style={{ color: '#a78bfa' }}>{occupancyPct}%</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
          {[
            { key: 'allotted',  val: allotted,  color: '#ff6b35' },
            { key: 'available', val: available, color: '#00d4aa' },
          ].map(({ key, val, color }) => {
            const w = pct(val, total || 1);
            return w > 0 ? <div key={key} style={{ width: `${w}%`, background: color, minWidth: 3 }} /> : null;
          })}
        </div>
        <div className="flex items-center gap-5 mt-2.5">
          {[
            { label: 'Allotted',  color: '#ff6b35', val: allotted },
            { label: 'Available', color: '#00d4aa', val: available },
          ].map(({ label, color, val }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              {label} · <span className="font-semibold mono" style={{ color }}>{formatNumber(val)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hall-wise breakdown + Category side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Hall-wise breakdown — 2/3 width */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <BarChart2 size={15} style={{ color: 'var(--accent-blue)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Hall-wise Breakdown</h3>
          </div>
          <div className="p-4 space-y-3">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 rounded animate-pulse w-1/4" style={{ background: 'var(--border)' }} />
                    <div className="h-4 rounded animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                ))
              : hallStats.map((h) => {
                  const hallTotal = h.total || 1;
                  const allottedW = pct(h.allotted, hallTotal);
                  const availW    = pct(h.available, hallTotal);
                  return (
                    <Link key={h.hallId} href={`/halls/${h.hallId}`} className="block group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: h.blockColor }} />
                          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{h.hallName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span className="mono" style={{ color: '#ff6b35' }}>{h.allotted}</span>
                          <span>/</span>
                          <span className="mono" style={{ color: '#00d4aa' }}>{h.available}</span>
                          <span className="mono font-semibold" style={{ color: h.blockColor }}>{h.occupiedPct}%</span>
                        </div>
                      </div>
                      <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                        {allottedW > 0 && <div style={{ width: `${allottedW}%`, background: '#ff6b35', minWidth: 2 }} />}
                        {availW    > 0 && <div style={{ width: `${availW}%`,    background: '#00d4aa', minWidth: 2 }} />}
                      </div>
                    </Link>
                  );
                })
            }
          </div>
          <div className="px-4 pb-3 flex items-center gap-5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#ff6b35' }} />Allotted</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#00d4aa' }} />Available</span>
          </div>
        </div>

        {/* Category distribution — 1/3 width */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <Tag size={15} style={{ color: 'var(--accent-blue)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Top Categories</h3>
          </div>
          <div className="p-4 space-y-2.5">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 rounded animate-pulse w-3/4" style={{ background: 'var(--border)' }} />
                    <div className="h-2 rounded animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                ))
              : categories.length === 0
                ? <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No category data</p>
                : categories.map((cat, i) => {
                    const maxVal = categories[0]?.value || 1;
                    const barW   = Math.round((cat.value / maxVal) * 100);
                    return (
                      <div key={cat.name}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs truncate pr-2" style={{ color: 'var(--text-secondary)', maxWidth: '75%' }} title={cat.name}>
                            {i + 1}. {cat.name}
                          </span>
                          <span className="text-xs font-semibold mono shrink-0" style={{ color: '#ff6b35' }}>{cat.value}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                          <div style={{ width: `${barW}%`, background: '#ff6b35', opacity: 0.7 + i * -0.03 }} className="h-full rounded-full" />
                        </div>
                      </div>
                    );
                  })
            }
          </div>
        </div>
      </div>

      {/* Hall-wise Area & Category table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <BarChart2 size={15} style={{ color: 'var(--accent-blue)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Hall-wise Area & Categories</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                {['Hall', 'Block', 'Total Stalls', 'Allotted', 'Available', 'Total Area (sqm)', 'Allotted Area (sqm)', 'Top Categories'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-3 py-2.5">
                          <div className="h-3 rounded animate-pulse w-16" style={{ background: 'var(--border)' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : hallStats.map((h) => (
                    <tr key={h.hallId}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="px-3 py-2.5">
                        <Link href={`/halls/${h.hallId}`} className="flex items-center gap-2 hover:underline">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: h.blockColor }} />
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{h.hallName}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 rounded text-xs font-bold mono"
                          style={{ background: `${h.blockColor}18`, color: h.blockColor }}>
                          {h.block}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 mono font-medium" style={{ color: 'var(--text-primary)' }}>{h.total}</td>
                      <td className="px-3 py-2.5 mono font-semibold" style={{ color: '#ff6b35' }}>{h.allotted}</td>
                      <td className="px-3 py-2.5 mono font-semibold" style={{ color: '#00d4aa' }}>{h.available}</td>
                      <td className="px-3 py-2.5 mono" style={{ color: 'var(--text-secondary)' }}>{formatNumber(h.totalArea)}</td>
                      <td className="px-3 py-2.5 mono" style={{ color: '#ff6b35' }}>{formatNumber(h.allottedArea)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {(h.topCategories || []).map((cat) => (
                            <span key={cat.name}
                              className="px-1.5 py-0.5 rounded text-xs truncate max-w-35"
                              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                              title={`${cat.name} (${cat.count})`}>
                              {cat.name} <span className="font-bold" style={{ color: 'var(--text-muted)' }}>·{cat.count}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Block summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        {BLOCK_GROUPS.map((group) => {
          const blockHalls = hallStats.filter((h) => group.halls.includes(h.hallId));
          const bTotal    = blockHalls.reduce((s, h) => s + h.total, 0);
          const bAllotted = blockHalls.reduce((s, h) => s + h.allotted, 0);
          const bAvail    = blockHalls.reduce((s, h) => s + h.available, 0);
          const bPct      = pct(bAllotted, bTotal);
          return (
            <div key={group.block} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: `1px solid ${group.color}30` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: group.color }} />
                <span className="text-sm font-bold mono" style={{ color: group.color }}>Block {group.block}</span>
              </div>
              <p className="text-xl font-bold mono" style={{ color: 'var(--text-primary)' }}>{bPct}%</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatNumber(bAllotted)} allotted</p>
              <p className="text-xs" style={{ color: '#00d4aa' }}>{formatNumber(bAvail)} available</p>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                <div style={{ width: `${bPct}%`, background: group.color }} className="h-full rounded-full" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const REPORT_OPTIONS = [
  { type: 'all',       label: 'All Stalls Report',       desc: 'Every stall with participant details' },
  { type: 'allotted',  label: 'Allotted Stalls Report',  desc: 'Only allotted stalls + exhibitor info' },
  { type: 'available', label: 'Available Stalls Report',  desc: 'Only stalls still available' },
];

function DownloadMenu({ fairId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function download(type) {
    if (!fairId) return;
    const url = `/api/export?fair_id=${fairId}&type=${type}`;
    const a   = document.createElement('a');
    a.href    = url;
    a.click();
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={!fairId}
        className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: fairId ? 'var(--text-secondary)' : 'var(--text-muted)',
          cursor: fairId ? 'pointer' : 'not-allowed',
        }}
      >
        <Download size={14} />
        Export
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-64 rounded-xl overflow-hidden z-50 shadow-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {REPORT_OPTIONS.map(({ type, label, desc }) => (
            <button
              key={type}
              onClick={() => download(type)}
              className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-white/5"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <Download size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-blue)' }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
