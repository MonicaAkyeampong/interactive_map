'use client';

import { useState, useEffect, useCallback } from 'react';
import MapboxMap, { Source, Layer, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useStore } from '@/store/useStore';
import { Play, Pause } from 'lucide-react';

// Mapbox Token (Provide your token in .env.local as NEXT_PUBLIC_MAPBOX_TOKEN)
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const GAS_COLORS: Record<string, string> = {
  CO2: '#3b82f6', // blue
  N2O: '#a855f7', // purple
  CH4: '#f97316', // orange
  SF6: '#eab308', // yellow
  CFC: '#06b6d4', // cyan
  PFC: '#f43f5e', // rose
  HFC: '#84cc16'  // lime
};

export default function Map() {
  const { year, gas, sector, activeTimelineIndex, isPlaying, setActiveTimelineIndex, setIsPlaying, mapMode, setMapMode, forecastMode, setForecastMode } = useStore();
  const [geoData, setGeoData] = useState<any>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [hoverInfo, setHoverInfo] = useState<{feature: any, longitude: number, latitude: number} | null>(null);
  
  const intervals = ["24hrs", "48hrs", "72hrs", "1 week", "1 month"];
  
  const [viewState, setViewState] = useState({
    longitude: -1.0232, // Center of Ghana
    latitude: 7.9465,
    zoom: 5.5
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isPlaying) {
      intervalId = setInterval(() => {
        setActiveTimelineIndex((activeTimelineIndex + 1) % intervals.length);
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, setActiveTimelineIndex, intervals.length, activeTimelineIndex]);

  useEffect(() => {
    fetch('/ghana.geojson')
      .then(res => res.json())
      .then(data => {
        // Inject dummy data for demonstration purposes
        const gases = Object.keys(GAS_COLORS);
        
        data.features.forEach((f: any) => {
          let maxVal = -1;
          let domGas = gases[0];
          
          gases.forEach((g) => {
            const val = Math.floor(Math.random() * 100);
            f.properties[g] = val;
            if (val > maxVal) {
              maxVal = val;
              domGas = g;
            }
          });
          f.properties.dominant_gas = domGas;
        });
        setGeoData(data);
      });
  }, []);

  const fillStyle: any = {
    id: 'regions-fill',
    type: 'fill',
    paint: {
      'fill-color': mapMode === 'DominantGas'
        ? [
            'match',
            ['get', 'dominant_gas'],
            'CO2', GAS_COLORS.CO2,
            'N2O', GAS_COLORS.N2O,
            'CH4', GAS_COLORS.CH4,
            'SF6', GAS_COLORS.SF6,
            'CFC', GAS_COLORS.CFC,
            'PFC', GAS_COLORS.PFC,
            'HFC', GAS_COLORS.HFC,
            '#cccccc'
          ]
        : [
            'interpolate',
            ['linear'],
            ['get', gas || 'CO2'], // Proxy if All Gases is selected
            0, '#fef08a',
            50, '#f97316',
            100, '#991b1b'
          ],
      'fill-opacity': 0.7
    }
  };

  const onHover = useCallback((event: any) => {
    const { features, lngLat } = event;
    const hoveredFeature = features && features[0];

    if (hoveredFeature) {
      setHoverInfo({
        feature: hoveredFeature,
        longitude: lngLat.lng,
        latitude: lngLat.lat
      });
    } else {
      setHoverInfo(null);
    }
  }, []);

  return (
    <div className="absolute inset-0 bg-transparent">
      {!MAPBOX_TOKEN ? (
        <div className="flex items-center justify-center h-full w-full flex-col text-gray-900 z-50 absolute inset-0 bg-white/90 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-2 text-green-700">Mapbox Token Required</h2>
          <p className="text-gray-600 max-w-md text-center">
            Please add your Mapbox API token to <code>.env.local</code> as <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to view the map.
          </p>
        </div>
      ) : null}
      <MapboxMap
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onMouseMove={onHover}
        onMouseLeave={() => setHoverInfo(null)}
        interactiveLayerIds={['regions-fill']}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        {geoData && (
          <Source id="ghana-regions" type="geojson" data={geoData}>
            <Layer {...fillStyle} />
            <Layer 
              id="regions-line"
              type="line"
              paint={{
                'line-color': '#000',
                'line-opacity': 0.3,
                'line-width': 1
              }}
            />
          </Source>
        )}
        
        {hoverInfo && hoverInfo.feature && (
          <Popup
            longitude={hoverInfo.longitude}
            latitude={hoverInfo.latitude}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={15}
            className="z-50"
          >
            <div className="p-1 min-w-[120px]">
              <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-1 mb-1 text-sm">
                {hoverInfo.feature.properties.REGION || hoverInfo.feature.properties.name || 'Region'}
              </h3>
              <div className="text-xs space-y-1 mt-2">
                <p className="flex justify-between"><span className="text-gray-500">Dominant:</span> <span className="font-semibold text-gray-700">{hoverInfo.feature.properties.dominant_gas}</span></p>
                <p className="flex justify-between"><span className="text-gray-500">Emission:</span> <span className="font-semibold text-gray-700">{hoverInfo.feature.properties[hoverInfo.feature.properties.dominant_gas] || hoverInfo.feature.properties.CO2} kt</span></p>
              </div>
            </div>
          </Popup>
        )}
      </MapboxMap>
      
      {/* Zoom Controls (Bottom Right) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        <button 
          className="bg-white text-black p-2 rounded shadow hover:bg-gray-100"
          onClick={() => setViewState(prev => ({ ...prev, zoom: prev.zoom + 1 }))}
        >
          +
        </button>
        <button 
          className="bg-white text-black p-2 rounded shadow hover:bg-gray-100"
          onClick={() => setViewState(prev => ({ ...prev, zoom: prev.zoom - 1 }))}
        >
          -
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 right-4 z-10 bg-white rounded shadow-lg flex flex-col min-w-[220px] overflow-hidden text-sm">
        <div 
          className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 border-b border-gray-100"
          onClick={() => setIsLegendOpen(!isLegendOpen)}
        >
          <span className="font-semibold text-gray-800">Map Legend</span>
          <span className="text-gray-500 text-xs ml-2">
            {isLegendOpen ? '▼' : '▲'}
          </span>
        </div>
        
        {isLegendOpen && (
          <div className="bg-gray-50/50">
            <div className="px-4 py-2 border-b border-gray-100 flex gap-2">
              <button 
                onClick={() => setMapMode('Intensity')}
                className={`flex-1 py-1 text-xs rounded-md font-medium transition-colors ${mapMode === 'Intensity' ? 'bg-green-100 text-green-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                Intensity
              </button>
              <button 
                onClick={() => setMapMode('DominantGas')}
                className={`flex-1 py-1 text-xs rounded-md font-medium transition-colors ${mapMode === 'DominantGas' ? 'bg-green-100 text-green-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                Dominant Gas
              </button>
            </div>
            <div className="px-4 py-3">
              {mapMode === 'DominantGas' ? (
                <div className="space-y-2">
                  {Object.entries(GAS_COLORS).map(([g, color]) => (
                    <div key={g} className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-sm shadow-sm" style={{ backgroundColor: color }}></div>
                      <span className="text-gray-600 font-medium">{g}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col space-y-1 mt-1">
                  <div className="text-xs font-medium text-gray-600 mb-2">{gas ? `${gas} Emission Level` : 'Total Emission Level'}</div>
                  <div className="h-3 w-full rounded bg-gradient-to-r from-[#fef08a] via-[#f97316] to-[#991b1b]"></div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Timeline */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-auto max-w-3xl z-10 flex items-center bg-white/95 backdrop-blur-md px-3 py-2 rounded-full shadow-lg border border-white/20">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="mr-3 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-md flex-shrink-0"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
        </button>

        {/* Forecast Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-full p-1 mr-4 flex-shrink-0">
          <button 
            onClick={() => setForecastMode('Future Forecasts')}
            className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded-full transition-colors ${forecastMode === 'Future Forecasts' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            FUTURE
          </button>
          <button 
            onClick={() => setForecastMode('Past Forecasts')}
            className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded-full transition-colors ${forecastMode === 'Past Forecasts' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            PAST
          </button>
        </div>

        <div className="flex items-center flex-1 text-xs font-medium">
          {intervals.map((interval, idx) => (
            <div key={interval} className="flex items-center last:flex-none">
              <button 
                onClick={() => {
                  setActiveTimelineIndex(idx);
                  setIsPlaying(false);
                }}
                className={`flex-shrink-0 px-3 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${idx === activeTimelineIndex ? 'bg-green-500 text-white shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
              >
                {interval}
              </button>
              {idx < intervals.length - 1 && (
                <div className="w-4 h-px bg-gray-300 mx-1"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
