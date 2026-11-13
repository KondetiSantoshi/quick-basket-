export const DELIVERY_HUBS = [
  {
    id: 'hub-blr-koramangala',
    name: 'QuickBasket Koramangala Hub',
    city: 'Bangalore',
    area: 'Koramangala 4th Block',
    state: 'Karnataka',
    pincode: '560034',
    estimate: '8 MINS',
    activeRiders: 16,
    lat: 12.9352,
    lng: 77.6245
  },
  {
    id: 'hub-blr-indiranagar',
    name: 'QuickBasket Indiranagar Hub',
    city: 'Bangalore',
    area: 'Indiranagar 100ft Road',
    state: 'Karnataka',
    pincode: '560038',
    estimate: '9 MINS',
    activeRiders: 14,
    lat: 12.9716,
    lng: 77.6412
  },
  {
    id: 'hub-blr-hsr',
    name: 'QuickBasket HSR Sector 1 Hub',
    city: 'Bangalore',
    area: 'HSR Layout Sector 1',
    state: 'Karnataka',
    pincode: '560102',
    estimate: '10 MINS',
    activeRiders: 12,
    lat: 12.9121,
    lng: 77.6446
  },
  {
    id: 'hub-blr-whitefield',
    name: 'QuickBasket Whitefield Hub',
    city: 'Bangalore',
    area: 'ITPL Main Road, Whitefield',
    state: 'Karnataka',
    pincode: '560066',
    estimate: '10 MINS',
    activeRiders: 11,
    lat: 12.9698,
    lng: 77.7500
  },
  {
    id: 'hub-mum-bandra',
    name: 'QuickBasket Bandra West Hub',
    city: 'Mumbai',
    area: 'Bandra West, Linking Road',
    state: 'Maharashtra',
    pincode: '400050',
    estimate: '11 MINS',
    activeRiders: 18,
    lat: 19.0596,
    lng: 72.8295
  },
  {
    id: 'hub-del-ggn',
    name: 'QuickBasket Cyber City Hub',
    city: 'Delhi NCR',
    area: 'DLF Cyber City, Phase 2, Gurgaon',
    state: 'Haryana',
    pincode: '122002',
    estimate: '9 MINS',
    activeRiders: 15,
    lat: 28.4908,
    lng: 77.0899
  },
  {
    id: 'hub-hyd-hitec',
    name: 'QuickBasket Hitec City Hub',
    city: 'Hyderabad',
    area: 'Hitec City, Madhapur',
    state: 'Telangana',
    pincode: '500081',
    estimate: '10 MINS',
    activeRiders: 13,
    lat: 17.4474,
    lng: 78.3762
  },
  {
    id: 'hub-pun-kp',
    name: 'QuickBasket Koregaon Park Hub',
    city: 'Pune',
    area: 'Koregaon Park, Lane 7',
    state: 'Maharashtra',
    pincode: '411001',
    estimate: '10 MINS',
    activeRiders: 10,
    lat: 18.5362,
    lng: 73.8940
  },
  {
    id: 'hub-chn-tnagar',
    name: 'QuickBasket T. Nagar Hub',
    city: 'Chennai',
    area: 'T. Nagar, Usman Road',
    state: 'Tamil Nadu',
    pincode: '600017',
    estimate: '11 MINS',
    activeRiders: 11,
    lat: 13.0418,
    lng: 80.2341
  }
];

export const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

export const findNearestHub = (lat, lng) => {
  let nearest = DELIVERY_HUBS[0];
  let minDistance = Infinity;

  for (const hub of DELIVERY_HUBS) {
    const dist = calculateDistanceKm(lat, lng, hub.lat, hub.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = hub;
    }
  }

  let estimate = '10 MINS';
  if (minDistance <= 2.5) estimate = '8 MINS';
  else if (minDistance <= 6) estimate = '12 MINS';
  else if (minDistance <= 15) estimate = '18 MINS';
  else estimate = '15-25 MINS';

  return {
    hub: nearest,
    distanceKm: minDistance,
    estimate,
    isExpressEligible: minDistance <= 10
  };
};

// @desc Get all dark store delivery hubs
// @route GET /api/location/hubs
export const getDeliveryHubs = (req, res) => {
  res.json(DELIVERY_HUBS);
};

