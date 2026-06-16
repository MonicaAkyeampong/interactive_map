'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Search, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import logo from '@/assets/logo.png';
import { fetchAvailableFilters } from '@/lib/api';

const YEARS = [1990, 2000, 2012, 2016, 2019, 2021, 2022];
const GASES = ['CO2', 'CH4', 'N2O', 'HFC'];
const SECTORS = ['Energy', 'Agriculture', 'LULUCF', 'IPPU', 'Waste'];
const REGIONS = ['Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra', 'Northern', 'North East', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'];

const GAS_COLORS: Record<string, string> = {
  CO2: 'bg-blue-100 text-blue-700 border-blue-200',
  CH4: 'bg-orange-100 text-orange-700 border-orange-200',
  N2O: 'bg-purple-100 text-purple-700 border-purple-200',
  HFC: 'bg-lime-100 text-lime-700 border-lime-200',
};

const SECTOR_COLORS: Record<string, string> = {
  Energy: 'bg-amber-100 text-amber-700 border-amber-200',
  Agriculture: 'bg-green-100 text-green-700 border-green-200',
  LULUCF: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  IPPU: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Waste: 'bg-rose-100 text-rose-700 border-rose-200',
};

function FilterSelect({
  label,
  value,
  options,
  available,
  onChange,
  badge,
}: {
  label: string;
  value: string | number | null;
  options: (string | number)[];
  available: (string | number)[];
  onChange: (v: string | null) => void;
  badge?: string;
}) {
  const active = value !== null && value !== '';
  return (
    <div className="relative group">
      <select
        className={`appearance-none border rounded-lg pl-3.5 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all cursor-pointer min-w-[108px] ${
          active
            ? 'bg-[#00C853] text-white border-[#009624] shadow-sm shadow-emerald-200'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
      >
        <option value="">{label}</option>
        {options.map(o => (
          <option key={o} value={o} disabled={!available.includes(o)} className="text-gray-800 bg-white">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none transition-colors ${active ? 'text-white/80' : 'text-gray-400'}`} />
    </div>
  );
}

export default function TopBar() {
  const { year, gas, sector, setYear, setGas, setSector, setSearchedRegion } = useStore();
  const [availableYears, setAvailableYears] = useState<number[]>(YEARS);
  const [availableGases, setAvailableGases] = useState<string[]>(GASES);
  const [availableSectors, setAvailableSectors] = useState<string[]>(SECTORS);
  const [search, setSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const filteredRegions = REGIONS.filter(r => r.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    async function loadFilters() {
      try {
        const y = year && !isNaN(Number(year)) ? Number(year) : undefined;
        const filters = await fetchAvailableFilters(y, gas || undefined, sector || undefined);
        setAvailableYears(filters.years);
        setAvailableGases(filters.gases);
        setAvailableSectors(filters.sectors);
        if (y && !filters.years.includes(y)) setYear(null);
        if (gas && !filters.gases.includes(gas)) setGas(null);
        if (sector && !filters.sectors.includes(sector)) setSector(null);
      } catch {
        // keep current options on error
      }
    }
    loadFilters();
  }, [year, gas, sector, setYear, setGas, setSector]);

  const activeCount = [year, gas, sector].filter(Boolean).length;

  function clearAll() {
    setYear(null);
    setGas(null);
    setSector(null);
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[calc(100%-104px)] max-w-5xl flex items-center gap-3 px-4 py-2.5 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 z-20">
      {/* Logo */}
      <div className="flex-shrink-0">
        <Link href="/">
          <Image src={logo} alt="NCEL" className="h-7 w-auto" />
        </Link>
      </div>

      <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

      {/* Filters label */}
      <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-400 font-medium">
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span className="hidden lg:block">Filters</span>
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-[#00C853] text-white text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </div>

      {/* Filter selects */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <FilterSelect
          label="Year"
          value={year}
          options={YEARS}
          available={availableYears}
          onChange={v => setYear(v ? parseInt(v) : null)}
        />
        <FilterSelect
          label="Gas Type"
          value={gas}
          options={GASES}
          available={availableGases}
          onChange={setGas}
        />
        <FilterSelect
          label="Sector"
          value={sector}
          options={SECTORS}
          available={availableSectors}
          onChange={setSector}
        />

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-2 rounded-lg hover:bg-gray-50"
            title="Clear all filters"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden xl:block">Clear</span>
          </button>
        )}
      </div>

      {/* Active filter pills */}
      {(gas || sector) && (
        <div className="hidden md:flex items-center gap-1.5 flex-1 overflow-hidden">
          <div className="w-px h-5 bg-gray-200 mr-1" />
          {gas && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border ${GAS_COLORS[gas] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {gas}
              <button onClick={() => setGas(null)} className="opacity-60 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {sector && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border ${SECTOR_COLORS[sector] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {sector}
              <button onClick={() => setSector(null)} className="opacity-60 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
        </div>
      )}

      {/* Search */}
      <div className="flex-1 hidden lg:flex justify-end">
        <div className="relative max-w-[200px] w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-3.5 h-3.5 pointer-events-none z-10" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
            placeholder="Search regions..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent bg-gray-50 placeholder-gray-300 transition-all relative z-10"
          />
          {showSearchDropdown && search && filteredRegions.length > 0 && (
            <div className="absolute top-full mt-1.5 w-full bg-white border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden z-[100] max-h-60 overflow-y-auto">
              {filteredRegions.map(r => (
                <button
                  key={r}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearch(r);
                    setSearchedRegion(r);
                    setShowSearchDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
