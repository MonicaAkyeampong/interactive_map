'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { fetchSummaryData } from '@/lib/api';
import { Building2 } from 'lucide-react';

const cache: Record<string, any> = {};

export default function HoverRegionDetails({ regionName }: { regionName: string }) {
  const { year, gas, sector } = useStore();
  
  const cacheKey = `${regionName}-${year}-${gas}-${sector}`;
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
        const y = year && !isNaN(Number(year)) ? Number(year) : undefined;
        const result = await fetchSummaryData(y, gas || undefined, sector || undefined, regionName);
        cache[cacheKey] = result;
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load region summary', err);
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    
    return () => { isMounted = false; };
  }, [regionName, year, gas, sector, cacheKey]);

  if (isLoading) {
    return (
      <div className="p-3 w-56 flex justify-center items-center h-24">
        <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-3 w-56 text-center text-xs text-gray-500">No data</div>;
  }

  const perCapita = data.population && data.total_emissions 
    ? (data.total_emissions / data.population).toFixed(2) 
    : 'N/A';

  return (
    <div className="w-56 bg-white/97 rounded-xl flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <Building2 className="w-3.5 h-3.5 text-brand-600" />
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">{regionName}</h3>
      </div>

      {/* Content */}
      <div className="p-2.5 flex flex-col gap-2">
        
        {/* Overview */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-gray-500 font-medium">Total Em. ({year || 'All Yrs'})</span>
            <span className="font-bold text-gray-800">
              {data.total_emissions.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-[9px] text-gray-400 font-normal">kt</span>
            </span>
          </div>
          {data.population && (
            <>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500 font-medium">Population</span>
                <span className="font-bold text-gray-800">
                  {data.population.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500 font-medium">Per Capita</span>
                <span className="font-bold text-gray-800">
                  {perCapita} <span className="text-[9px] text-gray-400 font-normal">t</span>
                </span>
              </div>
            </>
          )}
        </div>

        <div className="w-full h-px bg-gray-100" />

        {/* Dominant Sources */}
        <div className="space-y-1">
          {(() => {
            const topSector = data.sector_breakdown?.[0];
            const topGas = data.gas_breakdown?.[0];
            
            const topSectorPct = topSector && data.total_emissions ? (topSector.total / data.total_emissions) * 100 : 0;
            const topGasPct = topGas && data.total_emissions ? (topGas.total / data.total_emissions) * 100 : 0;

            return (
              <>
                {topSector && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500 font-medium">Top Sector</span>
                    <span className="font-bold text-gray-800">{topSector.sector} <span className="text-[9px] text-gray-400 font-normal">({topSectorPct.toFixed(1)}%)</span></span>
                  </div>
                )}
                {topGas && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500 font-medium">Top Gas</span>
                    <span className="font-bold text-gray-800">{topGas.gas} <span className="text-[9px] text-gray-400 font-normal">({topGasPct.toFixed(1)}%)</span></span>
                  </div>
                )}
                {!topSector && !topGas && (
                  <div className="text-[10px] text-gray-400">No data</div>
                )}
              </>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
