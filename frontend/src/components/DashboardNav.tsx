'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Map, BarChart3, TrendingUp, FileText, Settings, Home } from 'lucide-react';

const VIEW_ITEMS: { icon: React.ElementType; label: string; href: string }[] = [
  { icon: Map,        label: 'Emissions Map', href: '/dashboard' },
  { icon: TrendingUp, label: 'Forecasts',     href: '/dashboard/forecasts' },
  { icon: BarChart3,  label: 'Analytics',     href: '/dashboard/analytics' },
  { icon: FileText,   label: 'Reports',       href: '/dashboard/reports' },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 p-2">
      {/* Home — returns to landing page */}
      <motion.div
        whileHover={reducedMotion ? {} : { scale: 1.1 }}
        whileTap={reducedMotion ? {} : { scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <Link
          href="/"
          title="Home"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-150"
        >
          <Home className="w-4 h-4" />
        </Link>
      </motion.div>

      <div className="w-5 h-px bg-gray-100" />

      {/* View links */}
      {VIEW_ITEMS.map(({ icon: Icon, label, href }) => {
        const active = pathname === href;
        return (
          <motion.div
            key={href}
            whileHover={reducedMotion ? {} : { scale: 1.1 }}
            whileTap={reducedMotion ? {} : { scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Link
              href={href}
              title={label}
              className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors duration-150 ${
                active
                  ? 'text-[#00C853] bg-emerald-50/70'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
            >
              {/* Sliding left-border indicator via layoutId */}
              {active && (
                <motion.span
                  layoutId="activeNavIndicator"
                  className="absolute left-0.5 top-2 bottom-2 w-[3px] bg-[#00C853] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="w-4 h-4" />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
