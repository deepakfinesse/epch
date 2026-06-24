
// Generate a range of aisle labels
function aisleRange(block, from, to) {
  return Array.from({ length: to - from + 1 }, (_, i) =>
    `${block}-${String(from + i).padStart(2, '0')}`
  );
}

// Stalls per side of one aisle (from PDF grid density analysis)
const STD_STALLS = 2;  // blocks E, F, G, H — ~28 per side
const J_STALLS   = 24;  // block J — slightly narrower hall

export const HALL_CONFIGS = {

  // ── BLOCK E · Ground Floor ──────────────────────────────────────────────
  1: {
    id: 1, name: 'Hall 1', block: 'E',
    floor: 'ground', floorLabel: 'Ground Floor',
    blockColor: '#2563eb',
    aisles: aisleRange('E', 1, 4),           // E-01 to E-04
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,        // 224
    gridCols: STD_STALLS,
    description: 'Block E – Ground Floor',
    // specialZones: [
    //   { type: 'entrance', label: 'ENTRANCE', position: 'left' },
    //   { type: 'service',  label: 'SERVICE ENTRY', position: 'right' },
    // ],
  },
  3: {
    id: 3, name: 'Hall 3', block: 'E',
    floor: 'ground', floorLabel: 'Ground Floor',
    blockColor: '#2563eb',
    aisles: aisleRange('E', 5, 8),           // E-05 to E-08
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    description: 'Block E – Ground Floor',
    
  },
  5: {
    id: 5, name: 'Hall 5', block: 'E',
    floor: 'ground', floorLabel: 'Ground Floor',
    blockColor: '#2563eb',
    aisles: aisleRange('E', 9, 12),          // E-09 to E-12
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    
  },
  7: {
    id: 7, name: 'Hall 7', block: 'E',
    floor: 'ground', floorLabel: 'Ground Floor',
    blockColor: '#2563eb',
    aisles: aisleRange('E', 13, 16),         // E-13 to E-16
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    description: 'Block E – Ground Floor',
    
  },

  // ── BLOCK F · Second Floor ───────────────────────────────────────────────
  2: {
    id: 2, name: 'Hall 2', block: 'F',
    floor: 'second', floorLabel: 'Second Floor',
    blockColor: '#7c3aed',
    aisles: aisleRange('F', 1, 4),           // F-01 to F-04
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    description: 'Block F – Second Floor',
    // specialZones: [{ type: 'entrance', label: 'ENTRANCE', position: 'left' }],
  },
  4: {
    id: 4, name: 'Hall 4', block: 'F',
    floor: 'second', floorLabel: 'Second Floor',
    blockColor: '#7c3aed',
    aisles: aisleRange('F', 5, 8),           // F-05 to F-08
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    description: 'Block F – Second Floor',
    // specialZones: [{ type: 'entrance', label: 'ENTRANCE', position: 'left' }],
  },
  6: {
    id: 6, name: 'Hall 6', block: 'F',
    floor: 'second', floorLabel: 'Second Floor',
    blockColor: '#7c3aed',
    aisles: aisleRange('F', 9, 12),          // F-09 to F-12
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    description: 'Block F – Second Floor',
    // specialZones: [{ type: 'entrance', label: 'ENTRANCE', position: 'left' }],
  },
  8: {
    id: 8, name: 'Hall 8', block: 'F',
    floor: 'second', floorLabel: 'Second Floor',
    blockColor: '#7c3aed',
    aisles: aisleRange('F', 13, 16),         // F-13 to F-16
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    description: 'Block F – Second Floor',
    // specialZones: [{ type: 'entrance', label: 'ENTRANCE', position: 'left' }],
  },

  // ── BLOCK G · Ground Floor ───────────────────────────────────────────────
  9: {
    id: 9, name: 'Hall 9', block: 'G',
    floor: 'ground', floorLabel: 'Ground Floor',
    blockColor: '#0891b2',
    aisles: aisleRange('G', 1, 4),           // G-01 to G-04  (top in PDF 4)
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    description: 'Block G – Ground Floor',
    // specialZones: [
    //   { type: 'service', label: 'SERVICE ENTRY', position: 'right' },
    //   { type: 'entrance', label: 'ENTRANCE', position: 'left' },
    // ],
  },
  10: {
    id: 10, name: 'Hall 10', block: 'G',
    floor: 'ground', floorLabel: 'Ground Floor',
    blockColor: '#0891b2',
    aisles: aisleRange('G', 5, 8),           // G-05 to G-08
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    description: 'Block G – Ground Floor',
    // specialZones: [
    //   { type: 'service', label: 'SERVICE ENTRY', position: 'right' },
    //   { type: 'entrance', label: 'ENTRANCE', position: 'left' },
    // ],
  },
  11: {
    id: 11, name: 'Hall 11', block: 'G',
    floor: 'ground', floorLabel: 'Ground Floor',
    blockColor: '#0891b2',
    aisles: aisleRange('G', 9, 12),          // G-09 to G-12
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    description: 'Block G – Ground Floor',
    // specialZones: [
    //   { type: 'service', label: 'SERVICE ENTRY', position: 'right' },
    //   { type: 'entrance', label: 'ENTRANCE', position: 'left' },
    // ],
  },
  12: {
    id: 12, name: 'Hall 12', block: 'G',
    floor: 'ground', floorLabel: 'Ground Floor',
    blockColor: '#0891b2',
    aisles: aisleRange('G', 13, 16),         // G-13 to G-16  (bottom in PDF 4)
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    description: 'Block G – Ground Floor',
    // specialZones: [
    //   { type: 'service', label: 'SERVICE ENTRY', position: 'right' },
    //   { type: 'entrance', label: 'ENTRANCE', position: 'left' },
    // ],
  },

  // ── BLOCK H · Ground Floor ───────────────────────────────────────────────
  13: {
    id: 13, name: 'Hall 13', block: 'H',
    floor: 'ground', floorLabel: 'Ground Floor',
    blockColor: '#d97706',
    aisles: aisleRange('H', 1, 4),           // H-01 to H-04
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    description: 'Block H – Ground Floor',
    // specialZones: [],
  },
  14: {
    id: 14, name: 'Hall 14', block: 'H',
    floor: 'ground', floorLabel: 'Ground Floor',
    blockColor: '#d97706',
    aisles: aisleRange('H', 5, 8),           // H-05 to H-08
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    description: 'Block H – Ground Floor',
    // specialZones: [
    //   { type: 'lounge', label: 'MEETING AREA', position: 'left' },
    // ],
  },
  15: {
    id: 15, name: 'Hall 15', block: 'H',
    floor: 'ground', floorLabel: 'Ground Floor',
    blockColor: '#d97706',
    aisles: aisleRange('H', 9, 12),          // H-09 to H-12
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    description: 'Block H – Ground Floor',
    // specialZones: [],
  },
  17: {
    id: 17, name: 'Hall 17', block: 'H',
    floor: 'ground', floorLabel: 'Ground Floor',
    blockColor: '#d97706',
    aisles: aisleRange('H', 13, 16),         // H-13 to H-16  (top — premium hall)
    aisleCount: 4,
    stallsPerAisleRow: STD_STALLS,
    totalStalls: 4 * STD_STALLS * 2,
    gridCols: STD_STALLS,
    description: 'Block H – Ground Floor',
    // specialZones: [
    //   { type: 'lounge', label: "BUYER'S LOUNGE",  position: 'top-left' },
    //   { type: 'area',   label: 'INAUGURATION',    position: 'top-right' },
    //   { type: 'area',   label: 'TEA/COFFEE LOUNGE', position: 'top-right' },
    // ],
  },

  // ── BLOCK J · Ground Floor (standalone hall) ─────────────────────────────
  16: {
    id: 16, name: 'Hall 16', block: 'J',
    floor: 'ground', floorLabel: 'Ground Floor',
    blockColor: '#db2777',
    aisles: aisleRange('J', 1, 8),           // J-01 to J-08 (narrower wing in PDF 3)
    aisleCount: 8,
    stallsPerAisleRow: J_STALLS,
    totalStalls: 8 * J_STALLS * 2,          // 384
    gridCols: J_STALLS,
    description: 'Block J – Ground Floor',
    // specialZones: [
    //   { type: 'lounge', label: 'PLATINUM LOUNGE', position: 'right' },
    //   { type: 'area',   label: 'ARTISANS AREA',   position: 'right' },
    // ],
  },
};

