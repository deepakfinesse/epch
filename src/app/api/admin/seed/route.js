/**
 * POST /api/admin/seed
 * One-time endpoint to seed stall data from EPCH JSON export.
 *
 * Body: JSON array of exhibitor records in the EPCH API format.
 * Example record shape:
 *   { "Stand No": "E-01/01", "Hallno": "1", "Space": "60", "Side": "1",
 *     "Organization": "...", "Contact Person": "...", "Email": "...",
 *     "Mobile": "...", "Station": "...", "State": "...", "Address": "...",
 *     "Product": "...", "Stand type": "RAW", "Clubbing": "NO", "ClubType": "" }
 *
 * - Child clubs (ClubType === "Child") are SKIPPED; parent record is used.
 * - Records with non-numeric Hallno (e.g. "FOYER") are skipped.
 * - Stand numbers with letter suffixes (E-01/01A) are skipped.
 * - DELETE THIS FILE after seeding is complete.
 */
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Stall from '@/models/Stall';

function normalizeStandNo(raw) {
  if (!raw) return null;
  const m = raw.trim().match(/^([A-Z]-\d+)\/(\d+)$/);
  if (!m) return null;
  return `${m[1]}/${m[2].padStart(2, '0')}`;
}

export async function POST(req) {
  try {
    const records = await req.json();
    if (!Array.isArray(records)) {
      return NextResponse.json({ error: 'Body must be a JSON array' }, { status: 400 });
    }

    await connectDB();

    const seen = new Set();
    let upserted = 0, skipped = 0, errors = 0;
    const errList = [];

    for (const row of records) {
      // Skip child clubs — only seed parent / standalone
      if ((row['ClubType'] || '').toLowerCase() === 'child') { skipped++; continue; }

      const hallId = parseInt(row['Hallno'] ?? row['hallno'] ?? '', 10);
      if (!hallId || isNaN(hallId)) { skipped++; continue; }

      const stallNumber = normalizeStandNo(row['Stand No'] ?? row['stand no'] ?? '');
      if (!stallNumber) { skipped++; continue; }

      // Deduplicate
      const key = `${hallId}:${stallNumber}`;
      if (seen.has(key)) { skipped++; continue; }
      seen.add(key);

      const aisle = stallNumber.split('/')[0];
      const side  = parseInt(row['Side'] ?? row['side'] ?? '1', 10) || 1;
      const area  = parseFloat(row['Space'] ?? row['space'] ?? '9') || 9;

      const doc = {
        stallNumber,
        hallId,
        aisle,
        side,
        area,
        status: 'allotted',
        standType: (row['Stand type'] ?? row['stand type'] ?? '').toUpperCase(),
        isMerged:  false,
        mergedWith: [],
        isSplit:   false,
        splitParts: [],
        parentStall: null,
        exhibitor: {
          companyName:      row['Organization']    ?? row['organization']     ?? '',
          contactPerson:    row['Contact Person']  ?? row['contact person']   ?? '',
          email:            row['Email']           ?? row['email']            ?? '',
          phone:            row['Mobile']          ?? row['mobile']           ?? '',
          city:             row['Station']         ?? row['station']          ?? '',
          state:            row['State']           ?? row['state']            ?? '',
          address:          row['Address']         ?? row['address']          ?? '',
          productCategory:  row['Product']         ?? row['product']          ?? row['Category'] ?? '',
        },
        source:    'erp',
        updatedAt: new Date(),
      };

      try {
        await Stall.updateOne(
          { hallId, stallNumber },
          { $set: doc, $setOnInsert: { createdAt: new Date() } },
          { upsert: true }
        );
        upserted++;
      } catch (e) {
        errors++;
        errList.push(`${stallNumber}: ${e.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      total: records.length,
      upserted,
      skipped,
      errors,
      ...(errList.length ? { errorDetails: errList.slice(0, 10) } : {}),
    });
  } catch (e) {
    console.error('[POST /api/admin/seed]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
