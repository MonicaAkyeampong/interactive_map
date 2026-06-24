import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface EntityData {
  id: number;
  name: string;
  abbreviation?: string | null;
  sectors_2022: Record<string, number>;
}

interface Props {
  data: EntityData[];
}

// Distinct, vibrant colors for sectors
const SECTOR_COLORS: Record<string, string> = {
  'Energy': '#f59e0b', // Amber
  'Agriculture': '#1DB978', // Brand primary (Green)
  'AFOLU': '#1DB978', // Brand primary fallback
  'Waste': '#64748b', // Slate
  'IPPU': '#8b5cf6', // Violet
  'LULUCF': '#0ea5e9' // Sky Blue
};

const DEFAULT_COLORS = ['#1DB978', '#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e'];

export default function SectoralBreakdownChart({ data }: Props) {
  // Transform data: [{ name: 'Ashanti', Energy: 100, Waste: 50 }, ...]
  const { chartData, sectors } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], sectors: [] };

    const sectorSet = new Set<string>();
    const transformed = data.map(entity => {
      const entry: any = { 
        name: entity.name,
        abbreviation: entity.abbreviation || entity.name
      };
      
      Object.entries(entity.sectors_2022 || {}).forEach(([sectorName, value]) => {
        if (value > 0 || value < 0) { // Keep negative emissions like LULUCF sinks
          sectorSet.add(sectorName);
          entry[sectorName] = value;
        }
      });
      return entry;
    });

    return { 
      chartData: transformed, 
      sectors: Array.from(sectorSet).sort() 
    };
  }, [data]);

  if (!data || data.length === 0 || sectors.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-[450px] flex items-center justify-center">
        <p className="text-slate-500">No sectoral data available to display.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-[450px]">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">2022 Sectoral Breakdown</h3>
        <p className="text-sm text-slate-500">Drivers of the footprint (ktCO₂e)</p>
      </div>
      
      <div className="flex-1 w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <Legend 
              verticalAlign="top"
              align="center"
              iconType="circle"
              wrapperStyle={{ fontSize: '13px', paddingBottom: '20px' }}
            />
            <XAxis 
              dataKey="abbreviation" 
              tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
              dx={-10}
              tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any) => [`${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })} ktCO₂e`, '']}
              labelFormatter={(label, items) => {
                const item = items[0]?.payload;
                return item ? item.name : label;
              }}
              cursor={{ fill: '#f1f5f9' }}
            />

            {sectors.map((sector, index) => {
              // Try to map sector name to known color, else fallback
              let color = SECTOR_COLORS[sector];
              if (!color) {
                // partial match hack
                for (const key of Object.keys(SECTOR_COLORS)) {
                  if (sector.includes(key)) color = SECTOR_COLORS[key];
                }
              }
              if (!color) color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];

              return (
                <Bar 
                  key={sector} 
                  dataKey={sector} 
                  stackId="a" 
                  fill={color} 
                  radius={[
                    // If it's the last sector (top of stack), round the top corners.
                    // This is hard to do perfectly with dynamic stacks, so we just round slightly.
                    index === sectors.length - 1 ? 4 : 0,
                    index === sectors.length - 1 ? 4 : 0,
                    0, 
                    0
                  ]}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
