'use client';
import { useQuery } from '@tanstack/react-query';

export function useBlockDetail(block) {
  return useQuery({
    queryKey: ['block', block],
    queryFn: async () => {
      const res = await fetch(`/api/blocks/${block}`);
      if (!res.ok) throw new Error('Failed to fetch block data');
      return res.json();
    },
    enabled: Boolean(block),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
