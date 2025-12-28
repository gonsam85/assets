import type { Metadata } from 'next';
import './globals.css';
import BottomNav from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'My Wealth',
  description: 'Neo-Brutalism Asset Management',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/apple-icon.png',
  },
};

import { AssetProvider } from '@/context/AssetContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-neo-white text-neo-black min-h-screen pb-24 relative overflow-x-hidden">
        <AssetProvider>
          {/* Main Content Area */}
          <main className="max-w-md mx-auto min-h-screen relative bg-neo-white">
            {children}
          </main>

          {/* Fixed Navigation */}
          <BottomNav />
        </AssetProvider>
      </body>
    </html>
  );
}
