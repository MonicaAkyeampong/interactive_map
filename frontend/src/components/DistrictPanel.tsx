'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { fetchDistrictSummaryData } from '@/lib/api';
import { isDistrictBreakdownAvailable, DEFAULT_YEAR } from '@/lib/constants';
import { Info } from 'lucide-react';

const cache: Record<string, any> = {};

const GAS_LABELS: Record<string, string> = {
  CO2: 'CO₂',
  CH4: 'CH₄',
  N2O: 'N₂O',
  HFC: 'HFCs',
};

export default function DistrictPanel({ districtName, mapColor }: { districtName: string; mapColor: string }) {
  const { year, gas, sector } = useStore();
  const breakdownAvailable = isDistrictBreakdownAvailable(year);
  
  const cacheKey = `district-${districtName}-${year}-${gas}-${sector}`;
  const [data, setData] = useState<any>(cache[cacheKey] || null);
  const [isLoading, setIsLoading] = useState(!cache[cacheKey]);

  useEffect(() => {
    if (cache[cacheKey]) {
      setData(cache[cacheKey]);
      setIsLoading(false);
      return;
    }
    
    let isMounted = true;
    setIsLoading(true);
    
    async function loadData() {
      try {
        const y = year && !isNaN(Number(year)) ? Number(year) : DEFAULT_YEAR;
        const result = await fetchDistrictSummaryData(y, gas || undefined, sector || undefined, districtName);
        cache[cacheKey] = result;
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load district summary', err);
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    
    return () => { isMounted = false; };
  }, [districtName, year, gas, sector, cacheKey]);

  if (isLoading) {
    return (
      <div className="p-4 w-64 flex justify-center items-center h-28 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-100">
        <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-3 w-64 text-center text-xs text-gray-500 bg-white/95 rounded-xl">No data available</div>;
  }

  const perCapita = data.population && data.total_emissions 
    ? ((data.total_emissions * 1000) / data.population).toFixed(2) 
    : 'N/A';

  const totalGasSum = data.gas_breakdown
    ? data.gas_breakdown.reduce((sum: number, g: any) => sum + (g.total || 0), 0)
    : 0;

  const topSector = data.sector_breakdown?.[0];
  const topGas = data.gas_breakdown?.[0];

  const topSectorPct = topSector && data.total_emissions ? (topSector.total / data.total_emissions) * 100 : 0;
  const topGasPct = topGas && totalGasSum ? (topGas.total / totalGasSum) * 100 : 0;

  return (
    <div className="w-64 bg-white/98 backdrop-blur-md rounded-xl flex flex-col shadow-xl border border-gray-100/80 text-gray-800 text-xs">
      {/* Header */}
      <div className="flex items-center pl-3 pr-8 py-2 border-b border-gray-100 bg-gray-50/70 rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: mapColor }} title="District emission scale" />
          <h3 className="font-bold text-gray-800 truncate text-xs" title={districtName}>{districtName}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2.5 max-h-[360px] overflow-y-auto">
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2 bg-gray-50/60 p-2 rounded-lg border border-gray-100">
          <div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Total ({year || DEFAULT_YEAR})</div>
            <div className="font-extrabold text-gray-900 text-sm">
              {data.total_emissions.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              <span className="text-[9px] text-gray-400 font-normal ml-0.5">kt</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Per Capita</div>
            <div className="font-extrabold text-gray-900 text-sm">
              {perCapita}
              <span className="text-[9px] text-gray-400 font-normal ml-0.5">t</span>
            </div>
          </div>
        </div>

        {/* Breakdown Section */}
        {breakdownAvailable ? (
          <div className="flex flex-col gap-2.5">
            
            {/* Dominant Cards */}
            {(topSector || topGas) && (
              <div className="grid grid-cols-2 gap-1.5">
                {topSector && (
                  <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 flex flex-col">
                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Top Sector</div>
                    <div className="font-extrabold text-[11px] text-gray-900 truncate" title={topSector.sector}>{topSector.sector}</div>
                    <div className="text-[9px] text-gray-700 font-medium">{topSectorPct.toFixed(1)}% ({topSector.total.toFixed(0)} kt)</div>
                  </div>
                )}
                {topGas && (
                  <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 flex flex-col">
                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Top Gas</div>
                    <div className="font-extrabold text-[11px] text-gray-900 truncate" title={topGas.gas}>{topGas.gas}</div>
                    <div className="text-[9px] text-gray-700 font-medium">{topGasPct.toFixed(1)}% ({topGas.total.toFixed(0)} kt)</div>
                  </div>
                )}
              </div>
            )}

            {/* Sector Breakdown Bars */}
            {data.sector_breakdown && data.sector_breakdown.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex justify-between">
                  <span>Sector Breakdown</span>
                  <span>Contribution</span>
                </div>
                <div className="space-y-1">
                  {data.sector_breakdown.map((s: any) => {
                    const pct = data.total_emissions ? (s.total / data.total_emissions) * 100 : 0;
                    return (
                      <div key={s.sector} className="space-y-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="font-medium text-gray-700 truncate max-w-[120px]">{s.sector}</span>
                          <span className="font-semibold text-gray-800">{pct.toFixed(1)}% <span className="text-[9px] text-gray-400 font-normal">({s.total.toFixed(0)} kt)</span></span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-sky-500 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(pct, 100)}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gas Breakdown Bars */}
            {data.gas_breakdown && data.gas_breakdown.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-gray-100">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex justify-between">
                  <span>Gas Breakdown</span>
                  <span>Contribution</span>
                </div>
                <div className="space-y-1">
                  {data.gas_breakdown.map((g: any) => {
                    const pct = totalGasSum ? (g.total / totalGasSum) * 100 : 0;
                    const label = GAS_LABELS[g.gas] || g.gas;
                    return (
                      <div key={g.gas} className="space-y-0.5">
                        <div className="flex justify-between text-[10px] items-center">
                          <span className="font-semibold text-gray-700">{label}</span>
                          <span className="font-semibold text-gray-800">{pct.toFixed(1)}% <span className="text-[9px] text-gray-400 font-normal">({g.total.toFixed(0)} kt)</span></span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-500 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(pct, 100)}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-[10px] text-gray-500 font-medium leading-tight">
              Sector and gas breakdowns are recorded for 2022.
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
