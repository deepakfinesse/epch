'use client';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '@/store/ui-store';
import { useEffect } from 'react';

export function useFairs() {
  const { fairId, setFairId } = useUIStore();

  const query = useQuery({
    queryKey: ['fairs'],
    queryFn: async () => {
      const res = await fetch('/api/epch/fairs');
      if (!res.ok) throw new Error('Failed to fetch fairs');
      return res.json();
    },
    staleTime: 10 * 60_000,
  });

  // Auto-select the first fair (newest) when none is chosen
  useEffect(() => {
    if (!fairId && query.data?.fairs?.length) {
      setFairId(query.data.fairs[0].id);
    }
  }, [fairId, query.data, setFairId]);

  return { ...query, fairId };
}
