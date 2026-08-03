'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Search, ChevronDown, X, SlidersHorizontal, Filter } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import logo from '@/assets/logo.png';
import { fetchAvailableFilters } from '@/lib/api';
import { VALID_REGIONAL_YEARS, DEFAULT_YEAR } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

const YEARS = [...VALID_REGIONAL_YEARS];
const GASES = ['CO2', 'CH4', 'N2O', 'HFC'];
const SECTORS = ['Energy', 'Agriculture', 'LULUCF', 'IPPU', 'Waste'];
const REGIONS = ['Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra', 'Northern', 'North East', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'];

const GAS_COLORS: Record<string, string> = {
  CO2: 'bg-red-100 text-red-700 border-red-200',
  CH4: 'bg-rose-950/10 text-rose-900 border-rose-900/20',
  N2O: 'bg-orange-100 text-orange-700 border-orange-200',
  HFC: 'bg-lime-100 text-lime-700 border-lime-200',
  SF6: 'bg-amber-100 text-amber-700 border-amber-200',
  CFC: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  PFC: 'bg-rose-100 text-rose-700 border-rose-200',
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
  disabled,
  tooltip,
  fullWidth = false,
}: {
  label: string;
  value: string | number | null;
  options: (string | number)[];
  available: (string | number)[];
  onChange: (v: string | null) => void;
  disabled?: boolean;
  tooltip?: string;
  fullWidth?: boolean;
}) {
  const active = value !== null && value !== '';
  return (
    <div className={`relative group ${fullWidth ? 'w-full' : ''}`} title={disabled ? tooltip : undefined}>
      <select
        disabled={disabled}
        className={`appearance-none border rounded-xl pl-3.5 pr-8 py-2 text-xs font-semibold focus:outline-none transition-all ${
          fullWidth ? 'w-full' : 'min-w-[104px]'
        } ${
          disabled
            ? 'bg-gray-100/90 text-gray-400 border-gray-200 cursor-not-allowed opacity-75'
            : active
            ? 'bg-[#00C853] text-white border-[#009624] shadow-sm shadow-emerald-200 cursor-pointer'
            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
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
      <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors ${disabled ? 'text-gray-300' : active ? 'text-white/80' : 'text-gray-400'}`} />
    </div>
  );
}

export default function TopBar() {
  const { year, gas, sector, isDistrictViewActive, setYear, setGas, setSector, setSearchedRegion } = useStore();
  const [availableYears, setAvailableYears] = useState<number[]>(YEARS);
  const [availableGases, setAvailableGases] = useState<string[]>(GASES);
  const [availableSectors, setAvailableSectors] = useState<string[]>(SECTORS);
  const [search, setSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const filteredRegions = REGIONS.filter(r => r.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    async function loadFilters() {
      try {
        setAvailableYears(YEARS);

        const gasFilters = await fetchAvailableFilters(undefined, undefined, sector || undefined);
        setAvailableGases(gasFilters.gases.length > 0 ? gasFilters.gases : GASES);

        const sectorFilters = await fetchAvailableFilters(undefined, gas || undefined, undefined);
        setAvailableSectors(sectorFilters.sectors.length > 0 ? sectorFilters.sectors : SECTORS);
      } catch {
        setAvailableYears(YEARS);
        setAvailableGases(GASES);
        setAvailableSectors(SECTORS);
      }
    }
    loadFilters();
  }, [gas, sector]);

  const activeCount = [year, gas, sector].filter(Boolean).length;

  function clearAll() {
    setYear(DEFAULT_YEAR);
    setGas(null);
    setSector(null);
  }

  return (
    <>
      {/* Top Floating Bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] md:w-[calc(100%-104px)] max-w-5xl flex items-center justify-between md:justify-start gap-2.5 px-3.5 md:px-4 py-2 md:py-2.5 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 z-20">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <Link href="/">
            <Image src={logo} alt="NCEL" className="h-6 md:h-7 w-auto" />
          </Link>
        </div>

        <div className="hidden md:block w-px h-5 bg-gray-200 flex-shrink-0" />

        {/* Filters label - Desktop */}
        <div className="hidden md:flex flex-shrink-0 items-center gap-1.5 text-xs text-gray-400 font-medium">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden lg:block">Filters</span>
          {activeCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#00C853] text-white text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>

        {/* Filter selects - Desktop */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <FilterSelect
            label="Year"
            value={year ?? DEFAULT_YEAR}
            options={YEARS}
            available={availableYears}
            onChange={v => setYear(v ? parseInt(v) : DEFAULT_YEAR)}
          />
          <FilterSelect
            label="Gas Type"
            value={gas}
            options={GASES}
            available={availableGases}
            onChange={setGas}
            disabled={isDistrictViewActive}
            tooltip="Gas breakdown is displayed inside the district popup"
          />
          <FilterSelect
            label="Sector"
            value={sector}
            options={SECTORS}
            available={availableSectors}
            onChange={setSector}
            disabled={isDistrictViewActive}
            tooltip="Sector breakdown is displayed inside the district popup"
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

        {/* Active filter badges - Desktop */}
        {(gas || sector) && (
          <div className="hidden lg:flex items-center gap-1.5 flex-1 overflow-hidden">
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

        {/* Desktop Search */}
        <div className="flex-1 hidden md:flex justify-end">
          <div className="relative max-w-[180px] lg:max-w-[200px] w-full">
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
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent bg-gray-50 placeholder-gray-300 transition-all relative z-10"
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

        {/* Mobile Buttons (Filter Drawer Trigger & Quick Search) */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex items-center gap-1.5 bg-[#00C853] text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-transform"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#00C853] text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Up Filter Drawer */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setIsMobileDrawerOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Filter className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800">Map Filters & Search</h3>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Region Search Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Search Region</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Find region in Ghana..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/50 bg-gray-50"
                  />
                  {search && filteredRegions.length > 0 && (
                    <div className="mt-2 bg-gray-50 border border-gray-100 rounded-xl max-h-40 overflow-y-auto divide-y divide-gray-100">
                      {filteredRegions.map(r => (
                        <button
                          key={r}
                          onClick={() => {
                            setSearchedRegion(r);
                            setIsMobileDrawerOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          📍 {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selectors */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Emissions Year</label>
                  <FilterSelect
                    label="Select Year"
                    value={year ?? DEFAULT_YEAR}
                    options={YEARS}
                    available={availableYears}
                    onChange={v => setYear(v ? parseInt(v) : DEFAULT_YEAR)}
                    fullWidth
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Gas Type</label>
                  <FilterSelect
                    label="All Gases (Total)"
                    value={gas}
                    options={GASES}
                    available={availableGases}
                    onChange={setGas}
                    disabled={isDistrictViewActive}
                    tooltip="Gas breakdown is displayed inside the district popup"
                    fullWidth
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Sector</label>
                  <FilterSelect
                    label="All Sectors"
                    value={sector}
                    options={SECTORS}
                    available={availableSectors}
                    onChange={setSector}
                    disabled={isDistrictViewActive}
                    tooltip="Sector breakdown is displayed inside the district popup"
                    fullWidth
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                {activeCount > 0 ? (
                  <button
                    onClick={() => { clearAll(); }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
                  >
                    Reset Filters
                  </button>
                ) : <div />}

                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex-1 py-2.5 bg-[#00C853] hover:bg-[#009624] text-white text-xs font-bold rounded-xl shadow-sm text-center"
                >
                  Apply Filters ({activeCount})
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
