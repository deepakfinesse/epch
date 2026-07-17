import { NextResponse } from 'next/server';
import { HALL_LIST } from '@/lib/hall-config';
import { getStallsForHalls } from '@/lib/stall-source';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const fairId = searchParams.get('fair_id') || '';

  const allHallIds = HALL_LIST.map((h) => h.id);
  const allStalls  = await getStallsForHalls(allHallIds, fairId);

  // Build stat map: hallId → { total, allotted, reserved }
  const statMap = {};
  for (const s of allStalls) {
    if (!statMap[s.hallId]) statMap[s.hallId] = { total: 0, allotted: 0, reserved: 0 };
    statMap[s.hallId].total++;
    if (s.status === 'allotted') statMap[s.hallId].allotted++;
    if (s.status === 'reserved') statMap[s.hallId].reserved++;
  }

  const halls = HALL_LIST.map((cfg) => {
    const s        = statMap[cfg.id] || {};
    const total    = s.total    || 0;
    const allotted = s.allotted || 0;
    const reserved = s.reserved || 0;
    const available = Math.max(0, total - allotted - reserved);
    const occupied  = allotted + reserved;
    return {
      ...cfg,
      stats: {
        total,
        available,
        allotted,
        reserved,
        occupiedPct: total ? Math.round((occupied / total) * 100) : 0,
      },
    };
  });

  return NextResponse.json({ halls });
}
