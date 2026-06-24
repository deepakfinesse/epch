import { NextResponse } from 'next/server';
import { HALL_CONFIGS } from '@/lib/hall-config';
import { getStallsForHalls } from '@/lib/stall-source';

export async function GET(req, { params }) {
  const { id } = await params;
  const hallId  = parseInt(id, 10);

  if (!HALL_CONFIGS[hallId]) {
    return NextResponse.json({ error: 'Hall not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter   = searchParams.get('status');
  const categoryFilter = searchParams.get('category');
  const q              = searchParams.get('q');

  let stalls = getStallsForHalls([hallId]);

  // Apply filters
  if (statusFilter && statusFilter !== 'all') {
    stalls = stalls.filter((s) => s.status === statusFilter);
  }
  if (categoryFilter && categoryFilter !== 'all') {
    stalls = stalls.filter((s) => s.exhibitor?.productCategory === categoryFilter);
  }
  if (q) {
    const re = new RegExp(q, 'i');
    stalls = stalls.filter((s) =>
      re.test(s.stallNumber) ||
      re.test(s.exhibitor?.companyName) ||
      re.test(s.exhibitor?.contactPerson) ||
      re.test(s.aisle)
    );
  }

  const allStalls  = getStallsForHalls([hallId]);
  const allotted   = allStalls.filter((s) => s.status === 'allotted').length;
  const reserved   = allStalls.filter((s) => s.status === 'reserved').length;
  const categories = [...new Set(allStalls.map((s) => s.exhibitor?.productCategory).filter(Boolean))].sort();

  return NextResponse.json({
    hall: HALL_CONFIGS[hallId],
    stalls,
    stats: {
      total:    HALL_CONFIGS[hallId].totalStalls,
      allotted,
      reserved,
      available: Math.max(0, HALL_CONFIGS[hallId].totalStalls - allotted - reserved),
    },
    categories,
  });
}
