#!/usr/bin/env node
/**
 * Seed Block E stall data from EPCH CSV export.
 *
 * Usage:
 *   node scripts/seed-stalls.js                         # reads scripts/data/stalls.csv
 *   node scripts/seed-stalls.js path/to/your/file.csv  # custom path
 *
 * Expects .env.local with MONGODB_URI.
 * Run from the project root: node scripts/seed-stalls.js
 */

const { MongoClient } = require('mongodb');
const fs   = require('fs');
const path = require('path');

// Load .env.local manually (dotenv may not be installed)
const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
const CSV_PATH    = process.argv[2] || path.join(__dirname, 'data', 'stalls.csv');

// ── CSV parser (handles double-quoted fields with embedded commas) ─────────────
function parseLine(line) {
  const fields = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"')        { inQ = !inQ; }
    else if (c === ',' && !inQ) { fields.push(cur); cur = ''; }
    else                  { cur += c; }
  }
  fields.push(cur);
  return fields.map((f) => f.trim());
}

function parseCSV(raw) {
  // Strip BOM if present (Excel UTF-8 BOM export)
  const content = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
  const lines   = content.split(/\r?\n/);
  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows    = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = parseLine(line);
    const row  = {};
    headers.forEach((h, idx) => { row[h] = (vals[idx] ?? '').trim(); });
    rows.push(row);
  }
  return rows;
}

// ── Stand No normalisation ────────────────────────────────────────────────────
// Input:  "E-01/01"  →  output: "E-01/01"
// Input:  "E-01/01A" →  output: null  (foyer / split stall — skip)
// Input:  " E-02/7 " →  output: "E-02/07"
function normalizeStandNo(raw) {
  if (!raw) return null;
  const m = raw.trim().match(/^([A-Z]-\d+)\/(\d+)$/);
  if (!m) return null;                     // has suffix letter or wrong format → skip
  const [, aisle, pos] = m;
  return `${aisle}/${pos.padStart(2, '0')}`;
}

// ── Column name resolver (handles header variations) ─────────────────────────
function col(row, ...names) {
  for (const n of names) {
    const v = row[n.toLowerCase()] ?? row[n] ?? '';
    if (v) return v;
  }
  return '';
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not set in .env.local');
    process.exit(1);
  }
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`ERROR: CSV not found at ${CSV_PATH}`);
    console.error('Save the EPCH stall data CSV to scripts/data/stalls.csv and re-run.');
    process.exit(1);
  }

  console.log(`Reading CSV: ${CSV_PATH}`);
  const rows = parseCSV(fs.readFileSync(CSV_PATH, 'utf-8'));
  console.log(`Parsed ${rows.length} rows`);

  console.log('Connecting to MongoDB…');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const coll = client.db().collection('stalls');

  const seen = new Set();
  let upserted = 0, skipped = 0, errCount = 0;

  for (const row of rows) {
    const standNoRaw = col(row, 'stand no', 'stand_no', 'standno', 'stall no');
    const hallNoRaw  = col(row, 'hallno', 'hall no', 'hall_no', 'hall');

    // Skip FOYER or non-numeric hall numbers
    const hallId = parseInt(hallNoRaw, 10);
    if (!hallId || isNaN(hallId)) { skipped++; continue; }

    const stallNumber = normalizeStandNo(standNoRaw);
    if (!stallNumber) { skipped++; continue; }

    // For clubbed stalls (same stand number, multiple exhibitors) keep first occurrence
    const key = `${hallId}:${stallNumber}`;
    if (seen.has(key)) { skipped++; continue; }
    seen.add(key);

    const aisle    = stallNumber.split('/')[0];   // "E-01"
    const area     = parseFloat(col(row, 'space', 'area')) || 9;
    const side     = parseInt(col(row, 'side'), 10) || 1;
    const standType = (col(row, 'stand type', 'standtype') || '').toUpperCase();

    const doc = {
      stallNumber,
      hallId,
      aisle,
      area,
      side,
      standType,
      status:     'allotted',
      isMerged:   false,
      mergedWith: [],
      isSplit:    false,
      splitParts: [],
      parentStall: null,
      exhibitor: {
        companyName:      col(row, 'organization', 'company name', 'firm name'),
        contactPerson:    col(row, 'contact person', 'contact'),
        email:            col(row, 'email', 'email id'),
        phone:            col(row, 'mobile', 'phone'),
        city:             col(row, 'station', 'city'),
        state:            col(row, 'state'),
        address:          col(row, 'address'),
        productCategory:  col(row, 'category', 'product category', 'product'),
      },
      source:    'erp',
      updatedAt: new Date(),
    };

    try {
      await coll.updateOne(
        { hallId, stallNumber },
        { $set: doc, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      upserted++;
      if (upserted % 50 === 0) process.stdout.write(`  ${upserted} upserted…\r`);
    } catch (e) {
      console.error(`  Error upserting ${stallNumber}:`, e.message);
      errCount++;
    }
  }

  await client.close();
  console.log(`\nDone.  upserted=${upserted}  skipped=${skipped}  errors=${errCount}`);
}

seed().catch((e) => { console.error(e); process.exit(1); });
