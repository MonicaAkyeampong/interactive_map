'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Layers, ArrowLeft, TrendingUp, MapPin, Activity, Download, Filter, BarChart3, PieChart, Building2 } from 'lucide-react';
import logo from '@/assets/logo.png';
import TopBar from '@/components/TopBar';
import { fetchSummaryData } from '@/lib/api';
import { DEFAULT_YEAR, VALID_REGIONAL_YEARS } from '@/lib/constants';

interface SummaryData {
  total_emissions: number;
  total_sources: number;
  unit: string;
  top_region: string;
  sector_breakdown: { sector: string; total: number }[];
}

const SECTOR_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'
];

export default function InventoryPage() {
  const [selectedYear, setSelectedYear] = useState<number>(DEFAULT_YEAR);
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const summary = await fetchSummaryData(selectedYear);
        setData({
          total_emissions: summary.total_emissions,
          total_sources: summary.total_sources,
          unit: summary.unit,
          top_region: summary.top_region,
          sector_breakdown: summary.sector_breakdown,
        });
      } catch (err) {
        console.error('Failed to load inventory summary', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedYear]);

  const total = data?.total_emissions ?? 0;
  const formattedTotal = total >= 100_000 ? (total / 1_000).toFixed(1) : Math.round(total).toLocaleString();
  const displayUnit = total >= 100_000 ? 'Mt CO₂e' : 'kt CO₂e';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-16">
      {/* Navbar Header */}
      <TopBar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 space-y-8">
        {/* Page Title & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">
              <Layers className="w-4 h-4" />
              <span>National Inventory Report</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Country Emissions Inventories</h1>
            <p className="text-sm text-gray-500 mt-1">
              Comprehensive greenhouse gas inventory data across Ghana's 16 administrative regions and key sectors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-gray-500 uppercase">Year:</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {VALID_REGIONAL_YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Highlight KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total National Emissions</span>
            {loading ? (
              <div className="h-8 w-2/3 bg-gray-100 animate-pulse rounded-lg" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">{formattedTotal}</span>
                <span className="text-sm font-bold text-gray-500">{displayUnit}</span>
              </div>
            )}
            <p className="text-xs text-gray-400">Inventory year {selectedYear}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Emitting Region</span>
            {loading ? (
              <div className="h-8 w-1/2 bg-gray-100 animate-pulse rounded-lg" />
            ) : (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span className="text-2xl font-bold text-gray-800">{data?.top_region || '—'}</span>
              </div>
            )}
            <p className="text-xs text-gray-400">Highest regional emission load</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Data Sources</span>
            {loading ? (
              <div className="h-8 w-1/3 bg-gray-100 animate-pulse rounded-lg" />
            ) : (
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-gray-800">{data?.total_sources?.toLocaleString()}</span>
              </div>
            )}
            <p className="text-xs text-gray-400">Validated regional inventory records</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inventory Status</span>
            <div className="flex items-center gap-2 pt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold text-emerald-700">Official EPA Validated</span>
            </div>
            <p className="text-xs text-gray-400">IPCC Tier 1 & Tier 2 Compliant</p>
          </div>
        </div>

        {/* Sector Breakdown Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Emissions Breakdown by Sector</h2>
              <p className="text-xs text-gray-500">Distribution of greenhouse gas emissions by economic sector for {selectedYear}</p>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
              {data?.sector_breakdown?.length || 0} Sectors Reported
            </span>
          </div>

          {loading ? (
            <div className="space-y-4 py-4">
              <div className="h-6 w-full bg-gray-100 animate-pulse rounded-lg" />
              <div className="h-6 w-5/6 bg-gray-100 animate-pulse rounded-lg" />
              <div className="h-6 w-4/6 bg-gray-100 animate-pulse rounded-lg" />
            </div>
          ) : (
            <div className="space-y-5">
              {data?.sector_breakdown?.map((sec, idx) => {
                const pct = total > 0 ? (sec.total / total) * 100 : 0;
                const formattedVal = sec.total >= 1_000 ? (sec.total / 1_000).toFixed(2) + ' Mt CO₂e' : sec.total.toFixed(0) + ' kt CO₂e';
                return (
                  <div key={sec.sector} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5 font-bold text-gray-800">
                        <span className={`w-3 h-3 rounded-full ${SECTOR_COLORS[idx % SECTOR_COLORS.length]}`} />
                        <span>{sec.sector}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="text-gray-500">{formattedVal}</span>
                        <span className="text-gray-900 font-extrabold w-12 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${SECTOR_COLORS[idx % SECTOR_COLORS.length]}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
