'use client';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, Sector,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, RefreshCw, TrendingUp } from 'lucide-react';
import { formatNumber, pct } from '@/lib/utils';
import { useState } from 'react';

const STATUS_COLORS = {
  allotted:  '#ff6b35',
  reserved:  '#f59e0b',
  available: '#00d4aa',
};

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: '#0d1421',
    border: '1px solid #1e2d45',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 12,
  },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

export default function AnalyticsPage() {
  const { data, isLoading, isFetching, refetch } = useAnalytics();
  const [activeIndex, setActiveIndex] = useState(null);

  const hallStats   = data?.hallStats   || [];
  const overall     = data?.overall     || {};
  const categories  = data?.categories  || [];

  const totalOccupied = (overall.allotted || 0) + (overall.reserved || 0);
  const totalAll = overall.total || 1;

  const summaryCards = [
    { label: 'Total Stalls Tracked', value: overall.total || 0, color: '#38bdf8' },
    { label: 'Allotted', value: overall.allotted || 0, color: '#ff6b35', pct: pct(overall.allotted, totalAll) },
    { label: 'Reserved', value: overall.reserved || 0, color: '#f59e0b', pct: pct(overall.reserved, totalAll) },
    { label: 'Available', value: overall.available || 0, color: '#00d4aa', pct: pct(overall.available, totalAll) },
  ];

  // Build pie data
  const pieData = [
    { name: 'Allotted',  value: overall.allotted  || 0, color: '#ff6b35' },
    { name: 'Reserved',  value: overall.reserved  || 0, color: '#f59e0b' },
    { name: 'Available', value: overall.available || 0, color: '#00d4aa' },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Hall occupancy, category distribution & availability summary
          </p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="p-4 rounded-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
            <p className="text-2xl font-bold mono" style={{ color: 'var(--text-primary)' }}>
              {formatNumber(c.value)}
            </p>
            {c.pct !== undefined && (
              <p className="text-xs mt-1" style={{ color: c.color }}>{c.pct}% of total</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Hall-wise occupancy bar chart */}
        <div className="xl:col-span-2 p-4 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={15} style={{ color: 'var(--accent-blue)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Hall-wise Occupancy</h3>
          </div>
          {isLoading ? (
            <ChartSkeleton height={300} />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={hallStats} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hallName" tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v.replace('Hall ', 'H')} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />
                <Bar dataKey="allotted"  name="Allotted"  stackId="a" fill="#ff6b35" radius={[0,0,0,0]} />
                <Bar dataKey="reserved"  name="Reserved"  stackId="a" fill="#f59e0b" radius={[0,0,0,0]} />
                <Bar dataKey="available" name="Available" stackId="a" fill="#00d4aa" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Overall distribution pie */}
        <div className="p-4 rounded-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <PieIcon size={15} style={{ color: 'var(--accent-blue)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Distribution</h3>
          </div>
          {isLoading ? (
            <ChartSkeleton height={220} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    onMouseEnter={(_, i) => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {pieData.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE.contentStyle}
                    formatter={(v) => [formatNumber(v), '']}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centre label */}
              <div className="flex flex-col items-center -mt-2 mb-4">
                <p className="text-2xl font-bold mono" style={{ color: 'var(--text-primary)' }}>
                  {pct(totalOccupied, totalAll)}%
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Occupied</p>
              </div>

              <div className="space-y-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="mono font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatNumber(d.value)}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>({pct(d.value, totalAll)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Category distribution */}
      {categories.length > 0 && (
        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} style={{ color: 'var(--accent-blue)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Product Category Distribution (Top {categories.length})
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={150}
                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [formatNumber(v), 'Exhibitors']} />
              <Bar dataKey="value" name="Exhibitors" radius={[0, 4, 4, 0]}>
                {categories.map((_, i) => (
                  <Cell key={i} fill={`hsl(${200 + i * 18}, 70%, 55%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ChartSkeleton({ height }) {
  return (
    <div
      className="rounded-lg animate-pulse"
      style={{ height, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    />
  );
}
