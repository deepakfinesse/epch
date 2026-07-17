'use client';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '@/store/ui-store';

export function useBlockDetail(block) {
  const fairId = useUIStore((s) => s.fairId);

  return useQuery({
    queryKey: ['block', block, fairId],
    queryFn: async () => {
      const url = `/api/blocks/${block}${fairId ? `?fair_id=${fairId}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch block data');
      return res.json();
    },
    enabled: Boolean(block) && Boolean(fairId),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
