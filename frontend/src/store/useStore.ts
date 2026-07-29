import { create } from 'zustand';

interface FilterState {
  year: number | null;
  gas: string | null;
  sector: string | null;
  forecastMode: string | null;
  mapMode: 'Intensity' | 'DominantGas';
  activeTimelineIndex: number;
  isPlaying: boolean;
  selectedRegion: string | null;
  searchedRegion: string | null;
  isDistrictViewActive: boolean;
  setYear: (year: number | null) => void;
  setGas: (gas: string | null) => void;
  setSector: (sector: string | null) => void;
  setForecastMode: (mode: string | null) => void;
  setMapMode: (mode: 'Intensity' | 'DominantGas') => void;
  setActiveTimelineIndex: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setSelectedRegion: (region: string | null) => void;
  setSearchedRegion: (region: string | null) => void;
  setIsDistrictViewActive: (active: boolean) => void;
}

export const useStore = create<FilterState>((set) => ({
  year: null,
  gas: null,
  sector: null,
  forecastMode: 'Future Forecasts',
  mapMode: 'Intensity',
  activeTimelineIndex: 0,
  isPlaying: false,
  selectedRegion: null,
  searchedRegion: null,
  isDistrictViewActive: false,
  setYear: (year) => set({ year }),
  setGas: (gas) => set({ gas }),
  setSector: (sector) => set({ sector }),
  setForecastMode: (mode) => set({ forecastMode: mode }),
  setMapMode: (mode) => set({ mapMode: mode }),
  setActiveTimelineIndex: (index) => set({ activeTimelineIndex: index }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  setSearchedRegion: (region) => set({ searchedRegion: region }),
  setIsDistrictViewActive: (active) => set(state => ({
    isDistrictViewActive: active,
    // Reset gas & sector to null when entering District View
    ...(active ? { gas: null, sector: null } : {})
  })),
}));
