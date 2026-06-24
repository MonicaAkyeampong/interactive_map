import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface HistoricalDataPoint {
  year: number;
  total: number;
}

interface EntityData {
  id: number;
  name: string;
  historical: HistoricalDataPoint[];
}

interface Props {
  data: EntityData[];
}

// 16 distinct colors for comparing up to 16 regions
const COLORS = [
  '#1DB978', // brand (green)
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#14b8a6', // teal
  '#84cc16', // lime
  '#d946ef', // fuchsia
  '#eab308', // yellow
  '#6366f1', // indigo
  '#f97316', // orange
  '#10b981', // emerald
  '#f43f5e', // rose
  '#0ea5e9'  // sky
];

export default function HistoricalTrajectoryChart({ data }: Props) {
  // Transform data for Recharts: [{ year: 1990, 'Region A': 120, 'Region B': 150 }, ...]
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const yearMap = new Map<number, any>();

    data.forEach((entity) => {
      entity.historical.forEach((point) => {
        if (!yearMap.has(point.year)) {
          yearMap.set(point.year, { year: point.year });
        }
        yearMap.get(point.year)[entity.name] = point.total;
      });
    });

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-96 flex items-center justify-center">
        <p className="text-slate-500">No data available to display.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col h-[450px]">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">Historical Trajectory (1990 - 2022)</h3>
        <p className="text-sm text-slate-500">Total emissions over time (ktCO₂e)</p>
      </div>
      
      <div className="flex-1 w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
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
              dataKey="year" 
              tick={{ fill: '#64748b', fontSize: 12 }} 
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
            />

            {data.map((entity, index) => (
              <Line
                key={entity.id}
                type="monotone"
                dataKey={entity.name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
