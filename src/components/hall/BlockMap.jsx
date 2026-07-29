'use client';
import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useUIStore } from '@/store/ui-store';
import { STATUS_CONFIG } from '@/lib/hall-config';
import StallTooltip from './StallTooltip';

// ── Layout constants ──────────────────────────────────────────────────────────
const CELL_H    = 38;   // stall cell height (was 22)
const AISLE_H   = 24;   // walkway corridor height (was 16)
const FOYER_H   = 52;   // MAIN FOYER passage between halls (was 38)
const ENTRY_W   = 100;  // left entrance column (wide enough for foyer stall cells)
const SERVICE_W = 60;   // right service-entry column
const PAD       = 14;

const BASE_SQM  = 9;    // 1 standard module = 9 sqm (3m × 3m)
const UNIT_PX   = 32;   // pixels per 9-sqm module (was 26)
const MIN_PX    = 28;   // minimum stand width so labels are readable (was 20)
const DEF_COLS  = 28;   // fallback columns per row when no data

const ROW_H = CELL_H * 2 + AISLE_H;

// Width in pixels for a given space (sqm)
function sqmToPx(area) {
  return Math.max(Math.round((area / BASE_SQM) * UNIT_PX), MIN_PX);
}

// Parent position number — strips split letter suffix
// "E-01/03"  → 3   "E-01/03A" → 3   "E-01/03B" → 3
function stallParentNum(stallNumber) {
  const m = (stallNumber || '').match(/\/(\d+)[A-Za-z]?$/);
  return m ? parseInt(m[1], 10) : 0;
}

// Sort key: group splits with their parent, then order by letter
// "E-01/01"  → 100   "E-01/01A" → 101   "E-01/01B" → 102   "E-01/02" → 200
function stallSortKey(stallNumber) {
  const m = (stallNumber || '').match(/\/(\d+)([A-Za-z]?)$/);
  if (!m) return 0;
  const num    = parseInt(m[1], 10);
  const letter = m[2] ? m[2].toUpperCase().charCodeAt(0) - 64 : 0; // A→1, B→2 …
  return num * 100 + letter;
}

