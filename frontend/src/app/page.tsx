'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ArrowRight, Globe, Map, Sparkles, Satellite, BarChart3, Layers, Scale } from 'lucide-react';
import logo from '@/assets/logo.png';
import HomeMap from '@/components/HomeMap';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] as const }
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.2 } 
  }
};

function SectionReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div 
      initial="hidden" 
      whileInView="visible" 
      viewport={{ once: true, margin: "-50px" }} 
      variants={stagger} 
      className={className}
    >
      {children}
    </motion.div>
  );
}

const CAPABILITIES = [
  {
    title: 'Emissions Mapping',
    desc: 'Interactive choropleth maps visualizing GHG emissions across all 16 regions of Ghana with multi-dimensional filtering and temporal playbacks.',
    icon: Map,
    className: "md:col-span-2 md:row-span-2 bg-gradient-to-br from-white to-brand-50/30",
  },
  {
    title: 'AI Forecasting',
    desc: 'Machine-learning powered projections for emission trajectories.',
    icon: Sparkles,
    className: "md:col-span-1 bg-white",
  },
  {
    title: 'Satellite Monitoring',
    desc: 'Near real-time satellite-derived estimates validated against inventory data.',
    icon: Satellite,
    className: "md:col-span-1 bg-white",
  },
  {
    title: 'Regional Analytics',
    desc: 'Drill-down analytics by region, sector, and gas type with benchmarking.',
    icon: BarChart3,
    className: "md:col-span-1 bg-white",
  },
  {
    title: 'Sector Intelligence',
    desc: 'Cross-sector breakdown across Energy, Agriculture, LULUCF, and more.',
    icon: Layers,
    className: "md:col-span-1 bg-white",
  },
  {
    title: 'Policy Tools',
    desc: 'Scenario modeling to support Ghana\'s NDC commitments and net-zero targets.',
    icon: Scale,
    className: "md:col-span-1 bg-white",
  },
];

const USE_CASES = [
  {
    title: 'Government & Policy',
    desc: 'Track national emission inventories, model policy interventions, and report to UNFCCC and international frameworks.',
    items: ['National NDC reporting', 'Policy scenario modeling', 'Ministerial briefings']
  },
  {
    title: 'Research & Academia',
    desc: 'Access granular datasets for climate research, attribution studies, and peer-reviewed publications.',
    items: ['Historical trend analysis', 'Sector attribution studies', 'Data export & API access']
  },
  {
    title: 'NGOs & Civil Society',
    desc: 'Monitor commitments, track sectoral progress, and build evidence-based advocacy with credible data.',
    items: ['Commitment monitoring', 'Public transparency dashboards', 'Community-level reporting']
  },
  {
    title: 'Industry & Finance',
    desc: 'Benchmark corporate emissions against regional baselines and assess climate risk for investment decisions.',
    items: ['Baseline benchmarking', 'Climate risk assessment', 'ESG & sustainability reporting']
  },
];

const PARTNERS = ['EPA Ghana', 'UNFCCC', 'World Bank', 'UNDP', 'CIMIS', 'University of Ghana'];

