'use client';
import { useUIStore } from '@/store/ui-store';
import { Search, Filter, X } from 'lucide-react';
import { STATUS_CONFIG } from '@/lib/hall-config';

export default function FilterBar({ categories = [], stats = {} }) {
  const {
    statusFilter, setStatusFilter,
    categoryFilter, setCategoryFilter,
    searchQuery, setSearchQuery,
    clearFilters,
  } = useUIStore();

  const hasActiveFilter = statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery;

  return (
    <div
      className="flex flex-wrap items-center gap-3 p-3 rounded-xl mb-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Search */}
      {/* <div className="relative flex-1 min-w-48">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search stall, company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm rounded-lg pl-9 pr-3 py-2 outline-none transition-colors"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
      </div> */}

      {/* Status filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className="text-xs px-3 py-1.5 rounded-full transition-colors font-medium"
          style={{
            background: statusFilter === 'all' ? 'rgba(56,189,248,0.15)' : 'var(--bg-secondary)',
            border: `1px solid ${statusFilter === 'all' ? 'rgba(56,189,248,0.4)' : 'var(--border)'}`,
            color: statusFilter === 'all' ? 'var(--accent-blue)' : 'var(--text-secondary)',
          }}
        >
          All ({stats.total || 0})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className="text-xs px-3 py-1.5 rounded-full transition-colors font-medium"
            style={{
              background: statusFilter === key ? cfg.bg : 'var(--bg-secondary)',
              border: `1px solid ${statusFilter === key ? cfg.border : 'var(--border)'}`,
              color: statusFilter === key ? cfg.color : 'var(--text-secondary)',
            }}
          >
            {cfg.label} ({stats[key] || 0})
          </button>
        ))}
      </div>

      {/* Category filter */}
      {/* {categories.length > 0 && (
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs rounded-lg px-3 py-2 outline-none"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            minWidth: '140px',
          }}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )} */}

      {/* Clear filters */}
      {hasActiveFilter && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
          }}
        >
          <X size={11} /> Clear
        </button>
      )}
    </div>
  );
}
