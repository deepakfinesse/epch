import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Stall from '@/models/Stall';
import { HALL_LIST } from '@/lib/hall-config';

export async function GET() {
  try {
    await connectDB();

    // Aggregate stall counts per hall grouped by status
    const agg = await Stall.aggregate([
      {
        $group: {
          _id: { hallId: '$hallId', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Build a map: hallId → { available, allotted, reserved, blocked, total }
    const statMap = {};
    for (const { _id, count } of agg) {
      if (!statMap[_id.hallId]) statMap[_id.hallId] = { available: 0, allotted: 0, reserved: 0, blocked: 0 };
      statMap[_id.hallId][_id.status] = count;
    }

    const halls = HALL_LIST.map((cfg) => {
      const s = statMap[cfg.id] || {};
      const total = (s.available || 0) + (s.allotted || 0) + (s.reserved || 0) + (s.blocked || 0);
      return {
        ...cfg,
        stats: {
          total: total || cfg.totalStalls,
          available: s.available || 0,
          allotted: s.allotted || 0,
          reserved: s.reserved || 0,
          blocked: s.blocked || 0,
          occupiedPct: total ? Math.round(((s.allotted || 0) + (s.reserved || 0)) / total * 100) : 0,
        },
      };
    });

    return NextResponse.json({ halls });
  } catch (err) {
    console.error('[GET /api/halls]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
