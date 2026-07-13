export interface Region {
  region_id: number;
  region_name: string;
  area_km2?: number;
  population?: number;
  created_at: string;
}

export interface Gas {
  gas_id: number;
  gas_name: string;
  formula: string;
  gwp100?: number;
  description?: string;
}

export interface Sector {
  sector_id: number;
  sector_name: string;
  description?: string;
}

export interface Emission {
  emission_id: number;
  region_id: number;
  sector_id: number;
  gas_id: number;
  year: number;
  emission_value: number;
  unit: string;
  dataset_id?: number;
  created_at: string;
  
  region: Region;
  sector: Sector;
  gas: Gas;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function fetchRegions(): Promise<Region[]> {
  const res = await fetch(`${API_BASE_URL}/regions`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch regions');
  }
  return res.json();
}

export async function fetchEmissions(
  regionId?: number, 
  gasId?: number, 
  year?: number
): Promise<Emission[]> {
  const params = new URLSearchParams();
  if (regionId !== undefined) params.append('region_id', regionId.toString());
  if (gasId !== undefined) params.append('gas_id', gasId.toString());
  if (year !== undefined) params.append('year', year.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/emissions${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch emissions');
  }
  return res.json();
}

export async function fetchGases(): Promise<Gas[]> {
  const res = await fetch(`${API_BASE_URL}/gases`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch gases');
  }
  return res.json();
}

export async function fetchSummaryData(
  year?: number,
  gas?: string,
  sector?: string,
  region?: string
): Promise<{
  total_emissions: number,
  total_sources: number,
  top_region: string,
  unit: string,
  sector_breakdown: {sector: string, total: number}[],
  gas_breakdown: {gas: string, total: number}[],
  population: number | null
}> {
  const params = new URLSearchParams();
  if (year !== undefined) params.append('year', year.toString());
  if (gas) params.append('gas_name', gas);
  if (sector) params.append('sector_name', sector);
  if (region) params.append('region_name', region);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/summary${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch summary data');
  }
  return res.json();
}

export async function fetchMapData(
  year?: number,
  sector?: string
): Promise<Record<string, any>> {
  const params = new URLSearchParams();
  if (year !== undefined) params.append('year', year.toString());
  if (sector) params.append('sector_name', sector);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/map-data${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch map data');
  }
  return res.json();
}

export async function fetchAvailableFilters(
  year?: number,
  gas?: string,
  sector?: string
): Promise<{years: number[], gases: string[], sectors: string[]}> {
  const params = new URLSearchParams();
  if (year !== undefined) params.append('year', year.toString());
  if (gas) params.append('gas_name', gas);
  if (sector) params.append('sector_name', sector);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/available-filters${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch available filters');
  }
  return res.json();
}

export async function fetchDistrictSummaryData(
  year?: number,
  gas?: string,
  sector?: string,
  district?: string
): Promise<{
  total_emissions: number,
  total_sources: number,
  unit: string,
  sector_breakdown: {sector: string, total: number}[],
  gas_breakdown: {gas: string, total: number}[],
  population: number | null
}> {
  const params = new URLSearchParams();
  if (year !== undefined) params.append('year', year.toString());
  if (gas) params.append('gas_name', gas);
  if (sector) params.append('sector_name', sector);
  if (district) params.append('district_name', district);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/district-summary${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch district summary data');
  }
  return res.json();
}

export async function fetchDistrictMapData(
  year?: number,
  sector?: string,
  region?: string
): Promise<Record<string, any>> {
  const params = new URLSearchParams();
  if (year !== undefined) params.append('year', year.toString());
  if (sector) params.append('sector_name', sector);
  if (region) params.append('region_name', region);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/district-map-data${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch district map data');
  }
  return res.json();
}
