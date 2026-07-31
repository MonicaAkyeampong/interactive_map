/**
 * Gas Palette & Single-Hue Map Color Utilities
 * Manages gas color identities, UI badge styles, and single-hue shade scales for map choropleths.
 */

export interface GasPalette {
  gas: string;
  name: string;
  badgeClass: string;
  hexPrimary: string;
  regionalShades: [string, string, string, string, string]; // 5 tiers
}

export const DEFAULT_REGIONAL_PALETTE: [string, string, string, string, string] = [
  '#1a9850', // Very Low (< 1,493 kt)
  '#91cf60', // Low (1,493 - 2,985 kt)
  '#fee08b', // Moderate (2,985 - 4,478 kt)
  '#fc8d59', // High (4,478 - 7,463 kt)
  '#d73027', // Extreme Hotspot (> 7,463 kt)
];

export const REGIONAL_BREAKPOINTS = [1482, 2985, 4478, 7463];

export const GAS_PALETTES: Record<string, GasPalette> = {
  CO2: {
    gas: 'CO2',
    name: 'Carbon Dioxide',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    hexPrimary: '#ef4444',
    regionalShades: [
      '#fee5d9', // Very Low: Pale Red Tint
      '#fcae91', // Low: Soft Red
      '#fb6a4a', // Moderate: Vibrant Red
      '#de2d26', // High: Dark Red
      '#a50f15', // Extreme Hotspot: Deep Ruby Red
    ],
  },
  CH4: {
    gas: 'CH4',
    name: 'Methane',
    badgeClass: 'bg-rose-950/10 text-rose-900 border-rose-900/20',
    hexPrimary: '#800020',
    regionalShades: [
      '#fdf0f0', // Very Low: Pale Maroon Tint
      '#f3baba', // Low: Soft Maroon Tint
      '#c24b59', // Moderate: Vibrant Wine Maroon
      '#800020', // High: Deep Dark Maroon
      '#4a0011', // Extreme Hotspot: Deepest Velvet Maroon
    ],
  },
  N2O: {
    gas: 'N2O',
    name: 'Nitrous Oxide',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
    hexPrimary: '#f97316',
    regionalShades: [
      '#ffedd5', // Very Low: Pale Peach Tint
      '#fdba74', // Low: Light Orange
      '#f97316', // Moderate: Vibrant Amber Orange
      '#ea580c', // High: Dark Orange
      '#9a3412', // Extreme Hotspot: Deep Burnt Orange
    ],
  },
  HFC: {
    gas: 'HFC',
    name: 'Hydrofluorocarbons',
    badgeClass: 'bg-lime-100 text-lime-700 border-lime-200',
    hexPrimary: '#84cc16',
    regionalShades: [
      '#ecfccb', // Very Low: Pale Lime Tint
      '#a3e635', // Low: Light Lime
      '#65a30d', // Moderate: Vibrant Lime Green
      '#4d7c0f', // High: Dark Lime Green
      '#1a2e05', // Extreme Hotspot: Deep Forest Olive
    ],
  },
  SF6: {
    gas: 'SF6',
    name: 'Sulfur Hexafluoride',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    hexPrimary: '#eab308',
    regionalShades: [
      '#fef9c3', // Very Low: Pale Yellow Tint
      '#fde047', // Low: Soft Yellow
      '#ca8a04', // Moderate: Gold Yellow
      '#854d0e', // High: Dark Yellow-Brown
      '#451a03', // Extreme Hotspot: Deep Bronze
    ],
  },
  CFC: {
    gas: 'CFC',
    name: 'Chlorofluorocarbon',
    badgeClass: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    hexPrimary: '#06b6d4',
    regionalShades: [
      '#e0f2fe', // Very Low: Pale Cyan Tint
      '#38bdf8', // Low: Light Cyan
      '#0284c7', // Moderate: Vibrant Cyan
      '#0369a1', // High: Dark Cyan
      '#0c4a6e', // Extreme Hotspot: Deep Cyan
    ],
  },
  PFC: {
    gas: 'PFC',
    name: 'Perfluorocarbon',
    badgeClass: 'bg-rose-100 text-rose-700 border-rose-200',
    hexPrimary: '#f43f5e',
    regionalShades: [
      '#ffe4e6', // Very Low: Pale Rose Tint
      '#fb7185', // Low: Light Rose
      '#e11d48', // Moderate: Vibrant Rose
      '#be123c', // High: Dark Rose
      '#881337', // Extreme Hotspot: Deep Rose
    ],
  },
};

/**
 * Returns the 5-tier regional shade array for a given gas filter.
 * If gas is null/empty or unknown, returns DEFAULT_REGIONAL_PALETTE.
 */
export function getRegionalShades(gas: string | null | undefined): [string, string, string, string, string] {
  if (!gas) return DEFAULT_REGIONAL_PALETTE;
  const upperGas = gas.toUpperCase();
  const palette = GAS_PALETTES[upperGas];
  return palette ? palette.regionalShades : DEFAULT_REGIONAL_PALETTE;
}

/**
 * Generates the MapboxGL paint 'fill-color' step expression for the regional map layer.
 */
export function getRegionalFillColorExpression(gas: string | null | undefined): any[] {
  const shades = getRegionalShades(gas);
  const targetProp = gas || 'TOTAL_EMISSIONS';
  return [
    'step',
    ['get', targetProp],
    shades[0],
    REGIONAL_BREAKPOINTS[0], shades[1],
    REGIONAL_BREAKPOINTS[1], shades[2],
    REGIONAL_BREAKPOINTS[2], shades[3],
    REGIONAL_BREAKPOINTS[3], shades[4],
  ];
}

/**
 * Computes exact hex color for a given regional value based on active gas filter.
 */
export function getComputedRegionalColor(val: number, gas: string | null | undefined): string {
  const shades = getRegionalShades(gas);
  if (val <= REGIONAL_BREAKPOINTS[0]) return shades[0];
  if (val <= REGIONAL_BREAKPOINTS[1]) return shades[1];
  if (val <= REGIONAL_BREAKPOINTS[2]) return shades[2];
  if (val <= REGIONAL_BREAKPOINTS[3]) return shades[3];
  return shades[4];
}
