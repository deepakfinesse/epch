'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BLOCK_GROUPS } from '@/lib/hall-config';
import { useUIStore } from '@/store/ui-store';
import {
  LayoutDashboard, Map, BarChart3,
  ChevronRight, ChevronDown, ChevronLeft, Building2,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/halls',     icon: Map,             label: 'Hall Maps' },
  // { href: '/analytics', icon: BarChart3,       label: 'Analytics' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [openBlock, setOpenBlock] = useState(null);

  return (
    <>
      {/* Mobile overlay — only shown when sidebar is open on small screens */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-30 flex flex-col transition-all duration-300 overflow-hidden',
          sidebarOpen ? 'w-60' : 'w-0 lg:w-16',
        )}
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo row */}
        <div
          className="flex items-center h-16 shrink-0 overflow-hidden"
          style={{
            borderBottom: '1px solid var(--border)',
            padding: sidebarOpen ? '0 16px' : '0 12px',
            gap: sidebarOpen ? 12 : 0,
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
          >
            <Building2 size={16} color="#fff" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>EPCH</p>
              {/* <p className="mono leading-tight" style={{ color: 'var(--text-muted)', fontSize: 10 }}>Delhi Fair 2026</p> */}
            </div>
          )}
        </div>

        {/* Main nav */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          <div className={cn('space-y-0.5', sidebarOpen ? 'px-2' : 'px-2')}>
            {NAV.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  title={!sidebarOpen ? label : undefined}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-all group',
                    sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5',
                  )}
                  style={{
                    background: active
                      ? 'rgba(37,99,235,0.1)'
                      : 'transparent',
                    color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    borderLeft: sidebarOpen
                      ? active ? '2px solid var(--accent-blue)' : '2px solid transparent'
                      : 'none',
                    borderRadius: sidebarOpen ? undefined : 8,
                  }}
                >
                  <Icon size={17} className="shrink-0" />
                  {sidebarOpen && <span className="truncate">{label}</span>}
                </Link>
              );
            })}
          </div>

          {/* Hall blocks accordion — only when expanded */}
          {sidebarOpen && (
            <div className="mt-5 px-2">
              {/* <p
                className="px-3 mb-2 text-xs uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}
              >
                Halls by Block
              </p> */}
              {/* {BLOCK_GROUPS.map((group) => (
                <div key={group.block} className="mb-0.5">
                  <button
                    onClick={() => setOpenBlock(openBlock === group.block ? null : group.block)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      color: 'var(--text-secondary)',
                      background: openBlock === group.block ? 'rgba(0,0,0,0.04)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: group.color }} />
                      <span>{group.label.split('–')[0].trim()}</span>
                    </div>
                    {openBlock === group.block
                      ? <ChevronDown size={13} />
                      : <ChevronRight size={13} />}
                  </button>
                  {openBlock === group.block && (
                    <div className="ml-4 mt-0.5 space-y-0.5 pb-1">
                      {group.halls.map((hid) => {
                        const isActive = pathname === `/halls/${hid}`;
                        return (
                          <Link
                            key={hid}
                            href={`/halls/${hid}`}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors"
                            style={{
                              color: isActive ? group.color : 'var(--text-muted)',
                              background: isActive ? `${group.color}12` : 'transparent',
                              fontWeight: isActive ? 600 : 400,
                            }}
                          >
                            Hall {hid}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))} */}
            </div>
          )}

          {/* Collapsed: block color dots as quick-links */}
          {/* {!sidebarOpen && (
            <div className="mt-4 px-2 flex flex-col items-center gap-2">
              {BLOCK_GROUPS.map((group) => (
                <Link
                  key={group.block}
                  href={`/halls/${group.halls[0]}`}
                  title={`Block ${group.block}`}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-colors hover:opacity-80"
                  style={{
                    background: `${group.color}18`,
                    border: `1px solid ${group.color}35`,
                    color: group.color,
                  }}
                >
                  {group.block}
                </Link>
              ))}
            </div>
          )} */}
        </nav>

        {/* Footer: date info + collapse toggle button */}
        <div
          className="shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {sidebarOpen && (
            <div className="px-4 pt-3 pb-1">
              {/* <p className="text-xs" style={{ color: 'var(--text-muted)' }}>61st IHGF Delhi Fair</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Feb 14–18, 2026</p> */}
            </div>
          )}

          {/* Collapse / expand button */}
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-2 w-full transition-colors"
            style={{
              padding: sidebarOpen ? '10px 16px' : '12px 0',
              justifyContent: sidebarOpen ? 'flex-end' : 'center',
              color: 'var(--text-muted)',
            }}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <div
              className="flex items-center justify-center w-6 h-6 rounded-md transition-colors hover:bg-black/5"
              style={{ border: '1px solid var(--border)' }}
            >
              <ChevronLeft
                size={13}
                style={{
                  transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.3s ease',
                  color: 'var(--text-secondary)',
                }}
              />
            </div>
            {sidebarOpen && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Collapse</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
