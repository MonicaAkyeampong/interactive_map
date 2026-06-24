'use client';

import React, { useState, useEffect } from 'react';
import EntitySelector, { AnalysisLevel } from '@/components/analytics/EntitySelector';
import HistoricalTrajectoryChart from '@/components/analytics/HistoricalTrajectoryChart';
import SectoralBreakdownChart from '@/components/analytics/SectoralBreakdownChart';
import GasProfileTable from '@/components/analytics/GasProfileTable';
import HeroKPIStrip from '@/components/analytics/HeroKPIStrip';
import RegionalEmissionsCharts from '@/components/analytics/RegionalEmissionsCharts';

// Assuming frontend is running on 3000 and backend on 8000
// Use environment variable if available, else fallback to localhost:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function AnalyticsPage() {
  const [level, setLevel] = useState<AnalysisLevel>('national');
  const [availableEntities, setAvailableEntities] = useState<{id: number, name: string}[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [bottomSectionData, setBottomSectionData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data for the bottom table and charts based on level
  useEffect(() => {
    async function fetchBottomData() {
      try {
        const fetchType = level === 'district' ? 'district' : 'region';
        const res = await fetch(`${API_BASE}/analysis/compare?type=${fetchType}&ids=all`);
        if (res.ok) {
          const data = await res.json();
          setBottomSectionData(data.comparison_data || []);
        }
      } catch (err) {
        console.error('Failed to fetch bottom section data', err);
      }
    }
    fetchBottomData();
  }, [level]);

  // Fetch available entities when level changes
  useEffect(() => {
    async function fetchEntities() {
      if (level === 'national') {
        setAvailableEntities([]);
        setSelectedIds([]);
        return;
      }
      
      try {
        const endpoint = level === 'region' ? '/regions' : '/districts';
        const res = await fetch(`${API_BASE}${endpoint}?limit=500`);
        if (!res.ok) throw new Error('Failed to fetch entities');
        
        const data = await res.json();
        const mapped = data.map((item: any) => ({
          id: level === 'region' ? item.region_id : item.district_id,
          name: level === 'region' ? item.region_name : item.district_name
        }));
        setAvailableEntities(mapped);
        
        // Auto-select up to 4 items if none selected
        if (selectedIds.length === 0) {
          setSelectedIds(mapped.slice(0, 4).map((m: any) => m.id));
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchEntities();
  }, [level]);

  // Fetch comparison data
  useEffect(() => {
    async function fetchComparisonData() {
      if (level !== 'national' && selectedIds.length === 0) {
        setComparisonData([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let url = `${API_BASE}/analysis/compare?type=${level}`;
        
        if (level !== 'national') {
          // Limit to 4 items for comparison
          const idsToFetch = selectedIds.slice(0, 4);
          url += `&ids=${idsToFetch.join(',')}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Failed to fetch comparison data');
        }

        const data = await res.json();
        setComparisonData(data.comparison_data || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred');
        setComparisonData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchComparisonData();
  }, [level, selectedIds]);

  return (
    <div className="absolute inset-0 px-8 py-8 md:pl-[92px] overflow-auto bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        
        <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Emissions Analysis</h1>
            <p className="text-slate-500 mt-2 text-lg">Compare historical trajectories, sectoral drivers, and gas profiles across Ghana.</p>
          </div>
        </header>

        <HeroKPIStrip />

        <EntitySelector 
          level={level}
          setLevel={setLevel}
          availableEntities={availableEntities}
          selectedIds={selectedIds}
          setSelectedIds={(ids) => {
            // Enforce max 4 selections
            if (ids.length <= 4) {
              setSelectedIds(ids);
            }
          }}
        />

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
          </div>
        ) : comparisonData.length > 0 ? (
          <div className="space-y-6 fade-in">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <HistoricalTrajectoryChart data={comparisonData} />
              <SectoralBreakdownChart data={comparisonData} />
            </div>
          </div>
        ) : level !== 'national' && selectedIds.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 text-brand-500 mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Select entities to begin</h3>
            <p className="text-slate-500 max-w-md mx-auto">Use the control panel above to select regions or districts and compare their emissions footprints.</p>
          </div>
        ) : null}

        {/* Decoupled Bottom Data Section */}
        {bottomSectionData.length > 0 && (
          <div className="pt-12 space-y-6">
            <GasProfileTable 
              data={bottomSectionData} 
              maxItems={level === 'district' ? 10 : undefined} 
            />
            {level !== 'district' && (
              <RegionalEmissionsCharts data={bottomSectionData} />
            )}
          </div>
        )}

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .fade-in { animation: fadeIn 0.5s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
