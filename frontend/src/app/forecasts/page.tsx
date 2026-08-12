'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Target, BarChart2, Layers, Calendar } from 'lucide-react';
import TopBar from '@/components/TopBar';

const SCENARIOS = [
  { id: 'bau', name: 'Business As Usual (BAU)', color: 'bg-rose-500', desc: 'Emissions projection under current policy baselines without additional NDC interventions.' },
  { id: 'ndc', name: 'NDC Target Pathway', color: 'bg-amber-500', desc: 'Emissions projection assuming full implementation of Ghana\'s conditional and unconditional NDC targets.' },
  { id: 'netzero', name: 'Accelerated Net-Zero 2050', color: 'bg-emerald-500', desc: 'Ambitious decarbonization pathway aligning with international 1.5°C climate goals.' },
];

export default function ForecastsPage() {
  const [activeScenario, setActiveScenario] = useState('ndc');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-16">
      {/* Top Header Navigation */}
      <TopBar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 space-y-8">
        {/* Page Title & Overview */}
        <div className="border-b border-gray-200 pb-6 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            <span>AI Predictive Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Greenhouse Gas Emissions Forecasts</h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            Machine learning projections and scenario modeling supporting Ghana's NDC commitments and regional climate action.
          </p>
        </div>

        {/* Forecast Trajectory Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCENARIOS.map(sc => {
            const isActive = activeScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => setActiveScenario(sc.id)}
                className={`text-left p-5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-white border-brand-500 shadow-md ring-2 ring-brand-500/20'
                    : 'bg-white/60 border-gray-200 hover:bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <span className={`w-3 h-3 rounded-full ${sc.color}`} />
                  <h3 className="font-bold text-sm text-gray-900">{sc.name}</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{sc.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Forecast Details Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">2025 – 2035 Emissions Trajectory Projections</h2>
              <p className="text-xs text-gray-500">Modeled annual output based on chosen trajectory scenario</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Model Horizon:</span>
              <span className="text-xs font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-xl">2025 - 2035</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100">
              <span className="text-xs font-semibold text-gray-400 block mb-1">Projected 2030 Baseline</span>
              <span className="text-3xl font-black text-gray-900">
                {activeScenario === 'bau font-black' ? '68.4' : activeScenario === 'ndc' ? '42.1' : '31.5'}
              </span>
              <span className="text-xs text-gray-500 ml-1.5 font-bold">Mt CO₂e</span>
            </div>

            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100">
              <span className="text-xs font-semibold text-gray-400 block mb-1">NDC Target Reduction</span>
              <span className="text-3xl font-black text-emerald-600">
                {activeScenario === 'bau' ? '0%' : activeScenario === 'ndc' ? '-38.4%' : '-54.0%'}
              </span>
              <span className="text-xs text-gray-500 ml-1.5 font-bold">vs 2020</span>
            </div>

            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100">
              <span className="text-xs font-semibold text-gray-400 block mb-1">Model Confidence</span>
              <span className="text-3xl font-black text-blue-600">94.2%</span>
              <span className="text-xs text-gray-500 ml-1.5 font-bold">R² Accuracy</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
