'use client';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '@/store/ui-store';

async function fetchHalls(fairId) {
  const url = `/api/halls${fairId ? `?fair_id=${fairId}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch halls');
  return res.json();
}

async function fetchHallDetail(hallId, fairId, filters) {
  const params = new URLSearchParams();
  if (fairId) params.set('fair_id', fairId);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters.searchQuery) params.set('q', filters.searchQuery);

  const url = `/api/halls/${hallId}${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch hall ${hallId}`);
  return res.json();
}

export function useHalls() {
  const fairId = useUIStore((s) => s.fairId);

  return useQuery({
    queryKey: ['halls', fairId],
    queryFn: () => fetchHalls(fairId),
    enabled: Boolean(fairId),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useHallDetail(hallId) {
  const { fairId, statusFilter, categoryFilter, searchQuery } = useUIStore();

  return useQuery({
    queryKey: ['hall', hallId, fairId, statusFilter, categoryFilter, searchQuery],
    queryFn: () => fetchHallDetail(hallId, fairId, { status: statusFilter, category: categoryFilter, searchQuery }),
    enabled: Boolean(hallId) && Boolean(fairId),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
