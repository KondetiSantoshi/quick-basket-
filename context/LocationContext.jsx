'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const LocationContext = createContext();

export const POPULAR_LOCATIONS = [
  {
    city: 'Bangalore',
    area: 'Koramangala 4th Block',
    state: 'Karnataka',
    pincode: '560034',
    estimate: '8 MINS',
    lat: 12.9352,
    lng: 77.6245
  },
  {
    city: 'Bangalore',
    area: 'Indiranagar 100ft Road',
    state: 'Karnataka',
    pincode: '560038',
    estimate: '9 MINS',
    lat: 12.9716,
    lng: 77.6412
  },
  {
    city: 'Bangalore',
    area: 'HSR Layout Sector 1',
    state: 'Karnataka',
    pincode: '560102',
    estimate: '10 MINS',
    lat: 12.9121,
    lng: 77.6446
  },
  {
    city: 'Mumbai',
    area: 'Bandra West, Linking Road',
    state: 'Maharashtra',
    pincode: '400050',
    estimate: '11 MINS',
    lat: 19.0596,
    lng: 72.8295
  },
  {
    city: 'Delhi NCR',
    area: 'DLF Cyber City, Phase 2, Gurgaon',
    state: 'Haryana',
    pincode: '122002',
    estimate: '9 MINS',
    lat: 28.4908,
    lng: 77.0899
  },
  {
    city: 'Hyderabad',
    area: 'Hitec City, Madhapur',
    state: 'Telangana',
    pincode: '500081',
    estimate: '10 MINS',
    lat: 17.4474,
    lng: 78.3762
  }
];

export const LocationProvider = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState(POPULAR_LOCATIONS[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Safe client-side storage hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem('qb_location');
      if (saved) setSelectedLocation(JSON.parse(saved));
    } catch (e) {
      console.error('Location hydration error', e);
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem('qb_location', JSON.stringify(selectedLocation));
  }, [selectedLocation, initialized]);

  const selectLocation = (loc, shouldCloseModal = true) => {
    setGeoError('');
    setSelectedLocation(loc);
    if (shouldCloseModal) {
      setIsModalOpen(false);
    }
  };

  // Resolve arbitrary lat/lng coordinates via backend Nominatim + Dark Store distance engine
  const resolveCoordinates = async (lat, lng) => {
    try {
      const { data } = await api.get(`/location/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
      return data;
    } catch {
      return {
        area: `Pinned (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
        street: `Pinned (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`,
        landmark: '',
        city: selectedLocation.city || 'Bangalore',
        state: selectedLocation.state || 'Karnataka',
        pincode: selectedLocation.pincode || '560034',
        lat: Number(lat),
        lng: Number(lng),
        estimate: '10 MINS',
        source: 'local-fallback'
      };
    }
  };

  // Real browser GPS geolocation + reverse geocoding
  const detectCurrentLocation = ({ closeOnSuccess = true } = {}) => {
    setGeoError('');

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      const msg = 'Geolocation is not supported by your browser. Search your area or drop a pin on the map.';
      setGeoError(msg);
      return Promise.resolve({ success: false, message: msg });
    }

    setIsDetecting(true);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 0);

          const resolved = await resolveCoordinates(lat, lng);
          const finalLocation = {
            ...resolved,
            accuracy
          };
          setIsDetecting(false);
          setSelectedLocation(finalLocation);
          if (closeOnSuccess) {
            setIsModalOpen(false);
          }
          resolve({ success: true, location: finalLocation });
        },
        (error) => {
          setIsDetecting(false);
          let msg = 'Could not detect GPS location.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission denied. Please allow location access in your browser or search/drop a pin below.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'Location signal unavailable. Please search your area or click a pin on the map.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'GPS request timed out. You can search any area or pin directly on the map.';
          }
          setGeoError(msg);
          resolve({ success: false, message: msg });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  };

  const searchLocations = async (query) => {
    const { data } = await api.get(`/location/search?q=${encodeURIComponent(query)}`);
    return data || [];
  };

  return (
    <LocationContext.Provider
      value={{
        selectedLocation,
        setSelectedLocation,
        isModalOpen,
        setIsModalOpen,
        isDetecting,
        geoError,
        setGeoError,
        detectCurrentLocation,
        resolveCoordinates,
        searchLocations,
        selectLocation,
        popularLocations: POPULAR_LOCATIONS
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
