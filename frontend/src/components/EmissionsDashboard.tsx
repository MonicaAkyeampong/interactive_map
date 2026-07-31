'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { fetchEmissions, fetchRegions, fetchGases, fetchSummaryData, Emission, Region, Gas } from '@/lib/api';
import { VALID_REGIONAL_YEARS, DEFAULT_YEAR } from '@/lib/constants';
import { Database, MapPin, Layers, TrendingUp } from 'lucide-react';

interface SummaryData {
  total_emissions: number;
  total_sources: number;
  unit: string;
  top_region: string;
  sector_breakdown: { sector: string; total: number }[];
}

const SECTOR_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function formatEmissions(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function KpiSpotlight({ value, unit }: { value: number; unit: string }) {
  const reducedMotion = useReducedMotion();
  const motionVal = useMotionValue(reducedMotion ? value : 0);
  const [display, setDisplay] = useState(() => formatEmissions(reducedMotion ? value : 0));

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(formatEmissions(value));
      return;
    }
    const controls = animate(motionVal, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(formatEmissions(v)),
    });
    return controls.stop;
  }, [value, reducedMotion, motionVal]);

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-2">
        Total Emissions
      </p>
      <div className="flex items-end gap-3">
        <span className="text-[52px] font-semibold leading-none tracking-tighter text-gray-900">
          {display}
        </span>
        <span className="text-lg font-medium text-gray-400 mb-1.5">{unit}</span>
      </div>
      <p className="text-sm text-gray-400 mt-2 font-light">
        Aggregated across all sectors and regions
      </p>
    </div>
  );
}

