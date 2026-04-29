'use client';

import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';

interface SummaryData {
  total_emissions: number;
  total_sources: number;
  unit: string;
}

export default function Sidebar() {
  const { year, gas, sector } = useStore();
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

  return (
    <div className="absolute top-24 left-4 z-10 w-80 bg-white rounded-lg shadow-lg p-6">
      <div className="mb-2">
        <h2 className="text-sm font-medium text-gray-500">{scopeText}</h2>
        <p className="text-xs text-gray-400 mt-1">(Mar 2025 - Aug 2025)</p>
      </div>

      {loading ? (
        <div className="animate-pulse py-4">
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : (
        <div className="py-4">
          <h1 className="text-5xl font-bold tracking-tighter mb-1">
            {data?.total_emissions.toFixed(1)}M
          </h1>
          <p className="text-xl text-gray-700 font-medium mb-1">{data?.unit}</p>
          <p className="text-sm text-gray-500 mb-6">{data?.total_sources} Sources</p>
          
          <div className="space-y-3">
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className="bg-green-500 w-3/4 h-full"></div>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className="bg-green-400 w-1/2 h-full"></div>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className="bg-green-300 w-1/3 h-full"></div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <div className="flex-1 h-8 bg-gray-100 rounded-md"></div>
            <div className="flex-1 h-8 bg-gray-100 rounded-md"></div>
            <div className="flex-1 h-8 bg-gray-100 rounded-md"></div>
          </div>
        </div>
      )}
    </div>
  );
}
