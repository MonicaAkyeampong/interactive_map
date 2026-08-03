'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Map, BarChart3, TrendingUp, FileText, Home } from 'lucide-react';

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
    <div className="absolute right-3 top-3 md:top-1/2 md:-translate-y-1/2 z-20 flex flex-row md:flex-col items-center gap-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 p-1.5 md:p-2">
      {/* Home — returns to landing page */}
      <motion.div
        whileHover={reducedMotion ? {} : { scale: 1.08 }}
        whileTap={reducedMotion ? {} : { scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <Link
          href="/"
          title="Home"
          className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-150"
        >
          <Home className="w-4 h-4" />
        </Link>
      </motion.div>

      <div className="w-px h-4 md:w-5 md:h-px bg-gray-200 my-0.5" />

      {/* View links */}
      {VIEW_ITEMS.map(({ icon: Icon, label, href }) => {
        const active = pathname === href;
        return (
          <motion.div
            key={href}
            whileHover={reducedMotion ? {} : { scale: 1.08 }}
            whileTap={reducedMotion ? {} : { scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Link
              href={href}
              title={label}
              className={`relative w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl transition-colors duration-150 ${
                active
                  ? 'text-[#00C853] bg-emerald-50/70'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
            >
              {/* Active indicator */}
              {active && (
                <motion.span
                  layoutId="activeNavIndicator"
                  className="absolute bottom-0.5 left-2 right-2 h-[2.5px] md:bottom-auto md:left-auto md:right-0.5 md:top-2 md:bottom-2 md:w-[3px] md:h-auto bg-[#00C853] rounded-full"
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
