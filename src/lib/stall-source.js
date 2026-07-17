/**
 * Stall data source — fetches live data from EPCH APIs.
 * sendtotalstandno  → full stand grid
 * sendallparticipantdetail → exhibitor details (joined by stand number)
 * Stand with a matched participant = allotted, otherwise = available.
 */

const EPCH_STANDS_URL      = 'https://epchonline.in/api/virtual/sendtotalstandno';
const EPCH_PARTICIPANTS_URL = 'https://www.epchonline.in/api/virtual/sendallparticipantdetail';

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
export async function getStallsForHalls(hallIds, fairId) {
  if (!fairId) return [];

  const [standsData, participantsData] = await Promise.all([
    epchFetch(EPCH_STANDS_URL,      { fair_id: fairId }),
    epchFetch(EPCH_PARTICIPANTS_URL, { fair_id: fairId }),
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

  const results = [];
  for (const stand of stands) {
    const hallId = parseInt(stand.HALL, 10);
    if (isNaN(hallId) || !hallIds.includes(hallId)) continue;

    const aisle       = stand.AISLENO;
    const boothNo     = String(stand.BOOTHNO).padStart(2, '0');
    const stallNumber = `${aisle}/${boothNo}`;
    const participant = pMap[stallNumber];

    results.push({
      stallNumber,
      hallId,
      aisle,
      side:      parseInt(stand.SIDE, 10) || 1,
      area:      parseFloat(stand.AREA || stand.SIZE || '9') || 9,
      standType: stand.LIST || '',
      status:    participant ? 'allotted' : 'available',
      isMerged: false, mergedWith: [], isSplit: false, splitParts: [], parentStall: null,
      exhibitor: participant ? buildExhibitor(participant) : {},
      source:    'erp',
    });
  }

  return results;
}
