/**
 * Ghana GHG Emissions Map Configuration & Constants
 * Centralized reference point for year coverage and data rules.
 */

export const VALID_REGIONAL_YEARS = [1990, 2000, 2012, 2016, 2019, 2021, 2022] as const;

export type RegionalYear = typeof VALID_REGIONAL_YEARS[number];

export const DISTRICT_BREAKDOWN_YEAR = 2022;
export const DEFAULT_YEAR = 2022;

/**
 * Checks if sector and gas breakdown detail is available for a given year at the district level.
 */
export function isDistrictBreakdownAvailable(year: number | null | undefined): boolean {
  if (year === null || year === undefined) return false;
  return Number(year) === DISTRICT_BREAKDOWN_YEAR;
}

/**
 * Validates if a year is one of the 7 supported regional years.
 */
export function isValidRegionalYear(year: number | null | undefined): boolean {
  if (year === null || year === undefined) return false;
  return VALID_REGIONAL_YEARS.includes(Number(year) as RegionalYear);
}
