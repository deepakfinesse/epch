'use client';
import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // Hall map view state
  selectedHall: null,
  setSelectedHall: (hall) => set({ selectedHall: hall }),

  // Stall filters
  statusFilter: 'all',       // 'all' | 'available' | 'allotted' | 'reserved' | 'blocked'
  categoryFilter: 'all',
  searchQuery: '',
  setStatusFilter: (f) => set({ statusFilter: f }),
  setCategoryFilter: (f) => set({ categoryFilter: f }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  clearFilters: () => set({ statusFilter: 'all', categoryFilter: 'all', searchQuery: '' }),

  // Tooltip
  hoveredStall: null,
  tooltipPos: { x: 0, y: 0 },
  setHoveredStall: (stall, pos) => set({ hoveredStall: stall, tooltipPos: pos || { x: 0, y: 0 } }),

  // Sidebar state
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // ERP sync status
  lastSyncAt: null,
  syncStatus: 'idle',    // 'idle' | 'syncing' | 'error'
  setLastSyncAt: (t) => set({ lastSyncAt: t }),
  setSyncStatus: (s) => set({ syncStatus: s }),
}));
