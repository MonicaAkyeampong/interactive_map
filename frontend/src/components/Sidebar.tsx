'use client';

import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, MapPin, BarChart2, Activity } from 'lucide-react';
import { fetchSummaryData } from '@/lib/api';

interface SummaryData {
  total_emissions: number;
  total_sources: number;
  unit: string;
  top_region: string;
  sector_breakdown: { sector: string; total: number }[];
}

const SECTOR_COLORS = [
  'bg-brand-500', 'bg-blue-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500'
];

const SECTOR_DOTS = [
  'bg-brand-400', 'bg-blue-400', 'bg-amber-400', 'bg-violet-400', 'bg-rose-400'
];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function Sidebar() {
  const { year, gas, sector, forecastMode, activeTimelineIndex } = useStore();
  const intervals = ['24hrs', '48hrs', '72hrs', '1 week', '1 month'];
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const reducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const y = year && !isNaN(Number(year)) ? Number(year) : undefined;
        const summary = await fetchSummaryData(y, gas || undefined, sector || undefined);
        setData({
          total_emissions: summary.total_emissions,
          total_sources: summary.total_sources,
          unit: summary.unit,
          top_region: summary.top_region,
          sector_breakdown: summary.sector_breakdown,
        });
      } catch {
        // leave previous data visible
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [year, gas, sector]);

  const topSectors = data?.sector_breakdown?.slice(0, 4) ?? [];
  const maxSector = topSectors[0]?.total ?? 1;
  const formatted = data
    ? data.total_emissions >= 1_000_000
      ? `${(data.total_emissions / 1_000_000).toFixed(2)}M`
      : data.total_emissions >= 1_000
        ? `${(data.total_emissions / 1_000).toFixed(1)}K`
        : data.total_emissions.toLocaleString(undefined, { maximumFractionDigits: 1 })
    : null;

  return (
    <motion.div
      variants={containerVariants}
      initial={reducedMotion ? false : 'hidden'}
      animate="visible"
      className="absolute left-16 top-1/2 -translate-y-1/2 z-10 w-64 flex flex-col gap-2.5"
    >
      {/* Main stats card */}
      <motion.div
        variants={itemVariants}
        className="bg-white/97 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] border border-gray-100 overflow-hidden"
      >
        {/* Card header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-50">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Emissions</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              forecastMode === 'Future Forecasts'
                ? 'bg-brand-50 text-brand-600'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {forecastMode === 'Future Forecasts' ? 'Forecast' : 'Historical'}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-medium">
            {year ? `Year ${year}` : 'All Years'} · {sector || 'All Sectors'} · {intervals[activeTimelineIndex]}
          </p>
        </div>

        <div className="px-4 py-3">
          {loading ? (
            <div className="space-y-2.5">
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : (
            <>
              <div className="flex items-end gap-1.5 mb-0.5">
                <span className="text-3xl font-bold tracking-tight text-gray-900 leading-none">{formatted ?? '—'}</span>
                <span className="text-sm font-semibold text-gray-400 mb-0.5">{data?.unit ?? 'ktCO2e'}</span>
              </div>
              <p className="text-[10px] text-gray-400 mb-3">{data?.total_sources?.toLocaleString()} data records</p>

              {topSectors.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-gray-50">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">By Sector</span>
                  {topSectors.map((item, idx) => {
                    const pct = data!.total_emissions > 0 ? (item.total / data!.total_emissions) * 100 : 0;
                    const barWidth = (item.total / maxSector) * 100;
                    return (
                      <div key={item.sector}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SECTOR_DOTS[idx]}`} />
                            <span className="text-[10px] text-gray-600 font-medium">{item.sector}</span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-700">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${SECTOR_COLORS[idx]}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Stat mini-cards */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div
          variants={itemVariants}
          whileHover={
            reducedMotion
              ? {}
              : { y: -4, boxShadow: '0 12px 36px rgba(0,0,0,0.12)' }
          }
          transition={{ duration: 0.2 }}
          className="bg-white/97 backdrop-blur-md rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.10)] border border-gray-100 p-3 cursor-default"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Top Region</span>
          </div>
          {loading ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <p className="text-xs font-bold text-gray-800 truncate" title={data?.top_region || 'N/A'}>
              {data?.top_region || '—'}
            </p>
          )}
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={
            reducedMotion
              ? {}
              : { y: -4, boxShadow: '0 12px 36px rgba(0,0,0,0.12)' }
          }
          transition={{ duration: 0.2 }}
          className="bg-white/97 backdrop-blur-md rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.10)] border border-gray-100 p-3 cursor-default"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Activity className="w-3 h-3 text-gray-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Trend</span>
          </div>
          {loading ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <p className="text-xs font-bold text-amber-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Analysing
            </p>
          )}
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={
            reducedMotion
              ? {}
              : { y: -4, boxShadow: '0 12px 36px rgba(0,0,0,0.12)' }
          }
          transition={{ duration: 0.2 }}
          className="bg-white/97 backdrop-blur-md rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.10)] border border-gray-100 p-3 col-span-2 cursor-default"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <BarChart2 className="w-3 h-3 text-gray-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Forecast Variance</span>
          </div>
          {loading ? (
            <Skeleton className="h-4 w-1/2" />
          ) : (
            <p className="text-xs font-bold text-gray-700">± Pending model</p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
