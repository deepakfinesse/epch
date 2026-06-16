import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Stall from '@/models/Stall';
import ActivityLog from '@/models/ActivityLog';
import { isErpConfigured, fetchErpUpdates, normalizeErpStall } from '@/lib/erp-api';
import { HALL_CONFIGS } from '@/lib/hall-config';

/**
 * GET  – trigger a manual ERP sync (or return status if not configured)
 * POST – webhook endpoint for ERP push updates
 */

export async function GET() {
  if (!isErpConfigured()) {
    return NextResponse.json({
      configured: false,
      message: 'ERP API not configured. Provide ERP_API_BASE_URL and ERP_API_KEY in .env.local',
    });
  }

  try {
    await connectDB();
    const updates = await fetchErpUpdates();
    const result = await applyErpUpdates(updates.stalls || []);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  // ERP push webhook — validates a shared secret if provided
  const secret = req.headers.get('x-erp-secret');
  if (process.env.ERP_WEBHOOK_SECRET && secret !== process.env.ERP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const stallsRaw = Array.isArray(body) ? body : body.stalls || [];
    const result = await applyErpUpdates(stallsRaw);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function applyErpUpdates(stallsRaw) {
  if (!stallsRaw.length) return { updated: 0, inserted: 0 };

  const normalized = stallsRaw.map(normalizeErpStall).filter(
    (s) => s.stallNumber && s.hallId && HALL_CONFIGS[s.hallId]
  );

  const ops = normalized.map((s) => ({
    updateOne: {
      filter: { stallNumber: s.stallNumber, hallId: s.hallId },
      update: { $set: { ...s, source: 'erp' } },
      upsert: true,
    },
  }));

  const result = await Stall.bulkWrite(ops, { ordered: false });

  await ActivityLog.create({
    action: 'erp_sync',
    description: `ERP sync: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`,
    source: 'erp',
  });

  return { updated: result.modifiedCount, inserted: result.upsertedCount };
}
