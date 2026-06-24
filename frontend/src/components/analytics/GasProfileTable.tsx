'use client';

import React, { useMemo } from 'react';

interface EntityData {
  id: number;
  name: string;
  demographics: {
    pop2021: number;
    per_capita_2022: number | null;
  };
  gases_2022: Record<string, number>;
}

interface Props {
  data: EntityData[];
  maxItems?: number;
}

export default function GasProfileTable({ data, maxItems }: Props) {
  if (!data || data.length === 0) return null;

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aTotal = Object.values(a.gases_2022 || {}).reduce((sum, val) => sum + val, 0);
      const bTotal = Object.values(b.gases_2022 || {}).reduce((sum, val) => sum + val, 0);
      return bTotal - aTotal;
    });
    return maxItems ? sorted.slice(0, maxItems) : sorted;
  }, [data, maxItems]);

  // Gas keys we want to show
  const TARGET_GASES = ['CO2', 'CH4', 'N2O', 'HFC'];
  
  // Colors for percentage bars
  const GAS_COLORS: Record<string, string> = {
    'CO2': 'bg-blue-500',
    'CH4': 'bg-amber-500',
    'N2O': 'bg-red-500',
    'HFC': 'bg-purple-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800">Demographics & Gas Profiles</h2>
        <p className="text-sm text-slate-500 mt-1">Breakdown of primary greenhouse gases relative to total 2022 emissions.</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-200">
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Region / District</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Population</th>
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Per Capita (tCO₂e)</th>
              {TARGET_GASES.map(gas => (
                <th key={gas} className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {gas === 'CO2' ? 'CO₂' : gas === 'CH4' ? 'CH₄' : gas === 'N2O' ? 'N₂O' : gas}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.map((entity) => {
              const totalGas = Object.values(entity.gases_2022 || {}).reduce((sum, val) => sum + val, 0);
              const popLabel = entity.demographics?.pop2021 
                ? (entity.demographics.pop2021 / 1000000).toFixed(2) + 'M'
                : 'N/A';
              const perCapitaLabel = entity.demographics?.per_capita_2022 !== null && entity.demographics?.per_capita_2022 !== undefined
                ? entity.demographics.per_capita_2022.toFixed(2)
                : 'N/A';

              return (
                <tr key={entity.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-800 whitespace-nowrap">
                    {entity.name}
                  </td>
                  <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                    {popLabel}
                  </td>
                  <td className="py-4 px-6 text-slate-600 font-medium whitespace-nowrap">
                    {perCapitaLabel}
                  </td>
                  {TARGET_GASES.map(gas => {
                    // Find matching gas value (keys might have variations like 'CO2 (carbon dioxide)')
                    let gasValue = 0;
                    if (entity.gases_2022) {
                      for (const [key, val] of Object.entries(entity.gases_2022)) {
                        if (key.includes(gas)) {
                          gasValue += val;
                        }
                      }
                    }

                    const pct = totalGas > 0 ? (gasValue / totalGas) * 100 : 0;
                    const colorClass = GAS_COLORS[gas] || 'bg-slate-400';

                    return (
                      <td key={gas} className="py-4 px-6 min-w-[140px]">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-700 w-12">{pct.toFixed(1)}%</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${colorClass}`} 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
