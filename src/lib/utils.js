import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN').format(n);
}

export function pct(num, den) {
  if (!den) return 0;
  return Math.round((num / den) * 100);
}

export function timeAgo(date) {
  if (!date) return '—';
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function statusLabel(status) {
  const map = { available: 'Available', allotted: 'Allotted', reserved: 'Reserved', blocked: 'Blocked' };
  return map[status] || status;
}

export function statusColor(status) {
  const map = {
    available: '#00d4aa',
    allotted:  '#ff6b35',
    reserved:  '#f59e0b',
    blocked:   '#475569',
  };
  return map[status] || '#475569';
}

export function blockColor(block) {
  const map = { E: '#3b82f6', F: '#8b5cf6', G: '#06b6d4', H: '#f59e0b', J: '#ec4899' };
  return map[block] || '#64748b';
}