// @desc Reverse geocode GPS lat/lng to structured address & nearest store ETA
// @route GET /api/location/reverse?lat=...&lng=...
export const reverseGeocodeLocation = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ message: 'Valid lat and lng coordinates are required.' });
    }

    const nearestInfo = findNearestHub(lat, lng);

    let area = '';
    let street = '';
    let landmark = '';
    let city = nearestInfo.hub.city;
    let state = nearestInfo.hub.state;
    let pincode = nearestInfo.hub.pincode;
    let formattedAddress = '';
    let source = 'gps-fallback';

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'QuickBasket-Delivery-App/1.1 (support@quickbasket.com)',
          Accept: 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (response.ok) {
        const data = await response.json();
        const addr = data?.address || {};
        const areaPart =
          addr.neighbourhood ||
          addr.suburb ||
          addr.residential ||
          addr.quarter ||
          addr.city_district ||
          addr.road ||
          addr.village ||
          addr.town;
        const cityPart =
          addr.city ||
          addr.town ||
          addr.municipality ||
          addr.village ||
          addr.state_district ||
          addr.county;

        street = [addr.house_number, addr.road, addr.neighbourhood || addr.suburb]
          .filter(Boolean)
          .join(', ');
        area = areaPart || cityPart || `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        city = cityPart || nearestInfo.hub.city;
        state = addr.state || nearestInfo.hub.state;
        pincode = addr.postcode || nearestInfo.hub.pincode;
        landmark = addr.amenity || addr.shop || addr.building || addr.suburb || '';
        formattedAddress = data?.display_name || [street || area, city, state, pincode].filter(Boolean).join(', ');
        source = 'nominatim';
      }
    } catch (geoErr) {
      console.warn('Nominatim reverse geocode fallback:', geoErr.message);
    }

    if (!area) {
      area = `Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      street = area;
      formattedAddress = `${area}, near ${nearestInfo.hub.city}`;
    }

    res.json({
      area,
      street: street || area,
      landmark,
      city,
      state,
      pincode,
      formattedAddress,
      lat,
      lng,
      estimate: nearestInfo.estimate,
      distanceKm: nearestInfo.distanceKm,
      isExpressEligible: nearestInfo.isExpressEligible,
      nearestHub: nearestInfo.hub,
      source
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ message: 'Failed to resolve coordinates' });
  }
};

// @desc Search real places, neighborhoods, landmarks & pincodes with coordinates
// @route GET /api/location/search?q=...
export const searchLocations = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) {
      return res.json(DELIVERY_HUBS);
    }

    const qLower = q.toLowerCase();
    const matchedHubs = DELIVERY_HUBS.filter(
      (h) =>
        h.area.toLowerCase().includes(qLower) ||
        h.city.toLowerCase().includes(qLower) ||
        h.state.toLowerCase().includes(qLower) ||
        h.pincode.includes(q)
    ).map((h) => ({
      ...h,
      street: h.area,
      formattedAddress: `${h.area}, ${h.city}, ${h.state} - ${h.pincode}`,
      nearestHub: h,
      distanceKm: 0.4,
      isExpressEligible: true,
      source: 'hub'
    }));

    let geoResults = [];
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&addressdetails=1&limit=6&countrycodes=in`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'QuickBasket-Delivery-App/1.1 (support@quickbasket.com)',
          Accept: 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (response.ok) {
        const places = await response.json();
        geoResults = (places || []).map((place) => {
          const lat = Number(place.lat);
          const lng = Number(place.lon);
          const addr = place.address || {};
          const nearestInfo = findNearestHub(lat, lng);

          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.state_district ||
            addr.county ||
            nearestInfo.hub.city;
          const area =
            place.name ||
            addr.neighbourhood ||
            addr.suburb ||
            addr.road ||
            city;
          const state = addr.state || nearestInfo.hub.state;
          const pincode = addr.postcode || nearestInfo.hub.pincode;

          return {
            id: `osm-${place.place_id}`,
            area,
            street: [addr.road, addr.neighbourhood || addr.suburb].filter(Boolean).join(', ') || area,
            city,
            state,
            pincode,
            formattedAddress: place.display_name,
            lat,
            lng,
            estimate: nearestInfo.estimate,
            distanceKm: nearestInfo.distanceKm,
            isExpressEligible: nearestInfo.isExpressEligible,
            nearestHub: nearestInfo.hub,
            source: 'nominatim'
          };
        });
      }
    } catch (searchErr) {
      console.warn('Nominatim location search fallback:', searchErr.message);
    }

    // Merge matching hubs first, then OSM results
    const combined = [...matchedHubs, ...geoResults].slice(0, 8);
    res.json(combined);
  } catch (error) {
    console.error('Search locations error:', error);
    res.status(500).json({ message: 'Failed to search locations' });
  }
};
