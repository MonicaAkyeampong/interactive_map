'use client';

import React, { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface KPIData {
  highest_region: { name: string; value: number };
  highest_district: { name: string; value: number };
  primary_gas: { name: string; value: number };
}

export default function HeroKPIStrip() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchKPIs() {
      try {
        const res = await fetch(`${API_BASE}/analysis/kpi`);
        if (!res.ok) throw new Error('Failed to fetch KPIs');
        const data = await res.json();
        setKpiData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchKPIs();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-slate-200/50 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  if (!kpiData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div className="bg-brand-600 rounded-2xl p-6 shadow-lg text-white transform transition-transform hover:scale-[1.02]">
        <div className="text-brand-100 text-sm font-semibold tracking-wider uppercase mb-2">Highest Emitting Region</div>
        <div className="text-3xl font-extrabold mb-1">{kpiData.highest_region.name}</div>
        <div className="text-brand-200 text-sm">{kpiData.highest_region.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ktCO₂e in 2022</div>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-lg text-white transform transition-transform hover:scale-[1.02]">
        <div className="text-slate-400 text-sm font-semibold tracking-wider uppercase mb-2">Highest Emitting District</div>
        <div className="text-3xl font-extrabold mb-1">{kpiData.highest_district.name}</div>
        <div className="text-slate-300 text-sm">{kpiData.highest_district.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ktCO₂e in 2022</div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg transform transition-transform hover:scale-[1.02]">
        <div className="text-slate-500 text-sm font-semibold tracking-wider uppercase mb-2">Primary Gas (2022)</div>
        <div className="text-3xl font-extrabold text-slate-800 mb-1">{kpiData.primary_gas.name}</div>
        <div className="text-slate-500 text-sm">{kpiData.primary_gas.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ktCO₂e total footprint</div>
      </div>
    </div>
  );
}
