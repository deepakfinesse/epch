'use client';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '@/store/ui-store';
import { useEffect } from 'react';

async function fetchUpdates(limit = 20) {
  const res = await fetch(`/api/updates?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch updates');
  return res.json();
}

export function useUpdates(limit = 20) {
  const setLastSyncAt = useUIStore((s) => s.setLastSyncAt);

  const query = useQuery({
    queryKey: ['updates', limit],
    queryFn: () => fetchUpdates(limit),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (query.dataUpdatedAt) setLastSyncAt(new Date(query.dataUpdatedAt));
  }, [query.dataUpdatedAt, setLastSyncAt]);

  return query;
}
