import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createPinIcon = (bgColor, labelHtml, size = 34) =>
  L.divIcon({
    className: 'qb-custom-pin',
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${bgColor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.3);">${labelHtml}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });

const GeoMap = ({
  mode = 'picker', // 'picker' | 'tracker'
  lat = 12.9352,
  lng = 77.6245,
  hubLat = null,
  hubLng = null,
  hubName = 'QuickBasket Micro Dark-Store',
  progressRatio = 0.45,
  height = '220px',
  onSelectCoords = null
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({});
  const callbackRef = useRef(onSelectCoords);

  callbackRef.current = onSelectCoords;

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: mode === 'tracker' ? 14 : 15,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;

    if (mode === 'picker') {
      map.on('click', (e) => {
        if (callbackRef.current) {
          callbackRef.current(e.latlng.lat, e.latlng.lng);
        }
      });
    }

    // Ensure proper size calculation inside modals/drawers
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 180);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      layersRef.current = {};
    };
  }, [mode]);

  // Update markers & overlays cleanly when coordinates or progress change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous markers/circles/polylines
    Object.values(layersRef.current).forEach((layer) => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    layersRef.current = {};

    const validLat = Number.isFinite(Number(lat)) ? Number(lat) : 12.9352;
    const validLng = Number.isFinite(Number(lng)) ? Number(lng) : 77.6245;

    if (mode === 'picker') {
      const circle = L.circle([validLat, validLng], {
        radius: 650,
        color: '#0c831f',
        fillColor: '#22c55e',
        fillOpacity: 0.14,
        weight: 1.5
      }).addTo(map);

      const userPin = L.marker([validLat, validLng], {
        draggable: true,
        icon: createPinIcon('#0c831f', '📍', 34)
      }).addTo(map);

      userPin.on('dragend', () => {
        const pos = userPin.getLatLng();
        if (callbackRef.current) {
          callbackRef.current(pos.lat, pos.lng);
        }
      });

      layersRef.current.circle = circle;
      layersRef.current.userPin = userPin;

      if (Number.isFinite(Number(hubLat)) && Number.isFinite(Number(hubLng))) {
        const hubMarker = L.marker([Number(hubLat), Number(hubLng)], {
          icon: createPinIcon('#0f172a', '🏪', 30)
        })
          .bindTooltip(hubName, { direction: 'top' })
          .addTo(map);
        layersRef.current.hubMarker = hubMarker;
      }

      map.setView([validLat, validLng], map.getZoom(), { animate: true });
    } else {
      // Tracker mode: route from hub -> delivery pin + animated rider point
      const storeLat = Number.isFinite(Number(hubLat)) ? Number(hubLat) : validLat - 0.012;
      const storeLng = Number.isFinite(Number(hubLng)) ? Number(hubLng) : validLng - 0.012;

      const clampedProgress = Math.max(0, Math.min(1, progressRatio));
      const riderLat = storeLat + (validLat - storeLat) * clampedProgress;
      const riderLng = storeLng + (validLng - storeLng) * clampedProgress;

      const routeLine = L.polyline(
        [
          [storeLat, storeLng],
          [validLat, validLng]
        ],
        {
          color: '#0c831f',
          weight: 4,
          dashArray: '8 6',
          opacity: 0.85
        }
      ).addTo(map);

      const storeMarker = L.marker([storeLat, storeLng], {
        icon: createPinIcon('#0f172a', '🏪', 32)
      })
        .bindTooltip(hubName, { permanent: false, direction: 'top' })
        .addTo(map);

      const homeMarker = L.marker([validLat, validLng], {
        icon: createPinIcon('#e11d48', '🏠', 32)
      })
        .bindTooltip('Delivery Location', { permanent: false, direction: 'top' })
        .addTo(map);

      const riderMarker = L.marker([riderLat, riderLng], {
        icon: createPinIcon('#0c831f', '🛵', 36),
        zIndexOffset: 500
      })
        .bindTooltip('Delivery Partner', { permanent: false, direction: 'top' })
        .addTo(map);

      layersRef.current = { routeLine, storeMarker, homeMarker, riderMarker };

      const bounds = L.latLngBounds([
        [storeLat, storeLng],
        [validLat, validLng]
      ]);
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
    }

    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 80);
  }, [mode, lat, lng, hubLat, hubLng, hubName, progressRatio]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded-2xl overflow-hidden border border-slate-200 relative z-0 bg-slate-100"
    />
  );
};

export default GeoMap;
