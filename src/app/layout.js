import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'EPCH | Exhibition Dashboard',
  description: 'Hall layout, stall status, and exhibitor management for 61st IHGF Delhi Fair Spring 2026 at India Expo Center & Mart, Greater Noida.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
