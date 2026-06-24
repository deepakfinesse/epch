import { NextResponse } from 'next/server';
import { HALL_LIST } from '@/lib/hall-config';
import { getStallsForHalls } from '@/lib/stall-source';

export async function GET() {
  const allHallIds = HALL_LIST.map((h) => h.id);
  const allStalls  = getStallsForHalls(allHallIds);

  // Build stat map: hallId → { allotted, reserved }
  const statMap = {};
  for (const s of allStalls) {
    if (!statMap[s.hallId]) statMap[s.hallId] = { allotted: 0, reserved: 0 };
    if (statMap[s.hallId][s.status] !== undefined) statMap[s.hallId][s.status]++;
  }

  const halls = HALL_LIST.map((cfg) => {
    const s = statMap[cfg.id] || {};
    const allotted  = s.allotted  || 0;
    const reserved  = s.reserved  || 0;
    const available = Math.max(0, cfg.totalStalls - allotted - reserved);
    const occupied  = allotted + reserved;
    return {
      ...cfg,
      stats: {
        total:       cfg.totalStalls,
        available,
        allotted,
        reserved,
        occupiedPct: cfg.totalStalls ? Math.round((occupied / cfg.totalStalls) * 100) : 0,
      },
    };
  });

  return NextResponse.json({ halls });
}
