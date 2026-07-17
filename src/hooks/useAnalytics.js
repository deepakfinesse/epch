'use client';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '@/store/ui-store';

export function useAnalytics() {
  const fairId = useUIStore((s) => s.fairId);

  return useQuery({
    queryKey: ['analytics', fairId],
    queryFn: async () => {
      const url = `/api/analytics${fairId ? `?fair_id=${fairId}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    enabled: Boolean(fairId),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
