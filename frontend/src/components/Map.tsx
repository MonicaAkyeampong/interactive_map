'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import MapboxMap, { Source, Layer, Popup, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useStore } from '@/store/useStore';
import { fetchMapData, fetchDistrictMapData } from '@/lib/api';
import { DEFAULT_YEAR } from '@/lib/constants';
import { getRegionalShades, getRegionalFillColorExpression, GAS_PALETTES } from '@/lib/colorUtils';
import { Play, Pause, Plus, Minus, Layers, ChevronDown, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HoverRegionDetails from './RegionPanel';
import DistrictPanel from './DistrictPanel';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const GAS_COLORS: Record<string, string> = {
  CO2: GAS_PALETTES.CO2.hexPrimary,
  CH4: GAS_PALETTES.CH4.hexPrimary,
  N2O: GAS_PALETTES.N2O.hexPrimary,
  HFC: GAS_PALETTES.HFC.hexPrimary,
  SF6: GAS_PALETTES.SF6.hexPrimary,
  CFC: GAS_PALETTES.CFC.hexPrimary,
  PFC: GAS_PALETTES.PFC.hexPrimary,
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

const DISTRICT_ALIAS_MAP: Record<string, string> = {
  'mfantseman': 'Mfantsiman Municipal',
  'adansi akrofuom': 'Adansi South District',
  'atwima-mponua': 'Atwima Nwabiagya Municipal',
  'sekyere afram plains north': 'Sekyere Central District',
  'tano south': 'Tano North Municipal',
  'akyemansa': 'Asene Manso Akroso District',
  'okere': 'Akuapem North Municipal',
  'keta municipal': 'Anloga District',
  'kpando': 'South Dayi District',
  'north dayi': 'South Dayi District',
  'adenta': 'Ga East Municipal',
  'ashaiman': 'Tema Metropolitan',
  'korle-klottey': 'Accra Metropolitan',
  'krowor': 'Ledzokuku Municipal',
  'la-dade-kotopon': 'Accra Metropolitan',
  'ningo-prampram': 'Kpone Katamanso Municipal',
  'okaikwei north': 'Accra Metropolitan',
  'shai osudoku': 'Kpone Katamanso Municipal',
  'weija gbawe': 'Ga South Municipal',
  'ada east': 'Ga East Municipal',
  'ada west': 'Ga West Municipal',
  'ga north': 'Ga West Municipal',
  'tema west': 'Tema Metropolitan',
  'sagnerigu': 'Sagnarigu Municipal',
  'east mamprusi': 'Nalerigu-Gambaga (East Mamprusi) Municipal',
  'west mamprusi': 'Walewale (West Mamprusi) Municipal',
  'west gonja': 'Damongo (West Gonja) Municipal',
  'new juaben south': 'Koforidua (New Juaben South) Municipal',
  'new juaben north': 'New Juaben North Municipal',
  'krachi east': 'Dambai (Krachi East) Municipal',
  'bunkpurugu nakpanduri': 'Bunkpurugu-Nyankpala District',
  'kasena nankana east': 'Kassena-Nankana Municipal',
  'kasena nankana west': 'Kassena-Nankana West District',
  'afadzato south': 'Afadjato South District',
  'juaboso': 'Juabeso District',
  'akwapem south': 'Akuapem South District',
  'akwapem north': 'Akuapem North Municipal',
  'lambussie-karni': 'Lambussie District',
  'dormaa': 'Dormaa Central Municipal',
  'kwaebibirem': 'Kwaebibirem Municipal',
  'juaben': 'Juaben Municipal',
  'atwima-nwabiagya south': 'Atwima Nwabiagya Municipal',
  'bolga east': 'Bolgatanga East District',
  'asikuma-odoben-brakwa': 'Asikuma Odoben Brakwa District',
  'obuasi east': 'Obuasi East District',
  'upper manya': 'Upper Manya Krobo District'
};

const EMPTY_GEOJSON: any = { type: 'FeatureCollection', features: [] };
const geoJsonCache: Record<string, any> = {};

function getComputedColor(val: number, bps: number[]) {
  if (!bps || bps.length < 6) bps = [140, 220, 390, 830, 1500, 3000];
  if (val <= bps[0]) return '#1a9850'; // Very Low
  if (val <= bps[1]) return '#66bd63'; // Low
  if (val <= bps[2]) return '#d9ef8b'; // Moderate
  if (val <= bps[3]) return '#fee08b'; // High
  if (val <= bps[4]) return '#fdae61'; // Very High
  if (val <= bps[5]) return '#f46d43'; // Severe
  return '#d73027';                    // Extreme Hotspot
}

export default function Map() {
  const mapRef = useRef<MapRef>(null);

  const {
    year, gas, sector, activeTimelineIndex, isPlaying,
    setActiveTimelineIndex, setIsPlaying, mapMode, setMapMode,
    forecastMode, setForecastMode, searchedRegion, setSearchedRegion,
    isDistrictViewActive, setIsDistrictViewActive
  } = useStore();

  const [geoData, setGeoData] = useState<any>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [clickedRegionInfo, setClickedRegionInfo] = useState<{ feature: any; longitude: number; latitude: number } | null>(null);

  const [districtData, setDistrictData] = useState<any>(null);
  const [nationalDistrictMapData, setNationalDistrictMapData] = useState<Record<string, any> | null>(null);
  const [activeDistrictLayer, setActiveDistrictLayer] = useState<string | null>(null);
  const [isZoomingToRegion, setIsZoomingToRegion] = useState(false);
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

  // Create point features for labels so Mapbox only draws one label per MultiPolygon
  const labelData = useMemo(() => {
    if (!districtData) return null;
    const seen = new Set();
    const features: any[] = [];
    
    districtData.features.forEach((f: any) => {
      const name = f.properties.DISTRICT;
      if (name && !seen.has(name)) {
        seen.add(name);
        const center = getCenter(f);
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: center },
          properties: { DISTRICT: name }
        });
      }
    });
    return { type: 'FeatureCollection', features };
  }, [districtData]);

  // Derive latest feature properties for active district from updated districtData state
  const currentDistrictFeature = useMemo(() => {
    if (!activeDistrict || !districtData) return null;
    const name = activeDistrict.feature.properties.DISTRICT || activeDistrict.feature.properties.name;
    return districtData.features.find((f: any) => 
      (f.properties.DISTRICT || f.properties.name) === name
    ) || activeDistrict.feature;
  }, [activeDistrict, districtData]);

  // Jenks Natural Breaks classification for District layer
  const districtBreakpoints = useMemo(() => {
    return [140, 220, 390, 830, 1500, 3000];
  }, []);

  const districtFillColor = useMemo(() => {
    const bps = districtBreakpoints;
    return ['step', ['get', gas || 'TOTAL_EMISSIONS'],
      '#1a9850',         // Very Low (<= P20: <= 108 kt)
      bps[0], '#66bd63', // Low (P20 - P40: 108 - 133 kt)
      bps[1], '#d9ef8b', // Moderate (P40 - P60: 133 - 167 kt)
      bps[2], '#fee08b', // High (P60 - P80: 167 - 229 kt)
      bps[3], '#fdae61', // Very High (P80 - P95: 229 - 395 kt)
      bps[4], '#f46d43', // Severe (P95 - P99: 395 - 1,009 kt)
      bps[5], '#d73027'  // Extreme Hotspot (> P99: > 1,009 kt)
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
      setActiveDistrictLayer(regionName);
      setIsDistrictViewActive(true);
    }
  }, [year, sector]);

  // Re-fetch district map data whenever region, year, or sector filter changes
  useEffect(() => {
    if (!activeDistrictLayer) return;

    const safeRegionName = activeDistrictLayer.toLowerCase().replace(/ /g, '_').replace(/\//g, '_');
    const y = year && !isNaN(Number(year)) ? Number(year) : DEFAULT_YEAR;

    async function updateDistrictData() {
      try {
        let rawGeoData = geoJsonCache[safeRegionName];
        if (!rawGeoData) {
          const res = await fetch(`/districts_${safeRegionName}.geojson`);
          if (!res.ok) throw new Error('Not found');
          rawGeoData = await res.json();
          geoJsonCache[safeRegionName] = rawGeoData;
        }

        const distMapData = await fetchDistrictMapData(y, sector || undefined, activeDistrictLayer || undefined);
        const cleanStr = (s: string) => s.toLowerCase().replace(/\s*(district|municipal|metropolitan|assembly)\s*/gi, '').replace(/[^a-z0-9]/g, '').trim();
        
        const mapDataNormalized = Object.fromEntries(
          Object.entries(distMapData).map(([k, v]) => [cleanStr(k), { originalName: k, ...v }])
        );

        const updatedFeatures = rawGeoData.features.map((f: any) => {
          const rawName = String(f.properties.DISTRICT || f.properties.name || '').trim();
          const mappedName = DISTRICT_ALIAS_MAP[rawName.toLowerCase()] || rawName;
          const key = cleanStr(mappedName);

          let bd = mapDataNormalized[key];
          if (!bd) {
            const foundKey = Object.keys(mapDataNormalized).find(k => k.includes(key) || key.includes(k));
            bd = foundKey ? mapDataNormalized[foundKey] : {};
          }

          let total = bd.TOTAL_EMISSIONS !== undefined ? bd.TOTAL_EMISSIONS : 0;
          const props: any = {
            ...f.properties,
            DISTRICT: bd.originalName || f.properties.DISTRICT || rawName,
            TOTAL_EMISSIONS: total,
            dominant_gas: bd.dominant_gas && bd.dominant_gas !== 'None' ? bd.dominant_gas : 'CO2'
          };
          Object.keys(GAS_COLORS).forEach(g => {
            props[g] = bd[g] ? bd[g] : 0;
          });
          return {
            ...f,
            properties: props
          };
        });

        setDistrictData({
          type: 'FeatureCollection',
          features: updatedFeatures
        });
      } catch (e) {
        console.error('Failed to update district data on filter change', e);
      }
    }

    updateDistrictData();
  }, [activeDistrictLayer, year, sector]);

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
        const y = year && !isNaN(Number(year)) ? Number(year) : DEFAULT_YEAR;
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
        const y = year && !isNaN(Number(year)) ? Number(year) : DEFAULT_YEAR;
        const data = await fetchDistrictMapData(y, sector || undefined);
        setNationalDistrictMapData(data);
      } catch (err) {
        console.error('Failed to load national district data', err);
      }
    }
    loadNationalDistrictData();
  }, [year, sector]);

  const fillStyle: any = useMemo(() => ({
    id: 'regions-fill',
    type: 'fill',
    paint: {
      'fill-color': getRegionalFillColorExpression(gas),
      'fill-opacity': isDistrictViewActive ? 0.05 : 0.72,
    },
  }), [gas, isDistrictViewActive]);

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
    const distFeature = features?.find((feat: any) => feat.source === 'ghana-districts');
    
    if (distFeature && isDistrictViewActive) {
      setActiveDistrict({
        feature: distFeature,
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat
      });
      return;
    }

    const regFeature = features?.find((feat: any) => feat.source === 'ghana-regions');
    if (regFeature) {
      zoomToRegion(regFeature);
    } else if (!activeDistrictLayer) {
      setClickedRegionInfo(null);
      setActiveDistrict(null);
    }
  }, [zoomToRegion, activeDistrictLayer, isDistrictViewActive]);

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
          data={activeDistrictLayer ? (districtData || EMPTY_GEOJSON) : EMPTY_GEOJSON}
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
          {activeDistrict?.feature && (
            <Layer 
              id="district-highlight"
              type="line"
              paint={{
                'line-color': '#059669',
                'line-width': 4,
              }}
              filter={['==', ['get', 'DISTRICT'], activeDistrict.feature.properties.DISTRICT]}
              layout={{
                visibility: isDistrictViewActive ? 'visible' : 'none'
              }}
            />
          )}
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
                  districtName={currentDistrictFeature?.properties.DISTRICT || currentDistrictFeature?.properties.name || activeDistrict.feature.properties.DISTRICT || 'District'} 
                  mapColor={getComputedColor(currentDistrictFeature?.properties[gas || 'TOTAL_EMISSIONS'] || 0, districtBreakpoints || [])}
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
                    
                    const tiers: { name?: string; range: string; color: string }[] = isPerCapita 
                      ? [
                          { name: 'Very Low', range: '< 0.72', color: '#1a9850' },
                          { name: 'Low', range: '0.72 – 1.43', color: '#66bd63' },
                          { name: 'Moderate', range: '1.43 – 2.15', color: '#d9ef8b' },
                          { name: 'High', range: '2.15 – 3.58', color: '#fee08b' },
                          { name: 'Extreme Hotspot', range: '> 3.58', color: '#d73027' },
                        ]
                      : isDistrictViewActive
                      ? (districtBreakpoints ? [
                          { name: 'Very Low', range: `≤ ${formatNum(districtBreakpoints[0])}`, color: '#1a9850' },
                          { name: 'Low', range: `${formatNum(districtBreakpoints[0])} – ${formatNum(districtBreakpoints[1])}`, color: '#66bd63' },
                          { name: 'Moderate', range: `${formatNum(districtBreakpoints[1])} – ${formatNum(districtBreakpoints[2])}`, color: '#d9ef8b' },
                          { name: 'High', range: `${formatNum(districtBreakpoints[2])} – ${formatNum(districtBreakpoints[3])}`, color: '#fee08b' },
                          { name: 'Very High', range: `${formatNum(districtBreakpoints[3])} – ${formatNum(districtBreakpoints[4])}`, color: '#fdae61' },
                          { name: 'Severe', range: `${formatNum(districtBreakpoints[4])} – ${formatNum(districtBreakpoints[5])}`, color: '#f46d43' },
                          { name: 'Extreme Hotspot', range: `> ${formatNum(districtBreakpoints[5])}`, color: '#d73027' },
                        ] : [
                          { name: 'Very Low', range: '≤ 140', color: '#1a9850' },
                          { name: 'Low', range: '140 – 220', color: '#66bd63' },
                          { name: 'Moderate', range: '220 – 390', color: '#d9ef8b' },
                          { name: 'High', range: '390 – 830', color: '#fee08b' },
                          { name: 'Very High', range: '830 – 1,500', color: '#fdae61' },
                          { name: 'Severe', range: '1,500 – 3,000', color: '#f46d43' },
                          { name: 'Extreme Hotspot', range: '> 3,000', color: '#d73027' },
                        ])
                      : (() => {
                          const regShades = getRegionalShades(gas);
                          return [
                            { name: 'Very Low', range: '< 1,493', color: regShades[0] },
                            { name: 'Low', range: '1,493 – 2,985', color: regShades[1] },
                            { name: 'Moderate', range: '2,985 – 4,478', color: regShades[2] },
                            { name: 'High', range: '4,478 – 7,463', color: regShades[3] },
                            { name: 'Extreme Hotspot', range: '> 7,463', color: regShades[4] },
                          ];
                        })();

                    return tiers.map((tier, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-sm flex-shrink-0 shadow-sm border border-black/5" style={{ backgroundColor: tier.color }} />
                        <span className="text-[11px] text-gray-700 font-medium">
                          {tier.name && <span className="font-semibold text-gray-800 mr-1">{tier.name}:</span>}
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
