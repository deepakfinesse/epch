'use client';
import { useUIStore } from '@/store/ui-store';
import { STATUS_CONFIG } from '@/lib/hall-config';
import { Building2, User, Mail, Phone, MapPin, Tag, LayoutGrid, ArrowUpDown } from 'lucide-react';

const TOOLTIP_W = 320;
const TOOLTIP_H = 420;

export default function StallTooltip() {
  const { hoveredStall, tooltipPos } = useUIStore();
  if (!hoveredStall) return null;

  const { stallNumber, hallId, aisle, area, side, status, exhibitor = {} } = hoveredStall;
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.available;

  const { x, y, cw = 800, ch = 600 } = tooltipPos;
  const OFFSET = 14;
  let tx = x + OFFSET;
  if (tx + TOOLTIP_W > cw - 6) tx = x - TOOLTIP_W - OFFSET;
  tx = Math.max(4, tx);
  let ty = y - TOOLTIP_H / 2;
  if (ty + TOOLTIP_H > ch - 6) ty = ch - TOOLTIP_H - 6;
  if (ty < 4) ty = 4;

  const location = [exhibitor.city, exhibitor.state].filter(Boolean).join(', ');

  // Split combined company names (e.g. "A / B") into separate blocks
  const companies = exhibitor.companyName
    ? exhibitor.companyName.split('/').map(s => s.trim()).filter(Boolean)
    : [];

  const muted  = 'rgba(148,163,184,0.8)';
  const border = 'rgba(51,65,85,0.7)';

  function Row({ icon: Icon, label, value }) {
    if (!value) return null;
    return (
      <div className="flex items-start gap-2 text-xs">
        <Icon size={11} className="shrink-0 mt-0.5" style={{ color: muted }} />
        <span className="shrink-0 w-14" style={{ color: muted }}>{label}</span>
        <span className="flex-1" style={{ color: '#f1f5f9', wordBreak: 'break-word' }}>{value}</span>
      </div>
    );
  }

  function CompanyBlock({ name }) {
    return (
      <div className="space-y-1.5">
        <Row icon={Building2} label="Company"  value={name} />
        <Row icon={User}      label="Contact"  value={exhibitor.contactPerson} />
        <Row icon={Mail}      label="Email"    value={exhibitor.email} />
        <Row icon={Phone}     label="Phone"    value={exhibitor.phone} />
        <Row icon={MapPin}    label="Location" value={location} />
        <Row icon={Tag}       label="Category" value={exhibitor.productCategory} />
      </div>
    );
  }

  const hasExhibitor = companies.length > 0 || exhibitor.contactPerson || exhibitor.email;

  return (
    <div className="absolute z-50 pointer-events-none" style={{ left: tx, top: ty, width: TOOLTIP_W }}>
      <div
        className="rounded-xl overflow-hidden shadow-2xl"
        style={{ background: 'rgba(8,12,20,0.97)', border: `1px solid ${statusCfg.border}`, backdropFilter: 'blur(16px)' }}
      >
        {/* Header */}
        <div
          className="px-3 py-2.5 flex items-center justify-between"
          style={{ background: statusCfg.bg, borderBottom: `1px solid ${statusCfg.border}` }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: statusCfg.color }} />
            <span className="text-xs font-semibold font-mono" style={{ color: statusCfg.color }}>{stallNumber}</span>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </div>

        <div className="px-3 pt-2 pb-2 space-y-1.5">
          {/* Stall info */}
          <Row icon={LayoutGrid}  label="Stall" value={`${stallNumber}  ·  Hall ${hallId}  ·  ${area || 9} sqm`} />
          <Row icon={Tag}         label="Aisle" value={aisle} />
          <Row icon={ArrowUpDown} label="Side"  value={side ? String(side) : null} />
        </div>

        {/* Exhibitor section(s) */}
        {hasExhibitor && (
          <div style={{ borderTop: `1px solid ${border}` }}>
            {companies.length > 1 ? (
              // Multiple companies — each gets its own labeled block
              companies.map((name, i) => (
                <div key={i} style={{ borderTop: i > 0 ? `1px dashed ${border}` : undefined }}>
                  <div
                    className="px-3 pt-1.5 pb-0.5 text-xs font-semibold"
                    style={{ color: 'rgba(148,163,184,0.55)', letterSpacing: '0.04em' }}
                  >
                    COMPANY {i + 1}
                  </div>
                  <div className="px-3 pb-2 space-y-1.5">
                    <CompanyBlock name={name} />
                  </div>
                </div>
              ))
            ) : (
              // Single company
              <div className="px-3 py-2 space-y-1.5">
                <CompanyBlock name={companies[0] || ''} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
