/**
 * Stall data source — fetches live data from EPCH APIs.
 * sendtotalstandno        → full stand grid
 * sendallparticipantdetail → exhibitor details (joined by stand number)
 * sendbelancestandno      → available (balance) stands
 *
 * Status: participant match → allotted | in balance list → available | else → reserved
 * Hall assignment uses our HALL_CONFIGS aisle map (not the API's HALL field,
 * which can differ between sendtotalstandno and sendbelancestandno).
 */

import { HALL_CONFIGS } from '@/lib/hall-config';

const EPCH_STANDS_URL      = 'https://epchonline.in/api/virtual/sendtotalstandno';
const EPCH_PARTICIPANTS_URL = 'https://www.epchonline.in/api/virtual/sendallparticipantdetail';
const EPCH_BALANCE_URL     = 'https://epchonline.in/api/virtual/sendbelancestandno';

async function epchFetch(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`EPCH API ${url} returned ${res.status}`);
  return res.json();
}

function buildExhibitor(p) {
  const con = p.con    || {};
  const cty = p.cty    || {};
  const sts = p.states || {};
  const cat = p.cat    || {};
  return {
    companyName:     con.v_org_name       || '',
    contactPerson:   p.con2?.v_name       || con.v_contact_person || '',
    email:           con.v_email          || '',
    phone:           con.v_mobile_no      || con.v_phone_no || '',
    city:            cty.v_city_name      || '',
    state:           sts.v_state_name     || '',
    address:         [con.v_address1, con.v_address2].filter(Boolean).join(', '),
    productCategory: cat.v_cat_name       || '',
    gstNo:           p.mem?.vc_gst_no     || '',
    website:         p.con3?.v_web_url    || '',
  };
}

/**
 * Returns stalls for the given hall IDs from the EPCH live API.
 * @param {number[]} hallIds
 * @param {string}   fairId  — e.g. "965"
 */
// Build once: aisle label (e.g. "E-08") → hallId from HALL_CONFIGS
const AISLE_TO_HALL = {};
for (const cfg of Object.values(HALL_CONFIGS)) {
  for (const aisle of cfg.aisles) {
    AISLE_TO_HALL[aisle] = cfg.id;
  }
}

export async function getStallsForHalls(hallIds, fairId) {
  if (!fairId) return [];

  const [standsData, participantsData, balanceData] = await Promise.all([
    epchFetch(EPCH_STANDS_URL,      { fair_id: fairId }),
    epchFetch(EPCH_PARTICIPANTS_URL, { fair_id: fairId }),
    epchFetch(EPCH_BALANCE_URL,     { fair_id: fairId }).catch(() => ({})),
  ]);

  const stands       = (standsData.stand_details ?? []).map((d) => d.Drawstand).filter(Boolean);
  const participants = participantsData.stand_participantdetail ?? [];

  // Build lookup: normalized stand number → participant record
  // v_stand_no in the API is the full stand number e.g. "E-01/02"
  const pMap = {};
  for (const p of participants) {
    const fa = p.Fairapplication;
    if (!fa?.v_stand_no) continue;
    const raw = String(fa.v_stand_no).trim();
    const m   = raw.match(/^([A-Z]-\d+)\/(\d+)$/);
    if (!m) continue;
    pMap[`${m[1]}/${m[2].padStart(2, '0')}`] = p;
  }

  // Build set of available stand numbers from sendbelancestandno
  const balanceSet = new Set();
  const balanceStands =
    balanceData.balance_standdetail ??
    balanceData.stand_balancedetail ??
    balanceData.balance_stand ??
    balanceData.stand_details ??
    [];
  for (const item of balanceStands) {
    const raw = item?.drawstands ?? item?.Drawstand ?? item;
    if (!raw) continue;
    const aisle   = raw.AISLENO ?? raw.v_aisle_no;
    const boothNo = raw.BOOTHNO  ?? raw.v_booth_no;
    if (!aisle || boothNo == null) continue;
    balanceSet.add(`${aisle}/${String(boothNo).padStart(2, '0')}`);
  }

  const results = [];
  for (const stand of stands) {
    const aisle  = stand.AISLENO;
    // Use our hall-config aisle map; fall back to API's HALL field only for unknown aisles
    const hallId = AISLE_TO_HALL[aisle] ?? parseInt(stand.HALL, 10);
    if (isNaN(hallId) || !hallIds.includes(hallId)) continue;
    const boothNo     = String(stand.BOOTHNO).padStart(2, '0');
    const stallNumber = `${aisle}/${boothNo}`;
    const participant = pMap[stallNumber];

    // In balance list → available; everything else → allotted
    // (reserved is not a real EPCH API status — it falls under allotted)
    let status;
    if (balanceSet.size > 0) {
      status = balanceSet.has(stallNumber) ? 'available' : 'allotted';
    } else {
      status = participant ? 'allotted' : 'available'; // fallback if balance API returned nothing
    }

    results.push({
      stallNumber,
      hallId,
      aisle,
      side:      parseInt(stand.SIDE, 10) || 1,
      area:      parseFloat(stand.AREA || stand.SIZE || '9') || 9,
      standType: stand.LIST || '',
      status,
      isMerged: false, mergedWith: [], isSplit: false, splitParts: [], parentStall: null,
      exhibitor: participant ? buildExhibitor(participant) : {},
      source:    'erp',
    });
  }

  return results;
}
