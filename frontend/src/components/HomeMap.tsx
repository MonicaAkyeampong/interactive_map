'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import MapboxMap, { MapRef } from 'react-map-gl/mapbox';
import { motion } from 'framer-motion';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const fillLayer: any = {
  id: 'home-regions-fill',
  type: 'fill',
  paint: {
    'fill-color': [
      'interpolate', ['linear'],
      ['get', 'id'],
      0, '#bbf0d8',
      5, '#71dfb3',
      10, '#1DB978',
      15, '#0f7a4e'
    ],
    'fill-opacity': 0.55
  }
};

const lineLayerCasing: any = {
  id: 'home-regions-line-casing',
  type: 'line',
  paint: {
    'line-color': '#ffffff',
    'line-opacity': 0.7,
    'line-width': 2.0
  }
};

const lineLayer: any = {
  id: 'home-regions-line',
  type: 'line',
  paint: {
    'line-color': '#1e293b',
    'line-opacity': 0.85,
    'line-width': 1.0
  }
};

export default function HomeMap() {
  const mapRef = useRef<MapRef>(null);
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch('/ghana.geojson')
      .then(r => r.json())
      .then(setGeoData)
      .catch(() => {});
  }, []);

  const onMapLoad = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    const style = map.getStyle();
    if (style?.layers) {
      style.layers.forEach(layer => {
        if (
          layer.id.includes('country-label') ||
          layer.id.includes('state-label') ||
          layer.id.includes('settlement-') ||
          layer.id.includes('place-') ||
          layer.id.includes('poi-')
        ) {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || !geoData) return;
    const map = mapRef.current.getMap();
    
    if (map.isStyleLoaded()) {
      if (!map.getSource('ghana-home')) {
        try {
          map.addSource('ghana-home', { type: 'geojson', data: geoData });
          map.addLayer(fillLayer);
          map.addLayer(lineLayerCasing);
          map.addLayer(lineLayer);
        } catch (err) {
          console.warn('Failed to add source/layer:', err);
        }
      } else {
        const source = map.getSource('ghana-home') as any;
        if (source && source.setData) {
          source.setData(geoData);
        }
      }
    }
  }, [geoData]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
      className="absolute top-0 right-0 w-[58%] h-full overflow-hidden z-0"
      style={{
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 12%, rgba(0,0,0,0.7) 25%, black 40%)',
        maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 12%, rgba(0,0,0,0.7) 25%, black 40%)'
      }}
    >
      {/* Bottom fade to match page background */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F8FAFC] to-transparent z-10 pointer-events-none" />

      {!MAPBOX_TOKEN ? (
        <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-brand-50 to-brand-100/60">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-3 border border-brand-200">
              <span className="text-2xl">🗺️</span>
            </div>
            <p className="text-sm font-semibold text-brand-700">Ghana Emissions Map</p>
            <p className="text-xs text-brand-500 mt-1">Add Mapbox token to enable</p>
          </div>
        </div>
      ) : (
        <MapboxMap
          ref={mapRef}
          initialViewState={{
            longitude: -1.0232,
            latitude: 7.9465,
            zoom: 6.5
          }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          interactive={false}
          attributionControl={false}
          maxBounds={[[-9.0, 1.0], [7.0, 15.0]]}
          minZoom={6.2}
          onLoad={onMapLoad}
        />
      )}
    </motion.div>
  );
}
