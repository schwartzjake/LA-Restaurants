import { sanitizeRestaurantRecord, toNumber } from '../../lib/restaurantUtils';

const ORS_API_KEY = (process.env.ORS_API_KEY || process.env.NEXT_PUBLIC_ORS_API_KEY || '').trim();
const MATRIX_URL = 'https://api.openrouteservice.org/v2/matrix/driving-car';
const GEOCODE_URL = 'https://nominatim.openstreetmap.org/search';
const CHUNK_SIZE = 40;
const PAUSE_MS = 800;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ORS_API_KEY) {
    return res.status(500).json({ error: 'Drive-time service is not configured' });
  }

  const { address, restaurants } = req.body || {};

  if (typeof address !== 'string' || !address.trim()) {
    return res.status(400).json({ error: 'Address is required' });
  }

  if (!Array.isArray(restaurants) || restaurants.length === 0) {
    return res.status(400).json({ error: 'At least one restaurant is required' });
  }

  const sanitized = restaurants
    .map((entry) => sanitizeRestaurantRecord(entry))
    .map((r) => {
      if (!r || !r.id) return null;
      if (!Number.isFinite(r.latitude) || !Number.isFinite(r.longitude)) return null;
      return { id: r.id, latitude: r.latitude, longitude: r.longitude };
    })
    .filter(Boolean);

  if (!sanitized.length) {
    return res.status(400).json({ error: 'No valid restaurant coordinates supplied' });
  }

  try {
    const geocodeUrl = `${GEOCODE_URL}?format=json&limit=1&q=${encodeURIComponent(address.trim())}`;
    const geoRes = await fetch(geocodeUrl, {
      headers: { 'User-Agent': 'la-restaurants/1.0 (contact@example.com)', Accept: 'application/json' },
    });

    if (!geoRes.ok) {
      const message = `Geocoding failed (${geoRes.status})`;
      return res.status(geoRes.status).json({ error: message });
    }

    const geocodeData = await geoRes.json();
    const match = Array.isArray(geocodeData) ? geocodeData[0] : null;
    const originLat = toNumber(match?.lat);
    const originLng = toNumber(match?.lon);

    if (!Number.isFinite(originLat) || !Number.isFinite(originLng)) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const durations = {};

    for (let i = 0; i < sanitized.length; i += CHUNK_SIZE) {
      const slice = sanitized.slice(i, i + CHUNK_SIZE);
      const body = JSON.stringify({
        locations: [[originLng, originLat], ...slice.map((r) => [r.longitude, r.latitude])],
        metrics: ['duration'],
        units: 'm',
      });

      const matrixRes = await fetch(MATRIX_URL, {
        method: 'POST',
        headers: {
          Authorization: ORS_API_KEY,
          'Content-Type': 'application/json',
        },
        body,
      });

      const matrixJson = await matrixRes.json().catch(() => ({}));
      const errorMessage = matrixJson?.error?.message || matrixJson?.message;

      if (!matrixRes.ok || errorMessage) {
        const status = matrixRes.status || 502;
        const message = errorMessage || `OpenRouteService error (${status})`;
        return res.status(status).json({ error: message });
      }

      const row = Array.isArray(matrixJson?.durations?.[0]) ? matrixJson.durations[0].slice(1) : [];
      row.forEach((value, idx) => {
        const secs = toNumber(value);
        if (Number.isFinite(secs)) {
          durations[slice[idx].id] = secs;
        }
      });

      if (i + CHUNK_SIZE < sanitized.length) {
        await sleep(PAUSE_MS);
      }
    }

    return res.status(200).json({
      origin: { lat: originLat, lng: originLng },
      durations,
    });
  } catch (err) {
    console.error('Drive-time API error:', err);
    return res.status(500).json({ error: 'Failed to calculate drive times' });
  }
}
