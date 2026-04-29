'use client';

import { useStore } from '@/store/useStore';
import { Search, ChevronDown } from 'lucide-react';

export default function TopBar() {
  const { year, gas, sector, setYear, setGas, setSector } = useStore();

  const years = [2022, 2023, 2024, 2025];
  const gases = ["CO2", "N2O", "CH4", "SF6", "CFC", "PFC", "HFC"];
  const sectors = ["Energy", "Agriculture", "Transport", "Waste", "Industrial"];

  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between p-4 bg-white rounded-lg shadow-md z-20">
      <div className="flex items-center space-x-8">
        <h1 className="text-xl font-bold tracking-tight">LOGO</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search" 
            className="pl-10 pr-4 py-2 border rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <select 
            className="appearance-none border rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[120px]"
            value={year || ''}
            onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select 
            className="appearance-none border rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[120px]"
            value={gas || ''}
            onChange={(e) => setGas(e.target.value || null)}
          >
            <option value="">All Gases</option>
            {gases.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select 
            className="appearance-none border rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[120px]"
            value={sector || ''}
            onChange={(e) => setSector(e.target.value || null)}
          >
            <option value="">All Sectors</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