export default function Home() {
  const [activeUseCase, setActiveUseCase] = useState(0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>

      {/* ── Navbar ── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/85 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src={logo} alt="NCEL" className="h-8 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Platform</Link>
            <Link href="#capabilities" className="hover:text-gray-900 transition-colors">Capabilities</Link>
            <Link href="#use-cases" className="hover:text-gray-900 transition-colors">Use Cases</Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm font-medium bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all shadow-sm"
            >
              Open Platform
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative h-[calc(100vh-57px)] min-h-[580px] overflow-hidden bg-[#F8FAFC]">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        {/* Soft green radial glow */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.06] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--ncel-primary), transparent 70%)' }} />

        <div className="relative h-full max-w-7xl mx-auto px-6 flex items-center">
          <div className="w-[48%] pr-12 z-10">
            <motion.div initial="hidden" animate="visible" variants={stagger}>

              <motion.h1 variants={fadeUp} className="text-5xl xl:text-6xl font-semibold leading-[1.08] tracking-tighter text-gray-900 mb-6">
                <span className="block text-gray-400 font-light mb-1">Monitor Ghana's</span>
                <span className="bg-gradient-to-r from-brand-500 to-green-400 bg-clip-text text-transparent block pb-1">Greenhouse Gas</span>
                <span className="block">Emissions</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-[1.05rem] text-gray-500 leading-relaxed mb-10 max-w-lg font-light tracking-wide">
                A national climate intelligence platform delivering real-time emissions monitoring,
                AI-powered forecasting, and sector-level analytics to accelerate Ghana's path to net zero.
              </motion.p>

              <motion.div variants={fadeUp} className="flex items-center gap-6 flex-wrap">
                <Link
                  href="/dashboard"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gray-900 text-white font-medium px-8 py-3.5 transition-all hover:-translate-y-0.5 shadow-xl hover:shadow-gray-900/20"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-brand-500 to-brand-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative">Open Platform</span>
                  <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#capabilities"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors"
                >
                  Explore Features
                </Link>
              </motion.div>


            </motion.div>
          </div>
        </div>

        {/* Ghana map on right */}
        <HomeMap />
      </section>

      {/* ── Capabilities ── */}
      <section id="capabilities" className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <SectionReveal>
            <motion.div variants={fadeUp} className="text-center mb-16 max-w-2xl mx-auto">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3 block">Platform Capabilities</span>
              <h2 className="text-4xl font-semibold text-gray-900 mb-5 tracking-tight">Built for climate intelligence</h2>
              <p className="text-gray-500 leading-relaxed">
                A comprehensive suite of tools designed for scientists, policymakers, and analysts working at the frontier of climate action.
              </p>
            </motion.div>
            
            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
              {CAPABILITIES.map((cap, idx) => {
                const Icon = cap.icon;
                const isLarge = cap.className.includes("col-span-2");
                
                return (
                  <motion.div
                    key={cap.title}
                    variants={fadeUp}
                    className={`group relative overflow-hidden rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-100/40 transition-all duration-500 ${cap.className}`}
                  >
                    <div className={`p-8 lg:p-10 h-full flex flex-col ${isLarge ? 'justify-end min-h-[320px]' : 'justify-between min-h-[240px]'}`}>
                      
                      {/* Decorative Background for Large Item */}
                      {isLarge && (
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-700">
                          <Globe size={320} />
                        </div>
                      )}

                      <div className={`w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand-100 transition-all duration-500 ${isLarge ? 'mb-auto' : ''}`}>
                        <Icon className="w-6 h-6 text-brand-500" />
                      </div>
                      
                      <div className="relative z-10">
                        <h3 className={`font-semibold text-gray-900 mb-3 ${isLarge ? 'text-3xl tracking-tight' : 'text-xl'}`}>
                          {cap.title}
                        </h3>
                        <p className={`text-gray-500 leading-relaxed ${isLarge ? 'text-lg max-w-md' : 'text-[0.95rem]'}`}>
                          {cap.desc}
                        </p>
                      </div>
                    </div>
                    
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-brand-500/10 rounded-3xl transition-colors duration-500 pointer-events-none" />
                  </motion.div>
                );
              })}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ── Dark CTA band ── */}
      <section className="py-20 bg-[#0F172A] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-[0.08]"
            style={{ background: 'radial-gradient(circle, var(--ncel-primary), transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, var(--ncel-primary), transparent 70%)' }} />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <SectionReveal>
            <motion.span variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-4 block">
              Interactive Platform
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-white mb-5 tracking-tight">
              See Ghana's emissions landscape
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-400 mb-9 leading-relaxed max-w-2xl mx-auto">
              Explore real-time emissions data, run forecasts, and drill into sector-level insights with our full-featured geospatial intelligence platform.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-3 bg-white text-black font-medium px-8 py-3.5 rounded-full hover:bg-gray-100 transition-all shadow-sm hover:shadow-md"
              >
                Launch Platform <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </SectionReveal>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section id="use-cases" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <SectionReveal>
            <motion.div variants={fadeUp} className="text-left mb-16">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3 block">Who It's For</span>
              <h2 className="text-4xl font-semibold text-gray-900 mb-5 tracking-tight">Designed for every climate stakeholder</h2>
              <p className="text-gray-500 max-w-2xl leading-relaxed">
                From government ministries to research institutions, NCEL serves the full spectrum of climate actors across Ghana.
              </p>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
              {/* Left Column: Navigation Tabs */}
              <div className="w-full lg:w-1/3 flex flex-col gap-4">
                {USE_CASES.map((uc, idx) => {
                  const isActive = activeUseCase === idx;
                  return (
                    <button
                      key={uc.title}
                      onClick={() => setActiveUseCase(idx)}
                      className={`text-left p-6 rounded-2xl transition-all duration-300 border ${
                        isActive
                          ? 'border-brand-500 bg-white shadow-lg shadow-brand-100/50'
                          : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <h3 className={`font-semibold text-xl mb-2 transition-colors duration-300 ${isActive ? 'text-brand-600' : 'text-gray-900'}`}>
                        {uc.title}
                      </h3>
                      <p className={`text-sm transition-colors duration-300 ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                        {isActive ? 'Currently viewing' : 'Click to explore'}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Active Content */}
              <div className="w-full lg:w-2/3 bg-white rounded-3xl p-8 lg:p-12 border border-gray-100 shadow-xl shadow-gray-200/20 relative min-h-[360px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeUseCase}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="h-full flex flex-col justify-center"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-500 mb-6 border border-brand-100">
                      <span className="text-2xl font-bold">{activeUseCase + 1}</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">{USE_CASES[activeUseCase].title}</h3>
                    <p className="text-[1.05rem] text-gray-500 leading-relaxed mb-10 max-w-2xl">
                      {USE_CASES[activeUseCase].desc}
                    </p>
                    
                    <div className="grid sm:grid-cols-2 gap-6">
                      {USE_CASES[activeUseCase].items.map(item => (
                        <div key={item} className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-brand-500" />
                          </div>
                          <span className="text-gray-700 font-medium text-[0.95rem]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ── Partners ── */}
      <section className="py-16 border-t border-gray-100 bg-white">
        <SectionReveal className="max-w-7xl mx-auto px-6 text-center">
          <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-10">
            Trusted by leading climate institutions
          </motion.p>
          <motion.div variants={stagger} className="flex flex-wrap justify-center items-center gap-x-12 gap-y-5">
            {PARTNERS.map((partner, i) => (
              <motion.span
                key={partner}
                variants={fadeUp}
                custom={i}
                className="text-sm font-semibold text-gray-300 hover:text-gray-500 transition-colors tracking-wide cursor-default"
              >
                {partner}
              </motion.span>
            ))}
          </motion.div>
        </SectionReveal>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0A0F1C] text-slate-400 relative overflow-hidden">
        {/* Subtle top glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-24 bg-brand-500/5 blur-[80px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2 pr-8">
              <Image src={logo} alt="NCEL" className="h-9 w-auto mb-6" />
              <p className="text-[0.95rem] leading-relaxed max-w-sm text-slate-400">
                Ghana's national greenhouse gas emissions intelligence platform, delivering actionable climate data for a net-zero future.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-6 uppercase tracking-wider">Platform</h4>
              <ul className="space-y-4 text-sm">
                {['Emissions Map', 'Analytics', 'Forecasting', 'Reports'].map(l => (
                  <li key={l}><Link href="/dashboard" className="text-slate-400 hover:text-brand-400 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-6 uppercase tracking-wider">Organization</h4>
              <ul className="space-y-4 text-sm">
                {['About NCEL', 'Data Sources', 'Methodology', 'Contact'].map(l => (
                  <li key={l}><Link href="#" className="text-slate-400 hover:text-brand-400 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500">© 2024 Net Zero Carbon Emissions Lab. All rights reserved.</p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Ghana · Climate Intelligence
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
