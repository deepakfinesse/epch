'use client';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '@/store/ui-store';

async function fetchHalls() {
  const res = await fetch('/api/halls');
  if (!res.ok) throw new Error('Failed to fetch halls');
  return res.json();
}

async function fetchHallDetail(hallId, filters) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters.searchQuery) params.set('q', filters.searchQuery);

  const url = `/api/halls/${hallId}${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch hall ${hallId}`);
  return res.json();
}

export function useHalls() {
  return useQuery({
    queryKey: ['halls'],
    queryFn: fetchHalls,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useHallDetail(hallId) {
  const { statusFilter, categoryFilter, searchQuery } = useUIStore();

  return useQuery({
    queryKey: ['hall', hallId, statusFilter, categoryFilter, searchQuery],
    queryFn: () => fetchHallDetail(hallId, { status: statusFilter, category: categoryFilter, searchQuery }),
    enabled: Boolean(hallId),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
