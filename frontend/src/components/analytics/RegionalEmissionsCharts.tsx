'use client';

import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

interface EntityData {
  id: number;
  name: string;
  demographics: {
    pop2021: number;
    per_capita_2022: number | null;
  };
  gases_2022: Record<string, number>;
}

interface Props {
  data: EntityData[];
}

const COLORS = [
  '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#f43f5e', 
  '#06b6d4', '#14b8a6', '#84cc16', '#eab308', '#6366f1', '#a855f7',
  '#d946ef', '#f97316', '#0ea5e9', '#64748b'
];

export default function RegionalEmissionsCharts({ data }: Props) {
  if (!data || data.length === 0) return null;

  const totalEmissionsData = useMemo(() => {
    return data.map(d => {
      const total = Object.values(d.gases_2022 || {}).reduce((sum, val) => sum + val, 0);
      return { name: d.name, total };
    }).sort((a, b) => b.total - a.total);
  }, [data]);

  const getGasData = (targetGas: string) => {
    return data.map(d => {
      let val = 0;
      if (d.gases_2022) {
        for (const [key, v] of Object.entries(d.gases_2022)) {
          if (key.includes(targetGas)) val += v;
        }
      }
      return { name: d.name, value: val };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);
  };

  const co2Data = useMemo(() => getGasData('CO2'), [data]);
  const ch4Data = useMemo(() => getGasData('CH4'), [data]);
  const n2oData = useMemo(() => getGasData('N2O'), [data]);
  const hfcData = useMemo(() => getGasData('HFC'), [data]);

  const renderDonut = (chartData: any[], title: string, colorHex: string) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center">
        <h3 className="text-sm font-bold text-slate-600 mb-4">{title}</h3>
        <div className="w-full h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [`${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })} ktCO₂e`, '']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 mt-12">
      <div className="border-t border-slate-200 pt-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Regional Contributions</h2>
        <p className="text-slate-500 mb-8">A complete breakdown of total emissions and specific greenhouse gas contributions across all 16 regions of Ghana.</p>
      </div>

      {/* Total Emissions Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Total Emissions by Region (2022)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={totalEmissionsData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}M`} stroke="#94a3b8" fontSize={12} />
              <YAxis dataKey="name" type="category" width={100} stroke="#475569" fontSize={12} fontWeight="500" interval={0} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                formatter={(value: any) => [`${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })} ktCO₂e`, 'Total Emissions']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gas specific donuts */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-6">Share of Specific Greenhouse Gases</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {renderDonut(co2Data, 'CO₂ Contributions', '#3b82f6')}
          {renderDonut(ch4Data, 'CH₄ Contributions', '#f59e0b')}
          {renderDonut(n2oData, 'N₂O Contributions', '#ef4444')}
          {renderDonut(hfcData, 'HFC Contributions', '#8b5cf6')}
        </div>
      </div>
      
    </div>
  );
}
