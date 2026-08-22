'use client';
import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useUIStore } from '@/store/ui-store';
import { STATUS_CONFIG } from '@/lib/hall-config';
import { BLOCK_E_STALLS, HALL_AISLES } from '@/data/block-e-coords';
import StallTooltip from './StallTooltip';

// ── Constants ─────────────────────────────────────────────────────────────────
const SCALE     = 6;    // px per CAD unit
const PAD       = 40;
const CROSS_GAP = 7.5;  // CAD Y gap ≥ this → cross-walkway between runs

// ── Coordinate bounds from all four corners of every stall ────────────────────
const ALL_XS = BLOCK_E_STALLS.flatMap(s => [s.x, s.x1 ?? s.x]);
const ALL_YS = BLOCK_E_STALLS.flatMap(s => [s.y, s.y1 ?? s.y]);
const MIN_X  = Math.min(...ALL_XS);
const MAX_X  = Math.max(...ALL_XS);
const MIN_Y  = Math.min(...ALL_YS);
const MAX_Y  = Math.max(...ALL_YS);

const toSX = cx => (cx - MIN_X) * SCALE + PAD;
const toSY = cy => (MAX_Y - cy) * SCALE + PAD;   // inverted: entrance at bottom

const SVG_W = (MAX_X - MIN_X) * SCALE + PAD * 2;
const SVG_H = (MAX_Y - MIN_Y) * SCALE + PAD * 2;

// ── Precompute layout from exact DWG coordinates ──────────────────────────────
const { STALL_RECTS, HALL_BBOX, AISLE_LABELS } = (() => {

  const regularStalls = BLOCK_E_STALLS.filter(s => s.hall !== 'FOYER');
  const byAisle = {};
  for (const s of regularStalls) (byAisle[s.aisle] ??= []).push(s);

  // Phase 1: HIGH-X vs LOW-X cluster per stall within each aisle
  const isHighXMap = new Map();
  for (const astalls of Object.values(byAisle)) {
    const midXs = astalls.map(s => (s.x + (s.x1 ?? s.x)) / 2);
    const sorted = [...midXs].sort((a, b) => a - b);
    let splitIdx = 0, maxGap = 0;
    for (let i = 1; i < sorted.length; i++) {
      const g = sorted[i] - sorted[i - 1];
      if (g > maxGap) { maxGap = g; splitIdx = i; }
    }
    const threshold = sorted[splitIdx - 1] + maxGap / 2;
    for (const s of astalls) isHighXMap.set(s.stall, (s.x + (s.x1 ?? s.x)) / 2 >= threshold);
  }

  // Phase 2: detect run boundaries (cross-walkway Y gaps ≥ CROSS_GAP)
  const openBottomSet = new Set();
  const openTopSet    = new Set();
  for (const astalls of Object.values(byAisle)) {
    for (const isHighX of [true, false]) {
      const cluster = astalls.filter(s => isHighXMap.get(s.stall) === isHighX);
      if (!cluster.length) continue;
      const sorted = [...cluster].sort((a, b) => a.y - b.y);
      const runs = [[sorted[0]]];
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].y - sorted[i - 1].y >= CROSS_GAP) runs.push([sorted[i]]);
        else runs[runs.length - 1].push(sorted[i]);
      }
      for (const run of runs) {
        openBottomSet.add(run[0].stall);
        openTopSet.add(run[run.length - 1].stall);
      }
    }
  }

  // Build per-stall rects directly from (x,y)-(x1,y1) DWG bounds
  const STALL_RECTS = BLOCK_E_STALLS.map(s => ({
    stall:         s,
    sx1:           toSX(Math.min(s.x, s.x1 ?? s.x)),
    sx2:           toSX(Math.max(s.x, s.x1 ?? s.x)),
    sy1:           toSY(Math.max(s.y, s.y1 ?? s.y)),
    sy2:           toSY(Math.min(s.y, s.y1 ?? s.y)),
    isHighX:       isHighXMap.get(s.stall) ?? false,
    isDoubleFaced: s.groupBottom === true || s.groupTop === true,
    openBottom:    openBottomSet.has(s.stall),
    openTop:       openTopSet.has(s.stall),
    isFoyer:       s.hall === 'FOYER',
  }));

  // Hall bounding boxes — exclude foyer stalls so outline stays tight around regular stalls
  const HALL_BBOX = {};
  for (const [hid, aisleNums] of Object.entries(HALL_AISLES)) {
    const rects = STALL_RECTS.filter(r => aisleNums.includes(r.stall.aisle) && !r.isFoyer);
    if (!rects.length) { HALL_BBOX[hid] = null; continue; }
    const sxArr = rects.flatMap(r => [r.sx1, r.sx2]);
    const syArr = rects.flatMap(r => [r.sy1, r.sy2]);
    HALL_BBOX[hid] = {
      x: Math.min(...sxArr) - 6, y: Math.min(...syArr) - 20,
      w: Math.max(...sxArr) - Math.min(...sxArr) + 12,
      h: Math.max(...syArr) - Math.min(...syArr) + 40,
    };
  }

  // Aisle corridor labels
  const AISLE_LABELS = Object.entries(byAisle).map(([aisleNumStr, astalls]) => {
    const aisleNum  = Number(aisleNumStr);
    const highRects = STALL_RECTS.filter(r => r.stall.aisle === aisleNum &&  r.isHighX);
    const lowRects  = STALL_RECTS.filter(r => r.stall.aisle === aisleNum && !r.isHighX);
    const highFace  = highRects.length ? Math.min(...highRects.map(r => r.sx1)) : null;
    const lowFace   = lowRects.length  ? Math.max(...lowRects.map(r => r.sx2))  : null;
    const corridorX = highFace != null && lowFace != null ? (highFace + lowFace) / 2 : highFace ?? lowFace ?? 0;
    const all = [...highRects, ...lowRects];
    return {
      aisleNum, corridorX, label: `E-${String(aisleNum).padStart(2, '0')}`,
      syMin: Math.min(...all.map(r => r.sy1)),
      syMax: Math.max(...all.map(r => r.sy2)),
    };
  });

  return { STALL_RECTS, HALL_BBOX, AISLE_LABELS };
})();

