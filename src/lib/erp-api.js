/**
 * ERP Integration Client
 * Base URL and API key are populated from .env.local once provided by client.
 * All methods return normalized data ready for the dashboard.
 */

const ERP_BASE = process.env.ERP_API_BASE_URL;
const ERP_KEY  = process.env.ERP_API_KEY;

// Returns false when ERP is not yet configured
export function isErpConfigured() {
  return Boolean(ERP_BASE && ERP_KEY);
}

async function erpFetch(path, options = {}) {
  if (!isErpConfigured()) {
    throw new Error('ERP API not configured. Set ERP_API_BASE_URL and ERP_API_KEY in .env.local');
  }
  const res = await fetch(`${ERP_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ERP_KEY}`,
      ...(options.headers || {}),
    },
    next: { revalidate: 0 }, // always fresh
  });
  if (!res.ok) throw new Error(`ERP API error: ${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * Fetch all stall updates since a given timestamp.
 * Expected ERP response shape:
 * { stalls: [{ stallNumber, hallId, status, exhibitor: {...}, updatedAt }] }
 */
export async function fetchErpUpdates(since) {
  const params = since ? `?since=${since.toISOString()}` : '';
  return erpFetch(`/stalls/updates${params}`);
}

/**
 * Fetch full stall list for a specific hall.
 */
export async function fetchErpHallStalls(hallId) {
  return erpFetch(`/halls/${hallId}/stalls`);
}

/**
 * Normalize an ERP stall record to the internal Stall schema shape.
 */
export function normalizeErpStall(erpStall) {
  return {
    stallNumber:  String(erpStall.stallNumber || erpStall.stall_no || ''),
    hallId:       Number(erpStall.hallId || erpStall.hall_no || 0),
    aisle:        erpStall.aisle || '',
    area:         Number(erpStall.area || 9),
    status:       normalizeStatus(erpStall.status),
    exhibitor: {
      companyName:     erpStall.companyName || erpStall.company_name || '',
      contactPerson:   erpStall.contactPerson || erpStall.contact_person || '',
      email:           erpStall.email || '',
      phone:           erpStall.phone || erpStall.mobile || '',
      city:            erpStall.city || '',
      state:           erpStall.state || '',
      address:         erpStall.address || '',
      productCategory: erpStall.productCategory || erpStall.product_category || '',
    },
    source: 'erp',
  };
}

function normalizeStatus(raw) {
  if (!raw) return 'available';
  const s = String(raw).toLowerCase().trim();
  if (s === 'allotted' || s === 'allocated' || s === 'booked' || s === 'occupied') return 'allotted';
  if (s === 'reserved') return 'reserved';
  if (s === 'blocked' || s === 'hold') return 'blocked';
  return 'available';
}
