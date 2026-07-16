'use client';
import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useUIStore } from '@/store/ui-store';
import { STATUS_CONFIG } from '@/lib/hall-config';
import StallTooltip from './StallTooltip';

// ── Layout constants ──────────────────────────────────────────────────────────
const CELL_H    = 22;   // stall cell height
const AISLE_H   = 16;   // walkway corridor height
const FOYER_H   = 38;   // MAIN FOYER passage between halls
const ENTRY_W   = 64;   // left entrance column
const SERVICE_W = 60;   // right service-entry column
const PAD       = 14;

const BASE_SQM  = 9;    // 1 standard module = 9 sqm (3m × 3m)
const UNIT_PX   = 26;   // pixels per 9-sqm module
const MIN_PX    = 20;   // minimum stand width so labels are readable
const DEF_COLS  = 28;   // fallback columns per row when no data

const ROW_H = CELL_H * 2 + AISLE_H;

// Width in pixels for a given space (sqm)
function sqmToPx(area) {
  return Math.max(Math.round((area / BASE_SQM) * UNIT_PX), MIN_PX);
}

// Position number from stallNumber "E-01/03" → 3
function stallPos(stallNumber) {
  const m = (stallNumber || '').match(/\/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

export default function BlockMap({ blockGroup, halls, stalls, activeHallId }) {
  const svgRef       = useRef(null);
  const containerRef = useRef(null);
  const { setHoveredStall, hoveredStall, statusFilter } = useUIStore();

  const [transform, setTransform] = useState({ x: PAD, y: PAD, scale: 1 });
  const [isPanning,  setIsPanning] = useState(false);
  const panStart = useRef(null);

  // ── Group stalls by aisle → side ─────────────────────────────────────────
  // aisleMap: { "E-01": { 1: [stall,...], 2: [stall,...] } }
  // odd position → side 1 (top row / left of aisle)
  // even position → side 2 (bottom row / right of aisle)
  const aisleMap = useMemo(() => {
    const map = {};
    for (const s of stalls) {
      if (!s.aisle) continue;
      if (!map[s.aisle]) map[s.aisle] = { 1: [], 2: [] };
      const pos = stallPos(s.stallNumber);
      const sk  = pos % 2 === 0 ? 2 : 1;
      map[s.aisle][sk].push(s);
    }
    for (const ad of Object.values(map)) {
      for (const arr of Object.values(ad)) {
        arr.sort((a, b) => stallPos(a.stallNumber) - stallPos(b.stallNumber));
      }
    }
    return map;
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

  const sortedHalls  = useMemo(() => [...halls].sort((a, b) => b.id - a.id), [halls]);
  const aislesPerHall = halls[0]?.aisleCount ?? 4;
  const hallH        = aislesPerHall * ROW_H;
  const numFoyers    = sortedHalls.length - 1;
  const blockColor   = blockGroup.color;
  const gridX        = PAD + ENTRY_W;
  const svgW         = PAD + ENTRY_W + gridW + SERVICE_W + PAD;
  const svgH         = PAD + sortedHalls.length * hallH + numFoyers * FOYER_H + PAD;

  // ── Status helpers ────────────────────────────────────────────────────────
  const fillColor = (s)  => s ? (STATUS_CONFIG[s.status]?.bg    ?? 'rgba(226,232,240,0.55)') : 'rgba(226,232,240,0.55)';
  const strokeClr = (s)  => s ? (STATUS_CONFIG[s.status]?.border ?? 'rgba(203,213,225,0.8)')  : 'rgba(203,213,225,0.8)';
  const isDimmed  = (s)  => statusFilter !== 'all' && (!s || s.status !== statusFilter);

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
      const ns   = Math.min(5, Math.max(0.15, t.scale * factor));
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

  useEffect(() => { setTransform({ x: PAD, y: PAD, scale: 1 }); }, [blockGroup.block]);

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
          { label: '−', fn: () => setTransform((t) => ({ ...t, scale: Math.max(0.15, t.scale * 0.85) })) },
          { label: '⊡', fn: () => setTransform({ x: PAD, y: PAD, scale: 1 }) },
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

      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 p-2.5 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid var(--border)' }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: cfg.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{cfg.label}</span>
          </div>
        ))}
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
          const hallY    = PAD + hi * (hallH + FOYER_H);
          const isActive = hall.id === activeHallId;
          const aisleCount = hall.aisleCount ?? 4;

          return (
            <g key={hall.id}>

              {/* ── MAIN FOYER between halls ──────────────────────────────── */}
              {hi > 0 && (() => {
                const fy = hallY - FOYER_H;
                return (
                  <g>
                    <rect x={gridX} y={fy} width={gridW} height={FOYER_H}
                      fill="rgba(226,232,240,0.45)" stroke="rgba(203,213,225,0.5)" strokeWidth={0.5} />
                    <text x={gridX + gridW / 2} y={fy + FOYER_H / 2}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={7} fontFamily="sans-serif" fontWeight={500}
                      fill="rgba(100,116,139,0.75)" style={{ pointerEvents: 'none' }}>
                      ◄ MAIN FOYER (4 METRES WIDE PASSAGE) ►
                    </text>
                    <rect x={PAD}           y={fy} width={ENTRY_W}   height={FOYER_H} fill="rgba(226,232,240,0.3)" stroke="rgba(203,213,225,0.4)" strokeWidth={0.5} />
                    <rect x={gridX + gridW} y={fy} width={SERVICE_W} height={FOYER_H} fill="rgba(226,232,240,0.3)" stroke="rgba(203,213,225,0.4)" strokeWidth={0.5} />
                  </g>
                );
              })()}

              {/* ── LEFT ENTRANCE column ──────────────────────────────────── */}
              <rect x={PAD} y={hallY} width={ENTRY_W} height={hallH}
                fill={`${blockColor}07`} stroke="rgba(203,213,225,0.5)" strokeWidth={0.5} />
              <text
                x={PAD + ENTRY_W / 2} y={hallY + hallH / 2}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={7} fontFamily="sans-serif" fontWeight={600} letterSpacing={1.5}
                fill={`${blockColor}70`}
                transform={`rotate(-90,${PAD + ENTRY_W / 2},${hallY + hallH / 2})`}
                style={{ pointerEvents: 'none' }}>
                ▼  ENTRANCE
              </text>

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
                fontSize={7} fontFamily="sans-serif" fontWeight={700}
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

                return (
                  <g key={aisleName}>
                    {/* Aisle label */}
                    <text x={PAD + ENTRY_W - 5} y={aisleY + AISLE_H / 2}
                      textAnchor="end" dominantBaseline="middle"
                      fontSize={7} fontFamily="monospace"
                      fill={`${blockColor}85`}>
                      {aisleName}
                    </text>

                    {/* Aisle corridor */}
                    <rect x={gridX} y={aisleY} width={gridW} height={AISLE_H}
                      fill="rgba(241,245,249,0.9)" stroke="rgba(203,213,225,0.55)" strokeWidth={0.4} />
                    <text x={gridX + gridW / 2} y={aisleY + AISLE_H / 2}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={6.5} fontFamily="monospace" fill="rgba(148,163,184,0.65)"
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
function StallCell({ x, y, w, h, id, stall, dim, fill, stroke, onHover, onLeave }) {
  const [hovered, setHovered] = useState(false);
  const statusColor = stall ? (STATUS_CONFIG[stall.status]?.color ?? '#94a3b8') : 'rgba(148,163,184,0.5)';
  const company     = stall?.exhibitor?.companyName;
  const hoverFill   = stall
    ? (STATUS_CONFIG[stall.status]?.bg?.replace(/[\d.]+\)$/, '0.28)') ?? fill)
    : 'rgba(148,163,184,0.15)';

  // Truncate label to fit: ~5.5px per char at fontSize=5
  const maxChars = Math.max(2, Math.floor(w / 5.5));
  const idLabel  = id ? (id.split('/')[1] ?? id) : '';   // show just the position "01"
  const coLabel  = company ? company.substring(0, maxChars) : '';

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
      {/* Stand number */}
      <text
        x={x + w / 2} y={y + h / 2 - (coLabel ? 3 : 0)}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={5} fontFamily="monospace"
        fill={statusColor} opacity={dim ? 0.25 : 0.85}
        style={{ pointerEvents: 'none' }}>
        {idLabel}
      </text>
      {/* Company name (short) */}
      {coLabel && !dim && (
        <text x={x + w / 2} y={y + h / 2 + 4}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={4} fill="rgba(71,85,105,0.85)"
          style={{ pointerEvents: 'none' }}>
          {coLabel}
        </text>
      )}
    </g>
  );
}
