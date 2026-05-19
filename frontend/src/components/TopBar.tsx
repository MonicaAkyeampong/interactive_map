'use client';

import { useStore } from '@/store/useStore';
import { Search, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import logo from '@/assets/logo.png';

export default function TopBar() {
  const { year, gas, sector, setYear, setGas, setSector } = useStore();

  const years = [2022, 2023, 2024, 2025];
  const gases = ["CO2", "N2O", "CH4", "SF6", "CFC", "PFC", "HFC"];
  const sectors = ["Energy", "Agriculture", "Transport", "Waste", "Industrial"];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg z-20 border border-white/20 gap-4">
      {/* Left: Logo */}
      <div className="flex-shrink-0 flex items-center">
        <Link href="/">
          <Image src={logo} alt="Logo" className="h-8 w-auto" />
        </Link>
      </div>

      {/* Center: Search */}
      <div className="flex-1 hidden md:flex justify-center px-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800 placeholder-gray-500 transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Right: Filters */}
      <div className="flex-shrink-0 flex items-center space-x-3">
        <div className="relative">
          <select 
            className="appearance-none border border-gray-300 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800 hover:bg-gray-50 transition-colors shadow-sm min-w-[110px] cursor-pointer"
            value={year || ''}
            onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
        </div>

        <div className="relative">
          <select 
            className="appearance-none border border-gray-300 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800 hover:bg-gray-50 transition-colors shadow-sm min-w-[110px] cursor-pointer"
            value={gas || ''}
            onChange={(e) => setGas(e.target.value || null)}
          >
            <option value="">All Gases</option>
            {gases.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
        </div>

        <div className="relative">
          <select 
            className="appearance-none border border-gray-300 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800 hover:bg-gray-50 transition-colors shadow-sm min-w-[110px] cursor-pointer"
            value={sector || ''}
            onChange={(e) => setSector(e.target.value || null)}
          >
            <option value="">All Sectors</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
