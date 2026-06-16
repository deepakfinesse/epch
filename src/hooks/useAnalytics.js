'use client';
import { useQuery } from '@tanstack/react-query';

async function fetchAnalytics() {
  const res = await fetch('/api/analytics');
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
