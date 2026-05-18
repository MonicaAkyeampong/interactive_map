'use client';

import { useState, useEffect } from 'react';
import MapboxMap, { Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useStore } from '@/store/useStore';

// Mapbox Token (Provide your token in .env.local as NEXT_PUBLIC_MAPBOX_TOKEN)
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const GAS_COLORS: Record<string, string> = {
  CO2: '#5C0000', // green-900
  N2O: '#8B0000', // green-800
  CH4: '#B22222', // green-700
  SF6: '#D32F2F', // green-600
  CFC: '#E57373', // green-500
  PFC: '#F28B82', // green-400
  HFC: '#FFCDD2'  // green-300
};

export default function Map() {
  const { year, gas, sector } = useStore();
  const [geoData, setGeoData] = useState<any>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  
  const [viewState, setViewState] = useState({
    longitude: -1.0232, // Center of Ghana
    latitude: 7.9465,
    zoom: 5.5
  });

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
      'fill-color': !gas 
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
            '#ccc'
          ]
        : [
            'interpolate',
            ['linear'],
            ['get', gas],
            0, '#FFCDD2',
            50, '#D32F2F',
            100, '#5C0000'
          ],
      'fill-opacity': 0.7
    }
  };

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
      </MapboxMap>
      
      {/* Zoom Controls (Bottom Right) */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-2 z-10">
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
      <div className="absolute bottom-6 right-4 z-10 bg-white rounded shadow-lg flex flex-col min-w-[200px] overflow-hidden text-sm">
        <div 
          className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 border-b border-gray-100"
          onClick={() => setIsLegendOpen(!isLegendOpen)}
        >
          <span className="font-semibold text-gray-800">
            {!gas ? "Dominant GHG Hotspots" : `${gas} Intensity`}
          </span>
          <span className="text-gray-500 text-xs ml-2">
            {isLegendOpen ? '▼' : '▲'}
          </span>
        </div>
        
        {isLegendOpen && (
          <div className="px-4 py-3 bg-gray-50/50">
            {!gas ? (
              <div className="space-y-2">
                {Object.entries(GAS_COLORS).map(([g, color]) => (
                  <div key={g} className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-sm shadow-sm" style={{ backgroundColor: color }}></div>
                    <span className="text-gray-600">{g}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col space-y-1 mt-1">
                <div className="h-3 w-full rounded bg-gradient-to-r from-[#dcfce7] via-[#22c55e] to-[#14532d]"></div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Timeline Placeholder */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[600px] z-10">
        <div className="flex items-center space-x-2 text-xs text-gray-800 font-medium">
          <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">Mar</div>
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center shadow-sm">Apr</div>
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center shadow-sm">May</div>
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center shadow-sm">Jun</div>
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center shadow-sm">Jul</div>
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center shadow-sm">Aug</div>
        </div>
      </div>
    </div>
  );
}