// ── Navigation helpers ───────────────────────────────────────────────────────

// Display order follows the PDF sequence
export const HALL_LIST = [1, 3, 5, 7, 2, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(
  (id) => HALL_CONFIGS[id]
);

export const BLOCK_GROUPS = [
  { block: 'E', label: 'Block E – Ground Floor', color: '#2563eb', halls: [1, 3, 5, 7] },
  { block: 'F', label: 'Block F – Second Floor', color: '#7c3aed', halls: [2, 4, 6, 8] },
  { block: 'G', label: 'Block G – Ground Floor', color: '#0891b2', halls: [9, 10, 11, 12] },
  { block: 'H', label: 'Block H – Ground Floor', color: '#d97706', halls: [13, 14, 15, 17] },
  { block: 'J', label: 'Block J – Ground Floor', color: '#db2777', halls: [16] },
];

// ── Status display config ────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  available: { label: 'Available', color: '#059669', bg: 'rgba(5,150,105,0.10)',   border: 'rgba(5,150,105,0.35)' },
  allotted:  { label: 'Allotted',  color: '#dc2626', bg: 'rgba(220,38,38,0.10)',   border: 'rgba(220,38,38,0.35)' },
  reserved:  { label: 'Reserved',  color: '#d97706', bg: 'rgba(217,119,6,0.10)',   border: 'rgba(217,119,6,0.35)' },
};

// ── CSV column mapping ───────────────────────────────────────────────────────
export const CSV_COLUMN_MAP = {
  stallNumber:    ['stall no', 'stall number', 'booth no', 'booth number', 'stall_no', 'booth_no'],
  hallId:         ['hall no', 'hall number', 'hall_no', 'hall_id', 'hall'],
  aisle:          ['aisle', 'aisle no', 'aisle_no'],
  area:           ['area', 'area (sqm)', 'size', 'sqm'],
  status:         ['status', 'stall status', 'booth status'],
  companyName:    ['company name', 'company', 'exhibitor name', 'exhibitor', 'firm name'],
  contactPerson:  ['contact person', 'contact', 'name', 'person name'],
  email:          ['email', 'email id', 'email address'],
  phone:          ['phone', 'mobile', 'contact no', 'phone number', 'mobile number'],
  city:           ['city'],
  state:          ['state'],
  address:        ['address', 'full address'],
  productCategory:['product category', 'category', 'product type'],
};
