import { create } from 'zustand';

interface FilterState {
  year: number | null;
  gas: string | null;
  sector: string | null;
  setYear: (year: number | null) => void;
  setGas: (gas: string | null) => void;
  setSector: (sector: string | null) => void;
}

export const useStore = create<FilterState>((set) => ({
  year: null,
  gas: null,
  sector: null,
  setYear: (year) => set({ year }),
  setGas: (gas) => set({ gas }),
  setSector: (sector) => set({ sector }),
}));
