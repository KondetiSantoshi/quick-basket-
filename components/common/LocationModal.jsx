'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Search,
  Check,
  Building2,
  Loader2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import GeoMap from './GeoMap';

const LocationModal = () => {
  const {
    isModalOpen,
    setIsModalOpen,
    selectedLocation,
    selectLocation,
    popularLocations,
    detectCurrentLocation,
    resolveCoordinates,
    searchLocations,
    isDetecting,
    geoError,
    setGeoError
  } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingGeo, setIsSearchingGeo] = useState(false);

  // Working preview location inside modal while dragging/clicking map
  const [draftLocation, setDraftLocation] = useState(selectedLocation);
  const [resolvingPin, setResolvingPin] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setDraftLocation(selectedLocation);
      setGeoError('');
    }
  }, [isModalOpen, selectedLocation, setGeoError]);

  // Debounced real location search via /api/location/search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearchingGeo(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingGeo(true);
      try {
        const results = await searchLocations(trimmed);
        setSearchResults(results);
      } catch (err) {
        console.error('Location search failed', err);
      } finally {
        setIsSearchingGeo(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [searchQuery, searchLocations]);

  if (!isModalOpen) return null;

  const handleUseCurrentGps = async () => {
    const res = await detectCurrentLocation({ closeOnSuccess: false });
    if (res.success && res.location) {
      setDraftLocation(res.location);
    }
  };

  const handleMapSelectCoords = async (lat, lng) => {
    setResolvingPin(true);
    setGeoError('');
    setDraftLocation((prev) => ({ ...prev, lat, lng }));
    const resolved = await resolveCoordinates(lat, lng);
    setDraftLocation(resolved);
    setResolvingPin(false);
  };

  const handleChooseFromList = (loc) => {
    setDraftLocation(loc);
    setSearchQuery('');
    setSearchResults([]);
  };

  const displayedList =
    searchQuery.trim().length >= 2 ? searchResults : popularLocations;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0c831f] flex items-center justify-center">
              <MapPin className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Choose Delivery Location</h3>
              <p className="text-xs text-slate-500">
                Detect GPS, search any address/pincode, or drag map pin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* GPS Error Notice */}
          {geoError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{geoError}</span>
            </div>
          )}

          {/* Detect Current GPS Button */}
          <button
            type="button"
            onClick={handleUseCurrentGps}
            disabled={isDetecting}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 active:scale-99 transition disabled:opacity-70"
          >
            <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>
              {isDetecting ? 'Detecting GPS & resolving address...' : 'Use Current GPS Location'}
            </span>
          </button>

          {/* Real Geocoding Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search street, area, city or pincode (e.g. Indiranagar, 560034)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#0c831f] focus:bg-white outline-none transition"
            />
            {isSearchingGeo && (
              <Loader2 className="w-4 h-4 text-[#0c831f] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Real Interactive Leaflet Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700">
                Click or drag pin on map to adjust exact drop point
              </span>
              <span className="font-mono text-slate-400">
                {Number(draftLocation?.lat || 12.9352).toFixed(4)},{' '}
                {Number(draftLocation?.lng || 77.6245).toFixed(4)}
              </span>
            </div>

            <GeoMap
              mode="picker"
              lat={draftLocation?.lat || 12.9352}
              lng={draftLocation?.lng || 77.6245}
              hubLat={draftLocation?.nearestHub?.lat}
              hubLng={draftLocation?.nearestHub?.lng}
              hubName={draftLocation?.nearestHub?.name || 'Nearest QuickBasket Hub'}
              height="205px"
              onSelectCoords={handleMapSelectCoords}
            />

            {/* Selected Draft Summary Card */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-[#0c831f] flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-[#0c831f]" />
                    {draftLocation?.estimate || '10 MINS'}
                  </span>
                  {draftLocation?.distanceKm !== undefined && (
                    <span className="text-[10px] text-slate-500 font-semibold">
                      • {draftLocation.distanceKm} km from hub
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                  {resolvingPin ? 'Resolving exact address...' : (draftLocation?.area || 'Selected Location')}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {draftLocation?.city}, {draftLocation?.state} - {draftLocation?.pincode}
                </p>
              </div>
              <button
                type="button"
                disabled={resolvingPin}
                onClick={() => selectLocation(draftLocation, true)}
                className="shrink-0 px-4 py-2 bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>

          {/* Search Results or Popular Hubs */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {searchQuery.trim().length >= 2
                ? `Matching Locations (${displayedList.length})`
                : 'Quick Delivery Hubs'}
            </p>
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
              {displayedList.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No matching location found. Try searching city name or drop a pin directly on the map.
                </p>
              ) : (
                displayedList.map((loc, idx) => {
                  const isSelected =
                    draftLocation?.area === loc.area &&
                    Math.abs((draftLocation?.lat || 0) - (loc.lat || 0)) < 0.01;
                  return (
                    <button
                      type="button"
                      key={loc.id || idx}
                      onClick={() => handleChooseFromList(loc)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'border-[#0c831f] bg-emerald-50/60 text-[#0c831f]'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#0c831f] text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">{loc.area}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {loc.city}, {loc.state} - {loc.pincode}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                          ⚡ {loc.estimate || '10 MINS'}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#0c831f]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
