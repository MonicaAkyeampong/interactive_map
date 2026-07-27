'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import MapboxMap, { Source, Layer, Popup, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useStore } from '@/store/useStore';
import { fetchMapData, fetchDistrictMapData } from '@/lib/api';
import { Play, Pause, Plus, Minus, Layers, ChevronDown, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HoverRegionDetails from './RegionPanel';
import DistrictPanel from './DistrictPanel';

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

const EMPTY_GEOJSON: any = { type: 'FeatureCollection', features: [] };

function getComputedColor(val: number, bps: number[]) {
  if (!bps || bps.length < 4) return '#1a9850';
  if (val < bps[0]) return '#1a9850';
  if (val < bps[1]) return '#91cf60';
  if (val < bps[2]) return '#fee08b';
  if (val < bps[3]) return '#fc8d59';
  return '#d73027';
}

export default function Map() {
  const mapRef = useRef<MapRef>(null);

  const {
    year, gas, sector, activeTimelineIndex, isPlaying,
    setActiveTimelineIndex, setIsPlaying, mapMode, setMapMode,
    forecastMode, setForecastMode, searchedRegion, setSearchedRegion
  } = useStore();

  const [geoData, setGeoData] = useState<any>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [clickedRegionInfo, setClickedRegionInfo] = useState<{ feature: any; longitude: number; latitude: number } | null>(null);

  const [districtData, setDistrictData] = useState<any>(null);
  const [nationalDistrictMapData, setNationalDistrictMapData] = useState<Record<string, any> | null>(null);
  const [activeDistrictLayer, setActiveDistrictLayer] = useState<string | null>(null);
  const [isZoomingToRegion, setIsZoomingToRegion] = useState(false);
  const [isDistrictViewActive, setIsDistrictViewActive] = useState(false);
  const [activeDistrict, setActiveDistrict] = useState<{ feature: any; longitude: number; latitude: number } | null>(null);

  const intervals = ['24hrs', '48hrs', '72hrs', '1 week', '1 month'];

  const getCenter = (feature: any) => {
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
    return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
  };

  // Deduplicate district names to avoid repeated labels
  const uniqueDistrictData = useMemo(() => {
    if (!districtData) return null;
    const seen = new Set();
    const newFeatures = districtData.features.map((f: any) => {
      const name = f.properties.DISTRICT;
      if (!name || seen.has(name)) {
        return { ...f, properties: { ...f.properties, DISTRICT: '' } };
      }
      seen.add(name);
      return f;
    });
    return { ...districtData, features: newFeatures };
  }, [districtData]);

  // Create point features for labels so Mapbox only draws one label per MultiPolygon
  const labelData = useMemo(() => {
    if (!uniqueDistrictData) return null;
    const features = uniqueDistrictData.features
      .filter((f: any) => f.properties.DISTRICT)
      .map((f: any) => {
        const center = getCenter(f);
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: center },
          properties: { DISTRICT: f.properties.DISTRICT }
        };
      });
    return { type: 'FeatureCollection', features };
  }, [uniqueDistrictData]);

  // Calculate percentile breakpoints for national districts
  const districtBreakpoints = useMemo(() => {
    if (!nationalDistrictMapData) return null;
    const propertyToRead = gas || 'TOTAL_EMISSIONS';
    
    // Extract values from the national dataset
    let values: number[] = [];
    Object.values(nationalDistrictMapData).forEach((districtObj: any) => {
      let val = 0;
      if (propertyToRead === 'TOTAL_EMISSIONS') {
        Object.keys(GAS_COLORS).forEach(g => {
          if (districtObj[g]) val += districtObj[g];
        });
      } else {
        val = districtObj[propertyToRead] || 0;
      }
      if (val != null && !isNaN(val)) {
        values.push(val);
      }
    });
      
    if (values.length === 0) return null;
    
    values.sort((a: number, b: number) => a - b);
    
    const getQuantile = (q: number) => {
      const pos = (values.length - 1) * q;
      const base = Math.floor(pos);
      const rest = pos - base;
      if (values[base + 1] !== undefined) {
        return values[base] + rest * (values[base + 1] - values[base]);
      } else {
        return values[base];
      }
    };
    
    let bp1 = getQuantile(0.2);
    let bp2 = getQuantile(0.4);
    let bp3 = getQuantile(0.6);
    let bp4 = getQuantile(0.8);
    
    // Mapbox GL JS 'step' expression requires stops to be strictly in ascending order.
    // In case of many identical values, we add a tiny epsilon to ensure strict monotonicity.
    if (bp2 <= bp1) bp2 = bp1 + 0.0001;
    if (bp3 <= bp2) bp3 = bp2 + 0.0001;
    if (bp4 <= bp3) bp4 = bp3 + 0.0001;
    
    return [bp1, bp2, bp3, bp4];
  }, [nationalDistrictMapData, gas]);

  const districtFillColor = useMemo(() => {
    if (!districtBreakpoints) {
      return ['step', ['get', gas || 'TOTAL_EMISSIONS'],
        '#1a9850',
        50, '#91cf60',
        150, '#fee08b',
        300, '#fc8d59',
        600, '#d73027'
      ];
    }
    return ['step', ['get', gas || 'TOTAL_EMISSIONS'],
      '#1a9850',
      districtBreakpoints[0], '#91cf60',
      districtBreakpoints[1], '#fee08b',
      districtBreakpoints[2], '#fc8d59',
      districtBreakpoints[3], '#d73027'
    ];
  }, [districtBreakpoints, gas]);

  const [viewState, setViewState] = useState({
    longitude: -1.0232,
    latitude: 7.9465,
    zoom: 6.5,
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

  const zoomToRegion = useCallback((feature: any) => {
    const [centerLng, centerLat] = getCenter(feature);
    
    // Calculate bounds for fitBounds
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
    
    setIsZoomingToRegion(true);
    setTimeout(() => setIsZoomingToRegion(false), 1600);
    
    if (mapRef.current) {
      mapRef.current.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat]
        ],
        { padding: 40, duration: 1500 }
      );
    } else {
      setViewState(prev => ({
        ...prev,
        longitude: centerLng,
        latitude: centerLat,
        zoom: 7.5,
        transitionDuration: 1500
      }));
    }
    
    setClickedRegionInfo({ feature, longitude: centerLng, latitude: centerLat });

    const regionName = feature.properties.REGION || feature.properties.name || '';
    if (regionName) {
      const safeRegionName = regionName.toLowerCase().replace(/ /g, '_').replace(/\//g, '_');
      
      Promise.all([
        fetch(`/districts_${safeRegionName}.geojson`).then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        }),
        fetchDistrictMapData(year && !isNaN(Number(year)) ? Number(year) : undefined, sector || undefined, regionName)
      ])
      .then(([geoData, distMapData]) => {
        const normalizeName = (name: string) => name.toLowerCase().replace(/\s*(district|municipal|metropolitan|assembly)\s*/gi, '').trim();
        const mapDataNormalized = Object.fromEntries(
          Object.entries(distMapData).map(([k, v]) => [normalizeName(k), { originalName: k, ...v }])
        );
        geoData.features.forEach((f: any) => {
          const name = normalizeName(f.properties.DISTRICT || f.properties.name || '');
          let bd = mapDataNormalized[name];
          if (!bd) {
            // Fuzzy match fallback
            const foundKey = Object.keys(mapDataNormalized).find(k => k.includes(name) || name.includes(k));
            bd = foundKey ? mapDataNormalized[foundKey] : {};
          }
          if (bd.originalName) {
            f.properties.DISTRICT = bd.originalName;
          }
          let total = 0;
          Object.keys(GAS_COLORS).forEach(g => {
            const val = bd[g] ? bd[g] : 0;
            f.properties[g] = val;
            total += val;
          });
          f.properties.TOTAL_EMISSIONS = total;
          f.properties.dominant_gas = bd.dominant_gas !== 'None' ? bd.dominant_gas : 'CO2';
        });
        setDistrictData(geoData);
        setActiveDistrictLayer(regionName);
      })
      .catch(e => console.error(e));
    }
  }, [year, sector]);

  useEffect(() => {
    if (activeDistrictLayer && viewState.zoom < 6.8 && !isZoomingToRegion) {
      setActiveDistrictLayer(null);
      setClickedRegionInfo(null);
      setIsDistrictViewActive(false);
      setActiveDistrict(null);
    }
  }, [viewState.zoom, activeDistrictLayer, isZoomingToRegion]);

  useEffect(() => {
    if (!searchedRegion || !geoData) return;
    
    const feature = geoData.features.find((f: any) => 
      (f.properties.REGION || f.properties.name || '').toLowerCase() === searchedRegion.toLowerCase()
    );
    
    if (feature) {
      zoomToRegion(feature);
      setSearchedRegion(null);
    }
  }, [searchedRegion, geoData, setSearchedRegion, zoomToRegion]);

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
          let total = 0;
          Object.keys(GAS_COLORS).forEach(g => {
            const val = bd[g] ? bd[g] : 0;
            f.properties[g] = val;
            total += val;
          });
          f.properties.TOTAL_EMISSIONS = total;
          f.properties.dominant_gas = bd.dominant_gas !== 'None' ? bd.dominant_gas : 'CO2';
        });

        setGeoData(geoRes);
      } catch (err) {
        console.error('Failed to load map data', err);
      }
    }
    loadData();
  }, [year, sector]);

  useEffect(() => {
    async function loadNationalDistrictData() {
      try {
        const y = year && !isNaN(Number(year)) ? Number(year) : undefined;
        const data = await fetchDistrictMapData(y, sector || undefined);
        setNationalDistrictMapData(data);
      } catch (err) {
        console.error('Failed to load national district data', err);
      }
    }
    loadNationalDistrictData();
  }, [year, sector]);

  const fillStyle: any = {
    id: 'regions-fill',
    type: 'fill',
    paint: {
      'fill-color': ['step', ['get', gas || 'TOTAL_EMISSIONS'],
        '#31A354', // Dark green: < 1482
        1482, '#A1D99B', // Light green: 1482 - 2985
        2985, '#FEE08B', // Yellow: 2985 - 4478
        4478, '#FDAE61', // Orange: 4478 - 7463
        7463, '#D73027' // Red: > 7463
      ],
      'fill-opacity': isDistrictViewActive ? 0.05 : 0.72,
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
    const { features } = event;
    const f = features?.[0];
    
    if (event.features && event.features.length > 0 && event.features[0].source === 'ghana-districts') {
        return;
    }

    if (f && f.source === 'ghana-regions') {
      zoomToRegion(f);
    } else if (!activeDistrictLayer) {
      setClickedRegionInfo(null);
    }
  }, [zoomToRegion, activeDistrictLayer]);

  const onMouseMove = useCallback((event: any) => {
    const { features } = event;
    const f = features?.[0];
    
    if (f && f.source === 'ghana-districts' && isDistrictViewActive) {
      setActiveDistrict(prev => {
        if (prev?.feature?.properties?.DISTRICT === f.properties.DISTRICT) {
          return prev;
        }
        return {
          feature: f,
          longitude: event.lngLat.lng,
          latitude: event.lngLat.lat
        };
      });
    } else {
      setActiveDistrict(prev => prev ? null : prev);
    }
  }, [isDistrictViewActive]);

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
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setActiveDistrict(null)}
        interactiveLayerIds={['regions-fill', 'districts-fill']}
        cursor="pointer"
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        maxBounds={[[-9.0, 1.0], [7.0, 15.0]]}
        minZoom={6.2}
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
                  'line-color': '#ffffff',
                  'line-width': 4,
                }}
                filter={['==', ['get', 'REGION'], clickedRegionInfo.feature.properties.REGION]}
              />
            )}
          </Source>
        )}

        <Source 
          id="ghana-districts" 
          type="geojson" 
          data={activeDistrictLayer ? (uniqueDistrictData || EMPTY_GEOJSON) : EMPTY_GEOJSON}
        >
          <Layer 
            id="districts-fill"
            type="fill"
            paint={{
              'fill-color': districtFillColor as any,
              'fill-opacity': 0.7
            }}
            layout={{
              visibility: isDistrictViewActive ? 'visible' : 'none'
            }}
          />
          <Layer 
            id="districts-line"
            type="line"
            paint={{
              'line-color': '#ffffff',
              'line-width': 2,
              'line-opacity': 0.8
            }}
            layout={{
              visibility: isDistrictViewActive ? 'visible' : 'none'
            }}
          />
        </Source>

        <Source 
          id="ghana-districts-labels-source" 
          type="geojson" 
          data={activeDistrictLayer ? (labelData || EMPTY_GEOJSON) : EMPTY_GEOJSON}
        >
          <Layer 
            id="districts-label"
            type="symbol"
            layout={{
              'text-field': ['get', 'DISTRICT'],
              'text-size': 13,
              'text-anchor': 'center',
              'text-allow-overlap': true,
              visibility: isDistrictViewActive ? 'visible' : 'none'
            }}
            paint={{
              'text-color': 'rgba(255, 255, 255, 0.95)',
              'text-halo-color': 'rgba(0,0,0,0.8)',
              'text-halo-width': 2
            }}
          />
        </Source>

        <AnimatePresence>
          {/* Region side panel moved outside MapboxMap */}

          {activeDistrict?.feature && (
            <Popup
              key="district-popup"
              longitude={activeDistrict.longitude}
              latitude={activeDistrict.latitude}
              closeButton={true}
              closeOnClick={false}
              onClose={() => setActiveDistrict(null)}
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
                <DistrictPanel 
                  districtName={activeDistrict.feature.properties.DISTRICT || activeDistrict.feature.properties.name || 'District'} 
                  mapColor={getComputedColor(activeDistrict.feature.properties[gas || 'TOTAL_EMISSIONS'] || 0, districtBreakpoints || [])}
                />
              </motion.div>
            </Popup>
          )}
        </AnimatePresence>
      </MapboxMap>

      <AnimatePresence>
        {clickedRegionInfo?.feature && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-6 right-6 z-20 w-[300px] shadow-2xl rounded-2xl overflow-hidden bg-white/97 backdrop-blur-md border border-gray-100"
          >
            {/* Header with Back button */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/80">
              <button 
                onClick={() => {
                  setActiveDistrictLayer(null);
                  setClickedRegionInfo(null);
                  setIsDistrictViewActive(false);
                  setActiveDistrict(null);
                  setViewState((prev: any) => ({
                    ...prev,
                    longitude: -1.0232,
                    latitude: 7.9465,
                    zoom: 5.5,
                    transitionDuration: 1500
                  }));
                }}
                className="text-xs font-bold text-gray-500 hover:text-brand-600 flex items-center gap-1.5 transition-colors bg-white px-2.5 py-1.5 rounded-lg shadow-sm border border-gray-100"
              >
                <span>←</span> Back to National
              </button>
            </div>
            <div className="p-1">
              <HoverRegionDetails 
                regionName={clickedRegionInfo.feature.properties.REGION || clickedRegionInfo.feature.properties.name || 'Region'} 
                isDistrictViewActive={isDistrictViewActive}
                onToggleDistrictView={setIsDistrictViewActive}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <p className="text-[10px] text-gray-400 font-medium mb-3 uppercase tracking-wider">
                  {gas ? `${gas} Emission Level` : 'Total Emission Level'}
                </p>
                <div className="flex flex-col gap-2">
                  {(() => {
                    const isPerCapita = false; // Toggle left out for now
                    const unitLabel = isPerCapita ? 't CO₂e/capita/yr' : 'kt CO₂e/yr';
                    const formatNum = (n: number) => {
                      if (n < 1) return n.toFixed(2);
                      if (n < 10) return n.toFixed(1);
                      return Math.round(n).toLocaleString();
                    };
                    
                    const tiers = isPerCapita 
                      ? [
                          { range: '< 0.72', color: '#1a9850' },
                          { range: '0.72 – 1.43', color: '#91cf60' },
                          { range: '1.43 – 2.15', color: '#fee08b' },
                          { range: '2.15 – 3.58', color: '#fc8d59' },
                          { range: '> 3.58', color: '#d73027' },
                        ]
                      : isDistrictViewActive
                      ? (districtBreakpoints ? [
                          { range: `< ${formatNum(districtBreakpoints[0])}`, color: '#1a9850' },
                          { range: `${formatNum(districtBreakpoints[0])} – ${formatNum(districtBreakpoints[1])}`, color: '#91cf60' },
                          { range: `${formatNum(districtBreakpoints[1])} – ${formatNum(districtBreakpoints[2])}`, color: '#fee08b' },
                          { range: `${formatNum(districtBreakpoints[2])} – ${formatNum(districtBreakpoints[3])}`, color: '#fc8d59' },
                          { range: `> ${formatNum(districtBreakpoints[3])}`, color: '#d73027' },
                        ] : [
                          { range: '< 50', color: '#1a9850' },
                          { range: '50 – 150', color: '#91cf60' },
                          { range: '150 – 300', color: '#fee08b' },
                          { range: '300 – 600', color: '#fc8d59' },
                          { range: '> 600', color: '#d73027' },
                        ])
                      : [
                          { range: '< 1,493', color: '#1a9850' },
                          { range: '1,493 – 2,985', color: '#91cf60' },
                          { range: '2,985 – 4,478', color: '#fee08b' },
                          { range: '4,478 – 7,463', color: '#fc8d59' },
                          { range: '> 7,463', color: '#d73027' },
                        ];

                    return tiers.map((tier, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-sm flex-shrink-0 shadow-sm border border-black/5" style={{ backgroundColor: tier.color }} />
                        <span className="text-[11px] text-gray-700 font-medium">
                          {tier.range} <span className="text-gray-400 text-[10px] ml-0.5">{unitLabel}</span>
                        </span>
                      </div>
                    ));
                  })()}
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
