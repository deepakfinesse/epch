import { NextResponse } from 'next/server';
import { HALL_LIST } from '@/lib/hall-config';
import { getStallsForHalls } from '@/lib/stall-source';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const fairId = searchParams.get('fair_id') || '';

  if (!fairId) {
    return NextResponse.json({ hallStats: [], overall: { total: 0, allotted: 0, reserved: 0, available: 0 }, categories: [] });
  }

  try {
    const allHallIds = HALL_LIST.map((h) => h.id);
    const allStalls  = await getStallsForHalls(allHallIds, fairId);

    // Per-hall stats
    const hallStallMap = {};
    for (const s of allStalls) {
      if (!hallStallMap[s.hallId]) hallStallMap[s.hallId] = [];
      hallStallMap[s.hallId].push(s);
    }

    const hallStats = HALL_LIST.map((cfg) => {
      const hs       = hallStallMap[cfg.id] || [];
      const total    = hs.length;
      const allotted = hs.filter((s) => s.status === 'allotted').length;
      const reserved = hs.filter((s) => s.status === 'reserved').length;
      const available = Math.max(0, total - allotted - reserved);
      return {
        hallId:      cfg.id,
        hallName:    cfg.name,
        block:       cfg.block,
        blockColor:  cfg.blockColor,
        allotted,
        reserved,
        available,
        total,
        occupiedPct: total ? Math.round((allotted + reserved) / total * 100) : 0,
      };
    });

    // Overall
    const overall = { allotted: 0, reserved: 0, available: 0 };
    for (const s of allStalls) {
      if (s.status in overall) overall[s.status]++;
    }
    overall.total = allStalls.length;

    // Category distribution (allotted only, top 15)
    const catMap = {};
    for (const s of allStalls) {
      if (s.status === 'allotted' && s.exhibitor?.productCategory) {
        catMap[s.exhibitor.productCategory] = (catMap[s.exhibitor.productCategory] || 0) + 1;
      }
    }
    const categories = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);

    return NextResponse.json({ hallStats, overall, categories });
  } catch (err) {
    console.error('[GET /api/analytics]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
