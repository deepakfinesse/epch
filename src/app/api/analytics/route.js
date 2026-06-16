import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Stall from '@/models/Stall';
import { HALL_LIST } from '@/lib/hall-config';

export async function GET() {
  try {
    await connectDB();

    const [hallAgg, categoryAgg, totalAgg] = await Promise.all([
      // Per-hall breakdown
      Stall.aggregate([
        { $group: { _id: { hallId: '$hallId', status: '$status' }, count: { $sum: 1 } } },
      ]),
      // Category distribution (allotted stalls only)
      Stall.aggregate([
        { $match: { status: 'allotted', 'exhibitor.productCategory': { $ne: '' } } },
        { $group: { _id: '$exhibitor.productCategory', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
      // Overall stats
      Stall.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Build hall stats map
    const hallMap = {};
    for (const { _id, count } of hallAgg) {
      if (!hallMap[_id.hallId]) hallMap[_id.hallId] = { available: 0, allotted: 0, reserved: 0, blocked: 0 };
      hallMap[_id.hallId][_id.status] = count;
    }

    const hallStats = HALL_LIST.map((cfg) => {
      const s = hallMap[cfg.id] || {};
      const total = (s.available || 0) + (s.allotted || 0) + (s.reserved || 0) + (s.blocked || 0);
      return {
        hallId: cfg.id,
        hallName: cfg.name,
        block: cfg.block,
        blockColor: cfg.blockColor,
        available: s.available || 0,
        allotted: s.allotted || 0,
        reserved: s.reserved || 0,
        blocked: s.blocked || 0,
        total: total || cfg.totalStalls,
        occupiedPct: total ? Math.round(((s.allotted || 0) + (s.reserved || 0)) / total * 100) : 0,
      };
    });

    const overall = { available: 0, allotted: 0, reserved: 0, blocked: 0 };
    for (const { _id, count } of totalAgg) overall[_id] = count;
    overall.total = Object.values(overall).reduce((a, b) => a + b, 0);

    const categories = categoryAgg.map((c) => ({ name: c._id || 'Uncategorized', value: c.count }));

    return NextResponse.json({ hallStats, overall, categories });
  } catch (err) {
    console.error('[GET /api/analytics]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
