'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, PieChart, Plus, BarChart3, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Portfolio', href: '/portfolio', icon: PieChart },
  { name: 'Add', href: '/add', icon: Plus, isPrimary: true },
  { name: 'Report', href: '/report', icon: BarChart3 },
  { name: 'Loan', href: '/loan', icon: Landmark },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 bg-neo-white border-t-4 border-neo-black">
      <div className="flex justify-between items-center max-w-md mx-auto relative px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isPrimary = item.isPrimary;

          if (isPrimary) {
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.9, y: 2 }}
                  className="flex flex-col items-center justify-center -mt-8"
                >
                  <div className="w-16 h-16 bg-neo-green rounded-full border-4 border-neo-black shadow-neo flex items-center justify-center text-neo-black">
                    <Plus size={32} strokeWidth={3} />
                  </div>
                </motion.div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={clsx(
                  "flex flex-col items-center transition-colors duration-200",
                  isActive ? "text-neo-blue" : "text-gray-400"
                )}
              >
                <item.icon
                  size={28}
                  strokeWidth={isActive ? 3 : 2}
                  className={clsx(
                    isActive ? "drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] text-neo-blue" : "text-gray-500"
                  )}
                />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
