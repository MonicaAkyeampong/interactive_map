'use client';

import { useState, useEffect, useCallback } from 'react';
import MapboxMap, { Source, Layer, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useStore } from '@/store/useStore';
import { fetchMapData } from '@/lib/api';
import { Play, Pause, Plus, Minus, Layers, ChevronDown, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HoverRegionDetails from './RegionPanel';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const GAS_COLORS: Record<string, string> = {
  CO2: '#3b82f6',
  N2O: '#a855f7',
  CH4: '#f97316',
  SF6: '#eab308',
  CFC: '#06b6d4',
  PFC: '#f43f5e',
  HFC: '#84cc16',
};

const GAS_LABELS: Record<string, string> = {
  CO2: 'Carbon Dioxide',
  N2O: 'Nitrous Oxide',
  CH4: 'Methane',
  SF6: 'Sulfur Hexafluoride',
  CFC: 'Chlorofluorocarbon',
  PFC: 'Perfluorocarbon',
  HFC: 'Hydrofluorocarbon',
};

export default function Map() {
  const {
    year, gas, sector, activeTimelineIndex, isPlaying,
    setActiveTimelineIndex, setIsPlaying, mapMode, setMapMode,
    forecastMode, setForecastMode, searchedRegion, setSearchedRegion
  } = useStore();

  const [geoData, setGeoData] = useState<any>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [clickedRegionInfo, setClickedRegionInfo] = useState<{ feature: any; longitude: number; latitude: number } | null>(null);

  const intervals = ['24hrs', '48hrs', '72hrs', '1 week', '1 month'];

  const [viewState, setViewState] = useState({
    longitude: -1.0232,
    latitude: 7.9465,
    zoom: 5.5,
  });

  useEffect(() => {
    let id: NodeJS.Timeout;
    if (isPlaying) {
      id = setInterval(() => {
        setActiveTimelineIndex((activeTimelineIndex + 1) % intervals.length);
      }, 2000);
    }
    return () => clearInterval(id);
  }, [isPlaying, setActiveTimelineIndex, intervals.length, activeTimelineIndex]);

  useEffect(() => {
    if (!searchedRegion || !geoData) return;
    
    const feature = geoData.features.find((f: any) => 
      (f.properties.REGION || f.properties.name || '').toLowerCase() === searchedRegion.toLowerCase()
    );
    
    if (feature) {
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      const coords = feature.geometry.type === 'MultiPolygon' 
        ? feature.geometry.coordinates.flat(2) 
        : feature.geometry.coordinates.flat(1);
        
      coords.forEach(([lng, lat]: number[]) => {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });
      
      const centerLng = (minLng + maxLng) / 2;
      const centerLat = (minLat + maxLat) / 2;
      
      setViewState(prev => ({
        ...prev,
        longitude: centerLng,
        latitude: centerLat,
        zoom: 7.5,
        transitionDuration: 1500
      }));
      
      setClickedRegionInfo({ feature, longitude: centerLng, latitude: centerLat });
      setSearchedRegion(null);
    }
  }, [searchedRegion, geoData, setSearchedRegion]);

  useEffect(() => {
    async function loadData() {
      try {
        const y = year && !isNaN(Number(year)) ? Number(year) : undefined;
        const [geoRes, mapData] = await Promise.all([
          fetch('/ghana.geojson').then(r => r.json()),
          fetchMapData(y, sector || undefined),
        ]);

        const mapDataLower = Object.fromEntries(
          Object.entries(mapData).map(([k, v]) => [k.toLowerCase(), v])
        );

        geoRes.features.forEach((f: any) => {
          const name = (f.properties.REGION || f.properties.name || '').toLowerCase();
          const bd = mapDataLower[name] || {};
          Object.keys(GAS_COLORS).forEach(g => {
            f.properties[g] = bd[g] ? bd[g] : 0;
          });
          f.properties.dominant_gas = bd.dominant_gas !== 'None' ? bd.dominant_gas : 'CO2';
        });

        setGeoData(geoRes);
      } catch (err) {
        console.error('Failed to load map data', err);
      }
    }
    loadData();
  }, [year, sector]);

  const fillStyle: any = {
    id: 'regions-fill',
    type: 'fill',
    paint: {
      'fill-color': ['interpolate', ['linear'], ['get', gas || 'CO2'],
        0, '#31A354',      // Very low: green
        2000, '#FFEDA0',   // Low: pale yellow
        4000, '#FD8D3C',   // Moderate: orange
        8000, '#E31A1C',   // High: red
        20000, '#800026'], // Very high: deep red
      'fill-opacity': 0.72,
    },
  };

  const lineStyle: any = {
    id: 'regions-line',
    type: 'line',
    paint: {
      'line-color': '#ffffff',
      'line-opacity': 0.6,
      'line-width': 1,
    },
  };

  const onClick = useCallback((event: any) => {
    const { features, lngLat } = event;
    const f = features?.[0];
    if (f) {
      setClickedRegionInfo({ feature: f, longitude: lngLat.lng, latitude: lngLat.lat });
    } else {
      setClickedRegionInfo(null);
    }
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 flex-col gap-4 z-50">
        <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center border border-brand-200">
          <Layers className="w-6 h-6 text-brand-600" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Mapbox Token Required</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Add your token to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code> as{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <MapboxMap
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={onClick}
        interactiveLayerIds={['regions-fill']}
        cursor="pointer"
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {geoData && (
          <Source id="ghana-regions" type="geojson" data={geoData}>
            <Layer {...fillStyle} />
            <Layer {...lineStyle} />
            {clickedRegionInfo?.feature && (
              <Layer
                id="region-highlight"
                type="line"
                paint={{
                  'line-color': '#1DB978',
                  'line-width': 3,
                }}
                filter={['==', ['get', 'REGION'], clickedRegionInfo.feature.properties.REGION]}
              />
            )}
          </Source>
        )}

        <AnimatePresence>
          {clickedRegionInfo?.feature && (
            <Popup
              longitude={clickedRegionInfo.longitude}
              latitude={clickedRegionInfo.latitude}
              closeButton={true}
              closeOnClick={false}
              onClose={() => setClickedRegionInfo(null)}
              offset={12}
              className="z-50 !p-0 shadow-xl rounded-xl custom-popup"
              maxWidth="300px"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <HoverRegionDetails regionName={clickedRegionInfo.feature.properties.REGION || clickedRegionInfo.feature.properties.name || 'Region'} />
              </motion.div>
            </Popup>
          )}
        </AnimatePresence>
      </MapboxMap>

      {/* ── Zoom Controls ── */}
      <div className="absolute right-6 bottom-6 flex flex-col gap-1.5 z-10">
        <button
          onClick={() => setViewState(p => ({ ...p, zoom: Math.min(p.zoom + 1, 18) }))}
          className="w-9 h-9 bg-white/97 backdrop-blur-sm text-gray-700 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-center hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewState(p => ({ ...p, zoom: Math.max(p.zoom - 1, 1) }))}
          className="w-9 h-9 bg-white/97 backdrop-blur-sm text-gray-700 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-center hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* ── Legend Container ── */}
      <div className="absolute bottom-6 right-20 z-10 flex items-end gap-3">
        
        {/* How to Use Button */}
        <button
          onClick={() => setIsHowToOpen(true)}
          className="bg-white/97 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.13)] border border-gray-100 p-3 hover:bg-gray-50/80 transition-colors flex items-center justify-center h-11"
          title="How to use the map"
        >
          <HelpCircle className="w-5 h-5 text-gray-500 hover:text-brand-600 transition-colors" />
        </button>

        {/* Legend */}
        <div className="bg-white/97 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.13)] border border-gray-100 overflow-hidden min-w-[200px]">
          <button
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50/80 transition-colors border-b border-gray-50 h-11"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-semibold text-gray-700">Map Legend</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isLegendOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLegendOpen && (
            <div>
              <div className="px-4 py-3">
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-2">
                    {gas ? `${gas} Emission Level` : 'Total Emission Level'}
                  </p>
                  <div className="h-2.5 w-full rounded-full" style={{ background: 'linear-gradient(to right, #31A354, #FFEDA0, #FD8D3C, #E31A1C, #800026)' }} />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 font-medium">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 bg-white/97 backdrop-blur-xl px-3 py-2 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100">
          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-sm ${
              isPlaying
                ? 'bg-gray-800 text-white hover:bg-gray-900'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <div className="w-px h-5 bg-gray-100" />

          {/* Forecast mode */}
          <div className="flex items-center bg-gray-50 rounded-xl p-0.5 flex-shrink-0">
            {(['Future Forecasts', 'Past Forecasts'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setForecastMode(mode)}
                className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  forecastMode === mode
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {mode === 'Future Forecasts' ? 'FUTURE' : 'PAST'}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-100" />

          {/* Interval pills */}
          <div className="flex items-center gap-1">
            {intervals.map((iv, idx) => (
              <button
                key={iv}
                onClick={() => { setActiveTimelineIndex(idx); setIsPlaying(false); }}
                className={`px-3 h-7 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                  idx === activeTimelineIndex
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-200'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {iv}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* ── Zoom Controls ── */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
        {/* unchanged zoom controls inside Map.tsx if they exist, but actually looking at the original it was just standard Mapbox zoom controls or none. Wait, let me just add the How To Modal at the very end of Map.tsx */}
      </div>

      {/* ── How To Use Modal ── */}
      <AnimatePresence>
        {isHowToOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
            onClick={() => setIsHowToOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-brand-600" />
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">How to use the Map</h2>
                </div>
                <button
                  onClick={() => setIsHowToOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 text-gray-600 space-y-8">
                
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-black">1</span>
                    Filtering Data
                  </h3>
                  <p className="text-sm leading-relaxed pl-8 text-gray-500">
                    Use the top navigation bar to filter data by <strong>Year</strong>, <strong>Gas Type</strong> (like CO₂, CH₄), or <strong>Sector</strong> (like Energy, Agriculture). The map will dynamically update the heatmap colors to reflect your selection.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-black">2</span>
                    Exploring Regions
                  </h3>
                  <p className="text-sm leading-relaxed pl-8 text-gray-500">
                    <strong>Hover</strong> over any region to see a quick summary of its total emissions and dominant sources. <strong>Click</strong> on a region to lock the popup in place. You can also use the <strong>search bar</strong> at the top right to instantly zoom into any region by name.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-black">3</span>
                    Timeline Controls
                  </h3>
                  <p className="text-sm leading-relaxed pl-8 text-gray-500">
                    At the bottom center, you can use the <strong>Play</strong> button to animate the map through time and observe how emissions evolve over the years. You can toggle the data view between historical records and future projections using the tabs.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button 
                    onClick={() => setIsHowToOpen(false)}
                    className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
