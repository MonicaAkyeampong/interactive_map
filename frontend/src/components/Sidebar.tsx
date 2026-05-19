'use client';

import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface SummaryData {
  total_emissions: number;
  total_sources: number;
  unit: string;
}

export default function Sidebar() {
  const { year, gas, sector, forecastMode, activeTimelineIndex } = useStore();
  const intervals = ["24hrs", "48hrs", "72hrs", "1 week", "1 month"];
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would fetch from the backend API here
    // For now, simulating API call with dummy data
    setLoading(true);
    setTimeout(() => {
      setData({
        total_emissions: Math.random() * 100 + 10, // dummy logic
        total_sources: Math.floor(Math.random() * 5000),
        unit: 'CO2e'
      });
      setLoading(false);
    }, 500);
  }, [year, gas, sector]);

  const scopeText = `${year || 'All Years'}: ${sector || 'All Sectors'}`;
  const forecastText = `${forecastMode || 'Future Forecasts'} (${intervals[activeTimelineIndex]})`;

  return (
    <div className="absolute top-20 left-4 z-10 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-4">
      <div className="mb-1">
        <h2 className="text-xs font-medium text-gray-500">{scopeText}</h2>
        <p className="text-[10px] text-green-600 font-semibold mt-0.5">{forecastText}</p>
      </div>

      {loading ? (
        <div className="animate-pulse py-2">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : (
        <div className="py-1">
          <h1 className="text-3xl font-bold tracking-tighter mb-0.5">
            {data?.total_emissions.toFixed(1)}M
          </h1>
          <p className="text-lg text-gray-700 font-medium mb-0.5">{data?.unit}</p>
          <p className="text-xs text-gray-500 mb-3">{data?.total_sources} Sources</p>
          
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                <span>Energy Sector</span>
                <span className="font-semibold">60%</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 w-3/5 h-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                <span>Agriculture</span>
                <span className="font-semibold">25%</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-400 w-1/4 h-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                <span>Transport</span>
                <span className="font-semibold">15%</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-300 w-[15%] h-full"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
              <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Top Region</p>
              <p className="text-xs text-gray-800 font-bold truncate">Ashanti</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
              <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Growth</p>
              <p className="text-xs text-red-600 font-bold flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +2.4%
              </p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 col-span-2">
              <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Avg. Forecast Variance</p>
              <p className="text-xs text-gray-800 font-bold">± 1.2M CO2e</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
