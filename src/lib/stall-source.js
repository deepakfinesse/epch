/**
 * Stall data source — single place to swap static data → live API.
 *
 * Current mode: STATIC (reads from src/data/epch-stalls.js)
 * When live API is ready: replace getStallsForHalls() body with an API call.
 */
import { EPCH_RAW } from '@/data/epch-stalls';

function normalizeStandNo(raw) {
  if (!raw) return null;
  const m = raw.trim().match(/^([A-Z]-\d+)\/(\d+)$/);
  if (!m) return null;
  return `${m[1]}/${m[2].padStart(2, '0')}`;
}

function transformRecord(r) {
  if ((r.ClubType || '').toLowerCase() === 'child') return null;
  const hallId = parseInt(r.Hallno ?? r.hallno ?? '', 10);
  if (!hallId || isNaN(hallId)) return null;
  const stallNumber = normalizeStandNo(r['Stand No'] ?? r['stand no'] ?? '');
  if (!stallNumber) return null;

  return {
    stallNumber,
    hallId,
    aisle:     stallNumber.split('/')[0],
    side:      parseInt(r.Side  ?? r.side  ?? '1', 10) || 1,
    area:      parseFloat(r.Space ?? r.space ?? '9')    || 9,
    standType: (r['Stand type'] ?? r['stand type'] ?? '').toUpperCase(),
    status:    'allotted',
    isMerged:  false, mergedWith: [], isSplit: false, splitParts: [], parentStall: null,
    exhibitor: {
      companyName:     r.Organization    ?? r.organization    ?? '',
      contactPerson:   r['Contact Person'] ?? r['contact person'] ?? '',
      email:           r.Email    ?? r.email    ?? '',
      phone:           r.Mobile   ?? r.mobile   ?? '',
      city:            r.Station  ?? r.station  ?? '',
      state:           r.State    ?? r.state    ?? '',
      address:         r.Address  ?? r.address  ?? '',
      productCategory: r.Product  ?? r.product  ?? r.Category ?? '',
    },
    source: 'erp',
  };
}

// Returns stalls for the given array of hall IDs.
// Switch this to an API call when credentials are available.
export function getStallsForHalls(hallIds) {
  const results = [];
  for (const r of EPCH_RAW) {
    const s = transformRecord(r);
    if (s && hallIds.includes(s.hallId)) results.push(s);
  }
  return results;
}
