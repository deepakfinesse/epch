import { NextResponse } from 'next/server';
import { HALL_CONFIGS, BLOCK_GROUPS } from '@/lib/hall-config';
import { getStallsForHalls } from '@/lib/stall-source';

export async function GET(req, { params }) {
  const { block } = await params;
  const blockGroup = BLOCK_GROUPS.find((b) => b.block === block.toUpperCase());
  if (!blockGroup) {
    return NextResponse.json({ error: 'Block not found' }, { status: 404 });
  }

  const halls   = blockGroup.halls.map((id) => HALL_CONFIGS[id]).filter(Boolean);
  const hallIds = halls.map((h) => h.id);
  const stalls  = getStallsForHalls(hallIds);

  // Per-hall stats
  const hallsWithStats = halls.map((hall) => {
    const hs = stalls.filter((s) => s.hallId === hall.id);
    const allotted  = hs.filter((s) => s.status === 'allotted').length;
    const reserved  = hs.filter((s) => s.status === 'reserved').length;
    const available = hall.totalStalls - allotted - reserved;
    return {
      ...hall,
      stats: {
        total:    hall.totalStalls,
        allotted,
        reserved,
        available: Math.max(0, available),
      },
    };
  });

  return NextResponse.json({ blockGroup, halls: hallsWithStats, stalls });
}