// ── Status helpers ─────────────────────────────────────────────────────────────
const VACANT_CFG = { color: '#64748b', bg: 'rgba(241,245,249,0.85)', border: 'rgba(100,116,139,0.55)' };
const DIM_CFG    = { color: '#cbd5e1', bg: 'rgba(241,245,249,0.2)',  border: 'rgba(203,213,225,0.15)' };
const scfg = (status, dimmed) => dimmed ? DIM_CFG : (STATUS_CONFIG[status] ?? VACANT_CFG);

// ── Main component ────────────────────────────────────────────────────────────
export default function DwgMap({ blockConfig, stalls, activeHallId }) {
  const containerRef = useRef(null);
  const { setHoveredStall, hoveredStall, statusFilter } = useUIStore();
  const [pan,     setPan]     = useState({ x: 0, y: 0, scale: 1 });
  const [panning, setPanning] = useState(false);
  const origin = useRef(null);

  const apiMap = useMemo(() => {
    const m = {};
    for (const s of stalls) if (s.stallNumber) m[s.stallNumber] = s;
    return m;
  }, [stalls]);

  const activeAisles = useMemo(() => {
    if (!activeHallId) return null;
    const a = HALL_AISLES[activeHallId];
    return a ? new Set(a) : null;
  }, [activeHallId]);

  const onPD = useCallback(e => {
    if (e.target.closest('.ds')) return;
    setPanning(true);
    origin.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [pan]);
  const onPM = useCallback(e => {
    if (!panning) return;
    const o = origin.current;
    if (!o) return;
    setPan(p => ({ ...p, x: e.clientX - o.x, y: e.clientY - o.y }));
  }, [panning]);
  const onPU = useCallback(() => { setPanning(false); origin.current = null; }, []);

  const onWheel = useCallback(e => {
    e.preventDefault();
    const f = e.deltaY > 0 ? 0.88 : 1.14;
    setPan(p => {
      const ns = Math.min(20, Math.max(0.05, p.scale * f));
      const r  = containerRef.current?.getBoundingClientRect();
      if (!r) return { ...p, scale: ns };
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      return { scale: ns, x: mx - (mx - p.x) * ns / p.scale, y: my - (my - p.y) * ns / p.scale };
    });
  }, []);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const fitView = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const cw = c.clientWidth, ch = c.clientHeight;
    const b  = activeHallId ? HALL_BBOX[activeHallId] : null;
    if (b) {
      const sc = Math.min(5, Math.max(0.1, Math.min((cw - 60) / b.w, (ch - 60) / b.h)));
      setPan({ x: (cw - b.w * sc) / 2 - b.x * sc, y: (ch - b.h * sc) / 2 - b.y * sc, scale: sc });
    } else {
      const sc = Math.max(0.05, Math.min(1.4, (cw - 32) / SVG_W, (ch - 32) / SVG_H));
      setPan({ x: (cw - SVG_W * sc) / 2, y: (ch - SVG_H * sc) / 2, scale: sc });
    }
  }, [activeHallId]);
  useEffect(() => { requestAnimationFrame(fitView); }, [fitView]);

  const onHover = useCallback((e, sn, aisleNum) => {
    const s = apiMap[sn];
    const r = containerRef.current?.getBoundingClientRect();
    setHoveredStall(
      s ?? { stallNumber: sn, status: 'vacant', exhibitor: {}, area: 9, aisle: `E-${String(aisleNum).padStart(2, '0')}` },
      { x: e.clientX - (r?.left || 0), y: e.clientY - (r?.top || 0), cw: r?.width || 800, ch: r?.height || 600 }
    );
  }, [apiMap, setHoveredStall]);
  const onLeave = useCallback(() => setHoveredStall(null), [setHoveredStall]);

  const color = blockConfig?.color || '#2563eb';

  return (
    <div ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl select-none"
      style={{ background: '#f8fafc', border: '1px solid var(--border)', cursor: panning ? 'grabbing' : 'grab', minHeight: 520, height: '100%' }}
      onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerLeave={onPU}
      onMouseLeave={onLeave}>

      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg px-3 py-1.5"
        style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid var(--border)' }}>
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-xs font-semibold" style={{ color }}>Block E · DWG Map</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{BLOCK_E_STALLS.length} stalls</span>
      </div>

      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1" onPointerDown={e => e.stopPropagation()}>
        {[
          { lbl: '+', fn: () => setPan(p => ({ ...p, scale: Math.min(20, p.scale * 1.25) })) },
          { lbl: '−', fn: () => setPan(p => ({ ...p, scale: Math.max(0.05, p.scale * 0.8) })) },
          { lbl: '⊡', fn: fitView },
        ].map(({ lbl, fn }) => (
          <button key={lbl} onClick={fn}
            className="w-8 h-8 rounded-md text-sm font-bold flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="absolute bottom-3 right-3 z-10 text-xs px-2 py-1 rounded"
        style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        {Math.round(pan.scale * 100)}%
      </div>

      <svg width={SVG_W} height={SVG_H}
        style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${pan.scale})`, transformOrigin: '0 0', display: 'block', willChange: 'transform', overflow: 'visible' }}>

        <rect width={SVG_W} height={SVG_H} fill="white" />

        {/* Hall outlines */}
        {Object.entries(HALL_BBOX).map(([hid, b]) => {
          if (!b) return null;
          const active = Number(hid) === activeHallId;
          return (
            <g key={hid}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={3}
                fill={active ? `${color}08` : 'transparent'}
                stroke={active ? color : 'rgba(148,163,184,0.22)'}
                strokeWidth={active ? 1.2 : 0.6}
                strokeDasharray={active ? '' : '5,3'} />
              <text x={b.x + b.w / 2} y={b.y - 8}
                textAnchor="middle" fontSize={8} fontWeight={700} fontFamily="sans-serif"
                fill={active ? color : 'rgba(148,163,184,0.5)'}>
                HALL {hid}
              </text>
            </g>
          );
        })}

        {/* Aisle corridor labels — rotated 90° like DWG */}
        {AISLE_LABELS.map(({ aisleNum, corridorX, syMin, syMax, label }) => {
          const active = activeAisles ? activeAisles.has(aisleNum) : true;
          const midY   = (syMin + syMax) / 2;
          return (
            <text key={aisleNum}
              x={corridorX} y={midY}
              textAnchor="middle" dominantBaseline="middle"
              transform={`rotate(-90, ${corridorX}, ${midY})`}
              fontSize={4.5} fontWeight={700} fontFamily="monospace" letterSpacing={0.4}
              fill={active ? 'rgba(51,65,85,0.4)' : 'rgba(148,163,184,0.18)'}
              style={{ pointerEvents: 'none' }}>
              {label}
            </text>
          );
        })}

        {/* Individual stalls at exact DWG coordinates */}
        {STALL_RECTS.map(rect => {
          const inActive = activeAisles ? activeAisles.has(rect.stall.aisle) : true;
          return (
            <StallRect key={rect.stall.stall} rect={rect} apiMap={apiMap}
              statusFilter={statusFilter} inActive={inActive}
              onHover={onHover} onLeave={onLeave} />
          );
        })}
      </svg>

      {hoveredStall && <StallTooltip />}
    </div>
  );
}

// ── StallRect — renders one stall at its exact DWG coordinate bounds ──────────
// Frame rules:
//   isDoubleFaced → only top + bottom dashed lines (both aisle faces open)
//   !isHighX      → back wall left (sx1), aisle face right (OPEN)
//    isHighX      → back wall right (sx2), aisle face left (OPEN)
//   openBottom    → also omit the bottom (entrance/cross-walkway) line
//   openTop       → also omit the top (far-end) line
function StallRect({ rect, apiMap, statusFilter, inActive, onHover, onLeave }) {
  const [hov, setHov] = useState(false);
  const { stall: s, sx1, sx2, sy1, sy2, isHighX, isDoubleFaced, openBottom, isFoyer } = rect;
  const w = sx2 - sx1;
  const h = sy2 - sy1;
  if (w <= 0 || h <= 0) return null;

  const api     = apiMap[s.stall];
  const status  = api?.status ?? 'vacant';
  const dimmed  = !inActive || (statusFilter !== 'all' && status !== statusFilter);
  const c       = scfg(status, dimmed);
  const fillCol = hov ? c.bg.replace(/[\d.]+\)$/, '0.65)') : c.bg;
  const midX    = (sx1 + sx2) / 2;
  const midY    = (sy1 + sy2) / 2;

  let solidPath, dashedPath;
  if (isFoyer) {
    // Standalone foyer booth — all 4 sides solid
    solidPath  = `M${sx1},${sy1} H${sx2} V${sy2} H${sx1} Z`;
    dashedPath = '';
  } else if (isDoubleFaced) {
    // 3 sides dashed: both aisle faces (left+right) + the open end (entrance or walkway)
    // 1 side solid: the end that connects to the adjacent stall in the run
    if (openBottom) {
      // groupBottom: bottom = entrance/walkway (open/dashed), top = connects to run (solid)
      solidPath  = `M${sx1},${sy1} H${sx2}`;
      dashedPath = `M${sx1},${sy2} H${sx2} M${sx1},${sy1} V${sy2} M${sx2},${sy1} V${sy2}`;
    } else {
      // groupTop: top = cross-walkway (open/dashed), bottom = connects to run (solid)
      solidPath  = `M${sx1},${sy2} H${sx2}`;
      dashedPath = `M${sx1},${sy1} H${sx2} M${sx1},${sy1} V${sy2} M${sx2},${sy1} V${sy2}`;
    }
  } else if (!isHighX) {
    // Back wall at LEFT (sx1), aisle face at RIGHT (sx2)
    solidPath  = `M${sx2},${sy1} H${sx1} V${sy2} H${sx2}`;  // top → back → bottom
    dashedPath = `M${sx2},${sy1} V${sy2}`;                    // right (aisle face)
  } else {
    // Back wall at RIGHT (sx2), aisle face at LEFT (sx1)
    solidPath  = `M${sx1},${sy1} H${sx2} V${sy2} H${sx1}`;  // top → back → bottom
    dashedPath = `M${sx1},${sy1} V${sy2}`;                    // left (aisle face)
  }

  const solidStroke  = inActive ? 'rgba(30,41,59,0.80)'  : 'rgba(148,163,184,0.30)';
  const dashedStroke = inActive ? 'rgba(30,41,59,0.45)'  : 'rgba(148,163,184,0.18)';

  return (
    <g className="ds" style={{ cursor: 'pointer' }}
      onMouseEnter={e => { setHov(true);  onHover(e, s.stall, s.aisle); }}
      onMouseLeave={() => { setHov(false); onLeave(); }}>
      <rect x={sx1} y={sy1} width={w} height={h} fill={fillCol} stroke="none" />
      {hov && <rect x={sx1 + 0.5} y={sy1 + 0.5} width={w - 1} height={h - 1}
        fill="none" stroke={c.color} strokeWidth={0.8} />}
      {h > 7 && w > 10 && (
        <text x={midX} y={midY} textAnchor="middle" dominantBaseline="middle"
          fontSize={Math.min(5, h * 0.38, w * 0.22)} fontWeight={600} fontFamily="monospace"
          fill={c.color} style={{ pointerEvents: 'none' }}>
          {s.stall}
        </text>
      )}
      <path d={solidPath}  stroke={solidStroke}  strokeWidth={0.9} fill="none" />
      {dashedPath && <path d={dashedPath} stroke={dashedStroke} strokeWidth={0.7} strokeDasharray="3,2" fill="none" />}
    </g>
  );
}
