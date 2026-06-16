'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useUIStore } from '@/store/ui-store';
import { STATUS_CONFIG } from '@/lib/hall-config';
import StallTooltip from './StallTooltip';

const CELL_W  = 36;   // stall cell width (SVG units)
const CELL_H  = 26;   // stall cell height
const AISLE_H = 20;   // aisle corridor height
const LABEL_W = 56;   // left column for aisle labels
const PAD     = 16;   // outer padding

export default function HallMap({ hall, stalls }) {
  const svgRef       = useRef(null);
  const containerRef = useRef(null);
  const { setHoveredStall, hoveredStall, statusFilter } = useUIStore();

  const [transform, setTransform] = useState({ x: PAD, y: PAD, scale: 1 });
  const [isPanning, setIsPanning]  = useState(false);
  const panStart = useRef(null);

  // stall number → stall doc lookup
  const stallMap = {};
  for (const s of stalls) stallMap[s.stallNumber] = s;

  const { aisles, stallsPerAisleRow: cols, gridCols, specialZones = [] } = hall;
  const numAisles  = aisles.length;
  const effectiveCols = gridCols ?? cols;

  const svgW = PAD + LABEL_W + effectiveCols * CELL_W + PAD;
  const svgH = PAD + numAisles * (CELL_H * 2 + AISLE_H) + PAD;

  /**
   * Stall ID format: {2-digit hallId}{3-digit sequential}
   * e.g. Hall 1 → "01001", "01002" … "01224"
   *      Hall 14 → "14001", "14002" … "14224"
   *
   * Within a hall, stalls are numbered:
   *   Aisle 0 top:    01..cols
   *   Aisle 0 bottom: cols+1..2*cols
   *   Aisle 1 top:    2*cols+1..3*cols
   *   …
   */
  function stallId(aisleIdx, side, colIdx) {
    const base =
      aisleIdx * cols * 2 +
      (side === 'top' ? 0 : cols) +
      colIdx + 1;
    return `${String(hall.id).padStart(2, '0')}${String(base).padStart(3, '0')}`;
  }

  function getStall(id) { return stallMap[id] || null; }

  function fillColor(stall) {
    if (!stall) return 'rgba(226,232,240,0.55)';
    return STATUS_CONFIG[stall.status]?.bg ?? 'rgba(226,232,240,0.55)';
  }
  function strokeColor(stall) {
    if (!stall) return 'rgba(203,213,225,0.8)';
    return STATUS_CONFIG[stall.status]?.border ?? '#cbd5e1';
  }
  function isDimmed(stall) {
    if (statusFilter === 'all') return false;
    return !stall || stall.status !== statusFilter;
  }

  // ── Pan & zoom ──────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    if (e.target.closest('.stall-cell')) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [transform]);

  const onPointerMove = useCallback((e) => {
    if (!isPanning) return;
    const start = panStart.current;
    if (!start) return;
    setTransform((t) => ({
      ...t,
      x: e.clientX - start.x,
      y: e.clientY - start.y,
    }));
  }, [isPanning]);

  const onPointerUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => {
      const newScale = Math.min(5, Math.max(0.25, t.scale * factor));
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { ...t, scale: newScale };
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      return {
        scale: newScale,
        x: mx - (mx - t.x) * (newScale / t.scale),
        y: my - (my - t.y) * (newScale / t.scale),
      };
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Reset when hall changes
  useEffect(() => {
    setTransform({ x: PAD, y: PAD, scale: 1 });
  }, [hall.id]);

  function handleStallHover(e, stall) {
    if (!stall) return;
    const rect = containerRef.current?.getBoundingClientRect();
    setHoveredStall(stall, {
      x: e.clientX - (rect?.left || 0),
      y: e.clientY - (rect?.top || 0),
    });
  }

  // ── Special zone colour map ──────────────────────────────────────────────
  const ZONE_COLORS = {
    entrance: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' },
    service:  { bg: '#fef9c3', border: '#ca8a04', text: '#854d0e' },
    lounge:   { bg: '#fce7f3', border: '#db2777', text: '#9d174d' },
    area:     { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' },
  };

  return (
    <div
      ref={containerRef}
      data-hall-container
      className="relative w-full overflow-hidden rounded-xl select-none"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        cursor: isPanning ? 'grabbing' : 'grab',
        minHeight: 480,
        height: '100%',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onMouseLeave={() => setHoveredStall(null)}
    >
      {/* ── Zoom controls ── */}
      <div
        className="absolute top-3 right-3 z-10 flex flex-col gap-1"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {[
          { label: '+', fn: () => setTransform((t) => ({ ...t, scale: Math.min(5, t.scale * 1.2) })) },
          { label: '−', fn: () => setTransform((t) => ({ ...t, scale: Math.max(0.25, t.scale * 0.85) })) },
          { label: '⊡', fn: () => setTransform({ x: PAD, y: PAD, scale: 1 }) },
        ].map(({ label, fn }) => (
          <button key={label} onClick={fn}
            className="w-8 h-8 rounded-md text-sm font-bold flex items-center justify-center transition-colors hover:bg-slate-100"
            style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Scale badge ── */}
      <div className="absolute bottom-3 right-3 z-10 text-xs mono px-2 py-1 rounded"
        style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        {Math.round(transform.scale * 100)}%
      </div>

      {/* ── Legend ── */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 p-2.5 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid var(--border)' }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: cfg.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{cfg.label}</span>
          </div>
        ))}
        {/* Special zone types present in this hall */}
        {[...new Set(specialZones.map((z) => z.type))].map((type) => {
          const c = ZONE_COLORS[type];
          return (
            <div key={type} className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-sm shrink-0"
                style={{ background: c.bg, border: `1px solid ${c.border}` }} />
              <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{type}</span>
            </div>
          );
        })}
      </div>

      {/* ── Hall info badge ── */}
      <div className="absolute bottom-3 left-3 z-10 text-xs px-2.5 py-1.5 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        <span className="font-semibold mono" style={{ color: hall.blockColor }}>{hall.name}</span>
        <span className="mx-1">·</span>
        {aisles[0]} – {aisles[aisles.length - 1]}
        <span className="mx-1">·</span>
        {numAisles * effectiveCols * 2} stalls
      </div>

      {/* ── SVG canvas ── */}
      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
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
          fontSize={80} fontWeight="bold" fill="rgba(0,0,0,0.035)"
          style={{ userSelect: 'none', pointerEvents: 'none' }}>
          {hall.name}
        </text>

        {/* Aisle rows */}
        {aisles.map((aisle, ai) => {
          const rowY   = PAD + ai * (CELL_H * 2 + AISLE_H);
          const aisleY = rowY + CELL_H;
          const gridX  = PAD + LABEL_W;
          const gridW  = effectiveCols * CELL_W;

          return (
            <g key={aisle}>
              {/* Aisle label (left) */}
              <text x={gridX - 6} y={aisleY + AISLE_H / 2}
                textAnchor="end" dominantBaseline="middle"
                fontSize={9} fontFamily="monospace" fill="var(--text-muted)">
                {aisle}
              </text>

              {/* Aisle corridor */}
              <rect x={gridX} y={aisleY} width={gridW} height={AISLE_H}
                fill="rgba(241,245,249,0.9)" stroke="rgba(203,213,225,0.6)" strokeWidth={0.5} />
              <text x={gridX + gridW / 2} y={aisleY + AISLE_H / 2}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={8} fontFamily="monospace" fill="rgba(148,163,184,0.7)"
                style={{ pointerEvents: 'none' }}>
                ← {aisle} →
              </text>

              {/* Top stall row */}
              {Array.from({ length: effectiveCols }, (_, ci) => {
                const id    = stallId(ai, 'top', ci);
                const stall = getStall(id);
                const dim   = isDimmed(stall);
                const x = gridX + ci * CELL_W;
                const y = rowY;
                return (
                  <StallCell key={`t${ci}`}
                    x={x} y={y} w={CELL_W} h={CELL_H}
                    id={id} stall={stall} dim={dim}
                    fill={fillColor(stall)} stroke={strokeColor(stall)}
                    onHover={handleStallHover}
                    onLeave={() => setHoveredStall(null)} />
                );
              })}

              {/* Bottom stall row */}
              {Array.from({ length: effectiveCols }, (_, ci) => {
                const id    = stallId(ai, 'bottom', ci);
                const stall = getStall(id);
                const dim   = isDimmed(stall);
                const x = gridX + ci * CELL_W;
                const y = aisleY + AISLE_H;
                return (
                  <StallCell key={`b${ci}`}
                    x={x} y={y} w={CELL_W} h={CELL_H}
                    id={id} stall={stall} dim={dim}
                    fill={fillColor(stall)} stroke={strokeColor(stall)}
                    onHover={handleStallHover}
                    onLeave={() => setHoveredStall(null)} />
                );
              })}
            </g>
          );
        })}

        {/* Special zones — rendered below the stall grid */}
        {specialZones.map((zone, zi) => {
          const c  = ZONE_COLORS[zone.type] || ZONE_COLORS.area;
          const zW = 120;
          const zH = 22;
          const gridX = PAD + LABEL_W;
          const zX = gridX + zi * (zW + 8);
          const zY = svgH - PAD - zH;
          return (
            <g key={zi}>
              <rect x={zX} y={zY} width={zW} height={zH} rx={4}
                fill={c.bg} stroke={c.border} strokeWidth={1} />
              <text x={zX + zW / 2} y={zY + zH / 2}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={8} fontFamily="sans-serif" fontWeight={600}
                fill={c.text} style={{ pointerEvents: 'none' }}>
                {zone.label}
              </text>
            </g>
          );
        })}

        {/* Outer border */}
        <rect x={PAD + LABEL_W} y={PAD}
          width={effectiveCols * CELL_W}
          height={numAisles * (CELL_H * 2 + AISLE_H)}
          fill="none" stroke="var(--border-light)" strokeWidth={1.5} rx={3} />
      </svg>

      {hoveredStall && <StallTooltip />}
    </div>
  );
}

// ── Individual stall cell (extracted to avoid repetition) ───────────────────
function StallCell({ x, y, w, h, id, stall, dim, fill, stroke, onHover, onLeave }) {
  const [hovered, setHovered] = useState(false);
  const statusColor = stall ? (STATUS_CONFIG[stall.status]?.color ?? '#94a3b8') : 'rgba(148,163,184,0.5)';
  const company     = stall?.exhibitor?.companyName;

  const hoverFill   = stall ? STATUS_CONFIG[stall.status]?.bg?.replace(/[\d.]+\)$/, '0.25)') ?? fill : 'rgba(148,163,184,0.15)';

  return (
    <g className="stall-cell"
      style={{ cursor: stall ? 'pointer' : 'default' }}
      onMouseEnter={(e) => { setHovered(true); onHover(e, stall); }}
      onMouseLeave={() => { setHovered(false); onLeave(); }}>
      <rect
        x={x + 1} y={y + 1}
        width={w - 2} height={h - 2}
        rx={2}
        fill={hovered ? hoverFill : fill}
        stroke={hovered ? statusColor : stroke}
        strokeWidth={hovered ? 2 : (stall ? 1.5 : 0.5)}
        opacity={dim ? 0.18 : 1}
      />
      {/* Stall ID */}
      <text
        x={x + w / 2}
        y={y + h / 2 - (company ? 3.5 : 0)}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={7} fontFamily="monospace"
        fill={statusColor}
        opacity={dim ? 0.25 : 0.9}
        style={{ pointerEvents: 'none' }}>
        {id}
      </text>
      {/* Company snippet (only when data present and not dimmed) */}
      {company && !dim && (
        <text
          x={x + w / 2} y={y + h / 2 + 5.5}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={5.5} fill="rgba(71,85,105,0.75)"
          style={{ pointerEvents: 'none' }}>
          {company.substring(0, 9)}
        </text>
      )}
    </g>
  );
}