export default function EmissionsDashboard() {
  const [emissions, setEmissions] = useState<Emission[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [gases, setGases] = useState<Gas[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  const [selectedRegion, setSelectedRegion] = useState<number | ''>('');
  const [selectedGas, setSelectedGas] = useState<number | ''>('');
  const [selectedYear, setSelectedYear] = useState<number | ''>(DEFAULT_YEAR);
  const [loading, setLoading] = useState(true);

  const reducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    async function loadLookups() {
      try {
        const [regionsData, gasesData] = await Promise.all([fetchRegions(), fetchGases()]);
        setRegions(regionsData);
        setGases(gasesData);
      } catch (err) {
        console.error('Error loading lookups', err);
      }
    }
    loadLookups();
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const year = selectedYear !== '' ? selectedYear : undefined;
        const [data, summaryData] = await Promise.all([
          fetchEmissions(
            selectedRegion !== '' ? selectedRegion : undefined,
            selectedGas !== '' ? selectedGas : undefined,
            year
          ),
          fetchSummaryData(year, undefined, undefined),
        ]);
        setEmissions(data);
        setSummary(summaryData);
      } catch (err) {
        console.error('Error fetching data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedRegion, selectedGas, selectedYear]);

  const years = [...VALID_REGIONAL_YEARS];
  const topSectors = summary?.sector_breakdown?.slice(0, 5) ?? [];
  const maxSector = topSectors[0]?.total ?? 1;
  const topSectorName = topSectors[0]?.sector ?? null;

  const statsCards = [
    {
      label: 'Total Emissions',
      value: summary ? formatEmissions(summary.total_emissions) : '—',
      sub: summary?.unit ?? 'ktCO2e',
      icon: TrendingUp,
      primary: true,
    },
    {
      label: 'Data Records',
      value: summary ? summary.total_sources.toLocaleString() : '—',
      sub: 'observations',
      icon: Database,
      primary: false,
    },
    {
      label: 'Top Region',
      value: summary?.top_region ?? '—',
      sub: 'highest emissions',
      icon: MapPin,
      primary: false,
    },
    {
      label: 'Sectors',
      value: topSectors.length > 0 ? topSectors.length.toString() : '—',
      sub: 'emission sources',
      icon: Layers,
      primary: false,
    },
  ];

  return (
    <div
      className="p-6 pb-12 max-w-7xl mx-auto min-h-screen"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% 0%, #ecfdf5 0%, #F8FAFC 55%)',
      }}
    >
      {/* ── KPI Hero ── */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 flex flex-col md:flex-row gap-8 items-start justify-between"
      >
        <div className="flex-1">
          {loading || !summary ? (
            <div className="space-y-3">
              <div className="animate-pulse h-3 w-28 bg-gray-100 rounded-full" />
              <div className="animate-pulse h-14 w-52 bg-gray-100 rounded-xl" />
              <div className="animate-pulse h-4 w-48 bg-gray-100 rounded-full" />
            </div>
          ) : (
            <KpiSpotlight value={summary.total_emissions} unit={summary.unit} />
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 items-end shrink-0">
          <select
            className="px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 min-w-[100px] cursor-pointer"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r.region_id} value={r.region_id}>{r.region_name}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 min-w-[110px] cursor-pointer"
            value={selectedGas}
            onChange={(e) => setSelectedGas(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">All Gases</option>
            {gases.map((g) => (
              <option key={g.gas_id} value={g.gas_id}>{g.formula || g.gas_name}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 min-w-[100px] cursor-pointer"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statsCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              custom={i}
              variants={cardVariants}
              initial={reducedMotion ? false : 'hidden'}
              animate="visible"
              whileHover={
                reducedMotion
                  ? {}
                  : { y: -4, boxShadow: '0 20px 48px rgba(0,0,0,0.10)' }
              }
              transition={{ duration: 0.2 }}
              className={`bg-white rounded-2xl p-5 border cursor-default ${
                card.primary
                  ? 'col-span-2 border-emerald-200 shadow-sm ring-1 ring-emerald-100/80'
                  : 'border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                    card.primary ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {card.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    card.primary ? 'bg-emerald-50' : 'bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      card.primary ? 'text-emerald-500' : 'text-gray-400'
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-end gap-1.5">
                {loading ? (
                  <div
                    className={`animate-pulse bg-gray-100 rounded-lg ${
                      card.primary ? 'h-10 w-32' : 'h-6 w-20'
                    }`}
                  />
                ) : (
                  <span
                    className={`font-bold tracking-tight leading-none ${
                      card.primary ? 'text-4xl text-gray-900' : 'text-xl text-gray-800'
                    }`}
                  >
                    {card.value}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-[0.08em]">
                {card.sub}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Sector Chart ── */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        whileInView={reducedMotion ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 mb-8"
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
            Emissions by Sector
          </h2>
          {!loading && topSectorName && (
            <p className="text-sm text-gray-400 mt-1">
              <span className="text-gray-600 font-medium">{topSectorName}</span> is
              the dominant emission source.
            </p>
          )}
        </div>

        {loading || topSectors.length === 0 ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div
                  className="animate-pulse h-3 w-24 bg-gray-100 rounded-full"
                  style={{ opacity: 1 - i * 0.15 }}
                />
                <div
                  className="animate-pulse h-2 bg-gray-100 rounded-full"
                  style={{ width: `${80 - i * 14}%`, opacity: 1 - i * 0.15 }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {topSectors.map((item, idx) => {
              const barWidth = (item.total / maxSector) * 100;
              const pct =
                summary && summary.total_emissions > 0
                  ? ((item.total / summary.total_emissions) * 100).toFixed(1)
                  : '0';
              return (
                <div key={item.sector}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-600">{item.sector}</span>
                    <span className="text-xs font-bold text-gray-700 tabular-nums">{pct}%</span>
                  </div>
                  <div className="relative h-2 bg-gray-50 rounded-full overflow-hidden">
                    <motion.div
                      initial={reducedMotion ? false : { width: 0 }}
                      whileInView={{ width: `${barWidth}%` }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.9,
                        delay: idx * 0.07,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ backgroundColor: SECTOR_COLORS[idx % SECTOR_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Emissions Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Emissions Records</h2>
          {!loading && (
            <p className="text-xs text-gray-400 mt-0.5">
              {emissions.length.toLocaleString()} records matching current filters
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50">
              <thead>
                <tr className="bg-gray-50/70">
                  {['Region', 'Sector', 'Gas', 'Year', 'Value (tCO2e)'].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-[0.08em] ${
                        h === 'Value (tCO2e)' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {emissions.length > 0 ? (
                  emissions.map((emission) => (
                    <tr
                      key={emission.emission_id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-6 py-3.5 text-sm font-medium text-gray-800 whitespace-nowrap">
                        {emission.region?.region_name || 'N/A'}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                        {emission.sector?.sector_name || 'N/A'}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                        {emission.gas?.formula || emission.gas?.gas_name || 'N/A'}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                        {emission.year}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-right font-mono text-gray-800 whitespace-nowrap">
                        {Number(emission.emission_value).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                      No emissions data found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
