import { NextResponse } from 'next/server';
import { HALL_CONFIGS, BLOCK_GROUPS } from '@/lib/hall-config';
import { getStallsForHalls } from '@/lib/stall-source';

export async function GET(req, { params }) {
  const { block } = await params;
  const blockGroup = BLOCK_GROUPS.find((b) => b.block === block.toUpperCase());
  if (!blockGroup) {
    return NextResponse.json({ error: 'Block not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const fairId = searchParams.get('fair_id') || '';

  const halls   = blockGroup.halls.map((id) => HALL_CONFIGS[id]).filter(Boolean);
  const hallIds = halls.map((h) => h.id);
  const stalls  = await getStallsForHalls(hallIds, fairId);

  // Per-hall stats — use actual stall count from API, not hardcoded totalStalls
  const hallsWithStats = halls.map((hall) => {
    const hs        = stalls.filter((s) => s.hallId === hall.id);
    const total     = hs.length;
    const allotted  = hs.filter((s) => s.status === 'allotted').length;
    const reserved  = hs.filter((s) => s.status === 'reserved').length;
    const available = Math.max(0, total - allotted - reserved);
    return {
      ...hall,
      stats: { total, allotted, reserved, available },
    };
  });

  return NextResponse.json({ blockGroup, halls: hallsWithStats, stalls });
}
