'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, ArrowRightLeft, Building2, BarChart2, Layers } from 'lucide-react';
import TopBar from '@/components/TopBar';

const REGIONS = ['Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra', 'Northern', 'North East', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'];

export default function ComparePage() {
  const [regionA, setRegionA] = useState<string>('Greater Accra');
  const [regionB, setRegionB] = useState<string>('Ashanti');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-16">
      {/* Top Bar Navigation */}
      <TopBar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 space-y-8">
        {/* Header Title */}
        <div className="border-b border-gray-200 pb-6 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-widest">
            <Scale className="w-4 h-4" />
            <span>Geospatial Analytics</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Regional & Sector Comparison Tool</h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            Side-by-side benchmarking of GHG emissions profiles across Ghana's administrative regions and sub-sectors.
          </p>
        </div>

        {/* Region Selector Bar */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="w-full md:w-5/12 space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Region A</label>
            <select
              value={regionA}
              onChange={e => setRegionA(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {REGIONS.map(r => (
                <option key={r} value={r}>{r} Region</option>
              ))}
            </select>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <ArrowRightLeft className="w-5 h-5" />
          </div>

          <div className="w-full md:w-5/12 space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Region B</label>
            <select
              value={regionB}
              onChange={e => setRegionB(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {REGIONS.map(r => (
                <option key={r} value={r}>{r} Region</option>
              ))}
            </select>
          </div>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase">Region A</span>
                <h3 className="text-2xl font-black text-gray-900">{regionA}</h3>
              </div>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">Primary</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-baseline py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-500 font-medium">Total Emissions</span>
                <span className="text-lg font-black text-gray-900">7,463 kt CO₂e</span>
              </div>
              <div className="flex justify-between items-baseline py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-500 font-medium">Dominant Gas</span>
                <span className="text-sm font-bold text-red-600">CO₂ (72.4%)</span>
              </div>
              <div className="flex justify-between items-baseline py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-500 font-medium">Primary Sector</span>
                <span className="text-sm font-bold text-amber-600">Energy & Power</span>
              </div>
            </div>
          </div>

          {/* Card B */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">Region B</span>
                <h3 className="text-2xl font-black text-gray-900">{regionB}</h3>
              </div>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">Comparison</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-baseline py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-500 font-medium">Total Emissions</span>
                <span className="text-lg font-black text-gray-900">5,820 kt CO₂e</span>
              </div>
              <div className="flex justify-between items-baseline py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-500 font-medium">Dominant Gas</span>
                <span className="text-sm font-bold text-orange-600">CH₄ (48.1%)</span>
              </div>
              <div className="flex justify-between items-baseline py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-500 font-medium">Primary Sector</span>
                <span className="text-sm font-bold text-green-600">Agriculture</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
