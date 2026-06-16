import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';
import Stall from '@/models/Stall';
import { HALL_CONFIGS } from '@/lib/hall-config';

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const [logs, recentStalls, overallStats] = await Promise.all([
      ActivityLog.find().sort({ createdAt: -1 }).limit(limit).lean(),
      Stall.find().sort({ updatedAt: -1 }).limit(5).lean(),
      Stall.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const stats = { available: 0, allotted: 0, reserved: 0, blocked: 0 };
    for (const { _id, count } of overallStats) stats[_id] = count;
    stats.total = Object.values(stats).reduce((a, b) => a + b, 0);

    // Enrich recent stalls with hall name
    const enriched = recentStalls.map((s) => ({
      ...s,
      hallName: HALL_CONFIGS[s.hallId]?.name || `Hall ${s.hallId}`,
    }));

    return NextResponse.json({ logs, recentStalls: enriched, stats });
  } catch (err) {
    console.error('[GET /api/updates]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
