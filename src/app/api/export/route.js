import { NextResponse } from 'next/server';
import { HALL_LIST, HALL_CONFIGS } from '@/lib/hall-config';
import { getStallsForHalls } from '@/lib/stall-source';

// CSV cell: escape quotes and wrap in quotes if needed
function csvCell(val) {
  const s = val == null ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCSV(rows, headers) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvCell(row[h])).join(','));
  }
  return lines.join('\r\n');
}

const HEADERS = [
  'Stall No', 'Hall', 'Block', 'Aisle', 'Side', 'Area (sqm)', 'Status',
  'Company Name', 'Contact Person', 'Email', 'Phone',
  'City', 'State', 'Address', 'Product Category', 'GST No', 'Website',
];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const fairId = searchParams.get('fair_id') || '';
  const type   = searchParams.get('type') || 'all'; // all | allotted | available

  if (!fairId) {
    return NextResponse.json({ error: 'fair_id required' }, { status: 400 });
  }

  const allHallIds = HALL_LIST.map((h) => h.id);
  const allStalls  = await getStallsForHalls(allHallIds, fairId);

  const filtered = type === 'allotted'
    ? allStalls.filter((s) => s.status === 'allotted')
    : type === 'available'
    ? allStalls.filter((s) => s.status === 'available')
    : allStalls;

  const rows = filtered.map((s) => {
    const cfg = HALL_CONFIGS[s.hallId] || {};
    const ex  = s.exhibitor || {};
    return {
      'Stall No':        s.stallNumber,
      'Hall':            cfg.name || `Hall ${s.hallId}`,
      'Block':           cfg.block || '',
      'Aisle':           s.aisle || '',
      'Side':            s.side || '',
      'Area (sqm)':      s.area || 9,
      'Status':          s.status,
      'Company Name':    ex.companyName    || '',
      'Contact Person':  ex.contactPerson  || '',
      'Email':           ex.email          || '',
      'Phone':           ex.phone          || '',
      'City':            ex.city           || '',
      'State':           ex.state          || '',
      'Address':         ex.address        || '',
      'Product Category':ex.productCategory|| '',
      'GST No':          ex.gstNo          || '',
      'Website':         ex.website        || '',
    };
  });

  const csv       = toCSV(rows, HEADERS);
  const label     = type === 'allotted' ? 'Allotted' : type === 'available' ? 'Available' : 'All';
  const filename  = `EPCH_${label}_Stalls_${fairId}.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
