import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Stall from '@/models/Stall';
import { HALL_CONFIGS } from '@/lib/hall-config';

export async function GET(req, { params }) {
  const { id } = await params;
  const hallId = parseInt(id, 10);

  if (!HALL_CONFIGS[hallId]) {
    return NextResponse.json({ error: 'Hall not found' }, { status: 404 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status  = searchParams.get('status');
    const category= searchParams.get('category');
    const q       = searchParams.get('q');

    const filter = { hallId };
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter['exhibitor.productCategory'] = category;
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { stallNumber: regex },
        { 'exhibitor.companyName': regex },
        { 'exhibitor.contactPerson': regex },
        { aisle: regex },
      ];
    }

    const stalls = await Stall.find(filter).lean();

    // Aggregate stats for this hall
    const allStalls = await Stall.find({ hallId }).lean();
    const stats = { available: 0, allotted: 0, reserved: 0, blocked: 0 };
    for (const s of allStalls) stats[s.status] = (stats[s.status] || 0) + 1;

    // Unique product categories
    const categories = [...new Set(allStalls.map((s) => s.exhibitor?.productCategory).filter(Boolean))].sort();

    return NextResponse.json({
      hall: HALL_CONFIGS[hallId],
      stalls,
      stats: { ...stats, total: allStalls.length },
      categories,
    });
  } catch (err) {
    console.error(`[GET /api/halls/${hallId}]`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