export default function BlockMap({ blockGroup, halls, stalls, activeHallId }) {
  const svgRef       = useRef(null);
  const containerRef = useRef(null);
  const layoutRef    = useRef({});
  const { setHoveredStall, hoveredStall, statusFilter } = useUIStore();

  const [transform, setTransform] = useState({ x: PAD, y: PAD, scale: 1 });
  const [isPanning,  setIsPanning] = useState(false);
  const panStart = useRef(null);

  // ── Group stalls by aisle → side ─────────────────────────────────────────
  // aisleMap: { "E-01": { 1: [stall,...], 2: [stall,...] } }  — regular grid stalls
  // foyerMap: { "E-01": [stall,...] }                          — HALL=FOYER stalls (entrance column)
  // odd position → side 1 (top row), even → side 2 (bottom row)
  const { aisleMap, foyerMap } = useMemo(() => {
    const aMap = {};
    const fMap = {};
    for (const s of stalls) {
      if (!s.aisle) continue;
      if (s.isFoyer) {
        if (!fMap[s.aisle]) fMap[s.aisle] = [];
        fMap[s.aisle].push(s);
      } else {
        if (!aMap[s.aisle]) aMap[s.aisle] = { 1: [], 2: [] };
        const num = stallParentNum(s.stallNumber);
        const sk  = num % 2 === 0 ? 2 : 1;
        aMap[s.aisle][sk].push(s);
      }
    }
    for (const ad of Object.values(aMap)) {
      for (const arr of Object.values(ad)) {
        arr.sort((a, b) => stallSortKey(a.stallNumber) - stallSortKey(b.stallNumber));
      }
    }
    for (const arr of Object.values(fMap)) {
      arr.sort((a, b) => stallSortKey(a.stallNumber) - stallSortKey(b.stallNumber));
    }
    return { aisleMap: aMap, foyerMap: fMap };
  }, [stalls]);

  // ── Compute SVG grid width (pixels, same for all halls) ──────────────────
  const gridW = useMemo(() => {
    let max = DEF_COLS * UNIT_PX;
    for (const hall of halls) {
      for (const aisle of hall.aisles) {
        const ad = aisleMap[aisle];
        if (!ad) continue;
        const w1 = (ad[1] || []).reduce((s, x) => s + sqmToPx(x.area || 9), 0);
        const w2 = (ad[2] || []).reduce((s, x) => s + sqmToPx(x.area || 9), 0);
        max = Math.max(max, w1, w2);
      }
    }
    return max;
  }, [halls, aisleMap]);

  const sortedHalls   = useMemo(() => [...halls].sort((a, b) => b.id - a.id), [halls]);
  const aislesPerHall = halls[0]?.aisleCount ?? 4;
  const hallH         = aislesPerHall * ROW_H;
  const numFoyers     = sortedHalls.length - 1;
  const blockColor    = blockGroup.color;
  const gridX         = PAD + ENTRY_W;
  const svgW          = PAD + ENTRY_W + gridW + SERVICE_W + PAD;
  const svgH          = PAD + sortedHalls.length * hallH + numFoyers * FOYER_H + PAD;

  // Keep layout values accessible for computeInitialTransform
  layoutRef.current = { svgW, svgH, hallH, sortedHalls };

  // ── Status helpers ────────────────────────────────────────────────────────
  const fillColor = (s)  => s ? (STATUS_CONFIG[s.status]?.bg    ?? 'rgba(226,232,240,0.55)') : 'rgba(226,232,240,0.55)';
  const strokeClr = (s)  => s ? (STATUS_CONFIG[s.status]?.border ?? 'rgba(203,213,225,0.8)')  : 'rgba(203,213,225,0.8)';
  const isDimmed  = (s)  => statusFilter !== 'all' && (!s || s.status !== statusFilter);

  // ── Auto-fit transform: scale to container width, center active hall ──────
  const computeInitialTransform = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { x: PAD, y: PAD, scale: 1 };
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const { svgW: sw, hallH: hh, sortedHalls: sh } = layoutRef.current;
    const scale = Math.min(1.0, Math.max(0.30, (cw - PAD * 2) / (sw || 1)));

    let y = PAD;
    if (activeHallId && sh?.length) {
      const idx = sh.findIndex((h) => h.id === activeHallId);
      if (idx !== -1) {
        const hallTop    = PAD + idx * (hh + FOYER_H);
        const hallCenter = hallTop + hh / 2;
        y = ch / 2 - hallCenter * scale;
      }
    }
    return { x: PAD, y, scale };
  }, [activeHallId]);

  // ── Pan / zoom ────────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    if (e.target.closest('.stall-cell')) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [transform]);

  const onPointerMove = useCallback((e) => {
    if (!isPanning) return;
    const s = panStart.current;
    if (!s) return;
    setTransform((t) => ({ ...t, x: e.clientX - s.x, y: e.clientY - s.y }));
  }, [isPanning]);

  const onPointerUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => {
      const ns   = Math.min(5, Math.max(0.30, t.scale * factor));
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { ...t, scale: ns };
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      return { scale: ns, x: mx - (mx - t.x) * (ns / t.scale), y: my - (my - t.y) * (ns / t.scale) };
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Auto-fit when block changes or on first mount — rAF so DOM has settled
  useEffect(() => {
    requestAnimationFrame(() => setTransform(computeInitialTransform()));
  }, [blockGroup.block, computeInitialTransform]);

  function handleStallHover(e, stall) {
    if (!stall) return;
    const rect = containerRef.current?.getBoundingClientRect();
    setHoveredStall(stall, { x: e.clientX - (rect?.left || 0), y: e.clientY - (rect?.top || 0) });
  }

  // ── Render one side of an aisle ───────────────────────────────────────────
  function renderAisleSide(aisleSideStalls, y) {
    // No data: render uniform empty cells
    if (!aisleSideStalls || aisleSideStalls.length === 0) {
      return Array.from({ length: DEF_COLS }, (_, ci) => (
        <EmptyCell key={ci} x={gridX + ci * UNIT_PX} y={y} w={UNIT_PX} h={CELL_H} />
      ));
    }

    const cells = [];
    let xPos = gridX;

    for (const stall of aisleSideStalls) {
      const w = sqmToPx(stall.area || 9);
      cells.push(
        <StallCell key={stall.stallNumber}
          x={xPos} y={y} w={w} h={CELL_H}
          id={stall.stallNumber} stall={stall}
          dim={isDimmed(stall)}
          fill={fillColor(stall)} stroke={strokeClr(stall)}
          onHover={handleStallHover}
          onLeave={() => setHoveredStall(null)} />
      );
      xPos += w;
    }

    // Available zone to fill remaining width
    const remaining = gridW - (xPos - gridX);
    if (remaining > 4) {
      cells.push(
        <rect key="avail"
          x={xPos} y={y + 0.5} width={remaining} height={CELL_H - 1} rx={2}
          fill="rgba(226,232,240,0.35)"
          stroke="rgba(203,213,225,0.45)" strokeWidth={0.4}
          strokeDasharray="3,3"
        />
      );
    }

    return cells;
  }

  return (
    <div
      ref={containerRef}
      data-hall-container
      className="relative w-full overflow-hidden rounded-xl select-none"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        cursor: isPanning ? 'grabbing' : 'grab',
        minHeight: 520,
        height: '100%',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onMouseLeave={() => setHoveredStall(null)}
    >
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1" onPointerDown={(e) => e.stopPropagation()}>
        {[
          { label: '+', fn: () => setTransform((t) => ({ ...t, scale: Math.min(5, t.scale * 1.2) })) },
          { label: '−', fn: () => setTransform((t) => ({ ...t, scale: Math.max(0.30, t.scale * 0.85) })) },
          { label: '⊡', fn: () => setTransform(computeInitialTransform()) },
        ].map(({ label, fn }) => (
          <button key={label} onClick={fn}
            className="w-8 h-8 rounded-md text-sm font-bold flex items-center justify-center transition-colors hover:bg-slate-100"
            style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Scale badge */}
      <div className="absolute bottom-3 right-3 z-10 text-xs mono px-2 py-1 rounded"
        style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        {Math.round(transform.scale * 100)}%
      </div>

      {/* SVG canvas */}
      <svg
        ref={svgRef}
        width={svgW} height={svgH}
        style={{
          transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          display: 'block',
          willChange: 'transform',
        }}
        overflow="visible"
      >
        {/* Watermark */}
        <text x={svgW / 2} y={svgH / 2} textAnchor="middle" dominantBaseline="middle"
          fontSize={72} fontWeight="bold" fill="rgba(0,0,0,0.03)"
          style={{ userSelect: 'none', pointerEvents: 'none' }}>
          BLOCK {blockGroup.block}
        </text>

        {sortedHalls.map((hall, hi) => {
          const hallY      = PAD + hi * (hallH + FOYER_H);
          const isActive   = hall.id === activeHallId;
          const aisleCount = hall.aisleCount ?? 4;

          return (
            <g key={hall.id}>

              {/* ── MAIN FOYER between halls — unified full-width band, no internal seams ── */}
              {hi > 0 && (() => {
                const fy    = hallY - FOYER_H;
                const totalW = ENTRY_W + gridW + SERVICE_W;
                return (
                  <g>
                    {/* Single rect spanning entrance column + grid + service column */}
                    <rect x={PAD} y={fy} width={totalW} height={FOYER_H}
                      fill="rgba(226,232,240,0.50)" stroke="rgba(203,213,225,0.55)" strokeWidth={0.6} />
                    {/* Label centred in the main grid portion */}
                    <text x={gridX + gridW / 2} y={fy + FOYER_H / 2}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={9} fontFamily="sans-serif" fontWeight={500}
                      fill="rgba(100,116,139,0.80)" style={{ pointerEvents: 'none' }}>
                      ◄ MAIN FOYER (4 METRES WIDE PASSAGE) ►
                    </text>
                  </g>
                );
              })()}

              {/* ── LEFT ENTRANCE column ──────────────────────────────────── */}
              <rect x={PAD} y={hallY} width={ENTRY_W} height={hallH}
                fill={`${blockColor}05`} stroke="rgba(203,213,225,0.5)" strokeWidth={0.5} />

              {/* ── RIGHT SERVICE ENTRY column ────────────────────────────── */}
              <rect x={gridX + gridW} y={hallY} width={SERVICE_W} height={hallH}
                fill={`${blockColor}05`} stroke="rgba(203,213,225,0.5)" strokeWidth={0.5} />
              <text
                x={gridX + gridW + SERVICE_W / 2} y={hallY + hallH * 0.30}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={6} fontFamily="sans-serif" fontWeight={600} letterSpacing={1}
                fill={`${blockColor}75`}
                transform={`rotate(90,${gridX + gridW + SERVICE_W / 2},${hallY + hallH * 0.30})`}
                style={{ pointerEvents: 'none' }}>
                SERVICE ENTRY ►
              </text>
              <text x={gridX + gridW + SERVICE_W / 2} y={hallY + hallH * 0.58}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={28} fontFamily="serif" fontWeight="bold"
                fill={`${blockColor}25`} style={{ pointerEvents: 'none' }}>
                {blockGroup.block}
              </text>
              <text x={gridX + gridW + SERVICE_W / 2} y={hallY + hallH * 0.82}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={10} fontFamily="sans-serif" fontWeight={700}
                fill={isActive ? blockColor : `${blockColor}90`}
                style={{ pointerEvents: 'none' }}>
                {hall.name.toUpperCase()}
              </text>

              {/* ── Active hall highlight ──────────────────────────────────── */}
              {isActive && (
                <rect x={gridX - 2} y={hallY - 2} width={gridW + 4} height={hallH + 4}
                  fill="none" stroke={blockColor} strokeWidth={2.5} rx={2} />
              )}

              {/* ── Hall outer border ──────────────────────────────────────── */}
              <rect x={gridX} y={hallY} width={gridW} height={hallH}
                fill="none"
                stroke={isActive ? blockColor : 'rgba(148,163,184,0.45)'}
                strokeWidth={isActive ? 1.5 : 0.8} />

              {/* ── Aisles ── highest-numbered aisle at top ────────────────── */}
              {Array.from({ length: aisleCount }, (_, displayIdx) => {
                const aisleIdx  = aisleCount - 1 - displayIdx;
                const aisleName = hall.aisles[aisleIdx];
                const rowY      = hallY + displayIdx * ROW_H;
                const aisleY    = rowY + CELL_H;
                const ad        = aisleMap[aisleName] || {};

                // Boundary aisles (first/last of hall) show entrance gate marker
                const isBoundaryAisle = displayIdx === 0 || displayIdx === aisleCount - 1;

                return (
                  <g key={aisleName}>
                    {/* Compact entrance arrow — boundary aisles only, centred in the row */}
                    {isBoundaryAisle && (() => {
                      const arrowH = AISLE_H + 4;                      // ~28 px — small
                      const arrowY = rowY + (ROW_H - arrowH) / 2;     // vertically centred
                      const ax     = PAD + 6;
                      const tipX   = PAD + ENTRY_W - 6;
                      return (
                        <g style={{ pointerEvents: 'none' }}>
                          <polygon
                            points={`${ax},${arrowY} ${ax},${arrowY + arrowH} ${tipX},${arrowY + arrowH / 2}`}
                            fill={`${blockColor}18`}
                            stroke={`${blockColor}65`}
                            strokeWidth={1.2}
                            strokeLinejoin="round"
                          />
                          <text
                            x={ax + (tipX - ax) * 0.38} y={arrowY + arrowH / 2}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize={5.5} fontFamily="sans-serif" fontWeight={700} letterSpacing={0.8}
                            fill={`${blockColor}90`}
                            transform={`rotate(-90,${ax + (tipX - ax) * 0.38},${arrowY + arrowH / 2})`}>
                            ENTRANCE
                          </text>
                        </g>
                      );
                    })()}

                    {/* FOYER stalls — only for non-boundary aisles (entrance arrow occupies boundary rows) */}
                    {!isBoundaryAisle && (() => {
                      const fs = foyerMap[aisleName];
                      if (!fs?.length) return null;
                      const sliceH = Math.floor(ROW_H / fs.length);
                      return fs.map((s, fi) => {
                        const isLast = fi === fs.length - 1;
                        return (
                          <StallCell key={s.stallNumber}
                            x={PAD + 2} y={rowY + fi * sliceH}
                            w={ENTRY_W - 4} h={isLast ? ROW_H - fi * sliceH : sliceH}
                            id={s.stallNumber} stall={s}
                            dim={isDimmed(s)}
                            fill={fillColor(s)} stroke={strokeClr(s)}
                            onHover={handleStallHover}
                            onLeave={() => setHoveredStall(null)}
                            faceLeft={true} />
                        );
                      });
                    })()}

                    {/* Aisle corridor */}
                    <rect x={gridX} y={aisleY} width={gridW} height={AISLE_H}
                      fill="rgba(241,245,249,0.9)" stroke="rgba(203,213,225,0.55)" strokeWidth={0.4} />
                    <text x={gridX + gridW / 2} y={aisleY + AISLE_H / 2}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={9} fontFamily="monospace" fill="rgba(148,163,184,0.65)"
                      style={{ pointerEvents: 'none' }}>
                      ← {aisleName} →
                    </text>

                    {/* Top row — Side 1 */}
                    {renderAisleSide(ad[1], rowY)}

                    {/* Bottom row — Side 2 */}
                    {renderAisleSide(ad[2], aisleY + AISLE_H)}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {hoveredStall && <StallTooltip />}
    </div>
  );
}

// ── Empty placeholder cell ────────────────────────────────────────────────────
function EmptyCell({ x, y, w, h }) {
  return (
    <rect x={x + 0.5} y={y + 0.5} width={w - 1} height={h - 1} rx={1.5}
      fill="rgba(226,232,240,0.55)" stroke="rgba(203,213,225,0.8)" strokeWidth={0.4} />
  );
}

// ── Stall cell ────────────────────────────────────────────────────────────────
// faceLeft=true  → foyer stalls facing the left entrance passage; text rotated −90°
function StallCell({ x, y, w, h, id, stall, dim, fill, stroke, onHover, onLeave, faceLeft = false }) {
  const [hovered, setHovered] = useState(false);
  const statusColor = stall ? (STATUS_CONFIG[stall.status]?.color ?? '#94a3b8') : 'rgba(148,163,184,0.5)';
  const company     = stall?.exhibitor?.companyName;
  const hoverFill   = stall
    ? (STATUS_CONFIG[stall.status]?.bg?.replace(/[\d.]+\)$/, '0.28)') ?? fill)
    : 'rgba(148,163,184,0.15)';

  const idLabel  = id || '';
  const cx = x + w / 2;
  const cy = y + h / 2;

  // Company name only for normal (non-rotated) cells
  const maxChars = Math.max(2, Math.floor((faceLeft ? h - 6 : w - 6) / 4));
  const coLabel  = (!faceLeft && company) ? company.substring(0, maxChars) : '';

  return (
    <g className="stall-cell"
      style={{ cursor: stall ? 'pointer' : 'default' }}
      onMouseEnter={(e) => { setHovered(true);  onHover(e, stall); }}
      onMouseLeave={() =>  { setHovered(false); onLeave(); }}>
      <rect
        x={x + 0.5} y={y + 0.5} width={w - 1} height={h - 1} rx={1.5}
        fill={hovered ? hoverFill : fill}
        stroke={hovered ? statusColor : stroke}
        strokeWidth={hovered ? 1.8 : (stall ? 0.9 : 0.4)}
        opacity={dim ? 0.18 : 1}
      />
      {faceLeft ? (
        /* Foyer stall — rotated −90° so label reads from bottom to top (faces left passage) */
        <text
          x={cx} y={cy}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={7} fontWeight={600} fontFamily="monospace"
          fill={statusColor} opacity={dim ? 0.25 : 0.9}
          transform={`rotate(-90,${cx},${cy})`}
          style={{ pointerEvents: 'none' }}>
          {idLabel}
        </text>
      ) : (
        <>
          {/* Normal stall — horizontal label */}
          <text
            x={cx} y={cy - (coLabel ? 6 : 0)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={7} fontWeight={600} fontFamily="monospace"
            fill={statusColor} opacity={dim ? 0.25 : 0.9}
            style={{ pointerEvents: 'none' }}>
            {idLabel}
          </text>
          {coLabel && !dim && (
            <text x={cx} y={cy + 7}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={7} fill="rgba(0,0,0,0.85)"
              style={{ pointerEvents: 'none' }}>
              {coLabel}
            </text>
          )}
        </>
      )}
    </g>
  );
}
