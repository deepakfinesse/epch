'use client';
import { useUIStore } from '@/store/ui-store';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children, title }) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />

      {/*
        Content margin:
          - Mobile (< lg): no margin — sidebar overlays
          - Desktop collapsed: 64px (w-16 icon rail)
          - Desktop expanded: 240px (w-60 full sidebar)
        Tailwind handles the responsive base; JS handles open vs collapsed.
      */}
      <div
        className={[
          'flex-1 flex flex-col min-w-0 transition-all duration-300',
          sidebarOpen ? 'lg:ml-60' : 'lg:ml-16',
        ].join(' ')}
      >
        <Header title={title} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
