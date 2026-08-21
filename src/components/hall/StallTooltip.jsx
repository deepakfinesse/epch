'use client';
import { useUIStore } from '@/store/ui-store';
import { STATUS_CONFIG } from '@/lib/hall-config';
import { Building2, User, Mail, Phone, MapPin, Tag, LayoutGrid, ArrowUpDown } from 'lucide-react';

const TOOLTIP_W = 260;
const TOOLTIP_H = 260;

export default function StallTooltip() {
  const { hoveredStall, tooltipPos } = useUIStore();
  if (!hoveredStall) return null;

  const { stallNumber, hallId, aisle, area, side, status, exhibitor = {} } = hoveredStall;
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.available;

  // Smart flip: stay close to cursor, flip side if tooltip would overflow
  const { x, y, cw = 800, ch = 600 } = tooltipPos;
  const OFFSET = 14;
  let tx = x + OFFSET;
  if (tx + TOOLTIP_W > cw - 6) tx = x - TOOLTIP_W - OFFSET;
  tx = Math.max(4, tx);

  let ty = y - TOOLTIP_H / 2;
  if (ty + TOOLTIP_H > ch - 6) ty = ch - TOOLTIP_H - 6;
  if (ty < 4) ty = 4;

  const rows = [
    { icon: LayoutGrid,  label: 'Stall',   value: `${stallNumber}  ·  Hall ${hallId}  ·  ${area || 9} sqm` },
    { icon: Tag,         label: 'Aisle',   value: aisle || '—' },
    { icon: ArrowUpDown, label: 'Side',    value: side ? String(side) : '—' },
    { icon: Building2,  label: 'Company', value: exhibitor.companyName || '—' },
    { icon: User,       label: 'Contact', value: exhibitor.contactPerson || '—' },
    { icon: Mail,       label: 'Email',   value: exhibitor.email || '—' },
    { icon: Phone,      label: 'Phone',   value: exhibitor.phone || '—' },
    { icon: MapPin,     label: 'Location',value: [exhibitor.city, exhibitor.state].filter(Boolean).join(', ') || '—' },
    { icon: Tag,        label: 'Category',value: exhibitor.productCategory || '—' },
  ];

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{ left: tx, top: ty, width: TOOLTIP_W }}
    >
      <div
        className="rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(8,12,20,0.97)',
          border: `1px solid ${statusCfg.border}`,
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Header */}
        <div
          className="px-3 py-2.5 flex items-center justify-between"
          style={{ background: statusCfg.bg, borderBottom: `1px solid ${statusCfg.border}` }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: statusCfg.color }}
            />
            <span className="text-xs font-semibold mono" style={{ color: statusCfg.color }}>
              {stallNumber}
            </span>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: statusCfg.bg,
              border: `1px solid ${statusCfg.border}`,
              color: statusCfg.color,
            }}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* Detail rows */}
        <div className="px-3 py-2 space-y-1.5">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-2 text-xs">
              <Icon
                size={11}
                className="shrink-0 mt-0.5"
                style={{ color: 'rgba(148,163,184,0.8)' }}
              />
              <span className="shrink-0 w-14" style={{ color: 'rgba(148,163,184,0.8)' }}>
                {label}
              </span>
              <span
                className="flex-1 truncate"
                style={{ color: value === '—' ? 'rgba(100,116,139,0.7)' : '#f1f5f9' }}
                title={value}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
